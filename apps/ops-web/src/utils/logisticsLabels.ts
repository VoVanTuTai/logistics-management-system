type LabelMap = Record<string, string>;

const EMPTY_LABEL = 'Khong co';
const UNKNOWN_LABEL = 'Khong xac dinh';

const TOKEN_LABELS: LabelMap = {
  ACTIVE: 'hoat dong',
  ADMIN: 'quan tri',
  APPROVED: 'da duyet',
  ASSIGNED: 'da phan cong',
  AUTH: 'xac thuc',
  BAG: 'bao tai',
  CANCELLED: 'da huy',
  CLOSED: 'da dong',
  COMPLETED: 'hoan tat',
  COURIER: 'shipper',
  CREATED: 'moi tao',
  DELIVERY: 'giao hang',
  DELIVERED: 'giao thanh cong',
  DISABLED: 'vo hieu hoa',
  EVENT: 'su kien',
  FAILED: 'that bai',
  HUB: 'hub',
  INBOUND: 'nhap hub',
  MANIFEST: 'bao tai',
  NDR: 'giao that bai',
  OPEN: 'dang mo',
  OPS: 'dieu hanh',
  OUTBOUND: 'xuat hub',
  PENDING: 'dang cho',
  PICKUP: 'lay hang',
  PROCESSING: 'dang xu ly',
  RECEIVED: 'da nhan',
  REJECTED: 'tu choi',
  REQUESTED: 'cho duyet',
  RESCHEDULED: 'doi lich giao',
  RESOLVED: 'da xu ly',
  RETURN: 'hoan hang',
  RETURNED: 'da hoan',
  RETURNING: 'dang hoan',
  SCAN: 'quet',
  SEALED: 'da niem phong',
  SERVICE: 'dich vu',
  SHIPMENT: 'van don',
  SHIPPER: 'shipper',
  SOURCE: 'nguon',
  STANDARD: 'tieu chuan',
  STATUS: 'trang thai',
  SUCCESS: 'thanh cong',
  SYSTEM: 'he thong',
  TASK: 'tac vu',
  UPDATED: 'da cap nhat',
  USER: 'nguoi dung',
  ZONE: 'khu vuc',
};

const SHIPMENT_STATUS_LABELS: LabelMap = {
  CANCELLED: 'Da huy',
  CREATED: 'Moi tao',
  DELIVERED: 'Giao thanh cong',
  DELIVERY_FAILED: 'Giao that bai',
  IN_TRANSIT: 'Dang trung chuyen',
  MANIFEST_RECEIVED: 'Da nhan bao',
  MANIFEST_SEALED: 'Da niem phong bao',
  NDR_CREATED: 'Can xu ly giao that bai',
  OUT_FOR_DELIVERY: 'Dang giao hang',
  PICKUP_COMPLETED: 'Da lay hang',
  RETURN_COMPLETED: 'Hoan hang thanh cong',
  RETURN_STARTED: 'Bat dau hoan hang',
  SCAN_INBOUND: 'Da quet nhap hub',
  SCAN_OUTBOUND: 'Da quet xuat hub',
  TASK_ASSIGNED: 'Da phan cong giao',
  UPDATED: 'Da cap nhat',
};

const TASK_STATUS_LABELS: LabelMap = {
  ASSIGNED: 'Da phan cong',
  CANCELLED: 'Da huy',
  COMPLETED: 'Hoan tat',
  CREATED: 'Moi tao',
  FAILED: 'That bai',
  IN_PROGRESS: 'Dang xu ly',
  PENDING: 'Dang cho',
};

const TASK_TYPE_LABELS: LabelMap = {
  DELIVERY: 'Giao hang',
  NDR: 'Xu ly giao that bai',
  PICKUP: 'Lay hang',
  RETURN: 'Hoan hang',
};

const PICKUP_STATUS_LABELS: LabelMap = {
  APPROVED: 'Da duyet',
  CANCELLED: 'Da huy',
  COMPLETED: 'Hoan tat',
  REJECTED: 'Tu choi',
  REQUESTED: 'Cho duyet',
};

const MANIFEST_STATUS_LABELS: LabelMap = {
  CANCELLED: 'Da huy',
  CLOSED: 'Da dong',
  CREATED: 'Moi tao',
  IN_TRANSIT: 'Dang trung chuyen',
  OPEN: 'Dang mo',
  RECEIVED: 'Da nhan ban giao',
  SEALED: 'Da niem phong',
};

const NDR_STATUS_LABELS: LabelMap = {
  CLOSED: 'Da dong',
  OPEN: 'Dang xu ly',
  RESCHEDULED: 'Da doi lich giao',
  RESOLVED: 'Da xu ly',
  RETURNING: 'Dang hoan hang',
};

const SCAN_TYPE_LABELS: LabelMap = {
  INBOUND: 'Nhap hub',
  OUTBOUND: 'Xuat hub',
  PICKUP: 'Lay hang',
};

const SERVICE_TYPE_LABELS: LabelMap = {
  EXPRESS: 'Nhanh',
  SAME_DAY: 'Trong ngay',
  STANDARD: 'Tieu chuan',
};

const USER_STATUS_LABELS: LabelMap = {
  ACTIVE: 'Hoat dong',
  DISABLED: 'Vo hieu hoa',
  LOCKED: 'Bi khoa',
};

const ROLE_LABELS: LabelMap = {
  ADMIN: 'Quan tri',
  OPS: 'Dieu hanh',
  OPS_MANAGER: 'Quan ly dieu hanh',
  OPS_STAFF: 'Nhan vien dieu hanh',
  SHIPPER: 'Shipper',
  SYSTEM_ADMIN: 'Quan tri he thong',
};

