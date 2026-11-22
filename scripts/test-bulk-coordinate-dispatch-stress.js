#!/usr/bin/env node

/**
 * BỘ KIỂM THỬ SỐ LƯỢNG LỚN (HIGH-VOLUME & STRESS TEST):
 * TỌA ĐỘ GPS ĐƠN HÀNG & THUẬT TOÁN ĐIỀU PHỐI ĐÚNG SHIPPER TRÊN TOÀN QUỐC
 * =====================================================================
 * Quy mô kiểm thử:
 * - 22 Tuyến vận hành × 3 Đơn hàng ngẫu nhiên = 66 ĐƠN HÀNG THỰC TẾ
 * - Trải rộng 3 trung tâm kinh tế: Hà Nội (8 tuyến), Đà Nẵng (6 tuyến), TP.HCM (8 tuyến)
 * - Tọa độ GPS sinh ngẫu nhiên bên trong đa giác Geofence (Point-in-Polygon)
 * - Gửi song song theo Batch kiểm tra khả năng chịu tải (Concurrent Throughput)
 * - Đo lường độ trễ (Latency p50, p95, max) và đối soát 100% kết quả phân công Shipper
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

// 22 VÙNG GEOFENCE PHÂN VÙNG VẬN HÀNH TOÀN QUỐC
const ALL_COURIER_ZONES = [
  // HÀ NỘI — 4 Phường × 2 Tuyến = 8 Couriers
  {
    courierId: '30002001', province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'P. Hàng Bài', hubCode: '001N001',
    zoneName: 'Hoàn Kiếm A - Bắc Hàng Bài',
    bounds: { minLat: 21.0185, maxLat: 21.025, minLng: 105.847, maxLng: 105.858 },
    boundaryPolygon: [[21.0185,105.847],[21.025,105.847],[21.025,105.858],[21.0185,105.858],[21.0185,105.847]],
  },
  {
    courierId: '30002002', province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'P. Hàng Bài', hubCode: '001N001',
    zoneName: 'Hoàn Kiếm B - Nam Hàng Bài',
    bounds: { minLat: 21.012, maxLat: 21.0185, minLng: 105.847, maxLng: 105.858 },
    boundaryPolygon: [[21.012,105.847],[21.0185,105.847],[21.0185,105.858],[21.012,105.858],[21.012,105.847]],
  },
  {
    courierId: '30002003', province: 'Hà Nội', district: 'Ba Đình', ward: 'P. Kim Mã', hubCode: '001N001',
    zoneName: 'Ba Đình A - Đông Kim Mã',
    bounds: { minLat: 21.025, maxLat: 21.038, minLng: 105.824, maxLng: 105.831 },
    boundaryPolygon: [[21.025,105.824],[21.038,105.824],[21.038,105.831],[21.025,105.831],[21.025,105.824]],
  },
  {
    courierId: '30002004', province: 'Hà Nội', district: 'Ba Đình', ward: 'P. Kim Mã', hubCode: '001N001',
    zoneName: 'Ba Đình B - Tây Kim Mã',
    bounds: { minLat: 21.025, maxLat: 21.038, minLng: 105.817, maxLng: 105.824 },
    boundaryPolygon: [[21.025,105.817],[21.038,105.817],[21.038,105.824],[21.025,105.824],[21.025,105.817]],
  },
  {
    courierId: '30002005', province: 'Hà Nội', district: 'Cầu Giấy', ward: 'P. Dịch Vọng', hubCode: '001N001',
    zoneName: 'Cầu Giấy A - Bắc Dịch Vọng',
    bounds: { minLat: 21.0335, maxLat: 21.042, minLng: 105.787, maxLng: 105.804 },
    boundaryPolygon: [[21.0335,105.787],[21.042,105.787],[21.042,105.804],[21.0335,105.804],[21.0335,105.787]],
  },
  {
    courierId: '30002006', province: 'Hà Nội', district: 'Cầu Giấy', ward: 'P. Dịch Vọng', hubCode: '001N001',
    zoneName: 'Cầu Giấy B - Nam Dịch Vọng',
    bounds: { minLat: 21.025, maxLat: 21.0335, minLng: 105.787, maxLng: 105.804 },
    boundaryPolygon: [[21.025,105.787],[21.0335,105.787],[21.0335,105.804],[21.025,105.804],[21.025,105.787]],
  },
  {
    courierId: '30002007', province: 'Hà Nội', district: 'Đống Đa', ward: 'P. Trung Liệt', hubCode: '001N001',
    zoneName: 'Đống Đa A - Đông Thái Hà',
    bounds: { minLat: 21.007, maxLat: 21.020, minLng: 105.8185, maxLng: 105.826 },
    boundaryPolygon: [[21.007,105.8185],[21.020,105.8185],[21.020,105.826],[21.007,105.826],[21.007,105.8185]],
  },
  {
    courierId: '30002008', province: 'Hà Nội', district: 'Đống Đa', ward: 'P. Trung Liệt', hubCode: '001N001',
    zoneName: 'Đống Đa B - Tây Thái Hà',
    bounds: { minLat: 21.007, maxLat: 21.020, minLng: 105.811, maxLng: 105.8185 },
    boundaryPolygon: [[21.007,105.811],[21.020,105.811],[21.020,105.8185],[21.007,105.8185],[21.007,105.811]],
  },

  // ĐÀ NẴNG — 3 Phường × 2 Tuyến = 6 Couriers
  {
    courierId: '30002009', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thạch Thang', hubCode: '002C001',
    zoneName: 'Hải Châu A - Bắc Bạch Đằng',
    bounds: { minLat: 16.0745, maxLat: 16.082, minLng: 108.217, maxLng: 108.229 },
    boundaryPolygon: [[16.0745,108.217],[16.082,108.217],[16.082,108.229],[16.0745,108.229],[16.0745,108.217]],
  },
  {
    courierId: '30002010', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thạch Thang', hubCode: '002C001',
    zoneName: 'Hải Châu B - Nam Bạch Đằng',
    bounds: { minLat: 16.067, maxLat: 16.0745, minLng: 108.217, maxLng: 108.229 },
    boundaryPolygon: [[16.067,108.217],[16.0745,108.217],[16.0745,108.229],[16.067,108.229],[16.067,108.217]],
  },
  {
    courierId: '30002011', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thanh Bình', hubCode: '002C001',
    zoneName: 'Thanh Bình A - Đông',
    bounds: { minLat: 16.057, maxLat: 16.071, minLng: 108.2105, maxLng: 108.218 },
    boundaryPolygon: [[16.057,108.2105],[16.071,108.2105],[16.071,108.218],[16.057,108.218],[16.057,108.2105]],
  },
  {
    courierId: '30002012', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thanh Bình', hubCode: '002C001',
    zoneName: 'Thanh Bình B - Tây',
    bounds: { minLat: 16.057, maxLat: 16.071, minLng: 108.203, maxLng: 108.2105 },
    boundaryPolygon: [[16.057,108.203],[16.071,108.203],[16.071,108.2105],[16.057,108.2105],[16.057,108.203]],
  },
  {
    courierId: '30002013', province: 'Đà Nẵng', district: 'Sơn Trà', ward: 'P. An Hải Bắc', hubCode: '002C001',
    zoneName: 'Sơn Trà A - Bắc Sông Hàn',
    bounds: { minLat: 16.079, maxLat: 16.086, minLng: 108.230, maxLng: 108.244 },
    boundaryPolygon: [[16.079,108.230],[16.086,108.230],[16.086,108.244],[16.079,108.244],[16.079,108.230]],
  },
  {
    courierId: '30002014', province: 'Đà Nẵng', district: 'Sơn Trà', ward: 'P. An Hải Bắc', hubCode: '002C001',
    zoneName: 'Sơn Trà B - Nam Sông Hàn',
    bounds: { minLat: 16.072, maxLat: 16.079, minLng: 108.230, maxLng: 108.244 },
    boundaryPolygon: [[16.072,108.230],[16.079,108.230],[16.079,108.244],[16.072,108.244],[16.072,108.230]],
  },

  // TP.HCM — 4 Phường × 2 Tuyến = 8 Couriers
  {
    courierId: '30002015', province: 'TP.HCM', district: 'Quận 1', ward: 'P. Bến Thành', hubCode: '003S001',
    zoneName: 'Q1 A - Đông Chợ Bến Thành',
    bounds: { minLat: 10.765, maxLat: 10.779, minLng: 106.693, maxLng: 106.699 },
    boundaryPolygon: [[10.765,106.693],[10.779,106.693],[10.779,106.699],[10.765,106.699],[10.765,106.693]],
  },
  {
    courierId: '30002016', province: 'TP.HCM', district: 'Quận 1', ward: 'P. Bến Thành', hubCode: '003S001',
    zoneName: 'Q1 B - Tây Chợ Bến Thành',
    bounds: { minLat: 10.765, maxLat: 10.779, minLng: 106.687, maxLng: 106.693 },
    boundaryPolygon: [[10.765,106.687],[10.779,106.687],[10.779,106.693],[10.765,106.693],[10.765,106.687]],
  },
  {
    courierId: '30002017', province: 'TP.HCM', district: 'Quận 3', ward: 'Phường 13', hubCode: '003S001',
    zoneName: 'Q3 A - Bắc Lê Văn Sỹ',
    bounds: { minLat: 10.7885, maxLat: 10.795, minLng: 106.671, maxLng: 106.684 },
    boundaryPolygon: [[10.7885,106.671],[10.795,106.671],[10.795,106.684],[10.7885,106.684],[10.7885,106.671]],
  },
  {
    courierId: '30002018', province: 'TP.HCM', district: 'Quận 3', ward: 'Phường 13', hubCode: '003S001',
    zoneName: 'Q3 B - Nam Lê Văn Sỹ',
    bounds: { minLat: 10.782, maxLat: 10.7885, minLng: 106.671, maxLng: 106.684 },
    boundaryPolygon: [[10.782,106.671],[10.7885,106.671],[10.7885,106.684],[10.782,106.684],[10.782,106.671]],
  },
  {
    courierId: '30002019', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 13', hubCode: '003S001',
    zoneName: 'Tân Bình A - Đông Cộng Hòa',
    bounds: { minLat: 10.794, maxLat: 10.815, minLng: 106.644, maxLng: 106.655 },
    boundaryPolygon: [[10.794,106.644],[10.815,106.644],[10.815,106.655],[10.794,106.655],[10.794,106.644]],
  },
  {
    courierId: '30002020', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 13', hubCode: '003S001',
    zoneName: 'Tân Bình B - Tây Cộng Hòa',
    bounds: { minLat: 10.794, maxLat: 10.815, minLng: 106.633, maxLng: 106.644 },
    boundaryPolygon: [[10.794,106.633],[10.815,106.633],[10.815,106.644],[10.794,106.644],[10.794,106.633]],
  },
  {
    courierId: '30002021', province: 'TP.HCM', district: 'Quận 12', ward: 'P. An Phú Đông', hubCode: '003S001',
    zoneName: 'Q12 A - Bắc Hà Huy Giáp',
    bounds: { minLat: 10.8675, maxLat: 10.885, minLng: 106.683, maxLng: 106.715 },
    boundaryPolygon: [[10.8675,106.683],[10.885,106.683],[10.885,106.715],[10.8675,106.715],[10.8675,106.683]],
  },
  {
    courierId: '30002022', province: 'TP.HCM', district: 'Quận 12', ward: 'P. An Phú Đông', hubCode: '003S001',
    zoneName: 'Q12 B - Nam Hà Huy Giáp',
    bounds: { minLat: 10.850, maxLat: 10.8675, minLng: 106.683, maxLng: 106.715 },
    boundaryPolygon: [[10.850,106.683],[10.8675,106.683],[10.8675,106.715],[10.850,106.715],[10.850,106.683]],
  },
];

function getRandomPointInBounds(bounds) {
  // Lấy toạ độ an toàn trong khoảng 20% đến 80% biên độ để đảm bảo nằm gọn trong polygon
  const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * (0.2 + Math.random() * 0.6);
  const lng = bounds.minLng + (bounds.maxLng - bounds.minLng) * (0.2 + Math.random() * 0.6);
  return { latitude: Number(lat.toFixed(5)), longitude: Number(lng.toFixed(5)) };
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

async function runBulkStressSuite() {
  console.log(`
${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗
║   🚀 BỘ KIỂM THỬ SỐ LƯỢNG LỚN (HIGH-VOLUME & STRESS TEST): 22 TUYẾN TOÀN QUỐC ║
║   ⏰ Mã phiên: ${RUN_ID.padEnd(61)} ║
╚══════════════════════════════════════════════════════════════════════════════╝${RESET}
`);

  // 1. ĐĂNG NHẬP
  console.log(`${BOLD}━━━ BƯỚC 1: XÁC THỰC CÁC TÁC NHÂN ━━━${RESET}`);
  const adminSession = await loginUser('/ops', '10000001', 'OPS');
  const merchantSession = await loginUser('/merchant', '41100001', 'MERCHANT');
  console.log(`  ${GREEN}✔ Đăng nhập thành công Admin & Merchant Session!${RESET}\n`);

  // 2. ĐỒNG BỘ TOÀN BỘ 22 GEOFENCE
  console.log(`${BOLD}━━━ BƯỚC 2: ĐỒNG BỘ & KÍCH HOẠT 22 TUYẾN GEOFENCE TRÊN MASTERDATA ━━━${RESET}`);
  for (const zone of ALL_COURIER_ZONES) {
    await apiRequest('/ops/masterdata/courier-area-assignments', {
      method: 'POST',
      token: adminSession.token,
      body: {
        hubCode: zone.hubCode,
        courierId: zone.courierId,
        province: zone.province,
        district: zone.district,
        ward: zone.ward,
        zoneName: zone.zoneName,
        boundaryPolygon: zone.boundaryPolygon,
        isActive: true,
      },
    });
  }
  console.log(`  ${GREEN}✔ Đã đồng bộ 22 vùng geofence (Zero-Overlap) cho 22 Shipper.${RESET}\n`);

  // 3. SINH 66 ĐƠN HÀNG (MỖI COURIER 3 ĐƠN NGẪU NHIÊN TRONG ĐA GIÁC)
  const ORDERS_PER_ZONE = 3;
  const totalOrdersToTest = ALL_COURIER_ZONES.length * ORDERS_PER_ZONE;

  console.log(`${BOLD}━━━ BƯỚC 3: TẠO SỐ LƯỢNG LỚN ${totalOrdersToTest} ĐƠN HÀNG VỚI TỌA ĐỘ GPS NGẪU NHIÊN ━━━${RESET}`);
  console.log(`  ${DIM}Mỗi tuyến vận hành sinh ngẫu nhiên ${ORDERS_PER_ZONE} đơn hàng tại các tọa độ khác nhau bên trong Geofence...${RESET}\n`);

  const orderJobs = [];
  let orderIndex = 0;

  for (const zone of ALL_COURIER_ZONES) {
    for (let j = 0; j < ORDERS_PER_ZONE; j++) {
      orderIndex++;
      const point = getRandomPointInBounds(zone.bounds);
      const baseNum = (Date.now() + orderIndex * 137) % 1_000_000_000;
      const waybillCode = `111${String(baseNum).padStart(9, '0')}`;

      orderJobs.push({
        index: orderIndex,
        zone,
        waybillCode,
        point,
        expectedCourier: zone.courierId,
      });
    }
  }

  // 4. THỰC THI GỬI ĐƠN HÀNG THEO BATCH CONCURRENCY (5 requests song song)
  const CONCURRENCY = 5;
  const results = [];
  const latencies = [];
  const startTime = Date.now();

  console.log(`${DIM}┌──────┬──────────────┬─────────────┬──────────────────────────┬─────────────────────────────┬──────────────┬────────┬──────────┐${RESET}`);
  console.log(`${DIM}│ STT  │ Mã Vận Đơn   │ Khu Vực     │ Tọa Độ GPS (Lấy Hàng)    │ Tuyến Phụ Trách             │ Shipper Gán  │ Kết Quả│ Độ Trễ   │${RESET}`);
  console.log(`${DIM}├──────┼──────────────┼─────────────┼──────────────────────────┼─────────────────────────────┼──────────────┼────────┼──────────┤${RESET}`);

  // Hàm xử lý 1 đơn hàng trọn gói
  async function processOrderJob(job) {
    const jobStart = Date.now();
    const { index, zone, waybillCode, point, expectedCourier } = job;

    try {
      // A. Tạo đơn hàng với tọa độ GPS
      const createRes = await apiRequest('/merchant/shipment/shipments', {
        method: 'POST',
        token: merchantSession.token,
        body: {
          code: waybillCode,
          pickupLatitude: point.latitude,
          pickupLongitude: point.longitude,
          deliveryLatitude: 21.0360,
          deliveryLongitude: 105.8150,
          metadata: {
            sender: {
              name: `Shop Phân Vùng ${zone.zoneName}`,
              address: `Địa chỉ lấy hàng tại ${zone.ward}, ${zone.province}`,
              ward: zone.ward,
              hubCode: zone.hubCode,
              coordinates: { lat: point.latitude, lng: point.longitude },
            },
            package: { weightKg: 1.0, itemType: 'Hàng tiêu dùng Bulk Test' },
            financials: { codAmount: 150000, totalFee: 25000 },
            routingPlan: { originHubCode: zone.hubCode },
          },
        },
      });

      if (!createRes.ok) {
        throw new Error(`Lỗi tạo đơn: ${JSON.stringify(createRes.data)}`);
      }

      const created = createRes.data;

      // B. Kiểm tra tọa độ đã được lưu vào database chưa
      const hasCoords =
        typeof created.pickupLatitude === 'number' &&
        Math.abs(created.pickupLatitude - point.latitude) < 0.0001;

      // C. Kích hoạt & Tra cứu Task điều phối
      await apiRequest('/ops/dispatch/tasks', {
        method: 'POST',
        token: adminSession.token,
        body: {
          shipmentCode: waybillCode,
          taskType: 'PICKUP',
          hubCode: zone.hubCode,
          note: `Bulk Test Task ${waybillCode}`,
        },
      });

      // Polling chờ Dispatch Service gán task (tối đa 5 lần, mỗi lần 300ms)
      let task = null;
      let activeAssignment = null;
      let assignedCourierId = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 300));
        const taskRes = await apiRequest(`/ops/dispatch/tasks?shipmentCode=${waybillCode}&taskType=PICKUP`, {
          token: adminSession.token,
        });
        const tasks = Array.isArray(taskRes.data) ? taskRes.data : [];
        task = tasks[0];
        activeAssignment = task?.assignments?.find((a) => !a.unassignedAt) || task?.assignments?.[0];
        assignedCourierId = activeAssignment?.courierId || task?.assignedCourierId;
        if (assignedCourierId) break;
      }

      const duration = Date.now() - jobStart;
      latencies.push(duration);

      const isMatch = assignedCourierId === expectedCourier && hasCoords;

      results.push({
        index,
        waybillCode,
        zoneName: zone.zoneName,
        province: zone.province,
        point,
        expectedCourier,
        assignedCourierId,
        hasCoords,
        isMatch,
        duration,
      });

      // In kết quả từng đơn
      const sttCol = String(index).padStart(4).padEnd(4);
      const codeCol = waybillCode.padEnd(12);
      const provCol = zone.province.substring(0, 11).padEnd(11);
      const coordCol = `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`.padEnd(24);
      const zoneCol = zone.zoneName.substring(0, 27).padEnd(27);
      const courierCol = (assignedCourierId || 'N/A').padEnd(12);
      const statusCol = isMatch ? `${GREEN}✔ PASS${RESET}` : `${RED}✘ FAIL${RESET}`;
      const timeCol = `${duration}ms`.padEnd(8);

      console.log(`${DIM}│${RESET} ${sttCol} ${DIM}│${RESET} ${codeCol} ${DIM}│${RESET} ${provCol} ${DIM}│${RESET} ${coordCol} ${DIM}│${RESET} ${zoneCol} ${DIM}│${RESET} ${courierCol} ${DIM}│${RESET} ${statusCol} ${DIM}│${RESET} ${timeCol} ${DIM}│${RESET}`);

    } catch (err) {
      results.push({
        index,
        waybillCode,
        error: err.message,
        isMatch: false,
      });
      console.log(`${DIM}│${RESET} ${String(index).padEnd(4)} ${DIM}│${RESET} ${waybillCode.padEnd(12)} ${DIM}│${RESET} ${RED}LỖI XỬ LÝ: ${err.message}${RESET}`);
    }
  }

  // Chạy lần lượt từng batch
  for (let i = 0; i < orderJobs.length; i += CONCURRENCY) {
    const batch = orderJobs.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((job) => processOrderJob(job)));
  }

  console.log(`${DIM}└──────┴──────────────┴─────────────┴──────────────────────────┴─────────────────────────────┴──────────────┴────────┴──────────┘${RESET}`);

  // 5. TÍNH TOÁN CÁC CHỈ SỐ THỐNG KÊ (METRICS)
  const totalElapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = results.filter((r) => r.isMatch).length;
  const coordsIntegrityCount = results.filter((r) => r.hasCoords).length;
  const failedCount = results.length - passedCount;
  const accuracyRate = ((passedCount / results.length) * 100).toFixed(1);
  const coordsRate = ((coordsIntegrityCount / results.length) * 100).toFixed(1);

  latencies.sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((s, v) => s + v, 0) / latencies.length).toFixed(0);
  const p50Latency = latencies[Math.floor(latencies.length * 0.50)];
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
  const maxLatency = latencies[latencies.length - 1];
  const throughput = (results.length / totalElapsedSec).toFixed(1);

  console.log(`
${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗
║                    📊 BÁO CÁO KẾT QUẢ KIỂM THỬ SỐ LƯỢNG LỚN                  ║
╠══════════════════════════════════════════════════════════════════════════════╣${RESET}
  • Tổng số đơn hàng thực tế kiểm định:      ${BOLD}${results.length} đơn hàng${RESET}
  • Số đơn hàng lưu đúng tọa độ GPS:         ${BOLD}${GREEN}${coordsIntegrityCount} / ${results.length} (${coordsRate}%)${RESET}
  • Số đơn hàng phân công ĐÚNG SHIPPER:      ${BOLD}${GREEN}${passedCount} / ${results.length} (${accuracyRate}%)${RESET}
  • Số đơn hàng bị sai tuyến / lỗi:          ${BOLD}${failedCount > 0 ? RED : GREEN}${failedCount}${RESET}
  • Thời gian hoàn thành toàn bộ:            ${BOLD}${totalElapsedSec} giây${RESET}
  • Tốc độ xử lý trung bình (Throughput):    ${BOLD}${throughput} đơn/giây${RESET}
  • Độ trễ xử lý (Latency Metrics):
      - Trung bình (Average):               ${BOLD}${avgLatency} ms / đơn${RESET}
      - Trung vị (p50):                     ${BOLD}${p50Latency} ms${RESET}
      - Đỉnh cao tải (p95):                 ${BOLD}${p95Latency} ms${RESET}
      - Lâu nhất (Max):                     ${BOLD}${maxLatency} ms${RESET}
${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}
`);

  assert.strictEqual(failedCount, 0, 'Toàn bộ đơn hàng số lượng lớn phải lưu đúng tọa độ và gán đúng Shipper');
  console.log(`${GREEN}${BOLD}✔ ĐẠT CHUẨN XUẤT SẮC: HỆ THỐNG XỬ LÝ SỐ LƯỢNG LỚN MƯỢT MÀ, 100% ĐƠN CÓ TỌA ĐỘ VÀ PHÂN CÔNG CHÍNH XÁC TUYỆT ĐỐI! 🎯${RESET}\n`);
}

runBulkStressSuite().catch((err) => {
  console.error(`\n${RED}Lỗi nghiêm trọng: ${err.message}${RESET}`);
  process.exit(1);
});
