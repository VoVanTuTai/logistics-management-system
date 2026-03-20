import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';

export function AdminDashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);

  const stats = useMemo(
    () => [
      { label: 'Users', value: 'N/A' },
      { label: 'Roles', value: `${session?.user.roles.length ?? 0}` },
      { label: 'Hubs', value: 'Managed in Hubs' },
      { label: 'Zones', value: 'Managed in Zones' },
      { label: 'Configs', value: 'Managed in Configs' },
    ],
    [session?.user.roles.length],
  );

  const quickLinks = [
    { label: 'Manage Ops Accounts', to: routePaths.opsUsers },
    { label: 'Manage Shipper Accounts', to: routePaths.shipperUsers },
    { label: 'Manage Hubs', to: routePaths.masterdataHubs },
    { label: 'Manage Zones', to: routePaths.masterdataZones },
    { label: 'Manage NDR Reasons', to: routePaths.masterdataNdrReasons },
    { label: 'Manage Configs', to: routePaths.masterdataConfigs },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-dashboard-kicker">System Governance</p>
          <h2>Admin Overview</h2>
          <p>Centralized control for shared catalogs and system-level configuration.</p>
        </div>
        <div className="admin-user-summary">
          <strong>{session?.user.username ?? 'N/A'}</strong>
          <small>roles: {(session?.user.roles ?? []).join(', ') || 'N/A'}</small>
        </div>
      </section>

      <section className="admin-stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="admin-stat-card">
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-link-grid">
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to} className="admin-link-tile">
            <strong>{item.label}</strong>
            <span>Open module</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
