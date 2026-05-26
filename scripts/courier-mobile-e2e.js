#!/usr/bin/env node

const { execFileSync } = require('child_process');

const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:3000';
const POSTGRES_CONTAINER = 'NEXUS-dev-postgres';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const HUB_CODE = 'HUB-E2E-01';
const WRONG_HUB_CODE = 'HUB-E2E-99';
const OPS_USERNAME = '20000991';
const COURIER_A = '30009991';
const COURIER_B = '30009992';
const COURIER_OLD = '30009990';
const DEFAULT_PASSWORD = 'password';

const shipmentCodes = {
  dispatchOne: 'E2E-DLV-001',
  dispatchTwo: 'E2E-DLV-002',
  reassign: 'E2E-DLV-003',
  wrongHub: 'E2E-DLV-004',
  issueReturn: 'E2E-RTN-ISSUE',
  failReturn: 'E2E-RTN-FAIL',
};

function log(message) {
  console.log(`[courier-e2e] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeCode(value) {
  return String(value ?? '').trim().toUpperCase();
}

function endpoint(path) {
  const gatewayUrl =
    process.env.COURIER_E2E_GATEWAY_URL ||
    process.env.GATEWAY_URL ||
    DEFAULT_GATEWAY_URL;
  return `${gatewayUrl.replace(/\/+$/, '')}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok && !options.allowError) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status}: ${text}`);
  }

  return { status: response.status, data };
}

function psql(database, sql) {
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      POSTGRES_CONTAINER,
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      database,
    ],
    {
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function shipmentSql(code, status, hubCode) {
  const metadata = JSON.stringify({
    currentHubCode: hubCode,
    location: {
      current: hubCode,
      hubCode,
    },
    receiver: {
      name: `Receiver ${code}`,
      phone: '0900000000',
      province: 'Ho Chi Minh',
      district: 'Quan 1',
      ward: 'Ben Nghe',
      address: `1 ${code} Street`,
      hubCode,
    },
    sender: {
      name: 'E2E Sender',
      phone: '0911111111',
      province: 'Ho Chi Minh',
      district: 'Quan 3',
      ward: 'Vo Thi Sau',
      address: '2 Test Street',
      hubCode: HUB_CODE,
    },
  });

  return `
    INSERT INTO shipments (id, code, "currentStatus", "isLocked", metadata, "createdAt", "updatedAt", "cancellationReason")
    VALUES (${sqlString(`ship-${code}`)}, ${sqlString(code)}, ${sqlString(status)}::"ShipmentCurrentStatus", false, ${sqlString(metadata)}::jsonb, now(), now(), null)
    ON CONFLICT (code) DO UPDATE SET
      "currentStatus" = EXCLUDED."currentStatus",
      metadata = EXCLUDED.metadata,
      "cancellationReason" = null,
      "updatedAt" = now();
  `;
}

function currentLocationSql(code, hubCode) {
  return `
    INSERT INTO "CurrentLocation" (id, "shipmentCode", "locationCode", "lastScanType", "lastScannedAt", "createdAt", "updatedAt")
    VALUES (${sqlString(`loc-${code}`)}, ${sqlString(code)}, ${sqlString(hubCode)}, 'INBOUND', now(), now(), now())
    ON CONFLICT ("shipmentCode") DO UPDATE SET
      "locationCode" = EXCLUDED."locationCode",
      "lastScanType" = EXCLUDED."lastScanType",
      "lastScannedAt" = now(),
      "updatedAt" = now();
  `;
}

async function upsertHub(code, name) {
  const list = await request(`/courier/masterdata/hubs?code=${encodeURIComponent(code)}`);
  const existing = Array.isArray(list.data) ? list.data[0] : null;
  const body = {
    code,
    name,
    zoneCode: null,
    address: JSON.stringify({
      province: 'Ho Chi Minh',
      district: 'Quan 1',
      detail: `${code} address`,
    }),
    isActive: true,
  };

  if (existing?.id) {
    await request(`/courier/masterdata/hubs/${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      body,
    });
    return;
  }

  await request('/courier/masterdata/hubs', {
    method: 'POST',
    body,
  });
}

async function upsertUser(username, roles, displayName, hubCodes) {
  const body = {
    username,
    password: DEFAULT_PASSWORD,
    roles,
    status: 'ACTIVE',
    displayName,
    phone: `09${username.slice(-8)}`,
    hubCodes,
  };
  const created = await request('/courier/auth/auth/users', {
    method: 'POST',
    body,
    allowError: true,
  });

  if (created.status === 201 || created.status === 200) {
    return;
  }

  const users = await request(`/courier/auth/auth/users?q=${encodeURIComponent(username)}`);
  const existing = Array.isArray(users.data)
    ? users.data.find((user) => user.username === username)
    : null;
  assert(existing?.id, `Không tìm thấy user ${username} sau khi create conflict.`);

  await request(`/courier/auth/auth/users/${encodeURIComponent(existing.id)}`, {
    method: 'PATCH',
    body,
  });
}

