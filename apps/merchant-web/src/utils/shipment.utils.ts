import type {
  CreateShipmentForm,
  MerchantSession,
  PickupRequest,
  ReturnCaseApiRecord,
  ReturnRequest,
  ShipmentResponse,
} from '../types';
import { DEFAULT_CREATE_FORM } from '../types';
import { asRecord, normalizeCode } from '../api';

export const DELIVERY_INFO_CHANGE_BLOCKED_STATUSES = new Set([
  'TASK_ASSIGNED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
]);

export function buildChangeRequestPayload(
  requestType: string,
  value: string,
): Record<string, unknown> {
  const normalizedValue = value.trim();

  if (requestType === 'change.phone') {
    return {
      value: normalizedValue,
      receiverPhone: normalizedValue,
    };
  }

  if (requestType === 'change.address') {
    return {
      value: normalizedValue,
      receiverAddress: normalizedValue,
    };
  }

  return {
    value: normalizedValue,
    deliveryNote: normalizedValue,
  };
}

export function parseReturnCaseNote(note: string | null): {
  reason: string;
  expectedReturnAt: string;
} {
  const fallbackReason = 'Return requested';
  if (!note) {
    return {
      reason: fallbackReason,
      expectedReturnAt: '-',
    };
  }

  const reasonMatch = note.match(/reason=([^|]+)/i);
  const expectedMatch = note.match(/expected=([^|]+)/i);

  return {
    reason: reasonMatch?.[1]?.trim() || note,
    expectedReturnAt: expectedMatch?.[1]?.trim() || '-',
  };
}

export function mapReturnCaseToRequest(returnCase: ReturnCaseApiRecord): ReturnRequest {
  const parsedNote = parseReturnCaseNote(returnCase.note);

  return {
    id: returnCase.id,
    shipmentCode: returnCase.shipmentCode,
    reason: parsedNote.reason,
    expectedReturnAt: parsedNote.expectedReturnAt,
    status: returnCase.status === 'COMPLETED' ? 'COMPLETED' : 'IN_TRANSIT',
    createdAt: returnCase.createdAt,
  };
}

export function isReturnRequestAllowed(shipment: ShipmentResponse): boolean {
  return !['DELIVERED', 'RETURN_COMPLETED', 'CANCELLED'].includes(
    shipment.currentStatus,
  );
}

/**
 * Whitelist of shipment statuses that are eligible for carrier pickup collection.
 * Only orders that have been created/updated and are awaiting first-mile handover are eligible.
 * Terminal, in-transit, delivered, and cancelled orders are strictly excluded.
 */
export const PICKUP_ELIGIBLE_STATUSES = new Set([
  'CREATED',
  'UPDATED',
  'WAITING_PICKUP',
]);

export function isShipmentEligibleForPickup(
  shipment: ShipmentResponse,
  activePickupByShipmentCode: Map<string, PickupRequest>,
): boolean {
  const normalizedCode = normalizeCode(shipment.code);
  if (!normalizedCode) return false;

  const rawStatus = String(shipment.currentStatus ?? '').toUpperCase().trim();

  // 1. Strict status check: only freshly created or waiting-pickup orders can be collected.
  // Explicitly rejects DELIVERED, CANCELLED, PICKUP_COMPLETED, PICKED_UP, IN_TRANSIT, DELIVERING, etc.
  if (!PICKUP_ELIGIBLE_STATUSES.has(rawStatus)) {
    return false;
  }

  // 2. Active pickup check: cannot be in another active (non-cancelled) pickup request.
  const existingActivePickup = activePickupByShipmentCode.get(normalizedCode);
  if (existingActivePickup && existingActivePickup.status !== 'CANCELLED') {
    return false;
  }

  return true;
}

