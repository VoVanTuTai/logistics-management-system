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
  CREATED: 'Đã tạo',
  BAGGED: 'Đóng bao',
  PICKUP_REQUESTED: 'Chờ lấy hàng',
  PICKUP_ASSIGNED: 'Chờ lấy hàng',
  PICKED_UP: 'Đã nhận hàng',
  IN_TRANSIT: 'Đang luân chuyển',
  INBOUND_AT_HUB: 'Hàng đến',
  OUTBOUND_FROM_HUB: 'Gửi hàng',
  SEND_GOODS: 'Gửi hàng',
  INVENTORY_CHECK: 'Quét tồn kho',
  OUT_FOR_DELIVERY: 'Phát hàng',
  DELIVERING: 'Phát hàng',
  DELIVERED: 'Ký nhận',
  DELIVERY_FAILED: 'Ghi nhận vấn đề',
  EXCEPTION: 'Ghi nhận vấn đề',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',

  // Backward-compatible labels for existing legacy shipment statuses.
  UPDATED: 'Chờ lấy hàng',
  PICKUP_COMPLETED: 'Đã nhận hàng',
  TASK_ASSIGNED: 'Chờ lấy hàng',
  MANIFEST_SEALED: 'Đang luân chuyển',
  MANIFEST_RECEIVED: 'Xe đến',
  MANIFEST_UNSEALED: 'Gỡ bao',
  SCAN_INBOUND: 'Hàng đến',
  SCAN_OUTBOUND: 'Gửi hàng',
  NDR_CREATED: 'Ghi nhận vấn đề',
  PENDING_RESOLUTION: 'Ghi nhận vấn đề',
  RETURN_STARTED: 'Đang hoàn hàng',
  RETURN_COMPLETED: 'Đã hoàn hàng',
  CANCELLED: 'Đơn hàng đã hủy',
};

const EVENT_LABELS_VI: Record<TrackingBusinessEventType, string> = {
  'shipment.created': 'Tạo đơn hàng',
  'pickup.requested': 'Yêu cầu pickup',
  'pickup.approved': 'Điều phối cho Courier',
  'task.assigned': 'Điều phối cho Courier',
  'scan.pickup_confirmed': 'Nhận hàng',
  'manifest.sealed': 'Xe đi',
  'manifest.received': 'Xe đến',
  'manifest.unsealed': 'Gỡ bao',
  'scan.outbound': 'Gửi hàng',
  'scan.inbound': 'Hàng đến',
  'delivery.attempted': 'Phát hàng',
  'delivery.delivered': 'Ký nhận',
  'delivery.failed': 'Ghi nhận vấn đề',
  'ndr.created': 'Ghi nhận vấn đề',
  'return.started': 'Bắt đầu hoàn hàng',
  'return.completed': 'Hoàn hàng thành công',
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

  if (event.event_type === 'ndr.created' && isExceptionNdrEvent(event)) {
    return 'EXCEPTION';
  }

  if (event.event_type === 'scan.outbound' && isVehicleOutboundEvent(event)) {
    return 'IN_TRANSIT';
  }

  if (event.event_type === 'scan.inbound' && isInventoryCheckEvent(event)) {
    return 'INVENTORY_CHECK';
  }

  if (event.event_type === 'manifest.sealed') {
    const note = readNestedString(event.data, ['seal', 'note']);
    if (note?.startsWith('Xe đi:')) {
      return 'IN_TRANSIT';
    }
    return 'BAGGED';
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
    return withLocationSuffix(EVENT_LABELS_VI['scan.pickup_confirmed'], locationCode);
  }

  if (event.event_type === 'scan.inbound') {
    const baseText = isInventoryCheckEvent(event)
      ? 'Kiểm tra hàng tồn'
      : EVENT_LABELS_VI['scan.inbound'];

    return withLocationSuffix(baseText, locationCode);
  }

  if (event.event_type === 'scan.outbound') {
    if (isVehicleOutboundEvent(event)) {
      return withLocationSuffix('Xe đi - Đang luân chuyển', locationCode);
    }

    return withLocationSuffix(EVENT_LABELS_VI['scan.outbound'], locationCode);
  }

  if (event.event_type === 'manifest.sealed') {
    const bagCode = readNestedString(event.data, ['manifest', 'manifestCode']) ?? 'N/A';
    const note = readNestedString(event.data, ['seal', 'note']);

    if (note?.startsWith('Xe đi:')) {
      return 'Xe đi - Đang luân chuyển';
    }

    return `Đóng bao ${bagCode}`;
  }

  if (event.event_type === 'manifest.received') {
    const note = readNestedString(event.data, ['receive', 'note']);
    if (note?.startsWith('Xe đến:')) {
      return 'Xe đến';
    }
    return EVENT_LABELS_VI['manifest.received'];
  }

  if (event.event_type === 'manifest.unsealed') {
    return EVENT_LABELS_VI['manifest.unsealed'];
  }

  if (event.event_type === 'ndr.created' && isExceptionNdrEvent(event)) {
    const issueName =
      readNestedString(event.data, ['ndrCase', 'issueType']) ??
      readNestedString(event.data, ['ndrCase', 'reasonCode']) ??
      'Sự cố';

    return `Đơn hàng đang gặp sự cố: ${issueName}. Đang chờ xử lý`;
  }

  return EVENT_LABELS_VI[event.event_type];
}

