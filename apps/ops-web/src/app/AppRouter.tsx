import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
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

function lazyRoutePage<T extends React.ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
): React.LazyExoticComponent<T> {
  return lazy(async () => ({
    default: (await loader())[exportName],
  }));
}

import { SCOPE_OPTIONS, resolveAllowedScopes, resolveOpsTier, useOpsScopeStore, type ScopeLevel } from '../store/opsScopeStore';
import { canAccessOpsFeature, resolveOpsActor } from '../features/permissions/opsPermissions';

const MasterOpsCommandCenterPage = lazy(() =>
  import('../pages/dashboard/MasterOpsCommandCenterPage').then((module) => ({
    default: module.MasterOpsCommandCenterPage,
  })),
);
const HqNetworkGeofenceMapPage = lazy(() =>
  import('../pages/dashboard/HqNetworkGeofenceMapPage').then((module) => ({
    default: module.HqNetworkGeofenceMapPage,
  })),
);
const DownloadCenterPage = lazy(() =>
  import('../pages/download/DownloadCenterPage').then((module) => ({
    default: module.DownloadCenterPage,
  })),
);
const CourierTaskTransferPage = lazy(() =>
  import('../pages/function-groups/operations-platform/transfer/CourierTaskTransferPage').then((module) => ({
    default: module.CourierTaskTransferPage,
  })),
);
const AnalyticsDashboardPage = lazy(() =>
  import('../pages/dashboard/analytics/AnalyticsDashboardPage').then((module) => ({
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
  | 'linehaul_transport';

type SidebarPanelKind =
  | 'return_block'
  | 'monitor_data'
  | 'shipment_dispatch'
  | 'branch_finance_settlement'
  | 'linehaul_transport';

interface TopNavItem {
  label: string;
  to: string;
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

function SidebarIcon({ name }: { name: SidebarIconName }): React.JSX.Element {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'hq_command':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M3.6 9h16.8" {...common} />
          <path d="M3.6 15h16.8" {...common} />
          <path d="M12 3a14 14 0 0 0 0 18" {...common} />
          <path d="M12 3a14 14 0 0 1 0 18" {...common} />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6.5h14v9H9l-4 3v-12Z" {...common} />
          <path d="M8.5 10h7" {...common} />
          <path d="M8.5 13h4.5" {...common} />
        </svg>
      );
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
    case 'service_lookup':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" {...common} />
          <path d="m16 16 4 4" {...common} />
        </svg>
      );
    case 'service_proactive':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2.2" {...common} />
          <path d="M8 12h8" {...common} />
          <path d="M8 8.5h5" {...common} />
          <path d="M8 15.5h6" {...common} />
        </svg>
      );
    case 'service_care':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8.5" r="3" {...common} />
          <path d="M5 19a7 7 0 0 1 14 0" {...common} />
        </svg>
      );
    case 'service_weight':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 19h12" {...common} />
          <path d="M9 19v-7h6v7" {...common} />
          <circle cx="12" cy="8" r="2" {...common} />
        </svg>
      );
    case 'service_abnormal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5 4.5 7v5.5c0 4.2 3.2 7.6 7.5 8.4 4.3-.8 7.5-4.2 7.5-8.4V7L12 3.5Z" {...common} />
          <path d="m12 8.3 0 5.2" {...common} />
          <circle cx="12" cy="16.8" r="0.9" {...common} />
        </svg>
      );
    case 'metrics_abnormal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5 4.5 7.2v5.2c0 4.3 3.1 7.8 7.5 8.5 4.4-.7 7.5-4.2 7.5-8.5V7.2Z" {...common} />
          <path d="m12 8.4 0 5" {...common} />
          <circle cx="12" cy="16.6" r="0.9" {...common} />
        </svg>
      );
    case 'metrics_deadline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" {...common} />
          <path d="m12 8.1 0 4.2 2.7 1.8" {...common} />
        </svg>
      );
    case 'metrics_planning':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 6.5h13v11h-13z" {...common} />
          <path d="M8 10h8" {...common} />
          <path d="M8 13.5h5.5" {...common} />
          <circle cx="15.9" cy="13.5" r="0.8" {...common} />
        </svg>
      );
    case 'metrics_action':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 5.5h13v13h-13z" {...common} />
          <path d="m8.3 12 2.1 2.2 5.3-5.4" {...common} />
        </svg>
      );

    case 'branch_order_management':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4.8h12v14.4H6z" {...common} />
          <path d="M9 9.2h6" {...common} />
          <path d="M9 12.3h6" {...common} />
          <path d="M9 15.4h4.2" {...common} />
        </svg>
      );
    case 'branch_finance_settlement':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.8" y="6.2" width="14.4" height="11.6" rx="1.8" {...common} />
          <path d="M4.8 10.1h14.4" {...common} />
          <path d="M9 13.3h2.7" {...common} />
          <path d="M13 13.3h2.2" {...common} />
        </svg>
      );
    case 'linehaul_transport':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 17h16" {...common} />
          <rect x="4" y="7" width="11" height="8" rx="1" {...common} />
          <path d="M15 7h3.5l2.5 3v5h-6" {...common} />
          <circle cx="7.5" cy="17" r="2" {...common} fill="#fff" />
          <circle cx="16.5" cy="17" r="2" {...common} fill="#fff" />
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
    icon: SidebarIconName;
    to: string;
    visible?: boolean;
    items: ClusterMenuItem[];
  }

  const menuClusters: MenuCluster[] = useMemo(
    () => [
      {
        id: 'hq',
        label: 'Điều hành & Chỉ huy Vĩ mô',
        shortLabel: 'Điều hành HQ',
        icon: 'hq_command',
        to: routePaths.masterOpsCommandCenter,
        visible: canViewHq,
        items: [
          {
            label: 'Trung tâm chỉ huy HQ',
            icon: 'hq_command',
            to: routePaths.masterOpsCommandCenter,
            keywords: 'chi huy hq command center vi mo bac trung nam',
          },
          {
            label: 'Bản đồ Mạng lưới & Hub',
            icon: 'tracking_lookup',
            to: routePaths.masterdataHubNetworkMap,
            keywords: 'ban do mang luoi hub geofence phan vung',
          },
          {
            label: 'Báo cáo Vận hành & KPI',
            icon: 'operation_report',
            to: routePaths.opsMetricsReport,
            keywords: 'bao cao van hanh kpi san luong',
          },
          {
            label: 'Quy hoạch & Dự báo tải',
            icon: 'metrics_planning',
            to: routePaths.groupPlanningPlatform,
            keywords: 'quy hoach du bao tai san luong mua sale',
          },
        ],
      },
      {
        id: 'branch',
        label: 'Vận hành Bưu cục & Giao nhận',
        shortLabel: 'Bưu cục',
        icon: 'branch_order_management',
        to: routePaths.shipments,
        visible: canViewBranch,
        items: [
          {
            label: 'Quét mã vạch tại Hub',
            icon: 'tracking_lookup',
            to: routePaths.scans,
            keywords: 'quet ma vach hub inbound outbound scan lay hang nhan hang',
          },
          {
            label: 'Giám sát hàng đến',
            icon: 'monitor_data',
            to: routePaths.monitorDataHangDen,
            keywords: 'giam sat hang den inbound trong ngay',
          },
          {
            label: 'Quản lý vận đơn',
            icon: 'branch_order_management',
            to: routePaths.shipments,
            keywords: 'quan ly van don don hang danh sach tra cuu',
          },
          {
            label: 'Tạo vận đơn tại quầy',
            icon: 'branch_order_management',
            to: routePaths.branchBusinessOrderCreate,
            keywords: 'tao van don tai quay khach le gui hang',
          },
          {
            label: 'Điều phối lấy hàng',
            icon: 'shipment_dispatch',
            to: routePaths.operationsPlatformPickupDispatch,
            keywords: 'dieu phoi lay hang gom don shop',
          },
          {
            label: 'Điều phối phát hàng',
            icon: 'shipment_dispatch',
            to: routePaths.operationsPlatformDeliveryDispatch,
            keywords: 'dieu phoi phat hang giao hang shipper',
          },
          {
            label: 'Phân vùng Shipper',
            icon: 'tracking_lookup',
            to: routePaths.courierAreaAssignment,
            keywords: 'phan vung shipper tuyen buu ta khu vuc',
          },
          {
            label: 'Chuyển đơn Shipper',
            icon: 'shipment_dispatch',
            to: routePaths.courierTaskTransfer,
            keywords: 'chuyen don shipper chuyen giao dieu chuyen',
          },
          {
            label: 'Kiểm kê tồn kho bưu cục',
            icon: 'metrics_deadline',
            to: routePaths.opsMetricsDeadlineInventory,
            keywords: 'kiem ke ton kho buu cuc don ton luu kho',
          },
          {
            label: 'Chốt ca cuối ngày',
            icon: 'metrics_action',
            to: routePaths.branchBusinessShiftClosing,
            keywords: 'chot ca cuoi ngay ban giao ca sang chieu',
          },
        ],
      },
      {
        id: 'linehaul',
        label: 'Trung chuyển & Tuyến xe',
        shortLabel: 'Tuyến xe',
        icon: 'linehaul_transport',
        to: routePaths.linehaulTripManagement,
        visible: canViewFleet,
        items: [
          {
            label: 'Quản lý chuyến xe tải',
            icon: 'linehaul_transport',
            to: routePaths.linehaulTripManagement,
            keywords: 'quan ly chuyen xe tai linehaul xuat ben',
          },
          {
            label: 'Niêm phong & Kẹp chì xe',
            icon: 'thermal_label',
            to: routePaths.linehaulVehicleSeal,
            keywords: 'niem phong kep chi seal xe tai thung xe',
          },
          {
            label: 'Quản lý tem bao tải',
            icon: 'thermal_label',
            to: routePaths.linehaulBagLabelManagement,
            keywords: 'quan ly tem bao tai dong bao bagging',
          },
          {
            label: 'In tem bao tải',
            icon: 'thermal_label',
            to: routePaths.linehaulBagLabelPrint,
            keywords: 'in tem bao tai thermal print',
          },
          {
            label: 'Giám sát dữ liệu xe',
            icon: 'monitor_data',
            to: routePaths.linehaulTripDataMonitor,
            keywords: 'giam sat du lieu chuyen xe hanh trinh',
          },
        ],
      },
      {
        id: 'quality',
        label: 'Sự cố & Chất lượng Dịch vụ',
        shortLabel: 'Chất lượng',
        icon: 'service_proactive',
        to: routePaths.serviceQualityProactiveActionBoard,
        items: [
          {
            label: 'Radar cảnh báo SLA',
            icon: 'service_proactive',
            to: routePaths.serviceQualityProactiveActionBoard,
            keywords: 'radar canh bao chu dong sla tre han',
          },
          {
            label: 'Xử lý giao thất bại (NDR)',
            icon: 'service_abnormal',
            to: routePaths.ndr,
            keywords: 'xu ly giao that bai ndr hen lai sai dia chi',
          },
          {
            label: 'Quản lý chuyển hoàn',
            icon: 'return_block',
            to: routePaths.returnBlockManagement,
            keywords: 'quan ly chuyen hoan tra hang ve shop',
          },
          {
            label: 'Hàng bất thường & Hư hỏng',
            icon: 'service_abnormal',
            to: routePaths.serviceQualityAbnormalManagement,
            keywords: 'hang bat thuong hu hong be vo bien ban',
          },
          {
            label: 'Giám định đơn lạc & Log',
            icon: 'metrics_action',
            to: routePaths.strayShipmentInvestigation,
            keywords: 'giam dinh don lac phan tich log vet thao tac mat kien cctv giai trinh',
          },
          {
            label: 'Trung tâm CSKH & Khiếu nại',
            icon: 'service_care',
            to: routePaths.customerServiceTickets,
            keywords: 'cskh khieu nai giuc giao doi dia chi ho tro khach hang ai handover sla 24h 48h',
          },
          {
            label: 'Hồ sơ đền bù & Phân định',
            icon: 'metrics_action',
            to: routePaths.claimsLiabilityManagement,
            keywords: 'ho so den bu phan dinh trach nhiem boi thuong hu hong mat kien ai chiu hub nao chiu',
          },
          {
            label: 'Thống kê bồi thường Hub',
            icon: 'operation_report',
            to: routePaths.claimsHubStatistics,
            keywords: 'thong ke boi thuong theo hub bao cao rui ro loss rate che tai',
          },
          {
            label: 'Tra cứu chất lượng sự cố',
            icon: 'service_lookup',
            to: routePaths.serviceQualityIntegratedLookup,
            keywords: 'tra cuu chat luong su co lich su khieu nai',
          },
        ],
      },
      {
        id: 'finance',
        label: 'Tài chính & Đối soát',
        shortLabel: 'Tài chính',
        icon: 'branch_finance_settlement',
        to: routePaths.branchBusinessFinanceCod,
        items: [
          {
            label: 'Quyết toán thu hộ COD',
            icon: 'branch_finance_settlement',
            to: routePaths.branchBusinessFinanceCod,
            keywords: 'quyet toan thu ho cod nop tien ket buu ta',
          },
          {
            label: 'Đối soát công nợ bưu cục',
            icon: 'branch_finance_settlement',
            to: routePaths.branchBusinessFinanceReconcile,
            keywords: 'doi soat cong no buu cuc tai chinh dong tien',
          },
          {
            label: 'Đối soát chế tài bồi thường',
            icon: 'operation_report',
            to: routePaths.claimsHubStatistics,
            keywords: 'doi soat che tai boi thuong khau tru cong no rui ro',
          },
        ],
      },
    ],
    [canViewBranch, canViewFleet, canViewHq],
  );

  const quickTools = useMemo(
    () => [
      {
        label: 'Chat',
        title: 'Chat với Bưu tá',
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
        icon: 'operation_report' as SidebarIconName,
        to: routePaths.downloadCenter,
      },
    ],
    [],
  );

  const activeClusterId = useMemo(() => {
    for (const cluster of menuClusters) {
      if (
        cluster.visible !== false &&
        cluster.items.some((item) => pathMatches(location.pathname, item.to))
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
      pathMatches(location.pathname, routePaths.shipments) ||
      pathMatches(location.pathname, routePaths.scans) ||
      pathMatches(location.pathname, routePaths.groupBranchBusiness) ||
      pathMatches(location.pathname, routePaths.groupOperationsPlatform)
    ) {
      return 'branch';
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
      pathMatches(location.pathname, routePaths.groupFinanceSettlement) ||
      pathMatches(location.pathname, routePaths.branchBusinessFinanceSettlementRoot)
    ) {
      return 'finance';
    }
    return null;
  }, [location.pathname, menuClusters]);

  const [openClusters, setOpenClusters] = useState<Record<string, boolean>>({
    hq: true,
    branch: true,
    linehaul: true,
    quality: true,
    finance: true,
  });

  useEffect(() => {
    if (activeClusterId) {
      setOpenClusters((prev) =>
        prev[activeClusterId] ? prev : { ...prev, [activeClusterId]: true },
      );
    }
  }, [activeClusterId]);

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
            label: `${c.id === 'hq' ? '🌐 ' : c.id === 'branch' ? '🏬 ' : c.id === 'linehaul' ? '🚛 ' : c.id === 'quality' ? '🛡️ ' : '💰 '}${c.shortLabel}`,
            to: c.to,
            isActive: activeClusterId === c.id,
          })),
        {
          label: '📥 Tải về',
          to: routePaths.downloadCenter,
          isActive: pathMatches(location.pathname, routePaths.downloadCenter),
        },
      ]
    : [
        {
          label: 'Vận đơn',
          to: routePaths.shipments,
          isActive: pathMatches(location.pathname, routePaths.shipments),
        },
        {
          label: 'Tracking',
          to: routePaths.tracking,
          isActive: pathMatches(location.pathname, routePaths.tracking),
        },
      ];

  const activeTabLabel = useMemo(() => {
    for (const cluster of menuClusters) {
      for (const item of cluster.items) {
        if (pathMatches(location.pathname, item.to)) {
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
  }, [location.pathname, menuClusters, quickTools]);

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
              >
                <span className="ops-topbar-logo" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.5 19.5V4.5L16.5 17.5V4.5"
                      stroke="#ffffff"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="19.5" cy="5" r="2.2" fill="#93c5fd" />
                  </svg>
                </span>
                <span className="ops-topbar-brand-text">
                  <strong>NEXUS VN</strong>
                  <span>Logistics Control Tower</span>
                </span>
              </button>

              <div className="ops-topbar-actions">
                <form onSubmit={onQuickSearch} className="ops-header-search" role="search">
                  <span className="material-symbols-outlined ops-header-search-icon" aria-hidden="true">
                    search
                  </span>
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
                    }}
                    title={opsTierMeta.description}
                  >
                    <span className="material-symbols-outlined ops-scope-badge-icon">
                      {opsTierMeta.icon}
                    </span>
                    <span>{opsTierMeta.badgeLabel}</span>
                  </span>
                  {allowedScopes.length > 1 && (
                    <div className="ops-scope-select-wrap">
                      <select
                        value={scopeLevel}
                        onChange={(e) => setScopeLevel(e.target.value as ScopeLevel)}
                        className="ops-scope-select"
                        aria-label="Phạm vi dữ liệu"
                      >
                        {allowedScopes.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined ops-scope-select-arrow" aria-hidden="true">
                        expand_more
                      </span>
                    </div>
                  )}
                </div>

                <button type="button" className="ops-header-icon-btn" aria-label="Thông báo" title="Thông báo hệ thống">
                  <span className="material-symbols-outlined">notifications</span>
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
                    <span className="material-symbols-outlined">logout</span>
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="ops-topbar-logo" style={{ width: '30px', height: '30px', borderRadius: '8px' }} aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.5 19.5V4.5L16.5 17.5V4.5"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="19.5" cy="5" r="2.2" fill="#93c5fd" />
              </svg>
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', color: '#0052cc' }}>NEXUS VN</span>
          </button>

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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.5c0 .9-.36 1.77-1 2.4l-1.2 1.2h13.4l-1.2-1.2a3.4 3.4 0 0 1-1-2.4V9A4.5 4.5 0 0 0 12 4.5Z" />
              <path d="M10 17.5a2 2 0 0 0 4 0" />
            </svg>
          </button>

          <div className="ops-func-tier" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: `${opsTierMeta.badgeColor}18`,
                color: opsTierMeta.badgeColor,
                border: `1px solid ${opsTierMeta.badgeColor}40`,
                letterSpacing: '0.3px',
              }}
              title={opsTierMeta.description}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {opsTierMeta.icon}
              </span>
              <span>{opsTierMeta.badgeLabel}</span>
            </span>
            {allowedScopes.length > 1 && (
              <select
                value={scopeLevel}
                onChange={(e) => setScopeLevel(e.target.value as ScopeLevel)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                aria-label="Phạm vi dữ liệu"
              >
                {allowedScopes.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
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
              title={`🏢 Bưu cục: ${currentOperatorHub.name} (${currentOperatorHub.code})\n📍 Địa chỉ: ${currentOperatorHubAddress || 'Đang cập nhật'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#0284c7', flexShrink: 0 }}>
                apartment
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <strong style={{ color: '#0284c7' }}>{currentOperatorHub.name}</strong>
                {currentOperatorHubAddress ? ` • 📍 ${currentOperatorHubAddress}` : ''}
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
        <aside className="ops-func-sidebar">
          <label className="ops-func-sidebar-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
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
                ✕
              </button>
            ) : null}
          </label>

          <nav className="ops-func-sidebar-nav" aria-label="Sidebar navigation">
            {filteredClusters.length === 0 ? (
              <div className="ops-func-sidebar-search-empty">
                Không tìm thấy menu khớp với "{menuSearchKeyword}"
              </div>
            ) : (
              filteredClusters.map((cluster) => {
                const isOpen = isSearching || Boolean(openClusters[cluster.id]);
                const isClusterCurrent = activeClusterId === cluster.id;

                return (
                  <div key={cluster.id} className="ops-func-cluster">
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
                        <svg viewBox="0 0 24 24">
                          <path d="m6 9 6 6 6-6" fill="none" />
                        </svg>
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="ops-func-cluster-items">
                        {cluster.items.map((item) => {
                          const isItemActive = pathMatches(location.pathname, item.to);
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className={`ops-func-sidebar-item ${
                                isItemActive ? 'ops-func-sidebar-item--active' : ''
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

export function AppRouter(): React.JSX.Element {
  const lazyRoute = (element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
  );
  const opsModuleRoute = (title: string, element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>
      <OpsModuleRoute title={title}>{element}</OpsModuleRoute>
    </Suspense>
  );

function AppIndexRedirect(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const isHq = resolveOpsActor(session?.user.username, session?.user.roles) === 'HQ_OPS';
  return <Navigate to={isHq ? routePaths.masterOpsCommandCenter : routePaths.dashboard} replace />;
}

  return (
    <BrowserRouter>
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
              element={opsModuleRoute('Đăng ký chuyển hoàn', <ReturnBlockRegistrationPage />)}
            />
            <Route
              path={routePaths.monitorDataHangNhanLeaf}
              element={<Navigate to={routePaths.monitorDataHangDen} replace />}
            />
            <Route
              path={routePaths.monitorDataHangDenLeaf}
              element={opsModuleRoute('Giám sát hàng đến', <MonitorDataHangDenPage />)}
            />
            <Route
              path={routePaths.monitorDataHangGuiLeaf}
              element={opsModuleRoute('Giám sát hàng gửi', <MonitorDataHangGuiPage />)}
            />
            <Route
              path={routePaths.monitorDataHangPhatLeaf}
              element={opsModuleRoute('Giám sát hàng phát', <MonitorDataHangPhatPage />)}
            />
            <Route
              path={routePaths.monitorData2In1Leaf}
              element={<Navigate to={routePaths.monitorDataHangDen} replace />}
            />
            <Route
              path={routePaths.monitorDataTheoDoiTamUngLeaf}
              element={<Navigate to={routePaths.monitorDataHangDen} replace />}
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
              element={opsModuleRoute('Quản lý tem bao tuyến', <ThermalLabelManagementPage />)}
            />
            <Route
              path={routePaths.linehaulBagLabelPrintLeaf}
              element={opsModuleRoute('In tem bao tuyến', <ThermalLabelPrintPage />)}
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
              element={opsModuleRoute('Tra cứu sự cố / chất lượng', <ServiceQualityIntegratedLookupPage />)}
            />
            <Route
              path={routePaths.serviceQualityAbnormalManagementLeaf}
              element={opsModuleRoute('Quản lý hàng bất thường', <ServiceQualityAbnormalManagementPage />)}
            />
            <Route
              path={routePaths.serviceQualityProactiveActionBoardLeaf}
              element={opsModuleRoute('Bảng cảnh báo chất lượng', <ServiceQualityActionBoardPage />)}
            />
            <Route
              path={routePaths.serviceQualityProactiveInboundLeaf}
              element={<Navigate to={routePaths.serviceQualityProactiveActionBoard} replace />}
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
    </BrowserRouter>
  );
}
