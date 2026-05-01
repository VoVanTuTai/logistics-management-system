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
import { BranchLocalOrderOverviewPage } from '../pages/function-groups/branch-business/local-orders/BranchLocalOrderOverviewPage';
import { BranchDeliveryDispatchPage } from '../pages/function-groups/branch-business/delivery-dispatch/BranchDeliveryDispatchPage';
import { BranchBusinessOrderCreatePage } from '../pages/function-groups/branch-business/order-create/BranchBusinessOrderCreatePage';
import { BranchDeliveryOrderManagementPage } from '../pages/function-groups/branch-business/order-delivery/BranchDeliveryOrderManagementPage';
import { BranchOutboundOrderManagementPage } from '../pages/function-groups/branch-business/order-outbound/BranchOutboundOrderManagementPage';
import { BranchBusinessFeaturePlaceholderPage } from '../pages/function-groups/branch-business/shared/BranchBusinessFeaturePlaceholderPage';
import { CapabilityPlatformGroupPage } from '../pages/function-groups/capability-platform/CapabilityPlatformGroupPage';
import { CustomerPlatformGroupPage } from '../pages/function-groups/customer-platform/CustomerPlatformGroupPage';
import { CustomerOrderDispatchPage } from '../pages/function-groups/customer-platform/order-dispatch/CustomerOrderDispatchPage';
import { DatabaseGroupPage } from '../pages/function-groups/database/DatabaseGroupPage';
import { FinanceSettlementGroupPage } from '../pages/function-groups/finance-settlement/FinanceSettlementGroupPage';
import { IntegrationServicesGroupPage } from '../pages/function-groups/integration-services/IntegrationServicesGroupPage';
import { OperationsMetricsGroupPage } from '../pages/function-groups/operations-metrics/OperationsMetricsGroupPage';
import { OpsMetricsInventoryMonitorPage } from '../pages/function-groups/operations-metrics/deadline/OpsMetricsInventoryMonitorPage';
import { OperationsMetricsFeaturePlaceholderPage } from '../pages/function-groups/operations-metrics/shared/OperationsMetricsFeaturePlaceholderPage';
import { OperationsPlatformGroupPage } from '../pages/function-groups/operations-platform/OperationsPlatformGroupPage';
import { MonitorData2In1Page } from '../pages/function-groups/operations-platform/data-monitoring/MonitorData2In1Page';
import { MonitorDataDongBaoPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataDongBaoPage';
import { MonitorDataHangDenPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangDenPage';
import { MonitorDataHangGuiPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangGuiPage';
import { MonitorDataHangNhanPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangNhanPage';
import { MonitorDataHangPhatPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataHangPhatPage';
import { MonitorDataTheoDoiTamUngPage } from '../pages/function-groups/operations-platform/data-monitoring/MonitorDataTheoDoiTamUngPage';
import { ReturnBlockManagementPage } from '../pages/function-groups/operations-platform/return-block/ReturnBlockManagementPage';
import { ThermalLabelManagementPage } from '../pages/function-groups/operations-platform/thermal-label/ThermalLabelManagementPage';
import { ThermalLabelPrintPage } from '../pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage';
import { PlanningPlatformGroupPage } from '../pages/function-groups/planning-platform/PlanningPlatformGroupPage';
import { ServiceQualityGroupPage } from '../pages/function-groups/service-quality/ServiceQualityGroupPage';
import { ServiceQualityMonitorDeliveredPage } from '../pages/function-groups/service-quality/proactive/ServiceQualityMonitorDeliveredPage';
import { ServiceQualityMonitorReceivedPage } from '../pages/function-groups/service-quality/proactive/ServiceQualityMonitorReceivedPage';
import { FunctionGroupLandingPage } from '../pages/function-groups/shared/FunctionGroupLandingPage';
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
  | 'branch_finance_settlement';

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
  | 'branch_finance_settlement';

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
  const operatorName = session?.user.username ?? 'OPS User';
  const operatorInitial = operatorName.trim().charAt(0).toUpperCase() || 'O';
  const isDashboardRoute = pathMatches(location.pathname, routePaths.dashboard);

  const isServiceQualitySection = pathMatches(location.pathname, routePaths.groupServiceQuality);
  const isOperationsMetricsSection = pathMatches(
    location.pathname,
    routePaths.groupOperationsMetrics,
  );
  const isBranchBusinessSection = pathMatches(
    location.pathname,
    routePaths.groupBranchBusiness,
  );
  const isCustomerPlatformSection = pathMatches(
    location.pathname,
    routePaths.groupCustomerPlatform,
  );

  const topNavItems: TopNavItem[] = [
    {
      label: 'Dữ liệu cơ bản',
      to: routePaths.groupBasicData,
      isActive:
        pathMatches(location.pathname, routePaths.groupBasicData) ||
        pathMatches(location.pathname, routePaths.shipments) ||
        pathMatches(location.pathname, routePaths.pickups),
    },
    {
      label: 'Nền tảng điều hành',
      to: routePaths.groupOperationsPlatform,
      isActive:
        pathMatches(location.pathname, routePaths.groupOperationsPlatform) ||
        pathMatches(location.pathname, routePaths.thermalLabelManagement) ||
        pathMatches(location.pathname, routePaths.thermalLabelPrint) ||
        pathMatches(location.pathname, routePaths.returnBlockRoot) ||
        pathMatches(location.pathname, routePaths.monitorDataRoot) ||
        pathMatches(location.pathname, routePaths.tasks) ||
        pathMatches(location.pathname, routePaths.scans) ||
        pathMatches(location.pathname, routePaths.ndr) ||
        pathMatches(location.pathname, routePaths.tracking),
    },
    {
      label: 'Chỉ số vận hành',
      to: routePaths.groupOperationsMetrics,
      isActive: isOperationsMetricsSection,
    },
    {
      label: 'Dịch vụ tích hợp',
      to: routePaths.groupIntegrationServices,
      isActive:
        pathMatches(location.pathname, routePaths.groupIntegrationServices) ||
        pathMatches(location.pathname, routePaths.manifests),
    },
    {
      label: 'Nền tảng khách hàng',
      to: routePaths.groupCustomerPlatform,
      isActive: pathMatches(location.pathname, routePaths.groupCustomerPlatform),
    },
    {
      label: 'Kinh doanh bưu cục',
      to: routePaths.groupBranchBusiness,
      isActive: isBranchBusinessSection,
    },
  ];

  const operationsSidebarItems: SidebarItem[] = [
    { label: 'Tra cứu hành trình', icon: 'tracking_lookup', to: routePaths.tracking },
    { label: 'Tem bao in nhiệt', icon: 'thermal_label', kind: 'thermal_label' },
    { label: 'Chuyển hoàn', icon: 'return_block', kind: 'return_block' },
    { label: 'Giám sát dữ liệu', icon: 'monitor_data', kind: 'monitor_data' },
    // Tạm ẩn theo yêu cầu: Quản lý ký nhận, Báo biểu thao tác
  ];
  const serviceQualitySidebarItems: SidebarItem[] = [
    { label: 'Tra cứu tích', icon: 'service_lookup' },
    { label: 'Giám sát chủ động', icon: 'service_proactive', kind: 'service_proactive' },
    { label: 'CSKH', icon: 'service_care' },
    { label: 'Trọng tải', icon: 'service_weight' },
    { label: 'Quản lý hàng bất thường', icon: 'service_abnormal' },
  ];
  const operationsMetricsSidebarItems: SidebarItem[] = [
    { label: 'Kiện bất thường', icon: 'metrics_abnormal', kind: 'metrics_abnormal' },
    { label: 'Thời hiệu', icon: 'metrics_deadline', kind: 'metrics_deadline' },
    { label: 'Quy hoạch', icon: 'metrics_planning', kind: 'metrics_planning' },
    { label: 'Thao tác', icon: 'metrics_action', kind: 'metrics_action' },
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
    {
      label: 'Quyết toán tài chính',
      icon: 'branch_finance_settlement',
      kind: 'branch_finance_settlement',
    },
  ];
  const customerPlatformSidebarItems: SidebarItem[] = [
    {
      label: 'Quản lý đơn đặt',
      icon: 'customer_order_management',
      kind: 'customer_order_management',
    },
    {
      label: 'Điều phối đơn đặt',
      icon: 'customer_order_dispatch',
      kind: 'customer_order_dispatch',
    },
  ];
  const sidebarItems = isServiceQualitySection
    ? serviceQualitySidebarItems
    : isOperationsMetricsSection
    ? operationsMetricsSidebarItems
    : isCustomerPlatformSection
    ? customerPlatformSidebarItems
    : isBranchBusinessSection
    ? branchBusinessSidebarItems
    : operationsSidebarItems;

  const monitorDataChildItems = [
    { label: 'Giám sát hàng nhận', to: routePaths.monitorDataHangNhan },
    { label: 'Giám sát hàng đến', to: routePaths.monitorDataHangDen },
    { label: 'Giám sát hàng gửi', to: routePaths.monitorDataHangGui },
    { label: 'Giám sát hàng phát', to: routePaths.monitorDataHangPhat },
    { label: 'Giám sát 2in1', to: routePaths.monitorData2In1 },
    { label: 'Theo dõi tạm ứng', to: routePaths.monitorDataTheoDoiTamUng },
    { label: 'Giám sát đóng bao', to: routePaths.monitorDataDongBao },
  ] as const;
  const thermalLabelChildItems = [
    { label: 'Quản lý tem bao', to: routePaths.thermalLabelManagement },
    { label: 'In tem bao', to: routePaths.thermalLabelPrint },
  ] as const;
  const returnBlockChildItems = [
    { label: 'Quản lý chuyển hoàn', to: routePaths.returnBlockManagement },
    { label: 'Quản lý chuyển tiếp', to: routePaths.returnForwardManagement },
  ] as const;
  const serviceQualityProactiveChildItems = [
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
    { label: 'Điều phối', to: routePaths.customerPlatformOrderDispatch },
    { label: 'Tra cứu đơn đặt', to: routePaths.customerPlatformOrderLookup },
    { label: 'Giám sát đơn đã tạo', to: routePaths.customerPlatformOrderMonitor },
  ] as const;

  const panelItemsMap: Record<SidebarPanelKind, ReadonlyArray<{ label: string; to: string }>> = {
    thermal_label: thermalLabelChildItems,
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
    return_block: 'Chuyển hoàn',
    monitor_data: 'Giám sát dữ liệu',
    service_proactive: 'Giám sát chủ động',
    metrics_abnormal: 'Kiện bất thường',
    metrics_deadline: 'Thời hiệu',
    metrics_planning: 'Quy hoạch',
    metrics_action: 'Thao tác',
    customer_order_management: 'Quản lý đơn đặt',
    customer_order_dispatch: 'Điều phối đơn đặt',
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
  const isReturnBlockRoute =
    pathMatches(location.pathname, routePaths.returnBlockRoot) ||
    returnBlockChildItems.some((item) => pathMatches(location.pathname, item.to));
  const isServiceQualityProactiveRoute = serviceQualityProactiveChildItems.some((item) =>
    pathMatches(location.pathname, item.to),
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
    ? ['service_proactive']
    : isOperationsMetricsSection
    ? ['metrics_abnormal', 'metrics_deadline', 'metrics_planning', 'metrics_action']
    : isCustomerPlatformSection
    ? ['customer_order_management', 'customer_order_dispatch']
    : isBranchBusinessSection
    ? ['branch_local_orders', 'branch_order_management', 'branch_finance_settlement']
    : ['thermal_label', 'return_block', 'monitor_data'];

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
    ? 'Nền tảng khách hàng'
    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
    : 'Nền tảng điều hành';

  const operationsMetricsAllChildItems = [
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
    ...branchBusinessFinanceSettlementChildItems,
  ];
  const activeBranchBusinessItem =
    branchBusinessAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;
  const customerPlatformAllChildItems = [
    ...customerPlatformOrderDispatchChildItems,
    ...customerPlatformOrderManagementChildItems,
  ];
  const activeCustomerPlatformItem =
    customerPlatformAllChildItems.find((item) => pathMatches(location.pathname, item.to)) ?? null;

  const activeTabLabel = pathMatches(location.pathname, routePaths.tracking)
    ? 'Tra cứu hành trình'
    : isMonitorDataRoute
    ? 'Giám sát dữ liệu'
    : isThermalLabelRoute
    ? 'Tem bao in nhiệt'
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
    : activeBranchBusinessItem
    ? activeBranchBusinessItem.label
    : isBranchBusinessSection
    ? 'Kinh doanh bưu cục'
    : activeCustomerPlatformItem
    ? activeCustomerPlatformItem.label
    : isCustomerPlatformSection
    ? 'Nền tảng khách hàng'
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
                  placeholder="Tra cứu hành trình đơn"
                  aria-label="Tra cứu hành trình đơn"
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
            JMS VN
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
              placeholder="Tra cứu hành trình đơn"
              aria-label="Tra cứu hành trình đơn"
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
              path={routePaths.returnBlockManagementLeaf}
              element={<ReturnBlockManagementPage />}
            />
            <Route
              path={routePaths.returnForwardManagementLeaf}
              element={
                <FunctionGroupLandingPage
                  groupCode="RETURN_FORWARD_MANAGEMENT"
                  title="Quản lý chuyển tiếp"
                  summary="Màn hình quản lý chuyển tiếp trong nhóm Chuyển hoàn."
                />
              }
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
              path={routePaths.customerPlatformOrderManagementLeaf}
              element={<Navigate to={routePaths.customerPlatformOrderLookup} replace />}
            />
            <Route
              path={routePaths.customerPlatformOrderDispatchRootLeaf}
              element={<Navigate to={routePaths.customerPlatformOrderDispatch} replace />}
            />
            <Route
              path={routePaths.customerPlatformOrderDispatchLeaf}
              element={<CustomerOrderDispatchPage />}
            />
            <Route
              path={routePaths.customerPlatformOrderLookupLeaf}
              element={
                <FunctionGroupLandingPage
                  groupCode="CUSTOMER_ORDER_LOOKUP"
                  title="Tra cứu đơn đặt"
                  summary="Màn hình tra cứu đơn đặt theo mã đơn, mã vận đơn và thông tin khách hàng."
                />
              }
            />
            <Route
              path={routePaths.customerPlatformOrderMonitorLeaf}
              element={
                <FunctionGroupLandingPage
                  groupCode="CUSTOMER_ORDER_MONITOR"
                  title="Giám sát đơn đã tạo"
                  summary="Màn hình giám sát các đơn đặt đã tạo và trạng thái xử lý hiện tại."
                />
              }
            />
            <Route
              path={routePaths.groupBranchBusinessLeaf}
              element={<Navigate to={routePaths.branchBusinessLocalOverview} replace />}
            />
            <Route
              path={routePaths.branchBusinessLocalOverviewLeaf}
              element={<BranchLocalOrderOverviewPage />}
            />
            <Route
              path={routePaths.branchBusinessLocalOrdersLeaf}
              element={<BranchLocalOrderOverviewPage mode="management" />}
            />
            <Route
              path={routePaths.branchBusinessCourierHandoffLeaf}
              element={<BranchDeliveryDispatchPage />}
            />
            <Route
              path={routePaths.branchBusinessBranchInventoryLeaf}
              element={
                <BranchBusinessFeaturePlaceholderPage
                  groupCode="BRANCH_ORDER_INVENTORY"
                  title="Đơn tồn bưu cục"
                  summary="Theo dõi các đơn lưu tại bưu cục quá thời gian mục tiêu hoặc có cảnh báo bất thường."
                />
              }
            />
            <Route
              path={routePaths.branchBusinessShiftClosingLeaf}
              element={
                <BranchBusinessFeaturePlaceholderPage
                  groupCode="BRANCH_SHIFT_CLOSING"
                  title="Chốt ca"
                  summary="Tổng hợp đơn nhận, đơn phát, đơn gửi đi và đơn tồn cuối ca của bưu cục."
                />
              }
            />
            <Route
              path={routePaths.branchBusinessOrderCreateLeaf}
              element={<BranchBusinessOrderCreatePage />}
            />
            <Route
              path={routePaths.branchBusinessOrderOutboundLeaf}
              element={<BranchOutboundOrderManagementPage />}
            />
            <Route
              path={routePaths.branchBusinessOrderDeliveryLeaf}
              element={<BranchDeliveryOrderManagementPage />}
            />
            <Route
              path={routePaths.branchBusinessFinanceCodLeaf}
              element={
                <BranchBusinessFeaturePlaceholderPage
                  groupCode="BRANCH_FINANCE_COD_SETTLEMENT"
                  title="Quyết toán thu hộ"
                  summary="Tổng hợp đối soát thu hộ COD và phân bổ chênh lệch theo ngày."
                />
              }
            />
            <Route
              path={routePaths.branchBusinessFinanceReconcileLeaf}
              element={
                <BranchBusinessFeaturePlaceholderPage
                  groupCode="BRANCH_FINANCE_RECONCILE"
                  title="Đối soát công nợ"
                  summary="Báo cáo đối soát công nợ bưu cục, hỗ trợ chốt số theo chu kỳ."
                />
              }
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
              path={routePaths.opsMetricsAbnormalOverviewLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_ABNORMAL_OVERVIEW"
                  title="Tổng quan kiện bất thường"
                  summary="Theo dõi tổng quan kiện bất thường theo khu vực và trạng thái xử lý."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsAbnormalHandlingLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_ABNORMAL_HANDLING"
                  title="Theo dõi xử lý kiện"
                  summary="Giám sát tiến độ xử lý kiện bất thường theo từng đơn vị vận hành."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineInventoryLeaf}
              element={<OpsMetricsInventoryMonitorPage />}
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimePickupRatioLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_PICKUP_RATIO"
                  title="Báo biểu tỷ lệ nhận hàng kịp"
                  summary="Báo cáo tỷ lệ nhận hàng kịp theo khung giờ và TTTC."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliverySlaLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_DELIVERY_SLA"
                  title="Giám sát thời hiệu hàng phát"
                  summary="Theo dõi SLA phát hàng và danh sách đơn có nguy cơ trễ hạn."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineActualSignT1Leaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_SIGN_T1"
                  title="Ký nhận thực tế (T-1)"
                  summary="Tổng hợp dữ liệu ký nhận thực tế và so sánh với mục tiêu T-1."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineOntimeSendRatioLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_SEND_RATIO"
                  title="Tỷ lệ gửi kiện đúng giờ"
                  summary="Báo cáo tỷ lệ gửi kiện đúng giờ theo hub, chi nhánh và ca vận hành."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineDeliveryLeadtimeLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_DELIVERY_LEADTIME"
                  title="Giám sát leadtime phát (Mới)"
                  summary="Phân tích leadtime phát theo tuyến và gom cảnh báo trễ hạn mới."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineInboundLeadtimeLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_INBOUND_LEADTIME"
                  title="Giám sát leadtime nhận"
                  summary="Giám sát leadtime nhận hàng theo điểm nhận và theo dõi điểm nghẽn."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsDeadlineOverdueAlertsLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_DEADLINE_OVERDUE_ALERTS"
                  title="Hệ thống cảnh báo quá hạn"
                  summary="Tập trung cảnh báo quá hạn để ưu tiên xử lý theo mức độ rủi ro."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsPlanningNetworkKpiLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_PLANNING_NETWORK_KPI"
                  title="Giám sát KPI mạng lưới"
                  summary="Tổng hợp KPI quy hoạch mạng lưới và đánh giá mức độ đáp ứng năng lực."
                />
              }
            />
            <Route
              path={routePaths.opsMetricsActionExecutionBoardLeaf}
              element={
                <OperationsMetricsFeaturePlaceholderPage
                  groupCode="OPS_METRICS_ACTION_EXECUTION_BOARD"
                  title="Bàn điều phối thao tác"
                  summary="Quản lý tác vụ thao tác và trạng thái hoàn thành theo ngày."
                />
              }
            />
            <Route
              path={routePaths.groupServiceQualityLeaf}
              element={<ServiceQualityGroupPage />}
            />
            <Route
              path={routePaths.serviceQualityProactiveInboundLeaf}
              element={<ServiceQualityMonitorReceivedPage />}
            />
            <Route
              path={routePaths.serviceQualityProactiveDeliveredLeaf}
              element={<ServiceQualityMonitorDeliveredPage />}
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