export function extractTimelineNote(event: TrackingEventEnvelope): string | null {
  if (event.event_type === 'manifest.sealed') {
    const employeeName = readNestedString(event.data, ['seal', 'employeeName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['seal', 'employeeCode']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['seal', 'processingHubCode']) ?? 'N/A';
    const note = readNestedString(event.data, ['seal', 'note']);
    return joinTimelineNoteParts([`${employeeName} - ${employeeCode} - ${hubCode}`, note]);
  }
  
  if (event.event_type === 'manifest.received') {
    const employeeName = readNestedString(event.data, ['receive', 'receivedByName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['receive', 'receivedBy']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['receive', 'processingHubCode']) ?? 'N/A';
    const note = readNestedString(event.data, ['receive', 'note']);
    return joinTimelineNoteParts([`${employeeName} - ${employeeCode} - ${hubCode}`, note]);
  }

  if (event.event_type === 'manifest.unsealed') {
    const employeeName = readNestedString(event.data, ['unseal', 'unsealedByName']) ?? readNestedString(event.data, ['unseal', 'employeeName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['unseal', 'unsealedBy']) ?? readNestedString(event.data, ['unseal', 'employeeCode']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['unseal', 'processingHubCode']) ?? 'N/A';
    const note = readNestedString(event.data, ['unseal', 'note']);
    return joinTimelineNoteParts([`${employeeName} - ${employeeCode} - ${hubCode}`, note]);
  }

  if (event.event_type === 'scan.outbound' || event.event_type === 'scan.inbound' || event.event_type === 'scan.pickup_confirmed') {
    return readNestedString(event.data, ['scanEvent', 'note']);
  }

  if (event.event_type === 'delivery.delivered') {
    const deliveryNote = readNestedString(event.data, ['deliveryAttempt', 'note']);
    const podNote = readNestedString(event.data, ['pod', 'note']);
    const podImageUrl = readNestedString(event.data, ['pod', 'imageUrl']);

    return joinTimelineNoteParts([
      deliveryNote,
      podNote,
      podImageUrl ? `Minh chứng giao hàng: ${podImageUrl}` : null,
    ]);
  }

  if (event.event_type === 'delivery.attempted' || event.event_type === 'delivery.failed') {
    const deliveryNote = readNestedString(event.data, ['deliveryAttempt', 'note']);
    if (event.event_type === 'delivery.attempted') {
      const courierId = readNestedString(event.data, ['deliveryAttempt', 'courierId']);
      const hubCode = readNestedString(event.data, ['deliveryAttempt', 'locationCode']);
      let infoParts: string[] = [];
      if (courierId) infoParts.push(`Courier: ${courierId}`);
      if (hubCode) infoParts.push(`Hub: ${hubCode}`);
      const infoText = infoParts.join(' - ');
      return joinTimelineNoteParts([infoText || null, deliveryNote]);
    }
    return deliveryNote;
  }

  if (event.event_type === 'ndr.created') {
    const note = readNestedString(event.data, ['ndrCase', 'note']);
    const attachmentUrls = extractAttachmentUrls(
      readNestedValue(event.data, ['ndrCase', 'attachments']),
    );

    return joinTimelineNoteParts([
      note,
      attachmentUrls.length > 0 ? `Minh chứng vấn đề: ${attachmentUrls.join(', ')}` : null,
    ]);
  }

  if (event.event_type === 'task.assigned') {
    const taskType = readTaskType(event.data);
    const taskNote = readNestedString(event.data, ['task', 'note']);
    if (taskType === 'DELIVERY') {
      const assignments = readNestedValue(event.data, ['task', 'assignments']);
      let courierId: string | null = null;
      if (Array.isArray(assignments) && assignments.length > 0) {
        const activeAssignment = assignments.find((a: any) => !a.unassignedAt) || assignments[assignments.length - 1];
        if (activeAssignment && typeof activeAssignment === 'object') {
          courierId = (activeAssignment as any).courierId || null;
        }
      }
      const hubCode = readNestedString(event.data, ['location', 'locationCode'])
        ?? readNestedString(event.data, ['location', 'hubCode'])
        ?? readNestedString(event.data, ['task', 'hubCode'])
        ?? readNestedString(event.data, ['task', 'hub_code'])
        ?? null;
      let infoParts: string[] = [];
      if (courierId) infoParts.push(`Courier: ${courierId}`);
      if (hubCode) infoParts.push(`Hub: ${hubCode}`);
      const infoText = infoParts.join(' - ');
      return joinTimelineNoteParts([infoText || null, taskNote]);
    }
    return taskNote;
  }

  return null;
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

function isExceptionNdrEvent(event: TrackingEventEnvelope): boolean {
  const status = readNestedString(event.data, ['ndrCase', 'status']);
  const issueType = readNestedString(event.data, ['ndrCase', 'issueType']);
  return status === 'PENDING_RESOLUTION' || Boolean(issueType);
}

function isInventoryCheckEvent(event: TrackingEventEnvelope): boolean {
  const note = readNestedString(event.data, ['scanEvent', 'note']);
  return note?.startsWith('INVENTORY_CHECK') ?? false;
}

function readNestedString(source: unknown, path: string[]): string | null {
  const cursor = readNestedValue(source, path);

  return normalizeValue(cursor);
}

function readNestedValue(source: unknown, path: string[]): unknown {
  let cursor: unknown = source;

  for (const segment of path) {
    if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
      return null;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor;
}

function joinTimelineNoteParts(parts: Array<string | null>): string | null {
  const uniqueParts = Array.from(
    new Set(parts.map((part) => normalizeValue(part)).filter(Boolean)),
  );

  return uniqueParts.length > 0 ? uniqueParts.join(' | ') : null;
}

function extractAttachmentUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      return normalizeUrl(record.url) ?? normalizeUrl(record.uri);
    })
    .filter((url): url is string => Boolean(url));
}

function normalizeUrl(value: unknown): string | null {
  const normalized = normalizeValue(value);

  if (!normalized || !/^https?:\/\//i.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
