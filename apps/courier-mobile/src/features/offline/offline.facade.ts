import type { OfflineJob } from '../../offline/queue.types';
import { courierEndpoints } from '../../services/api/endpoints';
import type { DeliveryFailPayload, DeliverySuccessPayload } from '../delivery/delivery.types';
import type { RecordScanPayload } from '../scan/scan.types';

function createOfflineJob<TPayload>(
  actionType: OfflineJob['actionType'],
  endpoint: string,
  payload: TPayload,
  idempotencyKey: string,
): OfflineJob<TPayload> {
  const now = new Date().toISOString();

  return {
    id: `${actionType}:${idempotencyKey}`,
    actionType,
    endpoint,
    method: 'POST',
    payload,
    idempotencyKey,
    status: 'QUEUED',
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    lastError: null,
  };
}

export function createPickupScanOfflineJob(payload: RecordScanPayload) {
  return createOfflineJob(
    'SCAN_PICKUP',
    courierEndpoints.scan.pickup,
    payload,
    payload.idempotencyKey,
  );
}

export function createInboundScanOfflineJob(payload: RecordScanPayload) {
  return createOfflineJob(
    'SCAN_INBOUND',
    courierEndpoints.scan.inbound,
    payload,
    payload.idempotencyKey,
  );
}

export function createOutboundScanOfflineJob(payload: RecordScanPayload) {
  return createOfflineJob(
    'SCAN_OUTBOUND',
    courierEndpoints.scan.outbound,
    payload,
    payload.idempotencyKey,
  );
}

export function createDeliverySuccessOfflineJob(
  payload: DeliverySuccessPayload,
) {
  return createOfflineJob(
    'DELIVERY_SUCCESS',
    courierEndpoints.delivery.success,
    payload,
    payload.idempotencyKey,
  );
}

export function createDeliveryFailOfflineJob(payload: DeliveryFailPayload) {
  return createOfflineJob(
    'DELIVERY_FAIL',
    courierEndpoints.delivery.fail,
    payload,
    payload.idempotencyKey,
  );
}
