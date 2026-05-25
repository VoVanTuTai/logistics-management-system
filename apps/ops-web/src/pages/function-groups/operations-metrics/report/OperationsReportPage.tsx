import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import './OperationsReportPage.css';

type ReportStatusFilter = 'all' | 'open' | 'delivered' | 'exception' | 'overdue';
type KpiTone = 'primary' | 'success' | 'warning' | 'danger';

interface HubReportRow {
  hubCode: string;
  total: number;
  delivered: number;
  open: number;
  exception: number;
  overdue: number;
  sla48: number;
}

const FINAL_STATUSES = new Set(['DELIVERED', 'RETURN_COMPLETED', 'CANCELLED']);
const EXCEPTION_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED']);

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
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.round((end - start) / 3600000));
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

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return '0%';
  }
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function isOverdueShipment(shipment: ShipmentListItemDto): boolean {
  if (normalizeCode(shipment.currentStatus) === 'DELIVERED') {
    return false;
  }
  const hours = ageHours(shipment.updatedAt ?? shipment.createdAt);
  return hours !== null && hours >= 24;
}

function isWithinDateRange(value: string, from: string, to: string): boolean {
  const dateKey = toDateKey(value);
  return dateKey >= from && dateKey <= to;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OperationsReportPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const today = toDateInputValue(new Date());
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  }, []);
  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [hubCode, setHubCode] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 30000 });
  const tasksQuery = useTasksQuery(accessToken, {}, { refetchInterval: 30000 });
  const manifestsQuery = useManifestsQuery(accessToken);
  const ndrQuery = useNdrCasesQuery(accessToken);

  const shipments = shipmentsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const manifests = manifestsQuery.data ?? [];
  const ndrCases = ndrQuery.data ?? [];
  const loadError = shipmentsQuery.error ?? tasksQuery.error ?? manifestsQuery.error ?? ndrQuery.error ?? null;

  const availableHubs = useMemo(() => {
    return Array.from(new Set(shipments.map(resolveShipmentHub))).filter(Boolean).sort();
  }, [shipments]);

  const scopedShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const status = normalizeCode(shipment.currentStatus);
      const inDateRange = isWithinDateRange(shipment.createdAt, fromDate, toDate);
      const inHub = hubCode === 'all' || resolveShipmentHub(shipment) === hubCode;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && !FINAL_STATUSES.has(status)) ||
        (statusFilter === 'delivered' && status === 'DELIVERED') ||
        (statusFilter === 'exception' && EXCEPTION_STATUSES.has(status)) ||
        (statusFilter === 'overdue' && isOverdueShipment(shipment));
      return inDateRange && inHub && matchesStatus;
    });
  }, [fromDate, hubCode, shipments, statusFilter, toDate]);

  const deliveredShipments = scopedShipments.filter((shipment) => normalizeCode(shipment.currentStatus) === 'DELIVERED');
  const openShipments = scopedShipments.filter((shipment) => !FINAL_STATUSES.has(normalizeCode(shipment.currentStatus)));
  const exceptionShipments = scopedShipments.filter((shipment) => EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus)));
  const overdueShipments = scopedShipments.filter(isOverdueShipment);
  const sla48Shipments = deliveredShipments.filter((shipment) => {
    const hours = durationHours(shipment.createdAt, shipment.updatedAt);
    return hours !== null && hours <= 48;
  });
  const openTasks = tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(normalizeCode(task.status))).length;
  const openNdr = ndrCases.filter((ndr) => normalizeCode(ndr.status) !== 'CLOSED').length;
  const openManifests = manifests.filter((manifest) => !['RECEIVED', 'CLOSED'].includes(normalizeCode(manifest.status))).length;

  const hubRows = useMemo<HubReportRow[]>(() => {
    const grouped = new Map<string, HubReportRow>();
    for (const shipment of scopedShipments) {
      const hub = resolveShipmentHub(shipment);
      const row =
        grouped.get(hub) ??
        {
          hubCode: hub,
          total: 0,
          delivered: 0,
          open: 0,
          exception: 0,
          overdue: 0,
          sla48: 0,
        };
      const status = normalizeCode(shipment.currentStatus);
      row.total += 1;
      row.delivered += status === 'DELIVERED' ? 1 : 0;
      row.open += FINAL_STATUSES.has(status) ? 0 : 1;
      row.exception += EXCEPTION_STATUSES.has(status) ? 1 : 0;
      row.overdue += isOverdueShipment(shipment) ? 1 : 0;
      const hours = durationHours(shipment.createdAt, shipment.updatedAt);
      row.sla48 += status === 'DELIVERED' && hours !== null && hours <= 48 ? 1 : 0;
      grouped.set(hub, row);
    }
    return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
  }, [scopedShipments]);

  const topExceptions = scopedShipments
    .filter((shipment) => EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus)) || isOverdueShipment(shipment))
    .slice()
    .sort((left, right) => (ageHours(right.updatedAt) ?? 0) - (ageHours(left.updatedAt) ?? 0))
    .slice(0, 8);

  const kpis: Array<{
    label: string;
    value: string;
    detail: string;
    formula: string;
    tone: KpiTone;
    to: string;
  }> = [
    {
      label: 'Tổng vận đơn',
      value: String(scopedShipments.length),
      detail: `${fromDate} đến ${toDate}`,
      formula: 'count(shipment.createdAt trong kỳ)',
      tone: 'primary',
      to: routePaths.shipments,
    },
    {
      label: 'Tỷ lệ giao thành công',
      value: formatPercent(deliveredShipments.length, scopedShipments.length),
      detail: `${deliveredShipments.length}/${scopedShipments.length} đơn`,
      formula: 'delivered / total',
      tone: 'success',
      to: routePaths.opsMetricsDeadlineDeliverySla,
    },
    {
      label: 'SLA phát 48h',
      value: formatPercent(sla48Shipments.length, deliveredShipments.length),
      detail: `${sla48Shipments.length}/${deliveredShipments.length} đơn đã giao`,
      formula: 'delivered <= 48h / delivered',
      tone: 'success',
      to: routePaths.opsMetricsDeadlineDeliveryLeadtime,
    },
    {
      label: 'Cảnh báo quá hạn',
      value: String(overdueShipments.length),
      detail: 'Đơn chưa hoàn tất quá 24h',
      formula: 'open && age(updatedAt) >= 24h',
      tone: overdueShipments.length > 0 ? 'danger' : 'success',
      to: routePaths.opsMetricsDeadlineOverdueAlerts,
    },
    {
      label: 'Bất thường / NDR',
      value: String(exceptionShipments.length + openNdr),
      detail: `${exceptionShipments.length} đơn, ${openNdr} NDR mở`,
      formula: 'exception status + open NDR',
      tone: exceptionShipments.length + openNdr > 0 ? 'warning' : 'success',
      to: routePaths.serviceQualityAbnormalManagement,
    },
    {
      label: 'Việc vận hành mở',
      value: String(openTasks + openManifests),
      detail: `${openTasks} task, ${openManifests} manifest`,
      formula: 'open tasks + open manifests',
      tone: openTasks + openManifests > 0 ? 'primary' : 'success',
      to: routePaths.opsMetricsActionExecutionBoard,
    },
  ];

  const handleExport = (): void => {
    const rows = [
      ['Hub', 'Tong don', 'Da giao', 'Dang mo', 'Bat thuong', 'Qua han', 'SLA 48h'],
      ...hubRows.map((row) => [
        row.hubCode,
        String(row.total),
        String(row.delivered),
        String(row.open),
        String(row.exception),
        String(row.overdue),
        formatPercent(row.sla48, row.delivered),
      ]),
    ];
    downloadCsv(`bao-cao-van-hanh-${fromDate}-${toDate}.csv`, rows);
  };

  return (
    <section className="ops-report">
      <header className="ops-report__hero">
        <div>
          <small>Báo cáo vận hành</small>
          <h2>Lớp báo cáo production cho chỉ số ops</h2>
          <p>
            Dùng để chốt số liệu theo kỳ, có filter rõ, định nghĩa KPI rõ và drill-down tới màn xử lý tương ứng.
          </p>
        </div>
        <div className="ops-report__hero-actions">
          <button type="button" onClick={handleExport} disabled={hubRows.length === 0}>
            Xuất CSV
          </button>
          <Link to={routePaths.analyticsDashboard}>Mở dashboard nhanh</Link>
        </div>
      </header>

      {loadError ? (
        <p className="ops-report__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <form className="ops-report__filters">
        <label>
          <span>Từ ngày</span>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày</span>
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <label>
          <span>Hub / chi nhánh</span>
          <select value={hubCode} onChange={(event) => setHubCode(event.target.value)}>
            <option value="all">Tất cả hub</option>
            {availableHubs.map((hub) => (
              <option key={hub} value={hub}>
                {hub}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Nhóm trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReportStatusFilter)}>
            <option value="all">Tất cả</option>
            <option value="open">Đang mở</option>
            <option value="delivered">Đã giao</option>
            <option value="exception">Bất thường / NDR</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </label>
      </form>

      <section className="ops-report__kpis" aria-label="KPI báo cáo vận hành">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className="ops-report__kpi" data-tone={kpi.tone}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <em>{kpi.detail}</em>
            <small>{kpi.formula}</small>
          </Link>
        ))}
      </section>

      <section className="ops-report__layout">
        <article className="ops-report__panel ops-report__panel--wide">
          <header className="ops-report__panel-head">
            <div>
              <h3>Tổng hợp theo hub</h3>
              <span>{hubRows.length} hub trong bộ lọc hiện tại</span>
            </div>
            <Link to={routePaths.opsMetricsPlanningNetworkKpi}>KPI mạng lưới</Link>
          </header>
          <div className="ops-report__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hub</th>
                  <th>Tổng đơn</th>
                  <th>Đã giao</th>
                  <th>Đang mở</th>
                  <th>Bất thường</th>
                  <th>Quá hạn</th>
                  <th>SLA 48h</th>
                </tr>
              </thead>
              <tbody>
                {hubRows.map((row) => (
                  <tr key={row.hubCode}>
                    <td>
                      <strong>{row.hubCode}</strong>
                    </td>
                    <td>{row.total}</td>
                    <td>{row.delivered}</td>
                    <td>{row.open}</td>
                    <td>{row.exception}</td>
                    <td>{row.overdue}</td>
                    <td>{formatPercent(row.sla48, row.delivered)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hubRows.length === 0 ? <p className="ops-report__empty">Chưa có dữ liệu phù hợp bộ lọc.</p> : null}
          </div>
        </article>

        <article className="ops-report__panel">
          <header className="ops-report__panel-head">
            <div>
              <h3>Drill-down cần xử lý</h3>
              <span>{topExceptions.length} đơn ưu tiên</span>
            </div>
            <Link to={routePaths.opsMetricsDeadlineOverdueAlerts}>Cảnh báo quá hạn</Link>
          </header>
          <div className="ops-report__issue-list">
            {topExceptions.map((shipment) => (
              <Link key={shipment.id} to={routePaths.shipmentDetail(shipment.id)} className="ops-report__issue">
                <strong>{shipment.shipmentCode}</strong>
                <span>{formatShipmentStatusLabel(shipment.currentStatus)}</span>
                <small>
                  {resolveShipmentHub(shipment)} · {ageHours(shipment.updatedAt) ?? 0}h
                </small>
              </Link>
            ))}
            {topExceptions.length === 0 ? <p className="ops-report__empty">Không có đơn cần ưu tiên trong kỳ này.</p> : null}
          </div>
        </article>
      </section>

      <section className="ops-report__definitions">
        <article>
          <h3>Định nghĩa KPI production</h3>
          <dl>
            <div>
              <dt>Tổng vận đơn</dt>
              <dd>Đếm vận đơn theo `createdAt` trong kỳ, sau khi áp dụng phạm vi hub/chi nhánh.</dd>
            </div>
            <div>
              <dt>Tỷ lệ giao thành công</dt>
              <dd>`DELIVERED / total`, dùng để báo cáo hiệu quả phát.</dd>
            </div>
            <div>
              <dt>SLA phát 48h</dt>
              <dd>Vận đơn `DELIVERED` có thời gian từ tạo đơn tới cập nhật giao thành công không quá 48h.</dd>
            </div>
            <div>
              <dt>Cảnh báo quá hạn</dt>
              <dd>Vận đơn chưa hoàn tất và không cập nhật quá 24h.</dd>
            </div>
          </dl>
        </article>
        <article>
          <h3>API metrics riêng cần tách</h3>
          <dl>
            <div>
              <dt>Endpoint đề xuất</dt>
              <dd>`GET /ops/reports/operations?from=&to=&hubCode=&statusGroup=`</dd>
            </div>
            <div>
              <dt>Response đề xuất</dt>
              <dd>`kpis`, `hubRows`, `exceptions`, `lastSyncedAt`, `scope`.</dd>
            </div>
            <div>
              <dt>Lý do tách API</dt>
              <dd>Backend chốt công thức, phân quyền dữ liệu, cache/materialized view và export chính thức.</dd>
            </div>
          </dl>
        </article>
      </section>
    </section>
  );
}
