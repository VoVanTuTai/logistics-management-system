import type { RecordScanResultSnapshot } from './scan-event.entity';

export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  scope: string;
  responsePayload: RecordScanResultSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdempotencyRecordInput {
  idempotencyKey: string;
  scope: string;
  responsePayload: RecordScanResultSnapshot;
}
