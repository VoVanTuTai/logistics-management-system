export type ConfigPrimitive = string | number | boolean | null;

export type ConfigValue =
  | ConfigPrimitive
  | ConfigValue[]
  | { [key: string]: ConfigValue };

interface MasterdataBaseDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubDto extends MasterdataBaseDto {
  code: string;
  name: string;
  level?: number;
  parentCode?: string | null;
  zoneCode: string | null;
  address: string | null;
  district?: string | null;
  ward?: string | null;
  coverageRadiusKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface ZoneDto extends MasterdataBaseDto {
  code: string;
  name: string;
  parentCode: string | null;
  isActive: boolean;
}

export interface NdrReasonDto extends MasterdataBaseDto {
  code: string;
  description: string;
  isActive: boolean;
}

export interface ConfigDto extends MasterdataBaseDto {
  key: string;
  value: ConfigValue;
  scope: string | null;
  description: string | null;
}

export interface HubFilters {
  code?: string;
  name?: string;
  zoneCode?: string;
  isActive?: string;
  q?: string;
}

export interface ZoneFilters {
  code?: string;
  name?: string;
  parentCode?: string;
  isActive?: string;
  q?: string;
}

export interface NdrReasonFilters {
  code?: string;
  description?: string;
  isActive?: string;
  q?: string;
}

export interface ConfigFilters {
  key?: string;
  scope?: string;
  q?: string;
}

export interface HubWriteInput {
  code: string;
  name: string;
  zoneCode?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface ZoneWriteInput {
  code: string;
  name: string;
  parentCode?: string | null;
  isActive?: boolean;
}

export interface NdrReasonWriteInput {
  code: string;
  description: string;
  isActive?: boolean;
}

export interface ConfigWriteInput {
  key: string;
  value: ConfigValue;
  scope?: string | null;
  description?: string | null;
}

export interface CourierAreaAssignmentDto {
  id: string;
  courierId: string;
  hubCode: string;
  province: string;
  district: string;
  ward: string;
  zoneName?: string | null;
  colorHex?: string | null;
  boundaryPolygon?: Array<[number, number]> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierAreaAssignmentFilters {
  courierId?: string;
  hubCode?: string;
  province?: string;
  district?: string;
  ward?: string;
  isActive?: string;
}

export interface CourierAreaAssignmentWriteInput {
  courierId: string;
  hubCode: string;
  province: string;
  district: string;
  ward: string;
  zoneName?: string | null;
  colorHex?: string | null;
  boundaryPolygon?: Array<[number, number]> | null;
  isActive?: boolean;
}

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

export interface RegionalHierarchyItemDto {
  regionKey: 'NORTH' | 'CENTRAL' | 'SOUTH';
  regionName: string;
  zoneCode: string;
  regionalHub: HubDto | null;
  provincesCount: number;
  provinces: string[];
  branchHubsCount: number;
  branchHubs: HubDto[];
  totalHubsCount: number;
}
