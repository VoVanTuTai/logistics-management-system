export const routePaths = {
  login: '/login',
  appRoot: '/app',
  dashboard: '/app/dashboard',
  analyticsDashboard: '/app/analytics',
  comingSoonDebtReport: '/app/coming-soon/bao-cao-cong-no',
  comingSoonAiCashflow: '/app/coming-soon/ai-du-doan-dong-tien',
  groupsRoot: '/app/function-groups',

  groupOperationsPlatform: '/app/function-groups/operations-platform',
  groupIntegrationServices: '/app/function-groups/integration-services',
  operationsPlatformPickupDispatch:
    '/app/function-groups/operations-platform/dieu-phoi-lay-hang',
  groupBranchBusiness: '/app/function-groups/branch-business',
  branchBusinessOrderManagementRoot:
    '/app/function-groups/branch-business/quan-ly-van-don',
  branchBusinessFinanceSettlementRoot:
    '/app/function-groups/branch-business/quyet-toan-tai-chinh',
  branchBusinessLocalOrdersRoot:
    '/app/function-groups/branch-business/don-tai-buu-cuc',
  branchBusinessLocalOverview:
    '/app/function-groups/branch-business/don-tai-buu-cuc/tong-quan',
  branchBusinessLocalOrders:
    '/app/function-groups/branch-business/don-tai-buu-cuc/quan-ly-don-tai-buu-cuc',
  branchBusinessCourierHandoff:
    '/app/function-groups/branch-business/don-tai-buu-cuc/phat-hang',
  branchBusinessBranchInventory:
    '/app/function-groups/branch-business/don-tai-buu-cuc/don-ton-buu-cuc',
  branchBusinessShiftClosing:
    '/app/function-groups/branch-business/don-tai-buu-cuc/chot-ca',
  branchBusinessOrderCreate:
    '/app/function-groups/branch-business/quan-ly-van-don/them-moi-van-don',
  branchBusinessOrderOutbound:
    '/app/function-groups/branch-business/quan-ly-van-don/quan-ly-van-don-gui',
  branchBusinessOrderDelivery:
    '/app/function-groups/branch-business/quan-ly-van-don/quan-ly-van-don-phat',
  branchBusinessFinanceCod:
    '/app/function-groups/branch-business/quyet-toan-tai-chinh/quyet-toan-thu-ho',
  branchBusinessFinanceReconcile:
    '/app/function-groups/branch-business/quyet-toan-tai-chinh/doi-soat-cong-no',
  groupFinanceSettlement: '/app/function-groups/finance-settlement',
  groupCapabilityPlatform: '/app/function-groups/capability-platform',
  groupOperationsMetrics: '/app/function-groups/operations-metrics',
  groupServiceQuality: '/app/function-groups/service-quality',
  serviceQualityIntegratedLookup:
    '/app/function-groups/service-quality/tra-cuu-tich-hop',
  serviceQualityAbnormalManagement:
    '/app/function-groups/service-quality/hang-bat-thuong',
  serviceQualityProactiveActionBoard:
    '/app/function-groups/service-quality/proactive/action-board',
  serviceQualityProactiveInbound:
    '/app/function-groups/service-quality/proactive/monitor-received',
  serviceQualityProactiveDelivered:
    '/app/function-groups/service-quality/proactive/monitor-delivered',
  groupDatabase: '/app/function-groups/database',
  groupSmartDevices: '/app/function-groups/smart-devices',
  groupPlanningPlatform: '/app/function-groups/planning-platform',
  opsMetricsAbnormalRoot: '/app/function-groups/operations-metrics/kien-bat-thuong',
  opsMetricsDeadlineRoot: '/app/function-groups/operations-metrics/thoi-hieu',
  opsMetricsPlanningRoot: '/app/function-groups/operations-metrics/quy-hoach',
  opsMetricsActionRoot: '/app/function-groups/operations-metrics/thao-tac',
  opsMetricsReport: '/app/function-groups/operations-metrics/bao-cao-van-hanh',
  opsMetricsAbnormalOverview:
    '/app/function-groups/operations-metrics/kien-bat-thuong/tong-quan',
  opsMetricsAbnormalHandling:
    '/app/function-groups/operations-metrics/kien-bat-thuong/theo-doi-xu-ly',
  opsMetricsDeadlineInventory:
    '/app/function-groups/operations-metrics/thoi-hieu/giam-sat-ton-kho',
  opsMetricsDeadlineOntimePickupRatio:
    '/app/function-groups/operations-metrics/thoi-hieu/bao-bieu-ty-le-nhan-hang-kip',
  opsMetricsDeadlineDeliverySla:
    '/app/function-groups/operations-metrics/thoi-hieu/giam-sat-thoi-hieu-hang-phat',
  opsMetricsDeadlineActualSignT1:
    '/app/function-groups/operations-metrics/thoi-hieu/ky-nhan-thuc-te-t1',
  opsMetricsDeadlineOntimeSendRatio:
    '/app/function-groups/operations-metrics/thoi-hieu/ty-le-gui-kien-dung-gio',
  opsMetricsDeadlineDeliveryLeadtime:
    '/app/function-groups/operations-metrics/thoi-hieu/giam-sat-leadtime-phat',
  opsMetricsDeadlineInboundLeadtime:
    '/app/function-groups/operations-metrics/thoi-hieu/giam-sat-leadtime-nhan',
  opsMetricsDeadlineOverdueAlerts:
    '/app/function-groups/operations-metrics/thoi-hieu/he-thong-canh-bao-qua-han',
  opsMetricsPlanningNetworkKpi:
    '/app/function-groups/operations-metrics/quy-hoach/giam-sat-kpi-mang-luoi',
  opsMetricsActionExecutionBoard:
    '/app/function-groups/operations-metrics/thao-tac/ban-dieu-phoi-thao-tac',
  thermalLabelManagement: '/app/function-groups/operations-platform/thermal-label/management',
  thermalLabelPrint: '/app/function-groups/operations-platform/thermal-label/print',
  operationsPlatformChat: '/app/function-groups/operations-platform/chat-courier',
  operationsPlatformChatWithCourier: (courierId: string) =>
    `/app/function-groups/operations-platform/chat-courier?courierId=${encodeURIComponent(courierId)}`,
  operationsPlatformPickupDispatchLeaf:
    'function-groups/operations-platform/dieu-phoi-lay-hang',
  returnBlockRoot: '/app/function-groups/service-quality/chuyen-hoan',
  returnBlockRegistration:
    '/app/function-groups/service-quality/chuyen-hoan/dang-ky-chuyen-hoan',
  returnBlockManagement:
    '/app/function-groups/service-quality/chuyen-hoan/quan-ly-chuyen-hoan',
  legacyReturnBlockRoot: '/app/function-groups/operations-platform/chuyen-hoan',
  legacyReturnBlockRegistration:
    '/app/function-groups/operations-platform/chuyen-hoan/dang-ky-chuyen-hoan',
  legacyReturnBlockManagement:
    '/app/function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-hoan',
  monitorDataRoot: '/app/function-groups/operations-platform/data-monitoring',
  monitorDataHangNhan: '/app/function-groups/operations-platform/data-monitoring/hang-nhan',
  monitorDataHangDen: '/app/function-groups/operations-platform/data-monitoring/hang-den',
  monitorDataHangGui: '/app/function-groups/operations-platform/data-monitoring/hang-gui',
  monitorDataHangPhat: '/app/function-groups/operations-platform/data-monitoring/hang-phat',
  monitorData2In1: '/app/function-groups/operations-platform/data-monitoring/2in1',
  monitorDataTheoDoiTamUng:
    '/app/function-groups/operations-platform/data-monitoring/theo-doi-tam-ung',
  monitorDataDongBao:
    '/app/function-groups/operations-platform/data-monitoring/giam-sat-dong-bao',
  linehaulRoot: '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh',
  linehaulTripManagement: '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/quan-ly-chuyen-xe',
  linehaulVehicleSeal: '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-xe',
  linehaulBagLabelManagement:
    '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-bao/quan-ly',
  linehaulBagLabelPrint:
    '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-bao/in',
  linehaulTripDataMonitor:
    '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/giam-sat-du-lieu-chuyen-xe',
  shipments: '/app/shipments',
  shipmentDetail: (shipmentId: string) => `/app/shipments/${shipmentId}`,
  tasks: '/app/tasks',
  taskDetail: (taskId: string) => `/app/tasks/${taskId}`,
  opsChat: '/app/chat',
  opsChatWithCourier: (courierId: string) =>
    `/app/function-groups/operations-platform/chat-courier?courierId=${encodeURIComponent(courierId)}`,
  scans: '/app/scans',
  ndr: '/app/ndr',
  ndrDetail: (ndrId: string) => `/app/ndr/${ndrId}`,
  tracking: '/app/tracking',
  trackingDetail: (shipmentCode: string) => `/app/tracking/${encodeURIComponent(shipmentCode)}`,

  dashboardLeaf: 'dashboard',
  analyticsDashboardLeaf: 'analytics',
  comingSoonDebtReportLeaf: 'coming-soon/bao-cao-cong-no',
  comingSoonAiCashflowLeaf: 'coming-soon/ai-du-doan-dong-tien',

  groupOperationsPlatformLeaf: 'function-groups/operations-platform',
  groupIntegrationServicesLeaf: 'function-groups/integration-services',

  groupBranchBusinessLeaf: 'function-groups/branch-business',
  branchBusinessLocalOverviewLeaf:
    'function-groups/branch-business/don-tai-buu-cuc/tong-quan',
  branchBusinessLocalOrdersLeaf:
    'function-groups/branch-business/don-tai-buu-cuc/quan-ly-don-tai-buu-cuc',
  branchBusinessCourierHandoffLeaf:
    'function-groups/branch-business/don-tai-buu-cuc/phat-hang',
  branchBusinessBranchInventoryLeaf:
    'function-groups/branch-business/don-tai-buu-cuc/don-ton-buu-cuc',
  branchBusinessShiftClosingLeaf:
    'function-groups/branch-business/don-tai-buu-cuc/chot-ca',
  branchBusinessOrderCreateLeaf:
    'function-groups/branch-business/quan-ly-van-don/them-moi-van-don',
  branchBusinessOrderOutboundLeaf:
    'function-groups/branch-business/quan-ly-van-don/quan-ly-van-don-gui',
  branchBusinessOrderDeliveryLeaf:
    'function-groups/branch-business/quan-ly-van-don/quan-ly-van-don-phat',
  branchBusinessFinanceCodLeaf:
    'function-groups/branch-business/quyet-toan-tai-chinh/quyet-toan-thu-ho',
  branchBusinessFinanceReconcileLeaf:
    'function-groups/branch-business/quyet-toan-tai-chinh/doi-soat-cong-no',
  groupFinanceSettlementLeaf: 'function-groups/finance-settlement',
  groupCapabilityPlatformLeaf: 'function-groups/capability-platform',
  groupOperationsMetricsLeaf: 'function-groups/operations-metrics',
  groupServiceQualityLeaf: 'function-groups/service-quality',
  serviceQualityIntegratedLookupLeaf:
    'function-groups/service-quality/tra-cuu-tich-hop',
  serviceQualityAbnormalManagementLeaf:
    'function-groups/service-quality/hang-bat-thuong',
  serviceQualityProactiveActionBoardLeaf:
    'function-groups/service-quality/proactive/action-board',
  serviceQualityProactiveInboundLeaf:
    'function-groups/service-quality/proactive/monitor-received',
  serviceQualityProactiveDeliveredLeaf:
    'function-groups/service-quality/proactive/monitor-delivered',
  groupDatabaseLeaf: 'function-groups/database',
  groupSmartDevicesLeaf: 'function-groups/smart-devices',
  groupPlanningPlatformLeaf: 'function-groups/planning-platform',
  opsMetricsReportLeaf: 'function-groups/operations-metrics/bao-cao-van-hanh',
  opsMetricsAbnormalOverviewLeaf:
    'function-groups/operations-metrics/kien-bat-thuong/tong-quan',
  opsMetricsAbnormalHandlingLeaf:
    'function-groups/operations-metrics/kien-bat-thuong/theo-doi-xu-ly',
  opsMetricsDeadlineInventoryLeaf:
    'function-groups/operations-metrics/thoi-hieu/giam-sat-ton-kho',
  opsMetricsDeadlineOntimePickupRatioLeaf:
    'function-groups/operations-metrics/thoi-hieu/bao-bieu-ty-le-nhan-hang-kip',
  opsMetricsDeadlineDeliverySlaLeaf:
    'function-groups/operations-metrics/thoi-hieu/giam-sat-thoi-hieu-hang-phat',
  opsMetricsDeadlineActualSignT1Leaf:
    'function-groups/operations-metrics/thoi-hieu/ky-nhan-thuc-te-t1',
  opsMetricsDeadlineOntimeSendRatioLeaf:
    'function-groups/operations-metrics/thoi-hieu/ty-le-gui-kien-dung-gio',
  opsMetricsDeadlineDeliveryLeadtimeLeaf:
    'function-groups/operations-metrics/thoi-hieu/giam-sat-leadtime-phat',
  opsMetricsDeadlineInboundLeadtimeLeaf:
    'function-groups/operations-metrics/thoi-hieu/giam-sat-leadtime-nhan',
  opsMetricsDeadlineOverdueAlertsLeaf:
    'function-groups/operations-metrics/thoi-hieu/he-thong-canh-bao-qua-han',
  opsMetricsPlanningNetworkKpiLeaf:
    'function-groups/operations-metrics/quy-hoach/giam-sat-kpi-mang-luoi',
  opsMetricsActionExecutionBoardLeaf:
    'function-groups/operations-metrics/thao-tac/ban-dieu-phoi-thao-tac',
  thermalLabelManagementLeaf: 'function-groups/operations-platform/thermal-label/management',
  thermalLabelPrintLeaf: 'function-groups/operations-platform/thermal-label/print',
  operationsPlatformChatLeaf: 'function-groups/operations-platform/chat-courier',
  returnBlockRootLeaf: 'function-groups/service-quality/chuyen-hoan',
  returnBlockRegistrationLeaf:
    'function-groups/service-quality/chuyen-hoan/dang-ky-chuyen-hoan',
  returnBlockManagementLeaf:
    'function-groups/service-quality/chuyen-hoan/quan-ly-chuyen-hoan',
  legacyReturnBlockRootLeaf: 'function-groups/operations-platform/chuyen-hoan',
  legacyReturnBlockRegistrationLeaf:
    'function-groups/operations-platform/chuyen-hoan/dang-ky-chuyen-hoan',
  legacyReturnBlockManagementLeaf:
    'function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-hoan',
  monitorDataHangNhanLeaf: 'function-groups/operations-platform/data-monitoring/hang-nhan',
  monitorDataHangDenLeaf: 'function-groups/operations-platform/data-monitoring/hang-den',
  monitorDataHangGuiLeaf: 'function-groups/operations-platform/data-monitoring/hang-gui',
  monitorDataHangPhatLeaf: 'function-groups/operations-platform/data-monitoring/hang-phat',
  monitorData2In1Leaf: 'function-groups/operations-platform/data-monitoring/2in1',
  monitorDataTheoDoiTamUngLeaf:
    'function-groups/operations-platform/data-monitoring/theo-doi-tam-ung',
  monitorDataDongBaoLeaf:
    'function-groups/operations-platform/data-monitoring/giam-sat-dong-bao',
  linehaulTripManagementLeaf: 'function-groups/capability-platform/van-chuyen-tuyen-nhanh/quan-ly-chuyen-xe',
  linehaulVehicleSealLeaf: 'function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-xe',
  linehaulBagLabelManagementLeaf:
    'function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-bao/quan-ly',
  linehaulBagLabelPrintLeaf:
    'function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-bao/in',
  linehaulTripDataMonitorLeaf:
    'function-groups/capability-platform/van-chuyen-tuyen-nhanh/giam-sat-du-lieu-chuyen-xe',
  shipmentsLeaf: 'shipments',
  shipmentDetailLeaf: 'shipments/:shipmentId',
  tasksLeaf: 'tasks',
  taskDetailLeaf: 'tasks/:taskId',
  opsChatLeaf: 'chat',
  scansLeaf: 'scans',
  ndrLeaf: 'ndr',
  ndrDetailLeaf: 'ndr/:ndrId',
  trackingLeaf: 'tracking',
  trackingDetailLeaf: 'tracking/:shipmentCode',

} as const;

