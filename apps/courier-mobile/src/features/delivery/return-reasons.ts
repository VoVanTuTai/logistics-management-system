import type { NdrCaseDto } from './delivery.types';
import type { ShipmentMetadata } from '../shipment/shipment.types';

export type ReturnReasonSource = 'DELIVERY_FAIL' | 'SCAN_ISSUE';
export type ReturnIssueCategory = 'PHYSICAL' | 'INFORMATION' | 'SYSTEM';

export interface CourierReturnReasonOption {
  id: string;
  code: string;
  label: string;
  description: string;
  source: ReturnReasonSource;
  issueCategory?: ReturnIssueCategory;
}

export interface ResolvedReturnReason {
  option: CourierReturnReasonOption;
  note: string;
  ndrCaseId?: string | null;
}

export const DELIVERY_FAIL_RETURN_REASONS: CourierReturnReasonOption[] = [
  {
    id: 'delivery-fail-cannot-contact',
    code: 'CANNOT_CONTACT',
    label: 'Không liên lạc được với khách hàng',
    description: 'Courier gọi hoặc nhắn tin nhưng không liên hệ được người nhận.',
    source: 'DELIVERY_FAIL',
  },
  {
    id: 'delivery-fail-customer-refused',
    code: 'CUSTOMER_REFUSED',
    label: 'Khách từ chối nhận hàng',
    description: 'Người nhận từ chối nhận hàng khi courier giao.',
    source: 'DELIVERY_FAIL',
  },
  {
    id: 'delivery-fail-customer-reschedule',
    code: 'CUSTOMER_RESCHEDULE',
    label: 'Khách hẹn lại ngày nhận',
    description: 'Người nhận yêu cầu giao lại vào thời điểm khác.',
    source: 'DELIVERY_FAIL',
  },
  {
    id: 'delivery-fail-address-not-found',
    code: 'ADDRESS_NOT_FOUND',
    label: 'Không tìm thấy địa chỉ giao',
    description: 'Địa chỉ giao không rõ hoặc courier không thể xác định điểm giao.',
    source: 'DELIVERY_FAIL',
  },
  {
    id: 'delivery-fail-cod-refused',
    code: 'COD_REFUSED',
    label: 'Khách từ chối thanh toán COD/phí',
    description: 'Người nhận không đồng ý thanh toán COD hoặc phí phát sinh.',
    source: 'DELIVERY_FAIL',
  },
];

export const SCAN_ISSUE_RETURN_REASONS: CourierReturnReasonOption[] = [
  {
    id: 'issue-physical-damage',
    code: 'PHYSICAL_DAMAGE',
    label: 'Hư hỏng ngoại quan',
    description: 'Bưu kiện móp, vỡ hoặc có dấu hiệu hư hỏng vật lý.',
    source: 'SCAN_ISSUE',
    issueCategory: 'PHYSICAL',
  },
  {
    id: 'issue-torn',
    code: 'TORN',
    label: 'Rách bao bì',
    description: 'Bao bì bị rách, bung mép hoặc mất nguyên vẹn.',
    source: 'SCAN_ISSUE',
    issueCategory: 'PHYSICAL',
  },
  {
    id: 'issue-wet',
    code: 'WET',
    label: 'Ướt hàng',
    description: 'Bưu kiện bị ướt hoặc có dấu hiệu thấm nước.',
    source: 'SCAN_ISSUE',
    issueCategory: 'PHYSICAL',
  },
  {
    id: 'issue-wrong-phone',
    code: 'WRONG_PHONE',
    label: 'Sai số điện thoại',
    description: 'Thông tin số điện thoại không đúng hoặc không liên hệ được.',
    source: 'SCAN_ISSUE',
    issueCategory: 'INFORMATION',
  },
  {
    id: 'issue-wrong-hub-route',
    code: 'WRONG_HUB_ROUTE',
    label: 'Sai tuyến hub',
    description: 'Bưu kiện đang ở sai hub hoặc sai tuyến trung chuyển.',
    source: 'SCAN_ISSUE',
    issueCategory: 'SYSTEM',
  },
];

export const RETURN_REASON_OPTIONS = [
  ...DELIVERY_FAIL_RETURN_REASONS,
  ...SCAN_ISSUE_RETURN_REASONS,
] as const;

const RETURN_REASON_BY_CODE = new Map(
  RETURN_REASON_OPTIONS.map((option) => [option.code, option]),
);

