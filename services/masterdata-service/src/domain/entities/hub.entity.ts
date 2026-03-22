export interface Hub {
  id: string;
  code: string;
  name: string;
  zoneCode: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HubWriteInput {
  code: string;
  name: string;
  zoneCode?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface HubListFilters {
  code?: string;
  name?: string;
  zoneCode?: string;
  isActive?: boolean;
  q?: string;
}