async function seedData() {
  log('Seeding hub, courier, shipments, current locations, old task...');
  await upsertHub(HUB_CODE, 'E2E Hub 01');
  await upsertHub(WRONG_HUB_CODE, 'E2E Wrong Hub');
  await upsertUser(OPS_USERNAME, ['OPS_ADMIN'], 'E2E Ops', [HUB_CODE]);
  await upsertUser(COURIER_A, ['COURIER'], 'E2E Courier A', [HUB_CODE]);
  await upsertUser(COURIER_B, ['COURIER'], 'E2E Courier B', [HUB_CODE]);
  await upsertUser(COURIER_OLD, ['COURIER'], 'E2E Old Courier', [HUB_CODE]);

  const allCodes = Object.values(shipmentCodes);
  psql(
    'dispatch_db',
    `
      DELETE FROM task_assignments WHERE "taskId" IN (SELECT id FROM tasks WHERE "shipmentCode" = ANY (ARRAY[${allCodes.map(sqlString).join(',')}]));
      DELETE FROM tasks WHERE "shipmentCode" = ANY (ARRAY[${allCodes.map(sqlString).join(',')}]);
    `,
  );
  psql(
    'delivery_db',
    `
      DELETE FROM "ReturnCase" WHERE "shipmentCode" = ANY (ARRAY[${allCodes.map(sqlString).join(',')}]);
      DELETE FROM "NdrCase" WHERE "shipmentCode" = ANY (ARRAY[${allCodes.map(sqlString).join(',')}]);
      DELETE FROM "DeliveryAttempt" WHERE "shipmentCode" = ANY (ARRAY[${allCodes.map(sqlString).join(',')}]);
      DELETE FROM "IdempotencyRecord" WHERE "idempotencyKey" LIKE ${sqlString(`e2e-${RUN_ID}-%`)};
    `,
  );

  psql(
    'shipment_db',
    [
      shipmentSql(shipmentCodes.dispatchOne, 'SCAN_INBOUND', HUB_CODE),
      shipmentSql(shipmentCodes.dispatchTwo, 'INVENTORY_CHECK', HUB_CODE),
      shipmentSql(shipmentCodes.reassign, 'TASK_ASSIGNED', HUB_CODE),
      shipmentSql(shipmentCodes.wrongHub, 'SCAN_INBOUND', WRONG_HUB_CODE),
      shipmentSql(shipmentCodes.issueReturn, 'SCAN_INBOUND', HUB_CODE),
      shipmentSql(shipmentCodes.failReturn, 'TASK_ASSIGNED', HUB_CODE),
    ].join('\n'),
  );

  psql(
    'scan_db',
    [
      currentLocationSql(shipmentCodes.dispatchOne, HUB_CODE),
      currentLocationSql(shipmentCodes.dispatchTwo, HUB_CODE),
      currentLocationSql(shipmentCodes.reassign, HUB_CODE),
      currentLocationSql(shipmentCodes.wrongHub, WRONG_HUB_CODE),
      currentLocationSql(shipmentCodes.issueReturn, HUB_CODE),
      currentLocationSql(shipmentCodes.failReturn, HUB_CODE),
    ].join('\n'),
  );

  const oldTask = await request('/courier/dispatch/tasks', {
    method: 'POST',
    body: {
      taskCode: `E2E-OLD-${RUN_ID}`,
      taskType: 'DELIVERY',
      shipmentCode: shipmentCodes.reassign,
      note: 'E2E old delivery task',
    },
  });
  await request(`/courier/dispatch/tasks/${encodeURIComponent(oldTask.data.id)}/assign`, {
    method: 'POST',
    body: {
      courierId: COURIER_OLD,
    },
  });
}

async function getShipment(code) {
  const response = await request(`/courier/shipment/shipments/${encodeURIComponent(code)}`, {
    allowError: true,
  });
  if (response.status === 404) {
    return null;
  }
  assert(response.status === 200, `Shipment ${code} trả về ${response.status}.`);
  return response.data;
}

async function getLocation(code) {
  const response = await request(`/courier/scan/locations/${encodeURIComponent(code)}`, {
    allowError: true,
  });
  if (response.status === 404) {
    return null;
  }
  assert(response.status === 200, `Location ${code} trả về ${response.status}.`);
  return response.data;
}

async function listDeliveryTasks(code) {
  const response = await request(
    `/courier/dispatch/tasks?taskType=DELIVERY&shipmentCode=${encodeURIComponent(code)}`,
  );
  return response.data;
}

