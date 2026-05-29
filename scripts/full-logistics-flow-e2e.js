#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:3000';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = process.env.E2E_PASSWORD || 'password';

const accounts = {
  admin: process.env.E2E_ADMIN_USER || '10000001',
  merchant: process.env.E2E_MERCHANT_USER || '41100001',
  opsOrigin: process.env.E2E_OPS_ORIGIN_USER || '20000003',
  opsSort: process.env.E2E_OPS_SORT_USER || '20000002',
  opsDest: process.env.E2E_OPS_DEST_USER || '20000001',
  courierPickup: process.env.E2E_COURIER_PICKUP_USER || '30000003',
  courierDelivery: process.env.E2E_COURIER_DELIVERY_USER || '30000001',
};

const report = [];
const proofs = {};

function endpoint(pathname) {
  const gatewayUrl =
    process.env.E2E_GATEWAY_URL ||
    process.env.GATEWAY_URL ||
    DEFAULT_GATEWAY_URL;
  return `${gatewayUrl.replace(/\/+$/, '')}${pathname}`;
}

function log(message) {
  console.log(`[full-flow-e2e] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function note(step, detail) {
  return `E2E_FULL_FLOW|run=${RUN_ID}|step=${step}|${detail}`;
}

function addReport(step, noteText, evidence) {
  report.push({
    step,
    note: noteText,
    evidence,
    recordedAt: new Date().toISOString(),
  });
}

async function request(pathname, options = {}) {
  const headers = {
    accept: 'application/json',
    ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint(pathname), {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok && !options.allowError) {
    throw new Error(
      `${options.method || 'GET'} ${pathname} -> ${response.status}: ${text}`,
    );
  }

  return { status: response.status, data, text };
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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
  assert(token, `Không lấy được accessToken cho tài khoản ${username}.`);
  return {
    token,
    user: data.user,
  };
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

function buildShipmentMetadata(code, originHubCode, destinationHubCode, codAmount) {
  return {
    createdBy: {
      username: accounts.merchant,
      userId: accounts.merchant,
    },
    createdByUsername: accounts.merchant,
    createdByUserId: accounts.merchant,
    sender: {
      name: 'Merchant E2E NEXUS',
      phone: '0909000001',
      address: '02 Cong xa Paris',
      addressDetail: `Dia chi gui E2E ${RUN_ID}`,
      province: 'Ho Chi Minh',
      ward: 'Phuong Sai Gon',
      hubCode: originHubCode,
    },
    receiver: {
      name: `Khach nhan ${code}`,
      phone: '0919000001',
      address: '12 Trang Tien',
      addressDetail: `Dia chi nhan E2E ${RUN_ID}`,
      region: 'HA_NOI',
      province: 'Ha Noi',
      ward: 'Phuong Hoan Kiem',
      hubCode: destinationHubCode,
    },
    package: {
      itemType: 'Hang E2E doi soat',
      weightKg: 1.2,
      dimensionsCm: {
        length: 24,
        width: 18,
        height: 12,
      },
      declaredValue: 500000,
    },
    service: {
      type: 'STANDARD',
    },
    codAmount,
    deliveryNote: note('merchant-create', `shipment=${code}|merchant_note=tao_don_e2e`),
    estimatedFee: 42000,
    routing: {
      originHubCode,
      destinationHubCode,
    },
    source: 'merchant-web',
  };
}

async function createShipment(token, code, originHubCode, destinationHubCode, codAmount) {
  const createNote = note(
    'merchant-create',
    `shipment=${code}|origin=${originHubCode}|destination=${destinationHubCode}`,
  );
  const { data } = await request('/merchant/shipment/shipments', {
    method: 'POST',
    token,
    body: {
      code,
      metadata: {
        ...buildShipmentMetadata(code, originHubCode, destinationHubCode, codAmount),
        e2eCreateNote: createNote,
      },
    },
  });
  addReport('Merchant tạo vận đơn', createNote, {
    shipmentCode: data.code,
    status: data.currentStatus,
    metadataNote: data.metadata?.e2eCreateNote,
  });
  return data;
}

async function uploadProof(kind, token) {
  const filename = `${RUN_ID}-${kind}.png`;
  const { data } = await request(
    `/courier/media/upload-url?filename=${encodeURIComponent(filename)}&contentType=image%2Fpng`,
    { token },
  );
  const descriptor = data?.data;
  assert(descriptor?.uploadUrl, `Không tạo được upload URL cho proof ${kind}.`);

  const uploadUrl = rewriteUploadUrl(descriptor.uploadUrl);
  const imageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  );
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'image/png' },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => '');
    throw new Error(
      `Upload proof ${kind} thất bại (${uploadResponse.status}). URL=${uploadUrl}. ${body}`,
    );
  }

  const publicUrl = rewritePublicUrl(descriptor);
  proofs[kind] = publicUrl;
  addReport('Upload hình đối soát MinIO', note('media-upload', `kind=${kind}`), {
    kind,
    fileKey: descriptor.fileKey,
    bucket: descriptor.bucket,
    publicUrl,
  });
  return publicUrl;
}

function rewriteUploadUrl(url) {
  const from = process.env.E2E_MINIO_INTERNAL_ENDPOINT || 'http://minio:9000';
  const to = process.env.E2E_MINIO_UPLOAD_ENDPOINT || 'http://127.0.0.1:19000';
  return url.startsWith(from) ? `${to}${url.slice(from.length)}` : url;
}

function rewritePublicUrl(descriptor) {
  if (process.env.E2E_MEDIA_PUBLIC_URL_BASE) {
    return `${process.env.E2E_MEDIA_PUBLIC_URL_BASE.replace(/\/+$/, '')}/${descriptor.bucket}/${descriptor.fileKey}`;
  }

  const publicUrl = descriptor.publicUrl;
  const from = process.env.E2E_MINIO_INTERNAL_ENDPOINT || 'http://minio:9000';
  const to = process.env.E2E_MINIO_PUBLIC_ENDPOINT || 'http://127.0.0.1:19000';
  return publicUrl?.startsWith(from) ? `${to}${publicUrl.slice(from.length)}` : publicUrl;
}

async function createAndAssignPickup(tokens, shipmentCodes, originHubCode) {
  const pickupNote = note(
    'pickup-request',
    `shipments=${shipmentCodes.join(',')}|origin=${originHubCode}`,
  );
  const { data: pickup } = await request('/merchant/pickup/pickups', {
    method: 'POST',
    token: tokens.merchant,
    body: {
      pickupCode: `PU-${RUN_ID}`,
      requesterName: 'Merchant E2E NEXUS',
      contactPhone: '0909000001',
      pickupAddress: `Kho merchant E2E - ${originHubCode}`,
      note: pickupNote,
      items: shipmentCodes.map((shipmentCode) => ({ shipmentCode, quantity: 1 })),
    },
  });
  addReport('Merchant tạo yêu cầu lấy hàng', pickupNote, {
    pickupCode: pickup.pickupCode,
    pickupId: pickup.id,
    savedNote: pickup.note,
    items: pickup.items?.map((item) => item.shipmentCode),
  });

  const approveNote = note(
    'pickup-approve',
    `pickup=${pickup.pickupCode}|courier=${accounts.courierPickup}`,
  );
  const { data: approvedPickup } = await request(`/ops/pickup/pickups/${pickup.id}/approve`, {
    method: 'POST',
    token: tokens.opsOrigin,
    body: {
      approvedBy: accounts.opsOrigin,
      note: approveNote,
    },
  });
  addReport('Ops duyệt yêu cầu lấy hàng', approveNote, {
    pickupCode: approvedPickup.pickupCode,
    status: approvedPickup.status,
    savedNote: approvedPickup.note,
  });

  const tasks = await ensurePickupTasks(tokens.admin, tokens.opsOrigin, pickup.id, shipmentCodes);
  for (const task of tasks) {
    const assignNote = note(
      'pickup-dispatch',
      `task=${task.taskCode}|shipment=${task.shipmentCode}|courier=${accounts.courierPickup}`,
    );
    const { data: assignedTask } = await request(`/ops/dispatch/tasks/${task.id}/assign`, {
      method: 'POST',
      token: tokens.opsOrigin,
      body: { courierId: accounts.courierPickup },
    });
    addReport('Hub gửi phân công courier đi lấy', assignNote, {
      taskCode: assignedTask.taskCode,
      status: assignedTask.status,
      courierId: assignedTask.assignments?.find((item) => !item.unassignedAt)?.courierId,
    });
  }

  return pickup;
}

async function ensurePickupTasks(adminToken, opsToken, pickupRequestId, shipmentCodes) {
  try {
    return await waitForPickupTasks(adminToken, pickupRequestId, shipmentCodes, 15_000);
  } catch {
    const existingTasks = await listPickupTasks(adminToken, pickupRequestId);
    const existingByShipment = new Map(existingTasks.map((task) => [task.shipmentCode, task]));
    const tasks = [...existingTasks.filter((task) => shipmentCodes.includes(task.shipmentCode))];

    for (const shipmentCode of shipmentCodes) {
      if (existingByShipment.has(shipmentCode)) {
        continue;
      }

      const createNote = note(
        'pickup-task-create',
        `pickup=${pickupRequestId}|shipment=${shipmentCode}|courier=${accounts.courierPickup}`,
      );
      const { data: task } = await request('/ops/dispatch/tasks', {
        method: 'POST',
        token: opsToken,
        body: {
          taskCode: `PICK-${RUN_ID}-${shipmentCode}`,
          taskType: 'PICKUP',
          shipmentCode,
          pickupRequestId,
          note: createNote,
        },
      });
      addReport('Ops tạo task lấy hàng khi cần phân công trực tiếp', createNote, {
        taskCode: task.taskCode,
        shipmentCode: task.shipmentCode,
        savedNote: task.note,
      });
      tasks.push(task);
    }

    return tasks;
  }
}

async function waitForPickupTasks(token, pickupRequestId, shipmentCodes, timeoutMs = 45_000) {
  return poll(async () => {
    const tasks = await listPickupTasks(token, pickupRequestId);
    const byShipment = new Map(tasks.map((task) => [task.shipmentCode, task]));
    if (shipmentCodes.every((code) => byShipment.has(code))) {
      return shipmentCodes.map((code) => byShipment.get(code));
    }
    return null;
  }, `pickup tasks ${pickupRequestId}`, timeoutMs);
}

async function listPickupTasks(token, pickupRequestId) {
  const { data } = await request(
    `/ops/dispatch/tasks?pickupRequestId=${encodeURIComponent(pickupRequestId)}&taskType=PICKUP`,
    { token },
  );
  return Array.isArray(data) ? data : [];
}

async function pickupScan(tokens, shipmentCodes, originHubCode, pickup) {
  for (const shipmentCode of shipmentCodes) {
    const proofUrl = await uploadProof(`pickup-${shipmentCode}`, tokens.courierPickup);
    const scanNote = note(
      'pickup-scan',
      `shipment=${shipmentCode}|courier=${accounts.courierPickup}|image=${proofUrl}`,
    );
    const { data } = await request('/courier/scan/scans/pickup', {
      method: 'POST',
      token: tokens.courierPickup,
      body: {
        shipmentCode,
        locationCode: originHubCode,
        actor: accounts.courierPickup,
        note: scanNote,
        idempotencyKey: `${RUN_ID}-${shipmentCode}-pickup`,
      },
    });
    addReport('Courier lấy hàng và mang về hub', scanNote, {
      shipmentCode: data.scanEvent.shipmentCode,
      savedNote: data.scanEvent.note,
      locationCode: data.currentLocation.locationCode,
    });
    await waitForStatus(tokens.admin, shipmentCode, ['PICKUP_COMPLETED'], 'sau khi courier lấy hàng');
  }

  const { data: completedPickup } = await request(`/ops/pickup/pickups/${pickup.id}/complete`, {
    method: 'POST',
    token: tokens.opsOrigin,
  });
  addReport('Ops hoàn tất phiếu lấy hàng', note('pickup-complete', `pickup=${pickup.pickupCode}`), {
    pickupCode: completedPickup.pickupCode,
    status: completedPickup.status,
  });
}

async function moveLeg(params) {
  const {
    tokens,
    opsToken,
    shipmentCodes,
    fromHub,
    toHub,
    legIndex,
    legLabel,
    driverName,
    vehiclePlate,
  } = params;

  const bagCode = `BAG-${RUN_ID}-${legIndex}`;
  const bagCreateNote = note(
    `bag-create-${legIndex}`,
    `label=${bagCode}|from=${fromHub}|to=${toHub}|${legLabel}`,
  );
  const { data: bag } = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: opsToken,
    body: {
      manifestCode: bagCode,
      originHubCode: fromHub,
      destinationHubCode: toHub,
      shipmentCodes,
      note: bagCreateNote,
    },
  });
  addReport('Ops in tem bao và tạo bao', bagCreateNote, {
    manifestCode: bag.manifestCode,
    manifestId: bag.id,
    savedNote: bag.note,
    shipments: bag.items?.map((item) => item.shipmentCode),
  });

  const sealNote = note(
    `bag-seal-${legIndex}`,
    `bag=${bagCode}|from=${fromHub}|scan=close-bag`,
  );
  const { data: sealedBag } = await request(`/ops/manifest/manifests/${bag.id}/seal`, {
    method: 'POST',
    token: opsToken,
    body: {
      sealedBy: params.opsUsername,
      sealedByName: params.opsUsername,
      processingHubCode: fromHub,
      note: sealNote,
    },
  });
  addReport('Ops quét đóng bao', sealNote, {
    manifestCode: sealedBag.manifestCode,
    status: sealedBag.status,
    savedSealNote: sealedBag.sealRecord?.note,
  });
  await waitForAllStatuses(tokens.admin, shipmentCodes, ['MANIFEST_SEALED'], 'sau khi đóng bao');

  const tripCode = `TRIP-${RUN_ID}-${legIndex}`;
  const vehicleSeal = `SEAL-${RUN_ID}-${legIndex}`;
  const tripCreateNote = note(
    `vehicle-create-${legIndex}`,
    `trip=${tripCode}|driver=${driverName}|plate=${vehiclePlate}|seal=${vehicleSeal}`,
  );
  const { data: trip } = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: opsToken,
    body: {
      manifestCode: tripCode,
      originHubCode: fromHub,
      destinationHubCode: toHub,
      shipmentCodes: [],
      note: tripCreateNote,
    },
  });
  addReport('Ops tạo chuyến xe và tem xe', tripCreateNote, {
    tripCode: trip.manifestCode,
    manifestId: trip.id,
    savedNote: trip.note,
  });

  for (const shipmentCode of shipmentCodes) {
    const sendGoodsNote = note(
      `send-goods-${legIndex}`,
      `shipment=${shipmentCode}|bag=${bagCode}|trip=${tripCode}`,
    );
    const { data } = await request('/ops/scan/scans/outbound', {
      method: 'POST',
      token: opsToken,
      body: {
        shipmentCode,
        locationCode: fromHub,
        manifestCode: bagCode,
        actor: params.opsUsername,
        note: `SEND_GOODS | ${sendGoodsNote}`,
        idempotencyKey: `${RUN_ID}-${shipmentCode}-send-${legIndex}`,
      },
    });
    addReport('Ops quét gửi hàng', `SEND_GOODS | ${sendGoodsNote}`, {
      shipmentCode: data.scanEvent.shipmentCode,
      savedNote: data.scanEvent.note,
      manifestCode: data.scanEvent.manifestCode,
    });
  }
  await waitForAllStatuses(tokens.admin, shipmentCodes, ['SEND_GOODS'], 'sau khi quét gửi hàng');

  const departImage = await uploadProof(`vehicle-depart-${legIndex}`, tokens.courierDelivery);
  for (const shipmentCode of shipmentCodes) {
    const vehicleOutNote = note(
      `vehicle-out-${legIndex}`,
      `shipment=${shipmentCode}|trip=${tripCode}|driver=${driverName}|plate=${vehiclePlate}|seal=${vehicleSeal}|image=${departImage}`,
    );
    const { data } = await request('/ops/scan/scans/outbound', {
      method: 'POST',
      token: opsToken,
      body: {
        shipmentCode,
        locationCode: fromHub,
        manifestCode: tripCode,
        actor: params.opsUsername,
        note: `VEHICLE_OUTBOUND | ${vehicleOutNote}`,
        idempotencyKey: `${RUN_ID}-${shipmentCode}-vehicle-out-${legIndex}`,
      },
    });
    addReport('Ops quét xe đi kèm ảnh và seal', `VEHICLE_OUTBOUND | ${vehicleOutNote}`, {
      shipmentCode: data.scanEvent.shipmentCode,
      savedNote: data.scanEvent.note,
      locationCode: data.currentLocation.locationCode,
    });
  }
  await waitForAllStatuses(tokens.admin, shipmentCodes, ['IN_TRANSIT'], 'sau khi xe rời hub');

  const receiveImage = await uploadProof(`vehicle-arrive-${legIndex}`, tokens.courierDelivery);
  const receiveNote = note(
    `vehicle-arrive-${legIndex}`,
    `trip=${tripCode}|bag=${bagCode}|seal=${vehicleSeal}|verified=true|image=${receiveImage}`,
  );
  const { data: receivedBag } = await request(`/ops/manifest/manifests/${bag.id}/receive`, {
    method: 'POST',
    token: params.receiveOpsToken,
    body: {
      receivedBy: params.receiveOpsUsername,
      receivedByName: params.receiveOpsUsername,
      processingHubCode: toHub,
      note: receiveNote,
    },
  });
  addReport('Ops hub nhận quét xe đến, chụp ảnh và xác minh seal', receiveNote, {
    manifestCode: receivedBag.manifestCode,
    status: receivedBag.status,
    savedReceiveNote: receivedBag.receiveRecord?.note,
  });

  for (const shipmentCode of shipmentCodes) {
    const inboundNote = note(
      `goods-arrive-${legIndex}`,
      `shipment=${shipmentCode}|trip=${tripCode}|hub=${toHub}`,
    );
    const { data } = await request('/ops/scan/scans/inbound', {
      method: 'POST',
      token: params.receiveOpsToken,
      body: {
        shipmentCode,
        locationCode: toHub,
        manifestCode: tripCode,
        actor: params.receiveOpsUsername,
        note: inboundNote,
        idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-${legIndex}`,
      },
    });
    addReport('Ops quét hàng đến', inboundNote, {
      shipmentCode: data.scanEvent.shipmentCode,
      savedNote: data.scanEvent.note,
      locationCode: data.currentLocation.locationCode,
    });
  }
  await waitForAllStatuses(tokens.admin, shipmentCodes, ['SCAN_INBOUND'], 'sau khi hàng đến hub');

  return { bagCode, tripCode, vehicleSeal };
}

