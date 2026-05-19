import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../../../utils/locationScope';
import './BranchFinanceCodSettlementPage.css';

interface CodSettlementFilters {
  reportDate: string;
  hubCode: string;
  courierId: string;
}

interface CodSettlementRow {
  shipment: ShipmentListItemDto;
  deliveredAt: string;
  hubCode: string;
  courierId: string;
  receiverName: string;
  receiverPhone: string;
  codAmount: number;
}

interface CourierCodSummary {
  courierId: string;
  hubCode: string;
  deliveredOrders: number;
  codOrders: number;
  nonCodOrders: number;
  codTotal: number;
  submittedTotal: number | null;
  latestDeliveredAt: string | null;
}

const UNKNOWN_COURIER = 'Chưa xác định';

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, value))} đ`;
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

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    if (!task.shipmentCode || task.taskType !== 'DELIVERY') {
      continue;
    }

    const previous = result.get(task.shipmentCode);
    if (!previous || previous.updatedAt < task.updatedAt) {
      result.set(task.shipmentCode, task);
    }
  }

  return result;
}

function shipmentHubCandidates(shipment: ShipmentListItemDto): string[] {
  return [
    shipment.currentLocation,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
    shipment.originHubCode,
    shipment.senderHubCode,
  ]
    .map((value) => (value ?? '').trim().toUpperCase())
    .filter(Boolean);
}

function shipmentMatchesHubCodes(shipment: ShipmentListItemDto, hubCodes: string[]): boolean {
  if (hubCodes.length === 0) {
    return false;
  }

  const candidates = shipmentHubCandidates(shipment);
  return candidates.some((candidate) => hubCodes.includes(candidate));
}

function resolveShipmentHubCode(shipment: ShipmentListItemDto, hubCodes: string[]): string {
  const candidates = shipmentHubCandidates(shipment);
  return candidates.find((candidate) => hubCodes.includes(candidate)) ?? candidates[0] ?? '-';
}

function isShipmentInBranchScope(
  shipment: ShipmentListItemDto,
  hubCodes: string[],
  scopeTokens: Set<string>,
): boolean {
  if (shipmentMatchesHubCodes(shipment, hubCodes)) {
    return true;
  }

  return isShipmentInScope(shipment, scopeTokens);
}

function buildSummaryKey(courierId: string, hubCode: string): string {
  return `${courierId}::${hubCode}`;
}

export function BranchFinanceCodSettlementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const defaultHubCode = assignedHubCodes[0] ?? (canViewAllHubAreas ? 'all' : '');

  const initialFilters = useMemo<CodSettlementFilters>(
    () => ({
      reportDate: today,
      hubCode: defaultHubCode,
      courierId: 'all',
    }),
    [defaultHubCode, today],
  );
  const [draftFilters, setDraftFilters] = useState<CodSettlementFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CodSettlementFilters>(initialFilters);

  const shipmentsQuery = useShipmentsQuery(accessToken, { status: 'DELIVERED' });
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' });
  const hubsQuery = useHubsQuery(accessToken, {});

  const allHubs = hubsQuery.data ?? [];
  const selectedHubCodes = useMemo(() => {
    if (appliedFilters.hubCode && appliedFilters.hubCode !== 'all') {
      return [appliedFilters.hubCode.trim().toUpperCase()];
    }

    return assignedHubCodes;
  }, [appliedFilters.hubCode, assignedHubCodes]);

  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(allHubs, selectedHubCodes),
    [allHubs, selectedHubCodes],
  );

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const branchRows = useMemo<CodSettlementRow[]>(() => {
    const shipments = shipmentsQuery.data ?? [];
    const visibleShipments =
      canViewAllHubAreas && appliedFilters.hubCode === 'all'
        ? shipments
        : shipments.filter((shipment) =>
            isShipmentInBranchScope(shipment, selectedHubCodes, hubScopeTokens),
          );

    return visibleShipments
      .filter((shipment) => shipment.currentStatus === 'DELIVERED')
      .map((shipment) => {
        const task = taskByShipment.get(shipment.shipmentCode);

        return {
          shipment,
          deliveredAt: shipment.updatedAt,
          hubCode: resolveShipmentHubCode(shipment, selectedHubCodes),
          courierId: task?.assignedCourierId ?? UNKNOWN_COURIER,
          receiverName: shipment.receiverName ?? 'Người nhận',
          receiverPhone: shipment.receiverPhone ?? '-',
          codAmount: Math.max(0, shipment.codAmount ?? 0),
        };
      });
  }, [
    appliedFilters.hubCode,
    canViewAllHubAreas,
    hubScopeTokens,
    selectedHubCodes,
    shipmentsQuery.data,
    taskByShipment,
  ]);

  const courierOptions = useMemo(
    () =>
      Array.from(
        new Set(
          branchRows
            .map((row) => row.courierId)
            .filter((courierId) => courierId !== UNKNOWN_COURIER),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [branchRows],
  );

  const filteredRows = useMemo(() => {
    return branchRows.filter((row) => {
      const sameDate = toDateKey(row.deliveredAt) === appliedFilters.reportDate;
      const sameCourier =
        appliedFilters.courierId === 'all' || row.courierId === appliedFilters.courierId;

      return sameDate && sameCourier;
    });
  }, [appliedFilters, branchRows]);

  const courierSummaries = useMemo<CourierCodSummary[]>(() => {
    const summaryByCourier = new Map<string, CourierCodSummary>();

    for (const row of filteredRows) {
      const key = buildSummaryKey(row.courierId, row.hubCode);
      const summary =
        summaryByCourier.get(key) ??
        {
          courierId: row.courierId,
          hubCode: row.hubCode,
          deliveredOrders: 0,
          codOrders: 0,
          nonCodOrders: 0,
          codTotal: 0,
          submittedTotal: null,
          latestDeliveredAt: null,
        };

      summary.deliveredOrders += 1;
      if (row.codAmount > 0) {
        summary.codOrders += 1;
      } else {
        summary.nonCodOrders += 1;
      }
      summary.codTotal += row.codAmount;
      if (!summary.latestDeliveredAt || row.deliveredAt > summary.latestDeliveredAt) {
        summary.latestDeliveredAt = row.deliveredAt;
      }
      summaryByCourier.set(key, summary);
    }

    return Array.from(summaryByCourier.values()).sort((a, b) => b.codTotal - a.codTotal);
  }, [filteredRows]);

  const hubOptions = useMemo(() => {
    if (canViewAllHubAreas) {
      return allHubs
        .filter((hub) => hub.isActive)
        .map((hub) => ({ code: hub.code.trim().toUpperCase(), label: `${hub.code} - ${hub.name}` }));
    }

    const hubByCode = new Map(
      allHubs.map((hub) => [hub.code.trim().toUpperCase(), `${hub.code} - ${hub.name}`] as const),
    );

    return assignedHubCodes.map((code) => ({
      code,
      label: hubByCode.get(code) ?? code,
    }));
  }, [allHubs, assignedHubCodes, canViewAllHubAreas]);

  const totalCod = filteredRows.reduce((sum, row) => sum + row.codAmount, 0);
  const submittedCod = courierSummaries.reduce(
    (sum, summary) => sum + (summary.submittedTotal ?? 0),
    0,
  );
  const pendingCod = totalCod - submittedCod;
  const codOrderCount = filteredRows.filter((row) => row.codAmount > 0).length;
  const activeCourierCount = courierSummaries.filter((summary) => summary.deliveredOrders > 0).length;
  const averageCodPerCourier = activeCourierCount > 0 ? Math.round(totalCod / activeCourierCount) : 0;
  const isLoading = shipmentsQuery.isLoading || deliveryTasksQuery.isLoading || hubsQuery.isLoading;
  const isSearching = shipmentsQuery.isFetching || deliveryTasksQuery.isFetching || hubsQuery.isFetching;
  const hasScopeWarning = assignedHubCodes.length === 0 && !canViewAllHubAreas;

  const updateDraftFilter = (key: keyof CodSettlementFilters, value: string) => {
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
      deliveryTasksQuery.refetch(),
      hubsQuery.refetch(),
    ]);
  };

  return (
    <section className="ops-branch-cod">
      <header className="ops-branch-cod__header">
        <div>
          <small>BRANCH_FINANCE_COD_SETTLEMENT</small>
          <h2>Quyết toán thu hộ</h2>
          <p>Thống kê tiền hàng hằng ngày theo courier trong phạm vi bưu cục.</p>
        </div>
        <div className="ops-branch-cod__summary" aria-label="Tổng quan thu hộ">
          <article>
            <span>Tiền hàng</span>
            <strong>{formatCurrency(totalCod)}</strong>
          </article>
          <article>
            <span>Đơn COD</span>
            <strong>{codOrderCount}</strong>
          </article>
          <article>
            <span>Chưa nộp/đối soát</span>
            <strong>{formatCurrency(pendingCod)}</strong>
          </article>
          <article>
            <span>TB / courier</span>
            <strong>{formatCurrency(averageCodPerCourier)}</strong>
          </article>
        </div>
      </header>

      <form className="ops-branch-cod__filters" onSubmit={submitSearch}>
        <label>
          <span>Ngày quyết toán</span>
          <input
            type="date"
            value={draftFilters.reportDate}
            onChange={(event) => updateDraftFilter('reportDate', event.target.value)}
          />
        </label>
        <label>
          <span>Bưu cục</span>
          <select
            value={draftFilters.hubCode}
            onChange={(event) => updateDraftFilter('hubCode', event.target.value)}
            disabled={!canViewAllHubAreas && hubOptions.length <= 1}
          >
            {canViewAllHubAreas ? <option value="all">Tất cả bưu cục</option> : null}
            {hubOptions.map((hub) => (
              <option key={hub.code} value={hub.code}>
                {hub.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Courier</span>
          <select
            value={draftFilters.courierId}
            onChange={(event) => updateDraftFilter('courierId', event.target.value)}
          >
            <option value="all">Tất cả courier</option>
            {courierOptions.map((courierId) => (
              <option key={courierId} value={courierId}>
                {courierId}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Đang tải...' : 'Tìm kiếm'}
        </button>
      </form>

      <p className="ops-branch-cod__contract">
        Chưa có backend contract ghi nhận nộp tiền COD theo courier. Màn này chỉ
        hiển thị số phải thu từ các vận đơn DELIVERED và đánh dấu trạng thái nộp
        tiền là chưa có dữ liệu xác nhận.
      </p>

      <section className="ops-branch-cod__table-card">
        <div className="ops-branch-cod__table-title">
          <h3>Tổng hợp theo courier</h3>
          <span>{courierSummaries.length} courier</span>
        </div>

        {isLoading ? <p className="ops-branch-cod__empty">Đang tải dữ liệu thu hộ...</p> : null}
        {shipmentsQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(shipmentsQuery.error)}</p>
        ) : null}
        {deliveryTasksQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(deliveryTasksQuery.error)}</p>
        ) : null}
        {hubsQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(hubsQuery.error)}</p>
        ) : null}
        {hasScopeWarning ? (
          <p className="ops-branch-cod__empty">
            Tài khoản OPS chưa được gán hub nên chưa thể xác định phạm vi bưu cục.
          </p>
        ) : null}
        {!isLoading && courierSummaries.length === 0 ? (
          <p className="ops-branch-cod__empty">
            Không có phát sinh tiền hàng phù hợp bộ lọc hiện tại.
          </p>
        ) : null}

        <div className="ops-branch-cod__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Courier</th>
                <th>Bưu cục</th>
                <th>Đơn giao</th>
                <th>Đơn COD</th>
                <th>Đơn không COD</th>
                <th>Tiền hàng</th>
                <th>Đã nộp</th>
                <th>Trạng thái nộp</th>
                <th>Lần giao cuối</th>
              </tr>
            </thead>
            <tbody>
              {courierSummaries.map((summary) => (
                <tr key={buildSummaryKey(summary.courierId, summary.hubCode)}>
                  <td className="ops-branch-cod__courier">{summary.courierId}</td>
                  <td>{summary.hubCode}</td>
                  <td>{summary.deliveredOrders}</td>
                  <td>{summary.codOrders}</td>
                  <td>{summary.nonCodOrders}</td>
                  <td className="ops-branch-cod__money">{formatCurrency(summary.codTotal)}</td>
                  <td>
                    {summary.submittedTotal === null
                      ? 'Chưa có dữ liệu'
                      : formatCurrency(summary.submittedTotal)}
                  </td>
                  <td>
                    <span className="ops-branch-cod__status">Chưa có contract nộp tiền</span>
                  </td>
                  <td>{summary.latestDeliveredAt ? formatDateTime(summary.latestDeliveredAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-branch-cod__table-card">
        <div className="ops-branch-cod__table-title">
          <h3>Chi tiết vận đơn trong ngày</h3>
          <span>{filteredRows.length} vận đơn</span>
        </div>
        <div className="ops-branch-cod__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Thời gian giao</th>
                <th>Courier</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Bưu cục</th>
                <th>Tiền hàng</th>
                <th>Trạng thái nộp tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.shipment.shipmentCode}>
                  <td>
                    <Link
                      className="ops-branch-cod__code"
                      to={routePaths.shipmentDetail(row.shipment.id)}
                    >
                      {row.shipment.shipmentCode}
                    </Link>
                  </td>
                  <td>{formatDateTime(row.deliveredAt)}</td>
                  <td>{row.courierId}</td>
                  <td>{row.receiverName}</td>
                  <td>{row.receiverPhone}</td>
                  <td>{row.hubCode}</td>
                  <td className="ops-branch-cod__money">{formatCurrency(row.codAmount)}</td>
                  <td>
                    <span className="ops-branch-cod__status">Chưa có dữ liệu nộp tiền</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
