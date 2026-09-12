import { PrismaClient } from '@prisma/client';

import {
  branchHubCodeForProvince,
  branchHubNameForProvince,
  buildAddressLine,
  getRepresentativeWard,
  loadVietnamProvinces,
  merchantCitizenId,
  merchantUsernameForProvinceIndex,
  NATIONAL_BOUNDARY_POLYGON,
  NATIONAL_HQ_HUB,
  provinceShortName,
  REGIONAL_HUBS,
  resolveProvinceBoundary,
  resolveProvinceCoordinates,
  resolveProvinceRegion,
  resolveRegionalBoundary,
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
    boundaryPolygon: NATIONAL_BOUNDARY_POLYGON,
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
      boundaryPolygon: resolveRegionalBoundary(hub.region) ?? undefined,
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
      boundaryPolygon: resolveProvinceBoundary(province.codename) ?? undefined,
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

  console.log(
    `Đã seed thành công ${hubs.length} Hubs (1 HQ, ${regionalHubs.length} Hub Vùng, ${branchHubs.length} Hub Tỉnh, ${wardHubs.length} Bưu cục cấp Phường Level 3).`,
  );
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
  const targetConfigs = [
    // =========================================================================
    // HÀ NỘI — 4 Phường Trọng Điểm
    // =========================================================================
    {
      code: 1,
      username: '41100001',
      citizenId: '001200000001',
      regionCode: 'NORTH',
      regionLabel: 'miền Bắc',
      defaultHubCode: '00101W001',
      defaultHubName: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
      defaultSenderAddress: 'Kho Hàng Bài, Phường Hàng Bài, Quận Hoàn Kiếm, Thành phố Hà Nội',
      latitude: 21.0217,
      longitude: 105.8525,
    },
    {
      code: 1,
      username: '41100002',
      citizenId: '001200000002',
      regionCode: 'NORTH',
      regionLabel: 'miền Bắc',
      defaultHubCode: '00102W001',
      defaultHubName: 'Bưu cục Phường Kim Mã - Ba Đình',
      defaultSenderAddress: 'Kho Kim Mã, Phường Kim Mã, Quận Ba Đình, Thành phố Hà Nội',
      latitude: 21.0315,
      longitude: 105.8270,
    },
    {
      code: 1,
      username: '41100003',
      citizenId: '001200000003',
      regionCode: 'NORTH',
      regionLabel: 'miền Bắc',
      defaultHubCode: '00103W001',
      defaultHubName: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
      defaultSenderAddress: 'Kho Dịch Vọng, Phường Dịch Vọng, Quận Cầu Giấy, Thành phố Hà Nội',
      latitude: 21.0365,
      longitude: 105.7955,
    },
    {
      code: 1,
      username: '41100004',
      citizenId: '001200000004',
      regionCode: 'NORTH',
      regionLabel: 'miền Bắc',
      defaultHubCode: '00104W001',
      defaultHubName: 'Bưu cục Phường Trung Liệt - Đống Đa',
      defaultSenderAddress: 'Kho Trung Liệt, Phường Trung Liệt, Quận Đống Đa, Thành phố Hà Nội',
      latitude: 21.0135,
      longitude: 105.8220,
    },

    // =========================================================================
    // ĐÀ NẴNG — 3 Phường Trọng Điểm
    // =========================================================================
    {
      code: 48,
      username: '41100048',
      citizenId: '048200000048',
      regionCode: 'CENTRAL',
      regionLabel: 'miền Trung',
      defaultHubCode: '04801W001',
      defaultHubName: 'Bưu cục Phường Thạch Thang - Hải Châu',
      defaultSenderAddress: 'Kho Thạch Thang, Phường Thạch Thang, Quận Hải Châu, Thành phố Đà Nẵng',
      latitude: 16.0783,
      longitude: 108.2230,
    },
    {
      code: 48,
      username: '41100049',
      citizenId: '048200000049',
      regionCode: 'CENTRAL',
      regionLabel: 'miền Trung',
      defaultHubCode: '04801W002',
      defaultHubName: 'Bưu cục Phường Thanh Bình - Hải Châu',
      defaultSenderAddress: 'Kho Thanh Bình, Phường Thanh Bình, Quận Hải Châu, Thành phố Đà Nẵng',
      latitude: 16.0770,
      longitude: 108.2120,
    },
    {
      code: 48,
      username: '41100050',
      citizenId: '048200000050',
      regionCode: 'CENTRAL',
      regionLabel: 'miền Trung',
      defaultHubCode: '04802W001',
      defaultHubName: 'Bưu cục Phường An Hải Bắc - Sơn Trà',
      defaultSenderAddress: 'Kho An Hải Bắc, Phường An Hải Bắc, Quận Sơn Trà, Thành phố Đà Nẵng',
      latitude: 16.0755,
      longitude: 108.2370,
    },

    // =========================================================================
    // TP. HỒ CHÍ MINH — 4 Phường Trọng Điểm
    // =========================================================================
    {
      code: 79,
      username: '41100079',
      citizenId: '079200000079',
      regionCode: 'SOUTH',
      regionLabel: 'miền Nam',
      defaultHubCode: '07901W001',
      defaultHubName: 'Bưu cục Phường Bến Thành - Quận 1',
      defaultSenderAddress: 'Kho Bến Thành, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh',
      latitude: 10.7720,
      longitude: 106.6960,
    },
    {
      code: 79,
      username: '41100080',
      citizenId: '079200000080',
      regionCode: 'SOUTH',
      regionLabel: 'miền Nam',
      defaultHubCode: '07903W001',
      defaultHubName: 'Bưu cục Phường 13 - Quận 3',
      defaultSenderAddress: 'Kho Phường 13, Phường 13, Quận 3, Thành phố Hồ Chí Minh',
      latitude: 10.7915,
      longitude: 106.6780,
    },
    {
      code: 79,
      username: '41100081',
      citizenId: '079200000081',
      regionCode: 'SOUTH',
      regionLabel: 'miền Nam',
      defaultHubCode: '07913W001',
      defaultHubName: 'Bưu cục Phường 13 - Tân Bình',
      defaultSenderAddress: 'Kho Phường 13, Phường 13, Quận Tân Bình, Thành phố Hồ Chí Minh',
      latitude: 10.8035,
      longitude: 106.6436,
    },
    {
      code: 79,
      username: '41100082',
      citizenId: '079200000082',
      regionCode: 'SOUTH',
      regionLabel: 'miền Nam',
      defaultHubCode: '07912W001',
      defaultHubName: 'Bưu cục Phường An Phú Đông - Quận 12',
      defaultSenderAddress: 'Kho An Phú Đông, Phường An Phú Đông, Quận 12, Thành phố Hồ Chí Minh',
      latitude: 10.8670,
      longitude: 106.6960,
    },
  ];

  const allowedUsernames = targetConfigs.map((t) => t.username);
  await prisma.merchantProfile.deleteMany({
    where: { username: { notIn: allowedUsernames } },
  });

  for (const item of targetConfigs) {
    const profile = {
      id: `merchant-profile-${item.username}`,
      username: item.username,
      citizenId: item.citizenId,
      regionCode: item.regionCode,
      regionLabel: item.regionLabel,
      defaultHubCode: item.defaultHubCode,
      defaultHubName: item.defaultHubName,
      defaultSenderAddress: item.defaultSenderAddress,
      latitude: item.latitude,
      longitude: item.longitude,
    };

    await prisma.merchantProfile.upsert({
      where: { username: profile.username },
      create: profile,
      update: profile,
    });
  }
}