async function createAndAssignDelivery(tokens, shipmentCode, destHubCode) {
  const createNote = note(
    'delivery-task-create',
    `shipment=${shipmentCode}|hub=${destHubCode}|courier=${accounts.courierDelivery}`,
  );
  const { data: task } = await request('/ops/dispatch/tasks', {
    method: 'POST',
    token: tokens.opsDest,
    body: {
      taskCode: `DLV-${RUN_ID}-${shipmentCode}`,
      taskType: 'DELIVERY',
      shipmentCode,
      note: createNote,
    },
  });
  addReport('Ops hub đích tạo điều phối phát hàng', createNote, {
    taskCode: task.taskCode,
    shipmentCode: task.shipmentCode,
    savedNote: task.note,
  });

  const assignNote = note(
    'delivery-task-assign',
    `task=${task.taskCode}|shipment=${shipmentCode}|courier=${accounts.courierDelivery}`,
  );
  const { data: assignedTask } = await request(`/ops/dispatch/tasks/${task.id}/assign`, {
    method: 'POST',
    token: tokens.opsDest,
    body: { courierId: accounts.courierDelivery },
  });
  addReport('Ops phân công courier đi giao', assignNote, {
    taskCode: assignedTask.taskCode,
    status: assignedTask.status,
    courierId: assignedTask.assignments?.find((item) => !item.unassignedAt)?.courierId,
  });
  await waitForStatus(tokens.admin, shipmentCode, ['TASK_ASSIGNED'], 'sau khi phân công giao');
  return assignedTask;
}

