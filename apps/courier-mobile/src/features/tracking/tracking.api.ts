import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  TrackingCurrentDto,
  TrackingLookupResultDto,
  TrackingTimelineEventDto,
} from './tracking.types';

interface TrackingCurrentApiResponse {
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

interface TrackingTimelineApiResponse {
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

function mapCurrent(payload: TrackingCurrentApiResponse): TrackingCurrentDto {
  return {
    shipmentCode: payload.shipmentCode,
    currentStatusCode: payload.currentStatusCode,
    currentStatus: payload.currentStatus,
    currentLocationCode: payload.currentLocationCode,
    currentLocationText: payload.currentLocationText,
    lastEventTypeCode: payload.lastEventTypeCode,
    lastEventType: payload.lastEventType,
    lastEventAt: payload.lastEventAt,
    updatedAt: payload.updatedAt,
  };
}

function mapTimelineEvent(
  payload: TrackingTimelineApiResponse,
): TrackingTimelineEventDto {
  return {
    id: payload.id,
    eventTypeCode: payload.eventTypeCode,
    eventType: payload.eventType,
    eventSource: payload.eventSource,
    statusAfterEventCode: payload.statusAfterEventCode,
    statusAfterEvent: payload.statusAfterEvent,
    locationCode: payload.locationCode,
    locationText: payload.locationText,
    occurredAt: payload.occurredAt,
  };
}

export const trackingApi = {
  lookup: async (
    accessToken: string,
    shipmentCode: string,
  ): Promise<TrackingLookupResultDto> => {
    const [current, timeline] = await Promise.all([
      courierApiClient
        .request<TrackingCurrentApiResponse>(
          courierEndpoints.tracking.current(shipmentCode),
          { accessToken },
        )
        .then(mapCurrent),
      courierApiClient
        .request<TrackingTimelineApiResponse[]>(
          courierEndpoints.tracking.timeline(shipmentCode),
          { accessToken },
        )
        .then((records) => records.map(mapTimelineEvent)),
    ]);

    return {
      current,
      timeline,
    };
  },
};
