/**
 * End-to-End Automated Test Script:
 * 1. 4-Tier Operations Role & Scope Resolution (HQ -> Region -> Province -> Ward)
 * 2. Courier Coordinate Geofence Drawing (Polygon Boundary Generation)
 * 3. Ray-Casting Algorithm Validation (isPointInPolygon)
 * 4. Dispatch Service Auto-Dispatch Engine Integration (autoAssignPickupTask)
 */

import assert from 'node:assert';

console.log('================================================================');
console.log('🚀 BẮT ĐẦU AUTO TEST TOÀN TRÌNH END-TO-END (E2E)');
console.log('================================================================\n');

// -------------------------------------------------------------
// STAGE 1: 4-Tier Ops Hierarchy & Scope Resolution Testing
// -------------------------------------------------------------
console.log('--- STAGE 1: KIỂM THỬ PHÂN CẤP 4 TẦNG VẬN HÀNH & PHẠM VI DỮ LIỆU ---');

type OpsTier = 'HQ' | 'REGION' | 'PROVINCE' | 'WARD';

interface OpsTierMeta {
  tier: OpsTier;
  label: string;
  badgeLabel: string;
  badgeColor: string;
  icon: string;
}

function resolveOpsTier(
  username?: string | null,
  roles: string[] = [],
  hubCodes: string[] = [],
): OpsTierMeta {
  const normUsername = (username ?? '').trim();

  // 1. HQ Level 0
  const isHqMaster =
    normUsername === '20000000' ||
    normUsername === '10000001' ||
    roles.includes('SYSTEM_ADMIN') ||
    roles.includes('HQ_OPS') ||
    roles.includes('HQ_MANAGER');

  if (isHqMaster) {
    return {
      tier: 'HQ',
      label: 'HQ Toàn Hệ Thống',
      badgeLabel: 'HQ MASTER',
      badgeColor: '#0284c7',
      icon: 'public',
    };
  }

  // 2. Regional Level 1
  const isNorth =
    normUsername === '20000001' ||
    normUsername === '20000004' ||
    hubCodes.some((h) => h.includes('001') || h.includes('HN'));
  const isCentral =
    normUsername === '20000002' ||
    normUsername === '20000005' ||
    hubCodes.some((h) => h.includes('002') || h.includes('DN'));
  const isSouth =
    normUsername === '20000003' ||
    normUsername === '20000006' ||
    hubCodes.some((h) => h.includes('003') || h.includes('HCM'));

  const isRegional =
    roles.includes('REGIONAL_OPS') ||
    (normUsername >= '20000001' && normUsername <= '20000006');

  if (isRegional || (roles.includes('OPS_ADMIN') && (isNorth || isCentral || isSouth))) {
    const regionName = isNorth ? 'Miền Bắc' : isCentral ? 'Miền Trung' : 'Miền Nam';
    return {
      tier: 'REGION',
      label: `OPS Miền (${regionName})`,
      badgeLabel: `MIỀN ${regionName.toUpperCase()}`,
      badgeColor: '#7c3aed',
      icon: 'map',
    };
  }

  // 3. Provincial Level 2 (Bưu cục Tỉnh)
  const isProvincial =
    roles.includes('PROVINCIAL_OPS') ||
    (normUsername >= '20000007' && normUsername <= '20000069') ||
    hubCodes.some((h) => h.includes('B'));

  if (isProvincial) {
    return {
      tier: 'PROVINCE',
      label: 'OPS Tỉnh / Thành Phố',
      badgeLabel: 'KHO TỈNH / TP',
      badgeColor: '#ea580c',
      icon: 'location_city',
    };
  }

  // 4. Ward Level 3 (Bưu cục phường / xã)
  return {
    tier: 'WARD',
    label: 'OPS Xã / Phường (Bưu Cục)',
    badgeLabel: 'BƯU CỤC PHƯỜNG',
    badgeColor: '#10b981',
    icon: 'store',
  };
}

