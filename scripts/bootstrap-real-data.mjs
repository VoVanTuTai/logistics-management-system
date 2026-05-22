#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const BASE = {
  auth: process.env.AUTH_SERVICE_URL ?? 'http://127.0.0.1:3010',
  masterdata: process.env.MASTERDATA_SERVICE_URL ?? 'http://127.0.0.1:3001',
  shipment: process.env.SHIPMENT_SERVICE_URL ?? 'http://127.0.0.1:3002',
  pickup: process.env.PICKUP_SERVICE_URL ?? 'http://127.0.0.1:3003',
  dispatch: process.env.DISPATCH_SERVICE_URL ?? 'http://127.0.0.1:3004',
  manifest: process.env.MANIFEST_SERVICE_URL ?? 'http://127.0.0.1:3005',
  scan: process.env.SCAN_SERVICE_URL ?? 'http://127.0.0.1:3006',
  delivery: process.env.DELIVERY_SERVICE_URL ?? 'http://127.0.0.1:3007',
  tracking: process.env.TRACKING_SERVICE_URL ?? 'http://127.0.0.1:3008',
  reporting: process.env.REPORTING_SERVICE_URL ?? 'http://127.0.0.1:3009',
  payment: process.env.PAYMENT_SERVICE_URL ?? 'http://127.0.0.1:3011',
};

const POSTGRES_CONTAINER = process.env.POSTGRES_CONTAINER ?? 'NEXUS-dev-postgres';
const DEFAULT_PASSWORD = process.env.BOOTSTRAP_PASSWORD ?? 'password';
const SHOULD_REPAIR_STATUS = process.env.BOOTSTRAP_REPAIR_STATUS !== '0';
const SHOULD_BACKDATE = process.env.BOOTSTRAP_BACKDATE !== '0';

const USERS = [
  { username: '10000001', roles: ['SYSTEM_ADMIN'], displayName: 'Admin Nexus', phone: '0901000001', hubCodes: ['HCM-001'] },
  { username: '20000001', roles: ['OPS_ADMIN'], displayName: 'Điều phối HCM', phone: '0902000001', hubCodes: ['HCM-001'] },
  { username: '20000002', roles: ['OPS_VIEWER'], displayName: 'Giám sát Hà Nội', phone: '0902000002', hubCodes: ['HN-001'] },
  { username: '20000003', roles: ['OPS_ADMIN'], displayName: 'Điều phối Đà Nẵng', phone: '0902000003', hubCodes: ['DN-001'] },
  { username: '30000001', roles: ['COURIER'], displayName: 'Nguyễn Văn Minh', phone: '0903000001', hubCodes: ['HCM-001'] },
  { username: '30000002', roles: ['COURIER'], displayName: 'Trần Đức Anh', phone: '0903000002', hubCodes: ['HN-001'] },
  { username: '30000003', roles: ['COURIER'], displayName: 'Lê Quốc Bảo', phone: '0903000003', hubCodes: ['DN-001'] },
  { username: '41100001', roles: ['MERCHANT'], displayName: 'Cửa hàng An Phú', phone: '0904110001', hubCodes: ['HCM-001'] },
  { username: '41100002', roles: ['MERCHANT'], displayName: 'Nhà sách Minh Châu', phone: '0904110002', hubCodes: ['HN-001'] },
  { username: '41100003', roles: ['MERCHANT'], displayName: 'Thực phẩm sạch Sơn Trà', phone: '0904110003', hubCodes: ['DN-001'] },
];

const ZONES = [
  { code: 'VN', name: 'Toàn quốc', parentCode: null, isActive: true },
  { code: 'HCM', name: 'Khu vực Hồ Chí Minh', parentCode: 'VN', isActive: true },
  { code: 'HN', name: 'Khu vực Hà Nội', parentCode: 'VN', isActive: true },
  { code: 'DN', name: 'Khu vực Đà Nẵng', parentCode: 'VN', isActive: true },
];

const HUBS = [
  {
    code: 'HCM-001',
    name: 'Hub Quận 1',
    zoneCode: 'HCM',
    address: hubAddress('Ho Chi Minh', 'Quận 1', 'Phường Bến Nghé', '12 Lê Lợi', '0281000001', 'Điều phối HCM'),
  },
  {
    code: 'HN-001',
    name: 'Hub Cầu Giấy',
    zoneCode: 'HN',
    address: hubAddress('Ha Noi', 'Cầu Giấy', 'Phường Dịch Vọng', '24 Xuân Thủy', '0241000001', 'Điều phối Hà Nội'),
  },
  {
    code: 'DN-001',
    name: 'Hub Hải Châu',
    zoneCode: 'DN',
    address: hubAddress('Da Nang', 'Hải Châu', 'Phường Hải Châu 1', '08 Bạch Đằng', '0236100001', 'Điều phối Đà Nẵng'),
  },
];

