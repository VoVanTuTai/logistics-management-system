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
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import '../proactive/ServiceQualityMonitor.css';

type AbnormalType =
  | 'DELIVERY_EXCEPTION'
  | 'NDR_CASE'
  | 'RETURN_RISK'
  | 'HUB_STUCK'
  | 'TASK_OVERDUE'
  | 'MANIFEST_EXCEPTION';
type AbnormalSeverity = 'critical' | 'warning' | 'info';
type CaseWorkflow = 'NEW' | 'IN_PROGRESS' | 'VERIFYING' | 'RESOLVED';

interface AbnormalCase {
  id: string;
  type: AbnormalType;
  severity: AbnormalSeverity;
  subjectCode: string;
  subjectLabel: string;
  shipmentCode: string | null;
  hubCode: string;
  owner: string;
  status: string;
  ageHours: number | null;
  issue: string;
  nextAction: string;
  updatedAt: string | null;
  detailUrl: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const HUB_STUCK_WARNING_HOURS = 24;
const HUB_STUCK_CRITICAL_HOURS = 48;
const TASK_OVERDUE_WARNING_HOURS = 6;
const TASK_OVERDUE_CRITICAL_HOURS = 12;
const MANIFEST_EXCEPTION_WARNING_HOURS = 24;
const MANIFEST_EXCEPTION_CRITICAL_HOURS = 36;
const ABNORMAL_SHIPMENT_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
  'RETURN_COMPLETED',
]);
const HUB_STUCK_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'SCAN_INBOUND',
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
]);
const OPEN_NDR_STATUSES = new Set(['OPEN', 'RESCHEDULED', 'RETURNING']);
const ACTIVE_TASK_STATUSES = new Set(['ASSIGNED', 'CREATED', 'PENDING', 'IN_PROGRESS']);
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

function buildShipmentAbnormalCases(
  shipments: ShipmentListItemDto[],
  taskByShipment: Map<string, TaskListItemDto>,
  ndrByShipment: Map<string, NdrCaseListItemDto>,
): AbnormalCase[] {
  return shipments.flatMap((shipment): AbnormalCase[] => {
    const cases: AbnormalCase[] = [];
    const status = normalizeCode(shipment.currentStatus);
    const hubCode = resolveShipmentHub(shipment);
    const task = taskByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;
    const ndr = ndrByShipment.get(normalizeCode(shipment.shipmentCode)) ?? null;

    if (ABNORMAL_SHIPMENT_STATUSES.has(status)) {
      const isReturn = status.includes('RETURN');
      cases.push({
        id: `shipment-${shipment.id}-${status}`,
        type: isReturn ? 'RETURN_RISK' : 'DELIVERY_EXCEPTION',
        severity: status === 'DELIVERY_FAILED' || status === 'NDR_CREATED' ? 'critical' : 'warning',
        subjectCode: shipment.shipmentCode,
        subjectLabel: 'Vận đơn',
        shipmentCode: shipment.shipmentCode,
        hubCode,
        owner: task?.assignedCourierId ?? 'Ops xử lý',
        status,
        ageHours: ageHours(shipment.updatedAt),
        issue: isReturn ? 'Đơn đang trong luồng hoàn/bất thường' : 'Đơn phát sinh giao thất bại hoặc NDR',
        nextAction: ndr ? 'Mở NDR để chốt giao lại/hoàn hàng' : 'Kiểm tra timeline và xác định phương án xử lý',
        updatedAt: shipment.updatedAt,
        detailUrl: ndr ? routePaths.ndrDetail(ndr.id) : buildShipmentLookupUrl(shipment.shipmentCode),
      });
    }

    const stuckHours = ageHours(shipment.updatedAt);
    if (HUB_STUCK_STATUSES.has(status) && stuckHours !== null && stuckHours >= HUB_STUCK_WARNING_HOURS) {
      cases.push({
        id: `hub-stuck-${shipment.id}`,
        type: 'HUB_STUCK',
        severity: stuckHours >= HUB_STUCK_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: shipment.shipmentCode,
        subjectLabel: 'Tồn hub',
        shipmentCode: shipment.shipmentCode,
        hubCode,
        owner: 'Ops hub',
        status,
        ageHours: stuckHours,
        issue: 'Hàng tồn hub lâu, chưa có luồng xử lý tiếp theo',
        nextAction: 'Đối chiếu scan/manifest và yêu cầu hub cập nhật thao tác',
        updatedAt: shipment.updatedAt,
        detailUrl: buildShipmentLookupUrl(shipment.shipmentCode),
      });
    }

    return cases;
  });
}

