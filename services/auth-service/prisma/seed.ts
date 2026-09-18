import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

import {
  branchHubCodeForProvince,
  branchHubNameForProvince,
  loadVietnamProvinces,
  merchantUsernameForProvinceIndex,
  NATIONAL_HQ_HUB,
  REGIONAL_HUBS,
  SAMPLE_WARD_HUBS,
} from '../../../infra/dev/seed/vietnam-logistics-seed-data';

const prisma = new PrismaClient();

const demoPassword = process.env.DEMO_PASSWORD ?? 'password';
const passwordHash = createHash('sha256').update(demoPassword).digest('hex');

const permissionFeatures = [
  'scan.delivery-sign',
  'scan.return-sign',
  'scan.pickup',
  'scan.bag-seal',
  'scan.bag-unseal',
  'scan.delivery',
  'scan.issue',
  'scan.outbound',
  'scan.inbound',
  'scan.vehicle-inbound',
  'scan.vehicle-outbound',
  'scan.inventory-check',
  'scan.branch-pickup',
  'scan.high-value-label',
  'scan.high-value-check',
] as const;

function allPermissions(enabled: boolean): Record<string, boolean> {
  return Object.fromEntries(
    permissionFeatures.map((feature) => [feature, enabled]),
  );
}

async function seedUsers() {
  const allRegionalHubCodes = Object.values(REGIONAL_HUBS).map((hub) => hub.code);
  const keyBranchHubCodes = ['001001B001', '003079B001', '002048B001', 'HN-001', 'HCM-001', 'DN-001'];
  const keyWardHubCodes = [
    '00101W001', '00102W001', '00103W001', '00104W001',                     // Hà Nội
    '04801W001', '04801W002', '04802W001',                                  // Đà Nẵng
    '07901W001', '07901W002', '07903W001', '07905W001', '07912W001', '07913W001', // TP.HCM
  ];
  const allSystemHubCodes = [
    NATIONAL_HQ_HUB.code,
    ...allRegionalHubCodes,
    ...keyBranchHubCodes,
    ...keyWardHubCodes,
  ];

  // =========================================================================
  // 1. HQ TOÀN HỆ THỐNG (Cấp 0 - Macro Command Center & Executive)
  // =========================================================================
  const hqUsers = [
    {
      id: '10000001',
      username: '10000001',
      roles: ['SYSTEM_ADMIN'],
      displayName: 'Admin Tổng NEXUS Toàn quốc',
      phone: '0901000001',
      hubCodes: allSystemHubCodes,
    },
    {
      id: '20000000',
      username: '20000000',
      roles: ['HQ_OPS', 'OPS_ADMIN'],
      displayName: 'Giám đốc Điều hành HQ Toàn quốc',
      phone: '0902000000',
      hubCodes: allSystemHubCodes,
    },
  ];

  // =========================================================================
  // 2. CÁN BỘ VẬN HÀNH CẤP MIỀN (Cấp 1 - 3 Miền Bắc / Trung / Nam)
  // =========================================================================
  const regionalUsers = [
    // --- Miền Bắc (HAN - Zone 1) ---
    {
      id: '20000001',
      username: '20000001',
      roles: ['REGIONAL_OPS', 'OPS_ADMIN'],
      displayName: 'Giám đốc Điều hành Miền Bắc',
      phone: '0902000001',
      hubCodes: [REGIONAL_HUBS.NORTH.code, '001001B001', 'HN-001'],
    },
    {
      id: '20000004',
      username: '20000004',
      roles: ['REGIONAL_OPS', 'OPS_VIEWER'],
      displayName: 'Điều phối viên Tuyến trục Miền Bắc',
      phone: '0902000004',
      hubCodes: [REGIONAL_HUBS.NORTH.code],
    },
    {
      id: '30000001',
      username: '30000001',
      roles: ['COURIER'],
      displayName: 'Tài xế Xe tải Linehaul Miền Bắc',
      phone: '0903000001',
      hubCodes: [REGIONAL_HUBS.NORTH.code],
    },

    // --- Miền Trung (DAN - Zone 2) ---
    {
      id: '20000002',
      username: '20000002',
      roles: ['REGIONAL_OPS', 'OPS_ADMIN'],
      displayName: 'Giám đốc Điều hành Miền Trung',
      phone: '0902000002',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code, '002048B001', 'DN-001'],
    },
    {
      id: '20000005',
      username: '20000005',
      roles: ['REGIONAL_OPS', 'OPS_VIEWER'],
      displayName: 'Điều phối viên Tuyến trục Miền Trung',
      phone: '0902000005',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code],
    },
    {
      id: '30000002',
      username: '30000002',
      roles: ['COURIER'],
      displayName: 'Tài xế Xe tải Linehaul Miền Trung',
      phone: '0903000002',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code],
    },

    // --- Miền Nam (SGN - Zone 3) ---
    {
      id: '20000003',
      username: '20000003',
      roles: ['REGIONAL_OPS', 'OPS_ADMIN'],
      displayName: 'Giám đốc Điều hành Miền Nam',
      phone: '0902000003',
      hubCodes: [REGIONAL_HUBS.SOUTH.code, '003079B001', 'HCM-001'],
    },
    {
      id: '20000006',
      username: '20000006',
      roles: ['REGIONAL_OPS', 'OPS_VIEWER'],
      displayName: 'Điều phối viên Tuyến trục Miền Nam',
      phone: '0902000006',
      hubCodes: [REGIONAL_HUBS.SOUTH.code],
    },
    {
      id: '30000003',
      username: '30000003',
      roles: ['COURIER'],
      displayName: 'Tài xế Xe tải Linehaul Miền Nam',
      phone: '0903000003',
      hubCodes: [REGIONAL_HUBS.SOUTH.code],
    },
  ];

  // =========================================================================
  // 3. QUẢN LÝ CẤP TỈNH / THÀNH PHỐ TRỌNG ĐIỂM (Cấp 2 - Hà Nội, TP.HCM & Đà Nẵng)
  // Các tỉnh khác KHÔNG tạo tài khoản user theo chỉ đạo để giảm kích thước dữ liệu
  // =========================================================================
  const keyProvincialUsers = [
    // --- Hà Nội ---
    {
      id: '20000007',
      username: '20000007',
      roles: ['PROVINCIAL_OPS'],
      displayName: 'Trưởng kho Tỉnh Hà Nội',
      phone: '0902000007',
      hubCodes: ['001001B001', 'HN-001'],
    },
    {
      id: '30000007',
      username: '30000007',
      roles: ['COURIER'],
      displayName: 'Đội trưởng Giao nhận Hà Nội',
      phone: '0903000007',
      hubCodes: ['001001B001', 'HN-001'],
    },
    {
      id: '41100001',
      username: '41100001',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Hàng Bài - Hoàn Kiếm',
      phone: '0941000001',
      hubCodes: ['00101W001', '001001B001', 'HN-001'],
    },
    {
      id: '41100002',
      username: '41100002',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Kim Mã - Ba Đình',
      phone: '0941000002',
      hubCodes: ['00102W001', '001001B001', 'HN-001'],
    },
    {
      id: '41100003',
      username: '41100003',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Dịch Vọng - Cầu Giấy',
      phone: '0941000003',
      hubCodes: ['00103W001', '001001B001', 'HN-001'],
    },
    {
      id: '41100004',
      username: '41100004',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Trung Liệt - Đống Đa',
      phone: '0941000004',
      hubCodes: ['00104W001', '001001B001', 'HN-001'],
    },

    // --- TP. Hồ Chí Minh ---
    {
      id: '20000079',
      username: '20000079',
      roles: ['PROVINCIAL_OPS'],
      displayName: 'Trưởng kho Tỉnh TP. Hồ Chí Minh',
      phone: '0902000079',
      hubCodes: ['003079B001', 'HCM-001'],
    },
    {
      id: '30000079',
      username: '30000079',
      roles: ['COURIER'],
      displayName: 'Đội trưởng Giao nhận TP. Hồ Chí Minh',
      phone: '0903000079',
      hubCodes: ['003079B001', 'HCM-001'],
    },
    {
      id: '41100079',
      username: '41100079',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Bến Thành - Quận 1',
      phone: '0941000079',
      hubCodes: ['07901W001', '003079B001', 'HCM-001'],
    },
    {
      id: '41100080',
      username: '41100080',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường 13 - Quận 3',
      phone: '0941000080',
      hubCodes: ['07903W001', '003079B001', 'HCM-001'],
    },
    {
      id: '41100081',
      username: '41100081',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường 13 - Tân Bình',
      phone: '0941000081',
      hubCodes: ['07913W001', '003079B001', 'HCM-001'],
    },
    {
      id: '41100082',
      username: '41100082',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường An Phú Đông - Quận 12',
      phone: '0941000082',
      hubCodes: ['07912W001', '003079B001', 'HCM-001'],
    },

    // --- Đà Nẵng (Trung tâm Miền Trung) ---
    {
      id: '20000048',
      username: '20000048',
      roles: ['PROVINCIAL_OPS'],
      displayName: 'Trưởng kho Tỉnh Đà Nẵng',
      phone: '0902000048',
      hubCodes: ['002048B001', 'DN-001'],
    },
    {
      id: '30000048',
      username: '30000048',
      roles: ['COURIER'],
      displayName: 'Đội trưởng Giao nhận Đà Nẵng',
      phone: '0903000048',
      hubCodes: ['002048B001', 'DN-001'],
    },
    {
      id: '41100048',
      username: '41100048',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Thạch Thang - Hải Châu',
      phone: '0941000048',
      hubCodes: ['04801W001', '002048B001', 'DN-001'],
    },
    {
      id: '41100049',
      username: '41100049',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường Thanh Bình - Hải Châu',
      phone: '0941000049',
      hubCodes: ['04801W002', '002048B001', 'DN-001'],
    },
    {
      id: '41100050',
      username: '41100050',
      roles: ['MERCHANT'],
      displayName: 'Merchant Phường An Hải Bắc - Sơn Trà',
      phone: '0941000050',
      hubCodes: ['04802W001', '002048B001', 'DN-001'],
    },
  ];

  // =========================================================================
  // 4. BƯU CỤC PHƯỜNG & COURIER — 3 TỈNH × 11 PHƯỜNG × 2 COURIER/PHƯỜNG
  // Quy chuẩn mã: 30002001 → 30002022
  // =========================================================================
  const wardAndCourierUsers = [
    // =====================================================================
    // 4.1 HÀ NỘI — 4 Phường × 2 Courier = 8 Courier
    // =====================================================================

    // --- Phường Hàng Bài - Hoàn Kiếm (00101W001) ---
    {
      id: '20002001',
      username: '20002001',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Hàng Bài (Hoàn Kiếm)',
      phone: '0902200001',
      hubCodes: ['00101W001', '001001B001'],
    },
    {
      id: '30002001',
      username: '30002001',
      roles: ['COURIER'],
      displayName: 'Courier Hoàn Kiếm A - Bắc Hàng Bài',
      phone: '0903200001',
      hubCodes: ['00101W001'],
    },
    {
      id: '30002002',
      username: '30002002',
      roles: ['COURIER'],
      displayName: 'Courier Hoàn Kiếm B - Nam Hàng Bài',
      phone: '0903200002',
      hubCodes: ['00101W001'],
    },

    // --- Phường Kim Mã - Ba Đình (00102W001) ---
    {
      id: '20002002',
      username: '20002002',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Kim Mã (Ba Đình)',
      phone: '0902200002',
      hubCodes: ['00102W001', '001001B001'],
    },
    {
      id: '30002003',
      username: '30002003',
      roles: ['COURIER'],
      displayName: 'Courier Ba Đình A - Đông Kim Mã',
      phone: '0903200003',
      hubCodes: ['00102W001'],
    },
    {
      id: '30002004',
      username: '30002004',
      roles: ['COURIER'],
      displayName: 'Courier Ba Đình B - Tây Kim Mã',
      phone: '0903200004',
      hubCodes: ['00102W001'],
    },

    // --- Phường Dịch Vọng - Cầu Giấy (00103W001) ---
    {
      id: '20002003',
      username: '20002003',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Dịch Vọng (Cầu Giấy)',
      phone: '0902200003',
      hubCodes: ['00103W001', '001001B001'],
    },
    {
      id: '30002005',
      username: '30002005',
      roles: ['COURIER'],
      displayName: 'Courier Cầu Giấy A - Bắc Dịch Vọng',
      phone: '0903200005',
      hubCodes: ['00103W001'],
    },
    {
      id: '30002006',
      username: '30002006',
      roles: ['COURIER'],
      displayName: 'Courier Cầu Giấy B - Nam Dịch Vọng',
      phone: '0903200006',
      hubCodes: ['00103W001'],
    },

    // --- Phường Trung Liệt - Đống Đa (00104W001) ---
    {
      id: '20002004',
      username: '20002004',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Trung Liệt (Đống Đa)',
      phone: '0902200004',
      hubCodes: ['00104W001', '001001B001'],
    },
    {
      id: '30002007',
      username: '30002007',
      roles: ['COURIER'],
      displayName: 'Courier Đống Đa A - Đông Thái Hà',
      phone: '0903200007',
      hubCodes: ['00104W001'],
    },
    {
      id: '30002008',
      username: '30002008',
      roles: ['COURIER'],
      displayName: 'Courier Đống Đa B - Tây Thái Hà',
      phone: '0903200008',
      hubCodes: ['00104W001'],
    },

    // =====================================================================
    // 4.2 ĐÀ NẴNG — 3 Phường × 2 Courier = 6 Courier
    // =====================================================================

    // --- Phường Thạch Thang - Hải Châu (04801W001) ---
    {
      id: '20002005',
      username: '20002005',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Thạch Thang (Hải Châu)',
      phone: '0902200005',
      hubCodes: ['04801W001', '002048B001'],
    },
    {
      id: '30002009',
      username: '30002009',
      roles: ['COURIER'],
      displayName: 'Courier Hải Châu A - Bắc Bạch Đằng',
      phone: '0903200009',
      hubCodes: ['04801W001'],
    },
    {
      id: '30002010',
      username: '30002010',
      roles: ['COURIER'],
      displayName: 'Courier Hải Châu B - Nam Bạch Đằng',
      phone: '0903200010',
      hubCodes: ['04801W001'],
    },

    // --- Phường Thanh Bình - Hải Châu (04801W002) ---
    {
      id: '20002006',
      username: '20002006',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Thanh Bình (Hải Châu)',
      phone: '0902200006',
      hubCodes: ['04801W002', '002048B001'],
    },
    {
      id: '30002011',
      username: '30002011',
      roles: ['COURIER'],
      displayName: 'Courier Thanh Bình A - Đông',
      phone: '0903200011',
      hubCodes: ['04801W002'],
    },
    {
      id: '30002012',
      username: '30002012',
      roles: ['COURIER'],
      displayName: 'Courier Thanh Bình B - Tây',
      phone: '0903200012',
      hubCodes: ['04801W002'],
    },

    // --- Phường An Hải Bắc - Sơn Trà (04802W001) ---
    {
      id: '20002007',
      username: '20002007',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục An Hải Bắc (Sơn Trà)',
      phone: '0902200007',
      hubCodes: ['04802W001', '002048B001'],
    },
    {
      id: '30002013',
      username: '30002013',
      roles: ['COURIER'],
      displayName: 'Courier Sơn Trà A - Bắc Sông Hàn',
      phone: '0903200013',
      hubCodes: ['04802W001'],
    },
    {
      id: '30002014',
      username: '30002014',
      roles: ['COURIER'],
      displayName: 'Courier Sơn Trà B - Nam Sông Hàn',
      phone: '0903200014',
      hubCodes: ['04802W001'],
    },

    // =====================================================================
    // 4.3 TP. HỒ CHÍ MINH — 4 Phường × 2 Courier = 8 Courier
    // =====================================================================

    // --- Phường Bến Thành - Quận 1 (07901W001) ---
    {
      id: '20002008',
      username: '20002008',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Bến Thành (Q1)',
      phone: '0902200008',
      hubCodes: ['07901W001', '003079B001'],
    },
    {
      id: '30002015',
      username: '30002015',
      roles: ['COURIER'],
      displayName: 'Courier Q1 A - Đông Chợ Bến Thành',
      phone: '0903200015',
      hubCodes: ['07901W001'],
    },
    {
      id: '30002016',
      username: '30002016',
      roles: ['COURIER'],
      displayName: 'Courier Q1 B - Tây Chợ Bến Thành',
      phone: '0903200016',
      hubCodes: ['07901W001'],
    },

    // --- Phường 13 - Quận 3 (07903W001) ---
    {
      id: '20002009',
      username: '20002009',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Phường 13 (Q3)',
      phone: '0902200009',
      hubCodes: ['07903W001', '003079B001'],
    },
    {
      id: '30002017',
      username: '30002017',
      roles: ['COURIER'],
      displayName: 'Courier Q3 A - Bắc Lê Văn Sỹ',
      phone: '0903200017',
      hubCodes: ['07903W001'],
    },
    {
      id: '30002018',
      username: '30002018',
      roles: ['COURIER'],
      displayName: 'Courier Q3 B - Nam Lê Văn Sỹ',
      phone: '0903200018',
      hubCodes: ['07903W001'],
    },

    // --- Phường 13 - Tân Bình (07913W001) ---
    {
      id: '20002010',
      username: '20002010',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Phường 13 (Tân Bình)',
      phone: '0902200010',
      hubCodes: ['07913W001', '003079B001'],
    },
    {
      id: '30002019',
      username: '30002019',
      roles: ['COURIER'],
      displayName: 'Courier Tân Bình A - Đông Cộng Hòa',
      phone: '0903200019',
      hubCodes: ['07913W001'],
    },
    {
      id: '30002020',
      username: '30002020',
      roles: ['COURIER'],
      displayName: 'Courier Tân Bình B - Tây Cộng Hòa',
      phone: '0903200020',
      hubCodes: ['07913W001'],
    },

    // --- Phường An Phú Đông - Quận 12 (07912W001) ---
    {
      id: '20002011',
      username: '20002011',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục An Phú Đông (Q12)',
      phone: '0902200011',
      hubCodes: ['07912W001', '003079B001'],
    },
    {
      id: '30002021',
      username: '30002021',
      roles: ['COURIER'],
      displayName: 'Courier Q12 A - Bắc Hà Huy Giáp',
      phone: '0903200021',
      hubCodes: ['07912W001'],
    },
    {
      id: '30002022',
      username: '30002022',
      roles: ['COURIER'],
      displayName: 'Courier Q12 B - Nam Hà Huy Giáp',
      phone: '0903200022',
      hubCodes: ['07912W001'],
    },
  ];

  const users = [
    ...hqUsers,
    ...regionalUsers,
    ...keyProvincialUsers,
    ...wardAndCourierUsers,
  ];

  const allowedUsernames = users.map((u) => u.username);

  // Dọn dẹp tài khoản cũ ngoài danh sách tinh gọn (loại bỏ tài khoản 60+ tỉnh thừa)
  await prisma.authSession.deleteMany({
    where: { user: { username: { notIn: allowedUsernames } } },
  });
  await prisma.mobilePermissionOverride.deleteMany({
    where: { user: { username: { notIn: allowedUsernames } } },
  });
  const deletedOldUsers = await prisma.userAccount.deleteMany({
    where: { username: { notIn: allowedUsernames } },
  });
  if (deletedOldUsers.count > 0) {
    console.log(`Đã dọn dẹp ${deletedOldUsers.count} tài khoản tỉnh thừa ngoài danh sách tinh gọn.`);
  }

  for (const user of users) {
    await prisma.userAccount.upsert({
      where: { username: user.username },
      create: {
        ...user,
        passwordHash,
        status: 'ACTIVE',
      },
      update: {
        passwordHash,
        status: 'ACTIVE',
        roles: user.roles,
        displayName: user.displayName,
        phone: user.phone,
        hubCodes: user.hubCodes,
      },
    });
  }

  console.log(`Đã seed thành công ${users.length} tài khoản đúng phân cấp 4 tầng (HQ, 3 Miền, Hà Nội, TP.HCM và các Phường).`);
}

