type LabelMap = Record<string, string>;

const EMPTY_LABEL = 'Không có';
const UNKNOWN_LABEL = 'Không xác định';

const TOKEN_LABELS: LabelMap = {
  ACTIVE: 'hoạt động',
  ADMIN: 'quản trị',
  APPROVED: 'da duyệt',
  ASSIGNED: 'đã phân công',
  AUTH: 'xác thực',
  BAG: 'bao tải',
  CANCELLED: 'đã hủy',
  CLOSED: 'đã đóng',
  COMPLETED: 'hoàn tất',
  COURIER: 'shipper',
  CREATED: 'mới tạo',
  DELIVERY: 'giao hàng',
  DELIVERED: 'giao thành công',
  DISABLED: 'vô hiệu hóa',
  EVENT: 'sự kiện',
  FAILED: 'thất bại',
  HUB: 'hub',
  INBOUND: 'nhập hub',
  MANIFEST: 'bao tải',
  NDR: 'giao thất bại',
  OPEN: 'đang mở',
  OPS: 'điều hành',
  OUTBOUND: 'xuất hub',
  PENDING: 'đang chờ',
  PICKUP: 'lấy hàng',
  PROCESSING: 'đang xử lý',
  RECEIVED: 'đã nhận',
  REJECTED: 'từ chối',
  REQUESTED: 'cho duyệt',
  RESCHEDULED: 'đổi lịch giao',
  RESOLVED: 'đã xử lý',
  RETURN: 'hoàn hàng',
  RETURNED: 'đã hoàn',
  RETURNING: 'đang hoàn',
  SCAN: 'quét',
  SEALED: 'da niêm phong',
  SERVICE: 'dịch vụ',
  SHIPMENT: 'vận đơn',
  SHIPPER: 'shipper',
  SOURCE: 'nguon',
  STANDARD: 'tiêu chuẩn',
  STATUS: 'trạng thái',
  SUCCESS: 'thành công',
  SYSTEM: 'hệ thống',
  TASK: 'tác vụ',
  UPDATED: 'đã cập nhật',
  USER: 'người dùng',
  ZONE: 'khu vực',
};

const SHIPMENT_STATUS_LABELS: LabelMap = {
  CANCELLED: 'Đã hủy',
  CREATED: 'Mới tạo',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao thất bại',
  IN_TRANSIT: 'Đang trung chuyển',
  MANIFEST_RECEIVED: 'Đã nhận bao',
  MANIFEST_SEALED: 'Da niêm phong bao',
  NDR_CREATED: 'Can xu ly giao thất bại',
  OUT_FOR_DELIVERY: 'Dang giao hàng',
  PICKUP_COMPLETED: 'Da lấy hàng',
  RETURN_COMPLETED: 'Hoan hang thành công',
  RETURN_STARTED: 'Bat dau hoàn hàng',
  SCAN_INBOUND: 'Da quét nhập hub',
  SCAN_OUTBOUND: 'Da quét xuất hub',
  TASK_ASSIGNED: 'Đã phân công giao',
  UPDATED: 'Đã cập nhật',
};

const TASK_STATUS_LABELS: LabelMap = {
  ASSIGNED: 'Đã phân công',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn tất',
  CREATED: 'Mới tạo',
  FAILED: 'Thất bại',
  IN_PROGRESS: 'Đang xử lý',
  PENDING: 'Đang chờ',
};

const TASK_TYPE_LABELS: LabelMap = {
  DELIVERY: 'Giao hàng',
  NDR: 'Xu ly giao thất bại',
  PICKUP: 'Lấy hàng',
  RETURN: 'Hoàn hàng',
};

const PICKUP_STATUS_LABELS: LabelMap = {
  APPROVED: 'Da duyệt',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn tất',
  REJECTED: 'Từ chối',
  REQUESTED: 'Cho duyệt',
};

const MANIFEST_STATUS_LABELS: LabelMap = {
  CANCELLED: 'Đã hủy',
  CLOSED: 'Đã đóng',
  CREATED: 'Mới tạo',
  IN_TRANSIT: 'Đang trung chuyển',
  OPEN: 'Đang mở',
  RECEIVED: 'Da nhận bàn giao',
  SEALED: 'Da niêm phong',
};

