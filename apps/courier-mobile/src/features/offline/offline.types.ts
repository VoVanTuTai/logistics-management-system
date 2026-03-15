import type { DeliveryFailPayload, DeliverySuccessPayload } from '../delivery/delivery.types';
import type { RecordScanPayload } from '../scan/scan.types';

export type QueueableActionType =
  | 'SCAN_PICKUP'
  | 'SCAN_INBOUND'
  | 'SCAN_OUTBOUND'
  | 'DELIVERY_SUCCESS'
  | 'DELIVERY_FAIL';

export interface QueueableActionPayloadMap {
  SCAN_PICKUP: RecordScanPayload;
  SCAN_INBOUND: RecordScanPayload;
  SCAN_OUTBOUND: RecordScanPayload;
  DELIVERY_SUCCESS: DeliverySuccessPayload;
  DELIVERY_FAIL: DeliveryFailPayload;
}
