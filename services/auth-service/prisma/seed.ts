import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

import {
  loadVietnamProvinces,
  merchantUsernameForProvinceIndex,
  REGIONAL_HUBS,
  resolveRegionalHub,
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
  const provinces = await loadVietnamProvinces();
  const merchantUsers = provinces.map((province, index) => {
    const hub = resolveRegionalHub(province);

    return {
      id: merchantUsernameForProvinceIndex(index),
      username: merchantUsernameForProvinceIndex(index),
      roles: ['MERCHANT'],
      displayName: `Merchant ${province.name}`,
      phone: `0941${String(index + 1).padStart(6, '0')}`,
      hubCodes: [hub.code],
    };
  });
  const regionalHubUsers = [
    {
      id: '10000001',
      username: '10000001',
      roles: ['SYSTEM_ADMIN'],
      displayName: 'Admin Tổng NEXUS',
      phone: '0901000001',
      hubCodes: Object.values(REGIONAL_HUBS).map((hub) => hub.code),
    },
    {
      id: '20000001',
      username: '20000001',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops Admin miền Bắc',
      phone: '0902000001',
      hubCodes: [REGIONAL_HUBS.NORTH.code],
    },
    {
      id: '20000002',
      username: '20000002',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops Admin miền Trung',
      phone: '0902000002',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code],
    },
    {
      id: '20000003',
      username: '20000003',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops Admin miền Nam',
      phone: '0902000003',
      hubCodes: [REGIONAL_HUBS.SOUTH.code],
    },
    {
      id: '20000004',
      username: '20000004',
      roles: ['OPS_VIEWER'],
      displayName: 'Ops Hub miền Bắc',
      phone: '0902000004',
      hubCodes: [REGIONAL_HUBS.NORTH.code],
    },
    {
      id: '20000005',
      username: '20000005',
      roles: ['OPS_VIEWER'],
      displayName: 'Ops Hub miền Trung',
      phone: '0902000005',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code],
    },
    {
      id: '20000006',
      username: '20000006',
      roles: ['OPS_VIEWER'],
      displayName: 'Ops Hub miền Nam',
      phone: '0902000006',
      hubCodes: [REGIONAL_HUBS.SOUTH.code],
    },
    {
      id: '30000001',
      username: '30000001',
      roles: ['COURIER'],
      displayName: 'Courier miền Bắc',
      phone: '0903000001',
      hubCodes: [REGIONAL_HUBS.NORTH.code],
    },
    {
      id: '30000002',
      username: '30000002',
      roles: ['COURIER'],
      displayName: 'Courier miền Trung',
      phone: '0903000002',
      hubCodes: [REGIONAL_HUBS.CENTRAL.code],
    },
    {
      id: '30000003',
      username: '30000003',
      roles: ['COURIER'],
      displayName: 'Courier miền Nam',
      phone: '0903000003',
      hubCodes: [REGIONAL_HUBS.SOUTH.code],
    },
  ];
  const users = [...regionalHubUsers, ...merchantUsers];

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
