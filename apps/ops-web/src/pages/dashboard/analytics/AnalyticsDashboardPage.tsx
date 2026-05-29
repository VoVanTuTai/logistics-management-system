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
import { CopyableShipmentCode } from '../../shared/CopyableShipmentCode';
import './AnalyticsDashboard.css';

const NDR_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

type AnalyticsAccent = 'primary' | 'info' | 'success' | 'danger' | 'warning';

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
  const hubTotals = useMemo(() => {
    return hubKeys
      .map((hub, index) => {
        const total = hubThroughputData.reduce((sum, row) => {
          const value = row[hub];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);

        return {
          hub,
          total,
          color: NDR_COLORS[index % NDR_COLORS.length],
        };
      })
      .sort((left, right) => right.total - left.total);
  }, [hubKeys, hubThroughputData]);
  const totalCreatedInWindow = hubTotals.reduce((sum, item) => sum + item.total, 0);
  const topHub = hubTotals[0] ?? null;
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
  const kpiCards: Array<{
    label: string;
    value: number;
    accent: AnalyticsAccent;
    description: string;
    to: string;
  }> = [
    {
      label: 'Đơn mới hôm nay',
      value: todaysShipments.length,
      accent: 'primary',
      description: 'Mở danh sách vận đơn để rà soát đơn mới phát sinh.',
      to: routePaths.shipments,
    },
    {
      label: 'Đang đi giao',
      value: activeDelivery.length,
      accent: 'info',
      description: 'Theo dõi các vận đơn đang ở bước phát hàng.',
      to: routePaths.branchBusinessOrderDelivery,
    },
    {
      label: 'Đã giao thành công',
      value: delivered.length,
      accent: 'success',
      description: 'Xem hiệu quả phát và đối chiếu SLA giao hàng.',
      to: routePaths.opsMetricsDeadlineDeliverySla,
    },
    {
      label: 'Cần can thiệp',
      value: abnormal.length + urgentAlerts.length,
      accent: 'danger',
      description: 'Đi tới nhóm xử lý bất thường và cảnh báo quá hạn.',
      to: routePaths.serviceQualityAbnormalManagement,
    },
  ];
  const supportActions: Array<{
    title: string;
    summary: string;
    meta: string;
    to: string;
    accent: AnalyticsAccent;
  }> = [
    {
      title: 'Xử lý cảnh báo quá hạn',
      summary: 'Ưu tiên các vận đơn chưa hoàn tất sau 24h.',
      meta: `${urgentAlerts.length} cảnh báo`,
      to: routePaths.opsMetricsDeadlineOverdueAlerts,
      accent: 'danger',
    },
    {
      title: 'Điều phối thao tác',
      summary: 'Gom việc cần phân công cho nhân sự vận hành.',
      meta: `${tasks.length} task`,
      to: routePaths.opsMetricsActionExecutionBoard,
      accent: 'primary',
    },
    {
      title: 'Kiện bất thường / NDR',
      summary: 'Mở màn quản lý ca lỗi, giao thất bại và ngoại lệ.',
      meta: `${abnormal.length} kiện`,
      to: routePaths.serviceQualityAbnormalManagement,
      accent: 'warning',
    },
    {
      title: 'Quản lý chuyến / bao',
      summary: 'Kiểm tra manifest và luồng bàn giao tuyến.',
      meta: `${manifests.length} manifest`,
      to: routePaths.linehaulTripDataMonitor,
      accent: 'info',
    },
  ];

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
            Bảng phân tích vận hành
          </h1>
          <p className="analytics-dash__subtitle">
            Nhìn nhanh tình trạng đơn, cảnh báo cần can thiệp và mở ngay chức năng xử lý.
          </p>
        </div>
        <span className="analytics-dash__date-badge">Dữ liệu từ API · {new Date().toLocaleString('vi-VN')}</span>
      </header>

      {loadError ? (
        <p className="analytics-derived-error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="analytics-kpi-row" aria-label="Chỉ số vận hành chính">
        {kpiCards.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className={`analytics-kpi-card analytics-kpi-card--${kpi.accent}`}>
            <span className="analytics-kpi-card__label">{kpi.label}</span>
            <div className="analytics-kpi-card__value-row">
              <span className="analytics-kpi-card__value">{kpi.value}</span>
              <span className="analytics-kpi-card__unit">đơn</span>
            </div>
            <span className="analytics-kpi-card__description">{kpi.description}</span>
            <span className="analytics-kpi-card__action">Mở chức năng</span>
          </Link>
        ))}
      </section>

      <section className="analytics-support-grid" aria-label="Chức năng hỗ trợ vận hành">
        <div className="analytics-support-intro">
          <span className="analytics-support-intro__eyebrow">Cần làm tiếp</span>
          <h2>Chọn vấn đề rồi đi thẳng tới màn xử lý</h2>
          <p>
            Các lối tắt này bám theo dữ liệu hiện tại để đội ops không phải đoán nên mở chức năng nào trước.
          </p>
        </div>
        <div className="analytics-support-actions">
          {supportActions.map((action) => (
            <Link
              key={action.title}
              to={action.to}
              className={`analytics-support-card analytics-support-card--${action.accent}`}
            >
              <span className="analytics-support-card__meta">{action.meta}</span>
              <strong>{action.title}</strong>
              <span>{action.summary}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="analytics-charts-row" aria-label="Charts">
        <article className="analytics-chart-card">
          <header className="analytics-chart-card__header">
            <div>
              <h3 className="analytics-chart-card__title">
                <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--bar" />
                Sản lượng tạo vận đơn theo hub
              </h3>
              <p className="analytics-chart-card__hint">
                7 ngày gần nhất · tổng {totalCreatedInWindow} đơn
                {topHub ? ` · hub cao nhất ${topHub.hub}` : ''}
              </p>
            </div>
            <Link className="analytics-chart-card__link" to={routePaths.opsMetricsPlanningNetworkKpi}>
              Xem KPI mạng lưới
            </Link>
          </header>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hubThroughputData} barGap={2} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
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
          {hubTotals.length > 0 ? (
            <div className="analytics-bar-legend" aria-label="Chú giải hub">
              {hubTotals.map((item) => (
                <span key={item.hub} className="analytics-bar-legend__item">
                  <span className="analytics-bar-legend__swatch" style={{ background: item.color }} />
                  {item.hub}: {item.total}
                </span>
              ))}
            </div>
          ) : null}
          {hubKeys.length === 0 ? <p className="analytics-empty-note">Chưa có dữ liệu hub.</p> : null}
        </article>

        <article className="analytics-chart-card">
          <header className="analytics-chart-card__header">
            <div>
              <h3 className="analytics-chart-card__title">
                <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--donut" />
                Lý do bất thường / NDR
              </h3>
              <p className="analytics-chart-card__hint">Nhóm nguyên nhân cần ưu tiên xử lý chất lượng dịch vụ.</p>
            </div>
            <Link className="analytics-chart-card__link" to={routePaths.serviceQualityAbnormalManagement}>
              Mở xử lý
            </Link>
          </header>
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
          {ndrReasonData.length > 0 ? (
            <div className="analytics-donut-legend" aria-label="Chú giải lý do NDR">
              {ndrReasonData.map((entry) => (
                <span key={entry.name} className="analytics-donut-legend__item">
                  <span className="analytics-donut-legend__swatch" style={{ background: entry.color }} />
                  <span>{entry.name}</span>
                  <strong>{entry.value}</strong>
                </span>
              ))}
            </div>
          ) : null}
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
                    <CopyableShipmentCode code={shipment.shipmentCode} className="analytics-alert-code" />
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
                    <div className="analytics-row-actions">
                      <Link className="analytics-action-btn analytics-action-btn--secondary" to={routePaths.opsMetricsActionExecutionBoard}>
                        Điều phối
                      </Link>
                    </div>
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
