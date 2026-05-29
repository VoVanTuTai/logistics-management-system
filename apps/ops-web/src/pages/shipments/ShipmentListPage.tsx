import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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
import { openShippingLabelPrint } from '../../printing/shippingLabelPrint';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { createIdempotencyKey } from '../../utils/idempotency';
import { resolveBranchHubByProvince } from '../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';
import { queryKeys } from '../../utils/queryKeys';
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
const DEFAULT_BRANCH_GOODS_FILTER: BranchGoodsFilter = 'readyForDelivery';
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
): Record<string, unknown> {
  const senderHubCode = route.senderHubCode;
  const receiverHubCode = route.receiverHub.code.trim().toUpperCase();

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
    platform: form.platform.trim() || 'OPS_WALK_IN',
    source: 'ops-web',
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
  deliveryCourierByShipment: Map<string, string>,
): boolean {
  const shipmentCode = normalizeOpsCode(shipment.shipmentCode);
  const assignedCourier = deliveryCourierByShipment.get(shipmentCode) ?? 'Chưa bàn giao';

  return (
    READY_FOR_DELIVERY_STATUSES.has(normalizeOpsCode(shipment.currentStatus)) &&
    assignedCourier === 'Chưa bàn giao'
  );
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

  return new Map(
    Array.from(result.entries()).map(([shipmentCode, task]) => [
      shipmentCode,
      task.assignedCourierId ?? 'Chưa bàn giao',
    ]),
  );
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
  const pageSize = toPageNumber(searchParams.get('limit'), DEFAULT_PAGE_SIZE, 10, 100);
  const offset = toPageNumber(searchParams.get('offset'), 0, 0, 1_000_000);
  const pageNumber = Math.floor(offset / pageSize) + 1;
  const [qInput, setQInput] = useState(filters.q ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [timeInput, setTimeInput] = useState<ShipmentTimeFilter>(timeFilter);
  const [dateFromInput, setDateFromInput] = useState(selectedDateFrom);
  const [dateToInput, setDateToInput] = useState(selectedDateTo);
  const [branchGoodsInput, setBranchGoodsInput] = useState<BranchGoodsFilter>(branchGoodsFilter);
  const [inventoryDateInput, setInventoryDateInput] = useState(inventoryDate);
  const [courierInput, setCourierInput] = useState(courierFilter);
  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);

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
  const isMultiCodeSearch = shipmentSearchCodes.length > 1;
  const dateRange = useMemo(
    () => (hasShipmentSearch ? {} : buildCreatedAtRange(timeFilter, selectedDateFrom, selectedDateTo, today)),
    [hasShipmentSearch, selectedDateFrom, selectedDateTo, timeFilter, today],
  );
  const shipmentPageFilters = useMemo<ShipmentListFilters>(
    () => ({
      q: isMultiCodeSearch ? undefined : filters.q,
      shipmentCodes: isMultiCodeSearch ? shipmentSearchCodes : undefined,
      status: filters.status,
      hubCodes: canViewAllHubAreas ? undefined : assignedHubCodes,
      createdFrom: dateRange.createdFrom,
      createdTo: dateRange.createdTo,
      limit: pageSize,
      offset,
    }),
    [
      assignedHubCodes,
      assignedHubCodesKey,
      canViewAllHubAreas,
      dateRange.createdFrom,
      dateRange.createdTo,
      filters.q,
      filters.status,
      isMultiCodeSearch,
      offset,
      pageSize,
      shipmentSearchCodes,
    ],
  );
  const lacksHubScope = Boolean(accessToken) && !canViewAllHubAreas && assignedHubCodes.length === 0;
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
  const walkInReceiverHub = useMemo(
    () => resolveBranchHubByProvince(activeHubs, walkInForm.receiverRegion),
    [activeHubs, walkInForm.receiverRegion],
  );
  const pageShipments = shipmentQuery.data?.items ?? EMPTY_SHIPMENTS;
  const deliveryCourierByShipment = useMemo(
    () => buildDeliveryCourierByShipment(deliveryTasksQuery.data ?? []),
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
              isReadyForDeliveryShipment(shipment, deliveryCourierByShipment)) ||
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

      return statusMatched && courierMatched;
    });
  }, [
    branchGoodsFilter,
    courierFilter,
    deliveryCourierByShipment,
    hasShipmentSearch,
    inventoryDate,
    pageShipments,
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
  }, [
    branchGoodsFilter,
    courierFilter,
    filters.q,
    filters.status,
    inventoryDate,
    selectedDateFrom,
    selectedDateTo,
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

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
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

  const submitWalkInShipment = async (createAndScanPickup: boolean) => {
    if (!accessToken) {
      return;
    }

    const pickupLocationCode = walkInForm.pickupLocationCode.trim().toUpperCase();
    if (createAndScanPickup && !pickupLocationCode) {
      setWalkInError('Cần mã vị trí lấy hàng cho thao tác "Tạo + quét pickup".');
      return;
    }
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

    setWalkInMessage(null);
    setWalkInError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: walkInForm.manualCode.trim().toUpperCase() || null,
        metadata: buildWalkInMetadata(walkInForm, estimatedFee, {
          senderHubCode:
            pickupLocationCode ||
            assignedHubCodes[0]?.trim().toUpperCase() ||
            null,
          receiverHub: walkInReceiverHub,
        }),
      });

      let successMessage = `Đã tạo vận đơn ${createdShipment.shipmentCode}.`;

      if (createAndScanPickup) {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: pickupLocationCode,
          scanType: 'PICKUP',
          note: 'vận đơn walk-in tiếp nhận tại quầy',
          idempotencyKey: createIdempotencyKey('ops-walk-in-pickup'),
        });
        successMessage += ' Đã ghi nhận quét pickup.';
        setCounterShipmentCode(createdShipment.shipmentCode);
      }

      setWalkInMessage(successMessage);
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
      <h2>Danh sách vận đơn</h2>
      <p style={styles.helperText}>
        Mặc định hiển thị đơn đã về bưu cục, chưa phát sinh thao tác phát hàng. Nhập mã để tra cứu mọi vận đơn thuộc phạm vi hub.
      </p>

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <div style={styles.filterControls}>
          <textarea
            name="q"
            rows={2}
            placeholder="Tìm mã vận đơn trong toàn bộ dữ liệu thuộc hub. Có thể dán nhiều mã, mỗi mã một dòng hoặc cách nhau bằng dấu phẩy."
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            style={styles.searchInput}
          />
          <select
            name="status"
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            style={styles.select}
          >
            <option value="">Tất cả trạng thái</option>
            {SHIPMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            name="time"
            value={timeInput}
            onChange={(event) => setTimeInput(normalizeTimeFilter(event.target.value))}
            style={styles.select}
          >
            <option value="today">Hôm nay</option>
            <option value="last7Days">7 ngày gần nhất</option>
            <option value="last30Days">30 ngày gần nhất</option>
            <option value="custom">Tùy chọn ngày</option>
            <option value="all">Tất cả thời gian</option>
          </select>
          <input
            type="date"
            name="dateFrom"
            value={dateFromInput}
            onChange={(event) => setDateFromInput(event.target.value)}
            style={styles.dateInput}
            disabled={timeInput !== 'custom'}
          />
          <input
            type="date"
            name="dateTo"
            value={dateToInput}
            onChange={(event) => setDateToInput(event.target.value)}
            style={styles.dateInput}
            disabled={timeInput !== 'custom'}
          />
          <select
            name="branchGoods"
            value={branchGoodsInput}
            onChange={(event) => setBranchGoodsInput(normalizeBranchGoodsFilter(event.target.value))}
            style={styles.select}
          >
            <option value="readyForDelivery">Hàng đã đến chờ phát</option>
            <option value="all">Tất cả hàng hoá bưu cục</option>
            <option value="inventoryByDay">Hàng tồn kho theo ngày</option>
            <option value="problemOrders">Đơn vấn đề</option>
            <option value="returnNeeded">Đơn cần chuyển hoàn</option>
          </select>
          <input
            type="date"
            name="inventoryDate"
            value={inventoryDateInput}
            onChange={(event) => setInventoryDateInput(event.target.value)}
            style={styles.dateInput}
            disabled={branchGoodsInput !== 'inventoryByDay'}
          />
          <select
            name="courierId"
            value={courierInput}
            onChange={(event) => setCourierInput(event.target.value)}
            style={styles.select}
            disabled={deliveryTasksQuery.isLoading && courierFilterOptions.length === 0}
          >
            <option value="">Tất cả courier</option>
            {courierFilterOptions.map((courierId) => (
              <option key={courierId} value={courierId}>
                {courierId}
              </option>
            ))}
          </select>
          <label style={styles.pageSizeControl}>
            <span>Số dòng/trang</span>
            <select value={pageSize} onChange={onPageSizeChange} style={styles.pageSizeSelect}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Áp dụng</button>
          <button type="button" onClick={onResetFilters}>
            Đặt lại
          </button>
        </div>

        <div style={styles.filterActions}>
          <button type="button" style={styles.actionButton} onClick={() => setIsCounterModalOpen(true)}>
            Tiếp nhận đơn hàng
          </button>
          <button type="button" style={styles.actionButton} onClick={() => setIsWalkInModalOpen(true)}>
            Tạo đơn hàng
          </button>
          <span style={styles.selectionSummary}>
            {selectedShipments.length > 0
              ? `${selectedShipments.length} vận đơn đã chọn`
              : 'Chưa chọn vận đơn'}
          </span>
          <button
            type="button"
            style={{
              ...styles.actionButton,
              ...(selectedShipments.length === 0 ? styles.actionButtonDisabled : null),
            }}
            disabled={selectedShipments.length === 0}
            onClick={() => void printSelectedLabels()}
          >
            In tem đơn hàng
          </button>
        </div>
      </form>

      {!canViewAllHubAreas ? (
        <div style={styles.scopeNotice}>
          <strong>Phạm vi hub:</strong>{' '}
          {assignedHubCodes.length > 0
            ? assignedHubCodes.join(', ')
            : 'Chưa được gán hub. Vui lòng liên hệ admin để cấp hub cho tài khoản.'}
        </div>
      ) : null}

      {dispatchMessage ? (
        <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
          {dispatchMessage}
        </div>
      ) : null}
      <div style={styles.branchFilterSummary}>
        <span>Trang hiện tại: {pageShipments.length} vận đơn</span>
        <span>Đang hiển thị: {visibleShipments.length} vận đơn</span>
        {hasShipmentSearch ? <span>Đang tra cứu toàn bộ thời gian trong phạm vi hub</span> : null}
        {branchGoodsFilter === 'readyForDelivery' && !hasShipmentSearch ? <span>Hàng đã đến, chưa thao tác phát</span> : null}
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
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Tạo đơn hàng Walk-in</h3>
              <button type="button" style={styles.modalCloseButton} onClick={() => setIsWalkInModalOpen(false)}>
                Đóng
              </button>
            </div>
            <p style={styles.mutedText}>
              Nhân viên Ops có thể tạo vận đơn cho khách walk-in với cấu trúc metadata đồng bộ với merchant-web.
            </p>
            <div style={styles.formGridMulti}>
              <input
                placeholder="Mã 12 số, ví dụ 333000000001"
                value={walkInForm.manualCode}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, manualCode: event.target.value }))}
              />
              <input
                placeholder="Tên người gửi"
                value={walkInForm.senderName}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderName: event.target.value }))}
              />
              <input
                placeholder="SĐT người gửi"
                value={walkInForm.senderPhone}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderPhone: event.target.value }))}
              />
              <input
                placeholder="Địa chỉ người gửi"
                value={walkInForm.senderAddress}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderAddress: event.target.value }))}
              />
              <input
                placeholder="Tên người nhận"
                value={walkInForm.receiverName}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverName: event.target.value }))}
              />
              <input
                placeholder="SĐT người nhận"
                value={walkInForm.receiverPhone}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
              />
              <select
                value={walkInForm.receiverRegion}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, receiverRegion: event.target.value }))
                }
              >
                <option value="">
                  {locationsQuery.isLoading ? 'Đang tải tỉnh/thành...' : 'Tỉnh/Thành người nhận'}
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
              <input
                placeholder="Đường + địa chỉ chi tiết người nhận"
                value={walkInForm.receiverAddress}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
              />
              <input
                placeholder="Loại hàng"
                value={walkInForm.itemType}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, itemType: event.target.value }))}
              />
              <input
                placeholder="Khối lượng (kg)"
                value={walkInForm.weightKg}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, weightKg: event.target.value }))}
              />
              <input
                placeholder="Dài (cm)"
                value={walkInForm.lengthCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
              />
              <input
                placeholder="Rộng (cm)"
                value={walkInForm.widthCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, widthCm: event.target.value }))}
              />
              <input
                placeholder="Cao (cm)"
                value={walkInForm.heightCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, heightCm: event.target.value }))}
              />
              <input
                placeholder="Giá trị khai báo"
                value={walkInForm.declaredValue}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, declaredValue: event.target.value }))}
              />
              <select
                value={walkInForm.serviceType}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, serviceType: event.target.value as ServiceType }))
                }
              >
                <option value="STANDARD">STANDARD</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="SAME_DAY">SAME_DAY</option>
              </select>
              <input
                placeholder="Số tiền COD"
                value={walkInForm.codAmount}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, codAmount: event.target.value }))}
              />
              <input
                placeholder="Nền tảng (Shopee, TikTokShop, WalkIn...)"
                value={walkInForm.platform}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, platform: event.target.value }))}
              />
              <input
                placeholder="Mã vị trí pickup (cho tạo + quét pickup)"
                value={walkInForm.pickupLocationCode}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, pickupLocationCode: event.target.value }))
                }
              />
            </div>
            <textarea
              rows={3}
              placeholder="Ghi chú giao hàng"
              value={walkInForm.deliveryNote}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, deliveryNote: event.target.value }))}
            />
            <p style={styles.mutedText}>Cước phí dự kiến: {formatCurrency(estimatedFee)}</p>
            <div style={styles.buttonRow}>
              <button
                type="button"
                disabled={isWalkInSubmitting}
                onClick={() => void submitWalkInShipment(false)}
              >
                {isWalkInSubmitting ? 'Đang gửi...' : 'Tạo vận đơn'}
              </button>
              <button
                type="button"
                disabled={isWalkInSubmitting}
                onClick={() => void submitWalkInShipment(true)}
              >
                {isWalkInSubmitting ? 'Đang gửi...' : 'Tạo + quét pickup'}
              </button>
            </div>
            {walkInMessage ? (
              <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
                {walkInMessage}
              </div>
            ) : null}
            {walkInError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {walkInError}
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
              selectedShipmentCodes={selectedShipmentCodes}
              onToggleShipment={toggleShipmentSelection}
              onToggleAllVisible={toggleAllVisibleShipments}
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
    minWidth: 170,
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
    border: '1px solid #0f4c81',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#0f4c81',
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
    color: '#0f4c81',
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
