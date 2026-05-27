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
  },
};

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
  try {
    const response = await fetch(VIETNAM_PROVINCES_API_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Vietnam province API returned ${response.status}.`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error('Vietnam province API returned an invalid payload.');
    }

    const provinces = payload
      .map(mapProvince)
      .filter((province): province is VietnamProvinceSeed => Boolean(province))
      .sort((left, right) => left.code - right.code);

    assertProvinceCoverage(provinces);

    return provinces;
  } catch (error) {
    console.warn(
      `Cannot load provinces.open-api.vn data, using fallback province list: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return FALLBACK_PROVINCES;
  }
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
