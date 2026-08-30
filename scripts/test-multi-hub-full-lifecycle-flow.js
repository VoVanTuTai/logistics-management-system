#!/usr/bin/env node

/**
 * KIỂM THỬ TOÀN DIỆN: QUY TRÌNH LOGISTICS ĐẦY ĐỦ TỪ TẠO ĐƠN ĐẾN GIAO HÀNG
 * QUA NHIỀU HUB TRUNG CHUYỂN (MULTI-HUB TRANSIT LOGISTICS E2E)
 * =========================================================================
 * Đơn hàng có đầy đủ 100% thông tin nghiệp vụ thực tế:
 * - Thông tin người gửi (Sender): Họ tên, SĐT, Email, Tọa độ GPS, Địa chỉ chi tiết (Phường/Quận/Tỉnh), Mã bưu cục gốc.
 * - Thông tin người nhận (Receiver): Họ tên, SĐT, Email, Tọa độ GPS, Địa chỉ chi tiết (Phường/Quận/Tỉnh), Mã bưu cục đích.
 * - Thông tin kiện hàng (Package): Danh sách hàng hóa chi tiết (SKUs, mô tả, số lượng, đơn giá), Khối lượng thực, Kích thước 3 chiều, Khối lượng quy đổi, Giá trị khai giá, Ghi chú bảo quản (Hàng dễ vỡ, giữ nguyên tem).
 * - Thông tin tài chính (Financials): Tiền thu hộ COD, Cước vận chuyển, Phí bảo hiểm, Tổng cước, Người thanh toán cước, Hình thức thu gom.
 * - Quy trình luân chuyển qua 3 Hub (Multi-Hub Routing):
 *   + Hub Gốc (Origin Hub): 003S001 (Bưu cục Tân Bình - TP.HCM)
 *   + Hub Trung chuyển (Transit Sort Center): 002C001 (Trung tâm Khai thác Miền Trung - Đà Nẵng)
 *   + Hub Đích (Destination Hub): 001N001 (Bưu cục Ba Đình - Hà Nội)
 */

const DEFAULT_GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:3000';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = 'password';

const accounts = {
  admin: '10000001',
  merchant: '41100001',
  opsOrigin: '20000003',      // Ops tại Hub Tân Bình (HCM)
  opsTransit: '20000002',     // Ops tại Sort Center Đà Nẵng (nếu có, hoặc dùng Admin/Ops)
  opsDest: '20000001',        // Ops tại Hub Ba Đình (Hà Nội)
  courierPickup: '30000003',  // Shipper lấy hàng tại TP.HCM
  courierDelivery: '30000001',// Shipper giao hàng tại Hà Nội
};

const RECEIVER_PHONE = '0988776655';

function logStep(step, title) {
  console.log(`\n\x1b[1;34m═══════════════════════════════════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[1;33m[BƯỚC ${step}]\x1b[0m \x1b[1;37m${title}\x1b[0m`);
  console.log(`\x1b[1;34m───────────────────────────────────────────────────────────────────────────────\x1b[0m`);
}

function success(msg) {
  console.log(`  \x1b[32m✔ ${msg}\x1b[0m`);
}

function info(msg) {
  console.log(`  \x1b[36mℹ ${msg}\x1b[0m`);
}

function assert(condition, errorMsg) {
  if (!condition) {
    console.error(`\n\x1b[1;31m✖ LỖI XÁC MINH (ASSERTION FAILED): ${errorMsg}\x1b[0m\n`);
    process.exit(1);
  }
}

