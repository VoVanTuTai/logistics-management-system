import type { OpsUserDto } from '../../../../features/auth/auth.types';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { formatDateTime } from '../../../../utils/format';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';

export const FINAL_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
  'RETURNED',
  'RETURN_COMPLETED',
  'LOST',
]);

export const INVENTORY_SCAN_STATUS = 'INVENTORY_CHECK';
export const UNKNOWN_COURIER_ID = 'CHUA_XAC_DINH';

export const COURIER_PROBLEM_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
]);

export const COURIER_PROBLEM_NDR_STATUSES = new Set([
  'CREATED',
  'PENDING_RESOLUTION',
  'RESCHEDULED',
  'RETURN_REQUESTED',
  'OPEN',
  'RETURNING',
]);

export const RETURN_RECORDED_STATUSES = new Set(['RETURN_STARTED', 'RETURNING', INVENTORY_SCAN_STATUS]);
export const RETURN_RECORDED_NDR_STATUSES = new Set(['RETURN_REQUESTED', 'RETURNING']);
export const DELIVERY_SUCCESS_STATUSES = new Set(['DELIVERED', 'DELIVERY_COMPLETED']);
export const DELIVERY_FAILED_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
  INVENTORY_SCAN_STATUS,
]);

export type InventoryAuditStatus = 'SCANNED_TODAY' | 'MISSING_SCAN';
export type InventoryFilter = 'ALL' | InventoryAuditStatus | 'COURIER_PROBLEM';
export type ResponsiblePartyFilter = 'ALL' | 'COURIER' | 'OPS_WAREHOUSE' | 'OPS_INBOUND';
export type AgingTier = 'ALL' | 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H';

export interface LastActorInfo {
  partyType: 'COURIER' | 'OPS_WAREHOUSE' | 'OPS_INBOUND';
  partyTypeLabel: string;
  actorId: string;
  actorName: string;
  phone: string | null;
  lastActionTitle: string;
  lastActionAt: string | null;
  lastActionDetail: string;
  closingChecklist: string;
  isCourierUnreturned: boolean;
  isWarehouseMissed: boolean;
}

export interface InventoryAuditRow {
  shipment: ShipmentListItemDto;
  hubCode: string;
  customerName: string;
  receiverPhone: string | null;
  status: string;
  statusLabel: string;
  auditStatus: InventoryAuditStatus;
  inventoryScannedAt: string | null;
  missingReason: string;
  cumulativeAgeHours: number | null;
  lastUpdateAgeHours: number | null;
  agingTier: 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H';
  lastActor: LastActorInfo;
}

export interface CourierProblemRow {
  shipment: ShipmentListItemDto;
  task: TaskListItemDto | null;
  ndr: NdrCaseListItemDto | null;
  courierId: string;
  hubCode: string;
  issueLabel: string;
  returnRecordedAt: string | null;
  inventoryCheckedAfterReturnAt: string | null;
  updatedAt: string | null;
}

export interface CourierHubGroup {
  courierId: string;
  courierName: string;
  phone: string | null;
  hubCodes: string[];
  deliveryToday: number;
  deliveredSuccess: number;
  deliveryFailed: number;
  inventoryChecked: number;
  missingScans: number;
  problemTotal: number;
  oldestHours: number | null;
  isKnownCourier: boolean;
}

export function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date);
}

export function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

export function formatAge(value: string | null | undefined): string {
  const hours = ageHours(value);
  return formatAgeHours(hours);
}

export function formatAgeHours(hours: number | null): string {
  if (hours === null) {
    return 'Không rõ';
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return days > 0 ? `${days} ngày ${remainingHours} giờ` : `${hours} giờ`;
}

export function resolveAgingTier(hours: number | null): 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H' {
  if (hours === null || hours < 24) {
    return 'UNDER_24H';
  }
  if (hours < 48) {
    return '24H_TO_48H';
  }
  if (hours < 72) {
    return '48H_TO_72H';
  }
  return 'OVER_72H';
}

export function formatAgingTierLabel(tier: 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H'): string {
  switch (tier) {
    case 'UNDER_24H':
      return 'Trong ngày (<24h)';
    case '24H_TO_48H':
      return 'Tồn 1-2 ngày (24-48h)';
    case '48H_TO_72H':
      return 'Tồn 2-3 ngày (48-72h)';
    case 'OVER_72H':
      return 'Tồn >3 ngày (Quá hạn SLA)';
  }
}

export function resolveInventoryHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

