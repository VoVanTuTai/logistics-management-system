#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:3000';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = process.env.E2E_PASSWORD || 'password';
const RECEIVER_PHONE = process.env.PHASE1_RECEIVER_PHONE || '0919000001';

const accounts = {
  admin: process.env.E2E_ADMIN_USER || '10000001',
  merchant: process.env.E2E_MERCHANT_USER || '41100001',
  opsOrigin: process.env.E2E_OPS_ORIGIN_USER || '20000003',
  opsDest: process.env.E2E_OPS_DEST_USER || '20000001',
  courierPickup: process.env.E2E_COURIER_PICKUP_USER || '30000003',
  courierDelivery: process.env.E2E_COURIER_DELIVERY_USER || '30000001',
};

const report = [];

function endpoint(pathname) {
  const gatewayUrl =
    process.env.PHASE1_GATEWAY_URL ||
    process.env.E2E_GATEWAY_URL ||
    process.env.GATEWAY_URL ||
    DEFAULT_GATEWAY_URL;
  return `${gatewayUrl.replace(/\/+$/, '')}${pathname}`;
}

function log(message) {
  console.log(`[phase1-flow] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function note(step, detail) {
  return `PHASE1_FLOW|run=${RUN_ID}|step=${step}|${detail}`;
}

function addReport(step, evidence) {
  report.push({
    step,
    evidence,
    recordedAt: new Date().toISOString(),
  });
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(pathname, options = {}) {
  const headers = {
    accept: 'application/json',
    ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(endpoint(pathname), {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new Error(
      `${options.method || 'GET'} ${pathname} khong ket noi duoc gateway ${endpoint('')}. ` +
        `Hay chay backend stack truoc. Loi goc: ${error.message}`,
    );
  }

  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok && !options.allowError) {
    throw new Error(
      `${options.method || 'GET'} ${pathname} -> ${response.status}: ${text}`,
    );
  }

  return { status: response.status, data, text };
}

async function login(prefix, username, roleGroup) {
  const { data } = await request(`${prefix}/auth/auth/login`, {
    method: 'POST',
    body: {
      username,
      password: PASSWORD,
      roleGroup,
    },
  });

  const token = data?.tokens?.accessToken;
  assert(token, `Khong lay duoc accessToken cho tai khoan ${username}.`);

  return {
    token,
    user: data.user,
  };
}

async function assertGatewayReady() {
  const { data } = await request('/health', { allowError: true });
  assert(
    data?.status === 'ok',
    `Gateway chua san sang tai ${endpoint('/health')}. Response: ${JSON.stringify(data)}`,
  );
}

function firstHub(session, fallback) {
  return (
    process.env[fallback.envName] ||
    session.user?.hubCodes?.[0] ||
    fallback.defaultValue
  );
}

function waybill(offset) {
  const base = Date.now() % 1_000_000_000;
  return `111${String((base + offset) % 1_000_000_000).padStart(9, '0')}`;
}

function buildShipmentMetadata(code, originHubCode, destinationHubCode) {
  return {
    createdBy: {
      username: accounts.merchant,
      userId: accounts.merchant,
    },
    createdByUsername: accounts.merchant,
    createdByUserId: accounts.merchant,
    sender: {
      name: 'Merchant Phase 1',
      phone: '0909000001',
      address: `Kho merchant Phase 1 ${RUN_ID}`,
      addressDetail: `Dia chi gui Phase 1 ${RUN_ID}`,
      province: 'Ho Chi Minh',
      ward: 'Phuong Sai Gon',
      hubCode: originHubCode,
    },
    receiver: {
      name: `Khach nhan ${code}`,
      phone: RECEIVER_PHONE,
      address: `Dia chi nhan Phase 1 ${RUN_ID}`,
      addressDetail: `Can ho Phase 1 ${RUN_ID}`,
      region: 'HA_NOI',
      province: 'Ha Noi',
      ward: 'Phuong Hoan Kiem',
      hubCode: destinationHubCode,
    },
    package: {
      itemType: 'Hang demo Phase 1',
      weightKg: 1.1,
      dimensionsCm: {
        length: 24,
        width: 18,
        height: 12,
      },
      declaredValue: 350000,
    },
    service: {
      type: 'STANDARD',
    },
    codAmount: 180000,
    deliveryNote: note('merchant-create', `shipment=${code}`),
    estimatedFee: 42000,
    routing: {
      originHubCode,
      destinationHubCode,
    },
    source: 'phase1-logistics-flow-e2e',
  };
}

async function createShipment(token, code, originHubCode, destinationHubCode) {
  const { data } = await request('/merchant/shipment/shipments', {
    method: 'POST',
    token,
    body: {
      code,
      metadata: buildShipmentMetadata(code, originHubCode, destinationHubCode),
    },
  });

  assert(data?.code === code, `Shipment tao ra khong dung code ${code}.`);
  addReport('1. Merchant tao shipment', {
    shipmentCode: data.code,
    status: data.currentStatus,
    receiverPhone: data.metadata?.receiver?.phone,
  });

  return data;
}

async function createPickupRequest(token, shipmentCode, originHubCode) {
  const pickupNote = note('pickup-request', `shipment=${shipmentCode}|origin=${originHubCode}`);
  const { data } = await request('/merchant/pickup/pickups', {
    method: 'POST',
    token,
    body: {
      pickupCode: `PU-P1-${RUN_ID}`,
      requesterName: 'Merchant Phase 1',
      contactPhone: '0909000001',
      pickupAddress: `Kho merchant Phase 1 - ${originHubCode}`,
      note: pickupNote,
      items: [{ shipmentCode, quantity: 1 }],
    },
  });

  addReport('1b. Merchant tao yeu cau pickup', {
    pickupId: data.id,
    pickupCode: data.pickupCode,
    status: data.status,
    savedNote: data.note,
  });

  return data;
}

async function approvePickup(token, pickup) {
  const approveNote = note('pickup-approve', `pickup=${pickup.pickupCode}`);
  const { data } = await request(`/ops/pickup/pickups/${pickup.id}/approve`, {
    method: 'POST',
    token,
    body: {
      approvedBy: accounts.opsOrigin,
      note: approveNote,
    },
  });

  addReport('2. Ops duyet pickup request', {
    pickupCode: data.pickupCode,
    status: data.status,
    savedNote: data.note,
  });

  return data;
}

async function findTaskByShipment(token, shipmentCode, taskType, status) {
  const params = new URLSearchParams({
    shipmentCode,
    taskType,
    ...(status ? { status } : {}),
  });
  const { data } = await request(`/ops/dispatch/tasks?${params.toString()}`, {
    token,
  });

  return Array.isArray(data) ? data[0] ?? null : null;
}

async function ensureTask(token, shipmentCode, taskType, noteText) {
  const existing = await findTaskByShipment(token, shipmentCode, taskType);
  if (existing) {
    return existing;
  }

  const { data } = await request('/ops/dispatch/tasks', {
    method: 'POST',
    token,
    body: {
      taskCode: `${taskType.slice(0, 3)}-P1-${RUN_ID}-${shipmentCode}`,
      taskType,
      shipmentCode,
      note: noteText,
    },
  });

  addReport(`2. Ops tao task ${taskType}`, {
    taskCode: data.taskCode,
    taskType: data.taskType,
    shipmentCode: data.shipmentCode,
    savedNote: data.note,
  });

  return data;
}

async function assignTask(token, task, courierId, hubCode, label) {
  const { data } = await request(`/ops/dispatch/tasks/${task.id}/assign`, {
    method: 'POST',
    token,
    body: {
      courierId,
      hubCode,
      note: note('task-assign', `task=${task.taskCode}|courier=${courierId}`),
    },
  });

  const activeAssignment = data.assignments?.find((item) => !item.unassignedAt);
  assert(activeAssignment?.courierId === courierId, `Task ${task.taskCode} chua gan cho ${courierId}.`);
  addReport(label, {
    taskCode: data.taskCode,
    taskType: data.taskType,
    status: data.status,
    courierId: activeAssignment?.courierId,
  });

  return data;
}

async function assertCourierCanSeeTask(token, courierId, taskId, label) {
  const { data } = await request(
    `/courier/dispatch/tasks?courierId=${encodeURIComponent(courierId)}`,
    { token },
  );
  const tasks = Array.isArray(data) ? data : [];
  const visible = tasks.find((task) => task.id === taskId);
  assert(visible, `Courier ${courierId} khong thay task ${taskId}.`);
  addReport(label, {
    taskCode: visible.taskCode,
    taskType: visible.taskType,
    status: visible.status,
    shipmentCode: visible.shipmentCode,
  });
  return visible;
}

async function updateCourierTaskStatus(token, taskId, status, label) {
  const { data } = await request(`/courier/dispatch/tasks/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });

  addReport(label, {
    taskCode: data.taskCode,
    taskType: data.taskType,
    status: data.status,
  });

  return data;
}

