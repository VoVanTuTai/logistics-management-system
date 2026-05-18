import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hubAddress(input: {
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  phone: string;
  contactName: string;
  description: string;
}): string {
  return JSON.stringify(input);
}

function ndrDescription(input: {
  name: string;
  category: string;
  description: string;
  allowReschedule: boolean;
  allowReturn: boolean;
  sortOrder: number;
}): string {
  return JSON.stringify(input);
}

function configEnvelope(input: {
  name: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  value: unknown;
  defaultValue: unknown;
  isActive?: boolean;
  isEditable?: boolean;
}) {
  return {
    name: input.name,
    valueType: input.valueType,
    value: input.value,
    defaultValue: input.defaultValue,
    isActive: input.isActive ?? true,
    isEditable: input.isEditable ?? true,
  };
}

async function seedZones() {
  const zones = [
    {
      code: 'VN',
      name: 'Toàn quốc',
      parentCode: null,
      isActive: true,
    },
    {
      code: 'HCM',
      name: 'Khu vực Hồ Chí Minh',
      parentCode: 'VN',
      isActive: true,
    },
    {
      code: 'HN',
      name: 'Khu vực Hà Nội',
      parentCode: 'VN',
      isActive: true,
    },
    {
      code: 'DN',
      name: 'Khu vực Đà Nẵng',
      parentCode: 'VN',
      isActive: true,
    },
  ];

  for (const zone of zones) {
    await prisma.zone.upsert({
      where: { code: zone.code },
      create: zone,
      update: {
        name: zone.name,
        parentCode: zone.parentCode,
        isActive: zone.isActive,
      },
    });
  }
}

async function seedHubs() {
  const hubs = [
    {
      code: 'HCM-001',
      name: 'Hub Quận 1',
      zoneCode: 'HCM',
      address: hubAddress({
        province: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        addressLine: '12 Lê Lợi',
        phone: '0281000001',
        contactName: 'Điều phối HCM',
        description: 'Hub demo trung tâm Hồ Chí Minh',
      }),
      isActive: true,
    },
    {
      code: 'HN-001',
      name: 'Hub Cầu Giấy',
      zoneCode: 'HN',
      address: hubAddress({
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Phường Dịch Vọng',
        addressLine: '24 Xuân Thủy',
        phone: '0241000001',
        contactName: 'Điều phối Hà Nội',
        description: 'Hub demo khu vực Hà Nội',
      }),
      isActive: true,
    },
    {
      code: 'DN-001',
      name: 'Hub Hải Châu',
      zoneCode: 'DN',
      address: hubAddress({
        province: 'Đà Nẵng',
        district: 'Hải Châu',
        ward: 'Phường Hải Châu 1',
        addressLine: '08 Bạch Đằng',
        phone: '0236100001',
        contactName: 'Điều phối Đà Nẵng',
        description: 'Hub demo khu vực Đà Nẵng',
      }),
      isActive: true,
    },
  ];

  for (const hub of hubs) {
    await prisma.hub.upsert({
      where: { code: hub.code },
      create: hub,
      update: {
        name: hub.name,
        zoneCode: hub.zoneCode,
        address: hub.address,
        isActive: hub.isActive,
      },
    });
  }
}

async function seedNdrReasons() {
  const reasons = [
    {
      code: 'CUS_NOT_HOME',
      description: ndrDescription({
        name: 'Khách không có nhà',
        category: 'CUSTOMER',
        description: 'Người nhận không có mặt tại địa chỉ giao hàng.',
        allowReschedule: true,
        allowReturn: false,
        sortOrder: 10,
      }),
      isActive: true,
    },
    {
      code: 'ADDR_WRONG',
      description: ndrDescription({
        name: 'Sai địa chỉ',
        category: 'ADDRESS',
        description: 'Địa chỉ giao hàng sai hoặc thiếu thông tin định vị.',
        allowReschedule: true,
        allowReturn: true,
        sortOrder: 20,
      }),
      isActive: true,
    },
    {
      code: 'CUS_REFUSED',
      description: ndrDescription({
        name: 'Khách từ chối nhận',
        category: 'CUSTOMER',
        description: 'Người nhận từ chối nhận hàng tại thời điểm giao.',
        allowReschedule: false,
        allowReturn: true,
        sortOrder: 30,
      }),
      isActive: true,
    },
  ];

  for (const reason of reasons) {
    await prisma.ndrReason.upsert({
      where: { code: reason.code },
      create: reason,
      update: {
        description: reason.description,
        isActive: reason.isActive,
      },
    });
  }
}

