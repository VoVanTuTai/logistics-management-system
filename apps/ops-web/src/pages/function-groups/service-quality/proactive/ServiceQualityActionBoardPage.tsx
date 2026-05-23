import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';
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
import {
  formatManifestStatusLabel,
  formatNdrStatusLabel,
  formatShipmentStatusLabel,
  formatTaskStatusLabel,
} from '../../../../utils/logisticsLabels';
import './ServiceQualityMonitor.css';

type AlertType = 'SLA_RISK' | 'HUB_DWELL' | 'NDR_OVERDUE' | 'MANIFEST_PENDING' | 'TASK_STALE';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface ServiceQualityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  subjectCode: string;
  subjectLabel: string;
  hubCode: string;
  owner: string;
  ageHours: number | null;
  dueInHours: number | null;
  status: string;
  issue: string;
  action: string;
  updatedAt: string | null;
  detailUrl: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DELIVERY_SLA_HOURS = 48;
const SLA_WARNING_HOURS = 12;
const HUB_DWELL_WARNING_HOURS = 24;
const HUB_DWELL_CRITICAL_HOURS = 36;
const NDR_OVERDUE_HOURS = 24;
const MANIFEST_RECEIVE_WARNING_HOURS = 18;
const MANIFEST_RECEIVE_CRITICAL_HOURS = 30;
const TASK_STALE_WARNING_HOURS = 2;
const TASK_STALE_CRITICAL_HOURS = 6;

const TERMINAL_SHIPMENT_STATUSES = new Set([
  'CANCELLED',
  'DELIVERED',
  'RETURN_COMPLETED',
  'RETURNED',
]);
const HUB_DWELL_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'SCAN_INBOUND',
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
]);
const OPEN_NDR_STATUSES = new Set(['OPEN', 'RESCHEDULED']);
const ACTIVE_TASK_STATUSES = new Set(['ASSIGNED', 'CREATED', 'PENDING']);
const SEALED_MANIFEST_STATUSES = new Set(['SEALED', 'IN_TRANSIT']);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp)
    ? null
    : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function dueInHours(createdAt: string | null | undefined, slaHours: number): number | null {
  if (!createdAt) {
    return null;
  }
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return Math.ceil((timestamp + slaHours * 3600000 - Date.now()) / 3600000);
}

