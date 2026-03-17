import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ShipmentListPage } from '../pages/shipments/ShipmentListPage';
import { ShipmentDetailPage } from '../pages/shipments/ShipmentDetailPage';
import { PickupApprovalsPage } from '../pages/pickups/PickupApprovalsPage';
import { PickupRequestDetailPage } from '../pages/pickups/PickupRequestDetailPage';
import { TaskAssignmentPage } from '../pages/tasks/TaskAssignmentPage';
import { TaskDetailPage } from '../pages/tasks/TaskDetailPage';
import { ManifestManagementPage } from '../pages/manifests/ManifestManagementPage';
import { ManifestDetailPage } from '../pages/manifests/ManifestDetailPage';
import { HubScanPage } from '../pages/scans/HubScanPage';
import { NdrHandlingPage } from '../pages/ndr/NdrHandlingPage';
import { NdrCaseDetailPage } from '../pages/ndr/NdrCaseDetailPage';
import { TrackingLookupPage } from '../pages/tracking/TrackingLookupPage';
import { TrackingDetailPage } from '../pages/tracking/TrackingDetailPage';

function AuthGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to={routePaths.login} replace />;
}

function DashboardLayout(): React.JSX.Element {
  return (
    <div style={layoutStyles.shell}>
      <header style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Bảng điều khiển JMS Ops</h1>
        <small style={layoutStyles.subtitle}>Bảng điều hành vận hành nội bộ</small>
      </header>
      <nav style={layoutStyles.nav}>
        <Link to={routePaths.dashboard}>Tổng quan</Link>
        <Link to={routePaths.shipments}>Vận đơn</Link>
        <Link to={routePaths.pickups}>Duyệt lấy hàng</Link>
        <Link to={routePaths.tasks}>Phân công</Link>
        <Link to={routePaths.manifests}>Manifest</Link>
        <Link to={routePaths.scans}>Quét hub</Link>
        <Link to={routePaths.ndr}>NDR</Link>
        <Link to={routePaths.tracking}>Tra cứu hành trình</Link>
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
        <Route element={<AuthGuard />}>
          <Route path={routePaths.appRoot} element={<DashboardLayout />}>
            <Route index element={<Navigate to={routePaths.dashboard} replace />} />
            <Route path={routePaths.dashboardLeaf} element={<DashboardPage />} />
            <Route path={routePaths.shipmentsLeaf} element={<ShipmentListPage />} />
            <Route
              path={routePaths.shipmentDetailLeaf}
              element={<ShipmentDetailPage />}
            />
            <Route path={routePaths.pickupsLeaf} element={<PickupApprovalsPage />} />
            <Route
              path={routePaths.pickupDetailLeaf}
              element={<PickupRequestDetailPage />}
            />
            <Route path={routePaths.tasksLeaf} element={<TaskAssignmentPage />} />
            <Route path={routePaths.taskDetailLeaf} element={<TaskDetailPage />} />
            <Route
              path={routePaths.manifestsLeaf}
              element={<ManifestManagementPage />}
            />
            <Route
              path={routePaths.manifestDetailLeaf}
              element={<ManifestDetailPage />}
            />
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

const layoutStyles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    gap: 12,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
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