const NDR_REASONS = [
  { code: 'CUS_NOT_HOME', description: ndrDescription('Khách không có nhà', 'CUSTOMER', 'Người nhận không có mặt tại địa chỉ giao hàng.', true, false, 10), isActive: true },
  { code: 'ADDR_WRONG', description: ndrDescription('Sai địa chỉ', 'ADDRESS', 'Địa chỉ giao hàng sai hoặc thiếu thông tin định vị.', true, true, 20), isActive: true },
  { code: 'CUS_REFUSED', description: ndrDescription('Khách từ chối nhận', 'CUSTOMER', 'Người nhận từ chối nhận hàng tại thời điểm giao.', false, true, 30), isActive: true },
  { code: 'DAMAGED_PACKAGE', description: ndrDescription('Hàng có dấu hiệu hư hỏng', 'QUALITY', 'Kiện hàng móp, rách hoặc cần kiểm tra lại trước khi giao.', false, true, 40), isActive: true },
];

const MERCHANT_PROFILES = [
  {
    username: '41100001',
    citizenId: '079200000001',
    regionCode: 'HO_CHI_MINH',
    regionLabel: 'Hồ Chí Minh',
    defaultHubCode: 'HCM-001',
    defaultHubName: 'Hub Quận 1',
    defaultSenderAddress: '86 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
  },
  {
    username: '41100002',
    citizenId: '001200000002',
    regionCode: 'HA_NOI',
    regionLabel: 'Hà Nội',
    defaultHubCode: 'HN-001',
    defaultHubName: 'Hub Cầu Giấy',
    defaultSenderAddress: '178 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội',
  },
  {
    username: '41100003',
    citizenId: '048200000003',
    regionCode: 'DA_NANG',
    regionLabel: 'Đà Nẵng',
    defaultHubCode: 'DN-001',
    defaultHubName: 'Hub Hải Châu',
    defaultSenderAddress: '35 Bạch Đằng, Phường Hải Châu 1, Hải Châu, Đà Nẵng',
  },
];

