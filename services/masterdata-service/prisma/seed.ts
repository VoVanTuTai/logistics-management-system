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

async function main() {
  const provinces = await loadVietnamProvinces();

  await cleanupLegacyRegionalSeed();
  await seedZones();
  await seedHubs(provinces);
  await seedNdrReasons();
  await seedConfigs(provinces);
  await seedMerchantProfiles(provinces);
  await seedCourierAreaAssignments();
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
