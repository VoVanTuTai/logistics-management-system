import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OfflineQueueItem } from './queue.types';

const OFFLINE_QUEUE_STORAGE_KEY = 'courier-mobile.offline-queue';
const SUPPORTED_ACTION_TYPES: OfflineQueueItem['actionType'][] = [
  'SCAN_PICKUP',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERY_SUCCESS',
  'DELIVERY_FAIL',
];

export interface OfflineQueueStorage {
  readQueue: () => Promise<OfflineQueueItem[]>;
  writeQueue: (items: OfflineQueueItem[]) => Promise<void>;
}

class AsyncStorageOfflineQueueStorage implements OfflineQueueStorage {
  async readQueue(): Promise<OfflineQueueItem[]> {
    const rawValue = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    try {
      const parsedItems = JSON.parse(rawValue) as unknown[];
      return parsedItems
        .map((item) => normalizeQueueItem(item))
        .filter((item): item is OfflineQueueItem => item !== null);
    } catch {
      return [];
    }
  }

  async writeQueue(items: OfflineQueueItem[]): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(items));
  }
}

export const offlineQueueStorage: OfflineQueueStorage =
  new AsyncStorageOfflineQueueStorage();

export async function readOfflineQueueItems(): Promise<OfflineQueueItem[]> {
  return offlineQueueStorage.readQueue();
}

export async function writeOfflineQueueItems(
  items: OfflineQueueItem[],
): Promise<void> {
  await offlineQueueStorage.writeQueue(items);
}

function normalizeQueueItem(rawItem: unknown): OfflineQueueItem | null {
  if (!isObject(rawItem)) {
    return null;
  }

  const actionType = stringValue(rawItem.actionType ?? rawItem.type);
  const id = stringValue(rawItem.id);
  const endpoint = stringValue(rawItem.endpoint);
  const idempotencyKey = stringValue(rawItem.idempotencyKey);

  if (
    !actionType ||
    !isSupportedActionType(actionType) ||
    !id ||
    !endpoint ||
    !idempotencyKey
  ) {
    return null;
  }

  const createdAt = stringValue(rawItem.createdAt) ?? new Date().toISOString();
  const status = normalizeStatus(stringValue(rawItem.status));
  const attemptCount = numberValue(rawItem.attemptCount ?? rawItem.retryCount) ?? 0;
  const lastAttemptAt = stringValue(rawItem.lastAttemptAt);
  const updatedAt = stringValue(rawItem.updatedAt) ?? lastAttemptAt ?? createdAt;

  return {
    id,
    actionType,
    endpoint,
    method: 'POST',
    payload: (rawItem.payload ?? {}) as OfflineQueueItem['payload'],
    idempotencyKey,
    status,
    attemptCount,
    createdAt,
    updatedAt,
    lastAttemptAt,
    lastError: stringValue(rawItem.lastError),
  };
}

function normalizeStatus(rawStatus: string | null): OfflineQueueItem['status'] {
  if (rawStatus === 'PROCESSING') {
    return 'PROCESSING';
  }

  if (rawStatus === 'FAILED') {
    return 'FAILED';
  }

  return 'QUEUED';
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSupportedActionType(
  value: string,
): value is OfflineQueueItem['actionType'] {
  return SUPPORTED_ACTION_TYPES.includes(value as OfflineQueueItem['actionType']);
}