async function deliverSuccess(tokens, shipmentCode, task, destHubCode) {
  const podImage = await uploadProof(`pod-success-${shipmentCode}`, tokens.courierDelivery);
  const deliveryNote = note(
    'delivery-success',
    `shipment=${shipmentCode}|paymentMethod=COD|podImage=${podImage}`,
  );
  const { data } = await request('/courier/delivery/deliveries/success', {
    method: 'POST',
    token: tokens.courierDelivery,
    body: {
      shipmentCode,
      taskId: task.id,
      courierId: accounts.courierDelivery,
      locationCode: destHubCode,
      actor: accounts.courierDelivery,
      note: deliveryNote,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-delivery-success`,
      podImageUrl: podImage,
      podNote: `${deliveryNote}|signedBy=customer`,
      podCapturedBy: accounts.courierDelivery,
    },
  });
  addReport('Courier giao thành công, ký nhận và ghi nhận thanh toán', deliveryNote, {
    shipmentCode: data.deliveryAttempt.shipmentCode,
    deliveryStatus: data.deliveryAttempt.status,
    savedNote: data.deliveryAttempt.note,
    podImageUrl: data.pod?.imageUrl,
    podNote: data.pod?.note,
  });
  await waitForStatus(tokens.admin, shipmentCode, ['DELIVERED'], 'sau khi ký nhận giao thành công');
}

async function reportIssueAndInventory(tokens, shipmentCode, task, destHubCode) {
  const issueImage = await uploadProof(`issue-${shipmentCode}`, tokens.courierDelivery);
  const issueNote = note(
    'delivery-issue',
    `shipment=${shipmentCode}|reason=CUSTOMER_REFUSED|image=${issueImage}`,
  );
  const { data: ndrCase } = await request('/courier/delivery/ndr/exception', {
    method: 'POST',
    token: tokens.courierDelivery,
    body: {
      shipmentCode,
      currentHubCode: destHubCode,
      issueType: 'CUSTOMER_REFUSED',
      issueCategory: 'INFORMATION',
      attachments: [
        {
          url: issueImage,
          type: 'image/png',
          name: `issue-${shipmentCode}.png`,
        },
      ],
      note: issueNote,
      actor: accounts.courierDelivery,
    },
  });
  addReport('Courier dùng chức năng vấn đề khi khách không nhận', issueNote, {
    shipmentCode: ndrCase.shipmentCode,
    ndrId: ndrCase.id,
    status: ndrCase.status,
    savedNote: ndrCase.note,
    attachments: ndrCase.attachments,
    taskId: task.id,
  });
  await waitForStatus(tokens.admin, shipmentCode, ['EXCEPTION'], 'sau khi ghi nhận vấn đề');

  const inventoryNote = note(
    'inventory-check',
    `shipment=${shipmentCode}|hub=${destHubCode}|fromIssue=true|checkedBy=${accounts.opsDest}`,
  );
  const { data } = await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: tokens.opsDest,
    body: {
      shipmentCode,
      locationCode: destHubCode,
      actor: accounts.opsDest,
      note: `INVENTORY_CHECK | ${inventoryNote}`,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-inventory-check`,
    },
  });
  addReport('Ops kiểm tồn kho đơn vấn đề', `INVENTORY_CHECK | ${inventoryNote}`, {
    shipmentCode: data.scanEvent.shipmentCode,
    savedNote: data.scanEvent.note,
    locationCode: data.currentLocation.locationCode,
  });
  const shipment = await waitForStatus(
    tokens.admin,
    shipmentCode,
    ['INVENTORY_CHECK'],
    'sau khi kiểm tồn kho',
  );
  assert(shipment.isLocked === false, `Vận đơn ${shipmentCode} vẫn đang bị khóa sau kiểm tồn.`);
  addReport('Xác nhận đơn vấn đề đã về tồn kho và mở khóa vận hành', inventoryNote, {
    shipmentCode: shipment.code,
    currentStatus: shipment.currentStatus,
    isLocked: shipment.isLocked,
  });
}

