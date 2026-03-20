import React, { useMemo } from 'react';
import {
  BrowserRouter,
  NavLink,
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
import { OpsUsersPage } from '../pages/users/OpsUsersPage';
import { ShipperUsersPage } from '../pages/users/ShipperUsersPage';

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

  const navItems = useMemo(
    () => [
      { label: 'Overview', to: routePaths.dashboard },
      { label: 'Ops Accounts', to: routePaths.opsUsers },
      { label: 'Shipper Accounts', to: routePaths.shipperUsers },
      { label: 'Hubs', to: routePaths.masterdataHubs },
      { label: 'Zones', to: routePaths.masterdataZones },
      { label: 'NDR Reasons', to: routePaths.masterdataNdrReasons },
      { label: 'Configs', to: routePaths.masterdataConfigs },
    ],
    [],
  );

  const onLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <h1>Admin Core</h1>
          <p>System and masterdata governance</p>
        </div>

        <div className="admin-user-card">
          <strong>{session?.user.username ?? 'admin'}</strong>
          <small>roles: {(session?.user.roles ?? []).join(', ')}</small>
          <button type="button" onClick={() => void onLogout()}>
            Logout
          </button>
        </div>

        <nav className="admin-nav-group">
          <h2>Master Data</h2>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <h2>JMS Admin Console</h2>
            <p>Higher-privilege workspace for shared catalogs and system controls.</p>
          </div>
          <span className="admin-tag">SYSTEM_ADMIN</span>
        </header>

        <main className="admin-main-panel">
          <Outlet />
        </main>
      </div>
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
            <Route path={routePaths.opsUsersLeaf} element={<OpsUsersPage />} />
            <Route path={routePaths.shipperUsersLeaf} element={<ShipperUsersPage />} />
            <Route path={routePaths.masterdataHubsLeaf} element={<HubManagementPage />} />
            <Route path={routePaths.masterdataZonesLeaf} element={<ZoneManagementPage />} />
            <Route path={routePaths.masterdataNdrReasonsLeaf} element={<NdrReasonManagementPage />} />
            <Route path={routePaths.masterdataConfigsLeaf} element={<ConfigManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