// Core routes are backed by gateway/API flows and remain visible in demo production.
export const OPS_CORE_ROUTE_PATHS = [
  routePaths.dashboard,
  routePaths.shipments,
  routePaths.tasks,
  routePaths.opsChat,

  routePaths.scans,
  routePaths.ndr,
  routePaths.tracking,

] as const;

// Full module routes are first-class ops modules kept visible for production hardening.
// They can be hidden only for a compact core-only build.
export const OPS_FULL_MODULE_ROUTE_PATHS = [
  routePaths.analyticsDashboard,
  routePaths.comingSoonDebtReport,
  routePaths.comingSoonAiCashflow,
  routePaths.groupsRoot,
  routePaths.groupOperationsPlatform,
  routePaths.groupBranchBusiness,
  routePaths.groupCapabilityPlatform,
  routePaths.groupOperationsMetrics,
  routePaths.groupServiceQuality,
  routePaths.groupDatabase,
  routePaths.groupSmartDevices,
  routePaths.groupPlanningPlatform,
  routePaths.operationsPlatformPickupDispatch,
  routePaths.branchBusinessOrderManagementRoot,
  routePaths.branchBusinessFinanceSettlementRoot,
  routePaths.branchBusinessLocalOrdersRoot,
  routePaths.branchBusinessLocalOverview,
  routePaths.branchBusinessLocalOrders,
  routePaths.branchBusinessCourierHandoff,
  routePaths.branchBusinessBranchInventory,
  routePaths.branchBusinessShiftClosing,
  routePaths.branchBusinessOrderCreate,
  routePaths.branchBusinessOrderOutbound,
  routePaths.branchBusinessOrderDelivery,
  routePaths.branchBusinessFinanceCod,
  routePaths.branchBusinessFinanceReconcile,
  routePaths.serviceQualityIntegratedLookup,
  routePaths.serviceQualityAbnormalManagement,
  routePaths.serviceQualityProactiveActionBoard,
  routePaths.serviceQualityProactiveInbound,
  routePaths.serviceQualityProactiveDelivered,
  routePaths.opsMetricsAbnormalRoot,
  routePaths.opsMetricsDeadlineRoot,
  routePaths.opsMetricsPlanningRoot,
  routePaths.opsMetricsActionRoot,
  routePaths.opsMetricsReport,
  routePaths.opsMetricsAbnormalOverview,
  routePaths.opsMetricsAbnormalHandling,
  routePaths.opsMetricsDeadlineInventory,
  routePaths.opsMetricsDeadlineOntimePickupRatio,
  routePaths.opsMetricsDeadlineDeliverySla,
  routePaths.opsMetricsDeadlineActualSignT1,
  routePaths.opsMetricsDeadlineOntimeSendRatio,
  routePaths.opsMetricsDeadlineDeliveryLeadtime,
  routePaths.opsMetricsDeadlineInboundLeadtime,
  routePaths.opsMetricsDeadlineOverdueAlerts,
  routePaths.opsMetricsPlanningNetworkKpi,
  routePaths.opsMetricsActionExecutionBoard,
  routePaths.returnBlockRoot,
  routePaths.returnBlockRegistration,
  routePaths.returnBlockManagement,
  routePaths.monitorDataRoot,
  routePaths.monitorDataHangDen,
  routePaths.monitorDataHangGui,
  routePaths.monitorDataHangPhat,
  routePaths.monitorDataDongBao,
  routePaths.linehaulRoot,
  routePaths.linehaulTripManagement,
  routePaths.linehaulVehicleSeal,
  routePaths.linehaulBagLabelManagement,
  routePaths.linehaulBagLabelPrint,
  routePaths.linehaulTripDataMonitor,
] as const;
