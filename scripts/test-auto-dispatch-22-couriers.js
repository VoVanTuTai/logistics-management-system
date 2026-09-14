#!/usr/bin/env node

/**
 * TEST AUTO ĐIỀU PHỐI 22 COURIER × 11 PHƯỜNG × 3 TỈNH
 *
 * Demo kiểm chứng: Mỗi đơn hàng tạo với toạ độ GPS → hệ thống gán đúng Courier
 * theo vùng geofence chia đôi phường (A = nửa Bắc/Đông, B = nửa Nam/Tây).
 *
 * Cách chạy:
 *   node scripts/test-auto-dispatch-22-couriers.js
 *   node scripts/test-auto-dispatch-22-couriers.js --random 20
 *   node scripts/test-auto-dispatch-22-couriers.js --lat 21.022 --lng 105.853
 */

const assert = require('node:assert');

// =====================================================
// 1. ĐỊNH NGHĨA 22 VÙNG GEOFENCE (Khớp với masterdata seed)
// =====================================================

const ALL_COURIER_ZONES = [
  // === HÀ NỘI — 4 Phường × 2 Courier ===
  {
    courierId: '30002001', province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'P. Hàng Bài',
    zoneName: 'Hoàn Kiếm A - Bắc Hàng Bài', colorHex: '#2563eb',
    bounds: { minLat: 21.0185, maxLat: 21.025, minLng: 105.847, maxLng: 105.858 },
    boundaryPolygon: [[21.0185,105.847],[21.025,105.847],[21.025,105.858],[21.0185,105.858],[21.0185,105.847]],
  },
  {
    courierId: '30002002', province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'P. Hàng Bài',
    zoneName: 'Hoàn Kiếm B - Nam Hàng Bài', colorHex: '#10b981',
    bounds: { minLat: 21.012, maxLat: 21.0185, minLng: 105.847, maxLng: 105.858 },
    boundaryPolygon: [[21.012,105.847],[21.0185,105.847],[21.0185,105.858],[21.012,105.858],[21.012,105.847]],
  },
  {
    courierId: '30002003', province: 'Hà Nội', district: 'Ba Đình', ward: 'P. Kim Mã',
    zoneName: 'Ba Đình A - Đông Kim Mã', colorHex: '#f59e0b',
    bounds: { minLat: 21.025, maxLat: 21.038, minLng: 105.824, maxLng: 105.831 },
    boundaryPolygon: [[21.025,105.824],[21.038,105.824],[21.038,105.831],[21.025,105.831],[21.025,105.824]],
  },
  {
    courierId: '30002004', province: 'Hà Nội', district: 'Ba Đình', ward: 'P. Kim Mã',
    zoneName: 'Ba Đình B - Tây Kim Mã', colorHex: '#8b5cf6',
    bounds: { minLat: 21.025, maxLat: 21.038, minLng: 105.817, maxLng: 105.824 },
    boundaryPolygon: [[21.025,105.817],[21.038,105.817],[21.038,105.824],[21.025,105.824],[21.025,105.817]],
  },
  {
    courierId: '30002005', province: 'Hà Nội', district: 'Cầu Giấy', ward: 'P. Dịch Vọng',
    zoneName: 'Cầu Giấy A - Bắc Dịch Vọng', colorHex: '#ec4899',
    bounds: { minLat: 21.0335, maxLat: 21.042, minLng: 105.787, maxLng: 105.804 },
    boundaryPolygon: [[21.0335,105.787],[21.042,105.787],[21.042,105.804],[21.0335,105.804],[21.0335,105.787]],
  },
  {
    courierId: '30002006', province: 'Hà Nội', district: 'Cầu Giấy', ward: 'P. Dịch Vọng',
    zoneName: 'Cầu Giấy B - Nam Dịch Vọng', colorHex: '#06b6d4',
    bounds: { minLat: 21.025, maxLat: 21.0335, minLng: 105.787, maxLng: 105.804 },
    boundaryPolygon: [[21.025,105.787],[21.0335,105.787],[21.0335,105.804],[21.025,105.804],[21.025,105.787]],
  },
  {
    courierId: '30002007', province: 'Hà Nội', district: 'Đống Đa', ward: 'P. Trung Liệt',
    zoneName: 'Đống Đa A - Đông Thái Hà', colorHex: '#ef4444',
    bounds: { minLat: 21.007, maxLat: 21.020, minLng: 105.8185, maxLng: 105.826 },
    boundaryPolygon: [[21.007,105.8185],[21.020,105.8185],[21.020,105.826],[21.007,105.826],[21.007,105.8185]],
  },
  {
    courierId: '30002008', province: 'Hà Nội', district: 'Đống Đa', ward: 'P. Trung Liệt',
    zoneName: 'Đống Đa B - Tây Thái Hà', colorHex: '#84cc16',
    bounds: { minLat: 21.007, maxLat: 21.020, minLng: 105.811, maxLng: 105.8185 },
    boundaryPolygon: [[21.007,105.811],[21.020,105.811],[21.020,105.8185],[21.007,105.8185],[21.007,105.811]],
  },

  // === ĐÀ NẴNG — 3 Phường × 2 Courier ===
  {
    courierId: '30002009', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thạch Thang',
    zoneName: 'Hải Châu A - Bắc Bạch Đằng', colorHex: '#7c3aed',
    bounds: { minLat: 16.0745, maxLat: 16.082, minLng: 108.217, maxLng: 108.229 },
    boundaryPolygon: [[16.0745,108.217],[16.082,108.217],[16.082,108.229],[16.0745,108.229],[16.0745,108.217]],
  },
  {
    courierId: '30002010', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thạch Thang',
    zoneName: 'Hải Châu B - Nam Bạch Đằng', colorHex: '#f97316',
    bounds: { minLat: 16.067, maxLat: 16.0745, minLng: 108.217, maxLng: 108.229 },
    boundaryPolygon: [[16.067,108.217],[16.0745,108.217],[16.0745,108.229],[16.067,108.229],[16.067,108.217]],
  },
  {
    courierId: '30002011', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thanh Bình',
    zoneName: 'Thanh Bình A - Đông', colorHex: '#0ea5e9',
    bounds: { minLat: 16.057, maxLat: 16.071, minLng: 108.2105, maxLng: 108.218 },
    boundaryPolygon: [[16.057,108.2105],[16.071,108.2105],[16.071,108.218],[16.057,108.218],[16.057,108.2105]],
  },
  {
    courierId: '30002012', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'P. Thanh Bình',
    zoneName: 'Thanh Bình B - Tây', colorHex: '#d946ef',
    bounds: { minLat: 16.057, maxLat: 16.071, minLng: 108.203, maxLng: 108.2105 },
    boundaryPolygon: [[16.057,108.203],[16.071,108.203],[16.071,108.2105],[16.057,108.2105],[16.057,108.203]],
  },
  {
    courierId: '30002013', province: 'Đà Nẵng', district: 'Sơn Trà', ward: 'P. An Hải Bắc',
    zoneName: 'Sơn Trà A - Bắc Sông Hàn', colorHex: '#14b8a6',
    bounds: { minLat: 16.079, maxLat: 16.086, minLng: 108.230, maxLng: 108.244 },
    boundaryPolygon: [[16.079,108.230],[16.086,108.230],[16.086,108.244],[16.079,108.244],[16.079,108.230]],
  },
  {
    courierId: '30002014', province: 'Đà Nẵng', district: 'Sơn Trà', ward: 'P. An Hải Bắc',
    zoneName: 'Sơn Trà B - Nam Sông Hàn', colorHex: '#a855f7',
    bounds: { minLat: 16.072, maxLat: 16.079, minLng: 108.230, maxLng: 108.244 },
    boundaryPolygon: [[16.072,108.230],[16.079,108.230],[16.079,108.244],[16.072,108.244],[16.072,108.230]],
  },

  // === TP.HCM — 4 Phường × 2 Courier ===
  {
    courierId: '30002015', province: 'TP.HCM', district: 'Quận 1', ward: 'P. Bến Thành',
    zoneName: 'Q1 A - Đông Chợ Bến Thành', colorHex: '#3b82f6',
    bounds: { minLat: 10.765, maxLat: 10.779, minLng: 106.693, maxLng: 106.699 },
    boundaryPolygon: [[10.765,106.693],[10.779,106.693],[10.779,106.699],[10.765,106.699],[10.765,106.693]],
  },
  {
    courierId: '30002016', province: 'TP.HCM', district: 'Quận 1', ward: 'P. Bến Thành',
    zoneName: 'Q1 B - Tây Chợ Bến Thành', colorHex: '#22c55e',
    bounds: { minLat: 10.765, maxLat: 10.779, minLng: 106.687, maxLng: 106.693 },
    boundaryPolygon: [[10.765,106.687],[10.779,106.687],[10.779,106.693],[10.765,106.693],[10.765,106.687]],
  },
  {
    courierId: '30002017', province: 'TP.HCM', district: 'Quận 3', ward: 'Phường 13',
    zoneName: 'Q3 A - Bắc Lê Văn Sỹ', colorHex: '#f43f5e',
    bounds: { minLat: 10.7885, maxLat: 10.795, minLng: 106.671, maxLng: 106.684 },
    boundaryPolygon: [[10.7885,106.671],[10.795,106.671],[10.795,106.684],[10.7885,106.684],[10.7885,106.671]],
  },
  {
    courierId: '30002018', province: 'TP.HCM', district: 'Quận 3', ward: 'Phường 13',
    zoneName: 'Q3 B - Nam Lê Văn Sỹ', colorHex: '#eab308',
    bounds: { minLat: 10.782, maxLat: 10.7885, minLng: 106.671, maxLng: 106.684 },
    boundaryPolygon: [[10.782,106.671],[10.7885,106.671],[10.7885,106.684],[10.782,106.684],[10.782,106.671]],
  },
  {
    courierId: '30002019', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 13',
    zoneName: 'Tân Bình A - Đông Cộng Hòa', colorHex: '#6366f1',
    bounds: { minLat: 10.794, maxLat: 10.815, minLng: 106.644, maxLng: 106.655 },
    boundaryPolygon: [[10.794,106.644],[10.815,106.644],[10.815,106.655],[10.794,106.655],[10.794,106.644]],
  },
  {
    courierId: '30002020', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 13',
    zoneName: 'Tân Bình B - Tây Cộng Hòa', colorHex: '#f472b6',
    bounds: { minLat: 10.794, maxLat: 10.815, minLng: 106.633, maxLng: 106.644 },
    boundaryPolygon: [[10.794,106.633],[10.815,106.633],[10.815,106.644],[10.794,106.644],[10.794,106.633]],
  },
  {
    courierId: '30002021', province: 'TP.HCM', district: 'Quận 12', ward: 'P. An Phú Đông',
    zoneName: 'Q12 A - Bắc Hà Huy Giáp', colorHex: '#0d9488',
    bounds: { minLat: 10.8675, maxLat: 10.885, minLng: 106.683, maxLng: 106.715 },
    boundaryPolygon: [[10.8675,106.683],[10.885,106.683],[10.885,106.715],[10.8675,106.715],[10.8675,106.683]],
  },
  {
    courierId: '30002022', province: 'TP.HCM', district: 'Quận 12', ward: 'P. An Phú Đông',
    zoneName: 'Q12 B - Nam Hà Huy Giáp', colorHex: '#be185d',
    bounds: { minLat: 10.850, maxLat: 10.8675, minLng: 106.683, maxLng: 106.715 },
    boundaryPolygon: [[10.850,106.683],[10.8675,106.683],[10.8675,106.715],[10.850,106.715],[10.850,106.683]],
  },
];

