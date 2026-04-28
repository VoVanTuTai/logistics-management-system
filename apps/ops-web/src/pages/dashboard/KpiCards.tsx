import React from 'react';

import type { DashboardKpiDto } from '../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../utils/logisticsLabels';

interface KpiCardsProps {
  kpis: DashboardKpiDto;
}

const KPI_ORDER = [
  'shipmentsCreated',
  'pickupsCompleted',
  'deliveriesDelivered',
  'deliveriesFailed',
  'ndrCreated',
  'scansInbound',
  'scansOutbound',
  'deliveryAttempts',
  'successRate',
  'failureRate',
] as const;

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function KpiCards({ kpis }: KpiCardsProps): React.JSX.Element {
  const entries = KPI_ORDER.map((key) => [key, toNumber(kpis[key])] as const);
  const hasRealData = entries.some(([, value]) => value > 0);

  return (
    <div className="ops-kpi-grid">
      {entries.map(([key, value]) => (
        <article key={key} className="ops-kpi-card">
          <small>{formatKpiLabel(key)}</small>
          <strong>{value}</strong>
        </article>
      ))}
      {!hasRealData ? (
        <p className="ops-kpi-note">
          Chưa có dữ liệu KPI phát sinh theo bộ lọc hiện tại, đang hiển thị giá trị 0.
        </p>
      ) : null}
    </div>
  );
}
