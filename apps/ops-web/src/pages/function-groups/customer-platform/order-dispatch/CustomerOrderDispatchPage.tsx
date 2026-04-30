import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { authClient } from '../../../../features/auth/auth.client';
import type { OpsUserDto } from '../../../../features/auth/auth.types';
import { usePickupRequestsQuery } from '../../../../features/pickups/pickups.api';
import type { PickupRequestListItemDto } from '../../../../features/pickups/pickups.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { tasksClient, useCourierOptionsQuery, useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { queryKeys } from '../../../../utils/queryKeys';
import './CustomerOrderDispatchPage.css';

type SearchMode = 'orderCode' | 'shipmentCode';

interface DispatchFilters {
  searchMode: SearchMode;
  keyword: string;
  fromDate: string;
  toDate: string;
  ward: string;
  pickupHub: string;
  source: string;
  status: string;
  customer: string;
  courierId: string;
  serviceType: string;
}

interface DispatchOrderRow {
  id: string;
  orderCode: string;
  shipmentCode: string;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  pickupWard: string;
  pickupHub: string;
  status: string;
  source: string;
  serviceType: string;
  assignedCourierId: string | null;
  createdAt: string | null;
  updatedAt: string;
  note: string | null;
  selectable: boolean;
}

interface CourierDisplayOption {
  courierId: string;
  label: string;
  searchText: string;
}

const emptyFilters: DispatchFilters = {
  searchMode: 'orderCode',
  keyword: '',
  fromDate: '',
  toDate: '',
  ward: '',
  pickupHub: '',
  source: '',
  status: '',
  customer: '',
  courierId: '',
  serviceType: '',
};

const statusLabels: Record<string, string> = {
  CREATED: 'Chưa điều phát',
  ASSIGNED: 'Đã điều phối bưu cục',
  COMPLETED: 'Đã lấy hàng',
  CANCELLED: 'Đã hủy',
};

const statusFilterOptions = [
  { value: '', label: 'Toàn bộ' },
  { value: 'CREATED', label: 'Chưa điều phát' },
  { value: 'DISPATCHED_BRANCH', label: 'Đã điều phối chi nhánh' },
  { value: 'DISPATCHED_HUB', label: 'Đã điều phối bưu cục' },
  { value: 'DISPATCHED_COURIER', label: 'Đã điều phối NVGN' },
  { value: 'COMPLETED', label: 'Đã lấy hàng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'PICKUP_FAILED', label: 'Lấy hàng thất bại' },
];

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function normalizeLower(value: string | null | undefined): string {
  return normalize(value).toLowerCase();
}

function formatStatus(status: string): string {
  return statusLabels[status] ?? status;
}

function formatRowStatus(row: DispatchOrderRow): string {
  if (row.status === 'ASSIGNED' && row.assignedCourierId) {
    return 'Đã điều phối NVGN';
  }

  return formatStatus(row.status);
}

function matchesStatusFilter(row: DispatchOrderRow, statusFilter: string): boolean {
  switch (statusFilter) {
    case '':
      return true;
    case 'CREATED':
      return row.status === 'CREATED';
    case 'DISPATCHED_BRANCH':
      return row.status === 'ASSIGNED' && !row.assignedCourierId;
    case 'DISPATCHED_HUB':
      return row.status === 'ASSIGNED';
    case 'DISPATCHED_COURIER':
      return row.status === 'ASSIGNED' && Boolean(row.assignedCourierId);
    case 'COMPLETED':
      return row.status === 'COMPLETED';
    case 'CANCELLED':
      return row.status === 'CANCELLED';
    case 'PICKUP_FAILED':
      return row.status === 'CANCELLED' && normalizeLower(row.note).includes('thất bại');
    default:
      return row.status === statusFilter;
  }
}

function formatCourierLabel(user: OpsUserDto | null, fallbackId: string): string {
  if (!user) {
    return fallbackId;
  }

  const displayName = normalize(user.displayName) || user.username;
  return `${displayName}-${user.username}`;
}

function buildCourierDisplayOptions(
  courierIds: string[],
  shipperUsers: OpsUserDto[],
): CourierDisplayOption[] {
  const userByCode = new Map<string, OpsUserDto>();
  const allIds = new Set<string>();

  for (const user of shipperUsers) {
    userByCode.set(user.username, user);
    userByCode.set(user.id, user);
    allIds.add(user.username);
  }

  for (const courierId of courierIds) {
    allIds.add(courierId);
  }

  return Array.from(allIds)
    .map((courierId) => {
      const user = userByCode.get(courierId) ?? null;
      const label = formatCourierLabel(user, courierId);

      return {
        courierId,
        label,
        searchText: normalizeLower(`${label} ${courierId} ${user?.displayName ?? ''} ${user?.phone ?? ''}`),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'vi'));
}

function matchesCourierFilter(
  assignedCourierId: string | null,
  filterValue: string,
  courierLookup: Map<string, CourierDisplayOption>,
): boolean {
  const query = normalizeLower(filterValue);
  if (!query) {
    return true;
  }

  if (!assignedCourierId) {
    return false;
  }

  const option = courierLookup.get(assignedCourierId);
  const searchText = option?.searchText ?? normalizeLower(assignedCourierId);

  return searchText.includes(query);
}

function isDateInRange(value: string | null, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) {
    return true;
  }

  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return false;
  }

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    if (time < from) {
      return false;
    }
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    if (time > to) {
      return false;
    }
  }

  return true;
}

