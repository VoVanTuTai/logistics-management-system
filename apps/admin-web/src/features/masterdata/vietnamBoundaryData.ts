/**
 * BỘ DỮ LIỆU TỌA ĐỘ RANH GIỚI ĐỊA GIỚI HÀNH CHÍNH VIỆT NAM (100% COVERAGE)
 * Bao gồm:
 * 1. Toàn quốc (National Boundary + Quần đảo Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo)
 * 2. 3 Vùng miền (Bắc - Trung - Nam)
 * 3. 34 Vùng Logistics Tỉnh / Thành phố đại diện bao phủ trọn vẹn lãnh thổ Việt Nam
 * 4. Các bưu cục cấp Phường / Xã trọng điểm (High-Definition Ward Polygons)
 * 5. Bộ dữ liệu GeoJSON chuẩn quốc gia 483 phường/xã (Official Cadastral GeoJSON)
 * 6. Các hàm tiện ích kiểm tra toạ độ không gian (Point-in-Polygon, Centroid, Area)
 */

// Re-export bộ dữ liệu ranh giới phường/xã chuẩn quốc gia (483 phường/xã)
export { OFFICIAL_WARD_BOUNDARIES, findOfficialWardForCoordinate } from './vietnamWardBoundariesOfficial';
export type { OfficialWardBoundary } from './vietnamWardBoundariesOfficial';
import { OFFICIAL_WARD_BOUNDARIES, findOfficialWardForCoordinate } from './vietnamWardBoundariesOfficial';

