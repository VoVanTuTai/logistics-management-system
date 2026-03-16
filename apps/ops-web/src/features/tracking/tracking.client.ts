import { opsApiClient } from '../../services/api/client';
import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import type { TrackingLookupResultDto, TrackingSearchResultDto } from './tracking.types';

interface TrackingCurrentApiResponse {
  shipmentCode: string;
  currentStatus: string | null;
  currentLocationCode: string | null;
  updatedAt: string | null;
}

interface TrackingTimelineApiResponse {
  id: string;
  eventType: string;
  actor: string | null;
  locationCode: string | null;
  occurredAt: string;
}

function mapCurrent(payload: TrackingCurrentApiResponse) {
  return {
    shipmentCode: payload.shipmentCode,
    currentStatus: payload.currentStatus,
    currentLocation: payload.currentLocationCode,
    updatedAt: payload.updatedAt,
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
          currentStatus: response.currentStatus ?? null,
          currentLocation: response.currentLocation ?? null,
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
        eventType: event.eventType,
        eventSource: event.actor ?? 'N/A',
        statusAfterEvent: null,
        locationCode: event.locationCode,
        occurredAt: event.occurredAt,
      })),
    })),
};
