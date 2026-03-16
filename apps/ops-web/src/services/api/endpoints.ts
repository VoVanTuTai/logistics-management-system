export const opsEndpoints = {
  auth: {
    // Gateway route pattern is /{group}/{service}/..., auth-service routes are /auth/*
    login: '/ops/auth/auth/login',
    refresh: '/ops/auth/auth/refresh',
    logout: '/ops/auth/auth/logout',
  },
  dashboard: {
    kpis: '/ops/dashboard/kpis',
  },
  shipments: {
    list: '/ops/shipments',
    detail: (shipmentId: string) => `/ops/shipments/${shipmentId}`,
  },
  pickups: {
    list: '/ops/pickups',
    approve: (pickupId: string) => `/ops/pickups/${pickupId}/approve`,
    reject: (pickupId: string) => `/ops/pickups/${pickupId}/reject`,
  },
  tasks: {
    list: '/ops/tasks',
    assign: '/ops/tasks/assign',
    reassign: '/ops/tasks/reassign',
  },
  manifests: {
    list: '/ops/manifests',
    create: '/ops/manifests',
    seal: (manifestId: string) => `/ops/manifests/${manifestId}/seal`,
    receive: '/ops/manifests/receive',
  },
  scans: {
    inbound: '/ops/scans/inbound',
    outbound: '/ops/scans/outbound',
  },
  ndr: {
    list: '/ops/ndr',
    reschedule: (ndrId: string) => `/ops/ndr/${ndrId}/reschedule`,
    returnDecision: (ndrId: string) => `/ops/ndr/${ndrId}/return-decision`,
  },
  tracking: {
    lookup: '/ops/tracking',
  },
} as const;
