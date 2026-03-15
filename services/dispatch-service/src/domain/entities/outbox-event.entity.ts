export type DispatchPublishedEventType =
  | 'task.created'
  | 'task.assigned'
  | 'task.reassigned'
  | 'task.completed'
  | 'task.cancelled';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface DispatchEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: DispatchPublishedEventType;
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
  eventType: DispatchPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: DispatchEventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: DispatchPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: DispatchEventEnvelope;
  occurredAt: Date;
}
