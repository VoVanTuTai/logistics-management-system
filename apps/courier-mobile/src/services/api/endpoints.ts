const COURIER_PREFIX = '/courier';

export const courierEndpoints = {
  auth: {
    // TODO: simplify path when gateway exposes stable client-facing auth alias.
    login: `${COURIER_PREFIX}/auth/auth/login`,
    refresh: `${COURIER_PREFIX}/auth/auth/refresh`,
    logout: `${COURIER_PREFIX}/auth/auth/logout`,
    introspect: `${COURIER_PREFIX}/auth/auth/introspect`,
  },
  tasks: {
    list: (courierId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks?courierId=${encodeURIComponent(
        courierId,
      )}`,
    detail: (taskId: string) => `${COURIER_PREFIX}/dispatch/tasks/${taskId}`,
    updateStatus: (taskId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks/${taskId}/status`,
  },
  shipment: {
    detail: (shipmentCode: string) =>
      `${COURIER_PREFIX}/shipment/shipments/${encodeURIComponent(shipmentCode)}`,
  },
  manifest: {
    list: `${COURIER_PREFIX}/manifest/manifests`,
    addShipments: (manifestId: string) =>
      `${COURIER_PREFIX}/manifest/manifests/${encodeURIComponent(
        manifestId,
      )}/shipments/add`,
  },
  scan: {
    pickup: `${COURIER_PREFIX}/scan/scans/pickup`,
    inbound: `${COURIER_PREFIX}/scan/scans/inbound`,
    outbound: `${COURIER_PREFIX}/scan/scans/outbound`,
  },
  delivery: {
    attempts: `${COURIER_PREFIX}/delivery/deliveries/attempts`,
    success: `${COURIER_PREFIX}/delivery/deliveries/success`,
    fail: `${COURIER_PREFIX}/delivery/deliveries/fail`,
    ndr: `${COURIER_PREFIX}/delivery/ndr`,
  },
} as const;
