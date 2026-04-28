import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import './BranchOutboundOrderManagementPage.css';

interface OutboundOrderRow {
  shipment: ShipmentListItemDto;
  acceptedDate: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  courierId: string;
  serviceType: string;
  codAmount: string;
  currentStatus: string;
}

interface OutboundSearchFilters {
  dateFrom: string;
  dateTo: string;
  receiverPhone: string;
  courierFilter: string;
}

const ACCEPTED_OUTBOUND_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'MANIFEST_SEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'TASK_ASSIGNED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
]);

function formatCurrency(value: number | null): string {
  if (value === null) {
    return '0 đ';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    if (!task.shipmentCode || task.taskType !== 'PICKUP') {
      continue;
    }

    const previous = result.get(task.shipmentCode);
    if (!previous || previous.updatedAt < task.updatedAt) {
      result.set(task.shipmentCode, task);
    }
  }

  return result;
}

function isShipmentInBranchScope(
  shipment: ShipmentListItemDto,
  assignedHubCodes: string[],
  scopeTokens: Set<string>,
): boolean {
  if (assignedHubCodes.length === 0) {
    return false;
  }

  const currentLocation = (shipment.currentLocation ?? '').trim().toUpperCase();
  if (currentLocation && assignedHubCodes.includes(currentLocation)) {
    return true;
  }

  return isShipmentInScope(shipment, scopeTokens);
}

export function BranchOutboundOrderManagementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;

  const today = useMemo(() => toDateInputValue(new Date()), []);
  const initialFilters = useMemo<OutboundSearchFilters>(
    () => ({
      dateFrom: today,
      dateTo: today,
      receiverPhone: '',
      courierFilter: 'all',
    }),
    [today],
  );
  const [draftFilters, setDraftFilters] = useState<OutboundSearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<OutboundSearchFilters>(initialFilters);

  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const pickupTasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' });
  const hubsQuery = useHubsQuery(accessToken, {});

  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const pickupTaskByShipment = useMemo(
    () => buildTaskByShipment(pickupTasksQuery.data ?? []),
    [pickupTasksQuery.data],
  );

  const rows = useMemo<OutboundOrderRow[]>(() => {
    const shipments = shipmentsQuery.data ?? [];
    const scopedShipments = canViewAllHubAreas
      ? shipments
      : shipments.filter((shipment) =>
          isShipmentInBranchScope(shipment, assignedHubCodes, hubScopeTokens),
        );

    return scopedShipments
      .filter((shipment) => ACCEPTED_OUTBOUND_STATUSES.has(shipment.currentStatus))
      .map((shipment) => {
        const pickupTask = pickupTaskByShipment.get(shipment.shipmentCode);

        return {
          shipment,
          acceptedDate: pickupTask?.updatedAt ?? shipment.updatedAt,
          receiverName: shipment.receiverName ?? 'Người nhận',
          receiverPhone: shipment.receiverPhone ?? '-',
          receiverAddress: shipment.receiverAddress ?? 'Không có địa chỉ',
          courierId: pickupTask?.assignedCourierId ?? 'Ops tiếp nhận',
          serviceType: shipment.serviceType ?? shipment.parcelType ?? 'Không có',
          codAmount: formatCurrency(shipment.codAmount),
          currentStatus: formatShipmentStatusLabel(shipment.currentStatus),
        };
      });
  }, [
    assignedHubCodes,
    canViewAllHubAreas,
    hubScopeTokens,
    pickupTaskByShipment,
    shipmentsQuery.data,
  ]);

  const courierOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.courierId).filter((courier) => courier !== 'Ops tiếp nhận'))),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const phoneKeyword = normalize(appliedFilters.receiverPhone);

    return rows.filter((row) => {
      const acceptedDateKey = toDateKey(row.acceptedDate);
      const afterStart = !appliedFilters.dateFrom || acceptedDateKey >= appliedFilters.dateFrom;
      const beforeEnd = !appliedFilters.dateTo || acceptedDateKey <= appliedFilters.dateTo;
      const phoneMatched =
        phoneKeyword.length === 0 || normalize(row.receiverPhone).includes(phoneKeyword);
      const courierMatched =
        appliedFilters.courierFilter === 'all' || row.courierId === appliedFilters.courierFilter;

      return afterStart && beforeEnd && phoneMatched && courierMatched;
    });
  }, [appliedFilters, rows]);

  const totalCod = filteredRows.reduce((sum, row) => sum + (row.shipment.codAmount ?? 0), 0);
  const pickedByCourier = filteredRows.filter((row) => row.courierId !== 'Ops tiếp nhận').length;
  const isSearching =
    shipmentsQuery.isFetching || pickupTasksQuery.isFetching || hubsQuery.isFetching;

  const updateDraftFilter = (key: keyof OutboundSearchFilters, value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    void Promise.all([
      shipmentsQuery.refetch(),
      pickupTasksQuery.refetch(),
      hubsQuery.refetch(),
    ]);
  };

  return (
    <section className="ops-branch-outbound-orders">
      <header className="ops-branch-outbound-orders__header">
        <div>
          <small>BRANCH_ORDER_OUTBOUND_MANAGEMENT</small>
          <h2>Quản lý vận đơn gửi</h2>
          <p>
            Danh sách vận đơn đã được bưu cục tiếp nhận hoặc quét nhận hàng, hỗ trợ lọc theo ngày nhận, số điện thoại người nhận và nhân viên giao nhận.
          </p>
        </div>
        <div className="ops-branch-outbound-orders__summary">
          <article>
            <span>Đã nhận</span>
            <strong>{filteredRows.length}</strong>
          </article>
          <article>
            <span>Có courier</span>
            <strong>{pickedByCourier}</strong>
          </article>
          <article>
            <span>Tổng COD</span>
            <strong>{formatCurrency(totalCod)}</strong>
          </article>
        </div>
      </header>

      <form className="ops-branch-outbound-orders__filters" onSubmit={submitSearch}>
        <label>
          <span>Từ ngày nhận</span>
          <input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(event) => updateDraftFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          <span>Đến ngày nhận</span>
          <input
            type="date"
            value={draftFilters.dateTo}
            onChange={(event) => updateDraftFilter('dateTo', event.target.value)}
          />
        </label>
        <label>
          <span>SĐT người nhận</span>
          <input
            type="text"
            placeholder="Nhập số điện thoại"
            value={draftFilters.receiverPhone}
            onChange={(event) => updateDraftFilter('receiverPhone', event.target.value)}
          />
        </label>
        <label>
          <span>Nhân viên giao hàng</span>
          <select
            value={draftFilters.courierFilter}
            onChange={(event) => updateDraftFilter('courierFilter', event.target.value)}
          >
            <option value="all">Tất cả</option>
            {courierOptions.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Đang tải...' : 'Tìm kiếm'}
        </button>
      </form>

      <section className="ops-branch-outbound-orders__table-card">
        <div className="ops-branch-outbound-orders__table-title">
          <h3>Danh sách vận đơn đã nhận tại bưu cục</h3>
          <span>{filteredRows.length} vận đơn</span>
        </div>

        {shipmentsQuery.isLoading || pickupTasksQuery.isLoading || hubsQuery.isLoading ? (
          <p className="ops-branch-outbound-orders__empty">Đang tải dữ liệu vận đơn gửi...</p>
        ) : null}
        {shipmentsQuery.isError ? (
          <p className="ops-branch-outbound-orders__empty">{getErrorMessage(shipmentsQuery.error)}</p>
        ) : null}
        {assignedHubCodes.length === 0 && !canViewAllHubAreas ? (
          <p className="ops-branch-outbound-orders__empty">
            Tài khoản OPS chưa được gán hub nên chưa thể xác định phạm vi bưu cục.
          </p>
        ) : null}
        {!shipmentsQuery.isLoading && filteredRows.length === 0 ? (
          <p className="ops-branch-outbound-orders__empty">
            Không có vận đơn gửi phù hợp bộ lọc hiện tại.
          </p>
        ) : null}

        <div className="ops-branch-outbound-orders__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Ngày nhận hàng</th>
                <th>Người nhận</th>
                <th>SĐT người nhận</th>
                <th>Địa chỉ nhận</th>
                <th>Nhân viên giao hàng</th>
                <th>Trạng thái</th>
                <th>Dịch vụ</th>
                <th>COD</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.shipment.shipmentCode}>
                  <td className="ops-branch-outbound-orders__code">{row.shipment.shipmentCode}</td>
                  <td>{formatDateTime(row.acceptedDate)}</td>
                  <td>{row.receiverName}</td>
                  <td>{row.receiverPhone}</td>
                  <td>{row.receiverAddress}</td>
                  <td>{row.courierId}</td>
                  <td>{row.currentStatus}</td>
                  <td>{row.serviceType}</td>
                  <td>{row.codAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
