import type { TrackingEventEnvelope } from './timeline-event.entity';

export type OperationEntityType = 'SHIPMENT' | 'MANIFEST' | 'TRIP';

export interface OperationTimelineEvent {
  id: string;
  eventId: string;
  eventType: string;
  entityType: OperationEntityType;
  entityCode: string;
  relatedShipmentCode: string | null;
  relatedManifestCode: string | null;
  relatedTripCode: string | null;
  status: string | null;
  actor: string | null;
  locationCode: string | null;
  payload: TrackingEventEnvelope;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperationTimelineFilters {
  entityType?: OperationEntityType;
  entityCode?: string;
  shipmentCode?: string;
  manifestCode?: string;
  tripCode?: string;
  eventType?: string;
  limit?: number;
}
