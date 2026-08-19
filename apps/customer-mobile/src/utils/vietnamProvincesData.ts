export interface FallbackWard {
  code: number;
  name: string;
  codename: string;
  provinceCode?: number;
}

export interface FallbackProvince {
  code: number;
  name: string;
  codename: string;
  divisionType?: string;
  phoneCode?: number | null;
  wards?: FallbackWard[];
}

export const FALLBACK_VIETNAM_PROVINCES: FallbackProvince[] = [
  {
    code: 1,
    name: 'Thành phố Hà Nội',
    codename: 'ha_noi',
    wards: [
      { code: 101, name: 'Quận Ba Đình', codename: 'quan_ba_dinh', provinceCode: 1 },
      { code: 102, name: 'Quận Hoàn Kiếm', codename: 'quan_hoan_kiem', provinceCode: 1 },
      { code: 103, name: 'Quận Tây Hồ', codename: 'quan_tay_ho', provinceCode: 1 },
      { code: 104, name: 'Quận Long Biên', codename: 'quan_long_bien', provinceCode: 1 },
      { code: 105, name: 'Quận Cầu Giấy', codename: 'quan_cau_giay', provinceCode: 1 },
      { code: 106, name: 'Quận Đống Đa', codename: 'quan_dong_da', provinceCode: 1 },
      { code: 107, name: 'Quận Hai Bà Trưng', codename: 'quan_hai_ba_trung', provinceCode: 1 },
      { code: 108, name: 'Quận Hoàng Mai', codename: 'quan_hoang_mai', provinceCode: 1 },
      { code: 109, name: 'Quận Thanh Xuân', codename: 'quan_thanh_xuan', provinceCode: 1 },
      { code: 110, name: 'Quận Hà Đông', codename: 'quan_ha_dong', provinceCode: 1 },
      { code: 111, name: 'Quận Nam Từ Liêm', codename: 'quan_nam_tu_liem', provinceCode: 1 },
      { code: 112, name: 'Quận Bắc Từ Liêm', codename: 'quan_bac_tu_liem', provinceCode: 1 },
      { code: 113, name: 'Thị xã Sơn Tây', codename: 'thi_xa_son_tay', provinceCode: 1 },
      { code: 114, name: 'Huyện Đông Anh', codename: 'huyen_dong_anh', provinceCode: 1 },
      { code: 115, name: 'Huyện Gia Lâm', codename: 'huyen_gia_lam', provinceCode: 1 },
      { code: 116, name: 'Huyện Sóc Sơn', codename: 'huyen_soc_son', provinceCode: 1 },
      { code: 117, name: 'Huyện Thanh Trì', codename: 'huyen_thanh_tri', provinceCode: 1 },
      { code: 118, name: 'Huyện Hoài Đức', codename: 'huyen_hoai_duc', provinceCode: 1 },
    ],
  },
  {
    code: 4,
    name: 'Tỉnh Cao Bằng',
    codename: 'cao_bang',
    wards: [
      { code: 401, name: 'Thành phố Cao Bằng', codename: 'thanh_pho_cao_bang', provinceCode: 4 },
      { code: 402, name: 'Huyện Bảo Lâm', codename: 'huyen_bao_lam', provinceCode: 4 },
      { code: 403, name: 'Huyện Bảo Lạc', codename: 'huyen_bao_lac', provinceCode: 4 },
      { code: 404, name: 'Huyện Hà Quảng', codename: 'huyen_ha_quang', provinceCode: 4 },
      { code: 405, name: 'Huyện Trùng Khánh', codename: 'huyen_trong_khanh', provinceCode: 4 },
      { code: 406, name: 'Huyện Hạ Lang', codename: 'huyen_ha_lang', provinceCode: 4 },
      { code: 407, name: 'Huyện Quảng Hòa', codename: 'huyen_quang_hoa', provinceCode: 4 },
      { code: 408, name: 'Huyện Hòa An', codename: 'huyen_hoa_an', provinceCode: 4 },
      { code: 409, name: 'Huyện Nguyên Bình', codename: 'huyen_nguyen_binh', provinceCode: 4 },
      { code: 410, name: 'Huyện Thạch An', codename: 'huyen_thach_an', provinceCode: 4 },
    ],
  },
  {
    code: 79,
    name: 'Thành phố Hồ Chí Minh',
    codename: 'ho_chi_minh',
    wards: [
      { code: 7901, name: 'Quận 1', codename: 'quan_1', provinceCode: 79 },
      { code: 7902, name: 'Quận 3', codename: 'quan_3', provinceCode: 79 },
      { code: 7903, name: 'Quận 4', codename: 'quan_4', provinceCode: 79 },
      { code: 7904, name: 'Quận 5', codename: 'quan_5', provinceCode: 79 },
      { code: 7905, name: 'Quận 6', codename: 'quan_6', provinceCode: 79 },
      { code: 7906, name: 'Quận 7', codename: 'quan_7', provinceCode: 79 },
      { code: 7907, name: 'Quận 8', codename: 'quan_8', provinceCode: 79 },
      { code: 7908, name: 'Quận 10', codename: 'quan_10', provinceCode: 79 },
      { code: 7909, name: 'Quận 11', codename: 'quan_11', provinceCode: 79 },
      { code: 7910, name: 'Quận 12', codename: 'quan_12', provinceCode: 79 },
      { code: 7911, name: 'Thành phố Thủ Đức', codename: 'thanh_pho_thu_duc', provinceCode: 79 },
      { code: 7912, name: 'Quận Bình Thạnh', codename: 'quan_binh_thanh', provinceCode: 79 },
      { code: 7913, name: 'Quận Tân Bình', codename: 'quan_tan_binh', provinceCode: 79 },
      { code: 7914, name: 'Quận Tân Phú', codename: 'quan_tan_phu', provinceCode: 79 },
      { code: 7915, name: 'Quận Gò Vấp', codename: 'quan_go_vap', provinceCode: 79 },
      { code: 7916, name: 'Quận Phú Nhuận', codename: 'quan_phu_nhuan', provinceCode: 79 },
      { code: 7917, name: 'Quận Bình Tân', codename: 'quan_binh_tan', provinceCode: 79 },
      { code: 7918, name: 'Huyện Bình Chánh', codename: 'huyen_binh_chanh', provinceCode: 79 },
      { code: 7919, name: 'Huyện Củ Chi', codename: 'huyen_cu_chi', provinceCode: 79 },
      { code: 7920, name: 'Huyện Hóc Môn', codename: 'huyen_hoc_mon', provinceCode: 79 },
      { code: 7921, name: 'Huyện Nhà Bè', codename: 'huyen_nha_be', provinceCode: 79 },
    ],
  },
  {
    code: 48,
    name: 'Thành phố Đà Nẵng',
    codename: 'da_nang',
    wards: [
      { code: 4801, name: 'Quận Hải Châu', codename: 'quan_hai_chau', provinceCode: 48 },
      { code: 4802, name: 'Quận Thanh Khê', codename: 'quan_thanh_khe', provinceCode: 48 },
      { code: 4803, name: 'Quận Sơn Trà', codename: 'quan_son_tra', provinceCode: 48 },
      { code: 4804, name: 'Quận Ngũ Hành Sơn', codename: 'quan_ngu_hanh_son', provinceCode: 48 },
      { code: 4805, name: 'Quận Liên Chiểu', codename: 'quan_lien_chieu', provinceCode: 48 },
      { code: 4806, name: 'Quận Cẩm Lệ', codename: 'quan_cam_le', provinceCode: 48 },
      { code: 4807, name: 'Huyện Hòa Vang', codename: 'huyen_hoa_vang', provinceCode: 48 },
    ],
  },
  {
    code: 31,
    name: 'Thành phố Hải Phòng',
    codename: 'hai_phong',
    wards: [
      { code: 3101, name: 'Quận Hồng Bàng', codename: 'quan_hong_bang', provinceCode: 31 },
      { code: 3102, name: 'Quận Ngô Quyền', codename: 'quan_ngo_quyen', provinceCode: 31 },
      { code: 3103, name: 'Quận Lê Chân', codename: 'quan_le_chan', provinceCode: 31 },
      { code: 3104, name: 'Quận Hải An', codename: 'quan_hai_an', provinceCode: 31 },
      { code: 3105, name: 'Quận Kiến An', codename: 'quan_kien_an', provinceCode: 31 },
      { code: 3106, name: 'Quận Đồ Sơn', codename: 'quan_do_son', provinceCode: 31 },
      { code: 3107, name: 'Quận Dương Kinh', codename: 'quan_duong_kinh', provinceCode: 31 },
      { code: 3108, name: 'Huyện Thủy Nguyên', codename: 'huyen_thuy_nguyen', provinceCode: 31 },
      { code: 3109, name: 'Huyện An Dương', codename: 'huyen_an_duong', provinceCode: 31 },
    ],
  },
  {
    code: 92,
    name: 'Thành phố Cần Thơ',
    codename: 'can_tho',
    wards: [
      { code: 9201, name: 'Quận Ninh Kiều', codename: 'quan_ninh_kieu', provinceCode: 92 },
      { code: 9202, name: 'Quận Bình Thủy', codename: 'quan_binh_thuy', provinceCode: 92 },
      { code: 9203, name: 'Quận Cái Răng', codename: 'quan_cai_rang', provinceCode: 92 },
      { code: 9204, name: 'Quận Ô Môn', codename: 'quan_o_mon', provinceCode: 92 },
      { code: 9205, name: 'Quận Thốt Nốt', codename: 'quan_thot_not', provinceCode: 92 },
      { code: 9206, name: 'Huyện Phong Điền', codename: 'huyen_phong_dien', provinceCode: 92 },
    ],
  },
  {
    code: 24,
    name: 'Tỉnh Bắc Ninh',
    codename: 'bac_ninh',
    wards: [
      { code: 2401, name: 'Thành phố Bắc Ninh', codename: 'thanh_pho_bac_ninh', provinceCode: 24 },
      { code: 2402, name: 'Thị xã Từ Sơn', codename: 'thi_xa_tu_son', provinceCode: 24 },
      { code: 2403, name: 'Huyện Yên Phong', codename: 'huyen_yen_phong', provinceCode: 24 },
      { code: 2404, name: 'Huyện Quế Võ', codename: 'huyen_que_vo', provinceCode: 24 },
      { code: 2405, name: 'Huyện Tiên Du', codename: 'huyen_tien_du', provinceCode: 24 },
      { code: 2406, name: 'Huyện Thuận Thành', codename: 'huyen_thuan_thanh', provinceCode: 24 },
    ],
  },
  {
    code: 75,
    name: 'Tỉnh Đồng Nai',
    codename: 'dong_nai',
    wards: [
      { code: 7501, name: 'Thành phố Biên Hòa', codename: 'thanh_pho_bien_hoa', provinceCode: 75 },
      { code: 7502, name: 'Thành phố Long Khánh', codename: 'thanh_pho_long_khanh', provinceCode: 75 },
      { code: 7503, name: 'Huyện Nhơn Trạch', codename: 'huyen_nhon_trach', provinceCode: 75 },
      { code: 7504, name: 'Huyện Long Thành', codename: 'huyen_long_thanh', provinceCode: 75 },
      { code: 7505, name: 'Huyện Trảng Bom', codename: 'huyen_trang_bom', provinceCode: 75 },
    ],
  },
  {
    code: 68,
    name: 'Tỉnh Lâm Đồng',
    codename: 'lam_dong',
    wards: [
      { code: 6801, name: 'Thành phố Đà Lạt', codename: 'thanh_pho_da_lat', provinceCode: 68 },
      { code: 6802, name: 'Thành phố Bảo Lộc', codename: 'thanh_pho_bao_loc', provinceCode: 68 },
      { code: 6803, name: 'Huyện Đức Trọng', codename: 'huyen_duc_trong', provinceCode: 68 },
      { code: 6804, name: 'Huyện Di Linh', codename: 'huyen_di_linh', provinceCode: 68 },
    ],
  },
];