const RETURN_REASON_CODE_ALIASES = new Map<string, string>([
  ['CUSTOMER_UNREACHABLE', 'CANNOT_CONTACT'],
  ['UNREACHABLE', 'CANNOT_CONTACT'],
  ['NO_ANSWER', 'CANNOT_CONTACT'],
  ['REFUSED', 'CUSTOMER_REFUSED'],
  ['REJECTED', 'CUSTOMER_REFUSED'],
  ['CUSTOMER_REJECTED', 'CUSTOMER_REFUSED'],
  ['RESCHEDULE', 'CUSTOMER_RESCHEDULE'],
  ['RESCHEDULED', 'CUSTOMER_RESCHEDULE'],
  ['WRONG_ADDRESS', 'ADDRESS_NOT_FOUND'],
  ['COD_REJECTED', 'COD_REFUSED'],
  ['DAMAGED', 'PHYSICAL_DAMAGE'],
]);

const METADATA_REASON_CODE_PATHS = [
  'returnReasonCode',
  'failReasonCode',
  'deliveryFail.reasonCode',
  'deliveryFail.failReasonCode',
  'delivery.failReasonCode',
  'deliveryAttempt.failReasonCode',
  'ndr.reasonCode',
  'ndrCase.reasonCode',
  'lastNdr.reasonCode',
  'issueType',
  'issue.type',
  'exception.issueType',
  'lastIssue.issueType',
];

const METADATA_REASON_NOTE_PATHS = [
  'returnReason',
  'returnNote',
  'deliveryFail.note',
  'deliveryNote',
  'ndr.note',
  'ndrCase.note',
  'lastNdr.note',
  'issueNote',
  'exception.note',
  'lastIssue.note',
  'note',
];

function normalizeReasonCode(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toUpperCase();
  return RETURN_REASON_CODE_ALIASES.get(normalized) ?? normalized;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readMetadataPath(metadata: ShipmentMetadata | null, path: string): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let cursor: unknown = metadata;

  for (const key of keys) {
    if (!cursor || typeof cursor !== 'object' || !(key in cursor)) {
      return null;
    }

    cursor = (cursor as Record<string, unknown>)[key];
  }

  return cursor;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = asString(readMetadataPath(metadata, path));
    if (value) {
      return value;
    }
  }

  return null;
}

function extractKnownReasonCodeFromText(value: string | null | undefined): string | null {
  const normalizedText = value?.toUpperCase() ?? '';
  if (!normalizedText) {
    return null;
  }

  for (const option of RETURN_REASON_OPTIONS) {
    if (normalizedText.includes(option.code)) {
      return option.code;
    }
  }

  for (const [alias, code] of RETURN_REASON_CODE_ALIASES) {
    if (normalizedText.includes(alias)) {
      return code;
    }
  }

  return null;
}

function extractUserNote(value: string | null | undefined): string | null {
  const note = asString(value);
  if (!note) {
    return null;
  }

  const segments = note
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const explicitNote = segments.find((segment) => segment.startsWith('Ghi chú:'));

  return explicitNote?.replace(/^Ghi chú:\s*/i, '').trim() || null;
}

export function findReturnReasonByCode(
  value: string | null | undefined,
): CourierReturnReasonOption | null {
  const normalizedCode = normalizeReasonCode(value);
  return RETURN_REASON_BY_CODE.get(normalizedCode) ?? null;
}

export function getReturnReasonSourceLabel(source: ReturnReasonSource): string {
  return source === 'DELIVERY_FAIL' ? 'Giao không được hàng' : 'Vấn đề khi quét mã';
}

export function resolveReturnReasonFromNdrCases(
  ndrCases: NdrCaseDto[] | null | undefined,
): ResolvedReturnReason | null {
  const latestNdrCase = [...(ndrCases ?? [])]
    .filter((ndrCase) => ndrCase.reasonCode || ndrCase.issueType || ndrCase.note)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];

  if (!latestNdrCase) {
    return null;
  }

  const option =
    findReturnReasonByCode(latestNdrCase.reasonCode) ??
    findReturnReasonByCode(latestNdrCase.issueType) ??
    findReturnReasonByCode(extractKnownReasonCodeFromText(latestNdrCase.note));

  if (!option) {
    return null;
  }

  return {
    option,
    note: extractUserNote(latestNdrCase.note) ?? option.label,
    ndrCaseId: latestNdrCase.id,
  };
}

export function resolveReturnReasonFromShipmentMetadata(
  metadata: ShipmentMetadata | null,
): ResolvedReturnReason | null {
  const metadataReasonCode =
    readMetadataString(metadata, METADATA_REASON_CODE_PATHS) ??
    extractKnownReasonCodeFromText(readMetadataString(metadata, METADATA_REASON_NOTE_PATHS));
  const option = findReturnReasonByCode(metadataReasonCode);

  if (!option) {
    return null;
  }

  return {
    option,
    note: extractUserNote(readMetadataString(metadata, METADATA_REASON_NOTE_PATHS)) ?? option.label,
  };
}
