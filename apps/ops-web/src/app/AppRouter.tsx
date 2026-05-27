import React, { Suspense, lazy, useEffect, useState } from 'react';
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
import { ComingSoonPlaceholder } from '../pages/shared/ComingSoonPlaceholder';
import { routePaths } from '../navigation/routes';
import { useAuthStore } from '../store/authStore';
import { appEnv } from '../utils/env';
import { formatRoleLabel } from '../utils/logisticsLabels';

function lazyRoutePage<T extends React.ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
): React.LazyExoticComponent<T> {
  return lazy(async () => ({
    default: (await loader())[exportName],
  }));
}

const AnalyticsDashboardPage = lazy(() =>
  import('../pages/dashboard/analytics/AnalyticsDashboardPage').then((module) => ({
    default: module.AnalyticsDashboardPage,
  })),
);
const BasicDataGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/basic-data/BasicDataGroupPage'),
  'BasicDataGroupPage',
);
const BranchLocalOrderOverviewPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/local-orders/BranchLocalOrderOverviewPage'),
  'BranchLocalOrderOverviewPage',
);
const BranchDeliveryDispatchPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/delivery-dispatch/BranchDeliveryDispatchPage'),
  'BranchDeliveryDispatchPage',
);
const BranchBusinessOrderCreatePage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/order-create/BranchBusinessOrderCreatePage'),
  'BranchBusinessOrderCreatePage',
);
const BranchDeliveryOrderManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/order-delivery/BranchDeliveryOrderManagementPage'),
  'BranchDeliveryOrderManagementPage',
);
const BranchFinanceCodSettlementPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage'),
  'BranchFinanceCodSettlementPage',
);
const BranchFinanceReconcilePage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/finance-reconcile/BranchFinanceReconcilePage'),
  'BranchFinanceReconcilePage',
);
const BranchInventoryPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/inventory/BranchInventoryPage'),
  'BranchInventoryPage',
);
const BranchOutboundOrderManagementPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/order-outbound/BranchOutboundOrderManagementPage'),
  'BranchOutboundOrderManagementPage',
);
const BranchShiftClosingPage = lazyRoutePage(
  () => import('../pages/function-groups/branch-business/shift-closing/BranchShiftClosingPage'),
  'BranchShiftClosingPage',
);
const CapabilityPlatformGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/capability-platform/CapabilityPlatformGroupPage'),
  'CapabilityPlatformGroupPage',
);
const CustomerPlatformGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/customer-platform/CustomerPlatformGroupPage'),
  'CustomerPlatformGroupPage',
);
const CustomerOrderDispatchPage = lazyRoutePage(
  () => import('../pages/function-groups/customer-platform/order-dispatch/CustomerOrderDispatchPage'),
  'CustomerOrderDispatchPage',
);
const CustomerOrderLookupPage = lazyRoutePage(
  () => import('../pages/function-groups/customer-platform/order-lookup/CustomerOrderLookupPage'),
  'CustomerOrderLookupPage',
);
const CustomerOrderMonitorPage = lazyRoutePage(
  () => import('../pages/function-groups/customer-platform/order-monitor/CustomerOrderMonitorPage'),
  'CustomerOrderMonitorPage',
);
const DatabaseGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/database/DatabaseGroupPage'),
  'DatabaseGroupPage',
);
const FinanceSettlementGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/finance-settlement/FinanceSettlementGroupPage'),
  'FinanceSettlementGroupPage',
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
const MonitorData2In1Page = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorData2In1Page'),
  'MonitorData2In1Page',
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
const MonitorDataHangNhanPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangNhanPage'),
  'MonitorDataHangNhanPage',
);
const MonitorDataHangPhatPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangPhatPage'),
  'MonitorDataHangPhatPage',
);
const MonitorDataTheoDoiTamUngPage = lazyRoutePage(
  () => import('../pages/function-groups/operations-platform/data-monitoring/MonitorDataTheoDoiTamUngPage'),
  'MonitorDataTheoDoiTamUngPage',
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
const ServiceQualityMonitorDeliveredPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/proactive/ServiceQualityMonitorDeliveredPage'),
  'ServiceQualityMonitorDeliveredPage',
);
const ServiceQualityMonitorReceivedPage = lazyRoutePage(
  () => import('../pages/function-groups/service-quality/proactive/ServiceQualityMonitorReceivedPage'),
  'ServiceQualityMonitorReceivedPage',
);
const SmartDevicesGroupPage = lazyRoutePage(
  () => import('../pages/function-groups/smart-devices/SmartDevicesGroupPage'),
  'SmartDevicesGroupPage',
);
const ConfigManagementPage = lazyRoutePage(
  () => import('../pages/masterdata/ConfigManagementPage'),
  'ConfigManagementPage',
);
const HubManagementPage = lazyRoutePage(
  () => import('../pages/masterdata/HubManagementPage'),
  'HubManagementPage',
);
const NdrReasonManagementPage = lazyRoutePage(
  () => import('../pages/masterdata/NdrReasonManagementPage'),
  'NdrReasonManagementPage',
);
const ZoneManagementPage = lazyRoutePage(
  () => import('../pages/masterdata/ZoneManagementPage'),
  'ZoneManagementPage',
);
const ManifestDetailPage = lazyRoutePage(
  () => import('../pages/manifests/ManifestDetailPage'),
  'ManifestDetailPage',
);
const ManifestManagementPage = lazyRoutePage(
  () => import('../pages/manifests/ManifestManagementPage'),
  'ManifestManagementPage',
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
const TaskAssignmentPage = lazyRoutePage(
  () => import('../pages/tasks/TaskAssignmentPage'),
  'TaskAssignmentPage',
);
const TaskDetailPage = lazyRoutePage(
  () => import('../pages/tasks/TaskDetailPage'),
  'TaskDetailPage',
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
  return isAuthenticated ? <Outlet /> : <Navigate to={routePaths.login} replace />;
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
  | 'tracking_lookup'
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
  | 'customer_order_management'
  | 'customer_order_dispatch'
  | 'branch_local_orders'
  | 'branch_order_management'
  | 'branch_finance_settlement'
  | 'linehaul_transport';

type SidebarPanelKind =
  | 'thermal_label'
  | 'return_block'
  | 'monitor_data'
  | 'service_proactive'
  | 'metrics_abnormal'
  | 'metrics_deadline'
  | 'metrics_planning'
  | 'metrics_action'
  | 'customer_order_management'
  | 'customer_order_dispatch'
  | 'branch_local_orders'
  | 'branch_order_management'
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
    case 'customer_order_management':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7.2h10l1.2 12.1H5.8z" {...common} />
          <path d="M9.2 7.2a2.8 2.8 0 0 1 5.6 0" {...common} />
          <path d="M9 12h6" {...common} />
          <path d="M9 15.2h4.5" {...common} />
        </svg>
      );
    case 'customer_order_dispatch':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.8 7.2h9.4v8.9H4.8z" {...common} />
          <path d="M14.2 10.1h3.2l2 2.5v3.5h-5.2z" {...common} />
          <circle cx="8.1" cy="18" r="1.4" {...common} />
          <circle cx="17.2" cy="18" r="1.4" {...common} />
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
    case 'branch_local_orders':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 6.5h13v11h-13z" {...common} />
          <path d="M8.2 10h7.6" {...common} />
          <path d="M8.2 13h4.4" {...common} />
          <circle cx="16" cy="15.2" r="2.3" {...common} />
          <path d="m14.8 15.2.8.8 1.5-1.7" {...common} />
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

  const roleText =
    (session?.user.roles ?? []).map((role) => formatRoleLabel(role)).join(', ') ||
    'Nhân viên điều hành';
  const enableFullOpsModules = appEnv.enableFullOpsModules;
  const operatorName = session?.user.username ?? 'OPS User';
  const operatorInitial = operatorName.trim().charAt(0).toUpperCase() || 'O';
  const isDashboardRoute = pathMatches(location.pathname, routePaths.dashboard)
    || pathMatches(location.pathname, routePaths.analyticsDashboard)
    || location.pathname.startsWith('/app/coming-soon');

  const isReturnBlockSection = pathMatches(location.pathname, routePaths.returnBlockRoot);
  const isThermalLabelSection =
    pathMatches(location.pathname, routePaths.thermalLabelManagement) ||
    pathMatches(location.pathname, routePaths.thermalLabelPrint);
  const isFinanceSettlementSection =
    pathMatches(location.pathname, routePaths.groupFinanceSettlement) ||
    pathMatches(location.pathname, routePaths.branchBusinessFinanceSettlementRoot);
  const isOperationsPlatformSection =
    pathMatches(location.pathname, routePaths.groupOperationsPlatform) &&
    !isReturnBlockSection;
  const isServiceQualitySection =
    pathMatches(location.pathname, routePaths.groupServiceQuality) ||
    pathMatches(location.pathname, routePaths.ndr) ||
    isReturnBlockSection;
  const isOperationsMetricsSection = pathMatches(
    location.pathname,
    routePaths.groupOperationsMetrics,
  );
  const isBranchBusinessSection =
    pathMatches(location.pathname, routePaths.groupBranchBusiness) &&
    !isFinanceSettlementSection;
  const isCustomerPlatformSection = pathMatches(
    location.pathname,
    routePaths.groupCustomerPlatform,
  );
  const isCapabilityPlatformSection = pathMatches(
    location.pathname,
    routePaths.groupCapabilityPlatform,
  );

  const topNavItems: TopNavItem[] = enableFullOpsModules
    ? [
        {
          label: 'Nền tảng điều hành',
          to: routePaths.shipments,
          isActive:
            pathMatches(location.pathname, routePaths.shipments) ||
            pathMatches(location.pathname, routePaths.tasks) ||
            pathMatches(location.pathname, routePaths.scans) ||
            pathMatches(location.pathname, routePaths.tracking) ||
            isOperationsPlatformSection ||
            pathMatches(location.pathname, routePaths.monitorDataRoot) ||
            pathMatches(location.pathname, routePaths.masterdataHubs) ||
            pathMatches(location.pathname, routePaths.masterdataZones) ||
            pathMatches(location.pathname, routePaths.masterdataNdrReasons) ||
            pathMatches(location.pathname, routePaths.masterdataConfigs),
        },
        {
          label: 'Đơn khách hàng',
          to: routePaths.groupCustomerPlatform,
          isActive: pathMatches(location.pathname, routePaths.groupCustomerPlatform),
        },
        {
          label: 'Kinh doanh bưu cục',
          to: routePaths.groupBranchBusiness,
          isActive: isBranchBusinessSection,
        },
        {
          label: 'Quyết toán tài chính',
          to: routePaths.groupFinanceSettlement,
          isActive: isFinanceSettlementSection,
        },
        {
          label: 'Vận chuyển tuyến',
          to: routePaths.groupCapabilityPlatform,
          isActive: isCapabilityPlatformSection,
        },
        {
          label: 'Chỉ số vận hành',
          to: routePaths.groupOperationsMetrics,
          isActive: isOperationsMetricsSection,
        },
        {
          label: 'Chất lượng dịch vụ',
          to: routePaths.groupServiceQuality,
          isActive: isServiceQualitySection,
        },
      ]
    : [
        {
          label: 'Vận đơn',
          to: routePaths.shipments,
          isActive: pathMatches(location.pathname, routePaths.shipments),
        },
        {
          label: 'Chuyển đơn',
          to: routePaths.tasks,
          isActive: pathMatches(location.pathname, routePaths.tasks),
        },
        {
          label: 'Bao tải',
          to: routePaths.manifests,
          isActive: pathMatches(location.pathname, routePaths.manifests),
        },
        {
          label: 'Tracking',
          to: routePaths.tracking,
          isActive: pathMatches(location.pathname, routePaths.tracking),
        },
      ];

  const operationsSidebarItems: SidebarItem[] = enableFullOpsModules
    ? [
        { label: 'Vận đơn', icon: 'customer_order_management', to: routePaths.shipments },
        { label: 'Chuyển đơn', icon: 'metrics_action', to: routePaths.tasks },
        { label: 'Quét tại hub', icon: 'tracking_lookup', to: routePaths.scans },
        { label: 'Tra cứu hành trình', icon: 'tracking_lookup', to: routePaths.tracking },
        { label: 'Giám sát dữ liệu', icon: 'monitor_data', kind: 'monitor_data' },
        { label: 'Tem bao in nhiệt', icon: 'thermal_label', kind: 'thermal_label' },
      ]
    : [
        { label: 'Vận đơn', icon: 'customer_order_management', to: routePaths.shipments },
        { label: 'Chuyển đơn', icon: 'metrics_action', to: routePaths.tasks },
        { label: 'Quét tại hub', icon: 'tracking_lookup', to: routePaths.scans },
        { label: 'Bao tải', icon: 'thermal_label', to: routePaths.manifests },
        { label: 'Tra cứu hành trình', icon: 'tracking_lookup', to: routePaths.tracking },
  ];
  const serviceQualitySidebarItems: SidebarItem[] = [
    { label: 'Tra cứu sự cố / chất lượng', icon: 'service_lookup', to: routePaths.serviceQualityIntegratedLookup },
    { label: 'Giám sát chủ động', icon: 'service_proactive', kind: 'service_proactive' },
    { label: 'Quản lý hàng bất thường', icon: 'service_abnormal', to: routePaths.serviceQualityAbnormalManagement },
    { label: 'NDR / giao thất bại', icon: 'service_abnormal', to: routePaths.ndr },
    { label: 'Chuyển hoàn', icon: 'return_block', kind: 'return_block' },
  ];
  const operationsMetricsSidebarItems: SidebarItem[] = [
    { label: 'Báo cáo vận hành', icon: 'operation_report', to: routePaths.opsMetricsReport },
    { label: 'Kiện bất thường', icon: 'metrics_abnormal', kind: 'metrics_abnormal' },
    { label: 'Thời hiệu / SLA', icon: 'metrics_deadline', kind: 'metrics_deadline' },
    { label: 'Quy hoạch / KPI mạng lưới', icon: 'metrics_deadline', kind: 'metrics_planning' },
    { label: 'Bàn điều phối thao tác', icon: 'metrics_action', kind: 'metrics_action' },
  ];
  const branchBusinessSidebarItems: SidebarItem[] = [
    {
      label: 'Quản lý đơn tại bưu cục',
      icon: 'branch_local_orders',
      kind: 'branch_local_orders',
    },
    {
      label: 'Quản lý vận đơn',
      icon: 'branch_order_management',
      kind: 'branch_order_management',
    },
  ];
  const customerPlatformSidebarItems: SidebarItem[] = [
    { label: 'Điều phối lấy hàng', icon: 'customer_order_dispatch', to: routePaths.customerPlatformOrderDispatch },
    { label: 'Tra cứu đơn đặt', icon: 'service_lookup', to: routePaths.customerPlatformOrderLookup },
    { label: 'Giám sát đơn đã tạo', icon: 'monitor_data', to: routePaths.customerPlatformOrderMonitor },
  ];
  const financeSettlementSidebarItems: SidebarItem[] = [
    { label: 'Quyết toán thu hộ', icon: 'branch_finance_settlement', to: routePaths.branchBusinessFinanceCod },
    { label: 'Đối soát công nợ', icon: 'branch_finance_settlement', to: routePaths.branchBusinessFinanceReconcile },
  ];
  const capabilityPlatformSidebarItems: SidebarItem[] = [
    { label: 'Quản lý chuyến xe', icon: 'linehaul_transport', to: routePaths.linehaulTripManagement },
    { label: 'Tạo tem xe', icon: 'thermal_label', to: routePaths.linehaulVehicleSeal },
  ];
  const sidebarItems = isServiceQualitySection
    ? serviceQualitySidebarItems
    : isOperationsMetricsSection
    ? operationsMetricsSidebarItems
    : isCustomerPlatformSection
    ? customerPlatformSidebarItems
    : isFinanceSettlementSection
    ? financeSettlementSidebarItems
    : isBranchBusinessSection
    ? branchBusinessSidebarItems
    : isCapabilityPlatformSection
    ? capabilityPlatformSidebarItems
    : operationsSidebarItems;

  const monitorDataChildItems = [
    { label: 'Giám sát hàng đến', to: routePaths.monitorDataHangDen },
    { label: 'Giám sát hàng gửi', to: routePaths.monitorDataHangGui },
    { label: 'Giám sát hàng phát', to: routePaths.monitorDataHangPhat },
    { label: 'Giám sát đóng bao', to: routePaths.monitorDataDongBao },
  ] as const;
  const thermalLabelChildItems = [
    { label: 'Quản lý tem bao', to: routePaths.thermalLabelManagement },
    { label: 'In tem bao', to: routePaths.thermalLabelPrint },
  ] as const;
  const linehaulChildItems = [
    { label: 'Quản lý chuyến xe', to: routePaths.linehaulTripManagement },
    { label: 'Tạo tem xe', to: routePaths.linehaulVehicleSeal },
  ] as const;
  const returnBlockChildItems = [
    { label: 'Đăng ký chuyển hoàn', to: routePaths.returnBlockRegistration },
    { label: 'Quản lý chuyển hoàn', to: routePaths.returnBlockManagement },
  ] as const;
  const serviceQualityProactiveChildItems = [
    { label: 'Bảng cảnh báo', to: routePaths.serviceQualityProactiveActionBoard },
    { label: 'Giám sát đơn nhận', to: routePaths.serviceQualityProactiveInbound },
    { label: 'Giám sát đơn phát', to: routePaths.serviceQualityProactiveDelivered },
  ] as const;
  const operationsMetricsAbnormalChildItems = [
    { label: 'Tổng quan kiện bất thường', to: routePaths.opsMetricsAbnormalOverview },
    { label: 'Theo dõi xử lý kiện', to: routePaths.opsMetricsAbnormalHandling },
  ] as const;
  const operationsMetricsDeadlineChildItems = [
    { label: 'Giám sát tồn kho', to: routePaths.opsMetricsDeadlineInventory },
    { label: 'Báo biểu tỷ lệ nhận hàng kịp', to: routePaths.opsMetricsDeadlineOntimePickupRatio },
    { label: 'Giám sát thời hiệu hàng phát', to: routePaths.opsMetricsDeadlineDeliverySla },
    { label: 'Ký nhận thực tế (T-1)', to: routePaths.opsMetricsDeadlineActualSignT1 },
    { label: 'Tỷ lệ gửi kiện đúng giờ', to: routePaths.opsMetricsDeadlineOntimeSendRatio },
    { label: 'Giám sát leadtime phát (Mới)', to: routePaths.opsMetricsDeadlineDeliveryLeadtime },
    { label: 'Giám sát leadtime nhận', to: routePaths.opsMetricsDeadlineInboundLeadtime },
    { label: 'Hệ thống cảnh báo quá hạn', to: routePaths.opsMetricsDeadlineOverdueAlerts },
  ] as const;
  const operationsMetricsPlanningChildItems = [
    { label: 'Giám sát KPI mạng lưới', to: routePaths.opsMetricsPlanningNetworkKpi },
  ] as const;
  const operationsMetricsActionChildItems = [
    { label: 'Bàn điều phối thao tác', to: routePaths.opsMetricsActionExecutionBoard },
  ] as const;
  const branchBusinessOrderManagementChildItems = [
    { label: 'Thêm mới vận đơn', to: routePaths.branchBusinessOrderCreate },
    { label: 'Quản lý vận đơn gửi', to: routePaths.branchBusinessOrderOutbound },
    { label: 'Quản lý vận đơn phát', to: routePaths.branchBusinessOrderDelivery },
  ] as const;
  const branchBusinessLocalOrdersChildItems = [
    { label: 'Tổng quan đơn tại bưu cục', to: routePaths.branchBusinessLocalOverview },
    { label: 'Quản lý đơn tại bưu cục', to: routePaths.branchBusinessLocalOrders },
    { label: 'Phát hàng', to: routePaths.branchBusinessCourierHandoff },
    { label: 'Đơn tồn bưu cục', to: routePaths.branchBusinessBranchInventory },
    { label: 'Chốt ca', to: routePaths.branchBusinessShiftClosing },
  ] as const;
  const branchBusinessFinanceSettlementChildItems = [
    { label: 'Quyết toán thu hộ', to: routePaths.branchBusinessFinanceCod },
    { label: 'Đối soát công nợ', to: routePaths.branchBusinessFinanceReconcile },
  ] as const;
  const customerPlatformOrderManagementChildItems = [
    { label: 'Tra cứu đơn đặt', to: routePaths.customerPlatformOrderLookup },
    { label: 'Giám sát đơn đã tạo', to: routePaths.customerPlatformOrderMonitor },
  ] as const;
  const customerPlatformOrderDispatchChildItems = [
    { label: 'Điều phối lấy hàng', to: routePaths.customerPlatformOrderDispatch },
    { label: 'Tra cứu đơn đặt', to: routePaths.customerPlatformOrderLookup },
    { label: 'Giám sát đơn đã tạo', to: routePaths.customerPlatformOrderMonitor },
  ] as const;

  const panelItemsMap: Record<SidebarPanelKind, ReadonlyArray<{ label: string; to: string }>> = {
    thermal_label: thermalLabelChildItems,
    linehaul_transport: linehaulChildItems,
    return_block: returnBlockChildItems,
    monitor_data: monitorDataChildItems,
    service_proactive: serviceQualityProactiveChildItems,
    metrics_abnormal: operationsMetricsAbnormalChildItems,
    metrics_deadline: operationsMetricsDeadlineChildItems,
    metrics_planning: operationsMetricsPlanningChildItems,
    metrics_action: operationsMetricsActionChildItems,
    customer_order_management: customerPlatformOrderManagementChildItems,
    customer_order_dispatch: customerPlatformOrderDispatchChildItems,
    branch_local_orders: branchBusinessLocalOrdersChildItems,
    branch_order_management: branchBusinessOrderManagementChildItems,
    branch_finance_settlement: branchBusinessFinanceSettlementChildItems,
  };

  const panelTitleMap: Record<SidebarPanelKind, string> = {
    thermal_label: 'Tem bao in nhiệt',
    linehaul_transport: 'Vận chuyển tuyến nhánh',
    return_block: 'Chuyển hoàn',
    monitor_data: 'Giám sát dữ liệu',
    service_proactive: 'Giám sát chủ động',
    metrics_abnormal: 'Kiện bất thường',
    metrics_deadline: 'Thời hiệu',
    metrics_planning: 'Quy hoạch',
    metrics_action: 'Thao tác',
    customer_order_management: 'Quản lý đơn đặt',
    customer_order_dispatch: 'Điều phối lấy hàng',
    branch_local_orders: 'Quản lý đơn tại bưu cục',
    branch_order_management: 'Quản lý vận đơn',
    branch_finance_settlement: 'Quyết toán tài chính',
  };

  const isMonitorDataRoute = monitorDataChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isThermalLabelRoute =
    pathMatches(location.pathname, routePaths.thermalLabelManagement) ||
    pathMatches(location.pathname, routePaths.thermalLabelPrint);
  const isLinehaulRoute =
    pathMatches(location.pathname, routePaths.linehaulRoot) ||
    linehaulChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isReturnBlockRoute =
    pathMatches(location.pathname, routePaths.returnBlockRoot) ||
    returnBlockChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isServiceQualityProactiveRoute = serviceQualityProactiveChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isServiceQualityIntegratedLookupRoute = pathMatches(
    location.pathname,
    routePaths.serviceQualityIntegratedLookup,
  );
  const isServiceQualityAbnormalManagementRoute = pathMatches(
    location.pathname,
    routePaths.serviceQualityAbnormalManagement,
  );
  const isOpsMetricsAbnormalRoute = operationsMetricsAbnormalChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isOpsMetricsDeadlineRoute = operationsMetricsDeadlineChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isOpsMetricsPlanningRoute = operationsMetricsPlanningChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isOpsMetricsActionRoute = operationsMetricsActionChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isBranchOrderManagementRoute = branchBusinessOrderManagementChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isBranchFinanceSettlementRoute = branchBusinessFinanceSettlementChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isBranchLocalOrdersRoute =
    pathMatches(location.pathname, routePaths.branchBusinessLocalOrdersRoot) ||
    branchBusinessLocalOrdersChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isCustomerOrderManagementRoute =
    pathMatches(location.pathname, routePaths.customerPlatformOrderManagementRoot) ||
    customerPlatformOrderManagementChildItems.some((item) =>
      pathMatches(location.pathname, item.to),
    );
  const isCustomerOrderDispatchRoute =
    pathMatches(location.pathname, routePaths.customerPlatformOrderDispatchRoot) ||
    pathMatches(location.pathname, routePaths.customerPlatformOrderDispatch) ||
    customerPlatformOrderDispatchChildItems.some((item) =>
      pathMatches(location.pathname, item.to),
    );

  const routeDrivenPanel: SidebarPanelKind | null = isThermalLabelRoute
    ? 'thermal_label'
    : isLinehaulRoute
    ? 'linehaul_transport'
    : isReturnBlockRoute
    ? 'return_block'
    : isMonitorDataRoute
    ? 'monitor_data'
    : isServiceQualityProactiveRoute
    ? 'service_proactive'
    : isOpsMetricsAbnormalRoute
    ? 'metrics_abnormal'
    : isOpsMetricsDeadlineRoute
    ? 'metrics_deadline'
    : isOpsMetricsPlanningRoute
    ? 'metrics_planning'
    : isOpsMetricsActionRoute
    ? 'metrics_action'
    : isBranchOrderManagementRoute
    ? 'branch_order_management'
    : isBranchFinanceSettlementRoute
    ? 'branch_finance_settlement'
    : isBranchLocalOrdersRoute
    ? 'branch_local_orders'
    : isCustomerOrderDispatchRoute
    ? 'customer_order_dispatch'
    : isCustomerOrderManagementRoute
    ? 'customer_order_management'
    : pathMatches(location.pathname, routePaths.groupOperationsMetrics)
    ? 'metrics_deadline'
    : pathMatches(location.pathname, routePaths.groupCustomerPlatform)
    ? 'customer_order_dispatch'
    : pathMatches(location.pathname, routePaths.groupBranchBusiness)
    ? 'branch_local_orders'
    : null;

  const [activeSidebarPanel, setActiveSidebarPanel] = useState<SidebarPanelKind | null>(
    routeDrivenPanel,
  );

  useEffect(() => {
    if (routeDrivenPanel) {
      setActiveSidebarPanel(routeDrivenPanel);
    }
  }, [routeDrivenPanel]);

  const activePanelKinds: ReadonlyArray<SidebarPanelKind> = isServiceQualitySection
    ? ['service_proactive', 'return_block']
    : isOperationsMetricsSection
    ? ['metrics_abnormal', 'metrics_deadline', 'metrics_planning', 'metrics_action']
    : isCustomerPlatformSection
    ? []
    : isFinanceSettlementSection
    ? []
    : isBranchBusinessSection
    ? ['branch_local_orders', 'branch_order_management']
    : isCapabilityPlatformSection
    ? []
    : ['monitor_data', 'thermal_label'];

  const activeSidebarPanelInSection =
    activeSidebarPanel &&
    activePanelKinds.some((panelKind) => panelKind === activeSidebarPanel)
      ? activeSidebarPanel
      : null;

  const isSidebarSecondaryOpen = activeSidebarPanelInSection !== null;
  const sidebarSecondaryItems = activeSidebarPanelInSection
    ? panelItemsMap[activeSidebarPanelInSection]
    : [];
  const sidebarSecondaryTitle = activeSidebarPanelInSection
    ? panelTitleMap[activeSidebarPanelInSection]
    : '';
  const sidebarTitle = isServiceQualitySection
    ? 'Chất lượng dịch vụ'
    : isOperationsMetricsSection
    ? 'Chỉ số vận hành'
    : isCustomerPlatformSection
    ? 'Đơn khách hàng'
    : isFinanceSettlementSection
    ? 'Quyết toán tài chính'
    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
    : isCapabilityPlatformSection
    ? 'Vận chuyển tuyến'
    : !enableFullOpsModules
    ? 'Ops production'
    : 'Nền tảng điều hành';

  const operationsMetricsAllChildItems = [
    { label: 'Báo cáo vận hành', to: routePaths.opsMetricsReport },
    ...operationsMetricsAbnormalChildItems,
    ...operationsMetricsDeadlineChildItems,
    ...operationsMetricsPlanningChildItems,
    ...operationsMetricsActionChildItems,
  ];
  const activeOperationsMetricsItem =
    operationsMetricsAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const activeReturnBlockItem =
    returnBlockChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const branchBusinessAllChildItems = [
    ...branchBusinessLocalOrdersChildItems,
    ...branchBusinessOrderManagementChildItems,
  ];
  const activeBranchBusinessItem =
    branchBusinessAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const financeSettlementAllChildItems = [...branchBusinessFinanceSettlementChildItems];
  const activeFinanceSettlementItem =
    financeSettlementAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const customerPlatformAllChildItems = [
    ...customerPlatformOrderDispatchChildItems,
    ...customerPlatformOrderManagementChildItems,
  ];
  const activeCustomerPlatformItem =
    customerPlatformAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const activeLinehaulItem =
    linehaulChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;

  const activeTabLabel = pathMatches(location.pathname, routePaths.tracking)
    ? 'Tra cứu hành trình'
    : pathMatches(location.pathname, routePaths.shipments)
    ? 'Vận đơn'
    : pathMatches(location.pathname, routePaths.tasks)
    ? 'Chuyển đơn'
    : pathMatches(location.pathname, routePaths.manifests)
    ? 'Bao tải'
    : pathMatches(location.pathname, routePaths.scans)
    ? 'Quét hub'
    : pathMatches(location.pathname, routePaths.ndr)
    ? 'NDR'
    : pathMatches(location.pathname, routePaths.masterdataHubs) ||
      pathMatches(location.pathname, routePaths.masterdataZones) ||
      pathMatches(location.pathname, routePaths.masterdataNdrReasons) ||
      pathMatches(location.pathname, routePaths.masterdataConfigs)
    ? 'Masterdata'
    : isMonitorDataRoute
    ? 'Giám sát dữ liệu'
    : isThermalLabelRoute
    ? 'Tem bao in nhiệt'
    : activeLinehaulItem
    ? activeLinehaulItem.label
    : isLinehaulRoute
    ? 'Vận chuyển tuyến nhánh'
    : activeReturnBlockItem
    ? activeReturnBlockItem.label
    : isReturnBlockRoute
    ? 'Chuyển hoàn'
    : isServiceQualityProactiveRoute
    ? 'Giám sát chủ động'
    : activeOperationsMetricsItem
    ? activeOperationsMetricsItem.label
    : isOperationsMetricsSection
    ? 'Chỉ số vận hành'
    : activeFinanceSettlementItem
    ? activeFinanceSettlementItem.label
    : isFinanceSettlementSection
    ? 'Quyết toán tài chính'
    : activeBranchBusinessItem
    ? activeBranchBusinessItem.label
    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
    : activeCustomerPlatformItem
    ? activeCustomerPlatformItem.label
    : isCustomerPlatformSection
    ? 'Đơn khách hàng'
    : isServiceQualityIntegratedLookupRoute
    ? 'Tra cứu sự cố / chất lượng'
    : isServiceQualityAbnormalManagementRoute
    ? 'Quản lý hàng bất thường'
    : pathMatches(location.pathname, routePaths.groupServiceQuality)
    ? 'Chất lượng dịch vụ'
    : 'Trang chủ';
  const sidebarClassName = [
    'ops-func-sidebar',
    isSidebarSecondaryOpen ? 'ops-func-sidebar--expanded' : '',
    isOperationsMetricsSection ? 'ops-func-sidebar--ops-metrics' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
      <div className="ops-layout ops-layout--no-sidebar">
        <div className="ops-workspace ops-workspace--full">
          <header className="ops-topbar ops-topbar--full">
            <button
              type="button"
              className="ops-topbar-brand ops-topbar-brand--button"
              onClick={() => navigate(routePaths.dashboard)}
              aria-label="Go to dashboard"
            >
              <span className="ops-topbar-logo">NEXUS</span>
              <span className="ops-topbar-brand-text">
                <strong>NEXUS VN</strong>
                <span>NEXUS logistics control tower</span>
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
                  placeholder="Tra cứu mã vận đơn"
                  aria-label="Tra cứu mã vận đơn"
                />
                <button type="submit" className="ops-topbar-search-submit">
                  Tìm
                </button>
              </form>

              <button type="button" className="ops-topbar-icon-btn" aria-label="Thông báo">
                <svg viewBox="0 0 24 24">
                  <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.5c0 .9-.36 1.77-1 2.4l-1.2 1.2h13.4l-1.2-1.2a3.4 3.4 0 0 1-1-2.4V9A4.5 4.5 0 0 0 12 4.5Z" />
                  <path d="M10 17.5a2 2 0 0 0 4 0" />
                </svg>
              </button>

              <div className="ops-topbar-profile" aria-label="Tài khoản">
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
                {logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
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
          <button
            type="button"
            className="ops-func-logo ops-func-logo--button"
            onClick={() => navigate(routePaths.dashboard)}
            aria-label="Go to dashboard"
          >
            NEXUS VN
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

          <button type="button" className="ops-func-bell" aria-label="Thông báo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.5c0 .9-.36 1.77-1 2.4l-1.2 1.2h13.4l-1.2-1.2a3.4 3.4 0 0 1-1-2.4V9A4.5 4.5 0 0 0 12 4.5Z" />
              <path d="M10 17.5a2 2 0 0 0 4 0" />
            </svg>
          </button>

          <div className="ops-func-user" aria-label="Tài khoản">
            <span className="ops-func-user-avatar">{operatorInitial}</span>
            <span className="ops-func-user-name">{operatorName}</span>
          </div>
        </div>
      </header>

      <div className="ops-func-body">
        <aside
          className={sidebarClassName}
        >
          <label className="ops-func-sidebar-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input type="text" placeholder="Tra cứu menu" aria-label="Tra cứu menu" />
          </label>

          <div className="ops-func-sidebar-title">
            <span />
            {sidebarTitle}
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
                if (item.sectionLabel) {
                  return (
                    <div key={item.sectionLabel} className="ops-func-sidebar-section">
                      {item.sectionLabel}
                    </div>
                  );
                }

                const isActive =
                  item.kind === 'thermal_label'
                    ? isThermalLabelRoute
                    : item.kind === 'return_block'
                    ? isReturnBlockRoute
                    : item.kind === 'monitor_data'
                    ? isMonitorDataRoute
                    : item.kind === 'service_proactive'
                    ? isServiceQualityProactiveRoute
                    : item.kind === 'metrics_abnormal'
                    ? isOpsMetricsAbnormalRoute
                    : item.kind === 'metrics_deadline'
                    ? isOpsMetricsDeadlineRoute
                    : item.kind === 'metrics_planning'
                    ? isOpsMetricsPlanningRoute
                    : item.kind === 'metrics_action'
                    ? isOpsMetricsActionRoute
                    : item.kind === 'branch_order_management'
                    ? isBranchOrderManagementRoute
                    : item.kind === 'branch_finance_settlement'
                    ? isBranchFinanceSettlementRoute
                    : item.kind === 'branch_local_orders'
                    ? isBranchLocalOrdersRoute
                    : item.kind === 'customer_order_management'
                    ? isCustomerOrderManagementRoute && !isCustomerOrderDispatchRoute
                    : item.kind === 'customer_order_dispatch'
                    ? isCustomerOrderDispatchRoute
                    : item.to
                    ? pathMatches(location.pathname, item.to)
                    : false;

                if (item.kind) {
                  const isOpen = activeSidebarPanelInSection === item.kind;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setActiveSidebarPanel((currentPanel) =>
                          currentPanel === item.kind ? null : item.kind,
                        );
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
                          <path d={isOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} />
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
  const lazyRoute = (element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
  );
  const opsModuleRoute = (title: string, element: React.ReactNode) => (
    <Suspense fallback={<RouteLoadingFallback />}>
      <OpsModuleRoute title={title}>{element}</OpsModuleRoute>
    </Suspense>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path={routePaths.appRoot} element={<DashboardLayout />}>
            <Route index element={<Navigate to={routePaths.dashboard} replace />} />
            <Route path={routePaths.dashboardLeaf} element={<DashboardPage />} />
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
              path={routePaths.groupBasicDataLeaf}
              element={opsModuleRoute('Dữ liệu cơ bản', <BasicDataGroupPage />)}
            />
            <Route
              path={routePaths.groupOperationsPlatformLeaf}
              element={opsModuleRoute('Nền tảng điều hành', <OperationsPlatformGroupPage />)}
            />
            <Route
              path={routePaths.thermalLabelManagementLeaf}
              element={opsModuleRoute('Quản lý tem bao in nhiệt', <ThermalLabelManagementPage />)}
            />
            <Route
              path={routePaths.thermalLabelPrintLeaf}
              element={opsModuleRoute('In tem bao', <ThermalLabelPrintPage />)}
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
              element={opsModuleRoute('Giám sát hàng nhận', <MonitorDataHangNhanPage />)}
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
              element={opsModuleRoute('Giám sát 2in1', <MonitorData2In1Page />)}
            />
            <Route
              path={routePaths.monitorDataTheoDoiTamUngLeaf}
              element={opsModuleRoute('Theo dõi tạm ứng', <MonitorDataTheoDoiTamUngPage />)}
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
              element={opsModuleRoute('Tạo tem xe', <LinehaulVehicleSealPage />)}
            />
            <Route
              path={routePaths.groupIntegrationServicesLeaf}
              element={<Navigate to={routePaths.dashboard} replace />}
            />
            <Route
              path={routePaths.groupCustomerPlatformLeaf}
              element={opsModuleRoute('Đơn khách hàng', <CustomerPlatformGroupPage />)}
            />
            <Route
              path={routePaths.customerPlatformOrderManagementLeaf}
              element={<Navigate to={routePaths.customerPlatformOrderLookup} replace />}
            />
            <Route
              path={routePaths.customerPlatformOrderDispatchRootLeaf}
              element={<Navigate to={routePaths.customerPlatformOrderDispatch} replace />}
            />
            <Route
              path={routePaths.customerPlatformOrderDispatchLeaf}
              element={opsModuleRoute('Điều phối lấy hàng', <CustomerOrderDispatchPage />)}
            />
            <Route
              path={routePaths.customerPlatformOrderLookupLeaf}
              element={opsModuleRoute('Tra cứu đơn đặt', <CustomerOrderLookupPage />)}
            />
            <Route
              path={routePaths.customerPlatformOrderMonitorLeaf}
              element={opsModuleRoute('Giám sát đơn đã tạo', <CustomerOrderMonitorPage />)}
            />
            <Route
              path={routePaths.groupBranchBusinessLeaf}
              element={<Navigate to={routePaths.branchBusinessLocalOverview} replace />}
            />
            <Route
              path={routePaths.branchBusinessLocalOverviewLeaf}
              element={opsModuleRoute('Tổng quan đơn tại bưu cục', <BranchLocalOrderOverviewPage />)}
            />
            <Route
              path={routePaths.branchBusinessLocalOrdersLeaf}
              element={opsModuleRoute(
                'Quản lý đơn tại bưu cục',
                <BranchLocalOrderOverviewPage mode="management" />,
              )}
            />
            <Route
              path={routePaths.branchBusinessCourierHandoffLeaf}
              element={opsModuleRoute('Phát hàng tại bưu cục', <BranchDeliveryDispatchPage />)}
            />
            <Route
              path={routePaths.branchBusinessBranchInventoryLeaf}
              element={opsModuleRoute('Đơn tồn bưu cục', <BranchInventoryPage />)}
            />
            <Route
              path={routePaths.branchBusinessShiftClosingLeaf}
              element={opsModuleRoute('Chốt ca', <BranchShiftClosingPage />)}
            />
            <Route
              path={routePaths.branchBusinessOrderCreateLeaf}
              element={opsModuleRoute('Thêm mới vận đơn', <BranchBusinessOrderCreatePage />)}
            />
            <Route
              path={routePaths.branchBusinessOrderOutboundLeaf}
              element={opsModuleRoute('Quản lý vận đơn gửi', <BranchOutboundOrderManagementPage />)}
            />
            <Route
              path={routePaths.branchBusinessOrderDeliveryLeaf}
              element={opsModuleRoute('Quản lý vận đơn phát', <BranchDeliveryOrderManagementPage />)}
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
              element={opsModuleRoute('Quyết toán tài chính', <FinanceSettlementGroupPage />)}
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
              element={opsModuleRoute(
                'Tổng quan kiện bất thường',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_ABNORMAL_OVERVIEW"
                  title="Tổng quan kiện bất thường"
                  summary="Theo dõi tổng quan kiện bất thường theo khu vực và trạng thái xử lý."
                />,
              )}
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
              element={opsModuleRoute('Giám sát tồn kho', <OpsMetricsInventoryMonitorPage />)}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimePickupRatioLeaf}
              element={opsModuleRoute(
                'Báo biểu tỷ lệ nhận hàng kịp',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_PICKUP_RATIO"
                  title="Báo biểu tỷ lệ nhận hàng kịp"
                  summary="Báo cáo tỷ lệ nhận hàng kịp theo khung giờ và TTTC."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliverySlaLeaf}
              element={opsModuleRoute(
                'Giám sát thời hiệu hàng phát',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_DELIVERY_SLA"
                  title="Giám sát thời hiệu hàng phát"
                  summary="Theo dõi SLA phát hàng và danh sách đơn có nguy cơ trễ hạn."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineActualSignT1Leaf}
              element={opsModuleRoute(
                'Ký nhận thực tế T-1',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_SIGN_T1"
                  title="Ký nhận thực tế (T-1)"
                  summary="Tổng hợp dữ liệu ký nhận thực tế và so sánh với mục tiêu T-1."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimeSendRatioLeaf}
              element={opsModuleRoute(
                'Tỷ lệ gửi kiện đúng giờ',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_SEND_RATIO"
                  title="Tỷ lệ gửi kiện đúng giờ"
                  summary="Báo cáo tỷ lệ gửi kiện đúng giờ theo hub, chi nhánh và ca vận hành."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliveryLeadtimeLeaf}
              element={opsModuleRoute(
                'Giám sát leadtime phát',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_DELIVERY_LEADTIME"
                  title="Giám sát leadtime phát (Mới)"
                  summary="Phân tích leadtime phát theo tuyến và gom cảnh báo trễ hạn mới."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineInboundLeadtimeLeaf}
              element={opsModuleRoute(
                'Giám sát leadtime nhận',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_INBOUND_LEADTIME"
                  title="Giám sát leadtime nhận"
                  summary="Giám sát leadtime nhận hàng theo điểm nhận và theo dõi điểm nghẽn."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOverdueAlertsLeaf}
              element={opsModuleRoute(
                'Hệ thống cảnh báo quá hạn',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_DEADLINE_OVERDUE_ALERTS"
                  title="Hệ thống cảnh báo quá hạn"
                  summary="Tập trung cảnh báo quá hạn để ưu tiên xử lý theo mức độ rủi ro."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsPlanningNetworkKpiLeaf}
              element={opsModuleRoute(
                'Giám sát KPI mạng lưới',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_PLANNING_NETWORK_KPI"
                  title="Giám sát KPI mạng lưới"
                  summary="Tổng hợp KPI quy hoạch mạng lưới và đánh giá mức độ đáp ứng năng lực."
                />,
              )}
            />
            <Route
              path={routePaths.opsMetricsActionExecutionBoardLeaf}
              element={opsModuleRoute(
                'Bàn điều phối thao tác',
                <OperationsMetricsDerivedRoutePage
                  groupCode="OPS_METRICS_ACTION_EXECUTION_BOARD"
                  title="Bàn điều phối thao tác"
                  summary="Quản lý tác vụ thao tác và trạng thái hoàn thành theo ngày."
                />,
              )}
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
              element={opsModuleRoute('Bảng cảnh báo', <ServiceQualityActionBoardPage />)}
            />
            <Route
              path={routePaths.serviceQualityProactiveInboundLeaf}
              element={opsModuleRoute('Giám sát đơn nhận', <ServiceQualityMonitorReceivedPage />)}
            />
            <Route
              path={routePaths.serviceQualityProactiveDeliveredLeaf}
              element={opsModuleRoute('Giám sát đơn phát', <ServiceQualityMonitorDeliveredPage />)}
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
            <Route path={routePaths.tasksLeaf} element={lazyRoute(<TaskAssignmentPage />)} />
            <Route path={routePaths.taskDetailLeaf} element={lazyRoute(<TaskDetailPage />)} />
            <Route
              path={routePaths.manifestsLeaf}
              element={
                appEnv.enableFullOpsModules
                  ? <Navigate to={routePaths.thermalLabelManagement} replace />
                  : lazyRoute(<ManifestManagementPage />)
              }
            />
            <Route path={routePaths.manifestDetailLeaf} element={lazyRoute(<ManifestDetailPage />)} />
            <Route path={routePaths.scansLeaf} element={lazyRoute(<HubScanPage />)} />
            <Route path={routePaths.ndrLeaf} element={lazyRoute(<NdrHandlingPage />)} />
            <Route path={routePaths.ndrDetailLeaf} element={lazyRoute(<NdrCaseDetailPage />)} />
            <Route path={routePaths.trackingLeaf} element={lazyRoute(<TrackingLookupPage />)} />
            <Route path={routePaths.trackingDetailLeaf} element={lazyRoute(<TrackingDetailPage />)} />
            <Route path={routePaths.masterdataHubsLeaf} element={lazyRoute(<HubManagementPage />)} />
            <Route path={routePaths.masterdataZonesLeaf} element={lazyRoute(<ZoneManagementPage />)} />
            <Route
              path={routePaths.masterdataNdrReasonsLeaf}
              element={lazyRoute(<NdrReasonManagementPage />)}
            />
            <Route path={routePaths.masterdataConfigsLeaf} element={lazyRoute(<ConfigManagementPage />)} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routePaths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