async function pickupScan(token, shipmentCode, task, originHubCode) {
  const scanNote = note('pickup-scan', `shipment=${shipmentCode}|courier=${accounts.courierPickup}`);
  const { data } = await request('/courier/scan/scans/pickup', {
    method: 'POST',
    token,
    body: {
      shipmentCode,
      locationCode: originHubCode,
      actor: accounts.courierPickup,
      note: scanNote,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-pickup`,
    },
  });

  addReport('4. Courier scan pickup', {
    shipmentCode: data.scanEvent.shipmentCode,
    locationCode: data.currentLocation.locationCode,
    savedNote: data.scanEvent.note,
  });

  await updateCourierTaskStatus(
    token,
    task.id,
    'COMPLETED',
    '4b. Courier cap nhat pickup task COMPLETED',
  );
}

async function deliverySuccess(token, shipmentCode, task, destHubCode) {
  const deliveryNote = note('delivery-success', `shipment=${shipmentCode}|courier=${accounts.courierDelivery}`);
  const { data } = await request('/courier/delivery/deliveries/success', {
    method: 'POST',
    token,
    body: {
      shipmentCode,
      taskId: task.id,
      courierId: accounts.courierDelivery,
      locationCode: destHubCode,
      actor: accounts.courierDelivery,
      note: deliveryNote,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-delivery-success`,
      podImageUrl: null,
      podNote: deliveryNote,
      podCapturedBy: accounts.courierDelivery,
    },
  });

  addReport('4c. Courier giao thanh cong', {
    shipmentCode: data.deliveryAttempt.shipmentCode,
    deliveryStatus: data.deliveryAttempt.status,
    savedNote: data.deliveryAttempt.note,
  });

  await updateCourierTaskStatus(
    token,
    task.id,
    'COMPLETED',
    '4d. Courier cap nhat delivery task COMPLETED',
  );
}