function validateDispatchInput({ shipment, location, assignedHubCodes, hasOpenDeliveryTask }) {
  if (!shipment) {
    return 'Vận đơn không tồn tại.';
  }

  const blockedStatuses = new Set([
    'DELIVERED',
    'DELIVERY_FAILED',
    'NDR_CREATED',
    'EXCEPTION',
    'RETURN_STARTED',
    'RETURN_COMPLETED',
    'CANCELLED',
  ]);
  const allowedStatuses = new Set([
    'MANIFEST_UNSEALED',
    'MANIFEST_RECEIVED',
    'SCAN_INBOUND',
    'INVENTORY_CHECK',
  ]);
  const status = normalizeCode(shipment.currentStatus);

  if (blockedStatuses.has(status)) {
    return `Trạng thái bị chặn: ${shipment.currentStatus}`;
  }

  if (!allowedStatuses.has(status) && !(status === 'TASK_ASSIGNED' && hasOpenDeliveryTask)) {
    return `Trạng thái chưa cho phát: ${shipment.currentStatus}`;
  }

  const currentHubCode =
    normalizeCode(location?.locationCode) ||
    normalizeCode(shipment.metadata?.currentHubCode) ||
    normalizeCode(shipment.metadata?.location?.hubCode);

  if (!currentHubCode) {
    return 'Không có hub hiện tại.';
  }

  if (!assignedHubCodes.includes(currentHubCode)) {
    return `Sai hub: ${currentHubCode}`;
  }

  return null;
}

