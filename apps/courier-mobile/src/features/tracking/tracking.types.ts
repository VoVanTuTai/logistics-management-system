export interface TrackingTimelineEventDto {
  id: string;
  eventTypeCode: string;
  eventType: string;
  eventSource: string;
  statusAfterEventCode: string | null;
  statusAfterEvent: string | null;
  locationCode: string | null;
  locationText: string | null;
  occurredAt: string;
}

export interface TrackingCurrentDto {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText: string | null;
  lastEventTypeCode: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  updatedAt: string;
}

export interface TrackingLookupResultDto {
  current: TrackingCurrentDto;
  timeline: TrackingTimelineEventDto[];
}
