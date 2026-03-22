import { createPickupScanOfflineJob } from '../offline/offline.facade';
import { enqueueOfflineQueueItem } from '../../offline/queue.service';
import type { PickupScanCommand } from './pickup.types';

export async function enqueuePickupScanOffline(
  command: PickupScanCommand,
): Promise<void> {
  await enqueueOfflineQueueItem(createPickupScanOfflineJob(command));
}
