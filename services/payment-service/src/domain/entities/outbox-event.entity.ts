export type PaymentPublishedEventType =
  | 'cod.collected'
  | 'cod.collection_failed'
  | 'cod.remitted';

export interface PaymentEventEnvelope {
  event_id: string;
  event_type: PaymentPublishedEventType;
  occurred_at: string;
  shipment_code: string | null;
  actor: string | null;
  data: Record<string, unknown>;
  idempotency_key: string;
}

export interface OutboxEvent {
  id: string;
  eventId: string;
  eventType: string;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: PaymentEventEnvelope;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: string;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: PaymentEventEnvelope;
  occurredAt: Date;
}