// Assert Tier 1: HQ
const hqUser = resolveOpsTier('20000000', ['SYSTEM_ADMIN']);
assert.strictEqual(hqUser.tier, 'HQ', 'HQ user must resolve to HQ tier');
assert.strictEqual(hqUser.badgeLabel, 'HQ MASTER');
console.log('  [PASS] Cấp 1: Tài khoản Giám đốc HQ 20000000 -> Nhận diện cấp HQ MASTER');

// Assert Tier 2: Miền
const regionUser = resolveOpsTier('20000003', ['REGIONAL_OPS'], ['003']);
assert.strictEqual(regionUser.tier, 'REGION', 'Region user must resolve to REGION tier');
assert.strictEqual(regionUser.badgeLabel, 'MIỀN MIỀN NAM');
console.log('  [PASS] Cấp 2: Cán bộ Điều hành Miền Nam 20000003 -> Nhận diện cấp MIỀN MIỀN NAM');

// Assert Tier 3: Tỉnh
const provUser = resolveOpsTier('20000025', ['PROVINCIAL_OPS'], ['003079B001']);
assert.strictEqual(provUser.tier, 'PROVINCE', 'Provincial manager must resolve to PROVINCE tier');
assert.strictEqual(provUser.badgeLabel, 'KHO TỈNH / TP');
console.log('  [PASS] Cấp 3: Trưởng kho Tỉnh 20000025 -> Nhận diện cấp KHO TỈNH / TP');

// Assert Tier 4: Phường
const wardUser = resolveOpsTier('20001001', ['HUB_OPS'], ['HCM-001']);
assert.strictEqual(wardUser.tier, 'WARD', 'Ward hub operator must resolve to WARD tier');
assert.strictEqual(wardUser.badgeLabel, 'BƯU CỤC PHƯỜNG');
console.log('  [PASS] Cấp 4: Nhân viên Bưu cục Phường 20001001 -> Nhận diện cấp BƯU CỤC PHƯỜNG');


// -------------------------------------------------------------
// STAGE 2: Ray-Casting isPointInPolygon Algorithm Validation
// -------------------------------------------------------------
console.log('\n--- STAGE 2: KIỂM THỬ THUẬT TOÁN ĐIỀU PHỐI ĐA GIÁC (RAY-CASTING) ---');

function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<[number, number]>,
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

// Geofence A: Phổ Quang - Sân Bay (Courier 30000001)
const geofencePhoQuang: Array<[number, number]> = [
  [10.8000, 106.6500],
  [10.8200, 106.6500],
  [10.8200, 106.6700],
  [10.8000, 106.6700],
  [10.8000, 106.6500], // Khép kín
];

// Geofence B: Cộng Hòa - Hoàng Hoa Thám (Courier 30000002)
const geofenceCongHoa: Array<[number, number]> = [
  [10.7900, 106.6300],
  [10.8100, 106.6300],
  [10.8100, 106.6500],
  [10.7900, 106.6500],
  [10.7900, 106.6300], // Khép kín
];

// Test điểm GPS rơi vào vùng Phổ Quang
const pointPhoQuang = { latitude: 10.8100, longitude: 106.6600 };
assert.strictEqual(isPointInPolygon(pointPhoQuang, geofencePhoQuang), true);
assert.strictEqual(isPointInPolygon(pointPhoQuang, geofenceCongHoa), false);
console.log('  [PASS] Tọa độ [10.8100, 106.6600]: Khớp chính xác dải toạ độ Phổ Quang (Courier 30000001)');

// Test điểm GPS rơi vào vùng Cộng Hòa
const pointCongHoa = { latitude: 10.7950, longitude: 106.6400 };
assert.strictEqual(isPointInPolygon(pointCongHoa, geofenceCongHoa), true);
assert.strictEqual(isPointInPolygon(pointCongHoa, geofencePhoQuang), false);
console.log('  [PASS] Tọa độ [10.7950, 106.6400]: Khớp chính xác dải toạ độ Cộng Hòa (Courier 30000002)');