async function verifyDestinationList(token, shipmentCodes, destHubCode) {
  const query = new URLSearchParams({
    opsArrivedUnsigned: 'true',
    hubCodes: destHubCode,
    limit: '100',
    offset: '0',
  });
  const { data } = await request(`/ops/shipment/shipments?${query.toString()}`, {
    token,
  });
  const items = Array.isArray(data) ? data : data.items || [];
  const visibleCodes = new Set(items.map((item) => item.code));
  for (const shipmentCode of shipmentCodes) {
    assert(
      visibleCodes.has(shipmentCode),
      `Vận đơn ${shipmentCode} chưa hiển thị trong danh sách hub đích ${destHubCode}.`,
    );
  }
  addReport('Xác nhận hub đích thấy đơn để điều phối phát', note('destination-list', `hub=${destHubCode}`), {
    destHubCode,
    expectedShipments: shipmentCodes,
    visibleShipments: shipmentCodes.filter((code) => visibleCodes.has(code)),
    totalReturned: Array.isArray(data) ? data.length : data.pageInfo?.total,
  });
}

async function getShipment(token, shipmentCode) {
  const { data } = await request(`/ops/shipment/shipments/${encodeURIComponent(shipmentCode)}`, {
    token,
  });
  return data;
}

async function waitForStatus(token, shipmentCode, statuses, label) {
  const expected = new Set(statuses);
  return poll(async () => {
    const shipment = await getShipment(token, shipmentCode);
    return expected.has(shipment.currentStatus) ? shipment : null;
  }, `${shipmentCode} ${label}: ${statuses.join('/')}`);
}