function buildNdrAbnormalCases(ndrCases: NdrCaseListItemDto[]): AbnormalCase[] {
  return ndrCases
    .filter((ndr) => OPEN_NDR_STATUSES.has(normalizeCode(ndr.status)))
    .map((ndr) => {
      const hours = ageHours(ndr.updatedAt);
      return {
        id: `ndr-${ndr.id}`,
        type: 'NDR_CASE',
        severity: hours !== null && hours >= 24 ? 'critical' : 'warning',
        subjectCode: ndr.shipmentCode,
        subjectLabel: 'NDR',
        shipmentCode: ndr.shipmentCode,
        hubCode: 'NDR',
        owner: 'Ops NDR',
        status: normalizeCode(ndr.status),
        ageHours: hours,
        issue: ndr.reasonCode ? `NDR cần xử lý: ${ndr.reasonCode}` : 'NDR đang mở cần xử lý',
        nextAction: 'Chốt giao lại, đổi thông tin hoặc hoàn hàng',
        updatedAt: ndr.updatedAt,
        detailUrl: routePaths.ndrDetail(ndr.id),
      };
    });
}

function buildTaskAbnormalCases(tasks: TaskListItemDto[]): AbnormalCase[] {
  return tasks
    .map((task): AbnormalCase | null => {
      const status = normalizeCode(task.status);
      const hours = ageHours(task.updatedAt);
      if (!ACTIVE_TASK_STATUSES.has(status) || hours === null || hours < TASK_OVERDUE_WARNING_HOURS) {
        return null;
      }

      return {
        id: `task-${task.id}`,
        type: 'TASK_OVERDUE',
        severity: hours >= TASK_OVERDUE_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: task.taskCode,
        subjectLabel: task.taskType,
        shipmentCode: task.shipmentCode,
        hubCode: task.deliveryArea ?? 'TASK',
        owner: task.assignedCourierId ?? 'Chưa phân công',
        status,
        ageHours: hours,
        issue: 'Task vận hành quá lâu chưa hoàn tất',
        nextAction: task.assignedCourierId ? 'Nhắc courier hoặc reassign' : 'Phân công owner xử lý',
        updatedAt: task.updatedAt,
        detailUrl: routePaths.taskDetail(task.id),
      };
    })
    .filter((item): item is AbnormalCase => Boolean(item));
}

function buildManifestAbnormalCases(manifests: ManifestListItemDto[]): AbnormalCase[] {
  return manifests
    .map((manifest): AbnormalCase | null => {
      const status = normalizeCode(manifest.status);
      const basis = manifest.sealedAt ?? manifest.updatedAt ?? manifest.createdAt ?? null;
      const hours = ageHours(basis);
      if (!SEALED_MANIFEST_STATUSES.has(status) || hours === null || hours < MANIFEST_EXCEPTION_WARNING_HOURS) {
        return null;
      }

      return {
        id: `manifest-${manifest.id}`,
        type: 'MANIFEST_EXCEPTION',
        severity: hours >= MANIFEST_EXCEPTION_CRITICAL_HOURS ? 'critical' : 'warning',
        subjectCode: manifest.manifestCode,
        subjectLabel: 'Manifest',
        shipmentCode: null,
        hubCode: normalizeCode(manifest.destinationHubCode) || normalizeCode(manifest.originHubCode) || 'CHUA_XAC_DINH',
        owner: 'Linehaul/Ops hub',
        status,
        ageHours: hours,
        issue: 'Manifest đã seal/in transit lâu nhưng chưa receive',
        nextAction: 'Kiểm tra xe, hub đích và nhận manifest nếu đã đến',
        updatedAt: basis,
        detailUrl: routePaths.linehaulTripDataMonitor,
      };
    })
    .filter((item): item is AbnormalCase => Boolean(item));
}

