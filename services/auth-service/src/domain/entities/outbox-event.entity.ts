import type { AuthSession } from './auth-session.entity';

export type AuthPublishedEventType =
  | 'auth.session_created'
  | 'auth.session_refreshed'
  | 'auth.session_revoked';

export interface AuthEventEnvelope {
  event_id: string;
  event_type: AuthPublishedEventType;
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
  eventType: AuthPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: AuthEventEnvelope;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: AuthPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: AuthEventEnvelope;
  occurredAt: Date;
}

export interface AuthSessionEventInput {
  session: AuthSession;
  actor: string;
}
