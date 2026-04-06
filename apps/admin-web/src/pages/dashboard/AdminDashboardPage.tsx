import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';

export function AdminDashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);

  const stats = useMemo(
    () => [
      { label: 'Nguoi dung', value: 'Không có' },
      { label: 'Vai tro', value: `${session?.user.roles.length ?? 0}` },
      { label: 'Hub', value: 'Quan ly tai Hub' },
      { label: 'Zone', value: 'Quan ly tai Zone' },
      { label: 'Cau hinh', value: 'Quan ly tai Cau hinh' },
    ],
    [session?.user.roles.length],
  );

  const quickLinks = [
    { label: 'Quan ly tai khoan Ops', to: routePaths.opsUsers },
    { label: 'Quan ly tai khoan Shipper', to: routePaths.shipperUsers },
    { label: 'Quan ly Hub', to: routePaths.masterdataHubs },
    { label: 'Quan ly Zone', to: routePaths.masterdataZones },
    { label: 'Quan ly ly do NDR', to: routePaths.masterdataNdrReasons },
    { label: 'Quan ly cau hinh', to: routePaths.masterdataConfigs },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-dashboard-kicker">Quan tri he thong</p>
          <h2>Tong quan admin</h2>
          <p>Dieu phoi tap trung cho danh muc dung chung va cau hinh cap he thong.</p>
        </div>
        <div className="admin-user-summary">
          <strong>{session?.user.username ?? 'Không có'}</strong>
          <small>vai tro: {(session?.user.roles ?? []).join(', ') || 'Không có'}</small>
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
            <span>Mo module</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

