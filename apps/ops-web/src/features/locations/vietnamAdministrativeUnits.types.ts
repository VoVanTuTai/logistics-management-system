export interface VietnamWardDto {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  provinceCode: number;
}

export interface VietnamProvinceDto {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  phoneCode: number | null;
  wards: VietnamWardDto[];
}
