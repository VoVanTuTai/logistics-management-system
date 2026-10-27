import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, FileSpreadsheet, Copy, Check, Printer, Sparkles, Building2, Target } from 'lucide-react';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import type { HubDto } from '../../features/masterdata/masterdata.types';
import { useVietnamAdministrativeUnitsQuery } from '../../features/locations/vietnamAdministrativeUnits.api';
import { useInboundScanMutation, useOutboundScanMutation, usePickupScanMutation } from '../../features/scans/scans.api';
import type { HubScanInput, HubScanType } from '../../features/scans/scans.types';
import { useCreateShipmentMutation, useShipmentPageQuery } from '../../features/shipments/shipments.api';
import { shipmentsClient } from '../../features/shipments/shipments.client';
import type { ShipmentListFilters, ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { tasksClient, useCourierOptionsQuery, useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { openShippingLabelPrint, resolveRouteAndCourier, type ShippingLabelPrintPayload } from '../../printing/shippingLabelPrint';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useHubScope } from '../../hooks/useHubScope';
import { routePaths } from '../../navigation/routes';
import { createIdempotencyKey } from '../../utils/idempotency';
import { formatHubFullAddress, resolveBranchHubByProvince, resolveDestinationHub } from '../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';
import { queryKeys } from '../../utils/queryKeys';
import { exportShipmentsToExcel } from '../../utils/shipmentExcelExporter';
import { ShipmentsTable } from './ShipmentsTable';

type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
type ShipmentTimeFilter = 'today' | 'last7Days' | 'last30Days' | 'custom' | 'all';
type BranchGoodsFilter = 'readyForDelivery' | 'all' | 'inventoryByDay' | 'problemOrders' | 'returnNeeded';

interface WalkInShipmentFormState {
  manualCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverRegion: string;
  receiverWard?: string;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  serviceType: ServiceType;
  codAmount: string;
  deliveryNote: string;
  platform: string;
  pickupLocationCode: string;
  payerType?: 'SENDER' | 'RECEIVER';
}

const DEFAULT_WALK_IN_FORM: WalkInShipmentFormState = {
  manualCode: '',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  receiverRegion: '',
  receiverWard: '',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  declaredValue: '',
  serviceType: 'STANDARD',
  codAmount: '',
  deliveryNote: '',
  platform: 'OPS_WALK_IN',
  pickupLocationCode: '',
  payerType: 'SENDER',
};

const SHIPMENT_STATUS_OPTIONS = [
  'CREATED',
  'UPDATED',
  'PICKUP_COMPLETED',
  'TASK_ASSIGNED',
  'MANIFEST_SEALED',
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'SEND_GOODS',
  'IN_TRANSIT',
  'INVENTORY_CHECK',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
];

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const EMPTY_SHIPMENTS: ShipmentListItemDto[] = [];
const DEFAULT_TIME_FILTER: ShipmentTimeFilter = 'all';
const DEFAULT_BRANCH_GOODS_FILTER: BranchGoodsFilter = 'all';
const FINAL_BRANCH_STATUSES = new Set([
  'CANCELLED',
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'RETURN_COMPLETED',
  'RETURNED',
  'LOST',
]);
const READY_FOR_DELIVERY_STATUSES = new Set([
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'INVENTORY_CHECK',
  'SCAN_INBOUND',
  'TASK_ASSIGNED',
  'SCAN_OUTBOUND',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
]);
const PROBLEM_SHIPMENT_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION']);
const RETURN_NEEDED_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION']);

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function estimateFee(form: WalkInShipmentFormState): number {
  const serviceBase = {
    STANDARD: 18000,
    EXPRESS: 28000,
    SAME_DAY: 42000,
  }[form.serviceType];

  const weightKg = toPositiveNumber(form.weightKg);
  const length = toPositiveNumber(form.lengthCm);
  const width = toPositiveNumber(form.widthCm);
  const height = toPositiveNumber(form.heightCm);
  const declaredValue = toPositiveNumber(form.declaredValue);
  const codAmount = toPositiveNumber(form.codAmount);

  const weightFee = weightKg * 4500;
  const volumetricWeight = (length * width * height) / 6000;
  const volumeFee = volumetricWeight * 3200;
  const insuredFee = declaredValue * 0.002;
  const codFee = Math.min(codAmount * 0.005, 35000);

  return Math.round(serviceBase + weightFee + volumeFee + insuredFee + codFee);
}

function buildWalkInMetadata(
  form: WalkInShipmentFormState,
  feeEstimate: number,
  route: {
    senderHubCode: string | null;
    receiverHub: HubDto;
  },
  sessionUser?: {
    id?: string;
    username?: string;
    displayName?: string | null;
    name?: string;
    phone?: string;
    roles?: string[];
  },
): Record<string, unknown> {
  const senderHubCode = route.senderHubCode;
  const receiverHubCode = route.receiverHub.code.trim().toUpperCase();
  const operatorCode = sessionUser?.username || 'OPS';
  const operatorName = sessionUser?.displayName || sessionUser?.name || operatorCode;

  return {
    sender: {
      name: form.senderName.trim() || null,
      phone: form.senderPhone.trim() || null,
      address: form.senderAddress.trim() || null,
      hubCode: senderHubCode,
    },
    receiver: {
      name: form.receiverName.trim() || null,
      phone: form.receiverPhone.trim() || null,
      address: form.receiverAddress.trim() || null,
      region: form.receiverRegion.trim() || null,
      province: form.receiverRegion.trim() || null,
      ward: form.receiverWard?.trim() || null,
      hubCode: receiverHubCode,
      resolvedHubName: route.receiverHub.name,
    },
    package: {
      itemType: form.itemType.trim() || null,
      weightKg: toPositiveNumber(form.weightKg),
      dimensionsCm: {
        length: toPositiveNumber(form.lengthCm),
        width: toPositiveNumber(form.widthCm),
        height: toPositiveNumber(form.heightCm),
      },
      declaredValue: toPositiveNumber(form.declaredValue),
    },
    service: {
      type: form.serviceType,
    },
    codAmount: toPositiveNumber(form.codAmount),
    deliveryNote: form.deliveryNote.trim() || null,
    estimatedFee: feeEstimate,
    payerType: form.payerType || 'SENDER',
    platform: form.platform.trim() || 'OPS_WALK_IN',
    source: 'ops-web',
    operatorCode,
    operatorName,
    createdBy: {
      userId: sessionUser?.id || null,
      username: operatorCode,
      name: operatorName,
      role: sessionUser?.roles || ['OPS'],
      hubCode: senderHubCode,
      createdAt: new Date().toISOString(),
    },
    intakeStaff: {
      username: operatorCode,
      name: operatorName,
      hubCode: senderHubCode,
      intakeAt: new Date().toISOString(),
    },
    pickupStaff: operatorCode,
    pickupCourier: {
      courierId: operatorCode,
      courierName: operatorName,
      phone: sessionUser?.phone || '',
      type: 'COUNTER_OPS',
      pickedUpAt: new Date().toISOString(),
    },
    receivedBy: {
      username: operatorCode,
      name: operatorName,
      hubCode: senderHubCode,
      receivedAt: new Date().toISOString(),
    },
    intakeType: 'COUNTER_WALK_IN',
    pickupClassification: 'COUNTER_DROP_OFF',
    pickupType: 'COUNTER',
    skipCourierPickup: true,
    initialStatus: 'PICKUP_COMPLETED',
    statusNote: `Đã tiếp nhận hàng trực tiếp tại quầy bởi ${operatorName}`,
    routing: {
      originHubCode: senderHubCode,
      destinationHubCode: receiverHubCode,
      resolvedBy: 'address',
    },
    senderHubCode,
    receiverHubCode,
    originHubCode: senderHubCode,
    destinationHubCode: receiverHubCode,
  };
}

function formatCurrency(value: number | null): string {
  if (value === null) {
    return 'Không có';
  }
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function compactCode(value: string, fallback: string): string {
  const normalized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return normalized.length > 0 ? normalized.slice(0, 10) : fallback;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toPageNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function normalizeTimeFilter(value: string | null): ShipmentTimeFilter {
  return value === 'today' ||
    value === 'last7Days' ||
    value === 'last30Days' ||
    value === 'custom' ||
    value === 'all'
    ? value
    : DEFAULT_TIME_FILTER;
}

function normalizeBranchGoodsFilter(value: string | null): BranchGoodsFilter {
  return value === 'readyForDelivery' ||
    value === 'all' ||
    value === 'inventoryByDay' ||
    value === 'problemOrders' ||
    value === 'returnNeeded'
    ? value
    : DEFAULT_BRANCH_GOODS_FILTER;
}

function normalizeOpsCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function isBranchInventoryShipment(shipment: ShipmentListItemDto): boolean {
  return !FINAL_BRANCH_STATUSES.has(normalizeOpsCode(shipment.currentStatus));
}

function isReadyForDeliveryShipment(
  shipment: ShipmentListItemDto,
): boolean {
  return READY_FOR_DELIVERY_STATUSES.has(normalizeOpsCode(shipment.currentStatus));
}

function isProblemShipment(shipment: ShipmentListItemDto): boolean {
  return (
    PROBLEM_SHIPMENT_STATUSES.has(normalizeOpsCode(shipment.currentStatus)) ||
    shipment.requiresLabelReprint ||
    shipment.isOperationLocked
  );
}

function isReturnNeededShipment(shipment: ShipmentListItemDto): boolean {
  return RETURN_NEEDED_STATUSES.has(normalizeOpsCode(shipment.currentStatus));
}

function buildDeliveryCourierByShipment(tasks: TaskListItemDto[]): Map<string, string> {
  const result = buildLatestDeliveryTaskByShipment(tasks);

  return new Map(
    Array.from(result.entries()).map(([shipmentCode, task]) => [
      shipmentCode,
      task.assignedCourierId ?? 'Chưa bàn giao',
    ]),
  );
}

function buildLatestDeliveryTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    const shipmentCode = normalizeOpsCode(task.shipmentCode);
    if (!shipmentCode || task.taskType !== 'DELIVERY') {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || (task.updatedAt ?? '') > (previous.updatedAt ?? '')) {
      result.set(shipmentCode, task);
    }
  }

  return result;
}

function extractShipmentSearchCodes(value: string): string[] {
  const tokens = value
    .split(/[\s,;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter((token) => token.length > 0);

  return Array.from(new Set(tokens));
}

function addDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function buildSingleDayCreatedAtRange(dateValue: string): { createdFrom?: string; createdTo?: string } {
  const start = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return {};
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    createdFrom: start.toISOString(),
    createdTo: end.toISOString(),
  };
}

function buildCustomCreatedAtRange(dateFrom: string, dateTo: string): { createdFrom?: string; createdTo?: string } {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo || dateFrom}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {};
  }

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;
  normalizedEnd.setDate(normalizedEnd.getDate() + 1);

  return {
    createdFrom: normalizedStart.toISOString(),
    createdTo: normalizedEnd.toISOString(),
  };
}

