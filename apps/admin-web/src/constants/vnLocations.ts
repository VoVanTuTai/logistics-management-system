export interface ProvinceOption {
  code: string;
  label: string;
  districts: string[];
}

export const PROVINCE_OPTIONS: ProvinceOption[] = [
  {
    code: 'HA_NOI',
    label: 'Ha Noi',
    districts: ['Ba Dinh', 'Cau Giay', 'Dong Da', 'Ha Dong', 'Hoang Mai', 'Long Bien'],
  },
  {
    code: 'HO_CHI_MINH',
    label: 'Ho Chi Minh',
    districts: ['District 1', 'District 3', 'Binh Thanh', 'Go Vap', 'Tan Binh', 'Thu Duc'],
  },
  {
    code: 'DA_NANG',
    label: 'Da Nang',
    districts: ['Hai Chau', 'Thanh Khe', 'Lien Chieu', 'Ngu Hanh Son', 'Son Tra', 'Cam Le'],
  },
  {
    code: 'HAI_PHONG',
    label: 'Hai Phong',
    districts: ['Hong Bang', 'Le Chan', 'Ngo Quyen', 'Hai An', 'Kien An', 'Duong Kinh'],
  },
  {
    code: 'CAN_THO',
    label: 'Can Tho',
    districts: ['Ninh Kieu', 'Binh Thuy', 'Cai Rang', 'O Mon', 'Thot Not'],
  },
  {
    code: 'BINH_DUONG',
    label: 'Binh Duong',
    districts: ['Thu Dau Mot', 'Di An', 'Thuan An', 'Ben Cat', 'Tan Uyen'],
  },
  {
    code: 'DONG_NAI',
    label: 'Dong Nai',
    districts: ['Bien Hoa', 'Long Khanh', 'Trang Bom', 'Nhon Trach', 'Long Thanh'],
  },
  {
    code: 'BAC_NINH',
    label: 'Bac Ninh',
    districts: ['Bac Ninh', 'Tu Son', 'Yen Phong', 'Tien Du', 'Que Vo'],
  },
];

export function getDistrictOptions(provinceLabel: string): string[] {
  const province = PROVINCE_OPTIONS.find((item) => item.label === provinceLabel);
  if (!province) {
    return [];
  }

  return province.districts;
}

