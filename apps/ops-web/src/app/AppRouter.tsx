import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const OPS_ACTIVE_ROUTE_KEY = 'nexus_ops_active_route';
const isTestEnv = Boolean(import.meta.env.TEST || import.meta.env.MODE === 'test');

function resolveInitialOpsRoute(): string {
  if (typeof window === 'undefined') {
    return routePaths.dashboard;
  }
  if (isTestEnv) {
    const testPath = window.location.pathname;
    if (testPath && testPath !== '/') {
      return testPath + window.location.search;
    }
    return routePaths.dashboard;
  }
  try {
    const session = getStoredAuthSession();
    if (!session?.tokens?.accessToken) {
      return routePaths.login;
    }
    const saved = sessionStorage.getItem(OPS_ACTIVE_ROUTE_KEY);
    if (saved && (saved.startsWith('/app') || saved === routePaths.dashboard)) {
      return saved;
    }
    return routePaths.dashboard;
  } catch {
    return routePaths.dashboard;
  }
}

function OpsRoutePersistenceSync(): null {
  const location = useLocation();

  useEffect(() => {
    if (isTestEnv || typeof window === 'undefined') {
      return;
    }
    if (location.pathname.startsWith('/app')) {
      try {
        sessionStorage.setItem(OPS_ACTIVE_ROUTE_KEY, location.pathname + location.search);
      } catch {}
    }
    // Mask browser address bar so it never exposes /app/function-groups/ or internal routes
    if (window.location.pathname !== '/' && window.location.pathname !== routePaths.login) {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
    }
  }, [location.pathname, location.search]);

  return null;
}

import { useLogoutMutation } from '../features/auth/auth.api';
import { getStoredAuthSession } from '../features/auth/auth.session';
import { GlobalChatBubble } from '../features/chat/GlobalChatBubble';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ComingSoonPlaceholder } from '../pages/shared/ComingSoonPlaceholder';
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { useHubsQuery } from '../features/masterdata/masterdata.api';
import { appEnv } from '../utils/env';
import { formatHubFullAddress } from '../utils/locationScope';
import { formatRoleLabel } from '../utils/logisticsLabels';
import { OpsUserAccountMenu } from '../features/auth/components/OpsUserAccountMenu';
import { NexusBrandLogo } from './NexusBrandLogo';
import {
  Globe2,
  MessageSquare,
  Search,
  Printer,
  RotateCcw,
  TrendingUp,
  FileCheck,
  BarChart3,
  FileSearch,
  Activity,
  Headphones,
  Scale,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Layers,
  CheckSquare,
  Navigation,
  Store,
  Receipt,
  Truck,
  Download,
  Package,
  Building2,
  MapPin,
  Bell,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Map,
  Building,
} from 'lucide-react';

function safeDynamicImport<T>(importer: () => Promise<T>): Promise<T> {
  return importer().catch((error: unknown) => {
    const message = (error as Error)?.message || String(error);
    const isChunkLoadFailed =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('Importing a module script failed') ||
      (error as { name?: string })?.name === 'ChunkLoadError';

    if (isChunkLoadFailed && typeof window !== 'undefined') {
      const storageKey = 'ops_chunk_reload_timestamp';
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Only auto-reload if not reloaded within the last 15 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(storageKey, String(now));
        console.warn('[ChunkRetry] New deployment detected or chunk failed to load. Reloading application...');
        window.location.reload();
        // Return a pending promise so React Suspense waits for page reload without throwing
        return new Promise<never>(() => {});
      }
    }

    throw error;
  });
}

function lazyRoutePage<T extends React.ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    safeDynamicImport(loader).then((module) => ({
      default: module[exportName],
    })),
  );
}

import { SCOPE_OPTIONS, resolveAllowedScopes, resolveOpsTier, useOpsScopeStore, type ScopeLevel } from '../store/opsScopeStore';
import { canAccessOpsFeature, resolveOpsActor } from '../features/permissions/opsPermissions';
import { useHubScope } from '../hooks/useHubScope';

function OpsTierIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  if (icon === 'public') return <Globe2 size={size} />;
  if (icon === 'map') return <Map size={size} />;
  if (icon === 'location_city') return <Building size={size} />;
  return <Building2 size={size} />;
}

const MasterOpsCommandCenterPage = lazy(() =>
  safeDynamicImport(() => import('../pages/dashboard/MasterOpsCommandCenterPage')).then((module) => ({
    default: module.MasterOpsCommandCenterPage,
  })),
);
const HqNetworkGeofenceMapPage = lazy(() =>
  safeDynamicImport(() => import('../pages/dashboard/HqNetworkGeofenceMapPage')).then((module) => ({
    default: module.HqNetworkGeofenceMapPage,
  })),
);
const DownloadCenterPage = lazy(() =>
  safeDynamicImport(() => import('../pages/download/DownloadCenterPage')).then((module) => ({
    default: module.DownloadCenterPage,
  })),
);
const CourierTaskTransferPage = lazy(() =>
  safeDynamicImport(() => import('../pages/function-groups/operations-platform/transfer/CourierTaskTransferPage')).then((module) => ({
    default: module.CourierTaskTransferPage,
  })),
);
const AnalyticsDashboardPage = lazy(() =>
  safeDynamicImport(() => import('../pages/dashboard/analytics/AnalyticsDashboardPage')).then((module) => ({
    default: module.AnalyticsDashboardPage,
  })),
);
const BranchDeliveryDispatchPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/delivery-dispatch/BranchDeliveryDispatchPage'),
  'BranchDeliveryDispatchPage',
);
const BranchBusinessOrderCreatePage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/order-create/BranchBusinessOrderCreatePage'),
  'BranchBusinessOrderCreatePage',
);
const BranchFinanceCodSettlementPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage'),
  'BranchFinanceCodSettlementPage',
);
const BranchFinanceReconcilePage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/finance-reconcile/BranchFinanceReconcilePage'),
  'BranchFinanceReconcilePage',
);
const BranchShiftClosingPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/shift-closing/BranchShiftClosingPage'),
  'BranchShiftClosingPage',
);
const CapabilityPlatformGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/capability-platform/CapabilityPlatformGroupPage'),
  'CapabilityPlatformGroupPage',
);
const CustomerOrderDispatchPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/pickup-dispatch/CustomerOrderDispatchPage'),
  'CustomerOrderDispatchPage',
);
const DatabaseGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/database/DatabaseGroupPage'),
  'DatabaseGroupPage',
);
const OperationsMetricsGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-metrics/OperationsMetricsGroupPage'),
  'OperationsMetricsGroupPage',
);
const OpsMetricsInventoryMonitorPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-metrics/deadline/OpsMetricsInventoryMonitorPage'),
  'OpsMetricsInventoryMonitorPage',
);
const OperationsMetricsDerivedRoutePage = lazyRoutePage(
  () => import('../pages/function-groups/operations-metrics/shared/OperationsMetricsDerivedRoutePage'),
  'OperationsMetricsDerivedRoutePage',
);
const OperationsReportPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-metrics/report/OperationsReportPage'),
  'OperationsReportPage',
);
const OperationsPlatformGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/OperationsPlatformGroupPage'),
  'OperationsPlatformGroupPage',
);
const MonitorDataDongBaoPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataDongBaoPage'),
  'MonitorDataDongBaoPage',
);
const MonitorDataHangDenPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangDenPage'),
  'MonitorDataHangDenPage',
);
const MonitorDataHangGuiPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangGuiPage'),
  'MonitorDataHangGuiPage',
);
const MonitorDataHangPhatPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangPhatPage'),
  'MonitorDataHangPhatPage',
);
const ReturnBlockManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/return-block/ReturnBlockManagementPage'),
  'ReturnBlockManagementPage',
);
const ReturnBlockRegistrationPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/return-block/ReturnBlockRegistrationPage'),
  'ReturnBlockRegistrationPage',
);
const ThermalLabelManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/thermal-label/ThermalLabelManagementPage'),
  'ThermalLabelManagementPage',
);
const ThermalLabelPrintPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage'),
  'ThermalLabelPrintPage',
);
const LinehaulTripManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/linehaul/LinehaulTripManagementPage'),
  'LinehaulTripManagementPage',
);
const LinehaulVehicleSealPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/linehaul/LinehaulVehicleSealPage'),
  'LinehaulVehicleSealPage',
);
const LinehaulTripDataMonitorPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/linehaul/LinehaulTripDataMonitorPage'),
  'LinehaulTripDataMonitorPage',
);
const PlanningPlatformGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/planning-platform/PlanningPlatformGroupPage'),
  'PlanningPlatformGroupPage',
);
const ServiceQualityGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/ServiceQualityGroupPage'),
  'ServiceQualityGroupPage',
);
const ServiceQualityIntegratedLookupPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/lookup/ServiceQualityIntegratedLookupPage'),
  'ServiceQualityIntegratedLookupPage',
);
const ServiceQualityAbnormalManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/abnormal/ServiceQualityAbnormalManagementPage'),
  'ServiceQualityAbnormalManagementPage',
);
const ServiceQualityActionBoardPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/proactive/ServiceQualityActionBoardPage'),
  'ServiceQualityActionBoardPage',
);
const StrayShipmentInvestigationPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/investigation/StrayShipmentInvestigationPage'),
  'StrayShipmentInvestigationPage',
);
const ClaimsLiabilityManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/claims/ClaimsLiabilityManagementPage'),
  'ClaimsLiabilityManagementPage',
);
const CustomerServiceTicketsPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/cskh/CustomerServiceTicketsPage'),
  'CustomerServiceTicketsPage',
);
const HubCompensationStatisticsPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/claims/HubCompensationStatisticsPage'),
  'HubCompensationStatisticsPage',
);
const SmartDevicesGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/smart-devices/SmartDevicesGroupPage'),
  'SmartDevicesGroupPage',
);

