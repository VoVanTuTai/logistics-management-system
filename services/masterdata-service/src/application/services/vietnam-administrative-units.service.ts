import { Injectable, Logger } from '@nestjs/common';

import type {
  VietnamProvince,
  VietnamWard,
} from '../../domain/entities/vietnam-administrative-unit.entity';

const VIETNAM_PROVINCES_API_URL = 'https://provinces.open-api.vn/api/?depth=2';

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

  let wardList: VietnamWard[] = [];
  if (Array.isArray(record.districts) && record.districts.length > 0) {
    wardList = (record.districts as unknown[])
      .flatMap((district) => {
        if (!district || typeof district !== 'object') return [];
        const dRecord = district as Record<string, unknown>;
        
        // If depth=3 wards exist inside district, map them
        if (Array.isArray(dRecord.wards) && dRecord.wards.length > 0) {
          const districtName = typeof dRecord.name === 'string' ? dRecord.name : '';
          return dRecord.wards
            .map((ward) => mapWard(ward, provinceCode, districtName))
            .filter((w): w is VietnamWard => Boolean(w));
        }

        // Otherwise depth=2: map district directly as administrative sub-unit item
        const dWard = mapWard(district, provinceCode);
        return dWard ? [dWard] : [];
      })
      .filter((ward): ward is VietnamWard => Boolean(ward));
  } else if (Array.isArray(record.wards)) {
    wardList = record.wards
      .map((ward) => mapWard(ward, provinceCode))
      .filter((ward): ward is VietnamWard => Boolean(ward));
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
  ['Thành phố Hà Nội', 1, 'ha_noi', ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Cầu Giấy', 'Quận Nam Từ Liêm', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân', 'Huyện Đông Anh']],
  ['Tỉnh Cao Bằng', 4, 'cao_bang', ['Thành phố Cao Bằng', 'Huyện Bảo Lạc', 'Huyện Bảo Lâm', 'Huyện Hạ Lang', 'Huyện Hà Quảng', 'Huyện Hòa An', 'Huyện Nguyên Bình', 'Huyện Quảng Hòa', 'Huyện Thạch An', 'Huyện Trùng Khánh']],
  ['Tỉnh Tuyên Quang', 8, 'tuyen_quang', ['Thành phố Tuyên Quang', 'Huyện Chiêm Hóa', 'Huyện Hàm Yên', 'Huyện Lâm Bình', 'Huyện Na Hang', 'Huyện Sơn Dương', 'Huyện Yên Sơn']],
  ['Tỉnh Điện Biên', 11, 'dien_bien', ['Thành phố Điện Biên Phủ', 'Thị xã Mường Lay', 'Huyện Điện Biên', 'Huyện Điện Biên Đông', 'Huyện Mường Chà', 'Huyện Mường Nhé', 'Huyện Nậm Pồ', 'Huyện Tủa Chùa', 'Huyện Tuần Giáo']],
  ['Tỉnh Lai Châu', 12, 'lai_chau', ['Thành phố Lai Châu', 'Huyện Mường Tè', 'Huyện Nậm Nhùn', 'Huyện Phong Thổ', 'Huyện Sìn Hồ', 'Huyện Tam Đường', 'Huyện Tân Uyên', 'Huyện Than Uyên']],
  ['Tỉnh Sơn La', 14, 'son_la', ['Thành phố Sơn La', 'Huyện Quỳnh Nhai', 'Huyện Mường La', 'Huyện Thuận Châu', 'Huyện Phù Yên', 'Huyện Bắc Yên', 'Huyện Mai Sơn', 'Huyện Sông Mã', 'Huyện Yên Châu', 'Huyện Mộc Châu']],
  ['Tỉnh Lào Cai', 15, 'lao_cai', ['Thành phố Lào Cai', 'Thị xã Sa Pa', 'Huyện Bát Xát', 'Huyện Bảo Thắng', 'Huyện Bảo Yên', 'Huyện Bắc Hà', 'Huyện Văn Bàn', 'Huyện Mường Khương', 'Huyện Si Ma Cai']],
  ['Tỉnh Thái Nguyên', 19, 'thai_nguyen', ['Thành phố Thái Nguyên', 'Thành phố Sông Công', 'Thị xã Phổ Yên', 'Huyện Định Hóa', 'Huyện Phú Lương', 'Huyện Đồng Hỷ', 'Huyện Võ Nhai', 'Huyện Đại Từ', 'Huyện Phú Bình']],
  ['Tỉnh Lạng Sơn', 20, 'lang_son', ['Thành phố Lạng Sơn', 'Huyện Tràng Định', 'Huyện Bình Gia', 'Huyện Văn Lãng', 'Huyện Cao Lộc', 'Huyện Văn Quan', 'Huyện Bắc Sơn', 'Huyện Hữu Lũng', 'Huyện Chi Lăng', 'Huyện Lộc Bình']],
  ['Tỉnh Quảng Ninh', 22, 'quang_ninh', ['Thành phố Hạ Long', 'Thành phố Móng Cái', 'Thành phố Cẩm Phả', 'Thành phố Uông Bí', 'Thị xã Quảng Yên', 'Thị xã Đông Triều', 'Huyện Tiên Yên', 'Huyện Đầm Hà', 'Huyện Hải Hà']],
  ['Tỉnh Bắc Ninh', 24, 'bac_ninh', ['Thành phố Bắc Ninh', 'Thị xã Từ Sơn', 'Huyện Yên Phong', 'Huyện Quế Võ', 'Huyện Tiên Du', 'Huyện Thuận Thành', 'Huyện Gia Bình', 'Huyện Lương Tài']],
  ['Tỉnh Phú Thọ', 25, 'phu_tho', ['Thành phố Việt Trì', 'Thị xã Phú Thọ', 'Huyện Đoan Hùng', 'Huyện Thanh Ba', 'Huyện Hạ Hoà', 'Huyện Cẩm Khê', 'Huyện Yên Lập', 'Huyện Thanh Sơn', 'Huyện Lâm Thao']],
  ['Thành phố Hải Phòng', 31, 'hai_phong', ['Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An', 'Quận Đồ Sơn', 'Quận Dương Kinh', 'Huyện Thủy Nguyên', 'Huyện An Dương', 'Huyện An Lão']],
  ['Tỉnh Hưng Yên', 33, 'hung_yen', ['Thành phố Hưng Yên', 'Huyện Văn Lâm', 'Huyện Văn Giang', 'Huyện Yên Mỹ', 'Thị xã Mỹ Hào', 'Huyện Ân Thi', 'Huyện Khoái Châu', 'Huyện Kim Động', 'Huyện Tiên Lữ', 'Huyện Phù Cừ']],
  ['Tỉnh Ninh Bình', 37, 'ninh_binh', ['Thành phố Ninh Bình', 'Thành phố Tam Điệp', 'Huyện Nho Quan', 'Huyện Gia Viễn', 'Huyện Hoa Lư', 'Huyện Yên Khánh', 'Huyện Kim Sơn', 'Huyện Yên Mô']],
  ['Tỉnh Thanh Hóa', 38, 'thanh_hoa', ['Thành phố Thanh Hóa', 'Thành phố Sầm Sơn', 'Thị xã Bỉm Sơn', 'Thị xã Nghi Sơn', 'Huyện Mường Lát', 'Huyện Quan Hóa', 'Huyện Quan Sơn', 'Huyện Bá Thước', 'Huyện Cẩm Thủy']],
  ['Tỉnh Nghệ An', 40, 'nghe_an', ['Thành phố Vinh', 'Thị xã Cửa Lò', 'Thị xã Thái Hoà', 'Huyện Quế Phong', 'Huyện Quỳ Châu', 'Huyện Tương Dương', 'Huyện Nghĩa Đàn', 'Huyện Quỳ Hợp', 'Huyện Quỳnh Lưu']],
  ['Tỉnh Hà Tĩnh', 42, 'ha_tinh', ['Thành phố Hà Tĩnh', 'Thị xã Hồng Lĩnh', 'Thị xã Kỳ Anh', 'Huyện Nghi Xuân', 'Huyện Đức Thọ', 'Huyện Vũ Quang', 'Huyện Nghi Xuân', 'Huyện Hương Sơn', 'Huyện Hương Khê']],
  ['Tỉnh Quảng Trị', 44, 'quang_tri', ['Thành phố Đông Hà', 'Thị xã Quảng Trị', 'Huyện Vĩnh Linh', 'Huyện Hướng Hóa', 'Huyện Gio Linh', 'Huyện Đakrông', 'Huyện Cam Lộ', 'Huyện Triệu Phong', 'Huyện Hải Lăng']],
  ['Thành phố Huế', 46, 'hue', ['Quận Thuận Hóa', 'Quận Phú Xuân', 'Thị xã Hương Thủy', 'Thị xã Hương Trà', 'Huyện Phong Điền', 'Huyện Quảng Điền', 'Huyện Phú Vang', 'Huyện Phú Lộc', 'Huyện A Lưới']],
  ['Thành phố Đà Nẵng', 48, 'da_nang', ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang', 'Huyện Hoàng Sa']],
  ['Tỉnh Quảng Ngãi', 51, 'quang_ngai', ['Thành phố Quảng Ngãi', 'Thị xã Đức Phổ', 'Huyện Bình Sơn', 'Huyện Trà Bồng', 'Huyện Tư Nghĩa', 'Huyện Sơn Tịnh', 'Huyện Nghĩa Hành', 'Huyện Mộ Đức', 'Huyện Lý Sơn']],
  ['Tỉnh Gia Lai', 52, 'gia_lai', ['Thành phố Pleiku', 'Thị xã An Khê', 'Thị xã Ayun Pa', 'Huyện KBang', 'Huyện Đăk Đoa', 'Huyện Chư Păh', 'Huyện Ia Grai', 'Huyện Mang Yang', 'Huyện Kông Chro']],
  ['Tỉnh Khánh Hòa', 56, 'khanh_hoa', ['Thành phố Nha Trang', 'Thành phố Cam Ranh', 'Thị xã Ninh Hòa', 'Huyện Vạn Ninh', 'Huyện Diên Khánh', 'Huyện Khánh Vĩnh', 'Huyện Khánh Sơn', 'Huyện Cam Lâm']],
  ['Tỉnh Đắk Lắk', 66, 'dak_lak', ['Thành phố Buôn Ma Thuột', 'Thị xã Buôn Hồ', 'Huyện Ea H\'leo', 'Huyện Krông Búk', 'Huyện Krông Năng', 'Huyện Ea Súp', 'Huyện Cư M\'gar', 'Huyện Krông Pắc']],
  ['Tỉnh Lâm Đồng', 68, 'lam_dong', ['Thành phố Đà Lạt', 'Thành phố Bảo Lộc', 'Huyện Đam Rông', 'Huyện Lạc Dương', 'Huyện Lâm Hà', 'Huyện Đơn Dương', 'Huyện Đức Trọng', 'Huyện Di Linh', 'Huyện Bảo Lâm']],
  ['Tỉnh Đồng Nai', 75, 'dong_nai', ['Thành phố Biên Hòa', 'Thành phố Long Khánh', 'Huyện Tân Phú', 'Huyện Vĩnh Cửu', 'Huyện Định Quán', 'Huyện Trảng Bom', 'Huyện Thống Nhất', 'Huyện Cẩm Mỹ', 'Huyện Long Thành', 'Huyện Nhơn Trạch']],
  ['Thành phố Hồ Chí Minh', 79, 'ho_chi_minh', ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Thành phố Thủ Đức', 'Quận Bình Thạnh', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Huyện Bình Chánh', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè']],
  ['Tỉnh Tây Ninh', 80, 'tay_ninh', ['Thành phố Tây Ninh', 'Thị xã Trảng Bàng', 'Thị xã Hòa Thành', 'Huyện Tân Biên', 'Huyện Tân Châu', 'Huyện Dương Minh Châu', 'Huyện Châu Thành', 'Huyện Bến Cầu', 'Huyện Gò Dầu']],
  ['Tỉnh Đồng Tháp', 82, 'dong_thap', ['Thành phố Cao Lãnh', 'Thành phố Sa Đéc', 'Thành phố Hồng Ngự', 'Huyện Tân Hồng', 'Huyện Hồng Ngự', 'Huyện Tam Nông', 'Huyện Tháp Mười', 'Huyện Cao Lãnh', 'Huyện Thanh Bình']],
  ['Tỉnh Vĩnh Long', 86, 'vinh_long', ['Thành phố Vĩnh Long', 'Huyện Long Hồ', 'Huyện Mang Thít', 'Thị xã Bình Minh', 'Huyện Tam Bình', 'Huyện Trà Ôn', 'Huyện Vũng Liêm', 'Huyện Bình Tân']],
  ['Tỉnh An Giang', 91, 'an_giang', ['Thành phố Long Xuyên', 'Thành phố Châu Đốc', 'Thị xã Tân Châu', 'Huyện An Phú', 'Huyện Châu Phú', 'Huyện Tịnh Biên', 'Huyện Tri Tôn', 'Huyện Châu Thành', 'Huyện Chợ Mới']],
  ['Thành phố Cần Thơ', 92, 'can_tho', ['Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn', 'Quận Thốt Nốt', 'Huyện Phong Điền', 'Huyện Cờ Đỏ', 'Huyện Vĩnh Thạnh', 'Huyện Thới Lai']],
  ['Tỉnh Cà Mau', 96, 'ca_mau', ['Thành phố Cà Mau', 'Huyện U Minh', 'Huyện Thới Bình', 'Huyện Trần Văn Thời', 'Huyện Cái Nước', 'Huyện Đầm Dơi', 'Huyện Năm Căn', 'Huyện Phú Tân', 'Huyện Ngọc Hiển']],
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
      divisionType: wStr.startsWith('Quận') ? 'quận' : wStr.startsWith('Huyện') ? 'huyện' : 'thị xã',
      provinceCode,
    })),
  };
});
