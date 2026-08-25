export type VietnamRegion = 'NORTH' | 'CENTRAL' | 'SOUTH';
export type MerchantRegionCode = 'HA_NOI' | 'DA_NANG' | 'HO_CHI_MINH';

export interface VietnamWardSeed {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  provinceCode: number;
}

export interface VietnamProvinceSeed {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  phoneCode: number | null;
  wards: VietnamWardSeed[];
}

export interface RegionalHubSeed {
  code: string;
  name: string;
  zoneCode: string;
  zoneName: string;
  region: VietnamRegion;
  merchantRegionCode: MerchantRegionCode;
  provinceCodename: string;
  preferredWardNames: string[];
  addressLine: string;
  phone: string;
  contactName: string;
  latitude: number;
  longitude: number;
}

const VIETNAM_PROVINCES_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';

const NORTH_PROVINCES = new Set([
  'ha_noi',
  'cao_bang',
  'tuyen_quang',
  'dien_bien',
  'lai_chau',
  'son_la',
  'lao_cai',
  'thai_nguyen',
  'lang_son',
  'quang_ninh',
  'bac_ninh',
  'phu_tho',
  'hai_phong',
  'hung_yen',
  'ninh_binh',
]);

const CENTRAL_PROVINCES = new Set([
  'thanh_hoa',
  'nghe_an',
  'ha_tinh',
  'quang_tri',
  'hue',
  'da_nang',
  'quang_ngai',
  'gia_lai',
  'khanh_hoa',
  'dak_lak',
  'lam_dong',
]);

const SOUTH_PROVINCES = new Set([
  'dong_nai',
  'ho_chi_minh',
  'tay_ninh',
  'dong_thap',
  'vinh_long',
  'an_giang',
  'can_tho',
  'ca_mau',
]);

export interface NationalHqSeed {
  code: string;
  name: string;
  zoneCode: string;
  zoneName: string;
  addressLine: string;
  phone: string;
  contactName: string;
  latitude: number;
  longitude: number;
}

export const NATIONAL_HQ_HUB: NationalHqSeed = {
  code: '000HQ001',
  name: 'Trụ sở Điều hành NEXUS Toàn quốc',
  zoneCode: '000',
  zoneName: 'Zone Toàn quốc',
  addressLine: 'Tòa nhà NEXUS Tower, 01 Tràng Tiền, Hoàn Kiếm, Hà Nội',
  phone: '19006868',
  contactName: 'Ban Giám Đốc NEXUS',
  latitude: 21.028511,
  longitude: 105.854444,
};

export interface WardHubSeed {
  code: string;
  name: string;
  parentHubCode: string;
  provinceCode: number;
  provinceName: string;
  district: string;
  ward: string;
  addressLine: string;
  phone: string;
  contactName: string;
  latitude: number;
  longitude: number;
  coverageRadiusKm?: number;
  boundaryPolygon: Array<[number, number]>; // Array of [latitude, longitude] boundary points (Google Maps / OSM administrative borders)
}