const NdrCaseDetailPage = lazyRoutePage(
  () => import('../pages/ndr/NdrCaseDetailPage'),
  'NdrCaseDetailPage',
);
const NdrHandlingPage = lazyRoutePage(
  () => import('../pages/ndr/NdrHandlingPage'),
  'NdrHandlingPage',
);
const HubScanPage = lazyRoutePage(
  () => import('../pages/scans/HubScanPage'),
  'HubScanPage',
);
const ShipmentDetailPage = lazyRoutePage(
  () => import('../pages/shipments/ShipmentDetailPage'),
  'ShipmentDetailPage',
);
const ShipmentListPage = lazyRoutePage(
  () => import('../pages/shipments/ShipmentListPage'),
  'ShipmentListPage',
);
const TaskDetailPage = lazyRoutePage(
  () => import('../pages/tasks/TaskDetailPage'),
  'TaskDetailPage',
);
const CourierAreaAssignmentPage = lazyRoutePage(
  () => import('../pages/tasks/CourierAreaAssignmentPage'),
  'CourierAreaAssignmentPage',
);
const OpsCourierChatPage = lazyRoutePage(
  () => import('../pages/chat/OpsCourierChatPage'),
  'OpsCourierChatPage',
);
const TrackingDetailPage = lazyRoutePage(
  () => import('../pages/tracking/TrackingDetailPage'),
  'TrackingDetailPage',
);
const TrackingLookupPage = lazyRoutePage(
  () => import('../pages/tracking/TrackingLookupPage'),
  'TrackingLookupPage',
);

function AuthGuard(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'restoring' || (!isAuthenticated && getStoredAuthSession())) {
    return <RouteLoadingFallback />;
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to={routePaths.login} replace state={{ from: location }} />;
}

function RouteLoadingFallback(): React.JSX.Element {
  return <div className="ops-route-loading">Đang tải...</div>;
}

