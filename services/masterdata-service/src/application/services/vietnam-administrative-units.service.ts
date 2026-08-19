import { Injectable, Logger } from '@nestjs/common';

import type {
  VietnamProvince,
  VietnamWard,
} from '../../domain/entities/vietnam-administrative-unit.entity';

const VIETNAM_PROVINCES_API_URL = 'https://provinces.open-api.vn/api/?depth=3';

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
        `Cannot load updated Vietnam administrative units, using fallback data: ${error instanceof Error ? error.message : String(error)
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

  let wardList: VietnamWard[] = [];
  if (Array.isArray(record.wards) && record.wards.length > 0) {
    wardList = record.wards
      .map((ward) => mapWard(ward, provinceCode))
      .filter((ward): ward is VietnamWard => Boolean(ward));
  } else if (Array.isArray(record.districts)) {
    wardList = (record.districts as unknown[]).flatMap((district) => {
      if (!district || typeof district !== 'object') return [];
      const dRecord = district as Record<string, unknown>;
      const districtName = typeof dRecord.name === 'string' ? dRecord.name : '';
      if (!Array.isArray(dRecord.wards)) return [];
      return dRecord.wards
        .map((ward) => mapWard(ward, provinceCode, districtName))
        .filter((ward): ward is VietnamWard => Boolean(ward));
    });
  }

  return {
    code: provinceCode,
    name: record.name,
    codename: record.codename,
    divisionType:
      typeof record.division_type === 'string' ? record.division_type : '',
    phoneCode: typeof record.phone_code === 'number' ? record.phone_code : null,
    wards: wardList,
  };
}

function mapWard(value: unknown, provinceCode: number, districtName?: string): VietnamWard | null {
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

  const rawName = record.name;
  const fullName = districtName && !rawName.includes('(')
    ? `${rawName} (${districtName})`
    : rawName;

  return {
    code: record.code,
    name: fullName,
    codename: record.codename,
    divisionType:
      typeof record.division_type === 'string' ? record.division_type : '',
    provinceCode:
      typeof record.province_code === 'number' ? record.province_code : provinceCode,
  };
}

const FALLBACK_PROVINCES: VietnamProvince[] = [
  ['Thành phố Hà Nội', 1, 'ha_noi', ['Phường Hàng Bạc (Quận Hoàn Kiếm)', 'Phường Tràng Tiền (Quận Hoàn Kiếm)', 'Phường Điện Biên (Quận Ba Đình)', 'Phường Kim Mã (Quận Ba Đình)', 'Phường Dịch Vọng (Quận Cầu Giấy)', 'Phường Mỹ Đình 1 (Quận Nam Từ Liêm)', 'Phường Ô Chợ Dừa (Quận Đống Đa)']],
  ['Tỉnh Cao Bằng', 4, 'cao_bang', ['Phường Thục Phán', 'Phường Nùng Trí Cao', 'Phường Đề Thám', 'Phường Hợp Giang', 'Phường Tân Giang', 'Xã Hòa An', 'Xã Quảng Hòa']],
  ['Tỉnh Tuyên Quang', 8, 'tuyen_quang', ['Phường Minh Xuân', 'Phường Tân Quang', 'Phường Phan Thiết', 'Phường Ỷ La']],
  ['Tỉnh Điện Biên', 11, 'dien_bien', ['Phường Điện Biên Phủ', 'Phường Mường Thanh', 'Phường Nam Thanh', 'Phường Him Lam']],
  ['Tỉnh Lai Châu', 12, 'lai_chau', ['Phường Tân Phong', 'Phường Đoàn Kết', 'Phường Đông Phong']],
  ['Tỉnh Sơn La', 14, 'son_la', ['Phường Tô Hiệu', 'Phường Chiềng Lề', 'Phường Quyết Thắng']],
  ['Tỉnh Lào Cai', 15, 'lao_cai', ['Phường Lào Cai', 'Phường Cốc Lếu', 'Phường Kim Tân', 'Phường Sa Pa']],
  ['Tỉnh Thái Nguyên', 19, 'thai_nguyen', ['Phường Phan Đình Phùng', 'Phường Hoàng Văn Thụ', 'Phường Đồng Quang']],
  ['Tỉnh Lạng Sơn', 20, 'lang_son', ['Phường Đông Kinh', 'Phường Tam Thanh', 'Phường Vĩnh Trại']],
  ['Tỉnh Quảng Ninh', 22, 'quang_ninh', ['Phường Hạ Long', 'Phường Bãi Cháy', 'Phường Hồng Gai', 'Phường Cam Phả']],
  ['Tỉnh Bắc Ninh', 24, 'bac_ninh', ['Phường Bắc Ninh', 'Phường Tiền An', 'Phường Ninh Xá', 'Phường Từ Sơn']],
  ['Tỉnh Phú Thọ', 25, 'phu_tho', ['Phường Việt Trì', 'Phường Gia Cẩm', 'Phường Tân Dân']],
  ['Thành phố Hải Phòng', 31, 'hai_phong', ['Phường Hồng Bàng', 'Phường Minh Khai', 'Phường Lạch Tray (Quận Ngô Quyền)', 'Phường Trần Nguyên Hãn (Quận Lê Chân)']],
  ['Tỉnh Hưng Yên', 33, 'hung_yen', ['Phường Phố Hiến', 'Phường Lê Lợi', 'Phường Hiến Nam']],
  ['Tỉnh Ninh Bình', 37, 'ninh_binh', ['Phường Hoa Lư', 'Phường Thanh Bình', 'Phường Vân Giang']],
  ['Tỉnh Thanh Hóa', 38, 'thanh_hoa', ['Phường Hạc Thành', 'Phường Ba Đình', 'Phường Lam Sơn']],
  ['Tỉnh Nghệ An', 40, 'nghe_an', ['Phường Vinh', 'Phường Hưng Dũng', 'Phường Trường Thi']],
  ['Tỉnh Hà Tĩnh', 42, 'ha_tinh', ['Phường Thành Sen', 'Phường Bắc Hà', 'Phường Nam Hà']],
  ['Tỉnh Quảng Trị', 44, 'quang_tri', ['Phường Đông Hà', 'Phường 1', 'Phường 2', 'Phường 3']],
  ['Thành phố Huế', 46, 'hue', ['Phường Thuận Hóa', 'Phường Phú Hội', 'Phường Vĩnh Ninh']],
  ['Thành phố Đà Nẵng', 48, 'da_nang', ['Phường Hải Châu 1 (Quận Hải Châu)', 'Phường Hải Châu 2 (Quận Hải Châu)', 'Phường Thạch Thang (Quận Hải Châu)', 'Phường Phước Mỹ (Quận Sơn Trà)']],
  ['Tỉnh Quảng Ngãi', 51, 'quang_ngai', ['Phường Quảng Ngãi', 'Phường Lê Hồng Phong', 'Phường Trần Hưng Đạo']],
  ['Tỉnh Gia Lai', 52, 'gia_lai', ['Phường Pleiku', 'Phường Hội Thương', 'Phường Hoa Lư']],
  ['Tỉnh Khánh Hòa', 56, 'khanh_hoa', ['Phường Nha Trang', 'Phường Lộc Thọ', 'Phường Phước Tiến']],
  ['Tỉnh Đắk Lắk', 66, 'dak_lak', ['Phường Buôn Ma Thuột', 'Phường Tân Lợi', 'Phường Thắng Lợi']],
  ['Tỉnh Lâm Đồng', 68, 'lam_dong', ['Phường Xuân Hương - Đà Lạt', 'Phường 1 (Đà Lạt)', 'Phường 2 (Đà Lạt)']],
  ['Tỉnh Đồng Nai', 75, 'dong_nai', ['Phường Trấn Biên', 'Phường Trung Dũng (Biên Hòa)', 'Phường Quyết Thắng']],
  ['Thành phố Hồ Chí Minh', 79, 'ho_chi_minh', ['Phường Bến Nghé (Quận 1)', 'Phường Bến Thành (Quận 1)', 'Phường Tân Định (Quận 1)', 'Phường Võ Thị Sáu (Quận 3)', 'Phường Thảo Điền (TP. Thủ Đức)', 'Phường Tân Phong (Quận 7)']],
  ['Tỉnh Tây Ninh', 80, 'tay_ninh', ['Phường Tân Ninh', 'Phường 1', 'Phường 2']],
  ['Tỉnh Đồng Tháp', 82, 'dong_thap', ['Phường Cao Lãnh', 'Phường 1', 'Phường 2']],
  ['Tỉnh Vĩnh Long', 86, 'vinh_long', ['Phường Long Châu', 'Phường 1', 'Phường 2']],
  ['Tỉnh An Giang', 91, 'an_giang', ['Phường Long Xuyên', 'Phường Mỹ Bình', 'Phường Châu Phú']],
  ['Thành phố Cần Thơ', 92, 'can_tho', ['Phường Ninh Kiều', 'Phường Tân An', 'Phường An Cư', 'Phường Xuân Khánh']],
  ['Tỉnh Cà Mau', 96, 'ca_mau', ['Phường An Xuyên', 'Phường 5', 'Phường 6', 'Phường 9']],
].map(([name, code, codename, wardNames]) => {
  const provinceCode = Number(code);
  const wardsList = Array.isArray(wardNames) ? wardNames : [String(wardNames)];
  return {
    code: provinceCode,
    name: String(name),
    codename: String(codename),
    divisionType: String(name).startsWith('Thành phố') ? 'thành phố trung ương' : 'tỉnh',
    phoneCode: null,
    wards: wardsList.map((wStr, idx) => ({
      code: provinceCode * 1000 + idx + 1,
      name: wStr,
      codename: wStr
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
      divisionType: wStr.startsWith('Phường') ? 'phường' : 'xã',
      provinceCode,
    })),
  };
});