export function normalizeCreateForm(
  form: Partial<CreateShipmentForm> | null | undefined,
): CreateShipmentForm {
  return {
    ...DEFAULT_CREATE_FORM,
    ...form,
    senderName: form?.senderName ?? '',
    senderPhone: form?.senderPhone ?? '',
    senderProvince: form?.senderProvince ?? '',
    senderWard: form?.senderWard ?? '',
    senderAddressDetail: form?.senderAddressDetail ?? '',
    senderHubCode: form?.senderHubCode ?? '',
    senderAddress: form?.senderAddress ?? '',
    receiverName: form?.receiverName ?? '',
    receiverPhone: form?.receiverPhone ?? '',
    receiverProvince: form?.receiverProvince ?? '',
    receiverWard: form?.receiverWard ?? '',
    receiverAddressDetail: form?.receiverAddressDetail ?? '',
    receiverHubCode: form?.receiverHubCode ?? '',
    receiverAddress: form?.receiverAddress ?? '',
    receiverRegion: form?.receiverRegion ?? '',
    itemType: form?.itemType ?? '',
    weightKg: form?.weightKg ?? '',
    lengthCm: form?.lengthCm ?? '',
    widthCm: form?.widthCm ?? '',
    heightCm: form?.heightCm ?? '',
    codAmount: form?.codAmount ?? '',
    serviceType: form?.serviceType ?? 'STANDARD',
    deliveryNote: form?.deliveryNote ?? '',
  };
}

