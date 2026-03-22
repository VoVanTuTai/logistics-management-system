import { enqueueOfflineQueueItem } from '../../offline/queue.service';
import {
  createInboundScanOfflineJob,
  createOutboundScanOfflineJob,
} from '../offline/offline.facade';
import type { HubScanCommand } from './hub.types';

export async function enqueueHubScanOffline(command: HubScanCommand): Promise<void> {
  const payload = {
    shipmentCode: command.shipmentCode,
    locationCode: command.locationCode,
    manifestCode: command.manifestCode ?? null,
    actor: command.actor ?? null,
    note: command.note ?? null,
    occurredAt: command.occurredAt ?? null,
    idempotencyKey: command.idempotencyKey,
  };

  const job =
    command.mode === 'INBOUND'
      ? createInboundScanOfflineJob(payload)
      : createOutboundScanOfflineJob(payload);

  await enqueueOfflineQueueItem(job);
}
