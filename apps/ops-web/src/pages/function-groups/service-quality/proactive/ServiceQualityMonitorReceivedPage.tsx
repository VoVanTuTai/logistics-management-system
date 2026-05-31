import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatShipmentStatusLabel, formatTaskStatusLabel } from '../../../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import './ServiceQualityMonitor.css';

interface InboundQualityRow {
  shipment: ShipmentListItemDto;
  task: TaskListItemDto | null;
  hubCode: string;
  status: string;
  courierId: string;
  ageHours: number | null;
  issue: string;
}

const RECEIVED_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'SCAN_INBOUND',
]);
const WAITING_PICKUP_STATUSES = new Set(['CREATED', 'UPDATED', 'TASK_ASSIGNED']);
const INBOUND_EXCEPTION_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'CANCELLED']);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
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
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.destinationHubCode) ||
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

function resolveInboundIssue(status: string, hours: number | null): string {
  if (INBOUND_EXCEPTION_STATUSES.has(status)) {
    return 'Ngoại lệ trong luồng nhận hàng';
  }
  if (WAITING_PICKUP_STATUSES.has(status)) {
    return (hours ?? 0) >= 12 ? 'Chờ pickup quá SLA 12h' : 'Đang chờ pickup';
  }
  if (RECEIVED_STATUSES.has(status)) {
    return (hours ?? 0) <= 24 ? 'Đã nhận trong SLA 24h' : 'Đã nhận nhưng cập nhật quá 24h';
  }
  return 'Theo dõi inbound';
}

export function ServiceQualityMonitorReceivedPage(): React.JSX.Element {
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
  const pickupTasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' }, { refetchInterval: 15000 });
  const taskByShipment = useMemo(
    () => buildTaskByShipment(pickupTasksQuery.data ?? []),
    [pickupTasksQuery.data],
  );

  const sourceRows = useMemo<InboundQualityRow[]>(() => {
    return (shipmentsQuery.data ?? [])
      .filter((shipment) => {
        const status = normalizeCode(shipment.currentStatus);
        return (
          WAITING_PICKUP_STATUSES.has(status) ||
          RECEIVED_STATUSES.has(status) ||
          INBOUND_EXCEPTION_STATUSES.has(status)
        );
      })
      .map((shipment) => {
        const task = taskByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;
        const status = normalizeCode(shipment.currentStatus);
        const hours = ageHours(task?.updatedAt ?? shipment.updatedAt);
        return {
          shipment,
          task,
          hubCode: resolveShipmentHub(shipment),
          status,
          courierId: task?.assignedCourierId ?? 'Chưa phân công',
          ageHours: hours,
          issue: resolveInboundIssue(status, hours),
        };
      })
      .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
  }, [shipmentsQuery.data, taskByShipment]);

  const rows = useMemo(() => {
    return sourceRows.filter((row) => {
      const dateKey = toDateKey(row.task?.updatedAt ?? row.shipment.updatedAt);
      return (
        (hubFilter === 'ALL' || row.hubCode === hubFilter) &&
        (courierFilter === 'ALL' || row.courierId === courierFilter) &&
        (statusFilter === 'ALL' || row.status === statusFilter || row.task?.status === statusFilter) &&
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
        new Set(sourceRows.flatMap((row) => [row.status, row.task?.status ?? '']).filter(Boolean)),
      ).sort(),
    [sourceRows],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const ontimeReceived = rows.filter(
    (row) => RECEIVED_STATUSES.has(row.status) && (row.ageHours ?? 0) <= 24,
  ).length;
  const lateReceived = rows.filter(
    (row) =>
      (RECEIVED_STATUSES.has(row.status) && (row.ageHours ?? 0) > 24) ||
      (WAITING_PICKUP_STATUSES.has(row.status) && (row.ageHours ?? 0) >= 12),
  ).length;
  const waitingPickup = rows.filter((row) => WAITING_PICKUP_STATUSES.has(row.status)).length;
  const inboundExceptions = rows.filter((row) => INBOUND_EXCEPTION_STATUSES.has(row.status)).length;
  const isLoading = shipmentsQuery.isLoading || pickupTasksQuery.isLoading;
  const loadError = shipmentsQuery.error ?? pickupTasksQuery.error ?? null;

  return (
    <section className="ops-service-quality-monitor">
      <header className="ops-service-quality-monitor__header">
        <div>
          <small>SERVICE_QUALITY_MONITOR_RECEIVED</small>
          <h2>Giám sát hàng nhận</h2>
          <p>
            Theo dõi pickup/inbound SLA, hàng chờ nhận và ngoại lệ nhận hàng từ
            shipment-service và dispatch task hiện có.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void shipmentsQuery.refetch();
            void pickupTasksQuery.refetch();
          }}
        >
          Làm mới
        </button>
      </header>

      <section className="ops-service-quality-monitor__kpis">
        <article data-tone="success">
          <span>Nhận đúng hạn</span>
          <strong>{ontimeReceived}</strong>
        </article>
        <article data-tone="danger">
          <span>Nhận trễ</span>
          <strong>{lateReceived}</strong>
        </article>
        <article>
          <span>Chờ pickup</span>
          <strong>{waitingPickup}</strong>
        </article>
        <article data-tone="warning">
          <span>Inbound ngoại lệ</span>
          <strong>{inboundExceptions}</strong>
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
                {formatShipmentStatusLabel(status) === status ? formatTaskStatusLabel(status) : formatShipmentStatusLabel(status)}
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
          <h3>Vận đơn/pickup gây chỉ số nhận hàng</h3>
          <span>{isLoading ? 'Đang tải...' : `${rows.length} dòng`}</span>
        </header>
        {isLoading ? <p className="ops-service-quality-monitor__empty">Đang tải dữ liệu hàng nhận...</p> : null}
        {!isLoading && rows.length === 0 ? (
          <p className="ops-service-quality-monitor__empty">Không có dữ liệu hàng nhận phù hợp bộ lọc.</p>
        ) : null}
        <div className="ops-service-quality-monitor__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vận đơn</th>
                <th>Pickup task</th>
                <th>Trạng thái</th>
                <th>Hub</th>
                <th>Courier</th>
                <th>Tuổi xử lý</th>
                <th>Cập nhật</th>
                <th>Vấn đề</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.shipment.id}>
                  <td>
                    <CopyableShipmentCode
                      code={row.shipment.shipmentCode}
                      className="ops-service-quality-monitor__code"
                    />
                  </td>
                  <td>
                    {row.task ? (
                      <Link to={routePaths.taskDetail(row.task.id)}>{row.task.taskCode}</Link>
                    ) : (
                      'Chưa có task'
                    )}
                  </td>
                  <td>{formatShipmentStatusLabel(row.shipment.currentStatus)}</td>
                  <td>{row.hubCode}</td>
                  <td>{row.courierId}</td>
                  <td>{formatAge(row.ageHours)}</td>
                  <td>{formatDateTime(row.task?.updatedAt ?? row.shipment.updatedAt)}</td>
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
