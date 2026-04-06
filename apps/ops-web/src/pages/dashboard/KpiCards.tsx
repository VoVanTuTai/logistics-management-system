import React from 'react';

import type { DashboardKpiDto } from '../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../utils/logisticsLabels';

interface KpiCardsProps {
  kpis: DashboardKpiDto;
}

export function KpiCards({ kpis }: KpiCardsProps): React.JSX.Element {
  return (
    <div className="ops-kpi-grid">
      {Object.entries(kpis).map(([key, value]) => (
        <article key={key} className="ops-kpi-card">
          <small>{formatKpiLabel(key)}</small>
          <strong>{value ?? 'Khong co'}</strong>
        </article>
      ))}
    </div>
  );
}