async function getShipment(token, shipmentCode) {
  const { data } = await request(`/ops/shipment/shipments/${encodeURIComponent(shipmentCode)}`, {
    token,
  });
  return data;
}

async function waitForShipmentStatus(token, shipmentCode, expectedStatuses, label) {
  const expected = new Set(expectedStatuses);
  return poll(async () => {
    const shipment = await getShipment(token, shipmentCode);
    return expected.has(shipment.currentStatus) ? shipment : null;
  }, `${shipmentCode} ${label}: ${expectedStatuses.join('/')}`);
}

async function waitForPublicTracking(shipmentCode) {
  const params = new URLSearchParams({ receiverPhone: RECEIVER_PHONE });
  return poll(async () => {
    const { data, status } = await request(
      `/public/tracking/public/track/${encodeURIComponent(shipmentCode)}?${params.toString()}`,
      { allowError: true },
    );

    if (status !== 200) {
      return null;
    }

    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const delivered = data.current?.currentStatusCode === 'DELIVERED' ||
      timeline.some((event) => event.statusAfterEventCode === 'DELIVERED');

    return delivered ? data : null;
  }, `public tracking DELIVERED ${shipmentCode}`);
}

async function createAndCancelReturnTask(token, shipmentCode) {
  const task = await ensureTask(
    token,
    shipmentCode,
    'RETURN',
    note('return-task-create', `shipment=${shipmentCode}|demo=api-capability`),
  );

  const { data } = await request(`/ops/dispatch/tasks/${task.id}/status`, {
    method: 'PATCH',
    token,
    body: { status: 'CANCELLED' },
  });

  addReport('2c. Ops tao duoc RETURN task va huy task demo', {
    taskCode: data.taskCode,
    taskType: data.taskType,
    status: data.status,
    shipmentCode: data.shipmentCode,
  });
}

async function poll(fn, label, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await fn();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(800);
  }

  throw new Error(`Timeout khi cho ${label}.${lastError ? ` Loi cuoi: ${lastError.message}` : ''}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeReportFile(payload) {
  const outputDir = path.join(process.cwd(), 'tmp');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `phase1-logistics-flow-e2e-${RUN_ID}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  return outputPath;
}

function printReport(payload, outputPath) {
  console.log('\n===== PHASE 1 LOGISTICS FLOW REPORT =====');
  console.log(`Run: ${payload.runId}`);
  console.log(`Gateway: ${payload.gatewayUrl}`);
  console.log(`Shipment: ${payload.shipmentCode}`);
  console.log(`Final status: ${payload.finalShipmentStatus}`);
  console.log(`Public tracking events: ${payload.publicTrackingEventCount}`);
  console.log(`Report file: ${outputPath}`);

  for (const [index, item] of report.entries()) {
    console.log(`\n[${String(index + 1).padStart(2, '0')}] ${item.step}`);
    console.log(`evidence: ${JSON.stringify(item.evidence)}`);
  }

  console.log('\nPASS: Phase 1 flow da chay end-to-end bang API that.');
}