function formatAge(hours: number | null): string {
  if (hours === null) {
    return 'Không rõ';
  }
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days} ngày ${hours % 24} giờ` : `${hours} giờ`;
}

function formatDue(hours: number | null): string {
  if (hours === null) {
    return 'Không rõ';
  }
  if (hours < 0) {
    return `Trễ ${Math.abs(hours)} giờ`;
  }
  return `Còn ${hours} giờ`;
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

function buildSlaAlerts(
  shipments: ShipmentListItemDto[],
  taskByShipment: Map<string, TaskListItemDto>,
): ServiceQualityAlert[] {
  return shipments
    .map((shipment): ServiceQualityAlert | null => {
      const status = normalizeCode(shipment.currentStatus);
      if (TERMINAL_SHIPMENT_STATUSES.has(status)) {
        return null;
      }

      const remaining = dueInHours(shipment.createdAt, DELIVERY_SLA_HOURS);
      if (remaining === null || remaining > SLA_WARNING_HOURS) {
        return null;
      }

      const task = taskByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;
      return {
        id: `sla-${shipment.id}`,
        type: 'SLA_RISK',
        severity: remaining <= 0 ? 'critical' : 'warning',
        subjectCode: shipment.shipmentCode,
        subjectLabel: 'Vận đơn',
        hubCode: resolveShipmentHub(shipment),
        owner: task?.assignedCourierId ?? 'Chưa phân công',
        ageHours: ageHours(shipment.createdAt),
        dueInHours: remaining,
        status,
        issue: remaining <= 0 ? 'Đơn đã trễ SLA phát' : 'Đơn sắp trễ SLA phát',
        action: task ? 'Đẩy courier xử lý ngay' : 'Phân công task phát',
        updatedAt: shipment.updatedAt,
        detailUrl: routePaths.shipmentDetail(shipment.id),
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function buildHubDwellAlerts(shipments: ShipmentListItemDto[]): ServiceQualityAlert[] {
  return shipments
    .map((shipment): ServiceQualityAlert | null => {
      const status = normalizeCode(shipment.currentStatus);
      const hours = ageHours(shipment.updatedAt);
      if (!HUB_DWELL_STATUSES.has(status) || hours === null || hours < HUB_DWELL_WARNING_HOURS) {
        return null;
      }

      return {
        id: `hub-${shipment.id}`,
        type: 'HUB_DWELL',
        severity: hours >= HUB_DWELL_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: shipment.shipmentCode,
        subjectLabel: 'Tồn hub',
        hubCode: resolveShipmentHub(shipment),
        owner: 'Ops hub',
        ageHours: hours,
        dueInHours: null,
        status,
        issue: 'Hàng tồn hub quá lâu',
        action: 'Kiểm tra scan/đẩy outbound',
        updatedAt: shipment.updatedAt,
        detailUrl: routePaths.shipmentDetail(shipment.id),
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function buildNdrAlerts(ndrCases: NdrCaseListItemDto[]): ServiceQualityAlert[] {
  return ndrCases
    .map((ndr): ServiceQualityAlert | null => {
      const status = normalizeCode(ndr.status);
      const hours = ageHours(ndr.updatedAt);
      if (!OPEN_NDR_STATUSES.has(status) || hours === null || hours < NDR_OVERDUE_HOURS) {
        return null;
      }

      return {
        id: `ndr-${ndr.id}`,
        type: 'NDR_OVERDUE',
        severity: 'critical',
        subjectCode: ndr.shipmentCode,
        subjectLabel: 'NDR',
        hubCode: 'NDR',
        owner: 'Ops NDR',
        ageHours: hours,
        dueInHours: -Math.max(0, hours - NDR_OVERDUE_HOURS),
        status,
        issue: 'NDR quá hạn xử lý',
        action: 'Chốt lịch giao lại hoặc quyết định hoàn',
        updatedAt: ndr.updatedAt,
        detailUrl: routePaths.ndrDetail(ndr.id),
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function buildManifestAlerts(manifests: ManifestListItemDto[]): ServiceQualityAlert[] {
  return manifests
    .map((manifest): ServiceQualityAlert | null => {
      const status = normalizeCode(manifest.status);
      const basis = manifest.sealedAt ?? manifest.updatedAt ?? manifest.createdAt ?? null;
      const hours = ageHours(basis);
      if (!SEALED_MANIFEST_STATUSES.has(status) || hours === null || hours < MANIFEST_RECEIVE_WARNING_HOURS) {
        return null;
      }

      return {
        id: `manifest-${manifest.id}`,
        type: 'MANIFEST_PENDING',
        severity: hours >= MANIFEST_RECEIVE_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: manifest.manifestCode,
        subjectLabel: 'Manifest',
        hubCode: normalizeCode(manifest.destinationHubCode) || normalizeCode(manifest.originHubCode) || 'CHUA_XAC_DINH',
        owner: 'Linehaul/Ops hub',
        ageHours: hours,
        dueInHours: MANIFEST_RECEIVE_CRITICAL_HOURS - hours,
        status,
        issue: 'Manifest đã seal nhưng chưa receive',
        action: 'Kiểm tra xe/nhận manifest tại hub đích',
        updatedAt: basis,
        detailUrl: routePaths.manifestDetail(manifest.id),
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function buildTaskAlerts(tasks: TaskListItemDto[]): ServiceQualityAlert[] {
  return tasks
    .map((task): ServiceQualityAlert | null => {
      const status = normalizeCode(task.status);
      const hours = ageHours(task.updatedAt);
      if (!task.assignedCourierId || !ACTIVE_TASK_STATUSES.has(status) || hours === null || hours < TASK_STALE_WARNING_HOURS) {
        return null;
      }

      return {
        id: `task-${task.id}`,
        type: 'TASK_STALE',
        severity: hours >= TASK_STALE_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: task.taskCode,
        subjectLabel: task.taskType,
        hubCode: task.deliveryArea ?? 'TASK',
        owner: task.assignedCourierId,
        ageHours: hours,
        dueInHours: TASK_STALE_CRITICAL_HOURS - hours,
        status,
        issue: 'Task đã assigned nhưng courier chưa xử lý',
        action: 'Nhắc courier hoặc reassign',
        updatedAt: task.updatedAt,
        detailUrl: routePaths.taskDetail(task.id),
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function formatStatus(alert: ServiceQualityAlert): string {
  if (alert.type === 'NDR_OVERDUE') {
    return formatNdrStatusLabel(alert.status);
  }
  if (alert.type === 'MANIFEST_PENDING') {
    return formatManifestStatusLabel(alert.status);
  }
  if (alert.type === 'TASK_STALE') {
    return formatTaskStatusLabel(alert.status);
  }
  return formatShipmentStatusLabel(alert.status);
}

function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case 'SLA_RISK':
      return 'SLA sắp trễ';
    case 'HUB_DWELL':
      return 'Tồn hub lâu';
    case 'NDR_OVERDUE':
      return 'NDR quá hạn';
    case 'MANIFEST_PENDING':
      return 'Manifest chưa receive';
    case 'TASK_STALE':
      return 'Task chưa xử lý';
  }
}

function severityLabel(severity: AlertSeverity): string {
  if (severity === 'critical') {
    return 'Khẩn cấp';
  }
  if (severity === 'warning') {
    return 'Cảnh báo';
  }
  return 'Theo dõi';
}

function severityRank(severity: AlertSeverity): number {
  if (severity === 'critical') {
    return 3;
  }
  if (severity === 'warning') {
    return 2;
  }
  return 1;
}

export function ServiceQualityActionBoardPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [typeFilter, setTypeFilter] = useState<AlertType | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const manifestsQuery = useManifestsQuery(accessToken, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken, { refetchInterval: 15000 });
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const pickupTasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' }, { refetchInterval: 15000 });
  const returnTasksQuery = useTasksQuery(accessToken, { taskType: 'RETURN' }, { refetchInterval: 15000 });

  const allTasks = useMemo(
    () => [
      ...(deliveryTasksQuery.data ?? []),
      ...(pickupTasksQuery.data ?? []),
      ...(returnTasksQuery.data ?? []),
    ],
    [deliveryTasksQuery.data, pickupTasksQuery.data, returnTasksQuery.data],
  );
  const taskByShipment = useMemo(() => buildTaskByShipment(allTasks), [allTasks]);

  const alerts = useMemo(() => {
    return [
      ...buildSlaAlerts(shipmentsQuery.data ?? [], taskByShipment),
      ...buildHubDwellAlerts(shipmentsQuery.data ?? []),
      ...buildNdrAlerts(ndrQuery.data ?? []),
      ...buildManifestAlerts(manifestsQuery.data ?? []),
      ...buildTaskAlerts(allTasks),
    ].sort((left, right) => {
      const severityDelta = severityRank(right.severity) - severityRank(left.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return (right.ageHours ?? 0) - (left.ageHours ?? 0);
    });
  }, [allTasks, manifestsQuery.data, ndrQuery.data, shipmentsQuery.data, taskByShipment]);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          (typeFilter === 'ALL' || alert.type === typeFilter) &&
          (severityFilter === 'ALL' || alert.severity === severityFilter) &&
          (hubFilter === 'ALL' || alert.hubCode === hubFilter),
      ),
    [alerts, hubFilter, severityFilter, typeFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [hubFilter, pageSize, severityFilter, typeFilter]);

  const hubOptions = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.hubCode))).filter(Boolean).sort(),
    [alerts],
  );
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const warningCount = alerts.filter((alert) => alert.severity === 'warning').length;
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const isLoading =
    shipmentsQuery.isLoading ||
    manifestsQuery.isLoading ||
    ndrQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    pickupTasksQuery.isLoading ||
    returnTasksQuery.isLoading;
  const loadError =
    shipmentsQuery.error ??
    manifestsQuery.error ??
    ndrQuery.error ??
    deliveryTasksQuery.error ??
    pickupTasksQuery.error ??
    returnTasksQuery.error ??
    null;

  const refetchAll = () => {
    void shipmentsQuery.refetch();
    void manifestsQuery.refetch();
    void ndrQuery.refetch();
    void deliveryTasksQuery.refetch();
    void pickupTasksQuery.refetch();
    void returnTasksQuery.refetch();
  };

  return (
    <section className="ops-service-quality-monitor">
      <header className="ops-service-quality-monitor__header">
        <div>
          <small>SERVICE_QUALITY_ACTION_BOARD</small>
          <h2>Bảng cảnh báo cần xử lý</h2>
          <p>
            Gom các việc có nguy cơ làm trễ SLA để ops xử lý trước: tồn hub, NDR,
            manifest chưa receive và task courier chưa chạy.
          </p>
        </div>
        <button type="button" onClick={refetchAll}>
          Làm mới
        </button>
      </header>

      <section className="ops-service-quality-monitor__kpis">
        <article data-tone="danger">
          <span>Khẩn cấp</span>
          <strong>{criticalCount}</strong>
        </article>
        <article data-tone="warning">
          <span>Cảnh báo</span>
          <strong>{warningCount}</strong>
        </article>
        <article>
          <span>Tổng việc cần làm</span>
          <strong>{alerts.length}</strong>
        </article>
        <article data-tone="success">
          <span>Đang hiển thị</span>
          <strong>{filteredAlerts.length}</strong>
        </article>
      </section>

      <section className="ops-service-quality-monitor__filters ops-service-quality-monitor__filters--action-board">
        <label>
          <span>Loại cảnh báo</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as AlertType | 'ALL')}>
            <option value="ALL">Tất cả</option>
            <option value="SLA_RISK">SLA sắp trễ</option>
            <option value="HUB_DWELL">Tồn hub lâu</option>
            <option value="NDR_OVERDUE">NDR quá hạn</option>
            <option value="MANIFEST_PENDING">Manifest chưa receive</option>
            <option value="TASK_STALE">Task chưa xử lý</option>
          </select>
        </label>
        <label>
          <span>Mức độ</span>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as AlertSeverity | 'ALL')}>
            <option value="ALL">Tất cả</option>
            <option value="critical">Khẩn cấp</option>
            <option value="warning">Cảnh báo</option>
            <option value="info">Theo dõi</option>
          </select>
        </label>
        <label>
          <span>Hub/nguồn</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
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
          <h3>Hàng đợi xử lý chủ động</h3>
          <span>{isLoading ? 'Đang tải...' : `${filteredAlerts.length} việc`}</span>
        </header>
        {isLoading ? <p className="ops-service-quality-monitor__empty">Đang tải dữ liệu cảnh báo...</p> : null}
        {!isLoading && filteredAlerts.length === 0 ? (
          <p className="ops-service-quality-monitor__empty">Không có cảnh báo phù hợp bộ lọc.</p>
        ) : null}
        <div className="ops-service-quality-monitor__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mức độ</th>
                <th>Loại</th>
                <th>Đối tượng</th>
                <th>Hub/nguồn</th>
                <th>Owner</th>
                <th>Tuổi</th>
                <th>SLA</th>
                <th>Trạng thái</th>
                <th>Việc cần làm</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span className={`ops-service-quality-monitor__severity ops-service-quality-monitor__severity--${alert.severity}`}>
                      {severityLabel(alert.severity)}
                    </span>
                  </td>
                  <td>{alertTypeLabel(alert.type)}</td>
                  <td>
                    <div className="ops-service-quality-monitor__link-stack">
                      <Link to={alert.detailUrl}>{alert.subjectCode}</Link>
                      <span>{alert.subjectLabel}</span>
                    </div>
                  </td>
                  <td>{alert.hubCode}</td>
                  <td>{alert.owner}</td>
                  <td>{formatAge(alert.ageHours)}</td>
                  <td>{formatDue(alert.dueInHours)}</td>
                  <td>{formatStatus(alert)}</td>
                  <td>
                    <strong>{alert.issue}</strong>
                    <span>{alert.action}</span>
                    <time>{formatDateTime(alert.updatedAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="ops-service-quality-monitor__pagination">
          <span>
            Hiển thị {filteredAlerts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredAlerts.length, currentPage * pageSize)} / {filteredAlerts.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
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
