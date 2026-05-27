import type { PickupRequestListItemDto } from '../../../features/pickups/pickups.types';
import type { ShipmentListItemDto } from '../../../features/shipments/shipments.types';
import type { TaskListItemDto } from '../../../features/tasks/tasks.types';
import {
  formatPickupStatusLabel,
  formatServiceTypeLabel,
  formatShipmentStatusLabel,
} from '../../../utils/logisticsLabels';

export type CustomerOrderOpsStatus =
  | 'NEW'
  | 'WAITING_APPROVAL'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface CustomerOrderOpsRow {
  id: string;
  pickupId: string | null;
  shipmentId: string | null;
  taskId: string | null;
  orderCode: string;
  pickupCode: string;
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  hubCode: string;
  courierId: string | null;
  status: CustomerOrderOpsStatus;
  statusLabel: string;
  pickupStatus: string | null;
  pickupStatusLabel: string;
  shipmentStatus: string | null;
  shipmentStatusLabel: string;
  serviceTypeLabel: string;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
  ageHours: number | null;
  isOverSla: boolean;
}

const OPEN_PICKUP_STATUSES = new Set(['REQUESTED', 'APPROVED', 'PENDING']);
const CANCELLED_STATUSES = new Set(['CANCELLED', 'REJECTED', 'FAILED']);

export function normalizeCustomerOrderCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function normalizeCustomerOrderText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function resolveCustomerOrderHub(shipment: ShipmentListItemDto | null): string {
  return normalizeCustomerOrderCode(
    shipment?.receiverHubCode ??
      shipment?.destinationHubCode ??
      shipment?.currentLocation ??
      shipment?.senderHubCode ??
      shipment?.originHubCode ??
      null,
  );
}

export function isCustomerOrderInHubScope(
  row: CustomerOrderOpsRow,
  assignedHubCodes: string[],
  canViewAll: boolean,
): boolean {
  if (canViewAll) {
    return true;
  }

  return assignedHubCodes.length > 0 && assignedHubCodes.includes(row.hubCode);
}

export function isBranchCreatedCustomerOrder(row: CustomerOrderOpsRow): boolean {
  const source = normalizeCustomerOrderCode(row.source);
  const shipmentCode = normalizeCustomerOrderCode(row.shipmentCode);
  const orderCode = normalizeCustomerOrderCode(row.orderCode);

  return (
    source.includes('OPS_WALK_IN') ||
    source.includes('WALK_IN') ||
    source.includes('BRANCH') ||
    shipmentCode.startsWith('333') ||
    orderCode.startsWith('333')
  );
}

export function formatCustomerOrderDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Không có';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildShipmentLookup(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const lookup = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    const code = normalizeCustomerOrderCode(shipment.shipmentCode);
    if (code) {
      lookup.set(code, shipment);
    }
  }

  return lookup;
}

function buildPickupLookup(pickups: PickupRequestListItemDto[]): Map<string, PickupRequestListItemDto> {
  const lookup = new Map<string, PickupRequestListItemDto>();

  for (const pickup of pickups) {
    const code = normalizeCustomerOrderCode(pickup.shipmentCode);
    if (code && !lookup.has(code)) {
      lookup.set(code, pickup);
    }
  }

  return lookup;
}

function buildTaskLookup(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const lookup = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    const code = normalizeCustomerOrderCode(task.shipmentCode);
    if (!code) {
      continue;
    }

    const previous = lookup.get(code);
    if (!previous || (task.updatedAt ?? '') > (previous.updatedAt ?? '')) {
      lookup.set(code, task);
    }
  }

  return lookup;
}

function resolveFlowStatus(
  shipment: ShipmentListItemDto | null,
  pickup: PickupRequestListItemDto | null,
  task: TaskListItemDto | null,
): { status: CustomerOrderOpsStatus; label: string } {
  const pickupStatus = normalizeCustomerOrderCode(pickup?.status);
  const taskStatus = normalizeCustomerOrderCode(task?.status);
  const shipmentStatus = normalizeCustomerOrderCode(shipment?.currentStatus);

  if (
    CANCELLED_STATUSES.has(pickupStatus) ||
    CANCELLED_STATUSES.has(taskStatus) ||
    CANCELLED_STATUSES.has(shipmentStatus)
  ) {
    return { status: 'CANCELLED', label: 'Đã hủy / thất bại' };
  }

  if (taskStatus === 'COMPLETED' || shipmentStatus === 'PICKUP_COMPLETED') {
    return { status: 'PICKED_UP', label: 'Đã lấy hàng' };
  }

  if (taskStatus === 'ASSIGNED') {
    return { status: 'DISPATCHED', label: 'Đã điều phối NVGN' };
  }

  if (taskStatus === 'CREATED') {
    return { status: 'READY_TO_DISPATCH', label: 'Chưa điều phối' };
  }

  if (OPEN_PICKUP_STATUSES.has(pickupStatus)) {
    return { status: 'WAITING_APPROVAL', label: 'Chờ duyệt lấy hàng' };
  }

  if (shipmentStatus === 'CREATED' || shipmentStatus === 'UPDATED') {
    return { status: 'NEW', label: 'Đơn mới tạo' };
  }

  return { status: 'UNKNOWN', label: formatShipmentStatusLabel(shipment?.currentStatus) };
}

