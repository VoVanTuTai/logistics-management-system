import { PrismaClient } from '@prisma/client';

import {
  branchHubCodeForProvince,
  branchHubNameForProvince,
  buildAddressLine,
  getRepresentativeWard,
  loadVietnamProvinces,
  merchantCitizenId,
  merchantUsernameForProvinceIndex,
  NATIONAL_HQ_HUB,
  provinceShortName,
  REGIONAL_HUBS,
  resolveProvinceCoordinates,
  resolveProvinceRegion,
  resolveRegionalHub,
  SAMPLE_WARD_HUBS,
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
  category: 'CUSTOMER' | 'OPERATIONS' | 'FORCE_MAJEURE';
  description: string;
  actionHint?: string;
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
  const coords = resolveProvinceCoordinates(province.codename);

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
    latitude: coords.latitude,
    longitude: coords.longitude,
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
  const nationalZone = {
    code: NATIONAL_HQ_HUB.zoneCode,
    name: NATIONAL_HQ_HUB.zoneName,
    parentCode: null,
    isActive: true,
  };
  const regionalZones = Object.values(REGIONAL_HUBS).map((hub) => ({
    code: hub.zoneCode,
    name: hub.zoneName,
    parentCode: NATIONAL_HQ_HUB.zoneCode,
    isActive: true,
  }));

  const zones = [nationalZone, ...regionalZones];

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

  // 1. Level 0: National HQ Hub
  const hqHub = {
    code: NATIONAL_HQ_HUB.code,
    name: NATIONAL_HQ_HUB.name,
    level: 0,
    parentCode: null,
    zoneCode: NATIONAL_HQ_HUB.zoneCode,
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Tràng Tiền',
    coverageRadiusKm: 50.0,
    address: hubAddress({
      province: 'Thành phố Hà Nội',
      provinceCode: '1',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Tràng Tiền',
      wardCode: '1001',
      addressLine: NATIONAL_HQ_HUB.addressLine,
      phone: NATIONAL_HQ_HUB.phone,
      contactName: NATIONAL_HQ_HUB.contactName,
      type: 'TRANSIT_HUB',
      description: 'Trụ sở chính điều hành toàn mạng lưới logistics NEXUS.',
      coverageProvinceCodes: provinces.map((p) => p.code),
      coverageProvinceNames: provinces.map((p) => p.name),
    }),
    latitude: NATIONAL_HQ_HUB.latitude,
    longitude: NATIONAL_HQ_HUB.longitude,
    isActive: true,
  };

  // 2. Level 1: 3 Regional Hubs (Bắc, Trung, Nam)
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
      level: 1,
      parentCode: NATIONAL_HQ_HUB.code,
      zoneCode: hub.zoneCode,
      district: '',
      ward: ward?.name ?? '',
      coverageRadiusKm: 25.0,
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
        parentHubCode: NATIONAL_HQ_HUB.code,
        parentHubName: NATIONAL_HQ_HUB.name,
        description: `${hub.name} phụ trách ${coverage.length} tỉnh/thành.`,
        coverageProvinceCodes: coverage.map((item) => item.code),
        coverageProvinceNames: coverage.map((item) => item.name),
      }),
      latitude: hub.latitude,
      longitude: hub.longitude,
      isActive: true,
    };
  });

  // 3. Level 2: 63 Provincial Hubs
  const branchHubs = provinces.map((province) => {
    const regionalHub = resolveRegionalHub(province);
    const ward = getRepresentativeWard(province);
    const shortName = provinceShortName(province);
    const coords = resolveProvinceCoordinates(province.codename);

    return {
      code: branchHubCodeForProvince(province),
      name: branchHubNameForProvince(province),
      level: 2,
      parentCode: regionalHub.code,
      zoneCode: regionalHub.zoneCode,
      district: '',
      ward: ward?.name ?? '',
      coverageRadiusKm: 15.0,
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
      latitude: coords.latitude,
      longitude: coords.longitude,
      isActive: true,
    };
  });

  // 4. Level 3: Ward Hubs / Service Points
  const wardHubs = SAMPLE_WARD_HUBS.map((hub) => {
    return {
      code: hub.code,
      name: hub.name,
      level: 3,
      parentCode: hub.parentHubCode,
      zoneCode: hub.provinceCode <= 37 ? '001' : hub.provinceCode <= 68 ? '002' : '003',
      district: hub.district,
      ward: hub.ward,
      coverageRadiusKm: hub.coverageRadiusKm ?? null,
      boundaryPolygon: hub.boundaryPolygon,
      address: hubAddress({
        province: hub.provinceName,
        provinceCode: String(hub.provinceCode),
        district: hub.district,
        ward: hub.ward,
        addressLine: hub.addressLine,
        phone: hub.phone,
        contactName: hub.contactName,
        type: 'BRANCH',
        parentHubCode: hub.parentHubCode,
        description: `${hub.name} trực thuộc Hub cấp Tỉnh.`,
        coverageProvinceCodes: [hub.provinceCode],
        coverageProvinceNames: [hub.provinceName],
      }),
      latitude: hub.latitude,
      longitude: hub.longitude,
      isActive: true,
    };
  });

  const hubs = [hqHub, ...regionalHubs, ...branchHubs, ...wardHubs];

  for (const hub of hubs) {
    await prisma.hub.upsert({
      where: { code: hub.code },
      create: hub,
      update: {
        name: hub.name,
        level: hub.level,
        parentCode: hub.parentCode,
        zoneCode: hub.zoneCode,
        district: hub.district,
        ward: hub.ward,
        coverageRadiusKm: hub.coverageRadiusKm,
        boundaryPolygon: (hub as { boundaryPolygon?: unknown }).boundaryPolygon ?? undefined,
        address: hub.address,
        latitude: hub.latitude,
        longitude: hub.longitude,
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
    {
      key: 'system.maps.provider',
      scope: 'SYSTEM',
      description: 'Nhà cung cấp bản đồ số cho hệ thống.',
      value: configEnvelope({
        name: 'Map Provider',
        valueType: 'STRING',
        value: 'GOOGLE_MAPS',
        defaultValue: 'GOOGLE_MAPS',
      }),
    },
    {
      key: 'system.maps.google_api_key',
      scope: 'SYSTEM',
      description: 'Google Maps API Key.',
      value: configEnvelope({
        name: 'Google Maps API Key',
        valueType: 'STRING',
        value: 'AIzaSyDemoKeyForVietnamLogisticsSystem123',
        defaultValue: '',
      }),
    },
    {
      key: 'system.maps.google_api_version',
      scope: 'SYSTEM',
      description: 'Phiên bản API Google Maps (New APIs).',
      value: configEnvelope({
        name: 'Google Maps API Version',
        valueType: 'STRING',
        value: 'v1',
        defaultValue: 'v1',
      }),
    },
    {
      key: 'system.maps.cache_ttl_days',
      scope: 'SYSTEM',
      description: 'Thời gian lưu cache kết quả định vị và khoảng cách (ngày).',
      value: configEnvelope({
        name: 'Maps Cache TTL Days',
        valueType: 'NUMBER',
        value: 30,
        defaultValue: 30,
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
        latitude: profile.latitude,
        longitude: profile.longitude,
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