export function isInventoryShipment(shipment: ShipmentListItemDto): boolean {
  return !FINAL_STATUSES.has(normalizeCode(shipment.currentStatus));
}

export function isInventoryScannedOnDate(shipment: ShipmentListItemDto, inventoryDate: string): boolean {
  const meta = (shipment.metadata as Record<string, unknown> | null | undefined) ?? {};
  const lastInventoryAudit = meta.lastInventoryAudit as Record<string, unknown> | undefined;
  const auditDate =
    typeof lastInventoryAudit?.auditedAt === 'string'
      ? toDateKey(lastInventoryAudit.auditedAt)
      : null;

  return (
    (normalizeCode(shipment.currentStatus) === INVENTORY_SCAN_STATUS &&
      toDateKey(shipment.updatedAt) === inventoryDate) ||
    auditDate === inventoryDate
  );
}

export function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    const shipmentCode = normalizeCode(task.shipmentCode);
    if (!shipmentCode) {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || (task.updatedAt ?? '') > (previous.updatedAt ?? '')) {
      result.set(shipmentCode, task);
    }
  }

  return result;
}

export function buildNdrByShipment(ndrCases: NdrCaseListItemDto[]): Map<string, NdrCaseListItemDto> {
  const result = new Map<string, NdrCaseListItemDto>();

  for (const ndr of ndrCases) {
    const shipmentCode = normalizeCode(ndr.shipmentCode);
    if (!shipmentCode) {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || ndr.updatedAt > previous.updatedAt) {
      result.set(shipmentCode, ndr);
    }
  }

  return result;
}

export function buildShipmentByCode(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const result = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    result.set(normalizeCode(shipment.shipmentCode), shipment);
  }

  return result;
}

export function timestampIsAfterOrSame(value: string | null, basis: string | null): boolean {
  if (!value || !basis) {
    return false;
  }

  const valueTime = new Date(value).getTime();
  const basisTime = new Date(basis).getTime();

  return !Number.isNaN(valueTime) && !Number.isNaN(basisTime) && valueTime >= basisTime;
}