function OpsModuleRoute({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  if (!appEnv.enableFullOpsModules) {
    return (
      <ComingSoonPlaceholder
        title={title}
        description="Module này là một phần của Ops Web production roadmap và đang tắt trong cấu hình core-only hiện tại."
        visionText="Đặt VITE_ENABLE_FULL_OPS_MODULES=true hoặc bỏ trống biến này để hiển thị đầy đủ các luồng nghiệp vụ."
        phaseLabel="Full module disabled"
        badgeLabel="Disabled"
      />
    );
  }

  return <>{children}</>;
}

type SidebarIconName =
  | 'hq_command'
  | 'tracking_lookup'
  | 'chat'
  | 'thermal_label'
  | 'return_block'
  | 'monitor_data'
  | 'proof_management'
  | 'operation_report'
  | 'service_lookup'
  | 'service_proactive'
  | 'service_care'
  | 'service_weight'
  | 'service_abnormal'
  | 'metrics_abnormal'
  | 'metrics_deadline'
  | 'metrics_planning'
  | 'metrics_action'
  | 'shipment_dispatch'
  | 'branch_order_management'
  | 'branch_finance_settlement'
  | 'linehaul_transport'
  | 'download';

type SidebarPanelKind =
  | 'return_block'
  | 'monitor_data'
  | 'shipment_dispatch'
  | 'branch_finance_settlement'
  | 'linehaul_transport';

interface TopNavItem {
  id: string;
  label: string;
  to: string;
  icon?: SidebarIconName;
  isActive: boolean;
}

interface SidebarItem {
  label: string;
  icon: SidebarIconName;
  to?: string;
  kind?: SidebarPanelKind;
  sectionLabel?: string;
}

function pathMatches(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isRouteOrTabActive(currentPath: string, currentSearch: string, targetTo: string): boolean {
  const [targetPath, targetQuery] = targetTo.split('?');
  if (!pathMatches(currentPath, targetPath)) {
    return false;
  }
  if (!targetQuery) {
    return true;
  }
  const currentParams = new URLSearchParams(currentSearch);
  const targetParams = new URLSearchParams(targetQuery);
  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }
  return true;
}

function SidebarIcon({
  name,
  size = 17,
  className,
}: {
  name: SidebarIconName;
  size?: number;
  className?: string;
}): React.JSX.Element {
  const props = { size, strokeWidth: 1.8, className, 'aria-hidden': true };

  switch (name) {
    case 'hq_command':
      return <Globe2 {...props} />;
    case 'chat':
      return <MessageSquare {...props} />;
    case 'tracking_lookup':
      return <Search {...props} />;
    case 'thermal_label':
      return <Printer {...props} />;
    case 'return_block':
      return <RotateCcw {...props} />;
    case 'monitor_data':
      return <TrendingUp {...props} />;
    case 'proof_management':
      return <FileCheck {...props} />;
    case 'operation_report':
      return <BarChart3 {...props} />;
    case 'service_lookup':
      return <FileSearch {...props} />;
    case 'service_proactive':
      return <Activity {...props} />;
    case 'service_care':
      return <Headphones {...props} />;
    case 'service_weight':
      return <Scale {...props} />;
    case 'service_abnormal':
      return <AlertTriangle {...props} />;
    case 'metrics_abnormal':
      return <AlertOctagon {...props} />;
    case 'metrics_deadline':
      return <Clock {...props} />;
    case 'metrics_planning':
      return <Layers {...props} />;
    case 'metrics_action':
      return <CheckSquare {...props} />;
    case 'shipment_dispatch':
      return <Navigation {...props} />;
    case 'branch_order_management':
      return <Store {...props} />;
    case 'branch_finance_settlement':
      return <Receipt {...props} />;
    case 'linehaul_transport':
      return <Truck {...props} />;
    case 'download':
      return <Download {...props} />;
    default:
      return <Package {...props} />;
  }
}


function DashboardLayout(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const logoutMutation = useLogoutMutation(accessToken);
  const [quickSearchCode, setQuickSearchCode] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const roleText =
    (session?.user.roles ?? []).map((role) => formatRoleLabel(role)).join(', ') ||
    'Nhân viên điều hành';
  const enableFullOpsModules = appEnv.enableFullOpsModules;
  const operatorName = session?.user.username ?? 'OPS User';
  const operatorInitial = operatorName.trim().charAt(0).toUpperCase() || 'O';

  const scopeLevel = useOpsScopeStore((state) => state.scopeLevel);
  const setScopeLevel = useOpsScopeStore((state) => state.setScopeLevel);

  const opsTierMeta = useMemo(() => {
    return resolveOpsTier(
      session?.user.username,
      session?.user.roles,
      session?.user.hubCodes,
    );
  }, [session?.user.username, session?.user.roles, session?.user.hubCodes]);

  const allowedScopes = useMemo(() => {
    return resolveAllowedScopes(
      session?.user.username,
      session?.user.roles,
      session?.user.hubCodes,
    );
  }, [session?.user.username, session?.user.roles, session?.user.hubCodes]);

  useEffect(() => {
    if (opsTierMeta.tier === 'HQ') {
      if (scopeLevel !== 'NATIONWIDE') setScopeLevel('NATIONWIDE');
    } else if (opsTierMeta.tier === 'REGION') {
      const isNorth = (session?.user.username ?? '').includes('1') || (session?.user.username ?? '').includes('4');
      const isCentral = (session?.user.username ?? '').includes('2') || (session?.user.username ?? '').includes('5');
      const target = isNorth ? 'REGION_NORTH' : isCentral ? 'REGION_CENTRAL' : 'REGION_SOUTH';
      if (scopeLevel !== target) setScopeLevel(target);
    } else if (opsTierMeta.tier === 'PROVINCE') {
      if (scopeLevel !== 'PROVINCE') setScopeLevel('PROVINCE');
    } else if (opsTierMeta.tier === 'WARD') {
      if (scopeLevel !== 'HUB') setScopeLevel('HUB');
    }
  }, [opsTierMeta.tier, session?.user.username, setScopeLevel]);

  const hubsQuery = useHubsQuery(accessToken, {});
  const primaryHubCode = (session?.user.hubCodes ?? [])[0] ?? '';
  const currentOperatorHub = useMemo(() => {
    const list = hubsQuery.data ?? [];
    if (!primaryHubCode) {
      return list[0] ?? null;
    }
    const norm = primaryHubCode.trim().toUpperCase();
    return list.find((h) => h.code.trim().toUpperCase() === norm) ?? list[0] ?? null;
  }, [hubsQuery.data, primaryHubCode]);

  const currentOperatorHubAddress = useMemo(() => {
    return formatHubFullAddress(currentOperatorHub);
  }, [currentOperatorHub]);
  const isDashboardRoute = pathMatches(location.pathname, routePaths.dashboard)
    || pathMatches(location.pathname, routePaths.analyticsDashboard)
    || location.pathname.startsWith('/app/coming-soon');

  const hubScope = useHubScope();
  const canViewHq = canAccessOpsFeature(session?.user, 'nav.hq-command-center');
  const canViewBranch = canAccessOpsFeature(session?.user, 'nav.branch-business');
  const canViewFleet = canAccessOpsFeature(session?.user, 'nav.linehaul-fleet-control');

  interface ClusterMenuItem {
    label: string;
    icon: SidebarIconName;
    to: string;
    keywords: string;
  }

  interface MenuCluster {
    id: string;
    label: string;
    shortLabel: string;
    colorTheme: 'hq' | 'warehouse' | 'dispatch' | 'linehaul' | 'quality' | 'finance' | 'analytics' | 'planning';
    icon: SidebarIconName;
    to: string;
    visible?: boolean;
    items: ClusterMenuItem[];
  }

  const menuClusters: MenuCluster[] = useMemo(
    () => [
      ...(canViewHq
        ? [
            {
              id: 'hq',
              label: 'Chỉ huy & Mạng lưới HQ',
              shortLabel: 'Chỉ huy HQ',
              colorTheme: 'hq' as const,
              icon: 'hq_command' as const,
              to: routePaths.masterOpsCommandCenter,
              visible: canViewHq,
              items: [
                {
                  label: 'Trung tâm chỉ huy HQ',
                  icon: 'hq_command' as const,
                  to: routePaths.masterOpsCommandCenter,
                  keywords: 'chi huy hq command center vi mo bac trung nam',
                },
                {
                  label: 'Bản đồ Mạng lưới & Hub',
                  icon: 'tracking_lookup' as const,
                  to: routePaths.masterdataHubNetworkMap,
                  keywords: 'ban do mang luoi hub geofence phan vung',
                },
                {
                  label: 'Báo cáo Vận hành & KPI',
                  icon: 'operation_report' as const,
                  to: routePaths.opsMetricsReport,
                  keywords: 'bao cao van hanh kpi san luong',
                },
                {
                  label: 'Quy hoạch & Dự báo tải',
                  icon: 'metrics_planning' as const,
                  to: routePaths.groupPlanningPlatform,
                  keywords: 'quy hoach du bao tai san luong mua sale',
                },
              ],
            },
          ]
        : []),
      {
        id: 'branch_warehouse',
        label: 'Bưu cục & Quầy',
        shortLabel: 'Bưu cục',
        colorTheme: 'warehouse' as const,
        icon: 'branch_order_management' as const,
        to: routePaths.groupBranchBusiness,
        items: [
          {
            label: 'Quản lý & Giám sát Vận đơn',
            icon: 'branch_order_management' as const,
            to: routePaths.shipments,
            keywords: 'quan ly van don don hang danh sach tra cuu hang den hang gui hang phat',
          },
          {
            label: 'Tạo vận đơn tại quầy',
            icon: 'branch_order_management' as const,
            to: routePaths.branchBusinessOrderCreate,
            keywords: 'tao van don tai quay khach le gui hang',
          },
          {
            label: 'Quét mã vạch tại Hub',
            icon: 'tracking_lookup' as const,
            to: routePaths.scans,
            keywords: 'quet ma vach hub inbound outbound scan lay hang nhan hang',
          },
          {
            label: 'Kiểm kê tồn kho bưu cục',
            icon: 'metrics_deadline' as const,
            to: routePaths.opsMetricsDeadlineInventory,
            keywords: 'kiem ke ton kho buu cuc don ton luu kho',
          },
          {
            label: 'Chốt ca cuối ngày',
            icon: 'metrics_action' as const,
            to: routePaths.branchBusinessShiftClosing,
            keywords: 'chot ca cuoi ngay ban giao ca sang chieu',
          },
          {
            label: 'Quyết toán Thu hộ COD',
            icon: 'branch_finance_settlement' as const,
            to: `${routePaths.branchBusinessFinanceCod}?tab=cod`,
            keywords: 'quyet toan thu ho cod nop quy buu ta shipper tai chinh dong tien',
          },
          {
            label: 'Đối soát Công nợ Bưu cục',
            icon: 'branch_finance_settlement' as const,
            to: `${routePaths.branchBusinessFinanceCod}?tab=reconcile`,
            keywords: 'doi soat cong no buu cuc khoa so cong no',
          },
        ],
      },
      {
        id: 'branch_dispatch',
        label: 'Điều phối Giao nhận',
        shortLabel: 'Điều phối',
        colorTheme: 'dispatch' as const,
        icon: 'shipment_dispatch' as const,
        to: routePaths.groupOperationsPlatform,
        items: [
          {
            label: 'Điều phối phát hàng',
            icon: 'shipment_dispatch' as const,
            to: routePaths.operationsPlatformDeliveryDispatch,
            keywords: 'dieu phoi phat hang giao hang shipper',
          },
          {
            label: 'Điều phối lấy hàng',
            icon: 'shipment_dispatch' as const,
            to: routePaths.operationsPlatformPickupDispatch,
            keywords: 'dieu phoi lay hang gom don shop',
          },
          {
            label: 'Phân vùng Tuyến Shipper',
            icon: 'tracking_lookup' as const,
            to: routePaths.courierAreaAssignment,
            keywords: 'phan vung shipper tuyen buu ta khu vuc dai toa do',
          },
          {
            label: 'Chat với Bưu tá',
            icon: 'chat' as const,
            to: routePaths.operationsPlatformChat,
            keywords: 'chat voi buu ta trao doi noi bo',
          },
        ],
      },
      {
        id: 'linehaul',
        label: 'Trung chuyển & Tuyến xe',
        shortLabel: 'Tuyến xe',
        colorTheme: 'linehaul' as const,
        icon: 'linehaul_transport' as const,
        to: routePaths.groupCapabilityPlatform,
        items: [
          {
            label: 'Chuyến xe tải đường trục',
            icon: 'linehaul_transport' as const,
            to: `${routePaths.linehaulTripManagement}?tab=trips`,
            keywords: 'quan ly chuyen xe tai linehaul xuat ben lap chuyen xe gan tai xe',
          },
          {
            label: 'Niêm phong & Kẹp chì Seal',
            icon: 'proof_management' as const,
            to: `${routePaths.linehaulTripManagement}?tab=seal`,
            keywords: 'niem phong kep chi seal xuat ben cat chi tiep nhan',
          },
          {
            label: 'Giám sát Dữ liệu xe tải',
            icon: 'monitor_data' as const,
            to: `${routePaths.linehaulTripManagement}?tab=monitor`,
            keywords: 'giam sat du lieu xe tai gps radar xe',
          },
          {
            label: 'Quản lý & In tem bao tải',
            icon: 'thermal_label' as const,
            to: routePaths.linehaulBagLabelManagement,
            keywords: 'quan ly in tem bao tai dong bao bagging thermal print',
          },
        ],
      },
      {
        id: 'quality',
        label: 'Sự cố & Khiếu nại',
        shortLabel: 'Khiếu nại',
        colorTheme: 'quality' as const,
        icon: 'service_proactive' as const,
        to: routePaths.groupServiceQuality,
        items: [
          {
            label: 'Tra cứu tích hợp',
            icon: 'tracking_lookup' as const,
            to: routePaths.serviceQualityIntegratedLookup,
            keywords: 'tra cuu tich hop chi tiet don hang van don sdt che mat hinh anh pod',
          },
          {
            label: 'Trung tâm CSKH & Khiếu nại',
            icon: 'service_care' as const,
            to: routePaths.customerServiceTickets,
            keywords: 'cskh khieu nai giuc giao doi dia chi ho tro khach hang ai handover sla 24h 48h',
          },
          {
            label: 'Giám định đơn lạc & CCTV',
            icon: 'metrics_action' as const,
            to: routePaths.strayShipmentInvestigation,
            keywords: 'giam dinh don lac phan tich log vet thao tac mat kien cctv giai trinh',
          },
          {
            label: 'Hồ sơ Bồi thường & Phân định',
            icon: 'service_weight' as const,
            to: `${routePaths.claimsLiabilityManagement}?tab=liability`,
            keywords: 'ho so den bu phan dinh trach nhiem boi thuong che tai',
          },
          {
            label: 'Thống kê Bồi thường Hub',
            icon: 'operation_report' as const,
            to: `${routePaths.claimsLiabilityManagement}?tab=statistics`,
            keywords: 'thong ke ty le that thoat kpi boi thuong',
          },
          {
            label: 'Xử lý Giao thất bại (NDR)',
            icon: 'service_abnormal' as const,
            to: `${routePaths.ndr}?tab=ndr`,
            keywords: 'xu ly giao that bai ndr hen lai sai dia chi',
          },
          {
            label: 'Quản lý Hàng chuyển hoàn',
            icon: 'return_block' as const,
            to: `${routePaths.ndr}?tab=return-block`,
            keywords: 'chuyen hoan tra hang ve shop tao don hoan nhap kho hoan',
          },
          {
            label: 'Giám sát Rủi ro & Radar SLA',
            icon: 'service_proactive' as const,
            to: routePaths.serviceQualityAbnormalManagement,
            keywords: 'hang bat thuong hu hong be vo bien ban radar canh bao sla',
          },
        ],
      },
      {
        id: 'operations_metrics',
        label: 'Báo cáo & Hiệu suất',
        shortLabel: 'Báo cáo',
        colorTheme: 'analytics' as const,
        icon: 'operation_report' as const,
        to: routePaths.groupOperationsMetrics,
        items: [
          {
            label: 'Báo cáo Vận hành & KPI',
            icon: 'operation_report' as const,
            to: routePaths.opsMetricsReport,
            keywords: 'bao cao van hanh kpi san luong',
          },
          {
            label: 'Bảng điều phối thao tác',
            icon: 'metrics_action' as const,
            to: routePaths.opsMetricsActionExecutionBoard,
            keywords: 'ban dieu phoi thao tac xu ly nhanh',
          },
          {
            label: 'Giám sát tồn kho bưu cục',
            icon: 'metrics_deadline' as const,
            to: routePaths.opsMetricsDeadlineInventory,
            keywords: 'kiem ke ton kho buu cuc don ton luu kho',
          },
        ],
      },
      {
        id: 'planning_platform',
        label: 'Quy hoạch & Dự báo',
        shortLabel: 'Quy hoạch',
        colorTheme: 'planning' as const,
        icon: 'metrics_planning' as const,
        to: routePaths.groupPlanningPlatform,
        items: [
          {
            label: 'Quy hoạch tải trọng & mạng lưới',
            icon: 'metrics_planning' as const,
            to: routePaths.groupPlanningPlatform,
            keywords: 'quy hoach du bao tai san luong mua sale can bang cong suat',
          },
          {
            label: 'Bản đồ Mạng lưới & Hub',
            icon: 'tracking_lookup' as const,
            to: routePaths.masterdataHubNetworkMap,
            keywords: 'ban do mang luoi hub geofence phan vung ban kinh',
          },
        ],
      },
    ],
    [canViewHq],
  );

  const quickTools = useMemo(
    () => [
      {
        label: 'Tin nhắn',
        title: 'Tin nhắn / Chat với Bưu tá',
        icon: 'chat' as SidebarIconName,
        to: routePaths.operationsPlatformChat,
      },
      {
        label: 'Tra cứu',
        title: 'Tra cứu hành trình vận đơn',
        icon: 'tracking_lookup' as SidebarIconName,
        to: routePaths.tracking,
      },
      {
        label: 'In nhãn',
        title: 'In tem nhãn vận đơn',
        icon: 'thermal_label' as SidebarIconName,
        to: routePaths.thermalLabelPrint,
      },
      {
        label: 'Tải về',
        title: 'Trung tâm tải về',
        icon: 'download' as SidebarIconName,
        to: routePaths.downloadCenter,
      },
    ],
    [],
  );

  const activeClusterId = useMemo(() => {
    for (const cluster of menuClusters) {
      if (
        cluster.visible !== false &&
        cluster.items.some((item) => isRouteOrTabActive(location.pathname, location.search, item.to))
      ) {
        return cluster.id;
      }
    }
    if (
      pathMatches(location.pathname, routePaths.masterOpsCommandCenter) ||
      pathMatches(location.pathname, routePaths.groupHqOperations) ||
      location.pathname.startsWith('/app/hq-')
    ) {
      return 'hq';
    }
    if (
      pathMatches(location.pathname, routePaths.operationsPlatformPickupDispatch) ||
      pathMatches(location.pathname, routePaths.operationsPlatformDeliveryDispatch) ||
      pathMatches(location.pathname, routePaths.courierAreaAssignment) ||
      pathMatches(location.pathname, routePaths.courierTaskTransfer) ||
      pathMatches(location.pathname, routePaths.groupOperationsPlatform) ||
      location.pathname.startsWith('/app/function-groups/operations-platform')
    ) {
      return 'branch_dispatch';
    }
    if (
      pathMatches(location.pathname, routePaths.shipments) ||
      pathMatches(location.pathname, routePaths.scans) ||
      pathMatches(location.pathname, routePaths.groupBranchBusiness) ||
      location.pathname.startsWith('/app/function-groups/branch-business')
    ) {
      return 'branch_warehouse';
    }
    if (
      pathMatches(location.pathname, routePaths.linehaulRoot) ||
      pathMatches(location.pathname, routePaths.groupCapabilityPlatform)
    ) {
      return 'linehaul';
    }
    if (
      pathMatches(location.pathname, routePaths.groupServiceQuality) ||
      pathMatches(location.pathname, routePaths.ndr) ||
      pathMatches(location.pathname, routePaths.returnBlockRoot)
    ) {
      return 'quality';
    }
    if (
      pathMatches(location.pathname, routePaths.groupOperationsMetrics) ||
      location.pathname.startsWith('/app/function-groups/operations-metrics')
    ) {
      return 'operations_metrics';
    }
    if (
      pathMatches(location.pathname, routePaths.groupPlanningPlatform) ||
      location.pathname.startsWith('/app/function-groups/planning-platform')
    ) {
      return 'planning_platform';
    }
    if (
      pathMatches(location.pathname, routePaths.groupFinanceSettlement) ||
      pathMatches(location.pathname, routePaths.branchBusinessFinanceSettlementRoot)
    ) {
      return 'branch_warehouse';
    }
    return null;
  }, [location.pathname, location.search, menuClusters]);

  const [openClusters, setOpenClusters] = useState<Record<string, boolean>>({
    hq: true,
    branch_warehouse: true,
    branch_dispatch: true,
    linehaul: true,
    quality: true,
    operations_metrics: true,
    planning_platform: true,
  });

  useEffect(() => {
    if (activeClusterId) {
      setOpenClusters((prev) =>
        prev[activeClusterId] ? prev : { ...prev, [activeClusterId]: true },
      );
    }
  }, [activeClusterId]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ops_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ops_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [menuSearchKeyword, setMenuSearchKeyword] = useState('');
  const normalizedSearch = menuSearchKeyword.trim().toLowerCase();
  const isSearching = Boolean(normalizedSearch);

  const filteredClusters = useMemo(() => {
    return menuClusters
      .filter((cluster) => cluster.visible !== false)
      .map((cluster) => {
        if (!isSearching) {
          return cluster;
        }
        const matched = cluster.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedSearch) ||
            item.keywords.toLowerCase().includes(normalizedSearch),
        );
        return { ...cluster, items: matched };
      })
      .filter((cluster) => !isSearching || cluster.items.length > 0);
  }, [isSearching, menuClusters, normalizedSearch]);

  const topNavItems: TopNavItem[] = enableFullOpsModules
    ? [
        ...menuClusters
          .filter((c) => c.visible !== false)
          .map((c) => ({
            id: c.id,
            label: c.shortLabel,
            to: c.to,
            icon: c.icon,
            isActive: activeClusterId === c.id,
          })),
        {
          id: 'download',
          label: 'Tải về',
          to: routePaths.downloadCenter,
          icon: 'download' as const,
          isActive: pathMatches(location.pathname, routePaths.downloadCenter),
        },
      ]
    : [
        {
          id: 'shipments',
          label: 'Vận đơn',
          to: routePaths.shipments,
          icon: 'branch_order_management' as const,
          isActive: pathMatches(location.pathname, routePaths.shipments),
        },
        {
          id: 'analytics',
          label: 'Báo cáo',
          to: routePaths.analyticsDashboard,
          icon: 'operation_report' as const,
          isActive: pathMatches(location.pathname, routePaths.analyticsDashboard),
        },
      ];

  const activeTabLabel = useMemo(() => {
    for (const cluster of menuClusters) {
      for (const item of cluster.items) {
        if (isRouteOrTabActive(location.pathname, location.search, item.to)) {
          return item.label;
        }
      }
    }
    for (const tool of quickTools) {
      if (pathMatches(location.pathname, tool.to)) {
        return tool.title;
      }
    }
    if (pathMatches(location.pathname, routePaths.tracking)) {
      return 'Tra cứu hành trình';
    }
    return 'Trang chủ';
  }, [location.pathname, location.search, menuClusters, quickTools]);

  const onQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = quickSearchCode.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    setQuickSearchCode('');
    navigate(routePaths.trackingDetail(normalized));
  };

  const onLogout = async () => {
    try {
      sessionStorage.removeItem(OPS_ACTIVE_ROUTE_KEY);
    } catch {}
    await logoutMutation.mutateAsync();
    navigate(routePaths.login, { replace: true });
  };

  if (isDashboardRoute) {
    return (
      <>
        <div className="ops-layout ops-layout--no-sidebar">
          <div className="ops-workspace ops-workspace--full">
            <header className="ops-topbar ops-topbar--full">
              <button
                type="button"
                className="ops-topbar-brand ops-topbar-brand--button"
                onClick={() => navigate(routePaths.dashboard)}
                aria-label="Go to dashboard"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <NexusBrandLogo size={32} portal="ops" showLabel={true} />
              </button>

              <div className="ops-topbar-actions">
                <form onSubmit={onQuickSearch} className="ops-header-search" role="search">
                  <Search size={16} strokeWidth={2} className="ops-header-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    value={quickSearchCode}
                    onChange={(event) => setQuickSearchCode(event.target.value)}
                    placeholder="Tra cứu vận đơn..."
                    aria-label="Tra cứu mã vận đơn"
                    className="ops-header-search-input"
                  />
                  <kbd className="ops-header-search-shortcut" title="Nhấn Enter để tra cứu">↵ Enter</kbd>
                </form>

                <div className="ops-header-divider" />

                <div className="ops-header-scope-group">
                  <span
                    className="ops-scope-badge"
                    style={{
                      backgroundColor: `${opsTierMeta.badgeColor}15`,
                      color: opsTierMeta.badgeColor,
                      borderColor: `${opsTierMeta.badgeColor}35`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                    title={`${opsTierMeta.label}\n${opsTierMeta.description}\n(Quyền kế thừa tự động theo cấp bậc)`}
                  >
                    <OpsTierIcon icon={opsTierMeta.icon} size={15} />
                    <span>{opsTierMeta.badgeLabel}</span>
                  </span>
                </div>

                <button type="button" className="ops-header-icon-btn" aria-label="Thông báo" title="Thông báo hệ thống">
                  <Bell size={18} strokeWidth={2} aria-hidden="true" />
                  <span className="ops-header-badge-dot" />
                </button>

                <div className="ops-header-divider" />

                <div className="ops-header-user-group" aria-label="Tài khoản">
                  <div className="ops-header-user-card" title={`${operatorName} (${roleText})`}>
                    <div className="ops-header-avatar">
                      {operatorInitial}
                      <span className="ops-header-online-dot" />
                    </div>
                    <div className="ops-header-user-info">
                      <span className="ops-header-username">{operatorName}</span>
                      <span className="ops-header-userrole">{roleText.split(',')[0]}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ops-header-logout-btn"
                    disabled={logoutMutation.isPending}
                    onClick={() => void onLogout()}
                    aria-label="Đăng xuất"
                    title={logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </header>

            <main className="ops-main-panel ops-main-panel--flat">
              <Outlet />
            </main>
          </div>
        </div>
        <GlobalChatBubble />
      </>
    );
  }

  return (
    <>
      <div className="ops-func-shell">
        <header className="ops-func-header">
          <button
            type="button"
            className="ops-func-logo ops-func-logo--button"
            onClick={() => navigate(routePaths.dashboard)}
            aria-label="Go to dashboard"
            style={{ background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            <NexusBrandLogo size={30} portal="ops" showLabel={true} />
          </button>

        <nav className="ops-func-main-nav" aria-label="Main navigation">
          {topNavItems.map((item) => {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.to)}
                className={item.isActive ? 'ops-func-main-link ops-func-main-link--active' : 'ops-func-main-link'}
              >
                {item.icon && <SidebarIcon name={item.icon} size={15} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ops-func-actions">
          <form onSubmit={onQuickSearch} className="ops-func-search" role="search">
            <Search size={15} strokeWidth={2} aria-hidden="true" />
            <input
              type="text"
              value={quickSearchCode}
              onChange={(event) => setQuickSearchCode(event.target.value)}
              placeholder="Tra cứu mã vận đơn"
              aria-label="Tra cứu mã vận đơn"
            />
          </form>

          <button
            type="button"
            className="ops-func-bell"
            aria-label="Thông báo"
            onClick={() => setIsNotificationsOpen(true)}
            title="Thông báo hệ thống"
          >
            <Bell size={17} strokeWidth={2} aria-hidden="true" />
          </button>

          <div className="ops-func-tier" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: `${opsTierMeta.badgeColor}18`,
                color: opsTierMeta.badgeColor,
                border: `1px solid ${opsTierMeta.badgeColor}40`,
                letterSpacing: '0.3px',
              }}
              title={`${opsTierMeta.label}\n${opsTierMeta.description}\n(Quyền kế thừa tự động theo cấp bậc)`}
            >
              <OpsTierIcon icon={opsTierMeta.icon} size={14} />
              <span>{opsTierMeta.badgeLabel}</span>
            </span>
          </div>

          {currentOperatorHub && (
            <div
              className="ops-topbar-hub-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                maxWidth: '360px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
              title={`Bưu cục: ${currentOperatorHub.name} (${currentOperatorHub.code})\nĐịa chỉ: ${currentOperatorHubAddress || 'Đang cập nhật'}`}
            >
              <Building2 size={15} style={{ color: '#0284c7', flexShrink: 0 }} aria-hidden="true" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <strong style={{ color: '#0284c7' }}>{currentOperatorHub.name}</strong>
                {currentOperatorHubAddress ? ` • ${currentOperatorHubAddress}` : ''}
              </span>
            </div>
          )}

          <OpsUserAccountMenu
            session={session}
            operatorName={operatorName}
            operatorInitial={operatorInitial}
            roleText={roleText}
            opsTierMeta={opsTierMeta}
            currentOperatorHub={currentOperatorHub}
            currentOperatorHubAddress={currentOperatorHubAddress}
            onLogout={onLogout}
            isLoggingOut={logoutMutation.isPending}
            variant="func"
            isNotificationsOpen={isNotificationsOpen}
            onToggleNotifications={() => setIsNotificationsOpen((prev) => !prev)}
          />
        </div>
      </header>

      <div className="ops-func-body">
        <aside className={`ops-func-sidebar ${isSidebarCollapsed ? 'ops-func-sidebar--collapsed' : ''}`}>
          {/* Top Bar with Brand / Collapse Toggle */}
          <div className="ops-func-sidebar-top-bar">
            {isSidebarCollapsed ? (
              <button
                type="button"
                className="ops-func-sidebar-expand-btn"
                onClick={toggleSidebar}
                title="Mở rộng menu dọc (Phím tắt: Ctrl + B)"
                aria-label="Mở rộng thanh điều hướng"
              >
                <ChevronRight size={17} strokeWidth={2.5} />
              </button>
            ) : (
              <>
                <div className="ops-func-sidebar-title-badge">
                  <span>ĐIỀU HƯỚNG</span>
                </div>
                <button
                  type="button"
                  className="ops-func-sidebar-collapse-btn"
                  onClick={toggleSidebar}
                  title="Thu gọn menu dọc (Phím tắt: Ctrl + B)"
                  aria-label="Thu gọn thanh điều hướng"
                >
                  <ChevronLeft size={15} strokeWidth={2.5} />
                  <span>Thu gọn</span>
                </button>
              </>
            )}
          </div>

          {/* Active Hub Scope Card */}
          {isSidebarCollapsed ? (
            <div
              className="ops-func-sidebar-scope-mini"
              onClick={toggleSidebar}
              title={`${hubScope.scopeLabel} (Cấp ${hubScope.hubLevel} - ${
                hubScope.isAllSystem ? 'Dữ liệu toàn quốc (51 Hub)' : `${hubScope.scopedHubCodes.length || 1} Hub`
              }) - Bấm để mở rộng`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
            >
              <span className="ops-func-sidebar-scope-pulse" />
              <MapPin size={16} strokeWidth={2.2} />
            </div>
          ) : (
            <div className="ops-func-sidebar-scope-card">
              <div className="ops-func-sidebar-scope-badge-row">
                <span className="ops-func-sidebar-scope-pill">
                  <span className="ops-func-sidebar-scope-pulse" />
                  {hubScope.actor === 'HQ_OPS'
                    ? 'HQ TOÀN QUỐC'
                    : hubScope.actor === 'REGIONAL_OPS'
                      ? 'KHU VỰC MIỀN'
                      : hubScope.actor === 'PROVINCIAL_OPS'
                        ? 'TỈNH / THÀNH'
                        : 'BƯU CỤC CƠ SỞ'}
                </span>
                <span className="ops-func-sidebar-scope-level">Cấp {hubScope.hubLevel}</span>
              </div>
              <div className="ops-func-sidebar-scope-hub" title={hubScope.scopeLabel}>
                <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>{hubScope.scopeLabel}</span>
              </div>
              <div className="ops-func-sidebar-scope-hint">
                {hubScope.isAllSystem
                  ? 'Dữ liệu toàn quốc (51 Hub)'
                  : `Phạm vi: ${hubScope.scopedHubCodes.length || 1} Hub (Bao & Tuyến lọc tự động)`}
              </div>
            </div>
          )}

          {/* Search bar */}
          {isSidebarCollapsed ? (
            <button
              type="button"
              className="ops-func-sidebar-search-mini-btn"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Tra cứu menu nhanh (Click để mở rộng)"
              aria-label="Tra cứu menu nhanh"
            >
              <Search size={16} strokeWidth={2.2} />
            </button>
          ) : (
            <label className="ops-func-sidebar-search">
              <Search size={14} strokeWidth={2} aria-hidden="true" />
              <input
                type="text"
                value={menuSearchKeyword}
                onChange={(e) => setMenuSearchKeyword(e.target.value)}
                placeholder="Tra cứu menu nhanh..."
                aria-label="Tra cứu menu"
              />
              {menuSearchKeyword ? (
                <button
                  type="button"
                  className="ops-func-sidebar-search-clear"
                  onClick={() => setMenuSearchKeyword('')}
                  aria-label="Xoá tìm kiếm"
                >
                  <X size={13} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ) : null}
            </label>
          )}

          <nav className="ops-func-sidebar-nav" aria-label="Sidebar navigation">
            {isSidebarCollapsed ? (
              filteredClusters.map((cluster) => {
                const isClusterCurrent = activeClusterId === cluster.id;
                return (
                  <div key={cluster.id} className="ops-func-cluster-mini-item">
                    <button
                      type="button"
                      className={`ops-func-cluster-mini-btn ops-func-cluster-mini-btn--${cluster.colorTheme} ${
                        isClusterCurrent ? 'ops-func-cluster-mini-btn--active' : ''
                      }`}
                      onClick={() => navigate(cluster.items[0]?.to || cluster.to)}
                      title={cluster.label}
                      aria-label={cluster.label}
                    >
                      <SidebarIcon name={cluster.icon} />
                      {isClusterCurrent && <span className="ops-func-cluster-mini-dot" />}
                    </button>

                    <div className="ops-func-cluster-mini-flyout" role="menu" aria-label={cluster.label}>
                      <div className="ops-func-cluster-flyout-header">
                        <span className="ops-func-cluster-flyout-title">{cluster.label}</span>
                        <span className="ops-func-cluster-flyout-count">{cluster.items.length}</span>
                      </div>
                      <div className="ops-func-cluster-flyout-items">
                        {cluster.items.map((item) => {
                          const isItemActive = isRouteOrTabActive(
                            location.pathname,
                            location.search,
                            item.to,
                          );
                          return (
                            <button
                              key={item.to + item.label}
                              type="button"
                              className={`ops-func-cluster-flyout-item ${
                                isItemActive ? "ops-func-cluster-flyout-item--active" : ""
                              }`}
                              onClick={() => navigate(item.to)}
                            >
                              <span className="ops-func-sidebar-icon">
                                <SidebarIcon name={item.icon} />
                              </span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : filteredClusters.length === 0 ? (
              <div className="ops-func-sidebar-search-empty">
                Không tìm thấy menu khớp với "{menuSearchKeyword}"
              </div>
            ) : (
              filteredClusters.map((cluster) => {
                const isOpen = isSearching || Boolean(openClusters[cluster.id]);
                const isClusterCurrent = activeClusterId === cluster.id;

                return (
                  <div key={cluster.id} className={`ops-func-cluster ops-func-cluster--${cluster.colorTheme}`}>
                    <button
                      type="button"
                      className={`ops-func-cluster-header ${
                        isClusterCurrent ? 'ops-func-cluster-header--active' : ''
                      }`}
                      onClick={() => {
                        if (!isSearching) {
                          setOpenClusters((prev) => ({
                            ...prev,
                            [cluster.id]: !prev[cluster.id],
                          }));
                        }
                      }}
                      aria-expanded={isOpen}
                    >
                      <span className="ops-func-cluster-icon">
                        <SidebarIcon name={cluster.icon} />
                      </span>
                      <span className="ops-func-cluster-title">{cluster.label}</span>
                      <span className="ops-func-cluster-badge">{cluster.items.length}</span>
                      <span
                        className={`ops-func-cluster-chevron ${
                          isOpen ? 'ops-func-cluster-chevron--open' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDown size={15} strokeWidth={2} />
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="ops-func-cluster-items">
                        {cluster.items.map((item) => {
                          const isItemActive = isRouteOrTabActive(
                            location.pathname,
                            location.search,
                            item.to,
                          );

                          return (
                            <button
                              key={item.to + item.label}
                              type="button"
                              className={`ops-func-sidebar-item ${
                                isItemActive ? "ops-func-sidebar-item--active" : ""
                              }`}
                              onClick={() => navigate(item.to)}
                            >
                              <span className="ops-func-sidebar-icon">
                                <SidebarIcon name={item.icon} />
                              </span>
                              <span className="ops-func-sidebar-label">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </nav>

          <div className="ops-func-quick-tools" aria-label="Tiện ích nhanh">
            {quickTools.map((tool) => {
              const isToolActive = pathMatches(location.pathname, tool.to);
              return (
                <button
                  key={tool.label}
                  type="button"
                  className={`ops-func-quick-tool-btn ${
                    isToolActive ? 'ops-func-quick-tool-btn--active' : ''
                  }`}
                  title={tool.title}
                  onClick={() => navigate(tool.to)}
                >
                  <SidebarIcon name={tool.icon} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
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
      <GlobalChatBubble />
    </>
  );
}

function AppIndexRedirect(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const isHq = resolveOpsActor(session?.user.username, session?.user.roles) === 'HQ_OPS';
  return <Navigate to={isHq ? routePaths.masterOpsCommandCenter : routePaths.dashboard} replace />;
}

export function AppRouter(): React.JSX.Element {
  const initialRoute = useMemo(() => resolveInitialOpsRoute(), []);
  const lazyRoute = (element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
  );
  const opsModuleRoute = (title: string, element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>
      <OpsModuleRoute title={title}>{element}</OpsModuleRoute>
    </Suspense>
  );

  const routesContent = (
    <Routes>
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path={routePaths.appRoot} element={<DashboardLayout />}>
            <Route index element={<AppIndexRedirect />} />
            <Route path={routePaths.dashboardLeaf} element={<DashboardPage />} />
            <Route
              path={routePaths.masterOpsCommandCenterLeaf}
              element={
                <OpsModuleRoute title="HQ Master Ops Command Center">
                  {lazyRoute(<MasterOpsCommandCenterPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.masterdataHubNetworkMapLeaf}
              element={
                <OpsModuleRoute title="Bản Đồ Mạng Lưới & Phân Vùng Hub">
                  {lazyRoute(<HqNetworkGeofenceMapPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.groupHqOperationsLeaf}
              element={
                <OpsModuleRoute title="Nhóm Chức Năng Điều Hành HQ">
                  {lazyRoute(<MasterOpsCommandCenterPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.downloadCenterLeaf}
              element={
                <OpsModuleRoute title="Trung tâm Tải về">
                  {lazyRoute(<DownloadCenterPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.courierTaskTransferLeaf}
              element={
                <OpsModuleRoute title="Quản lý Chuyển đơn Bàn giao">
                  {lazyRoute(<CourierTaskTransferPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.analyticsDashboardLeaf}
              element={
                <OpsModuleRoute title="Analytics Dashboard">
                  {lazyRoute(<AnalyticsDashboardPage />)}
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.comingSoonDebtReportLeaf}
              element={
                <OpsModuleRoute title="Báo cáo Công nợ">
                  <ComingSoonPlaceholder
                    title="Báo cáo Công nợ"
                    description="Module phân tích và đối soát công nợ toàn hệ thống, hỗ trợ xuất báo cáo tự động theo chu kỳ."
                    visionText="Tích hợp AI dự đoán dòng tiền (Cash Flow Forecasting) và phân tích rủi ro nợ xấu dựa trên lịch sử thanh toán của đối tác."
                    phaseLabel="Phase 2 — Q3 2026"
                    badgeLabel="Đang hoàn thiện"
                  />
                </OpsModuleRoute>
              }
            />
            <Route
              path={routePaths.comingSoonAiCashflowLeaf}
              element={
                <OpsModuleRoute title="AI Dự đoán Dòng tiền">
                  <ComingSoonPlaceholder
                    title="AI Dự đoán Dòng tiền"
                    description="Hệ thống Machine Learning phân tích pattern thu-chi, dự báo dòng tiền 30/60/90 ngày cho từng hub."
                    visionText="Sử dụng mô hình Time-series Forecasting (Prophet / LSTM) kết hợp dữ liệu vận hành thực tế để đưa ra dự đoán chính xác, giúp tối ưu kế hoạch tài chính."
                    phaseLabel="Phase 3 — Q4 2026"
                    badgeLabel="Đang hoàn thiện"
                  />
                </OpsModuleRoute>
              }
            />

            <Route
              path={routePaths.groupOperationsPlatformLeaf}
              element={opsModuleRoute('Nền tảng điều hành', <OperationsPlatformGroupPage />)}
            />
            <Route
              path={routePaths.operationsPlatformChatLeaf}
              element={opsModuleRoute('Chat courier', <OpsCourierChatPage />)}
            />
            <Route
              path={routePaths.thermalLabelManagementLeaf}
              element={<Navigate to={routePaths.linehaulBagLabelManagement} replace />}
            />
            <Route
              path={routePaths.thermalLabelPrintLeaf}
              element={<Navigate to={routePaths.linehaulBagLabelPrint} replace />}
            />
            <Route
              path={routePaths.legacyReturnBlockRootLeaf}
              element={<Navigate to={routePaths.returnBlockRegistration} replace />}
            />
            <Route
              path={routePaths.legacyReturnBlockManagementLeaf}
              element={<Navigate to={routePaths.returnBlockManagement} replace />}
            />
            <Route
              path={routePaths.legacyReturnBlockRegistrationLeaf}
              element={<Navigate to={routePaths.returnBlockRegistration} replace />}
            />
            <Route
              path={routePaths.returnBlockRootLeaf}
              element={<Navigate to={routePaths.returnBlockRegistration} replace />}
            />
            <Route
              path={routePaths.returnBlockManagementLeaf}
              element={opsModuleRoute('Quản lý chuyển hoàn', <ReturnBlockManagementPage />)}
            />
            <Route
              path={routePaths.returnBlockRegistrationLeaf}
              element={<Navigate to={`${routePaths.returnBlockManagement}?action=create`} replace />}
            />
            <Route
              path={routePaths.monitorDataHangNhanLeaf}
              element={<Navigate to={`${routePaths.shipments}?flow=arrival`} replace />}
            />
            <Route
              path={routePaths.monitorDataHangDenLeaf}
              element={<Navigate to={`${routePaths.shipments}?flow=arrival`} replace />}
            />
            <Route
              path={routePaths.monitorDataHangGuiLeaf}
              element={<Navigate to={`${routePaths.shipments}?flow=outbound`} replace />}
            />
            <Route
              path={routePaths.monitorDataHangPhatLeaf}
              element={<Navigate to={`${routePaths.shipments}?flow=delivery`} replace />}
            />
            <Route
              path={routePaths.monitorData2In1Leaf}
              element={<Navigate to={`${routePaths.shipments}?flow=arrival`} replace />}
            />
            <Route
              path={routePaths.monitorDataTheoDoiTamUngLeaf}
              element={<Navigate to={`${routePaths.shipments}?flow=arrival`} replace />}
            />
            <Route
              path={routePaths.monitorDataDongBaoLeaf}
              element={opsModuleRoute('Giám sát đóng bao', <MonitorDataDongBaoPage />)}
            />
            <Route
              path={routePaths.linehaulTripManagementLeaf}
              element={opsModuleRoute('Quản lý chuyến xe', <LinehaulTripManagementPage />)}
            />
            <Route
              path={routePaths.linehaulVehicleSealLeaf}
              element={opsModuleRoute('Tem xe / chuyến', <LinehaulVehicleSealPage />)}
            />
            <Route
              path={routePaths.linehaulBagLabelManagementLeaf}
              element={opsModuleRoute('Quản lý & In tem bao tải', <ThermalLabelManagementPage />)}
            />
            <Route
              path={routePaths.linehaulBagLabelPrintLeaf}
              element={<Navigate to={`${routePaths.linehaulBagLabelManagement}?tab=print`} replace />}
            />
            <Route
              path={routePaths.linehaulTripDataMonitorLeaf}
              element={opsModuleRoute('Giám sát dữ liệu chuyến xe', <LinehaulTripDataMonitorPage />)}
            />
            <Route
              path={routePaths.groupIntegrationServicesLeaf}
              element={<Navigate to={routePaths.dashboard} replace />}
            />
            <Route
              path={routePaths.operationsPlatformPickupDispatchLeaf}
              element={opsModuleRoute('Điều phối lấy hàng', <CustomerOrderDispatchPage />)}
            />
            <Route
              path={routePaths.operationsPlatformDeliveryDispatchLeaf}
              element={opsModuleRoute('Điều phối phát hàng', <BranchDeliveryDispatchPage />)}
            />
            <Route
              path={routePaths.groupBranchBusinessLeaf}
              element={<Navigate to={routePaths.branchBusinessOrderCreate} replace />}
            />
            <Route
              path={routePaths.branchBusinessLocalOverviewLeaf}
              element={<Navigate to={routePaths.branchBusinessOrderCreate} replace />}
            />
            <Route
              path={routePaths.branchBusinessLocalOrdersLeaf}
              element={<Navigate to={routePaths.branchBusinessOrderCreate} replace />}
            />
            <Route
              path={routePaths.branchBusinessCourierHandoffLeaf}
              element={<Navigate to={routePaths.operationsPlatformDeliveryDispatch} replace />}
            />
            <Route
              path={routePaths.branchBusinessBranchInventoryLeaf}
              element={<Navigate to={routePaths.branchBusinessShiftClosing} replace />}
            />
            <Route
              path={routePaths.branchBusinessShiftClosingLeaf}
              element={opsModuleRoute('Báo cáo cuối ngày', <BranchShiftClosingPage />)}
            />
            <Route
              path={routePaths.branchBusinessOrderCreateLeaf}
              element={opsModuleRoute('Tạo vận đơn tại quầy', <BranchBusinessOrderCreatePage />)}
            />
            <Route
              path={routePaths.branchBusinessOrderOutboundLeaf}
              element={<Navigate to={routePaths.branchBusinessOrderCreate} replace />}
            />
            <Route
              path={routePaths.branchBusinessOrderDeliveryLeaf}
              element={<Navigate to={routePaths.branchBusinessOrderCreate} replace />}
            />
            <Route
              path={routePaths.branchBusinessFinanceCodLeaf}
              element={opsModuleRoute('Quyết toán thu hộ', <BranchFinanceCodSettlementPage />)}
            />
            <Route
              path={routePaths.branchBusinessFinanceReconcileLeaf}
              element={opsModuleRoute('Đối soát công nợ', <BranchFinanceReconcilePage />)}
            />
            <Route
              path={routePaths.groupFinanceSettlementLeaf}
              element={<Navigate to={routePaths.branchBusinessFinanceCod} replace />}
            />
            <Route
              path={routePaths.groupCapabilityPlatformLeaf}
              element={opsModuleRoute('Vận chuyển tuyến', <CapabilityPlatformGroupPage />)}
            />
            <Route
              path={routePaths.groupOperationsMetricsLeaf}
              element={opsModuleRoute('Chỉ số vận hành', <OperationsMetricsGroupPage />)}
            />
            <Route
              path={routePaths.opsMetricsReportLeaf}
              element={opsModuleRoute('Báo cáo vận hành', <OperationsReportPage />)}
            />
            <Route
              path={routePaths.opsMetricsAbnormalOverviewLeaf}
              element={<Navigate to={routePaths.opsMetricsAbnormalHandling} replace />}
            />
            <Route
              path={routePaths.opsMetricsAbnormalHandlingLeaf}
              element={opsModuleRoute(
                'Theo dõi xử lý kiện',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_ABNORMAL_HANDLING"
                  title="Theo dõi xử lý kiện"
                  summary="Giám sát tiến độ xử lý kiện bất thường theo từng đơn vị vận hành."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineInventoryLeaf}
              element={opsModuleRoute('Tồn kho & SLA lưu kho', <OpsMetricsInventoryMonitorPage />)}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimePickupRatioLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliverySlaLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineActualSignT1Leaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimeSendRatioLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliveryLeadtimeLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineInboundLeadtimeLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOverdueAlertsLeaf}
              element={<Navigate to={routePaths.opsMetricsDeadlineInventory} replace />}
            />
            <Route
              path={routePaths.opsMetricsPlanningNetworkKpiLeaf}
              element={<Navigate to={routePaths.opsMetricsReport} replace />}
            />
            <Route
              path={routePaths.opsMetricsActionExecutionBoardLeaf}
              element={<Navigate to={routePaths.opsMetricsAbnormalHandling} replace />}
            />
            <Route
              path={routePaths.groupServiceQualityLeaf}
              element={opsModuleRoute('Chất lượng dịch vụ', <ServiceQualityGroupPage />)}
            />
            <Route
              path={routePaths.serviceQualityIntegratedLookupLeaf}
              element={opsModuleRoute('Tra cứu tích hợp', <ServiceQualityIntegratedLookupPage />)}
            />
            <Route
              path={routePaths.serviceQualityAbnormalManagementLeaf}
              element={opsModuleRoute('Giám sát Rủi ro & Bất thường', <ServiceQualityAbnormalManagementPage />)}
            />
            <Route
              path={routePaths.serviceQualityProactiveActionBoardLeaf}
              element={<Navigate to={`${routePaths.serviceQualityAbnormalManagement}?tab=sla-radar`} replace />}
            />
            <Route
              path={routePaths.serviceQualityProactiveInboundLeaf}
              element={<Navigate to={`${routePaths.serviceQualityAbnormalManagement}?tab=sla-radar`} replace />}
            />
            <Route
              path={routePaths.serviceQualityProactiveDeliveredLeaf}
              element={<Navigate to={routePaths.serviceQualityAbnormalManagement} replace />}
            />
            <Route
              path={routePaths.strayShipmentInvestigationLeaf}
              element={opsModuleRoute('Giám định đơn lạc & phân tích log', <StrayShipmentInvestigationPage />)}
            />
            <Route
              path={routePaths.claimsLiabilityManagementLeaf}
              element={opsModuleRoute('Hồ sơ đền bù & phân định trách nhiệm', <ClaimsLiabilityManagementPage />)}
            />
            <Route
              path={routePaths.customerServiceTicketsLeaf}
              element={opsModuleRoute('Trung tâm CSKH & Khiếu nại Vận hành', <CustomerServiceTicketsPage />)}
            />
            <Route
              path={routePaths.claimsHubStatisticsLeaf}
              element={opsModuleRoute('Thống kê bồi thường theo Hub', <HubCompensationStatisticsPage />)}
            />
            <Route
              path={routePaths.groupDatabaseLeaf}
              element={opsModuleRoute('Cơ sở dữ liệu', <DatabaseGroupPage />)}
            />
            <Route
              path={routePaths.groupSmartDevicesLeaf}
              element={opsModuleRoute('Thiết bị thông minh', <SmartDevicesGroupPage />)}
            />
            <Route
              path={routePaths.groupPlanningPlatformLeaf}
              element={opsModuleRoute('Nền tảng quy hoạch', <PlanningPlatformGroupPage />)}
            />
            <Route path={routePaths.shipmentsLeaf} element={lazyRoute(<ShipmentListPage />)} />
            <Route path={routePaths.shipmentDetailLeaf} element={lazyRoute(<ShipmentDetailPage />)} />
            <Route
              path={routePaths.tasksLeaf}
              element={<Navigate to={routePaths.operationsPlatformPickupDispatch} replace />}
            />
            <Route path={routePaths.taskDetailLeaf} element={lazyRoute(<TaskDetailPage />)} />
            <Route
              path={routePaths.courierAreaAssignmentLeaf}
              element={opsModuleRoute('Phân vùng Shipper', <CourierAreaAssignmentPage />)}
            />
            <Route
              path={routePaths.opsChatLeaf}
              element={opsModuleRoute('Chat courier', <OpsCourierChatPage />)}
            />

            <Route path={routePaths.scansLeaf} element={lazyRoute(<HubScanPage />)} />
            <Route path={routePaths.ndrLeaf} element={lazyRoute(<NdrHandlingPage />)} />
            <Route path={routePaths.ndrDetailLeaf} element={lazyRoute(<NdrCaseDetailPage />)} />
            <Route path={routePaths.trackingLeaf} element={lazyRoute(<TrackingLookupPage />)} />
            <Route path={routePaths.trackingDetailLeaf} element={lazyRoute(<TrackingDetailPage />)} />

          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
  );

  if (isTestEnv) {
    return <BrowserRouter>{routesContent}</BrowserRouter>;
  }

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <OpsRoutePersistenceSync />
      {routesContent}
    </MemoryRouter>
  );
}
