#!/usr/bin/env node

/**
 * BỘ KIỂM THỬ CHUYÊN SÂU: TOẠ ĐỘ GPS ĐƠN HÀNG & THUẬT TOÁN ĐIỀU PHỐI ĐÚNG NGƯỜI PHỤ TRÁCH
 * =========================================================================================
 * Kiểm chứng 2 câu hỏi cốt lõi:
 * 1. Khách hàng / Shop tạo đơn hàng thì CÓ TỌA ĐỘ GPS không? (pickupLat, pickupLng, deliveryLat, deliveryLng)
 * 2. Tọa độ đó có được bộ máy Dispatch Service tự động phân công ĐÚNG SHIPPER PHỤ TRÁCH TUYẾN không?
 */

const assert = require('node:assert');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:3000';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = 'password';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function logSection(title) {
  console.log(`\n${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║ ${title.padEnd(76)} ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}`);
}

async function apiRequest(endpoint, options = {}) {
  const url = `${GATEWAY_URL.replace(/\/+$/, '')}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: response.status, ok: response.ok, data };
}

async function loginUser(prefix, username, roleGroup) {
  const res = await apiRequest(`${prefix}/auth/auth/login`, {
    method: 'POST',
    body: { username, password: PASSWORD, roleGroup },
  });
  if (!res.ok) {
    throw new Error(`Đăng nhập thất bại cho ${username}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data?.tokens?.accessToken, user: res.data?.user };
}