function buildCreatedAtRange(
  timeFilter: ShipmentTimeFilter,
  dateFrom: string,
  dateTo: string,
  today: string,
): { createdFrom?: string; createdTo?: string } {
  if (timeFilter === 'all') {
    return {};
  }

  if (timeFilter === 'today') {
    return buildSingleDayCreatedAtRange(today);
  }

  if (timeFilter === 'last7Days') {
    return buildCustomCreatedAtRange(addDays(today, -6), today);
  }

  if (timeFilter === 'last30Days') {
    return buildCustomCreatedAtRange(addDays(today, -29), today);
  }

  return buildCustomCreatedAtRange(dateFrom, dateTo);
}

function formatTotal(total: number | undefined): string {
  return typeof total === 'number' ? `Tổng ${new Intl.NumberFormat('vi-VN').format(total)} vận đơn` : 'Chưa có tổng';
}

function generateDeliveryTaskCode(shipmentCode: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const normalizedShipmentCode = shipmentCode
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(-6);
  return `DLV-${normalizedShipmentCode || 'SHIP'}-${timestamp}`;
}

function printWaybill(shipment: ShipmentListItemDto): boolean {
  const senderName = shipment.senderName?.trim() || 'Người gửi';
  const senderPhone = shipment.senderPhone?.trim() || '-';
  const senderAddress = shipment.senderAddress?.trim() || '-';
  const receiverName = shipment.receiverName?.trim() || 'Người nhận';
  const receiverPhone = shipment.receiverPhone?.trim() || '-';
  const receiverAddress = shipment.receiverAddress?.trim() || '-';

  const hubCode =
    shipment.currentLocation?.trim() ||
    shipment.receiverHubCode?.trim() ||
    shipment.destinationHubCode?.trim() ||
    shipment.receiverRegion?.trim() ||
    'HUB-NA';
  const zoneCode = shipment.receiverRegion?.trim() || 'ZONE-NA';
  const routeTag = compactCode(hubCode || shipment.shipmentCode, 'ROUTE');
  const sortCode = [`Hub đích: ${hubCode || 'N/A'}`, `Khu vực: ${zoneCode || 'N/A'}`].join('\n');
  const itemDescription = shipment.parcelType?.trim() || shipment.serviceType?.trim() || '-';
  const parcelNote = [
    `Dịch vụ: ${shipment.serviceType?.trim() || '-'}`,
    `Loại hàng: ${shipment.parcelType?.trim() || '-'}`,
    `Phí: ${formatCurrency(shipment.shippingFee)}`,
    `COD: ${formatCurrency(shipment.codAmount)}`,
  ].join(' | ');
  const deliveryInstruction =
    shipment.deliveryNote?.trim() || 'Gọi trước khi giao. Không cho thử hàng.';

  const resolvedPickup = resolveRouteAndCourier(
    senderAddress,
    shipment.senderWard,
    shipment.senderDistrict,
    shipment.senderHubCode || shipment.originHubCode,
    true,
  );
  const resolvedDelivery = resolveRouteAndCourier(
    receiverAddress,
    undefined,
    undefined,
    shipment.receiverHubCode || shipment.destinationHubCode || hubCode,
    false,
  );

  const pickupRouteName = resolvedPickup.routeName;
  const pickupCourierId = resolvedPickup.courierId;
  const deliveryRouteName = resolvedDelivery.routeName;
  const deliveryCourierId = resolvedDelivery.courierId;

  const meta = (shipment.metadata as Record<string, unknown> | null | undefined) || {};
  const metaPackage = (meta.package as Record<string, unknown> | undefined) || {};
  const metaInsurance = (meta.insurance as Record<string, unknown> | undefined) || {};

  const isFragile = Boolean(metaPackage.isFragile);
  const fragileCategory = typeof metaPackage.fragileCategory === 'string' ? metaPackage.fragileCategory : undefined;
  const packagingStandardMet = Boolean(metaPackage.packagingStandardMet);
  const packagingWaiver = Boolean(metaPackage.packagingWaiver || metaInsurance.packagingWaiver);
  const insuranceTier = typeof metaInsurance.tier === 'string' ? metaInsurance.tier : typeof metaPackage.insuranceTier === 'string' ? metaPackage.insuranceTier : 'NONE';
  const declaredValue = Number(metaInsurance.declaredValue || metaPackage.declaredValue || 0);
  const insuranceFee = Number(metaInsurance.insuranceFee || 0);
  const declaredValueText = declaredValue > 0 ? formatCurrency(declaredValue) : undefined;
  const insuranceFeeText = insuranceFee > 0 ? formatCurrency(insuranceFee) : undefined;

  const opened = openShippingLabelPrint({
    brandName: 'NEXUS LOGISTICS',
    serviceName: shipment.serviceType?.trim() || 'STANDARD',
    shipmentCode: shipment.shipmentCode,
    senderName,
    senderPhone,
    senderAddress,
    receiverName,
    receiverPhone,
    receiverAddress,
    hubCode,
    zoneCode,
    itemDescription,
    parcelNote,
    qrValue: shipment.shipmentCode,
    routeTag,
    sortCode,
    codAmountText: formatCurrency(shipment.codAmount),
    createdAtText: formatDateTime(shipment.createdAt),
    deliveryInstruction,
    hotlineText: 'Hotline vận hành: 1900-1234',
    pickupRouteName,
    pickupCourierId,
    deliveryRouteName,
    deliveryCourierId,
    isFragile,
    fragileCategory,
    packagingStandardMet,
    packagingWaiver,
    insuranceTier,
    declaredValueText,
    insuranceFeeText,
    inspectionPolicy:
      (typeof shipment.metadata?.inspectionPolicy === 'string'
        ? shipment.metadata.inspectionPolicy
        : typeof (shipment.metadata?.package as Record<string, unknown> | undefined)?.inspectionPolicy === 'string'
          ? (shipment.metadata?.package as Record<string, unknown>).inspectionPolicy as string
          : undefined),
  });

  if (!opened) {
    useUiStore
      .getState()
      .showToast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.', 'error');
    return false;
  }

  return true;
}

