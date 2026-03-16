export interface TrackingTimelineEventDto {
  id: string;
  eventType: string;
  eventSource: string;
  statusAfterEvent: string | null;
  locationCode: string | null;
  occurredAt: string;
}

export interface TrackingCurrentDto {
  shipmentCode: string;
  currentStatus: string | null;
  currentLocation: string | null;
  updatedAt: string | null;
}

export interface TrackingLookupResultDto {
  current: TrackingCurrentDto | null;
  timeline: TrackingTimelineEventDto[];
}

