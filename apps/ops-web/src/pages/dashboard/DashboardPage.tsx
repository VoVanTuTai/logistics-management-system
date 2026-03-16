import React from 'react';

import { useDashboardKpisQuery } from '../../features/dashboard/dashboard.api';
import { useAuthStore } from '../../store/authStore';

export function DashboardPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const kpiQuery = useDashboardKpisQuery(accessToken);

  return (
    <div>
      <h2>Operations dashboard</h2>
      <p style={{ color: '#2d3f99' }}>
        KPI values are read model data from API. Frontend does not aggregate workflow state.
      </p>
      {kpiQuery.isLoading ? <p>Loading KPI...</p> : null}
      {!kpiQuery.data ? null : (
        <div style={styles.grid}>
          {Object.entries(kpiQuery.data).map(([key, value]) => (
            <article key={key} style={styles.card}>
              <small style={{ color: '#2d3f99' }}>{key}</small>
              <strong style={{ fontSize: 28 }}>{value}</strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  card: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 14,
    display: 'grid',
    gap: 8,
  },
};