export function normalizeMerchantIdentity(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

export function isShipmentOwnedByUser(
  shipment: ShipmentResponse,
  user: MerchantSession['user'] | null,
): boolean {
  if (!user) {
    return false;
  }

  const metadata = asRecord(shipment.metadata) ?? {};
  const createdByMeta = asRecord(metadata.createdBy);
  const ownerCandidates = [
    metadata.createdBy,
    metadata.createdByUsername,
    metadata.createdByUserId,
    metadata.merchantCode,
    metadata.merchantUsername,
    createdByMeta?.username,
    createdByMeta?.userId,
    createdByMeta?.id,
    createdByMeta?.merchantCode,
  ]
    .map(normalizeMerchantIdentity)
    .filter((value) => value.length > 0);

  const normalizedUsername = normalizeMerchantIdentity(user.username);
  const normalizedUserId = normalizeMerchantIdentity(user.id);

  if (
    ownerCandidates.some(
      (candidate) =>
        candidate === normalizedUsername ||
        (normalizedUserId.length > 0 && candidate === normalizedUserId),
    )
  ) {
    return true;
  }

  const senderMeta = asRecord(metadata.sender);
  const senderPhone = normalizePhone(senderMeta?.phone);
  const merchantPhone = normalizePhone(user.phone ?? '');

  return (
    senderPhone.length > 0 &&
    merchantPhone.length > 0 &&
    senderPhone === merchantPhone
  );
}

export function filterPickupRequestsByUser(
  pickupRequests: PickupRequest[],
  shipments: ShipmentResponse[],
  user: MerchantSession['user'] | null,
): PickupRequest[] {
  if (!user) {
    return [];
  }

  const ownedShipmentCodes = new Set(
    shipments
      .filter((shipment) => isShipmentOwnedByUser(shipment, user))
      .map((shipment) => normalizeCode(shipment.code))
      .filter((shipmentCode) => shipmentCode.length > 0),
  );

  return pickupRequests
    .map((pickup) => ({
      ...pickup,
      items: pickup.items.filter((item) =>
        ownedShipmentCodes.has(normalizeCode(item.shipmentCode)),
      ),
    }))
    .filter((pickup) => pickup.items.length > 0);
}

export function resolveShipmentStatusLabel(shipment: ShipmentResponse): string {
  const status = shipment.currentStatus;
  if (status === 'WAITING_PICKUP') return 'Chờ lấy hàng';
  if (status === 'CREATED' || status === 'UPDATED') return 'Đã tạo';
  if (status === 'PICKUP_COMPLETED' || status === 'PICKED_UP') return 'Đã nhận hàng';

  switch (status) {
    case 'IN_TRANSIT':
    case 'MANIFEST_SEALED':
    case 'MANIFEST_RECEIVED':
      return 'Đang luân chuyển';
    case 'MANIFEST_UNSEALED':
      return 'Gỡ bao';
    case 'SEND_GOODS':
      return 'Đã gửi hàng';
    case 'SCAN_INBOUND':
      return 'Hàng đến';
    case 'SCAN_OUTBOUND':
      return 'Gửi hàng';
    case 'INVENTORY_CHECK':
      return 'Kiểm tồn kho';
    case 'TASK_ASSIGNED':
    case 'OUT_FOR_DELIVERY':
      return 'Phát hàng';
    case 'DELIVERED':
      return 'Ký nhận';
    case 'DELIVERY_FAILED':
      return 'Ghi nhận vấn đề';
    case 'NDR_CREATED':
      return 'Cần xử lý NDR';
    case 'EXCEPTION':
      return 'Sự cố ngoại lệ';
    case 'RETURN_STARTED':
      return 'Đang hoàn hàng';
    case 'RETURN_COMPLETED':
      return 'Đã hoàn hàng';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return shipment.currentStatus;
  }
}

export function formatTrackingEventName(eventType: string): string {
  const map: Record<string, string> = {
    CREATED: 'Tạo đơn hàng',
    SHIPMENT_CREATED: 'Đã tạo vận đơn',
    PICKUP_REQUESTED: 'Tạo yêu cầu lấy hàng',
    TASK_ASSIGNED: 'Đã phân công shipper',
    PICKUP_ASSIGNED: 'Đã phân công shipper lấy hàng',
    PICKED_UP: 'Shipper đã lấy hàng',
    PICKUP_COMPLETED: 'Lấy hàng thành công',
    IN_HUB_SENDER: 'Nhập kho gửi (Sender Hub)',
    HUB_INBOUND: 'Hàng nhập kho trung chuyển',
    SCAN_INBOUND: 'Quét hàng nhập kho',
    MANIFEST_SEALED: 'Đóng bao / Niêm phong chuyến xe',
    MANIFEST_RECEIVED: 'Nhận bao hàng luân chuyển',
    MANIFEST_UNSEALED: 'Mở niêm phong chuyến xe',
    SEND_GOODS: 'Chuyển hàng sang chặng tiếp',
    IN_TRANSIT: 'Đang vận chuyển liên kho',
    HUB_OUTBOUND: 'Xuất kho luân chuyển',
    SCAN_OUTBOUND: 'Quét xuất kho chuyển tiếp',
    IN_HUB_RECEIVER: 'Hàng đến kho đích (Receiver Hub)',
    OUT_FOR_DELIVERY: 'Shipper đang giao hàng',
    DELIVERED: 'Giao hàng thành công (Ký nhận)',
    DELIVERY_FAILED: 'Giao hàng không thành công',
    NDR_CREATED: 'Báo cáo giao không thành (NDR)',
    RETURN_INITIATED: 'Bắt đầu quy trình hoàn hàng',
    RETURN_STARTED: 'Đang chuyển hoàn về người gửi',
    RETURN_COMPLETED: 'Đã hoàn hàng về người gửi',
    CANCELLED: 'Đã hủy đơn hàng',
  };
  return map[eventType.toUpperCase()] ?? eventType.replace(/_/g, ' ');
}

export function getTrackingEventIcon(eventType: string): string {
  const upper = eventType.toUpperCase();
  if (upper.includes('DELIVERED') && !upper.includes('FAIL')) return 'check_circle';
  if (upper.includes('FAIL') || upper.includes('CANCEL') || upper.includes('NDR')) return 'error';
  if (upper.includes('OUT_FOR_DELIVERY')) return 'local_shipping';
  if (upper.includes('HUB') || upper.includes('INBOUND') || upper.includes('OUTBOUND')) return 'warehouse';
  if (upper.includes('TRANSIT') || upper.includes('MANIFEST') || upper.includes('SEND_GOODS')) return 'move_to_inbox';
  if (upper.includes('PICK')) return 'inventory_2';
  if (upper.includes('RETURN')) return 'assignment_return';
  return 'event_note';
}
