export interface ProvinceOption {
  code: string;
  label: string;
  districts: string[];
}

export const PROVINCE_OPTIONS: ProvinceOption[] = [
  {
    code: 'HO_CHI_MINH',
    label: 'Hồ Chí Minh',
    districts: [
      'Quận 1',
      'Quận 3',
      'Quận 7',
      'Bình Thạnh',
      'Tân Bình',
      'Thủ Đức',
    ],
  },
  {
    code: 'DA_NANG',
    label: 'Đà Nẵng',
    districts: [
      'Hải Châu',
      'Thanh Khê',
      'Liên Chiểu',
      'Ngũ Hành Sơn',
      'Sơn Trà',
      'Cẩm Lệ',
    ],
  },
  {
    code: 'HA_NOI',
    label: 'Hà Nội',
    districts: ['Ba Đình', 'Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hà Đông'],
  },
];

export function getDistrictOptions(provinceLabel: string): string[] {
  const province = PROVINCE_OPTIONS.find((item) => item.label === provinceLabel);
  if (!province) {
    return [];
  }

  return province.districts;
}
