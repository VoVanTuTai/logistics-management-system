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
import { getStoredAuthSession } from '../features/auth/auth.session';
import { GlobalChatBubble } from '../features/chat/GlobalChatBubble';
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

  const isFinanceSettlementSection =
    pathMatches(location.pathname, routePaths.groupFinanceSettlement);
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
    pathMatches(location.pathname, routePaths.groupBranchBusiness) ||
    isFinanceSettlementSection;

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
            pathMatches(location.pathname, routePaths.opsChat) ||
            pathMatches(location.pathname, routePaths.scans) ||
            pathMatches(location.pathname, routePaths.tracking) ||
            isOperationsPlatformSection ||
            pathMatches(location.pathname, routePaths.operationsPlatformPickupDispatch) ||
            pathMatches(location.pathname, routePaths.operationsPlatformDeliveryDispatch) ||
            pathMatches(location.pathname, routePaths.monitorDataRoot),
        },

        {
          label: 'Kinh doanh bưu cục',
          to: routePaths.groupBranchBusiness,
          isActive: isBranchBusinessSection,
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
          label: 'Tracking',
          to: routePaths.tracking,
          isActive: pathMatches(location.pathname, routePaths.tracking),
        },
      ];

  const operationsSidebarItems: SidebarItem[] = enableFullOpsModules
    ? [
        { label: 'Vận đơn', icon: 'branch_order_management', to: routePaths.shipments },
        { label: 'Chat courier', icon: 'chat', to: routePaths.operationsPlatformChat },
        { label: 'Điều phối vận đơn', icon: 'shipment_dispatch', kind: 'shipment_dispatch' },
        { label: 'Quét tại hub', icon: 'tracking_lookup', to: routePaths.scans },
        { label: 'Tra cứu hành trình', icon: 'tracking_lookup', to: routePaths.tracking },
        { label: 'Giám sát dữ liệu', icon: 'monitor_data', kind: 'monitor_data' },
      ]
    : [
        { label: 'Vận đơn', icon: 'branch_order_management', to: routePaths.shipments },
        { label: 'Chat courier', icon: 'chat', to: routePaths.operationsPlatformChat },
        { label: 'Điều phối vận đơn', icon: 'shipment_dispatch', kind: 'shipment_dispatch' },
        { label: 'Quét tại hub', icon: 'tracking_lookup', to: routePaths.scans },
        { label: 'Tra cứu hành trình', icon: 'tracking_lookup', to: routePaths.tracking },
  ];

  const serviceQualitySidebarItems: SidebarItem[] = [
    { label: 'Bảng cảnh báo chất lượng', icon: 'service_proactive', to: routePaths.serviceQualityProactiveActionBoard },
    { label: 'Tra cứu sự cố / chất lượng', icon: 'service_lookup', to: routePaths.serviceQualityIntegratedLookup },
    { label: 'Quản lý hàng bất thường', icon: 'service_abnormal', to: routePaths.serviceQualityAbnormalManagement },
    { label: 'Chuyển hoàn', icon: 'return_block', kind: 'return_block' },
  ];
  const operationsMetricsSidebarItems: SidebarItem[] = [
    { label: 'Báo cáo vận hành', icon: 'operation_report', to: routePaths.opsMetricsReport },
    { label: 'Tồn kho & quá hạn', icon: 'metrics_deadline', to: routePaths.opsMetricsDeadlineInventory },
    { label: 'Đơn cần chú ý', icon: 'metrics_abnormal', to: routePaths.opsMetricsAbnormalHandling },
  ];
  const branchBusinessSidebarItems: SidebarItem[] = [
    {
      label: 'Tạo vận đơn tại quầy',
      icon: 'branch_order_management',
      to: routePaths.branchBusinessOrderCreate,
    },
    {
      label: 'Báo cáo cuối ngày',
      icon: 'metrics_action',
      to: routePaths.branchBusinessShiftClosing,
    },
    {
      label: 'Quyết toán tài chính',
      icon: 'branch_finance_settlement',
      kind: 'branch_finance_settlement',
    },
  ];

  const capabilityPlatformSidebarItems: SidebarItem[] = [
    { label: 'Quản lý chuyến xe', icon: 'linehaul_transport', to: routePaths.linehaulTripManagement },
    { label: 'Tem xe / chuyến', icon: 'thermal_label', to: routePaths.linehaulVehicleSeal },
    { label: 'Quản lý tem bao', icon: 'thermal_label', to: routePaths.linehaulBagLabelManagement },
    { label: 'In tem bao', icon: 'thermal_label', to: routePaths.linehaulBagLabelPrint },
    { label: 'Giám sát dữ liệu chuyến xe', icon: 'monitor_data', to: routePaths.linehaulTripDataMonitor },
  ];
  const sidebarItems = isServiceQualitySection
    ? serviceQualitySidebarItems
    : isOperationsMetricsSection
    ? operationsMetricsSidebarItems

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
  const linehaulChildItems = [
    { label: 'Quản lý chuyến xe', to: routePaths.linehaulTripManagement },
    { label: 'Tem xe / chuyến', to: routePaths.linehaulVehicleSeal },
    { label: 'Quản lý tem bao', to: routePaths.linehaulBagLabelManagement },
    { label: 'In tem bao', to: routePaths.linehaulBagLabelPrint },
    { label: 'Giám sát dữ liệu chuyến xe', to: routePaths.linehaulTripDataMonitor },
  ] as const;
  const returnBlockChildItems = [
    { label: 'Đăng ký chuyển hoàn', to: routePaths.returnBlockRegistration },
    { label: 'Quản lý chuyển hoàn', to: routePaths.returnBlockManagement },
  ] as const;
  const shipmentDispatchChildItems = [
    { label: 'Điều phối lấy hàng', to: routePaths.operationsPlatformPickupDispatch },
    { label: 'Điều phối phát hàng', to: routePaths.operationsPlatformDeliveryDispatch },
  ] as const;
  const branchBusinessDirectItems = [
    { label: 'Tạo vận đơn tại quầy', to: routePaths.branchBusinessOrderCreate },
    { label: 'Báo cáo cuối ngày', to: routePaths.branchBusinessShiftClosing },
  ] as const;
  const branchBusinessFinanceSettlementChildItems = [
    { label: 'Quyết toán thu hộ', to: routePaths.branchBusinessFinanceCod },
    { label: 'Đối soát công nợ', to: routePaths.branchBusinessFinanceReconcile },
  ] as const;


  const panelItemsMap: Record<SidebarPanelKind, ReadonlyArray<{ label: string; to: string }>> = {
    linehaul_transport: linehaulChildItems,
    shipment_dispatch: shipmentDispatchChildItems,
    return_block: returnBlockChildItems,
    monitor_data: monitorDataChildItems,

    branch_finance_settlement: branchBusinessFinanceSettlementChildItems,
  };

  const panelTitleMap: Record<SidebarPanelKind, string> = {
    linehaul_transport: 'Vận chuyển tuyến nhánh',
    shipment_dispatch: 'Điều phối vận đơn',
    return_block: 'Chuyển hoàn',
    monitor_data: 'Giám sát dữ liệu',

    branch_finance_settlement: 'Quyết toán tài chính',
  };

  const isMonitorDataRoute = monitorDataChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isLinehaulRoute =
    pathMatches(location.pathname, routePaths.linehaulRoot) ||
    linehaulChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isReturnBlockRoute =
    pathMatches(location.pathname, routePaths.returnBlockRoot) ||
    returnBlockChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isShipmentDispatchRoute = shipmentDispatchChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );
  const isServiceQualityActionBoardRoute = pathMatches(
    location.pathname,
    routePaths.serviceQualityProactiveActionBoard,
  );
  const isServiceQualityIntegratedLookupRoute = pathMatches(
    location.pathname,
    routePaths.serviceQualityIntegratedLookup,
  );
  const isServiceQualityAbnormalManagementRoute = pathMatches(
    location.pathname,
    routePaths.serviceQualityAbnormalManagement,
  );
  const isBranchFinanceSettlementRoute = branchBusinessFinanceSettlementChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
  );


  const routeDrivenPanel: SidebarPanelKind | null = isLinehaulRoute
    ? 'linehaul_transport'
    : isReturnBlockRoute
    ? 'return_block'
    : isShipmentDispatchRoute
    ? 'shipment_dispatch'
    : isMonitorDataRoute
    ? 'monitor_data'
    : isBranchFinanceSettlementRoute || isFinanceSettlementSection
    ? 'branch_finance_settlement'
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
    ? ['return_block']
    : isOperationsMetricsSection
    ? []
    : isBranchBusinessSection
    ? ['branch_finance_settlement']
    : isCapabilityPlatformSection
    ? []
    : ['shipment_dispatch', 'monitor_data'];

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

    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
    : isCapabilityPlatformSection
    ? 'Vận chuyển tuyến'
    : !enableFullOpsModules
    ? 'Ops production'
    : 'Nền tảng điều hành';

  const operationsMetricsAllChildItems = [
    { label: 'Báo cáo vận hành', to: routePaths.opsMetricsReport },
    { label: 'Tồn kho & quá hạn', to: routePaths.opsMetricsDeadlineInventory },
    { label: 'Đơn cần chú ý', to: routePaths.opsMetricsAbnormalHandling },
  ];
  const activeOperationsMetricsItem =
    operationsMetricsAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const activeReturnBlockItem =
    returnBlockChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const branchBusinessAllChildItems = [
    ...branchBusinessDirectItems,
    ...branchBusinessFinanceSettlementChildItems,
  ];
  const activeBranchBusinessItem =
    branchBusinessAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const activeLinehaulItem =
    linehaulChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;

  const activeTabLabel = pathMatches(location.pathname, routePaths.tracking)
    ? 'Tra cứu hành trình'
    : pathMatches(location.pathname, routePaths.shipments)
    ? 'Vận đơn'
    : pathMatches(location.pathname, routePaths.scans)
    ? 'Quét hub'
    : pathMatches(location.pathname, routePaths.ndr)
    ? 'NDR'
    : pathMatches(location.pathname, routePaths.operationsPlatformPickupDispatch)
    ? 'Điều phối lấy hàng'
    : pathMatches(location.pathname, routePaths.operationsPlatformDeliveryDispatch)
    ? 'Điều phối phát hàng'
    : isMonitorDataRoute
    ? 'Giám sát dữ liệu'
    : activeLinehaulItem
    ? activeLinehaulItem.label
    : isLinehaulRoute
    ? 'Vận chuyển tuyến nhánh'
    : activeReturnBlockItem
    ? activeReturnBlockItem.label
    : isReturnBlockRoute
    ? 'Chuyển hoàn'
    : isServiceQualityActionBoardRoute
    ? 'Bảng cảnh báo chất lượng'
    : activeOperationsMetricsItem
    ? activeOperationsMetricsItem.label
    : isOperationsMetricsSection
    ? 'Chỉ số vận hành'
    : activeBranchBusinessItem
    ? activeBranchBusinessItem.label
    : isFinanceSettlementSection
    ? 'Quyết toán tài chính'
    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
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
                  item.kind === 'return_block'
                    ? isReturnBlockRoute
                    : item.kind === 'shipment_dispatch'
                    ? isShipmentDispatchRoute
                    : item.kind === 'monitor_data'
                    ? isMonitorDataRoute
                    : item.kind === 'branch_finance_settlement'
                    ? isBranchFinanceSettlementRoute
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