async function waitForAllStatuses(token, shipmentCodes, statuses, label) {
  for (const shipmentCode of shipmentCodes) {
    await waitForStatus(token, shipmentCode, statuses, label);
  }
}

async function poll(fn, label, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(800);
  }
  throw new Error(`Timeout khi chờ ${label}.${lastError ? ` Lỗi cuối: ${lastError.message}` : ''}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendTrackingSummary(token, shipmentCodes) {
  for (const shipmentCode of shipmentCodes) {
    const { data, status } = await request(
      `/ops/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`,
      { token, allowError: true },
    );
    addReport('Tổng hợp timeline tra cứu hành trình', note('tracking-summary', `shipment=${shipmentCode}`), {
      shipmentCode,
      httpStatus: status,
      eventCount: Array.isArray(data) ? data.length : 0,
      latestEvent: Array.isArray(data) ? data[data.length - 1] : data,
    });
  }
}

function writeReportFile(payload) {
  const outputDir = path.join(process.cwd(), 'tmp');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `full-logistics-flow-e2e-${RUN_ID}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  return outputPath;
}

function printReport(payload, outputPath) {
  console.log('\n===== FULL LOGISTICS FLOW E2E REPORT =====');
  console.log(`Run: ${payload.runId}`);
  console.log(`Gateway: ${payload.gatewayUrl}`);
  console.log(`Shipments: ${payload.shipments.join(', ')}`);
  console.log(`Hubs: origin=${payload.hubs.origin}, sort=${payload.hubs.sort}, destination=${payload.hubs.destination}`);
  console.log(`Report file: ${outputPath}`);
  for (const [index, item] of report.entries()) {
    console.log(`\n[${String(index + 1).padStart(2, '0')}] ${item.step}`);
    console.log(`note: ${item.note}`);
    console.log(`evidence: ${JSON.stringify(item.evidence)}`);
  }
  console.log('\nPASS: Luồng E2E hoàn tất bằng API thật và đã ghi nhận ghi chú/ảnh trong dữ liệu trả về.');
}