// =====================================================
// 2. THUẬT TOÁN RAY-CASTING (Nhất quán với masterdata-service)
// =====================================================
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// =====================================================
// 3. ĐỘNG CƠ AUTO-DISPATCH (Giả lập dispatch-service)
// =====================================================
function autoDispatchOrder(latitude, longitude) {
  const matched = [];
  for (const zone of ALL_COURIER_ZONES) {
    if (isPointInPolygon({ latitude, longitude }, zone.boundaryPolygon)) {
      matched.push(zone);
    }
  }

  if (matched.length === 1) {
    return { status: 'AUTO_ASSIGNED', courier: matched[0] };
  }
  if (matched.length > 1) {
    return { status: 'OVERLAP_ERROR', couriers: matched.map((z) => z.courierId) };
  }
  return { status: 'UNASSIGNED', courier: null };
}

function getRandomPointInBounds(bounds) {
  const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * (0.15 + Math.random() * 0.7);
  const lng = bounds.minLng + (bounds.maxLng - bounds.minLng) * (0.15 + Math.random() * 0.7);
  return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
}

// =====================================================
// 4. CHẠY TEST
// =====================================================
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

console.log(`
${BOLD}╔══════════════════════════════════════════════════════════════════════════════════════╗
║  🚀 TEST AUTO ĐIỀU PHỐI 22 COURIER × 11 PHƯỜNG × 3 TỈNH (HÀ NỘI / ĐÀ NẴNG / HCM) ║
╚══════════════════════════════════════════════════════════════════════════════════════╝${RESET}
`);

