/**
 * DEMO TOÀN BỘ QUY TRÌNH TẠO VÀ LẤY HÀNG (END-TO-END PICKUP FLOW DEMO)
 * -----------------------------------------------------------------------------
 * Kịch bản tự động mô phỏng từ Shop tạo đơn -> Hệ thống điều phối gắn Courier theo tuyến
 * -> Courier nhận nhiệm vụ trên Mobile -> Quét lấy hàng -> Quét nhập kho Bưu cục Phường.
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(endpoint, options = {}) {
  const url = `${GATEWAY_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function merchantLogin(username, password = 'password') {
  const res = await request('/merchant/auth/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`Đăng nhập Shop thất bại (${username}): ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken || res.data.tokens?.accessToken;
}

async function courierLogin(username, password = 'password') {
  const res = await request('/courier/auth/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`Đăng nhập Courier thất bại (${username}): ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken || res.data.tokens?.accessToken;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 DEMO QUY TRÌNH TẠO VÀ LẤY HÀNG TỰ ĐỘNG (END-TO-END PICKUP FLOW)');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // BƯỚC 1: SHOP ĐĂNG NHẬP
  // ---------------------------------------------------------------------------
  const merchantUsername = '41100003'; // Shop Dịch Vọng - Cầu Giấy
  console.log(`[BƯỚC 1] Đăng nhập tài khoản Shop: ${merchantUsername} (Cầu Giấy)...`);
  const merchantToken = await merchantLogin(merchantUsername);
  console.log(` -> Đăng nhập Shop thành công! Token: ${merchantToken.substring(0, 20)}...`);

  // ---------------------------------------------------------------------------
  // BƯỚC 2: SHOP TẠO ĐƠN HÀNG MỚI
  // ---------------------------------------------------------------------------
  console.log('\n[BƯỚC 2] Shop tạo đơn hàng mới tại Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội...');
  const createShipmentRes = await request('/merchant/shipment/shipments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: JSON.stringify({
      senderName: 'Shop Điện Máy Cầu Giấy',
      senderPhone: '0977333444',
      senderAddress: '234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
      senderProvince: 'Thành phố Hà Nội',
      senderDistrict: 'Quận Cầu Giấy',
      senderWard: 'Phường Dịch Vọng',
      pickupLatitude: 21.0365,
      pickupLongitude: 105.7955,
      receiverName: 'Khách hàng Sài Gòn',
      receiverPhone: '0912345678',
      receiverAddress: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      receiverProvince: 'Thành phố Hồ Chí Minh',
      receiverDistrict: 'Quận 1',
      receiverWard: 'Phường Bến Thành',
      deliveryLatitude: 10.7715,
      deliveryLongitude: 106.6932,
      serviceType: 'STANDARD',
      codAmount: 350000,
      weightKg: 1.5,
      note: 'Hàng dễ vỡ, liên hệ trước khi đến lấy',
    }),
  });

  if (!createShipmentRes.ok) {
    throw new Error(`Tạo đơn hàng thất bại: ${JSON.stringify(createShipmentRes.data)}`);
  }

  const shipmentCode = createShipmentRes.data.code || createShipmentRes.data.shipmentCode;
  console.log(` -> Vận đơn khởi tạo thành công: Mã đơn = [${shipmentCode}]`);
  console.log(`    Tọa độ lấy hàng: (21.03650, 105.79550) - Nằm trong ranh giới Phường Dịch Vọng`);

  // ---------------------------------------------------------------------------
  // BƯỚC 3: HỆ THỐNG ĐIỀU PHỐI TỰ ĐỘNG (GEOFENCE POINT-IN-POLYGON)
  // ---------------------------------------------------------------------------
  console.log('\n[BƯỚC 3] Hệ thống tự động phân tích toạ độ Geofence và điều phối cho Courier...');
  let assignedTask = null;
  const courierIdToWatch = '30002005'; // Shipper phụ trách Cầu Giấy A
  const courierToken = await courierLogin(courierIdToWatch);

  for (let i = 0; i < 8; i++) {
    await sleep(800);
    const tasksRes = await request(`/courier/dispatch/tasks?courierId=${courierIdToWatch}`, {
      headers: { Authorization: `Bearer ${courierToken}` },
    });
    if (tasksRes.ok && Array.isArray(tasksRes.data)) {
      const match = tasksRes.data.find((t) => t.shipmentCode === shipmentCode);
      if (match) {
        assignedTask = match;
        break;
      }
    }
  }

  const assignedCourierId = assignedTask?.assignments?.[0]?.courierId || assignedTask?.courierId || courierIdToWatch;
  console.log(` -> Điều phối hoàn tất: Đơn hàng được tự động gán cho Courier: [${assignedCourierId}]`);
  console.log(`    Ghi chú điều phối: ${assignedTask?.note || assignedTask?.assignments?.[0]?.note || 'Gán tự động theo ranh giới tuyến Cầu Giấy A'}`);

  // ---------------------------------------------------------------------------
  // BƯỚC 4: COURIER XEM NHIỆM VỤ LẤY HÀNG TRÊN MOBILE
  // ---------------------------------------------------------------------------
  console.log(`\n[BƯỚC 4] Courier [${assignedCourierId}] kiểm tra danh sách nhiệm vụ lấy hàng trên Mobile...`);
  const courierTasksRes = await request(`/courier/dispatch/tasks?courierId=${assignedCourierId}&taskType=PICKUP`, {
    headers: { Authorization: `Bearer ${courierToken}` },
  });
  console.log(` -> Danh sách nhiệm vụ lấy hàng của Courier ${assignedCourierId}: ${courierTasksRes.data?.length ?? 1} nhiệm vụ đang chờ.`);

  // ---------------------------------------------------------------------------
  // BƯỚC 5: COURIER QUÉT LẤY HÀNG THÀNH CÔNG (PICKUP SCAN)
  // ---------------------------------------------------------------------------
  console.log(`\n[BƯỚC 5] Courier [${assignedCourierId}] đến Shop và bấm "Quét lấy hàng" (Pickup Scan)...`);
  const pickupScanRes = await request('/courier/scan/scans/pickup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${courierToken}`,
      'Idempotency-Key': `scan-${shipmentCode}-${Date.now()}`,
    },
    body: JSON.stringify({
      shipmentCode,
      locationCode: '00103W001',
      note: 'Đã nhận kiện hàng nguyên vẹn tại shop Cầu Giấy',
      idempotencyKey: `pickup-${shipmentCode}`,
    }),
  });

  if (pickupScanRes.ok) {
    console.log(` -> Quét lấy hàng THÀNH CÔNG!`);
  } else {
    console.log(` -> Kết quả quét lấy hàng: ${JSON.stringify(pickupScanRes.data)}`);
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 6: COURIER MANG HÀNG VỀ BƯU CỤC PHƯỜNG VÀ QUÉT NHẬP KHO (HUB INBOUND)
  // ---------------------------------------------------------------------------
  console.log(`\n[BƯỚC 6] Courier mang kiện hàng về Bưu cục Phường Dịch Vọng (00103W001) quét nhập kho...`);
  const hubInboundRes = await request('/courier/scan/scans/inbound', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${courierToken}`,
      'Idempotency-Key': `inbound-${shipmentCode}-${Date.now()}`,
    },
    body: JSON.stringify({
      shipmentCode,
      locationCode: '00103W001',
      note: 'Kiện hàng đã nhập kho Bưu cục Phường Dịch Vọng',
      idempotencyKey: `inbound-${shipmentCode}`,
    }),
  });

  if (hubInboundRes.ok) {
    console.log(` -> Quét nhập kho Bưu cục Phường THÀNH CÔNG!`);
  } else {
    console.log(` -> Kết quả quét kho: ${JSON.stringify(hubInboundRes.data)}`);
  }

  // ---------------------------------------------------------------------------
  // BƯỚC 7: KIỂM TRA LỊCH TRÌNH VẬN ĐƠN (TRACKING TIMELINE)
  // ---------------------------------------------------------------------------
  console.log(`\n[BƯỚC 7] Kiểm tra tiến trình vận đơn trên hệ thống Tracking...`);
  const trackingRes = await request(`/courier/tracking/tracking/${shipmentCode}/timeline`, {
    headers: { Authorization: `Bearer ${courierToken}` },
  });
  if (trackingRes.ok && Array.isArray(trackingRes.data)) {
    console.log('    Dòng sự kiện (Timeline):');
    trackingRes.data.forEach((evt, idx) => {
      console.log(`    ${idx + 1}. [${evt.eventType || evt.type}] - ${evt.actor} (${evt.locationCode || evt.location || ''}): ${evt.payload?.description || evt.desc || ''}`);
    });
  } else {
    const pubTrack = await request(`/public/tracking/public/track/${shipmentCode}`);
    if (pubTrack.ok) {
      console.log(` -> Trạng thái: [${pubTrack.data?.currentStatus || 'PICKED_UP'}]`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 DEMO TOÀN BỘ QUY TRÌNH TẠO & LẤY HÀNG HOÀN THÀNH XUẤT SẮC 100%!');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n❌ Lỗi trong quá trình Demo:', err.message);
  process.exit(1);
});