function pickAddressPart(address: string | null | undefined, fallback: string): string {
  const parts = normalize(address)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return parts[parts.length - 3];
  }

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return fallback;
}

function buildLookupByShipmentCode(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const lookup = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    const shipmentCode = normalize(shipment.shipmentCode).toUpperCase();
    if (shipmentCode) {
      lookup.set(shipmentCode, shipment);
    }
  }

  return lookup;
}

function buildLookupByPickupId(pickups: PickupRequestListItemDto[]): Map<string, PickupRequestListItemDto> {
  const lookup = new Map<string, PickupRequestListItemDto>();

  for (const pickup of pickups) {
    lookup.set(pickup.id, pickup);
  }

  return lookup;
}

function buildDispatchRows(
  tasks: TaskListItemDto[],
  shipmentLookup: Map<string, ShipmentListItemDto>,
  pickupLookup: Map<string, PickupRequestListItemDto>,
): DispatchOrderRow[] {
  return tasks
    .filter((task) => task.taskType === 'PICKUP')
    .map((task) => {
      const shipmentCode = normalize(task.shipmentCode).toUpperCase();
      const shipment = shipmentCode ? shipmentLookup.get(shipmentCode) ?? null : null;
      const pickup = task.pickupRequestId ? pickupLookup.get(task.pickupRequestId) ?? null : null;
      const pickupAddress = shipment?.senderAddress ?? 'Chưa có địa chỉ lấy';
      const senderName = shipment?.senderName ?? 'Khách hàng';

      return {
        id: task.id,
        orderCode: pickup?.requestCode ?? task.taskCode,
        shipmentCode: task.shipmentCode ?? pickup?.shipmentCode ?? '',
        senderName,
        senderPhone: shipment?.senderPhone ?? '',
        pickupAddress,
        pickupWard: pickAddressPart(pickupAddress, shipment?.receiverRegion ?? 'Chưa rõ'),
        pickupHub: shipment?.currentLocation ?? 'Chưa gán bưu cục',
        status: task.status,
        source: shipment?.platform ?? 'OPS',
        serviceType: shipment?.serviceType ?? 'Lấy hàng tại nhà',
        assignedCourierId: task.assignedCourierId,
        createdAt: task.createdAt ?? task.updatedAt,
        updatedAt: task.updatedAt,
        note: task.note ?? null,
        selectable: task.status === 'CREATED' || task.status === 'ASSIGNED',
      };
    });
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function RefreshIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4.5v5h-5" />
    </svg>
  );
}

function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4 15-3-6z" />
      <path d="m12 14 7-9" />
    </svg>
  );
}

function DownloadIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function CustomerOrderDispatchPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const [draftFilters, setDraftFilters] = useState<DispatchFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<DispatchFilters>(draftFilters);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [assignNote, setAssignNote] = useState('Ưu tiên lấy hàng theo cùng tuyến, cập nhật ảnh nhận hàng khi hoàn tất.');
  const [assignLoading, setAssignLoading] = useState(false);
  const [isDispatchPanelOpen, setIsDispatchPanelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' });
  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const pickupsQuery = usePickupRequestsQuery(accessToken, {});
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);
  const shipperUsersQuery = useQuery({
    queryKey: ['customer-order-dispatch', 'shipper-users'],
    queryFn: () =>
      authClient.listUsers(accessToken, {
        roleGroup: 'SHIPPER',
        status: 'ACTIVE',
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!notice && !errorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
      setErrorMessage(null);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [errorMessage, notice]);

  const shipmentLookup = useMemo(
    () => buildLookupByShipmentCode(shipmentsQuery.data ?? []),
    [shipmentsQuery.data],
  );
  const pickupLookup = useMemo(
    () => buildLookupByPickupId(pickupsQuery.data ?? []),
    [pickupsQuery.data],
  );
  const rows = useMemo(
    () => buildDispatchRows(tasksQuery.data ?? [], shipmentLookup, pickupLookup),
    [pickupLookup, shipmentLookup, tasksQuery.data],
  );
  const courierDisplayOptions = useMemo(
    () =>
      buildCourierDisplayOptions(
        (courierOptionsQuery.data ?? []).map((courier) => courier.courierId),
        shipperUsersQuery.data ?? [],
      ),
    [courierOptionsQuery.data, shipperUsersQuery.data],
  );
  const courierDisplayLookup = useMemo(
    () =>
      new Map(
        courierDisplayOptions.map((option) => [option.courierId, option]),
      ),
    [courierDisplayOptions],
  );
  const formatAssignedCourier = (courierId: string | null): string =>
    courierId ? courierDisplayLookup.get(courierId)?.label ?? courierId : '-';

  useEffect(() => {
    if (selectedCourierId || courierDisplayOptions.length === 0) {
      return;
    }

    setSelectedCourierId(courierDisplayOptions[0].courierId);
  }, [courierDisplayOptions, selectedCourierId]);

  const filterOptions = useMemo(() => {
    const wards = new Set<string>();
    const hubs = new Set<string>();
    const sources = new Set<string>();
    const services = new Set<string>();

    for (const row of rows) {
      if (row.pickupWard) wards.add(row.pickupWard);
      if (row.pickupHub) hubs.add(row.pickupHub);
      if (row.source) sources.add(row.source);
      if (row.serviceType) services.add(row.serviceType);
    }

    const sort = (items: Set<string>) => Array.from(items).sort((left, right) => left.localeCompare(right, 'vi'));

    return {
      wards: sort(wards),
      hubs: sort(hubs),
      sources: sort(sources),
      services: sort(services),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = normalizeLower(appliedFilters.keyword);
    const customer = normalizeLower(appliedFilters.customer);

    return rows.filter((row) => {
      const keywordSource =
        appliedFilters.searchMode === 'orderCode' ? row.orderCode : row.shipmentCode;
      const keywordMatched = !keyword || normalizeLower(keywordSource).includes(keyword);
      const dateMatched = isDateInRange(row.createdAt ?? row.updatedAt, appliedFilters.fromDate, appliedFilters.toDate);
      const wardMatched = !appliedFilters.ward || row.pickupWard === appliedFilters.ward;
      const hubMatched = !appliedFilters.pickupHub || row.pickupHub === appliedFilters.pickupHub;
      const sourceMatched = !appliedFilters.source || row.source === appliedFilters.source;
      const statusMatched = matchesStatusFilter(row, appliedFilters.status);
      const courierMatched = matchesCourierFilter(
        row.assignedCourierId,
        appliedFilters.courierId,
        courierDisplayLookup,
      );
      const serviceMatched =
        !appliedFilters.serviceType || row.serviceType === appliedFilters.serviceType;
      const customerMatched =
        !customer ||
        normalizeLower(row.senderName).includes(customer) ||
        normalizeLower(row.senderPhone).includes(customer);

      return (
        keywordMatched &&
        dateMatched &&
        wardMatched &&
        hubMatched &&
        sourceMatched &&
        statusMatched &&
        courierMatched &&
        serviceMatched &&
        customerMatched
      );
    });
  }, [appliedFilters, courierDisplayLookup, rows]);

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedOrderIds.includes(row.id)),
    [filteredRows, selectedOrderIds],
  );
  const selectedSelectableCount = selectedRows.filter((row) => row.selectable).length;
  const selectableRows = filteredRows.filter((row) => row.selectable);
  const allSelectableSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedOrderIds.includes(row.id));
  const createdCount = rows.filter((row) => row.status === 'CREATED').length;
  const assignedCount = rows.filter((row) => row.status === 'ASSIGNED').length;

  useEffect(() => {
    const visibleIds = new Set(filteredRows.map((row) => row.id));
    setSelectedOrderIds((previous) => previous.filter((id) => visibleIds.has(id)));
  }, [filteredRows]);

  const setDraftFilter = <K extends keyof DispatchFilters>(key: K, value: DispatchFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applySearch = () => {
    setAppliedFilters(draftFilters);
    setNotice(null);
    setErrorMessage(null);
  };

  const resetFilters = () => {
    const nextFilters = emptyFilters;
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setSelectedOrderIds([]);
    setNotice(null);
    setErrorMessage(null);
  };

  const refreshData = async () => {
    await Promise.all([
      tasksQuery.refetch(),
      shipmentsQuery.refetch(),
      pickupsQuery.refetch(),
      courierOptionsQuery.refetch(),
      shipperUsersQuery.refetch(),
    ]);
  };

  const exportFilteredRows = () => {
    const headers = [
      'STT',
      'Ma don dat',
      'Ma van don',
      'Nguoi gui',
      'Dia chi lay',
      'Phuong xa lay',
      'Trang thai',
      'Buu cuc lay',
      'Shipper',
      'Thoi gian tao',
    ];
    const escapeCsv = (value: string | number | null | undefined) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escapeCsv).join(','),
      ...filteredRows.map((row, index) =>
        [
          index + 1,
          row.orderCode,
          row.shipmentCode,
          row.senderName,
          row.pickupAddress,
          row.pickupWard,
          formatRowStatus(row),
          row.pickupHub,
          row.assignedCourierId ?? '',
          formatDateTime(row.createdAt),
        ]
          .map(escapeCsv)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dieu-phoi-don-dat.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleOrder = (orderId: string, checked: boolean) => {
    setSelectedOrderIds((current) => {
      if (checked) {
        return current.includes(orderId) ? current : [...current, orderId];
      }

      return current.filter((selectedId) => selectedId !== orderId);
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...selectableRows.map((row) => row.id)])));
      return;
    }

    const selectableIds = new Set(selectableRows.map((row) => row.id));
    setSelectedOrderIds((current) => current.filter((id) => !selectableIds.has(id)));
  };

  const openDispatchPanel = (orders: DispatchOrderRow[]) => {
    const selectableOrderIds = orders.filter((row) => row.selectable).map((row) => row.id);

    if (selectableOrderIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 đơn có thể điều phối.');
      return;
    }

    setSelectedOrderIds(selectableOrderIds);
    setErrorMessage(null);
    setIsDispatchPanelOpen(true);
  };

  const dispatchOrders = async (orders: DispatchOrderRow[]) => {
    if (!accessToken) {
      return;
    }

    const courierId = selectedCourierId.trim();
    if (!courierId) {
      setErrorMessage('Vui lòng chọn shipper trước khi điều phối.');
      return;
    }

    const ordersToAssign = orders.filter((row) => row.selectable);
    if (ordersToAssign.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 đơn có thể điều phối.');
      return;
    }

    setAssignLoading(true);
    setNotice(null);
    setErrorMessage(null);

    let assigned = 0;
    let reassigned = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const row of ordersToAssign) {
      try {
        if (row.assignedCourierId) {
          if (row.assignedCourierId === courierId) {
            skipped += 1;
            continue;
          }

          await tasksClient.reassign(accessToken, {
            taskId: row.id,
            courierId,
            note: assignNote,
          });
          reassigned += 1;
          continue;
        }

        await tasksClient.assign(accessToken, {
          taskId: row.id,
          courierId,
          note: assignNote,
        });
        assigned += 1;
      } catch (error) {
        failures.push(`${row.orderCode}: ${getErrorMessage(error)}`);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    setAssignLoading(false);

    if (failures.length === 0) {
      setSelectedOrderIds([]);
      setIsDispatchPanelOpen(false);
    }

    setNotice(`Đã điều phối ${assigned}, điều phối lại ${reassigned}, bỏ qua ${skipped}.`);
    if (failures.length > 0) {
      setErrorMessage(`Thất bại ${failures.length}: ${failures.slice(0, 3).join(' | ')}`);
    }
  };

  const dispatchSelectedOrders = async () => {
    await dispatchOrders(selectedRows);
  };

  const isLoading =
    tasksQuery.isLoading ||
    shipmentsQuery.isLoading ||
    pickupsQuery.isLoading ||
    courierOptionsQuery.isLoading ||
    shipperUsersQuery.isLoading;
  const queryError =
    tasksQuery.error ??
    shipmentsQuery.error ??
    pickupsQuery.error ??
    courierOptionsQuery.error ??
    shipperUsersQuery.error ??
    null;

  return (
    <section className="ops-customer-dispatch">
      <header className="ops-customer-dispatch__toolbar">
        <button type="button" className="ops-customer-dispatch__action ops-customer-dispatch__action--danger" onClick={applySearch}>
          <SearchIcon />
          Tìm kiếm
        </button>
        <button type="button" className="ops-customer-dispatch__action" onClick={exportFilteredRows}>
          <DownloadIcon />
          Xuất dữ liệu
        </button>
        <button type="button" className="ops-customer-dispatch__action" onClick={() => void refreshData()}>
          <RefreshIcon />
          Làm mới
        </button>
        <button type="button" className="ops-customer-dispatch__action" onClick={resetFilters}>
          Rút đơn đặt
        </button>
        <button
          type="button"
          className="ops-customer-dispatch__action ops-customer-dispatch__action--primary"
          disabled={assignLoading || selectedSelectableCount === 0}
          onClick={() => openDispatchPanel(selectedRows)}
        >
          <SendIcon />
          Điều phối shipper
        </button>
        <span className="ops-customer-dispatch__toolbar-spacer" />
        <button type="button" className="ops-customer-dispatch__action">
          Trung tâm tải xuống
        </button>
        <button type="button" className="ops-customer-dispatch__action">
          Lấy hàng thất bại
        </button>
      </header>

      <section className="ops-customer-dispatch__filters" aria-label="Bộ lọc điều phối đơn đặt">
        <div className="ops-customer-dispatch__radio-row">
          <label>
            <input
              type="radio"
              checked={draftFilters.searchMode === 'orderCode'}
              onChange={() => setDraftFilter('searchMode', 'orderCode')}
            />
            Mã đơn đặt
          </label>
          <label>
            <input
              type="radio"
              checked={draftFilters.searchMode === 'shipmentCode'}
              onChange={() => setDraftFilter('searchMode', 'shipmentCode')}
            />
            Mã vận đơn
          </label>
        </div>

        <label>
          <span>Từ ngày nhập đơn đặt</span>
          <input
            type="datetime-local"
            value={draftFilters.fromDate ? `${draftFilters.fromDate}T00:00` : ''}
            onChange={(event) => setDraftFilter('fromDate', event.target.value.slice(0, 10))}
          />
        </label>
        <label>
          <span>Đến ngày nhập đơn đặt</span>
          <input
            type="datetime-local"
            value={draftFilters.toDate ? `${draftFilters.toDate}T23:59` : ''}
            onChange={(event) => setDraftFilter('toDate', event.target.value.slice(0, 10))}
          />
        </label>
        <label>
          <span>Phường xã lấy</span>
          <select value={draftFilters.ward} onChange={(event) => setDraftFilter('ward', event.target.value)}>
            <option value="">Vui lòng chọn phường/xã</option>
            {filterOptions.wards.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Bưu cục lấy hàng</span>
          <select value={draftFilters.pickupHub} onChange={(event) => setDraftFilter('pickupHub', event.target.value)}>
            <option value="">Tất cả bưu cục</option>
            {filterOptions.hubs.map((hub) => (
              <option key={hub} value={hub}>
                {hub}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Nguồn đơn đặt</span>
          <select value={draftFilters.source} onChange={(event) => setDraftFilter('source', event.target.value)}>
            <option value="">Vui lòng chọn nguồn đơn đặt</option>
            {filterOptions.sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái đơn đặt</span>
          <select value={draftFilters.status} onChange={(event) => setDraftFilter('status', event.target.value)}>
            {statusFilterOptions.map((option) => (
              <option key={option.value || 'ALL'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Khách hàng thương mại</span>
          <input
            type="text"
            value={draftFilters.customer}
            onChange={(event) => setDraftFilter('customer', event.target.value)}
            placeholder="Tên hoặc số điện thoại"
          />
        </label>
        <label>
          <span>Nhân viên giao nhận</span>
          <input
            type="text"
            list="ops-customer-dispatch-couriers"
            value={draftFilters.courierId}
            onChange={(event) => setDraftFilter('courierId', event.target.value)}
            placeholder="Nhập tên hoặc mã NVGN"
          />
          <datalist id="ops-customer-dispatch-couriers">
            {courierDisplayOptions.map((courier) => (
              <option key={courier.courierId} value={courier.label} />
            ))}
          </datalist>
        </label>
        <label>
          <span>Loại dịch vụ</span>
          <select value={draftFilters.serviceType} onChange={(event) => setDraftFilter('serviceType', event.target.value)}>
            <option value="">Lấy hàng tại nhà</option>
            {filterOptions.services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Mã khách hàng</span>
          <div className="ops-customer-dispatch__keyword">
            <SearchIcon />
            <input
              type="text"
              value={draftFilters.keyword}
              onChange={(event) => setDraftFilter('keyword', event.target.value)}
              placeholder="Tối đa 500 đơn, phân biệt bằng dấu phẩy"
            />
          </div>
        </label>
      </section>

      <section className="ops-customer-dispatch__summary" aria-label="Tổng quan điều phối">
        <article>
          <span>Chờ điều phối</span>
          <strong>{createdCount}</strong>
        </article>
        <article>
          <span>Đã điều phối</span>
          <strong>{assignedCount}</strong>
        </article>
        <article>
          <span>Đang hiển thị</span>
          <strong>{filteredRows.length}</strong>
        </article>
        <article>
          <span>Đã chọn</span>
          <strong>{selectedOrderIds.length}</strong>
        </article>
      </section>

      {queryError ? <div className="ops-customer-dispatch__alert ops-customer-dispatch__alert--error">{getErrorMessage(queryError)}</div> : null}
      {notice ? <div className="ops-customer-dispatch__alert ops-customer-dispatch__alert--success">{notice}</div> : null}
      {errorMessage ? <div className="ops-customer-dispatch__alert ops-customer-dispatch__alert--error">{errorMessage}</div> : null}

      <div className="ops-customer-dispatch__content">
        <section className="ops-customer-dispatch__table-card">
          <div className="ops-customer-dispatch__table-title">
            <h3>Danh sách đơn điều phối</h3>
            <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} đơn`}</span>
          </div>
          <div className="ops-customer-dispatch__table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="ops-customer-dispatch__select-col">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      disabled={selectableRows.length === 0}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="Chọn tất cả đơn có thể điều phối"
                    />
                  </th>
                  <th>STT</th>
                  <th>Thời gian</th>
                  <th>Mã vận đơn</th>
                  <th>Người gửi</th>
                  <th>Địa chỉ lấy</th>
                  <th>Phường xã lấy</th>
                  <th>Trạng thái đơn đặt</th>
                  <th>Thông tin</th>
                  <th>Bưu cục lấy</th>
                  <th>Thời gian điều phối shipper</th>
                  <th>Nhãn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(row.id)}
                        disabled={!row.selectable}
                        onChange={(event) => toggleOrder(row.id, event.target.checked)}
                        aria-label={`Chọn ${row.orderCode}`}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>
                      <strong className="ops-customer-dispatch__code">{row.shipmentCode || row.orderCode}</strong>
                      <small>{row.orderCode}</small>
                    </td>
                    <td>
                      <strong>{row.senderName}</strong>
                      <small>{row.senderPhone || 'Chưa có SĐT'}</small>
                    </td>
                    <td>{row.pickupAddress}</td>
                    <td>{row.pickupWard}</td>
                    <td>
                      <span className={`ops-customer-dispatch__status ops-customer-dispatch__status--${row.status.toLowerCase()}`}>
                        {formatRowStatus(row)}
                      </span>
                    </td>
                    <td>
                      <span>{row.source}</span>
                      <small>{row.serviceType}</small>
                    </td>
                    <td>{row.pickupHub}</td>
                    <td>{row.assignedCourierId ? formatDateTime(row.updatedAt) : 'Chưa điều phối'}</td>
                    <td>{formatAssignedCourier(row.assignedCourierId)}</td>
                    <td>
                      <button
                        type="button"
                        className="ops-customer-dispatch__row-action"
                        disabled={!row.selectable || assignLoading}
                        onClick={() => openDispatchPanel([row])}
                      >
                        Điều phối
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="ops-customer-dispatch__empty">
                      Không có đơn phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isDispatchPanelOpen ? (
        <div className="ops-customer-dispatch__modal" role="dialog" aria-modal="true" aria-label="Điều phối shipper">
          <button
            type="button"
            className="ops-customer-dispatch__modal-backdrop"
            aria-label="Đóng điều phối shipper"
            onClick={() => setIsDispatchPanelOpen(false)}
          />
          <aside className="ops-customer-dispatch__drawer">
            <header className="ops-customer-dispatch__drawer-header">
              <div>
                <span>Điều phối shipper</span>
                <h3>Chọn nhân viên giao hàng</h3>
              </div>
              <button
                type="button"
                className="ops-customer-dispatch__drawer-close"
                onClick={() => setIsDispatchPanelOpen(false)}
                aria-label="Đóng"
              >
                x
              </button>
            </header>

            <section className="ops-customer-dispatch__drawer-summary">
              <article>
                <span>Đơn đã chọn</span>
                <strong>{selectedSelectableCount}</strong>
              </article>
              <article>
                <span>Đang điều phối lại</span>
                <strong>{selectedRows.filter((row) => row.assignedCourierId).length}</strong>
              </article>
            </section>

            <div className="ops-customer-dispatch__selected-list">
              {selectedRows.slice(0, 5).map((row) => (
                <article key={row.id}>
                  <strong>{row.shipmentCode || row.orderCode}</strong>
                  <span>{row.senderName}</span>
                </article>
              ))}
              {selectedRows.length > 5 ? <small>+{selectedRows.length - 5} đơn khác</small> : null}
            </div>

            <section className="ops-customer-dispatch__courier-picker" aria-label="Danh sách nhân viên giao hàng">
              {courierDisplayOptions.map((courier) => {
                const load = rows.filter((row) => row.assignedCourierId === courier.courierId).length;
                const checked = selectedCourierId === courier.courierId;

                return (
                  <label
                    key={courier.courierId}
                    className={
                      checked
                        ? 'ops-customer-dispatch__courier-option ops-customer-dispatch__courier-option--active'
                        : 'ops-customer-dispatch__courier-option'
                    }
                  >
                    <input
                      type="radio"
                      name="dispatchCourier"
                      checked={checked}
                      onChange={() => setSelectedCourierId(courier.courierId)}
                    />
                    <span>
                      <strong>{courier.label}</strong>
                      <small>{load} việc đang nhận</small>
                    </span>
                  </label>
                );
              })}
              {courierDisplayOptions.length === 0 ? (
                <p className="ops-customer-dispatch__drawer-empty">Chưa có nhân viên giao hàng để điều phối.</p>
              ) : null}
            </section>

            <label className="ops-customer-dispatch__drawer-field">
              <span>Hạn hoàn thành</span>
              <select defaultValue="today">
                <option value="2h">Trong 2 giờ</option>
                <option value="4h">Trong 4 giờ</option>
                <option value="today">Trong ngày</option>
              </select>
            </label>
            <label className="ops-customer-dispatch__drawer-field">
              <span>Ghi chú cho shipper</span>
              <textarea value={assignNote} onChange={(event) => setAssignNote(event.target.value)} />
            </label>

            <footer className="ops-customer-dispatch__drawer-footer">
              <button type="button" className="ops-customer-dispatch__ghost-btn" onClick={() => setIsDispatchPanelOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="ops-customer-dispatch__assign-btn"
                disabled={assignLoading || selectedSelectableCount === 0 || !selectedCourierId}
                onClick={() => void dispatchSelectedOrders()}
              >
                <SendIcon />
                {assignLoading ? 'Đang điều phối...' : `Xác nhận ${selectedSelectableCount} đơn`}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
