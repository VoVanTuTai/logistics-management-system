#!/usr/bin/env node

const config = {
  gatewayUrl: process.env.GATEWAY_URL ?? 'http://localhost:3000',
  merchantUsername: process.env.MERCHANT_USERNAME ?? '41100001',
  merchantPassword: process.env.MERCHANT_PASSWORD ?? 'password',
  merchantPasswordFallback: process.env.MERCHANT_PASSWORD_FALLBACK ?? 'merchant123456',
  opsUsername: process.env.OPS_USERNAME ?? '20000001',
  opsPassword: process.env.OPS_PASSWORD ?? 'password',
  courierUsername: process.env.COURIER_USERNAME ?? '30000001',
  courierPassword: process.env.COURIER_PASSWORD ?? 'password',
  hubCode: process.env.HUB_CODE ?? '001A001',
  receiverHubCode: process.env.RECEIVER_HUB_CODE ?? '001B001',
  pollTimeoutMs: Number(process.env.FLOW_POLL_TIMEOUT_MS ?? 45000),
  pollIntervalMs: Number(process.env.FLOW_POLL_INTERVAL_MS ?? 1000),
};

const runId = new Date().toISOString().replace(/\D/g, '').slice(2, 14);

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('This script requires Node.js 18+ because it uses global fetch.');
  }

  logHeader('Flow 01 - merchant home pickup');
  logInfo(`Gateway: ${config.gatewayUrl}`);
  logInfo(`Run id: ${runId}`);

  const merchant = await loginWithFallback('merchant', config.merchantUsername, [
    config.merchantPassword,
    config.merchantPasswordFallback,
  ]);
  const ops = await loginWithFallback('ops', config.opsUsername, [config.opsPassword]);
  const courier = await loginWithFallback('courier', config.courierUsername, [
    config.courierPassword,
  ]);

  const shipmentCode = process.env.SHIPMENT_CODE ?? generateShipmentCode();
  const pickupCode = process.env.PICKUP_CODE ?? generatePickupCode();

  await step('Merchant creates shipment with home-pickup metadata', async () => {
    const shipment = await api('/merchant/shipment/shipments', {
      method: 'POST',
      token: merchant.accessToken,
      body: {
        code: shipmentCode,
        metadata: buildShipmentMetadata({
          shipmentCode,
          pickupCode,
          merchantId: merchant.user.id,
          hubCode: config.hubCode,
          receiverHubCode: config.receiverHubCode,
        }),
      },
    });

    assertEqual(shipment.code, shipmentCode, 'created shipment code');
    assertEqual(shipment.currentStatus, 'CREATED', 'shipment initial status');
    logInfo(`Created shipment ${shipment.code}`);
  });

  let pickup;
  await step('Merchant creates pickup request for the shipment', async () => {
    pickup = await api('/merchant/pickup/pickups', {
      method: 'POST',
      token: merchant.accessToken,
      body: {
        pickupCode,
        requesterName: `Flow merchant ${config.merchantUsername}`,
        contactPhone: '0900003001',
        pickupAddress: 'So 1 Tran Phu, Ha Dong, Ha Noi',
        note: `home_pickup flow=${runId}; classification=HOME_PICKUP`,
        items: [{ shipmentCode, quantity: 1 }],
      },
    });

    assertEqual(pickup.pickupCode, pickupCode, 'pickup code');
    assertEqual(pickup.status, 'REQUESTED', 'pickup initial status');
    assert(
      pickup.items?.some((item) => item.shipmentCode === shipmentCode),
      'pickup should contain created shipment',
    );
    logInfo(`Created pickup ${pickup.pickupCode} (${pickup.id})`);
  });

  await step('Ops can see the requested pickup waiting for coordination', async () => {
    const visiblePickup = await waitFor('ops pickup REQUESTED list', async () => {
      const pickups = await api('/ops/pickup/pickups?status=REQUESTED', {
        token: ops.accessToken,
      });
      return pickups.find((item) =>
        item.id === pickup.id ||
        item.pickupCode === pickup.pickupCode ||
        item.items?.some((pickupItem) => pickupItem.shipmentCode === shipmentCode),
      );
    });

    assertEqual(visiblePickup.status, 'REQUESTED', 'ops visible pickup status');
    logInfo(`Ops sees pickup ${visiblePickup.pickupCode} status ${visiblePickup.status}`);
  });

  await step('Ops approves pickup request', async () => {
    const approved = await api(`/ops/pickup/pickups/${encodeURIComponent(pickup.id)}/approve`, {
      method: 'POST',
      token: ops.accessToken,
      body: {
        approvedBy: ops.user.id,
        note: `approved_by_ops=${ops.user.id}; hub=${config.hubCode}; flow=${runId}`,
      },
    });

    assertEqual(approved.status, 'APPROVED', 'approved pickup status');
    pickup = approved;
    logInfo(`Approved pickup ${pickup.pickupCode}`);
  });

  let task;
  await step('Dispatch creates pickup task in CREATED state', async () => {
    task = await waitFor('dispatch pickup task CREATED', async () => {
      const tasksByPickup = await api(
        `/ops/dispatch/tasks?pickupRequestId=${encodeURIComponent(pickup.id)}`,
        { token: ops.accessToken },
      );
      const fromPickup = findPickupTask(tasksByPickup, shipmentCode);
      if (fromPickup) {
        return fromPickup;
      }

      const tasksByShipment = await api(
        `/ops/dispatch/tasks?taskType=PICKUP&shipmentCode=${encodeURIComponent(shipmentCode)}`,
        { token: ops.accessToken },
      );
      return findPickupTask(tasksByShipment, shipmentCode);
    });

    assertEqual(task.taskType, 'PICKUP', 'task type');
    assertEqual(task.status, 'CREATED', 'task status before assignment');
    logInfo(`Dispatch task ${task.taskCode} (${task.id}) is ${task.status}`);
  });

  await step('Ops assigns pickup task to courier', async () => {
    task = await api(`/ops/dispatch/tasks/${encodeURIComponent(task.id)}/assign`, {
      method: 'POST',
      token: ops.accessToken,
      body: { courierId: config.courierUsername },
    });

    assertEqual(task.status, 'ASSIGNED', 'task status after assignment');
    assert(
      task.assignments?.some(
        (assignment) =>
          assignment.courierId === config.courierUsername &&
          assignment.unassignedAt === null,
      ),
      'task should have active courier assignment',
    );
    logInfo(`Assigned task ${task.taskCode} to courier ${config.courierUsername}`);
  });

  await step('Shipment is marked as assigned to courier', async () => {
    const shipment = await waitFor('shipment TASK_ASSIGNED', async () => {
      const current = await api(`/ops/shipment/shipments/${encodeURIComponent(shipmentCode)}`, {
        token: ops.accessToken,
      });
      return current.currentStatus === 'TASK_ASSIGNED' ? current : null;
    });

    logInfo(`Shipment ${shipment.code} status ${shipment.currentStatus}`);
  });

  await step('Courier sees pickup task in assigned task list', async () => {
    const courierTask = await waitFor('courier assigned pickup task', async () => {
      const tasks = await api(
        `/courier/dispatch/tasks?courierId=${encodeURIComponent(config.courierUsername)}`,
        { token: courier.accessToken },
      );
      return tasks.find(
        (item) =>
          item.id === task.id &&
          item.taskType === 'PICKUP' &&
          item.status === 'ASSIGNED' &&
          item.shipmentCode === shipmentCode,
      );
    });

    logInfo(`Courier sees task ${courierTask.taskCode} status ${courierTask.status}`);
  });

  const scanNote = [
    'pickup_received',
    `flow=${runId}`,
    `received_by=${courier.user.displayName ?? config.courierUsername}`,
    `employee_code=${config.courierUsername}`,
    `hub=${config.hubCode}`,
  ].join('; ');
  const scanActor = `courier:${config.courierUsername}`;
  const scanIdempotencyKey = `flow-${runId}-${shipmentCode}-pickup`;

  await step('Courier scans package pickup confirmation', async () => {
    const scan = await api('/courier/scan/scans/pickup', {
      method: 'POST',
      token: courier.accessToken,
      headers: { 'Idempotency-Key': scanIdempotencyKey },
      body: {
        shipmentCode,
        locationCode: config.hubCode,
        actor: scanActor,
        note: scanNote,
        idempotencyKey: scanIdempotencyKey,
      },
    });

    assertEqual(scan.scanEvent.shipmentCode, shipmentCode, 'pickup scan shipmentCode');
    assertEqual(scan.scanEvent.scanType, 'PICKUP', 'pickup scan type');
    assertEqual(scan.scanEvent.actor, scanActor, 'pickup scan actor');
    assertEqual(scan.scanEvent.note, scanNote, 'pickup scan note');
    assertEqual(scan.currentLocation.locationCode, config.hubCode, 'current pickup location');
    logInfo(`Recorded pickup scan ${scan.scanEvent.id}`);
  });

  await step('Shipment status moves to PICKUP_COMPLETED', async () => {
    const shipment = await waitFor('shipment PICKUP_COMPLETED', async () => {
      const current = await api(`/courier/shipment/shipments/${encodeURIComponent(shipmentCode)}`, {
        token: courier.accessToken,
      });
      return current.currentStatus === 'PICKUP_COMPLETED' ? current : null;
    });

    logInfo(`Shipment ${shipment.code} status ${shipment.currentStatus}`);
  });

  await step('Scan location and tracking timeline contain pickup scan data', async () => {
    const location = await api(`/courier/scan/locations/${encodeURIComponent(shipmentCode)}`, {
      token: courier.accessToken,
    });
    assertEqual(location.lastScanType, 'PICKUP', 'current location last scan type');
    assertEqual(location.locationCode, config.hubCode, 'current location hub');

    const pickupEvent = await waitFor('tracking scan.pickup_confirmed event', async () => {
      const timeline = await api(
        `/ops/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`,
        { token: ops.accessToken },
      );
      return timeline.find((event) => event.eventTypeCode === 'scan.pickup_confirmed');
    });

    assertEqual(pickupEvent.actor, scanActor, 'tracking pickup actor');
    assertEqual(pickupEvent.locationCode, config.hubCode, 'tracking pickup location');
    assertEqual(
      pickupEvent.payload?.data?.scanEvent?.note,
      scanNote,
      'tracking pickup scan note payload',
    );
    logInfo(`Tracking has ${pickupEvent.eventTypeCode} for ${shipmentCode}`);
  });

  logHeader('Flow passed');
  logInfo(`Shipment: ${shipmentCode}`);
  logInfo(`Pickup: ${pickup.pickupCode}`);
  logInfo(`Task: ${task.taskCode}`);
}