const KPI_LABELS: LabelMap = {
  CANCELLED_COUNT: 'Don da huy',
  COMPLETED_COUNT: 'Don hoan tat',
  CREATED_COUNT: 'Don moi tao',
  DAILY_SHIPMENTS: 'Van don trong ngay',
  DELIVERED_COUNT: 'Don giao thanh cong',
  DELIVERY_FAILED_COUNT: 'Don giao that bai',
  INBOUND_COUNT: 'Don nhap hub',
  MONTHLY_SHIPMENTS: 'Van don trong thang',
  NDR_COUNT: 'Don can xu ly giao that bai',
  OUTBOUND_COUNT: 'Don xuat hub',
  PICKUP_COUNT: 'Don lay hang',
  PICKUP_PENDING_COUNT: 'Don cho lay hang',
  RETURNING_COUNT: 'Don dang hoan',
  RETURN_COUNT: 'Don hoan tra',
  SHIPMENT_COUNT: 'Tong van don',
  TOTAL_ORDERS: 'Tong don hang',
  TOTAL_SHIPMENTS: 'Tong van don',
};

const TRACKING_EVENT_SOURCE_LABELS: LabelMap = {
  AUTH_SERVICE: 'Dich vu xac thuc',
  DELIVERY_SERVICE: 'Dich vu giao hang',
  DISPATCH_SERVICE: 'Dich vu dieu phoi',
  GATEWAY_BFF: 'Cong ket noi',
  HUB_SCAN: 'Quet hub',
  MANIFEST_SERVICE: 'Dich vu bao tai',
  MASTERDATA_SERVICE: 'Dich vu du lieu goc',
  OPS_WEB: 'Cong dieu hanh',
  PICKUP_SERVICE: 'Dich vu lay hang',
  REPORTING_SERVICE: 'Dich vu bao cao',
  SCAN_SERVICE: 'Dich vu quet',
  SHIPMENT_SERVICE: 'Dich vu van don',
  SYSTEM: 'He thong',
  TASK_SERVICE: 'Dich vu tac vu',
  TRACKING_SERVICE: 'Dich vu hanh trinh',
};

const TRACKING_EVENT_TYPE_LABELS: LabelMap = {
  DELIVERY_FAILED: 'Giao that bai',
  DELIVERY_SUCCESS: 'Giao thanh cong',
  MANIFEST_RECEIVED: 'Nhan bao tai',
  MANIFEST_SEALED: 'Niem phong bao tai',
  PICKUP_CONFIRMED: 'Lay hang thanh cong',
  PICKUP_REQUESTED: 'Yeu cau lay hang',
  SCAN_INBOUND: 'Quet nhap hub',
  SCAN_OUTBOUND: 'Quet xuat hub',
  SHIPMENT_CREATED: 'Tao van don',
  SHIPMENT_UPDATED: 'Cap nhat van don',
  TASK_ASSIGNED: 'Phan cong tac vu',
  TASK_REASSIGNED: 'Phan cong lai tac vu',
};

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function translateByTokens(code: string): string {
  const tokens = code.split(/[^A-Z0-9]+/).filter(Boolean);
  const translatedTokens = tokens
    .map((token) => TOKEN_LABELS[token])
    .filter(Boolean);

  if (translatedTokens.length === 0) {
    return UNKNOWN_LABEL;
  }

  return capitalizeWords(translatedTokens.join(' '));
}

function formatMappedLabel(value: string | null | undefined, map: LabelMap): string {
  if (!value || value.trim().length === 0) {
    return EMPTY_LABEL;
  }

  const normalized = normalizeCode(value);
  return map[normalized] ?? translateByTokens(normalized);
}

export function formatRoleLabel(role: string | null | undefined): string {
  return formatMappedLabel(role, ROLE_LABELS);
}

export function formatShipmentStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, SHIPMENT_STATUS_LABELS);
}

export function formatTaskStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, TASK_STATUS_LABELS);
}

export function formatTaskTypeLabel(taskType: string | null | undefined): string {
  return formatMappedLabel(taskType, TASK_TYPE_LABELS);
}

export function formatPickupStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, PICKUP_STATUS_LABELS);
}

export function formatManifestStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, MANIFEST_STATUS_LABELS);
}

export function formatNdrStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, NDR_STATUS_LABELS);
}

export function formatScanTypeLabel(scanType: string | null | undefined): string {
  return formatMappedLabel(scanType, SCAN_TYPE_LABELS);
}

export function formatUserStatusLabel(status: string | null | undefined): string {
  return formatMappedLabel(status, USER_STATUS_LABELS);
}

export function formatServiceTypeLabel(serviceType: string | null | undefined): string {
  return formatMappedLabel(serviceType, SERVICE_TYPE_LABELS);
}

export function formatTrackingEventTypeLabel(eventType: string | null | undefined): string {
  return formatMappedLabel(eventType, TRACKING_EVENT_TYPE_LABELS);
}

export function formatTrackingEventSourceLabel(source: string | null | undefined): string {
  return formatMappedLabel(source, TRACKING_EVENT_SOURCE_LABELS);
}

export function formatKpiLabel(key: string | null | undefined): string {
  return formatMappedLabel(key, KPI_LABELS);
}

export function formatAnyCodeLabel(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return EMPTY_LABEL;
  }

  return translateByTokens(normalizeCode(value));
}
