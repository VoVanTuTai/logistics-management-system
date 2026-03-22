export interface TrackingEventEnvelope {
  event_id: string;
  event_type: string;
  occurred_at: string;
  shipment_code: string | null;
  actor: string | Record<string, unknown> | null;
  location: Record<string, unknown> | null;
  data: Record<string, unknown>;
  idempotency_key: string;
}

export interface TimelineEvent {
  id: string;
  eventId: string;
  eventType: string;
  shipmentCode: string;
  actor: string | null;
  locationCode: string | null;
  payload: TrackingEventEnvelope;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