function severityRank(severity: AbnormalSeverity): number {
  if (severity === 'critical') {
    return 3;
  }
  if (severity === 'warning') {
    return 2;
  }
  return 1;
}

function severityLabel(severity: AbnormalSeverity): string {
  if (severity === 'critical') {
    return 'Khẩn cấp';
  }
  if (severity === 'warning') {
    return 'Cảnh báo';
  }
  return 'Theo dõi';
}

function workflowLabel(workflow: CaseWorkflow): string {
  switch (workflow) {
    case 'NEW':
      return 'Mới';
    case 'IN_PROGRESS':
      return 'Đang xử lý';
    case 'VERIFYING':
      return 'Chờ xác minh';
    case 'RESOLVED':
      return 'Đã xử lý';
  }
}

function typeLabel(type: AbnormalType): string {
  switch (type) {
    case 'DELIVERY_EXCEPTION':
      return 'Giao bất thường';
    case 'NDR_CASE':
      return 'NDR';
    case 'RETURN_RISK':
      return 'Hoàn hàng';
    case 'HUB_STUCK':
      return 'Tồn hub';
    case 'TASK_OVERDUE':
      return 'Task quá hạn';
    case 'MANIFEST_EXCEPTION':
      return 'Manifest bất thường';
  }
}

function statusLabel(item: AbnormalCase): string {
  if (item.type === 'NDR_CASE') {
    return formatNdrStatusLabel(item.status);
  }
  if (item.type === 'TASK_OVERDUE') {
    return formatTaskStatusLabel(item.status);
  }
  if (item.type === 'MANIFEST_EXCEPTION') {
    return formatManifestStatusLabel(item.status);
  }
  return formatShipmentStatusLabel(item.status);
}

function buildLookupUrl(item: AbnormalCase): string | null {
  if (!item.shipmentCode) {
    return null;
  }

  return `${routePaths.serviceQualityIntegratedLookup}?shipmentCode=${encodeURIComponent(item.shipmentCode)}`;
}

function buildShipmentLookupUrl(shipmentCode: string): string {
  return `${routePaths.serviceQualityIntegratedLookup}?shipmentCode=${encodeURIComponent(shipmentCode)}`;
}

export function ServiceQualityAbnormalManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [typeFilter, setTypeFilter] = useState<AbnormalType | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AbnormalSeverity | 'ALL'>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<CaseWorkflow | 'ACTIVE' | 'ALL'>('ACTIVE');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [caseWorkflowById, setCaseWorkflowById] = useState<Record<string, CaseWorkflow>>({});
  const [hiddenCaseIds, setHiddenCaseIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken, { refetchInterval: 15000 });
  const manifestsQuery = useManifestsQuery(accessToken, { refetchInterval: 15000 });
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
  const ndrByShipment = useMemo(() => buildNdrByShipment(ndrQuery.data ?? []), [ndrQuery.data]);
  const cases = useMemo(
    () =>
      [
        ...buildShipmentAbnormalCases(shipmentsQuery.data ?? [], taskByShipment, ndrByShipment),
        ...buildNdrAbnormalCases(ndrQuery.data ?? []),
        ...buildTaskAbnormalCases(allTasks),
        ...buildManifestAbnormalCases(manifestsQuery.data ?? []),
      ].sort((left, right) => {
        const severityDelta = severityRank(right.severity) - severityRank(left.severity);
        if (severityDelta !== 0) {
          return severityDelta;
        }
        return (right.ageHours ?? 0) - (left.ageHours ?? 0);
      }),
    [allTasks, manifestsQuery.data, ndrByShipment, ndrQuery.data, shipmentsQuery.data, taskByShipment],
  );
  const filteredCases = useMemo(
    () =>
      cases.filter((item) => {
        const workflow = caseWorkflowById[item.id] ?? 'NEW';
        return (
          !hiddenCaseIds.includes(item.id) &&
          (typeFilter === 'ALL' || item.type === typeFilter) &&
          (severityFilter === 'ALL' || item.severity === severityFilter) &&
          (hubFilter === 'ALL' || item.hubCode === hubFilter) &&
          (workflowFilter === 'ALL' ||
            (workflowFilter === 'ACTIVE'
              ? workflow !== 'RESOLVED'
              : workflow === workflowFilter))
        );
      }),
    [caseWorkflowById, cases, hiddenCaseIds, hubFilter, severityFilter, typeFilter, workflowFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [hubFilter, pageSize, severityFilter, typeFilter, workflowFilter]);

  const hubOptions = useMemo(
    () => Array.from(new Set(cases.map((item) => item.hubCode))).filter(Boolean).sort(),
    [cases],
  );
  const criticalCount = cases.filter((item) => item.severity === 'critical').length;
  const activeCount = cases.filter((item) => (caseWorkflowById[item.id] ?? 'NEW') !== 'RESOLVED').length;
  const verifyingCount = cases.filter((item) => caseWorkflowById[item.id] === 'VERIFYING').length;
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isLoading =
    shipmentsQuery.isLoading ||
    ndrQuery.isLoading ||
    manifestsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    pickupTasksQuery.isLoading ||
    returnTasksQuery.isLoading;
  const loadError =
    shipmentsQuery.error ??
    ndrQuery.error ??
    manifestsQuery.error ??
    deliveryTasksQuery.error ??
    pickupTasksQuery.error ??
    returnTasksQuery.error ??
    null;

  const setWorkflow = (caseId: string, workflow: CaseWorkflow) => {
    setCaseWorkflowById((currentMap) => ({
      ...currentMap,
      [caseId]: workflow,
    }));
  };

  const hideCase = (caseId: string) => {
    setWorkflow(caseId, 'RESOLVED');
    setHiddenCaseIds((currentIds) =>
      currentIds.includes(caseId) ? currentIds : [...currentIds, caseId],
    );
  };

  const refetchAll = () => {
    void shipmentsQuery.refetch();
    void ndrQuery.refetch();
    void manifestsQuery.refetch();
    void deliveryTasksQuery.refetch();
    void pickupTasksQuery.refetch();
    void returnTasksQuery.refetch();
  };

  return (
    <section className="ops-service-quality-monitor">
      <header className="ops-service-quality-monitor__header">
        <div>
          <small>SERVICE_QUALITY_ABNORMAL_MANAGEMENT</small>
          <h2>Quản lý hàng bất thường</h2>
          <p>
            Quản lý case bất thường từ dữ liệu vận đơn, NDR, task và manifest:
            giao thất bại, hoàn hàng, tồn hub, task quá hạn và manifest chưa nhận.
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
          <span>Case đang mở</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <span>Chờ xác minh</span>
          <strong>{verifyingCount}</strong>
        </article>
        <article data-tone="success">
          <span>Đang hiển thị</span>
          <strong>{filteredCases.length}</strong>
        </article>
      </section>

      <section className="ops-service-quality-monitor__filters ops-service-quality-monitor__filters--abnormal">
        <label>
          <span>Loại bất thường</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as AbnormalType | 'ALL')}>
            <option value="ALL">Tất cả</option>
            <option value="DELIVERY_EXCEPTION">Giao bất thường</option>
            <option value="NDR_CASE">NDR</option>
            <option value="RETURN_RISK">Hoàn hàng</option>
            <option value="HUB_STUCK">Tồn hub</option>
            <option value="TASK_OVERDUE">Task quá hạn</option>
            <option value="MANIFEST_EXCEPTION">Manifest bất thường</option>
          </select>
        </label>
        <label>
          <span>Mức độ</span>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as AbnormalSeverity | 'ALL')}>
            <option value="ALL">Tất cả</option>
            <option value="critical">Khẩn cấp</option>
            <option value="warning">Cảnh báo</option>
            <option value="info">Theo dõi</option>
          </select>
        </label>
        <label>
          <span>Trạng thái case</span>
          <select value={workflowFilter} onChange={(event) => setWorkflowFilter(event.target.value as CaseWorkflow | 'ACTIVE' | 'ALL')}>
            <option value="ACTIVE">Đang mở</option>
            <option value="NEW">Mới</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="VERIFYING">Chờ xác minh</option>
            <option value="RESOLVED">Đã xử lý</option>
            <option value="ALL">Tất cả</option>
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

      {hiddenCaseIds.length > 0 ? (
        <section className="ops-service-quality-monitor__workbar" aria-label="Case tạm ẩn">
          <span>Tạm ẩn {hiddenCaseIds.length} case trong phiên làm việc</span>
          <button
            type="button"
            onClick={() => {
              setHiddenCaseIds([]);
            }}
          >
            Hiện lại
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
          <h3>Danh sách case bất thường</h3>
          <span>{isLoading ? 'Đang tải...' : `${filteredCases.length} case`}</span>
        </header>
        {isLoading ? <p className="ops-service-quality-monitor__empty">Đang tải dữ liệu hàng bất thường...</p> : null}
        {!isLoading && filteredCases.length === 0 ? (
          <p className="ops-service-quality-monitor__empty">Không có case bất thường phù hợp bộ lọc.</p>
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
                <th>Trạng thái</th>
                <th>Vấn đề</th>
                <th>Trạng thái case</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCases.map((item) => {
                const workflow = caseWorkflowById[item.id] ?? 'NEW';
                const lookupUrl = buildLookupUrl(item);

                return (
                  <tr key={item.id} data-workflow-state={workflow === 'RESOLVED' ? 'acknowledged' : 'active'}>
                    <td>
                      <span className={`ops-service-quality-monitor__severity ops-service-quality-monitor__severity--${item.severity}`}>
                        {severityLabel(item.severity)}
                      </span>
                    </td>
                    <td>{typeLabel(item.type)}</td>
                    <td>
                      <div className="ops-service-quality-monitor__link-stack">
                        {item.shipmentCode ? (
                          <CopyableShipmentCode code={item.shipmentCode} />
                        ) : (
                          <Link to={item.detailUrl}>{item.subjectCode}</Link>
                        )}
                        <span>{item.subjectLabel}</span>
                      </div>
                    </td>
                    <td>{item.hubCode}</td>
                    <td>{item.owner}</td>
                    <td>{formatAge(item.ageHours)}</td>
                    <td>{statusLabel(item)}</td>
                    <td>
                      <strong>{item.issue}</strong>
                      <span>{item.nextAction}</span>
                      <time>{formatDateTime(item.updatedAt)}</time>
                    </td>
                    <td>
                      <span className="ops-service-quality-monitor__state-pill">{workflowLabel(workflow)}</span>
                    </td>
                    <td>
                      <div className="ops-service-quality-monitor__actions">
                        {!item.shipmentCode ? <Link to={item.detailUrl}>Mở chi tiết</Link> : null}
                        {lookupUrl ? <Link to={lookupUrl}>Tra cứu sự cố / chất lượng</Link> : null}
                        {workflow !== 'IN_PROGRESS' ? (
                          <button type="button" onClick={() => setWorkflow(item.id, 'IN_PROGRESS')}>
                            Nhận xử lý
                          </button>
                        ) : null}
                        {workflow !== 'VERIFYING' ? (
                          <button type="button" onClick={() => setWorkflow(item.id, 'VERIFYING')}>
                            Chờ xác minh
                          </button>
                        ) : null}
                        {workflow !== 'RESOLVED' ? (
                          <button type="button" onClick={() => setWorkflow(item.id, 'RESOLVED')}>
                            Đã xử lý
                          </button>
                        ) : null}
                        <button type="button" onClick={() => hideCase(item.id)}>
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
            Hiển thị {filteredCases.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredCases.length, currentPage * pageSize)} / {filteredCases.length}
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