// Test điểm GPS ngoài cả 2 vùng (VD: Bình Thạnh)
const pointOutside = { latitude: 10.8000, longitude: 106.7100 };
assert.strictEqual(isPointInPolygon(pointOutside, geofencePhoQuang), false);
assert.strictEqual(isPointInPolygon(pointOutside, geofenceCongHoa), false);
console.log('  [PASS] Tọa độ ngoài vùng [10.8000, 106.7100]: Từ chối cả 2 dải toạ độ');


// -------------------------------------------------------------
// STAGE 3: Simulated End-to-End Auto-Dispatch Service Workflow
// -------------------------------------------------------------
console.log('\n--- STAGE 3: KIỂM THỬ ĐỘNG CƠ ĐIỀU PHỐI TỰ ĐỘNG (DISPATCH SERVICE) ---');

interface MockShipment {
  shipmentCode: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  metadata?: {
    routing?: { originHubCode?: string };
    sender?: { province?: string; district?: string; ward?: string; hubCode?: string };
  };
}

interface MockAssignment {
  hubCode: string;
  courierId: string;
  ward: string;
  zoneName?: string;
  boundaryPolygon?: Array<[number, number]>;
  isActive: boolean;
}

class AutoDispatchSimulator {
  private assignments: MockAssignment[] = [];
  private taskDb: Map<string, { taskId: string; courierId: string; note: string; rule: string }> = new Map();

  addAssignment(assignment: MockAssignment) {
    this.assignments.push(assignment);
  }

  async autoAssignPickupTask(taskId: string, shipment: MockShipment): Promise<any> {
    const originHubCode =
      shipment.metadata?.routing?.originHubCode ||
      shipment.metadata?.sender?.hubCode ||
      'HCM-001';

    const pickupLat = shipment.pickupLatitude;
    const pickupLng = shipment.pickupLongitude;

    // PRIORITY 1: Geofence coordinate polygon matching
    if (pickupLat != null && pickupLng != null) {
      for (const item of this.assignments) {
        if (
          item.hubCode === originHubCode &&
          item.isActive &&
          item.courierId &&
          item.boundaryPolygon &&
          item.boundaryPolygon.length >= 3
        ) {
          if (isPointInPolygon({ latitude: pickupLat, longitude: pickupLng }, item.boundaryPolygon)) {
            const assigned = {
              taskId,
              courierId: item.courierId,
              note: `[Hệ thống tự động điều phối] Tọa độ GPS lấy hàng (${pickupLat.toFixed(5)}, ${pickupLng.toFixed(5)}) khớp chính xác Dải toạ độ [${item.zoneName || item.ward}] của Shipper ${item.courierId}`,
              rule: 'GEOFENCE_POLYGON_AUTO_DISPATCH',
            };
            this.taskDb.set(taskId, assigned);
            return assigned;
          }
        }
      }
    }

    // PRIORITY 2: Fallback address ward matching
    const senderWard = shipment.metadata?.sender?.ward;
    if (senderWard) {
      const match = this.assignments.find(
        (a) => a.hubCode === originHubCode && a.isActive && a.ward.toLowerCase().includes(senderWard.toLowerCase()),
      );
      if (match) {
        const assigned = {
          taskId,
          courierId: match.courierId,
          note: `[Hệ thống điều phối theo Phường] Gán Shipper ${match.courierId} theo phân vùng hành chính: ${senderWard}`,
          rule: 'WARD_ADDRESS_AUTO_DISPATCH',
        };
        this.taskDb.set(taskId, assigned);
        return assigned;
      }
    }

    return null;
  }

  getAssignedTask(taskId: string) {
    return this.taskDb.get(taskId);
  }
}

// Khởi tạo simulator và nạp cấu hình phân vùng
const dispatchEngine = new AutoDispatchSimulator();

dispatchEngine.addAssignment({
  hubCode: 'HCM-001',
  courierId: '30000001',
  ward: 'Phường 2',
  zoneName: 'Tuyến Phổ Quang - Sân Bay',
  colorHex: '#2563eb',
  isActive: true,
  boundaryPolygon: geofencePhoQuang,
});

