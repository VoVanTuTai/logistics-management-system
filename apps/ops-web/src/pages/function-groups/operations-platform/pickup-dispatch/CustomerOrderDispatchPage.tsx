import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { authClient } from '../../../../features/auth/auth.client';
import type { OpsUserDto } from '../../../../features/auth/auth.types';
import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import type { HubDto } from '../../../../features/masterdata/masterdata.types';
import { useVietnamAdministrativeUnitsQuery } from '../../../../features/locations/vietnamAdministrativeUnits.api';
import { usePickupRequestsQuery } from '../../../../features/pickups/pickups.api';
import type { PickupRequestListItemDto } from '../../../../features/pickups/pickups.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import {
  tasksClient,
  useDispatchTasksRealtime,
  useTasksQuery,
} from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { routePaths } from '../../../../navigation/routes';
import { useAuthStore } from '../../../../store/authStore';
import { deriveHubScopeTokens, normalizeLocationToken } from '../../../../utils/locationScope';
import { queryKeys } from '../../../../utils/queryKeys';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { useResizableColumns } from '../../../../hooks/useResizableColumns';
import {
  DEFAULT_OPS_COL_WIDTHS,
  MIN_OPS_COL_WIDTHS,
  getOpsStatusBadgeStyle,
  resolveShipmentStatusLabel,
  formatCurrency,
  resolveChargeableWeight,
  resolveParcelWeight,
  resolveParcelClassification,
  resolveServiceTag,
  resolveFeePayer,
  resolveInspectionPolicy,
  ColumnVisibilityPicker,
  useColumnVisibility,
  styles as shipmentTableStyles,
} from '../../../shipments/ShipmentsTable';
import './CustomerOrderDispatchPage.css';

type DispatchStatus = 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

interface DispatchOrderRow {
  id: string;
  shipment: ShipmentListItemDto | null;
  taskCode: string;
  orderCode: string;
  shipmentCode: string;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  ward: string;
  district: string;
  status: DispatchStatus;
  source: string;
  serviceType: string;
  pickupHub: string;
  assignedCourierId: string | null;
  assignedCourierName: string | null;
  scheduledAt: string | null;
  requestedAt: string | null;
  parcelCount: number;
  note: string;
  pickupStatus: string | null;
}

interface CourierOption {
  id: string;
  name: string;
  hub: string;
  activeTasks: number;
}

const STATUS_OPTIONS: Array<{ value: 'ALL' | DispatchStatus; label: string }> = [
  { value: 'ALL', label: 'Toàn bộ' },
  { value: 'CREATED', label: 'Chưa điều phối' },
  { value: 'ASSIGNED', label: 'Đã điều phối NVGN' },
  { value: 'COMPLETED', label: 'Đã lấy hàng' },
  { value: 'CANCELLED', label: 'Đã hủy / thất bại' },
];

const SERVICE_LABELS: Record<string, string> = {
  STANDARD: 'Tiêu chuẩn',
  EXPRESS: 'Nhanh',
  SAME_DAY: 'Trong ngày',
};

const SOURCE_LABELS: Record<string, string> = {
  'merchant-web': 'Merchant web',
  MERCHANT_WEB: 'Merchant web',
  MARKETPLACE: 'Sàn TMĐT',
  DT_COMMERCE: 'Sàn DT',
  'marketplace-integration': 'Sàn TMĐT',
  RETURN_PORTAL: 'Cổng hàng trả',
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? (source || 'Không rõ');
}

function serviceLabel(serviceType: string): string {
  return SERVICE_LABELS[serviceType] ?? (serviceType || 'Không rõ');
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toDateTimeInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function startOfTodayInputValue(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return toDateTimeInputValue(date);
}

function endOfTodayInputValue(): string {
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  return toDateTimeInputValue(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
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
  });
}

function isWithinInputRange(value: string | null, fromValue: string, toValue: string): boolean {
  if (!value) {
    return true;
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return true;
  }

  const fromTime = fromValue ? new Date(fromValue).getTime() : Number.NaN;
  const toTime = toValue ? new Date(toValue).getTime() : Number.NaN;

  return (
    (Number.isNaN(fromTime) || time >= fromTime) &&
    (Number.isNaN(toTime) || time <= toTime)
  );
}

function isDispatchStatus(value: string): value is DispatchStatus {
  return value === 'CREATED' || value === 'ASSIGNED' || value === 'COMPLETED' || value === 'CANCELLED';
}

function canAssign(row: DispatchOrderRow): boolean {
  return row.status === 'CREATED' || row.status === 'ASSIGNED';
}

function buildShipmentLookup(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const lookup = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    const code = normalizeCode(shipment.shipmentCode);
    if (code) {
      lookup.set(code, shipment);
    }
  }

  return lookup;
}

function buildPickupLookup(pickups: PickupRequestListItemDto[]): Map<string, PickupRequestListItemDto> {
  const lookup = new Map<string, PickupRequestListItemDto>();

  for (const pickup of pickups) {
    const code = normalizeCode(pickup.shipmentCode);
    if (code && !lookup.has(code)) {
      lookup.set(code, pickup);
    }
  }

  return lookup;
}

