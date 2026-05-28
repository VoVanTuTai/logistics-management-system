import { Injectable, Logger } from '@nestjs/common';

import type {
  VietnamProvince,
  VietnamWard,
} from '../../domain/entities/vietnam-administrative-unit.entity';

const VIETNAM_PROVINCES_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';

@Injectable()
export class VietnamAdministrativeUnitsService {
  private readonly logger = new Logger(VietnamAdministrativeUnitsService.name);
  private cache: VietnamProvince[] | null = null;

  async listProvinces(): Promise<VietnamProvince[]> {
    if (this.cache) {
      return this.cache;
    }

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
        .filter((province): province is VietnamProvince => Boolean(province))
        .sort((left, right) => left.code - right.code);

      if (provinces.length === 0) {
        throw new Error('Vietnam province API returned no valid provinces.');
      }

      this.cache = provinces;
      return provinces;
    } catch (error) {
      this.logger.warn(
        `Cannot load updated Vietnam administrative units, using fallback data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.cache = FALLBACK_PROVINCES;
      return this.cache;
    }
  }
}

function mapProvince(value: unknown): VietnamProvince | null {
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

  const provinceCode = record.code;

  return {
    code: provinceCode,
    name: record.name,
    codename: record.codename,
    divisionType:
      typeof record.division_type === 'string' ? record.division_type : '',
    phoneCode: typeof record.phone_code === 'number' ? record.phone_code : null,
    wards: Array.isArray(record.wards)
      ? record.wards
          .map((ward) => mapWard(ward, provinceCode))
          .filter((ward): ward is VietnamWard => Boolean(ward))
      : [],
  };
}

function mapWard(value: unknown, provinceCode: number): VietnamWard | null {
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

const FALLBACK_PROVINCES: VietnamProvince[] = [
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
  const ward = String(wardName);
  return {
    code: provinceCode,
    name: String(name),
    codename: String(codename),
    divisionType: String(name).startsWith('Thành phố') ? 'thành phố trung ương' : 'tỉnh',
    phoneCode: null,
    wards: [
      {
        code: provinceCode * 1000 + 1,
        name: ward,
        codename: ward
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
        divisionType: ward.startsWith('Phường') ? 'phường' : 'xã',
        provinceCode,
      },
    ],
  };
});