export const SAMPLE_WARD_HUBS: WardHubSeed[] = [
  // TP. Hồ Chí Minh
  {
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    addressLine: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1',
    phone: '0283811001',
    contactName: 'Trưởng Bưu cục Bến Thành',
    latitude: 10.7715,
    longitude: 106.6932,
    boundaryPolygon: [
      [10.766, 106.687],
      [10.777, 106.689],
      [10.779, 106.696],
      [10.774, 106.699],
      [10.768, 106.696],
      [10.765, 106.691],
      [10.766, 106.687],
    ],
  },
  {
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressLine: '45 Lê Lợi, Phường Bến Nghé, Quận 1',
    phone: '0283811002',
    contactName: 'Trưởng Bưu cục Bến Nghé',
    latitude: 10.7758,
    longitude: 106.7012,
    boundaryPolygon: [
      [10.772, 106.698],
      [10.785, 106.701],
      [10.789, 106.707],
      [10.778, 106.712],
      [10.770, 106.706],
      [10.772, 106.698],
    ],
  },
  {
    code: '07903W001',
    name: 'Bưu cục Phường 13 - Quận 3',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 13',
    addressLine: '78 Lê Văn Sỹ, Phường 13, Quận 3',
    phone: '0283811003',
    contactName: 'Trưởng Bưu cục Quận 3',
    latitude: 10.7891,
    longitude: 106.6775,
    boundaryPolygon: [
      [10.782, 106.671],
      [10.794, 106.673],
      [10.795, 106.684],
      [10.784, 106.683],
      [10.782, 106.671],
    ],
  },
  {
    code: '07905W001',
    name: 'Bưu cục Phường 2 - Quận 5',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận 5',
    ward: 'Phường 2',
    addressLine: '88 Trần Hưng Đạo, Phường 2, Quận 5',
    phone: '0283811004',
    contactName: 'Trưởng Bưu cục Quận 5',
    latitude: 10.7538,
    longitude: 106.6782,
    boundaryPolygon: [
      [10.746, 106.672],
      [10.759, 106.673],
      [10.760, 106.685],
      [10.748, 106.684],
      [10.746, 106.672],
    ],
  },
  {
    code: '07912W001',
    name: 'Bưu cục Phường An Phú Đông - Quận 12',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận 12',
    ward: 'Phường An Phú Đông',
    addressLine: '1013A Hà Huy Giáp, Phường An Phú Đông, Quận 12',
    phone: '0283811005',
    contactName: 'Trưởng Bưu cục An Phú Đông',
    latitude: 10.867,
    longitude: 106.696,
    boundaryPolygon: [
      [10.850, 106.683],
      [10.880, 106.686],
      [10.885, 106.713],
      [10.857, 106.715],
      [10.850, 106.683],
    ],
  },
  {
    code: '07913W001',
    name: 'Bưu cục Phường 13 - Tân Bình',
    parentHubCode: '003079B001',
    provinceCode: 79,
    provinceName: 'Thành phố Hồ Chí Minh',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    addressLine: '789 Cộng Hòa, Phường 13, Quận Tân Bình',
    phone: '0283811006',
    contactName: 'Trưởng Bưu cục Tân Bình',
    latitude: 10.8035,
    longitude: 106.6436,
    boundaryPolygon: [
      [10.794, 106.633],
      [10.815, 106.636],
      [10.813, 106.655],
      [10.796, 106.652],
      [10.794, 106.633],
    ],
  },

  // Hà Nội
  {
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
    parentHubCode: '001001B001',
    provinceCode: 1,
    provinceName: 'Thành phố Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    addressLine: '15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm',
    phone: '0243811001',
    contactName: 'Trưởng Bưu cục Hàng Bài',
    latitude: 21.0185,
    longitude: 105.8524,
    boundaryPolygon: [
      [21.012, 105.847],
      [21.024, 105.849],
      [21.025, 105.858],
      [21.013, 105.857],
      [21.012, 105.847],
    ],
  },
  {
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã - Ba Đình',
    parentHubCode: '001001B001',
    provinceCode: 1,
    provinceName: 'Thành phố Hà Nội',
    district: 'Quận Ba Đình',
    ward: 'Phường Kim Mã',
    addressLine: '56 Kim Mã, Phường Kim Mã, Quận Ba Đình',
    phone: '0243811002',
    contactName: 'Trưởng Bưu cục Kim Mã',
    latitude: 21.0318,
    longitude: 105.8247,
    boundaryPolygon: [
      [21.025, 105.817],
      [21.037, 105.819],
      [21.038, 105.831],
      [21.026, 105.829],
      [21.025, 105.817],
    ],
  },
  {
    code: '00103W001',
    name: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
    parentHubCode: '001001B001',
    provinceCode: 1,
    provinceName: 'Thành phố Hà Nội',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    addressLine: '234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy',
    phone: '0243811003',
    contactName: 'Trưởng Bưu cục Cầu Giấy',
    latitude: 21.0336,
    longitude: 105.7958,
    boundaryPolygon: [
      [21.025, 105.787],
      [21.041, 105.789],
      [21.042, 105.804],
      [21.027, 105.803],
      [21.025, 105.787],
    ],
  },
  {
    code: '00104W001',
    name: 'Bưu cục Phường Trung Liệt - Đống Đa',
    parentHubCode: '001001B001',
    provinceCode: 1,
    provinceName: 'Thành phố Hà Nội',
    district: 'Quận Đống Đa',
    ward: 'Phường Trung Liệt',
    addressLine: '88 Thái Hà, Phường Trung Liệt, Quận Đống Đa',
    phone: '0243811004',
    contactName: 'Trưởng Bưu cục Đống Đa',
    latitude: 21.0135,
    longitude: 105.8194,
    boundaryPolygon: [
      [21.007, 105.811],
      [21.019, 105.813],
      [21.020, 105.826],
      [21.008, 105.825],
      [21.007, 105.811],
    ],
  },

  // Đà Nẵng
  {
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang - Hải Châu',
    parentHubCode: '002048B001',
    provinceCode: 48,
    provinceName: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    addressLine: '12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu',
    phone: '0236381101',
    contactName: 'Trưởng Bưu cục Hải Châu',
    latitude: 16.0742,
    longitude: 108.2239,
    boundaryPolygon: [
      [16.067, 108.217],
      [16.081, 108.219],
      [16.082, 108.229],
      [16.068, 108.228],
      [16.067, 108.217],
    ],
  },
];

