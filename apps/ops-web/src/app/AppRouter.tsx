import React, { useMemo, useState } from 'react';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ManifestDetailPage } from '../pages/manifests/ManifestDetailPage';
import { ManifestManagementPage } from '../pages/manifests/ManifestManagementPage';
import { NdrCaseDetailPage } from '../pages/ndr/NdrCaseDetailPage';
import { NdrHandlingPage } from '../pages/ndr/NdrHandlingPage';
import { PickupApprovalsPage } from '../pages/pickups/PickupApprovalsPage';
import { PickupRequestDetailPage } from '../pages/pickups/PickupRequestDetailPage';
import { HubScanPage } from '../pages/scans/HubScanPage';
import { ShipmentDetailPage } from '../pages/shipments/ShipmentDetailPage';
import { ShipmentListPage } from '../pages/shipments/ShipmentListPage';
import { TaskAssignmentPage } from '../pages/tasks/TaskAssignmentPage';
import { TaskDetailPage } from '../pages/tasks/TaskDetailPage';
import { TrackingDetailPage } from '../pages/tracking/TrackingDetailPage';
import { TrackingLookupPage } from '../pages/tracking/TrackingLookupPage';
import { useLogoutMutation } from '../features/auth/auth.api';
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { formatRoleLabel } from '../utils/logisticsLabels';

function AuthGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to={routePaths.login} replace />;
}

interface NavItem {
  label: string;
  to: string;
}

function DashboardLayout(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation(accessToken);
  const [quickSearchCode, setQuickSearchCode] = useState('');

  const primaryNav = useMemo<NavItem[]>(
    () => [
      { label: 'Tổng quan', to: routePaths.dashboard },
      { label: 'Vận đơn', to: routePaths.shipments },
      { label: 'Duyệt lấy hàng', to: routePaths.pickups },
      { label: 'Phân công tác vụ', to: routePaths.tasks },
      { label: 'Quản lý bao tải', to: routePaths.manifests },
      { label: 'Quét hub', to: routePaths.scans },
      { label: 'Xử lý NDR', to: routePaths.ndr },
      { label: 'Tra cứu hành trình', to: routePaths.tracking },
    ],
    [],
  );

  const roleText =
    (session?.user.roles ?? []).map((role) => formatRoleLabel(role)).join(', ') ||
    'Nhân viên điều hành';

  const onQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = quickSearchCode.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    navigate(routePaths.trackingDetail(normalized));
  };

  const onLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <div className="ops-layout">
      <aside className="ops-sidebar">
        <div>
          <h1>Điều hành OPS</h1>
          <p>Trung tâm vận hành logistics</p>
        </div>

        <div className="ops-sidebar-session">
          <strong>{session?.user.username ?? 'tai_khoan_ops'}</strong>
          <small>Vai tro: {roleText}</small>
          <button
            type="button"
            className="ops-logout-btn"
            disabled={logoutMutation.isPending}
            onClick={() => void onLogout()}
          >
            {logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>

        <nav className="ops-nav-group">
          <h2>Nghiep vu</h2>
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'ops-nav-link ops-nav-link-active' : 'ops-nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="ops-workspace">
        <header className="ops-topbar">
          <div>
            <h2>Bảng điều hành JMS OPS</h2>
            <p>Tac vu nhanh, bo loc linh hoat, theo doi sự kiện theo thoi gian thuc.</p>
          </div>

          <div className="ops-topbar-actions">
            <form onSubmit={onQuickSearch} className="ops-quick-search" role="search">
              <input
                type="text"
                value={quickSearchCode}
                onChange={(event) => setQuickSearchCode(event.target.value)}
                placeholder="Tìm nhanh mã vận đơn"
                aria-label="Tìm nhanh mã vận đơn"
              />
              <button type="submit">Tim</button>
            </form>
            <span className="ops-notify-pill">Thong bao</span>
          </div>
        </header>

        <main className="ops-main-panel">
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
        <Route element={<AuthGuard />}>
          <Route path={routePaths.appRoot} element={<DashboardLayout />}>
            <Route index element={<Navigate to={routePaths.dashboard} replace />} />
            <Route path={routePaths.dashboardLeaf} element={<DashboardPage />} />
            <Route path={routePaths.shipmentsLeaf} element={<ShipmentListPage />} />
            <Route path={routePaths.shipmentDetailLeaf} element={<ShipmentDetailPage />} />
            <Route path={routePaths.pickupsLeaf} element={<PickupApprovalsPage />} />
            <Route path={routePaths.pickupDetailLeaf} element={<PickupRequestDetailPage />} />
            <Route path={routePaths.tasksLeaf} element={<TaskAssignmentPage />} />
            <Route path={routePaths.taskDetailLeaf} element={<TaskDetailPage />} />
            <Route path={routePaths.manifestsLeaf} element={<ManifestManagementPage />} />
            <Route path={routePaths.manifestDetailLeaf} element={<ManifestDetailPage />} />
            <Route path={routePaths.scansLeaf} element={<HubScanPage />} />
            <Route path={routePaths.ndrLeaf} element={<NdrHandlingPage />} />
            <Route path={routePaths.ndrDetailLeaf} element={<NdrCaseDetailPage />} />
            <Route path={routePaths.trackingLeaf} element={<TrackingLookupPage />} />
            <Route path={routePaths.trackingDetailLeaf} element={<TrackingDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
