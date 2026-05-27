import { PrismaClient } from '@prisma/client';

import {
  branchHubCodeForProvince,
  branchHubNameForProvince,
  buildAddressLine,
  getRepresentativeWard,
  loadVietnamProvinces,
  merchantCitizenId,
  merchantUsernameForProvinceIndex,
  provinceShortName,
  REGIONAL_HUBS,
  resolveProvinceRegion,
  resolveRegionalHub,
  type VietnamProvinceSeed,
} from '../../../infra/dev/seed/vietnam-logistics-seed-data';

const prisma = new PrismaClient();

function hubAddress(input: {
  province: string;
  provinceCode?: string;
  district: string;
  ward: string;
  wardCode?: string;
  addressLine: string;
  phone: string;
  contactName: string;
  type?: 'BRANCH' | 'SORTING_CENTER' | 'TRANSIT_HUB';
  description: string;
  parentHubCode?: string;
  parentHubName?: string;
  coverageProvinceCodes?: number[];
  coverageProvinceNames?: string[];
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

function merchantProfileSeed(province: VietnamProvinceSeed, index: number) {
  const hub = resolveRegionalHub(province);
  const ward = getRepresentativeWard(province);
  const username = merchantUsernameForProvinceIndex(index);

  return {
    id: `merchant-profile-${username}`,
    username,
    citizenId: merchantCitizenId(province, index),
    regionCode: hub.merchantRegionCode,
    regionLabel: hub.zoneName.replace('Zone ', ''),
    defaultHubCode: branchHubCodeForProvince(province),
    defaultHubName: branchHubNameForProvince(province),
    defaultSenderAddress: buildAddressLine({
      addressLine: `Kho ${provinceShortName(province)}`,
      wardName: ward?.name,
      provinceName: province.name,
    }),
  };
}

async function cleanupLegacyRegionalSeed() {
  await prisma.hub.deleteMany({
    where: {
      code: {
        in: ['HCM-001', 'HN-001', 'DN-001'],
      },
    },
  });
  await prisma.zone.deleteMany({
    where: {
      code: {
        in: ['VN', 'HCM', 'HN', 'DN'],
      },
    },
  });
}

async function seedZones() {
  const zones = Object.values(REGIONAL_HUBS).map((hub) => ({
    code: hub.zoneCode,
    name: hub.zoneName,
    parentCode: null,
    isActive: true,
  }));

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

async function seedHubs(provinces: VietnamProvinceSeed[]) {
  const coverageByRegion = new Map(
    Object.keys(REGIONAL_HUBS).map((region) => [
      region,
      provinces.filter((province) => resolveProvinceRegion(province.codename) === region),
    ]),
  );
  const regionalHubs = Object.values(REGIONAL_HUBS).map((hub) => {
    const province = provinces.find((item) => item.codename === hub.provinceCodename);
    if (!province) {
      throw new Error(`Cannot find hub province "${hub.provinceCodename}".`);
    }

    const ward = getRepresentativeWard(province, hub.preferredWardNames);
    const coverage = coverageByRegion.get(hub.region) ?? [];

    return {
      code: hub.code,
      name: hub.name,
      zoneCode: hub.zoneCode,
      address: hubAddress({
        province: province.name,
        provinceCode: String(province.code),
        district: '',
        ward: ward?.name ?? '',
        wardCode: ward ? String(ward.code) : '',
        addressLine: hub.addressLine,
        phone: hub.phone,
        contactName: hub.contactName,
        type: 'SORTING_CENTER',
        description: `${hub.name} phụ trách ${coverage.length} tỉnh/thành.`,
        coverageProvinceCodes: coverage.map((item) => item.code),
        coverageProvinceNames: coverage.map((item) => item.name),
      }),
      isActive: true,
    };
  });
  const branchHubs = provinces.map((province) => {
    const regionalHub = resolveRegionalHub(province);
    const ward = getRepresentativeWard(province);
    const shortName = provinceShortName(province);

    return {
      code: branchHubCodeForProvince(province),
      name: branchHubNameForProvince(province),
      zoneCode: regionalHub.zoneCode,
      address: hubAddress({
        province: province.name,
        provinceCode: String(province.code),
        district: '',
        ward: ward?.name ?? '',
        wardCode: ward ? String(ward.code) : '',
        addressLine: `Trung tâm khai thác ${shortName}`,
        phone: `02${String(province.code).padStart(8, '0')}`,
        contactName: `Điều phối ${shortName}`,
        type: 'BRANCH',
        parentHubCode: regionalHub.code,
        parentHubName: regionalHub.name,
        description: `${branchHubNameForProvince(province)} trực thuộc ${regionalHub.name}.`,
        coverageProvinceCodes: [province.code],
        coverageProvinceNames: [province.name],
      }),
      isActive: true,
    };
  });
  const hubs = [...regionalHubs, ...branchHubs];

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

async function seedConfigs(provinces: VietnamProvinceSeed[]) {
  const merchantProfileConfigs = provinces.map((province, index) => {
    const profile = merchantProfileSeed(province, index);

    return {
      key: `merchant.profile.${profile.username}`,
      scope: 'MERCHANT_PROFILE',
      description: `Hồ sơ merchant demo ${province.name}.`,
      value: {
        username: profile.username,
        citizenId: profile.citizenId,
        regionCode: profile.regionCode,
        regionLabel: profile.regionLabel,
        defaultHubCode: profile.defaultHubCode,
        defaultHubName: profile.defaultHubName,
        defaultSenderAddress: profile.defaultSenderAddress,
      },
    };
  });
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
    ...merchantProfileConfigs,
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

async function seedMerchantProfiles(provinces: VietnamProvinceSeed[]) {
  const profiles = provinces.map((province, index) =>
    merchantProfileSeed(province, index),
  );

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

async function seedAuditLogs(provinces: VietnamProvinceSeed[]) {
  const firstProvince = provinces[0];
  if (!firstProvince) {
    throw new Error('Cannot seed audit logs without province data.');
  }

  const firstMerchant = merchantProfileSeed(firstProvince, 0);
  const logs = [
    {
      id: 'seed-masterdata-audit-001',
      actorId: '10000001',
      actorUsername: '10000001',
      action: 'HUB_CREATED',
      targetType: 'HUB',
      targetId: REGIONAL_HUBS.NORTH.code,
      before: null,
      after: {
        code: REGIONAL_HUBS.NORTH.code,
        zoneCode: REGIONAL_HUBS.NORTH.zoneCode,
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
        username: firstMerchant.username,
        citizenId: firstMerchant.citizenId,
        regionCode: firstMerchant.regionCode,
        defaultHubCode: firstMerchant.defaultHubCode,
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
  const provinces = await loadVietnamProvinces();

  await cleanupLegacyRegionalSeed();
  await seedZones();
  await seedHubs(provinces);
  await seedNdrReasons();
  await seedConfigs(provinces);
  await seedMerchantProfiles(provinces);
  await seedAuditLogs(provinces);
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
