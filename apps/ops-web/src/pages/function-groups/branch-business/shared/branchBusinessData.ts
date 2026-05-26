import type { HubDto } from '../../../../features/masterdata/masterdata.types';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { deriveHubScopeTokens, isShipmentInScope } from '../../../../utils/locationScope';

export const FINAL_BRANCH_STATUSES = new Set([
  'CANCELLED',
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'RETURN_COMPLETED',
  'RETURNED',
  'LOST',
]);

export const RECEIVED_BRANCH_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'SCAN_INBOUND',
]);

export const SENT_BRANCH_STATUSES = new Set([
  'MANIFEST_SEALED',
  'SCAN_OUTBOUND',
  'SEND_GOODS',
  'IN_TRANSIT',
]);

export const EXCEPTION_BRANCH_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
]);

export function normalizeBranchCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function normalizeBranchText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function formatBranchCurrency(value: number | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, value ?? 0))} đ`;
}

export function toBranchDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toBranchDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toBranchDateInputValue(date);
}

export function formatBranchDateTime(value: string | null | undefined): string {
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

export function resolveBranchAgeHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - timestamp) / (60 * 60 * 1000)));
}

export function formatBranchAge(value: string | null | undefined): string {
  const hours = resolveBranchAgeHours(value);
  if (hours === null) {
    return 'Không rõ';
  }

  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;

  if (days > 0) {
    return `${days} ngày ${remainHours} giờ`;
  }

  return `${hours} giờ`;
}

export function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeBranchCode(shipment.currentLocation) ||
    normalizeBranchCode(shipment.receiverHubCode) ||
    normalizeBranchCode(shipment.destinationHubCode) ||
    normalizeBranchCode(shipment.originHubCode) ||
    normalizeBranchCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

export function buildTaskByShipment(
  tasks: TaskListItemDto[],
  taskType?: 'PICKUP' | 'DELIVERY' | 'RETURN',
): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    const shipmentCode = normalizeBranchCode(task.shipmentCode);
    if (!shipmentCode || (taskType && task.taskType !== taskType)) {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || (task.updatedAt ?? '') > (previous.updatedAt ?? '')) {
      result.set(shipmentCode, task);
    }
  }

  return result;
}

export function buildBranchScopeTokens(hubs: HubDto[], hubCodes: string[]): Set<string> {
  return deriveHubScopeTokens(hubs, hubCodes);
}

export function isShipmentInBranchScope(
  shipment: ShipmentListItemDto,
  assignedHubCodes: string[],
  scopeTokens: Set<string>,
  canViewAllHubAreas: boolean,
): boolean {
  if (canViewAllHubAreas) {
    return true;
  }

  if (assignedHubCodes.length === 0) {
    return false;
  }

  const hubCandidates = [
    shipment.currentLocation,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
    shipment.originHubCode,
    shipment.senderHubCode,
  ]
    .map(normalizeBranchCode)
    .filter(Boolean);

  if (hubCandidates.some((hubCode) => assignedHubCodes.includes(hubCode))) {
    return true;
  }

  return isShipmentInScope(shipment, scopeTokens);
}

export function isBranchInventoryShipment(shipment: ShipmentListItemDto): boolean {
  return !FINAL_BRANCH_STATUSES.has(normalizeBranchCode(shipment.currentStatus));
}

export function isWithinBranchDateRange(
  value: string | null | undefined,
  fromDate: string,
  toDate: string,
): boolean {
  const dateKey = toBranchDateKey(value);
  if (!dateKey) {
    return true;
  }

  return (!fromDate || dateKey >= fromDate) && (!toDate || dateKey <= toDate);
}