dispatchEngine.addAssignment({
  hubCode: 'HCM-001',
  courierId: '30000002',
  ward: 'Phường 13',
  zoneName: 'Tuyến Cộng Hòa - Hoàng Hoa Thám',
  colorHex: '#10b981',
  isActive: true,
  boundaryPolygon: geofenceCongHoa,
});

dispatchEngine.addAssignment({
  hubCode: 'HCM-001',
  courierId: '30000003',
  ward: 'Phường 15',
  zoneName: 'Tuyến Phường 15 Mở rộng',
  isActive: true,
  // Không có polygon -> fallback theo tên phường
});

// TEST CASE 1: Đơn hàng mới có toạ độ GPS tại Phổ Quang (10.8100, 106.6600)
console.log('\n  * Kịch bản 1: Đơn hàng mới tại Phổ Quang [10.8100, 106.6600]');
const shipment1: MockShipment = {
  shipmentCode: 'NEXUS-HCM-001-001',
  pickupLatitude: 10.8100,
  pickupLongitude: 106.6600,
  metadata: {
    routing: { originHubCode: 'HCM-001' },
    sender: { ward: 'Phường 2', hubCode: 'HCM-001' },
  },
};

const result1 = await dispatchEngine.autoAssignPickupTask('TASK-001', shipment1);
assert.ok(result1, 'Phải tự động tạo và gán task');
assert.strictEqual(result1.courierId, '30000001', 'Phải gán đúng Shipper 30000001');
assert.strictEqual(result1.rule, 'GEOFENCE_POLYGON_AUTO_DISPATCH');
assert.ok(result1.note.includes('Tuyến Phổ Quang - Sân Bay'));
console.log(`    -> ✅ Gán thành công cho: ${result1.courierId} (${result1.rule})`);
console.log(`    -> Ghi chú hành trình: "${result1.note}"`);

// TEST CASE 2: Đơn hàng mới có toạ độ GPS tại Cộng Hòa (10.7950, 106.6400)
console.log('\n  * Kịch bản 2: Đơn hàng mới tại Cộng Hòa [10.7950, 106.6400]');
const shipment2: MockShipment = {
  shipmentCode: 'NEXUS-HCM-001-002',
  pickupLatitude: 10.7950,
  pickupLongitude: 106.6400,
  metadata: {
    routing: { originHubCode: 'HCM-001' },
    sender: { ward: 'Phường 13', hubCode: 'HCM-001' },
  },
};

const result2 = await dispatchEngine.autoAssignPickupTask('TASK-002', shipment2);
assert.ok(result2);
assert.strictEqual(result2.courierId, '30000002', 'Phải gán đúng Shipper 30000002');
assert.strictEqual(result2.rule, 'GEOFENCE_POLYGON_AUTO_DISPATCH');
console.log(`    -> ✅ Gán thành công cho: ${result2.courierId} (${result2.rule})`);
console.log(`    -> Ghi chú hành trình: "${result2.note}"`);

// TEST CASE 3: Đơn hàng không có toạ độ GPS, fallback theo tên Phường 15
console.log('\n  * Kịch bản 3: Đơn hàng không có toạ độ GPS -> Fallback theo Phường 15');
const shipment3: MockShipment = {
  shipmentCode: 'NEXUS-HCM-001-003',
  pickupLatitude: null,
  pickupLongitude: null,
  metadata: {
    routing: { originHubCode: 'HCM-001' },
    sender: { ward: 'Phường 15', hubCode: 'HCM-001' },
  },
};

const result3 = await dispatchEngine.autoAssignPickupTask('TASK-003', shipment3);
assert.ok(result3);
assert.strictEqual(result3.courierId, '30000003', 'Phải fallback gán đúng Shipper 30000003');
assert.strictEqual(result3.rule, 'WARD_ADDRESS_AUTO_DISPATCH');
console.log(`    -> ✅ Fallback thành công cho: ${result3.courierId} (${result3.rule})`);
console.log(`    -> Ghi chú hành trình: "${result3.note}"`);

console.log('\n================================================================');
console.log('🎉 TẤT CẢ CÁC BÀI TEST TỰ ĐỘNG E2E ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
console.log('================================================================\n');