/**
 * Ray Casting Algorithm (Point-in-Polygon)
 * Determines whether a GPS coordinate is strictly inside a closed boundary polygon.
 */
export function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<[number, number]>,
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findResponsibleHubByCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
  fallbackProvinceCodenameOrName?: string | null,
): { hubCode: string; hubName: string; level: number; parentHubCode?: string } {
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    const point = { latitude: lat, longitude: lng };

    // 1. Check exact match with Ward Boundary Polygon (Ray Casting)
    for (const wardHub of SAMPLE_WARD_HUBS) {
      if (wardHub.boundaryPolygon && isPointInPolygon(point, wardHub.boundaryPolygon)) {
        return {
          hubCode: wardHub.code,
          hubName: wardHub.name,
          level: 3,
          parentHubCode: wardHub.parentHubCode,
        };
      }
    }

    // 2. Secondary fallback: nearest Ward Hub within small distance
    let closestWardHub: WardHubSeed | null = null;
    let minDistance = Infinity;

    for (const wardHub of SAMPLE_WARD_HUBS) {
      const dist = calculateHaversineDistanceKm(lat, lng, wardHub.latitude, wardHub.longitude);
      if (dist <= 3.5 && dist < minDistance) {
        minDistance = dist;
        closestWardHub = wardHub;
      }
    }

    if (closestWardHub) {
      return {
        hubCode: closestWardHub.code,
        hubName: closestWardHub.name,
        level: 3,
        parentHubCode: closestWardHub.parentHubCode,
      };
    }
  }

  // 3. Fallback to Provincial Hub by codename/name
  if (fallbackProvinceCodenameOrName) {
    const norm = fallbackProvinceCodenameOrName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^(thanh pho|tinh|tp)\s+/i, '')
      .trim();

    if (norm.includes('ho chi minh') || norm.includes('sai gon') || norm.includes('tphcm')) {
      return { hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh', level: 2, parentHubCode: '003S001' };
    }
    if (norm.includes('ha noi') || norm.includes('hanoi')) {
      return { hubCode: '001001B001', hubName: 'Bưu cục Hà Nội', level: 2, parentHubCode: '001N001' };
    }
    if (norm.includes('da nang') || norm.includes('danang')) {
      return { hubCode: '002048B001', hubName: 'Bưu cục Đà Nẵng', level: 2, parentHubCode: '002C001' };
    }
  }

  // 4. Fallback to Region / Default Hub
  return { hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh', level: 2, parentHubCode: '003S001' };
}

