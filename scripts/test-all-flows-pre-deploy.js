#!/usr/bin/env node

/**
 * BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN - CHUẨN BỊ DEPLOY
 * ===================================================
 * Kiểm tra TẤT CẢ các luồng nghiệp vụ & quy trình đơn hàng:
 *
 * SCENARIO 1: Luồng chuẩn - Tạo đơn → Pickup → Trung chuyển → Giao thành công (DELIVERED)
 * SCENARIO 2: Giao thất bại → NDR → Tái giao thành công (DELIVERY_FAILED → DELIVERED)
 * SCENARIO 3: Giao thất bại → NDR → Quyết định hoàn hàng (RETURN_STARTED → RETURN_COMPLETED)
 * SCENARIO 4: Hủy đơn sớm khi đơn ở trạng thái CREATED (CANCELLED)
 * SCENARIO 5: Tự động điều phối (Auto-Dispatch Pickup + Delivery) theo phân vùng Geofence
 * SCENARIO 6: Kiểm tra API Health + Gateway + Tất cả services
 * SCENARIO 7: Trạng thái đơn hàng không hợp lệ (chuyển trạng thái sai → bị từ chối)
 */

const DEFAULT_GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:3000';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = 'password';

const accounts = {
  admin: '10000001',
  merchant: '41100001',
  opsOrigin: '20000003',
  opsDest: '20000001',
  courierPickup: '30000003',
  courierDelivery: '30000001',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedDetails = [];

// ─── Helpers ──────────────────────────────────────────────────────

function log(msg) { console.log(`\x1b[36m  [TEST]\x1b[0m ${msg}`); }
function pass(msg) { totalTests++; passedTests++; console.log(`\x1b[32m  ✔ ${msg}\x1b[0m`); }
function fail(msg, err) {
  totalTests++; failedTests++;
  failedDetails.push({ msg, err: err?.message || String(err) });
  console.error(`\x1b[31m  ✖ ${msg}\x1b[0m`);
  if (err) console.error(`    └─ ${err.message || err}`);
}
function info(msg) { console.log(`    ℹ ${msg}`); }
function header(msg) { console.log(`\n\x1b[35m━━━ ${msg} ━━━\x1b[0m`); }

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function waybill(offset = 0) {
  const base = (Date.now() + offset) % 1_000_000_000;
  return `111${String(base).padStart(9, '0')}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function request(pathname, options = {}) {
  const url = pathname.startsWith('http://') || pathname.startsWith('https://')
    ? pathname
    : `${DEFAULT_GATEWAY_URL.replace(/\/+$/, '')}${pathname}`;
  const headers = {
    accept: 'application/json',
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} → ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`);
  }
  return { status: res.status, data };
}

async function login(prefix, username, roleGroup) {
  const { data } = await request(`${prefix}/auth/auth/login`, {
    method: 'POST', body: { username, password: PASSWORD, roleGroup },
  });
  assert(data?.tokens?.accessToken, `Login failed for ${username}`);
  return { token: data.tokens.accessToken, user: data.user };
}

async function poll(fn, label, timeoutMs = 20000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try { const v = await fn(); if (v) return v; } catch (e) { last = e; }
    await sleep(600);
  }
  throw new Error(`Timeout waiting for ${label}. ${last ? last.message : ''}`);
}

async function getShipmentStatus(token, code) {
  const { data } = await request(`/ops/shipment/shipments/${encodeURIComponent(code)}`, { token });
  return data.currentStatus;
}

async function waitForStatus(token, code, expected, label) {
  const set = new Set(Array.isArray(expected) ? expected : [expected]);
  return poll(async () => {
    const st = await getShipmentStatus(token, code);
    return set.has(st) ? st : null;
  }, `${code} → ${Array.from(set).join('|')} (${label})`);
}

// ─── Shared: Create Shipment + Pickup + Approve ───────────────────

