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
  lookupCode: string | null;
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
        lookupCode: shipment.shipmentCode,
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
        lookupCode: shipment.shipmentCode,
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
        lookupCode: ndr.shipmentCode,
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
        lookupCode: null,
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
        lookupCode: task.shipmentCode,
      };
    })
    .filter((alert): alert is ServiceQualityAlert => Boolean(alert));
}

function actionChecklist(alert: ServiceQualityAlert): string[] {
  switch (alert.type) {
    case 'SLA_RISK':
      return [
        'Kiểm tra vị trí hiện tại và timeline vận đơn.',
        alert.owner === 'Chưa phân công' ? 'Mở vận đơn/task để phân công giao.' : 'Liên hệ owner để cập nhật tiến độ xử lý.',
        'Nếu đã trễ SLA, ưu tiên xử lý trước các cảnh báo thường.',
      ];
    case 'HUB_DWELL':
      return [
        'Đối chiếu scan inbound/outbound gần nhất.',
        'Kiểm tra hàng còn nằm tại hub hay đã lên manifest.',
        'Nếu thiếu scan, yêu cầu hub cập nhật thao tác ngay.',
      ];
    case 'NDR_OVERDUE':
      return [
        'Mở NDR để xác nhận lý do giao thất bại.',
        'Chốt phương án giao lại, đổi lịch hoặc hoàn hàng.',
        'Theo dõi đến khi NDR được đóng hoặc chuyển trạng thái.',
      ];
    case 'MANIFEST_PENDING':
      return [
        'Kiểm tra manifest đã seal và thời điểm xe xuất bến.',
        'Liên hệ hub đích/linehaul xác nhận xe đến.',
        'Nhận manifest hoặc ghi nhận ngoại lệ nếu xe trễ.',
      ];
    case 'TASK_STALE':
      return [
        'Mở task để kiểm tra courier đang nhận xử lý.',
        'Nhắc courier cập nhật thao tác hoặc reassign khi cần.',
        'Ưu tiên task đã quá hạn nhiều giờ.',
      ];
  }
}

function buildLookupUrl(alert: ServiceQualityAlert): string | null {
  if (!alert.lookupCode) {
    return null;
  }

  return `${routePaths.serviceQualityIntegratedLookup}?shipmentCode=${encodeURIComponent(alert.lookupCode)}`;
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
  const [workflowFilter, setWorkflowFilter] = useState<'ACTIVE' | 'ACKED' | 'ALL'>('ACTIVE');
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>([]);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>([]);
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
          !hiddenAlertIds.includes(alert.id) &&
          (typeFilter === 'ALL' || alert.type === typeFilter) &&
          (severityFilter === 'ALL' || alert.severity === severityFilter) &&
          (hubFilter === 'ALL' || alert.hubCode === hubFilter) &&
          (workflowFilter === 'ALL' ||
            (workflowFilter === 'ACKED'
              ? acknowledgedAlertIds.includes(alert.id)
              : !acknowledgedAlertIds.includes(alert.id))),
      ),
    [acknowledgedAlertIds, alerts, hiddenAlertIds, hubFilter, severityFilter, typeFilter, workflowFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [hubFilter, pageSize, severityFilter, typeFilter, workflowFilter]);

  const hubOptions = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.hubCode))).filter(Boolean).sort(),
    [alerts],
  );
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const warningCount = alerts.filter((alert) => alert.severity === 'warning').length;
  const activeCount = alerts.filter(
    (alert) => !acknowledgedAlertIds.includes(alert.id) && !hiddenAlertIds.includes(alert.id),
  ).length;
  const acknowledgedCount = alerts.filter((alert) => acknowledgedAlertIds.includes(alert.id)).length;
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

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlertIds((currentIds) =>
      currentIds.includes(alertId) ? currentIds : [...currentIds, alertId],
    );
  };

  const hideAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
    setHiddenAlertIds((currentIds) =>
      currentIds.includes(alertId) ? currentIds : [...currentIds, alertId],
    );
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
          <span>Đang mở</span>
          <strong>{activeCount}</strong>
        </article>
        <article data-tone="success">
          <span>Đã xem</span>
          <strong>{acknowledgedCount}</strong>
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
        <label>
          <span>Trạng thái xử lý</span>
          <select
            value={workflowFilter}
            onChange={(event) => setWorkflowFilter(event.target.value as 'ACTIVE' | 'ACKED' | 'ALL')}
          >
            <option value="ACTIVE">Chưa xem</option>
            <option value="ACKED">Đã xem</option>
            <option value="ALL">Tất cả</option>
          </select>
        </label>
      </section>

      {hiddenAlertIds.length > 0 || acknowledgedAlertIds.length > 0 ? (
        <section className="ops-service-quality-monitor__workbar" aria-label="Trạng thái xử lý trong phiên">
          <span>
            Đã xem {acknowledgedCount} cảnh báo · Tạm ẩn {hiddenAlertIds.length} cảnh báo
          </span>
          <button
            type="button"
            onClick={() => {
              setAcknowledgedAlertIds([]);
              setHiddenAlertIds([]);
            }}
          >
            Hiện lại tất cả
          </button>
        </section>
      ) : null}

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
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.map((alert) => {
                const lookupUrl = buildLookupUrl(alert);
                const isAcknowledged = acknowledgedAlertIds.includes(alert.id);

                return (
                  <tr key={alert.id} data-workflow-state={isAcknowledged ? 'acknowledged' : 'active'}>
                    <td>
                      <span className={`ops-service-quality-monitor__severity ops-service-quality-monitor__severity--${alert.severity}`}>
                        {severityLabel(alert.severity)}
                      </span>
                      {isAcknowledged ? (
                        <span className="ops-service-quality-monitor__state-pill">Đã xem</span>
                      ) : null}
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
                      <ul className="ops-service-quality-monitor__checklist">
                        {actionChecklist(alert).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <time>{formatDateTime(alert.updatedAt)}</time>
                    </td>
                    <td>
                      <div className="ops-service-quality-monitor__actions">
                        <Link to={alert.detailUrl}>Mở chi tiết</Link>
                        {lookupUrl ? <Link to={lookupUrl}>Tra cứu tích hợp</Link> : null}
                        {!isAcknowledged ? (
                          <button type="button" onClick={() => acknowledgeAlert(alert.id)}>
                            Đã xem
                          </button>
                        ) : null}
                        <button type="button" onClick={() => hideAlert(alert.id)}>
                          Tạm ẩn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
