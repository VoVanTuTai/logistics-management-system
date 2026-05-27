import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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
import './ServiceQualityMonitor.css';

interface DeliveryQualityRow {
  shipment: ShipmentListItemDto;
  task: TaskListItemDto | null;
  ndr: NdrCaseListItemDto | null;
  hubCode: string;
  status: string;
  courierId: string;
  ageHours: number | null;
  lastAttemptAt: string;
  issue: string;
}

const DELIVERY_RELEVANT_STATUSES = new Set([
  'TASK_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
]);
const FAILED_DELIVERY_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED']);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
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

function durationHours(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) {
    return null;
  }
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  return Number.isNaN(start) || Number.isNaN(end) ? null : Math.max(0, Math.round((end - start) / 3600000));
}

function formatAge(hours: number | null): string {
  if (hours === null) {
    return 'Không rõ';
  }
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days} ngày ${hours % 24} giờ` : `${hours} giờ`;
}

function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
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
    const previous = result.get(shipmentCode);
    if (!previous || ndr.updatedAt > previous.updatedAt) {
      result.set(shipmentCode, ndr);
    }
  }
  return result;
}

function resolveDeliveryIssue(status: string, hours: number | null, ndr: NdrCaseListItemDto | null): string {
  if (ndr) {
    return (ageHours(ndr.updatedAt) ?? 0) >= 24 ? 'NDR quá hạn xử lý 24h' : 'Có NDR cần theo dõi';
  }
  if (status === 'DELIVERY_FAILED') {
    return 'Giao thất bại cần xử lý';
  }
  if (status === 'DELIVERED') {
    return (hours ?? 0) <= 48 ? 'Phát đúng SLA 48h' : 'Phát trễ SLA 48h';
  }
  return (hours ?? 0) >= 48 ? 'Đang phát quá SLA 48h' : 'Đang phát trong SLA';
}

export function ServiceQualityMonitorDeliveredPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken);
  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );
  const ndrByShipment = useMemo(() => buildNdrByShipment(ndrQuery.data ?? []), [ndrQuery.data]);

  const sourceRows = useMemo<DeliveryQualityRow[]>(() => {
    return (shipmentsQuery.data ?? [])
      .filter((shipment) => DELIVERY_RELEVANT_STATUSES.has(normalizeCode(shipment.currentStatus)))
      .map((shipment) => {
        const task = taskByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;
        const ndr = ndrByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;
        const status = normalizeCode(shipment.currentStatus);
        const basisHours =
          status === 'DELIVERED'
            ? durationHours(shipment.createdAt, shipment.updatedAt)
            : ageHours(task?.updatedAt ?? shipment.updatedAt);
        return {
          shipment,
          task,
          ndr,
          hubCode: resolveShipmentHub(shipment),
          status,
          courierId: task?.assignedCourierId ?? 'Chưa phân công',
          ageHours: basisHours,
          lastAttemptAt: ndr?.updatedAt ?? task?.updatedAt ?? shipment.updatedAt,
          issue: resolveDeliveryIssue(status, basisHours, ndr),
        };
      })
      .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
  }, [ndrByShipment, shipmentsQuery.data, taskByShipment]);

  const rows = useMemo(() => {
    return sourceRows.filter((row) => {
      const dateKey = toDateKey(row.lastAttemptAt);
      return (
        (hubFilter === 'ALL' || row.hubCode === hubFilter) &&
        (courierFilter === 'ALL' || row.courierId === courierFilter) &&
        (statusFilter === 'ALL' || row.status === statusFilter || row.task?.status === statusFilter || row.ndr?.status === statusFilter) &&
        (!dateFrom || !dateKey || dateKey >= dateFrom) &&
        (!dateTo || !dateKey || dateKey <= dateTo)
      );
    });
  }, [courierFilter, dateFrom, dateTo, hubFilter, sourceRows, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [courierFilter, dateFrom, dateTo, hubFilter, pageSize, statusFilter]);

  const hubOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((row) => row.hubCode))).filter(Boolean).sort(),
    [sourceRows],
  );
  const courierOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((row) => row.courierId))).filter(Boolean).sort(),
    [sourceRows],
  );
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(sourceRows.flatMap((row) => [row.status, row.task?.status ?? '', row.ndr?.status ?? '']).filter(Boolean)),
      ).sort(),
    [sourceRows],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const ontimeDelivered = rows.filter((row) => row.status === 'DELIVERED' && (row.ageHours ?? 0) <= 48).length;
  const lateDelivered = rows.filter(
    (row) =>
      (row.status === 'DELIVERED' && (row.ageHours ?? 0) > 48) ||
      (row.status !== 'DELIVERED' && (row.ageHours ?? 0) >= 48),
  ).length;
  const ndrCount = rows.filter((row) => row.ndr || row.status === 'NDR_CREATED').length;
  const failedDeliveryCount = rows.filter((row) => FAILED_DELIVERY_STATUSES.has(row.status)).length;
  const isLoading = shipmentsQuery.isLoading || deliveryTasksQuery.isLoading || ndrQuery.isLoading;
  const loadError = shipmentsQuery.error ?? deliveryTasksQuery.error ?? ndrQuery.error ?? null;

  return (
    <section className="ops-service-quality-monitor">
      <header className="ops-service-quality-monitor__header">
        <div>
          <small>SERVICE_QUALITY_MONITOR_DELIVERED</small>
          <h2>Theo dõi giao thất bại / NDR</h2>
          <p>
            Tập trung vào các đơn giao thất bại, NDR và nguy cơ trễ SLA từ shipments, delivery tasks
            và NDR cases hiện có.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void shipmentsQuery.refetch();
            void deliveryTasksQuery.refetch();
            void ndrQuery.refetch();
          }}
        >
          Làm mới
        </button>
      </header>

      <section className="ops-service-quality-monitor__kpis">
        <article data-tone="success">
          <span>Phát đúng hạn</span>
          <strong>{ontimeDelivered}</strong>
        </article>
        <article data-tone="danger">
          <span>Phát trễ</span>
          <strong>{lateDelivered}</strong>
        </article>
        <article data-tone="warning">
          <span>NDR</span>
          <strong>{ndrCount}</strong>
        </article>
        <article data-tone="danger">
          <span>Giao thất bại</span>
          <strong>{failedDeliveryCount}</strong>
        </article>
      </section>

      <section className="ops-service-quality-monitor__filters">
        <label>
          <span>Từ ngày</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>Hub</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Courier</span>
          <select value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {courierOptions.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loadError ? (
        <p className="ops-service-quality-monitor__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-service-quality-monitor__panel">
        <header className="ops-service-quality-monitor__panel-head">
          <h3>Vận đơn cần theo dõi chất lượng phát</h3>
          <span>{isLoading ? 'Đang tải...' : `${rows.length} dòng`}</span>
        </header>
        {isLoading ? <p className="ops-service-quality-monitor__empty">Đang tải dữ liệu giao thất bại/NDR...</p> : null}
        {!isLoading && rows.length === 0 ? (
          <p className="ops-service-quality-monitor__empty">Không có dữ liệu giao thất bại/NDR phù hợp bộ lọc.</p>
        ) : null}
        <div className="ops-service-quality-monitor__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vận đơn</th>
                <th>Task / NDR</th>
                <th>Trạng thái</th>
                <th>Courier</th>
                <th>Hub</th>
                <th>Lần giao gần nhất</th>
                <th>Tuổi/leadtime</th>
                <th>Vấn đề</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.shipment.id}>
                  <td>
                    <Link
                      className="ops-service-quality-monitor__code"
                      to={routePaths.shipmentDetail(row.shipment.id)}
                    >
                      {row.shipment.shipmentCode}
                    </Link>
                  </td>
                  <td>
                    <div className="ops-service-quality-monitor__link-stack">
                      {row.task ? <Link to={routePaths.taskDetail(row.task.id)}>{row.task.taskCode}</Link> : null}
                      {row.ndr ? (
                        <Link to={routePaths.ndrDetail(row.ndr.id)}>
                          NDR {formatNdrStatusLabel(row.ndr.status)}
                        </Link>
                      ) : null}
                      {!row.task && !row.ndr ? 'Chưa có task/NDR' : null}
                    </div>
                  </td>
                  <td>{formatShipmentStatusLabel(row.shipment.currentStatus)}</td>
                  <td>{row.courierId}</td>
                  <td>{row.hubCode}</td>
                  <td>{formatDateTime(row.lastAttemptAt)}</td>
                  <td>{formatAge(row.ageHours)}</td>
                  <td>{row.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="ops-service-quality-monitor__pagination">
          <span>
            Hiển thị {rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(rows.length, currentPage * pageSize)} / {rows.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50].map((size) => (
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
