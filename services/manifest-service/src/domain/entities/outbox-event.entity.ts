export type ManifestPublishedEventType = 'manifest.sealed' | 'manifest.received';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface ManifestEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: ManifestPublishedEventType;
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
  eventType: ManifestPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: ManifestEventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: ManifestPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: ManifestEventEnvelope;
  occurredAt: Date;
}
