import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';

import {
  keyMetrics,
  hubThroughputData,
  hubBarColors,
  ndrReasonData,
  urgentAlerts,
} from './analyticsSeedData';
import type { KeyMetric, AlertSeverity } from './analyticsSeedData';
import { useUiStore } from '../../../store/uiStore';
import './AnalyticsDashboard.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function trendArrow(trend: KeyMetric['trend']): string {
  if (trend === 'up') return '▲';
  if (trend === 'down') return '▼';
  return '—';
}

function severityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return 'Nghiêm trọng';
    case 'high':     return 'Cao';
    case 'medium':   return 'Trung bình';
    default:         return severity;
  }
}

function formatDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/* ------------------------------------------------------------------ */
/*  Donut Active Shape (interactive hover)                            */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveDonutShape(props: any): React.JSX.Element {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius,
    startAngle, endAngle, fill, payload, percent, value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy - 6} dy={0} textAnchor="middle" fill="#ffffff" fontWeight={700} fontSize={14}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {value} đơn
      </text>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <Sector
        cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#e2e8f0" fontSize={12}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
}

/* ================================================================= */
/*  Component                                                        */
/* ================================================================= */
export function AnalyticsDashboardPage(): React.JSX.Element {
  const [activeDonutIndex, setActiveDonutIndex] = useState(0);
  const showToast = useUiStore((state) => state.showToast);

  const hubKeys = Object.keys(hubBarColors);

  const onDonutEnter = (_data: unknown, index: number) => {
    setActiveDonutIndex(index);
  };

  const onActionClick = (shipmentCode: string) => {
    showToast(`Mở trang xử lý cho đơn ${shipmentCode}.`, 'info');
  };

  return (
    <div className="analytics-dash">
      {/* ---- Header ---- */}
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
            Hệ thống giám sát vận hành thời gian thực — NEXUS Logistics Control Tower
          </p>
        </div>
        <span className="analytics-dash__date-badge">
          Live data · {formatDate()}
        </span>
      </header>

      {/* ---- Key Metrics Row ---- */}
      <section className="analytics-kpi-row" aria-label="Key performance indicators">
        {keyMetrics.map((kpi) => (
          <article
            key={kpi.label}
            className={`analytics-kpi-card analytics-kpi-card--${kpi.accent}`}
          >
            <span className="analytics-kpi-card__label">{kpi.label}</span>
            <div className="analytics-kpi-card__value-row">
              <span className="analytics-kpi-card__value">{kpi.value}</span>
              {kpi.unit ? (
                <span className="analytics-kpi-card__unit">{kpi.unit}</span>
              ) : null}
            </div>
            <span className={`analytics-kpi-card__trend analytics-kpi-card__trend--${kpi.trend}`}>
              {trendArrow(kpi.trend)} {kpi.trendValue}
            </span>
          </article>
        ))}
      </section>

      {/* ---- Charts Row ---- */}
      <section className="analytics-charts-row" aria-label="Charts">
        {/* Bar Chart – Hub Throughput 7 days */}
        <article className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">
            <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--bar" />
            Sản lượng luân chuyển theo Hub — 7 ngày qua
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hubThroughputData} barGap={2} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              {hubKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={hubBarColors[key]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="analytics-bar-legend">
            {hubKeys.map((key) => (
              <span key={key} className="analytics-bar-legend__item">
                <span
                  className="analytics-bar-legend__swatch"
                  style={{ background: hubBarColors[key] }}
                />
                {key}
              </span>
            ))}
          </div>
        </article>

        {/* Donut Chart – NDR Reasons */}
        <article className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">
            <span className="analytics-chart-card__title-dot analytics-chart-card__title-dot--donut" />
            Nguyên nhân giao thất bại (NDR)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                activeIndex={activeDonutIndex}
                activeShape={renderActiveDonutShape}
                data={ndrReasonData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={onDonutEnter}
                stroke="none"
              >
                {ndrReasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      {/* ---- Urgent Alerts Table ---- */}
      <section className="analytics-alerts-section" aria-label="Urgent alerts">
        <div className="analytics-alerts-card">
          <header className="analytics-alerts-card__header">
            <h3 className="analytics-alerts-card__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Cảnh báo cần xử lý gấp
            </h3>
            <span className="analytics-alerts-card__badge">
              {urgentAlerts.length} cảnh báo
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
                <th>Shipper</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {urgentAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span className="analytics-alert-code">{alert.shipmentCode}</span>
                  </td>
                  <td>{alert.issue}</td>
                  <td>{alert.hub}</td>
                  <td>
                    <span className={`analytics-severity analytics-severity--${alert.severity}`}>
                      <span className="analytics-severity__dot" />
                      {severityLabel(alert.severity)}
                    </span>
                  </td>
                  <td>
                    <span className="analytics-elapsed">{alert.elapsedHours}h trước</span>
                  </td>
                  <td>{alert.courier}</td>
                  <td>
                    <button
                      type="button"
                      className="analytics-action-btn"
                      onClick={() => onActionClick(alert.shipmentCode)}
                    >
                      Xử lý ngay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
