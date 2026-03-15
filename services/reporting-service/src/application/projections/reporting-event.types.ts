export interface ReportingEventEnvelope {
  event_id: string;
  event_type: string;
  occurred_at: string;
  shipment_code: string | null;
  actor: string | null;
  location: Record<string, unknown> | null;
  data: Record<string, unknown>;
  idempotency_key: string;
}

export interface ProjectionResult {
  projected: boolean;
  eventId: string;
  eventType: string;
}
