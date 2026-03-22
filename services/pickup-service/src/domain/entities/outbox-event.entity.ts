export type PickupPublishedEventType =
  | 'pickup.requested'
  | 'pickup.approved'
  | 'pickup.updated'
  | 'pickup.cancelled'
  | 'pickup.completed';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface PickupEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: PickupPublishedEventType;
  occurred_at: string;
  shipment_code: string | null;
  actor: Record<string, unknown> | null;
  location: Record<string, unknown> | null;
  data: TData;
  idempotency_key: string;
}

export interface OutboxEvent {
  id: string;
  eventId: string;
  eventType: PickupPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: PickupEventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: PickupPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: PickupEventEnvelope;
  occurredAt: Date;
}
