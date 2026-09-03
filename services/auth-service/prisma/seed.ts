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
    '07925W001', 'HCM-001', '07901W001', '07903W001', '07905W001', '07912W001', // TP.HCM
    '00106W001', 'HN-001', '00101W001', '00105W001', '00108W001', // Hà Nội
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
      displayName: 'Merchant Đối tác Tổng Hà Nội',
      phone: '0941000001',
      hubCodes: ['001001B001'],
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
      displayName: 'Merchant Đối tác Tổng TP. Hồ Chí Minh',
      phone: '0941000079',
      hubCodes: ['003079B001'],
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
      displayName: 'Merchant Đối tác Tổng Đà Nẵng',
      phone: '0941000048',
      hubCodes: ['002048B001'],
    },
  ];

  // =========================================================================
  // 4. BƯU CỤC XÃ / PHƯỜNG & COURIER TRỰC THUỘC (Cấp 3 - Hà Nội & TP.HCM)
  // =========================================================================
  const wardAndCourierUsers = [
    // --- 4.1 Bưu cục Tân Bình (HCM-001 / TP.HCM) & Couriers vẽ dải toạ độ ---
    {
      id: '20001001',
      username: '20001001',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Tân Bình (HCM)',
      phone: '0902100001',
      hubCodes: ['HCM-001', '003079B001'],
    },
    {
      id: '30001001',
      username: '30001001',
      roles: ['COURIER'],
      displayName: 'Courier Tân Bình - Tuyến Phổ Quang Sân Bay',
      phone: '0903100001',
      hubCodes: ['HCM-001'],
    },
    {
      id: '30001002',
      username: '30001002',
      roles: ['COURIER'],
      displayName: 'Courier Tân Bình - Tuyến Cộng Hòa Hoàng Hoa Thám',
      phone: '0903100002',
      hubCodes: ['HCM-001'],
    },
    {
      id: '30001003',
      username: '30001003',
      roles: ['COURIER'],
      displayName: 'Courier Tân Bình - Tuyến Phường 13',
      phone: '0903100003',
      hubCodes: ['HCM-001'],
    },

    // --- 4.2 Bưu cục Phường Bến Thành - Q1 (TP.HCM) ---
    {
      id: '20001002',
      username: '20001002',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Phường Bến Thành (Q1)',
      phone: '0902100002',
      hubCodes: ['07901W001', '003079B001'],
    },
    {
      id: '30001004',
      username: '30001004',
      roles: ['COURIER'],
      displayName: 'Courier Bến Thành - Tuyến Chợ Bến Thành',
      phone: '0903100004',
      hubCodes: ['07901W001'],
    },

    // --- 4.3 Bưu cục Phường 13 - Quận 3 (TP.HCM) ---
    {
      id: '20001003',
      username: '20001003',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Phường 13 (Q3)',
      phone: '0902100003',
      hubCodes: ['07903W001', '003079B001'],
    },
    {
      id: '30001005',
      username: '30001005',
      roles: ['COURIER'],
      displayName: 'Courier Q3 - Tuyến Lê Văn Sỹ',
      phone: '0903100005',
      hubCodes: ['07903W001'],
    },

    // --- 4.4 Bưu cục Phường 2 - Quận 5 (TP.HCM) ---
    {
      id: '20001004',
      username: '20001004',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Phường 2 (Q5)',
      phone: '0902100004',
      hubCodes: ['07905W001', '003079B001'],
    },
    {
      id: '30001006',
      username: '30001006',
      roles: ['COURIER'],
      displayName: 'Courier Q5 - Tuyến Trần Hưng Đạo',
      phone: '0903100006',
      hubCodes: ['07905W001'],
    },

    // --- 4.5 Bưu cục An Phú Đông - Quận 12 (TP.HCM) ---
    {
      id: '20001005',
      username: '20001005',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục An Phú Đông (Q12)',
      phone: '0902100005',
      hubCodes: ['07912W001', '003079B001'],
    },
    {
      id: '30001007',
      username: '30001007',
      roles: ['COURIER'],
      displayName: 'Courier Q12 - Tuyến Hà Huy Giáp',
      phone: '0903100007',
      hubCodes: ['07912W001'],
    },

    // --- 4.6 Bưu cục Đống Đa (HN-001 / Hà Nội) & Couriers vẽ dải toạ độ ---
    {
      id: '20001010',
      username: '20001010',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Đống Đa (HN)',
      phone: '0902100010',
      hubCodes: ['HN-001', '001001B001'],
    },
    {
      id: '30001010',
      username: '30001010',
      roles: ['COURIER'],
      displayName: 'Courier Đống Đa - Tuyến Láng Hạ Giảng Võ',
      phone: '0903100010',
      hubCodes: ['HN-001'],
    },
    {
      id: '30001011',
      username: '30001011',
      roles: ['COURIER'],
      displayName: 'Courier Đống Đa - Tuyến Thái Hà Chùa Bộc',
      phone: '0903100011',
      hubCodes: ['HN-001'],
    },

    // --- 4.7 Bưu cục Tràng Tiền - Hoàn Kiếm (Hà Nội) ---
    {
      id: '20001011',
      username: '20001011',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Tràng Tiền (Hoàn Kiếm)',
      phone: '0902100011',
      hubCodes: ['00101W001', '001001B001'],
    },
    {
      id: '30001012',
      username: '30001012',
      roles: ['COURIER'],
      displayName: 'Courier Hoàn Kiếm - Tuyến Phố Cổ',
      phone: '0903100012',
      hubCodes: ['00101W001'],
    },

    // --- 4.8 Bưu cục Dịch Vọng Hậu - Cầu Giấy (Hà Nội) ---
    {
      id: '20001012',
      username: '20001012',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Dịch Vọng Hậu (Cầu Giấy)',
      phone: '0902100012',
      hubCodes: ['00105W001', '001001B001'],
    },
    {
      id: '30001013',
      username: '30001013',
      roles: ['COURIER'],
      displayName: 'Courier Cầu Giấy - Tuyến Duy Tân',
      phone: '0903100013',
      hubCodes: ['00105W001'],
    },

    // --- 4.9 Bưu cục Bách Khoa - Hai Bà Trưng (Hà Nội) ---
    {
      id: '20001013',
      username: '20001013',
      roles: ['HUB_OPS', 'OPS_VIEWER'],
      displayName: 'Trưởng Bưu cục Bách Khoa (Hai Bà Trưng)',
      phone: '0902100013',
      hubCodes: ['00108W001', '001001B001'],
    },
    {
      id: '30001014',
      username: '30001014',
      roles: ['COURIER'],
      displayName: 'Courier Hai Bà Trưng - Tuyến Đại Cồ Việt',
      phone: '0903100014',
      hubCodes: ['00108W001'],
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