function splitAddressTokens(address: string | null): string[] {
  if (!address) {
    return [];
  }

  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function readHubAddressProvince(address: string | null): string {
  if (!address) {
    return '';
  }

  try {
    const parsed = JSON.parse(address) as Record<string, unknown>;
    return typeof parsed.province === 'string' ? parsed.province.trim() : '';
  } catch {
    const parts = splitAddressTokens(address);
    return parts[parts.length - 1] ?? '';
  }
}

function provinceMatchKey(value: string): string {
  const normalized = normalizeLocationToken(value)
    .replace(/\bTHANH PHO\b/g, ' ')
    .replace(/\bTINH\b/g, ' ')
    .replace(/\bTP\b/g, ' ')
    .replace(/\bCITY\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === 'HCM' || normalized.includes('HO CHI MINH')) {
    return 'HO CHI MINH';
  }

  return normalized;
}

function findProcessingHubProvince(hubs: HubDto[], processingHubCode: string): string {
  const hub = hubs.find((item) => normalizeCode(item.code) === processingHubCode);
  return readHubAddressProvince(hub?.address ?? null);
}

function isSameProvince(left: string, right: string): boolean {
  const leftKey = provinceMatchKey(left);
  const rightKey = provinceMatchKey(right);

  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

function hasScopeTokenMatch(tokens: Iterable<string>, scopeTokens: Set<string>): boolean {
  for (const token of tokens) {
    if (!token) {
      continue;
    }

    for (const scopeToken of scopeTokens) {
      if (
        token === scopeToken ||
        token.includes(scopeToken) ||
        scopeToken.includes(token)
      ) {
        return true;
      }
    }
  }

  return false;
}

function isShipmentSenderInHubScope(
  shipment: ShipmentListItemDto | null,
  scopeTokens: Set<string>,
): boolean {
  if (!shipment || scopeTokens.size === 0) {
    return false;
  }

  const senderTokens = new Set<string>();
  if (shipment.senderWard) {
    senderTokens.add(normalizeLocationToken(shipment.senderWard));
  }
  if (shipment.senderDistrict) {
    senderTokens.add(normalizeLocationToken(shipment.senderDistrict));
  }
  if (shipment.senderProvince) {
    senderTokens.add(normalizeLocationToken(shipment.senderProvince));
  }
  for (const part of splitAddressTokens(shipment.senderAddress)) {
    senderTokens.add(normalizeLocationToken(part));
  }

  return hasScopeTokenMatch(senderTokens, scopeTokens);
}

function resolvePickupHub(
  shipment: ShipmentListItemDto | null,
  processingHubCode: string,
  processingScopeTokens: Set<string>,
): string {
  const explicitPickupHub = normalizeCode(shipment?.senderHubCode ?? shipment?.originHubCode ?? null);
  if (explicitPickupHub) {
    return explicitPickupHub;
  }

  if (processingHubCode && isShipmentSenderInHubScope(shipment, processingScopeTokens)) {
    return processingHubCode;
  }

  return normalizeCode(shipment?.currentLocation ?? null);
}

function mapTaskToDispatchRow(
  task: TaskListItemDto,
  shipment: ShipmentListItemDto | null,
  pickup: PickupRequestListItemDto | null,
  courierLookup: Map<string, OpsUserDto>,
  processingHubCode: string,
  processingScopeTokens: Set<string>,
): DispatchOrderRow | null {
  if (!isDispatchStatus(task.status)) {
    return null;
  }

  const pickupHub = resolvePickupHub(shipment, processingHubCode, processingScopeTokens);
  if (!pickupHub) {
    return null;
  }

  const assignedCourier = task.assignedCourierId
    ? courierLookup.get(normalizeCode(task.assignedCourierId)) ?? null
    : null;

  return {
    id: task.id,
    shipment: shipment ?? null,
    taskCode: task.taskCode,
    orderCode: pickup?.requestCode ?? task.taskCode,
    shipmentCode: task.shipmentCode ?? '-',
    senderName: shipment?.senderName ?? task.senderName ?? 'Không có tên',
    senderPhone: shipment?.senderPhone ?? '-',
    pickupAddress: shipment?.senderAddress ?? 'Chưa có địa chỉ lấy',
    ward: shipment?.senderWard ?? '-',
    district: shipment?.senderDistrict ?? shipment?.senderProvince ?? '-',
    status: task.status,
    source: shipment?.platform ?? 'merchant-web',
    serviceType: shipment?.serviceType ?? 'STANDARD',
    pickupHub,
    assignedCourierId: task.assignedCourierId,
    assignedCourierName: assignedCourier?.displayName ?? null,
    scheduledAt: task.status === 'ASSIGNED' ? task.updatedAt : null,
    requestedAt: pickup?.requestedAt ?? task.updatedAt,
    parcelCount: 1,
    note: shipment?.deliveryNote ?? '-',
    pickupStatus: pickup?.status ?? null,
  };
}

export function CustomerOrderDispatchPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => normalizeCode(code)).filter(Boolean),
    [session?.user.hubCodes],
  );
  const processingHubCode = assignedHubCodes[0] ?? '';

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | DispatchStatus>('CREATED');
  const [keyword, setKeyword] = useState('');
  const [fromTime, setFromTime] = useState(startOfTodayInputValue);
  const [toTime, setToTime] = useState(endOfTodayInputValue);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [courierFilter, setCourierFilter] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [courierSearch, setCourierSearch] = useState('');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const realtimeStatus = useDispatchTasksRealtime(Boolean(accessToken));
  const tasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' }, {
    refetchInterval: realtimeStatus === 'connected' ? false : 10000,
  });
  const hubsQuery = useHubsQuery(accessToken, {});
  const locationsQuery = useVietnamAdministrativeUnitsQuery(accessToken);
  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 5000 });
  const pickupsQuery = usePickupRequestsQuery(accessToken, {}, { refetchInterval: 5000 });
  const shippersQuery = useQuery({
    queryKey: [
      ...queryKeys.tasks,
      'dispatch-shippers',
      processingHubCode,
    ],
    queryFn: () =>
      authClient.listUsers(accessToken, {
        roleGroup: 'SHIPPER',
        hubCode: processingHubCode,
        status: 'ACTIVE',
      }),
    enabled: Boolean(accessToken && processingHubCode),
  });

  const courierLookup = useMemo(() => {
    const lookup = new Map<string, OpsUserDto>();

    for (const shipper of shippersQuery.data ?? []) {
      lookup.set(normalizeCode(shipper.username), shipper);
    }

    return lookup;
  }, [shippersQuery.data]);

  const processingScopeTokens = useMemo(
    () =>
      processingHubCode
        ? deriveHubScopeTokens(hubsQuery.data ?? [], [processingHubCode])
        : new Set<string>(),
    [hubsQuery.data, processingHubCode],
  );
  const processingHubProvince = useMemo(
    () => findProcessingHubProvince(hubsQuery.data ?? [], processingHubCode),
    [hubsQuery.data, processingHubCode],
  );

  const dispatchRows = useMemo(() => {
    const shipmentLookup = buildShipmentLookup(shipmentsQuery.data ?? []);
    const pickupLookup = buildPickupLookup(pickupsQuery.data ?? []);

    const mappedRows = (tasksQuery.data ?? [])
      .map((task) => {
        const shipmentCode = normalizeCode(task.shipmentCode);
        const shipment = shipmentCode ? shipmentLookup.get(shipmentCode) ?? null : null;
        const pickup = shipmentCode ? pickupLookup.get(shipmentCode) ?? null : null;
        return mapTaskToDispatchRow(
          task,
          shipment,
          pickup,
          courierLookup,
          processingHubCode,
          processingScopeTokens,
        );
      })
      .filter((row): row is DispatchOrderRow => Boolean(row))
      .filter((row) => row.pickupHub === processingHubCode);

    const deduplicatedMap = new Map<string, DispatchOrderRow>();
    for (const row of mappedRows) {
      const code = normalizeCode(row.shipmentCode);
      if (!code || code === '-') {
        deduplicatedMap.set(row.id, row);
        continue;
      }

      const existing = deduplicatedMap.get(code);
      if (!existing) {
        deduplicatedMap.set(code, row);
      } else if (existing.status === 'CREATED' && row.status !== 'CREATED') {
        deduplicatedMap.set(code, row);
      }
    }

    return Array.from(deduplicatedMap.values()).sort(
      (left, right) =>
        new Date(right.requestedAt ?? '').getTime() - new Date(left.requestedAt ?? '').getTime(),
    );
  }, [
    courierLookup,
    pickupsQuery.data,
    processingHubCode,
    processingScopeTokens,
    shipmentsQuery.data,
    tasksQuery.data,
  ]);

  const courierActiveTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of dispatchRows) {
      if (row.assignedCourierId && row.status !== 'COMPLETED' && row.status !== 'CANCELLED') {
        const key = normalizeCode(row.assignedCourierId);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return counts;
  }, [dispatchRows]);

  const courierOptions = useMemo<CourierOption[]>(
    () =>
      (shippersQuery.data ?? []).map((shipper) => ({
        id: shipper.username,
        name: shipper.displayName ?? shipper.username,
        hub: shipper.hubCodes.join(', ') || processingHubCode,
        activeTasks: courierActiveTaskCounts.get(normalizeCode(shipper.username)) ?? 0,
      })),
    [courierActiveTaskCounts, processingHubCode, shippersQuery.data],
  );
  const searchedCouriers = useMemo(() => {
    const normalizedCourierSearch = normalizeText(courierSearch);

    return courierOptions.filter(
      (courier) =>
        !normalizedCourierSearch ||
        normalizeText(courier.name).includes(normalizedCourierSearch) ||
        normalizeText(courier.id).includes(normalizedCourierSearch),
    );
  }, [courierOptions, courierSearch]);

  const wardOptions = useMemo(() => {
    const dataWards = dispatchRows.map((order) => order.ward).filter((ward) => ward !== '-');
    const province = (locationsQuery.data ?? []).find((item) =>
      isSameProvince(item.name, processingHubProvince),
    );
    const apiWards = province?.wards.map((ward) => ward.name) ?? [];

    return Array.from(new Set([...apiWards, ...dataWards])).sort((left, right) =>
      left.localeCompare(right, 'vi'),
    );
  }, [dispatchRows, locationsQuery.data, processingHubProvince]);
  const sourceOptions = useMemo(
    () => Array.from(new Set(dispatchRows.map((order) => order.source))).sort(),
    [dispatchRows],
  );
  const serviceOptions = useMemo(
    () => Array.from(new Set(dispatchRows.map((order) => order.serviceType))).sort(),
    [dispatchRows],
  );

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);
    const normalizedCourier = normalizeText(courierFilter);

    return dispatchRows.filter((order) => {
      const keywordSource = order.shipmentCode;
      const keywordMatched =
        !normalizedKeyword ||
        normalizeText(keywordSource).includes(normalizedKeyword) ||
        normalizeText(order.senderName).includes(normalizedKeyword) ||
        normalizeText(order.taskCode).includes(normalizedKeyword);
      const courierMatched =
        !normalizedCourier ||
        normalizeText(order.assignedCourierName ?? order.assignedCourierId ?? '').includes(
          normalizedCourier,
        );

      return (
        keywordMatched &&
        courierMatched &&
        isWithinInputRange(order.requestedAt, fromTime, toTime) &&
        (statusFilter === 'ALL' || order.status === statusFilter) &&
        (wardFilter === 'ALL' || order.ward === wardFilter) &&
        (sourceFilter === 'ALL' || order.source === sourceFilter) &&
        (serviceFilter === 'ALL' || order.serviceType === serviceFilter)
      );
    });
  }, [
    courierFilter,
    dispatchRows,
    fromTime,
    keyword,
    serviceFilter,
    sourceFilter,
    statusFilter,
    toTime,
    wardFilter,
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageEndIndex = Math.min(filteredOrders.length, pageStartIndex + paginatedOrders.length);

  const selectedOrders = useMemo(
    () => dispatchRows.filter((order) => selectedOrderIds.includes(order.id)),
    [dispatchRows, selectedOrderIds],
  );
  const selectedAssignableOrders = useMemo(
    () => selectedOrders.filter(canAssign),
    [selectedOrders],
  );
  const selectedParcelCount = selectedOrders.reduce((sum, order) => sum + order.parcelCount, 0);
  const selectedHubCodes = useMemo(
    () => Array.from(new Set(selectedOrders.map((order) => order.pickupHub))).sort(),
    [selectedOrders],
  );
  const selectedCourier =
    courierOptions.find((courier) => courier.id === selectedCourierId) ?? null;
  const allVisibleSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedOrderIds.includes(order.id));
  const someVisibleSelected =
    paginatedOrders.some((order) => selectedOrderIds.includes(order.id));

  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    'ops_pickup_dispatch_col_widths_v4',
    DEFAULT_OPS_COL_WIDTHS,
    MIN_OPS_COL_WIDTHS,
  );

  const { visibleColumns, toggleColumn, setAllColumns, resetColumns } = useColumnVisibility(
    'ops_pickup_dispatch_visible_columns_v2',
  );
  const loadError =
    tasksQuery.error ??
    hubsQuery.error ??
    locationsQuery.error ??
    shipmentsQuery.error ??
    pickupsQuery.error ??
    shippersQuery.error ??
    null;
  const isLoading =
    tasksQuery.isLoading || hubsQuery.isLoading || shipmentsQuery.isLoading || pickupsQuery.isLoading;
  const waitingOrderCount = dispatchRows.filter((order) => order.status === 'CREATED').length;
  const assignedOrderCount = dispatchRows.filter((order) => order.status === 'ASSIGNED').length;
  const marketplaceOrderCount = dispatchRows.filter((order) =>
    ['MARKETPLACE', 'DT_COMMERCE', 'marketplace-integration'].includes(order.source),
  ).length;

  useEffect(() => {
    const existingIds = new Set(dispatchRows.map((row) => row.id));
    setSelectedOrderIds((current) => current.filter((orderId) => existingIds.has(orderId)));
  }, [dispatchRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    courierFilter,
    fromTime,
    keyword,
    pageSize,
    serviceFilter,
    sourceFilter,
    statusFilter,
    toTime,
    wardFilter,
  ]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!isAssignModalOpen || selectedCourierId || searchedCouriers.length === 0) {
      return;
    }

    setSelectedCourierId(searchedCouriers[0].id);
  }, [isAssignModalOpen, searchedCouriers, selectedCourierId]);

  useEffect(() => {
    if (!isAssignModalOpen || !selectedCourierId) {
      return;
    }

    if (
      searchedCouriers.length > 0 &&
      !searchedCouriers.some((courier) => courier.id === selectedCourierId)
    ) {
      setSelectedCourierId(searchedCouriers[0].id);
    }
  }, [isAssignModalOpen, searchedCouriers, selectedCourierId]);

  const toggleOrder = (orderId: string, checked: boolean) => {
    setSelectedOrderIds((current) => {
      if (checked) {
        return current.includes(orderId) ? current : [...current, orderId];
      }

      return current.filter((selectedId) => selectedId !== orderId);
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      const visibleIdSet = new Set(paginatedOrders.map((order) => order.id));
      setSelectedOrderIds((current) => current.filter((orderId) => !visibleIdSet.has(orderId)));
      return;
    }

    setSelectedOrderIds((current) =>
      Array.from(new Set([...current, ...paginatedOrders.map((order) => order.id)])),
    );
  };

  const selectAllFiltered = () => {
    setSelectedOrderIds((current) =>
      Array.from(new Set([...current, ...filteredOrders.map((order) => order.id)])),
    );
  };

  const clearSelectedOrders = () => {
    setSelectedOrderIds([]);
  };

  const resetFilters = () => {
    setStatusFilter('CREATED');
    setKeyword('');
    setFromTime(startOfTodayInputValue());
    setToTime(endOfTodayInputValue());
    setWardFilter('ALL');
    setSourceFilter('ALL');
    setServiceFilter('ALL');
    setCourierFilter('');
    setNotice('Đã làm mới bộ lọc điều phối.');
  };

  const openAssignModal = () => {
    if (!processingHubCode) {
      setNotice('Tài khoản Ops chưa được gán bưu cục xử lý.');
      return;
    }

    if (selectedOrderIds.length === 0) {
      setNotice('Vui lòng chọn ít nhất một đơn để điều phối nhân viên giao nhận.');
      return;
    }

    if (selectedAssignableOrders.length === 0) {
      setNotice('Chỉ các đơn chưa điều phối hoặc đã điều phối mới có thể gán nhân viên.');
      return;
    }

    setCourierSearch('');
    setSelectedCourierId('');
    setIsAssignModalOpen(true);
  };

  const assignSelectedOrders = async () => {
    if (!accessToken || isAssigning) {
      return;
    }

    if (!selectedCourier) {
      setNotice('Vui lòng chọn nhân viên giao nhận thuộc bưu cục xử lý.');
      return;
    }

    if (selectedAssignableOrders.length === 0) {
      setNotice('Không có đơn phù hợp để điều phối.');
      return;
    }

    setIsAssigning(true);
    let assignedCount = 0;
    let reassignedCount = 0;
    let skippedCount = 0;
    const failedRows: string[] = [];

    for (const order of selectedAssignableOrders) {
      try {
        if (order.assignedCourierId) {
          if (order.assignedCourierId === selectedCourier.id) {
            skippedCount += 1;
            continue;
          }

          await tasksClient.reassign(accessToken, {
            taskId: order.id,
            courierId: selectedCourier.id,
            note: 'điều phối từ màn điều phối đơn đặt',
          });
          reassignedCount += 1;
          continue;
        }

        await tasksClient.assign(accessToken, {
          taskId: order.id,
          courierId: selectedCourier.id,
          note: 'điều phối từ màn điều phối đơn đặt',
        });
        assignedCount += 1;
      } catch (error) {
        failedRows.push(`${order.shipmentCode}: ${getErrorMessage(error)}`);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    setIsAssigning(false);

    if (failedRows.length === 0) {
      setSelectedOrderIds([]);
      setIsAssignModalOpen(false);
    }

    setNotice(
      failedRows.length > 0
        ? `Điều phối lỗi ${failedRows.length} đơn: ${failedRows.slice(0, 2).join(' | ')}`
        : `Đã điều phối ${assignedCount} đơn, phân công lại ${reassignedCount}, bỏ qua ${skippedCount}.`,
    );
  };

  const markPickupFailed = async () => {
    if (!accessToken || isCancelling) {
      return;
    }

    if (selectedAssignableOrders.length === 0) {
      setNotice('Vui lòng chọn đơn lấy hàng đang mở để ghi nhận thất bại.');
      return;
    }

    setIsCancelling(true);
    const failedRows: string[] = [];

    for (const order of selectedAssignableOrders) {
      try {
        await tasksClient.updateStatus(accessToken, {
          taskId: order.id,
          status: 'CANCELLED',
        });
      } catch (error) {
        failedRows.push(`${order.shipmentCode}: ${getErrorMessage(error)}`);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    setIsCancelling(false);

    if (failedRows.length === 0) {
      setSelectedOrderIds([]);
    }

    setNotice(
      failedRows.length > 0
        ? `Không thể cập nhật ${failedRows.length} đơn: ${failedRows.slice(0, 2).join(' | ')}`
        : `Đã ghi nhận lấy hàng thất bại cho ${selectedAssignableOrders.length} đơn.`,
    );
  };


  return (
    <section className="ops-customer-dispatch">

      <section className="ops-customer-dispatch__toolbar" aria-label="Thao tác điều phối">
        <button type="button" onClick={resetFilters}>
          Làm mới
        </button>
        <button type="button" className="ops-customer-dispatch__primary-action" onClick={openAssignModal}>
          Điều phối NVGN
        </button>
        <button
          type="button"
          onClick={() => void markPickupFailed()}
          disabled={selectedOrderIds.length === 0 || isCancelling}
        >
          {isCancelling ? 'Đang cập nhật...' : 'Lấy hàng thất bại'}
        </button>
      </section>

      <section className="ops-customer-dispatch__filters" aria-label="Bộ lọc điều phối">
        <label className="ops-customer-dispatch__filter-wide">
          <span>Từ khóa</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, tên shop"
          />
        </label>

        <label>
          <span>Từ giờ tạo</span>
          <input
            type="datetime-local"
            value={fromTime}
            onChange={(event) => setFromTime(event.target.value)}
          />
        </label>

        <label>
          <span>Đến giờ tạo</span>
          <input
            type="datetime-local"
            value={toTime}
            onChange={(event) => setToTime(event.target.value)}
          />
        </label>

        <label>
          <span>Bưu cục xử lý</span>
          <input
            type="text"
            value={processingHubCode || 'Chưa được gán bưu cục'}
            disabled
            readOnly
          />
        </label>

        <label>
          <span>Nguồn đơn</span>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="ALL">Tất cả nguồn</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {sourceLabel(source)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tiến độ</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | DispatchStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>NVGN</span>
          <input
            value={courierFilter}
            onChange={(event) => setCourierFilter(event.target.value)}
            placeholder="Nhập tên hoặc mã NVGN"
          />
        </label>

        <label>
          <span>Dịch vụ</span>
          <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
            <option value="ALL">Toàn bộ</option>
            {serviceOptions.map((serviceType) => (
              <option key={serviceType} value={serviceType}>
                {serviceLabel(serviceType)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Phường xã lấy</span>
          <select value={wardFilter} onChange={(event) => setWardFilter(event.target.value)}>
            <option value="ALL">Tất cả phường xã</option>
            {wardOptions.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="ops-customer-dispatch__assign-strip">
        <div className="ops-customer-dispatch__bulk-metric">
          <strong>{selectedOrderIds.length}</strong>
          <span>đơn đã chọn</span>
        </div>
        <div className="ops-customer-dispatch__bulk-metric">
          <strong>{selectedParcelCount}</strong>
          <span>kiện cần lấy</span>
        </div>
        <div className="ops-customer-dispatch__bulk-metric">
          <strong>{selectedHubCodes.length ? selectedHubCodes.join(', ') : '-'}</strong>
          <span>bưu cục xử lý</span>
        </div>
        <div className="ops-customer-dispatch__bulk-metric">
          <strong>{selectedAssignableOrders.length}</strong>
          <span>đủ điều phối</span>
        </div>
        <div className="ops-customer-dispatch__bulk-actions">
          <button type="button" onClick={selectAllFiltered} disabled={filteredOrders.length === 0}>
            Chọn tất cả kết quả lọc
          </button>
          <button type="button" onClick={clearSelectedOrders} disabled={selectedOrderIds.length === 0}>
            Bỏ chọn
          </button>
          <button
            type="button"
            className="ops-customer-dispatch__primary-action"
            onClick={openAssignModal}
            disabled={selectedAssignableOrders.length === 0}
          >
            Điều phối {selectedAssignableOrders.length} đơn
          </button>
        </div>
        {notice ? <p role="status">{notice}</p> : null}
      </section>

      {loadError ? (
        <div className="ops-customer-dispatch__error" role="alert">
          {getErrorMessage(loadError)}
        </div>
      ) : null}

      <section className="ops-customer-dispatch__table-panel">
        <div className="ops-customer-dispatch__table-head">
          <h3>Đơn cần lấy</h3>
          <div className="ops-customer-dispatch__table-meta">
            <span>
              {isLoading
                ? 'Đang tải...'
                : filteredOrders.length > 0
                ? `${pageStartIndex + 1}-${pageEndIndex} / ${filteredOrders.length} dòng`
                : '0 dòng'}
            </span>
            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
              }
              aria-label="Số dòng mỗi trang"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}/trang
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage <= 1}
            >
              Trước
            </button>
            <strong>
              {safeCurrentPage}/{totalPages}
            </strong>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="ops-customer-dispatch__loading">Đang tải dữ liệu điều phối...</div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <ColumnVisibilityPicker
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onSetAllColumns={setAllColumns}
            onResetColumns={resetColumns}
          />
        </div>
        <div style={shipmentTableStyles.tableShell} className="ops-shipments-table-shell">
          <table style={shipmentTableStyles.table}>
            <thead>
              <tr>
                <th style={{ ...shipmentTableStyles.headerCell, ...shipmentTableStyles.selectCell }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }
                    }}
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                    aria-label="Chọn tất cả đơn đang hiển thị"
                  />
                </th>
                {visibleColumns.code && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.code, minWidth: widths.code, maxWidth: widths.code }}>
                    <span>Mã vận đơn</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('code', e)}
                      onDoubleClick={() => resetColumnWidth('code')}
                    />
                  </th>
                )}
                {visibleColumns.status && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.status, minWidth: widths.status, maxWidth: widths.status }}>
                    <span>Trạng thái</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('status', e)}
                      onDoubleClick={() => resetColumnWidth('status')}
                    />
                  </th>
                )}
                {visibleColumns.parcelType && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.parcelType, minWidth: widths.parcelType, maxWidth: widths.parcelType }}>
                    <span>Loại hàng</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('parcelType', e)}
                      onDoubleClick={() => resetColumnWidth('parcelType')}
                    />
                  </th>
                )}
                {visibleColumns.chargeableWeight && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.chargeableWeight, minWidth: widths.chargeableWeight, maxWidth: widths.chargeableWeight }}>
                    <span>KL tính cước</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('chargeableWeight', e)}
                      onDoubleClick={() => resetColumnWidth('chargeableWeight')}
                    />
                  </th>
                )}
                {visibleColumns.senderName && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.senderName, minWidth: widths.senderName, maxWidth: widths.senderName }}>
                    <span>Người gửi</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('senderName', e)}
                      onDoubleClick={() => resetColumnWidth('senderName')}
                    />
                  </th>
                )}
                {visibleColumns.senderPhone && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.senderPhone, minWidth: widths.senderPhone, maxWidth: widths.senderPhone }}>
                    <span>SĐT gửi</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('senderPhone', e)}
                      onDoubleClick={() => resetColumnWidth('senderPhone')}
                    />
                  </th>
                )}
                {visibleColumns.senderAddress && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.senderAddress, minWidth: widths.senderAddress, maxWidth: widths.senderAddress }}>
                    <span>Địa chỉ gửi</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('senderAddress', e)}
                      onDoubleClick={() => resetColumnWidth('senderAddress')}
                    />
                  </th>
                )}
                {visibleColumns.receiverName && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.receiverName, minWidth: widths.receiverName, maxWidth: widths.receiverName }}>
                    <span>Người nhận</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('receiverName', e)}
                      onDoubleClick={() => resetColumnWidth('receiverName')}
                    />
                  </th>
                )}
                {visibleColumns.receiverPhone && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.receiverPhone, minWidth: widths.receiverPhone, maxWidth: widths.receiverPhone }}>
                    <span>SĐT nhận</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('receiverPhone', e)}
                      onDoubleClick={() => resetColumnWidth('receiverPhone')}
                    />
                  </th>
                )}
                {visibleColumns.receiverAddress && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.receiverAddress, minWidth: widths.receiverAddress, maxWidth: widths.receiverAddress }}>
                    <span>Địa chỉ giao</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('receiverAddress', e)}
                      onDoubleClick={() => resetColumnWidth('receiverAddress')}
                    />
                  </th>
                )}
                {visibleColumns.cod && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.cod, minWidth: widths.cod, maxWidth: widths.cod }}>
                    <span>Tiền COD & Cước</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('cod', e)}
                      onDoubleClick={() => resetColumnWidth('cod')}
                    />
                  </th>
                )}
                {visibleColumns.routeHub && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.routeHub, minWidth: widths.routeHub, maxWidth: widths.routeHub }}>
                    <span>Tuyến phát / Hub</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('routeHub', e)}
                      onDoubleClick={() => resetColumnWidth('routeHub')}
                    />
                  </th>
                )}
                {visibleColumns.createdAt && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.createdAt, minWidth: widths.createdAt, maxWidth: widths.createdAt }}>
                    <span>Ngày giờ tạo</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('createdAt', e)}
                      onDoubleClick={() => resetColumnWidth('createdAt')}
                    />
                  </th>
                )}
                {visibleColumns.deliveredAt && (
                  <th style={{ ...shipmentTableStyles.headerCell, width: widths.deliveredAt, minWidth: widths.deliveredAt, maxWidth: widths.deliveredAt }}>
                    <span>Ngày giờ nhận hàng</span>
                    <span
                      className="table-col-resizer"
                      title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                      onMouseDown={(e) => handleMouseDown('deliveredAt', e)}
                      onDoubleClick={() => resetColumnWidth('deliveredAt')}
                    />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const shipment = order.shipment;
                const assignedCourier = order.assignedCourierName ?? order.assignedCourierId ?? 'Chưa bàn giao';
                const hubCode = order.pickupHub || shipment?.receiverHubCode || shipment?.destinationHubCode || '-';
                const isDelivered = shipment?.currentStatus === 'DELIVERED' || order.status === 'COMPLETED';
                const deliveredAt = isDelivered ? order.scheduledAt || shipment?.updatedAt : null;
                const fullSenderAddress =
                  shipment?.senderAddress ||
                  [shipment?.senderWard, shipment?.senderDistrict, shipment?.senderProvince].filter(Boolean).join(', ') ||
                  order.pickupAddress ||
                  '-';
                const fullReceiverAddress = shipment?.receiverAddress || shipment?.receiverRegion || '-';
                const statusBadgeStyle = getOpsStatusBadgeStyle(shipment?.currentStatus ?? order.status);
                const statusBadgeLabel = shipment ? resolveShipmentStatusLabel(shipment) : statusLabel(order.status);
                const createdAt = shipment?.createdAt ?? order.requestedAt;

                const chargeableWeightInfo = shipment ? resolveChargeableWeight(shipment) : {
                  weightText: '0.5 kg',
                  chargeableKg: 0.5,
                  isVolumetric: false,
                  formulaHint: 'Cân tính cước: 0.5 kg',
                };
                const classification = shipment ? resolveParcelClassification(shipment) : {
                  label: 'TIÊU CHUẨN',
                  badgeStyle: { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4 },
                };
                const service = shipment ? resolveServiceTag(shipment) : { serviceLabel: serviceLabel(order.serviceType), platformLabel: sourceLabel(order.source) };
                const feePayer = shipment ? resolveFeePayer(shipment) : { payerLabel: 'Shop trả', isReceiverPay: false };
                const inspectionPolicy = shipment ? resolveInspectionPolicy(shipment) : 'Xem hàng, không thử';

                return (
                  <tr
                    key={order.id}
                    className={isSelected ? 'ops-customer-dispatch__row--selected' : undefined}
                    style={isSelected ? shipmentTableStyles.selectedRow : undefined}
                  >
                    <td style={{ ...shipmentTableStyles.cell, ...shipmentTableStyles.selectCell }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => toggleOrder(order.id, event.target.checked)}
                        aria-label={`Chọn ${order.orderCode}`}
                      />
                    </td>

                    {visibleColumns.code && (
                      <td style={{ ...shipmentTableStyles.shipmentCodeCell, width: widths.code, maxWidth: widths.code }} className="ops-shipment-code-cell">
                        {order.shipmentCode && order.shipmentCode !== '-' ? (
                          <CopyableShipmentCode code={order.shipmentCode} />
                        ) : (
                          <span style={{ fontWeight: 700, color: '#1f2b6f' }}>{order.orderCode}</span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <span style={shipmentTableStyles.platformBadge}>{service.platformLabel}</span>
                          <span style={shipmentTableStyles.serviceTag}>{service.serviceLabel}</span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.status, maxWidth: widths.status }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span style={statusBadgeStyle}>
                            {statusBadgeLabel}
                          </span>
                          {shipment?.requiresLabelReprint ? (
                            <span
                              title="Vận đơn cần in lại tem mới"
                              style={shipmentTableStyles.reprintBadge}
                            >
                              In lại tem
                            </span>
                          ) : null}
                          {shipment?.isOperationLocked ? (
                            <span
                              title="Đơn hàng đang bị khóa thao tác"
                              style={shipmentTableStyles.lockBadge}
                            >
                              Khóa
                            </span>
                          ) : null}
                        </div>
                      </td>
                    )}

                    {visibleColumns.parcelType && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.parcelType, maxWidth: widths.parcelType }}>
                        <span style={classification.badgeStyle}>
                          {classification.label}
                        </span>
                      </td>
                    )}

                    {visibleColumns.chargeableWeight && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.chargeableWeight, maxWidth: widths.chargeableWeight }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span
                            title={chargeableWeightInfo.formulaHint}
                            style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a' }}
                          >
                            {chargeableWeightInfo.weightText}
                          </span>
                          {chargeableWeightInfo.isVolumetric && (
                            <span
                              title={chargeableWeightInfo.formulaHint}
                              style={{
                                fontSize: 10,
                                color: '#ea580c',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              📐 Thể tích IATA
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {visibleColumns.senderName && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.senderName, maxWidth: widths.senderName }}>
                        <div
                          className="ops-cell-scrollable"
                          title={shipment?.senderName ?? order.senderName ?? 'Không có'}
                          style={{ width: '100%', maxWidth: '100%', fontWeight: 600 }}
                        >
                          {shipment?.senderName ?? order.senderName ?? 'Không có'}
                        </div>
                      </td>
                    )}

                    {visibleColumns.senderPhone && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.senderPhone, maxWidth: widths.senderPhone }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {shipment?.senderPhone ?? order.senderPhone ?? '-'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.senderAddress && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.senderAddress, maxWidth: widths.senderAddress }}>
                        <div
                          className="ops-cell-scrollable"
                          title={fullSenderAddress}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: 12,
                            color: '#334155',
                          }}
                        >
                          {fullSenderAddress}
                        </div>
                      </td>
                    )}

                    {visibleColumns.receiverName && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.receiverName, maxWidth: widths.receiverName }}>
                        <div
                          className="ops-cell-scrollable"
                          title={shipment?.receiverName ?? 'Không có'}
                          style={{ width: '100%', maxWidth: '100%', fontWeight: 600 }}
                        >
                          {shipment?.receiverName ?? 'Không có'}
                        </div>
                      </td>
                    )}

                    {visibleColumns.receiverPhone && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.receiverPhone, maxWidth: widths.receiverPhone }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {shipment?.receiverPhone ?? '-'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.receiverAddress && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.receiverAddress, maxWidth: widths.receiverAddress }}>
                        <div
                          className="ops-cell-scrollable"
                          title={fullReceiverAddress}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: 12,
                            color: '#334155',
                          }}
                        >
                          <div>{fullReceiverAddress}</div>
                          <div style={shipmentTableStyles.addressSubline} title={`Đồng kiểm: ${inspectionPolicy}${order.note ? ` • ${order.note}` : ''}`}>
                            <span style={shipmentTableStyles.inspectionTag}>[{inspectionPolicy}]</span>
                            {order.note && order.note !== '-' ? <span>• {order.note}</span> : null}
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleColumns.cod && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.cod, maxWidth: widths.cod }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: shipment?.codAmount ? '#059669' : '#64748b', whiteSpace: 'nowrap' }}>
                            {formatCurrency(shipment?.codAmount ?? null)}
                          </span>
                          <div style={shipmentTableStyles.feeSubline}>
                            <span>Cước: {formatCurrency(shipment?.shippingFee ?? null)}</span>
                            <span style={{ margin: '0 3px', color: '#cbd5e1' }}>•</span>
                            <span style={{ color: feePayer.isReceiverPay ? '#d97706' : '#64748b', fontWeight: feePayer.isReceiverPay ? 700 : 500 }}>
                              {feePayer.payerLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleColumns.routeHub && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.routeHub, maxWidth: widths.routeHub }}>
                        <div
                          className="ops-cell-scrollable"
                          title={`Hub: ${hubCode} | Shipper: ${assignedCourier}`}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: 12,
                          }}
                        >
                          <span>Hub: <strong>{hubCode}</strong></span>
                          <span style={{ margin: '0 4px', color: '#94a3b8' }}>•</span>
                          <span>{assignedCourier}</span>
                          {order.assignedCourierId ? (
                            <Link
                              to={routePaths.opsChatWithCourier(order.assignedCourierId)}
                              style={{
                                marginLeft: 6,
                                padding: '1px 6px',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                textDecoration: 'none',
                              }}
                            >
                              Chat
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    )}

                    {visibleColumns.createdAt && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.createdAt, maxWidth: widths.createdAt }}>
                        <span style={{ fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>
                          {createdAt ? formatDateTime(createdAt) : '-'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.deliveredAt && (
                      <td style={{ ...shipmentTableStyles.cell, width: widths.deliveredAt, maxWidth: widths.deliveredAt }}>
                        {deliveredAt ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', whiteSpace: 'nowrap' }}>
                            {formatDateTime(deliveredAt)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                            Chưa nhận
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredOrders.length === 0 ? (
          <div className="ops-customer-dispatch__empty">
            {processingHubCode
              ? 'Không có đơn phù hợp bộ lọc hiện tại.'
              : 'Tài khoản Ops chưa được gán bưu cục xử lý.'}
          </div>
        ) : null}
      </section>

      {isAssignModalOpen ? (
        <div className="ops-customer-dispatch__modal" role="presentation">
          <aside
            className="ops-customer-dispatch__drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispatch-assign-title"
          >
            <header className="ops-customer-dispatch__drawer-head">
              <div>
                <h3 id="dispatch-assign-title">Điều phối nhân viên giao nhận</h3>
                <span>
                  {selectedAssignableOrders.length} đơn đủ điều phối / {selectedParcelCount} kiện đã chọn
                </span>
              </div>
              <button
                type="button"
                className="ops-customer-dispatch__drawer-close"
                onClick={() => setIsAssignModalOpen(false)}
                aria-label="Đóng modal điều phối"
              >
                ×
              </button>
            </header>

            <section className="ops-customer-dispatch__drawer-summary">
              <span>Mã bưu cục xử lý</span>
              <strong>{processingHubCode}</strong>
            </section>

            <label className="ops-customer-dispatch__courier-search">
              <span>Tìm nhân viên giao nhận</span>
              <input
                value={courierSearch}
                onChange={(event) => setCourierSearch(event.target.value)}
                placeholder="Nhập tên hoặc mã nhân viên"
                autoFocus
              />
            </label>

            <div className="ops-customer-dispatch__courier-list" role="listbox">
              {shippersQuery.isLoading ? (
                <div className="ops-customer-dispatch__courier-empty">Đang tải nhân viên...</div>
              ) : null}
              {searchedCouriers.map((courier) => {
                const isSelected = selectedCourierId === courier.id;

                return (
                  <button
                    key={courier.id}
                    type="button"
                    className={`ops-customer-dispatch__courier-option${
                      isSelected ? ' ops-customer-dispatch__courier-option--active' : ''
                    }`}
                    onClick={() => setSelectedCourierId(courier.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>
                      <strong>{courier.name}</strong>
                      <small>{courier.id}</small>
                    </span>
                    <em>{courier.activeTasks} đơn</em>
                  </button>
                );
              })}
              {!shippersQuery.isLoading && searchedCouriers.length === 0 ? (
                <div className="ops-customer-dispatch__courier-empty">
                  Không có nhân viên giao nhận ACTIVE thuộc bưu cục {processingHubCode}.
                </div>
              ) : null}
            </div>

            <footer className="ops-customer-dispatch__drawer-actions">
              <button type="button" onClick={() => setIsAssignModalOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="ops-customer-dispatch__confirm-assign"
                onClick={() => void assignSelectedOrders()}
                disabled={!selectedCourier || isAssigning}
              >
                {isAssigning ? 'Đang điều phối...' : `Điều phối ${selectedAssignableOrders.length} đơn`}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