async function main() {
  log('Kiem tra gateway.');
  await assertGatewayReady();

  log('Dang nhap merchant/ops/courier.');
  const sessions = {
    admin: await login('/ops', accounts.admin, 'OPS'),
    merchant: await login('/merchant', accounts.merchant, 'MERCHANT'),
    opsOrigin: await login('/ops', accounts.opsOrigin, 'OPS'),
    opsDest: await login('/ops', accounts.opsDest, 'OPS'),
    courierPickup: await login('/courier', accounts.courierPickup, 'COURIER_APP'),
    courierDelivery: await login('/courier', accounts.courierDelivery, 'COURIER_APP'),
  };

  const hubs = {
    origin: firstHub(sessions.opsOrigin, {
      envName: 'PHASE1_ORIGIN_HUB',
      defaultValue: '003S001',
    }),
    destination: firstHub(sessions.opsDest, {
      envName: 'PHASE1_DEST_HUB',
      defaultValue: '001N001',
    }),
  };

  const tokens = {
    admin: sessions.admin.token,
    merchant: sessions.merchant.token,
    opsOrigin: sessions.opsOrigin.token,
    opsDest: sessions.opsDest.token,
    courierPickup: sessions.courierPickup.token,
    courierDelivery: sessions.courierDelivery.token,
  };

  const shipmentCode = waybill(101);
  const returnTaskCode = waybill(202);

  log(`Merchant tao shipment ${shipmentCode}.`);
  await createShipment(tokens.merchant, shipmentCode, hubs.origin, hubs.destination);

  log('Merchant tao pickup request, ops duyet va phan cong pickup.');
  const pickup = await createPickupRequest(tokens.merchant, shipmentCode, hubs.origin);
  await approvePickup(tokens.opsOrigin, pickup);
  const pickupTask = await poll(
    () => findTaskByShipment(tokens.opsOrigin, shipmentCode, 'PICKUP'),
    `pickup task ${shipmentCode}`,
  );
  const assignedPickupTask = await assignTask(
    tokens.opsOrigin,
    pickupTask,
    accounts.courierPickup,
    hubs.origin,
    '2b. Ops phan cong pickup task cho courier',
  );

  log('Courier nhin thay pickup task va scan nhan hang.');
  await assertCourierCanSeeTask(
    tokens.courierPickup,
    accounts.courierPickup,
    assignedPickupTask.id,
    '3. Courier mobile thay pickup task duoc giao',
  );
  await pickupScan(tokens.courierPickup, shipmentCode, assignedPickupTask, hubs.origin);
  await waitForShipmentStatus(
    tokens.admin,
    shipmentCode,
    ['PICKUP_COMPLETED'],
    'sau pickup scan',
  );

  log('Tao RETURN task demo de chung minh dispatch ho tro pickup/delivery/return.');
  await createShipment(tokens.merchant, returnTaskCode, hubs.destination, hubs.origin);
  await createAndCancelReturnTask(tokens.opsDest, returnTaskCode);

  log('Ops tao va phan cong delivery task.');
  const deliveryTask = await ensureTask(
    tokens.opsDest,
    shipmentCode,
    'DELIVERY',
    note('delivery-task-create', `shipment=${shipmentCode}|dest=${hubs.destination}`),
  );
  const assignedDeliveryTask = await assignTask(
    tokens.opsDest,
    deliveryTask,
    accounts.courierDelivery,
    hubs.destination,
    '2d. Ops phan cong delivery task cho courier',
  );
  await waitForShipmentStatus(
    tokens.admin,
    shipmentCode,
    ['TASK_ASSIGNED'],
    'sau delivery assignment',
  );

  log('Courier nhin thay delivery task va giao thanh cong.');
  await assertCourierCanSeeTask(
    tokens.courierDelivery,
    accounts.courierDelivery,
    assignedDeliveryTask.id,
    '3b. Courier mobile thay delivery task duoc giao',
  );
  await deliverySuccess(tokens.courierDelivery, shipmentCode, assignedDeliveryTask, hubs.destination);
  const deliveredShipment = await waitForShipmentStatus(
    tokens.admin,
    shipmentCode,
    ['DELIVERED'],
    'sau delivery success',
  );

  log('Public tracking tra cuu duoc hanh trinh don.');
  const publicTracking = await waitForPublicTracking(shipmentCode);
  addReport('6. Public tracking hien thi hanh trinh don', {
    shipmentCode: publicTracking.shipmentCode,
    currentStatus: publicTracking.current?.currentStatus,
    currentStatusCode: publicTracking.current?.currentStatusCode,
    eventCount: publicTracking.timeline?.length ?? 0,
    lastEvent: publicTracking.timeline?.[publicTracking.timeline.length - 1] ?? null,
  });

  const payload = {
    runId: RUN_ID,
    gatewayUrl: endpoint(''),
    shipmentCode,
    returnTaskShipmentCode: returnTaskCode,
    hubs,
    accounts,
    finalShipmentStatus: deliveredShipment.currentStatus,
    publicTrackingEventCount: publicTracking.timeline?.length ?? 0,
    report,
  };
  const outputPath = writeReportFile(payload);
  printReport(payload, outputPath);
}

main().catch((error) => {
  console.error('\nFAIL: Phase 1 flow chua hoan tat.');
  console.error(error);
  process.exitCode = 1;
});