export function ShipmentListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentUserRoles = session?.user.roles ?? [];
  const assignedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = currentUserRoles.includes('SYSTEM_ADMIN');
  const hubScope = useHubScope();
  const [selectedChildHub, setSelectedChildHub] = useState<string>('ALL');

  const effectiveScopedHubCodes = useMemo(() => {
    if (canViewAllHubAreas || hubScope.isAllSystem) {
      if (selectedChildHub !== 'ALL') {
        return [selectedChildHub];
      }
      return undefined;
    }
    if (selectedChildHub !== 'ALL') {
      return [selectedChildHub];
    }
    return hubScope.scopedHubCodes.length > 0 ? hubScope.scopedHubCodes : undefined;
  }, [canViewAllHubAreas, hubScope.isAllSystem, selectedChildHub, hubScope.scopedHubCodes]);

  const today = useMemo(() => toDateInputValue(new Date()), []);
  const filters: ShipmentListFilters = {
    q: searchParams.get('q') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const timeFilter = normalizeTimeFilter(searchParams.get('time'));
  const selectedDateFrom = searchParams.get('dateFrom') || today;
  const selectedDateTo = searchParams.get('dateTo') || today;
  const branchGoodsFilter = normalizeBranchGoodsFilter(searchParams.get('branchGoods'));
  const inventoryDate = searchParams.get('inventoryDate') || today;
  const courierFilter = searchParams.get('courierId') ?? '';
  const senderPhoneFilter = searchParams.get('senderPhone') ?? '';
  const receiverPhoneFilter = searchParams.get('receiverPhone') ?? '';
  const senderAddressFilter = searchParams.get('senderAddress') ?? '';
  const receiverAddressFilter = searchParams.get('receiverAddress') ?? '';
  const pageSize = toPageNumber(searchParams.get('limit'), DEFAULT_PAGE_SIZE, 10, 100);
  const offset = toPageNumber(searchParams.get('offset'), 0, 0, 1_000_000);
  const pageNumber = Math.floor(offset / pageSize) + 1;

  const currentFlow = useMemo(() => {
    const flowParam = searchParams.get('flow');
    if (flowParam) return flowParam;
    if (branchGoodsFilter === 'readyForDelivery') return 'arrival';
    if (branchGoodsFilter === 'inventoryByDay') return 'inventory';
    if (branchGoodsFilter === 'problemOrders' || branchGoodsFilter === 'returnNeeded') return 'problem';
    if (filters.status === 'SCAN_OUTBOUND' || filters.status === 'SEND_GOODS') return 'outbound';
    if (filters.status === 'OUT_FOR_DELIVERY' || filters.status === 'TASK_ASSIGNED') return 'delivery';
    return 'all';
  }, [branchGoodsFilter, filters.status, searchParams]);

  const handleFlowTabChange = (flowId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('offset', '0');
    if (flowId === 'all') {
      next.delete('flow');
      next.delete('status');
      next.delete('branchGoods');
    } else if (flowId === 'arrival') {
      next.set('flow', 'arrival');
      next.set('branchGoods', 'readyForDelivery');
      next.delete('status');
    } else if (flowId === 'outbound') {
      next.set('flow', 'outbound');
      next.set('status', 'SCAN_OUTBOUND');
      next.delete('branchGoods');
    } else if (flowId === 'delivery') {
      next.set('flow', 'delivery');
      next.set('status', 'OUT_FOR_DELIVERY');
      next.delete('branchGoods');
    } else if (flowId === 'inventory') {
      next.set('flow', 'inventory');
      next.set('branchGoods', 'inventoryByDay');
      next.delete('status');
    } else if (flowId === 'problem') {
      next.set('flow', 'problem');
      next.set('branchGoods', 'problemOrders');
      next.delete('status');
    }
    setSearchParams(next);
  };

  const [qInput, setQInput] = useState(filters.q ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [timeInput, setTimeInput] = useState<ShipmentTimeFilter>(timeFilter);
  const [dateFromInput, setDateFromInput] = useState(selectedDateFrom);
  const [dateToInput, setDateToInput] = useState(selectedDateTo);
  const [branchGoodsInput, setBranchGoodsInput] = useState<BranchGoodsFilter>(branchGoodsFilter);
  const [inventoryDateInput, setInventoryDateInput] = useState(inventoryDate);
  const [courierInput, setCourierInput] = useState(courierFilter);
  const [senderPhoneInput, setSenderPhoneInput] = useState(senderPhoneFilter);
  const [receiverPhoneInput, setReceiverPhoneInput] = useState(receiverPhoneFilter);
  const [senderAddressInput, setSenderAddressInput] = useState(senderAddressFilter);
  const [receiverAddressInput, setReceiverAddressInput] = useState(receiverAddressFilter);
  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);
  const [isBatchSearchOpen, setIsBatchSearchOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [counterShipmentCode, setCounterShipmentCode] = useState('');
  const [counterLocationCode, setCounterLocationCode] = useState('');
  const [counterScanType, setCounterScanType] = useState<HubScanType>('PICKUP');
  const [counterNote, setCounterNote] = useState('');
  const [counterMessage, setCounterMessage] = useState<string | null>(null);
  const [counterError, setCounterError] = useState<string | null>(null);

  const [walkInForm, setWalkInForm] = useState<WalkInShipmentFormState>(DEFAULT_WALK_IN_FORM);
  const [walkInMessage, setWalkInMessage] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchShipmentCode, setDispatchShipmentCode] = useState('');
  const [dispatchCourierId, setDispatchCourierId] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const assignedHubCodesKey = assignedHubCodes.join(',');
  const hasShipmentSearch = Boolean((filters.q ?? '').trim());
  const shipmentSearchCodes = useMemo(() => extractShipmentSearchCodes(filters.q ?? ''), [filters.q]);
  const extractedInputCodes = useMemo(() => extractShipmentSearchCodes(qInput), [qInput]);
  const isMultiCodeSearch = shipmentSearchCodes.length > 1;

  const handlePasteCodes = (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const text = event.clipboardData.getData('text');
    if (!text) return;
    const codes = extractShipmentSearchCodes(text);
    if (codes.length > 1) {
      event.preventDefault();
      setQInput(codes.join('\n'));
      setIsBatchSearchOpen(true);
    }
  };

  const handleCopyCodesToClipboard = async () => {
    const codesToCopy =
      selectedShipments.length > 0
        ? selectedShipments.map((s) => s.shipmentCode)
        : visibleShipments.map((s) => s.shipmentCode);

    if (codesToCopy.length === 0) return;

    try {
      await navigator.clipboard.writeText(codesToCopy.join('\n'));
      setCopyFeedback(`Đã sao chép ${codesToCopy.length} mã!`);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      // fallback
    }
  };
  const dateRange = useMemo(
    () => (hasShipmentSearch ? {} : buildCreatedAtRange(timeFilter, selectedDateFrom, selectedDateTo, today)),
    [hasShipmentSearch, selectedDateFrom, selectedDateTo, timeFilter, today],
  );
  const shipmentPageFilters = useMemo<ShipmentListFilters>(
    () => ({
      q: isMultiCodeSearch ? undefined : filters.q,
      shipmentCodes: isMultiCodeSearch ? shipmentSearchCodes : undefined,
      status: filters.status,
      hubCodes: effectiveScopedHubCodes,
      opsArrivedUnsigned:
        !hasShipmentSearch && branchGoodsFilter === 'readyForDelivery' ? true : undefined,
      createdFrom: dateRange.createdFrom,
      createdTo: dateRange.createdTo,
      limit: pageSize,
      offset,
    }),
    [
      effectiveScopedHubCodes,
      dateRange.createdFrom,
      dateRange.createdTo,
      filters.q,
      filters.status,
      branchGoodsFilter,
      hasShipmentSearch,
      isMultiCodeSearch,
      offset,
      pageSize,
      shipmentSearchCodes,
    ],
  );
  const lacksHubScope =
    Boolean(accessToken) &&
    !canViewAllHubAreas &&
    !hubScope.isAllSystem &&
    hubScope.scopedHubCodes.length === 0;
  const canQueryShipments = Boolean(accessToken) && !lacksHubScope;
  const shipmentQuery = useShipmentPageQuery(accessToken, shipmentPageFilters, {
    enabled: canQueryShipments,
  });
  const createShipmentMutation = useCreateShipmentMutation(accessToken);
  const pickupScanMutation = usePickupScanMutation(accessToken);
  const inboundScanMutation = useInboundScanMutation(accessToken);
  const outboundScanMutation = useOutboundScanMutation(accessToken);
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const locationsQuery = useVietnamAdministrativeUnitsQuery(accessToken);
  const hubsQuery = useHubsQuery(accessToken, { isActive: 'true' });
  const provinceOptions = locationsQuery.data ?? [];
  const activeHubs = hubsQuery.data ?? [];

  const estimatedFee = useMemo(() => estimateFee(walkInForm), [walkInForm]);
  const [lastWalkInLabel, setLastWalkInLabel] = useState<ShippingLabelPrintPayload | null>(null);

  const operatorHub = useMemo(() => {
    const hubCode = assignedHubCodes[0];
    if (!hubCode) return null;
    return activeHubs.find((h) => h.code.trim().toUpperCase() === hubCode.trim().toUpperCase()) ?? null;
  }, [activeHubs, assignedHubCodes]);

  const walkInSelectedProvince = useMemo(() => {
    if (!walkInForm.receiverRegion) return null;
    return provinceOptions.find((p) => p.name === walkInForm.receiverRegion) ?? null;
  }, [provinceOptions, walkInForm.receiverRegion]);

  const walkInWardOptions = useMemo(() => {
    return walkInSelectedProvince?.wards ?? [];
  }, [walkInSelectedProvince]);

  const walkInReceiverHub = useMemo(
    () =>
      resolveDestinationHub(
        activeHubs,
        walkInForm.receiverRegion,
        walkInForm.receiverWard || null,
        walkInForm.receiverAddress,
      ),
    [activeHubs, walkInForm.receiverRegion, walkInForm.receiverWard, walkInForm.receiverAddress],
  );

  const isWalkInOverCeiling = useMemo(() => {
    const w = toPositiveNumber(walkInForm.weightKg);
    const l = toPositiveNumber(walkInForm.lengthCm);
    const wi = toPositiveNumber(walkInForm.widthCm);
    const h = toPositiveNumber(walkInForm.heightCm);
    return w > 70 || Math.max(l, wi, h) > 150 || l + wi + h > 300;
  }, [walkInForm.weightKg, walkInForm.lengthCm, walkInForm.widthCm, walkInForm.heightCm]);
  const pageShipments = shipmentQuery.data?.items ?? EMPTY_SHIPMENTS;
  const deliveryCourierByShipment = useMemo(
    () => buildDeliveryCourierByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );
  const deliveryTaskByShipment = useMemo(
    () => buildLatestDeliveryTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );
  const courierFilterOptions = useMemo(() => {
    const options = new Set<string>();
    if (courierFilter) {
      options.add(courierFilter);
    }
    for (const courier of courierOptionsQuery.data ?? []) {
      options.add(courier.courierId);
    }
    for (const courier of deliveryCourierByShipment.values()) {
      if (courier !== 'Chưa bàn giao') {
        options.add(courier);
      }
    }

    return Array.from(options).sort();
  }, [courierFilter, courierOptionsQuery.data, deliveryCourierByShipment]);
  const visibleShipments = useMemo(() => {
    return pageShipments.filter((shipment) => {
      const branchGoodsMatched =
        hasShipmentSearch && branchGoodsFilter === DEFAULT_BRANCH_GOODS_FILTER
          ? true
          : branchGoodsFilter === 'all' ||
            (branchGoodsFilter === 'readyForDelivery' &&
              isReadyForDeliveryShipment(shipment)) ||
            (branchGoodsFilter === 'inventoryByDay' &&
              isBranchInventoryShipment(shipment) &&
              (!inventoryDate || toDateKey(shipment.updatedAt) <= inventoryDate)) ||
            (branchGoodsFilter === 'problemOrders' && isProblemShipment(shipment)) ||
            (branchGoodsFilter === 'returnNeeded' && isReturnNeededShipment(shipment));
      const statusMatched =
        branchGoodsMatched;
      const assignedCourier =
        deliveryCourierByShipment.get(normalizeOpsCode(shipment.shipmentCode)) ?? 'Chưa bàn giao';
      const courierMatched = !courierFilter || assignedCourier === courierFilter;
      const senderPhoneMatched =
        !senderPhoneFilter || (shipment.senderPhone ?? '').includes(senderPhoneFilter.trim());
      const receiverPhoneMatched =
        !receiverPhoneFilter || (shipment.receiverPhone ?? '').includes(receiverPhoneFilter.trim());
      const senderAddressMatched =
        !senderAddressFilter ||
        (shipment.senderAddress ?? '').toLowerCase().includes(senderAddressFilter.trim().toLowerCase()) ||
        (shipment.senderProvince ?? '').toLowerCase().includes(senderAddressFilter.trim().toLowerCase()) ||
        (shipment.senderDistrict ?? '').toLowerCase().includes(senderAddressFilter.trim().toLowerCase()) ||
        (shipment.senderWard ?? '').toLowerCase().includes(senderAddressFilter.trim().toLowerCase());
      const receiverAddressMatched =
        !receiverAddressFilter ||
        (shipment.receiverAddress ?? '').toLowerCase().includes(receiverAddressFilter.trim().toLowerCase()) ||
        (shipment.receiverRegion ?? '').toLowerCase().includes(receiverAddressFilter.trim().toLowerCase());

      return (
        statusMatched &&
        courierMatched &&
        senderPhoneMatched &&
        receiverPhoneMatched &&
        senderAddressMatched &&
        receiverAddressMatched
      );
    });
  }, [
    branchGoodsFilter,
    courierFilter,
    deliveryCourierByShipment,
    hasShipmentSearch,
    inventoryDate,
    pageShipments,
    senderPhoneFilter,
    receiverPhoneFilter,
    senderAddressFilter,
    receiverAddressFilter,
  ]);
  const visibleShipmentCodes = useMemo(
    () => new Set(visibleShipments.map((shipment) => shipment.shipmentCode)),
    [visibleShipments],
  );
  const selectedShipments = useMemo(
    () => visibleShipments.filter((shipment) => selectedShipmentCodes.includes(shipment.shipmentCode)),
    [selectedShipmentCodes, visibleShipments],
  );
  const pageInfo = shipmentQuery.data?.pageInfo ?? { hasNextPage: false, total: undefined };
  const hasPreviousPage = offset > 0;

  const isScanSubmitting =
    pickupScanMutation.isPending || inboundScanMutation.isPending || outboundScanMutation.isPending;
  const isWalkInSubmitting = createShipmentMutation.isPending || isScanSubmitting;

  useEffect(() => {
    setQInput(filters.q ?? '');
    setStatusInput(filters.status ?? '');
    setTimeInput(timeFilter);
    setDateFromInput(selectedDateFrom);
    setDateToInput(selectedDateTo);
    setBranchGoodsInput(branchGoodsFilter);
    setInventoryDateInput(inventoryDate);
    setCourierInput(courierFilter);
    setSenderPhoneInput(senderPhoneFilter);
    setReceiverPhoneInput(receiverPhoneFilter);
  }, [
    branchGoodsFilter,
    courierFilter,
    filters.q,
    filters.status,
    inventoryDate,
    receiverPhoneFilter,
    selectedDateFrom,
    selectedDateTo,
    senderPhoneFilter,
    timeFilter,
  ]);

  useEffect(() => {
    if (dispatchCourierId || !courierOptionsQuery.data?.length) {
      return;
    }

    setDispatchCourierId(courierOptionsQuery.data[0].courierId);
  }, [courierOptionsQuery.data, dispatchCourierId]);

  useEffect(() => {
    setSelectedShipmentCodes((current) => {
      const next = current.filter((shipmentCode) => visibleShipmentCodes.has(shipmentCode));
      return next.length === current.length ? current : next;
    });
  }, [visibleShipmentCodes]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const time = normalizeTimeFilter(String(formData.get('time') ?? ''));
    const dateFrom = String(formData.get('dateFrom') ?? '').trim() || today;
    const dateTo = String(formData.get('dateTo') ?? '').trim() || dateFrom;
    const nextBranchGoodsFilter = normalizeBranchGoodsFilter(String(formData.get('branchGoods') ?? ''));
    const nextInventoryDate = String(formData.get('inventoryDate') ?? '').trim() || today;
    const nextCourierId = String(formData.get('courierId') ?? '').trim();
    const nextSenderPhone = String(formData.get('senderPhone') ?? '').trim();
    const nextReceiverPhone = String(formData.get('receiverPhone') ?? '').trim();
    const nextSenderAddress = String(formData.get('senderAddress') ?? '').trim();
    const nextReceiverAddress = String(formData.get('receiverAddress') ?? '').trim();
    const next = new URLSearchParams();

    next.set('time', time);
    if (time === 'custom') {
      next.set('dateFrom', dateFrom);
      next.set('dateTo', dateTo);
    }
    next.set('limit', String(pageSize));
    next.set('offset', '0');
    if (q) {
      next.set('q', q);
    }
    if (status) {
      next.set('status', status);
    }
    if (nextBranchGoodsFilter !== DEFAULT_BRANCH_GOODS_FILTER) {
      next.set('branchGoods', nextBranchGoodsFilter);
    }
    if (nextBranchGoodsFilter === 'inventoryByDay') {
      next.set('inventoryDate', nextInventoryDate);
    }
    if (nextCourierId) {
      next.set('courierId', nextCourierId);
    }
    if (nextSenderPhone) {
      next.set('senderPhone', nextSenderPhone);
    }
    if (nextReceiverPhone) {
      next.set('receiverPhone', nextReceiverPhone);
    }
    if (nextSenderAddress) {
      next.set('senderAddress', nextSenderAddress);
    }
    if (nextReceiverAddress) {
      next.set('receiverAddress', nextReceiverAddress);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setSenderAddressInput('');
    setReceiverAddressInput('');
    const next = new URLSearchParams();
    next.set('time', DEFAULT_TIME_FILTER);
    next.set('limit', String(DEFAULT_PAGE_SIZE));
    next.set('offset', '0');
    setSearchParams(next, { replace: true });
    setQInput('');
    setStatusInput('');
    setTimeInput(DEFAULT_TIME_FILTER);
    setDateFromInput(today);
    setDateToInput(today);
    setBranchGoodsInput(DEFAULT_BRANCH_GOODS_FILTER);
    setInventoryDateInput(today);
    setCourierInput('');
    setSenderPhoneInput('');
    setReceiverPhoneInput('');
  };

  const updatePagination = (nextLimit: number, nextOffset: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('time', timeFilter);
    next.set('limit', String(nextLimit));
    next.set('offset', String(Math.max(0, nextOffset)));
    setSearchParams(next, { replace: true });
  };

  const onPageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updatePagination(Number(event.target.value), 0);
  };

  const goToPreviousPage = () => {
    updatePagination(pageSize, Math.max(0, offset - pageSize));
  };

  const goToNextPage = () => {
    updatePagination(pageSize, offset + pageSize);
  };

  const submitCounterScan = async () => {
    if (!accessToken) {
      return;
    }

    const shipmentCode = counterShipmentCode.trim().toUpperCase();
    const locationCode = counterLocationCode.trim().toUpperCase();

    if (!shipmentCode) {
      setCounterError('Cần mã vận đơn để quét.');
      return;
    }
    if (!locationCode) {
      setCounterError('Cần mã vị trí để quét.');
      return;
    }

    const payload: HubScanInput = {
      shipmentCode,
      locationCode,
      scanType: counterScanType,
      note: counterNote.trim() || null,
      idempotencyKey: createIdempotencyKey('ops-counter-scan'),
    };

    setCounterMessage(null);
    setCounterError(null);

    try {
      if (counterScanType === 'PICKUP') {
        await pickupScanMutation.mutateAsync(payload);
      } else if (counterScanType === 'INBOUND') {
        await inboundScanMutation.mutateAsync(payload);
      } else {
        await outboundScanMutation.mutateAsync(payload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      setCounterMessage(`Quét ${counterScanType} đã ghi nhận cho ${shipmentCode}.`);
      setCounterShipmentCode('');
      setCounterNote('');
    } catch (error) {
      setCounterError(getErrorMessage(error));
    }
  };

  const submitDispatchScan = async () => {
    if (!accessToken || dispatchLoading) {
      return;
    }

    const shipmentCode = dispatchShipmentCode.trim().toUpperCase();
    const courierId = dispatchCourierId.trim();

    if (!shipmentCode) {
      setDispatchError('Cần mã vận đơn để quét phát.');
      return;
    }
    if (!courierId) {
      setDispatchError('Cần chọn courier để phân công giao.');
      return;
    }

    setDispatchMessage(null);
    setDispatchError(null);
    setDispatchLoading(true);

    try {
      const deliveryTasks = await tasksClient.list(accessToken, {
        taskType: 'DELIVERY',
        shipmentCode,
      });

      let targetTask =
        deliveryTasks.find(
          (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
        ) ?? null;

      if (!targetTask) {
        targetTask = await tasksClient.create(accessToken, {
          taskCode: generateDeliveryTaskCode(shipmentCode),
          taskType: 'DELIVERY',
          shipmentCode,
          note: dispatchNote.trim() || 'quét phát từ màn hình vận đơn OPS',
        });
      }

      if (targetTask.assignedCourierId) {
        if (targetTask.assignedCourierId !== courierId) {
          await tasksClient.reassign(accessToken, {
            taskId: targetTask.id,
            courierId,
          });
        }
      } else {
        await tasksClient.assign(accessToken, {
          taskId: targetTask.id,
          courierId,
        });
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });

      setDispatchMessage(
        `Đã quét phát vận đơn ${shipmentCode} và phân công cho ${courierId}.`,
      );
      setDispatchNote('');
      setIsDispatchModalOpen(false);
    } catch (error) {
      setDispatchError(getErrorMessage(error));
    } finally {
      setDispatchLoading(false);
    }
  };

  const handlePrintWaybill = async (shipment: ShipmentListItemDto): Promise<void> => {
    const opened = printWaybill(shipment);
    if (!opened || !accessToken || !shipment.requiresLabelReprint) {
      return;
    }

    try {
      await shipmentsClient.confirmLabelReprint(accessToken, shipment.shipmentCode, {
        printedBy: session?.user.username ?? 'ops-web',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      useUiStore
        .getState()
        .showToast('Đã ghi nhận in lại tem mới, vận đơn đã được mở khóa thao tác.', 'success');
    } catch (error) {
      useUiStore
        .getState()
        .showToast(`Không ghi nhận được in lại tem: ${getErrorMessage(error)}`, 'error');
    }
  };

  const toggleShipmentSelection = (shipmentCode: string, checked: boolean) => {
    setSelectedShipmentCodes((current) => {
      if (checked) {
        return current.includes(shipmentCode) ? current : [...current, shipmentCode];
      }

      return current.filter((code) => code !== shipmentCode);
    });
  };

  const toggleAllVisibleShipments = (checked: boolean) => {
    if (!checked) {
      setSelectedShipmentCodes((current) =>
        current.filter((shipmentCode) => !visibleShipmentCodes.has(shipmentCode)),
      );
      return;
    }

    setSelectedShipmentCodes((current) => {
      const merged = new Set(current);
      visibleShipments.forEach((shipment) => merged.add(shipment.shipmentCode));
      return Array.from(merged);
    });
  };

  const printSelectedLabels = async () => {
    if (selectedShipments.length === 0) {
      useUiStore.getState().showToast('Chọn ít nhất một vận đơn để in tem.', 'error');
      return;
    }

    for (const shipment of selectedShipments) {
      await handlePrintWaybill(shipment);
    }
  };

  const submitWalkInShipment = async () => {
    if (!accessToken) {
      return;
    }

    const pickupLocationCode =
      walkInForm.pickupLocationCode.trim().toUpperCase() ||
      assignedHubCodes[0]?.trim().toUpperCase() ||
      'BC-HOANKIEM';

    if (!walkInForm.receiverRegion.trim()) {
      setWalkInError('Cần tỉnh/thành người nhận.');
      return;
    }
    if (!walkInForm.receiverAddress.trim()) {
      setWalkInError('Cần địa chỉ chi tiết người nhận.');
      return;
    }
    if (hubsQuery.isLoading) {
      setWalkInError('Đang tải danh sách hub, vui lòng thử lại sau vài giây.');
      return;
    }
    if (hubsQuery.isError) {
      setWalkInError('Không tải được danh sách hub để chia đơn theo địa chỉ.');
      return;
    }
    if (!walkInReceiverHub) {
      setWalkInError('Không tìm thấy hub quản lý tỉnh/thành người nhận.');
      return;
    }

    if (isWalkInOverCeiling) {
      setWalkInError(
        'Kiện hàng vượt trần vận hành mạng lưới (Tối đa 70kg, cạnh 150cm, tổng 3 cạnh 300cm). Vui lòng hướng dẫn khách tách kiện hoặc chuyển sang vận tải FTL.',
      );
      return;
    }

    setWalkInMessage(null);
    setWalkInError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: walkInForm.manualCode.trim().toUpperCase() || null,
        currentStatus: 'PICKUP_COMPLETED',
        metadata: buildWalkInMetadata(
          walkInForm,
          estimatedFee,
          {
            senderHubCode: pickupLocationCode,
            receiverHub: walkInReceiverHub,
          },
          session?.user,
        ),
      });

      // Tự động ghi nhận tiếp nhận hàng tại quầy (Đã nhận hàng)
      const opUsername = session?.user.username || 'OPS';
      const opName = session?.user.displayName ? `${session.user.displayName} (${opUsername})` : opUsername;
      try {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: pickupLocationCode,
          scanType: 'PICKUP',
          actor: opUsername,
          note: `Tiếp nhận tại quầy bưu cục bởi ${opName}`,
          idempotencyKey: createIdempotencyKey('ops-walk-in-pickup'),
        });
      } catch {
        // Fallback offline
      }

      setCounterShipmentCode(createdShipment.shipmentCode);

      const resolvedDelivery = resolveRouteAndCourier(
        `${walkInForm.receiverAddress} ${walkInForm.receiverWard || ''} ${walkInForm.receiverRegion}`,
        walkInForm.receiverWard,
        undefined,
        walkInReceiverHub.code,
        false,
      );

      const labelPayload: ShippingLabelPrintPayload = {
        brandName: 'NEXUS LOGISTICS',
        serviceName: walkInForm.serviceType,
        shipmentCode: createdShipment.shipmentCode,
        senderName: walkInForm.senderName,
        senderPhone: walkInForm.senderPhone,
        senderAddress: walkInForm.senderAddress,
        receiverName: walkInForm.receiverName,
        receiverPhone: walkInForm.receiverPhone,
        receiverAddress: `${walkInForm.receiverAddress}${walkInForm.receiverWard ? `, ${walkInForm.receiverWard}` : ''}, ${walkInForm.receiverRegion}`,
        hubCode: walkInReceiverHub.code,
        zoneCode: walkInForm.receiverRegion,
        itemDescription: `${walkInForm.itemType || 'Hàng hóa'} (${walkInForm.weightKg || '0.5'}kg)`,
        parcelNote: `Dịch vụ: ${walkInForm.serviceType} | COD: ${formatCurrency(toPositiveNumber(walkInForm.codAmount))} | ${walkInForm.payerType === 'RECEIVER' ? 'Người nhận trả cước' : 'Người gửi trả cước'}`,
        qrValue: createdShipment.shipmentCode,
        routeTag: walkInReceiverHub.code,
        sortCode: `Hub đích: ${walkInReceiverHub.code}\nKhu vực: ${walkInForm.receiverRegion}`,
        codAmountText: formatCurrency(toPositiveNumber(walkInForm.codAmount)),
        createdAtText: new Date().toLocaleString('vi-VN'),
        deliveryInstruction: walkInForm.deliveryNote?.trim() || 'Gọi trước khi giao.',
        hotlineText: 'Hotline vận hành: 1900-1234',
        pickupRouteName: `Tiếp nhận tại quầy (${pickupLocationCode})`,
        pickupCourierId: opUsername,
        deliveryRouteName: resolvedDelivery.routeName,
        deliveryCourierId: resolvedDelivery.courierId,
        declaredValueText: walkInForm.declaredValue ? formatCurrency(Number(walkInForm.declaredValue)) : undefined,
      };

      setLastWalkInLabel(labelPayload);
      setWalkInMessage(
        `Đã tạo vận đơn ${createdShipment.shipmentCode} và tiếp nhận tại quầy thành công (Trạng thái: Đã nhận hàng).`,
      );
      setWalkInForm((previous) => ({
        ...DEFAULT_WALK_IN_FORM,
        senderName: previous.senderName,
        senderPhone: previous.senderPhone,
        senderAddress: previous.senderAddress,
        platform: previous.platform,
        pickupLocationCode: previous.pickupLocationCode,
      }));
    } catch (error) {
      setWalkInError(getErrorMessage(error));
    }
  };

  return (
    <div>
      {/* 1. OPERATIONAL FLOW TABS (Hợp nhất Hàng đến / Hàng gửi / Hàng phát / Tồn kho) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Tất cả vận đơn' },
          { id: 'arrival', label: 'Hàng đến (Inbound)' },
          { id: 'outbound', label: 'Hàng gửi (Outbound)' },
          { id: 'delivery', label: 'Đang phát (Delivery)' },
          { id: 'inventory', label: 'Tồn kho bưu cục' },
          { id: 'problem', label: 'Sự cố & Hoàn hàng' },
        ].map((tab) => {
          const isActive = currentFlow === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFlowTabChange(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1e40af' : '#475569',
                background: isActive ? '#dbeafe' : '#f8fafc',
                border: isActive ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onFilterSubmit} style={styles.systemFilterForm}>
        {/* Header Label */}
        <div style={styles.systemFilterHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={16} color="#334155" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
              BỘ LỌC THÔNG TIN VẬN ĐƠN (SYSTEM ADMIN)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              <span>Hiển thị:</span>
              <select value={pageSize} onChange={onPageSizeChange} style={styles.systemSelectSmall}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} dòng/trang
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Row 1: Main Search & Core Attributes */}
        <div style={styles.systemFilterRow}>
          <div style={{ flex: '2 1 320px', minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={styles.systemLabel}>
                Mã vận đơn {extractedInputCodes.length > 1 ? `(${extractedInputCodes.length} mã)` : ''}
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {extractedInputCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQInput('');
                      setIsBatchSearchOpen(false);
                    }}
                    style={styles.batchQuickLink}
                  >
                    Xóa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBatchSearchOpen((prev) => !prev)}
                  style={styles.batchToggleBtn}
                  title="Chuyển chế độ dán nhiều mã (tự xếp xuống dòng kiểu J&T)"
                >
                  {isBatchSearchOpen ? 'Thu gọn ô' : 'Dán nhiều mã (J&T)'}
                </button>
              </div>
            </div>
            {isBatchSearchOpen ? (
              <textarea
                name="q"
                placeholder="Dán danh sách mã đơn từ Excel, J&T hoặc bảng (Mỗi mã 1 dòng)..."
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
                onPaste={handlePasteCodes}
                rows={4}
                style={{
                  ...styles.systemInput,
                  height: 'auto',
                  minHeight: 88,
                  padding: '8px 10px',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  resize: 'vertical',
                }}
              />
            ) : (
              <input
                type="text"
                name="q"
                placeholder="Mã VĐ (Nhập 1 hoặc dán nhiều mã để tự động xuống dòng)..."
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
                onPaste={handlePasteCodes}
                style={styles.systemInput}
              />
            )}
            {extractedInputCodes.length > 1 && (
              <div style={styles.batchHelperNotice}>
                Đang tìm kiếm <strong>{extractedInputCodes.length}</strong> mã đơn đồng thời (Tự động tách dòng).
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={styles.systemLabel}>Trạng thái đơn hàng</label>
            <select
              name="status"
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
              style={styles.systemSelect}
            >
              <option value="">Tất cả trạng thái</option>
              {SHIPMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatShipmentStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={styles.systemLabel}>Phân loại đơn bưu cục</label>
            <select
              name="branchGoods"
              value={branchGoodsInput}
              onChange={(event) => setBranchGoodsInput(normalizeBranchGoodsFilter(event.target.value))}
              style={styles.systemSelect}
            >
              <option value="all">Tất cả đơn đã thao tác</option>
              <option value="readyForDelivery">Hàng đến hub, chưa ký nhận</option>
              <option value="inventoryByDay">Hàng tồn kho theo ngày</option>
              <option value="problemOrders">Đơn vấn đề</option>
              <option value="returnNeeded">Đơn cần chuyển hoàn</option>
            </select>
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={styles.systemLabel}>Thời gian tạo</label>
            <select
              name="time"
              value={timeInput}
              onChange={(event) => setTimeInput(normalizeTimeFilter(event.target.value))}
              style={styles.systemSelect}
            >
              <option value="today">Hôm nay</option>
              <option value="last7Days">7 ngày gần nhất</option>
              <option value="last30Days">30 ngày gần nhất</option>
              <option value="custom">Tùy chọn ngày</option>
              <option value="all">Tất cả thời gian</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', flex: '1 1 220px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.systemLabel}>Từ ngày</label>
              <input
                type="date"
                name="dateFrom"
                value={dateFromInput}
                onChange={(event) => {
                  setDateFromInput(event.target.value);
                  if (timeInput !== 'custom') setTimeInput('custom');
                }}
                style={styles.systemInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.systemLabel}>Đến ngày</label>
              <input
                type="date"
                name="dateTo"
                value={dateToInput}
                onChange={(event) => {
                  setDateToInput(event.target.value);
                  if (timeInput !== 'custom') setTimeInput('custom');
                }}
                style={styles.systemInput}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Customer Info, Addresses & Courier Instant Search */}
        <div style={{ ...styles.systemFilterRow, marginTop: '10px' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label style={styles.systemLabel}>SĐT Người gửi</label>
            <input
              type="text"
              name="senderPhone"
              placeholder="SĐT người gửi..."
              value={senderPhoneInput}
              onChange={(event) => setSenderPhoneInput(event.target.value)}
              style={styles.systemInput}
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label style={styles.systemLabel}>SĐT Người nhận</label>
            <input
              type="text"
              name="receiverPhone"
              placeholder="SĐT người nhận..."
              value={receiverPhoneInput}
              onChange={(event) => setReceiverPhoneInput(event.target.value)}
              style={styles.systemInput}
            />
          </div>

          <div style={{ flex: '1.5 1 180px' }}>
            <label style={styles.systemLabel}>Địa chỉ người gửi (Tỉnh/Huyện/Chi tiết)</label>
            <input
              type="text"
              name="senderAddress"
              placeholder="Lọc theo địa chỉ gửi..."
              value={senderAddressInput}
              onChange={(event) => setSenderAddressInput(event.target.value)}
              style={styles.systemInput}
            />
          </div>

          <div style={{ flex: '1.5 1 180px' }}>
            <label style={styles.systemLabel}>Địa chỉ người nhận (Miền/Tỉnh/Chi tiết)</label>
            <input
              type="text"
              name="receiverAddress"
              placeholder="Lọc theo địa chỉ nhận..."
              value={receiverAddressInput}
              onChange={(event) => setReceiverAddressInput(event.target.value)}
              style={styles.systemInput}
            />
          </div>

          <div style={{ flex: '1.5 1 180px' }}>
            <label style={styles.systemLabel}>Nhân viên Giao nhận (Mã / Tên Courier)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="courierId"
                list="courier-list-options"
                placeholder="Gõ mã hoặc tên courier..."
                value={courierInput}
                onChange={(event) => setCourierInput(event.target.value)}
                style={styles.systemInput}
              />
              <datalist id="courier-list-options">
                <option value="">Tất cả courier</option>
                {courierFilterOptions.map((cid) => (
                  <option key={cid} value={cid} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* System Action Toolbar */}
        <div style={styles.systemActionBar}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={styles.btnPrimaryApply}>
              Áp dụng lọc
            </button>
            <button type="button" onClick={onResetFilters} style={styles.btnGhostReset}>
              Đặt lại
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{
                ...styles.btnGhostReset,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: copyFeedback ? '#ecfdf5' : '#ffffff',
                borderColor: copyFeedback ? '#10b981' : '#cbd5e1',
                color: copyFeedback ? '#059669' : '#334155',
                fontWeight: 600,
              }}
              title="Sao chép toàn bộ mã vận đơn (phân tách bằng dấu xuống dòng) vào Clipboard"
              onClick={() => void handleCopyCodesToClipboard()}
            >
              {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
              <span>
                {copyFeedback ??
                  (selectedShipments.length > 0
                    ? `Sao chép ${selectedShipments.length} mã đã chọn`
                    : `Sao chép ${visibleShipments.length} mã trang này`)}
              </span>
            </button>
            <button
              type="button"
              style={styles.btnExportExcel}
              onClick={() => exportShipmentsToExcel(visibleShipments, 'Danh sách Vận đơn Bưu cục', 'Quản lý Vận đơn')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet size={15} />
                <span>Xuất Excel (Full Fields)</span>
              </span>
            </button>
            <button type="button" style={styles.btnSolidSystem} onClick={() => setIsCounterModalOpen(true)}>
              Tiếp nhận đơn hàng
            </button>
            <button type="button" style={styles.btnSolidSystem} onClick={() => setIsWalkInModalOpen(true)}>
              Tạo đơn hàng
            </button>
            <span style={styles.selectionSummaryText}>
              {selectedShipments.length > 0
                ? `${selectedShipments.length} vận đơn đã chọn`
                : 'Chưa chọn vận đơn'}
            </span>
            <button
              type="button"
              style={{
                ...styles.btnSolidSystem,
                ...(selectedShipments.length === 0 ? styles.actionButtonDisabled : null),
              }}
              disabled={selectedShipments.length === 0}
              onClick={() => void printSelectedLabels()}
            >
              In tem đơn hàng ({selectedShipments.length})
            </button>
          </div>
        </div>
      </form>

      <div style={styles.scopeNotice}>
        <strong>Phạm vi vận hành:</strong> {hubScope.scopeLabel}
        {hubScope.childHubs.length > 0 ? (
          <span style={{ marginLeft: '16px' }}>
            <label htmlFor="child-hub-select" style={{ marginRight: '6px', fontWeight: 600 }}>
              Hub con:
            </label>
            <select
              id="child-hub-select"
              value={selectedChildHub}
              onChange={(e) => setSelectedChildHub(e.target.value)}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--ops-border, #dbe2f0)',
                background: '#ffffff',
                fontSize: '12px',
                color: 'var(--ops-text, #102548)',
              }}
            >
              <option value="ALL">
                Tất cả trực thuộc ({hubScope.childHubs.length} {hubScope.hubLevel === 1 ? 'tỉnh' : 'phường'})
              </option>
              {hubScope.childHubs.map((child) => (
                <option key={child.code} value={child.code}>
                  {child.name} ({child.code})
                </option>
              ))}
            </select>
          </span>
        ) : null}
      </div>

      {dispatchMessage ? (
        <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
          {dispatchMessage}
        </div>
      ) : null}
      <div style={styles.branchFilterSummary}>
        <span>Trang hiện tại: {pageShipments.length} vận đơn</span>
        <span>Đang hiển thị: {visibleShipments.length} vận đơn</span>
        {hasShipmentSearch ? <span>Đang tra cứu toàn bộ thời gian trong phạm vi hub</span> : null}
        {branchGoodsFilter === 'all' && !hasShipmentSearch ? <span>Tất cả đơn đã thao tác tại bưu cục</span> : null}
        {branchGoodsFilter === 'readyForDelivery' && !hasShipmentSearch ? <span>Hàng đã đến hub, chưa ký nhận</span> : null}
        {branchGoodsFilter === 'inventoryByDay' ? <span>Tồn đến ngày: {inventoryDate}</span> : null}
        {courierFilter ? <span>Courier: {courierFilter}</span> : null}
      </div>
      {deliveryTasksQuery.isError ? (
        <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
          Không tải được dữ liệu courier giao hàng: {getErrorMessage(deliveryTasksQuery.error)}
        </div>
      ) : null}

      {isCounterModalOpen ? (
        <div style={styles.modalOverlay} onClick={() => setIsCounterModalOpen(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Tiếp nhận đơn hàng tại chi nhánh</h3>
              <button type="button" style={styles.modalCloseButton} onClick={() => setIsCounterModalOpen(false)}>
                Đóng
              </button>
            </div>
            <p style={styles.mutedText}>Quét hoặc nhập mã vận đơn khi khách mang hàng đến bưu cục.</p>
            <div style={styles.formGrid}>
              <select
                value={counterScanType}
                onChange={(event) => setCounterScanType(event.target.value as HubScanType)}
              >
                <option value="PICKUP">PICKUP</option>
                <option value="INBOUND">INBOUND</option>
                <option value="OUTBOUND">OUTBOUND</option>
              </select>
              <input
                placeholder="Mã vận đơn"
                value={counterShipmentCode}
                onChange={(event) => setCounterShipmentCode(event.target.value)}
              />
              <input
                placeholder="Mã vị trí chi nhánh"
                value={counterLocationCode}
                onChange={(event) => setCounterLocationCode(event.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Ghi chú (không bắt buộc)"
                value={counterNote}
                onChange={(event) => setCounterNote(event.target.value)}
              />
              <button type="button" disabled={isScanSubmitting} onClick={() => void submitCounterScan()}>
                {isScanSubmitting ? 'Đang gửi quét...' : 'Gửi quét'}
              </button>
            </div>
            {counterMessage ? (
              <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
                {counterMessage}
              </div>
            ) : null}
            {counterError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {counterError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isDispatchModalOpen ? (
        <div style={styles.modalOverlay} onClick={() => setIsDispatchModalOpen(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Quét phát và phân công courier</h3>
              <button type="button" style={styles.modalCloseButton} onClick={() => setIsDispatchModalOpen(false)}>
                Đóng
              </button>
            </div>
            <p style={styles.mutedText}>
              Hàng đã đến bưu cục thì thao tác quét phát sẽ gắn trực tiếp nhiệm vụ DELIVERY cho courier.
            </p>
            <div style={styles.formGrid}>
              <input
                placeholder="Mã vận đơn"
                value={dispatchShipmentCode}
                onChange={(event) => setDispatchShipmentCode(event.target.value)}
              />
              <select
                value={dispatchCourierId}
                onChange={(event) => setDispatchCourierId(event.target.value)}
                disabled={dispatchLoading || courierOptionsQuery.isLoading}
              >
                <option value="">Chọn courier</option>
                {(courierOptionsQuery.data ?? []).map((courier) => (
                  <option key={courier.courierId} value={courier.courierId}>
                    {courier.label}
                  </option>
                ))}
              </select>
              <textarea
                rows={3}
                placeholder="Ghi chú quét phát (không bắt buộc)"
                value={dispatchNote}
                onChange={(event) => setDispatchNote(event.target.value)}
              />
              <button type="button" disabled={dispatchLoading} onClick={() => void submitDispatchScan()}>
                {dispatchLoading ? 'Đang quét phát...' : 'Xác nhận quét phát'}
              </button>
            </div>
            {courierOptionsQuery.isError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {getErrorMessage(courierOptionsQuery.error)}
              </div>
            ) : null}
            {dispatchError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {dispatchError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isWalkInModalOpen ? (
        <div style={styles.modalOverlay} onClick={() => setIsWalkInModalOpen(false)}>
          <div
            style={{
              ...styles.modalCard,
              width: 'min(980px, 95vw)',
              backgroundColor: '#f1f5f9',
              padding: '16px',
              gap: '12px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ ...styles.cardTitle, fontSize: '16px', color: '#0f172a' }}>
                  Tạo đơn hàng Walk-in tại quầy bưu cục
                </h3>
                <p style={{ ...styles.mutedText, fontSize: '12px', marginTop: '2px' }}>
                  Tạo vận đơn trực tiếp cho khách mang hàng đến quầy bưu cục • Tiếp nhận tự động
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                  href={routePaths.branchBusinessOrderCreate}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12.5px',
                    color: '#2563eb',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Mở POS Bưu cục chuyên sâu ↗
                </a>
                <button
                  type="button"
                  style={styles.modalCloseButton}
                  onClick={() => setIsWalkInModalOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* KHỐI 1: 2 CỘT (NGƯỜI GỬI & NGƯỜI NHẬN) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Box Người gửi */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>1. Khách gửi vãng lai (Thông tin người gửi)</strong>
                  {operatorHub ? (
                    <span
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                      }}
                      title="Điểm tiếp nhận bưu phẩm tại quầy"
                    >
                      Bưu cục trực: [{operatorHub.code}]
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  ℹ️ Đơn quầy là khách vãng lai: Nhập họ tên, SĐT và địa chỉ nhà/shop của khách để giao hoàn hàng khi phát không thành công.
                </div>
                <input
                  style={styles.systemInput}
                  placeholder="Họ tên khách gửi (*)"
                  value={walkInForm.senderName}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderName: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  placeholder="Số điện thoại khách gửi (09xx...) (*)"
                  value={walkInForm.senderPhone}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderPhone: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  placeholder="Địa chỉ nhà / shop khách gửi (để shipper trả hàng nếu phát thất bại) (*)"
                  value={walkInForm.senderAddress}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderAddress: event.target.value }))}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    style={{ ...styles.systemInput, backgroundColor: '#f8fafc', color: '#64748b' }}
                    placeholder="Bưu cục nhận"
                    value={walkInForm.pickupLocationCode || operatorHub?.code || ''}
                    readOnly
                    disabled
                    title="Mã bưu cục quầy giao dịch tiếp nhận"
                  />
                  <input
                    style={styles.systemInput}
                    placeholder="Mã vận đơn (tùy chọn)"
                    value={walkInForm.manualCode}
                    onChange={(event) => setWalkInForm((prev) => ({ ...prev, manualCode: event.target.value }))}
                  />
                </div>
              </div>

              {/* Box Người nhận */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>2. Người nhận & Tuyến phát</strong>
                  {walkInReceiverHub ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Target size={12} /> Hub phát: [{walkInReceiverHub.code}]
                    </span>
                  ) : null}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    style={styles.systemInput}
                    placeholder="Tên người nhận (*)"
                    value={walkInForm.receiverName}
                    onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverName: event.target.value }))}
                  />
                  <input
                    style={styles.systemInput}
                    placeholder="SĐT người nhận (*)"
                    value={walkInForm.receiverPhone}
                    onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    style={styles.systemInput}
                    value={walkInForm.receiverRegion}
                    onChange={(event) =>
                      setWalkInForm((prev) => ({
                        ...prev,
                        receiverRegion: event.target.value,
                        receiverWard: '',
                      }))
                    }
                  >
                    <option value="">
                      {locationsQuery.isLoading ? 'Đang tải tỉnh/thành...' : 'Chọn Tỉnh/Thành (*)'}
                    </option>
                    {walkInForm.receiverRegion &&
                    !provinceOptions.some((province) => province.name === walkInForm.receiverRegion) ? (
                      <option value={walkInForm.receiverRegion}>{walkInForm.receiverRegion}</option>
                    ) : null}
                    {provinceOptions.map((province) => (
                      <option key={province.code} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>

                  <select
                    style={styles.systemInput}
                    value={walkInForm.receiverWard || ''}
                    disabled={!walkInForm.receiverRegion || walkInWardOptions.length === 0}
                    onChange={(event) =>
                      setWalkInForm((prev) => ({ ...prev, receiverWard: event.target.value }))
                    }
                  >
                    <option value="">
                      {!walkInForm.receiverRegion
                        ? 'Chọn tỉnh/thành trước'
                        : walkInWardOptions.length === 0
                        ? 'Không có danh sách xã'
                        : 'Chọn Phường/Xã'}
                    </option>
                    {walkInWardOptions.map((ward) => (
                      <option key={ward.code} value={ward.name}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  style={styles.systemInput}
                  placeholder="Số nhà, tên đường, ngõ xóm chi tiết (*)"
                  value={walkInForm.receiverAddress}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
                />
              </div>
            </div>

            {/* KHỐI 3: HÀNG HÓA & CƯỚC DỊCH VỤ */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                display: 'grid',
                gap: '8px',
              }}
            >
              <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                3. Hàng hóa, Kích thước & Cước dịch vụ
              </strong>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                }}
              >
                <select
                  style={styles.systemInput}
                  value={walkInForm.itemType}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, itemType: event.target.value }))}
                >
                  <option value="">-- Nhóm hàng hóa chuẩn Carrier --</option>
                  <option value="Hàng thông thường (Quần áo, đồ gia dụng...)">Hàng thông thường (GENERAL)</option>
                  <option value="Hàng dễ vỡ (Gốm sứ, thủy tinh, chất lỏng...)">Hàng dễ vỡ (FRAGILE)</option>
                  <option value="Điện tử & Giá trị cao (Điện thoại, laptop...)">Điện tử & Giá trị cao (HIGH_VALUE)</option>
                  <option value="Hàng cồng kềnh / nặng (Máy móc, quạt...)">Hàng cồng kềnh (BULKY)</option>
                  <option value="Tài liệu / Thư từ bưu chính">Tài liệu / Thư từ (DOCUMENT)</option>
                </select>
                <input
                  style={styles.systemInput}
                  type="number"
                  step="0.1"
                  placeholder="Khối lượng (kg)"
                  value={walkInForm.weightKg}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  type="number"
                  placeholder="Dài (cm)"
                  value={walkInForm.lengthCm}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  type="number"
                  placeholder="Rộng (cm)"
                  value={walkInForm.widthCm}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, widthCm: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  type="number"
                  placeholder="Cao (cm)"
                  value={walkInForm.heightCm}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                />
              </div>

              {isWalkInOverCeiling ? (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#991b1b',
                    fontWeight: 600,
                  }}
                >
                  Kiện hàng vượt trần vận hành mạng lưới (Tối đa 70kg, cạnh 150cm, tổng 3 cạnh 300cm). Vui lòng tách kiện hoặc hướng dẫn khách dùng vận tải nguyên chuyến FTL.
                </div>
              ) : null}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '8px',
                }}
              >
                <select
                  style={styles.systemInput}
                  value={walkInForm.serviceType}
                  onChange={(event) =>
                    setWalkInForm((prev) => ({ ...prev, serviceType: event.target.value as ServiceType }))
                  }
                >
                  <option value="STANDARD">STANDARD (Giao chuẩn)</option>
                  <option value="EXPRESS">EXPRESS (Giao nhanh)</option>
                  <option value="SAME_DAY">SAME_DAY (Hỏa tốc)</option>
                </select>
                <input
                  style={styles.systemInput}
                  type="number"
                  placeholder="Số tiền COD (VNĐ)"
                  value={walkInForm.codAmount}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, codAmount: event.target.value }))}
                />
                <input
                  style={styles.systemInput}
                  type="number"
                  placeholder="Giá trị khai báo (VNĐ)"
                  value={walkInForm.declaredValue}
                  onChange={(event) => setWalkInForm((prev) => ({ ...prev, declaredValue: event.target.value }))}
                />
                <select
                  style={styles.systemInput}
                  value={walkInForm.payerType || 'SENDER'}
                  onChange={(event) =>
                    setWalkInForm((prev) => ({
                      ...prev,
                      payerType: event.target.value as 'SENDER' | 'RECEIVER',
                    }))
                  }
                >
                  <option value="SENDER">Người gửi trả cước (Tại quầy)</option>
                  <option value="RECEIVER">Người nhận trả cước (Khi giao)</option>
                </select>
              </div>

              <input
                style={styles.systemInput}
                placeholder="Ghi chú giao hàng (vd: Gọi trước khi giao, giao giờ hành chính...)"
                value={walkInForm.deliveryNote}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, deliveryNote: event.target.value }))}
              />
            </div>

            {/* FOOTER & TẠO ĐƠN */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '6px',
                borderTop: '1px solid #cbd5e1',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', color: '#475569' }}>Cước phí dự kiến: </span>
                <strong style={{ fontSize: '18px', color: '#1d4ed8' }}>{formatCurrency(estimatedFee)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  style={styles.btnGhostReset}
                  onClick={() => setIsWalkInModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.btnPrimaryApply,
                    padding: '0 24px',
                    backgroundColor: isWalkInOverCeiling ? '#94a3b8' : '#2563eb',
                    borderColor: isWalkInOverCeiling ? '#94a3b8' : '#2563eb',
                    cursor: isWalkInOverCeiling ? 'not-allowed' : 'pointer',
                  }}
                  disabled={isWalkInSubmitting || isWalkInOverCeiling}
                  onClick={() => void submitWalkInShipment()}
                >
                  {isWalkInSubmitting ? 'Đang tạo đơn...' : isWalkInOverCeiling ? 'Vượt trần mạng lưới' : 'Tạo đơn'}
                </button>
              </div>
            </div>

            {/* ALERTS & STATUS */}
            {walkInError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {walkInError}
              </div>
            ) : null}

            {walkInMessage ? (
              <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{walkInMessage}</span>
                  {lastWalkInLabel ? (
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => openShippingLabelPrint(lastWalkInLabel)}
                    >
                      <Printer size={14} /> In ngay tem nhãn [{lastWalkInLabel.shipmentCode}]
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {shipmentQuery.isLoading ? <p>Đang tải vận đơn...</p> : null}
      {shipmentQuery.isFetching && !shipmentQuery.isLoading ? <p>Đang cập nhật trang vận đơn...</p> : null}
      {shipmentQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentQuery.error)}</p>
      ) : null}
      {lacksHubScope ? (
        <p>Không hiển thị được vận đơn vì tài khoản OPS chưa được gán hub.</p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length === 0 ? (
        <p>
          Không tìm thấy vận đơn phù hợp ngày hoặc bộ lọc hiện tại.
        </p>
      ) : null}
      {shipmentQuery.isSuccess ? (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '14px 0 8px 0', color: '#0f172a' }}>
            Danh sách vận đơn
          </h2>
          <div style={styles.paginationBar}>
            <span>
              Trang {pageNumber} | {formatTotal(pageInfo.total)}
            </span>
            <div style={styles.paginationActions}>
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage || shipmentQuery.isFetching}
              >
                Trang trước
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={!pageInfo.hasNextPage || shipmentQuery.isFetching}
              >
                Trang sau
              </button>
            </div>
          </div>
          {visibleShipments.length > 0 ? (
            <ShipmentsTable
              items={visibleShipments}
              deliveryCourierByShipment={deliveryCourierByShipment}
              deliveryTaskByShipment={deliveryTaskByShipment}
              selectedShipmentCodes={selectedShipmentCodes}
              onToggleShipment={toggleShipmentSelection}
              onToggleAllVisible={toggleAllVisibleShipments}
              storageKeyPrefix="ops_shipment_list"
              defaultVisibleColumns={{
                stt: false,
                code: true,
                status: true,
                parcelType: false,
                chargeableWeight: false,
                primaryHub: false,
                oppositeHub: false,
                senderName: true,
                senderPhone: false,
                senderAddress: false,
                receiverName: true,
                receiverPhone: true,
                receiverAddress: true,
                cod: true,
                routeHub: true,
                ageMinutes: false,
                createdAt: true,
                deliveredAt: false,
                updatedAt: false,
                deliveryNote: false,
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  helperText: {
    color: '#2d3f99',
  },
  scopeNotice: {
    marginBottom: 12,
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#f8faff',
    color: '#1f2b6f',
  },
  filterForm: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  filterControls: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 320,
  },
  searchInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 360,
    minHeight: 42,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  select: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 220,
  },
  dateInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 160,
  },
  phoneInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 160,
  },
  pageSizeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#2d3f99',
    fontSize: 13,
    fontWeight: 600,
  },
  pageSizeSelect: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 88,
  },
  filterActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '6px 8px',
    border: '1px solid #d9def3',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  branchFilterSummary: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    margin: '8px 0 12px',
    color: '#1f2b6f',
    fontSize: 13,
    fontWeight: 700,
  },
  systemFilterForm: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  systemFilterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid #e2e8f0',
  },
  systemFilterRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  systemLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  systemInput: {
    width: '100%',
    height: 36,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '0 10px',
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  batchQuickLink: {
    border: 'none',
    background: 'transparent',
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 4px',
    textDecoration: 'underline',
  },
  batchToggleBtn: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    padding: '1px 6px',
    cursor: 'pointer',
  },
  batchHelperNotice: {
    marginTop: 4,
    fontSize: 11,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid #bfdbfe',
  },
  systemSelect: {
    width: '100%',
    height: 36,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '0 10px',
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
  },
  systemSelectSmall: {
    height: 30,
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '0 8px',
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  systemActionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #e2e8f0',
  },
  btnPrimaryApply: {
    height: 36,
    padding: '0 20px',
    borderRadius: 8,
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  btnGhostReset: {
    height: 36,
    padding: '0 16px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnExportExcel: {
    height: 36,
    padding: '0 16px',
    borderRadius: 8,
    border: '1px solid #059669',
    backgroundColor: '#059669',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  btnSolidSystem: {
    height: 36,
    padding: '0 16px',
    borderRadius: 8,
    border: '1px solid #334155',
    backgroundColor: '#334155',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  selectionSummaryText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    margin: '12px 0',
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    color: '#1f2b6f',
    fontWeight: 600,
  },
  paginationActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    border: '1px solid var(--ops-primary-dark)',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: 'var(--ops-primary-dark)',
    color: '#ffffff',
    fontWeight: 700,
  },
  actionButtonDisabled: {
    borderColor: '#aeb8df',
    backgroundColor: '#aeb8df',
    cursor: 'not-allowed',
  },
  selectionSummary: {
    color: '#1f2b6f',
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
    zIndex: 1200,
  },
  modalCard: {
    width: 'min(980px, 100%)',
    maxHeight: 'calc(100vh - 96px)',
    overflowY: 'auto',
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8faff',
    display: 'grid',
    gap: 8,
    alignContent: 'start',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalCloseButton: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    color: 'var(--ops-primary-dark)',
    fontWeight: 700,
  },
  cardTitle: {
    margin: 0,
  },
  mutedText: {
    margin: 0,
    color: '#2d3f99',
  },
  formGrid: {
    display: 'grid',
    gap: 8,
  },
  formGridMulti: {
    display: 'grid',
    gap: 8,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  notice: {
    marginTop: 8,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid',
    fontWeight: 600,
    animation: 'ops-notice-in 0.22s ease-out',
  },
  successNotice: {
    borderColor: '#86efac',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  errorNotice: {
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
};
