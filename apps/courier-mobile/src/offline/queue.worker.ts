import type {
  DeliveryFailPayload,
  DeliverySuccessPayload,
} from '../features/delivery/delivery.types';
import { deliveryApi } from '../features/delivery/delivery.api';
import type { RecordScanPayload } from '../features/scan/scan.types';
import { scanApi } from '../features/scan/scan.api';
import { useAppStore } from '../store/appStore';
import {
  getOfflineQueue,
  removeOfflineJob,
  updateOfflineJob,
} from './queue.storage';
import type { OfflineJob } from './queue.types';

export async function flushOfflineQueue(
  accessToken: string | null,
): Promise<void> {
  if (!accessToken) {
    return;
  }

  useAppStore.getState().setOfflineSyncing(true);
  const queue = await getOfflineQueue();

  try {
    for (const job of queue) {
      const processingJob: OfflineJob = {
        ...job,
        status: 'PROCESSING',
        retryCount: job.retryCount + 1,
        lastAttemptAt: new Date().toISOString(),
      };

      await updateOfflineJob(processingJob);

      try {
        await executeOfflineJob(accessToken, processingJob);
        await removeOfflineJob(processingJob.id);
      } catch (error) {
        await updateOfflineJob({
          ...processingJob,
          status: 'FAILED',
          lastError:
            error instanceof Error ? error.message : 'Offline retry failed.',
        });
      }
    }
  } finally {
    useAppStore.getState().setOfflineSyncing(false);
  }
}

async function executeOfflineJob(
  accessToken: string,
  job: OfflineJob,
): Promise<void> {
  switch (job.type) {
    case 'SCAN_PICKUP':
      await scanApi.recordPickup(accessToken, job.payload as RecordScanPayload);
      return;
    case 'SCAN_INBOUND':
      await scanApi.recordInbound(accessToken, job.payload as RecordScanPayload);
      return;
    case 'SCAN_OUTBOUND':
      await scanApi.recordOutbound(
        accessToken,
        job.payload as RecordScanPayload,
      );
      return;
    case 'DELIVERY_SUCCESS':
      await deliveryApi.markSuccess(
        accessToken,
        job.payload as DeliverySuccessPayload,
      );
      return;
    case 'DELIVERY_FAIL':
      await deliveryApi.markFail(
        accessToken,
        job.payload as DeliveryFailPayload,
      );
      return;
    default:
      throw new Error(`Unsupported offline job type: ${job.type}`);
  }
}
