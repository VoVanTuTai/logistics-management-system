import { apiClient } from '../client';

export interface TimelineEventResponse {
  id: string;
  eventId?: string;
  eventTypeCode?: string;
  eventType?: string;
  shipmentCode: string;
  actor?: string | null;
  locationCode?: string | null;
  locationText?: string | null;
  statusAfterEventCode?: string | null;
  statusAfterEvent?: string | null;
  occurredAt: string;
  note?: string | null;
}

export interface TrackingCurrentResponse {
  shipmentCode: string;
  currentStatusCode?: string | null;
  currentStatus?: string | null;
  currentLocationCode?: string | null;
  currentLocationText?: string | null;
  lastEventAt?: string | null;
  updatedAt?: string | null;
}

export interface UnifiedTrackingResponse {
  shipmentCode: string;
  current: TrackingCurrentResponse | null;
  timeline: TimelineEventResponse[];
}

export const trackingApi = {
  getTimeline: async (shipmentCode: string, accessToken?: string | null): Promise<TimelineEventResponse[]> => {
    const endpoint = accessToken
      ? `/customer/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`
      : `/public/tracking/public/track/${encodeURIComponent(shipmentCode)}`;

    try {
      const res = await apiClient<any>(endpoint, { method: 'GET', accessToken });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.timeline)) return res.timeline;
      return [];
    } catch {
      return [];
    }
  },

  getCurrentStatus: async (shipmentCode: string, accessToken?: string | null): Promise<TrackingCurrentResponse | null> => {
    try {
      const endpoint = accessToken
        ? `/customer/tracking/tracking/${encodeURIComponent(shipmentCode)}/current`
        : `/public/tracking/public/track/${encodeURIComponent(shipmentCode)}`;
      const res = await apiClient<any>(endpoint, { method: 'GET', accessToken });
      if (res && res.current) return res.current;
      if (res && res.currentStatus) return res;
      return null;
    } catch {
      return null;
    }
  },

  getTracking: async (shipmentCode: string, accessToken?: string | null): Promise<UnifiedTrackingResponse> => {
    const [timeline, current] = await Promise.all([
      trackingApi.getTimeline(shipmentCode, accessToken),
      trackingApi.getCurrentStatus(shipmentCode, accessToken),
    ]);

    return {
      shipmentCode,
      current,
      timeline,
    };
  },
};
