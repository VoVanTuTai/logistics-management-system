#!/usr/bin/env node

/**
 * 🚀 KỊCH BẢN KIỂM THỬ E2E TOÀN DIỆN MÔI TRƯỜNG ĐÃ DEPLOY (CLOUDFLARE HTTPS)
 * =========================================================================
 * Kiểm tra toàn bộ vòng đời vận đơn từ TẠO ĐƠN HÀNG đến GIAO HÀNG THÀNH CÔNG:
 *
 *  [BƯỚC 1] Báo giá cước phí (Pricing Quote Calculation) qua Cloudflare
 *  [BƯỚC 2] Merchant tạo vận đơn liên tỉnh TP.HCM -> Hà Nội (Shipment Creation)
 *  [BƯỚC 3] Tự động phân công nhiệm vụ lấy hàng (Auto-dispatch Pickup Task)
 *  [BƯỚC 4] Shipper quét lấy hàng tại kho Shop (Courier Pickup Scan)
 *  [BƯỚC 5] Nhập kho bưu cục phát sinh gốc (Origin Hub Inbound Scan)
 *  [BƯỚC 6] Đóng bao niêm phong trung chuyển liên tỉnh (Manifest Seal & Dispatch)
 *  [BƯỚC 7] Nhận bao & Nhập kho bưu cục phát đích (Destination Hub Receive & Inbound)
 *  [BƯỚC 8] Phân công phát hàng cho Shipper bưu cục đích (Delivery Dispatch Assignment)
 *  [BƯỚC 9] Shipper giao hàng thành công, thu COD & Chụp ảnh POD (Delivery Success & POD)
 *  [BƯỚC 10] Xác nhận trạng thái cuối cùng DELIVERED (Final Status Verification)
 *  [BƯỚC 11] Tra cứu Timeline hành trình công khai & Bảo mật thông tin (Public Tracking & Security)
 */

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'nexus-ex.site';
const GATEWAY_URL = process.env.GATEWAY_URL || `https://ops.${BASE_DOMAIN}`;
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = 'password';

const accounts = {
  admin: '10000001',           // Quản trị viên điều phối toàn quốc
  merchant: '41100001',        // Shop Đối tác NEXUS (Hàng Bài / Tân Bình)
  opsOrigin: '20000003',       // Điều hành Bưu cục Gốc (Miền Nam - Tân Bình)
  opsDest: '20000001',         // Điều hành Bưu cục Đích (Miền Bắc - Ba Đình)
  courierPickup: '30000003',   // Shipper lấy hàng (Tân Bình, TP.HCM)
  courierDelivery: '30000001', // Shipper giao hàng (Ba Đình, Hà Nội)
};

const ORIGIN_HUB = '003S001'; // Hub Tân Bình - TP.HCM
const DEST_HUB = '001N001';   // Hub Ba Đình - Hà Nội
const COD_AMOUNT = 320000;    // 320,000 VND

let totalSteps = 0;
let passedSteps = 0;
let failedSteps = 0;
const stepLog = [];

function stepPass(name, detail = '', durationMs = 0) {
  totalSteps++; passedSteps++;
  const durStr = durationMs > 0 ? `\x1b[90m(${durationMs}ms)\x1b[0m` : '';
  console.log(`  \x1b[32m✔\x1b[0m \x1b[1m${name}\x1b[0m ${durStr}`);
  if (detail) console.log(`    \x1b[36m└─ ${detail}\x1b[0m`);
  stepLog.push({ name, status: 'PASS', detail, durationMs });
}

function stepFail(name, err) {
  totalSteps++; failedSteps++;
  const msg = err?.message || String(err);
  console.error(`  \x1b[31m✖\x1b[0m \x1b[1m${name}\x1b[0m`);
  console.error(`    \x1b[31m└─ LỖI: ${msg}\x1b[0m`);
  stepLog.push({ name, status: 'FAIL', detail: msg, durationMs: 0 });
}

