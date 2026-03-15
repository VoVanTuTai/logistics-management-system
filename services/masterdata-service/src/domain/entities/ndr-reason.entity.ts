export interface NdrReason {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NdrReasonWriteInput {
  code: string;
  description: string;
  isActive?: boolean;
}