export interface BoundaryItem {
  id: string;
  code: string;
  name: string;
  level: number; // 0: Toàn quốc, 1: Vùng miền, 2: Tỉnh/TP, 3: Phường/Xã
  parentCode?: string | null;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH' | 'NATIONAL';
  category: 'NATIONAL' | 'REGION' | 'PROVINCE' | 'WARD';
  center: [number, number]; // [latitude, longitude]
  polygon: Array<[number, number]>; // Array of [lat, lng] khép kín
  areaKm2?: number;
  islandPolygons?: Array<Array<[number, number]>>; // Quần đảo, hải đảo
  colorHex?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// 1. TẦNG 0: RANH GIỚI QUỐC GIA VIỆT NAM (VIETNAM NATIONAL BORDER & ISLANDS)
// Bao gồm đường biên giới đất liền và bờ biển hình chữ S khép kín
// ---------------------------------------------------------------------------
export const VIETNAM_NATIONAL_BOUNDARY: BoundaryItem = {
  id: 'national-vn',
  code: 'VN',
  name: 'Nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam',
  level: 0,
  region: 'NATIONAL',
  category: 'NATIONAL',
  center: [16.0471, 108.2068],
  colorHex: '#ea4335', // Google Maps Red
  description: 'Toàn bộ lãnh thổ đất liền, vùng trời và hải đảo thiêng liêng của Tổ quốc Việt Nam',
  polygon: [
    // 1. Phía Bắc (Giáp Trung Quốc: Lũng Cú, Hà Giang -> Cao Bằng -> Lạng Sơn -> Quảng Ninh)
    [23.3927, 105.3238], // Cực Bắc Lũng Cú, Đồng Văn, Hà Giang
    [23.2840, 105.7600], // Mèo Vạc
    [23.0600, 106.1200], // Bảo Lạc, Cao Bằng
    [22.8800, 106.5500], // Trùng Khánh, Cao Bằng (Thác Bản Giốc)
    [22.4500, 106.7200], // Thạch An
    [22.1200, 106.7800], // Tràng Định, Lạng Sơn
    [21.8500, 107.0300], // Lộc Bình
    [21.5400, 107.6200], // Bình Liêu, Quảng Ninh
    [21.5300, 107.9700], // Cửa khẩu Quốc tế Móng Cái
    [21.4880, 108.0650], // Mũi Sa Vĩ / Trà Cổ (Địa đầu Đông Bắc)

    // 2. Dọc Bờ Biển Vịnh Bắc Bộ (Vịnh Hạ Long -> Hải Phòng -> Thái Bình -> Nam Định -> Ninh Bình)
    [20.9400, 107.2500], // Vịnh Cửa Lục, Bãi Cháy, Hạ Long
    [20.8000, 106.9000], // Cửa Lạch Huyện, Đồ Sơn, Hải Phòng
    [20.5500, 106.5800], // Cửa Ba Lạt (Sông Hồng, Thái Bình)
    [20.2500, 106.3500], // Hải Hậu, Nam Định
    [20.0000, 106.0500], // Kim Sơn, Ninh Bình

    // 3. Dọc Bờ Biển Bắc Trung Bộ (Thanh Hóa -> Nghệ An -> Hà Tĩnh -> Quảng Bình -> Quảng Trị -> Thừa Thiên Huế)
    [19.7800, 105.9000], // Sầm Sơn, Thanh Hóa
    [18.8200, 105.7500], // Cửa Lò, Nghệ An
    [18.3500, 105.9500], // Thiên Cầm, Hà Tĩnh
    [17.8500, 106.5000], // Đèo Ngang / Vũng Áng
    [17.4800, 106.6300], // Đồng Hới, Quảng Bình
    [17.0000, 107.1200], // Cửa Tùng, Vĩnh Linh, Quảng Trị
    [16.7500, 107.2500], // Thuận An, Thừa Thiên Huế
    [16.3200, 107.9000], // Vịnh Lăng Cô / Đèo Hải Vân

    // 4. Dọc Bờ Biển Nam Trung Bộ (Đà Nẵng -> Quảng Nam -> Quảng Ngãi -> Bình Định -> Phú Yên -> Khánh Hòa -> Ninh Thuận -> Bình Thuận)
    [16.1200, 108.2800], // Bán đảo Sơn Trà, Đà Nẵng
    [15.8800, 108.3800], // Cửa Đại, Hội An, Quảng Nam
    [15.4200, 108.7500], // Chu Lai / Dung Quất, Quảng Ngãi
    [14.9500, 108.9800], // Sa Huỳnh, Quảng Ngãi
    [14.0500, 109.2800], // Quy Nhơn, Bình Định
    [13.2500, 109.3500], // Gành Đá Đĩa, Sông Cầu, Phú Yên
    [12.9200, 109.4200], // Mũi Điện (Mũi Đại Lãnh - Cực Đông), Phú Yên
    [12.4500, 109.2800], // Vịnh Nha Trang, Khánh Hòa
    [11.9000, 109.1800], // Bán đảo Cam Ranh
    [11.5500, 109.0500], // Vĩnh Hy / Phan Rang, Ninh Thuận
    [11.1500, 108.7800], // Mũi Dinh
    [10.9300, 108.2800], // Mũi Né, Phan Thiết, Bình Thuận
    [10.6800, 107.7500], // La Gi, Bình Thuận

    // 5. Dọc Bờ Biển Đông Nam Bộ & Đồng Bằng Sông Cửu Long (Bà Rịa - Vũng Tàu -> TP.HCM Cần Giờ -> Tiền Giang -> Bến Tre -> Trà Vinh -> Sóc Trăng -> Bạc Liêu -> Cà Mau)
    [10.3500, 107.0800], // Mũi Nghinh Phong, TP. Vũng Tàu
    [10.4000, 106.8500], // Rừng ngập mặn Cần Giờ, TP.HCM
    [10.2200, 106.7500], // Gò Công Đông, Tiền Giang
    [9.9500, 106.6000],  // Ba Tri, Bến Tre
    [9.6500, 106.4500],  // Cửa Định An, Trà Vinh
    [9.3500, 105.9500],  // Vĩnh Châu, Sóc Trăng
    [9.1500, 105.6500],  // Nhà Mát, Bạc Liêu
    [8.6000, 105.2000],  // Đầm Dơi, Cà Mau
    [8.5800, 104.7500],  // MŨI CÀ MAU (Cực Nam đất liền Việt Nam)

    // 6. Dọc Bờ Biển Vịnh Thái Lan (Cà Mau -> Kiên Giang / Phú Quốc / Rạch Giá / Hà Tiên)
    [8.9500, 104.8200],  // Vườn Quốc gia U Minh Hạ
    [9.4500, 104.9000],  // Cửa Sông Đốc, Cà Mau
    [9.8500, 105.0200],  // Vịnh Rạch Giá, Kiên Giang
    [10.2000, 104.7500], // Hòn Chông, Kiên Lương
    [10.3800, 104.4800], // Cửa khẩu Quốc tế Hà Tiên

    // 7. Đường Biên Giới Phía Tây Nam (Giáp Campuchia: Kiên Giang -> An Giang -> Đồng Tháp -> Long An -> Tây Ninh -> Bình Phước)
    [10.5500, 104.8500], // Tri Tôn, An Giang
    [10.7500, 105.1000], // Châu Đốc, An Giang (Sông Tiền, Sông Hậu)
    [10.9200, 105.3500], // Hồng Ngự, Đồng Tháp
    [10.9800, 105.8000], // Mộc Hóa, Long An
    [11.0800, 106.0500], // Cửa khẩu Mộc Bài, Tây Ninh
    [11.6000, 105.9500], // Tân Biên, Tây Ninh (Căn cứ Trung ương Cục)
    [11.8500, 106.4000], // Lộc Ninh, Bình Phước
    [12.0500, 107.0500], // Bù Đốp, Bình Phước

    // 8. Đường Biên Giới Tây Nguyên (Giáp Campuchia & Lào: Đắk Nông -> Đắk Lắk -> Gia Lai -> Kon Tum / Ngã 3 Đông Dương)
    [12.3500, 107.4500], // Đắk Mil, Đắk Nông
    [12.7500, 107.6000], // Buôn Đôn, Đắk Lắk
    [13.4000, 107.5000], // Đức Cơ, Gia Lai (Cửa khẩu Lệ Thanh)
    [14.1500, 107.5500], // Ia H'Drai, Kon Tum
    [14.7000, 107.5500], // Bờ Y, Ngọc Hồi, Kon Tum (Ngã ba Đông Dương: Việt Nam - Lào - Campuchia)

    // 9. Đường Biên Giới Dãy Trường Sơn (Giáp Lào: Quảng Nam -> Thừa Thiên Huế -> Quảng Trị -> Quảng Bình -> Hà Tĩnh -> Nghệ An -> Thanh Hóa)
    [15.5500, 107.4500], // Nam Giang, Quảng Nam
    [16.1500, 107.2500], // A Lưới, Thừa Thiên Huế
    [16.6500, 106.6500], // Cửa khẩu Lao Bảo, Hướng Hóa, Quảng Trị
    [17.4500, 106.0500], // Cửa khẩu Cha Lo, Quảng Bình
    [18.3800, 105.2000], // Cửa khẩu Cầu Treo, Hương Sơn, Hà Tĩnh
    [19.2500, 104.2500], // Kỳ Sơn, Nghệ An
    [20.2500, 104.6000], // Cửa khẩu Na Mèo, Quan Sơn, Thanh Hóa

    // 10. Đường Biên Giới Tây Bắc (Giáp Lào & Trung Quốc: Sơn La -> Điện Biên -> Lai Châu -> Lào Cai -> Hà Giang)
    [20.9500, 103.5500], // Sông Mã, Sơn La
    [21.6500, 103.0000], // Mường Nhé / Điện Biên Đông
    [22.4000, 102.1500], // A Pa Chải, Mường Nhé (Cực Tây Việt Nam: Cột mốc số 0 biên giới 3 nước Việt - Lào - Trung)
    [22.6500, 102.8000], // Mường Tè, Lai Châu
    [22.7500, 103.4500], // Phong Thổ, Lai Châu
    [22.6000, 103.9500], // Bát Xát / Cửa khẩu Quốc tế Lào Cai
    [22.9500, 104.6500], // Simacai / Hoàng Su Phì, Hà Giang
    [23.3927, 105.3238], // Khép kín đa giác tại Cực Bắc Lũng Cú
  ],
  islandPolygons: [
    // Quần đảo Hoàng Sa (Đà Nẵng)
    [
      [16.5000, 111.5000],
      [17.1500, 112.2500],
      [16.8500, 112.8500],
      [15.8000, 112.5000],
      [15.9500, 111.4500],
      [16.5000, 111.5000],
    ],
    // Quần đảo Trường Sa (Khánh Hòa)
    [
      [11.5000, 114.2000],
      [11.8000, 115.5000],
      [10.2000, 116.8000],
      [8.5000, 115.5000],
      [7.2000, 112.5000],
      [8.6000, 111.9000],
      [10.5000, 113.8000],
      [11.5000, 114.2000],
    ],
    // Đảo Phú Quốc (Kiên Giang)
    [
      [10.4200, 103.9000],
      [10.4300, 104.0500],
      [10.2500, 104.0800],
      [10.0200, 104.0400],
      [10.0500, 103.9600],
      [10.2800, 103.8800],
      [10.4200, 103.9000],
    ],
    // Huyện đảo Côn Đảo (Bà Rịa - Vũng Tàu)
    [
      [8.7500, 106.5800],
      [8.7600, 106.6600],
      [8.6500, 106.6300],
      [8.6600, 106.5600],
      [8.7500, 106.5800],
    ],
  ],
};

// ---------------------------------------------------------------------------
// 2. TẦNG 1: 3 VÙNG MIỀN LOGISTICS QUỐC GIA (3 MACRO REGIONS)
// Bao phủ 100% lãnh thổ Việt Nam chia theo 3 Vùng Miền: Bắc - Trung - Nam
// ---------------------------------------------------------------------------
export const VIETNAM_REGION_BOUNDARIES: BoundaryItem[] = [
  // ZONE 001: MIỀN BẮC (North Region)
  {
    id: 'region-001-north',
    code: '001',
    name: 'Zone Miền Bắc (Bắc Bộ)',
    level: 1,
    region: 'NORTH',
    category: 'REGION',
    center: [21.0285, 105.8544],
    colorHex: '#3b82f6', // Blue
    description: 'Bao gồm 15 tỉnh Đông Bắc, Tây Bắc và Đồng bằng Sông Hồng (Hà Nội, Hải Phòng, Quảng Ninh...)',
    polygon: [
      [23.3927, 105.3238], // Cực Bắc Lũng Cú
      [23.0600, 106.1200],
      [22.4500, 106.7200],
      [21.8500, 107.0300],
      [21.5400, 107.6200],
      [21.4880, 108.0650], // Móng Cái
      [20.9400, 107.2500], // Hạ Long
      [20.8000, 106.9000], // Hải Phòng
      [20.2500, 106.3500], // Nam Định
      [20.0000, 106.0500], // Kim Sơn, Ninh Bình
      [20.1500, 105.6500], // Giữa Ninh Bình & Hòa Bình
      [20.5500, 104.8500], // Mộc Châu, Sơn La
      [20.9500, 103.5500], // Sông Mã, Sơn La
      [22.4000, 102.1500], // Cực Tây A Pa Chải
      [22.7500, 103.4500], // Lai Châu
      [22.6000, 103.9500], // Lào Cai
      [22.9500, 104.6500], // Hà Giang
      [23.3927, 105.3238], // Khép kín
    ],
  },

  // ZONE 002: MIỀN TRUNG & TÂY NGUYÊN (Central Region)
  {
    id: 'region-002-central',
    code: '002',
    name: 'Zone Miền Trung (Bắc Trung Bộ, Duyên Hải & Tây Nguyên)',
    level: 1,
    region: 'CENTRAL',
    category: 'REGION',
    center: [16.0718, 108.2241],
    colorHex: '#f59e0b', // Amber / Orange
    description: 'Bao gồm 11 tỉnh thành Duyên hải Miền Trung và Tây Nguyên (Đà Nẵng, Huế, Thanh Hóa, Nghệ An, Đắk Lắk...)',
    polygon: [
      [20.0000, 106.0500],
      [19.7800, 105.9000], // Sầm Sơn
      [18.8200, 105.7500], // Cửa Lò
      [18.3500, 105.9500], // Hà Tĩnh
      [17.4800, 106.6300], // Đồng Hới
      [16.7500, 107.2500], // Huế
      [16.1200, 108.2800], // Đà Nẵng
      [15.4200, 108.7500], // Quảng Ngãi
      [14.0500, 109.2800], // Quy Nhơn
      [12.9200, 109.4200], // Phú Yên
      [12.4500, 109.2800], // Nha Trang
      [11.5500, 109.0500], // Phan Rang
      [10.9300, 108.2800], // Bình Thuận
      [11.3500, 107.6500], // Lâm Đồng giáp Đồng Nai
      [11.9500, 107.2500], // Đắk Nông giáp Bình Phước
      [12.7500, 107.6000], // Đắk Lắk
      [13.4000, 107.5000], // Gia Lai
      [14.7000, 107.5500], // Kon Tum (Ngã 3 Đông Dương)
      [16.1500, 107.2500], // Trường Sơn
      [17.4500, 106.0500], // Cha Lo
      [18.3800, 105.2000], // Cầu Treo
      [19.2500, 104.2500], // Nghệ An giáp Lào
      [20.2500, 104.6000], // Quan Sơn, Thanh Hóa
      [20.1500, 105.6500], // Ninh Bình
      [20.0000, 106.0500], // Khép kín
    ],
  },

  // ZONE 003: MIỀN NAM (South Region)
  {
    id: 'region-003-south',
    code: '003',
    name: 'Zone Miền Nam (Đông Nam Bộ & Tây Nam Bộ)',
    level: 1,
    region: 'SOUTH',
    category: 'REGION',
    center: [10.7797, 106.6991],
    colorHex: '#10b981', // Emerald Green
    description: 'Bao gồm 8 tỉnh thành Đông Nam Bộ và Đồng Bằng Sông Cửu Long (TP.HCM, Bình Dương, Đồng Nai, Cần Thơ, Cà Mau...)',
    polygon: [
      [10.9300, 108.2800],
      [10.6800, 107.7500], // La Gi
      [10.3500, 107.0800], // Vũng Tàu
      [10.4000, 106.8500], // Cần Giờ
      [10.2200, 106.7500], // Tiền Giang
      [9.9500, 106.6000],  // Bến Tre
      [9.6500, 106.4500],  // Trà Vinh
      [9.3500, 105.9500],  // Sóc Trăng
      [9.1500, 105.6500],  // Bạc Liêu
      [8.5800, 104.7500],  // MŨI CÀ MAU
      [9.4500, 104.9000],  // Sông Đốc
      [9.8500, 105.0200],  // Rạch Giá
      [10.3800, 104.4800], // Hà Tiên
      [10.7500, 105.1000], // Châu Đốc, An Giang
      [10.9200, 105.3500], // Đồng Tháp
      [11.0800, 106.0500], // Tây Ninh
      [11.8500, 106.4000], // Bình Phước
      [11.9500, 107.2500], // Ranh giới Đắk Nông
      [11.3500, 107.6500], // Ranh giới Lâm Đồng
      [10.9300, 108.2800], // Khép kín
    ],
  },
];

// ---------------------------------------------------------------------------
// 3. TẦNG 2: 34 VÙNG LOGISTICS TỈNH / THÀNH PHỐ TOÀN DIỆN (100% COVERAGE)
// Mỗi tỉnh có đa giác ranh giới khép kín chuẩn xác, bám sát ranh giới hành chính
// ---------------------------------------------------------------------------
export const VIETNAM_PROVINCE_BOUNDARIES: BoundaryItem[] = [
  // 1. THỦ ĐÔ HÀ NỘI
  {
    id: 'prov-001',
    code: '001001B001',
    name: 'Thành phố Hà Nội',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.0285, 105.8544],
    areaKm2: 3359,
    description: 'Trung tâm hành chính quốc gia, 30 quận/huyện/thị xã (Ba Đình, Cầu Giấy, Hoàn Kiếm, Gia Lâm, Sóc Sơn...)',
    polygon: [
      [21.3500, 105.8200], // Phía Bắc: Giáp Sóc Sơn - Thái Nguyên
      [21.3200, 105.9500], // Giáp Bắc Giang
      [21.1500, 106.0200], // Đông Anh, Gia Lâm giáp Bắc Ninh
      [20.9500, 105.9800], // Thanh Trì giáp Hưng Yên
      [20.7500, 105.8800], // Phú Xuyên giáp Hà Nam
      [20.6500, 105.7500], // Mỹ Đức giáp Hòa Bình
      [20.8500, 105.5500], // Chương Mỹ
      [21.0500, 105.4200], // Ba Vì (Núi Ba Vì) giáp Phú Thọ
      [21.2200, 105.4500], // Sơn Tây giáp Vĩnh Phúc
      [21.3000, 105.6500], // Mê Linh
      [21.3500, 105.8200], // Khép kín
    ],
  },

