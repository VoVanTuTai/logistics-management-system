#!/usr/bin/env node

/**
 * BỘ KIỂM THỬ HỆ THỐNG MÔI TRƯỜNG CLOUDFLARE PRODUCTION / STAGING
 * ==============================================================
 * Kiểm tra toàn diện hệ thống logistics đang chạy qua Cloudflare:
 *
 * PHẦN 1: Kiểm tra kết nối Cloudflare Edge & Chứng chỉ SSL/TLS
 * PHẦN 2: Kiểm tra phân phối các Web App Frontend (SPA Bundles)
 * PHẦN 3: Kiểm tra API Gateway BFF & Định tuyến Microservices
 * PHẦN 4: Kiểm tra Xác thực & Phân quyền (Multi-Role Authentication)
 * PHẦN 5: Kiểm tra Luồng Nghiệp Vụ E2E Giao Nhận hoàn chỉnh qua HTTPS Cloudflare
 * PHẦN 6: Kiểm tra Tra cứu Công khai (Public Tracking) cho Khách hàng
 */

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'nexus-ex.site';
const GATEWAY_URL = process.env.GATEWAY_URL || `https://ops.${BASE_DOMAIN}`;
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

const subdomains = [
  { name: 'Ops Portal Web & API Gateway', url: `https://ops.${BASE_DOMAIN}`, type: 'APP_AND_API' },
  { name: 'Merchant Portal Web', url: `https://merchant.${BASE_DOMAIN}`, type: 'FRONTEND_APP' },
  { name: 'Admin Portal Web', url: `https://admin.${BASE_DOMAIN}`, type: 'FRONTEND_APP' },
  { name: 'Customer Portal Web', url: `https://customer.${BASE_DOMAIN}`, type: 'FRONTEND_APP' },
  { name: 'Public Tracking & Guest Portal', url: `https://tracking.${BASE_DOMAIN}`, type: 'FRONTEND_APP' },
  { name: 'MinIO S3 Storage API', url: `https://minio.${BASE_DOMAIN}`, type: 'STORAGE_API' },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function pass(name, detail = '') {
  totalTests++; passedTests++;
  console.log(`  \x1b[32m✔\x1b[0m ${name} ${detail ? `\x1b[90m(${detail})\x1b[0m` : ''}`);
  results.push({ name, status: 'PASS', detail });
}

function fail(name, err) {
  totalTests++; failedTests++;
  const msg = err?.message || String(err);
  console.error(`  \x1b[31m✖\x1b[0m ${name}`);
  console.error(`    \x1b[31m└─ ${msg}\x1b[0m`);
  results.push({ name, status: 'FAIL', detail: msg });
}

function info(msg) { console.log(`    \x1b[36mℹ\x1b[0m ${msg}`); }
function header(title) { console.log(`\n\x1b[1m\x1b[35m━━━ ${title} ━━━\x1b[0m`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    throw new Error(`Kết nối tới ${url} thất bại: ${err.message}`);
  }

  const duration = Date.now() - start;
  const cfRay = res.headers.get('cf-ray');
  const server = res.headers.get('server');
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

async function login(prefix, username, roleGroup) {
  const { data } = await cfRequest(`${prefix}/auth/auth/login`, {
    method: 'POST',
    body: { username, password: PASSWORD, roleGroup },
  });
  if (!data?.tokens?.accessToken) throw new Error(`Đăng nhập ${username} không có accessToken`);
  return { token: data.tokens.accessToken, user: data.user };
}

async function waitForStatus(token, code, expectedSet, label) {
  const set = new Set(Array.isArray(expectedSet) ? expectedSet : [expectedSet]);
  const start = Date.now();
  while (Date.now() - start < 20000) {
    try {
      const { data } = await cfRequest(`/ops/shipment/shipments/${encodeURIComponent(code)}`, { token });
      if (set.has(data.currentStatus)) return data.currentStatus;
    } catch {}
    await sleep(600);
  }
  throw new Error(`Hết thời gian chờ đơn ${code} chuyển sang ${Array.from(set).join('|')} (${label})`);
}

// ═══════════════════════════════════════════════════════════════════
// PHẦN 1: Kiểm Tra Cloudflare Edge & Chứng Chỉ SSL
// ═══════════════════════════════════════════════════════════════════

async function testCloudflareEdge() {
  header('PHẦN 1: Kiểm tra Kết nối Cloudflare Edge & SSL/TLS');

  for (const sub of subdomains) {
    try {
      const res = await cfRequest(sub.url, { allowError: true });
      const isCloudflare = res.server?.toLowerCase().includes('cloudflare') || !!res.cfRay;
      if (isCloudflare) {
        pass(`${sub.name}`, `Status: ${res.status} | Server: ${res.server} | CF-Ray: ${res.cfRay || 'OK'} | ${res.duration}ms`);
      } else {
        fail(`${sub.name}`, new Error(`Không phản hồi qua Cloudflare Edge (Server: ${res.server})`));
      }
    } catch (e) {
      fail(`${sub.name} (${sub.url})`, e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHẦN 2: Kiểm Tra Frontend SPAs (Giao diện Web)
// ═══════════════════════════════════════════════════════════════════

async function testFrontendApps() {
  header('PHẦN 2: Kiểm tra Phân Phối Frontend Web Applications (Vite React)');

  const webApps = [
    { name: 'NEXUS Ops Web', url: `https://ops.${BASE_DOMAIN}`, match: 'Ops' },
    { name: 'NEXUS Merchant Web', url: `https://merchant.${BASE_DOMAIN}`, match: 'Merchant' },
    { name: 'NEXUS Admin Web', url: `https://admin.${BASE_DOMAIN}`, match: 'Admin' },
    { name: 'NEXUS Customer Web', url: `https://customer.${BASE_DOMAIN}`, match: 'Customer' },
    { name: 'NEXUS Public Tracking', url: `https://tracking.${BASE_DOMAIN}`, match: 'Nexus' },
  ];

  for (const app of webApps) {
    try {
      const res = await fetch(app.url);
      const html = await res.text();
      const hasDoctype = html.toLowerCase().includes('<!doctype html>');
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Không rõ';

      if (res.status === 200 && hasDoctype) {
        pass(`${app.name} (${app.url})`, `Title: "${title}" | Size: ${(html.length / 1024).toFixed(1)} KB`);
      } else {
        fail(`${app.name}`, new Error(`HTTP ${res.status}, không có DOCTYPE hợp lệ`));
      }
    } catch (e) {
      fail(`${app.name}`, e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHẦN 3 & 4: Kiểm Tra API Gateway & Đăng Nhập Multi-Role
// ═══════════════════════════════════════════════════════════════════

async function testApiGatewayAndAuth() {
  header('PHẦN 3 & 4: Kiểm tra Gateway BFF & Xác thực Phân quyền (RBAC)');

  // 1. Health check
  try {
    const { data, duration } = await cfRequest('/health');
    if (data?.status === 'ok') {
      pass('Gateway BFF /health', `Status: ${data.status} | Dịch vụ: ${data.service} | ${duration}ms`);
    } else {
      fail('Gateway BFF /health', new Error(`Dữ liệu không hợp lệ: ${JSON.stringify(data)}`));
    }
  } catch (e) { fail('Gateway BFF /health', e); }

  const sessions = {};

  // 2. Multi-role logins
  const roles = [
    { key: 'admin', prefix: '/ops', user: accounts.admin, group: 'OPS', label: 'Admin Tổng Quản trị' },
    { key: 'merchant', prefix: '/merchant', user: accounts.merchant, group: 'MERCHANT', label: 'Chủ shop Merchant' },
    { key: 'opsOrigin', prefix: '/ops', user: accounts.opsOrigin, group: 'OPS', label: 'Điều hành Hub Miền Nam' },
    { key: 'opsDest', prefix: '/ops', user: accounts.opsDest, group: 'OPS', label: 'Điều hành Hub Miền Bắc' },
    { key: 'courierPickup', prefix: '/courier', user: accounts.courierPickup, group: 'COURIER_APP', label: 'Shipper Lấy hàng' },
    { key: 'courierDelivery', prefix: '/courier', user: accounts.courierDelivery, group: 'COURIER_APP', label: 'Shipper Giao hàng' },
  ];

  for (const r of roles) {
    try {
      const session = await login(r.prefix, r.user, r.group);
      sessions[r.key] = session;
      pass(`Đăng nhập ${r.label} (${r.user})`, `Tên: ${session.user?.displayName || 'OK'}`);
    } catch (e) {
      fail(`Đăng nhập ${r.label} (${r.user})`, e);
    }
  }

  // 3. Kiểm tra Masterdata API qua Cloudflare
  try {
    const { data: hubs } = await cfRequest('/ops/masterdata/hubs', { token: sessions.admin?.token });
    const count = Array.isArray(hubs) ? hubs.length : (hubs?.items?.length || 0);
    if (count > 0) {
      pass(`Masterdata Hubs API (${count} bưu cục toàn quốc)`, `Hà Nội, TP.HCM, Đà Nẵng...`);
    } else {
      fail('Masterdata Hubs API', new Error('Danh sách bưu cục rỗng'));
    }
  } catch (e) { fail('Masterdata Hubs API qua Cloudflare', e); }

  return sessions;
}

// ═══════════════════════════════════════════════════════════════════
// PHẦN 5: Luồng Nghiệp Vụ E2E Hoàn Chỉnh Qua Cloudflare HTTPS
// ═══════════════════════════════════════════════════════════════════

async function testFullLogisticsFlow(sessions) {
  header('PHẦN 5: Kiểm tra Luồng Giao Nhận E2E Thực Tế qua Cloudflare HTTPS');

  const originHub = '003S001';
  const destHub = '001N001';
  const code = `111${String(Date.now() % 1_000_000_000).padStart(9, '0')}`;

  try {
    // 1. Merchant tạo đơn hàng
    const { data: shipment } = await cfRequest('/merchant/shipment/shipments', {
      method: 'POST',
      token: sessions.merchant.token,
      body: {
        code,
        metadata: {
          createdBy: { username: accounts.merchant, userId: accounts.merchant },
          sender: {
            name: 'Cloudflare Merchant Sender', phone: '0909123456',
            address: '120 Trường Sơn, Tân Bình, Hồ Chí Minh',
            province: 'Hồ Chí Minh', district: 'Tân Bình', ward: 'Phường 2',
            hubCode: originHub,
          },
          receiver: {
            name: 'Cloudflare Customer Receiver', phone: '0987654321',
            address: '45 Đội Cấn, Ba Đình, Hà Nội',
            province: 'Hà Nội', district: 'Ba Đình', ward: 'Phường Cống Vị',
            hubCode: destHub,
          },
          package: { itemType: 'Tài liệu Cloudflare E2E', weightKg: 0.8, declaredValue: 200000 },
          service: { type: 'STANDARD' },
          codAmount: 200000,
          routing: { originHubCode: originHub, destinationHubCode: destHub },
          source: 'cloudflare-e2e-suite',
        },
      },
    });
    pass(`Tạo vận đơn ${code} qua Cloudflare HTTPS`, `Trạng thái: ${shipment.currentStatus}`);

    // 2. Chờ hệ thống tự động gán nhiệm vụ lấy hàng (Auto-dispatch)
    await sleep(2000);
    const { data: pTasks } = await cfRequest(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=PICKUP`, {
      token: sessions.opsOrigin.token,
    });
    const pickupTask = pTasks?.[0];
    if (pickupTask) {
      pass(`Auto-dispatch PICKUP task`, `Mã task: ${pickupTask.taskCode} | Trạng thái: ${pickupTask.status}`);
    } else {
      fail(`Auto-dispatch PICKUP task`, new Error('Không tìm thấy task PICKUP'));
    }

    // 3. Shipper quét lấy hàng
    await cfRequest('/courier/scan/scans/pickup', {
      method: 'POST',
      token: sessions.courierPickup.token,
      body: {
        shipmentCode: code,
        locationCode: originHub,
        actor: accounts.courierPickup,
        note: 'Cloudflare E2E Pickup scan',
        idempotencyKey: `${RUN_ID}-${code}-cf-pickup`,
      },
    });
    if (pickupTask?.id) {
      await cfRequest(`/courier/dispatch/tasks/${pickupTask.id}/status`, {
        method: 'PATCH',
        token: sessions.courierPickup.token,
        body: { status: 'COMPLETED', note: 'Lấy hàng hoàn tất' },
      });
    }
    pass(`Shipper quét lấy hàng thành công`);

    // 4. Nhập kho gốc
    await cfRequest('/ops/scan/scans/inbound', {
      method: 'POST',
      token: sessions.opsOrigin.token,
      body: {
        shipmentCode: code,
        locationCode: originHub,
        employeeCode: accounts.opsOrigin,
        note: 'Cloudflare Inbound Kho gốc',
        idempotencyKey: `${RUN_ID}-${code}-cf-inbound-orig`,
      },
    });
    const stInbound = await waitForStatus(sessions.admin.token, code, ['PICKUP_COMPLETED', 'SCAN_INBOUND'], 'nhập kho gốc');
    pass(`Nhập kho gốc ${originHub} → ${stInbound}`);

    // 5. Đóng bao trung chuyển liên tỉnh & Unseal tại kho đích
    const bagCode = `BAG-CF-${code.slice(-6)}-${RUN_ID}`;
    const { data: bag } = await cfRequest('/ops/manifest/manifests', {
      method: 'POST',
      token: sessions.opsOrigin.token,
      body: {
        manifestCode: bagCode,
        type: 'BAG',
        originHubCode: originHub,
        destinationHubCode: destHub,
        sealNumber: `SEAL-CF-${code.slice(-6)}`,
        shipmentCodes: [code],
        note: `Liên tỉnh ${originHub} → ${destHub}`,
      },
    });
    await cfRequest(`/ops/manifest/manifests/${bag.id}/receive`, {
      method: 'POST',
      token: sessions.opsDest.token,
      body: { receivedBy: accounts.opsDest, locationCode: destHub, note: 'Nhận bao tại kho đích' },
    });
    await cfRequest(`/ops/manifest/manifests/${bag.id}/shipments/remove`, {
      method: 'POST',
      token: sessions.opsDest.token,
      body: {
        shipmentCodes: [code],
        unsealedBy: accounts.opsDest,
        unsealedByName: 'Ops Dest',
        processingHubCode: destHub,
        note: 'Mở bao phân loại',
      },
    });
    await cfRequest('/ops/scan/scans/inbound', {
      method: 'POST',
      token: sessions.opsDest.token,
      body: {
        shipmentCode: code,
        locationCode: destHub,
        employeeCode: accounts.opsDest,
        note: 'Nhập kho đích hoàn tất',
        idempotencyKey: `${RUN_ID}-${code}-cf-inbound-dest`,
      },
    });
    pass(`Trung chuyển liên tỉnh & Nhập kho đích ${destHub}`);

    // 6. Điều phối phát hàng & Courier ký nhận giao thành công
    await sleep(2000);
    const { data: dTasks } = await cfRequest(`/ops/dispatch/tasks?shipmentCode=${code}&taskType=DELIVERY`, {
      token: sessions.opsDest.token,
      allowError: true,
    });
    let deliveryTask = Array.isArray(dTasks) && dTasks.length > 0 ? dTasks[0] : null;
    if (!deliveryTask) {
      const { data: newTask } = await cfRequest('/ops/dispatch/tasks', {
        method: 'POST',
        token: sessions.opsDest.token,
        body: {
          taskCode: `DLV-CF-${code}`,
          taskType: 'DELIVERY',
          shipmentCode: code,
          hubCode: destHub,
          note: 'Tạo điều phối phát hàng',
        },
      });
      deliveryTask = newTask;
    }
    const dAssignment = deliveryTask.assignments?.find(a => !a.unassignedAt) || deliveryTask.assignments?.[0];
    if (!dAssignment) {
      await cfRequest(`/ops/dispatch/tasks/${deliveryTask.id}/assign`, {
        method: 'POST',
        token: sessions.opsDest.token,
        body: { courierId: accounts.courierDelivery, hubCode: destHub },
      });
    }

    await cfRequest('/courier/delivery/deliveries/success', {
      method: 'POST',
      token: sessions.courierDelivery.token,
      body: {
        shipmentCode: code,
        taskId: deliveryTask?.id,
        locationCode: destHub,
        courierId: accounts.courierDelivery,
        actor: accounts.courierDelivery,
        note: 'Giao hàng thành công qua Cloudflare',
        idempotencyKey: `${RUN_ID}-${code}-cf-del-ok`,
        podNote: 'Người nhận đã ký nhận đầy đủ',
        podCapturedBy: accounts.courierDelivery,
      },
    });
    if (deliveryTask?.id) {
      await cfRequest(`/courier/dispatch/tasks/${deliveryTask.id}/status`, {
        method: 'PATCH',
        token: sessions.courierDelivery.token,
        body: { status: 'COMPLETED', note: 'Giao xong' },
      });
    }

    const stFinal = await waitForStatus(sessions.admin.token, code, ['DELIVERED'], 'giao hàng thành công');
    pass(`Giao hàng thành công hoàn tất → ${stFinal}`);

    return code;
  } catch (e) {
    fail(`Luồng E2E Giao Nhận qua Cloudflare (${code})`, e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHẦN 6: Kiểm Tra Tra Cứu Công Khai (Public Tracking Portal)
// ═══════════════════════════════════════════════════════════════════

async function testPublicTracking(sessions, code) {
  header('PHẦN 6: Kiểm tra Tra cứu Timeline & Bảo mật Tra cứu Công khai');

  if (!code) {
    fail('Tra cứu hành trình', new Error('Không có mã vận đơn từ luồng trước'));
    return;
  }

  // 1. Kiểm tra Timeline chi tiết qua Cloudflare
  try {
    const { data: timeline } = await cfRequest(`/ops/tracking/tracking/${encodeURIComponent(code)}/timeline`, {
      token: sessions.admin?.token,
    });
    const events = Array.isArray(timeline) ? timeline : [];
    if (events.length > 0) {
      pass(`Tra cứu Timeline Vận đơn ${code} qua Cloudflare (${events.length} sự kiện)`, `Mới nhất: ${events[events.length - 1]?.eventType || events[events.length - 1]?.eventTypeCode || 'DELIVERED'}`);
    } else {
      fail(`Tra cứu Timeline Vận đơn ${code}`, new Error('Timeline không có sự kiện'));
    }
  } catch (e) {
    fail(`Tra cứu Timeline vận đơn ${code} qua Cloudflare`, e);
  }

  // 2. Kiểm tra Public Tracking API (kiểm tra xác thực số điện thoại)
  try {
    const { status } = await cfRequest(`/public/tracking/public/track/${encodeURIComponent(code)}`, { allowError: true });
    if (status === 400 || status === 404) {
      pass(`Public Tracking Security Guard (${code})`, `Bảo mật thông tin: Yêu cầu SĐT người nhận (HTTP ${status})`);
    } else {
      fail(`Public Tracking Security Guard (${code})`, new Error(`HTTP ${status} không mong muốn`));
    }
  } catch (e) {
    fail(`Public Tracking Security Guard (${code})`, e);
  }
}

// ═══════════════════════════════════════════════════════════════════
// BÁO CÁO TỔNG HỢP
// ═══════════════════════════════════════════════════════════════════

function printSummary() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║       🌐 BÁO CÁO KIỂM THỬ HỆ THỐNG MÔI TRƯỜNG CLOUDFLARE           ║');
  console.log(`║       ⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}                           ║`);
  console.log(`║       🔗 Domain gốc: ${BASE_DOMAIN.padEnd(46)}║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Tổng số kiểm tra:    ${String(totalTests).padStart(3)}                                            ║`);
  console.log(`║  \x1b[32mThành công:           ${String(passedTests).padStart(3)}\x1b[0m                                            ║`);
  console.log(`║  \x1b[31mThất bại:             ${String(failedTests).padStart(3)}\x1b[0m                                            ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');

  if (failedTests === 0) {
    console.log('║  \x1b[32m✔ TẤT CẢ DỊCH VỤ HOẠT ĐỘNG HOÀN HẢO QUA CLOUDFLARE! 🚀\x1b[0m            ║');
  } else {
    console.log('║  \x1b[31m✖ CÓ HẠNG MỤC CHƯA ĐẠT - HÃY KIỂM TRA LẠI CẤU HÌNH CLOUDFLARE!\x1b[0m    ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 KHỞI ĐỘNG KIỂM THỬ HỆ THỐNG QUA MÔI TRƯỜNG CLOUDFLARE           ║');
  console.log(`║   📍 Gateway: ${GATEWAY_URL.padEnd(54)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  await testCloudflareEdge();
  await testFrontendApps();
  const sessions = await testApiGatewayAndAuth();
  const shipmentCode = await testFullLogisticsFlow(sessions);
  await testPublicTracking(sessions, shipmentCode);

  printSummary();
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\x1b[31m LỖI KHỞI ĐỘNG:\x1b[0m', err);
  process.exit(1);
});
