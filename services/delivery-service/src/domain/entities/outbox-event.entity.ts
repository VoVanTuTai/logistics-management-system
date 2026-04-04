export type DeliveryPublishedEventType =
  | 'delivery.attempted'
  | 'delivery.delivered'
  | 'delivery.failed'
  | 'ndr.created'
  | 'return.started'
  | 'return.completed';

export interface DeliveryEventEnvelope {
  event_id: string;
  event_type: DeliveryPublishedEventType;
  occurred_at: string;
  shipment_code: string | null;
  actor: string | null;
  location: Record<string, unknown> | null;
  data: Record<string, unknown>;
  idempotency_key: string;
}

export interface OutboxEvent {
  id: string;
  eventId: string;
  eventType: DeliveryPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: DeliveryEventEnvelope;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: DeliveryPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: DeliveryEventEnvelope;
  occurredAt: Date;
}