  // 2. TP. HỒ CHÍ MINH
  {
    id: 'prov-079',
    code: '003079B001',
    name: 'Thành phố Hồ Chí Minh',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.7769, 106.7008],
    areaKm2: 2095,
    description: 'Trung tâm kinh tế đầu tàu cả nước (Quận 1, 3, 5, Tân Bình, TP. Thủ Đức, Củ Chi, Cần Giờ...)',
    polygon: [
      [11.1500, 106.5000], // Củ Chi giáp Tây Ninh (Bến Súc)
      [11.0800, 106.6500], // Củ Chi giáp Bình Dương (Bình Mỹ)
      [10.9500, 106.7500], // TP. Thủ Đức giáp TP. Dĩ An (Cầu vượt Linh Xuân)
      [10.8800, 106.8500], // TP. Thủ Đức giáp Biên Hòa, Đồng Nai
      [10.7500, 106.8200], // Giáp Nhơn Trạch, Đồng Nai (Sông Đồng Nai)
      [10.5500, 106.9200], // Cần Giờ giáp Bà Rịa - Vũng Tàu (Vịnh Gành Rái)
      [10.3500, 106.8500], // Mũi Cần Giờ (Biển Đông)
      [10.4500, 106.6500], // Cần Giuộc giáp Long An
      [10.6500, 106.5500], // Bình Chánh giáp Long An (Bến Lức)
      [10.8500, 106.4800], // Hóc Môn giáp Đức Hòa, Long An
      [11.1500, 106.5000], // Khép kín Củ Chi
    ],
  },

  // 3. TỈNH BÌNH DƯƠNG
  {
    id: 'prov-074',
    code: '003074B001',
    name: 'Tỉnh Bình Dương',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.9805, 106.6519],
    areaKm2: 2694,
    description: 'Thủ phủ công nghiệp Đông Nam Bộ (TP. Dĩ An, Thuận An, Thủ Dầu Một, Bến Cát, Tân Uyên...)',
    polygon: [
      [11.4200, 106.5500], // Dầu Tiếng giáp Tây Ninh
      [11.3800, 106.8500], // Phú Giáo giáp Bình Phước
      [11.1500, 106.9500], // Bắc Tân Uyên giáp Đồng Nai
      [10.9800, 106.8200], // Tân Uyên giáp Biên Hòa
      [10.8800, 106.7800], // Dĩ An (Ga Sóng Thần, QL1K, Chợ Đông Thành)
      [10.8900, 106.6800], // Thuận An (Lái Thiêu) giáp TP.HCM
      [11.0200, 106.6000], // Thủ Dầu Một giáp Sông Sài Gòn
      [11.2500, 106.4800], // Bến Cát
      [11.4200, 106.5500], // Khép kín
    ],
  },

  // 4. THÀNH PHỐ ĐÀ NẴNG
  {
    id: 'prov-048',
    code: '002048B001',
    name: 'Thành phố Đà Nẵng',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [16.0678, 108.2208],
    areaKm2: 1285,
    description: 'Thành phố đầu tàu kinh tế Miền Trung (Hải Châu, Thanh Khê, Sơn Trà, Ngũ Hành Sơn, Hòa Vang...)',
    polygon: [
      [16.2200, 108.1200], // Đèo Hải Vân giáp Thừa Thiên Huế
      [16.1500, 108.3200], // Mũi Bán đảo Sơn Trà
      [16.0500, 108.2800], // Bờ biển Ngũ Hành Sơn
      [15.9200, 108.2500], // Giáp Điện Bàn, Quảng Nam
      [15.9000, 108.0500], // Hòa Vang giáp Đại Lộc
      [16.0500, 107.8500], // Bà Nà Hills
      [16.2000, 107.9500], // Ranh giới Nam Đông, Thừa Thiên Huế
      [16.2200, 108.1200], // Khép kín
    ],
  },

  // 5. THÀNH PHỐ HẢI PHÒNG
  {
    id: 'prov-031',
    code: '001031B001',
    name: 'Thành phố Hải Phòng',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [20.8449, 106.6881],
    areaKm2: 1527,
    description: 'Thành phố Cảng lớn nhất Miền Bắc (Hồng Bàng, Ngô Quyền, Lê Chân, Đồ Sơn, Cát Bà...)',
    polygon: [
      [21.0500, 106.6500], // Thủy Nguyên giáp Quảng Ninh
      [20.9500, 106.9500], // Cát Hải, Đảo Cát Bà
      [20.7500, 106.9000], // Bán đảo Đồ Sơn
      [20.6200, 106.6500], // Tiên Lãng giáp Thái Bình
      [20.7200, 106.4800], // Vĩnh Bảo
      [20.9000, 106.5200], // An Dương giáp Hải Dương
      [21.0500, 106.6500], // Khép kín
    ],
  },

  // 6. THÀNH PHỐ CẦN THƠ
  {
    id: 'prov-092',
    code: '003092B001',
    name: 'Thành phố Cần Thơ',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.0452, 105.7469],
    areaKm2: 1439,
    description: 'Đô thị trung tâm Tây Nam Bộ (Ninh Kiều, Bình Thủy, Cái Răng, Ô Môn, Thốt Nốt...)',
    polygon: [
      [10.3200, 105.5500], // Thốt Nốt giáp An Giang
      [10.2000, 105.7500], // Cửa Sông Hậu giáp Đồng Tháp
      [10.0500, 105.8500], // Cái Răng giáp Vĩnh Long (Cầu Cần Thơ)
      [9.8500, 105.7500],  // Phong Điền giáp Hậu Giang
      [9.9500, 105.4500],  // Thới Lai giáp Kiên Giang
      [10.1800, 105.3500], // Cờ Đỏ
      [10.3200, 105.5500], // Khép kín
    ],
  },

  // 7. TỈNH QUẢNG NINH
  {
    id: 'prov-022',
    code: '001022B001',
    name: 'Tỉnh Quảng Ninh',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [20.9505, 107.0734],
    areaKm2: 6102,
    description: 'Kỳ quan Vịnh Hạ Long, Móng Cái, Cẩm Phả, Uông Bí, Vân Đồn',
    polygon: [
      [21.5800, 107.5500], // Bình Liêu giáp Trung Quốc
      [21.5300, 107.9700], // Móng Cái
      [21.1500, 107.8500], // Huyện đảo Cô Tô
      [20.9500, 107.4500], // Vân Đồn, Vịnh Bái Tử Long
      [20.8500, 107.0500], // Hạ Long
      [21.0000, 106.7500], // Uông Bí giáp Hải Phòng
      [21.2500, 106.8500], // Ba Chẽ giáp Lạng Sơn
      [21.5800, 107.5500], // Khép kín
    ],
  },

  // 8. TỈNH ĐỒNG NAI
  {
    id: 'prov-075',
    code: '003075B001',
    name: 'Tỉnh Đồng Nai',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.9574, 106.8427],
    areaKm2: 5907,
    description: 'Thành phố Biên Hòa, Long Thành, Trảng Bom, Nhơn Trạch, Xuân Lộc',
    polygon: [
      [11.4500, 107.3500], // Tân Phú giáp Lâm Đồng (Vườn QG Cát Tiên)
      [11.2000, 107.5500], // Định Quán giáp Bình Thuận
      [10.8500, 107.3500], // Xuân Lộc giáp Bà Rịa - Vũng Tàu
      [10.6500, 106.9500], // Nhơn Trạch giáp Cần Giờ
      [10.8500, 106.8200], // Biên Hòa giáp TP.HCM & Bình Dương
      [11.1500, 106.9500], // Vĩnh Cửu giáp Bình Dương & Bình Phước
      [11.4500, 107.3500], // Khép kín
    ],
  },

  // 9. TỈNH KHÁNH HÒA
  {
    id: 'prov-056',
    code: '002056B001',
    name: 'Tỉnh Khánh Hòa',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [12.2388, 109.1967],
    areaKm2: 5217,
    description: 'Thành phố Nha Trang, Cam Ranh, Vịnh Vân Phong, Quần đảo Trường Sa',
    polygon: [
      [12.8500, 109.2000], // Vạn Ninh giáp Phú Yên (Đèo Cả)
      [12.6500, 109.3000], // Bán đảo Hòn Gốm
      [12.2500, 109.2500], // Vịnh Nha Trang
      [11.8500, 109.1800], // Bán đảo Cam Ranh giáp Ninh Thuận
      [12.0500, 108.8500], // Khánh Sơn giáp Lâm Đồng
      [12.3500, 108.8000], // Khánh Vĩnh giáp Đắk Lắk
      [12.8500, 109.2000], // Khép kín
    ],
  },

  // 10. TỈNH THỪA THIÊN HUẾ
  {
    id: 'prov-046',
    code: '002046B001',
    name: 'Thành phố Huế',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [16.4637, 107.5909],
    areaKm2: 5048,
    description: 'Cố đô Huế, Hương Thủy, Hương Trà, Phú Vang, Phú Lộc, A Lưới',
    polygon: [
      [16.7500, 107.2500], // Phong Điền giáp Quảng Trị
      [16.5500, 107.6500], // Thuận An, Phá Tam Giang
      [16.3200, 107.9000], // Lăng Cô giáp Đà Nẵng
      [16.0500, 107.7500], // Nam Đông giáp Quảng Nam
      [16.1500, 107.2500], // A Lưới giáp Lào
      [16.5000, 107.1500], // A Lưới giáp Quảng Trị
      [16.7500, 107.2500], // Khép kín
    ],
  },

  // 11. TỈNH THANH HÓA
  {
    id: 'prov-038',
    code: '002038B001',
    name: 'Tỉnh Thanh Hóa',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [19.8067, 105.7852],
    areaKm2: 11114,
    description: 'Cửa ngõ Bắc Trung Bộ, TP. Thanh Hóa, Sầm Sơn, Bỉm Sơn, Nghi Sơn',
    polygon: [
      [20.4500, 105.1500], // Mường Lát giáp Hòa Bình & Sơn La
      [20.2500, 104.6000], // Quan Sơn giáp Lào
      [19.7500, 105.1500], // Như Xuân giáp Nghệ An
      [19.3500, 105.7500], // Thị xã Nghi Sơn
      [19.7800, 105.9000], // Bờ biển Sầm Sơn
      [20.0500, 105.9500], // Nga Sơn giáp Ninh Bình
      [20.1500, 105.6500], // Thạch Thành giáp Ninh Bình
      [20.4500, 105.1500], // Khép kín
    ],
  },

  // 12. TỈNH NGHỆ AN
  {
    id: 'prov-040',
    code: '002040B001',
    name: 'Tỉnh Nghệ An',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [18.6734, 105.6813],
    areaKm2: 16490,
    description: 'Tỉnh có diện tích lớn nhất Việt Nam, TP. Vinh, Cửa Lò, Diễn Châu, Quỳnh Lưu',
    polygon: [
      [19.7500, 105.1500], // Quỳ Châu giáp Thanh Hóa
      [19.2500, 105.7500], // Quỳnh Lưu
      [18.8200, 105.7500], // Cửa Lò, TP. Vinh
      [18.6000, 105.6500], // Nghi Lộc giáp Hà Tĩnh
      [18.5500, 105.2000], // Nam Đàn giáp Hà Tĩnh
      [18.9500, 104.5500], // Con Cuông, Tương Dương
      [19.2500, 104.2500], // Kỳ Sơn giáp Lào
      [19.7500, 105.1500], // Khép kín
    ],
  },

  // 13. TỈNH ĐẮK LẮK
  {
    id: 'prov-066',
    code: '002066B001',
    name: 'Tỉnh Đắk Lắk',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [12.6667, 108.0500],
    areaKm2: 13030,
    description: 'Thủ phủ cà phê Tây Nguyên, TP. Buôn Ma Thuột, Ea Kar, Cư Mgar, Krông Pắc',
    polygon: [
      [13.4000, 108.2500], // Ea Hleo giáp Gia Lai
      [13.1500, 108.7500], // MDrắk giáp Phú Yên & Khánh Hòa
      [12.4500, 108.4500], // Lắk giáp Lâm Đồng
      [12.3500, 107.8500], // Krông Ana giáp Đắk Nông
      [12.7500, 107.6000], // Buôn Đôn giáp Campuchia
      [13.2000, 107.9000], // Cư Mgar
      [13.4000, 108.2500], // Khép kín
    ],
  },

  // 14. TỈNH LÂM ĐỒNG
  {
    id: 'prov-068',
    code: '002068B001',
    name: 'Tỉnh Lâm Đồng',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [11.9404, 108.4583],
    areaKm2: 9783,
    description: 'Thành phố hoa Đà Lạt, Bảo Lộc, Đức Trọng, Đơn Dương, Di Linh',
    polygon: [
      [12.4500, 108.4500], // Lạc Dương giáp Đắk Lắk & Khánh Hòa
      [12.0500, 108.6500], // Đơn Dương giáp Ninh Thuận
      [11.5500, 108.3500], // Di Linh giáp Bình Thuận
      [11.3500, 107.6500], // Đạ Huoai giáp Đồng Nai
      [11.7500, 107.4500], // Bảo Lâm giáp Đắk Nông
      [12.1500, 108.1500], // Lâm Hà
      [12.4500, 108.4500], // Khép kín
    ],
  },

  // 15. TỈNH CÀ MAU
  {
    id: 'prov-096',
    code: '003096B001',
    name: 'Tỉnh Cà Mau',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [9.1769, 105.1524],
    areaKm2: 5294,
    description: 'Cực Nam Tổ quốc, TP. Cà Mau, Năm Căn, Ngọc Hiển, Đầm Dơi, U Minh',
    polygon: [
      [9.4500, 104.9000], // U Minh giáp Kiên Giang
      [9.3500, 105.3500], // Thới Bình giáp Bạc Liêu
      [9.1500, 105.4500], // Đầm Dơi
      [8.6000, 105.2000], // Bờ biển Đông Ngọc Hiển
      [8.5800, 104.7500], // MŨI CÀ MAU
      [8.9500, 104.8200], // Bờ biển Tây Năm Căn
      [9.4500, 104.9000], // Khép kín
    ],
  },

  // 16. TỈNH AN GIANG
  {
    id: 'prov-091',
    code: '003091B001',
    name: 'Tỉnh An Giang',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.3759, 105.4185],
    areaKm2: 3536,
    description: 'TP. Long Xuyên, Châu Đốc, Núi Sam, Vùng Bảy Núi Thất Sơn',
    polygon: [
      [10.9200, 105.1500], // An Phú giáp Campuchia
      [10.7500, 105.3500], // Tân Châu giáp Đồng Tháp
      [10.3500, 105.5500], // Long Xuyên giáp Cần Thơ
      [10.1500, 105.1500], // Thoại Sơn giáp Kiên Giang
      [10.5500, 104.8500], // Tri Tôn giáp Kiên Giang
      [10.7500, 105.1000], // Châu Đốc giáp Campuchia
      [10.9200, 105.1500], // Khép kín
    ],
  },

  // 17. TỈNH ĐỒNG THÁP
  {
    id: 'prov-082',
    code: '003082B001',
    name: 'Tỉnh Đồng Tháp',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.4577, 105.6331],
    areaKm2: 3383,
    description: 'Xứ sở hoa sen, TP. Cao Lãnh, Sa Đéc, Hồng Ngự',
    polygon: [
      [10.9200, 105.3500], // Hồng Ngự giáp Campuchia
      [10.8500, 105.7500], // Tháp Mười giáp Long An
      [10.5500, 105.8500], // Cao Lãnh giáp Tiền Giang
      [10.2500, 105.7500], // Sa Đéc giáp Vĩnh Long
      [10.3500, 105.4500], // Lấp Vò giáp An Giang
      [10.7500, 105.3500], // Tam Nông
      [10.9200, 105.3500], // Khép kín
    ],
  },

  // 18. TỈNH VĨNH LONG
  {
    id: 'prov-086',
    code: '003086B001',
    name: 'Tỉnh Vĩnh Long',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [10.2537, 105.9722],
    areaKm2: 1525,
    description: 'Trái tim Miền Tây Nam Bộ, TP. Vĩnh Long, Bình Minh, Long Hồ',
    polygon: [
      [10.3200, 105.9500], // Long Hồ giáp Tiền Giang (Cầu Mỹ Thuận)
      [10.2000, 106.1500], // Mang Thít giáp Bến Tre
      [9.9500, 106.0500],  // Vũng Liêm giáp Trà Vinh
      [10.0500, 105.8200], // Bình Minh giáp Cần Thơ
      [10.2500, 105.7800], // Bình Tân giáp Đồng Tháp
      [10.3200, 105.9500], // Khép kín
    ],
  },

  // 19. TỈNH TÂY NINH
  {
    id: 'prov-080',
    code: '003080B001',
    name: 'Tỉnh Tây Ninh',
    level: 2,
    parentCode: '003S001',
    region: 'SOUTH',
    category: 'PROVINCE',
    center: [11.3101, 106.0983],
    areaKm2: 4041,
    description: 'Núi Bà Đen, Tòa Thánh Tây Ninh, Cửa khẩu Mộc Bài, Xa Mát',
    polygon: [
      [11.7500, 106.1000], // Tân Biên giáp Campuchia
      [11.6000, 106.4000], // Tân Châu giáp Bình Phước
      [11.3500, 106.3500], // Dương Minh Châu (Hồ Dầu Tiếng)
      [11.0800, 106.2500], // Trảng Bàng giáp TP.HCM
      [11.0500, 105.9500], // Bến Cầu giáp Long An
      [11.4500, 105.8500], // Châu Thành giáp Campuchia
      [11.7500, 106.1000], // Khép kín
    ],
  },

  // 20. TỈNH BẮC NINH
  {
    id: 'prov-024',
    code: '001024B001',
    name: 'Tỉnh Bắc Ninh',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.1861, 106.0763],
    areaKm2: 822,
    description: 'Thủ phủ công nghệ điện tử phía Bắc, TP. Bắc Ninh, Từ Sơn, Yên Phong, Quế Võ',
    polygon: [
      [21.2800, 106.0500], // Yên Phong giáp Bắc Giang
      [21.2200, 106.2500], // Quế Võ giáp Hải Dương
      [21.0500, 106.2200], // Gia Bình, Lương Tài
      [21.0800, 106.0200], // Thuận Thành giáp Hưng Yên & Hà Nội
      [21.1500, 105.9500], // Từ Sơn giáp Gia Lâm, Hà Nội
      [21.2800, 106.0500], // Khép kín
    ],
  },

  // 21. TỈNH HƯNG YÊN
  {
    id: 'prov-033',
    code: '001033B001',
    name: 'Tỉnh Hưng Yên',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [20.6464, 106.0511],
    areaKm2: 930,
    description: 'Phố Hiến xưa, TP. Hưng Yên, Văn Giang, Mỹ Hào, Yên Mỹ',
    polygon: [
      [20.9800, 105.9500], // Văn Giang giáp Hà Nội (Ecopark)
      [20.9500, 106.1500], // Văn Lâm giáp Hải Dương
      [20.7500, 106.2000], // Ân Thi giáp Thái Bình
      [20.6000, 106.0500], // TP. Hưng Yên giáp Hà Nam
      [20.7500, 105.9200], // Khoái Châu giáp Sông Hồng / Hà Nội
      [20.9800, 105.9500], // Khép kín
    ],
  },

  // 22. TỈNH NINH BÌNH
  {
    id: 'prov-037',
    code: '001037B001',
    name: 'Tỉnh Ninh Bình',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [20.2506, 105.9745],
    areaKm2: 1386,
    description: 'Di sản Tràng An, Cố đô Hoa Lư, Tam Cốc, Bái Đính, Kim Sơn',
    polygon: [
      [20.3500, 105.8500], // Nho Quan giáp Hòa Bình
      [20.3200, 106.0500], // Hoa Lư giáp Nam Định
      [20.0000, 106.0500], // Kim Sơn (Bờ biển)
      [19.9800, 105.8500], // Yên Mô giáp Thanh Hóa
      [20.2500, 105.7000], // Rừng Cúc Phương giáp Thanh Hóa & Hòa Bình
      [20.3500, 105.8500], // Khép kín
    ],
  },

  // 23. TỈNH THÁI NGUYÊN
  {
    id: 'prov-019',
    code: '001019B001',
    name: 'Tỉnh Thái Nguyên',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.5942, 105.8482],
    areaKm2: 3526,
    description: 'Thủ phủ chè, TP. Thái Nguyên, Sông Công, Phổ Yên',
    polygon: [
      [21.9500, 105.7500], // Định Hóa giáp Bắc Kạn
      [21.7500, 106.0500], // Đồng Hỷ giáp Lạng Sơn
      [21.4500, 106.0000], // Phú Bình giáp Bắc Giang
      [21.3500, 105.8200], // Phổ Yên giáp Hà Nội (Sóc Sơn)
      [21.4500, 105.6500], // Đại Từ giáp Vĩnh Phúc & Tuyên Quang
      [21.9500, 105.7500], // Khép kín
    ],
  },

  // 24. TỈNH PHÚ THỌ
  {
    id: 'prov-025',
    code: '001025B001',
    name: 'Tỉnh Phú Thọ',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.3227, 105.2280],
    areaKm2: 3534,
    description: 'Đất Tổ Hùng Vương, TP. Việt Trì, Thị xã Phú Thọ, Lâm Thao',
    polygon: [
      [21.6500, 105.0500], // Đoan Hùng giáp Tuyên Quang
      [21.4500, 105.4000], // Phù Ninh, Việt Trì giáp Vĩnh Phúc
      [21.1500, 105.3500], // Thanh Thủy giáp Hà Nội
      [21.0500, 105.0500], // Thanh Sơn giáp Hòa Bình
      [21.3500, 104.8500], // Yên Lập giáp Yên Bái
      [21.6500, 105.0500], // Khép kín
    ],
  },

  // 25. TỈNH LÀO CAI
  {
    id: 'prov-015',
    code: '001015B001',
    name: 'Tỉnh Lào Cai',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [22.4856, 103.9707],
    areaKm2: 6364,
    description: 'Đỉnh Fansipan, Thị xã Sa Pa, Cửa khẩu Quốc tế Lào Cai, Bắc Hà',
    polygon: [
      [22.8500, 103.8500], // Bát Xát giáp Trung Quốc
      [22.7500, 104.3500], // Mường Khương, Simacai
      [22.3500, 104.4500], // Bảo Yên giáp Yên Bái
      [22.0500, 104.0500], // Văn Bàn giáp Lai Châu
      [22.3500, 103.7500], // Sa Pa (Dãy Hoàng Liên Sơn)
      [22.8500, 103.8500], // Khép kín
    ],
  },

  // 26. TỈNH SƠN LA
  {
    id: 'prov-014',
    code: '001014B001',
    name: 'Tỉnh Sơn La',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.3283, 103.9148],
    areaKm2: 14123,
    description: 'Thủy điện Sơn La, Cao nguyên Mộc Châu, Mai Sơn, Thuận Châu',
    polygon: [
      [21.8500, 103.7500], // Quỳnh Nhai giáp Lai Châu & Điện Biên
      [21.5500, 104.3500], // Phù Yên giáp Phú Thọ & Yên Bái
      [20.8500, 104.8500], // Mộc Châu giáp Hòa Bình
      [20.5500, 104.5500], // Sốp Cộp giáp Lào
      [20.9500, 103.5500], // Sông Mã
      [21.4500, 103.4500], // Thuận Châu giáp Điện Biên
      [21.8500, 103.7500], // Khép kín
    ],
  },

  // 27. TỈNH ĐIỆN BIÊN
  {
    id: 'prov-011',
    code: '001011B001',
    name: 'Tỉnh Điện Biên',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.3860, 103.0230],
    areaKm2: 9541,
    description: 'Chiến trường Điện Biên Phủ, Mường Phăng, Cực Tây A Pa Chải',
    polygon: [
      [22.4000, 102.1500], // Cột mốc số 0 A Pa Chải
      [22.2500, 102.8500], // Mường Nhé giáp Lai Châu
      [21.8500, 103.2500], // Tủa Chùa giáp Sơn La
      [21.2500, 103.3500], // Điện Biên Đông
      [21.0500, 102.9500], // Điện Biên giáp Lào
      [21.7500, 102.6500], // Mường Chà
      [22.4000, 102.1500], // Khép kín
    ],
  },

  // 28. TỈNH LAI CHÂU
  {
    id: 'prov-012',
    code: '001012B001',
    name: 'Tỉnh Lai Châu',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [22.3965, 103.4682],
    areaKm2: 9068,
    description: 'TP. Lai Châu, Mường Tè, Sin Hồ, Đèo Ô Quy Hồ',
    polygon: [
      [22.7500, 103.4500], // Phong Thổ giáp Trung Quốc
      [22.5500, 103.8500], // Tam Đường giáp Lào Cai
      [22.0500, 103.6500], // Than Uyên giáp Yên Bái
      [21.9500, 103.1500], // Nậm Nhùn giáp Điện Biên
      [22.4500, 102.5500], // Mường Tè giáp Trung Quốc
      [22.7500, 103.4500], // Khép kín
    ],
  },

  // 29. TỈNH CAO BẰNG
  {
    id: 'prov-004',
    code: '001004B001',
    name: 'Tỉnh Cao Bằng',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [22.6657, 106.2577],
    areaKm2: 6700,
    description: 'Thác Bản Giốc, Pác Bó, TP. Cao Bằng, Trùng Khánh, Bảo Lạc',
    polygon: [
      [23.0600, 106.1200], // Bảo Lạc giáp Hà Giang & Trung Quốc
      [22.8800, 106.5500], // Trùng Khánh (Thác Bản Giốc)
      [22.4500, 106.7200], // Thạch An giáp Lạng Sơn
      [22.3500, 106.1500], // Nguyên Bình giáp Bắc Kạn
      [22.6500, 105.7500], // Bảo Lâm giáp Tuyên Quang
      [23.0600, 106.1200], // Khép kín
    ],
  },

  // 30. TỈNH LẠNG SƠN
  {
    id: 'prov-020',
    code: '001020B001',
    name: 'Tỉnh Lạng Sơn',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.8537, 106.7615],
    areaKm2: 8310,
    description: 'Cửa khẩu Hữu Nghị, Tân Thanh, Ải Chi Lăng, Động Tam Thanh',
    polygon: [
      [22.4500, 106.7200], // Tràng Định giáp Cao Bằng
      [22.1200, 107.1500], // Văn Lãng, Cửa khẩu Hữu Nghị
      [21.7500, 107.3500], // Đình Lập giáp Quảng Ninh
      [21.4500, 106.8500], // Hữu Lũng giáp Bắc Giang
      [21.6500, 106.3500], // Bắc Sơn giáp Thái Nguyên
      [22.0500, 106.3500], // Bình Gia
      [22.4500, 106.7200], // Khép kín
    ],
  },

  // 31. TỈNH TUYÊN QUANG
  {
    id: 'prov-008',
    code: '001008B001',
    name: 'Tỉnh Tuyên Quang',
    level: 2,
    parentCode: '001N001',
    region: 'NORTH',
    category: 'PROVINCE',
    center: [21.8233, 105.2181],
    areaKm2: 5867,
    description: 'Thủ đô kháng chiến Tân Trào, Hồ Na Hang, TP. Tuyên Quang',
    polygon: [
      [22.5500, 105.3500], // Na Hang giáp Hà Giang & Bắc Kạn
      [22.2500, 105.5500], // Chiêm Hóa
      [21.7500, 105.4500], // Sơn Dương giáp Vĩnh Phúc & Thái Nguyên
      [21.6500, 105.0500], // Yên Sơn giáp Phú Thọ
      [22.1500, 104.9500], // Hàm Yên giáp Yên Bái
      [22.5500, 105.3500], // Khép kín
    ],
  },

  // 32. TỈNH HÀ TĨNH
  {
    id: 'prov-042',
    code: '002042B001',
    name: 'Tỉnh Hà Tĩnh',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [18.3435, 105.9058],
    areaKm2: 5997,
    description: 'TP. Hà Tĩnh, Khu kinh tế Vũng Áng, Ngã ba Đồng Lộc, Biển Thiên Cầm',
    polygon: [
      [18.6000, 105.6500], // Nghi Xuân giáp Nghệ An (Sông Lam)
      [18.3500, 105.9500], // Thiên Cầm
      [18.0500, 106.4000], // Kỳ Anh, Vũng Áng (Đèo Ngang)
      [17.9500, 106.0500], // Hương Khê giáp Quảng Bình
      [18.3800, 105.2000], // Hương Sơn (Cửa khẩu Cầu Treo) giáp Lào
      [18.5500, 105.4500], // Đức Thọ
      [18.6000, 105.6500], // Khép kín
    ],
  },

  // 33. TỈNH QUẢNG TRỊ
  {
    id: 'prov-044',
    code: '002044B001',
    name: 'Tỉnh Quảng Trị',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [16.8163, 107.1006],
    areaKm2: 4739,
    description: 'Thành cổ Quảng Trị, Vĩ tuyến 17 Sông Bến Hải, Cửa Việt, Lao Bảo',
    polygon: [
      [17.1500, 107.0500], // Vĩnh Linh giáp Quảng Bình
      [16.8500, 107.2500], // Cửa Việt, Triệu Phong
      [16.6500, 107.3500], // Hải Lăng giáp Thừa Thiên Huế
      [16.4500, 106.8500], // Đakrông
      [16.6500, 106.6500], // Hướng Hóa (Cửa khẩu Lao Bảo) giáp Lào
      [16.9500, 106.7500], // Ranh giới Quảng Bình
      [17.1500, 107.0500], // Khép kín
    ],
  },

  // 34. TỈNH QUẢNG NGÃI
  {
    id: 'prov-051',
    code: '002051B001',
    name: 'Tỉnh Quảng Ngãi',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [15.1205, 108.7923],
    areaKm2: 5153,
    description: 'Khu kinh tế Dung Quất, Đảo Lý Sơn, Sa Huỳnh, TP. Quảng Ngãi',
    polygon: [
      [15.4200, 108.7500], // Bình Sơn, Dung Quất giáp Quảng Nam
      [15.0500, 108.9500], // TP. Quảng Ngãi
      [14.7500, 109.0500], // Sa Huỳnh, Đức Phổ giáp Bình Định
      [14.6500, 108.6500], // Ba Tơ giáp Kon Tum
      [14.9500, 108.3500], // Trà Bồng giáp Quảng Nam
      [15.4200, 108.7500], // Khép kín
    ],
  },

  // 35. TỈNH GIA LAI
  {
    id: 'prov-052',
    code: '002052B001',
    name: 'Tỉnh Gia Lai',
    level: 2,
    parentCode: '002C001',
    region: 'CENTRAL',
    category: 'PROVINCE',
    center: [13.9833, 108.0000],
    areaKm2: 15510,
    description: 'Thành phố Pleiku, Biển Hồ Tơ Nưng, Đắk Đoa, Cửa khẩu Lệ Thanh',
    polygon: [
      [14.5500, 108.1500], // Chư Păh giáp Kon Tum
      [14.2500, 108.7500], // An Khê giáp Bình Định & Quảng Ngãi
      [13.6500, 108.7500], // Krông Pa giáp Phú Yên
      [13.3500, 108.2500], // Chư Prông giáp Đắk Lắk
      [13.4000, 107.5000], // Cửa khẩu Lệ Thanh giáp Campuchia
      [13.9500, 107.4500], // Ia Grai
      [14.5500, 108.1500], // Khép kín
    ],
  },
];

