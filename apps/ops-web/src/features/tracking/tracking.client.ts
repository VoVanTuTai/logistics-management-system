import { opsApiClient } from '../../services/api/client';
import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  OperationTimelineEventDto,
  OperationTimelineFiltersDto,
  TrackingLookupResultDto,
  TrackingSearchResultDto,
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
  note?: string | null;
}

interface OperationTimelineApiResponse extends TrackingTimelineApiResponse {
  entityType: OperationTimelineEventDto['entityType'];
  entityCode: string;
  relatedShipmentCode: string | null;
  relatedManifestCode: string | null;
  relatedTripCode: string | null;
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

function mapTimelineEvent(event: TrackingTimelineApiResponse): TrackingTimelineEventDto {
  return {
    id: event.id,
    eventTypeCode: event.eventTypeCode,
    eventType: event.eventType,
    eventSource: event.eventSource,
    statusAfterEventCode: event.statusAfterEventCode,
    statusAfterEvent: event.statusAfterEvent,
    locationCode: event.locationCode,
    locationText: event.locationText,
    occurredAt: event.occurredAt,
    note: event.note,
  };
}

function buildOperationTimelineUrl(filters: OperationTimelineFiltersDto): string {
  const params = new URLSearchParams();

  if (filters.entityType) {
    params.set('entityType', filters.entityType);
  }
  if (filters.entityCode) {
    params.set('entityCode', filters.entityCode);
  }
  if (filters.shipmentCode) {
    params.set('shipmentCode', filters.shipmentCode);
  }
  if (filters.manifestCode) {
    params.set('manifestCode', filters.manifestCode);
  }
  if (filters.tripCode) {
    params.set('tripCode', filters.tripCode);
  }
  if (filters.eventType) {
    params.set('eventType', filters.eventType);
  }
  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  const queryString = params.toString();
  return queryString
    ? `${opsEndpoints.tracking.operationTimeline}?${queryString}`
    : opsEndpoints.tracking.operationTimeline;
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
      timeline: timeline.map(mapTimelineEvent),
    })),
  operationTimeline: (
    accessToken: string | null,
    filters: OperationTimelineFiltersDto,
  ): Promise<OperationTimelineEventDto[]> =>
    opsApiClient
      .request<OperationTimelineApiResponse[]>(buildOperationTimelineUrl(filters), {
        accessToken,
      })
      .then((timeline) =>
        timeline.map((event) => ({
          ...mapTimelineEvent(event),
          entityType: event.entityType,
          entityCode: event.entityCode,
          relatedShipmentCode: event.relatedShipmentCode,
          relatedManifestCode: event.relatedManifestCode,
          relatedTripCode: event.relatedTripCode,
        })),
      ),
};
