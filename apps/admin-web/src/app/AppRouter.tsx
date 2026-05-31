import React, { useMemo } from 'react';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useLogoutMutation } from '../features/auth/auth.api';
import { hasAdminRole } from '../features/auth/auth.roles';
import { getStoredAuthSession } from '../features/auth/auth.session';
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { AdminAuditLogPage } from '../pages/audit/AdminAuditLogPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminDashboardPage } from '../pages/dashboard/AdminDashboardPage';
import { ConfigManagementPage } from '../pages/masterdata/ConfigManagementPage';
import { HubManagementPage } from '../pages/masterdata/HubManagementPage';
import { NdrReasonManagementPage } from '../pages/masterdata/NdrReasonManagementPage';
import { ZoneManagementPage } from '../pages/masterdata/ZoneManagementPage';
import { CourierPermissionMatrixPage } from '../pages/permissions/CourierPermissionMatrixPage';
import { MerchantUsersPage } from '../pages/users/MerchantUsersPage';
import { OpsUsersPage } from '../pages/users/OpsUsersPage';
import { ShipperUsersPage } from '../pages/users/ShipperUsersPage';

function AdminGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'restoring' || (!isAuthenticated && getStoredAuthSession())) {
    return <div className="admin-route-loading">Đang khôi phục phiên đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />;
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
      { label: 'Tổng quan', to: routePaths.dashboard, testId: 'nav-dashboard' },
      { label: 'Tài khoản Ops', to: routePaths.opsUsers, testId: 'nav-users-ops' },
      { label: 'Tài khoản Shipper', to: routePaths.shipperUsers, testId: 'nav-users-shippers' },
      { label: 'Tài khoản Merchant', to: routePaths.merchantUsers, testId: 'nav-users-merchants' },
      { label: 'Phân quyền mobile', to: routePaths.courierPermissions, testId: 'nav-permissions' },
      { label: 'Audit log', to: routePaths.auditLogs, testId: 'nav-audit' },
      { label: 'Hub', to: routePaths.masterdataHubs, testId: 'nav-hubs' },
      { label: 'Zone', to: routePaths.masterdataZones, testId: 'nav-zones' },
      { label: 'Lý do NDR', to: routePaths.masterdataNdrReasons, testId: 'nav-ndr-reasons' },
      { label: 'Cấu hình', to: routePaths.masterdataConfigs, testId: 'nav-configs' },
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
          <h1>Quản trị hệ thống</h1>
          <p>Quản trị hệ thống và dữ liệu danh mục</p>
        </div>

        <div className="admin-user-card">
          <strong>{session?.user.username ?? 'admin'}</strong>
          <small>vai tro: {(session?.user.roles ?? []).join(', ')}</small>
          <button type="button" data-testid="admin-logout" onClick={() => void onLogout()}>
            Đăng xuất
          </button>
        </div>

        <nav className="admin-nav-group">
          <h2>Dữ liệu danh mục</h2>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
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
            <h2>Bảng điều hành NEXUS Admin</h2>
            <p>Khu vực đặc quyền để quản lý danh mục dùng chung và cấu hình hệ thống.</p>
          </div>
          <span className="admin-tag">SYSTEM_ADMIN</span>
        </header>

        <main className="admin-main-panel" data-testid="admin-main">
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
            <Route path={routePaths.merchantUsersLeaf} element={<MerchantUsersPage />} />
            <Route path={routePaths.courierPermissionsLeaf} element={<CourierPermissionMatrixPage />} />
            <Route path={routePaths.auditLogsLeaf} element={<AdminAuditLogPage />} />
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