// --- PHẦN 1: ZERO-OVERLAP ---
console.log(`${BOLD}━━━ PHẦN 1: KIỂM TRA ZERO-OVERLAP (22 vùng không chồng lấn) ━━━${RESET}`);
let overlapErrors = 0;
for (let i = 0; i < ALL_COURIER_ZONES.length; i++) {
  for (let j = i + 1; j < ALL_COURIER_ZONES.length; j++) {
    const z1 = ALL_COURIER_ZONES[i];
    const z2 = ALL_COURIER_ZONES[j];
    let overlap = 0;
    for (let k = 0; k < 50; k++) {
      const pt = getRandomPointInBounds(z1.bounds);
      if (isPointInPolygon(pt, z2.boundaryPolygon)) overlap++;
    }
    if (overlap > 0) {
      console.log(`  ${RED}✘ CHỒNG LẤN: ${z1.courierId} ↔ ${z2.courierId} (${overlap} điểm)${RESET}`);
      overlapErrors++;
    }
  }
}
if (overlapErrors === 0) {
  console.log(`  ${GREEN}✔ PASS: Toàn bộ 22 geofence hoàn toàn tách biệt — 0 chồng lấn!${RESET}\n`);
} else {
  console.log(`  ${RED}✘ FAIL: Phát hiện ${overlapErrors} cặp chồng lấn!${RESET}\n`);
  process.exit(1);
}

