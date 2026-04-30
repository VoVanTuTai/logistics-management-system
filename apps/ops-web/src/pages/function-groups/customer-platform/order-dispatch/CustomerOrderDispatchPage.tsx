import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { authClient } from '../../../../features/auth/auth.client';
import type { OpsUserDto } from '../../../../features/auth/auth.types';
import { usePickupRequestsQuery } from '../../../../features/pickups/pickups.api';
import type { PickupRequestListItemDto } from '../../../../features/pickups/pickups.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { tasksClient, useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { queryKeys } from '../../../../utils/queryKeys';
import './CustomerOrderDispatchPage.css';

type DispatchStatus = 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

interface DispatchOrderRow {
  id: string;
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
  RETURN_PORTAL: 'Cổng hàng trả',
};

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

function resolvePickupHub(shipment: ShipmentListItemDto | null): string {
  return normalizeCode(
    shipment?.senderHubCode ??
      shipment?.originHubCode ??
      shipment?.currentLocation ??
      null,
  );
}

function mapTaskToDispatchRow(
  task: TaskListItemDto,
  shipment: ShipmentListItemDto | null,
  pickup: PickupRequestListItemDto | null,
  courierLookup: Map<string, OpsUserDto>,
): DispatchOrderRow | null {
  if (!isDispatchStatus(task.status)) {
    return null;
  }

  const pickupHub = resolvePickupHub(shipment);
  if (!pickupHub) {
    return null;
  }

  const assignedCourier = task.assignedCourierId
    ? courierLookup.get(normalizeCode(task.assignedCourierId)) ?? null
    : null;

  return {
    id: task.id,
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
  const [searchBy, setSearchBy] = useState<'order' | 'shipment'>('order');
  const [keyword, setKeyword] = useState('');
  const [fromTime, setFromTime] = useState(startOfTodayInputValue);
  const [toTime, setToTime] = useState(endOfTodayInputValue);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [courierFilter, setCourierFilter] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [courierSearch, setCourierSearch] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const tasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' });
  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const pickupsQuery = usePickupRequestsQuery(accessToken, {});
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

  const dispatchRows = useMemo(() => {
    const shipmentLookup = buildShipmentLookup(shipmentsQuery.data ?? []);
    const pickupLookup = buildPickupLookup(pickupsQuery.data ?? []);

    return (tasksQuery.data ?? [])
      .map((task) => {
        const shipmentCode = normalizeCode(task.shipmentCode);
        const shipment = shipmentCode ? shipmentLookup.get(shipmentCode) ?? null : null;
        const pickup = shipmentCode ? pickupLookup.get(shipmentCode) ?? null : null;
        return mapTaskToDispatchRow(task, shipment, pickup, courierLookup);
      })
      .filter((row): row is DispatchOrderRow => Boolean(row))
      .filter((row) => row.pickupHub === processingHubCode)
      .sort(
        (left, right) =>
          new Date(right.requestedAt ?? '').getTime() - new Date(left.requestedAt ?? '').getTime(),
      );
  }, [
    courierLookup,
    pickupsQuery.data,
    processingHubCode,
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

  const wardOptions = useMemo(
    () =>
      Array.from(
        new Set(dispatchRows.map((order) => order.ward).filter((ward) => ward !== '-')),
      ).sort(),
    [dispatchRows],
  );
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
      const keywordSource = searchBy === 'order' ? order.orderCode : order.shipmentCode;
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
    searchBy,
    serviceFilter,
    sourceFilter,
    statusFilter,
    toTime,
    wardFilter,
  ]);

  const selectedOrders = useMemo(
    () => dispatchRows.filter((order) => selectedOrderIds.includes(order.id)),
    [dispatchRows, selectedOrderIds],
  );
  const selectedParcelCount = selectedOrders.reduce((sum, order) => sum + order.parcelCount, 0);
  const selectedHubCodes = useMemo(
    () => Array.from(new Set(selectedOrders.map((order) => order.pickupHub))).sort(),
    [selectedOrders],
  );
  const selectedCourier =
    courierOptions.find((courier) => courier.id === selectedCourierId) ?? null;
  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedOrderIds.includes(order.id));
  const loadError =
    tasksQuery.error ?? shipmentsQuery.error ?? pickupsQuery.error ?? shippersQuery.error ?? null;

  useEffect(() => {
    const existingIds = new Set(dispatchRows.map((row) => row.id));
    setSelectedOrderIds((current) => current.filter((orderId) => existingIds.has(orderId)));
  }, [dispatchRows]);

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
      const visibleIdSet = new Set(filteredOrders.map((order) => order.id));
      setSelectedOrderIds((current) => current.filter((orderId) => !visibleIdSet.has(orderId)));
      return;
    }

    setSelectedOrderIds((current) =>
      Array.from(new Set([...current, ...filteredOrders.map((order) => order.id)])),
    );
  };

  const resetFilters = () => {
    setStatusFilter('CREATED');
    setSearchBy('order');
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
      setNotice('Vui lòng chọn ít nhất một đơn để điều phối shipper.');
      return;
    }

    const assignableSelectedOrders = selectedOrders.filter(canAssign);
    if (assignableSelectedOrders.length === 0) {
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

    const assignableSelectedOrders = selectedOrders.filter(canAssign);
    if (assignableSelectedOrders.length === 0) {
      setNotice('Không có đơn phù hợp để điều phối.');
      return;
    }

    setIsAssigning(true);
    let assignedCount = 0;
    let reassignedCount = 0;
    let skippedCount = 0;
    const failedRows: string[] = [];

    for (const order of assignableSelectedOrders) {
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

    const cancellableOrders = selectedOrders.filter(canAssign);
    if (cancellableOrders.length === 0) {
      setNotice('Vui lòng chọn đơn lấy hàng đang mở để ghi nhận thất bại.');
      return;
    }

    setIsCancelling(true);
    const failedRows: string[] = [];

    for (const order of cancellableOrders) {
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
        : `Đã ghi nhận lấy hàng thất bại cho ${cancellableOrders.length} đơn.`,
    );
  };

  return (
    <section className="ops-customer-dispatch">
      <header className="ops-customer-dispatch__top">
        <div>
          <h2>Điều phối đơn đặt</h2>
          <p>Quản lý task lấy hàng thật theo bưu cục Ops được gán và phân công nhân viên giao nhận.</p>
        </div>
        <button type="button" className="ops-customer-dispatch__collapse-btn">
          Thu gọn
        </button>
      </header>

      <section className="ops-customer-dispatch__toolbar" aria-label="Thao tác điều phối">
        <button type="button" className="ops-customer-dispatch__primary-action">
          Tìm kiếm
        </button>
        <button type="button" disabled>
          Xuất dữ liệu
        </button>
        <button type="button" onClick={resetFilters}>
          Làm mới
        </button>
        <button type="button" disabled>
          Rút đơn đặt
        </button>
        <button type="button" onClick={openAssignModal}>
          Điều phối shipper
        </button>
        <button type="button" disabled>
          Trung tâm tải xuống
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
        <fieldset className="ops-customer-dispatch__radio-field">
          <legend>Tìm theo</legend>
          <label>
            <input
              type="radio"
              name="dispatch-search-by"
              checked={searchBy === 'order'}
              onChange={() => setSearchBy('order')}
            />
            <span>Mã đơn đặt</span>
          </label>
          <label>
            <input
              type="radio"
              name="dispatch-search-by"
              checked={searchBy === 'shipment'}
              onChange={() => setSearchBy('shipment')}
            />
            <span>Mã vận đơn</span>
          </label>
        </fieldset>

        <label>
          <span>Từ giờ bắt đầu nhập đơn đặt</span>
          <input
            type="datetime-local"
            value={fromTime}
            onChange={(event) => setFromTime(event.target.value)}
          />
        </label>

        <label>
          <span>Đến giờ kết thúc nhập đơn đặt</span>
          <input
            type="datetime-local"
            value={toTime}
            onChange={(event) => setToTime(event.target.value)}
          />
        </label>

        <label>
          <span>Phường xã lấy</span>
          <select value={wardFilter} onChange={(event) => setWardFilter(event.target.value)}>
            <option value="ALL">Vui lòng chọn phường xã</option>
            {wardOptions.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Mã bưu cục xử lý</span>
          <input
            type="text"
            value={processingHubCode || 'Chưa được gán bưu cục'}
            disabled
            readOnly
          />
        </label>

        <label>
          <span>Nguồn đơn đặt</span>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="ALL">Vui lòng chọn nguồn đơn</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {sourceLabel(source)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Trạng thái đơn đặt</span>
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
          <span>Từ khóa</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Nhập mã hoặc tên shop"
          />
        </label>

        <label>
          <span>Nhân viên giao nhận</span>
          <input
            value={courierFilter}
            onChange={(event) => setCourierFilter(event.target.value)}
            placeholder="Nhập tên hoặc mã NVGN"
          />
        </label>

        <label>
          <span>Loại dịch vụ</span>
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
          <span>Mã khách hàng</span>
          <input placeholder="Vui lòng nhập tên hoặc mã KH" disabled />
        </label>
      </section>

      <section className="ops-customer-dispatch__assign-strip">
        <div>
          <strong>{selectedOrderIds.length}</strong>
          <span>đơn đã chọn</span>
        </div>
        <div>
          <strong>{selectedParcelCount}</strong>
          <span>kiện cần lấy</span>
        </div>
        <div>
          <strong>{selectedHubCodes.length ? selectedHubCodes.join(', ') : '-'}</strong>
          <span>bưu cục xử lý</span>
        </div>
        <button type="button" onClick={openAssignModal}>
          Điều phối đã chọn
        </button>
        {notice ? <p role="status">{notice}</p> : null}
      </section>

      {loadError ? (
        <div className="ops-customer-dispatch__error" role="alert">
          {getErrorMessage(loadError)}
        </div>
      ) : null}

      <section className="ops-customer-dispatch__table-panel">
        <div className="ops-customer-dispatch__table-head">
          <h3>Danh sách đơn đặt cần điều phối</h3>
          <span>
            {tasksQuery.isLoading || shipmentsQuery.isLoading || pickupsQuery.isLoading
              ? 'Đang tải...'
              : `${filteredOrders.length} dòng`}
          </span>
        </div>

        <div className="ops-customer-dispatch__table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                    aria-label="Chọn tất cả đơn đang hiển thị"
                  />
                </th>
                <th>Mã đơn đặt</th>
                <th>Mã vận đơn</th>
                <th>Người gửi</th>
                <th>Địa chỉ lấy</th>
                <th>Phường xã</th>
                <th>Trạng thái đơn đặt</th>
                <th>Thông tin</th>
                <th>Bưu cục lấy</th>
                <th>Thời gian điều phối shipper</th>
                <th>Nhân viên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={(event) => toggleOrder(order.id, event.target.checked)}
                      aria-label={`Chọn ${order.orderCode}`}
                    />
                  </td>
                  <td className="ops-customer-dispatch__code">
                    {order.orderCode}
                    <small>{order.taskCode}</small>
                  </td>
                  <td>{order.shipmentCode}</td>
                  <td>
                    <strong>{order.senderName}</strong>
                    <small>{order.senderPhone}</small>
                  </td>
                  <td>
                    {order.pickupAddress}
                    <small>{order.district}</small>
                  </td>
                  <td>{order.ward}</td>
                  <td>
                    <span
                      className={`ops-customer-dispatch__status ops-customer-dispatch__status--${order.status.toLowerCase()}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <strong>{serviceLabel(order.serviceType)}</strong>
                    <small>
                      {sourceLabel(order.source)} · {order.parcelCount} kiện
                    </small>
                    <small>Pickup: {order.pickupStatus ?? '-'}</small>
                  </td>
                  <td>{order.pickupHub}</td>
                  <td>{order.scheduledAt ? formatDateTime(order.scheduledAt) : 'Chưa điều phối'}</td>
                  <td>
                    {order.assignedCourierId ? (
                      <>
                        <strong>{order.assignedCourierName ?? order.assignedCourierId}</strong>
                        <small>{order.assignedCourierId}</small>
                      </>
                    ) : (
                      'Chưa gán'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ops-customer-dispatch__row-action"
                      onClick={() => toggleOrder(order.id, !selectedOrderIds.includes(order.id))}
                    >
                      {selectedOrderIds.includes(order.id) ? 'Bỏ chọn' : 'Chọn'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 ? (
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
                  {selectedOrderIds.length} đơn / {selectedParcelCount} kiện
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
                    <em>{courier.activeTasks} task</em>
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
                {isAssigning ? 'Đang điều phối...' : 'Điều phối'}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
