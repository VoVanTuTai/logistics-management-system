export type MasterdataEventType = 'masterdata.updated' | 'ndr-reason.updated';
export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface MasterdataEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: MasterdataEventType;
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
  eventType: MasterdataEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: MasterdataEventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: MasterdataEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: MasterdataEventEnvelope;
  occurredAt: Date;
}
