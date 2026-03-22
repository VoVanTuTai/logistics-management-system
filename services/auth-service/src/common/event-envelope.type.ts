export interface DomainEventEnvelope<TData = Record<string, unknown>> {
  event_id: string;
  event_type: string;
  occurred_at: string;
  shipment_code: string | null;
  actor: string | null;
  location: Record<string, unknown> | null;
  data: TData;
  idempotency_key: string;
}
