export const routePaths = {
  login: '/login',
  appRoot: '/app',
  dashboard: '/app/dashboard',
  groupsRoot: '/app/function-groups',
  groupBasicData: '/app/function-groups/basic-data',
  groupOperationsPlatform: '/app/function-groups/operations-platform',
  groupIntegrationServices: '/app/function-groups/integration-services',
  groupCustomerPlatform: '/app/function-groups/customer-platform',
  customerPlatformOrderManagementRoot:
    '/app/function-groups/customer-platform/quan-ly-don-dat',
  customerPlatformOrderDispatchRoot:
    '/app/function-groups/customer-platform/dieu-phoi-don-dat',
  customerPlatformOrderDispatch:
    '/app/function-groups/customer-platform/dieu-phoi-don-dat/dieu-phoi',
  customerPlatformOrderLookup:
    '/app/function-groups/customer-platform/dieu-phoi-don-dat/tra-cuu-don-dat',
  customerPlatformOrderMonitor:
    '/app/function-groups/customer-platform/dieu-phoi-don-dat/giam-sat-don-da-tao',
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
  returnBlockRoot: '/app/function-groups/operations-platform/chuyen-hoan',
  returnBlockManagement:
    '/app/function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-hoan',
  returnForwardManagement:
    '/app/function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-tiep',
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
  shipments: '/app/shipments',
  shipmentDetail: (shipmentId: string) => `/app/shipments/${shipmentId}`,
  pickups: '/app/pickups',
  pickupDetail: (pickupId: string) => `/app/pickups/${pickupId}`,
  tasks: '/app/tasks',
  taskDetail: (taskId: string) => `/app/tasks/${taskId}`,
  manifests: '/app/manifests',
  manifestDetail: (manifestId: string) => `/app/manifests/${manifestId}`,
  scans: '/app/scans',
  ndr: '/app/ndr',
  ndrDetail: (ndrId: string) => `/app/ndr/${ndrId}`,
  tracking: '/app/tracking',
  trackingDetail: (shipmentCode: string) => `/app/tracking/${encodeURIComponent(shipmentCode)}`,
  masterdataHubs: '/app/masterdata/hubs',
  masterdataZones: '/app/masterdata/zones',
  masterdataNdrReasons: '/app/masterdata/ndr-reasons',
  masterdataConfigs: '/app/masterdata/configs',
  dashboardLeaf: 'dashboard',
  groupBasicDataLeaf: 'function-groups/basic-data',
  groupOperationsPlatformLeaf: 'function-groups/operations-platform',
  groupIntegrationServicesLeaf: 'function-groups/integration-services',
  groupCustomerPlatformLeaf: 'function-groups/customer-platform',
  customerPlatformOrderManagementLeaf:
    'function-groups/customer-platform/quan-ly-don-dat',
  customerPlatformOrderDispatchRootLeaf:
    'function-groups/customer-platform/dieu-phoi-don-dat',
  customerPlatformOrderDispatchLeaf:
    'function-groups/customer-platform/dieu-phoi-don-dat/dieu-phoi',
  customerPlatformOrderLookupLeaf:
    'function-groups/customer-platform/dieu-phoi-don-dat/tra-cuu-don-dat',
  customerPlatformOrderMonitorLeaf:
    'function-groups/customer-platform/dieu-phoi-don-dat/giam-sat-don-da-tao',
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
  serviceQualityProactiveInboundLeaf:
    'function-groups/service-quality/proactive/monitor-received',
  serviceQualityProactiveDeliveredLeaf:
    'function-groups/service-quality/proactive/monitor-delivered',
  groupDatabaseLeaf: 'function-groups/database',
  groupSmartDevicesLeaf: 'function-groups/smart-devices',
  groupPlanningPlatformLeaf: 'function-groups/planning-platform',
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
  returnBlockManagementLeaf:
    'function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-hoan',
  returnForwardManagementLeaf:
    'function-groups/operations-platform/chuyen-hoan/quan-ly-chuyen-tiep',
  monitorDataHangNhanLeaf: 'function-groups/operations-platform/data-monitoring/hang-nhan',
  monitorDataHangDenLeaf: 'function-groups/operations-platform/data-monitoring/hang-den',
  monitorDataHangGuiLeaf: 'function-groups/operations-platform/data-monitoring/hang-gui',
  monitorDataHangPhatLeaf: 'function-groups/operations-platform/data-monitoring/hang-phat',
  monitorData2In1Leaf: 'function-groups/operations-platform/data-monitoring/2in1',
  monitorDataTheoDoiTamUngLeaf:
    'function-groups/operations-platform/data-monitoring/theo-doi-tam-ung',
  monitorDataDongBaoLeaf:
    'function-groups/operations-platform/data-monitoring/giam-sat-dong-bao',
  shipmentsLeaf: 'shipments',
  shipmentDetailLeaf: 'shipments/:shipmentId',
  pickupsLeaf: 'pickups',
  pickupDetailLeaf: 'pickups/:pickupId',
  tasksLeaf: 'tasks',
  taskDetailLeaf: 'tasks/:taskId',
  manifestsLeaf: 'manifests',
  manifestDetailLeaf: 'manifests/:manifestId',
  scansLeaf: 'scans',
  ndrLeaf: 'ndr',
  ndrDetailLeaf: 'ndr/:ndrId',
  trackingLeaf: 'tracking',
  trackingDetailLeaf: 'tracking/:shipmentCode',
  masterdataHubsLeaf: 'masterdata/hubs',
  masterdataZonesLeaf: 'masterdata/zones',
  masterdataNdrReasonsLeaf: 'masterdata/ndr-reasons',
  masterdataConfigsLeaf: 'masterdata/configs',
} as const;