async function seedCourierAreaAssignments() {
  const assignments = [
    // =====================================================================
    // HÀ NỘI — 4 Phường × 2 Courier = 8 Assignments
    // =====================================================================

    // --- Phường Hàng Bài - Hoàn Kiếm (00101W001) ---
    // Ward boundary: [21.012,105.847] → [21.025,105.858]
    // Split at lat 21.0185 (North A / South B)
    {
      courierId: '30002001',
      hubCode: '00101W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Hàng Bài',
      zoneName: 'Hoàn Kiếm A - Bắc Hàng Bài',
      colorHex: '#2563eb',
      boundaryPolygon: [
        [21.0185, 105.847],
        [21.025, 105.847],
        [21.025, 105.858],
        [21.0185, 105.858],
        [21.0185, 105.847],
      ],
      isActive: true,
    },
    {
      courierId: '30002002',
      hubCode: '00101W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Hàng Bài',
      zoneName: 'Hoàn Kiếm B - Nam Hàng Bài',
      colorHex: '#10b981',
      boundaryPolygon: [
        [21.012, 105.847],
        [21.0185, 105.847],
        [21.0185, 105.858],
        [21.012, 105.858],
        [21.012, 105.847],
      ],
      isActive: true,
    },

    // --- Phường Kim Mã - Ba Đình (00102W001) ---
    // Ward boundary: [21.025,105.817] → [21.038,105.831]
    // Split at lng 105.824 (East A / West B)
    {
      courierId: '30002003',
      hubCode: '00102W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Ba Đình',
      ward: 'Phường Kim Mã',
      zoneName: 'Ba Đình A - Đông Kim Mã',
      colorHex: '#f59e0b',
      boundaryPolygon: [
        [21.025, 105.824],
        [21.038, 105.824],
        [21.038, 105.831],
        [21.025, 105.831],
        [21.025, 105.824],
      ],
      isActive: true,
    },
    {
      courierId: '30002004',
      hubCode: '00102W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Ba Đình',
      ward: 'Phường Kim Mã',
      zoneName: 'Ba Đình B - Tây Kim Mã',
      colorHex: '#8b5cf6',
      boundaryPolygon: [
        [21.025, 105.817],
        [21.038, 105.817],
        [21.038, 105.824],
        [21.025, 105.824],
        [21.025, 105.817],
      ],
      isActive: true,
    },

    // --- Phường Dịch Vọng - Cầu Giấy (00103W001) ---
    // Ward boundary: [21.025,105.787] → [21.042,105.804]
    // Split at lat 21.0335 (North A / South B)
    {
      courierId: '30002005',
      hubCode: '00103W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Cầu Giấy',
      ward: 'Phường Dịch Vọng',
      zoneName: 'Cầu Giấy A - Bắc Dịch Vọng',
      colorHex: '#ec4899',
      boundaryPolygon: [
        [21.0335, 105.787],
        [21.042, 105.787],
        [21.042, 105.804],
        [21.0335, 105.804],
        [21.0335, 105.787],
      ],
      isActive: true,
    },
    {
      courierId: '30002006',
      hubCode: '00103W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Cầu Giấy',
      ward: 'Phường Dịch Vọng',
      zoneName: 'Cầu Giấy B - Nam Dịch Vọng',
      colorHex: '#06b6d4',
      boundaryPolygon: [
        [21.025, 105.787],
        [21.0335, 105.787],
        [21.0335, 105.804],
        [21.025, 105.804],
        [21.025, 105.787],
      ],
      isActive: true,
    },

    // --- Phường Trung Liệt - Đống Đa (00104W001) ---
    // Ward boundary: [21.007,105.811] → [21.020,105.826]
    // Split at lng 105.8185 (East A / West B)
    {
      courierId: '30002007',
      hubCode: '00104W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Đống Đa',
      ward: 'Phường Trung Liệt',
      zoneName: 'Đống Đa A - Đông Thái Hà',
      colorHex: '#ef4444',
      boundaryPolygon: [
        [21.007, 105.8185],
        [21.020, 105.8185],
        [21.020, 105.826],
        [21.007, 105.826],
        [21.007, 105.8185],
      ],
      isActive: true,
    },
    {
      courierId: '30002008',
      hubCode: '00104W001',
      province: 'Thành phố Hà Nội',
      district: 'Quận Đống Đa',
      ward: 'Phường Trung Liệt',
      zoneName: 'Đống Đa B - Tây Thái Hà',
      colorHex: '#84cc16',
      boundaryPolygon: [
        [21.007, 105.811],
        [21.020, 105.811],
        [21.020, 105.8185],
        [21.007, 105.8185],
        [21.007, 105.811],
      ],
      isActive: true,
    },

    // =====================================================================
    // ĐÀ NẴNG — 3 Phường × 2 Courier = 6 Assignments
    // =====================================================================

    // --- Phường Thạch Thang - Hải Châu (04801W001) ---
    // Ward boundary: [16.067,108.217] → [16.082,108.229]
    // Split at lat 16.0745 (North A / South B)
    {
      courierId: '30002009',
      hubCode: '04801W001',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Hải Châu',
      ward: 'Phường Thạch Thang',
      zoneName: 'Hải Châu A - Bắc Bạch Đằng',
      colorHex: '#7c3aed',
      boundaryPolygon: [
        [16.0745, 108.217],
        [16.082, 108.217],
        [16.082, 108.229],
        [16.0745, 108.229],
        [16.0745, 108.217],
      ],
      isActive: true,
    },
    {
      courierId: '30002010',
      hubCode: '04801W001',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Hải Châu',
      ward: 'Phường Thạch Thang',
      zoneName: 'Hải Châu B - Nam Bạch Đằng',
      colorHex: '#f97316',
      boundaryPolygon: [
        [16.067, 108.217],
        [16.0745, 108.217],
        [16.0745, 108.229],
        [16.067, 108.229],
        [16.067, 108.217],
      ],
      isActive: true,
    },

    // --- Phường Thanh Bình - Hải Châu (04801W002) ---
    // Ward boundary: [16.057,108.203] → [16.071,108.218]
    // Split at lng 108.2105 (East A / West B)
    {
      courierId: '30002011',
      hubCode: '04801W002',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Hải Châu',
      ward: 'Phường Thanh Bình',
      zoneName: 'Thanh Bình A - Đông',
      colorHex: '#0ea5e9',
      boundaryPolygon: [
        [16.057, 108.2105],
        [16.071, 108.2105],
        [16.071, 108.218],
        [16.057, 108.218],
        [16.057, 108.2105],
      ],
      isActive: true,
    },
    {
      courierId: '30002012',
      hubCode: '04801W002',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Hải Châu',
      ward: 'Phường Thanh Bình',
      zoneName: 'Thanh Bình B - Tây',
      colorHex: '#d946ef',
      boundaryPolygon: [
        [16.057, 108.203],
        [16.071, 108.203],
        [16.071, 108.2105],
        [16.057, 108.2105],
        [16.057, 108.203],
      ],
      isActive: true,
    },

    // --- Phường An Hải Bắc - Sơn Trà (04802W001) ---
    // Ward boundary: [16.072,108.230] → [16.086,108.244]
    // Split at lat 16.079 (North A / South B)
    {
      courierId: '30002013',
      hubCode: '04802W001',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Sơn Trà',
      ward: 'Phường An Hải Bắc',
      zoneName: 'Sơn Trà A - Bắc Sông Hàn',
      colorHex: '#14b8a6',
      boundaryPolygon: [
        [16.079, 108.230],
        [16.086, 108.230],
        [16.086, 108.244],
        [16.079, 108.244],
        [16.079, 108.230],
      ],
      isActive: true,
    },
    {
      courierId: '30002014',
      hubCode: '04802W001',
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Sơn Trà',
      ward: 'Phường An Hải Bắc',
      zoneName: 'Sơn Trà B - Nam Sông Hàn',
      colorHex: '#a855f7',
      boundaryPolygon: [
        [16.072, 108.230],
        [16.079, 108.230],
        [16.079, 108.244],
        [16.072, 108.244],
        [16.072, 108.230],
      ],
      isActive: true,
    },

    // =====================================================================
    // TP. HỒ CHÍ MINH — 4 Phường × 2 Courier = 8 Assignments
    // =====================================================================

    // --- Phường Bến Thành - Quận 1 (07901W001) ---
    // Ward boundary: [10.765,106.687] → [10.779,106.699]
    // Split at lng 106.693 (East A / West B)
    {
      courierId: '30002015',
      hubCode: '07901W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Thành',
      zoneName: 'Q1 A - Đông Chợ Bến Thành',
      colorHex: '#3b82f6',
      boundaryPolygon: [
        [10.765, 106.693],
        [10.779, 106.693],
        [10.779, 106.699],
        [10.765, 106.699],
        [10.765, 106.693],
      ],
      isActive: true,
    },
    {
      courierId: '30002016',
      hubCode: '07901W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Thành',
      zoneName: 'Q1 B - Tây Chợ Bến Thành',
      colorHex: '#22c55e',
      boundaryPolygon: [
        [10.765, 106.687],
        [10.779, 106.687],
        [10.779, 106.693],
        [10.765, 106.693],
        [10.765, 106.687],
      ],
      isActive: true,
    },

    // --- Phường 13 - Quận 3 (07903W001) ---
    // Ward boundary: [10.782,106.671] → [10.795,106.684]
    // Split at lat 10.7885 (North A / South B)
    {
      courierId: '30002017',
      hubCode: '07903W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 13',
      zoneName: 'Q3 A - Bắc Lê Văn Sỹ',
      colorHex: '#f43f5e',
      boundaryPolygon: [
        [10.7885, 106.671],
        [10.795, 106.671],
        [10.795, 106.684],
        [10.7885, 106.684],
        [10.7885, 106.671],
      ],
      isActive: true,
    },
    {
      courierId: '30002018',
      hubCode: '07903W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 13',
      zoneName: 'Q3 B - Nam Lê Văn Sỹ',
      colorHex: '#eab308',
      boundaryPolygon: [
        [10.782, 106.671],
        [10.7885, 106.671],
        [10.7885, 106.684],
        [10.782, 106.684],
        [10.782, 106.671],
      ],
      isActive: true,
    },

    // --- Phường 13 - Tân Bình (07913W001) ---
    // Ward boundary: [10.794,106.633] → [10.815,106.655]
    // Split at lng 106.644 (East A / West B)
    {
      courierId: '30002019',
      hubCode: '07913W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận Tân Bình',
      ward: 'Phường 13',
      zoneName: 'Tân Bình A - Đông Cộng Hòa',
      colorHex: '#6366f1',
      boundaryPolygon: [
        [10.794, 106.644],
        [10.815, 106.644],
        [10.815, 106.655],
        [10.794, 106.655],
        [10.794, 106.644],
      ],
      isActive: true,
    },
    {
      courierId: '30002020',
      hubCode: '07913W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận Tân Bình',
      ward: 'Phường 13',
      zoneName: 'Tân Bình B - Tây Cộng Hòa',
      colorHex: '#f472b6',
      boundaryPolygon: [
        [10.794, 106.633],
        [10.815, 106.633],
        [10.815, 106.644],
        [10.794, 106.644],
        [10.794, 106.633],
      ],
      isActive: true,
    },

    // --- Phường An Phú Đông - Quận 12 (07912W001) ---
    // Ward boundary: [10.850,106.683] → [10.885,106.715]
    // Split at lat 10.8675 (North A / South B)
    {
      courierId: '30002021',
      hubCode: '07912W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 12',
      ward: 'Phường An Phú Đông',
      zoneName: 'Q12 A - Bắc Hà Huy Giáp',
      colorHex: '#0d9488',
      boundaryPolygon: [
        [10.8675, 106.683],
        [10.885, 106.683],
        [10.885, 106.715],
        [10.8675, 106.715],
        [10.8675, 106.683],
      ],
      isActive: true,
    },
    {
      courierId: '30002022',
      hubCode: '07912W001',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 12',
      ward: 'Phường An Phú Đông',
      zoneName: 'Q12 B - Nam Hà Huy Giáp',
      colorHex: '#be185d',
      boundaryPolygon: [
        [10.850, 106.683],
        [10.8675, 106.683],
        [10.8675, 106.715],
        [10.850, 106.715],
        [10.850, 106.683],
      ],
      isActive: true,
    },
  ];

  // Dọn dẹp tất cả phân công cũ (30001xxx, 30000xxx, courier-*)
  await prisma.courierAreaAssignment.deleteMany({
    where: {
      OR: [
        { courierId: { startsWith: 'courier-' } },
        { courierId: { startsWith: '30000' } },
        { courierId: { startsWith: '30001' } },
      ],
    },
  });

  for (const item of assignments) {
    await prisma.courierAreaAssignment.upsert({
      where: {
        courierId_province_district_ward: {
          courierId: item.courierId,
          province: item.province,
          district: item.district,
          ward: item.ward,
        },
      },
      create: item,
      update: {
        hubCode: item.hubCode,
        zoneName: item.zoneName,
        colorHex: item.colorHex,
        boundaryPolygon: item.boundaryPolygon,
        isActive: item.isActive,
      },
    });
  }

  console.log(`Đã seed ${assignments.length} phân vùng geofence chuẩn: 3 Tỉnh × 11 Phường × 2 Courier/Phường.`);
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

async function seedPolicies() {
  const policies = [
    {
      id: 'policy-001',
      title: '1. Quy định chung & Phạm vi áp dụng',
      slug: 'quy-dinh-chung-va-pham-vi-ap-dung',
      category: 'GENERAL' as const,
      summary: 'Các nguyên tắc cốt lõi, khái niệm định nghĩa và phạm vi cung ứng dịch vụ chuyển phát nhanh của Nexus Express System trên toàn lãnh thổ Việt Nam.',
      content: `### 1.1. Mục đích và Phạm vi
Quy định này áp dụng đối với tất cả các tổ chức, cá nhân (sau đây gọi là **"Khách hàng"** hoặc **"Người gửi"**) sử dụng dịch vụ bưu chính, chuyển phát bưu gửi, bưu kiện, hàng hóa và dịch vụ thu hộ tiền hàng (COD) được cung cấp bởi **Hệ thống Quản lý Vận hành Logistics NEXUS Express** (sau đây gọi là **"NEXUS"**).

### 1.2. Định nghĩa thuật ngữ
- **Bưu gửi / Đơn hàng**: Là thư từ, tài liệu, vật phẩm, hàng hóa được đóng gói, dán nhãn vận đơn hợp lệ và được NEXUS chấp nhận vận chuyển từ Người gửi đến Người nhận.
- **Mã vận đơn (Tracking Code)**: Chuỗi ký tự định danh duy nhất (VD: \`SP10000001\`) được cấp phát cho mỗi đơn hàng để tra cứu hành trình thời gian thực.
- **Dịch vụ Thu hộ (COD - Cash on Delivery)**: Dịch vụ NEXUS thay mặt Người gửi thu tiền hàng từ Người nhận khi giao hàng và đối soát, chuyển trả lại Người gửi theo chu kỳ quy định.
- **Biên bản Bàn giao / Bằng chứng Giao hàng (POD - Proof of Delivery)**: Ảnh chụp chữ ký xác nhận của Người nhận hoặc ảnh chụp hiện trường bàn giao bưu gửi do Courier thực hiện qua ứng dụng di động.

### 1.3. Hiệu lực thỏa thuận
Việc Khách hàng tạo đơn hàng trên cổng thông tin Khách hàng (Customer Web/App), Merchant Portal hoặc bàn giao bưu gửi trực tiếp tại Bưu cục NEXUS đồng nghĩa với việc Khách hàng đã đọc, hiểu rõ và cam kết tuân thủ toàn bộ các điều khoản trong văn bản này.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 1,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-002',
      title: '2. Quy định tạo và gửi đơn hàng',
      slug: 'quy-dinh-tao-va-gui-don-hang',
      category: 'SHIPMENT' as const,
      summary: 'Quy chuẩn cung cấp thông tin người gửi/người nhận, kê khai hàng hóa, kích thước trọng lượng và nguyên tắc dán nhãn mã vạch.',
      content: `### 2.1. Yêu cầu thông tin đơn hàng
Người gửi có nghĩa vụ cung cấp đầy đủ, chính xác và trung thực các thông tin sau khi tạo vận đơn:
1. **Thông tin Người gửi & Người nhận**: Họ và tên, số điện thoại liên lạc đang hoạt động, địa chỉ chi tiết (bao gồm Số nhà, Tên đường/Thôn xóm, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố).
2. **Thông tin Bưu gửi**: Tên chính xác loại hàng hóa, số lượng, trọng lượng thực tế (gram/kg), kích thước 3 chiều (Dài x Rộng x Cao tính theo cm).
3. **Giá trị khai giá**: Kê khai đúng giá trị thực tế của hàng hóa để làm căn cứ bảo hiểm và tính mức bồi thường khi xảy ra sự cố.

### 2.2. Trọng lượng quy đổi thể tích (Volumetric Weight)
Trường hợp bưu gửi có thể tích cồng kềnh, trọng lượng tính cước sẽ được xác định theo công thức chuẩn của Hiệp hội Vận tải Hàng không Quốc tế (IATA) và Bưu chính Quốc gia:
$$\\text{Trọng lượng quy đổi (kg)} = \\frac{\\text{Dài (cm)} \\times \\text{Rộng (cm)} \\times \\text{Cao (cm)}}{5000}$$
*Mức cước vận chuyển sẽ áp dụng theo giá trị lớn hơn giữa Trọng lượng thực tế và Trọng lượng quy đổi.*

### 2.3. Quy chuẩn in và dán nhãn vận đơn
- Mỗi kiện hàng phải được dán nhãn vận đơn chứa mã vạch (Barcode / QR Code) rõ nét ở mặt phẳng lớn nhất của kiện hàng.
- Không dán đè băng keo mờ hoặc làm rách nát phần mã vạch nhằm đảm bảo máy quét bưu cục (PDA/Scanner) đọc chính xác.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 2,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-003',
      title: '3. Danh mục hàng hóa cấm & hạn chế vận chuyển',
      slug: 'hang-hoa-cam-va-han-che-van-chuyen',
      category: 'PROHIBITED_GOODS' as const,
      summary: 'Quy định nghiêm ngặt về các loại hàng hóa tuyệt đối không tiếp nhận và các mặt hàng vận chuyển có điều kiện theo luật bưu chính Việt Nam.',
      content: `### 3.1. Hàng hóa tuyệt đối CẤM vận chuyển
NEXUS từ chối tiếp nhận, vận chuyển dưới mọi hình thức đối với các vật phẩm sau:
- **Chất nổ, vũ khí, đạn dược**, trang thiết bị quân sự, pháo hoa, pháo nổ các loại.
- **Chất ma túy**, chất kích thích thần kinh, tiền chất ma túy, các chất gây nghiện bị pháp luật cấm.
- **Vũ khí thô sơ, hung khí nguy hiểm**, súng săn, dao kiếm có tính sát thương cao.
- **Văn hóa phẩm đồi trụy**, phản động, tài liệu nhằm phá hoại trật tự an toàn xã hội.
- **Động vật sống**, thực vật quý hiếm nằm trong danh mục cấm bảo tồn quốc tế.
- **Tiền mặt**, kim loại quý (vàng, bạc, bạch kim), đá quý, các loại giấy tờ có giá trị quy đổi thành tiền mặt.
- **Hóa chất độc hại**, chất phóng xạ, chất ăn mòn, chất lỏng dễ cháy nổ (xăng, cồn công nghiệp, gas).

### 3.2. Hàng hóa vận chuyển có ĐIỀU KIỆN
Các mặt hàng sau chỉ được chấp nhận khi đáp ứng đầy đủ điều kiện quy định:
- **Chất lỏng, mỹ phẩm**: Phải có nắp đậy niêm phong chống rò rỉ, bọc túi bóng khí (bubble wrap) và chèn xốp kín hộp carton.
- **Hàng thực phẩm khô, bánh kẹo**: Phải có nhãn mác xuất xứ, hạn sử dụng rõ ràng và được hút chân không.
- **Hàng điện tử có pin (Lithium)**: Pin phải gắn liền trong thiết bị, tắt nguồn hoàn toàn và đóng gói chống sốc đa lớp.

### 3.3. Quyền kiểm tra và tịch thu của cơ quan chức năng
NEXUS có quyền mở kiểm tra bưu gửi khi có nghi vấn vi phạm an ninh an toàn. Trường hợp phát hiện hàng cấm, NEXUS sẽ lập tức đình chỉ vận chuyển và bàn giao toàn bộ tang vật cho Cơ quan Công an có thẩm quyền xử lý theo pháp luật.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 3,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-004',
      title: '4. Quy chuẩn đóng gói bảo đảm an toàn bưu gửi',
      slug: 'quy-chuan-dong-goi-bao-dam-an-toan-buu-gui',
      category: 'SHIPMENT' as const,
      summary: 'Hướng dẫn kỹ thuật đóng gói đạt chuẩn vận tải cho hàng thông thường, hàng dễ vỡ, hàng chất lỏng và đồ điện tử công nghệ cao.',
      content: `### 4.1. Nguyên tắc đóng gói chung
- Toàn bộ bưu gửi phải được bao bọc kín trong thùng carton, hộp cứng hoặc túi ni-lông bưu chính chuyên dụng chịu lực.
- Hàng hóa bên trong không được xê dịch, va đập khi lắc nhẹ. Sử dụng vật liệu chèn lót như mút xốp xốp PE, bóng khí, giấy chèn carton.
- Niêm phong miệng hộp bằng băng keo bản rộng (tối thiểu 4.8cm) theo hình chữ H hoặc chữ thập chắc chắn.

### 4.2. Hướng dẫn chi tiết cho từng loại mặt hàng
1. **Hàng dễ vỡ (Thủy tinh, sành sứ, gốm, bóng đèn)**:
   - Bọc riêng từng sản phẩm bằng tối thiểu 3-5 lớp bóng khí.
   - Sử dụng thùng carton 3-5 lớp, khoảng cách giữa hàng và thành hộp tối thiểu 3cm chèn kín mút xốp.
   - Dán nhãn cảnh báo **"HÀNG DỄ VỠ - XIN NHẸ TAY"** ở các mặt ngoài thùng.
2. **Hàng chất lỏng, dầu nhớt, hóa mỹ phẩm**:
   - Quấn băng keo quanh nắp chai/lọ để ngăn trào ngược áp suất.
   - Đựng chai lọ trong túi ziplock kín trước khi đặt vào hộp.
   - Sử dụng vật liệu hút ẩm/hút nước dưới đáy hộp phòng trường hợp nứt vỡ.
3. **Đồ công nghệ, linh kiện điện tử (Laptop, Điện thoại, Máy ảnh)**:
   - Giữ nguyên hộp gốc của nhà sản xuất nếu có, chèn xốp xung quanh.
   - Cho vào thùng carton bảo vệ bên ngoài, quấn màng co PE chống nước.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 4,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-005',
      title: '5. Quy định lấy hàng tận nơi & Cam kết thời gian SLA',
      slug: 'quy-dinh-lay-hang-tan-noi-va-cam-ket-sla',
      category: 'DELIVERY' as const,
      summary: 'Cam kết thời gian lấy hàng từ người gửi, khung giờ pickup của nhân viên giao nhận và quy trình bàn giao tại bưu cục.',
      content: `### 5.1. Khung giờ lấy hàng tận nơi (Pickup SLA)
- **Đơn tạo trước 10:30 sáng**: Nhân viên giao nhận (Courier) sẽ hoàn tất lấy hàng trước **13:00** cùng ngày.
- **Đơn tạo từ 10:30 đến 16:00**: Nhân viên sẽ hoàn tất lấy hàng trước **18:30** cùng ngày.
- **Đơn tạo sau 16:00**: Sẽ được điều phối lấy vào ca sáng của ngày làm việc kế tiếp.
- **Hạn chót xử lý đơn (Cutoff SLA)**: Mọi yêu cầu lấy hàng phải được hoàn tất trong vòng tối đa **12 giờ làm việc** kể từ lúc tạo yêu cầu.

### 5.2. Trách nhiệm của Người gửi khi Courier đến lấy hàng
- Chuẩn bị sẵn hàng hóa đã đóng gói và in dán nhãn vận đơn trước khi nhân viên đến.
- Kiểm tra mã đơn hàng và ký xác nhận bàn giao điện tử trên ứng dụng Courier Mobile của nhân viên.
- Yêu cầu nhân viên quét mã vận đơn (Scan Inbound) để kích hoạt trạng thái đơn hàng trên hệ thống theo dõi.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 5,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-006',
      title: '6. Quy trình giao nhận & Tiêu chuẩn giao hàng 3 lần',
      slug: 'quy-trinh-giao-nhan-va-tieu-chuan-giao-hang-3-lan',
      category: 'DELIVERY' as const,
      summary: 'Quy chuẩn liên hệ người nhận, chính sách giao tối đa 3 lần, đồng kiểm hàng hóa và chụp ảnh bằng chứng giao hàng POD.',
      content: `### 6.1. Số lần phát hàng cam kết
NEXUS cam kết nỗ lực giao hàng tối đa **03 lần** cho mỗi đơn hàng trước khi chuyển trạng thái lưu kho hoặc chuyển hoàn:
- **Lần 1**: Thực hiện đúng theo ca phát hàng tiêu chuẩn của tuyến giao.
- **Lần 2**: Thực hiện vào ca tiếp theo hoặc ngày làm việc kế tiếp sau khi đã liên hệ lại Người nhận.
- **Lần 3**: Thực hiện theo lịch hẹn thỏa thuận trực tiếp giữa Người nhận và tổng đài/bưu cục phụ trách.

### 6.2. Quy định liên lạc điện thoại
- Trước mỗi lần phát, Courier bắt buộc phải gọi tối thiểu **03 cuộc điện thoại** cách nhau tối thiểu 5-10 phút nếu Người nhận không bắt máy.
- Mọi cuộc gọi đều được ghi nhận lịch sử trên hệ thống tổng đài điều hành.

### 6.3. Quy định Đồng kiểm hàng hóa (Inspection)
- **Cho xem hàng không cho thử (View only)**: Người nhận được phép mở hộp kiểm tra ngoại quan (mẫu mã, màu sắc, số lượng), không cắm điện, không thử nghiệm tính năng hoặc bóc tem niêm phong sản phẩm.
- **Không cho xem hàng (No inspection)**: Courier chỉ bàn giao nguyên đai nguyên kiện sau khi Người nhận thanh toán đủ tiền thu hộ (COD) và ký nhận.
- **Chụp ảnh bằng chứng giao hàng (POD)**: Courier bắt buộc chụp ảnh bưu gửi và chữ ký Người nhận đưa lên hệ thống để hoàn tất đơn hàng.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 6,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-007',
      title: '7. Xử lý giao không thành công & Chính sách chuyển hoàn',
      slug: 'xu-ly-giao-khong-thanh-cong-va-chinh-sach-chuyen-hoan',
      category: 'RETURN' as const,
      summary: 'Quy trình tạo ca xử lý sự cố giao hàng NDR, thời gian lưu kho chờ xử lý và nguyên tắc hoàn trả hàng về cho người gửi.',
      content: `### 7.1. Ghi nhận giao hàng không thành công (NDR - Non-Delivery Report)
Khi giao hàng không thành công sau các lần nỗ lực, hệ thống sẽ tự động tạo ca sự cố NDR kèm lý do chính xác:
- Người nhận từ chối nhận hàng do đổi ý hoặc hàng không đúng yêu cầu.
- Không liên lạc được với Người nhận qua số điện thoại cung cấp.
- Địa chỉ giao hàng sai, không tìm thấy hoặc nằm ngoài phạm vi an toàn.
- Người nhận hẹn lại ngày giao phát khác.

### 7.2. Thời gian lưu kho chờ xử lý (Holding Period)
- Bưu gửi được lưu giữ an toàn tại Bưu cục phát trong thời gian tối đa **05 ngày làm việc**.
- Trong thời gian này, Người gửi có thể gửi yêu cầu thay đổi thông tin (Đổi số điện thoại, đổi địa chỉ hoặc ủy quyền người nhận khác) qua Merchant Portal.

### 7.3. Quy định Chuyển hoàn (Return Process)
- Nếu hết thời hạn lưu kho hoặc Người gửi xác nhận hủy đơn hoàn hàng, bưu gửi sẽ được niêm phong bao bì hoàn chuyển ngược về bưu cục gốc.
- **Cước chuyển hoàn**: Bằng 50% cước chiều gửi ban đầu (áp dụng theo quy định của biểu phí dịch vụ hiện hành).`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 7,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-008',
      title: '8. Quy định thu hộ tiền hàng (COD) & Đối soát thanh toán',
      slug: 'quy-dinh-thu-ho-tien-hang-cod-va-doi-soat-thanh-toan',
      category: 'GENERAL' as const,
      summary: 'Hạn mức thu tiền mặt COD, chu kỳ đối soát thanh toán chuyển khoản và bảo đảm an toàn dòng tiền của nhà bán hàng.',
      content: `### 8.1. Hạn mức thu hộ COD
- NEXUS nhận thu hộ tiền mặt tối đa **20.000.000 VNĐ** (Hai mươi triệu đồng) cho một đơn hàng thông thường.
- Đối với các đơn hàng có giá trị COD trên 20 triệu đồng, khuyến khích Người nhận thanh toán qua chuyển khoản ngân hàng hoặc cổng thanh toán trực tuyến được tích hợp trên mã QR vận đơn.

### 8.2. Chu kỳ đối soát và Chuyển trả tiền COD
NEXUS cung cấp các kỳ đối soát linh hoạt cho Khách hàng:
- **Chu kỳ T+1 (Hằng ngày)**: Tiền COD thu được trong ngày sẽ được đối soát và chuyển vào tài khoản ngân hàng của Người gửi vào ngày làm việc tiếp theo.
- **Chu kỳ Định kỳ (Thứ 2 - Thứ 4 - Thứ 6)**: Tự động kết chuyển tiền hàng 3 lần/tuần.
- Toàn bộ lịch sử đối soát, mã giao dịch ngân hàng và biên bản thanh toán đều được hiển thị minh bạch trên Merchant Dashboard.

### 8.3. Khấu trừ cước phí tự động
Hệ thống tự động cấn trừ cước vận chuyển và các phí phát sinh (nếu có) trực tiếp vào số tiền COD thu hộ trước khi giải ngân phần còn lại cho Người gửi.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 8,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-009',
      title: '9. Quy trình tiếp nhận & Giải quyết khiếu nại',
      slug: 'quy-trinh-tiep-nhan-va-giai-quyet-khieu-nai',
      category: 'COMPENSATION' as const,
      summary: 'Thời hiệu khiếu nại, các kênh tiếp nhận chính thức và thời hạn cam kết phản hồi giải quyết khiếu nại của khách hàng.',
      content: `### 9.1. Thời hiệu khiếu nại
Thời gian Khách hàng có quyền gửi khiếu nại được quy định như sau:
- **Khiếu nại về suy suyển, hư hỏng hàng hóa**: Trong vòng **03 ngày làm việc** kể từ thời điểm Người nhận ký nhận bưu gửi.
- **Khiếu nại về mất mát bưu gửi**: Trong vòng **14 ngày làm việc** kể từ ngày dự kiến giao hàng ghi trên vận đơn.
- **Khiếu nại về tiền COD, cước phí**: Trong vòng **30 ngày làm việc** kể từ ngày bưu gửi được cập nhật trạng thái Phát thành công.
*Quá thời hạn trên, NEXUS có quyền từ chối thụ lý giải quyết trừ trường hợp có lý do bất khả kháng được chứng minh hợp lệ.*

### 9.2. Kênh tiếp nhận khiếu nại chính thức
Khách hàng có thể gửi yêu cầu qua các kênh:
1. Tạo phiếu yêu cầu hỗ trợ trực tuyến tại mục **Khiếu nại & Bồi thường** trên Customer Portal / Merchant Portal.
2. Gửi email hỗ trợ chính thức: \`support@nexus.vn\`.
3. Gọi điện đến Hotline Chăm sóc Khách hàng: \`1900 6868\` (8:00 - 20:00 hàng ngày).

### 9.3. Thời hạn cam kết xử lý khiếu nại (SLA)
- **Tiếp nhận & Phản hồi ban đầu**: Trong vòng tối đa **24 giờ làm việc**.
- **Điều tra & Đưa ra phương án giải quyết**: Trong vòng **03 - 05 ngày làm việc**.
- **Hoàn tất chi trả bồi thường (nếu có)**: Trong vòng **03 ngày làm việc** kể từ khi hai bên ký biên bản thống nhất bồi thường.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 9,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-010',
      title: '10. Chính sách bồi thường thiệt hại & Trách nhiệm vật chất',
      slug: 'chinh-sach-boi-thuong-thiet-hai-va-trach-nhiem-vat-chat',
      category: 'COMPENSATION' as const,
      summary: 'Mức bồi hoàn chi tiết khi xảy ra sự cố mất mát, hư hỏng hoặc thất lạc đối với đơn hàng có khai giá và không khai giá.',
      content: `### 10.1. Đơn hàng CÓ sử dụng dịch vụ Khai giá (Bảo hiểm)
Khi bưu gửi bị mất mát, thất lạc hoặc hư hại hoàn toàn do lỗi của NEXUS trong quá trình vận chuyển:
- **Mức bồi thường**: Bồi thường **100% giá trị khai giá** của hàng hóa (căn cứ theo hóa đơn mua bán hợp pháp hoặc giá trị thị trường tại thời điểm gửi).
- **Hư hỏng một phần**: Bồi thường theo tỷ lệ suy suyển thực tế được xác định qua biên bản giám định của hai bên.
- **Hoàn cước**: Hoàn trả lại 100% cước phí vận chuyển của đơn hàng bị sự cố.

### 10.2. Đơn hàng KHÔNG sử dụng dịch vụ Khai giá
Đối với bưu gửi thông thường không đăng ký dịch vụ khai giá:
- **Mất mát / Thất lạc hoàn toàn**: Bồi thường bằng **04 lần cước phí vận chuyển** của đơn hàng đó (đã bao gồm hoàn cước).
- **Hư hỏng một phần**: Bồi thường tối đa bằng số tiền cước dịch vụ nhân với tỷ lệ phần trăm hư hại thực tế.

### 10.3. Hồ sơ yêu cầu bồi thường
Người gửi cần cung cấp các giấy tờ chứng minh hợp lệ:
1. Hóa đơn tài chính (VAT) hoặc chứng từ mua bán hàng hóa hợp pháp.
2. Hình ảnh/Video bằng chứng đóng gói trước khi gửi và tình trạng hư hại khi nhận.
3. Biên bản kiểm định hiện trường có chữ ký xác nhận của đại diện NEXUS và Khách hàng.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 10,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
    {
      id: 'policy-011',
      title: '11. Các trường hợp miễn trừ trách nhiệm bồi thường',
      slug: 'cac-truong-hop-mien-tru-trach-nhiem-boi-thuong',
      category: 'COMPANY_RESPONSIBILITY' as const,
      summary: 'Quy định các trường hợp bất khả kháng, lỗi do người gửi hoặc cơ quan nhà nước thu giữ mà công ty được miễn trừ bồi hoàn.',
      content: `### 11.1. Các trường hợp NEXUS được miễn trừ hoàn toàn trách nhiệm
NEXUS không chịu trách nhiệm bồi thường thiệt hại trong các trường hợp sau:
1. **Sự kiện Bất khả kháng (Force Majeure)**: Thiên tai, bão lũ, động đất, hỏa hoạn, chiến tranh, dịch bệnh, các quyết định khẩn cấp của Chính phủ làm phong tỏa tuyến giao thông.
2. **Lỗi xuất phát từ phía Người gửi hoặc Người nhận**:
   - Hàng hóa đóng gói không đúng quy chuẩn kỹ thuật dẫn đến tự bể vỡ, rò rỉ trong quá trình lưu thông bình thường.
   - Cung cấp sai số điện thoại, sai địa chỉ nhận hàng hoặc Người nhận từ chối nhận hàng không có lý do chính đáng.
   - Hàng hóa có đặc tính tự nhiên bị biến chất (hàng tươi sống, thực phẩm ôi thiu do nhiệt độ môi trường).
3. **Bị cơ quan Nhà nước có thẩm quyền thu giữ hoặc tiêu hủy**: Bưu gửi chứa hàng lậu, hàng giả, hàng cấm hoặc không có hóa đơn chứng từ chứng minh nguồn gốc xuất xứ theo quy định của Quản lý Thị trường / Hải quan.
4. **Bưu gửi đã được ký nhận an toàn**: Người nhận đã kiểm tra, ký nhận không có ghi chú khiếu nại ngoại quan tại thời điểm bàn giao POD.
5. **Thiệt hại gián tiếp**: NEXUS không chịu trách nhiệm bồi thường các thiệt hại mang tính chất gián tiếp như mất cơ hội kinh doanh, lợi nhuận kỳ vọng hoặc tổn thất tinh thần phát sinh từ việc chậm trễ đơn hàng.`,
      status: 'PUBLISHED' as const,
      version: 1,
      displayOrder: 11,
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: '10000001',
      updatedBy: '10000001',
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { slug: policy.slug },
      create: {
        id: policy.id,
        title: policy.title,
        slug: policy.slug,
        category: policy.category,
        summary: policy.summary,
        content: policy.content,
        status: policy.status,
        version: policy.version,
        displayOrder: policy.displayOrder,
        effectiveDate: policy.effectiveDate,
        publishedAt: policy.publishedAt,
        createdBy: policy.createdBy,
        updatedBy: policy.updatedBy,
        versions: {
          create: {
            version: 1,
            title: policy.title,
            category: policy.category,
            summary: policy.summary,
            content: policy.content,
            status: policy.status,
            changeNote: 'Phiên bản ban hành chính thức',
            createdBy: policy.createdBy,
          },
        },
      },
      update: {
        title: policy.title,
        category: policy.category,
        summary: policy.summary,
        content: policy.content,
        status: policy.status,
        displayOrder: policy.displayOrder,
        effectiveDate: policy.effectiveDate,
        publishedAt: policy.publishedAt,
        updatedBy: policy.updatedBy,
      },
    });
  }

  console.log(`Đã seed thành công ${policies.length} văn bản Điều khoản & Chính sách dịch vụ chuẩn logistics.`);
}

async function main() {
  const provinces = await loadVietnamProvinces();

  await cleanupLegacyRegionalSeed();
  await seedZones();
  await seedHubs(provinces);
  await seedNdrReasons();
  await seedConfigs(provinces);
  await seedMerchantProfiles(provinces);
  await seedCourierAreaAssignments();
  await seedPolicies();
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