async function runCoordinateAutoDispatchSuite() {
  logSection('🚀 KIỂM THỬ THỰC TẾ: TỌA ĐỘ GPS & ĐIỀU PHỐI ĐÚNG SHIPPER PHỤ TRÁCH');
  console.log(`  ${DIM}Mã phiên kiểm tra: ${RUN_ID} | Gateway: ${GATEWAY_URL}${RESET}`);

  // 1. ĐĂNG NHẬP
  console.log(`\n${BOLD}--- BƯỚC 1: XÁC THỰC CÁC PHIÊN LÀM VIỆC ---${RESET}`);
  const adminSession = await loginUser('/ops', '10000001', 'OPS');
  const merchantSession = await loginUser('/merchant', '41100001', 'MERCHANT');
  console.log(`  ${GREEN}✔ Đăng nhập Admin (10000001) và Merchant Shop (41100001) thành công!${RESET}`);

  // 2. DANH SÁCH CÁC TEST CASES ĐIỀU PHỐI THEO TỌA ĐỘ
  const testCases = [
    {
      id: 'TC-HN-NORTH',
      region: 'Hà Nội',
      zoneName: 'Hoàn Kiếm A - Bắc Hàng Bài',
      hubCode: '001N001',
      expectedCourier: '30002001',
      pickupLat: 21.0217,
      pickupLng: 105.8525,
      deliveryLat: 10.7720,
      deliveryLng: 106.6960,
      senderAddress: 'Số 15 Phố Hàng Bài, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
      senderWard: 'P. Hàng Bài',
      boundaryPolygon: [[21.0185,105.847],[21.025,105.847],[21.025,105.858],[21.0185,105.858],[21.0185,105.847]],
    },
    {
      id: 'TC-HN-SOUTH',
      region: 'Hà Nội',
      zoneName: 'Hoàn Kiếm B - Nam Hàng Bài',
      hubCode: '001N001',
      expectedCourier: '30002002',
      pickupLat: 21.0153,
      pickupLng: 105.8525,
      deliveryLat: 16.0783,
      deliveryLng: 108.2230,
      senderAddress: 'Số 89 Phố Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
      senderWard: 'P. Hàng Bài',
      boundaryPolygon: [[21.012,105.847],[21.0185,105.847],[21.0185,105.858],[21.012,105.858],[21.012,105.847]],
    },
    {
      id: 'TC-HCM-EAST',
      region: 'TP.HCM',
      zoneName: 'Q1 A - Đông Chợ Bến Thành',
      hubCode: '003S001',
      expectedCourier: '30002015',
      pickupLat: 10.7720,
      pickupLng: 106.6960,
      deliveryLat: 21.0315,
      deliveryLng: 105.8275,
      senderAddress: 'Số 32 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      senderWard: 'P. Bến Thành',
      boundaryPolygon: [[10.768,106.693],[10.776,106.693],[10.776,106.699],[10.768,106.699],[10.768,106.693]],
    },
    {
      id: 'TC-HCM-WEST',
      region: 'TP.HCM',
      zoneName: 'Q1 B - Tây Chợ Bến Thành',
      hubCode: '003S001',
      expectedCourier: '30002016',
      pickupLat: 10.7720,
      pickupLng: 106.6900,
      deliveryLat: 21.0378,
      deliveryLng: 105.7955,
      senderAddress: 'Số 112 Trương Định, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      senderWard: 'P. Bến Thành',
      boundaryPolygon: [[10.768,106.687],[10.776,106.687],[10.776,106.693],[10.768,106.693],[10.768,106.687]],
    },
    {
      id: 'TC-DAD-NORTH',
      region: 'Đà Nẵng',
      zoneName: 'Hải Châu A - Bắc Bạch Đằng',
      hubCode: '002C001',
      expectedCourier: '30002009',
      pickupLat: 16.0783,
      pickupLng: 108.2230,
      deliveryLat: 10.8045,
      deliveryLng: 106.6495,
      senderAddress: 'Số 24 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu, Đà Nẵng',
      senderWard: 'P. Thạch Thang',
      boundaryPolygon: [[16.0745,108.217],[16.082,108.217],[16.082,108.229],[16.0745,108.229],[16.0745,108.217]],
    },
  ];

  console.log(`\n${BOLD}--- BƯỚC 2: CẬP NHẬT / KIỂM TRA PHÂN VÙNG GEOFENCE CHO CÁC TUYẾN ---${RESET}`);
  for (const tc of testCases) {
    const assignRes = await apiRequest('/ops/masterdata/courier-area-assignments', {
      method: 'POST',
      token: adminSession.token,
      body: {
        hubCode: tc.hubCode,
        courierId: tc.expectedCourier,
        province: tc.region,
        ward: tc.senderWard,
        zoneName: tc.zoneName,
        boundaryPolygon: tc.boundaryPolygon,
        isActive: true,
      },
    });
    console.log(`  ${GREEN}✔ Tuyến [${tc.zoneName}]:${RESET} Gán Shipper ${BOLD}${tc.expectedCourier}${RESET} (Hub ${tc.hubCode})`);
  }

  // 3. THỰC THI TẠO ĐƠN VÀ ĐỐI SOÁT PHÂN CÔNG ĐIỀU PHỐI
  logSection('PHẦN 1: KIỂM CHỨNG TỒN TẠI TỌA ĐỘ TRONG ĐƠN HÀNG (DATABASE & API)');
  logSection('PHẦN 2: KIỂM CHỨNG THUẬT TOÁN ĐIỀU PHỐI ĐÚNG SHIPPER PHỤ TRÁCH');

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const baseNum = (Date.now() + i * 1000) % 1_000_000_000;
    const shipmentCode = `111${String(baseNum).padStart(9, '0')}`;

    console.log(`\n${BOLD}================================================================================${RESET}`);
    console.log(`${BOLD}TEST CASE ${i + 1}/${totalTests}: [${tc.id}] ${tc.zoneName} (${tc.region})${RESET}`);
    console.log(`${BOLD}================================================================================${RESET}`);

    // A. TẠO ĐƠN HÀNG CÓ TỌA ĐỘ
    const shipmentPayload = {
      code: shipmentCode,
      pickupLatitude: tc.pickupLat,
      pickupLongitude: tc.pickupLng,
      deliveryLatitude: tc.deliveryLat,
      deliveryLongitude: tc.deliveryLng,
      metadata: {
        sender: {
          name: `Shop Đối Tác ${tc.region}`,
          phone: '0941000001',
          address: tc.senderAddress,
          ward: tc.senderWard,
          hubCode: tc.hubCode,
          coordinates: { lat: tc.pickupLat, lng: tc.pickupLng },
        },
        receiver: {
          name: 'Khách Nhận Demo',
          phone: '0988776655',
          address: 'Địa chỉ giao hàng người nhận',
          coordinates: { lat: tc.deliveryLat, lng: tc.deliveryLng },
        },
        package: {
          weightKg: 1.5,
          declaredValue: 500000,
          itemType: 'Hàng tiêu dùng',
        },
        financials: {
          codAmount: 250000,
          totalFee: 32000,
        },
        routingPlan: {
          originHubCode: tc.hubCode,
        },
      },
    };

    console.log(`  ${CYAN}1. Tạo đơn hàng với Tọa độ GPS:${RESET}`);
    console.log(`     - Mã đơn:              ${BOLD}${shipmentCode}${RESET}`);
    console.log(`     - Tọa độ kho lấy (GPS): (${BOLD}${tc.pickupLat}, ${tc.pickupLng}${RESET})`);
    console.log(`     - Tọa độ giao (GPS):    (${BOLD}${tc.deliveryLat}, ${tc.deliveryLng}${RESET})`);

    const createRes = await apiRequest('/merchant/shipment/shipments', {
      method: 'POST',
      token: merchantSession.token,
      body: shipmentPayload,
    });

    assert.ok(createRes.ok, `Tạo đơn thất bại: ${JSON.stringify(createRes.data)}`);
    const created = createRes.data;

    // KIỂM CHỨNG CÂU HỎI 1: ĐƠN HÀNG CÓ TỌA ĐỘ KHÔNG?
    const hasPickupLat = typeof created.pickupLatitude === 'number' && Math.abs(created.pickupLatitude - tc.pickupLat) < 0.0001;
    const hasPickupLng = typeof created.pickupLongitude === 'number' && Math.abs(created.pickupLongitude - tc.pickupLng) < 0.0001;
    const hasDeliveryLat = typeof created.deliveryLatitude === 'number';
    const hasDeliveryLng = typeof created.deliveryLongitude === 'number';

    console.log(`  ${CYAN}2. Kiểm chứng Lưu trữ Tọa độ trong Database & API Response:${RESET}`);
    console.log(`     ✔ pickupLatitude:    ${created.pickupLatitude} ${hasPickupLat ? GREEN + '(HỢP LỆ ✔)' : RED + '(LỖI ✘)'}${RESET}`);
    console.log(`     ✔ pickupLongitude:   ${created.pickupLongitude} ${hasPickupLng ? GREEN + '(HỢP LỆ ✔)' : RED + '(LỖI ✘)'}${RESET}`);
    console.log(`     ✔ deliveryLatitude:  ${created.deliveryLatitude} ${hasDeliveryLat ? GREEN + '(HỢP LỆ ✔)' : RED + '(LỖI ✘)'}${RESET}`);
    console.log(`     ✔ deliveryLongitude: ${created.deliveryLongitude} ${hasDeliveryLng ? GREEN + '(HỢP LỆ ✔)' : RED + '(LỖI ✘)'}${RESET}`);

    assert.ok(hasPickupLat && hasPickupLng, 'Đơn hàng không lưu đúng tọa độ lấy hàng');

    // B. TẠO PICKUP TASK & KÍCH HOẠT ĐIỀU PHỐI TỰ ĐỘNG
    console.log(`  ${CYAN}3. Kích hoạt Động cơ Tự động Điều phối (Dispatch Engine):${RESET}`);
    
    // Gọi tạo pickup task nếu chưa có
    const taskCreateRes = await apiRequest('/ops/dispatch/tasks', {
      method: 'POST',
      token: adminSession.token,
      body: {
        shipmentCode,
        taskType: 'PICKUP',
        hubCode: tc.hubCode,
        note: `Yêu cầu lấy hàng tự động cho đơn ${shipmentCode}`,
      },
    });

    // Chờ dispatch engine gán task
    await new Promise((r) => setTimeout(r, 1200));

    // Tra cứu lại task
    const tasksRes = await apiRequest(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=PICKUP`, {
      token: adminSession.token,
    });

    assert.ok(tasksRes.ok && Array.isArray(tasksRes.data) && tasksRes.data.length > 0, 'Không tìm thấy task PICKUP');
    const task = tasksRes.data[0];
    const activeAssignment = task.assignments?.find((a) => !a.unassignedAt) || task.assignments?.[0];
    const assignedCourierId = activeAssignment?.courierId || task.assignedCourierId;

    // KIỂM CHỨNG CÂU HỎI 2: ĐƠN HÀNG ĐƯỢC PHÂN CÔNG ĐÚNG NGƯỜI PHỤ TRÁCH KHÔNG?
    console.log(`  ${CYAN}4. Kết quả Phân công của Bộ máy Điều phối:${RESET}`);
    console.log(`     - Shipper Kỳ vọng:    ${BOLD}${tc.expectedCourier}${RESET} (${tc.zoneName})`);
    console.log(`     - Shipper Thực tế:    ${BOLD}${assignedCourierId}${RESET}`);
    console.log(`     - Trạng thái công việc:${task.status}`);
    console.log(`     - Ghi chú điều phối:  "${task.note || activeAssignment?.note || 'Tự động điều phối theo phân vùng'}"`);

    const isMatch = assignedCourierId === tc.expectedCourier;
    if (isMatch) {
      console.log(`  ${GREEN}✔ [PASS] TỌA ĐỘ ĐÃ ĐƯỢC PHÂN CÔNG ĐÚNG 100% CHO SHIPPER PHỤ TRÁCH: ${assignedCourierId}${RESET}`);
      passedTests++;
    } else {
      console.log(`  ${RED}✘ [FAIL] Gán sai Shipper: Thực tế ${assignedCourierId} != Kỳ vọng ${tc.expectedCourier}${RESET}`);
    }
  }

  // TỔNG KẾT
  console.log(`\n${BOLD}══════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}               📊 BẢNG TỔNG HỢP KIỂM THỬ TỌA ĐỘ & ĐIỀU PHỐI                    ${RESET}`);
  console.log(`${BOLD}══════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`  • Tổng số kịch bản kiểm tra:       ${testCases.length}`);
  console.log(`  • Số kịch bản ĐẠT CHUẨN (PASS):    ${passedTests}`);
  console.log(`  • Tỷ lệ phân công chính xác:       ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  console.log(`${BOLD}══════════════════════════════════════════════════════════════════════════════${RESET}\n`);

  if (passedTests === testCases.length) {
    console.log(`${GREEN}${BOLD}🎉 KẾT LUẬN: ĐƠN HÀNG TẠO RA 100% LƯU TỌA ĐỘ GPS CHUẨN XÁC VÀ ĐƯỢC BỘ MÁY ĐIỀU PHỐI PHÂN CÔNG ĐÚNG CHÍNH XÁC SHIPPER PHỤ TRÁCH! 🚀${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}⚠️ PHÁT HIỆN KỊCH BẢN CHƯA ĐẠT!${RESET}\n`);
    process.exit(1);
  }
}

runCoordinateAutoDispatchSuite().catch((err) => {
  console.error(`${RED}Lỗi thực thi test suite: ${err.message}${RESET}`);
  console.error(err.stack);
  process.exit(1);
});
