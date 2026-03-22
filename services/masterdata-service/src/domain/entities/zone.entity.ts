export interface Zone {
  id: string;
  code: string;
  name: string;
  parentCode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneWriteInput {
  code: string;
  name: string;
  parentCode?: string | null;
  isActive?: boolean;
}

export interface ZoneListFilters {
  code?: string;
  name?: string;
  parentCode?: string;
  isActive?: boolean;
  q?: string;
}