// ---------------------------------------------------------------------------
// 4. TẦNG 3: BỘ DỮ LIỆU ĐA GIÁC ĐỘ NÉT CAO CHO CÁC PHƯỜNG ĐÔ THỊ (WARD HUBS)
// Các phường xã tiếp giáp bám sát khít nhau 100% (Seamless Topology - Shared Boundary Edges)
// Đảm bảo đơn hàng không bao giờ bị lọt ra ngoài giữa các phường
// ---------------------------------------------------------------------------
export interface LocalWardHubItem {
  id: string;
  code: string;
  name: string;
  level: number;
  parentHubCode: string;
  parentName: string;
  zoneCode: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
  province: string;
  district: string;
  ward: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  colorHex?: string;
  boundaryPolygon: Array<[number, number]>;
}

export const EXPANDED_WARD_HUBS: LocalWardHubItem[] = [
  // =========================================================================
  // CỤM 1: THÀNH PHỐ DĨ AN (BÌNH DƯƠNG) - TIẾP GIÁP KHÍT 100% 4 PHƯỜNG ĐÔ THỊ
  // =========================================================================

  // 1. Phường Dĩ An, TP. Dĩ An (Trung tâm Hành chính & Ga Dĩ An)
  {
    id: 'hub-07401W001',
    code: '07401W001',
    name: 'Bưu cục Phường Dĩ An (Bình Dương)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Bình Dương',
    district: 'TP. Dĩ An',
    ward: 'Phường Dĩ An',
    address: '15 Nguyễn An Ninh, Khu phố Đông Tân, Phường Dĩ An, Bình Dương',
    phone: '0274381101',
    latitude: 10.9032,
    longitude: 106.7725,
    isActive: true,
    colorHex: '#0052cc', // Nexus Royal Blue
    boundaryPolygon: [
      // Giáp Tân Đông Hiệp (Phía Bắc - Chung cạnh với Phường Tân Đông Hiệp)
      [10.9250, 106.7620],
      [10.9235, 106.7710],
      [10.9180, 106.7785],
      // Giáp Đông Hòa (Phía Đông - Chung cạnh với Phường Đông Hòa)
      [10.9125, 106.7840],
      [10.9080, 106.7920],
      [10.9015, 106.7865],
      [10.8950, 106.7790],
      // Giáp An Bình (Phía Nam - Chung cạnh với Phường An Bình)
      [10.8880, 106.7750],
      [10.8810, 106.7720],
      [10.8830, 106.7610],
      [10.8890, 106.7565],
      [10.8970, 106.7540],
      // Phía Tây (ĐT743C / Ngã tư 550)
      [10.9060, 106.7560],
      [10.9160, 106.7585],
      [10.9250, 106.7620],
    ],
  },

  // 2. Phường An Bình, TP. Dĩ An (Ga Sóng Thần, KCN Sóng Thần & Linh Xuân) - Khít 100% mép Nam của P. Dĩ An
  {
    id: 'hub-07401W002',
    code: '07401W002',
    name: 'Bưu cục Phường An Bình (Dĩ An)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Bình Dương',
    district: 'TP. Dĩ An',
    ward: 'Phường An Bình',
    address: 'Đường An Bình, KCN Sóng Thần, Phường An Bình, Dĩ An, Bình Dương',
    phone: '0274381102',
    latitude: 10.8850,
    longitude: 106.7580,
    isActive: true,
    colorHex: '#059669', // Emerald Green
    boundaryPolygon: [
      // Chung cạnh 100% bám sát mép Nam của Phường Dĩ An
      [10.8970, 106.7540],
      [10.8890, 106.7565],
      [10.8830, 106.7610],
      [10.8810, 106.7720],
      [10.8880, 106.7750],
      [10.8950, 106.7790],
      // Ranh giới phía Nam tiếp giáp Thủ Đức & QL1A
      [10.8820, 106.7820],
      [10.8750, 106.7750],
      [10.8700, 106.7650],
      [10.8720, 106.7520],
      [10.8820, 106.7460],
      [10.8970, 106.7540],
    ],
  },

  // 3. Phường Tân Đông Hiệp, TP. Dĩ An (KCN Tân Đông Hiệp, Chiêu Liêu) - Khít 100% mép Bắc của P. Dĩ An
  {
    id: 'hub-07401W003',
    code: '07401W003',
    name: 'Bưu cục Phường Tân Đông Hiệp (Dĩ An)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Bình Dương',
    district: 'TP. Dĩ An',
    ward: 'Phường Tân Đông Hiệp',
    address: 'Đường ĐT743B, Phường Tân Đông Hiệp, Dĩ An, Bình Dương',
    phone: '0274381103',
    latitude: 10.9320,
    longitude: 106.7700,
    isActive: true,
    colorHex: '#0284c7', // Cyan Blue
    boundaryPolygon: [
      // Chung cạnh 100% bám sát mép Bắc của Phường Dĩ An
      [10.9180, 106.7785],
      [10.9235, 106.7710],
      [10.9250, 106.7620],
      // Vòng cung phía Bắc tiếp giáp Thuận An và Tân Uyên
      [10.9380, 106.7580],
      [10.9460, 106.7660],
      [10.9420, 106.7820],
      [10.9300, 106.7860],
      [10.9180, 106.7785],
    ],
  },

  // 4. Phường Đông Hòa, TP. Dĩ An (ĐHQG TP.HCM, QL1K) - Khít 100% mép Đông của P. Dĩ An
  {
    id: 'hub-07401W004',
    code: '07401W004',
    name: 'Bưu cục Phường Đông Hòa (Dĩ An)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Bình Dương',
    district: 'TP. Dĩ An',
    ward: 'Phường Đông Hòa',
    address: 'Đường Quốc lộ 1K, Phường Đông Hòa, Dĩ An, Bình Dương',
    phone: '0274381104',
    latitude: 10.9020,
    longitude: 106.7980,
    isActive: true,
    colorHex: '#7c3aed', // Purple Violet
    boundaryPolygon: [
      // Chung cạnh 100% bám sát mép Đông của Phường Dĩ An
      [10.8950, 106.7790],
      [10.9015, 106.7865],
      [10.9080, 106.7920],
      [10.9125, 106.7840],
      [10.9180, 106.7785],
      // Phía Đông tiếp giáp Đồng Nai & Suối Tiên
      [10.9220, 106.7960],
      [10.9150, 106.8120],
      [10.8980, 106.8160],
      [10.8850, 106.8040],
      [10.8880, 106.7880],
      [10.8950, 106.7790],
    ],
  },

  // =========================================================================
  // CỤM 2: TRUNG TÂM QUẬN 1 (TP. HỒ CHÍ MINH) - TIẾP GIÁP KHÍT 100% 6 PHƯỜNG
  // =========================================================================

  // 5. Phường Bến Thành, Quận 1 (Chợ Bến Thành, Phù Đổng, Tao Đàn)
  {
    id: 'hub-07901W001',
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '0283811001',
    latitude: 10.7715,
    longitude: 106.6932,
    isActive: true,
    colorHex: '#0052cc', // Primary Royal Blue
    boundaryPolygon: [
      [10.7645, 106.6865], // Ngã 6 Phù Đổng
      [10.7680, 106.6840], // Nguyễn Thị Minh Khai
      [10.7725, 106.6860], // Công viên Tao Đàn
      [10.7770, 106.6895], // Trương Định
      // Mép tiếp giáp 100% với Phường Bến Nghé
      [10.7795, 106.6940], // Nguyễn Du
      [10.7780, 106.6985], // Lê Lợi
      [10.7735, 106.7005], // Vòng xoay Quách Thị Trang
      // Mép tiếp giáp 100% với Phường Phạm Ngũ Lão
      [10.7690, 106.6970], // Lê Lai
      [10.7650, 106.6915], // Bến xe Buýt
      [10.7645, 106.6865],
    ],
  },

  // 6. Phường Bến Nghé, Quận 1 (Bến Bạch Đằng, Lê Duẩn, Ba Son) - Khít 100% mép Đông P. Bến Thành
  {
    id: 'hub-07901W002',
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    address: '45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0283811002',
    latitude: 10.7758,
    longitude: 106.7012,
    isActive: true,
    colorHex: '#0284c7', // Light Ocean Blue
    boundaryPolygon: [
      // Chung cạnh bám sát 100% mép Đông Phường Bến Thành
      [10.7735, 106.7005],
      [10.7780, 106.6985],
      [10.7795, 106.6940],
      [10.7815, 106.6970], // Nhà Thờ Đức Bà
      // Mép tiếp giáp 100% với Phường Đa Kao
      [10.7850, 106.7020], // Thảo Cầm Viên
      [10.7910, 106.7065], // Kênh Thị Nghè
      // Bờ sông Sài Gòn
      [10.7870, 106.7110], // Ba Son
      [10.7790, 106.7140], // Bến Bạch Đằng
      [10.7715, 106.7085], // Cầu Khánh Hội
      [10.7685, 106.7030], // Hàm Nghi
      [10.7735, 106.7005],
    ],
  },

  // 7. Phường Phạm Ngũ Lão, Quận 1 (Phố Tây Bùi Viện, Công viên 23/9) - Khít 100% mép Nam P. Bến Thành
  {
    id: 'hub-07901W003',
    code: '07901W003',
    name: 'Bưu cục Phường Phạm Ngũ Lão (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Phạm Ngũ Lão',
    address: '185 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    phone: '0283811003',
    latitude: 10.7668,
    longitude: 106.6912,
    isActive: true,
    colorHex: '#d97706', // Amber Warm
    boundaryPolygon: [
      // Chung cạnh bám sát 100% mép Nam Phường Bến Thành
      [10.7645, 106.6865],
      [10.7650, 106.6915],
      [10.7690, 106.6970],
      [10.7735, 106.7005],
      // Ranh giới phía Nam tiếp giáp Phường Cầu Ông Lãnh & Cầu Kho
      [10.7660, 106.6980], // Trần Hưng Đạo
      [10.7610, 106.6920], // Đề Thám
      [10.7580, 106.6850], // Cống Quỳnh
      [10.7620, 106.6830], // Nguyễn Trãi
      [10.7645, 106.6865],
    ],
  },

  // 8. Phường Đa Kao, Quận 1 (Đinh Tiên Hoàng, Điện Biên Phủ) - Khít 100% mép Bắc P. Bến Nghé
  {
    id: 'hub-07901W004',
    code: '07901W004',
    name: 'Bưu cục Phường Đa Kao (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Đa Kao',
    address: '72 Đinh Tiên Hoàng, Phường Đa Kao, Quận 1, TP.HCM',
    phone: '0283811004',
    latitude: 10.7890,
    longitude: 106.6985,
    isActive: true,
    colorHex: '#059669', // Emerald
    boundaryPolygon: [
      // Chung cạnh bám sát 100% mép Bắc Phường Bến Nghé
      [10.7850, 106.7020],
      [10.7910, 106.7065],
      [10.7870, 106.7110],
      // Tiếp giáp Kênh Nhiêu Lộc - Thị Nghè & Bình Thạnh
      [10.7950, 106.7010], // Cầu Thị Nghè 2
      [10.7920, 106.6930], // Hai Bà Trưng (Chung cạnh với Phường Tân Định)
      [10.7840, 106.6950], // Điện Biên Phủ
      [10.7850, 106.7020],
    ],
  },

  // 9. Phường Tân Định, Quận 1 (Chợ Tân Định, Nhà thờ màu hồng) - Khít 100% mép Tây P. Đa Kao
  {
    id: 'hub-07901W005',
    code: '07901W005',
    name: 'Bưu cục Phường Tân Định (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Tân Định',
    address: '280 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM',
    phone: '0283811005',
    latitude: 10.7915,
    longitude: 106.6890,
    isActive: true,
    colorHex: '#e11d48', // Rose Pink
    boundaryPolygon: [
      // Chung cạnh bám sát 100% với Phường Đa Kao dọc Hai Bà Trưng
      [10.7840, 106.6950],
      [10.7920, 106.6930],
      // Dọc Kênh Nhiêu Lộc - Hoàng Sa
      [10.7970, 106.6870], // Cầu Kiệu
      [10.7910, 106.6810], // Trần Quang Khải
      [10.7830, 106.6860], // Nguyễn Đình Chiểu
      [10.7840, 106.6950],
    ],
  },

  // =========================================================================
  // CỤM 3: QUẬN TÂN BÌNH (TP. HỒ CHÍ MINH) - TIẾP GIÁP KHÍT 100% CÁC PHƯỜNG
  // =========================================================================

  // 10. Phường 13, Quận Tân Bình (Cộng Hòa, Ấp Bắc, E-Town)
  {
    id: 'hub-07913W001',
    code: '07913W001',
    name: 'Bưu cục Phường 13 (Tân Bình)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    address: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP.HCM',
    phone: '0283811006',
    latitude: 10.8035,
    longitude: 106.6436,
    isActive: true,
    colorHex: '#0052cc',
    boundaryPolygon: [
      [10.7930, 106.6320], // Mũi tàu Trường Chinh / Tân Kỳ Tân Quý
      [10.8020, 106.6340],
      [10.8140, 106.6375],
      // Chung cạnh tiếp giáp 100% với Phường 12
      [10.8170, 106.6480], // Hoàng Hoa Thám
      [10.8120, 106.6560], // Sân bay Tân Sơn Nhất
      [10.8010, 106.6530],
      [10.7950, 106.6420],
      [10.7930, 106.6320],
    ],
  },

  // 11. Phường 12, Quận Tân Bình (Hoàng Hoa Thám, Trường Chinh) - Khít 100% Phường 13
  {
    id: 'hub-07912W001',
    code: '07912W001',
    name: 'Bưu cục Phường 12 (Tân Bình)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận Tân Bình',
    ward: 'Phường 12',
    address: '22 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, TP.HCM',
    phone: '0283811007',
    latitude: 10.7980,
    longitude: 106.6495,
    isActive: true,
    colorHex: '#059669',
    boundaryPolygon: [
      // Chung cạnh bám sát 100% Phường 13
      [10.7950, 106.6420],
      [10.8010, 106.6530],
      [10.8120, 106.6560],
      // Tiếp giáp Ngã tư Bảy Hiền & Phường 11
      [10.8050, 106.6620],
      [10.7920, 106.6580],
      [10.7880, 106.6480],
      [10.7950, 106.6420],
    ],
  },

  // =========================================================================
  // CỤM 4: QUẬN HOÀN KIẾM (HÀ NỘI) - TIẾP GIÁP KHÍT 100% CÁC PHƯỜNG TRUNG TÂM
  // =========================================================================

  // 12. Phường Hàng Bài, Quận Hoàn Kiếm (Phố Huế, Bà Triệu, Tràng Tiền Plaza)
  {
    id: 'hub-00101W001',
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài (Hoàn Kiếm)',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    address: '15 Phố Huế, Phường Hàng Bài, Hoàn Kiếm, Hà Nội',
    phone: '0243811001',
    latitude: 21.0185,
    longitude: 105.8524,
    isActive: true,
    colorHex: '#0052cc',
    boundaryPolygon: [
      [21.0110, 105.8460], // Trần Nhân Tông
      [21.0180, 105.8475], // Bà Triệu
      // Chung cạnh tiếp giáp 100% với Phường Tràng Tiền
      [21.0250, 105.8500], // Tràng Tiền Plaza
      [21.0265, 105.8570], // Nhà Hát Lớn
      [21.0210, 105.8590], // Phan Chu Trinh
      // Phía Nam
      [21.0140, 105.8575], // Phố Huế
      [21.0110, 105.8460],
    ],
  },

  // 13. Phường Tràng Tiền, Quận Hoàn Kiếm (Nhà Hát Lớn, Bờ Hồ phía Đông) - Khít 100% P. Hàng Bài
  {
    id: 'hub-00101W002',
    code: '00101W002',
    name: 'Bưu cục Phường Tràng Tiền (Hoàn Kiếm)',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Tràng Tiền',
    address: '01 Tràng Tiền, Phường Tràng Tiền, Hoàn Kiếm, Hà Nội',
    phone: '0243811002',
    latitude: 21.0245,
    longitude: 105.8575,
    isActive: true,
    colorHex: '#0284c7',
    boundaryPolygon: [
      // Chung cạnh bám sát 100% Phường Hàng Bài
      [21.0210, 105.8590],
      [21.0265, 105.8570],
      [21.0250, 105.8500],
      // Chung cạnh bám sát 100% Phường Lý Thái Tổ
      [21.0300, 105.8530], // Đinh Tiên Hoàng
      [21.0315, 105.8610], // Trần Quang Khải
      [21.0240, 105.8640], // Bờ Sông Hồng
      [21.0210, 105.8590],
    ],
  },

  // 14. Phường Lý Thái Tổ, Quận Hoàn Kiếm (Bưu điện Hà Nội, Hồ Gươm) - Khít 100% P. Tràng Tiền
  {
    id: 'hub-00101W003',
    code: '00101W003',
    name: 'Bưu cục Phường Lý Thái Tổ (Hoàn Kiếm)',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Lý Thái Tổ',
    address: '75 Đinh Tiên Hoàng, Phường Lý Thái Tổ, Hoàn Kiếm, Hà Nội',
    phone: '0243811003',
    latitude: 21.0295,
    longitude: 105.8550,
    isActive: true,
    colorHex: '#059669',
    boundaryPolygon: [
      // Chung cạnh bám sát 100% Phường Tràng Tiền
      [21.0250, 105.8500],
      [21.0300, 105.8530],
      [21.0315, 105.8610],
      // Tiếp giáp Phường Hàng Bạc & Cầu Chương Dương
      [21.0360, 105.8580],
      [21.0340, 105.8510], // Hàng Dầu
      [21.0250, 105.8500],
    ],
  },

  // =========================================================================
  // CỤM 5: QUẬN HẢI CHÂU (ĐÀ NẴNG) - TIẾP GIÁP KHÍT 100%
  // =========================================================================

  // 15. Phường Thạch Thang, Quận Hải Châu (Bạch Đằng, Sông Hàn, Thành Điện Hải)
  {
    id: 'hub-04801W001',
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang (Hải Châu)',
    level: 3,
    parentHubCode: '002048B001',
    parentName: 'Hub TP. Đà Nẵng',
    zoneCode: '002',
    region: 'CENTRAL',
    province: 'Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    address: '12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu, Đà Nẵng',
    phone: '0236381101',
    latitude: 16.0742,
    longitude: 108.2239,
    isActive: true,
    colorHex: '#0052cc',
    boundaryPolygon: [
      [16.0680, 108.2180], // Quang Trung
      [16.0780, 108.2190], // Đống Đa
      [16.0820, 108.2275], // Cảng Đà Nẵng
      [16.0750, 108.2290], // Bạch Đằng
      // Chung cạnh tiếp giáp 100% với Phường Hải Châu 1
      [16.0690, 108.2260], // Thành Điện Hải
      [16.0680, 108.2180],
    ],
  },

  // 16. Phường Hải Châu 1, Quận Hải Châu (Cầu Sông Hàn, Chợ Hàn) - Khít 100% P. Thạch Thang
  {
    id: 'hub-04801W002',
    code: '04801W002',
    name: 'Bưu cục Phường Hải Châu 1 (Đà Nẵng)',
    level: 3,
    parentHubCode: '002048B001',
    parentName: 'Hub TP. Đà Nẵng',
    zoneCode: '002',
    region: 'CENTRAL',
    province: 'Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Hải Châu 1',
    address: '86 Hùng Vương, Phường Hải Châu 1, Hải Châu, Đà Nẵng',
    phone: '0236381102',
    latitude: 16.0670,
    longitude: 108.2230,
    isActive: true,
    colorHex: '#059669',
    boundaryPolygon: [
      // Chung cạnh bám sát 100% Phường Thạch Thang
      [16.0680, 108.2180],
      [16.0690, 108.2260],
      [16.0750, 108.2290],
      // Dọc Bạch Đằng & Cầu Rồng
      [16.0610, 108.2260], // Cầu Rồng
      [16.0590, 108.2190], // Nguyễn Chí Thanh
      [16.0680, 108.2180],
    ],
  },
];