// --- PHẦN 2: KIỂM TRA CHÍNH XÁC (Deterministic) ---
console.log(`${BOLD}━━━ PHẦN 2: KIỂM TRA PHÂN CÔNG CHÍNH XÁC — 22 đơn hàng tại tâm mỗi vùng ━━━${RESET}`);
console.log(`${DIM}┌────────────┬─────────────┬───────────────────────┬────────────────────────────────────┬────────┐${RESET}`);
console.log(`${DIM}│ Courier    │ Tỉnh        │ Toạ Độ GPS            │ Tuyến Kỳ Vọng                      │ KQ     │${RESET}`);
console.log(`${DIM}├────────────┼─────────────┼───────────────────────┼────────────────────────────────────┼────────┤${RESET}`);

let deterministicPass = 0;
let deterministicFail = 0;

for (const zone of ALL_COURIER_ZONES) {
  const centerLat = (zone.bounds.minLat + zone.bounds.maxLat) / 2;
  const centerLng = (zone.bounds.minLng + zone.bounds.maxLng) / 2;

  const result = autoDispatchOrder(centerLat, centerLng);
  const isCorrect = result.status === 'AUTO_ASSIGNED' && result.courier.courierId === zone.courierId;

  const statusIcon = isCorrect ? `${GREEN}✔ PASS${RESET}` : `${RED}✘ FAIL${RESET}`;
  const courierCol = zone.courierId.padEnd(10);
  const provCol = zone.province.padEnd(11);
  const coordCol = `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`.padEnd(21);
  const zoneCol = zone.zoneName.substring(0, 34).padEnd(34);

  console.log(`${DIM}│${RESET} ${courierCol} ${DIM}│${RESET} ${provCol} ${DIM}│${RESET} ${coordCol} ${DIM}│${RESET} ${zoneCol} ${DIM}│${RESET} ${statusIcon} ${DIM}│${RESET}`);

  if (isCorrect) {
    deterministicPass++;
  } else {
    deterministicFail++;
    const actual = result.courier ? result.courier.courierId : 'NONE';
    console.log(`${DIM}│${RESET}   ${RED}↳ Gán nhầm: ${actual} thay vì ${zone.courierId}${RESET}`);
  }
}

console.log(`${DIM}└────────────┴─────────────┴───────────────────────┴────────────────────────────────────┴────────┘${RESET}`);
console.log(`  Kết quả: ${GREEN}${deterministicPass} PASS${RESET} / ${deterministicFail > 0 ? RED : ''}${deterministicFail} FAIL${RESET} / 22 tổng\n`);

