import {
  readOfflineQueueItems,
  writeOfflineQueueItems,
} from './queue.storage';
import type {
  OfflineQueueItem,
  OfflineQueueSnapshot,
  OfflineQueueStats,
} from './queue.types';

function sortQueueItems(items: OfflineQueueItem[]): OfflineQueueItem[] {
  return [...items].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

function buildQueueStats(items: OfflineQueueItem[]): OfflineQueueStats {
  return items.reduce<OfflineQueueStats>(
    (stats, item) => {
      if (item.status === 'QUEUED') {
        stats.queued += 1;
      } else if (item.status === 'PROCESSING') {
        stats.processing += 1;
      } else if (item.status === 'FAILED') {
        stats.failed += 1;
      }

      stats.total += 1;
      return stats;
    },
    {
      total: 0,
      queued: 0,
      processing: 0,
      failed: 0,
    },
  );
}

export class OfflineQueueRepository {
  async list(): Promise<OfflineQueueItem[]> {
    const items = await readOfflineQueueItems();
    return sortQueueItems(items);
  }

  async getSnapshot(): Promise<OfflineQueueSnapshot> {
    const items = await this.list();
    return {
      items,
      stats: buildQueueStats(items),
    };
  }

  async enqueue(item: OfflineQueueItem): Promise<void> {
    const items = await this.list();
    const existingIndex = items.findIndex(
      (currentItem) =>
        currentItem.actionType === item.actionType &&
        currentItem.idempotencyKey === item.idempotencyKey,
    );

    if (existingIndex === -1) {
      await this.replace([...items, item]);
      return;
    }

    const now = new Date().toISOString();
    const existingItem = items[existingIndex];
    const nextItems = [...items];
    nextItems[existingIndex] = {
      ...existingItem,
      endpoint: item.endpoint,
      method: item.method,
      payload: item.payload,
      status: 'QUEUED',
      lastError: null,
      updatedAt: now,
    };

    await this.replace(nextItems);
  }

  async update(
    itemId: string,
    patch: Partial<OfflineQueueItem>,
  ): Promise<OfflineQueueItem | null> {
    const items = await this.list();
    const targetIndex = items.findIndex((item) => item.id === itemId);
    if (targetIndex === -1) {
      return null;
    }

    const currentItem = items[targetIndex];
    const updatedItem: OfflineQueueItem = {
      ...currentItem,
      ...patch,
      id: currentItem.id,
      actionType: currentItem.actionType,
      idempotencyKey: currentItem.idempotencyKey,
    };

    const nextItems = [...items];
    nextItems[targetIndex] = updatedItem;
    await this.replace(nextItems);

    return updatedItem;
  }

  async remove(itemId: string): Promise<void> {
    const items = await this.list();
    const nextItems = items.filter((item) => item.id !== itemId);
    await this.replace(nextItems);
  }

  async clear(): Promise<void> {
    await this.replace([]);
  }

  private async replace(items: OfflineQueueItem[]): Promise<void> {
    await writeOfflineQueueItems(sortQueueItems(items));
  }
}

export const offlineQueueRepository = new OfflineQueueRepository();
