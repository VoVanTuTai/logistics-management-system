import React from 'react';

import type { DashboardMetricPointDto } from '../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../utils/logisticsLabels';

interface DashboardMetricsTableProps {
  title: string;
  rows: DashboardMetricPointDto[];
}

export function DashboardMetricsTable({
  title,
  rows,
}: DashboardMetricsTableProps): React.JSX.Element {
  return (
    <article className="ops-card">
      <header className="ops-card__header">
        <h3>{title}</h3>
      </header>
      <table className="ops-metrics-table">
        <thead>
          <tr>
            <th>Nhan</th>
            <th>Gia tri</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={`${item.label}-${item.value}`}>
              <td>{formatKpiLabel(item.label)}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
