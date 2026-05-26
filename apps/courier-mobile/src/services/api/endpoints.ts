const COURIER_PREFIX = '/courier';

export const courierEndpoints = {
  auth: {
    // TODO: simplify path when gateway exposes stable client-facing auth alias.
    login: `${COURIER_PREFIX}/auth/auth/login`,
    refresh: `${COURIER_PREFIX}/auth/auth/refresh`,
    logout: `${COURIER_PREFIX}/auth/auth/logout`,
    introspect: `${COURIER_PREFIX}/auth/auth/introspect`,
    users: `${COURIER_PREFIX}/auth/auth/users`,
    mobilePermissionEffective: (userId: string) =>
      `${COURIER_PREFIX}/auth/mobile-permissions/users/${encodeURIComponent(
        userId,
      )}/effective`,
  },
  tasks: {
    base: `${COURIER_PREFIX}/dispatch/tasks`,
    list: (courierId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks?courierId=${encodeURIComponent(
        courierId,
      )}`,
    detail: (taskId: string) => `${COURIER_PREFIX}/dispatch/tasks/${taskId}`,
    assign: (taskId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks/${taskId}/assign`,
    reassign: (taskId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks/${taskId}/reassign`,
    updateStatus: (taskId: string) =>
      `${COURIER_PREFIX}/dispatch/tasks/${taskId}/status`,
  },
  shipment: {
    detail: (shipmentCode: string) =>
      `${COURIER_PREFIX}/shipment/shipments/${encodeURIComponent(shipmentCode)}`,
  },
  tracking: {
    current: (shipmentCode: string) =>
      `${COURIER_PREFIX}/tracking/tracking/${encodeURIComponent(shipmentCode)}/current`,
    timeline: (shipmentCode: string) =>
      `${COURIER_PREFIX}/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`,
  },
  manifest: {
    list: `${COURIER_PREFIX}/manifest/manifests`,
    detailByCode: (manifestCode: string) =>
      `${COURIER_PREFIX}/manifest/manifests/code/${encodeURIComponent(
        manifestCode,
      )}`,
    addShipments: (manifestId: string) =>
      `${COURIER_PREFIX}/manifest/manifests/${encodeURIComponent(
        manifestId,
      )}/shipments/add`,
    removeShipments: (manifestId: string) =>
      `${COURIER_PREFIX}/manifest/manifests/${encodeURIComponent(
        manifestId,
      )}/shipments/remove`,
    seal: (manifestId: string) =>
      `${COURIER_PREFIX}/manifest/manifests/${encodeURIComponent(
        manifestId,
      )}/seal`,
    receive: (manifestId: string) =>
      `${COURIER_PREFIX}/manifest/manifests/${encodeURIComponent(
        manifestId,
      )}/receive`,
  },
  scan: {
    pickup: `${COURIER_PREFIX}/scan/scans/pickup`,
    inbound: `${COURIER_PREFIX}/scan/scans/inbound`,
    outbound: `${COURIER_PREFIX}/scan/scans/outbound`,
    location: (shipmentCode: string) =>
      `${COURIER_PREFIX}/scan/locations/${encodeURIComponent(shipmentCode)}`,
  },
  delivery: {
    attempts: `${COURIER_PREFIX}/delivery/deliveries/attempts`,
    success: `${COURIER_PREFIX}/delivery/deliveries/success`,
    fail: `${COURIER_PREFIX}/delivery/deliveries/fail`,
    ndr: `${COURIER_PREFIX}/delivery/ndr`,
    ndrByShipment: (shipmentCode: string) =>
      `${COURIER_PREFIX}/delivery/ndr?shipmentCode=${encodeURIComponent(
        shipmentCode,
      )}`,
    exception: `${COURIER_PREFIX}/delivery/ndr/exception`,
    returns: `${COURIER_PREFIX}/delivery/returns`,
  },
  media: {
    uploadUrl: (filename: string, contentType: string) =>
      `${COURIER_PREFIX}/media/upload-url?filename=${encodeURIComponent(
        filename,
      )}&contentType=${encodeURIComponent(contentType)}`,
  },
  cod: {
    collect: `${COURIER_PREFIX}/payment/cod/collect`,
    records: (courierId: string) =>
      `${COURIER_PREFIX}/payment/cod/courier/${encodeURIComponent(courierId)}`,
    summary: (courierId: string) =>
      `${COURIER_PREFIX}/payment/cod/summary/${encodeURIComponent(courierId)}`,
    shipment: (shipmentCode: string) =>
      `${COURIER_PREFIX}/payment/cod/shipment/${encodeURIComponent(shipmentCode)}`,
    bankInfo: `${COURIER_PREFIX}/payment/cod/bank-info`,
    qr: (amount: number, memo: string) =>
      `${COURIER_PREFIX}/payment/cod/qr?amount=${amount}&memo=${encodeURIComponent(memo)}`,
    remit: `${COURIER_PREFIX}/payment/cod/remit`,
  },
} as const;