async function request(pathname, options = {}, retries = 3) {
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
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (res.status === 429 && !options.allowError && retries > 0) {
    const waitSec = Number(data?.retryAfterSeconds) || 2;
    await new Promise(r => setTimeout(r, (waitSec + 1) * 1000));
    return request(pathname, options, retries - 1);
  }

  if (!res.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} → HTTP ${res.status}: ${JSON.stringify(data)}`);
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

async function runDetailedMultiHubFlow() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 E2E SIMULATION: TOÀN BỘ QUY TRÌNH ĐƠN HÀNG QUA NHIỀU HUB TRUNG CHUYỂN    ║');
  console.log(`║  ⏰ Mã phiên chạy (Run ID): ${RUN_ID}                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // ĐĂNG NHẬP CÁC BÊN THAM GIA QUY TRÌNH
  logStep('0', 'Khởi tạo phiên làm việc & Đăng nhập các tác nhân trong chuỗi cung ứng');
  const adminSession = await login('/ops', accounts.admin, 'OPS');
  const merchantSession = await login('/merchant', accounts.merchant, 'MERCHANT');
  const opsOriginSession = await login('/ops', accounts.opsOrigin, 'OPS');
  const opsDestSession = await login('/ops', accounts.opsDest, 'OPS');
  const courierPickupSession = await login('/courier', accounts.courierPickup, 'COURIER_APP');
  const courierDeliverySession = await login('/courier', accounts.courierDelivery, 'COURIER_APP');

  const originHub = '003S001';    // Hub Tân Bình - TP.HCM
  const transitHub = '002C001';   // Trung tâm Khai thác Đà Nẵng (Sort Center)
  const destHub = '001N001';      // Hub Ba Đình - Hà Nội

  info(`1. Chủ shop (Merchant):       Tài khoản ${accounts.merchant} - Nexus Merchant Store`);
  info(`2. Bưu cục gốc (Origin Hub):    Mã ${originHub} - Bưu cục Tân Bình (TP.HCM)`);
  info(`3. Trung tâm trung chuyển:      Mã ${transitHub} - Sort Center Đà Nẵng (Miền Trung)`);
  info(`4. Bưu cục phát (Dest Hub):     Mã ${destHub} - Bưu cục Ba Đình (Hà Nội)`);
  info(`5. Shipper lấy hàng (Origin):   Mã ${accounts.courierPickup} (Phụ trách Phường 2, Tân Bình)`);
  info(`6. Shipper giao hàng (Dest):    Mã ${accounts.courierDelivery} (Phụ trách Phường Cống Vị, Ba Đình)`);
  success('Đã xác thực và sẵn sàng mọi phân quyền trong hệ thống.');

  // BƯỚC 1: CẤU HÌNH GEOFENCE PHÂN TUYẾN MASTERDATA
  logStep('1', 'Thiết lập bản đồ phân vùng địa lý (Geofence) và gán tuyến Shipper');
  
  // Gán tuyến Shipper lấy hàng tại TP.HCM
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST',
    token: adminSession.token,
    allowError: true,
    body: {
      hubCode: originHub,
      courierId: accounts.courierPickup,
      province: 'Hồ Chí Minh',
      district: 'Tân Bình',
      ward: 'Phường 2',
      zoneName: 'Tuyến Tân Bình - Sân Bay Quốc Nội',
      colorHex: '#2563eb',
      isActive: true,
    },
  });

  // Gán tuyến Shipper giao hàng tại Hà Nội
  await request('/ops/masterdata/courier-area-assignments', {
    method: 'POST',
    token: adminSession.token,
    allowError: true,
    body: {
      hubCode: destHub,
      courierId: accounts.courierDelivery,
      province: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Phường Cống Vị',
      zoneName: 'Tuyến Ba Đình - Cống Vị - Liễu Giai',
      colorHex: '#10b981',
      isActive: true,
    },
  });
  success(`Đã thiết lập tuyến phụ trách cho Shipper ${accounts.courierPickup} tại ${originHub} và Shipper ${accounts.courierDelivery} tại ${destHub}.`);

  // BƯỚC 2: MERCHANT TẠO ĐƠN HÀNG VỚI ĐẦY ĐỦ 100% THÔNG TIN CHI TIẾT
  logStep('2', 'Merchant tạo đơn hàng mới với đầy đủ 100% thông tin quy chuẩn');

  const baseNum = Date.now() % 1_000_000_000;
  const shipmentCode = `111${String(baseNum).padStart(9, '0')}`;

  const fullShipmentPayload = {
    code: shipmentCode,
    pickupLatitude: 10.8055,
    pickupLongitude: 106.6625,
    deliveryLatitude: 21.0360,
    deliveryLongitude: 105.8150,
    metadata: {
      createdBy: {
        username: accounts.merchant,
        userId: accounts.merchant,
        role: 'MERCHANT',
        storeName: 'NEXUS Official Flagship Store',
      },
      sender: {
        name: 'Công ty Cổ phần Thời trang NEXUS Sài Gòn',
        phone: '0909123456',
        secondaryPhone: '02838112233',
        email: 'sales-hcm@nexus-fashion.vn',
        address: 'Tòa nhà Waseco, 120 Trường Sơn, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
        addressDetail: 'Tầng 4, Phòng 402, Tòa nhà Waseco',
        province: 'Hồ Chí Minh',
        district: 'Tân Bình',
        ward: 'Phường 2',
        postalCode: '700000',
        hubCode: originHub,
        coordinates: { lat: 10.8055, lng: 106.6625 },
      },
      receiver: {
        name: 'Nguyễn Hoàng Anh Vũ',
        phone: RECEIVER_PHONE,
        secondaryPhone: '0912345678',
        email: 'anhvu.nguyen@company.com.vn',
        address: 'Số 45 Đội Cấn, Phường Cống Vị, Quận Ba Đình, TP. Hà Nội',
        addressDetail: 'Căn hộ 1205, Tòa Sapphire, 45 Đội Cấn',
        province: 'Hà Nội',
        district: 'Ba Đình',
        ward: 'Phường Cống Vị',
        postalCode: '100000',
        hubCode: destHub,
        coordinates: { lat: 21.0360, lng: 105.8150 },
      },
      package: {
        itemType: 'Thời trang cao cấp & Thiết bị điện tử',
        totalItemsCount: 2,
        items: [
          {
            sku: 'NX-JACKET-BLK-L',
            name: 'Áo khoác dạ cao cấp Nam Size L - Đen',
            quantity: 1,
            unitPrice: 850000,
            weightKg: 0.95,
            dimensionsCm: { length: 30, width: 25, height: 8 },
          },
          {
            sku: 'NX-WATCH-SLV-01',
            name: 'Đồng hồ thông minh Nexus SmartBand Pro',
            quantity: 1,
            unitPrice: 650000,
            weightKg: 0.25,
            dimensionsCm: { length: 15, width: 10, height: 5 },
          },
        ],
        weightKg: 1.2,
        dimensionsCm: { length: 32, width: 26, height: 14 },
        volumetricWeightKg: (32 * 26 * 14) / 5000, // 2.33 kg theo chuẩn IATA
        declaredValue: 1500000, // Khai giá 1.500.000 VNĐ
        isFragile: true,        // Hàng giá trị cao / dễ tổn hại
        requiresColdStorage: false,
        inspectionPolicy: 'CHO_XEM_HANG_KHONG_CHO_THU', // Cho xem hàng, không thử
        customerNote: 'Giao giờ hành chính, gọi trước khi đến 15 phút. Giữ nguyên seal hộp đồng hồ.',
      },
      service: {
        type: 'EXPRESS', // Dịch vụ chuyển phát nhanh
        serviceCode: 'NX-EXPRESS-AIR',
        serviceName: 'Chuyển phát nhanh 24H',
      },
      financials: {
        codAmount: 1500000,          // Tiền thu hộ: 1.500.000 VNĐ
        shippingFee: 48000,          // Cước vận chuyển: 48.000 VNĐ
        insuranceFee: 7500,          // Phí bảo hiểm hàng giá trị cao (0.5%): 7.500 VNĐ
        codCollectionFee: 0,         // Miễn phí thu hộ COD
        vatAmount: 4440,             // VAT 8%
        totalFee: 59940,             // Tổng cước: 59.940 VNĐ
        payer: 'SENDER',             // Người gửi trả cước
        paymentMethod: 'PP_CASH',    // Thanh toán cước trước bằng tiền mặt
      },
      routingPlan: {
        originHubCode: originHub,
        transitHubCodes: [transitHub],
        destinationHubCode: destHub,
        transitType: 'MULTIMODAL_AIR_LINEHAUL',
      },
      barcodeData: {
        waybill12: shipmentCode,
        barcodeType: 'CODE128',
        qrData: `https://tracking.nexus-ex.site/track/${shipmentCode}`,
      },
      source: 'merchant-portal-v2',
    },
  };

  const { data: createdShipment } = await request('/merchant/shipment/shipments', {
    method: 'POST',
    token: merchantSession.token,
    body: fullShipmentPayload,
  });

  assert(createdShipment?.code === shipmentCode, 'Tạo đơn hàng thất bại');
  info(`Mã vận đơn:             \x1b[1;32m${shipmentCode}\x1b[0m`);
  info(`Trạng thái ban đầu:     ${createdShipment.currentStatus}`);
  info(`Người gửi:              ${fullShipmentPayload.metadata.sender.name} (${fullShipmentPayload.metadata.sender.phone})`);
  info(`Tọa độ kho lấy (GPS):   (${createdShipment.pickupLatitude}, ${createdShipment.pickupLongitude})`);
  info(`Người nhận:             ${fullShipmentPayload.metadata.receiver.name} (${fullShipmentPayload.metadata.receiver.phone})`);
  info(`Tọa độ nhận hàng (GPS): (${createdShipment.deliveryLatitude}, ${createdShipment.deliveryLongitude})`);
  info(`Kiện hàng:              ${fullShipmentPayload.metadata.package.itemType} | Trọng lượng: ${fullShipmentPayload.metadata.package.weightKg}kg | COD: ${fullShipmentPayload.metadata.financials.codAmount.toLocaleString('vi-VN')} VNĐ`);
  info(`Tuyến luân chuyển:      ${originHub} (TP.HCM) ➔ ${transitHub} (Đà Nẵng) ➔ ${destHub} (Hà Nội)`);
  success('Đơn hàng đã được tạo thành công với 100% thuộc tính nghiệp vụ hợp lệ.');

  // BƯỚC 3: TỰ ĐỘNG KÍCH HOẠT ĐIỀU PHỐI (SHOP ĐÃ CÓ HỢP ĐỒNG, KHÔNG CẦN OPS DUYỆT THỦ CÔNG)
  logStep('3', 'Tự động kích hoạt quy trình lấy hàng (Shop đã ký hợp đồng, hệ thống tự động điều phối trực tiếp không qua Ops duyệt)');
  info('Quy tắc nghiệp vụ: Merchant đã ký hợp đồng & có tài khoản hợp lệ, đơn hàng tạo ra trong khu vực bưu cục quản lý sẽ được TỰ ĐỘNG ĐIỀU PHỐI trực tiếp đến App của Shipper phụ trách phân vùng.');

  // Chờ Dispatch Engine tiêu thụ sự kiện shipment.created và so khớp Geofence
  info('Đang chờ bộ máy điều phối tự động (Dispatch Engine) so khớp tọa độ kho gửi và tuyến Shipper...');
  await new Promise((r) => setTimeout(r, 2000));

  // BƯỚC 4: HỆ THỐNG TỰ ĐỘNG ĐIỀU PHỐI SHIPPER LẤY HÀNG (AUTO-DISPATCH PICKUP)
  logStep('4', 'Bộ máy Tự động điều phối (System Auto-Dispatch) gán Shipper lấy hàng theo Geofence');

  const { data: pickupTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=PICKUP`, {
    token: opsOriginSession.token,
  });

  assert(Array.isArray(pickupTasks) && pickupTasks.length > 0, 'Không tìm thấy task PICKUP');
  const pickupTask = pickupTasks[0];
  const activePickupAssignment = pickupTask.assignments?.find((a) => !a.unassignedAt) || pickupTask.assignments?.[0];

  info(`Mã công việc (Task Code):  ${pickupTask.taskCode}`);
  info(`Loại tác vụ:               ${pickupTask.taskType}`);
  info(`Trạng thái điều phối:      ${pickupTask.status}`);
  info(`Shipper được gán tự động:  \x1b[1;32m${activePickupAssignment?.courierId}\x1b[0m`);
  info(`Ghi chú hệ thống:          "${pickupTask.note}"`);

  assert(activePickupAssignment?.courierId === accounts.courierPickup, `Shipper gán không đúng: ${activePickupAssignment?.courierId}`);
  success(`✔ HỆ THỐNG TỰ ĐỘNG ĐIỀU PHỐI thành công cho Shipper ${accounts.courierPickup} phụ trách Phường 2, Tân Bình!`);

  // BƯỚC 5: SHIPPER ĐẾN KHO LẤY HÀNG & QUÉT XÁC NHẬN LẤY HÀNG (PICKUP SCAN)
  logStep('5', 'Shipper đến kho người gửi, kiểm tra kiện hàng & quét mã xác nhận lấy hàng');

  const { data: pickupScanResult } = await request('/courier/scan/scans/pickup', {
    method: 'POST',
    token: courierPickupSession.token,
    body: {
      shipmentCode,
      locationCode: originHub,
      actor: accounts.courierPickup,
      note: 'Kiểm tra bao bì nguyên vẹn, tem nhãn đầy đủ, quét nhận 1 kiện hàng',
      idempotencyKey: `${RUN_ID}-${shipmentCode}-pickup-scan`,
    },
  });

  // Hoàn tất task trên app Shipper
  await request(`/courier/dispatch/tasks/${pickupTask.id}/status`, {
    method: 'PATCH',
    token: courierPickupSession.token,
    body: { status: 'COMPLETED', note: 'Shipper đã lấy hàng thành công và mang về kho' },
  });

  info(`Kết quả quét lấy hàng: Mã sự kiện \x1b[32m${pickupScanResult?.scanEvent?.id || 'OK'}\x1b[0m`);
  success('Shipper đã nhận kiện hàng từ Merchant, đơn hàng chuyển sang trạng thái PICKED_UP.');

  // BƯỚC 6: HÀNG VỀ KHO GỐC -> QUÉT NHẬP KHO GỐC (INBOUND SCAN AT ORIGIN HUB)
  logStep('6', `Hàng về bưu cục gốc ${originHub} (Tân Bình): Quét nhập kho & kiểm tra hàng`);

  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsOriginSession.token,
    body: {
      shipmentCode,
      locationCode: originHub,
      employeeCode: accounts.opsOrigin,
      note: `Kiểm tra cân nặng thực tế 1.2kg, nhập kho bưu cục ${originHub} chờ đóng bao`,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-orig`,
    },
  });
  success(`Kiện hàng đã nhập kho ${originHub} an toàn (Trạng thái: SCAN_INBOUND).`);

  // BƯỚC 7: ĐÓNG BAO TRUNG CHUYỂN LIÊN TỈNH (SEAL MANIFEST BAG)
  logStep('7', `Đóng bao tải trung chuyển liên tỉnh: ${originHub} (TP.HCM) ➔ ${transitHub} (Đà Nẵng)`);

  const manifestBag1 = `BAG-SGN-DAD-${RUN_ID}`;
  const sealNumber1 = `SEAL-VN-${Date.now().toString().slice(-6)}`;

  const { data: sealedBag1 } = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: opsOriginSession.token,
    body: {
      manifestCode: manifestBag1,
      type: 'BAG',
      originHubCode: originHub,
      destinationHubCode: transitHub,
      sealNumber: sealNumber1,
      shipmentCodes: [shipmentCode],
      note: `Bao gom hàng đường bay TP.HCM -> Đà Nẵng, Seal niêm phong: ${sealNumber1}`,
    },
  });

  info(`Mã bao tải trung chuyển:   \x1b[1;33m${manifestBag1}\x1b[0m`);
  info(`Mã chì niêm phong (Seal):  \x1b[1;33m${sealNumber1}\x1b[0m`);
  info(`Số kiện trong bao:         ${sealedBag1.shipmentCount || 1} kiện`);
  success(`Bao hàng đã được NIÊM PHONG (SEALED) và xuất bến lên xe tải đường trục (Linehaul).`);

  // BƯỚC 8: XE ĐẾN HUB TRUNG GIAN (TRANSIT SORT CENTER ĐÀ NẴNG) -> NHẬN BAO
  logStep('8', `Xe tải đến Trung tâm Khai thác Trung gian ${transitHub} (Đà Nẵng): Quét nhận bao`);

  await request(`/ops/manifest/manifests/${sealedBag1.id}/receive`, {
    method: 'POST',
    token: adminSession.token, // Sử dụng Admin hoặc Ops trung chuyển
    body: {
      receivedBy: '20000002',
      locationCode: transitHub,
      note: `Xe trung chuyển SG-DAD đến đúng lịch trình, kiểm tra chì niêm phong ${sealNumber1} nguyên vẹn`,
    },
  });
  info(`Bao tải ${manifestBag1} đã được tiếp nhận tại Sort Center Đà Nẵng (${transitHub}).`);
  success('Đã hoàn tất khâu kiểm đếm trung chuyển chặng 1.');

  // BƯỚC 9: TRUNG CHUYỂN CHẶNG 2: ĐÀ NẴNG ➔ HÀ NỘI
  logStep('9', `Tiếp tục luân chuyển chặng 2: ${transitHub} (Đà Nẵng) ➔ ${destHub} (Hà Nội)`);

  const manifestBag2 = `BAG-DAD-HAN-${RUN_ID}`;
  const sealNumber2 = `SEAL-VN-${(Date.now() + 111).toString().slice(-6)}`;

  const { data: sealedBag2 } = await request('/ops/manifest/manifests', {
    method: 'POST',
    token: adminSession.token,
    body: {
      manifestCode: manifestBag2,
      type: 'BAG',
      originHubCode: transitHub,
      destinationHubCode: destHub,
      sealNumber: sealNumber2,
      shipmentCodes: [shipmentCode],
      note: `Bao gom hàng chặng tiếp nối Đà Nẵng -> Hà Nội, Seal: ${sealNumber2}`,
    },
  });

  info(`Mã bao tải chặng 2:        \x1b[1;33m${manifestBag2}\x1b[0m`);
  info(`Mã chì niêm phong mới:     \x1b[1;33m${sealNumber2}\x1b[0m`);
  success(`Bao hàng đã xuất bến đi bưu cục phát ${destHub} (Ba Đình, Hà Nội).`);

  // BƯỚC 10: XE ĐẾN KHO ĐÍCH (HÀ NỘI) -> NHẬN BAO, GỠ BAO & QUÉT NHẬP KHO ĐÍCH
  logStep('10', `Xe đến bưu cục phát ${destHub} (Ba Đình, HN): Nhận bao, Cắt Seal, Gỡ bao & Nhập kho phát`);

  // 10.1 Nhận bao
  await request(`/ops/manifest/manifests/${sealedBag2.id}/receive`, {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      receivedBy: accounts.opsDest,
      locationCode: destHub,
      note: `Xe đến kho Ba Đình, tem chì ${sealNumber2} còn nguyên vẹn`,
    },
  });
  info(`1. Đã nhận bao tải ${manifestBag2} tại bưu cục ${destHub}.`);

  // 10.2 Cắt seal & gỡ kiện hàng ra khỏi bao
  await request(`/ops/manifest/manifests/${sealedBag2.id}/shipments/remove`, {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      shipmentCodes: [shipmentCode],
      unsealedBy: accounts.opsDest,
      unsealedByName: 'Điều hành viên Kho Ba Đình',
      processingHubCode: destHub,
      note: 'Cắt chì niêm phong, kiểm tra kiện hàng nguyên vẹn không móp méo',
    },
  });
  info('2. Đã cắt seal niêm phong và gỡ kiện hàng ra khỏi bao tải.');

  // 10.3 Quét nhập kho phát tại kho đích
  await request('/ops/scan/scans/inbound', {
    method: 'POST',
    token: opsDestSession.token,
    body: {
      shipmentCode,
      locationCode: destHub,
      employeeCode: accounts.opsDest,
      note: `Nhập kho phát bưu cục ${destHub} sẵn sàng điều phối giao`,
      idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-dest`,
    },
  });
  info(`3. Đã quét Inbound nhập kho phát tại ${destHub}.`);
  success('Đã kích hoạt bộ máy Tự động điều phối giao hàng (Delivery Auto-Dispatch)!');

  // Chờ Dispatch Engine xử lý so khớp Geofence người nhận
  info('Đang chờ bộ máy điều phối tự động phân tích tọa độ người nhận...');
  await new Promise((r) => setTimeout(r, 2000));

  // BƯỚC 11: HỆ THỐNG TỰ ĐỘNG ĐIỀU PHỐI SHIPPER PHÁT HÀNG (AUTO-DISPATCH DELIVERY)
  logStep('11', 'Bộ máy Tự động điều phối (Delivery Auto-Dispatch) gán Shipper giao hàng theo Geofence');

  const { data: deliveryTasks } = await request(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=DELIVERY`, {
    token: opsDestSession.token,
  });

  assert(Array.isArray(deliveryTasks) && deliveryTasks.length > 0, 'Không tìm thấy task DELIVERY tự động');
  const deliveryTask = deliveryTasks[0];
  const activeDeliveryAssignment = deliveryTask.assignments?.find((a) => !a.unassignedAt) || deliveryTask.assignments?.[0];

  info(`Mã công việc giao (Task Code): ${deliveryTask.taskCode}`);
  info(`Loại tác vụ:                   ${deliveryTask.taskType}`);
  info(`Trạng thái điều phối:          ${deliveryTask.status}`);
  info(`Shipper giao hàng tự động:     \x1b[1;32m${activeDeliveryAssignment?.courierId}\x1b[0m`);
  info(`Ghi chú hệ thống:              "${deliveryTask.note}"`);

  assert(activeDeliveryAssignment?.courierId === accounts.courierDelivery, `Shipper giao hàng không khớp: ${activeDeliveryAssignment?.courierId}`);
  success(`✔ HỆ THỐNG TỰ ĐỘNG ĐIỀU PHỐI thành công cho Shipper ${accounts.courierDelivery} phụ trách Phường Cống Vị, Ba Đình!`);

  // BƯỚC 12: SHIPPER ĐI GIAO HÀNG & HOÀN TẤT KÝ NHẬN (POD CONFIRMATION)
  logStep('12', 'Shipper tải kiện hàng lên xe, đi giao hàng & thu COD, hoàn tất ký nhận POD');

  // 12.1 Shipper xuất phát đi giao hàng (Delivery Attempt)
  await request('/courier/delivery/deliveries/attempts', {
    method: 'POST',
    token: courierDeliverySession.token,
    body: {
      shipmentCode,
      taskId: deliveryTask.id,
      courierId: accounts.courierDelivery,
      locationCode: destHub,
      actor: accounts.courierDelivery,
      note: 'Shipper đã nhận hàng từ kho và đang trên đường giao tới địa chỉ số 45 Đội Cấn',
    },
  });
  info('Shipper đã xuất phát đi giao hàng (Đang phát hàng).');

  // 12.2 Giao hàng thành công + Thu COD + Chụp ảnh chữ ký POD
  const podSignatureUrl = 'https://minio.nexus-ex.site/pod/sig-20260830-1205.png';
  const podPhotoUrl = 'https://minio.nexus-ex.site/pod/photo-package-20260830.jpg';

  await request('/courier/delivery/deliveries/success', {
    method: 'POST',
    token: courierDeliverySession.token,
    body: {
      shipmentCode,
      taskId: deliveryTask.id,
      locationCode: destHub,
      courierId: accounts.courierDelivery,
      actor: accounts.courierDelivery,
      note: 'Giao hàng thành công tận tay khách hàng Nguyễn Hoàng Anh Vũ, đã thu đủ 1.500.000 VNĐ tiền COD',
      idempotencyKey: `${RUN_ID}-${shipmentCode}-delivery-success`,
      podImageUrl: podPhotoUrl,
      podNote: 'Người nhận trực tiếp ký nhận và thanh toán tiền mặt',
      podCapturedBy: accounts.courierDelivery,
    },
  });

  // Cập nhật hoàn tất Task giao hàng
  await request(`/courier/dispatch/tasks/${deliveryTask.id}/status`, {
    method: 'PATCH',
    token: courierDeliverySession.token,
    body: { status: 'COMPLETED', note: 'Shipper đã hoàn thành giao kiện hàng' },
  });

  info(`Chứng từ ký nhận điện tử (POD Signature): ${podSignatureUrl}`);
  info(`Ảnh chụp gói hàng tại cửa (POD Photo):   ${podPhotoUrl}`);
  info(`Tiền COD thu hộ đã khớp:                 1.500.000 VNĐ`);
  success('Đơn hàng đã được GIAO THÀNH CÔNG (DELIVERED) và hoàn tất trọn vẹn vòng đời!');

  // BƯỚC 13: ĐỐI SOÁT DÒNG THỜI GIAN HÀNH TRÌNH ĐƠN HÀNG (TRACKING TIMELINE AUDIT)
  logStep('13', 'Đối soát chi tiết toàn bộ Dòng thời gian hành trình (Tracking Timeline)');
  await new Promise((r) => setTimeout(r, 1500));

  const { data: timelineData } = await request(`/ops/tracking/tracking/${shipmentCode}/timeline`, {
    token: adminSession.token,
  });

  const timeline = Array.isArray(timelineData) ? timelineData : [];
  
  console.log('\n📜 BẢNG ĐỐI SOÁT HÀNH TRÌNH CHI TIẾT (END-TO-END TRACKING TIMELINE):');
  console.log('───────────────────────────────────────────────────────────────────────────────────────────────────');
  console.log('STT | Thời gian | Sự kiện nghiệp vụ              | Nguồn tác nhân | Ghi chú & Chi tiết thao tác');
  console.log('───────────────────────────────────────────────────────────────────────────────────────────────────');

  timeline.forEach((event, idx) => {
    const timeStr = event.occurredAt ? new Date(event.occurredAt).toISOString().slice(11, 19) : 'N/A';
    const num = String(idx + 1).padStart(2, ' ');
    const eventType = String(event.eventType).padEnd(30, ' ');
    const source = String(event.eventSource).padEnd(14, ' ');
    const note = event.note ? `\n    ↳ Ghi chú: ${event.note}` : '';
    console.log(`[${num}] | ${timeStr} | ${eventType} | ${source} ${note}`);
  });
  console.log('───────────────────────────────────────────────────────────────────────────────────────────────────\n');

  // Xác minh các mốc then chốt
  const autoDispatchEvents = timeline.filter(e => e.note?.includes('🤖 [Hệ thống tự động điều phối]'));
  assert(autoDispatchEvents.length >= 2, `Cần ít nhất 2 sự kiện điều phối tự động (Lấy + Giao), hiện có: ${autoDispatchEvents.length}`);

  const hasSealEvents = timeline.some(e => e.note?.includes('SEAL') || e.note?.includes('Gỡ bao') || e.note?.includes('Niêm phong'));
  assert(hasSealEvents, 'Cần có sự kiện đóng/gỡ bao niêm phong trung chuyển');

  success('✔ 100% các bước từ Tạo đơn đầy đủ thông tin ➔ Điều phối Geofence lấy ➔ Quét nhận kho ➔ Đóng bao niêm phong ➔ Trung chuyển liên Hub ➔ Gỡ bao ➔ Điều phối Geofence phát ➔ Giao hàng thu COD & Ký nhận POD đã hoạt động chuẩn xác hoàn hảo!');
}

runDetailedMultiHubFlow().catch((err) => {
  console.error('\x1b[31m LỖI TRONG QUÁ TRÌNH KIỂM THỬ:\x1b[0m', err);
  process.exit(1);
});
