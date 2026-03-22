export const opsEndpoints = {
  auth: {
    // Gateway route pattern is /{group}/{service}/..., auth-service routes are /auth/*
    login: '/ops/auth/auth/login',
    refresh: '/ops/auth/auth/refresh',
    logout: '/ops/auth/auth/logout',
    users: '/ops/auth/auth/users',
  },
  dashboard: {
    kpis: '/ops/reporting/reports/ops-dashboard',
    dailyMetrics: '/ops/reporting/reports/daily',
    monthlyMetrics: '/ops/reporting/reports/monthly',
  },
  shipments: {
    list: '/ops/shipment/shipments',
    detail: (shipmentId: string) => `/ops/shipment/shipments/${shipmentId}`,
  },
  pickups: {
    list: '/ops/pickup/pickups',
    detail: (pickupId: string) => `/ops/pickup/pickups/${pickupId}`,
    approve: (pickupId: string) => `/ops/pickup/pickups/${pickupId}/approve`,
    complete: (pickupId: string) => `/ops/pickup/pickups/${pickupId}/complete`,
    reject: (pickupId: string) => `/ops/pickup/pickups/${pickupId}/cancel`,
  },
  tasks: {
    list: '/ops/dispatch/tasks',
    couriers: '/ops/dispatch/tasks/couriers',
    detail: (taskId: string) => `/ops/dispatch/tasks/${taskId}`,
    assign: (taskId: string) => `/ops/dispatch/tasks/${taskId}/assign`,
    reassign: (taskId: string) => `/ops/dispatch/tasks/${taskId}/reassign`,
  },
  manifests: {
    list: '/ops/manifest/manifests',
    create: '/ops/manifest/manifests',
    detail: (manifestId: string) => `/ops/manifest/manifests/${manifestId}`,
    addShipment: (manifestId: string) => `/ops/manifest/manifests/${manifestId}/shipments/add`,
    removeShipment: (manifestId: string) => `/ops/manifest/manifests/${manifestId}/shipments/remove`,
    seal: (manifestId: string) => `/ops/manifest/manifests/${manifestId}/seal`,
    receive: (manifestId: string) => `/ops/manifest/manifests/${manifestId}/receive`,
  },
  scans: {
    pickup: '/ops/scan/scans/pickup',
    inbound: '/ops/scan/scans/inbound',
    outbound: '/ops/scan/scans/outbound',
    location: (shipmentCode: string) => `/ops/scan/locations/${encodeURIComponent(shipmentCode)}`,
  },
  ndr: {
    list: '/ops/delivery/ndr',
    detail: (ndrId: string) => `/ops/delivery/ndr/${ndrId}`,
    reschedule: (ndrId: string) => `/ops/delivery/ndr/${ndrId}/reschedule`,
    returnDecision: (ndrId: string) => `/ops/delivery/ndr/${ndrId}/return-decision`,
  },
  tracking: {
    current: (shipmentCode: string) => `/ops/tracking/tracking/${shipmentCode}/current`,
    timeline: (shipmentCode: string) => `/ops/tracking/tracking/${shipmentCode}/timeline`,
  },
  masterdata: {
    hubs: '/ops/masterdata/hubs',
    hubDetail: (hubId: string) => `/ops/masterdata/hubs/${hubId}`,
    zones: '/ops/masterdata/zones',
    zoneDetail: (zoneId: string) => `/ops/masterdata/zones/${zoneId}`,
    ndrReasons: '/ops/masterdata/ndr-reasons',
    ndrReasonDetail: (reasonId: string) => `/ops/masterdata/ndr-reasons/${reasonId}`,
    configs: '/ops/masterdata/configs',
    configDetail: (configId: string) => `/ops/masterdata/configs/${configId}`,
  },
} as const;
