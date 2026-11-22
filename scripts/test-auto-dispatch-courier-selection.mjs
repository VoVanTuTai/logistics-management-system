#!/usr/bin/env node

import assert from 'node:assert';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const DISPATCH_URL = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3004';
const SHIPMENT_URL = process.env.SHIPMENT_SERVICE_URL || 'http://localhost:3002';

console.log('================================================================');
console.log('🧪 KIỂM THỬ TỰ ĐỘNG ĐIỀU PHỐI: ƯU TIÊN COURIER CỦA HUB GỬI/NHẬN');
console.log('================================================================\n');

async function testCourierList() {
  console.log('--- TEST 1: Danh sách Shipper từ dispatch-service ---');
  const res = await fetch(`${DISPATCH_URL}/tasks/couriers`);
  assert.strictEqual(res.status, 200, 'GET /tasks/couriers phải thành công');
  const couriers = await res.json();
  console.log(`Số lượng Courier tìm thấy: ${couriers.length}`);
  assert.ok(couriers.includes('30000144'), 'Phải chứa Courier An Nhơn 30000144');
  assert.ok(couriers.includes('30000079'), 'Phải chứa Đội trưởng HCM 30000079');
  assert.ok(couriers.includes('30000007'), 'Phải chứa Đội trưởng Hà Nội 30000007');
  console.log('✅ TEST 1 PASSED: Danh sách Shipper bao gồm đầy đủ nhân sự thực tế từ auth-service!\n');
}

async function testAutoDispatchPickup() {
  console.log('--- TEST 2: Tạo đơn hàng tại Hub có Courier chưa phân tuyến toạ độ (07904W001) ---');
  // Tạo đơn hàng mô phỏng từ merchant DTCOMERGE tại Phường An Nhơn (07904W001)
  const random9Digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  const waybill = `111${random9Digits}`;
  
  const createRes = await fetch(`${SHIPMENT_URL}/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: waybill,
      metadata: {
        sender: {
          name: 'DTCOMERGE Shop',
          phone: '0901234567',
          address: '123 Đường An Nhơn, Phường 17, Gò Vấp, TP. Hồ Chí Minh',
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận Gò Vấp',
          ward: 'Phường 17',
          hubCode: '07904W001',
          latitude: 10.840,
          longitude: 106.680,
        },
        receiver: {
          name: 'Người Nhận Test',
          phone: '0909999888',
          address: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
        },
        parcel: {
          weight: 1.5,
          serviceType: 'STANDARD',
          codAmount: 250000,
        },
        originHubCode: '07904W001',
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Lỗi khi tạo vận đơn test:', errText);
    throw new Error(`Failed to create shipment: ${errText}`);
  }

  const shipment = await createRes.json();
  console.log(`Đã tạo vận đơn test thành công: ${shipment.code}`);
  console.log(`Origin Hub: ${shipment.metadata?.originHubCode || shipment.originHubCode}`);

  // Đợi 1 giây để Dispatch Service xử lý outbox event / auto-assign
  await new Promise((r) => setTimeout(r, 1200));

  // Kiểm tra task PICKUP trong dispatch-service
  const tasksRes = await fetch(`${DISPATCH_URL}/tasks?shipmentCode=${encodeURIComponent(shipment.code)}`);
  assert.strictEqual(tasksRes.status, 200, 'GET /tasks phải thành công');
  const tasks = await tasksRes.json();
  console.log(`Số lượng Task tạo ra: ${tasks.length}`);

  const pickupTask = tasks.find((t) => t.taskType === 'PICKUP');
  assert.ok(pickupTask, 'Phải có Task PICKUP cho đơn hàng');
  console.log(`Trạng thái Task: ${pickupTask.status}`);
  console.log(`Note Task: ${pickupTask.note}`);

  const activeAssignment = pickupTask.assignments?.find((a) => a.unassignedAt === null);
  console.log(`Shipper được gán: ${activeAssignment?.courierId}`);

  // QUAN TRỌNG: Không được gán cho 30000000 mà phải gán cho Shipper 30000144 của Hub 07904W001!
  assert.strictEqual(
    activeAssignment?.courierId,
    '30000144',
    `Đơn hàng tại Hub 07904W001 phải được gán cho Shipper của Hub là 30000144, không được vào 30000000!`
  );
  console.log('✅ TEST 2 PASSED: Đơn hàng tại Hub 07904W001 được gán chính xác cho Shipper 30000144 của Hub!\n');
}

async function testAutoDispatchProvinceHub() {
  console.log('--- TEST 3: Tạo đơn hàng tại Hub Tỉnh (003079B001 - HCM) ---');
  const random9Digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  const waybill = `111${random9Digits}`;
  
  const createRes = await fetch(`${SHIPMENT_URL}/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: waybill,
      metadata: {
        sender: {
          name: 'Kho Tổng HCM',
          phone: '0901112222',
          address: 'Kho Trung Chuyển Sài Gòn, TP. Hồ Chí Minh',
          province: 'Thành phố Hồ Chí Minh',
          hubCode: '003079B001',
          latitude: 10.750,
          longitude: 106.650,
        },
        receiver: {
          name: 'Người Nhận Test',
          phone: '0909999888',
          address: 'Hà Nội',
          province: 'Hà Nội',
        },
        parcel: {
          weight: 2.0,
          serviceType: 'STANDARD',
          codAmount: 0,
        },
        originHubCode: '003079B001',
      },
    }),
  });

  assert.ok(createRes.ok, 'Tạo đơn kho HCM phải thành công');
  const shipment = await createRes.json();

  await new Promise((r) => setTimeout(r, 1200));

  const tasksRes = await fetch(`${DISPATCH_URL}/tasks?shipmentCode=${encodeURIComponent(shipment.code)}`);
  const tasks = await tasksRes.json();
  const pickupTask = tasks.find((t) => t.taskType === 'PICKUP');
  assert.ok(pickupTask, 'Phải có Task PICKUP');

  const activeAssignment = pickupTask.assignments?.find((a) => a.unassignedAt === null);
  console.log(`Shipper được gán tại Hub HCM: ${activeAssignment?.courierId}`);
  assert.strictEqual(
    activeAssignment?.courierId,
    '30000079',
    `Hub 003079B001 phải gán cho Đội trưởng HCM 30000079, không vào 30000000!`
  );
  console.log('✅ TEST 3 PASSED: Đơn hàng tại Hub HCM được gán chính xác cho Shipper 30000079 của Hub!\n');
}

async function main() {
  try {
    await testCourierList();
    await testAutoDispatchPickup();
    await testAutoDispatchProvinceHub();
    console.log('🎉 TẤT CẢ 3 BỘ TEST AUTO DISPATCH ĐỀU ĐẠT 100%!');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

main();
