import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useLogoutMutation } from '../features/auth/auth.api';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { BasicDataGroupPage } from '../pages/function-groups/basic-data/BasicDataGroupPage';
import { BranchBusinessGroupPage } from '../pages/function-groups/branch-business/BranchBusinessGroupPage';
import { CapabilityPlatformGroupPage } from '../pages/function-groups/capability-platform/CapabilityPlatformGroupPage';
import { CustomerPlatformGroupPage } from '../pages/function-groups/customer-platform/CustomerPlatformGroupPage';
import { DatabaseGroupPage } from '../pages/function-groups/database/DatabaseGroupPage';
import { FinanceSettlementGroupPage } from '../pages/function-groups/finance-settlement/FinanceSettlementGroupPage';
import { IntegrationServicesGroupPage } from '../pages/function-groups/integration-services/IntegrationServicesGroupPage';
import { OperationsMetricsGroupPage } from '../pages/function-groups/operations-metrics/OperationsMetricsGroupPage';
import { OperationsPlatformGroupPage } from '../pages/function-groups/operations-platform/OperationsPlatformGroupPage';
import { MonitorData2In1Page } from '../pages/function-groups/operations-platform/data-monitoring/MonitorData2In1Page';
import { MonitorDataDongBaoPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataDongBaoPage';
import { MonitorDataHangDenPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangDenPage';
import { MonitorDataHangGuiPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangGuiPage';
import { MonitorDataHangNhanPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangNhanPage';
import { MonitorDataHangPhatPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangPhatPage';
import { MonitorDataTheoDoiTamUngPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataTheoDoiTamUngPage';
import { ThermalLabelManagementPage } from '../pages/function-groups/operations-platform/thermal-label/ThermalLabelManagementPage';
import { ThermalLabelPrintPage } from '../pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage';
import { PlanningPlatformGroupPage } from '../pages/function-groups/planning-platform/PlanningPlatformGroupPage';
import { ServiceQualityGroupPage } from '../pages/function-groups/service-quality/ServiceQualityGroupPage';
import { SmartDevicesGroupPage } from '../pages/function-groups/smart-devices/SmartDevicesGroupPage';
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
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { formatRoleLabel } from '../utils/logisticsLabels';

function AuthGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to={routePaths.login} replace />;
}

type SidebarIconName =
  | 'tracking_lookup'
  | 'thermal_label'
  | 'return_block'
  | 'monitor_data'
  | 'proof_management'
  | 'operation_report';

interface TopNavItem {
  label: string;
  to: string;
  isActive: boolean;
}

interface SidebarItem {
  label: string;
  icon: SidebarIconName;
  to?: string;
  kind?: 'default' | 'thermal_label' | 'monitor_data';
}

function pathMatches(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function SidebarIcon({ name }: { name: SidebarIconName }): React.JSX.Element {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'tracking_lookup':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" {...common} />
          <path d="M16.5 16.5 20 20" {...common} />
          <path d="m11 8.5 2 2-2.4 3.2-1.6-1.1Z" {...common} />
        </svg>
      );
    case 'thermal_label':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 6.5h13v11h-13z" {...common} />
          <path d="M8 10h8" {...common} />
          <path d="M8 13.5h8" {...common} />
          <path d="M8 17h5" {...common} />
        </svg>
      );
    case 'return_block':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 8.5h8a4 4 0 0 1 0 8h-8" {...common} />
          <path d="m9 5.5-3 3 3 3" {...common} />
          <path d="M16.5 10.5h3v3h-3z" {...common} />
        </svg>
      );
    case 'monitor_data':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="6.5" width="15" height="10" rx="1.5" {...common} />
          <path d="m10 19.5 2-3 2 3" {...common} />
          <circle cx="12" cy="11.5" r="2.2" {...common} />
        </svg>
      );
    case 'proof_management':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 4.5h8l3 3v12h-11z" {...common} />
          <path d="M14.5 4.5v3h3" {...common} />
          <path d="m8.5 13 2 2 4-4" {...common} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 18.5h11" {...common} />
          <path d="M8.5 18.5v-4" {...common} />
          <path d="M12 18.5v-7" {...common} />
          <path d="M15.5 18.5v-9" {...common} />
          <path d="M6.5 8h11" {...common} />
        </svg>
      );
  }
}