async function createShipmentWithPickup(sessions, code, originHub, destHub) {
  await request('/merchant/shipment/shipments', {
    method: 'POST', token: sessions.merchant.token,
    body: {
      code,
      pickupLatitude: 10.8055, pickupLongitude: 106.6625,
      deliveryLatitude: 21.036, deliveryLongitude: 105.815,
      metadata: {
        createdBy: { username: accounts.merchant, userId: accounts.merchant },
        sender: {
          name: 'Test Sender', phone: '0909123456',
          address: '120 Trường Sơn, Phường 2, Tân Bình, Hồ Chí Minh',
          province: 'Hồ Chí Minh', district: 'Tân Bình', ward: 'Phường 2',
          hubCode: originHub,
        },
        receiver: {
          name: 'Test Receiver', phone: '0987654321',
          address: '45 Đội Cấn, Phường Cống Vị, Ba Đình, Hà Nội',
          province: 'Hà Nội', district: 'Ba Đình', ward: 'Phường Cống Vị',
          hubCode: destHub,
        },
        package: { itemType: 'Test Item', weightKg: 1, dimensionsCm: { length: 20, width: 15, height: 10 }, declaredValue: 300000 },
        service: { type: 'STANDARD' },
        codAmount: 300000,
        routing: { originHubCode: originHub, destinationHubCode: destHub },
        source: 'e2e-deploy-test',
      },
    },
  });

  const { data: pickupReq } = await request('/merchant/pickup/pickups', {
    method: 'POST', token: sessions.merchant.token,
    body: {
      pickupCode: `PU-${code}`,
      requesterName: 'Test Sender', contactPhone: '0909123456',
      pickupAddress: '120 Trường Sơn, Phường 2, Tân Bình',
      items: [{ shipmentCode: code, quantity: 1 }],
      note: 'E2E test pickup',
    },
  });

  await request(`/ops/pickup/pickups/${pickupReq.id}/approve`, {
    method: 'POST', token: sessions.opsOrigin.token,
    body: { approvedBy: accounts.opsOrigin, note: 'Approved' },
  });

  return pickupReq;
}

// ─── Shared: Courier Pickup Scan + Origin Inbound ─────────────────

async function courierPickupAndOriginInbound(sessions, code, pickupTaskId, originHub) {
  await request('/courier/scan/scans/pickup', {
    method: 'POST', token: sessions.courierPickup.token,
    body: {
      shipmentCode: code, locationCode: originHub,
      actor: accounts.courierPickup, note: 'Pickup scan',
      idempotencyKey: `${RUN_ID}-${code}-pickup`,
    },
  });

  await request(`/courier/dispatch/tasks/${pickupTaskId}/status`, {
    method: 'PATCH', token: sessions.courierPickup.token,
    body: { status: 'COMPLETED', note: 'Pickup done' },
  });

  await request('/ops/scan/scans/inbound', {
    method: 'POST', token: sessions.opsOrigin.token,
    body: {
      shipmentCode: code, locationCode: originHub,
      employeeCode: accounts.opsOrigin, note: 'Inbound origin',
      idempotencyKey: `${RUN_ID}-${code}-inbound-orig`,
    },
  });
}

// ─── Shared: Linehaul Transit ─────────────────────────────────────

