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
  'linehaul.trip_created',
  'linehaul.vehicle_assigned',
  'linehaul.manifest_loaded',
  'linehaul.vehicle_sealed',
  'linehaul.departed',
  'linehaul.arrived',
  'linehaul.manifest_received',
  'linehaul.completed',
  'linehaul.cancelled',
  'linehaul.incident_reported',
  'linehaul.handover_signed',
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
  'linehaul.trip_created': 'TRIP_PLANNED',
  'linehaul.vehicle_assigned': 'TRIP_ASSIGNED',
  'linehaul.manifest_loaded': 'TRIP_LOADING',
  'linehaul.vehicle_sealed': 'TRIP_SEALED',
  'linehaul.departed': 'TRIP_DEPARTED',
  'linehaul.arrived': 'TRIP_ARRIVED',
  'linehaul.manifest_received': 'TRIP_RECEIVING',
  'linehaul.completed': 'TRIP_COMPLETED',
  'linehaul.cancelled': 'TRIP_CANCELLED',
  'linehaul.incident_reported': 'TRIP_INCIDENT',
  'linehaul.handover_signed': 'TRIP_HANDOVER',
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
  TRIP_PLANNED: 'Lập chuyến',
  TRIP_ASSIGNED: 'Gán xe/tài xế',
  TRIP_LOADING: 'Load bao lên xe',
  TRIP_SEALED: 'Niêm phong xe',
  TRIP_DEPARTED: 'Xe đi',
  TRIP_ARRIVED: 'Xe đến',
  TRIP_RECEIVING: 'Dỡ hàng khỏi xe',
  TRIP_COMPLETED: 'Hoàn tất chuyến',
  TRIP_CANCELLED: 'Hủy chuyến',
  TRIP_INCIDENT: 'Sự cố chuyến xe',
  TRIP_HANDOVER: 'Bàn giao chuyến',
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
  'linehaul.trip_created': 'Lập chuyến xe',
  'linehaul.vehicle_assigned': 'Gán xe/tài xế',
  'linehaul.manifest_loaded': 'Load bao lên xe',
  'linehaul.vehicle_sealed': 'Niêm phong xe',
  'linehaul.departed': 'Xe đi',
  'linehaul.arrived': 'Xe đến',
  'linehaul.manifest_received': 'Dỡ bao khỏi xe',
  'linehaul.completed': 'Hoàn tất chuyến xe',
  'linehaul.cancelled': 'Hủy chuyến xe',
  'linehaul.incident_reported': 'Ghi nhận sự cố chuyến xe',
  'linehaul.handover_signed': 'Bàn giao chuyến xe',
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

  if (event.event_type.startsWith('linehaul.')) {
    return buildLinehaulTimelineText(event, locationCode);
  }

  return EVENT_LABELS_VI[event.event_type];
}

export function extractTimelineNote(event: TrackingEventEnvelope): string | null {
  if (event.event_type === 'manifest.sealed') {
    const employeeName = readNestedString(event.data, ['seal', 'employeeName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['seal', 'employeeCode']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['seal', 'processingHubCode']) ?? 'N/A';
    return `${employeeName} - ${employeeCode} - ${hubCode}`;
  }
  
  if (event.event_type === 'manifest.received') {
    const employeeName = readNestedString(event.data, ['receive', 'receivedByName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['receive', 'receivedBy']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['receive', 'processingHubCode']) ?? 'N/A';
    return `${employeeName} - ${employeeCode} - ${hubCode}`;
  }

  if (event.event_type === 'manifest.unsealed') {
    const employeeName = readNestedString(event.data, ['unseal', 'unsealedByName']) ?? readNestedString(event.data, ['unseal', 'employeeName']) ?? 'N/A';
    const employeeCode = readNestedString(event.data, ['unseal', 'unsealedBy']) ?? readNestedString(event.data, ['unseal', 'employeeCode']) ?? 'N/A';
    const hubCode = readNestedString(event.data, ['unseal', 'processingHubCode']) ?? 'N/A';
    return `${employeeName} - ${employeeCode} - ${hubCode}`;
  }

  if (event.event_type === 'scan.outbound' || event.event_type === 'scan.inbound' || event.event_type === 'scan.pickup_confirmed') {
    return readNestedString(event.data, ['scanEvent', 'note']);
  }

  if (event.event_type.startsWith('linehaul.')) {
    return buildLinehaulTimelineNote(event);
  }

  return null;
}

function buildLinehaulTimelineText(
  event: TrackingEventEnvelope,
  locationCode: string | null,
): string {
  const baseText = EVENT_LABELS_VI[event.event_type as TrackingBusinessEventType];
  const tripCode = readNestedString(event.data, ['trip', 'tripCode']);
  const manifestCode =
    readNestedString(event.data, ['manifest', 'manifestCode']) ??
    readNestedString(event.data, ['tripManifest', 'manifestCode']);
  const sealCode = readNestedString(event.data, ['seal', 'sealCode']);

  if (event.event_type === 'linehaul.manifest_loaded' && manifestCode) {
    return withLocationSuffix(`${baseText} ${manifestCode}`, locationCode);
  }

  if (event.event_type === 'linehaul.manifest_received' && manifestCode) {
    return withLocationSuffix(`${baseText} ${manifestCode}`, locationCode);
  }

  if (event.event_type === 'linehaul.vehicle_sealed' && sealCode) {
    return withLocationSuffix(`${baseText} ${sealCode}`, locationCode);
  }

  if (tripCode) {
    return withLocationSuffix(`${baseText} ${tripCode}`, locationCode);
  }

  return withLocationSuffix(baseText, locationCode);
}

function buildLinehaulTimelineNote(event: TrackingEventEnvelope): string | null {
  if (event.event_type === 'linehaul.vehicle_assigned') {
    const vehicleCode = readNestedString(event.data, ['trip', 'vehicle', 'vehicleCode']);
    const licensePlate = readNestedString(event.data, ['trip', 'vehicle', 'licensePlate']);
    const driverName = readNestedString(event.data, ['trip', 'driver', 'fullName']);

    return [vehicleCode, licensePlate, driverName].filter(Boolean).join(' - ') || null;
  }

  if (event.event_type === 'linehaul.incident_reported') {
    const incidentType = readNestedString(event.data, ['incident', 'incidentType']);
    const severity = readNestedString(event.data, ['incident', 'severity']);
    const description = readNestedString(event.data, ['incident', 'description']);

    return [incidentType, severity, description].filter(Boolean).join(' - ') || null;
  }

  if (event.event_type === 'linehaul.handover_signed') {
    const fromUser = readNestedString(event.data, ['handover', 'fromUser']);
    const toUser = readNestedString(event.data, ['handover', 'toUser']);
    const hubCode = readNestedString(event.data, ['handover', 'hubCode']);

    return [fromUser, toUser, hubCode].filter(Boolean).join(' - ') || null;
  }

  return readNestedString(event.data, ['trip', 'note']);
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