async function main() {
  log('Đăng nhập các vai trò merchant/ops/courier.');
  const sessions = {
    admin: await login('/ops', accounts.admin, 'OPS'),
    merchant: await login('/merchant', accounts.merchant, 'MERCHANT'),
    opsOrigin: await login('/ops', accounts.opsOrigin, 'OPS'),
    opsSort: await login('/ops', accounts.opsSort, 'OPS'),
    opsDest: await login('/ops', accounts.opsDest, 'OPS'),
    courierPickup: await login('/courier', accounts.courierPickup, 'COURIER_APP'),
    courierDelivery: await login('/courier', accounts.courierDelivery, 'COURIER_APP'),
  };

  const hubs = {
    origin: firstHub(sessions.opsOrigin, {
      envName: 'E2E_ORIGIN_HUB',
      defaultValue: '003S001',
    }),
    sort: firstHub(sessions.opsSort, {
      envName: 'E2E_SORT_HUB',
      defaultValue: '002C001',
    }),
    destination: firstHub(sessions.opsDest, {
      envName: 'E2E_DEST_HUB',
      defaultValue: '001N001',
    }),
  };
  assert(hubs.origin !== hubs.sort, 'Origin hub và sort hub phải khác nhau.');
  assert(hubs.sort !== hubs.destination, 'Sort hub và destination hub phải khác nhau.');

  const tokens = {
    admin: sessions.admin.token,
    merchant: sessions.merchant.token,
    opsOrigin: sessions.opsOrigin.token,
    opsSort: sessions.opsSort.token,
    opsDest: sessions.opsDest.token,
    courierPickup: sessions.courierPickup.token,
    courierDelivery: sessions.courierDelivery.token,
  };

  const successCode = waybill(11);
  const issueCode = waybill(22);
  const shipmentCodes = [successCode, issueCode];

  log('Merchant tạo 2 vận đơn: 1 giao thành công, 1 khách không nhận.');
  await createShipment(tokens.merchant, successCode, hubs.origin, hubs.destination, 380000);
  await createShipment(tokens.merchant, issueCode, hubs.origin, hubs.destination, 240000);

  log('Hub gửi phân công courier lấy hàng và courier quét nhận hàng.');
  const pickup = await createAndAssignPickup(tokens, shipmentCodes, hubs.origin);
  await pickupScan(tokens, shipmentCodes, hubs.origin, pickup);

  log('Ops origin đóng bao, tạo chuyến xe, gửi hàng sang hub tổng.');
  await moveLeg({
    tokens,
    opsToken: tokens.opsOrigin,
    opsUsername: accounts.opsOrigin,
    receiveOpsToken: tokens.opsSort,
    receiveOpsUsername: accounts.opsSort,
    shipmentCodes,
    fromHub: hubs.origin,
    toHub: hubs.sort,
    legIndex: 1,
    legLabel: 'origin-to-sort',
    driverName: 'Tai xe E2E 01',
    vehiclePlate: '51E-12345',
  });

  addReport('Ops hub tổng phân tay đơn hàng', note('sort-split', `hub=${hubs.sort}|shipments=${shipmentCodes.join(',')}`), {
    hubCode: hubs.sort,
    shipmentCodes,
  });

  log('Hub tổng đóng bao và gửi hàng sang hub đích.');
  await moveLeg({
    tokens,
    opsToken: tokens.opsSort,
    opsUsername: accounts.opsSort,
    receiveOpsToken: tokens.opsDest,
    receiveOpsUsername: accounts.opsDest,
    shipmentCodes,
    fromHub: hubs.sort,
    toHub: hubs.destination,
    legIndex: 2,
    legLabel: 'sort-to-destination',
    driverName: 'Tai xe E2E 02',
    vehiclePlate: '43C-67890',
  });

  await verifyDestinationList(tokens.opsDest, shipmentCodes, hubs.destination);

  log('Hub đích điều phối phát hàng và courier xử lý 2 kết quả giao.');
  const successTask = await createAndAssignDelivery(tokens, successCode, hubs.destination);
  const issueTask = await createAndAssignDelivery(tokens, issueCode, hubs.destination);
  await deliverSuccess(tokens, successCode, successTask, hubs.destination);
  await reportIssueAndInventory(tokens, issueCode, issueTask, hubs.destination);

  await appendTrackingSummary(tokens.admin, shipmentCodes);

  const payload = {
    runId: RUN_ID,
    gatewayUrl:
      process.env.E2E_GATEWAY_URL ||
      process.env.GATEWAY_URL ||
      DEFAULT_GATEWAY_URL,
    accounts,
    hubs,
    shipments: shipmentCodes,
    proofs,
    report,
  };
  const outputPath = writeReportFile(payload);
  printReport(payload, outputPath);
}

main().catch((error) => {
  console.error('\nFAIL: full logistics flow E2E không hoàn tất.');
  console.error(error);
  process.exitCode = 1;
});
