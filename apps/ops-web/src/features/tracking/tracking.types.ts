export interface TrackingTimelineEventDto {
  id: string;
  eventTypeCode?: string;
  eventType: string;
  eventSource: string;
  statusAfterEventCode: string | null;
  statusAfterEvent: string | null;
  locationCode: string | null;
  locationText?: string | null;
  occurredAt: string;
  note?: string | null;
}

export interface TrackingCurrentDto {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocation: string | null;
  currentLocationText?: string | null;
  lastEventTypeCode?: string | null;
  lastEventType?: string | null;
  updatedAt: string | null;
}

export interface TrackingLookupResultDto {
  current: TrackingCurrentDto | null;
  timeline: TrackingTimelineEventDto[];
}

export interface TrackingSearchResultDto {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocation: string | null;
  currentLocationText?: string | null;
  lastEventTypeCode?: string | null;
  lastEventType?: string | null;
  updatedAt: string | null;
}

export type OperationEntityTypeDto = 'SHIPMENT' | 'MANIFEST' | 'TRIP';

export interface OperationTimelineFiltersDto {
  entityType?: OperationEntityTypeDto;
  entityCode?: string;
  shipmentCode?: string;
  manifestCode?: string;
  tripCode?: string;
  eventType?: string;
  limit?: number;
}

export interface OperationTimelineEventDto extends TrackingTimelineEventDto {
  entityType: OperationEntityTypeDto;
  entityCode: string;
  relatedShipmentCode: string | null;
  relatedManifestCode: string | null;
  relatedTripCode: string | null;
}
