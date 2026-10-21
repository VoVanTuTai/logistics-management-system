import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { authClient } from '../../../../features/auth/auth.client';
import type { OpsUserDto } from '../../../../features/auth/auth.types';
import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
import {
  buildBranchScopeTokens,
  isShipmentInBranchScope,
  normalizeBranchCode,
} from '../../branch-business/shared/branchBusinessData';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import {
  NexusAuditDeficitIcon,
  NexusAuditVerifiedIcon,
  NexusCourierMotorbikeIcon,
  NexusDispatchPhoneIcon,
  NexusWarehouseScanIcon,
} from './NexusAuditIcons';
import './OpsMetricsInventoryMonitorPage.css';

const FINAL_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
  'RETURNED',
  'RETURN_COMPLETED',
  'LOST',
]);

const INVENTORY_SCAN_STATUS = 'INVENTORY_CHECK';
const UNKNOWN_COURIER_ID = 'CHUA_XAC_DINH';

const COURIER_PROBLEM_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
]);

const COURIER_PROBLEM_NDR_STATUSES = new Set([
  'CREATED',
  'PENDING_RESOLUTION',
  'RESCHEDULED',
  'RETURN_REQUESTED',
  'OPEN',
  'RETURNING',
]);

const RETURN_RECORDED_STATUSES = new Set(['RETURN_STARTED', 'RETURNING', INVENTORY_SCAN_STATUS]);
const RETURN_RECORDED_NDR_STATUSES = new Set(['RETURN_REQUESTED', 'RETURNING']);
const DELIVERY_SUCCESS_STATUSES = new Set(['DELIVERED', 'DELIVERY_COMPLETED']);
const DELIVERY_FAILED_STATUSES = new Set([
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

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date);
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function formatAge(value: string | null | undefined): string {
  const hours = ageHours(value);
  return formatAgeHours(hours);
}

function formatAgeHours(hours: number | null): string {
  if (hours === null) {
    return 'Không rõ';
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return days > 0 ? `${days} ngày ${remainingHours} giờ` : `${hours} giờ`;
}

function resolveAgingTier(hours: number | null): 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H' {
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

function formatAgingTierLabel(tier: 'UNDER_24H' | '24H_TO_48H' | '48H_TO_72H' | 'OVER_72H'): string {
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

function resolveInventoryHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

function isInventoryShipment(shipment: ShipmentListItemDto): boolean {
  return !FINAL_STATUSES.has(normalizeCode(shipment.currentStatus));
}

function isInventoryScannedOnDate(shipment: ShipmentListItemDto, inventoryDate: string): boolean {
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

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
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

function buildNdrByShipment(ndrCases: NdrCaseListItemDto[]): Map<string, NdrCaseListItemDto> {
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

function buildShipmentByCode(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const result = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    result.set(normalizeCode(shipment.shipmentCode), shipment);
  }

  return result;
}

function timestampIsAfterOrSame(value: string | null, basis: string | null): boolean {
  if (!value || !basis) {
    return false;
  }

  const valueTime = new Date(value).getTime();
  const basisTime = new Date(basis).getTime();

  return !Number.isNaN(valueTime) && !Number.isNaN(basisTime) && valueTime >= basisTime;
}

function resolveLastActorInfo(
  shipment: ShipmentListItemDto,
  task: TaskListItemDto | null,
  ndr: NdrCaseListItemDto | null,
  userByUsername: Map<string, OpsUserDto>,
): LastActorInfo {
  const shipmentStatus = normalizeCode(shipment.currentStatus);
  const ndrStatus = normalizeCode(ndr?.status);

  // Check if there was courier involvement
  const hasCourierDelivery = Boolean(
    task?.assignedCourierId ||
      ndr?.reportedBy ||
      COURIER_PROBLEM_STATUSES.has(shipmentStatus) ||
      (ndr && COURIER_PROBLEM_NDR_STATUSES.has(ndrStatus)),
  );

  const inventoryCheckedAt =
    shipmentStatus === INVENTORY_SCAN_STATUS ? shipment.updatedAt : null;
  const courierActionAt = ndr?.updatedAt ?? task?.updatedAt ?? null;

  // Did an inventory check occur after courier action?
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

  // Check if previously checked in warehouse (e.g. yesterday)
  const meta = (shipment.metadata as Record<string, unknown> | null | undefined) ?? {};
  const lastInventoryAudit = meta.lastInventoryAudit as Record<string, unknown> | undefined;
  const auditedBy = normalizeCode(
    (typeof lastInventoryAudit?.auditedBy === 'string' && lastInventoryAudit.auditedBy) ||
      (typeof meta.auditedBy === 'string' && meta.auditedBy) ||
      (typeof meta.updatedBy === 'string' && meta.updatedBy) ||
      '',
  );

  if (shipmentStatus === INVENTORY_SCAN_STATUS || auditedBy || lastInventoryAudit) {
    const auditorUser = userByUsername.get(auditedBy);
    const auditorName = auditorUser?.displayName || (auditedBy ? auditedBy : 'Nhân viên kiểm ca trước');
    const phone = auditorUser?.phone || null;
    const actionAt =
      (typeof lastInventoryAudit?.auditedAt === 'string' ? lastInventoryAudit.auditedAt : null) ??
      shipment.updatedAt;

    return {
      partyType: 'OPS_WAREHOUSE',
      partyTypeLabel: 'Kho Ops (Quét sót trên kệ)',
      actorId: auditedBy || 'OPS_AUDITOR',
      actorName: auditorName,
      phone,
      lastActionTitle: 'Đã kiểm tồn kho ca trước',
      lastActionAt: actionAt,
      lastActionDetail: `Đã xác nhận có trong kho lúc ${formatDateTime(
        actionAt,
      )}. Ca chốt 22h hôm nay chưa quét trúng mã tem.`,
      closingChecklist: `Hôm trước nhân viên ${auditorName} đã quét xác nhận còn trong kho. Kiểm tra kỹ Kệ lưu kho, sọt hàng lưu trạm; khả năng cao đặt lệch vị trí hoặc nhân viên ca nay quét sót tem.`,
      isCourierUnreturned: false,
      isWarehouseMissed: true,
    };
  }

  // Check if inbound from transit/trip
  const intakeStaff = meta.intakeStaff as Record<string, unknown> | undefined;
  const createdBy = meta.createdBy as Record<string, unknown> | undefined;
  const intakeUsername = normalizeCode(
    (typeof intakeStaff?.username === 'string' && intakeStaff.username) ||
      (typeof createdBy?.username === 'string' && createdBy.username) ||
      '',
  );

  if (
    shipmentStatus === 'SCAN_INBOUND' ||
    shipmentStatus === 'MANIFEST_RECEIVED' ||
    shipmentStatus === 'PICKUP_COMPLETED' ||
    intakeStaff
  ) {
    const intakeUser = userByUsername.get(intakeUsername);
    const intakeName =
      (typeof intakeStaff?.name === 'string' && intakeStaff.name) ||
      intakeUser?.displayName ||
      (intakeUsername ? intakeUsername : 'Ops tiếp nhận hàng đến');
    const phone = intakeUser?.phone || null;
    const originHub = shipment.originHubCode || shipment.senderHubCode || 'Hub gốc';

    return {
      partyType: 'OPS_INBOUND',
      partyTypeLabel: 'Hàng mới nhập trạm',
      actorId: intakeUsername || 'OPS_INBOUND',
      actorName: intakeName,
      phone,
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

  // Default Ops fallback
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

function resolveCourierProblemRow(
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

function createEmptyCourierHubGroup(
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

function buildCourierHubGroups(
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

  // Count missing scans attributed to couriers
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

    if (status === INVENTORY_SCAN_STATUS && toDateKey(shipment.updatedAt) === inventoryDate) {
      group.inventoryChecked += 1;
    }

    groups.set(courierId, group);
  }

  for (const row of rows) {
    const group =
      groups.get(row.courierId) ??
      createEmptyCourierHubGroup(
        row.courierId,
        row.courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định courier' : row.courierId,
        null,
        [],
        row.courierId !== UNKNOWN_COURIER_ID,
      );
    const rowAge = ageHours(row.updatedAt);

    group.problemTotal += 1;
    group.oldestHours = Math.max(group.oldestHours ?? 0, rowAge ?? 0);
    groups.set(row.courierId, group);
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (right.missingScans !== left.missingScans) {
      return right.missingScans - left.missingScans;
    }

    if (right.deliveryToday !== left.deliveryToday) {
      return right.deliveryToday - left.deliveryToday;
    }

    if (right.deliveryFailed !== left.deliveryFailed) {
      return right.deliveryFailed - left.deliveryFailed;
    }

    if (left.isKnownCourier !== right.isKnownCourier) {
      return left.isKnownCourier ? -1 : 1;
    }

    return left.courierId.localeCompare(right.courierId);
  });
}

function exportMissingAuditManifestCsv(
  rows: InventoryAuditRow[],
  inventoryDate: string,
  hubScope: string,
): void {
  const headers = [
    'Mã vận đơn',
    'Hub chịu trách nhiệm',
    'Kết quả đối soát ca 22h',
    'Bên chịu trách nhiệm',
    'Người thao tác cuối',
    'Mã tài khoản / ID',
    'Số điện thoại',
    'Thao tác cuối cùng',
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

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [inventoryDate, setInventoryDate] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState<InventoryFilter>('COURIER_PROBLEM');
  const [responsiblePartyFilter, setResponsiblePartyFilter] = useState<ResponsiblePartyFilter>('ALL');
  const [agingTierFilter, setAgingTierFilter] = useState<AgingTier>('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken, { refetchInterval: 15000 });

  const allOpenShipments = useMemo(
    () => (shipmentsQuery.data ?? []).filter(isInventoryShipment),
    [shipmentsQuery.data],
  );

  const allScopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const hubOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allOpenShipments
            .filter((shipment) =>
              isShipmentInBranchScope(
                shipment,
                assignedHubCodes,
                allScopeTokens,
                canViewAllHubAreas,
              ),
            )
            .map(resolveInventoryHub),
        ),
      )
        .filter(Boolean)
        .sort(),
    [allOpenShipments, allScopeTokens, assignedHubCodes, canViewAllHubAreas],
  );

  const scopeHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );

  const courierHubCodes = useMemo(() => {
    if (hubFilter !== 'ALL') {
      return [hubFilter].filter(Boolean);
    }

    if (assignedHubCodes.length > 0) {
      return assignedHubCodes;
    }

    return canViewAllHubAreas ? hubOptions : [];
  }, [assignedHubCodes, canViewAllHubAreas, hubFilter, hubOptions]);

  const hubCouriersQuery = useQuery({
    queryKey: [...queryKeys.tasks, 'inventory-hub-couriers', courierHubCodes.join('|')],
    queryFn: async () => {
      const results = await Promise.all(
        courierHubCodes.map((hubCode) =>
          authClient.listUsers(accessToken, {
            roleGroup: 'SHIPPER',
            hubCode,
            status: 'ACTIVE',
          }),
        ),
      );
      const byUsername = new Map<string, OpsUserDto>();

      for (const courier of results.flat()) {
        byUsername.set(normalizeCode(courier.username), courier);
      }

      return Array.from(byUsername.values()).sort((left, right) =>
        normalizeCode(left.username).localeCompare(normalizeCode(right.username)),
      );
    },
    enabled: Boolean(accessToken && courierHubCodes.length > 0),
  });

  const hubOpsUsersQuery = useQuery({
    queryKey: [...queryKeys.tasks, 'inventory-hub-ops-users', courierHubCodes.join('|')],
    queryFn: async () => {
      const results = await Promise.all(
        courierHubCodes.map((hubCode) =>
          authClient.listUsers(accessToken, {
            roleGroup: 'OPS',
            hubCode,
            status: 'ACTIVE',
          }),
        ),
      );
      const byUsername = new Map<string, OpsUserDto>();

      for (const opsUser of results.flat()) {
        byUsername.set(normalizeCode(opsUser.username), opsUser);
      }

      return Array.from(byUsername.values()).sort((left, right) =>
        normalizeCode(left.username).localeCompare(normalizeCode(right.username)),
      );
    },
    enabled: Boolean(accessToken && courierHubCodes.length > 0),
  });

  const userByUsername = useMemo(() => {
    const map = new Map<string, OpsUserDto>();
    for (const courier of hubCouriersQuery.data ?? []) {
      map.set(normalizeCode(courier.username), courier);
    }
    for (const opsUser of hubOpsUsersQuery.data ?? []) {
      map.set(normalizeCode(opsUser.username), opsUser);
    }
    return map;
  }, [hubCouriersQuery.data, hubOpsUsersQuery.data]);

  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], scopeHubCodes),
    [hubsQuery.data, scopeHubCodes],
  );

  const allResponsibleShipments = useMemo(() => {
    return (shipmentsQuery.data ?? []).filter((shipment) =>
      isShipmentInBranchScope(
        shipment,
        scopeHubCodes,
        scopeTokens,
        canViewAllHubAreas && hubFilter === 'ALL',
      ),
    );
  }, [canViewAllHubAreas, hubFilter, scopeHubCodes, scopeTokens, shipmentsQuery.data]);

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const ndrByShipment = useMemo(
    () => buildNdrByShipment(ndrQuery.data ?? []),
    [ndrQuery.data],
  );

  const responsibleRows = useMemo<InventoryAuditRow[]>(() => {
    return allResponsibleShipments
      .filter(isInventoryShipment)
      .map((shipment) => {
        const shipmentCode = normalizeCode(shipment.shipmentCode);
        const task = taskByShipment.get(shipmentCode) ?? null;
        const ndr = ndrByShipment.get(shipmentCode) ?? null;
        const status = normalizeCode(shipment.currentStatus);
        const inventoryScannedAt = isInventoryScannedOnDate(shipment, inventoryDate)
          ? shipment.updatedAt
          : null;
        const auditStatus: InventoryAuditStatus = inventoryScannedAt
          ? 'SCANNED_TODAY'
          : 'MISSING_SCAN';

        const cumulativeAge = ageHours(shipment.createdAt);
        const lastUpdateAge = ageHours(shipment.updatedAt);
        const tier = resolveAgingTier(cumulativeAge);
        const lastActor = resolveLastActorInfo(shipment, task, ndr, userByUsername);

        return {
          shipment,
          hubCode: resolveInventoryHub(shipment),
          customerName: shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có',
          receiverPhone: shipment.receiverPhone ?? null,
          status,
          statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
          auditStatus,
          inventoryScannedAt,
          missingReason:
            status === INVENTORY_SCAN_STATUS
              ? 'Đã có kiểm tồn nhưng ngoài ngày đối soát'
              : 'Chưa ghi nhận quét kiểm tồn trong ngày đối soát',
          cumulativeAgeHours: cumulativeAge,
          lastUpdateAgeHours: lastUpdateAge,
          agingTier: tier,
          lastActor,
        };
      })
      .sort((left, right) => {
        if (left.auditStatus !== right.auditStatus) {
          return left.auditStatus === 'MISSING_SCAN' ? -1 : 1;
        }

        return (right.cumulativeAgeHours ?? 0) - (left.cumulativeAgeHours ?? 0);
      });
  }, [allResponsibleShipments, inventoryDate, ndrByShipment, taskByShipment, userByUsername]);

  const problemByShipment = useMemo(() => {
    const result = new Map<string, CourierProblemRow>();

    for (const row of responsibleRows) {
      const problem = resolveCourierProblemRow(row, taskByShipment, ndrByShipment);
      if (problem) {
        result.set(normalizeCode(row.shipment.shipmentCode), problem);
      }
    }

    return result;
  }, [ndrByShipment, responsibleRows, taskByShipment]);

  const courierProblemRows = useMemo(
    () =>
      Array.from(problemByShipment.values()).sort((left, right) => {
        const courierDelta = left.courierId.localeCompare(right.courierId);
        if (courierDelta !== 0) {
          return courierDelta;
        }

        return (ageHours(right.updatedAt) ?? 0) - (ageHours(left.updatedAt) ?? 0);
      }),
    [problemByShipment],
  );

  const shipmentByCode = useMemo(
    () => buildShipmentByCode(allResponsibleShipments),
    [allResponsibleShipments],
  );

  const scopeShipmentCodes = useMemo(
    () => new Set(allResponsibleShipments.map((shipment) => normalizeCode(shipment.shipmentCode))),
    [allResponsibleShipments],
  );

  const courierHubGroups = useMemo(
    () =>
      buildCourierHubGroups(
        courierProblemRows,
        hubCouriersQuery.data ?? [],
        deliveryTasksQuery.data ?? [],
        shipmentByCode,
        scopeShipmentCodes,
        inventoryDate,
        responsibleRows,
      ),
    [
      courierProblemRows,
      deliveryTasksQuery.data,
      hubCouriersQuery.data,
      inventoryDate,
      responsibleRows,
      scopeShipmentCodes,
      shipmentByCode,
    ],
  );

  const distinctActors = useMemo(() => {
    const courierMap = new Map<string, string>();
    const opsMap = new Map<string, string>();

    for (const row of responsibleRows) {
      if (row.lastActor.partyType === 'COURIER' && row.lastActor.actorId !== UNKNOWN_COURIER_ID) {
        courierMap.set(row.lastActor.actorId, row.lastActor.actorName);
      } else if (
        row.lastActor.partyType === 'OPS_WAREHOUSE' ||
        row.lastActor.partyType === 'OPS_INBOUND'
      ) {
        if (row.lastActor.actorId && row.lastActor.actorId !== 'OPS_STAFF') {
          opsMap.set(row.lastActor.actorId, row.lastActor.actorName);
        }
      }
    }

    return {
      couriers: Array.from(courierMap.entries()).map(([id, name]) => ({ id, name })),
      opsStaff: Array.from(opsMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [responsibleRows]);

  const inventoryRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return responsibleRows.filter((row) => {
      const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;

      const keywordMatched =
        !normalizedKeyword ||
        normalizeText(row.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalizeText(row.hubCode).includes(normalizedKeyword) ||
        normalizeText(row.customerName).includes(normalizedKeyword) ||
        normalizeText(row.receiverPhone).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.actorName).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.actorId).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.phone).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.lastActionTitle).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.lastActionDetail).includes(normalizedKeyword) ||
        normalizeText(problem?.courierId).includes(normalizedKeyword) ||
        normalizeText(problem?.issueLabel).includes(normalizedKeyword);

      const auditMatched =
        auditStatusFilter === 'ALL' ||
        (auditStatusFilter === 'COURIER_PROBLEM' && Boolean(problem)) ||
        row.auditStatus === auditStatusFilter;

      const partyMatched =
        responsiblePartyFilter === 'ALL' || row.lastActor.partyType === responsiblePartyFilter;

      const agingMatched = agingTierFilter === 'ALL' || row.agingTier === agingTierFilter;

      const actorMatched =
        actorFilter === 'ALL' ||
        row.lastActor.actorId === actorFilter ||
        (problem ? problem.courierId === actorFilter : false);

      const courierMatched =
        courierFilter === 'ALL' ||
        row.lastActor.actorId === courierFilter ||
        (problem ? problem.courierId === courierFilter : false);

      return (
        keywordMatched &&
        auditMatched &&
        partyMatched &&
        agingMatched &&
        actorMatched &&
        courierMatched
      );
    });
  }, [
    actorFilter,
    agingTierFilter,
    auditStatusFilter,
    courierFilter,
    keyword,
    problemByShipment,
    responsiblePartyFilter,
    responsibleRows,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    actorFilter,
    agingTierFilter,
    auditStatusFilter,
    courierFilter,
    hubFilter,
    inventoryDate,
    keyword,
    pageSize,
    responsiblePartyFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(inventoryRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => inventoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, inventoryRows, pageSize],
  );

  // Statistics
  const totalInventoryCount = responsibleRows.length;
  const scannedTodayCount = responsibleRows.filter((row) => row.auditStatus === 'SCANNED_TODAY').length;
  const missingScanCount = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN').length;
  const missingDueToCourierCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'COURIER',
  ).length;
  const missingDueToWarehouseCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'OPS_WAREHOUSE',
  ).length;
  const missingDueToInboundCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'OPS_INBOUND',
  ).length;

  const over72hCount = responsibleRows.filter((row) => row.agingTier === 'OVER_72H').length;
  const backlog24to72hCount = responsibleRows.filter(
    (row) => row.agingTier === '24H_TO_48H' || row.agingTier === '48H_TO_72H',
  ).length;
  const backlogOver24hCount = backlog24to72hCount + over72hCount;
  const auditCompliancePercent =
    totalInventoryCount > 0 ? Math.round((scannedTodayCount / totalInventoryCount) * 100) : 100;

  const courierProblemCount = courierProblemRows.length;
  const couriersWithProblemCount = courierHubGroups.filter((group) => group.problemTotal > 0).length;
  const couriersWithDeliveryTodayCount = courierHubGroups.filter((group) => group.deliveryToday > 0).length;
  const deliveryTodayCount = courierHubGroups.reduce((total, group) => total + group.deliveryToday, 0);
  const inventoryCheckedAfterReturnCount = courierProblemRows.filter(
    (row) => row.inventoryCheckedAfterReturnAt,
  ).length;

  const isLoading =
    shipmentsQuery.isLoading ||
    hubsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    ndrQuery.isLoading ||
    hubCouriersQuery.isLoading ||
    hubOpsUsersQuery.isLoading;

  const loadError =
    shipmentsQuery.error ??
    hubsQuery.error ??
    deliveryTasksQuery.error ??
    ndrQuery.error ??
    hubCouriersQuery.error ??
    hubOpsUsersQuery.error ??
    null;

  const scopeText = canViewAllHubAreas
    ? hubFilter === 'ALL'
      ? 'Toàn hệ thống'
      : hubFilter
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa được gán hub';

  const handleExportCsv = () => {
    const missingRows = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN');
    const rowsToExport = missingRows.length > 0 ? missingRows : responsibleRows;
    exportMissingAuditManifestCsv(rowsToExport, inventoryDate, hubFilter === 'ALL' ? 'TOAN_HE_THONG' : hubFilter);
  };

  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__header">
        <div>
          <small>OPS_METRICS_DEADLINE_INVENTORY</small>
          <h2>Tồn kho & SLA lưu kho bưu cục</h2>
          <p>
            Giám sát toàn diện hàng tồn lũy kế từ trước đến nay, đối soát chốt ca 22:00 phát hiện đơn kiểm thiếu,
            và truy vết chính xác vết thao tác cuối cùng của Bưu tá hay Nhân viên Kho Ops.
          </p>
        </div>
        <div className="ops-metrics-inventory__header-actions">
          <div className="ops-metrics-inventory__scope">
            <span>Phạm vi chịu trách nhiệm</span>
            <strong>{scopeText}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              void shipmentsQuery.refetch();
              void hubsQuery.refetch();
              void deliveryTasksQuery.refetch();
              void ndrQuery.refetch();
              void hubCouriersQuery.refetch();
              void hubOpsUsersQuery.refetch();
            }}
          >
            Làm mới
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <section className="ops-metrics-inventory__summary">
        <article>
          <span>Tổng tồn lũy kế</span>
          <strong>{totalInventoryCount}</strong>
          <small>{backlogOver24hCount} đơn tồn từ trước ({over72hCount} quá hạn SLA)</small>
        </article>
        <article data-tone="danger">
          <span>Chốt ca 22h: Kiểm thiếu</span>
          <strong>{missingScanCount}</strong>
          <small>{scannedTodayCount} đã quét (Đạt {auditCompliancePercent}%)</small>
        </article>
        <article data-tone="warning">
          <span>Bưu tá chưa trả kho</span>
          <strong>{missingDueToCourierCount}</strong>
          <small>Cần đối soát xe/túi hàng</small>
        </article>
        <article data-tone="info">
          <span>Kho nghi quét sót</span>
          <strong>{missingDueToWarehouseCount}</strong>
          <small>Hôm qua có kiểm, tìm trên kệ</small>
        </article>
        <article data-tone="success">
          <span>Đã kiểm tồn hôm nay</span>
          <strong>{scannedTodayCount}</strong>
          <small>{inventoryCheckedAfterReturnCount} kiện sau hoàn hàng</small>
        </article>
        <article data-tone="alarm">
          <span>Báo động quá hạn &gt;72h</span>
          <strong>{over72hCount}</strong>
          <small>Vượt trần SLA lưu kho</small>
        </article>
      </section>

      {/* Dedicated Shift Closing 22:00 SOP Banner */}
      <section className="ops-metrics-inventory__closing-banner">
        <div className="ops-metrics-inventory__closing-banner-content">
          <div className="ops-metrics-inventory__closing-banner-title">
            <span className="ops-metrics-inventory__closing-badge">SOP CHỐT CA 22:00</span>
            <h4>Biên bản đối soát &amp; Kiểm thiếu tồn kho ca tối</h4>
          </div>
          <p>
            Quy chuẩn chốt ca 22:00: Đối chiếu toàn bộ <strong>{totalInventoryCount}</strong> đơn tồn lý thuyết với{' '}
            <strong>{scannedTodayCount}</strong> đơn thực quét tại sàn kho. Phát hiện{' '}
            <strong>{missingScanCount} đơn kiểm thiếu</strong>:{' '}
            <strong className="text-warning">{missingDueToCourierCount} đơn</strong> do Bưu tá chưa hoàn kho (giao bất thành/đang cầm hàng) và{' '}
            <strong className="text-danger">{missingDueToWarehouseCount} đơn</strong> do Kho quét sót (đã kiểm ca trước, cần tìm trên kệ).
            {missingDueToInboundCount > 0 ? ` Ngoài ra có ${missingDueToInboundCount} kiện hàng mới nhập trạm chưa phân loại.` : ''}
          </p>
        </div>
        <div className="ops-metrics-inventory__closing-banner-actions">
          <button
            type="button"
            className="ops-metrics-inventory__btn-quick-filter"
            onClick={() => {
              setAuditStatusFilter('MISSING_SCAN');
              setResponsiblePartyFilter('ALL');
              setAgingTierFilter('ALL');
              setCourierFilter('ALL');
              setActorFilter('ALL');
            }}
          >
            Lọc {missingScanCount} đơn kiểm thiếu
          </button>
          <button
            type="button"
            className="ops-metrics-inventory__btn-export"
            onClick={handleExportCsv}
          >
            Xuất bảng kê kiểm thiếu (CSV)
          </button>
        </div>
      </section>

      {/* Multi-dimensional Filters */}
      <section className="ops-metrics-inventory__filters">
        <label>
          <span>Ngày kiểm tồn</span>
          <input
            type="date"
            value={inventoryDate}
            onChange={(event) => setInventoryDate(event.target.value)}
          />
        </label>
        <label>
          <span>Hub chịu trách nhiệm</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả hub</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Nhóm đối soát ca chốt</span>
          <select
            value={auditStatusFilter}
            onChange={(event) => setAuditStatusFilter(event.target.value as InventoryFilter)}
          >
            <option value="ALL">Tất cả hàng tồn lũy kế</option>
            <option value="MISSING_SCAN">[KIỂM THIẾU] Đơn chốt ca 22:00</option>
            <option value="SCANNED_TODAY">[ĐÃ KIỂM TỒN] Đã quét hôm nay</option>
            <option value="COURIER_PROBLEM">[BẤT THƯỜNG] Kiện phát NDR</option>
          </select>
        </label>
        <label>
          <span>Bên chịu trách nhiệm</span>
          <select
            value={responsiblePartyFilter}
            onChange={(event) => setResponsiblePartyFilter(event.target.value as ResponsiblePartyFilter)}
          >
            <option value="ALL">Tất cả bên chịu trách nhiệm</option>
            <option value="COURIER">Bưu tá (Chưa trả kho / Đi phát bất thành)</option>
            <option value="OPS_WAREHOUSE">Kho Ops (Quét sót trên kệ / Đã kiểm hôm qua)</option>
            <option value="OPS_INBOUND">Hàng mới nhập trạm (Chưa lên kệ)</option>
          </select>
        </label>
        <label>
          <span>Tuổi tồn kho lũy kế</span>
          <select
            value={agingTierFilter}
            onChange={(event) => setAgingTierFilter(event.target.value as AgingTier)}
          >
            <option value="ALL">Tất cả tuổi tồn</option>
            <option value="UNDER_24H">Trong ngày (&lt; 24 giờ)</option>
            <option value="24H_TO_48H">Tồn 1 - 2 ngày (24h - 48h)</option>
            <option value="48H_TO_72H">Tồn 2 - 3 ngày (48h - 72h)</option>
            <option value="OVER_72H">Tồn &gt; 3 ngày (Quá hạn SLA)</option>
          </select>
        </label>
        <label>
          <span>Người phụ trách cụ thể</span>
          <select
            value={actorFilter}
            onChange={(event) => {
              setActorFilter(event.target.value);
              setCourierFilter(event.target.value);
            }}
          >
            <option value="ALL">Tất cả nhân sự</option>
            {distinctActors.couriers.length > 0 && (
              <optgroup label="Bưu tá giao nhận">
                {distinctActors.couriers.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    [Bưu tá] {actor.name} ({actor.id})
                  </option>
                ))}
              </optgroup>
            )}
            {distinctActors.opsStaff.length > 0 && (
              <optgroup label="Nhân viên Kho / Ops">
                {distinctActors.opsStaff.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    [Kho/Ops] {actor.name} ({actor.id})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="ops-metrics-inventory__filter-full">
          <span>Tìm kiếm đa tiêu chí</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, họ tên Bưu tá / Ops, SĐT bưu tá, người nhận, lý do NDR..."
          />
        </label>
      </section>

      {/* Courier & Responsibility Breakdown Panel */}
      <section className="ops-metrics-inventory__courier-panel">
        <header className="ops-metrics-inventory__panel-head">
          <div>
            <h3>Trách nhiệm Bưu tá theo Hub (Đối soát chốt ca 22:00)</h3>
            <small>
              {isLoading
                ? 'Đang tải...'
                : `${courierHubGroups.length} bưu tá thuộc phạm vi · ${couriersWithDeliveryTodayCount} có lượt phát hôm nay · ${missingDueToCourierCount} đơn kiểm thiếu chưa hoàn kho`}
            </small>
          </div>
          <button
            type="button"
            className="ops-metrics-inventory__ghost-button"
            onClick={() => {
              setCourierFilter('ALL');
              setActorFilter('ALL');
              setAuditStatusFilter('COURIER_PROBLEM');
            }}
          >
            Xem toàn bộ
          </button>
        </header>
        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải danh sách bưu tá và dữ liệu NDR...</p>
        ) : null}
        {!isLoading && courierHubGroups.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Chưa tìm thấy courier ACTIVE thuộc phạm vi hub hiện tại.</p>
        ) : null}
        {courierHubGroups.length > 0 ? (
          <div className="ops-metrics-inventory__courier-list">
            <table className="ops-metrics-inventory__courier-table">
              <thead>
                <tr>
                  <th>Bưu tá phụ trách</th>
                  <th>Số điện thoại</th>
                  <th>Đơn thiếu ca 22h</th>
                  <th>Lượt phát</th>
                  <th>Phát thành công</th>
                  <th>Phát bất thành</th>
                  <th>Đã kiểm kho lại</th>
                  <th>Tồn lâu nhất</th>
                </tr>
              </thead>
              <tbody>
                {courierHubGroups.map((group) => (
                  <tr
                    key={group.courierId}
                    className={[
                      courierFilter === group.courierId ? 'ops-metrics-inventory__courier-row--active' : '',
                      group.deliveryToday === 0 && group.inventoryChecked === 0 && group.missingScans === 0
                        ? 'ops-metrics-inventory__courier-row--clear'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lọc bưu tá ${group.courierName}`}
                    onClick={() => {
                      setCourierFilter(group.courierId);
                      setActorFilter(group.courierId);
                      setResponsiblePartyFilter('COURIER');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCourierFilter(group.courierId);
                        setActorFilter(group.courierId);
                        setResponsiblePartyFilter('COURIER');
                      }
                    }}
                  >
                    <td>
                      <strong>{group.courierName}</strong>
                      <small>
                        {group.courierId === UNKNOWN_COURIER_ID
                          ? 'Chưa gán bưu tá'
                          : `${group.courierId} · ${group.hubCodes.join(', ') || 'Hub chưa rõ'}`}
                      </small>
                    </td>
                    <td>
                      {group.phone ? (
                        <a
                          href={`tel:${group.phone}`}
                          className="ops-metrics-inventory__phone-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <NexusDispatchPhoneIcon size={12} style={{ marginRight: 4, color: '#0284c7' }} />
                          {group.phone}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          group.missingScans > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--danger'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.missingScans}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryToday > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--warning'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryToday}
                      </span>
                    </td>
                    <td>
                      <span className="ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear">
                        {group.deliveredSuccess}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryFailed > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--danger'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryFailed}
                      </span>
                    </td>
                    <td>{group.inventoryChecked}</td>
                    <td>{group.problemTotal === 0 ? '-' : formatAgeHours(group.oldestHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {loadError ? (
        <p className="ops-metrics-inventory__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      {/* Main Inventory Audit Manifest Table */}
      <section className="ops-metrics-inventory__panel">
        <header className="ops-metrics-inventory__panel-head">
          <div>
            <h3>Bảng kê đối soát tồn kho &amp; Truy vết đơn kiểm thiếu</h3>
            <small>
              Hiển thị chi tiết người thao tác cuối cùng, thời gian kiểm trước đó và hướng dẫn xử lý không kẽ hở.
            </small>
          </div>
          <span>{isLoading ? 'Đang tải...' : `${inventoryRows.length} vận đơn`}</span>
        </header>

        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải dữ liệu tồn kho và vết thao tác kiểm kê...</p>
        ) : null}

        {!isLoading && inventoryRows.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Không có vận đơn phù hợp bộ lọc đối soát hiện tại.</p>
        ) : null}

        <div className="ops-metrics-inventory__table-wrap">
          <table className="ops-metrics-inventory__table">
            <thead>
              <tr>
                <th>Mã vận đơn &amp; Loại hàng</th>
                <th>Tuổi tồn lũy kế</th>
                <th>Đối soát ca 22h</th>
                <th>Bên &amp; Người chịu trách nhiệm</th>
                <th>Vết thao tác cuối cùng</th>
                <th>Hướng dẫn xử lý chốt ca 22h</th>
                <th>Người nhận &amp; Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;

                const agingBadgeClass =
                  row.agingTier === 'OVER_72H'
                    ? 'ops-metrics-inventory__aging-badge--over72'
                    : row.agingTier === '48H_TO_72H'
                    ? 'ops-metrics-inventory__aging-badge--48to72'
                    : row.agingTier === '24H_TO_48H'
                    ? 'ops-metrics-inventory__aging-badge--24to48'
                    : 'ops-metrics-inventory__aging-badge--under24';

                const roleBadgeClass =
                  row.lastActor.partyType === 'COURIER'
                    ? 'ops-metrics-inventory__role-badge--courier'
                    : row.lastActor.partyType === 'OPS_INBOUND'
                    ? 'ops-metrics-inventory__role-badge--inbound'
                    : 'ops-metrics-inventory__role-badge--ops';

                return (
                  <tr key={row.shipment.id}>
                    {/* Column 1: Shipment Code & Package info */}
                    <td>
                      <CopyableShipmentCode
                        code={row.shipment.shipmentCode}
                        className="ops-metrics-inventory__code"
                      />
                      <div className="ops-metrics-inventory__subtext">
                        <span>Hub: <strong>{row.hubCode}</strong></span>
                        {row.shipment.parcelType ? <span> · {row.shipment.parcelType}</span> : null}
                      </div>
                      {row.shipment.codAmount ? (
                        <div className="ops-metrics-inventory__cod-tag">
                          COD: {row.shipment.codAmount.toLocaleString('vi-VN')} đ
                        </div>
                      ) : null}
                    </td>

                    {/* Column 2: Cumulative Aging */}
                    <td>
                      <span className={`ops-metrics-inventory__aging-badge ${agingBadgeClass}`}>
                        {formatAgeHours(row.cumulativeAgeHours)}
                      </span>
                      <small className="ops-metrics-inventory__subtext-block">
                        Khởi tạo: {formatDateTime(row.shipment.createdAt)}
                      </small>
                      <small className="ops-metrics-inventory__subtext-block">
                        Cập nhật: {formatAge(row.shipment.updatedAt)} trước
                      </small>
                    </td>

                    {/* Column 3: 22:00 Audit Status */}
                    <td>
                      <span
                        className={
                          row.auditStatus === 'MISSING_SCAN'
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            : 'ops-metrics-inventory__badge ops-metrics-inventory__badge--success'
                        }
                      >
                        {row.auditStatus === 'MISSING_SCAN' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <NexusAuditDeficitIcon size={13} />
                            <span>KIỂM THIẾU</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <NexusAuditVerifiedIcon size={13} />
                            <span>ĐÃ KIỂM TỒN</span>
                          </span>
                        )}
                      </span>
                      <div className="ops-metrics-inventory__subtext-block">
                        {row.inventoryScannedAt ? (
                          <small>Quét lúc: {formatDateTime(row.inventoryScannedAt)}</small>
                        ) : (
                          <small className="text-danger">Chưa có quét ca 22h</small>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Responsible Party & Actor */}
                    <td>
                      <span className={`ops-metrics-inventory__role-badge ${roleBadgeClass}`}>
                        {row.lastActor.partyTypeLabel}
                      </span>
                      <strong className="ops-metrics-inventory__actor-name">
                        {row.lastActor.actorName}
                      </strong>
                      <small className="ops-metrics-inventory__actor-id">
                        ID: {row.lastActor.actorId}
                      </small>
                      {row.lastActor.phone ? (
                        <div>
                          <a
                            href={`tel:${row.lastActor.phone}`}
                            className="ops-metrics-inventory__phone-link"
                          >
                            <NexusDispatchPhoneIcon size={12} style={{ marginRight: 4, color: '#0284c7' }} />
                            {row.lastActor.phone}
                          </a>
                        </div>
                      ) : null}
                    </td>

                    {/* Column 5: Last Action & Audit Trail */}
                    <td>
                      <strong className="ops-metrics-inventory__action-title">
                        {row.lastActor.lastActionTitle}
                      </strong>
                      <small className="ops-metrics-inventory__subtext-block">
                        {formatDateTime(row.lastActor.lastActionAt)}
                      </small>
                      <p className="ops-metrics-inventory__action-detail">
                        {row.lastActor.lastActionDetail}
                      </p>
                      {problem?.ndr ? (
                        <Link
                          className="ops-metrics-inventory__ndr-link"
                          to={routePaths.ndrDetail(problem.ndr.id)}
                        >
                          NDR #{problem.ndr.id.slice(0, 8)}: {formatNdrStatusLabel(problem.ndr.status)}
                        </Link>
                      ) : null}
                    </td>

                    {/* Column 6: Actionable Checklist SOP for 22:00 */}
                    <td>
                      <div
                        className={
                          row.lastActor.partyType === 'COURIER'
                            ? 'ops-metrics-inventory__sop-callout ops-metrics-inventory__sop-callout--courier'
                            : 'ops-metrics-inventory__sop-callout ops-metrics-inventory__sop-callout--warehouse'
                        }
                      >
                        <span className="ops-metrics-inventory__sop-icon">
                          {row.lastActor.partyType === 'COURIER' ? (
                            <NexusCourierMotorbikeIcon size={18} style={{ color: '#0284c7' }} />
                          ) : (
                            <NexusWarehouseScanIcon size={18} style={{ color: '#d97706' }} />
                          )}
                        </span>
                        <p>{row.lastActor.closingChecklist}</p>
                      </div>
                    </td>

                    {/* Column 7: Receiver & Current Status */}
                    <td>
                      <strong>{row.customerName}</strong>
                      {row.receiverPhone ? (
                        <div className="ops-metrics-inventory__subtext">{row.receiverPhone}</div>
                      ) : null}
                      <span className="ops-metrics-inventory__status-tag">
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="ops-metrics-inventory__pagination">
          <span>
            Hiển thị {inventoryRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(inventoryRows.length, currentPage * pageSize)} / {inventoryRows.length} vận đơn
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
              Trước
            </button>
            <strong>
              {currentPage}/{totalPages}
            </strong>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
