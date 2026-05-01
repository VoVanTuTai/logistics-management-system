import type { TrackingEventEnvelope } from '../../domain/entities/timeline-event.entity';

export const TRACKING_BUSINESS_EVENTS = [
  'shipment.created',
  'pickup.requested',
  'pickup.approved',
  'task.assigned',
  'scan.pickup_confirmed',
  'manifest.sealed',
  'manifest.received',
  'manifest.unsealed',
  'scan.outbound',
  'scan.inbound',
  'delivery.attempted',
  'delivery.delivered',
  'delivery.failed',
  'ndr.created',
  'return.started',
  'return.completed',
] as const;

export type TrackingBusinessEventType = (typeof TRACKING_BUSINESS_EVENTS)[number];

export const TRACKING_STATUS_BY_EVENT: Record<
  TrackingBusinessEventType,
  string
> = {
  'shipment.created': 'CREATED',
  'pickup.requested': 'PICKUP_REQUESTED',
  'pickup.approved': 'PICKUP_ASSIGNED',
  'task.assigned': 'PICKUP_ASSIGNED',
  'scan.pickup_confirmed': 'PICKED_UP',
  'manifest.sealed': 'IN_TRANSIT',
  'manifest.received': 'INBOUND_AT_HUB',
  'manifest.unsealed': 'MANIFEST_UNSEALED',
  'scan.outbound': 'OUTBOUND_FROM_HUB',
  'scan.inbound': 'INBOUND_AT_HUB',
  'delivery.attempted': 'DELIVERING',
  'delivery.delivered': 'DELIVERED',
  'delivery.failed': 'DELIVERY_FAILED',
  'ndr.created': 'DELIVERY_FAILED',
  'return.started': 'RETURNING',
  'return.completed': 'RETURNED',
};

const STATUS_LABELS_VI: Record<string, string> = {
  CREATED: 'Đơn hàng đã được tạo',
  PICKUP_REQUESTED: 'Đang chờ lấy hàng',
  PICKUP_ASSIGNED: 'Đã phân công lấy hàng',
  PICKED_UP: 'Nhận hàng',
  IN_TRANSIT: 'Đang luân chuyển',
  INBOUND_AT_HUB: 'Hàng đến',
  OUTBOUND_FROM_HUB: 'Đã rời kho',
  SEND_GOODS: 'Đã gửi hàng',
  INVENTORY_CHECK: 'Kiểm tra hàng tồn',
  OUT_FOR_DELIVERY: 'Đang giao hàng',
  DELIVERING: 'Shipper đang giao hàng',
  DELIVERED: 'Giao hàng thành công',
  DELIVERY_FAILED: 'Giao hàng không thành công',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',

  // Backward-compatible labels for existing legacy shipment statuses.
  UPDATED: 'Đang chờ lấy hàng',
  PICKUP_COMPLETED: 'Nhận hàng',
  TASK_ASSIGNED: 'Đã phân công tác vụ',
  MANIFEST_SEALED: 'Đang trung chuyển',
  MANIFEST_RECEIVED: 'Đã đến kho trung chuyển',
  MANIFEST_UNSEALED: 'Đã gỡ bao',
  SCAN_INBOUND: 'Hàng đến',
  SCAN_OUTBOUND: 'Đã rời kho',
  NDR_CREATED: 'Đơn hàng đang được xử lý lại',
  RETURN_STARTED: 'Đang hoàn hàng',
  RETURN_COMPLETED: 'Đã hoàn hàng',
  CANCELLED: 'Đơn hàng đã hủy',
};

const EVENT_LABELS_VI: Record<TrackingBusinessEventType, string> = {
  'shipment.created': 'Đơn hàng đã được tạo',
  'pickup.requested': 'Đã yêu cầu lấy hàng',
  'pickup.approved': 'Yêu cầu lấy hàng đã được xác nhận',
  'task.assigned': 'Shipper đã được phân công lấy hàng',
  'scan.pickup_confirmed': 'Nhận hàng',
  'manifest.sealed': 'Hàng đã được đóng bao và chuẩn bị vận chuyển',
  'manifest.received': 'Hàng đã đến kho trung chuyển',
  'manifest.unsealed': 'Hàng đã được gỡ khỏi bao',
  'scan.outbound': 'Hàng đã rời kho',
  'scan.inbound': 'Hàng đến',
  'delivery.attempted': 'Shipper đang giao hàng',
  'delivery.delivered': 'Giao hàng thành công',
  'delivery.failed': 'Giao hàng không thành công',
  'ndr.created': 'Đơn hàng đang được xử lý lại',
  'return.started': 'Đơn hàng đang được hoàn trả',
  'return.completed': 'Đơn hàng đã được hoàn trả',
};

export function isTrackingBusinessEventType(
  value: string,
): value is TrackingBusinessEventType {
  return (TRACKING_BUSINESS_EVENTS as readonly string[]).includes(value);
}

