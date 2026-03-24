import React from 'react';

import type { DashboardMetricPointDto } from '../../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../../utils/logisticsLabels';

interface DashboardTrendChartProps {
  title: string;
  points: DashboardMetricPointDto[];
}

function buildPolyline(points: DashboardMetricPointDto[]): string {
  if (points.length === 0) {
    return '';
  }

  const maxValue = points.reduce((max, point) => Math.max(max, point.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100;

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = 100 - (point.value / safeMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

export function DashboardTrendChart({
  title,
  points,
}: DashboardTrendChartProps): React.JSX.Element {
  return (
    <article className="ops-card">
      <header className="ops-card__header">
        <h3>{title}</h3>
      </header>
      <div className="ops-trend-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={buildPolyline(points)} />
        </svg>
      </div>
      <div className="ops-trend-labels">
        {points.map((point) => (
          <span key={`${point.label}-${point.value}`}>
            {formatKpiLabel(point.label)}: {point.value}
          </span>
        ))}
      </div>
    </article>
  );
}