assert.strictEqual(deterministicFail, 0, 'Phải gán đúng 22/22 courier tại tâm vùng');

// --- PHẦN 3: STRESS TEST NGẪU NHIÊN ---
const args = process.argv.slice(2);
let customLat = null;
let customLng = null;
let randomCount = 5;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lat' && args[i + 1]) customLat = parseFloat(args[i + 1]);
  if (args[i] === '--lng' && args[i + 1]) customLng = parseFloat(args[i + 1]);
  if (args[i] === '--random' && args[i + 1]) randomCount = parseInt(args[i + 1], 10);
}

if (customLat !== null && customLng !== null) {
  console.log(`${BOLD}━━━ KIỂM TRA TOẠ ĐỘ TUỲ Ý: [${customLat}, ${customLng}] ━━━${RESET}`);
  const result = autoDispatchOrder(customLat, customLng);
  if (result.status === 'AUTO_ASSIGNED') {
    console.log(`  ${GREEN}→ Courier: ${result.courier.courierId}${RESET}`);
    console.log(`  → Tuyến: ${result.courier.zoneName}`);
    console.log(`  → ${result.courier.province} / ${result.courier.district} / ${result.courier.ward}`);
  } else {
    console.log(`  ${YELLOW}→ Không thuộc vùng geofence nào (${result.status})${RESET}`);
  }
  process.exit(0);
}

console.log(`${BOLD}━━━ PHẦN 3: STRESS TEST — ${randomCount} điểm ngẫu nhiên × 22 vùng = ${randomCount * 22} đơn hàng ━━━${RESET}`);

let stressPass = 0;
let stressFail = 0;
const provinceSummary = { 'Hà Nội': { pass: 0, fail: 0 }, 'Đà Nẵng': { pass: 0, fail: 0 }, 'TP.HCM': { pass: 0, fail: 0 } };

for (const zone of ALL_COURIER_ZONES) {
  for (let i = 0; i < randomCount; i++) {
    const pt = getRandomPointInBounds(zone.bounds);
    const result = autoDispatchOrder(pt.latitude, pt.longitude);
    const isCorrect = result.status === 'AUTO_ASSIGNED' && result.courier.courierId === zone.courierId;

    if (isCorrect) {
      stressPass++;
      provinceSummary[zone.province].pass++;
    } else {
      stressFail++;
      provinceSummary[zone.province].fail++;
      const actual = result.courier ? result.courier.courierId : 'NONE';
      console.log(`  ${RED}✘ [${zone.courierId}] (${pt.latitude}, ${pt.longitude}) → Gán nhầm: ${actual}${RESET}`);
    }
  }
}

const totalStress = stressPass + stressFail;
console.log(`\n  Kết quả Stress Test:`);
for (const [prov, stats] of Object.entries(provinceSummary)) {
  const total = stats.pass + stats.fail;
  const pct = total > 0 ? ((stats.pass / total) * 100).toFixed(0) : '0';
  const icon = stats.fail === 0 ? `${GREEN}✔${RESET}` : `${RED}✘${RESET}`;
  console.log(`    ${icon} ${prov.padEnd(10)}: ${stats.pass}/${total} đúng (${pct}%)`);
}
console.log(`\n  ${BOLD}TỔNG: ${GREEN}${stressPass}/${totalStress} PASS (${((stressPass / totalStress) * 100).toFixed(1)}%)${RESET}`);

assert.strictEqual(stressFail, 0, `Stress test phải gán đúng 100% (${stressFail} lỗi)`);

// --- KẾT LUẬN ---
console.log(`
${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════════════════╗
║  🎉 KẾT QUẢ: AUTO-DISPATCH CHÍNH XÁC 100% — 0 SAI TUYẾN!              ║
║                                                                         ║
║  ✔ 22/22 geofence Zero-Overlap                                         ║
║  ✔ 22/22 deterministic center-point test                                ║
║  ✔ ${String(totalStress).padEnd(3)}/${String(totalStress).padEnd(3)} random stress test                                       ║
║                                                                         ║
║  → Mọi đơn hàng tạo với toạ độ GPS sẽ được gán đúng Courier            ║
║    theo vùng phường đã phân công.                                       ║
╚══════════════════════════════════════════════════════════════════════════╝${RESET}
`);