export const REGIONAL_HUBS: Record<VietnamRegion, RegionalHubSeed> = {
  NORTH: {
    code: '001N001',
    name: 'Hub miền Bắc',
    zoneCode: '001',
    zoneName: 'Zone miền Bắc',
    region: 'NORTH',
    merchantRegionCode: 'HA_NOI',
    provinceCodename: 'ha_noi',
    preferredWardNames: ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình'],
    addressLine: '12 Tràng Tiền',
    phone: '0241000001',
    contactName: 'Điều phối miền Bắc',
    latitude: 21.0253,
    longitude: 105.8572,
  },
  CENTRAL: {
    code: '002C001',
    name: 'Hub miền Trung',
    zoneCode: '002',
    zoneName: 'Zone miền Trung',
    region: 'CENTRAL',
    merchantRegionCode: 'DA_NANG',
    provinceCodename: 'da_nang',
    preferredWardNames: ['Phường Hải Châu', 'Phường Thanh Khê', 'Phường Sơn Trà'],
    addressLine: '08 Bạch Đằng',
    phone: '0236100001',
    contactName: 'Điều phối miền Trung',
    latitude: 16.0718,
    longitude: 108.2241,
  },
  SOUTH: {
    code: '003S001',
    name: 'Hub miền Nam',
    zoneCode: '003',
    zoneName: 'Zone miền Nam',
    region: 'SOUTH',
    merchantRegionCode: 'HO_CHI_MINH',
    provinceCodename: 'ho_chi_minh',
    preferredWardNames: ['Phường Sài Gòn', 'Phường Bến Thành', 'Phường Tân Định'],
    addressLine: '02 Công xã Paris',
    phone: '0281000001',
    contactName: 'Điều phối miền Nam',
    latitude: 10.7797,
    longitude: 106.6991,
  },
};

export const PROVINCE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  ha_noi: { latitude: 21.028511, longitude: 105.854444 },
  cao_bang: { latitude: 22.6657, longitude: 106.2577 },
  tuyen_quang: { latitude: 21.8233, longitude: 105.2181 },
  dien_bien: { latitude: 21.386, longitude: 103.023 },
  lai_chau: { latitude: 22.3965, longitude: 103.4682 },
  son_la: { latitude: 21.3283, longitude: 103.9148 },
  lao_cai: { latitude: 22.4856, longitude: 103.9707 },
  thai_nguyen: { latitude: 21.5942, longitude: 105.8482 },
  lang_son: { latitude: 21.8537, longitude: 106.7615 },
  quang_ninh: { latitude: 20.9505, longitude: 107.0734 },
  bac_ninh: { latitude: 21.1861, longitude: 106.0763 },
  phu_tho: { latitude: 21.3227, longitude: 105.2280 },
  hai_phong: { latitude: 20.8449, longitude: 106.6881 },
  hung_yen: { latitude: 20.6464, longitude: 106.0511 },
  ninh_binh: { latitude: 20.2506, longitude: 105.9745 },
  thanh_hoa: { latitude: 19.8067, longitude: 105.7852 },
  nghe_an: { latitude: 18.6734, longitude: 105.6813 },
  ha_tinh: { latitude: 18.3435, longitude: 105.9058 },
  quang_tri: { latitude: 16.8163, longitude: 107.1006 },
  hue: { latitude: 16.4637, longitude: 107.5909 },
  da_nang: { latitude: 16.067780, longitude: 108.220830 },
  quang_ngai: { latitude: 15.1205, longitude: 108.7923 },
  gia_lai: { latitude: 13.9833, longitude: 108.0000 },
  khanh_hoa: { latitude: 12.2388, longitude: 109.1967 },
  dak_lak: { latitude: 12.6667, longitude: 108.0500 },
  lam_dong: { latitude: 11.9404, longitude: 108.4583 },
  dong_nai: { latitude: 10.9574, longitude: 106.8427 },
  ho_chi_minh: { latitude: 10.776889, longitude: 106.700806 },
  tay_ninh: { latitude: 11.3101, longitude: 106.0983 },
  dong_thap: { latitude: 10.4577, longitude: 105.6331 },
  vinh_long: { latitude: 10.2537, longitude: 105.9722 },
  an_giang: { latitude: 10.3759, longitude: 105.4185 },
  can_tho: { latitude: 10.0452, longitude: 105.7469 },
  ca_mau: { latitude: 9.1769, longitude: 105.1524 },
};

export function resolveProvinceCoordinates(codename?: string | null): { latitude: number; longitude: number } {
  if (codename && PROVINCE_COORDINATES[codename]) {
    return PROVINCE_COORDINATES[codename];
  }
  return { latitude: 10.776889, longitude: 106.700806 };
}

