import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import { useLogoutMutation } from '../features/auth/auth.api';
import { hasAdminRole } from '../features/auth/auth.roles';
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminDashboardPage } from '../pages/dashboard/AdminDashboardPage';
import { ConfigManagementPage } from '../pages/masterdata/ConfigManagementPage';
import { HubManagementPage } from '../pages/masterdata/HubManagementPage';
import { NdrReasonManagementPage } from '../pages/masterdata/NdrReasonManagementPage';
import { ZoneManagementPage } from '../pages/masterdata/ZoneManagementPage';

function AdminGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const session = useAuthStore((state) => state.session);

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace />;
  }

  if (!hasAdminRole(session)) {
    return <Navigate to={routePaths.login} replace />;
  }

  return <Outlet />;
}

function AdminLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const logoutMutation = useLogoutMutation(accessToken);

  const onLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <div style={layoutStyles.shell}>
      <header style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>JMS Admin Console</h1>
          <small style={layoutStyles.subtitle}>
            Higher-privilege administration workspace
          </small>
        </div>
        <div style={layoutStyles.userCard}>
          <strong>{session?.user.username ?? 'admin'}</strong>
          <small>roles: {(session?.user.roles ?? []).join(', ')}</small>
          <button type="button" onClick={() => void onLogout()}>
            Logout
          </button>
        </div>
      </header>
      <nav style={layoutStyles.nav}>
        <Link to={routePaths.dashboard}>Overview</Link>
        <Link to={routePaths.masterdataHubs}>Master Data / Hubs</Link>
        <Link to={routePaths.masterdataZones}>Master Data / Zones</Link>
        <Link to={routePaths.masterdataNdrReasons}>Master Data / NDR Reasons</Link>
        <Link to={routePaths.masterdataConfigs}>Master Data / Configs</Link>
      </nav>
      <main style={layoutStyles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export function AppRouter(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route element={<AdminGuard />}>
          <Route path={routePaths.appRoot} element={<AdminLayout />}>
            <Route index element={<Navigate to={routePaths.dashboard} replace />} />
            <Route path={routePaths.dashboardLeaf} element={<AdminDashboardPage />} />
            <Route path={routePaths.masterdataHubsLeaf} element={<HubManagementPage />} />
            <Route path={routePaths.masterdataZonesLeaf} element={<ZoneManagementPage />} />
            <Route
              path={routePaths.masterdataNdrReasonsLeaf}
              element={<NdrReasonManagementPage />}
            />
            <Route
              path={routePaths.masterdataConfigsLeaf}
              element={<ConfigManagementPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const layoutStyles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    padding: '8px 4px',
  },
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#2d3f99',
    marginTop: 4,
    display: 'block',
  },
  userCard: {
    display: 'grid',
    gap: 4,
    padding: 10,
    border: '1px solid #d9def3',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    minWidth: 250,
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #d9def3',
    backgroundColor: '#ffffff',
  },
  main: {
    borderRadius: 14,
    border: '1px solid #e7ebf8',
    backgroundColor: '#ffffff',
    padding: '14px 16px',
    minHeight: 500,
  },
};