function DashboardLayout(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const logoutMutation = useLogoutMutation(accessToken);
  const [quickSearchCode, setQuickSearchCode] = useState('');

  const roleText =
    (session?.user.roles ?? []).map((role) => formatRoleLabel(role)).join(', ') ||
    'Nhan vien dieu hanh';
  const operatorName = session?.user.username ?? 'OPS User';
  const operatorInitial = operatorName.trim().charAt(0).toUpperCase() || 'O';
  const isDashboardRoute = pathMatches(location.pathname, routePaths.dashboard);

  const topNavItems: TopNavItem[] = [
    {
      label: 'Du lieu co ban',
      to: routePaths.groupBasicData,
      isActive:
        pathMatches(location.pathname, routePaths.groupBasicData) ||
        pathMatches(location.pathname, routePaths.shipments) ||
        pathMatches(location.pathname, routePaths.pickups),
    },
    {
      label: 'Nen tang dieu hanh',
      to: routePaths.groupOperationsPlatform,
      isActive:
        pathMatches(location.pathname, routePaths.groupOperationsPlatform) ||
        pathMatches(location.pathname, routePaths.thermalLabelManagement) ||
        pathMatches(location.pathname, routePaths.thermalLabelPrint) ||
        pathMatches(location.pathname, routePaths.monitorDataRoot) ||
        pathMatches(location.pathname, routePaths.tasks) ||
        pathMatches(location.pathname, routePaths.scans) ||
        pathMatches(location.pathname, routePaths.ndr) ||
        pathMatches(location.pathname, routePaths.tracking),
    },
    {
      label: 'Dich vu tich hop',
      to: routePaths.groupIntegrationServices,
      isActive:
        pathMatches(location.pathname, routePaths.groupIntegrationServices) ||
        pathMatches(location.pathname, routePaths.manifests),
    },
    {
      label: 'Nen tang khach hang',
      to: routePaths.groupCustomerPlatform,
      isActive: pathMatches(location.pathname, routePaths.groupCustomerPlatform),
    },
  ];

  const sidebarItems: SidebarItem[] = [
    { label: 'Tra cuu hanh trinh', icon: 'tracking_lookup', to: routePaths.tracking },
    { label: 'Tem bao in nhiet', icon: 'thermal_label', kind: 'thermal_label' },
    { label: 'Chuyen hoan / Chan kien', icon: 'return_block' },
    { label: 'Giam sat du lieu', icon: 'monitor_data', kind: 'monitor_data' },
    { label: 'Quan ly ky nhan', icon: 'proof_management' },
    { label: 'Bao bieu thao tac', icon: 'operation_report' },
  ];

  const monitorDataChildItems = [
    { label: 'Giam sat hang nhan', to: routePaths.monitorDataHangNhan },
    { label: 'Giam sat hang den', to: routePaths.monitorDataHangDen },
    { label: 'Giam sat hang gui', to: routePaths.monitorDataHangGui },
    { label: 'Giam sat hang phat', to: routePaths.monitorDataHangPhat },
    { label: 'Giam sat 2in1', to: routePaths.monitorData2In1 },
    { label: 'Theo doi tam ung', to: routePaths.monitorDataTheoDoiTamUng },
    { label: 'Giam sat dong bao', to: routePaths.monitorDataDongBao },
  ] as const;
  const thermalLabelChildItems = [
    { label: 'Quan li tem bao', to: routePaths.thermalLabelManagement },
    { label: 'In tem bao', to: routePaths.thermalLabelPrint },
  ] as const;
  const isMonitorDataRoute = monitorDataChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );

  const isThermalLabelRoute =
    pathMatches(location.pathname, routePaths.thermalLabelManagement) ||
    pathMatches(location.pathname, routePaths.thermalLabelPrint);
  const [isThermalLabelSelectOpen, setIsThermalLabelSelectOpen] = useState(
    isThermalLabelRoute,
  );
  const [isMonitorDataPanelOpen, setIsMonitorDataPanelOpen] = useState(isMonitorDataRoute);
  const isSidebarSecondaryOpen = isThermalLabelSelectOpen || isMonitorDataPanelOpen;
  const sidebarSecondaryItems = isThermalLabelSelectOpen
    ? thermalLabelChildItems
    : isMonitorDataPanelOpen
    ? monitorDataChildItems
    : [];
  const sidebarSecondaryTitle = isThermalLabelSelectOpen
    ? 'Tem bao in nhiet'
    : isMonitorDataPanelOpen
    ? 'Giam sat du lieu'
    : '';

  useEffect(() => {
    if (isThermalLabelRoute) {
      setIsThermalLabelSelectOpen(true);
      setIsMonitorDataPanelOpen(false);
    }
    if (isMonitorDataRoute) {
      setIsMonitorDataPanelOpen(true);
      setIsThermalLabelSelectOpen(false);
    }
  }, [isMonitorDataRoute, isThermalLabelRoute]);

  const activeTabLabel = pathMatches(location.pathname, routePaths.tracking)
    ? 'Tra cuu hanh trinh'
    : isMonitorDataRoute
    ? 'Giam sat du lieu'
    : isThermalLabelRoute
    ? 'Tem bao in nhiet'
    : 'Trang chu';

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

  if (isDashboardRoute) {
    return (
      <div className="ops-layout ops-layout--no-sidebar">
        <div className="ops-workspace ops-workspace--full">
          <header className="ops-topbar ops-topbar--full">
            <button
              type="button"
              className="ops-topbar-brand ops-topbar-brand--button"
              onClick={() => navigate(routePaths.dashboard)}
              aria-label="Go to dashboard"
            >
              <span className="ops-topbar-logo">JMS</span>
              <span className="ops-topbar-brand-text">
                <strong>JMS VN</strong>
                <span>jms logistics control tower</span>
              </span>
            </button>

            <div className="ops-topbar-actions">
              <form onSubmit={onQuickSearch} className="ops-topbar-search" role="search">
                <span className="ops-topbar-search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={quickSearchCode}
                  onChange={(event) => setQuickSearchCode(event.target.value)}
                  placeholder="Tra cuu hanh trinh don"
                  aria-label="Tra cuu hanh trinh don"
                />
                <button type="submit" className="ops-topbar-search-submit">
                  Tim
                </button>
              </form>

              <button type="button" className="ops-topbar-icon-btn" aria-label="Thong bao">
                <svg viewBox="0 0 24 24">
                  <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.5c0 .9-.36 1.77-1 2.4l-1.2 1.2h13.4l-1.2-1.2a3.4 3.4 0 0 1-1-2.4V9A4.5 4.5 0 0 0 12 4.5Z" />
                  <path d="M10 17.5a2 2 0 0 0 4 0" />
                </svg>
              </button>

              <div className="ops-topbar-profile" aria-label="Tai khoan">
                <span className="ops-topbar-avatar">{operatorInitial}</span>
                <span className="ops-topbar-user">{operatorName}</span>
                <span className="ops-topbar-role">{roleText}</span>
              </div>

              <button
                type="button"
                className="ops-logout-inline"
                disabled={logoutMutation.isPending}
                onClick={() => void onLogout()}
              >
                {logoutMutation.isPending ? 'Dang dang xuat...' : 'Dang xuat'}
              </button>
            </div>
          </header>

          <main className="ops-main-panel ops-main-panel--flat">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="ops-func-shell">
      <header className="ops-func-header">
        <div className="ops-func-logo">JMS VN</div>

        <nav className="ops-func-main-nav" aria-label="Main navigation">
          {topNavItems.map((item) => {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.to)}
                className={item.isActive ? 'ops-func-main-link ops-func-main-link--active' : 'ops-func-main-link'}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ops-func-actions">
          <form onSubmit={onQuickSearch} className="ops-func-search" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="text"
              value={quickSearchCode}
              onChange={(event) => setQuickSearchCode(event.target.value)}
              placeholder="Tra cuu hanh trinh don"
              aria-label="Tra cuu hanh trinh don"
            />
          </form>

          <button type="button" className="ops-func-bell" aria-label="Thong bao">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.5c0 .9-.36 1.77-1 2.4l-1.2 1.2h13.4l-1.2-1.2a3.4 3.4 0 0 1-1-2.4V9A4.5 4.5 0 0 0 12 4.5Z" />
              <path d="M10 17.5a2 2 0 0 0 4 0" />
            </svg>
          </button>

          <div className="ops-func-user" aria-label="Tai khoan">
            <span className="ops-func-user-avatar">{operatorInitial}</span>
            <span className="ops-func-user-name">{operatorName}</span>
          </div>
        </div>
      </header>

      <div className="ops-func-body">
        <aside
          className={
            isSidebarSecondaryOpen
              ? 'ops-func-sidebar ops-func-sidebar--expanded'
              : 'ops-func-sidebar'
          }
        >
          <label className="ops-func-sidebar-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input type="text" placeholder="Tra cuu menu" aria-label="Tra cuu menu" />
          </label>

          <div className="ops-func-sidebar-title">
            <span />
            Nen tang dieu hanh
          </div>

          <nav
            className={
              isSidebarSecondaryOpen
                ? 'ops-func-sidebar-nav ops-func-sidebar-nav--two-cols'
                : 'ops-func-sidebar-nav'
            }
            aria-label="Sidebar navigation"
          >
            <div className="ops-func-sidebar-primary-list">
              {sidebarItems.map((item) => {
                const isActive =
                  item.kind === 'thermal_label'
                    ? isThermalLabelRoute
                    : item.kind === 'monitor_data'
                    ? isMonitorDataRoute
                    : item.to
                    ? pathMatches(location.pathname, item.to)
                    : false;

                if (item.kind === 'thermal_label') {
                  return (
                    <div key={item.label} className="ops-func-sidebar-group">
                      <button
                        type="button"
                        onClick={() => {
                          setIsThermalLabelSelectOpen((isOpen) => !isOpen);
                          setIsMonitorDataPanelOpen(false);
                        }}
                        className={
                          isActive
                            ? 'ops-func-sidebar-item ops-func-sidebar-item--active'
                            : 'ops-func-sidebar-item'
                        }
                      >
                        <span className="ops-func-sidebar-icon">
                          <SidebarIcon name={item.icon} />
                        </span>
                        <span className="ops-func-sidebar-label">{item.label}</span>
                        <span className="ops-func-sidebar-chevron" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d={isThermalLabelSelectOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} />
                          </svg>
                        </span>
                      </button>
                    </div>
                  );
                }

                if (item.kind === 'monitor_data') {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setIsMonitorDataPanelOpen((isOpen) => !isOpen);
                        setIsThermalLabelSelectOpen(false);
                      }}
                      className={
                        isActive
                          ? 'ops-func-sidebar-item ops-func-sidebar-item--active'
                          : 'ops-func-sidebar-item'
                      }
                    >
                      <span className="ops-func-sidebar-icon">
                        <SidebarIcon name={item.icon} />
                      </span>
                      <span className="ops-func-sidebar-label">{item.label}</span>
                      <span className="ops-func-sidebar-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d={isMonitorDataPanelOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} />
                        </svg>
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.to) {
                        navigate(item.to);
                      }
                    }}
                    className={
                      isActive
                        ? 'ops-func-sidebar-item ops-func-sidebar-item--active'
                        : 'ops-func-sidebar-item'
                    }
                  >
                    <span className="ops-func-sidebar-icon">
                      <SidebarIcon name={item.icon} />
                    </span>
                    <span className="ops-func-sidebar-label">{item.label}</span>
                    <span className="ops-func-sidebar-chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="m7 10 5 5 5-5" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>

            {isSidebarSecondaryOpen ? (
              <div className="ops-func-sidebar-secondary-list">
                <p className="ops-func-sidebar-secondary-title">{sidebarSecondaryTitle}</p>
                {sidebarSecondaryItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    className={
                      pathMatches(location.pathname, item.to)
                        ? 'ops-func-sidebar-secondary-item ops-func-sidebar-secondary-item--active'
                        : 'ops-func-sidebar-secondary-item'
                    }
                    onClick={() => navigate(item.to)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </nav>
        </aside>

        <main className="ops-func-main">
          <div className="ops-func-tabs" role="tablist" aria-label="Tabs">
            <button type="button" className="ops-func-tab ops-func-tab--active" role="tab" aria-selected="true">
              {activeTabLabel}
            </button>
          </div>

          <section className="ops-func-canvas">
            <Outlet />
          </section>
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
            <Route path={routePaths.groupBasicDataLeaf} element={<BasicDataGroupPage />} />
            <Route
              path={routePaths.groupOperationsPlatformLeaf}
              element={<OperationsPlatformGroupPage />}
            />
            <Route
              path={routePaths.thermalLabelManagementLeaf}
              element={<ThermalLabelManagementPage />}
            />
            <Route
              path={routePaths.thermalLabelPrintLeaf}
              element={<ThermalLabelPrintPage />}
            />
            <Route
              path={routePaths.monitorDataHangNhanLeaf}
              element={<MonitorDataHangNhanPage />}
            />
            <Route
              path={routePaths.monitorDataHangDenLeaf}
              element={<MonitorDataHangDenPage />}
            />
            <Route
              path={routePaths.monitorDataHangGuiLeaf}
              element={<MonitorDataHangGuiPage />}
            />
            <Route
              path={routePaths.monitorDataHangPhatLeaf}
              element={<MonitorDataHangPhatPage />}
            />
            <Route path={routePaths.monitorData2In1Leaf} element={<MonitorData2In1Page />} />
            <Route
              path={routePaths.monitorDataTheoDoiTamUngLeaf}
              element={<MonitorDataTheoDoiTamUngPage />}
            />
            <Route
              path={routePaths.monitorDataDongBaoLeaf}
              element={<MonitorDataDongBaoPage />}
            />
            <Route
              path={routePaths.groupIntegrationServicesLeaf}
              element={<IntegrationServicesGroupPage />}
            />
            <Route
              path={routePaths.groupCustomerPlatformLeaf}
              element={<CustomerPlatformGroupPage />}
            />
            <Route
              path={routePaths.groupBranchBusinessLeaf}
              element={<BranchBusinessGroupPage />}
            />
            <Route
              path={routePaths.groupFinanceSettlementLeaf}
              element={<FinanceSettlementGroupPage />}
            />
            <Route
              path={routePaths.groupCapabilityPlatformLeaf}
              element={<CapabilityPlatformGroupPage />}
            />
            <Route
              path={routePaths.groupOperationsMetricsLeaf}
              element={<OperationsMetricsGroupPage />}
            />
            <Route
              path={routePaths.groupServiceQualityLeaf}
              element={<ServiceQualityGroupPage />}
            />
            <Route path={routePaths.groupDatabaseLeaf} element={<DatabaseGroupPage />} />
            <Route path={routePaths.groupSmartDevicesLeaf} element={<SmartDevicesGroupPage />} />
            <Route
              path={routePaths.groupPlanningPlatformLeaf}
              element={<PlanningPlatformGroupPage />}
            />
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