export function resolveTrackingStatusFromEvent(
  event: TrackingEventEnvelope,
  currentStatus: string | null,
): string | null {
  if (!isTrackingBusinessEventType(event.event_type)) {
    return currentStatus;
  }

  if (event.event_type === 'task.assigned') {
    const taskType = readTaskType(event.data);

    if (taskType === 'DELIVERY') {
      return 'OUT_FOR_DELIVERY';
    }

    if (taskType === 'PICKUP') {
      return 'PICKUP_ASSIGNED';
    }
  }

  if (event.event_type === 'scan.outbound' && isSendGoodsEvent(event)) {
    return 'SEND_GOODS';
  }

  if (event.event_type === 'scan.outbound' && isVehicleOutboundEvent(event)) {
    return 'IN_TRANSIT';
  }

  if (event.event_type === 'scan.inbound' && isInventoryCheckEvent(event)) {
    return 'INVENTORY_CHECK';
  }

  return TRACKING_STATUS_BY_EVENT[event.event_type] ?? currentStatus;
}

export function toTrackingStatusLabelVi(status: string | null): string | null {
  if (!status) {
    return null;
  }

  return STATUS_LABELS_VI[status] ?? status;
}

export function toTimelineTextVi(
  event: TrackingEventEnvelope,
  locationCode: string | null,
): string {
  if (!isTrackingBusinessEventType(event.event_type)) {
    return event.event_type;
  }

  if (event.event_type === 'task.assigned') {
    const taskType = readTaskType(event.data);

    if (taskType === 'DELIVERY') {
      return 'Đơn hàng đang được giao';
    }

    return EVENT_LABELS_VI['task.assigned'];
  }

  if (event.event_type === 'scan.pickup_confirmed') {
    const note = readNestedString(event.data, ['scanEvent', 'note']);
    const text = note ? `Nhận hàng - ${note}` : EVENT_LABELS_VI['scan.pickup_confirmed'];

    return withLocationSuffix(text, locationCode);
  }

  if (event.event_type === 'scan.inbound') {
    const note = readNestedString(event.data, ['scanEvent', 'note']);
    const baseText = isInventoryCheckEvent(event)
      ? 'Kiểm tra hàng tồn'
      : EVENT_LABELS_VI['scan.inbound'];
    const text = note ? `${baseText} - ${note}` : baseText;

    return withLocationSuffix(text, locationCode);
  }

  if (event.event_type === 'scan.outbound') {
    if (isVehicleOutboundEvent(event)) {
      const note = readNestedString(event.data, ['scanEvent', 'note']);
      const text = note ? `Xe đi - ${note}` : 'Xe đi - Đang luân chuyển';

      return withLocationSuffix(text, locationCode);
    }

    if (isSendGoodsEvent(event)) {
      return withLocationSuffix('Hàng đã được gửi lên xe', locationCode);
    }

    return withLocationSuffix(EVENT_LABELS_VI['scan.outbound'], locationCode);
  }

  if (event.event_type === 'manifest.received') {
    return withLocationSuffix(
      EVENT_LABELS_VI['manifest.received'],
      locationCode ?? readHubCode(event.data, ['manifest', 'destinationHubCode']),
    );
  }

  if (event.event_type === 'manifest.unsealed') {
    return withLocationSuffix(
      EVENT_LABELS_VI['manifest.unsealed'],
      locationCode ?? readHubCode(event.data, ['unseal', 'processingHubCode']),
    );
  }

  return EVENT_LABELS_VI[event.event_type];
}

function withLocationSuffix(baseText: string, locationCode: string | null): string {
  const normalizedLocation = normalizeValue(locationCode);

  if (!normalizedLocation) {
    return baseText;
  }

  return `${baseText} ${normalizedLocation}`;
}

function readTaskType(data: Record<string, unknown>): string | null {
  const fromCamel = readNestedString(data, ['task', 'taskType']);
  if (fromCamel) {
    return fromCamel.toUpperCase();
  }

  const fromSnake = readNestedString(data, ['task', 'task_type']);
  if (fromSnake) {
    return fromSnake.toUpperCase();
  }

  return null;
}

function readHubCode(
  data: Record<string, unknown>,
  path: string[],
): string | null {
  return readNestedString(data, path) ?? null;
}

function isSendGoodsEvent(event: TrackingEventEnvelope): boolean {
  const note = readNestedString(event.data, ['scanEvent', 'note']);
  return note?.startsWith('SEND_GOODS') ?? false;
}

function isVehicleOutboundEvent(event: TrackingEventEnvelope): boolean {
  const note = readNestedString(event.data, ['scanEvent', 'note']);
  return note?.startsWith('VEHICLE_OUTBOUND') ?? false;
}

function isInventoryCheckEvent(event: TrackingEventEnvelope): boolean {
  const note = readNestedString(event.data, ['scanEvent', 'note']);
  return note?.startsWith('INVENTORY_CHECK') ?? false;
}

function readNestedString(source: unknown, path: string[]): string | null {
  let cursor: unknown = source;

  for (const segment of path) {
    if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
      return null;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return normalizeValue(cursor);
}

function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
