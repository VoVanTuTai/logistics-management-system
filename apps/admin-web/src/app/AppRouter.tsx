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

  const accountNavItems = useMemo(
    () => [
      { label: 'Tài khoản Ops', to: routePaths.opsUsers, testId: 'nav-users-ops', icon: 'badge' },
      { label: 'Tài khoản Shipper', to: routePaths.shipperUsers, testId: 'nav-users-shippers', icon: 'two_wheeler' },
      { label: 'Tài khoản Merchant', to: routePaths.merchantUsers, testId: 'nav-users-merchants', icon: 'storefront' },
      { label: 'Phân quyền Mobile', to: routePaths.courierPermissions, testId: 'nav-permissions', icon: 'admin_panel_settings' },
      { label: 'Nhật ký Audit Log', to: routePaths.auditLogs, testId: 'nav-audit', icon: 'receipt_long' },
    ],
    [],
  );

  const masterdataNavItems = useMemo(
    () => [
      { label: 'Tổng quan hệ thống', to: routePaths.dashboard, testId: 'nav-dashboard', icon: 'dashboard' },
      { label: 'Quản lý Hub & 3 Miền', to: routePaths.masterdataHubs, testId: 'nav-hubs', icon: 'hub' },
      { label: 'Quản lý Zone Vùng', to: routePaths.masterdataZones, testId: 'nav-zones', icon: 'map' },
      { label: 'Lý do lỗi NDR', to: routePaths.masterdataNdrReasons, testId: 'nav-ndr-reasons', icon: 'report_problem' },
      { label: 'Cấu hình tham số', to: routePaths.masterdataConfigs, testId: 'nav-configs', icon: 'tune' },
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
        <div className="admin-brand-header">
          <div className="admin-brand-logo">NEXUS</div>
          <div>
            <h1>Admin Portal</h1>
            <p>Quản trị hệ thống & Dữ liệu danh mục</p>
          </div>
        </div>

        <div className="admin-user-card">
          <div className="admin-user-avatar">
            {(session?.user.username ?? 'A')[0].toUpperCase()}
          </div>
          <div className="admin-user-info">
            <strong>{session?.user.username ?? 'admin'}</strong>
            <small>{(session?.user.roles ?? ['SYSTEM_ADMIN']).join(', ')}</small>
          </div>
          <button type="button" data-testid="admin-logout" className="admin-logout-btn" onClick={() => void onLogout()}>
            Đăng xuất
          </button>
        </div>

        <nav className="admin-nav-group">
          <h2>Tổng quan & Danh mục Vận hành</h2>
          {masterdataNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              className={({ isActive }) =>
                isActive ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'
              }
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <nav className="admin-nav-group" style={{ marginTop: 12 }}>
          <h2>Quản trị Dân cư & Phân quyền</h2>
          {accountNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              className={({ isActive }) =>
                isActive ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'
              }
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <h2>Trung Tâm Điều Hành Quản Trị Hệ Thống NEXUS</h2>
            <p>Khu vực quản lý danh mục toàn quốc, tài khoản người dùng và cấu hình dịch vụ dùng chung.</p>
          </div>
          <div className="admin-topbar-badges">
            <span className="admin-tag">⚡ SYSTEM_ADMIN</span>
          </div>
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
