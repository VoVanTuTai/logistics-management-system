import React from 'react';

import type { DashboardMetricPointDto } from '../../../features/dashboard/dashboard.types';
import { formatKpiLabel } from '../../../utils/logisticsLabels';

interface DashboardPieChartProps {
  title: string;
  points: DashboardMetricPointDto[];
}

export function DashboardPieChart({
  title,
  points,
}: DashboardPieChartProps): React.JSX.Element {
  const total = points.reduce((sum, p) => sum + p.value, 0);
  
  const colors = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const gradientParts: string[] = [];
  let accum = 0;
  
  points.forEach((p, i) => {
    const percent = total > 0 ? (p.value / total) * 100 : 0;
    const color = colors[i % colors.length];
    gradientParts.push(`${color} ${accum}% ${accum + percent}%`);
    accum += percent;
  });
  
  const background = total > 0 
    ? `conic-gradient(${gradientParts.join(', ')})` 
    : '#e2e8f0';

  return (
    <article className="ops-card">
      <header className="ops-card__header">
        <h3>{title}</h3>
      </header>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: '160px', height: '160px', borderRadius: '50%', background, flexShrink: 0, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '150px' }}>
          {points.map((point, index) => {
            const percentage = total > 0 ? Math.round((point.value / total) * 100) : 0;
            return (
              <div key={point.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: colors[index % colors.length], display: 'inline-block', borderRadius: '3px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#334155' }}>{formatKpiLabel(point.label)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{point.value}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem' }}>({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
