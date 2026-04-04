import { opsApiClient } from '../../services/api/client';
import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import type { TrackingLookupResultDto, TrackingSearchResultDto } from './tracking.types';

interface TrackingCurrentApiResponse {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText: string | null;
  lastEventTypeCode: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
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

function mapCurrent(payload: TrackingCurrentApiResponse) {
  return {
    shipmentCode: payload.shipmentCode,
    currentStatusCode: payload.currentStatusCode,
    currentStatus: payload.currentStatus,
    currentLocation: payload.currentLocationCode,
    currentLocationText: payload.currentLocationText,
    lastEventTypeCode: payload.lastEventTypeCode,
    lastEventType: payload.lastEventType,
    updatedAt: payload.lastEventAt,
  };
}

export const trackingClient = {
  search: (
    accessToken: string | null,
    shipmentCode: string,
  ): Promise<TrackingSearchResultDto | null> =>
    opsApiClient
      .request<TrackingCurrentApiResponse>(opsEndpoints.tracking.current(shipmentCode), {
        accessToken,
      })
      .then(mapCurrent)
      .then((response) => {
        return {
          shipmentCode: response.shipmentCode ?? shipmentCode,
          currentStatusCode: response.currentStatusCode ?? null,
          currentStatus: response.currentStatus ?? null,
          currentLocation: response.currentLocation ?? null,
          currentLocationText: response.currentLocationText ?? null,
          lastEventTypeCode: response.lastEventTypeCode ?? null,
          lastEventType: response.lastEventType ?? null,
          updatedAt: response.updatedAt ?? null,
        };
      })
      .catch((error: unknown) => {
        if (error instanceof ApiClientError && error.status === 404) {
          return null;
        }

        throw error;
      }),
  detail: (
    accessToken: string | null,
    shipmentCode: string,
  ): Promise<TrackingLookupResultDto> =>
    Promise.all([
      opsApiClient
        .request<TrackingCurrentApiResponse>(opsEndpoints.tracking.current(shipmentCode), {
          accessToken,
        })
        .then(mapCurrent),
      opsApiClient.request<TrackingTimelineApiResponse[]>(
        opsEndpoints.tracking.timeline(shipmentCode),
        { accessToken },
      ),
    ]).then(([current, timeline]) => ({
      current,
      timeline: timeline.map((event) => ({
        id: event.id,
        eventTypeCode: event.eventTypeCode,
        eventType: event.eventType,
        eventSource: event.eventSource,
        statusAfterEventCode: event.statusAfterEventCode,
        statusAfterEvent: event.statusAfterEvent,
        locationCode: event.locationCode,
        locationText: event.locationText,
        occurredAt: event.occurredAt,
      })),
    })),
};
