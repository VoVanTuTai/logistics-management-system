import type { CurrentLocation } from './current-location.entity';
import type { ScanEvent } from './scan-event.entity';

export type ScanPublishedEventType =
  | 'scan.pickup_confirmed'
  | 'scan.inbound'
  | 'scan.outbound'
  | 'location.updated';

export interface ScanEventEnvelope {
  event_id: string;
  event_type: ScanPublishedEventType;
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
  eventType: ScanPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: ScanEventEnvelope;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueOutboxEventInput {
  eventId: string;
  eventType: ScanPublishedEventType;
  routingKey: string;
  aggregateType: string;
  aggregateId: string;
  payload: ScanEventEnvelope;
  occurredAt: Date;
}

export interface BuildLocationUpdatedEventInput {
  currentLocation: CurrentLocation;
  idempotencyKey: string;
}

export interface BuildScanPublishedEventInput {
  eventType: Extract<
    ScanPublishedEventType,
    'scan.pickup_confirmed' | 'scan.inbound' | 'scan.outbound'
  >;
  scanEvent: ScanEvent;
}
