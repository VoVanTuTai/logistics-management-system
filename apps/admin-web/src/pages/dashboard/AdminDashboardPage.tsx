import React from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';

export function AdminDashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p style={styles.subtitle}>
        High-privilege portal for shared masterdata management.
      </p>
      <div style={styles.card}>
        <p>
          <strong>User:</strong> {session?.user.username ?? 'N/A'}
        </p>
        <p>
          <strong>Roles:</strong> {(session?.user.roles ?? []).join(', ') || 'N/A'}
        </p>
      </div>
      <div style={styles.quickLinks}>
        <Link to={routePaths.masterdataHubs}>Manage Hubs</Link>
        <Link to={routePaths.masterdataZones}>Manage Zones</Link>
        <Link to={routePaths.masterdataNdrReasons}>Manage NDR Reasons</Link>
        <Link to={routePaths.masterdataConfigs}>Manage Configs</Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtitle: {
    color: '#2d3f99',
  },
  card: {
    border: '1px solid #d9def3',
    backgroundColor: '#f8faff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quickLinks: {
    display: 'grid',
    gap: 8,
  },
};