async function loginWithFallback(group, username, passwords) {
  const candidates = Array.from(new Set(passwords.filter(Boolean)));
  let lastError = null;

  for (const password of candidates) {
    try {
      const session = await api(`/${group}/auth/auth/login`, {
        method: 'POST',
        body: { username, password },
      });

      assert(session.tokens?.accessToken, `${group} login should return access token`);
      logInfo(`Logged in ${group} ${username}`);
      return {
        user: session.user,
        accessToken: session.tokens.accessToken,
        refreshToken: session.tokens.refreshToken,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to login ${group} ${username}`);
}

async function api(path, options = {}) {
  const url = buildUrl(path);
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let body;
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  const text = await response.text();
  const payload = parseResponsePayload(text);

  if (!response.ok) {
    const message = readErrorMessage(payload) ?? `Request failed ${response.status}`;
    const error = new Error(`${options.method ?? 'GET'} ${path}: ${message}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function waitFor(label, callback) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt <= config.pollTimeoutMs) {
    try {
      const value = await callback();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(config.pollIntervalMs);
  }

  if (lastError) {
    throw new Error(`Timed out waiting for ${label}. Last error: ${lastError.message}`);
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

async function step(label, fn) {
  logHeader(label);
  await fn();
  logInfo(`OK: ${label}`);
}

function findPickupTask(tasks, shipmentCode) {
  return tasks.find(
    (task) =>
      task.taskType === 'PICKUP' &&
      task.shipmentCode === shipmentCode &&
      task.status === 'CREATED',
  );
}

function buildShipmentMetadata(input) {
  return {
    sender: {
      name: 'Shop Minh Anh',
      phone: '0900003001',
      address: 'So 1 Tran Phu, Ha Dong, Ha Noi',
      addressDetail: 'So 1 Tran Phu',
      province: 'Ha Noi',
      ward: 'Ha Dong',
      hubCode: input.hubCode,
    },
    receiver: {
      name: 'Nguyen Van Test',
      phone: '0912345678',
      address: 'So 2 Cau Giay, Ha Noi',
      addressDetail: 'So 2 Cau Giay',
      region: 'Ha Noi',
      province: 'Ha Noi',
      ward: 'Cau Giay',
      hubCode: input.receiverHubCode,
    },
    package: {
      itemType: 'FLOW_TEST_PACKAGE',
      weightKg: 1.2,
      dimensionsCm: { length: 20, width: 15, height: 8 },
      declaredValue: 250000,
    },
    service: { type: 'STANDARD' },
    codAmount: 0,
    deliveryNote: 'Flow test home pickup.',
    estimatedFee: 25000,
    routing: {
      originHubCode: input.hubCode,
      destinationHubCode: input.receiverHubCode,
    },
    pickup: {
      classification: 'HOME_PICKUP',
      pickupCode: input.pickupCode,
    },
    source: 'flow-test',
    flowTest: {
      name: 'pickup-at-home-flow',
      runId,
      merchantId: input.merchantId,
      shipmentCode: input.shipmentCode,
    },
  };
}

function buildUrl(path) {
  const base = config.gatewayUrl.endsWith('/') ? config.gatewayUrl : `${config.gatewayUrl}/`;
  return new URL(path.replace(/^\//, ''), base).toString();
}

function parseResponsePayload(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readErrorMessage(payload) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  return null;
}

function generateShipmentCode() {
  return `101${randomDigits(9)}`;
}

function generatePickupCode() {
  return `PU${runId}${randomAlphaNumeric(3)}`;
}

function randomDigits(length) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += Math.floor(Math.random() * 10);
  }
  return value;
}

function randomAlphaNumeric(length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: ${message}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function logHeader(message) {
  console.log(`\n== ${message}`);
}

function logInfo(message) {
  console.log(`- ${message}`);
}

main().catch((error) => {
  console.error('\nFlow failed');
  console.error(error.stack ?? error.message ?? error);
  process.exitCode = 1;
});