export function resolveLastActorInfo(
  shipment: ShipmentListItemDto,
  task: TaskListItemDto | null,
  ndr: NdrCaseListItemDto | null,
  userByUsername: Map<string, OpsUserDto>,
): LastActorInfo {
  const shipmentStatus = normalizeCode(shipment.currentStatus);
  const ndrStatus = normalizeCode(ndr?.status);

  const hasCourierDelivery = Boolean(
    task?.assignedCourierId ||
      ndr?.reportedBy ||
      COURIER_PROBLEM_STATUSES.has(shipmentStatus) ||
      (ndr && COURIER_PROBLEM_NDR_STATUSES.has(ndrStatus)),
  );

  const inventoryCheckedAt =
    shipmentStatus === INVENTORY_SCAN_STATUS ? shipment.updatedAt : null;
  const courierActionAt = ndr?.updatedAt ?? task?.updatedAt ?? null;

  const hasReturnedAndScannedAfterCourier = Boolean(
    inventoryCheckedAt && courierActionAt && timestampIsAfterOrSame(inventoryCheckedAt, courierActionAt),
  );

  if (hasCourierDelivery && !hasReturnedAndScannedAfterCourier) {
    const courierId = normalizeCode(task?.assignedCourierId || ndr?.reportedBy || UNKNOWN_COURIER_ID);
    const courierUser = userByUsername.get(courierId);
    const courierName =
      courierUser?.displayName || (courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định bưu tá' : courierId);
    const phone = courierUser?.phone || null;
    const actionAt = courierActionAt ?? shipment.updatedAt;

    let actionTitle = 'Nhận đơn đi phát';
    let actionDetail =
      task?.note ||
      shipment.deliveryNote ||
      (task?.taskCode ? `Mã task: ${task.taskCode}` : 'Đang phụ trách tuyến phát');

    if (ndr) {
      actionTitle = `Giao bất thành (${ndr.reasonCode || 'NDR'})`;
      actionDetail = `Lý do: ${ndr.reasonCode || 'Chưa rõ'}${
        ndr.note ? ` · Ghi chú: ${ndr.note}` : ''
      } (NDR: ${formatNdrStatusLabel(ndr.status)})`;
    } else if (shipmentStatus === 'DELIVERY_FAILED') {
      actionTitle = 'Giao hàng thất bại';
      actionDetail = task?.note || shipment.deliveryNote || 'Chưa hoàn tất giao, chưa có quét trả kho';
    } else if (shipmentStatus === 'RETURN_STARTED' || shipmentStatus === 'RETURNING') {
      actionTitle = 'Bưu tá báo chuyển hoàn';
      actionDetail = 'Đang trên đường mang về bưu cục hoặc chưa nộp lại thủ kho';
    }

    const closingChecklist = `Liên hệ ngay Bưu tá ${courierName}${
      phone ? ` (SĐT: ${phone})` : ''
    }: Kiểm tra cốp xe / túi hàng và hỏi trực tiếp đã mang hàng về hub bàn giao lại thủ kho chưa!`;

    return {
      partyType: 'COURIER',
      partyTypeLabel: 'Bưu tá (Chưa hoàn kho)',
      actorId: courierId,
      actorName: courierName,
      phone,
      lastActionTitle: actionTitle,
      lastActionAt: actionAt,
      lastActionDetail: actionDetail,
      closingChecklist,
      isCourierUnreturned: true,
      isWarehouseMissed: false,
    };
  }

  if (
    shipmentStatus === 'INVENTORY_CHECK' ||
    shipmentStatus === 'SCAN_INBOUND' ||
    shipmentStatus === 'MANIFEST_RECEIVED' ||
    shipmentStatus === 'MANIFEST_UNSEALED'
  ) {
    const isScanCheck = shipmentStatus === 'INVENTORY_CHECK';
    const actionTitle = isScanCheck ? 'Quét kiểm kê tồn kho' : 'Quét nhập kho bưu cục';
    const originHub = shipment.originHubCode || 'Hub gửi';

    return {
      partyType: 'OPS_WAREHOUSE',
      partyTypeLabel: 'Kho Ops (Lưu kho trạm)',
      actorId: 'OPS_WAREHOUSE',
      actorName: 'Thủ kho / NV Soát hàng bưu cục',
      phone: null,
      lastActionTitle: actionTitle,
      lastActionAt: shipment.updatedAt,
      lastActionDetail: isScanCheck
        ? `Đã quét kiểm tồn lúc ${formatDateTime(shipment.updatedAt)}.`
        : `Kiện hàng đã nhập kho từ tuyến trung chuyển ${originHub}.`,
      closingChecklist: isScanCheck
        ? 'Đã khớp kiểm kê tồn vật lý tại trạm ca 22h.'
        : 'Kiểm tra trên giá kệ lưu trữ bưu cục hoặc khay phân tuyến phát sáng mai, thực hiện bắn barcode bổ sung vào danh sách kiểm kê ca 22h.',
      isCourierUnreturned: false,
      isWarehouseMissed: !isScanCheck,
    };
  }

  if (shipmentStatus === 'CREATED' || shipmentStatus === 'PICKUP_COMPLETED') {
    return {
      partyType: 'OPS_WAREHOUSE',
      partyTypeLabel: 'Kho nhận / Tạo mới',
      actorId: 'OPS_ORIGIN',
      actorName: 'Nhân viên giao dịch bưu cục',
      phone: null,
      lastActionTitle: 'Tiếp nhận gửi hàng tại quầy',
      lastActionAt: shipment.createdAt,
      lastActionDetail: `Tạo đơn lúc ${formatDateTime(shipment.createdAt)}. Chưa phát sinh quét luân chuyển tiếp theo.`,
      closingChecklist: 'Kiểm tra khu vực gom hàng gửi đi, tiến hành đóng bao/bắn manifest chuyển tiếp sang trung tâm phân loại hoặc lưu kho an toàn.',
      isCourierUnreturned: false,
      isWarehouseMissed: true,
    };
  }

  if (shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'SEND_GOODS') {
    const originHub = shipment.originHubCode || 'Hub gửi';
    return {
      partyType: 'OPS_INBOUND',
      partyTypeLabel: 'Trung chuyển (Đến trạm)',
      actorId: 'OPS_LINEHAUL',
      actorName: 'Tổ xe tải trung chuyển đường trục',
      phone: null,
      lastActionTitle: 'Tiếp nhận hàng trạm (Inbound)',
      lastActionAt: shipment.updatedAt,
      lastActionDetail: `Dỡ hàng từ xe tải trung chuyển tuyến ${originHub} lúc ${formatDateTime(
        shipment.updatedAt,
      )}.`,
      closingChecklist: `Hàng mới về trạm từ ${originHub}. Kiểm tra khu vực sàn dỡ hàng, sọt hàng trung chuyển chờ phân loại lên kệ.`,
      isCourierUnreturned: false,
      isWarehouseMissed: false,
    };
  }

  return {
    partyType: 'OPS_WAREHOUSE',
    partyTypeLabel: 'Kho Ops quản lý',
    actorId: 'OPS_STAFF',
    actorName: 'Ops phụ trách kho',
    phone: null,
    lastActionTitle: formatShipmentStatusLabel(shipment.currentStatus),
    lastActionAt: shipment.updatedAt,
    lastActionDetail: 'Chưa có dữ liệu quét kiểm tồn trong ca chốt 22h hôm nay.',
    closingChecklist: 'Kiểm tra vị trí thực tế tại bưu cục, đối chiếu danh mục kiện lưu trữ.',
    isCourierUnreturned: false,
    isWarehouseMissed: false,
  };
}

export function resolveCourierProblemRow(
  row: InventoryAuditRow,
  taskByShipment: Map<string, TaskListItemDto>,
  ndrByShipment: Map<string, NdrCaseListItemDto>,
): CourierProblemRow | null {
  const shipmentCode = normalizeCode(row.shipment.shipmentCode);
  const task = taskByShipment.get(shipmentCode) ?? null;
  const ndr = ndrByShipment.get(shipmentCode) ?? null;
  const shipmentStatus = normalizeCode(row.shipment.currentStatus);
  const ndrStatus = normalizeCode(ndr?.status);
  const isProblem =
    COURIER_PROBLEM_STATUSES.has(shipmentStatus) ||
    (ndr ? COURIER_PROBLEM_NDR_STATUSES.has(ndrStatus) : false);

  if (!isProblem) {
    return null;
  }

  const returnRecordedAt =
    RETURN_RECORDED_NDR_STATUSES.has(ndrStatus)
      ? ndr?.updatedAt ?? null
      : RETURN_RECORDED_STATUSES.has(shipmentStatus)
      ? row.shipment.updatedAt
      : null;
  const inventoryCheckedAt =
    normalizeCode(row.shipment.currentStatus) === INVENTORY_SCAN_STATUS ? row.shipment.updatedAt : null;
  const inventoryCheckedAfterReturnAt = timestampIsAfterOrSame(inventoryCheckedAt, returnRecordedAt)
    ? inventoryCheckedAt
    : null;
  const issueLabel = ndr?.reasonCode
    ? `NDR ${ndr.reasonCode}`
    : formatShipmentStatusLabel(row.shipment.currentStatus);

  return {
    shipment: row.shipment,
    task,
    ndr,
    courierId: normalizeCode(task?.assignedCourierId) || UNKNOWN_COURIER_ID,
    hubCode: row.hubCode,
    issueLabel,
    returnRecordedAt,
    inventoryCheckedAfterReturnAt,
    updatedAt: ndr?.updatedAt ?? row.shipment.updatedAt,
  };
}

export function createEmptyCourierHubGroup(
  courierId: string,
  courierName: string,
  phone: string | null,
  hubCodes: string[],
  isKnownCourier: boolean,
): CourierHubGroup {
  return {
    courierId,
    courierName,
    phone,
    hubCodes,
    deliveryToday: 0,
    deliveredSuccess: 0,
    deliveryFailed: 0,
    inventoryChecked: 0,
    missingScans: 0,
    problemTotal: 0,
    oldestHours: null,
    isKnownCourier,
  };
}

export function buildCourierHubGroups(
  rows: CourierProblemRow[],
  couriers: OpsUserDto[],
  deliveryTasks: TaskListItemDto[],
  shipmentByCode: Map<string, ShipmentListItemDto>,
  scopeShipmentCodes: Set<string>,
  inventoryDate: string,
  responsibleRows: InventoryAuditRow[],
): CourierHubGroup[] {
  const groups = new Map<string, CourierHubGroup>();

  for (const courier of couriers) {
    const courierId = normalizeCode(courier.username);
    if (!courierId) {
      continue;
    }

    groups.set(
      courierId,
      createEmptyCourierHubGroup(
        courierId,
        courier.displayName ?? courier.username,
        courier.phone ?? null,
        courier.hubCodes.map(normalizeCode).filter(Boolean),
        true,
      ),
    );
  }

  for (const row of responsibleRows) {
    if (row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'COURIER') {
      const courierId = row.lastActor.actorId;
      const group =
        groups.get(courierId) ??
        createEmptyCourierHubGroup(
          courierId,
          row.lastActor.actorName,
          row.lastActor.phone,
          [row.hubCode],
          courierId !== UNKNOWN_COURIER_ID,
        );
      group.missingScans += 1;
      groups.set(courierId, group);
    }
  }

  for (const task of deliveryTasks) {
    const shipmentCode = normalizeCode(task.shipmentCode);
    const shipment = shipmentByCode.get(shipmentCode);
    if (!shipment || !scopeShipmentCodes.has(shipmentCode)) {
      continue;
    }

    const courierId = normalizeCode(task.assignedCourierId) || UNKNOWN_COURIER_ID;
    const group =
      groups.get(courierId) ??
      createEmptyCourierHubGroup(
        courierId,
        courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định courier' : courierId,
        null,
        [],
        courierId !== UNKNOWN_COURIER_ID,
      );
    const status = normalizeCode(shipment.currentStatus);

    if (toDateKey(task.updatedAt) === inventoryDate) {
      group.deliveryToday += 1;
      if (DELIVERY_SUCCESS_STATUSES.has(status)) {
        group.deliveredSuccess += 1;
      } else if (DELIVERY_FAILED_STATUSES.has(status)) {
        group.deliveryFailed += 1;
      }
    }

    groups.set(courierId, group);
  }

  for (const row of rows) {
    const courierId = row.courierId;
    const group =
      groups.get(courierId) ??
      createEmptyCourierHubGroup(
        courierId,
        courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định courier' : courierId,
        null,
        [],
        courierId !== UNKNOWN_COURIER_ID,
      );

    group.problemTotal += 1;
    if (row.inventoryCheckedAfterReturnAt) {
      group.inventoryChecked += 1;
    }

    const age = ageHours(row.updatedAt);
    if (age !== null) {
      group.oldestHours = Math.max(group.oldestHours ?? 0, age);
    }

    if (row.hubCode && !group.hubCodes.includes(row.hubCode)) {
      group.hubCodes.push(row.hubCode);
    }

    groups.set(courierId, group);
  }

  return Array.from(groups.values()).sort((left, right) => {
    return (
      right.missingScans - left.missingScans ||
      right.problemTotal - left.problemTotal ||
      (right.oldestHours ?? 0) - (left.oldestHours ?? 0) ||
      left.courierName.localeCompare(right.courierName)
    );
  });
}

export function downloadMissingInventoryCsv(
  rows: InventoryAuditRow[],
  hubScope: string,
  inventoryDate: string,
): void {
  const headers = [
    'Mã vận đơn',
    'Bưu cục phụ trách',
    'Trạng thái đối soát 22h',
    'Nhóm chịu trách nhiệm',
    'Tên người chịu trách nhiệm',
    'ID người chịu trách nhiệm',
    'Số điện thoại người chịu trách nhiệm',
    'Thao tác vận hành cuối',
    'Thời gian thao tác cuối',
    'Tuổi tồn lũy kế (giờ)',
    'Phân tầng tuổi tồn',
    'Hướng dẫn xử lý chốt ca 22h',
    'Trạng thái đơn hàng',
    'Người nhận',
    'Số điện thoại nhận',
    'Địa chỉ nhận',
  ];

  const csvRows = rows.map((row) => [
    `"${row.shipment.shipmentCode}"`,
    `"${row.hubCode}"`,
    `"${row.auditStatus === 'SCANNED_TODAY' ? 'Đã kiểm tồn' : 'KIỂM THIẾU'}"`,
    `"${row.lastActor.partyTypeLabel}"`,
    `"${row.lastActor.actorName.replace(/"/g, '""')}"`,
    `"${row.lastActor.actorId}"`,
    `"${row.lastActor.phone ?? ''}"`,
    `"${row.lastActor.lastActionTitle.replace(/"/g, '""')}"`,
    `"${row.lastActor.lastActionAt ? formatDateTime(row.lastActor.lastActionAt) : ''}"`,
    `"${row.cumulativeAgeHours ?? ''}"`,
    `"${formatAgingTierLabel(row.agingTier)}"`,
    `"${row.lastActor.closingChecklist.replace(/"/g, '""')}"`,
    `"${row.statusLabel}"`,
    `"${(row.shipment.receiverName ?? row.customerName).replace(/"/g, '""')}"`,
    `"${row.shipment.receiverPhone ?? ''}"`,
    `"${(row.shipment.receiverAddress ?? '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...csvRows.map((cols) => cols.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Bang_ke_kiem_thieu_ton_kho_${hubScope}_${inventoryDate}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const exportMissingAuditManifestCsv = (
  rows: InventoryAuditRow[],
  inventoryDate: string,
  hubScope: string,
): void => downloadMissingInventoryCsv(rows, hubScope, inventoryDate);