async function seedConfigs() {
  const configs = [
    {
      key: 'delivery.retry.max_attempts',
      scope: 'DELIVERY',
      description: 'Số lần giao lại tối đa trước khi chuyển NDR.',
      value: configEnvelope({
        name: 'Số lần giao lại tối đa',
        valueType: 'NUMBER',
        value: 3,
        defaultValue: 3,
      }),
    },
    {
      key: 'session.refresh.window_minutes',
      scope: 'AUTH',
      description: 'Khoảng thời gian refresh session dùng cho demo admin.',
      value: configEnvelope({
        name: 'Thời gian refresh session',
        valueType: 'NUMBER',
        value: 60,
        defaultValue: 60,
      }),
    },
    {
      key: 'merchant.profile.41100001',
      scope: 'MERCHANT_PROFILE',
      description: 'Hồ sơ merchant demo.',
      value: {
        username: '41100001',
        citizenId: '079200000001',
        regionCode: 'HO_CHI_MINH',
        regionLabel: 'Hồ Chí Minh',
        defaultHubCode: 'HCM-001',
        defaultHubName: 'Hub Quận 1',
        defaultSenderAddress: '12 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
      },
    },
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      create: config,
      update: {
        value: config.value,
        scope: config.scope,
        description: config.description,
      },
    });
  }
}

async function seedMerchantProfiles() {
  const profiles = [
    {
      id: 'merchant-profile-41100001',
      username: '41100001',
      citizenId: '079200000001',
      regionCode: 'HO_CHI_MINH',
      regionLabel: 'Hồ Chí Minh',
      defaultHubCode: 'HCM-001',
      defaultHubName: 'Hub Quận 1',
      defaultSenderAddress: '12 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
    },
  ];

  for (const profile of profiles) {
    await prisma.merchantProfile.upsert({
      where: { username: profile.username },
      create: profile,
      update: {
        citizenId: profile.citizenId,
        regionCode: profile.regionCode,
        regionLabel: profile.regionLabel,
        defaultHubCode: profile.defaultHubCode,
        defaultHubName: profile.defaultHubName,
        defaultSenderAddress: profile.defaultSenderAddress,
      },
    });
  }
}

async function seedAuditLogs() {
  const logs = [
    {
      id: 'seed-masterdata-audit-001',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'HUB_CREATED',
      targetType: 'HUB',
      targetId: 'HCM-001',
      before: null,
      after: {
        code: 'HCM-001',
        zoneCode: 'HCM',
        isActive: true,
      },
      requestId: 'seed-demo-masterdata-001',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed',
      createdAt: new Date('2026-05-01T08:20:00.000Z'),
    },
    {
      id: 'seed-masterdata-audit-002',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'CONFIG_UPDATED',
      targetType: 'CONFIG',
      targetId: 'delivery.retry.max_attempts',
      before: {
        value: 2,
      },
      after: {
        value: 3,
      },
      requestId: 'seed-demo-masterdata-002',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed',
      createdAt: new Date('2026-05-01T08:30:00.000Z'),
    },
    {
      id: 'seed-masterdata-audit-003',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'MERCHANT_PROFILE_CREATED',
      targetType: 'MERCHANT_PROFILE',
      targetId: 'merchant-profile-41100001',
      before: null,
      after: {
        username: '41100001',
        citizenId: '079200000001',
        regionCode: 'HO_CHI_MINH',
        defaultHubCode: 'HCM-001',
      },
      requestId: 'seed-demo-masterdata-003',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed',
      createdAt: new Date('2026-05-01T08:40:00.000Z'),
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
  await seedZones();
  await seedHubs();
  await seedNdrReasons();
  await seedConfigs();
  await seedMerchantProfiles();
  await seedAuditLogs();
  console.log('masterdata-service demo seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
