import type { HubRecord } from '../services/api/masterdata.api';

export interface AdminUnitWard {
  code: number | string;
  name: string;
  district?: string;
  displayName: string;
}

export interface AdminUnitProvince {
  name: string;
  wards: AdminUnitWard[];
}

export const VIETNAM_ADMINISTRATIVE_DATA: AdminUnitProvince[] = [
  {
    name: 'Thành phố Hồ Chí Minh',
    wards: [
      { code: '7901', name: 'Phường Bến Nghé', district: 'Quận 1', displayName: 'Phường Bến Nghé (Quận 1)' },
      { code: '7902', name: 'Phường Bến Thành', district: 'Quận 1', displayName: 'Phường Bến Thành (Quận 1)' },
      { code: '7903', name: 'Phường Tân Định', district: 'Quận 1', displayName: 'Phường Tân Định (Quận 1)' },
      { code: '7904', name: 'Phường Phạm Ngũ Lão', district: 'Quận 1', displayName: 'Phường Phạm Ngũ Lão (Quận 1)' },
      { code: '7905', name: 'Phường Võ Thị Sáu', district: 'Quận 3', displayName: 'Phường Võ Thị Sáu (Quận 3)' },
      { code: '7906', name: 'Phường 1', district: 'Quận 3', displayName: 'Phường 1 (Quận 3)' },
      { code: '7907', name: 'Phường 2', district: 'Quận 5', displayName: 'Phường 2 (Quận 5)' },
      { code: '7908', name: 'Phường 12', district: 'Quận 5', displayName: 'Phường 12 (Quận 5)' },
      { code: '7909', name: 'Phường Tân Phong', district: 'Quận 7', displayName: 'Phường Tân Phong (Quận 7)' },
      { code: '7910', name: 'Phường Tân Thuận Đông', district: 'Quận 7', displayName: 'Phường Tân Thuận Đông (Quận 7)' },
      { code: '7911', name: 'Phường Phú Mỹ', district: 'Quận 7', displayName: 'Phường Phú Mỹ (Quận 7)' },
      { code: '7912', name: 'Phường Thảo Điền', district: 'TP. Thủ Đức', displayName: 'Phường Thảo Điền (TP. Thủ Đức)' },
      { code: '7913', name: 'Phường An Phú', district: 'TP. Thủ Đức', displayName: 'Phường An Phú (TP. Thủ Đức)' },
      { code: '7914', name: 'Phường Linh Trung', district: 'TP. Thủ Đức', displayName: 'Phường Linh Trung (TP. Thủ Đức)' },
      { code: '7915', name: 'Phường Hiệp Phú', district: 'TP. Thủ Đức', displayName: 'Phường Hiệp Phú (TP. Thủ Đức)' },
      { code: '7916', name: 'Phường 14', district: 'Quận Bình Thạnh', displayName: 'Phường 14 (Quận Bình Thạnh)' },
      { code: '7917', name: 'Phường 25', district: 'Quận Bình Thạnh', displayName: 'Phường 25 (Quận Bình Thạnh)' },
      { code: '7918', name: 'Phường 2', district: 'Quận Tân Bình', displayName: 'Phường 2 (Quận Tân Bình)' },
      { code: '7919', name: 'Phường 12', district: 'Quận Tân Bình', displayName: 'Phường 12 (Quận Tân Bình)' },
      { code: '7920', name: 'Phường 15', district: 'Quận Gò Vấp', displayName: 'Phường 15 (Quận Gò Vấp)' },
      { code: '7921', name: 'Phường 10', district: 'Quận Gò Vấp', displayName: 'Phường 10 (Quận Gò Vấp)' },
      { code: '7922', name: 'Phường An Phú Đông', district: 'Quận 12', displayName: 'Phường An Phú Đông (Quận 12)' },
      { code: '7923', name: 'Phường Thạnh Lộc', district: 'Quận 12', displayName: 'Phường Thạnh Lộc (Quận 12)' },
      { code: '7924', name: 'Phường Tân Chánh Hiệp', district: 'Quận 12', displayName: 'Phường Tân Chánh Hiệp (Quận 12)' },
      { code: '7925', name: 'Phường Hiệp Thành', district: 'Quận 12', displayName: 'Phường Hiệp Thành (Quận 12)' },
      { code: '7926', name: 'Xã Bình Hưng', district: 'Huyện Bình Chánh', displayName: 'Xã Bình Hưng (Huyện Bình Chánh)' },
      { code: '7927', name: 'Xã Phong Phú', district: 'Huyện Bình Chánh', displayName: 'Xã Phong Phú (Huyện Bình Chánh)' },
      { code: '7928', name: 'Thị trấn Hóc Môn', district: 'Huyện Hóc Môn', displayName: 'Thị trấn Hóc Môn (Huyện Hóc Môn)' },
    ],
  },
  {
    name: 'Thành phố Hà Nội',
    wards: [
      { code: '101', name: 'Phường Tràng Tiền', district: 'Quận Hoàn Kiếm', displayName: 'Phường Tràng Tiền (Quận Hoàn Kiếm)' },
      { code: '102', name: 'Phường Hàng Bạc', district: 'Quận Hoàn Kiếm', displayName: 'Phường Hàng Bạc (Quận Hoàn Kiếm)' },
      { code: '103', name: 'Phường Hàng Đào', district: 'Quận Hoàn Kiếm', displayName: 'Phường Hàng Đào (Quận Hoàn Kiếm)' },
      { code: '104', name: 'Phường Điện Biên', district: 'Quận Ba Đình', displayName: 'Phường Điện Biên (Quận Ba Đình)' },
      { code: '105', name: 'Phường Kim Mã', district: 'Quận Ba Đình', displayName: 'Phường Kim Mã (Quận Ba Đình)' },
      { code: '1051', name: 'Phường Cống Vị', district: 'Quận Ba Đình', displayName: 'Phường Cống Vị (Quận Ba Đình)' },
      { code: '106', name: 'Phường Dịch Vọng', district: 'Quận Cầu Giấy', displayName: 'Phường Dịch Vọng (Quận Cầu Giấy)' },
      { code: '107', name: 'Phường Dịch Vọng Hậu', district: 'Quận Cầu Giấy', displayName: 'Phường Dịch Vọng Hậu (Quận Cầu Giấy)' },
      { code: '108', name: 'Phường Yên Hòa', district: 'Quận Cầu Giấy', displayName: 'Phường Yên Hòa (Quận Cầu Giấy)' },
      { code: '109', name: 'Phường Mỹ Đình 1', district: 'Quận Nam Từ Liêm', displayName: 'Phường Mỹ Đình 1 (Quận Nam Từ Liêm)' },
      { code: '110', name: 'Phường Mỹ Đình 2', district: 'Quận Nam Từ Liêm', displayName: 'Phường Mỹ Đình 2 (Quận Nam Từ Liêm)' },
      { code: '111', name: 'Phường Cầu Diễn', district: 'Quận Nam Từ Liêm', displayName: 'Phường Cầu Diễn (Quận Nam Từ Liêm)' },
      { code: '112', name: 'Phường Ô Chợ Dừa', district: 'Quận Đống Đa', displayName: 'Phường Ô Chợ Dừa (Quận Đống Đa)' },
      { code: '113', name: 'Phường Láng Hạ', district: 'Quận Đống Đa', displayName: 'Phường Láng Hạ (Quận Đống Đa)' },
      { code: '114', name: 'Phường Bách Khoa', district: 'Quận Hai Bà Trưng', displayName: 'Phường Bách Khoa (Quận Hai Bà Trưng)' },
      { code: '115', name: 'Phường Minh Khai', district: 'Quận Hai Bà Trưng', displayName: 'Phường Minh Khai (Quận Hai Bà Trưng)' },
      { code: '116', name: 'Phường Hoàng Liệt', district: 'Quận Hoàng Mai', displayName: 'Phường Hoàng Liệt (Quận Hoàng Mai)' },
      { code: '117', name: 'Phường Định Công', district: 'Quận Hoàng Mai', displayName: 'Phường Định Công (Quận Hoàng Mai)' },
      { code: '118', name: 'Phường Khương Mai', district: 'Quận Thanh Xuân', displayName: 'Phường Khương Mai (Quận Thanh Xuân)' },
      { code: '119', name: 'Phường Quang Trung', district: 'Quận Hà Đông', displayName: 'Phường Quang Trung (Quận Hà Đông)' },
      { code: '120', name: 'Phường Mộ Lao', district: 'Quận Hà Đông', displayName: 'Phường Mộ Lao (Quận Hà Đông)' },
      { code: '121', name: 'Thị trấn Đông Anh', district: 'Huyện Đông Anh', displayName: 'Thị trấn Đông Anh (Huyện Đông Anh)' },
      { code: '122', name: 'Thị trấn Trâu Quỳ', district: 'Huyện Gia Lâm', displayName: 'Thị trấn Trâu Quỳ (Huyện Gia Lâm)' },
    ],
  },
  {
    name: 'Thành phố Đà Nẵng',
    wards: [
      { code: '4801', name: 'Phường Hải Châu 1', district: 'Quận Hải Châu', displayName: 'Phường Hải Châu 1 (Quận Hải Châu)' },
      { code: '4802', name: 'Phường Thạch Thang', district: 'Quận Hải Châu', displayName: 'Phường Thạch Thang (Quận Hải Châu)' },
      { code: '4803', name: 'Phường Vĩnh Trung', district: 'Quận Thanh Khê', displayName: 'Phường Vĩnh Trung (Quận Thanh Khê)' },
      { code: '4804', name: 'Phường An Hải Bắc', district: 'Quận Sơn Trà', displayName: 'Phường An Hải Bắc (Quận Sơn Trà)' },
      { code: '4805', name: 'Phường Mỹ An', district: 'Quận Ngũ Hành Sơn', displayName: 'Phường Mỹ An (Quận Ngũ Hành Sơn)' },
      { code: '4806', name: 'Phường Hòa Khánh Bắc', district: 'Quận Liên Chiểu', displayName: 'Phường Hòa Khánh Bắc (Quận Liên Chiểu)' },
      { code: '4807', name: 'Phường Khuê Trung', district: 'Quận Cẩm Lệ', displayName: 'Phường Khuê Trung (Quận Cẩm Lệ)' },
      { code: '4808', name: 'Xã Hòa Châu', district: 'Huyện Hòa Vang', displayName: 'Xã Hòa Châu (Huyện Hòa Vang)' },
    ],
  },
  {
    name: 'Tỉnh Bình Dương',
    wards: [
      { code: '7401', name: 'Phường Phú Hòa', district: 'Thành phố Thủ Dầu Một', displayName: 'Phường Phú Hòa (Thành phố Thủ Dầu Một)' },
      { code: '7402', name: 'Phường Hiệp Thành', district: 'Thành phố Thủ Dầu Một', displayName: 'Phường Hiệp Thành (Thành phố Thủ Dầu Một)' },
      { code: '7403', name: 'Phường Lái Thiêu', district: 'Thành phố Thuận An', displayName: 'Phường Lái Thiêu (Thành phố Thuận An)' },
      { code: '7404', name: 'Phường An Phú', district: 'Thành phố Thuận An', displayName: 'Phường An Phú (Thành phố Thuận An)' },
      { code: '7405', name: 'Phường Dĩ An', district: 'Thành phố Dĩ An', displayName: 'Phường Dĩ An (Thành phố Dĩ An)' },
      { code: '7406', name: 'Phường Đông Hòa', district: 'Thành phố Dĩ An', displayName: 'Phường Đông Hòa (Thành phố Dĩ An)' },
      { code: '7407', name: 'Phường Mỹ Phước', district: 'Thị xã Bến Cát', displayName: 'Phường Mỹ Phước (Thị xã Bến Cát)' },
      { code: '7408', name: 'Phường Uyên Hưng', district: 'Thành phố Tân Uyên', displayName: 'Phường Uyên Hưng (Thành phố Tân Uyên)' },
    ],
  },
  {
    name: 'Tỉnh Đồng Nai',
    wards: [
      { code: '7501', name: 'Phường Quyết Thắng', district: 'Thành phố Biên Hòa', displayName: 'Phường Quyết Thắng (Thành phố Biên Hòa)' },
      { code: '7502', name: 'Phường Tân Phong', district: 'Thành phố Biên Hòa', displayName: 'Phường Tân Phong (Thành phố Biên Hòa)' },
      { code: '7503', name: 'Phường Trảng Dài', district: 'Thành phố Biên Hòa', displayName: 'Phường Trảng Dài (Thành phố Biên Hòa)' },
      { code: '7504', name: 'Phường Xuân An', district: 'Thành phố Long Khánh', displayName: 'Phường Xuân An (Thành phố Long Khánh)' },
      { code: '7505', name: 'Thị trấn Long Thành', district: 'Huyện Long Thành', displayName: 'Thị trấn Long Thành (Huyện Long Thành)' },
      { code: '7506', name: 'Thị trấn Hiệp Phước', district: 'Huyện Nhơn Trạch', displayName: 'Thị trấn Hiệp Phước (Huyện Nhơn Trạch)' },
      { code: '7507', name: 'Thị trấn Trảng Bom', district: 'Huyện Trảng Bom', displayName: 'Thị trấn Trảng Bom (Huyện Trảng Bom)' },
    ],
  },
  {
    name: 'Thành phố Cần Thơ',
    wards: [
      { code: '9201', name: 'Phường Tân An', district: 'Quận Ninh Kiều', displayName: 'Phường Tân An (Quận Ninh Kiều)' },
      { code: '9202', name: 'Phường An Khánh', district: 'Quận Ninh Kiều', displayName: 'Phường An Khánh (Quận Ninh Kiều)' },
      { code: '9203', name: 'Phường Bình Thủy', district: 'Quận Bình Thủy', displayName: 'Phường Bình Thủy (Quận Bình Thủy)' },
      { code: '9204', name: 'Phường Hưng Phú', district: 'Quận Cái Răng', displayName: 'Phường Hưng Phú (Quận Cái Răng)' },
      { code: '9205', name: 'Phường Châu Văn Liêm', district: 'Quận Ô Môn', displayName: 'Phường Châu Văn Liêm (Quận Ô Môn)' },
    ],
  },
  {
    name: 'Thành phố Hải Phòng',
    wards: [
      { code: '3101', name: 'Phường Hoàng Văn Thụ', district: 'Quận Hồng Bàng', displayName: 'Phường Hoàng Văn Thụ (Quận Hồng Bàng)' },
      { code: '3102', name: 'Phường Lạc Viên', district: 'Quận Ngô Quyền', displayName: 'Phường Lạc Viên (Quận Ngô Quyền)' },
      { code: '3103', name: 'Phường An Dương', district: 'Quận Lê Chân', displayName: 'Phường An Dương (Quận Lê Chân)' },
      { code: '3104', name: 'Phường Đằng Hải', district: 'Quận Hải An', displayName: 'Phường Đằng Hải (Quận Hải An)' },
      { code: '3105', name: 'Thị trấn Núi Đèo', district: 'Huyện Thủy Nguyên', displayName: 'Thị trấn Núi Đèo (Huyện Thủy Nguyên)' },
    ],
  },
  {
    name: 'Tỉnh Quảng Ninh',
    wards: [
      { code: '2201', name: 'Phường Bạch Đằng', district: 'Thành phố Hạ Long', displayName: 'Phường Bạch Đằng (Thành phố Hạ Long)' },
      { code: '2202', name: 'Phường Bãi Cháy', district: 'Thành phố Hạ Long', displayName: 'Phường Bãi Cháy (Thành phố Hạ Long)' },
      { code: '2203', name: 'Phường Cẩm Thành', district: 'Thành phố Cẩm Phả', displayName: 'Phường Cẩm Thành (Thành phố Cẩm Phả)' },
      { code: '2204', name: 'Phường Quang Trung', district: 'Thành phố Uông Bí', displayName: 'Phường Quang Trung (Thành phố Uông Bí)' },
      { code: '2205', name: 'Phường Ka Long', district: 'Thành phố Móng Cái', displayName: 'Phường Ka Long (Thành phố Móng Cái)' },
    ],
  },
  {
    name: 'Tỉnh Thừa Thiên Huế',
    wards: [
      { code: '4601', name: 'Phường Vĩnh Ninh', district: 'Thành phố Huế', displayName: 'Phường Vĩnh Ninh (Thành phố Huế)' },
      { code: '4602', name: 'Phường Phú Nhuận', district: 'Thành phố Huế', displayName: 'Phường Phú Nhuận (Thành phố Huế)' },
      { code: '4603', name: 'Phường Thuận Lộc', district: 'Thành phố Huế', displayName: 'Phường Thuận Lộc (Thành phố Huế)' },
      { code: '4604', name: 'Thị trấn Thuận An', district: 'Thành phố Huế', displayName: 'Thị trấn Thuận An (Thành phố Huế)' },
    ],
  },
  {
    name: 'Tỉnh Khánh Hòa',
    wards: [
      { code: '5601', name: 'Phường Lộc Thọ', district: 'Thành phố Nha Trang', displayName: 'Phường Lộc Thọ (Thành phố Nha Trang)' },
      { code: '5602', name: 'Phường Phương Sài', district: 'Thành phố Nha Trang', displayName: 'Phường Phương Sài (Thành phố Nha Trang)' },
      { code: '5603', name: 'Phường Vĩnh Hải', district: 'Thành phố Nha Trang', displayName: 'Phường Vĩnh Hải (Thành phố Nha Trang)' },
      { code: '5604', name: 'Phường Cam Phú', district: 'Thành phố Cam Ranh', displayName: 'Phường Cam Phú (Thành phố Cam Ranh)' },
    ],
  },
  {
    name: 'Tỉnh Nghệ An',
    wards: [
      { code: '4001', name: 'Phường Quang Trung', district: 'Thành phố Vinh', displayName: 'Phường Quang Trung (Thành phố Vinh)' },
      { code: '4002', name: 'Phường Lê Lợi', district: 'Thành phố Vinh', displayName: 'Phường Lê Lợi (Thành phố Vinh)' },
      { code: '4003', name: 'Phường Trường Thi', district: 'Thành phố Vinh', displayName: 'Phường Trường Thi (Thành phố Vinh)' },
      { code: '4004', name: 'Thị xã Cửa Lò', district: 'Thị xã Cửa Lò', displayName: 'Thị xã Cửa Lò' },
    ],
  },
  {
    name: 'Tỉnh Lâm Đồng',
    wards: [
      { code: '6801', name: 'Phường 1', district: 'Thành phố Đà Lạt', displayName: 'Phường 1 (Thành phố Đà Lạt)' },
      { code: '6802', name: 'Phường 2', district: 'Thành phố Đà Lạt', displayName: 'Phường 2 (Thành phố Đà Lạt)' },
      { code: '6803', name: 'Phường 9', district: 'Thành phố Đà Lạt', displayName: 'Phường 9 (Thành phố Đà Lạt)' },
      { code: '6804', name: 'Phường 1', district: 'Thành phố Bảo Lộc', displayName: 'Phường 1 (Thành phố Bảo Lộc)' },
      { code: '6805', name: 'Thị trấn Liên Nghĩa', district: 'Huyện Đức Trọng', displayName: 'Thị trấn Liên Nghĩa (Huyện Đức Trọng)' },
    ],
  },
  {
    name: 'Tỉnh Cao Bằng',
    wards: [
      { code: '401', name: 'Phường Hợp Giang', district: 'Thành phố Cao Bằng', displayName: 'Phường Hợp Giang (Thành phố Cao Bằng)' },
      { code: '402', name: 'Phường Sông Bằng', district: 'Thành phố Cao Bằng', displayName: 'Phường Sông Bằng (Thành phố Cao Bằng)' },
      { code: '403', name: 'Phường Đề Thám', district: 'Thành phố Cao Bằng', displayName: 'Phường Đề Thám (Thành phố Cao Bằng)' },
      { code: '404', name: 'Thị trấn Quảng Uyên', district: 'Huyện Quảng Hòa', displayName: 'Thị trấn Quảng Uyên (Huyện Quảng Hòa)' },
    ],
  },
];

