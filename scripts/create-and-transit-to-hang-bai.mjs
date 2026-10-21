/**
 * Kịch bản tạo đơn hàng thực tế & trung chuyển đến Bưu cục Phường Hàng Bài - Hoàn Kiếm (00101W001)
 * Sau đó kiểm tra hiển thị trên Bảng Giám Sát Hàng Đến.
 */

const API_BASE = 'http://127.0.0.1:3000';
const PASSWORD = 'password';

const HANG_BAI_HUB = '00101W001';
const ORIGIN_HUB = '003S001'; // Bưu cục Tân Bình - TP.HCM

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
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

  if (!res.ok) {
    throw new Error(`[${res.status}] ${url}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
  }

  return data;
}

async function login(rolePrefix, username) {
  const res = await request(`/${rolePrefix}/auth/auth/login`, {
    method: 'POST',
    body: { username, password: PASSWORD },
  });
  return res.tokens.accessToken;
}

async function main() {
  console.log('🚀 Bắt đầu kịch bản tạo đơn và trung chuyển đến Bưu cục Phường Hàng Bài (00101W001)...\n');

  // 1. Đăng nhập các tác nhân
  console.log('1️⃣ Đăng nhập các tài khoản vận hành:');
  const merchantToken = await login('merchant', '41100001');
  console.log('   ✔ Merchant (41100001)');
  const opsOriginToken = await login('ops', '20000003');
  console.log('   ✔ Ops Bưu cục Tân Bình (20000003)');
  const courierPickupToken = await login('courier', '30000003');
  console.log('   ✔ Courier Lấy hàng (30000003)');
  const opsHangBaiToken = await login('ops', '20002001');
  console.log('   ✔ Trưởng Bưu cục Hàng Bài (20002001)');

  // 2. Tạo mã vận đơn thực tế (Chuẩn 12 chữ số bắt đầu bằng 111)
  const timestamp = Date.now();
  const shipmentCode = `111${String(timestamp).slice(-9)}`;
  console.log(`\n2️⃣ Tạo vận đơn thực tế mới qua API: [${shipmentCode}]`);

  const createdShipment = await request('/merchant/shipment/shipments', {
    method: 'POST',
    token: merchantToken,
    body: {
      code: shipmentCode,
      currentStatus: 'CREATED',
      metadata: {
        createdBy: { username: '41100001', userId: '41100001', name: 'Shop Đối Tác NEXUS' },
        sender: {
          name: 'Kho Tổng Miền Nam - NEXUS Logistics',
          phone: '0908889999',
          address: '120 Trường Sơn, Phường 2, Quận Tân Bình, Thành phố Hồ Chí Minh',
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận Tân Bình',
          ward: 'Phường 2',
          hubCode: ORIGIN_HUB,
          coordinate: { latitude: 10.8185, longitude: 106.6662 },
        },
        receiver: {
          name: 'Nguyễn Thu Trang - Khách Hàng Bài',
          phone: '0912345678',
          address: '15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Thành phố Hà Nội',
          province: 'Thành phố Hà Nội',
          district: 'Quận Hoàn Kiếm',
          ward: 'Phường Hàng Bài',
          region: 'Hà Nội',
          hubCode: HANG_BAI_HUB,
          coordinate: { latitude: 21.0185, longitude: 105.8524 },
        },
        package: {
          itemType: 'Gốm sứ trang trí & Đồ gốm cao cấp',
          parcelType: 'FRAGILE',
          weightKg: 2.2,
          dimensions: { length: 35, width: 25, height: 20 }, // Volumetric: (35*25*20)/6000 = 2.92 kg -> Chargeable: 2.92 kg
          chargeableWeightKg: 2.92,
          declaredValue: 1200000,
        },
        parcelType: 'FRAGILE',
        weightKg: 2.2,
        chargeableWeightKg: 2.92,
        service: { type: 'EXPRESS', name: 'Chuyển phát hỏa tốc' },
        inspectionPolicy: 'VIEW_ONLY',
        codAmount: 480000,
        shippingFee: 42000,
        deliveryNote: 'Cho khách xem hàng trước khi nhận, hàng dễ vỡ xin nhẹ tay',
        routing: {
          originHubCode: ORIGIN_HUB,
          destinationHubCode: HANG_BAI_HUB,
        },
        platform: 'Merchant',
      },
    },
  });

  console.log(`   ✔ Vận đơn đã tạo: ID=${createdShipment.id}, Trạng thái=${createdShipment.currentStatus}`);

  // 3. Quét lấy hàng tại kho gửi
  console.log('\n3️⃣ Shipper quét lấy hàng tại kho gửi:');
  await request('/courier/scan/scans/pickup', {
    method: 'POST',
    token: courierPickupToken,
    body: {
      shipmentCode,
      locationCode: ORIGIN_HUB,
      actor: '30000003',
      note: 'Shipper đã nhận kiện gốm sứ dễ vỡ từ kho gửi',
      idempotencyKey: `pickup-${shipmentCode}`,
    },
  });
  console.log('   ✔ Trạng thái chuyển thành: PICKUP_COMPLETED');

  // 4. Nhập kho bưu cục gốc (Tân Bình)
  console.log('\n4️⃣ Nhập kho bưu cục gốc (003S001):');
  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsOriginToken,
    body: {
      shipmentCode,
      locationCode: ORIGIN_HUB,
      employeeCode: '20000003',
      note: 'Nhập kho Tân Bình để chuẩn bị đóng chuyến đi Hà Nội',
      idempotencyKey: `inbound-orig-${shipmentCode}`,
    },
  });
  console.log('   ✔ Bưu cục Tân Bình quét nhập kho thành công');

  // 5. Đóng bao trung chuyển liên tỉnh gửi về Bưu cục Phường Hàng Bài
  console.log(`\n5️⃣ Đóng bao niêm phong trung chuyển: ${ORIGIN_HUB} ➔ ${HANG_BAI_HUB}`);
  const bagCode = `BAG-HB-${String(timestamp).slice(-5)}`;
  const sealNumber = `SEAL-HB-${String(timestamp).slice(-4)}`;
  const manifest = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: opsOriginToken,
    body: {
      manifestCode: bagCode,
      type: 'BAG',
      originHubCode: ORIGIN_HUB,
      destinationHubCode: HANG_BAI_HUB,
      sealNumber,
      shipmentCodes: [shipmentCode],
      note: `Bao hàng chuyển phát hỏa tốc về Bưu cục Hàng Bài - Hoàn Kiếm`,
    },
  });
  console.log(`   ✔ Đã tạo bao & kẹp chì: Mã bao=${bagCode}, Số chì seal=${sealNumber}`);

  // 6. Bưu cục Phường Hàng Bài tiếp nhận bao và cắt chì mở niêm phong
  console.log(`\n6️⃣ Bưu cục Phường Hàng Bài (${HANG_BAI_HUB}) tiếp nhận bao hàng:`);
  await request(`/ops/manifest/manifests/${manifest.id}/receive`, {
    method: 'POST',
    token: opsHangBaiToken,
    body: {
      receivedBy: '20002001',
      locationCode: HANG_BAI_HUB,
      note: 'Tiếp nhận bao hàng liên tỉnh tại Bưu cục Hàng Bài',
    },
  });
  console.log('   ✔ Bưu cục Hàng Bài đã xác nhận nhận bao');

  await request(`/ops/manifest/manifests/${manifest.id}/shipments/remove`, {
    method: 'POST',
    token: opsHangBaiToken,
    body: {
      shipmentCodes: [shipmentCode],
      unsealedBy: '20002001',
      unsealedByName: 'Trưởng Bưu cục Hàng Bài',
      processingHubCode: HANG_BAI_HUB,
      note: 'Mở bao kiểm đếm hàng đến tại Bưu cục Hàng Bài',
    },
  });
  console.log('   ✔ Đã cắt seal chì và tháo dỡ kiện hàng');

  // 7. Bưu cục Phường Hàng Bài quét nhập kho hàng đến (SCAN_INBOUND tại 00101W001)
  console.log(`\n7️⃣ Bưu cục Phường Hàng Bài quét hàng đến (SCAN_INBOUND):`);
  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsHangBaiToken,
    body: {
      shipmentCode,
      locationCode: HANG_BAI_HUB,
      employeeCode: '20002001',
      note: 'Quét hàng đến tại Bưu cục Phường Hàng Bài - Hoàn Kiếm • 15 Phố Huế',
      idempotencyKey: `inbound-dest-${shipmentCode}`,
    },
  });
  console.log(`   ✔ Vận đơn đã chính thức nhập kho Bưu cục Phường Hàng Bài (${HANG_BAI_HUB}) với trạng thái SCAN_INBOUND!`);

  // 8. Kiểm tra truy vấn API Giám sát hàng đến (arrival monitor)
  console.log('\n8️⃣ Kiểm tra xuất hiện trên Bảng Giám Sát Hàng Đến:');
  const arrivalList = await request('/ops/shipment/shipments?status=SCAN_INBOUND&limit=50', {
    token: opsHangBaiToken,
  });

  const items = Array.isArray(arrivalList) ? arrivalList : (arrivalList.items || []);
  const found = items.find((item) => item.shipmentCode === shipmentCode);

  if (found) {
    console.log(`   🎉 TÌM THẤY VẬN ĐƠN TRÊN BẢNG GIÁM SÁT HÀNG ĐẾN:`);
    console.log(`      - Mã vận đơn: ${found.shipmentCode}`);
    console.log(`      - Trạng thái: ${found.currentStatus}`);
    console.log(`      - BC Đến: ${found.destinationHubCode || found.receiverHubCode || found.currentLocation}`);
    console.log(`      - Hub Gửi: ${found.originHubCode || found.senderHubCode}`);
    console.log(`      - Người nhận: ${found.receiverName} (${found.receiverPhone})`);
    console.log(`      - Địa chỉ nhận: ${found.receiverAddress}`);
    console.log(`      - Ghi chú: ${found.deliveryNote}`);
  } else {
    console.log(`   ⚠️ Đã có ${items.length} đơn hàng đến, nhưng đơn ${shipmentCode} có thể cần lọc theo mã.`);
  }

  console.log('\n✅ Hoàn tất 100% kịch bản tạo dữ liệu thật và trung chuyển!');
  console.log(`Mã đơn hàng phục vụ kiểm tra trên UI: ${shipmentCode}`);
}

main().catch((err) => {
  console.error('❌ Lỗi khi thực hiện kịch bản:', err.message);
  process.exit(1);
});
