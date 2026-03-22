import type {
  DeliveryFailResultSnapshot,
  DeliverySuccessResultSnapshot,
} from './delivery-attempt.entity';

export type DeliveryOperationSnapshot =
  | DeliverySuccessResultSnapshot
  | DeliveryFailResultSnapshot;

export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  scope: string;
  responsePayload: DeliveryOperationSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdempotencyRecordInput {
  idempotencyKey: string;
  scope: string;
  responsePayload: DeliveryOperationSnapshot;
}