export function getWardsForProvince(provinceName: string): AdminUnitWard[] {
  if (!provinceName) return [];
  const normalized = provinceName.trim().toLowerCase();
  const matched = VIETNAM_ADMINISTRATIVE_DATA.find((p) => {
    const pNorm = p.name.toLowerCase();
    return pNorm.includes(normalized) || normalized.includes(pNorm);
  });
  if (matched && matched.wards.length > 0) {
    return matched.wards;
  }
  // Default general wards if province has no specific list yet
  return [
    { code: '01', name: 'Phường 1', displayName: 'Phường 1' },
    { code: '02', name: 'Phường 2', displayName: 'Phường 2' },
    { code: '03', name: 'Phường 3', displayName: 'Phường 3' },
    { code: '04', name: 'Xã Trung Tâm', displayName: 'Xã Trung Tâm' },
    { code: '05', name: 'Thị Trấn Huyện Lỵ', displayName: 'Thị Trấn Huyện Lỵ' },
  ];
}

export function findMatchingHubsForLocation(
  hubs: HubRecord[],
  provinceName: string,
): HubRecord[] {
  if (!hubs || hubs.length === 0) return [];
  const normalized = provinceName.trim().toLowerCase();
  const filtered = hubs.filter((h) => {
    const hp = (h.province || '').toLowerCase();
    const hn = (h.name || '').toLowerCase();
    return (
      hp.includes(normalized) ||
      normalized.includes(hp) ||
      hn.includes(normalized) ||
      normalized.includes(hn)
    );
  });

  if (filtered.length > 0) {
    return filtered;
  }

  // Fallback: return any available hub
  return hubs.slice(0, 5);
}