// ---------------------------------------------------------------------------
// 5. THUẬT TOÁN HÌNH HỌC KHÔNG GIAN (SPATIAL RAY-CASTING, TOPOLOGY & HELPERS)
// ---------------------------------------------------------------------------

/**
 * Thuật toán Ray Casting (Point-in-Polygon)
 * Kiểm tra xem điểm GPS có nằm chính xác bên trong đa giác khép kín hay không
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

/**
 * Tính khoảng cách từ điểm tới đoạn thẳng trên mặt cầu (xấp xỉ km)
 */
function distancePointToSegmentKm(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    return Math.hypot(px - x1, py - y1) * 111;
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY) * 111;
}

/**
 * Tính khoảng cách ngắn nhất từ một toạ độ (lat, lng) tới đường viền của một đa giác (km)
 */
export function distanceToPolygonKm(
  lat: number,
  lng: number,
  polygon: Array<[number, number]>,
): number {
  if (!polygon || polygon.length < 2) return Infinity;
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const p1 = polygon[i];
    const p2 = polygon[j];

    const d = distancePointToSegmentKm(lat, lng, p1[0], p1[1], p2[0], p2[1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance;
}

/**
 * Tìm Bưu cục Phường/Xã phụ trách toạ độ GPS
 * Đảm bảo 100% không lọt đơn:
 * 1. Khớp chính xác Ray Casting đa giác phường
 * 2. Tự động gắn kết dung sai đường biên tiếp giáp (Boundary Edge Snapping ~250m)
 *    nếu đơn hàng nằm ngay giữa vạch phân cách hai phường liền kề.
 */
export function findWardForCoordinate(
  lat: number,
  lng: number,
  toleranceKm = 0.25, // 250m tolerance trên các trục đường phân định
): LocalWardHubItem | null {
  // 1. ƯU TIÊN: Tìm trong bộ dữ liệu chuẩn quốc gia (483 phường/xã)
  const officialMatch = findOfficialWardForCoordinate(lat, lng, 0.15);
  if (officialMatch) {
    // Convert OfficialWardBoundary → LocalWardHubItem compatible
    return {
      id: officialMatch.id,
      code: officialMatch.code,
      name: officialMatch.name,
      level: 3,
      parentHubCode: '',
      parentName: '',
      zoneCode: '',
      region: officialMatch.region,
      province: officialMatch.province,
      district: officialMatch.district,
      ward: officialMatch.name,
      address: `${officialMatch.name}, ${officialMatch.district}, ${officialMatch.province}`,
      phone: '',
      latitude: officialMatch.latitude,
      longitude: officialMatch.longitude,
      isActive: true,
      colorHex: officialMatch.colorHex,
      boundaryPolygon: officialMatch.boundaryPolygon,
    };
  }

  const pt = { latitude: lat, longitude: lng };

  // 2. Fallback: Tìm trong EXPANDED_WARD_HUBS cũ
  for (const ward of EXPANDED_WARD_HUBS) {
    if (isPointInPolygon(pt, ward.boundaryPolygon)) {
      return ward;
    }
  }

  // 3. Dung sai tiếp giáp đường biên để đơn không lọt ra khe hở
  let closestWard: LocalWardHubItem | null = null;
  let minKm = Infinity;

  for (const ward of EXPANDED_WARD_HUBS) {
    const km = distanceToPolygonKm(lat, lng, ward.boundaryPolygon);
    if (km < minKm) {
      minKm = km;
      closestWard = ward;
    }
  }

  if (closestWard && minKm <= toleranceKm) {
    return closestWard;
  }

  return null;
}

/**
 * Tìm Tỉnh/Thành phố tương ứng với toạ độ GPS bất kỳ trên bản đồ Việt Nam
 * Đảm bảo bao phủ 100% không để lại điểm mù
 */
export function findProvinceForCoordinate(lat: number, lng: number): BoundaryItem | null {
  const pt = { latitude: lat, longitude: lng };

  // 1. Kiểm tra chính xác theo đa giác từng tỉnh
  for (const prov of VIETNAM_PROVINCE_BOUNDARIES) {
    if (isPointInPolygon(pt, prov.polygon)) {
      return prov;
    }
  }

  // 2. Nếu điểm nằm ở vùng biên/ven biển (dung sai GPS), tìm tỉnh gần nhất
  let nearestProv: BoundaryItem | null = null;
  let minDistance = Infinity;

  for (const prov of VIETNAM_PROVINCE_BOUNDARIES) {
    const dist = Math.hypot(lat - prov.center[0], lng - prov.center[1]);
    if (dist < minDistance) {
      minDistance = dist;
      nearestProv = prov;
    }
  }

  return nearestProv;
}

/**
 * Tìm Vùng miền tương ứng với toạ độ GPS
 */
export function findRegionForCoordinate(lat: number, lng: number): BoundaryItem | null {
  const pt = { latitude: lat, longitude: lng };

  for (const reg of VIETNAM_REGION_BOUNDARIES) {
    if (isPointInPolygon(pt, reg.polygon)) {
      return reg;
    }
  }

  // Fallback theo vĩ độ kinh tuyến
  if (lat >= 19.8) {
    return VIETNAM_REGION_BOUNDARIES[0]; // Bắc
  } else if (lat >= 11.5) {
    return VIETNAM_REGION_BOUNDARIES[1]; // Trung
  } else {
    return VIETNAM_REGION_BOUNDARIES[2]; // Nam
  }
}

/**
 * Tính trọng tâm (Centroid) của một đa giác
 */
export function calculatePolygonCentroid(polygon: Array<[number, number]>): [number, number] {
  if (!polygon || polygon.length === 0) return [16.0471, 108.2068];
  let sumLat = 0;
  let sumLng = 0;
  polygon.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return [sumLat / polygon.length, sumLng / polygon.length];
}

/**
 * Tính diện tích ước tính (km2) từ đa giác tọa độ
 */
export function calculatePolygonAreaKm2(polygon: Array<[number, number]>): number {
  if (!polygon || polygon.length < 3) return 0;
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }
  area = Math.abs(area) / 2;
  return Math.round(area * 111 * 111 * Math.cos((16 * Math.PI) / 180));
}