export function resolveProvinceRegion(codename: string): VietnamRegion {
  if (NORTH_PROVINCES.has(codename)) {
    return 'NORTH';
  }

  if (CENTRAL_PROVINCES.has(codename)) {
    return 'CENTRAL';
  }

  if (SOUTH_PROVINCES.has(codename)) {
    return 'SOUTH';
  }

  throw new Error(`Province "${codename}" has no configured region.`);
}

export function resolveRegionalHub(province: VietnamProvinceSeed): RegionalHubSeed {
  return REGIONAL_HUBS[resolveProvinceRegion(province.codename)];
}

export function provinceShortName(province: VietnamProvinceSeed): string {
  return province.name.replace(/^(Tỉnh|Thành phố)\s+/u, '');
}

export function branchHubCodeForProvince(province: VietnamProvinceSeed): string {
  const hub = resolveRegionalHub(province);
  return `${hub.zoneCode}${String(province.code).padStart(3, '0')}B001`;
}

export function branchHubNameForProvince(province: VietnamProvinceSeed): string {
  return `Bưu cục ${provinceShortName(province)}`;
}

export function merchantUsernameForProvinceIndex(index: number): string {
  return `411${String(index + 1).padStart(5, '0')}`;
}

export function merchantCitizenId(province: VietnamProvinceSeed, index: number): string {
  return `${String(province.code).padStart(3, '0')}2${String(index + 1).padStart(8, '0')}`;
}

export function getRepresentativeWard(
  province: VietnamProvinceSeed,
  preferredWardNames: string[] = [],
): VietnamWardSeed | null {
  for (const name of preferredWardNames) {
    const matchedWard = province.wards.find((ward) => ward.name === name);
    if (matchedWard) {
      return matchedWard;
    }
  }

  return province.wards[0] ?? null;
}

export function buildAddressLine(input: {
  addressLine: string;
  wardName?: string | null;
  provinceName: string;
}): string {
  return [input.addressLine, input.wardName, input.provinceName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

export async function loadVietnamProvinces(): Promise<VietnamProvinceSeed[]> {
  return FALLBACK_PROVINCES;
}

function mapProvince(value: unknown): VietnamProvinceSeed | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.code !== 'number' ||
    typeof record.name !== 'string' ||
    typeof record.codename !== 'string'
  ) {
    return null;
  }

  return {
    code: record.code,
    name: record.name,
    codename: record.codename,
    divisionType:
      typeof record.division_type === 'string' ? record.division_type : '',
    phoneCode: typeof record.phone_code === 'number' ? record.phone_code : null,
    wards: Array.isArray(record.wards)
      ? record.wards
          .map((ward) => mapWard(ward, record.code))
          .filter((ward): ward is VietnamWardSeed => Boolean(ward))
      : [],
  };
}

function mapWard(value: unknown, provinceCode: number): VietnamWardSeed | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.code !== 'number' ||
    typeof record.name !== 'string' ||
    typeof record.codename !== 'string'
  ) {
    return null;
  }

  return {
    code: record.code,
    name: record.name,
    codename: record.codename,
    divisionType:
      typeof record.division_type === 'string' ? record.division_type : '',
    provinceCode:
      typeof record.province_code === 'number' ? record.province_code : provinceCode,
  };
}

function assertProvinceCoverage(provinces: VietnamProvinceSeed[]): void {
  const missingRegions = provinces
    .map((province) => province.codename)
    .filter(
      (codename) =>
        !NORTH_PROVINCES.has(codename) &&
        !CENTRAL_PROVINCES.has(codename) &&
        !SOUTH_PROVINCES.has(codename),
    );

  if (provinces.length !== 34 || missingRegions.length > 0) {
    throw new Error(
      `Expected 34 mapped provinces, got ${provinces.length}; missing=${missingRegions.join(', ')}`,
    );
  }
}

