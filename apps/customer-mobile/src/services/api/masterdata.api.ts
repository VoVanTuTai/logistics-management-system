import { customerApiClient } from './client';
import { FALLBACK_VIETNAM_PROVINCES } from '../../utils/vietnamProvincesData';

export interface HubRecord {
  id?: string;
  code: string;
  name: string;
  province: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface VietnamWard {
  code: number;
  name: string;
  wardName?: string;
  district?: string;
  codename: string;
  provinceCode?: number;
}

export interface VietnamProvince {
  code: number;
  name: string;
  codename: string;
  divisionType?: string;
  phoneCode?: number | null;
  wards?: VietnamWard[];
}

export const DEFAULT_HUB_RECORDS: HubRecord[] = [
  // ========================================================
  // 1. CÁC BƯU CỤC PHƯỜNG / XÃ TRỌNG ĐIỂM (LEVEL 3 WARD HUBS)
  // ========================================================
  {
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    addressDetail: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1',
    latitude: 10.7715,
    longitude: 106.6932,
    isActive: true,
  },
  {
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '45 Lê Lợi, Phường Bến Nghé, Quận 1',
    latitude: 10.7758,
    longitude: 106.7012,
    isActive: true,
  },
  {
    code: '07903W001',
    name: 'Bưu cục Phường 13 - Quận 3',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 13',
    addressDetail: '78 Lê Văn Sỹ, Phường 13, Quận 3',
    latitude: 10.7891,
    longitude: 106.6775,
    isActive: true,
  },
  {
    code: '07905W001',
    name: 'Bưu cục Phường 2 - Quận 5',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 5',
    ward: 'Phường 2',
    addressDetail: '88 Trần Hưng Đạo, Phường 2, Quận 5',
    latitude: 10.7538,
    longitude: 106.6782,
    isActive: true,
  },
  {
    code: '07912W001',
    name: 'Bưu cục Phường An Phú Đông - Quận 12',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 12',
    ward: 'Phường An Phú Đông',
    addressDetail: '1013A Hà Huy Giáp, Phường An Phú Đông, Quận 12',
    latitude: 10.8670,
    longitude: 106.6960,
    isActive: true,
  },
  {
    code: '07913W001',
    name: 'Bưu cục Phường 13 - Tân Bình',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    addressDetail: '789 Cộng Hòa, Phường 13, Quận Tân Bình',
    latitude: 10.8035,
    longitude: 106.6436,
    isActive: true,
  },
  {
    code: '07904W001',
    name: 'Bưu cục Phường An Nhơn - Gò Vấp',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận Gò Vấp',
    ward: 'Phường An Nhơn',
    addressDetail: '246 Nguyễn Oanh, Phường An Nhơn, Quận Gò Vấp',
    latitude: 10.8400,
    longitude: 106.6800,
    isActive: true,
  },
  {
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
    province: 'Thành phố Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    addressDetail: '15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm',
    latitude: 21.0185,
    longitude: 105.8524,
    isActive: true,
  },
  {
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã - Ba Đình',
    province: 'Thành phố Hà Nội',
    district: 'Quận Ba Đình',
    ward: 'Phường Kim Mã',
    addressDetail: '56 Kim Mã, Phường Kim Mã, Quận Ba Đình',
    latitude: 21.0318,
    longitude: 105.8247,
    isActive: true,
  },
  {
    code: '00103W001',
    name: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
    province: 'Thành phố Hà Nội',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    addressDetail: '234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy',
    latitude: 21.0336,
    longitude: 105.7958,
    isActive: true,
  },
  {
    code: '00104W001',
    name: 'Bưu cục Phường Trung Liệt - Đống Đa',
    province: 'Thành phố Hà Nội',
    district: 'Quận Đống Đa',
    ward: 'Phường Trung Liệt',
    addressDetail: '88 Thái Hà, Phường Trung Liệt, Quận Đống Đa',
    latitude: 21.0135,
    longitude: 105.8194,
    isActive: true,
  },
  {
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang - Hải Châu',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    addressDetail: '12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu',
    latitude: 16.0742,
    longitude: 108.2239,
    isActive: true,
  },
  {
    code: '04801W002',
    name: 'Bưu cục Phường Thanh Bình - Hải Châu',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thanh Bình',
    addressDetail: '45 Ông Ích Khiêm, Phường Thanh Bình, Quận Hải Châu',
    latitude: 16.0635,
    longitude: 108.2105,
    isActive: true,
  },
  {
    code: '04802W001',
    name: 'Bưu cục Phường An Hải Bắc - Sơn Trà',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Sơn Trà',
    ward: 'Phường An Hải Bắc',
    addressDetail: '88 Ngô Quyền, Phường An Hải Bắc, Quận Sơn Trà',
    latitude: 16.0780,
    longitude: 108.2365,
    isActive: true,
  },

  // ========================================================
  // 2. BƯU CỤC KHAI THÁC 34 TỈNH / THÀNH PHỐ (BRANCH HUBS LEVEL 2)
  // ========================================================
  // MIỀN BẮC (ZONE 001)
  {
    code: '001001B001',
    name: 'Bưu cục Hà Nội',
    province: 'Thành phố Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    addressDetail: 'Trung tâm khai thác Hà Nội, 12 Tràng Tiền, Hoàn Kiếm',
    latitude: 21.028511,
    longitude: 105.854444,
    isActive: true,
  },
  {
    code: '001004B001',
    name: 'Bưu cục Cao Bằng',
    province: 'Tỉnh Cao Bằng',
    district: 'Thành phố Cao Bằng',
    ward: 'Phường Thục Phán',
    addressDetail: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán',
    latitude: 22.6657,
    longitude: 106.2577,
    isActive: true,
  },
  {
    code: '001008B001',
    name: 'Bưu cục Tuyên Quang',
    province: 'Tỉnh Tuyên Quang',
    district: 'Thành phố Tuyên Quang',
    ward: 'Phường Minh Xuân',
    addressDetail: 'Trung tâm khai thác Tuyên Quang, Phường Minh Xuân',
    latitude: 21.8233,
    longitude: 105.2181,
    isActive: true,
  },
  {
    code: '001011B001',
    name: 'Bưu cục Điện Biên',
    province: 'Tỉnh Điện Biên',
    district: 'Thành phố Điện Biên Phủ',
    ward: 'Phường Điện Biên Phủ',
    addressDetail: 'Trung tâm khai thác Điện Biên, Phường Điện Biên Phủ',
    latitude: 21.3860,
    longitude: 103.0230,
    isActive: true,
  },
  {
    code: '001012B001',
    name: 'Bưu cục Lai Châu',
    province: 'Tỉnh Lai Châu',
    district: 'Thành phố Lai Châu',
    ward: 'Phường Tân Phong',
    addressDetail: 'Trung tâm khai thác Lai Châu, Phường Tân Phong',
    latitude: 22.3965,
    longitude: 103.4682,
    isActive: true,
  },
  {
    code: '001014B001',
    name: 'Bưu cục Sơn La',
    province: 'Tỉnh Sơn La',
    district: 'Thành phố Sơn La',
    ward: 'Phường Tô Hiệu',
    addressDetail: 'Trung tâm khai thác Sơn La, Phường Tô Hiệu',
    latitude: 21.3283,
    longitude: 103.9148,
    isActive: true,
  },
  {
    code: '001015B001',
    name: 'Bưu cục Lào Cai',
    province: 'Tỉnh Lào Cai',
    district: 'Thành phố Lào Cai',
    ward: 'Phường Lào Cai',
    addressDetail: 'Trung tâm khai thác Lào Cai, Phường Lào Cai',
    latitude: 22.4856,
    longitude: 103.9707,
    isActive: true,
  },
  {
    code: '001019B001',
    name: 'Bưu cục Thái Nguyên',
    province: 'Tỉnh Thái Nguyên',
    district: 'Thành phố Thái Nguyên',
    ward: 'Phường Phan Đình Phùng',
    addressDetail: 'Trung tâm khai thác Thái Nguyên, Phường Phan Đình Phùng',
    latitude: 21.5942,
    longitude: 105.8482,
    isActive: true,
  },
  {
    code: '001020B001',
    name: 'Bưu cục Lạng Sơn',
    province: 'Tỉnh Lạng Sơn',
    district: 'Thành phố Lạng Sơn',
    ward: 'Phường Đông Kinh',
    addressDetail: 'Trung tâm khai thác Lạng Sơn, Phường Đông Kinh',
    latitude: 21.8537,
    longitude: 106.7615,
    isActive: true,
  },
  {
    code: '001022B001',
    name: 'Bưu cục Quảng Ninh',
    province: 'Tỉnh Quảng Ninh',
    district: 'Thành phố Hạ Long',
    ward: 'Phường Hạ Long',
    addressDetail: 'Trung tâm khai thác Quảng Ninh, Phường Hạ Long',
    latitude: 20.9505,
    longitude: 107.0734,
    isActive: true,
  },
  {
    code: '001024B001',
    name: 'Bưu cục Bắc Ninh',
    province: 'Tỉnh Bắc Ninh',
    district: 'Thành phố Bắc Ninh',
    ward: 'Phường Bắc Ninh',
    addressDetail: 'Trung tâm khai thác Bắc Ninh, Phường Bắc Ninh',
    latitude: 21.1861,
    longitude: 106.0763,
    isActive: true,
  },
  {
    code: '001025B001',
    name: 'Bưu cục Phú Thọ',
    province: 'Tỉnh Phú Thọ',
    district: 'Thành phố Việt Trì',
    ward: 'Phường Việt Trì',
    addressDetail: 'Trung tâm khai thác Phú Thọ, Phường Việt Trì',
    latitude: 21.3227,
    longitude: 105.2280,
    isActive: true,
  },
  {
    code: '001031B001',
    name: 'Bưu cục Hải Phòng',
    province: 'Thành phố Hải Phòng',
    district: 'Quận Hồng Bàng',
    ward: 'Phường Hồng Bàng',
    addressDetail: 'Trung tâm khai thác Hải Phòng, Phường Hồng Bàng',
    latitude: 20.8449,
    longitude: 106.6881,
    isActive: true,
  },
  {
    code: '001033B001',
    name: 'Bưu cục Hưng Yên',
    province: 'Tỉnh Hưng Yên',
    district: 'Thành phố Hưng Yên',
    ward: 'Phường Phố Hiến',
    addressDetail: 'Trung tâm khai thác Hưng Yên, Phường Phố Hiến',
    latitude: 20.6464,
    longitude: 106.0511,
    isActive: true,
  },
  {
    code: '001037B001',
    name: 'Bưu cục Ninh Bình',
    province: 'Tỉnh Ninh Bình',
    district: 'Thành phố Ninh Bình',
    ward: 'Phường Hoa Lư',
    addressDetail: 'Trung tâm khai thác Ninh Bình, Phường Hoa Lư',
    latitude: 20.2506,
    longitude: 105.9745,
    isActive: true,
  },

  // MIỀN TRUNG (ZONE 002)
  {
    code: '002038B001',
    name: 'Bưu cục Thanh Hóa',
    province: 'Tỉnh Thanh Hóa',
    district: 'Thành phố Thanh Hóa',
    ward: 'Phường Hạc Thành',
    addressDetail: 'Trung tâm khai thác Thanh Hóa, Phường Hạc Thành',
    latitude: 19.8067,
    longitude: 105.7852,
    isActive: true,
  },
  {
    code: '002040B001',
    name: 'Bưu cục Nghệ An',
    province: 'Tỉnh Nghệ An',
    district: 'Thành phố Vinh',
    ward: 'Phường Vinh',
    addressDetail: 'Trung tâm khai thác Nghệ An, Phường Vinh',
    latitude: 18.6734,
    longitude: 105.6813,
    isActive: true,
  },
  {
    code: '002042B001',
    name: 'Bưu cục Hà Tĩnh',
    province: 'Tỉnh Hà Tĩnh',
    district: 'Thành phố Hà Tĩnh',
    ward: 'Phường Thành Sen',
    addressDetail: 'Trung tâm khai thác Hà Tĩnh, Phường Thành Sen',
    latitude: 18.3435,
    longitude: 105.9058,
    isActive: true,
  },
  {
    code: '002044B001',
    name: 'Bưu cục Quảng Trị',
    province: 'Tỉnh Quảng Trị',
    district: 'Thành phố Đông Hà',
    ward: 'Phường Đông Hà',
    addressDetail: 'Trung tâm khai thác Quảng Trị, Phường Đông Hà',
    latitude: 16.8163,
    longitude: 107.1006,
    isActive: true,
  },
  {
    code: '002046B001',
    name: 'Bưu cục Huế',
    province: 'Thành phố Huế',
    district: 'Thành phố Huế',
    ward: 'Phường Thuận Hóa',
    addressDetail: 'Trung tâm khai thác Huế, Phường Thuận Hóa',
    latitude: 16.4637,
    longitude: 107.5909,
    isActive: true,
  },
  {
    code: '002048B001',
    name: 'Bưu cục Đà Nẵng',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    addressDetail: 'Trung tâm khai thác Đà Nẵng, 12 Bạch Đằng, Hải Châu',
    latitude: 16.067780,
    longitude: 108.220830,
    isActive: true,
  },
  {
    code: '002051B001',
    name: 'Bưu cục Quảng Ngãi',
    province: 'Tỉnh Quảng Ngãi',
    district: 'Thành phố Quảng Ngãi',
    ward: 'Phường Quảng Ngãi',
    addressDetail: 'Trung tâm khai thác Quảng Ngãi, Phường Quảng Ngãi',
    latitude: 15.1205,
    longitude: 108.7923,
    isActive: true,
  },
  {
    code: '002052B001',
    name: 'Bưu cục Gia Lai',
    province: 'Tỉnh Gia Lai',
    district: 'Thành phố Pleiku',
    ward: 'Phường Pleiku',
    addressDetail: 'Trung tâm khai thác Gia Lai, Phường Pleiku',
    latitude: 13.9833,
    longitude: 108.0000,
    isActive: true,
  },
  {
    code: '002056B001',
    name: 'Bưu cục Khánh Hòa',
    province: 'Tỉnh Khánh Hòa',
    district: 'Thành phố Nha Trang',
    ward: 'Phường Nha Trang',
    addressDetail: 'Trung tâm khai thác Khánh Hòa, Phường Nha Trang',
    latitude: 12.2388,
    longitude: 109.1967,
    isActive: true,
  },
  {
    code: '002066B001',
    name: 'Bưu cục Đắk Lắk',
    province: 'Tỉnh Đắk Lắk',
    district: 'Thành phố Buôn Ma Thuột',
    ward: 'Phường Buôn Ma Thuột',
    addressDetail: 'Trung tâm khai thác Đắk Lắk, Phường Buôn Ma Thuột',
    latitude: 12.6667,
    longitude: 108.0500,
    isActive: true,
  },
  {
    code: '002068B001',
    name: 'Bưu cục Lâm Đồng',
    province: 'Tỉnh Lâm Đồng',
    district: 'Thành phố Đà Lạt',
    ward: 'Phường Xuân Hương - Đà Lạt',
    addressDetail: 'Trung tâm khai thác Lâm Đồng, Phường Xuân Hương, Đà Lạt',
    latitude: 11.9404,
    longitude: 108.4583,
    isActive: true,
  },

  // MIỀN NAM (ZONE 003)
  {
    code: '003075B001',
    name: 'Bưu cục Đồng Nai',
    province: 'Tỉnh Đồng Nai',
    district: 'Thành phố Biên Hòa',
    ward: 'Phường Trấn Biên',
    addressDetail: 'Trung tâm khai thác Đồng Nai, Phường Trấn Biên, Biên Hòa',
    latitude: 10.9574,
    longitude: 106.8427,
    isActive: true,
  },
  {
    code: '003079B001',
    name: 'Bưu cục Hồ Chí Minh',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    addressDetail: 'Trung tâm khai thác Hồ Chí Minh, 02 Công xã Paris, Quận 1',
    latitude: 10.776889,
    longitude: 106.700806,
    isActive: true,
  },
  {
    code: '003080B001',
    name: 'Bưu cục Tây Ninh',
    province: 'Tỉnh Tây Ninh',
    district: 'Thành phố Tây Ninh',
    ward: 'Phường Tân Ninh',
    addressDetail: 'Trung tâm khai thác Tây Ninh, Phường Tân Ninh',
    latitude: 11.3101,
    longitude: 106.0983,
    isActive: true,
  },
  {
    code: '003082B001',
    name: 'Bưu cục Đồng Tháp',
    province: 'Tỉnh Đồng Tháp',
    district: 'Thành phố Cao Lãnh',
    ward: 'Phường Cao Lãnh',
    addressDetail: 'Trung tâm khai thác Đồng Tháp, Phường Cao Lãnh',
    latitude: 10.4577,
    longitude: 105.6331,
    isActive: true,
  },
  {
    code: '003086B001',
    name: 'Bưu cục Vĩnh Long',
    province: 'Tỉnh Vĩnh Long',
    district: 'Thành phố Vĩnh Long',
    ward: 'Phường Long Châu',
    addressDetail: 'Trung tâm khai thác Vĩnh Long, Phường Long Châu',
    latitude: 10.2537,
    longitude: 105.9722,
    isActive: true,
  },
  {
    code: '003091B001',
    name: 'Bưu cục An Giang',
    province: 'Tỉnh An Giang',
    district: 'Thành phố Long Xuyên',
    ward: 'Phường Long Xuyên',
    addressDetail: 'Trung tâm khai thác An Giang, Phường Long Xuyên',
    latitude: 10.3759,
    longitude: 105.4185,
    isActive: true,
  },
  {
    code: '003092B001',
    name: 'Bưu cục Cần Thơ',
    province: 'Thành phố Cần Thơ',
    district: 'Quận Ninh Kiều',
    ward: 'Phường Ninh Kiều',
    addressDetail: 'Trung tâm khai thác Cần Thơ, Phường Ninh Kiều',
    latitude: 10.0452,
    longitude: 105.7469,
    isActive: true,
  },
  {
    code: '003096B001',
    name: 'Bưu cục Cà Mau',
    province: 'Tỉnh Cà Mau',
    district: 'Thành phố Cà Mau',
    ward: 'Phường An Xuyên',
    addressDetail: 'Trung tâm khai thác Cà Mau, Phường An Xuyên',
    latitude: 9.1769,
    longitude: 105.1524,
    isActive: true,
  },

  // 3. LEGACY & COMPANION HUBS
  {
    code: 'HUB-BD-001',
    name: 'Bưu cục Bình Dương',
    province: 'Tỉnh Bình Dương',
    district: 'Thành phố Thủ Dầu Một',
    ward: 'Phường Phú Hòa',
    addressDetail: 'Trung tâm khai thác Bình Dương, Phường Phú Hòa',
    latitude: 10.9804,
    longitude: 106.6745,
    isActive: true,
  },
  {
    code: 'HUB-HN-001',
    name: 'Bưu cục Khai thác Hà Nội',
    province: 'Thành phố Hà Nội',
    district: 'Quận Ba Đình',
    ward: 'Phường Điện Biên',
    addressDetail: '12 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội',
    isActive: true,
  },
  {
    code: 'HUB-CB-001',
    name: 'Bưu cục Khai thác Cao Bằng',
    province: 'Tỉnh Cao Bằng',
    district: 'Thành phố Cao Bằng',
    ward: 'Phường Thục Phán',
    addressDetail: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
    isActive: true,
  },
  {
    code: 'HUB-HCM-001',
    name: 'Bưu cục Khai thác TP. Hồ Chí Minh',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '100 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    latitude: 10.7758,
    longitude: 106.7012,
    isActive: true,
  },
  {
    code: 'HUB-DN-001',
    name: 'Bưu cục Khai thác Đà Nẵng',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Hải Châu 1',
    addressDetail: '50 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    isActive: true,
  },
];

export function parseHubRecord(raw: any): HubRecord {
  if (!raw) return DEFAULT_HUB_RECORDS[0];
  
  let addrObj: any = {};
  if (typeof raw.address === 'string') {
    try {
      addrObj = JSON.parse(raw.address);
    } catch {
      addrObj = {};
    }
  } else if (raw.address && typeof raw.address === 'object') {
    addrObj = raw.address;
  }

  const nameStr = raw.name || '';
  let province = addrObj.province || raw.province || '';

  if (!province) {
    if (nameStr.includes('Hồ Chí Minh')) province = 'Thành phố Hồ Chí Minh';
    else if (nameStr.includes('Hà Nội')) province = 'Thành phố Hà Nội';
    else if (nameStr.includes('Đà Nẵng')) province = 'Thành phố Đà Nẵng';
    else if (nameStr.includes('Cao Bằng')) province = 'Tỉnh Cao Bằng';
    else if (nameStr.includes('Bưu cục ')) province = nameStr.replace('Bưu cục ', 'Tỉnh ');
    else province = nameStr;
  }

  const ward = addrObj.ward || raw.ward || '';
  const district = addrObj.district || raw.district || '';
  const addressDetail = addrObj.addressLine || addrObj.addressDetail || raw.addressDetail || '';
  const latitude = typeof raw.latitude === 'number' ? raw.latitude : typeof addrObj.latitude === 'number' ? addrObj.latitude : undefined;
  const longitude = typeof raw.longitude === 'number' ? raw.longitude : typeof addrObj.longitude === 'number' ? addrObj.longitude : undefined;

  return {
    id: raw.id,
    code: raw.code || '',
    name: nameStr,
    province,
    district,
    ward,
    addressDetail,
    latitude,
    longitude,
    isActive: raw.isActive ?? true,
  };
}

export const masterdataApi = {
  getHubs: async (accessToken?: string): Promise<HubRecord[]> => {
    const endpoints = [
      '/public/masterdata/hubs?isActive=true',
      '/customer/masterdata/hubs?isActive=true',
    ];
    for (const ep of endpoints) {
      try {
        const rawList = await customerApiClient.request<any[]>(ep, {
          method: 'GET',
          accessToken,
        });
        if (Array.isArray(rawList) && rawList.length > 0) {
          return rawList.map(parseHubRecord);
        }
      } catch {
        // try next endpoint
      }
    }
    return DEFAULT_HUB_RECORDS;
  },

  getAdministrativeUnits: async (accessToken?: string): Promise<VietnamProvince[]> => {
    const endpoints = [
      '/public/masterdata/locations/vietnam-administrative-units',
      '/customer/masterdata/locations/vietnam-administrative-units',
    ];
    for (const ep of endpoints) {
      try {
        const res = await customerApiClient.request<VietnamProvince[]>(ep, {
          method: 'GET',
          accessToken,
        });
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
      } catch {
        // try next endpoint
      }
    }
    return FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[];
  },
};
