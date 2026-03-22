export interface SealRecordSnapshot {
  id: string;
  manifestId: string;
  sealedBy: string | null;
  note: string | null;
  sealedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
