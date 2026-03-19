import { createDeliveryFailOfflineJob } from '../offline/offline.facade';
import { enqueueOfflineQueueItem } from '../../offline/queue.service';
import type { DeliveryFailPayload } from './delivery.types';

export async function enqueueDeliveryFailOffline(
  payload: DeliveryFailPayload,
): Promise<void> {
  await enqueueOfflineQueueItem(createDeliveryFailOfflineJob(payload));
}
