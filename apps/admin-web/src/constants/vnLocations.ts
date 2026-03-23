export interface ProvinceOption {
  code: string;
  label: string;
  districts: string[];
}

export const PROVINCE_OPTIONS: ProvinceOption[] = [
  {
    code: 'HO_CHI_MINH',
    label: 'Ho Chi Minh',
    districts: [
      'District 1',
      'District 3',
      'District 7',
      'Binh Thanh',
      'Tan Binh',
      'Thu Duc',
    ],
  },
  {
    code: 'DA_NANG',
    label: 'Da Nang',
    districts: [
      'Hai Chau',
      'Thanh Khe',
      'Lien Chieu',
      'Ngu Hanh Son',
      'Son Tra',
      'Cam Le',
    ],
  },
  {
    code: 'HA_NOI',
    label: 'Ha Noi',
    districts: ['Ba Dinh', 'Hoan Kiem', 'Cau Giay', 'Dong Da', 'Hai Ba Trung', 'Ha Dong'],
  },
];

export function getDistrictOptions(provinceLabel: string): string[] {
  const province = PROVINCE_OPTIONS.find((item) => item.label === provinceLabel);
  if (!province) {
    return [];
  }

  return province.districts;
}