async function seedMobilePermissions() {
  const opsPermissions = allPermissions(true);
  const courierPermissions = {
    ...allPermissions(true),
    'scan.vehicle-inbound': false,
    'scan.vehicle-outbound': false,
    'scan.inventory-check': false,
  };

  await prisma.mobilePermissionProfile.upsert({
    where: { actor: 'OPS' },
    create: {
      actor: 'OPS',
      permissions: opsPermissions,
    },
    update: {
      permissions: opsPermissions,
    },
  });

  await prisma.mobilePermissionProfile.upsert({
    where: { actor: 'COURIER' },
    create: {
      actor: 'COURIER',
      permissions: courierPermissions,
    },
    update: {
      permissions: courierPermissions,
    },
  });
}

async function seedAuditLogs() {
  const logs = [
    {
      id: 'seed-auth-audit-001',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'USER_CREATED',
      targetType: 'USER',
      targetId: '20000001',
      before: null,
      after: {
        username: '20000001',
        roles: ['OPS_ADMIN'],
        hubCodes: [REGIONAL_HUBS.NORTH.code],
      },
      requestId: 'seed-demo-auth-001',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
    },
    {
      id: 'seed-auth-audit-002',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'PERMISSION_MATRIX_UPDATED',
      targetType: 'MOBILE_PERMISSION_PROFILE',
      targetId: 'COURIER',
      before: null,
      after: {
        actor: 'COURIER',
        disabled: ['scan.vehicle-inbound', 'scan.vehicle-outbound', 'scan.inventory-check'],
        hubCodes: Object.values(REGIONAL_HUBS).map((hub) => hub.code),
      },
      requestId: 'seed-demo-auth-002',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed',
      createdAt: new Date('2026-05-01T08:10:00.000Z'),
    },
  ];

  for (const log of logs) {
    await prisma.adminAuditLog.upsert({
      where: { id: log.id },
      create: log,
      update: {
        actorId: log.actorId,
        actorUsername: log.actorUsername,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        before: log.before,
        after: log.after,
        requestId: log.requestId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedMobilePermissions();
  await seedAuditLogs();
  console.log('auth-service demo seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
