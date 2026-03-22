import { createDeliverySuccessOfflineJob } from '../offline/offline.facade';
import { enqueueOfflineQueueItem } from '../../offline/queue.service';
import type { DeliverySuccessPayload } from './delivery.types';

export async function enqueueDeliverySuccessOffline(
  payload: DeliverySuccessPayload,
): Promise<void> {
  await enqueueOfflineQueueItem(createDeliverySuccessOfflineJob(payload));
}