function resolveAgeHours(createdAt: string | null): number | null {
  if (!createdAt) {
    return null;
  }

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - timestamp) / (60 * 60 * 1000)));
}

function mapCustomerOrderRow(
  shipment: ShipmentListItemDto | null,
  pickup: PickupRequestListItemDto | null,
  task: TaskListItemDto | null,
): CustomerOrderOpsRow {
  const shipmentCode =
    normalizeCustomerOrderCode(shipment?.shipmentCode) ||
    normalizeCustomerOrderCode(pickup?.shipmentCode) ||
    normalizeCustomerOrderCode(task?.shipmentCode) ||
    '-';
  const pickupCode = pickup?.requestCode ?? '-';
  const flow = resolveFlowStatus(shipment, pickup, task);
  const createdAt = pickup?.requestedAt ?? task?.createdAt ?? shipment?.createdAt ?? null;
  const updatedAt = task?.updatedAt ?? shipment?.updatedAt ?? pickup?.requestedAt ?? null;
  const ageHours = resolveAgeHours(createdAt);

  return {
    id: shipmentCode || pickup?.id || task?.id || 'customer-order-row',
    pickupId: pickup?.id ?? null,
    shipmentId: shipment?.id ?? null,
    taskId: task?.id ?? null,
    orderCode: pickup?.requestCode ?? shipmentCode,
    pickupCode,
    shipmentCode,
    customerName: shipment?.senderName ?? shipment?.receiverName ?? task?.senderName ?? 'Không có',
    customerPhone: shipment?.senderPhone ?? shipment?.receiverPhone ?? 'Không có',
    hubCode: resolveCustomerOrderHub(shipment) || 'CHUA_XAC_DINH',
    courierId: task?.assignedCourierId ?? null,
    status: flow.status,
    statusLabel: flow.label,
    pickupStatus: pickup?.status ?? null,
    pickupStatusLabel: formatPickupStatusLabel(pickup?.status),
    shipmentStatus: shipment?.currentStatus ?? null,
    shipmentStatusLabel: formatShipmentStatusLabel(shipment?.currentStatus),
    serviceTypeLabel: formatServiceTypeLabel(shipment?.serviceType),
    source: shipment?.platform ?? task?.platform ?? 'Không có',
    createdAt,
    updatedAt,
    ageHours,
    isOverSla:
      ageHours !== null &&
      ageHours >= 4 &&
      flow.status !== 'PICKED_UP' &&
      flow.status !== 'CANCELLED',
  };
}

export function buildCustomerOrderOpsRows({
  shipments,
  pickups,
  tasks,
}: {
  shipments: ShipmentListItemDto[];
  pickups: PickupRequestListItemDto[];
  tasks: TaskListItemDto[];
}): CustomerOrderOpsRow[] {
  const shipmentLookup = buildShipmentLookup(shipments);
  const pickupLookup = buildPickupLookup(pickups);
  const taskLookup = buildTaskLookup(tasks);
  const shipmentCodes = new Set<string>();

  for (const shipment of shipments) {
    shipmentCodes.add(normalizeCustomerOrderCode(shipment.shipmentCode));
  }
  for (const pickup of pickups) {
    const code = normalizeCustomerOrderCode(pickup.shipmentCode);
    if (code) {
      shipmentCodes.add(code);
    }
  }
  for (const task of tasks) {
    const code = normalizeCustomerOrderCode(task.shipmentCode);
    if (code) {
      shipmentCodes.add(code);
    }
  }

  return Array.from(shipmentCodes)
    .filter(Boolean)
    .map((shipmentCode) =>
      mapCustomerOrderRow(
        shipmentLookup.get(shipmentCode) ?? null,
        pickupLookup.get(shipmentCode) ?? null,
        taskLookup.get(shipmentCode) ?? null,
      ),
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt ?? right.updatedAt ?? '').getTime() -
        new Date(left.createdAt ?? left.updatedAt ?? '').getTime(),
    );
}
