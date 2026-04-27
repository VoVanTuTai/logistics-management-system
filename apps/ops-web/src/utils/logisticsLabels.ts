type LabelMap = Record<string, string>;

const EMPTY_LABEL = 'Không có';
const UNKNOWN_LABEL = 'Không xác định';

const TOKEN_LABELS: LabelMap = {
  ACTIVE: 'hoạt động',
  ADMIN: 'quản trị',
  APPROVED: 'đã duyệt',
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
  SEALED: 'đã niêm phong',
  SERVICE: 'dịch vụ',
  SHIPMENT: 'vận đơn',
  SHIPPER: 'shipper',
  SOURCE: 'nguồn',
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
  MANIFEST_SEALED: 'Đã niêm phong bao',
  NDR_CREATED: 'Cần xử lý giao thất bại',
  OUT_FOR_DELIVERY: 'Đang giao hàng',
  PICKUP_COMPLETED: 'Đã lấy hàng',
  RETURN_COMPLETED: 'Hoàn hàng thành công',
  RETURN_STARTED: 'Bắt đầu hoàn hàng',
  SCAN_INBOUND: 'Đã quét nhập hub',
  SCAN_OUTBOUND: 'Đã quét xuất hub',
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
  NDR: 'Xử lý giao thất bại',
  PICKUP: 'Lấy hàng',
  RETURN: 'Hoàn hàng',
};

const PICKUP_STATUS_LABELS: LabelMap = {
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn tất',
  REJECTED: 'Từ chối',
  REQUESTED: 'Chờ duyệt',
};

const MANIFEST_STATUS_LABELS: LabelMap = {
  CANCELLED: 'Đã hủy',
  CLOSED: 'Đã đóng',
  CREATED: 'Mới tạo',
  IN_TRANSIT: 'Đang trung chuyển',
  OPEN: 'Đang mở',
  RECEIVED: 'Đã nhận bàn giao',
  SEALED: 'Đã niêm phong',
};

const NDR_STATUS_LABELS: LabelMap = {
  CLOSED: 'Đã đóng',
  OPEN: 'Đang xử lý',
  RESCHEDULED: 'Đã đổi lịch giao',
  RESOLVED: 'Đã xử lý',
  RETURNING: 'Đang hoàn hàng',
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
  OPS_MANAGER: 'Quản lý điều hành',
  OPS_STAFF: 'Nhân viên điều hành',
  SHIPPER: 'Shipper',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
};

const KPI_LABELS: LabelMap = {
  DELIVERY_ATTEMPTS: 'Lần giao hàng',
  DELIVERIES_DELIVERED: 'Đơn giao thành công',
  DELIVERIES_FAILED: 'Đơn giao thất bại',
  FAILURE_RATE: 'Tỷ lệ thất bại (%)',
  NDR_CREATED: 'Đơn cần xử lý NDR',
  PICKUPS_COMPLETED: 'Đơn lấy hàng thành công',
  SCANS_INBOUND: 'Đơn nhập hub',
  SCANS_OUTBOUND: 'Đơn xuất hub',
  SHIPMENTS_CREATED: 'Đơn mới tạo',
  SUCCESS_RATE: 'Tỷ lệ thành công (%)',
  CANCELLED_COUNT: 'Đơn đã hủy',
  COMPLETED_COUNT: 'Đơn hoàn tất',
  CREATED_COUNT: 'Đơn mới tạo',
  DAILY_SHIPMENTS: 'Vận đơn trong ngày',
  DELIVERED_COUNT: 'Đơn giao thành công',
  DELIVERY_FAILED_COUNT: 'Đơn giao thất bại',
  INBOUND_COUNT: 'Đơn nhập hub',
  MONTHLY_SHIPMENTS: 'Vận đơn trong tháng',
  NDR_COUNT: 'Đơn cần xử lý giao thất bại',
  OUTBOUND_COUNT: 'Đơn xuất hub',
  PICKUP_COUNT: 'Đơn lấy hàng',
  PICKUP_PENDING_COUNT: 'Đơn chờ lấy hàng',
  RETURNING_COUNT: 'Đơn đang hoàn',
  RETURN_COUNT: 'Đơn hoàn trả',
  SHIPMENT_COUNT: 'Tổng vận đơn',
  TOTAL_ORDERS: 'Tổng đơn hàng',
  TOTAL_SHIPMENTS: 'Tổng vận đơn',
};

const TRACKING_EVENT_SOURCE_LABELS: LabelMap = {
  AUTH_SERVICE: 'Dịch vụ xác thực',
  DELIVERY_SERVICE: 'Dịch vụ giao hàng',
  DISPATCH_SERVICE: 'Dịch vụ điều phối',
  GATEWAY_BFF: 'Cổng kết nối',
  HUB_SCAN: 'Quét hub',
  MANIFEST_SERVICE: 'Dịch vụ bao tải',
  MASTERDATA_SERVICE: 'Dịch vụ dữ liệu gốc',
  OPS_WEB: 'Cổng điều hành',
  PICKUP_SERVICE: 'Dịch vụ lấy hàng',
  REPORTING_SERVICE: 'Dịch vụ báo cáo',
  SCAN_SERVICE: 'Dịch vụ quét',
  SHIPMENT_SERVICE: 'Dịch vụ vận đơn',
  SYSTEM: 'Hệ thống',
  TASK_SERVICE: 'Dịch vụ tác vụ',
  TRACKING_SERVICE: 'Dịch vụ hành trình',
};

const TRACKING_EVENT_TYPE_LABELS: LabelMap = {
  DELIVERY_FAILED: 'Giao thất bại',
  DELIVERY_SUCCESS: 'Giao thành công',
  MANIFEST_RECEIVED: 'Nhận bao tải',
  MANIFEST_SEALED: 'Niêm phong bao tải',
  PICKUP_CONFIRMED: 'Lấy hàng thành công',
  PICKUP_REQUESTED: 'Yêu cầu lấy hàng',
  SCAN_INBOUND: 'Quét nhập hub',
  SCAN_OUTBOUND: 'Quét xuất hub',
  SHIPMENT_CREATED: 'Tạo vận đơn',
  SHIPMENT_UPDATED: 'Cập nhật vận đơn',
  TASK_ASSIGNED: 'Phân công tác vụ',
  TASK_REASSIGNED: 'Phân công lại tác vụ',
};

function normalizeCode(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .toUpperCase();
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
