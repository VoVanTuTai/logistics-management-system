import { useAppStore } from '../store/appStore';
import { offlineQueueRepository } from './queue.repository';
import type {
  OfflineQueueItem,
  OfflineQueuePreviewItem,
  OfflineQueueSnapshot,
} from './queue.types';
import { executeOfflineQueueItem } from './queue.worker';

declare const require: (moduleName: string) => unknown;

interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

interface NetInfoModule {
  addEventListener: (listener: (state: NetInfoState) => void) => () => void;
  fetch: () => Promise<NetInfoState>;
}

interface NetInfoModuleWrapper {
  default?: NetInfoModule;
}

let isFlushingQueue = false;
let stopAutoRetryListener: (() => void) | null = null;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Offline queue retry failed.';
}

function buildPreview(items: OfflineQueueItem[]): OfflineQueuePreviewItem[] {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    actionType: item.actionType,
    status: item.status,
    attemptCount: item.attemptCount,
    lastError: item.lastError,
  }));
}

function isOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

function resolveNetInfoModule(): NetInfoModule | null {
  try {
    const rawModule = require('@react-native-community/netinfo') as
      | NetInfoModule
      | NetInfoModuleWrapper;

    if (
      rawModule &&
      typeof (rawModule as NetInfoModule).addEventListener === 'function' &&
      typeof (rawModule as NetInfoModule).fetch === 'function'
    ) {
      return rawModule as NetInfoModule;
    }

    if (
      rawModule &&
      typeof rawModule === 'object' &&
      typeof (rawModule as NetInfoModuleWrapper).default === 'object'
    ) {
      const defaultExport = (rawModule as NetInfoModuleWrapper).default;
      if (
        defaultExport &&
        typeof defaultExport.addEventListener === 'function' &&
        typeof defaultExport.fetch === 'function'
      ) {
        return defaultExport;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function syncOfflineQueueStore(): Promise<OfflineQueueSnapshot> {
  const snapshot = await offlineQueueRepository.getSnapshot();
  useAppStore.getState().setOfflineQueueState({
    pendingCount: snapshot.stats.total,
    failedCount: snapshot.stats.failed,
    previewItems: buildPreview(snapshot.items),
  });
  return snapshot;
}

export async function hydrateOfflineQueueState(): Promise<OfflineQueueSnapshot> {
  return syncOfflineQueueStore();
}

export async function listOfflineQueueItems(): Promise<OfflineQueueItem[]> {
  const snapshot = await syncOfflineQueueStore();
  return snapshot.items;
}

export async function enqueueOfflineQueueItem(
  item: OfflineQueueItem,
): Promise<void> {
  await offlineQueueRepository.enqueue(item);
  await syncOfflineQueueStore();
}

export async function flushOfflineQueue(
  accessToken: string | null,
): Promise<void> {
  if (!accessToken || isFlushingQueue) {
    return;
  }

  isFlushingQueue = true;
  useAppStore.getState().setOfflineSyncing(true);

  try {
    const snapshot = await offlineQueueRepository.getSnapshot();
    const retryItems = snapshot.items;

    for (const queueItem of retryItems) {
      const now = new Date().toISOString();
      await offlineQueueRepository.update(queueItem.id, {
        status: 'PROCESSING',
        attemptCount: queueItem.attemptCount + 1,
        lastAttemptAt: now,
        updatedAt: now,
        lastError: null,
      });

      await syncOfflineQueueStore();

      try {
        await executeOfflineQueueItem(accessToken, queueItem);
        await offlineQueueRepository.remove(queueItem.id);
      } catch (error) {
        await offlineQueueRepository.update(queueItem.id, {
          status: 'FAILED',
          updatedAt: new Date().toISOString(),
          lastError: toErrorMessage(error),
        });
      }

      await syncOfflineQueueStore();
    }
  } finally {
    useAppStore.getState().setOfflineSyncing(false);
    isFlushingQueue = false;
    await syncOfflineQueueStore();
  }
}

export function startOfflineQueueAutoRetry(
  getAccessToken: () => string | null,
): void {
  if (stopAutoRetryListener) {
    return;
  }

  const netInfoModule = resolveNetInfoModule();
  if (!netInfoModule) {
    // TODO(offline-queue): add explicit network listener dependency when package setup is finalized.
    return;
  }

  stopAutoRetryListener = netInfoModule.addEventListener((state) => {
    if (isOnline(state)) {
      void flushOfflineQueue(getAccessToken());
    }
  });

  void netInfoModule
    .fetch()
    .then((state) => {
      if (isOnline(state)) {
        void flushOfflineQueue(getAccessToken());
      }
    })
    .catch(() => {
      // Ignore network bootstrap error and rely on listener callbacks.
    });
}

export function stopOfflineQueueAutoRetry(): void {
  if (!stopAutoRetryListener) {
    return;
  }

  stopAutoRetryListener();
  stopAutoRetryListener = null;
}