async function dispatchShipments(codes, courierId) {
  const successes = [];
  const failures = [];

  for (const code of codes) {
    const [shipment, location, tasks] = await Promise.all([
      getShipment(code),
      getLocation(code),
      listDeliveryTasks(code),
    ]);
    const openTask = tasks
      .filter((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    const validationError = validateDispatchInput({
      shipment,
      location,
      assignedHubCodes: [HUB_CODE],
      hasOpenDeliveryTask: Boolean(openTask),
    });

    if (validationError) {
      failures.push({ code, reason: validationError });
      continue;
    }

    let task = openTask;
    if (!task) {
      const created = await request('/courier/dispatch/tasks', {
        method: 'POST',
        body: {
          taskCode: `E2E-DLV-${code}-${RUN_ID}`,
          taskType: 'DELIVERY',
          shipmentCode: code,
          note: `E2E dispatch ${code}`,
        },
      });
      task = created.data;
    }

    const activeAssignment = task.assignments.find(
      (assignment) => assignment.unassignedAt === null,
    );
    if (!activeAssignment) {
      await request(`/courier/dispatch/tasks/${encodeURIComponent(task.id)}/assign`, {
        method: 'POST',
        body: {
          courierId,
        },
      });
    } else if (activeAssignment.courierId !== courierId) {
      await request(`/courier/dispatch/tasks/${encodeURIComponent(task.id)}/reassign`, {
        method: 'POST',
        body: {
          courierId,
        },
      });
    }

    successes.push(code);
  }

  return { successes, failures };
}

async function assertAssignedCourier(code, courierId) {
  const tasks = await listDeliveryTasks(code);
  const activeTask = tasks.find((task) =>
    task.assignments.some(
      (assignment) => assignment.courierId === courierId && assignment.unassignedAt === null,
    ),
  );
  assert(activeTask, `Không thấy task active của ${code} cho courier ${courierId}.`);
  return activeTask;
}

async function testDispatchHappyPath() {
  log('Test: ops chọn courier rồi scan nhiều vận đơn phát hàng...');
  const couriers = await request(
    `/courier/auth/auth/users?roleGroup=SHIPPER&status=ACTIVE&hubCode=${encodeURIComponent(HUB_CODE)}`,
  );
  assert(
    couriers.data.some((user) => user.username === COURIER_A),
    `Không thấy courier ${COURIER_A} trong hub ${HUB_CODE}.`,
  );

  const result = await dispatchShipments(
    [shipmentCodes.dispatchOne, shipmentCodes.dispatchTwo],
    COURIER_A,
  );
  assert(result.failures.length === 0, `Happy path có lỗi: ${JSON.stringify(result.failures)}`);
  assert(result.successes.length === 2, 'Happy path không bàn giao đủ 2 vận đơn.');
  await assertAssignedCourier(shipmentCodes.dispatchOne, COURIER_A);
  await assertAssignedCourier(shipmentCodes.dispatchTwo, COURIER_A);
}

async function testReassignExistingTask() {
  log('Test: vận đơn đã có delivery task thì reassign...');
  const result = await dispatchShipments([shipmentCodes.reassign], COURIER_B);
  assert(result.failures.length === 0, `Reassign có lỗi: ${JSON.stringify(result.failures)}`);
  const task = await assertAssignedCourier(shipmentCodes.reassign, COURIER_B);
  assert(
    task.assignments.some(
      (assignment) => assignment.courierId === COURIER_OLD && assignment.unassignedAt !== null,
    ),
    'Assignment courier cũ chưa được đóng khi reassign.',
  );
}

async function testWrongHubAndMissingShipment() {
  log('Test: vận đơn sai hub hoặc không tồn tại thì báo lỗi...');
  const result = await dispatchShipments(
    [shipmentCodes.wrongHub, 'E2E-NOT-FOUND'],
    COURIER_A,
  );
  assert(result.successes.length === 0, 'Sai hub/nonexistent không được phép success.');
  assert(
    result.failures.some((failure) => failure.code === shipmentCodes.wrongHub && failure.reason.includes('Sai hub')),
    `Sai hub chưa báo đúng lỗi: ${JSON.stringify(result.failures)}`,
  );
  assert(
    result.failures.some((failure) => failure.code === 'E2E-NOT-FOUND' && failure.reason.includes('không tồn tại')),
    `Không tồn tại chưa báo đúng lỗi: ${JSON.stringify(result.failures)}`,
  );
}

async function listNdrCases(code) {
  const response = await request(`/courier/delivery/ndr?shipmentCode=${encodeURIComponent(code)}`);
  return response.data;
}

async function createReturnCaseFromLatestNdr(code, expectedReasonCode) {
  const ndrCases = await listNdrCases(code);
  const latest = [...ndrCases].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
  assert(latest, `Không tìm thấy NDR cho ${code}.`);
  assert(
    latest.reasonCode === expectedReasonCode || latest.issueType === expectedReasonCode,
    `NDR ${code} sai reason. Expected ${expectedReasonCode}, got reason=${latest.reasonCode}, issue=${latest.issueType}`,
  );

  const returnCase = await request('/courier/delivery/returns', {
    method: 'POST',
    body: {
      shipmentCode: code,
      ndrCaseId: latest.id,
      note: `E2E return from ${expectedReasonCode}`,
    },
  });

  assert(returnCase.data.ndrCaseId === latest.id, `Return case ${code} không gắn đúng NDR.`);
  assert(returnCase.data.note.includes(expectedReasonCode), `Return note ${code} không có reason.`);
  return returnCase.data;
}

async function testIssueThenReturnRegistration() {
  log('Test: courier tạo Vấn đề, sau đó Đăng ký chuyển hoàn tự lấy đúng lý do...');
  await request('/courier/delivery/ndr/exception', {
    method: 'POST',
    body: {
      shipmentCode: shipmentCodes.issueReturn,
      currentHubCode: HUB_CODE,
      issueType: 'WRONG_PHONE',
      issueCategory: 'INFORMATION',
      note: 'E2E vấn đề sai số điện thoại',
      actor: COURIER_A,
      occurredAt: new Date().toISOString(),
    },
  });

  await createReturnCaseFromLatestNdr(shipmentCodes.issueReturn, 'WRONG_PHONE');
}

async function testDeliveryFailThenReturnRegistration() {
  log('Test: courier Giao thất bại, sau đó đăng ký chuyển hoàn lấy đúng reason...');
  await request('/courier/delivery/deliveries/fail', {
    method: 'POST',
    headers: {
      'idempotency-key': `e2e-${RUN_ID}-delivery-fail`,
    },
    body: {
      shipmentCode: shipmentCodes.failReturn,
      taskId: null,
      courierId: COURIER_A,
      locationCode: HUB_CODE,
      actor: COURIER_A,
      note: 'E2E giao thất bại | Lý do: CANNOT_CONTACT | Ghi chú: Không liên lạc được',
      occurredAt: new Date().toISOString(),
      idempotencyKey: `e2e-${RUN_ID}-delivery-fail`,
      failReasonCode: 'CANNOT_CONTACT',
      createNdr: true,
      startReturn: false,
    },
  });

  await createReturnCaseFromLatestNdr(shipmentCodes.failReturn, 'CANNOT_CONTACT');
}

async function main() {
  log(`Gateway: ${endpoint('')}`);
  await request('/health');
  await seedData();
  await testDispatchHappyPath();
  await testReassignExistingTask();
  await testWrongHubAndMissingShipment();
  await testIssueThenReturnRegistration();
  await testDeliveryFailThenReturnRegistration();
  log('PASS: courier mobile docker-compose E2E completed.');
}

main().catch((error) => {
  console.error(`[courier-e2e] FAIL: ${error instanceof Error ? error.stack : error}`);
  process.exitCode = 1;
});