const NDR_STATUS_LABELS: LabelMap = {
  CLOSED: 'Đã đóng',
  OPEN: 'Đang xử lý',
  RESCHEDULED: 'Da đổi lịch giao',
  RESOLVED: 'Da xu ly',
  RETURNING: 'Dang hoàn hàng',
};

const SCAN_TYPE_LABELS: LabelMap = {
  INBOUND: 'Nhập hub',
  OUTBOUND: 'Xuất hub',
  PICKUP: 'Lấy hàng',
};

const SERVICE_TYPE_LABELS: LabelMap = {
  EXPRESS: 'Nhanh',
  SAME_DAY: 'Trong ngày',
  STANDARD: 'Tiêu chuẩn',
};

const USER_STATUS_LABELS: LabelMap = {
  ACTIVE: 'Hoạt động',
  DISABLED: 'Vô hiệu hóa',
  LOCKED: 'Bị khóa',
};

const ROLE_LABELS: LabelMap = {
  ADMIN: 'Quản trị',
  OPS: 'Điều hành',
  OPS_MANAGER: 'Quan ly điều hành',
  OPS_STAFF: 'Nhân viên điều hành',
  SHIPPER: 'Shipper',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
};

const KPI_LABELS: LabelMap = {
  CANCELLED_COUNT: 'Don đã hủy',
  COMPLETED_COUNT: 'Don hoàn tất',
  CREATED_COUNT: 'Don mới tạo',
  DAILY_SHIPMENTS: 'Vận đơn trong ngay',
  DELIVERED_COUNT: 'Don giao thành công',
  DELIVERY_FAILED_COUNT: 'Don giao thất bại',
  INBOUND_COUNT: 'Don nhập hub',
  MONTHLY_SHIPMENTS: 'Vận đơn trong thang',
  NDR_COUNT: 'Don can xu ly giao thất bại',
  OUTBOUND_COUNT: 'Don xuất hub',
  PICKUP_COUNT: 'Don lấy hàng',
  PICKUP_PENDING_COUNT: 'Don cho lấy hàng',
  RETURNING_COUNT: 'Don đang hoàn',
  RETURN_COUNT: 'Đơn hoàn trả',
  SHIPMENT_COUNT: 'Tong vận đơn',
  TOTAL_ORDERS: 'Tổng đơn hàng',
  TOTAL_SHIPMENTS: 'Tong vận đơn',
};

const TRACKING_EVENT_SOURCE_LABELS: LabelMap = {
  AUTH_SERVICE: 'Dich vu xác thực',
  DELIVERY_SERVICE: 'Dich vu giao hàng',
  DISPATCH_SERVICE: 'Dịch vụ điều phối',
  GATEWAY_BFF: 'Cổng kết nối',
  HUB_SCAN: 'Quét hub',
  MANIFEST_SERVICE: 'Dich vu bao tải',
  MASTERDATA_SERVICE: 'Dịch vụ dữ liệu gốc',
  OPS_WEB: 'Cong điều hành',
  PICKUP_SERVICE: 'Dich vu lấy hàng',
  REPORTING_SERVICE: 'Dịch vụ báo cáo',
  SCAN_SERVICE: 'Dich vu quét',
  SHIPMENT_SERVICE: 'Dich vu vận đơn',
  SYSTEM: 'Hệ thống',
  TASK_SERVICE: 'Dich vu tác vụ',
  TRACKING_SERVICE: 'Dịch vụ hành trình',
};

const TRACKING_EVENT_TYPE_LABELS: LabelMap = {
  DELIVERY_FAILED: 'Giao thất bại',
  DELIVERY_SUCCESS: 'Giao thành công',
  MANIFEST_RECEIVED: 'Nhan bao tải',
  MANIFEST_SEALED: 'Niem phong bao tải',
  PICKUP_CONFIRMED: 'Lấy hàng thành công',
  PICKUP_REQUESTED: 'Yeu cau lấy hàng',
  SCAN_INBOUND: 'Quet nhập hub',
  SCAN_OUTBOUND: 'Quet xuất hub',
  SHIPMENT_CREATED: 'Tao vận đơn',
  SHIPMENT_UPDATED: 'Cap nhat vận đơn',
  TASK_ASSIGNED: 'Phân công tác vụ',
  TASK_REASSIGNED: 'Phan cong lai tác vụ',
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
