export type ShipmentPublishedEventType =
  | 'shipment.created'
  | 'shipment.updated'
  | 'shipment.cancelled'
  | 'shipment.change_requested'
  | 'shipment.change_approved';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface ShipmentEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: ShipmentPublishedEventType;
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
  eventType: ShipmentPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: ShipmentEventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: ShipmentPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: ShipmentEventEnvelope;
  occurredAt: Date;
}
