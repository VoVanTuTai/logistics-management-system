export const SHIPMENT_CURRENT_STATUSES = [
  'CREATED',
  'UPDATED',
  'PICKUP_COMPLETED',
  'TASK_ASSIGNED',
  'MANIFEST_SEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
] as const;

export type ShipmentCurrentStatus = (typeof SHIPMENT_CURRENT_STATUSES)[number];

export const SHIPMENT_CONSUMED_EVENT_TYPES = [
  'pickup.completed',
  'task.assigned',
  'manifest.sealed',
  'manifest.received',
  'scan.inbound',
  'scan.outbound',
  'delivery.delivered',
  'delivery.failed',
  'ndr.created',
  'return.started',
  'return.completed',
] as const;

export type ShipmentConsumedEventType =
  (typeof SHIPMENT_CONSUMED_EVENT_TYPES)[number];
