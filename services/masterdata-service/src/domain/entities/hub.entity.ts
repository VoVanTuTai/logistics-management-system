export interface Hub {
  id: string;
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
  zoneCode: string | null;
  address: string | null;
  district: string | null;
  ward: string | null;
  coverageRadiusKm: number | null;
  boundaryPolygon: unknown | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HubWriteInput {
  code?: string;
  name: string;
  level?: number;
  parentCode?: string | null;
  zoneCode?: string | null;
  address?: string | null;
  district?: string | null;
  ward?: string | null;
  coverageRadiusKm?: number | null;
  boundaryPolygon?: unknown | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export interface HubCreateInput extends HubWriteInput {
  code: string;
}

export interface HubListFilters {
  code?: string;
  name?: string;
  zoneCode?: string;
  isActive?: boolean;
  q?: string;
}