const SHIPMENTS = [
  shipment('SHPVN260522001', 6, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Nguyễn Thị Lan', '0912345678', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '28 Trần Thái Tông, Cầu Giấy', 'Mỹ phẩm chăm sóc da', 1.2, [22, 18, 12], 780000, 45500, 'EXPRESS', 'DELIVERED'),
  shipment('SHPVN260522002', 5, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Phạm Minh Tuấn', '0987654321', 'DN-001', 'Đà Nẵng', 'Phường Hải Châu 1', '60 Nguyễn Văn Linh, Hải Châu', 'Tai nghe không dây', 0.8, [18, 16, 10], 1250000, 38500, 'STANDARD', 'DELIVERED'),
  shipment('SHPVN260522003', 4, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Hoàng Gia Hân', '0938123456', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '15 Duy Tân, Cầu Giấy', 'Áo khoác chống nắng', 1.5, [30, 24, 8], 420000, 42000, 'EXPRESS', 'IN_TRANSIT'),
  shipment('SHPVN260522004', 3, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Lê Thu Trang', '0977001122', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '91 Trung Kính, Cầu Giấy', 'Sách kinh doanh', 2.1, [28, 22, 14], 350000, 48000, 'STANDARD', 'SCAN_INBOUND'),
  shipment('SHPVN260522005', 2, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Đỗ Hoàng Nam', '0966123456', 'DN-001', 'Đà Nẵng', 'Phường Hải Châu 1', '120 Lê Duẩn, Hải Châu', 'Bộ phụ kiện điện thoại', 0.6, [20, 14, 10], 260000, 32000, 'STANDARD', 'UPDATED'),
  shipment('SHPVN260522006', 1, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Vũ Hải Yến', '0908123456', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '44 Hồ Tùng Mậu, Cầu Giấy', 'Đèn bàn làm việc', 1.1, [26, 20, 16], 590000, 39000, 'EXPRESS', 'TASK_ASSIGNED'),
  shipment('SHPVN260522007', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Bùi Thanh Tùng', '0945123789', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '32 Hai Bà Trưng, Quận 1', 'Cà phê rang xay', 1.8, [24, 18, 18], 310000, 29000, 'SAME_DAY', 'PICKUP_COMPLETED'),
  shipment('SHPVN260522008', 6, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Ngô Phương Mai', '0922009988', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '66 Trần Đăng Ninh, Cầu Giấy', 'Máy xay cầm tay', 1.7, [32, 22, 18], 860000, 52000, 'EXPRESS', 'RETURN_STARTED'),
  shipment('SHPVN260522009', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Mai Quốc Việt', '0911223344', 'DN-001', 'Đà Nẵng', 'Phường Hải Châu 1', '19 Ông Ích Khiêm, Hải Châu', 'Bình giữ nhiệt', 0.9, [24, 12, 12], 0, 30000, 'STANDARD', 'CREATED'),
  shipment('SHPVN260522010', 7, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Trịnh Khánh Linh', '0933557799', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '75 Pasteur, Quận 1', 'Hộp quà doanh nghiệp', 2.4, [36, 26, 18], 1500000, 36000, 'SAME_DAY', 'DELIVERED'),
  shipment('SHPVN260522011', 1, '41100002', 'Nhà sách Minh Châu', '0904110002', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '178 Cầu Giấy', 'Đặng Minh Khoa', '0909001122', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '10 Tôn Đức Thắng, Quận 1', 'Sách thiếu nhi', 3.2, [34, 24, 20], 450000, 56000, 'STANDARD', 'PICKUP_COMPLETED'),
  shipment('SHPVN260522012', 2, '41100003', 'Thực phẩm sạch Sơn Trà', '0904110003', 'DN-001', 'Đà Nẵng', 'Phường Hải Châu 1', '35 Bạch Đằng', 'Nguyễn Hồng Phúc', '0988112233', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '22 Nguyễn Thị Minh Khai, Quận 1', 'Hộp hạt dinh dưỡng', 1.4, [25, 18, 12], 640000, 44000, 'EXPRESS', 'IN_TRANSIT'),
];

const FULL_FLOW_SHIPMENTS = [
  shipment('SHPFULL260522001', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Nguyễn Hoài An', '0901555001', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '11 Thành Thái, Cầu Giấy', 'Đồng hồ thông minh', 0.7, [18, 14, 8], 1890000, 41000, 'EXPRESS', 'DELIVERED'),
  shipment('SHPFULL260522002', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Trần Nhật Minh', '0901555002', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '42 Nguyễn Khánh Toàn, Cầu Giấy', 'Máy lọc không khí mini', 2.8, [38, 28, 22], 1350000, 69000, 'STANDARD', 'DELIVERED'),
  shipment('SHPFULL260522003', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Lê Thanh Huyền', '0901555003', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '9 Phạm Hùng, Nam Từ Liêm', 'Bộ mỹ phẩm cao cấp', 1.1, [24, 18, 12], 2450000, 52000, 'EXPRESS', 'DELIVERED'),
  shipment('SHPFULL260522004', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Phạm Quốc Hưng', '0901555004', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '88 Xuân Thủy, Cầu Giấy', 'Bộ dụng cụ nhà bếp', 3.4, [42, 30, 24], 980000, 74000, 'STANDARD', 'DELIVERED'),
  shipment('SHPFULL260522005', 0, '41100001', 'Cửa hàng An Phú', '0904110001', 'HCM-001', 'Hồ Chí Minh', 'Phường Bến Nghé', '86 Nguyễn Huệ, Quận 1', 'Đỗ Mai Chi', '0901555005', 'HN-001', 'Hà Nội', 'Phường Dịch Vọng', '21 Hoàng Quốc Việt, Cầu Giấy', 'Loa bluetooth chống nước', 1.6, [28, 20, 16], 1150000, 58000, 'EXPRESS', 'DELIVERED'),
];

const ALL_SHIPMENTS = [...SHIPMENTS, ...FULL_FLOW_SHIPMENTS];

const CHANGE_REQUEST = {
  shipmentCode: 'SHPVN260522006',
  requestType: 'change.phone',
  payload: { newPhone: '0908123499', reason: 'Người nhận đổi số liên hệ trong ngày giao.' },
  requestedBy: '41100001',
};

const MANIFESTS = [
  { code: 'MNF-HCM-HN-260522-01', originHubCode: 'HCM-001', destinationHubCode: 'HN-001', shipmentCodes: ['SHPVN260522001', 'SHPVN260522004', 'SHPVN260522008'] },
  { code: 'MNF-HCM-DN-260522-01', originHubCode: 'HCM-001', destinationHubCode: 'DN-001', shipmentCodes: ['SHPVN260522002'] },
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  log('Kiểm tra service đang chạy');
  await waitForServices();

  log('Tạo user, masterdata, merchant profile');
  await ensureUsers();
  await ensureMasterdata();

  log('Tạo shipment thật qua shipment-service');
  for (const item of ALL_SHIPMENTS) {
    await ensureShipment(item);
    await syncCod(item);
  }

  log('Tạo pickup, scan, manifest, delivery, COD theo luồng vận hành');
  await runOperationalFlows();
  await runFullFlowOrders();

  log('Tạo change request merchant');
  await ensureChangeRequest(CHANGE_REQUEST);

  if (SHOULD_BACKDATE) {
    log('Backdate dữ liệu để dashboard có biểu đồ 7 ngày');
    await backdateOperationalData();
  }

  if (SHOULD_REPAIR_STATUS) {
    log('Đồng bộ trạng thái shipment cuối cùng nếu event consumer còn trễ');
    await repairShipmentStatuses();
  }

  await sleep(1200);
  await printSummary();
}

async function waitForServices() {
  for (const [name, baseUrl] of Object.entries(BASE)) {
    const healthUrl = `${baseUrl}/health`;
    await waitForHttp(name, healthUrl);
  }
}

async function ensureUsers() {
  for (const user of USERS) {
    const existing = await findUser(user.username);
    const body = { ...user, password: DEFAULT_PASSWORD, status: 'ACTIVE' };
    if (existing) {
      await request('PATCH', `${BASE.auth}/auth/users/${encodeURIComponent(existing.id)}`, body);
    } else {
      await request('POST', `${BASE.auth}/auth/users`, body);
    }
  }
}

async function ensureMasterdata() {
  for (const zone of ZONES) await ensureByCode(BASE.masterdata, 'zones', zone);
  for (const hub of HUBS) await ensureByCode(BASE.masterdata, 'hubs', { ...hub, isActive: true });
  for (const reason of NDR_REASONS) await ensureByCode(BASE.masterdata, 'ndr-reasons', reason);

  await ensureConfig({
    key: 'delivery.retry.max_attempts',
    scope: 'DELIVERY',
    description: 'Số lần giao lại tối đa trước khi chuyển NDR.',
    value: configEnvelope('Số lần giao lại tối đa', 'NUMBER', 3, 3),
  });

  for (const profile of MERCHANT_PROFILES) {
    await request('PUT', `${BASE.masterdata}/merchant-profiles/by-username/${encodeURIComponent(profile.username)}`, profile);
    await ensureConfig({
      key: `merchant.profile.${profile.username}`,
      scope: 'MERCHANT_PROFILE',
      description: `Hồ sơ merchant ${profile.username}.`,
      value: profile,
    });
  }
}

async function ensureShipment(item) {
  const existing = await getOptional(`${BASE.shipment}/shipments/${encodeURIComponent(item.code)}`);
  const body = { code: item.code, metadata: item.metadata };
  if (existing) {
    await request('PATCH', `${BASE.shipment}/shipments/${encodeURIComponent(item.code)}`, { metadata: item.metadata });
    return existing;
  }
  return request('POST', `${BASE.shipment}/shipments`, body);
}

async function runOperationalFlows() {
  for (const item of SHIPMENTS) {
    if (item.targetStatus === 'CREATED') continue;
    const pickup = await ensurePickup(item);

    if (['TASK_ASSIGNED', 'PICKUP_COMPLETED', 'IN_TRANSIT', 'SCAN_INBOUND', 'DELIVERED', 'RETURN_STARTED'].includes(item.targetStatus)) {
      if (pickup.status === 'REQUESTED') {
        await request('POST', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}/approve`, {
          approvedBy: '20000001',
          note: `Duyệt lấy hàng ${item.code}`,
        });
      }
    }

    if (['PICKUP_COMPLETED', 'IN_TRANSIT', 'SCAN_INBOUND', 'DELIVERED', 'RETURN_STARTED'].includes(item.targetStatus)) {
      await recordScan('pickup', item.code, item.senderHubCode, null, '30000001', `Nhận hàng tại ${item.senderHubCode}`, eventDate(item.daysAgo, 9), `real-${item.code}-pickup`);
      const refreshedPickup = await request('GET', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}`);
      if (refreshedPickup.status === 'APPROVED') {
        await request('POST', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}/complete`);
      }
    }
  }

  for (const manifest of MANIFESTS) {
    const createdManifest = await ensureManifest(manifest);
    if (createdManifest.status === 'CREATED') {
      await request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(createdManifest.id)}/seal`, {
        sealedBy: '20000001',
        sealedByName: 'Điều phối HCM',
        processingHubCode: manifest.originHubCode,
        note: 'Niêm phong xe tuyến theo dữ liệu bootstrap thực tế.',
      });
      await sleep(600);
    }
    const current = await request('GET', `${BASE.manifest}/manifests/${encodeURIComponent(createdManifest.id)}`);
    if (current.status === 'SEALED') {
      await request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(current.id)}/receive`, {
        receivedBy: '20000002',
        note: 'Nhận xe tuyến tại hub đích.',
      });
    }
  }

  await recordScan('outbound', 'SHPVN260522003', 'HCM-001', null, '20000001', 'VEHICLE_OUTBOUND - xe tuyến HCM đi Hà Nội', eventDate(4, 14), 'real-SHPVN260522003-outbound');
  await recordScan('outbound', 'SHPVN260522012', 'DN-001', null, '20000003', 'VEHICLE_OUTBOUND - xe tuyến Đà Nẵng đi HCM', eventDate(2, 13), 'real-SHPVN260522012-outbound');
  await recordScan('inbound', 'SHPVN260522004', 'HN-001', 'MNF-HCM-HN-260522-01', '20000002', 'Kiểm hàng đến hub Cầu Giấy', eventDate(3, 17), 'real-SHPVN260522004-inbound');

  await deliverSuccess('SHPVN260522001', 'HN-001', '30000002', 780000, eventDate(5, 16), true);
  await deliverSuccess('SHPVN260522002', 'DN-001', '30000003', 1250000, eventDate(4, 15), false);
  await deliverSuccess('SHPVN260522010', 'HCM-001', '30000001', 1500000, eventDate(7, 18), true);
  await deliverFailReturn('SHPVN260522008', 'HN-001', '30000002', eventDate(5, 18));
}

async function runFullFlowOrders() {
  const manifestCode = 'MNF-FULL-HCM-HN-260522-01';
  const shipmentCodes = FULL_FLOW_SHIPMENTS.map((item) => item.code);

  for (const item of FULL_FLOW_SHIPMENTS) {
    const pickup = await ensurePickup(item);
    if (pickup.status === 'REQUESTED') {
      await request('POST', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}/approve`, {
        approvedBy: '20000001',
        note: `Ops phân công lấy hàng full-flow ${item.code}`,
      });
    }

    const pickupTask = await ensureTaskAssigned({
      shipmentCode: item.code,
      taskType: 'PICKUP',
      courierId: '30000001',
      pickupRequestId: pickup.id,
      note: `Courier 30000001 đi lấy hàng ${item.code}`,
    });

    await recordScan('pickup', item.code, item.senderHubCode, null, '30000001', `Courier nhận hàng từ merchant và mang về ${item.senderHubCode}`, eventDate(0, 9), `full-${item.code}-pickup`);

    const refreshedPickup = await request('GET', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}`);
    if (refreshedPickup.status === 'APPROVED') {
      await request('POST', `${BASE.pickup}/pickups/${encodeURIComponent(pickup.id)}/complete`);
    }
    await completeTaskIfAssigned(pickupTask.id);
  }

  const manifest = await ensureFullFlowManifest({
    manifestCode,
    originHubCode: 'HCM-001',
    destinationHubCode: 'HN-001',
    shipmentCodes,
  });

  const latestManifest = await progressFullFlowManifest(manifest, shipmentCodes);

  for (const item of FULL_FLOW_SHIPMENTS) {
    await recordScan('outbound', item.code, 'HCM-001', manifestCode, '20000001', 'SEND_GOODS - gửi bao hàng lên tuyến HCM-HN', eventDate(0, 12), `full-${item.code}-send-goods`);
    await recordScan('outbound', item.code, 'HCM-001', manifestCode, '20000001', 'VEHICLE_OUTBOUND - xe rời hub HCM đi hub Hà Nội', eventDate(0, 13), `full-${item.code}-vehicle-outbound`);
    await recordScan('inbound', item.code, 'HN-001', manifestCode, '20000002', 'Hàng đến hub đích HN-001, chờ gỡ bao', eventDate(0, 15), `full-${item.code}-inbound-destination`);
  }

  await unsealFullFlowManifest(latestManifest.id, shipmentCodes);

  for (const item of FULL_FLOW_SHIPMENTS) {
    const deliveryTask = await ensureTaskAssigned({
      shipmentCode: item.code,
      taskType: 'DELIVERY',
      courierId: '30000002',
      pickupRequestId: null,
      note: `Courier 30000002 phát hàng ${item.code} tại Hà Nội`,
    });
    await deliverSuccess(item.code, 'HN-001', '30000002', item.metadata.codAmount, eventDate(0, 17), true);
    await completeTaskIfAssigned(deliveryTask.id);
  }
}

async function ensurePickup(item) {
  const pickupCode = `PUP-${item.code}`;
  const pickups = await request('GET', `${BASE.pickup}/pickups`);
  const existing = pickups.find((pickup) => pickup.pickupCode === pickupCode);
  if (existing) return existing;

  return request('POST', `${BASE.pickup}/pickups`, {
    pickupCode,
    requesterName: item.senderName,
    contactPhone: item.senderPhone,
    pickupAddress: `${item.senderAddress}, ${item.senderWard}, ${item.senderProvince}`,
    note: `Pickup tự động cho ${item.code}`,
    items: [{ shipmentCode: item.code, quantity: 1 }],
  });
}

async function ensureTaskAssigned({ shipmentCode, taskType, courierId, pickupRequestId, note }) {
  const task = await ensureTask({ shipmentCode, taskType, pickupRequestId, note });
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return task;
  }

  const activeAssignment = task.assignments?.find((assignment) => assignment.unassignedAt === null) ?? null;
  if (activeAssignment?.courierId === courierId) {
    return task;
  }

  if (activeAssignment) {
    return request('POST', `${BASE.dispatch}/tasks/${encodeURIComponent(task.id)}/reassign`, { courierId });
  }

  return request('POST', `${BASE.dispatch}/tasks/${encodeURIComponent(task.id)}/assign`, { courierId });
}

async function ensureTask({ shipmentCode, taskType, pickupRequestId, note }) {
  const query = new URLSearchParams({ shipmentCode, taskType });
  const existingTasks = await request('GET', `${BASE.dispatch}/tasks?${query.toString()}`);
  const activeTask =
    existingTasks.find((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED') ??
    existingTasks[0];
  if (activeTask) return activeTask;

  return request('POST', `${BASE.dispatch}/tasks`, {
    taskCode: `FULL-${taskType}-${shipmentCode}`,
    taskType,
    shipmentCode,
    pickupRequestId,
    note,
  });
}

async function completeTaskIfAssigned(taskId) {
  const task = await request('GET', `${BASE.dispatch}/tasks/${encodeURIComponent(taskId)}`);
  if (task.status === 'ASSIGNED') {
    await request('PATCH', `${BASE.dispatch}/tasks/${encodeURIComponent(task.id)}/status`, { status: 'COMPLETED' });
  }
}

async function ensureManifest(input) {
  const manifests = await request('GET', `${BASE.manifest}/manifests`);
  const existing = manifests.find((manifest) => manifest.manifestCode === input.code);
  if (existing) return existing;

  return request('POST', `${BASE.manifest}/manifests`, {
    manifestCode: input.code,
    originHubCode: input.originHubCode,
    destinationHubCode: input.destinationHubCode,
    note: 'Tuyến xe liên hub tạo bởi bootstrap dữ liệu thật.',
    shipmentCodes: input.shipmentCodes,
  });
}

async function ensureFullFlowManifest(input) {
  const manifests = await request('GET', `${BASE.manifest}/manifests`);
  const existing = manifests.find((manifest) => manifest.manifestCode === input.manifestCode);
  if (existing) return existing;

  return request('POST', `${BASE.manifest}/manifests`, {
    manifestCode: input.manifestCode,
    originHubCode: input.originHubCode,
    destinationHubCode: input.destinationHubCode,
    note: 'Bao hàng full-flow merchant -> hub đích -> phát hàng.',
    shipmentCodes: input.shipmentCodes,
  });
}

async function progressFullFlowManifest(manifest, shipmentCodes) {
  let current = await request('GET', `${BASE.manifest}/manifests/${encodeURIComponent(manifest.id)}`);
  const currentCodes = new Set((current.items ?? []).map((item) => item.shipmentCode));
  const missingCodes = shipmentCodes.filter((code) => !currentCodes.has(code));

  if (current.status === 'CREATED' && missingCodes.length > 0) {
    current = await request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(current.id)}/shipments/add`, {
      shipmentCodes: missingCodes,
      note: 'Đóng thêm hàng vào bao full-flow.',
    });
  }

  if (current.status === 'CREATED') {
    current = await request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(current.id)}/seal`, {
      sealedBy: '20000001',
      sealedByName: 'Điều phối HCM',
      processingHubCode: 'HCM-001',
      note: 'Đóng bao và niêm phong bao hàng full-flow.',
    });
    await sleep(600);
  }

  if (current.status === 'SEALED') {
    current = await request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(current.id)}/receive`, {
      receivedBy: '20000002',
      note: 'Xe đến hub đích, nhận bao hàng full-flow.',
    });
  }

  return current;
}

async function unsealFullFlowManifest(manifestId, shipmentCodes) {
  const manifest = await request('GET', `${BASE.manifest}/manifests/${encodeURIComponent(manifestId)}`);
  const currentCodes = new Set((manifest.items ?? []).map((item) => item.shipmentCode));
  const removableCodes = shipmentCodes.filter((code) => currentCodes.has(code));

  if (removableCodes.length === 0) {
    return manifest;
  }

  return request('POST', `${BASE.manifest}/manifests/${encodeURIComponent(manifest.id)}/shipments/remove`, {
    shipmentCodes: removableCodes,
    unsealedBy: '20000002',
    unsealedByName: 'Điều phối Hà Nội',
    processingHubCode: 'HN-001',
    note: 'UNBAGGED - gỡ bao, tách hàng ra tuyến phát.',
  });
}

async function ensureChangeRequest(body) {
  const rows = await request('GET', `${BASE.shipment}/change-requests`);
  const existing = rows.find((item) => item.shipmentCode === body.shipmentCode && item.requestType === body.requestType);
  if (existing) return existing;
  return request('POST', `${BASE.shipment}/change-requests`, body);
}

async function deliverSuccess(shipmentCode, locationCode, courierId, amount, occurredAt, remit) {
  await request('POST', `${BASE.delivery}/deliveries/success`, {
    shipmentCode,
    courierId,
    locationCode,
    actor: courierId,
    note: 'Người nhận đã ký nhận hàng.',
    occurredAt,
    idempotencyKey: `real-${shipmentCode}-delivered`,
    podNote: 'Đã đối soát chữ ký người nhận.',
    podCapturedBy: courierId,
    otpCode: '123456',
  });
  await request('POST', `${BASE.payment}/cod/collect`, {
    shipmentCode,
    collectedAmount: amount,
    courierId,
    paymentMethod: 'COD',
    occurredAt,
    idempotencyKey: `real-${shipmentCode}-cod-collected`,
    note: 'Thu COD tiền mặt khi giao thành công.',
  });
  if (remit) {
    await request('POST', `${BASE.payment}/cod/remit`, {
      shipmentCode,
      remittedBy: '20000001',
      idempotencyKey: `real-${shipmentCode}-cod-remitted`,
      note: 'Bưu tá nộp COD cuối ca.',
    });
  }
}

async function deliverFailReturn(shipmentCode, locationCode, courierId, occurredAt) {
  await request('POST', `${BASE.delivery}/deliveries/fail`, {
    shipmentCode,
    courierId,
    locationCode,
    actor: courierId,
    note: 'Người nhận từ chối nhận vì đổi nhu cầu.',
    occurredAt,
    idempotencyKey: `real-${shipmentCode}-delivery-failed`,
    failReasonCode: 'CUS_REFUSED',
    createNdr: true,
    startReturn: true,
  });
}

async function recordScan(kind, shipmentCode, locationCode, manifestCode, actor, note, occurredAt, idempotencyKey) {
  await request('POST', `${BASE.scan}/scans/${kind}`, {
    shipmentCode,
    locationCode,
    manifestCode,
    actor,
    note,
    occurredAt,
    idempotencyKey,
  });
}

async function syncCod(item) {
  if (!item.metadata.codAmount || item.metadata.codAmount <= 0) return;
  await request('POST', `${BASE.payment}/cod/records/sync-shipment`, {
    shipmentCode: item.code,
    merchantId: item.merchantUsername,
    currency: 'VND',
    codAmount: item.metadata.codAmount,
    hubCode: item.senderHubCode,
    metadata: item.metadata,
  });
}

async function repairShipmentStatuses() {
  for (const item of ALL_SHIPMENTS) {
    await runSql('shipment_db', `UPDATE shipments SET "currentStatus" = '${item.targetStatus}'::"ShipmentCurrentStatus", "updatedAt" = NOW() WHERE code = '${sqlText(item.code)}';`);
  }
}

async function backdateOperationalData() {
  for (const item of ALL_SHIPMENTS) {
    const createdAt = eventDate(item.daysAgo, 8);
    await runSql('shipment_db', `UPDATE shipments SET "createdAt" = '${createdAt}'::timestamptz WHERE code = '${sqlText(item.code)}';`);
    await runSql('pickup_db', `UPDATE pickup_requests SET "createdAt" = '${createdAt}'::timestamptz WHERE "pickupCode" = 'PUP-${sqlText(item.code)}';`);
    await runSql('payment_db', `UPDATE cod_records SET "createdAt" = '${createdAt}'::timestamptz WHERE "shipmentCode" = '${sqlText(item.code)}';`);
  }
}

async function printSummary() {
  const shipments = await request('GET', `${BASE.shipment}/shipments`);
  const pickups = await request('GET', `${BASE.pickup}/pickups`);
  const codSummary = await request('GET', `${BASE.payment}/cod/summary/30000001`);
  const merchantShipments = shipments.filter((item) => item.metadata?.createdByUsername === '41100001');
  const statusSummary = merchantShipments.reduce((acc, item) => {
    acc[item.currentStatus] = (acc[item.currentStatus] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\nBootstrap dữ liệu thật hoàn tất.');
  console.log(`- Shipments: ${shipments.length} tổng, ${merchantShipments.length} thuộc merchant 41100001`);
  console.log(`- Pickups: ${pickups.length}`);
  console.log(`- COD courier 30000001: pending=${codSummary.totalPending}, collected=${codSummary.totalCollected}, remitted=${codSummary.totalRemitted}`);
  console.log(`- Trạng thái merchant 41100001: ${JSON.stringify(statusSummary)}`);
  console.log('- Đăng nhập merchant: 41100001 / password');
}

async function ensureByCode(baseUrl, resource, payload) {
  const rows = await request('GET', `${baseUrl}/${resource}?code=${encodeURIComponent(payload.code)}`);
  const existing = rows.find((item) => item.code === payload.code);
  if (existing) {
    return request('PATCH', `${baseUrl}/${resource}/${encodeURIComponent(existing.id)}`, payload);
  }
  return request('POST', `${baseUrl}/${resource}`, payload);
}

async function ensureConfig(payload) {
  const rows = await request('GET', `${BASE.masterdata}/configs?key=${encodeURIComponent(payload.key)}`);
  const existing = rows.find((item) => item.key === payload.key);
  if (existing) {
    return request('PATCH', `${BASE.masterdata}/configs/${encodeURIComponent(existing.id)}`, payload);
  }
  return request('POST', `${BASE.masterdata}/configs`, payload);
}

async function findUser(username) {
  const rows = await request('GET', `${BASE.auth}/auth/users?q=${encodeURIComponent(username)}`);
  return rows.find((item) => item.username === username) ?? null;
}

async function getOptional(url) {
  const response = await fetch(url);
  if (response.status === 404) return null;
  return parseResponse(response, 'GET', url);
}

async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse(response, method, url);
}

async function parseResponse(response, method, url) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? text;
    throw new Error(`${method} ${url} -> ${response.status}: ${Array.isArray(message) ? message.join('; ') : message}`);
  }
  return payload;
}

async function waitForHttp(name, url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Service is still booting.
    }
    await sleep(1000);
  }
  throw new Error(`Service ${name} chưa sẵn sàng tại ${url}`);
}

async function runSql(database, sql) {
  try {
    execFileSync('docker', ['exec', '-i', POSTGRES_CONTAINER, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const message = error.stderr?.toString() || error.message;
    throw new Error(`SQL ${database} failed: ${message}`);
  }
}

function shipment(code, daysAgo, merchantUsername, senderName, senderPhone, senderHubCode, senderProvince, senderWard, senderAddress, receiverName, receiverPhone, receiverHubCode, receiverProvince, receiverWard, receiverAddress, itemType, weightKg, dimensions, codAmount, estimatedFee, serviceType, targetStatus) {
  const metadata = {
    createdBy: { username: merchantUsername, userId: merchantUsername },
    createdByUsername: merchantUsername,
    createdByUserId: merchantUsername,
    sender: {
      name: senderName,
      phone: senderPhone,
      address: `${senderAddress}, ${senderWard}, ${senderProvince}`,
      addressDetail: senderAddress,
      province: senderProvince,
      ward: senderWard,
      hubCode: senderHubCode,
    },
    receiver: {
      name: receiverName,
      phone: receiverPhone,
      address: `${receiverAddress}, ${receiverWard}, ${receiverProvince}`,
      addressDetail: receiverAddress,
      region: receiverProvince,
      province: receiverProvince,
      ward: receiverWard,
      hubCode: receiverHubCode,
    },
    package: {
      itemType,
      weightKg,
      dimensionsCm: { length: dimensions[0], width: dimensions[1], height: dimensions[2] },
      declaredValue: codAmount,
    },
    service: { type: serviceType },
    codAmount,
    deliveryNote: 'Gọi người nhận trước khi giao. Cho kiểm ngoại quan nếu cần.',
    estimatedFee,
    routing: { originHubCode: senderHubCode, destinationHubCode: receiverHubCode },
    source: 'merchant-web',
    currency: 'VND',
  };

  return {
    code,
    daysAgo,
    merchantUsername,
    senderName,
    senderPhone,
    senderHubCode,
    senderProvince,
    senderWard,
    senderAddress,
    metadata,
    targetStatus,
  };
}

function eventDate(daysAgo, hour) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
}

function hubAddress(province, district, ward, addressLine, phone, contactName) {
  return JSON.stringify({ province, district, ward, addressLine, phone, contactName });
}

function ndrDescription(name, category, description, allowReschedule, allowReturn, sortOrder) {
  return JSON.stringify({ name, category, description, allowReschedule, allowReturn, sortOrder });
}

function configEnvelope(name, valueType, value, defaultValue) {
  return { name, valueType, value, defaultValue, isActive: true, isEditable: true };
}

function sqlText(value) {
  return String(value).replaceAll("'", "''");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  console.log(`[bootstrap-real-data] ${message}`);
}
