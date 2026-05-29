import React from 'react';

interface DashboardProgressChartProps {
  title: string;
  value: number;
  total: number;
  color?: string;
  suffix?: string;
}

export function DashboardProgressChart({ 
  title, 
  value, 
  total, 
  color = 'var(--ops-primary)',
  suffix = ''
}: DashboardProgressChartProps): React.JSX.Element {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const background = total > 0 
    ? `conic-gradient(${color} ${percent}%, #e2e8f0 ${percent}%)` 
    : '#e2e8f0';

  return (
    <article className="ops-card">
      <header className="ops-card__header">
        <h3>{title}</h3>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', gap: '1.25rem' }}>
        <div style={{ 
          width: '140px', 
          height: '140px', 
          borderRadius: '50%', 
          background, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            backgroundColor: 'var(--ops-bg, #f8fafc)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color }}>{percent}%</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
            {value.toLocaleString('vi-VN')} {suffix}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            trên tổng số {total.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </article>
  );
}
