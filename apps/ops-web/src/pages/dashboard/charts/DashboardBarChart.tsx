import React from 'react';

import type { DashboardMetricPointDto } from '../../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../../utils/logisticsLabels';

interface DashboardBarChartProps {
  title: string;
  points: DashboardMetricPointDto[];
}

export function DashboardBarChart({
  title,
  points,
}: DashboardBarChartProps): React.JSX.Element {
  const maxValue = points.reduce((max, point) => Math.max(max, point.value), 0);

  return (
    <article className="ops-card">
      <header className="ops-card__header">
        <h3>{title}</h3>
      </header>
      <div className="ops-bar-chart">
        {points.map((point) => {
          const widthPercent = maxValue > 0 ? (point.value / maxValue) * 100 : 0;

          return (
            <div key={`${point.label}-${point.value}`} className="ops-bar-chart__row">
              <span>{formatKpiLabel(point.label)}</span>
              <div className="ops-bar-chart__track">
                <div className="ops-bar-chart__fill" style={{ width: `${widthPercent}%` }} />
              </div>
              <strong>{point.value}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}
