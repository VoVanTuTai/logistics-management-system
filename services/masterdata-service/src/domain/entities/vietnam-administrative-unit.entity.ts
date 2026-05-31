export interface VietnamWard {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  provinceCode: number;
}

export interface VietnamProvince {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  phoneCode: number | null;
  wards: VietnamWard[];
}
