import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useManifestsQuery } from '../../../features/manifests/manifests.api';
import { useNdrCasesQuery } from '../../../features/ndr/ndr.api';
import { useShipmentsQuery } from '../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../features/tasks/tasks.api';
import { routePaths } from '../../../navigation/routes';
import { getErrorMessage } from '../../../services/api/errors';
import { useAuthStore } from '../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../utils/logisticsLabels';
import './AnalyticsDashboard.css';

const NDR_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#94a3b8'];

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
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

function buildDateWindow(): string[] {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return toDateInputValue(date);
  });
}

export function AnalyticsDashboardPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const tasksQuery = useTasksQuery(accessToken, {}, { refetchInterval: 15000 });
  const manifestsQuery = useManifestsQuery(accessToken);
  const ndrQuery = useNdrCasesQuery(accessToken);

  const shipments = shipmentsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const manifests = manifestsQuery.data ?? [];
  const ndrCases = ndrQuery.data ?? [];
  const today = toDateInputValue(new Date());
  const todaysShipments = shipments.filter((shipment) => toDateInputValue(new Date(shipment.createdAt)) === today);
  const activeDelivery = shipments.filter((shipment) =>
    ['TASK_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'NDR_CREATED'].includes(
      normalizeCode(shipment.currentStatus),
    ),
  );
  const delivered = shipments.filter((shipment) => normalizeCode(shipment.currentStatus) === 'DELIVERED');
  const abnormal = shipments.filter((shipment) =>
    ['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED'].includes(normalizeCode(shipment.currentStatus)),
  );

  const hubThroughputData = useMemo(() => {
    const dateWindow = buildDateWindow();
    const hubs = Array.from(new Set(shipments.map(resolveShipmentHub))).filter(Boolean).slice(0, 5);

    return dateWindow.map((dateKey) => {
      const row: Record<string, string | number> = { date: toShortDate(dateKey) };
      for (const hub of hubs) {
        row[hub] = shipments.filter(
          (shipment) => toDateInputValue(new Date(shipment.createdAt)) === dateKey && resolveShipmentHub(shipment) === hub,
        ).length;
      }
      return row;
    });
  }, [shipments]);
  const hubKeys = useMemo(
    () => Object.keys(hubThroughputData[0] ?? {}).filter((key) => key !== 'date'),
    [hubThroughputData],
  );
  const ndrReasonData = useMemo(() => {
    const groups = new Map<string, number>();
    for (const ndr of ndrCases) {
      const key = ndr.reasonCode ?? 'Chưa phân loại';
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    if (groups.size === 0) {
      for (const shipment of abnormal) {
        const key = formatShipmentStatusLabel(shipment.currentStatus);
        groups.set(key, (groups.get(key) ?? 0) + 1);
      }
    }
    return Array.from(groups.entries()).map(([name, value], index) => ({
      name,
      value,
      color: NDR_COLORS[index % NDR_COLORS.length],
    }));
  }, [abnormal, ndrCases]);
  const urgentAlerts = useMemo(() => {
    return shipments
      .filter((shipment) => normalizeCode(shipment.currentStatus) !== 'DELIVERED')
      .map((shipment) => ({
        shipment,
        elapsedHours: ageHours(shipment.updatedAt) ?? 0,
      }))
      .filter((row) => row.elapsedHours >= 24)
      .sort((left, right) => right.elapsedHours - left.elapsedHours)
      .slice(0, 8);
  }, [shipments]);
  const loadError = shipmentsQuery.error ?? tasksQuery.error ?? manifestsQuery.error ?? ndrQuery.error ?? null;

  return (
    <div className="analytics-dash">
      <header className="analytics-dash__header">
        <div>
          <h1 className="analytics-dash__title">
            <span className="analytics-dash__title-icon">
              <svg viewBox="0 0 24 24">
                <path d="M3 13h4v8H3zM9 9h4v12H9zM15 5h4v16h-4zM21 2l-3 3m3-3h-3m3 0v3" />
              </svg>
            </span>
            Operations Analytics Dashboard
          </h1>
          <p className="analytics-dash__subtitle">
            Dữ liệu derive từ shipments, tasks, manifests và NDR hiện có qua Gateway BFF.
          </p>
        </div>
        <span className="analytics-dash__date-badge">API-derived · {new Date().toLocaleString('vi-VN')}</span>
      </header>

      {loadError ? (
        <p className="analytics-derived-error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="analytics-kpi-row" aria-label="Key performance indicators">
        {[
          { label: 'Tổng đơn trong ngày', value: todaysShipments.length, accent: 'primary' },
          { label: 'Đang giao', value: activeDelivery.length, accent: 'info' },
          { label: 'Giao thành công', value: delivered.length, accent: 'success' },
          { label: 'Bất thường / cảnh báo', value: abnormal.length + urgentAlerts.length, accent: 'danger' },
        ].map((kpi) => (
          <article key={kpi.label} className={`analytics-kpi-card analytics-kpi-card--${kpi.accent}`}>
            <span className="analytics-kpi-card__label">{kpi.label}</span>
            <div className="analytics-kpi-card__value-row">
              <span className="analytics-kpi-card__value">{kpi.value}</span>
            </div>
            <span className="analytics-kpi-card__trend analytics-kpi-card__trend--neutral">
              API source
            </span>
          </article>
        ))}
      </section>

      <section className="analytics-charts-row" aria-label="Charts">
        <article className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">
            <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--bar" />
            Sản lượng tạo vận đơn theo hub - 7 ngày
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hubThroughputData} barGap={2} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip />
              {hubKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={NDR_COLORS[index % NDR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {hubKeys.length === 0 ? <p className="analytics-empty-note">Chưa có dữ liệu hub.</p> : null}
        </article>

        <article className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">
            <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--donut" />
            NDR / bất thường theo lý do
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ndrReasonData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {ndrReasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {ndrReasonData.length === 0 ? <p className="analytics-empty-note">Chưa có dữ liệu NDR.</p> : null}
        </article>
      </section>

      <section className="analytics-alerts-section" aria-label="Urgent alerts">
        <div className="analytics-alerts-card">
          <header className="analytics-alerts-card__header">
            <h3 className="analytics-alerts-card__title">Cảnh báo cần xử lý gấp</h3>
            <span className="analytics-alerts-card__badge">
              {urgentAlerts.length} cảnh báo · {tasks.length} task · {manifests.length} manifest
            </span>
          </header>
          <table className="analytics-alerts-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Vấn đề</th>
                <th>Hub</th>
                <th>Mức độ</th>
                <th>Thời gian</th>
                <th>Khách</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {urgentAlerts.map(({ shipment, elapsedHours }) => (
                <tr key={shipment.id}>
                  <td>
                    <span className="analytics-alert-code">{shipment.shipmentCode}</span>
                  </td>
                  <td>{formatShipmentStatusLabel(shipment.currentStatus)}</td>
                  <td>{resolveShipmentHub(shipment)}</td>
                  <td>
                    <span className={`analytics-severity analytics-severity--${elapsedHours >= 48 ? 'critical' : 'high'}`}>
                      <span className="analytics-severity__dot" />
                      {elapsedHours >= 48 ? 'Nghiêm trọng' : 'Cao'}
                    </span>
                  </td>
                  <td>
                    <span className="analytics-elapsed">{elapsedHours}h</span>
                  </td>
                  <td>{shipment.receiverName ?? shipment.senderName ?? 'Không có'}</td>
                  <td>
                    <Link className="analytics-action-btn" to={routePaths.shipmentDetail(shipment.id)}>
                      Xử lý ngay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {urgentAlerts.length === 0 ? (
            <p className="analytics-empty-note">Không có cảnh báo quá hạn từ dữ liệu hiện tại.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