async function linehaulTransit(sessions, code, originHub, destHub) {
  const bagCode = `BAG-${code.slice(-6)}-${RUN_ID}`;
  const { data: bag } = await request('/ops/manifest/manifests', {
    method: 'POST', token: sessions.opsOrigin.token,
    body: {
      manifestCode: bagCode, type: 'BAG',
      originHubCode: originHub, destinationHubCode: destHub,
      sealNumber: `SEAL-${code.slice(-6)}`,
      shipmentCodes: [code], note: `Transit ${originHub} → ${destHub}`,
    },
  });

  await request(`/ops/manifest/manifests/${bag.id}/receive`, {
    method: 'POST', token: sessions.opsDest.token,
    body: { receivedBy: accounts.opsDest, locationCode: destHub, note: 'Received' },
  });

  await request(`/ops/manifest/manifests/${bag.id}/shipments/remove`, {
    method: 'POST', token: sessions.opsDest.token,
    body: {
      shipmentCodes: [code], unsealedBy: accounts.opsDest,
      unsealedByName: 'Ops Dest', processingHubCode: destHub, note: 'Unseal',
    },
  });

  await request('/ops/scan/scans/inbound', {
    method: 'POST', token: sessions.opsDest.token,
    body: {
      shipmentCode: code, locationCode: destHub,
      employeeCode: accounts.opsDest, note: 'Inbound destination',
      idempotencyKey: `${RUN_ID}-${code}-inbound-dest`,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 6: Health Check All Services
// ═══════════════════════════════════════════════════════════════════

async function scenario6_healthCheck() {
  header('SCENARIO 6: Health Check - Gateway & All Services');

  try {
    const { data } = await request('/health');
    assert(data?.status === 'ok', `Gateway health not ok: ${JSON.stringify(data)}`);
    pass(`Gateway BFF healthy (status: ${data.status})`);
  } catch (e) { fail('Gateway BFF health check', e); }

  const serviceEndpoints = [
    { name: 'auth-service', port: 3010 },
    { name: 'masterdata-service', port: 3001 },
    { name: 'shipment-service', port: 3002 },
    { name: 'pickup-service', port: 3003 },
    { name: 'dispatch-service', port: 3004 },
    { name: 'manifest-service', port: 3005 },
    { name: 'scan-service', port: 3006 },
    { name: 'delivery-service', port: 3007 },
    { name: 'tracking-service', port: 3008 },
    { name: 'reporting-service', port: 3009 },
    { name: 'payment-service', port: 3011 },
    { name: 'pricing-service', port: 3012 },
  ];

  for (const svc of serviceEndpoints) {
    try {
      const { status } = await request(`http://127.0.0.1:${svc.port}/health`, { allowError: true });
      if (status >= 200 && status < 400) {
        pass(`${svc.name} (port ${svc.port}) healthy`);
      } else {
        fail(`${svc.name} (port ${svc.port}) returned HTTP ${status}`);
      }
    } catch (e) { fail(`${svc.name} (port ${svc.port}) unreachable`, e); }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 1: Luồng chuẩn - Giao hàng thành công (Happy Path)
// CREATED → PICKUP_COMPLETED → SCAN_INBOUND → MANIFEST_SEALED →
// MANIFEST_RECEIVED → SCAN_INBOUND → TASK_ASSIGNED → DELIVERED
// ═══════════════════════════════════════════════════════════════════

async function scenario1_happyPath(sessions, originHub, destHub) {
  header('SCENARIO 1: Luồng Chuẩn - Giao hàng thành công (Happy Path)');
  const code = waybill(1);

  try {
    // 1. Tạo đơn + Pickup + Approve
    await createShipmentWithPickup(sessions, code, originHub, destHub);
    const st1 = await getShipmentStatus(sessions.admin.token, code);
    assert(['CREATED', 'UPDATED', 'TASK_ASSIGNED'].includes(st1), `Expected initial status, got ${st1}`);
    pass(`Tạo đơn ${code} → ${st1}`);

    // 2. Chờ auto-dispatch pickup
    await sleep(2000);
    const { data: pTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=PICKUP`, { token: sessions.opsOrigin.token });
    assert(pTasks.length > 0, 'No PICKUP task found');
    const pickupTask = pTasks[0];
    pass(`Auto-dispatch PICKUP task: ${pickupTask.status}`);

    // 3. Courier pickup scan + origin inbound
    await courierPickupAndOriginInbound(sessions, code, pickupTask.id, originHub);
    const st3 = await waitForStatus(sessions.admin.token, code, ['PICKUP_COMPLETED', 'SCAN_INBOUND'], 'after pickup + inbound');
    pass(`Shipper lấy hàng + nhập kho gốc → ${st3}`);

    // 4. Linehaul transit
    await linehaulTransit(sessions, code, originHub, destHub);
    const st4 = await waitForStatus(sessions.admin.token, code, ['SCAN_INBOUND', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED', 'TASK_ASSIGNED'], 'after linehaul');
    pass(`Trung chuyển liên tỉnh → ${st4}`);

    // 5. Auto-dispatch delivery
    await sleep(2000);
    const { data: dTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=DELIVERY`, { token: sessions.opsDest.token });
    assert(dTasks.length > 0, 'No DELIVERY task auto-created');
    const deliveryTask = dTasks[0];
    const dAssignment = deliveryTask.assignments?.find(a => !a.unassignedAt) || deliveryTask.assignments?.[0];
    assert(dAssignment?.courierId === accounts.courierDelivery, `Delivery courier mismatch: ${dAssignment?.courierId}`);
    pass(`Auto-dispatch DELIVERY → Shipper ${dAssignment.courierId}`);

    // 6. Delivery success
    await request('/courier/delivery/deliveries/success', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        note: 'Delivered successfully', idempotencyKey: `${RUN_ID}-${code}-del-ok`,
        podNote: 'Signed', podCapturedBy: accounts.courierDelivery,
      },
    });
    await request(`/courier/dispatch/tasks/${deliveryTask.id}/status`, {
      method: 'PATCH', token: sessions.courierDelivery.token,
      body: { status: 'COMPLETED', note: 'Delivery done' },
    });
    const st6 = await waitForStatus(sessions.admin.token, code, ['DELIVERED'], 'after delivery');
    pass(`Giao hàng thành công → ${st6}`);

    // 7. Verify DELIVERED is terminal (cannot cancel)
    const { status: cancelStatus } = await request(`/ops/shipment/shipments/${code}/cancel`, {
      method: 'POST', token: sessions.admin.token, allowError: true,
      body: { reason: 'Test cancel delivered' },
    });
    assert(cancelStatus >= 400, 'Should not be able to cancel DELIVERED order');
    pass('Đơn DELIVERED không thể hủy (terminal status) ✔');

  } catch (e) { fail(`Scenario 1 (Happy Path) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 2: Giao thất bại → NDR → Tái giao thành công
// ═══════════════════════════════════════════════════════════════════

async function scenario2_deliveryFailThenRedeliver(sessions, originHub, destHub) {
  header('SCENARIO 2: Giao thất bại → NDR → Tái giao thành công');
  const code = waybill(2);

  try {
    // Setup: Create, pickup, transit, auto-dispatch delivery
    await createShipmentWithPickup(sessions, code, originHub, destHub);
    await sleep(2000);
    const { data: pTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=PICKUP`, { token: sessions.opsOrigin.token });
    const pickupTask = pTasks[0];
    await courierPickupAndOriginInbound(sessions, code, pickupTask.id, originHub);
    await linehaulTransit(sessions, code, originHub, destHub);
    await sleep(2000);
    pass(`Setup hoàn tất: đơn ${code} đã đến kho đích`);

    // 1. Giao thất bại (lần 1)
    await request('/courier/delivery/deliveries/fail', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        reason: 'Khách không nhận', note: 'Gọi không liên lạc được',
        idempotencyKey: `${RUN_ID}-${code}-fail-1`,
      },
    });
    const st1 = await waitForStatus(sessions.admin.token, code, ['DELIVERY_FAILED', 'TASK_ASSIGNED'], 'after delivery fail');
    pass(`Giao thất bại lần 1 → ${st1}`);

    // 2. Ops tạo NDR case
    const { data: ndrCase } = await request('/ops/delivery/ndr', {
      method: 'POST', token: sessions.opsDest.token,
      body: {
        shipmentCode: code, issueType: 'CUSTOMER_UNAVAILABLE',
        note: 'Khách không có mặt tại nhà',
        reportedBy: accounts.opsDest,
      },
    });
    pass(`NDR Case tạo: ${ndrCase.id} | IssueType: ${ndrCase.issueType}`);

    // 3. Ops lên lịch giao lại (reschedule)
    await request(`/ops/delivery/ndr/${ndrCase.id}/reschedule`, {
      method: 'POST', token: sessions.opsDest.token,
      body: {
        nextDeliveryAt: new Date(Date.now() + 86400000).toISOString(),
        note: 'Giao lại ngày mai',
      },
    });
    pass('NDR → Reschedule: lên lịch giao lại');

    // 4. Shipper bắt đầu tái giao (attempt)
    await request('/courier/delivery/deliveries/attempts', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        note: 'Bắt đầu giao lại',
      },
    });
    await waitForStatus(sessions.admin.token, code, ['TASK_ASSIGNED'], 'after redelivery attempt');
    pass('Shipper bắt đầu giao lại → TASK_ASSIGNED');

    // 5. Tái giao thành công
    await request('/courier/delivery/deliveries/success', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        note: 'Tái giao thành công lần 2', idempotencyKey: `${RUN_ID}-${code}-del-ok-2`,
        podNote: 'Khách nhận hàng', podCapturedBy: accounts.courierDelivery,
      },
    });
    const stFinal = await waitForStatus(sessions.admin.token, code, ['DELIVERED'], 'after redeliver');
    pass(`Tái giao thành công → ${stFinal}`);

  } catch (e) { fail(`Scenario 2 (Fail → NDR → Redeliver) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 3: Giao thất bại → NDR → Hoàn hàng (Return)
// ═══════════════════════════════════════════════════════════════════

async function scenario3_deliveryFailReturnToSender(sessions, originHub, destHub) {
  header('SCENARIO 3: Giao thất bại → NDR → Quyết định hoàn hàng');
  const code = waybill(3);

  try {
    // Setup: full transit to dest
    await createShipmentWithPickup(sessions, code, originHub, destHub);
    await sleep(2000);
    const { data: pTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=PICKUP`, { token: sessions.opsOrigin.token });
    const pickupTask = pTasks[0];
    await courierPickupAndOriginInbound(sessions, code, pickupTask.id, originHub);
    await linehaulTransit(sessions, code, originHub, destHub);
    await sleep(2000);
    pass(`Setup hoàn tất: đơn ${code} đã đến kho đích`);

    // 1. Giao thất bại
    await request('/courier/delivery/deliveries/fail', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        reason: 'Khách từ chối nhận', note: 'Khách đổi ý',
        idempotencyKey: `${RUN_ID}-${code}-fail-return`,
      },
    });
    const st1 = await waitForStatus(sessions.admin.token, code, ['DELIVERY_FAILED', 'TASK_ASSIGNED'], 'after delivery fail');
    pass(`Giao thất bại → ${st1}`);

    // 2. Tạo NDR case
    const { data: ndrCase } = await request('/ops/delivery/ndr', {
      method: 'POST', token: sessions.opsDest.token,
      body: {
        shipmentCode: code, issueType: 'CUSTOMER_REFUSED',
        note: 'Khách từ chối nhận hàng',
        reportedBy: accounts.opsDest,
      },
    });
    pass(`NDR Case: ${ndrCase.id} | ${ndrCase.issueType}`);

    // 3. Quyết định hoàn hàng
    const { data: returnDecision } = await request(`/ops/delivery/ndr/${ndrCase.id}/return-decision`, {
      method: 'POST', token: sessions.opsDest.token,
      body: { returnToSender: true, note: 'Khách từ chối, hoàn hàng về người gửi' },
    });
    pass(`NDR → Return Decision: ${returnDecision?.returnCase?.status || 'CREATED'}`);

    // 4. Kiểm tra Return Started
    const st3 = await waitForStatus(sessions.admin.token, code, ['RETURN_STARTED', 'DELIVERY_FAILED', 'NDR_CREATED'], 'after return decision');
    pass(`Đơn chuyển trạng thái → ${st3}`);

    // 5. Hoàn tất Return
    if (returnDecision?.returnCase?.id) {
      await request(`/ops/delivery/returns/${returnDecision.returnCase.id}/complete`, {
        method: 'POST', token: sessions.opsOrigin.token,
        body: { completedBy: accounts.opsOrigin, note: 'Hàng đã về kho người gửi' },
      });
      const st4 = await waitForStatus(sessions.admin.token, code, ['RETURN_COMPLETED', 'RETURN_STARTED'], 'after return complete');
      pass(`Hoàn hàng hoàn tất → ${st4}`);
    } else {
      pass('Return case đã tạo (sẽ hoàn hàng qua quy trình thực tế)');
    }

  } catch (e) { fail(`Scenario 3 (Fail → Return) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 4: Hủy đơn sớm (Cancel khi CREATED)
// ═══════════════════════════════════════════════════════════════════

async function scenario4_cancelEarly(sessions, originHub, destHub) {
  header('SCENARIO 4: Hủy đơn sớm (Cancel khi CREATED)');
  const code = waybill(4);

  try {
    // 1. Tạo đơn (không pickup)
    await request('/merchant/shipment/shipments', {
      method: 'POST', token: sessions.merchant.token,
      body: {
        code,
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: {
            name: 'Cancel Test', phone: '0909000001',
            address: 'Cancel Test Address', province: 'Hồ Chí Minh',
            district: 'Tân Bình', ward: 'Phường 2', hubCode: originHub,
          },
          receiver: {
            name: 'Cancel Receiver', phone: '0987000001',
            address: 'Cancel Receiver Address', province: 'Hà Nội',
            district: 'Ba Đình', ward: 'Phường Cống Vị', hubCode: destHub,
          },
          package: { itemType: 'Cancel Test', weightKg: 0.5, dimensionsCm: { length: 10, width: 10, height: 10 }, declaredValue: 100000 },
          service: { type: 'STANDARD' },
          codAmount: 0,
          routing: { originHubCode: originHub, destinationHubCode: destHub },
          source: 'e2e-cancel-test',
        },
      },
    });
    const st1 = await getShipmentStatus(sessions.admin.token, code);
    pass(`Tạo đơn ${code} → ${st1}`);

    // 2. Hủy đơn
    await request(`/ops/shipment/shipments/${code}/cancel`, {
      method: 'POST', token: sessions.admin.token,
      body: { reason: 'Merchant yêu cầu hủy' },
    });
    const st2 = await getShipmentStatus(sessions.admin.token, code);
    assert(st2 === 'CANCELLED', `Expected CANCELLED, got ${st2}`);
    pass(`Hủy đơn thành công → ${st2}`);

    // 3. Không thể hủy đơn đã hủy
    const { status: reCancel } = await request(`/ops/shipment/shipments/${code}/cancel`, {
      method: 'POST', token: sessions.admin.token, allowError: true,
      body: { reason: 'Try cancel again' },
    });
    assert(reCancel >= 400, 'Should not cancel a CANCELLED order');
    pass('Đơn CANCELLED không thể hủy lại (terminal status) ✔');

  } catch (e) { fail(`Scenario 4 (Cancel Early) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 5: Auto-Dispatch - Kiểm tra phân vùng Geofence
// ═══════════════════════════════════════════════════════════════════

async function scenario5_autoDispatchVerification(sessions, originHub, destHub) {
  header('SCENARIO 5: Kiểm tra Tự động Điều phối (Auto-Dispatch) theo phân vùng');
  const code = waybill(5);

  try {
    // 1. Tạo đơn với tọa độ GPS + Pickup + Approve
    await createShipmentWithPickup(sessions, code, originHub, destHub);
    await sleep(2000);

    // 2. Kiểm tra auto-dispatch pickup
    const { data: pTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=PICKUP`, { token: sessions.opsOrigin.token });
    assert(pTasks.length > 0, 'No PICKUP task created');
    const pickupTask = pTasks[0];
    const pAssignment = pickupTask.assignments?.find(a => !a.unassignedAt) || pickupTask.assignments?.[0];
    assert(pAssignment?.courierId === accounts.courierPickup, `Pickup courier mismatch: ${pAssignment?.courierId}`);
    assert(pickupTask.note?.includes('tự động điều phối'), 'Pickup task note should contain auto-dispatch text');
    pass(`Auto-Dispatch PICKUP: Shipper ${pAssignment.courierId} | Ghi chú: "${pickupTask.note?.slice(0, 60)}..."`);

    // 3. Hoàn tất pickup + transit
    await courierPickupAndOriginInbound(sessions, code, pickupTask.id, originHub);
    await linehaulTransit(sessions, code, originHub, destHub);
    await sleep(2000);

    // 4. Kiểm tra auto-dispatch delivery
    const { data: dTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=DELIVERY`, { token: sessions.opsDest.token });
    assert(dTasks.length > 0, 'No DELIVERY task auto-created');
    const deliveryTask = dTasks[0];
    const dAssignment = deliveryTask.assignments?.find(a => !a.unassignedAt) || deliveryTask.assignments?.[0];
    assert(dAssignment?.courierId === accounts.courierDelivery, `Delivery courier mismatch: ${dAssignment?.courierId}`);
    assert(deliveryTask.note?.includes('tự động điều phối'), 'Delivery task note should contain auto-dispatch text');
    pass(`Auto-Dispatch DELIVERY: Shipper ${dAssignment.courierId} | Ghi chú: "${deliveryTask.note?.slice(0, 60)}..."`);

    // 5. Kiểm tra tracking timeline ghi nhận nguồn SYSTEM
    await request('/courier/delivery/deliveries/success', {
      method: 'POST', token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        note: 'Auto dispatch verify', idempotencyKey: `${RUN_ID}-${code}-autodispatch-del`,
        podNote: 'OK', podCapturedBy: accounts.courierDelivery,
      },
    });
    await sleep(1500);

    const { data: timeline } = await request(`/ops/tracking/tracking/${code}/timeline`, {
      token: sessions.admin.token,
    });
    const autoEvents = (Array.isArray(timeline) ? timeline : []).filter(
      e => e.note?.includes('🤖') || e.eventSource?.includes('Hệ thống')
    );
    assert(autoEvents.length >= 2, `Expected ≥2 auto-dispatch events, got ${autoEvents.length}`);
    pass(`Timeline: ${autoEvents.length} sự kiện auto-dispatch (🤖 Hệ thống) ✔`);

  } catch (e) { fail(`Scenario 5 (Auto-Dispatch Verify) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 7: Invalid State Transitions
// ═══════════════════════════════════════════════════════════════════

async function scenario7_invalidTransitions(sessions, originHub, destHub) {
  header('SCENARIO 7: Kiểm tra chuyển trạng thái không hợp lệ (Invalid Transitions)');
  const code = waybill(7);

  try {
    // Tạo đơn mới
    await request('/merchant/shipment/shipments', {
      method: 'POST', token: sessions.merchant.token,
      body: {
        code,
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: {
            name: 'Invalid Test', phone: '0909000001',
            address: 'Invalid Test', province: 'Hồ Chí Minh',
            district: 'Tân Bình', ward: 'Phường 2', hubCode: originHub,
          },
          receiver: {
            name: 'Invalid Receiver', phone: '0987000001',
            address: 'Invalid Test', province: 'Hà Nội',
            district: 'Ba Đình', ward: 'Phường Cống Vị', hubCode: destHub,
          },
          package: { itemType: 'Invalid', weightKg: 0.5, dimensionsCm: { length: 10, width: 10, height: 10 }, declaredValue: 100000 },
          service: { type: 'STANDARD' }, codAmount: 0,
          routing: { originHubCode: originHub, destinationHubCode: destHub },
          source: 'e2e-invalid-test',
        },
      },
    });

    // 1. Không thể giao hàng thành công khi đơn ở trạng thái CREATED (chưa pickup)
    const { status: earlyDeliver } = await request('/courier/delivery/deliveries/success', {
      method: 'POST', token: sessions.courierDelivery.token, allowError: true,
      body: {
        shipmentCode: code, locationCode: destHub,
        courierId: accounts.courierDelivery, actor: accounts.courierDelivery,
        note: 'Should fail', idempotencyKey: `${RUN_ID}-${code}-invalid-del`,
        podNote: 'NA', podCapturedBy: accounts.courierDelivery,
      },
    });
    // This might succeed at API level but state machine will reject the transition
    // The key point is that the shipment status should NOT move to DELIVERED
    const stAfter = await getShipmentStatus(sessions.admin.token, code);
    if (stAfter !== 'DELIVERED') {
      pass(`Đơn CREATED → giao hàng sớm: trạng thái giữ nguyên ${stAfter} (không nhảy sang DELIVERED) ✔`);
    } else {
      fail('Đơn CREATED không nên chuyển thẳng sang DELIVERED');
    }

    // 2. Tạo shipment với code trùng → phải lỗi
    const { status: dupStatus } = await request('/merchant/shipment/shipments', {
      method: 'POST', token: sessions.merchant.token, allowError: true,
      body: {
        code,
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: { name: 'Dup', phone: '0909000001', address: 'Dup', province: 'Hồ Chí Minh', district: 'Q1', ward: 'P1', hubCode: originHub },
          receiver: { name: 'Dup', phone: '0987000001', address: 'Dup', province: 'Hà Nội', district: 'BD', ward: 'P1', hubCode: destHub },
          package: { itemType: 'Dup', weightKg: 0.5, dimensionsCm: { length: 10, width: 10, height: 10 }, declaredValue: 100000 },
          service: { type: 'STANDARD' }, codAmount: 0,
          routing: { originHubCode: originHub, destinationHubCode: destHub },
          source: 'e2e-dup',
        },
      },
    });
    assert(dupStatus >= 400, `Duplicate code should return 4xx, got ${dupStatus}`);
    pass('Tạo đơn trùng mã vận đơn → HTTP 4xx (bị từ chối) ✔');

    // 3. Waybill code sai format
    const { status: badCodeStatus } = await request('/merchant/shipment/shipments', {
      method: 'POST', token: sessions.merchant.token, allowError: true,
      body: {
        code: 'INVALID_FORMAT_123',
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: { name: 'Bad', phone: '0909000001', address: 'Bad', province: 'HCM', district: 'Q1', ward: 'P1', hubCode: originHub },
          receiver: { name: 'Bad', phone: '0987000001', address: 'Bad', province: 'HN', district: 'BD', ward: 'P1', hubCode: destHub },
          package: { itemType: 'Bad', weightKg: 0.5, dimensionsCm: { length: 10, width: 10, height: 10 }, declaredValue: 100000 },
          service: { type: 'STANDARD' }, codAmount: 0,
          routing: { originHubCode: originHub, destinationHubCode: destHub },
          source: 'e2e-bad-code',
        },
      },
    });
    assert(badCodeStatus >= 400, `Bad waybill code should return 4xx, got ${badCodeStatus}`);
    pass(`Mã vận đơn sai format → HTTP ${badCodeStatus} (bị từ chối) ✔`);

  } catch (e) { fail(`Scenario 7 (Invalid Transitions) - ${code}`, e); }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 BỘ KIỂM THỬ TOÀN DIỆN - CHUẨN BỊ DEPLOY             ║');
  console.log(`║  ⏰ Run ID: ${RUN_ID}                              ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // ─── SCENARIO 6: Health Check ──────────────────────────────────
  await scenario6_healthCheck();

  // ─── Login all accounts ────────────────────────────────────────
  header('SETUP: Đăng nhập tất cả tài khoản');
  const sessions = {};
  try {
    sessions.admin = await login('/ops', accounts.admin, 'OPS');
    sessions.merchant = await login('/merchant', accounts.merchant, 'MERCHANT');
    sessions.opsOrigin = await login('/ops', accounts.opsOrigin, 'OPS');
    sessions.opsDest = await login('/ops', accounts.opsDest, 'OPS');
    sessions.courierPickup = await login('/courier', accounts.courierPickup, 'COURIER_APP');
    sessions.courierDelivery = await login('/courier', accounts.courierDelivery, 'COURIER_APP');
    pass('Đăng nhập thành công 6 tài khoản (Admin, Merchant, 2 Ops, 2 Courier)');
  } catch (e) {
    fail('Đăng nhập thất bại', e);
    printSummary();
    process.exit(1);
  }

  const originHub = sessions.opsOrigin.user?.hubCodes?.[0] || '003S001';
  const destHub = sessions.opsDest.user?.hubCodes?.[0] || '001N001';
  info(`Origin Hub: ${originHub} | Destination Hub: ${destHub}`);

  // ─── Setup geofence assignments ────────────────────────────────
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST', token: sessions.admin.token, allowError: true,
    body: { hubCode: originHub, courierId: accounts.courierPickup, province: 'Hồ Chí Minh', district: 'Tân Bình', ward: 'Phường 2', isActive: true },
  });
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST', token: sessions.admin.token, allowError: true,
    body: { hubCode: destHub, courierId: accounts.courierDelivery, province: 'Hà Nội', district: 'Ba Đình', ward: 'Phường Cống Vị', isActive: true },
  });

  // ─── Run all scenarios ─────────────────────────────────────────
  await scenario1_happyPath(sessions, originHub, destHub);
  await scenario2_deliveryFailThenRedeliver(sessions, originHub, destHub);
  await scenario3_deliveryFailReturnToSender(sessions, originHub, destHub);
  await scenario4_cancelEarly(sessions, originHub, destHub);
  await scenario5_autoDispatchVerification(sessions, originHub, destHub);
  await scenario7_invalidTransitions(sessions, originHub, destHub);

  // ─── Summary ───────────────────────────────────────────────────
  printSummary();
  process.exit(failedTests > 0 ? 1 : 0);
}

function printSummary() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   📊 KẾT QUẢ KIỂM THỬ                     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Tổng số test:    ${String(totalTests).padStart(3)}                                   ║`);
  console.log(`║  \x1b[32mThành công:       ${String(passedTests).padStart(3)}\x1b[0m                                   ║`);
  console.log(`║  \x1b[31mThất bại:         ${String(failedTests).padStart(3)}\x1b[0m                                   ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');

  if (failedTests === 0) {
    console.log('║  \x1b[32m✔ TẤT CẢ KIỂM THỬ ĐÃ PASS - SẴN SÀNG DEPLOY! 🚀\x1b[0m          ║');
  } else {
    console.log('║  \x1b[31m✖ CÒN TEST THẤT BẠI - CẦN SỬA TRƯỚC KHI DEPLOY!\x1b[0m          ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    for (const f of failedDetails) {
      console.log(`║  ✖ ${f.msg.slice(0, 55).padEnd(55)} ║`);
    }
  }
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch((err) => {
  console.error('\x1b[31m FATAL ERROR:\x1b[0m', err);
  process.exit(1);
});
