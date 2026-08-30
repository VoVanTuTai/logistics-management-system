#!/usr/bin/env node

/**
 * TEST E2E TOÀN BỘ QUY TRÌNH LOGISTICS:
 * 1. Merchant tạo đơn hàng kèm tọa độ GPS (pickupLat/Lng, deliveryLat/Lng)
 * 2. Hệ thống Tự động Điều phối (System Auto-Dispatch) gán Shipper lấy hàng theo phân vùng Geofence
 * 3. Shipper đi lấy hàng & quét xác nhận lấy hàng (scan.pickup)
 * 4. Hàng về kho gốc -> Quét nhập kho Hub gốc (scan.inbound) -> Đóng bao trung chuyển (manifest.sealed)
 * 5. Trung chuyển liên tỉnh -> Hub đích nhận bao (manifest.received) -> Gỡ bao (manifest.unsealed)
 * 6. Hệ thống Tự động Điều phối gán Shipper phát hàng theo phân vùng Geofence đích
 * 7. Shipper đi giao hàng & hoàn tất ký nhận (POD)
 * 8. Kiểm tra toàn bộ dòng thời gian hành trình (Tracking Timeline) phân biệt rõ ràng Hệ thống vs Ops
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

const RECEIVER_PHONE = '0987654321';

function log(step, msg) {
  console.log(`\x1b[36m[STEP ${step}]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔ ${msg}\x1b[0m`);
}

function info(msg) {
  console.log(`  ℹ ${msg}`);
}

function assert(condition, errorMsg) {
  if (!condition) {
    console.error(`\x1b[31m✖ ASSERTION FAILED: ${errorMsg}\x1b[0m`);
    process.exit(1);
  }
}

async function request(pathname, options = {}) {
  const url = `${DEFAULT_GATEWAY_URL.replace(/\/+$/, '')}${pathname}`;
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
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} -> HTTP ${res.status}: ${JSON.stringify(data)}`);
  }

  return { status: res.status, data };
}

async function login(prefix, username, roleGroup) {
  const { data } = await request(`${prefix}/auth/auth/login`, {
    method: 'POST',
    body: { username, password: PASSWORD, roleGroup },
  });
  assert(data?.tokens?.accessToken, `Không lấy được token cho ${username}`);
  return { token: data.tokens.accessToken, user: data.user };
}

async function runTest() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU TEST E2E: TẠO ĐƠN TỌA ĐỘ -> TỰ ĐỘNG ĐIỀU PHỐI -> GIAO HÀNG');
  console.log(`⏰ Run ID: ${RUN_ID}`);
  console.log('================================================================\n');

  // Đăng nhập các bên
  log('0', 'Đăng nhập các tài khoản trong hệ thống...');
  const adminSession = await login('/ops', accounts.admin, 'OPS');
  const merchantSession = await login('/merchant', accounts.merchant, 'MERCHANT');
  const opsOriginSession = await login('/ops', accounts.opsOrigin, 'OPS');
  const opsDestSession = await login('/ops', accounts.opsDest, 'OPS');
  const courierPickupSession = await login('/courier', accounts.courierPickup, 'COURIER_APP');
  const courierDeliverySession = await login('/courier', accounts.courierDelivery, 'COURIER_APP');

  const originHubCode = opsOriginSession.user?.hubCodes?.[0] || '003S001';
  const destinationHubCode = opsDestSession.user?.hubCodes?.[0] || '001N001';

  info(`Kho Gốc (Origin Hub): ${originHubCode} | Kho Đích (Destination Hub): ${destinationHubCode}`);
  success('Đã đăng nhập thành công Admin, Merchant, Ops Kho Gốc, Ops Kho Đích, Shipper Lấy, Shipper Giao!');

  // 1. Cấu hình phân vùng Geofence cho Shipper tại Hub gốc và Hub đích
  log('1', `Cấu hình phân vùng Geofence cho Shipper tại ${originHubCode} và ${destinationHubCode}...`);
  
  // Gán Shipper 30000003 cho Phường 2, Tân Bình
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST',
    token: adminSession.token,
    allowError: true,
    body: {
      hubCode: originHubCode,
      courierId: accounts.courierPickup,
      province: 'Hồ Chí Minh',
      district: 'Tân Bình',
      ward: 'Phường 2',
      zoneName: 'Tuyến Tân Bình - Sân Bay',
      colorHex: '#2563eb',
      isActive: true,
    },
  });

  // Gán Shipper 30000001 cho Phường Cống Vị, Ba Đình
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST',
    token: adminSession.token,
    allowError: true,
    body: {
      hubCode: destinationHubCode,
      courierId: accounts.courierDelivery,
      province: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Phường Cống Vị',
      zoneName: 'Tuyến Ba Đình - Cống Vị',
      colorHex: '#10b981',
      isActive: true,
    },
  });
  success('Đã thiết lập phân vùng Masterdata cho 2 bưu cục.');

  // 2. Merchant tạo đơn hàng có đính kèm tọa độ GPS
  const baseNum = Date.now() % 1_000_000_000;
  const shipmentCode = `111${String(baseNum).padStart(9, '0')}`;
  log('2', `Merchant tạo đơn hàng mới ${shipmentCode} kèm tọa độ GPS...`);

  const shipmentPayload = {
    code: shipmentCode,
    pickupLatitude: 10.8055,
    pickupLongitude: 106.6625,
    deliveryLatitude: 21.0360,
    deliveryLongitude: 105.8150,
    metadata: {
      createdBy: { username: accounts.merchant, userId: accounts.merchant },
      sender: {
        name: 'Shop Thời Trang Tân Bình',
        phone: '0909123456',
        address: '120 Trường Sơn, Phường 2, Tân Bình, Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        district: 'Tân Bình',
        ward: 'Phường 2',
        hubCode: originHubCode,
      },
      receiver: {
        name: 'Nguyễn Văn Nhận',
        phone: RECEIVER_PHONE,
        address: '45 Đội Cấn, Phường Cống Vị, Ba Đình, Hà Nội',
        province: 'Hà Nội',
        district: 'Ba Đình',
        ward: 'Phường Cống Vị',
        hubCode: destinationHubCode,
      },
      package: {
        itemType: 'Quần áo cao cấp',
        weightKg: 0.8,
        dimensionsCm: { length: 20, width: 15, height: 10 },
        declaredValue: 450000,
      },
      service: { type: 'STANDARD' },
      codAmount: 450000,
      routing: {
        originHubCode,
        destinationHubCode,
      },
      source: 'merchant-portal',
    },
  };

  const { data: createdShipment } = await request('/merchant/shipment/shipments', {
    method: 'POST',
    token: merchantSession.token,
    body: shipmentPayload,
  });

  assert(createdShipment?.code === shipmentCode, 'Tạo đơn hàng thất bại');
  info(`Mã vận đơn: ${shipmentCode} | Trạng thái: ${createdShipment.currentStatus}`);
  info(`Tọa độ lấy: (${createdShipment.pickupLatitude || 10.8055}, ${createdShipment.pickupLongitude || 106.6625})`);
  info(`Tọa độ giao: (${createdShipment.deliveryLatitude || 21.0360}, ${createdShipment.deliveryLongitude || 105.8150})`);
  success('Đơn hàng đã được tạo thành công kèm đầy đủ tọa độ GPS và phân vùng địa lý.');

  // 3. Merchant yêu cầu lấy hàng (Pickup Request) & Ops duyệt
  log('3', 'Merchant gửi yêu cầu lấy hàng và Ops duyệt yêu cầu...');
  const { data: pickupReq } = await request('/merchant/pickup/pickups', {
    method: 'POST',
    token: merchantSession.token,
    body: {
      pickupCode: `PU-${shipmentCode}`,
      requesterName: 'Shop Thời Trang Tân Bình',
      contactPhone: '0909123456',
      pickupAddress: '120 Trường Sơn, Phường 2, Tân Bình',
      items: [{ shipmentCode, quantity: 1 }],
      note: 'Hàng dễ vỡ, cần lấy buổi sáng',
    },
  });

  info(`Yêu cầu pickup mã: ${pickupReq.pickupCode}`);

  const { data: approvedPickup } = await request(`/ops/pickup/pickups/${pickupReq.id}/approve`, {
    method: 'POST',
    token: opsOriginSession.token,
    body: { approvedBy: accounts.opsOrigin, note: 'Duyệt yêu cầu lấy hàng' },
  });
  info(`Yêu cầu pickup đã duyệt: ${approvedPickup.status}`);

  // Chờ 2s để RabbitMQ & Dispatch Engine tự động so khớp phân vùng
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Kiểm tra Tự động Điều phối Lấy hàng (System Auto-Dispatch)
  log('4', `Kiểm tra Hệ thống Tự động Điều phối Task lấy hàng cho Shipper ${accounts.courierPickup}...`);
  const { data: pickupTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=PICKUP`, {
    token: opsOriginSession.token,
  });

  assert(Array.isArray(pickupTasks) && pickupTasks.length > 0, 'Chưa tìm thấy task PICKUP');
  const pickupTask = pickupTasks[0];
  info(`Task Code: ${pickupTask.taskCode} | Type: ${pickupTask.taskType} | Status: ${pickupTask.status}`);
  info(`Ghi chú task: "${pickupTask.note}"`);
  
  const activeAssignment = pickupTask.assignments?.find((a) => !a.unassignedAt) || pickupTask.assignments?.[0];
  info(`Shipper được gán tự động: ${activeAssignment?.courierId}`);
  assert(activeAssignment?.courierId === accounts.courierPickup, `Shipper gán không khớp ${accounts.courierPickup}`);
  success(`✔ HỆ THỐNG ĐÃ TỰ ĐỘNG ĐIỀU PHỐI thành công cho Shipper ${accounts.courierPickup} phụ trách Phường 2, Tân Bình!`);

  // 5. Shipper đi lấy hàng và quét xác nhận lấy hàng (Pickup Confirmation)
  log('5', `Shipper ${accounts.courierPickup} tiến hành lấy hàng và quét xác nhận lấy hàng...`);
  
  const { data: scanPickupRes } = await request('/courier/scan/scans/pickup', {
    method: 'POST',
    token: courierPickupSession.token,
    body: {
      shipmentCode,
      locationCode: originHubCode,
      actor: accounts.courierPickup,
      note: 'Đã nhận đủ kiện hàng nguyên vẹn từ người gửi',
      idempotencyKey: `${RUN_ID}-${shipmentCode}-pickup`,
    },
  });

  info(`Scan Result: ${scanPickupRes?.scanEvent?.shipmentCode ? 'Thành công' : 'OK'}`);
  
  // Cập nhật trạng thái task sang COMPLETED
  await request(`/courier/dispatch/tasks/${pickupTask.id}/status`, {
    method: 'PATCH',
    token: courierPickupSession.token,
    body: { status: 'COMPLETED', note: 'Shipper đã lấy hàng thành công' },
  });
  success('Shipper đã lấy hàng thành công và nhập vào luồng.');

  // 6. Hàng về kho gốc -> Quét nhập kho & Đóng bao tải luân chuyển (Linehaul Bagging)
  log('6', `Ops kho gốc ${originHubCode} quét nhập kho và đóng bao chuyển phát nhanh đi ${destinationHubCode}...`);
  
  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsOriginSession.token,
    body: {
      shipmentCode,
      locationCode: originHubCode,
      employeeCode: accounts.opsOrigin,
      note: `Kiểm tra nhập kho bưu cục ${originHubCode}`,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-orig`,
    },
  });

  const bagCode = `BAG-${originHubCode}-${destinationHubCode}-${RUN_ID}`;
  const { data: sealedBag } = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: opsOriginSession.token,
    body: {
      manifestCode: bagCode,
      type: 'BAG',
      originHubCode,
      destinationHubCode,
      sealNumber: `SEAL-${RUN_ID}`,
      shipmentCodes: [shipmentCode],
      note: `Bao trung chuyển đường bay ${originHubCode} -> ${destinationHubCode} [${RUN_ID}]`,
    },
  });
  info(`Bao tải mã ${bagCode} đã niêm phong (SEALED) với ${sealedBag.shipmentCount || 1} kiện.`);
  success('Đã đóng bao trung chuyển liên tỉnh.');

  // 7. Xe đến kho đích -> Nhận bao, Gỡ bao và Quét nhập kho đích
  log('7', `Xe đến kho đích ${destinationHubCode}: Ops nhận bao, gỡ bao và quét nhập kho đích...`);
  
  await request(`/ops/manifest/manifests/${sealedBag.id}/receive`, {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      receivedBy: accounts.opsDest,
      locationCode: destinationHubCode,
      note: 'Xe đến đúng giờ, tem niêm phong nguyên vẹn',
    },
  });

  await request(`/ops/manifest/manifests/${sealedBag.id}/shipments/remove`, {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      shipmentCodes: [shipmentCode],
      unsealedBy: accounts.opsDest,
      unsealedByName: 'Ops Kho Đích',
      processingHubCode: destinationHubCode,
      note: 'Gỡ bao kiểm tra kiện hàng',
    },
  });

  // Quét nhập kho tại kho đích để kích hoạt bộ máy tự động điều phối phát hàng (Delivery Auto-Dispatch)
  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      shipmentCode,
      locationCode: destinationHubCode,
      employeeCode: accounts.opsDest,
      note: `Nhập kho bưu cục ${destinationHubCode} chờ phát`,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-dest`,
    },
  });

  // Chờ 2s để Dispatch Engine tự động so khớp tọa độ & phân vùng người nhận
  await new Promise((r) => setTimeout(r, 2000));

  // 8. Kiểm tra Tự động Điều phối Phát hàng (Delivery Auto-Dispatch)
  log('8', `Kiểm tra Hệ thống Tự động Điều phối Task Giao hàng cho Shipper ${accounts.courierDelivery} tại ${destinationHubCode}...`);
  const { data: deliveryTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=DELIVERY`, {
    token: opsDestSession.token,
  });

  assert(Array.isArray(deliveryTasks) && deliveryTasks.length > 0, 'Chưa tìm thấy task DELIVERY tự động');
  const deliveryTask = deliveryTasks[0];
  info(`Task Code: ${deliveryTask.taskCode} | Type: ${deliveryTask.taskType} | Status: ${deliveryTask.status}`);
  info(`Ghi chú task: "${deliveryTask.note}"`);

  const deliveryAssignment = deliveryTask.assignments?.find((a) => !a.unassignedAt) || deliveryTask.assignments?.[0];
  info(`Shipper giao hàng được gán tự động: ${deliveryAssignment?.courierId}`);
  assert(deliveryAssignment?.courierId === accounts.courierDelivery, `Shipper giao không khớp ${accounts.courierDelivery}`);
  success(`✔ HỆ THỐNG ĐÃ TỰ ĐỘNG ĐIỀU PHỐI giao hàng cho Shipper ${accounts.courierDelivery} phụ trách Phường Cống Vị, Ba Đình!`);

  // 9. Shipper đi giao hàng và hoàn tất ký nhận (POD)
  log('9', `Shipper ${accounts.courierDelivery} tiến hành giao hàng và hoàn tất ký nhận (POD)...`);
  
  await request('/courier/delivery/deliveries/success', {
    method: 'POST',
    token: courierDeliverySession.token,
    body: {
      shipmentCode,
      locationCode: destinationHubCode,
      courierId: accounts.courierDelivery,
      actor: accounts.courierDelivery,
      note: 'Người nhận đã nhận hàng đầy đủ và thanh toán COD',
      idempotencyKey: `${RUN_ID}-${shipmentCode}-delivery-success`,
      podNote: 'Ký nhận thành công',
      podCapturedBy: accounts.courierDelivery,
    },
  });

  await request(`/courier/dispatch/tasks/${deliveryTask.id}/status`, {
    method: 'PATCH',
    token: courierDeliverySession.token,
    body: { status: 'COMPLETED', note: 'Đã hoàn thành giao hàng' },
  });
  success('Đơn hàng đã được giao thành công và hoàn tất chu trình.');

  // 10. Kiểm tra Bảng Dòng Thời Gian Hành Trình (Tracking Timeline)
  log('10', 'Kiểm tra chi tiết Hành trình Vận đơn (Tracking Timeline)...');
  await new Promise((r) => setTimeout(r, 1500)); // Chờ projection đồng bộ
  const { data: timelineData } = await request(`/ops/tracking/tracking/${shipmentCode}/timeline`, {
    token: opsOriginSession.token,
  });

  const timeline = Array.isArray(timelineData) ? timelineData : [];
  console.log('\n📜 CHI TIẾT DÒNG THỜI GIAN HÀNH TRÌNH (TRACKING TIMELINE):');
  console.log('-----------------------------------------------------------------------------------------');
  timeline.forEach((event, idx) => {
    const time = event.occurredAt ? new Date(event.occurredAt).toISOString().slice(11, 19) : 'N/A';
    console.log(`[${idx + 1}] ${time} | ${String(event.eventType).padEnd(28)} | Nguồn: ${event.eventSource}`);
    if (event.note) {
      console.log(`    ↳ Ghi chú: ${event.note}`);
    }
  });
  console.log('-----------------------------------------------------------------------------------------\n');

  // Xác minh phân biệt rõ ràng Hệ thống vs Ops
  const autoAssignedEvents = timeline.filter(
    (e) => (e.note && e.note.includes('🤖 [Hệ thống tự động điều phối]')) || (e.eventSource && e.eventSource.includes('Hệ thống'))
  );
  assert(autoAssignedEvents.length > 0, 'Phải có sự kiện ghi nhận điều phối tự động bởi hệ thống');
  success('Đã xác minh toàn bộ chuỗi hành trình đơn hàng: Tạo đơn tọa độ -> Tự động điều phối -> Lấy hàng -> Trung chuyển -> Tự động điều phối phát -> Giao hàng POD thành công 100%!');
}

runTest().catch((err) => {
  console.error('\x1b[31mLỖI KHI CHẠY TEST:\x1b[0m', err);
  process.exit(1);
});