const FALLBACK_PROVINCES: VietnamProvinceSeed[] = [
  ['Thành phố Hà Nội', 1, 'ha_noi', 'Phường Hoàn Kiếm'],
  ['Tỉnh Cao Bằng', 4, 'cao_bang', 'Phường Thục Phán'],
  ['Tỉnh Tuyên Quang', 8, 'tuyen_quang', 'Phường Minh Xuân'],
  ['Tỉnh Điện Biên', 11, 'dien_bien', 'Phường Điện Biên Phủ'],
  ['Tỉnh Lai Châu', 12, 'lai_chau', 'Phường Tân Phong'],
  ['Tỉnh Sơn La', 14, 'son_la', 'Phường Tô Hiệu'],
  ['Tỉnh Lào Cai', 15, 'lao_cai', 'Phường Lào Cai'],
  ['Tỉnh Thái Nguyên', 19, 'thai_nguyen', 'Phường Phan Đình Phùng'],
  ['Tỉnh Lạng Sơn', 20, 'lang_son', 'Phường Đông Kinh'],
  ['Tỉnh Quảng Ninh', 22, 'quang_ninh', 'Phường Hạ Long'],
  ['Tỉnh Bắc Ninh', 24, 'bac_ninh', 'Phường Bắc Ninh'],
  ['Tỉnh Phú Thọ', 25, 'phu_tho', 'Phường Việt Trì'],
  ['Thành phố Hải Phòng', 31, 'hai_phong', 'Phường Hồng Bàng'],
  ['Tỉnh Hưng Yên', 33, 'hung_yen', 'Phường Phố Hiến'],
  ['Tỉnh Ninh Bình', 37, 'ninh_binh', 'Phường Hoa Lư'],
  ['Tỉnh Thanh Hóa', 38, 'thanh_hoa', 'Phường Hạc Thành'],
  ['Tỉnh Nghệ An', 40, 'nghe_an', 'Phường Vinh'],
  ['Tỉnh Hà Tĩnh', 42, 'ha_tinh', 'Phường Thành Sen'],
  ['Tỉnh Quảng Trị', 44, 'quang_tri', 'Phường Đông Hà'],
  ['Thành phố Huế', 46, 'hue', 'Phường Thuận Hóa'],
  ['Thành phố Đà Nẵng', 48, 'da_nang', 'Phường Hải Châu'],
  ['Tỉnh Quảng Ngãi', 51, 'quang_ngai', 'Phường Quảng Ngãi'],
  ['Tỉnh Gia Lai', 52, 'gia_lai', 'Phường Pleiku'],
  ['Tỉnh Khánh Hòa', 56, 'khanh_hoa', 'Phường Nha Trang'],
  ['Tỉnh Đắk Lắk', 66, 'dak_lak', 'Phường Buôn Ma Thuột'],
  ['Tỉnh Lâm Đồng', 68, 'lam_dong', 'Phường Xuân Hương - Đà Lạt'],
  ['Tỉnh Đồng Nai', 75, 'dong_nai', 'Phường Trấn Biên'],
  ['Thành phố Hồ Chí Minh', 79, 'ho_chi_minh', 'Phường Sài Gòn'],
  ['Tỉnh Tây Ninh', 80, 'tay_ninh', 'Phường Tân Ninh'],
  ['Tỉnh Đồng Tháp', 82, 'dong_thap', 'Phường Cao Lãnh'],
  ['Tỉnh Vĩnh Long', 86, 'vinh_long', 'Phường Long Châu'],
  ['Tỉnh An Giang', 91, 'an_giang', 'Phường Long Xuyên'],
  ['Thành phố Cần Thơ', 92, 'can_tho', 'Phường Ninh Kiều'],
  ['Tỉnh Cà Mau', 96, 'ca_mau', 'Phường An Xuyên'],
].map(([name, code, codename, wardName]) => {
  const provinceCode = Number(code);
  return {
    code: provinceCode,
    name: String(name),
    codename: String(codename),
    divisionType: String(name).startsWith('Thành phố') ? 'thành phố trung ương' : 'tỉnh',
    phoneCode: null,
    wards: [
      {
        code: provinceCode * 1000 + 1,
        name: String(wardName),
        codename: String(wardName)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
        divisionType: String(wardName).startsWith('Phường') ? 'phường' : 'xã',
        provinceCode,
      },
    ],
  };
});
