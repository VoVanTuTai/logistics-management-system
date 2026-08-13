export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  defaultAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfileListFilters {
  userId?: string;
  phone?: string;
  q?: string;
}

export interface CustomerProfileWriteInput {
  userId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  defaultAddress?: string | null;
}