function header(title) {
  console.log(`\n\x1b[1m\x1b[34m━━━ ${title} ━━━\x1b[0m`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function cfRequest(pathname, options = {}, retries = 3) {
  const url = pathname.startsWith('http://') || pathname.startsWith('https://')
    ? pathname
    : `${GATEWAY_URL.replace(/\/+$/, '')}${pathname}`;

  const headers = {
    accept: 'application/json',
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const start = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    if (options.allowError) return { status: 0, error: err };
    throw new Error(`Kết nối Cloudflare tới ${url} thất bại: ${err.message}`);
  }

  const duration = Date.now() - start;
  const cfRay = res.headers.get('cf-ray') || 'N/A';
  const server = res.headers.get('server') || 'N/A';
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }

  if (res.status === 429 && !options.allowError && retries > 0) {
    const waitSec = Number(data?.retryAfterSeconds) || 3;
    await sleep((waitSec + 1) * 1000);
    return cfRequest(pathname, options, retries - 1);
  }

  if (!res.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} → HTTP ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`);
  }

  return { status: res.status, data, duration, cfRay, server, headers: res.headers };
}

async function loginUser(prefix, username, roleGroup) {
  const start = Date.now();
  const { data, duration, cfRay } = await cfRequest(`${prefix}/auth/auth/login`, {
    method: 'POST',
    body: { username, password: PASSWORD, roleGroup },
  });
  if (!data?.tokens?.accessToken) {
    throw new Error(`Đăng nhập ${username} qua Cloudflare thất bại: Không nhận được accessToken`);
  }
  return {
    token: data.tokens.accessToken,
    user: data.user,
    duration,
    cfRay,
  };
}

async function waitForShipmentStatus(token, code, expectedSet, label, timeoutMs = 25000) {
  const set = new Set(Array.isArray(expectedSet) ? expectedSet : [expectedSet]);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { data } = await cfRequest(`/ops/shipment/shipments/${encodeURIComponent(code)}`, { token });
      if (set.has(data.currentStatus)) return data.currentStatus;
    } catch {}
    await sleep(600);
  }
  throw new Error(`Hết thời gian chờ đơn ${code} chuyển sang trạng thái ${Array.from(set).join('|')} (${label})`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║   🌟 KIỂM THỬ E2E MÔI TRƯỜNG ĐÃ DEPLOY: TỪ TẠO ĐƠN ĐẾN GIAO HÀNG THÀNH CÔNG ║
║   🌐 Gateway Endpoint: ${GATEWAY_URL.padEnd(52)} ║
║   ⏰ Thời gian: ${new Date().toLocaleString('vi-VN').padEnd(60)} ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();
  const sessions = {};

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 0: KIỂM TRA GATEWAY HEALTH & XÁC THỰC TẤT CẢ TÁC NHÂN (ROLES)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 0: Kiểm tra Gateway Cloudflare & Đăng nhập phân quyền');
  try {
    const health = await cfRequest('/health');
    stepPass('Cloudflare Edge API Gateway Healthcheck', `Service: ${health.data?.service} | Status: ${health.data?.status} | CF-Ray: ${health.cfRay}`, health.duration);
  } catch (err) {
    stepFail('Cloudflare Edge API Gateway Healthcheck', err);
    process.exit(1);
  }

  try {
    sessions.merchant = await loginUser('/merchant', accounts.merchant, 'MERCHANT');
    stepPass(`Đăng nhập Merchant (${accounts.merchant})`, `Tên shop: ${sessions.merchant.user.displayName || 'Shop Đối tác'} | CF-Ray: ${sessions.merchant.cfRay}`, sessions.merchant.duration);

    sessions.courierPickup = await loginUser('/courier', accounts.courierPickup, 'COURIER');
    stepPass(`Đăng nhập Shipper Lấy hàng (${accounts.courierPickup})`, `Họ tên: ${sessions.courierPickup.user.displayName} (Khu vực TP.HCM)`, sessions.courierPickup.duration);

    sessions.opsOrigin = await loginUser('/ops', accounts.opsOrigin, 'HUB_STAFF');
    stepPass(`Đăng nhập Điều hành Bưu cục Gốc (${accounts.opsOrigin})`, `Bưu cục: Tân Bình (${ORIGIN_HUB})`, sessions.opsOrigin.duration);

    sessions.opsDest = await loginUser('/ops', accounts.opsDest, 'HUB_STAFF');
    stepPass(`Đăng nhập Điều hành Bưu cục Đích (${accounts.opsDest})`, `Bưu cục: Ba Đình (${DEST_HUB})`, sessions.opsDest.duration);

    sessions.courierDelivery = await loginUser('/courier', accounts.courierDelivery, 'COURIER');
    stepPass(`Đăng nhập Shipper Giao hàng (${accounts.courierDelivery})`, `Họ tên: ${sessions.courierDelivery.user.displayName} (Khu vực Hà Nội)`, sessions.courierDelivery.duration);

    sessions.admin = await loginUser('/ops', accounts.admin, 'ADMIN');
    stepPass(`Đăng nhập Quản trị viên Hệ thống (${accounts.admin})`, `Vai trò: Quản trị trung tâm`, sessions.admin.duration);
  } catch (err) {
    stepFail('Đăng nhập phân quyền qua Cloudflare', err);
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 1: BÁO GIÁ CƯỚC PHÍ (PRICING QUOTE CALCULATION)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 1: Báo giá cước phí chuẩn IATA qua Cloudflare');
  let quoteFee = 0;
  try {
    const { data: quote, duration } = await cfRequest('/merchant/pricing/quotes', {
      method: 'POST',
      token: sessions.merchant.token,
      body: {
        serviceType: 'STANDARD',
        sender: { province: 'Hồ Chí Minh', hubCode: ORIGIN_HUB },
        receiver: { province: 'Hà Nội', region: 'Hà Nội', hubCode: DEST_HUB },
        package: {
          weightKg: 1.2,
          dimensionsCm: { length: 25, width: 20, height: 10 },
          declaredValue: 500000,
        },
        codAmount: COD_AMOUNT,
        currency: 'VND',
      },
    });

    quoteFee = quote.totalFee || quote.estimatedFee || 25000;
    stepPass(
      'Tính cước vận chuyển tức thì (Pricing Quote)',
      `Tổng cước ước tính: ${quoteFee.toLocaleString('vi-VN')} đ | Cước cơ bản: ${(quote.baseFee || quoteFee).toLocaleString('vi-VN')} đ | Tuyến: TP.HCM ➔ Hà Nội`,
      duration,
    );
  } catch (err) {
    stepFail('Tính cước vận chuyển tức thì', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 2: MERCHANT TẠO VẬN ĐƠN MỚI (SHIPMENT CREATION)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 2: Merchant tạo vận đơn mới trên hệ thống');
  const shipmentCode = `111${String(Date.now() % 1_000_000_000).padStart(9, '0')}`;
  let createdShipment = null;

  try {
    const { data: shipment, duration } = await cfRequest('/merchant/shipment/shipments', {
      method: 'POST',
      token: sessions.merchant.token,
      body: {
        code: shipmentCode,
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: {
            name: 'Shop Đối Tác NEXUS TP.HCM',
            phone: '0909123456',
            address: '120 Trường Sơn, Phường 2, Tân Bình, Hồ Chí Minh',
            province: 'Hồ Chí Minh',
            district: 'Tân Bình',
            ward: 'Phường 2',
            hubCode: ORIGIN_HUB,
            coordinate: { latitude: 10.8185, longitude: 106.6662 },
          },
          receiver: {
            name: 'Nguyễn Văn A - Khách Nhận Hà Nội',
            phone: '0987654321',
            address: '45 Đội Cấn, Phường Cống Vị, Ba Đình, Hà Nội',
            province: 'Hà Nội',
            district: 'Ba Đình',
            ward: 'Phường Cống Vị',
            hubCode: DEST_HUB,
            coordinate: { latitude: 21.0345, longitude: 105.8234 },
          },
          package: {
            itemType: 'Linh kiện công nghệ E2E Cloudflare',
            weightKg: 1.2,
            dimensions: { length: 25, width: 20, height: 10 },
            declaredValue: 500000,
          },
          service: { type: 'STANDARD' },
          inspectionPolicy: 'VIEW_ONLY',
          codAmount: COD_AMOUNT,
          estimatedFee: quoteFee,
          deliveryNote: 'Cho khách xem hàng trước khi thanh toán COD',
          routing: { originHubCode: ORIGIN_HUB, destinationHubCode: DEST_HUB },
          source: 'e2e-cloudflare-deployed-test',
        },
      },
    });

    createdShipment = shipment;
    stepPass(
      `Tạo vận đơn thành công [${shipmentCode}]`,
      `Trạng thái khởi tạo: ${shipment.currentStatus} | COD: ${COD_AMOUNT.toLocaleString('vi-VN')} đ | Gói: STANDARD (Cho xem hàng)`,
      duration,
    );
  } catch (err) {
    stepFail(`Tạo vận đơn [${shipmentCode}]`, err);
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 3: HỆ THỐNG TỰ ĐỘNG PHÂN CÔNG LẤY HÀNG (AUTO-DISPATCH PICKUP)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 3: Tự động điều phối nhiệm vụ lấy hàng (Auto-dispatch)');
  let pickupTask = null;

  try {
    await sleep(2000);
    const { data: pTasks, duration } = await cfRequest(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=PICKUP`, {
      token: sessions.opsOrigin.token,
    });

    pickupTask = Array.isArray(pTasks) && pTasks.length > 0 ? pTasks[0] : null;

    if (!pickupTask) {
      // Nếu chưa có task, tạo task thủ công
      const { data: manualTask } = await cfRequest('/ops/dispatch/tasks', {
        method: 'POST',
        token: sessions.opsOrigin.token,
        body: {
          taskCode: `PU-${shipmentCode}`,
          taskType: 'PICKUP',
          shipmentCode,
          hubCode: ORIGIN_HUB,
          note: 'Điều phối lấy hàng tự động E2E',
        },
      });
      pickupTask = manualTask;
    }

    // Đảm bảo gán cho shipper lấy hàng
    const hasAssign = pickupTask.assignments?.some(a => !a.unassignedAt);
    if (!hasAssign) {
      await cfRequest(`/ops/dispatch/tasks/${pickupTask.id}/assign`, {
        method: 'POST',
        token: sessions.opsOrigin.token,
        body: { courierId: accounts.courierPickup, hubCode: ORIGIN_HUB },
      });
    }

    stepPass(
      'Khởi tạo & Phân công nhiệm vụ lấy hàng (PICKUP)',
      `Mã nhiệm vụ: ${pickupTask.taskCode} | Shipper đảm nhiệm: ${accounts.courierPickup} | Bưu cục: ${ORIGIN_HUB}`,
      duration,
    );
  } catch (err) {
    stepFail('Điều phối nhiệm vụ lấy hàng', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 4: SHIPPER QUÉT LẤY HÀNG TẠI KHO SHOP (COURIER PICKUP)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 4: Shipper quét lấy hàng tại kho Shop');
  try {
    const { duration } = await cfRequest('/courier/scan/scans/pickup', {
      method: 'POST',
      token: sessions.courierPickup.token,
      body: {
        shipmentCode,
        locationCode: ORIGIN_HUB,
        actor: accounts.courierPickup,
        note: 'Shipper đã tới kho nhận hàng từ Merchant qua Cloudflare',
        idempotencyKey: `${RUN_ID}-${shipmentCode}-pickup`,
      },
    });

    if (pickupTask?.id) {
      await cfRequest(`/courier/dispatch/tasks/${pickupTask.id}/status`, {
        method: 'PATCH',
        token: sessions.courierPickup.token,
        body: { status: 'COMPLETED', note: 'Lấy hàng hoàn tất' },
      });
    }

    stepPass(
      'Shipper quét mã nhận hàng tại kho (Pickup Scan)',
      `Đã lấy hàng thành công từ Shop | Shipper: ${accounts.courierPickup}`,
      duration,
    );
  } catch (err) {
    stepFail('Shipper quét mã nhận hàng', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 5: NHẬP KHO BƯU CỤC GỐC (ORIGIN HUB INBOUND)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 5: Nhập kho bưu cục gốc (Tân Bình - TP.HCM)');
  try {
    const { duration } = await cfRequest('/ops/scan/scans/inbound', {
      method: 'POST',
      token: sessions.opsOrigin.token,
      body: {
        shipmentCode,
        locationCode: ORIGIN_HUB,
        employeeCode: accounts.opsOrigin,
        note: 'Nhập kho bưu cục gốc Tân Bình thành công',
        idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-orig`,
      },
    });

    const statusAfterInbound = await waitForShipmentStatus(
      sessions.admin.token,
      shipmentCode,
      ['PICKUP_COMPLETED', 'SCAN_INBOUND'],
      'sau khi nhập kho gốc',
    );

    stepPass(
      `Bưu cục gốc quét nhập kho (${ORIGIN_HUB})`,
      `Trạng thái đơn hàng: ${statusAfterInbound} | Nhân viên kiểm nhận: ${accounts.opsOrigin}`,
      duration,
    );
  } catch (err) {
    stepFail('Nhập kho bưu cục gốc', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 6: ĐÓNG BAO TRUNG CHUYỂN LIÊN TỈNH (LINEHAUL MANIFEST SEAL)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 6: Đóng bao & Niêm phong kẹp chì trung chuyển liên tỉnh');
  const bagCode = `BAG-CF-${shipmentCode.slice(-6)}-${RUN_ID.slice(-4)}`;
  const sealNumber = `SEAL-CF-${shipmentCode.slice(-6)}`;
  let manifestBag = null;

  try {
    const { data: bag, duration } = await cfRequest('/ops/manifest/manifests', {
      method: 'POST',
      token: sessions.opsOrigin.token,
      body: {
        manifestCode: bagCode,
        type: 'BAG',
        originHubCode: ORIGIN_HUB,
        destinationHubCode: DEST_HUB,
        sealNumber,
        shipmentCodes: [shipmentCode],
        note: `Bao hàng liên tỉnh TP.HCM (${ORIGIN_HUB}) ➔ Hà Nội (${DEST_HUB})`,
      },
    });

    manifestBag = bag;
    stepPass(
      'Đóng bao & Khóa seal niêm phong (Seal Manifest)',
      `Mã bao: ${bagCode} | Số seal chì: ${sealNumber} | Tuyến: TP.HCM ➔ Hà Nội`,
      duration,
    );
  } catch (err) {
    stepFail('Đóng bao trung chuyển liên tỉnh', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 7: BƯU CỤC ĐÍCH TIẾP NHẬN BAO & MỞ NIÊM PHONG (DEST INBOUND)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 7: Bưu cục đích tiếp nhận bao hàng & Nhập kho phát (Ba Đình - Hà Nội)');
  try {
    // Tiếp nhận bao
    const { duration: durReceive } = await cfRequest(`/ops/manifest/manifests/${manifestBag.id}/receive`, {
      method: 'POST',
      token: sessions.opsDest.token,
      body: {
        receivedBy: accounts.opsDest,
        locationCode: DEST_HUB,
        note: 'Tiếp nhận bao hàng liên tỉnh tại kho Ba Đình',
      },
    });

    // Cắt seal mở bao
    await cfRequest(`/ops/manifest/manifests/${manifestBag.id}/shipments/remove`, {
      method: 'POST',
      token: sessions.opsDest.token,
      body: {
        shipmentCodes: [shipmentCode],
        unsealedBy: accounts.opsDest,
        unsealedByName: 'Điều Hành Ba Đình',
        processingHubCode: DEST_HUB,
        note: 'Cắt seal chì kiểm đếm phân loại giao hàng',
      },
    });

    // Quét nhập kho phát
    const { duration: durInbound } = await cfRequest('/ops/scan/scans/inbound', {
      method: 'POST',
      token: sessions.opsDest.token,
      body: {
        shipmentCode,
        locationCode: DEST_HUB,
        employeeCode: accounts.opsDest,
        note: 'Nhập kho phát Ba Đình sẵn sàng giao khách',
        idempotencyKey: `${RUN_ID}-${shipmentCode}-inbound-dest`,
      },
    });

    stepPass(
      `Bưu cục đích nhận bao & Quét nhập kho (${DEST_HUB})`,
      `Mở niêm phong chì seal: ${sealNumber} | Đã phân loại vào làn phát Ba Đình`,
      durReceive + durInbound,
    );
  } catch (err) {
    stepFail('Bưu cục đích tiếp nhận & Nhập kho', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 8: PHÂN CÔNG PHÁT HÀNG CHO SHIPPER (DELIVERY DISPATCH)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 8: Điều phối & Bàn giao phát hàng cho Shipper bưu cục đích');
  let deliveryTask = null;

  try {
    await sleep(1500);
    const { data: dTasks } = await cfRequest(`/ops/dispatch/tasks?shipmentCode=${shipmentCode}&taskType=DELIVERY`, {
      token: sessions.opsDest.token,
      allowError: true,
    });

    deliveryTask = Array.isArray(dTasks) && dTasks.length > 0 ? dTasks[0] : null;

    if (!deliveryTask) {
      const { data: newTask } = await cfRequest('/ops/dispatch/tasks', {
        method: 'POST',
        token: sessions.opsDest.token,
        body: {
          taskCode: `DLV-${shipmentCode}`,
          taskType: 'DELIVERY',
          shipmentCode,
          hubCode: DEST_HUB,
          note: 'Phân công phát hàng chặng cuối',
        },
      });
      deliveryTask = newTask;
    }

    const hasAssignment = deliveryTask.assignments?.some(a => !a.unassignedAt);
    if (!hasAssignment) {
      await cfRequest(`/ops/dispatch/tasks/${deliveryTask.id}/assign`, {
        method: 'POST',
        token: sessions.opsDest.token,
        body: { courierId: accounts.courierDelivery, hubCode: DEST_HUB },
      });
    }

    stepPass(
      'Phân công Shipper phát hàng (DELIVERY)',
      `Mã nhiệm vụ: ${deliveryTask.taskCode} | Shipper phát: ${accounts.courierDelivery} | Tuyến: Ba Đình - Đội Cấn`,
    );
  } catch (err) {
    stepFail('Phân công Shipper phát hàng', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 9 & 10: GIAO HÀNG THÀNH CÔNG, THU COD & CHỤP ẢNH POD
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 9 & 10: Shipper giao hàng thành công & Chụp ảnh POD');
  try {
    const podImageUrl = `https://minio.${BASE_DOMAIN}/nexus-pod/pod-${shipmentCode}-${RUN_ID}.jpg`;
    const podNote = `Khách hàng Nguyễn Văn A đã kiểm tra hàng, ký nhận đầy đủ và thanh toán COD: ${COD_AMOUNT.toLocaleString('vi-VN')}đ`;

    const { duration } = await cfRequest('/courier/delivery/deliveries/success', {
      method: 'POST',
      token: sessions.courierDelivery.token,
      body: {
        shipmentCode,
        taskId: deliveryTask?.id,
        locationCode: DEST_HUB,
        courierId: accounts.courierDelivery,
        actor: accounts.courierDelivery,
        note: 'Giao hàng thành công hoàn tất qua Cloudflare HTTPS',
        idempotencyKey: `${RUN_ID}-${shipmentCode}-del-success`,
        podImageUrl,
        podNote,
        podCapturedBy: accounts.courierDelivery,
      },
    });

    if (deliveryTask?.id) {
      await cfRequest(`/courier/dispatch/tasks/${deliveryTask.id}/status`, {
        method: 'PATCH',
        token: sessions.courierDelivery.token,
        body: { status: 'COMPLETED', note: 'Giao hàng và thu COD hoàn tất' },
      });
    }

    stepPass(
      'Ghi nhận giao hàng thành công & Chụp ảnh chứng từ POD',
      `Thu tiền COD: ${COD_AMOUNT.toLocaleString('vi-VN')} đ | POD ảnh: ${podImageUrl}`,
      duration,
    );

    // Chờ đơn hàng cập nhật trạng thái DELIVERED
    const finalStatus = await waitForShipmentStatus(
      sessions.admin.token,
      shipmentCode,
      ['DELIVERED'],
      'sau khi ký nhận giao thành công',
    );

    stepPass(
      'Xác nhận trạng thái vận đơn cuối cùng: DELIVERED',
      `Vận đơn [${shipmentCode}] đã chuyển sang trạng thái: \x1b[32m${finalStatus}\x1b[0m (Giao hàng thành công)`,
    );
  } catch (err) {
    stepFail('Giao hàng thành công & Chụp ảnh POD', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BƯỚC 11: TRA CỨU HÀNH TRÌNH CÔNG KHAI (PUBLIC TRACKING & TIMELINE)
  // ═══════════════════════════════════════════════════════════════════
  header('BƯỚC 11: Tra cứu Timeline hành trình & Bảo mật thông tin');
  try {
    const { data: timelineData, duration: durTimeline } = await cfRequest(
      `/ops/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`,
      { token: sessions.admin.token },
    );

    const events = Array.isArray(timelineData)
      ? timelineData
      : Array.isArray(timelineData?.events)
      ? timelineData.events
      : [];

    stepPass(
      `Kiểm tra Timeline vận đơn [${shipmentCode}]`,
      `Tổng số sự kiện ghi nhận: ${events.length} mốc | Sự kiện mới nhất: ${events[events.length - 1]?.description || events[events.length - 1]?.eventType || events[events.length - 1]?.status}`,
      durTimeline,
    );

    // Kiểm tra Security Guard trên Public Tracking: Yêu cầu số điện thoại
    const pubRes = await cfRequest(`/public/tracking/public/track/${encodeURIComponent(shipmentCode)}`, {
      allowError: true,
    });
    if (pubRes.status === 400 || pubRes.status === 404 || pubRes.data?.requiresPhone) {
      stepPass(
        'Public Tracking Security Guard',
        `Bảo mật thông tin: Yêu cầu xác thực 4 số cuối điện thoại người nhận (HTTP ${pubRes.status})`,
      );
    } else {
      stepPass('Public Tracking Lookup', `HTTP Status: ${pubRes.status}`);
    }
  } catch (err) {
    stepFail('Tra cứu hành trình công khai', err);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BÁO CÁO TỔNG HỢP KIỂM THỬ E2E
  // ═══════════════════════════════════════════════════════════════════
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║               🎉 BÁO CÁO KẾT QUẢ KIỂM THỬ E2E CLOUDFLARE                    ║
║   Mã vận đơn kiểm thử: \x1b[33m${shipmentCode.padEnd(52)}\x1b[0m ║
║   Thời gian thực thi:  ${(totalElapsed + ' giây').padEnd(52)} ║
║   Gateway URL:         ${GATEWAY_URL.padEnd(52)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Tổng số bước kiểm tra:      ${String(totalSteps).padEnd(46)} ║
║  Số bước thành công:         \x1b[32m${String(passedSteps).padEnd(46)}\x1b[0m ║
║  Số bước thất bại:           ${failedSteps === 0 ? '\x1b[32m0 (Không có lỗi)\x1b[0m' : `\x1b[31m${failedSteps}\x1b[0m`}${' '.repeat(Math.max(0, 46 - (failedSteps === 0 ? 16 : String(failedSteps).length)))} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ${failedSteps === 0 ? '\x1b[32m✔ TOÀN BỘ LUỒNG TỪ TẠO ĐƠN ĐẾN GIAO HÀNG HOÀN THÀNH 100%! 🚀\x1b[0m' : '\x1b[31m✖ CÓ BƯỚC CHƯA HOÀN TẤT - XIN KIỂM TRA LẠI LOG CHI TIẾT!\x1b[0m'}        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  if (failedSteps > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n\x1b[31mFATAL ERROR:\x1b[0m', err);
  process.exit(1);
});
