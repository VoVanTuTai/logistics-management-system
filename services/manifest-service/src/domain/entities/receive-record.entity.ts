export interface ReceiveRecordSnapshot {
  id: string;
  manifestId: string;
  receivedBy: string | null;
  note: string | null;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
