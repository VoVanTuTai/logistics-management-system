export interface CourierAreaAssignment {
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
  createdAt: Date;
  updatedAt: Date;
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

export interface CourierAreaAssignmentListFilters {
  courierId?: string;
  hubCode?: string;
  province?: string;
  district?: string;
  ward?: string;
  isActive?: boolean;
}

