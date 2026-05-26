import { createCodCollectOfflineJob } from '../offline/offline.facade';
import { enqueueOfflineQueueItem } from '../../offline/queue.service';
import type { CollectCodPayload } from './cod.types';

export async function enqueueCodCollectOffline(
  payload: CollectCodPayload,
): Promise<void> {
  await enqueueOfflineQueueItem(createCodCollectOfflineJob(payload));
}
