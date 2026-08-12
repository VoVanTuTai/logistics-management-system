import { customerApiClient } from './client';
import { authStore } from '../../store/authStore';

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
  getTimeline: async (shipmentCode: string): Promise<TimelineEventResponse[]> => {
    const token = authStore.getAccessToken();
    const endpoint = token
      ? `/customer/tracking/tracking/${encodeURIComponent(shipmentCode)}/timeline`
      : `/public/tracking/public/track/${encodeURIComponent(shipmentCode)}`;

    try {
      const res = await customerApiClient.request<any>(endpoint, { method: 'GET' });
      if (Array.isArray(res)) {
        return res;
      }
      if (res && Array.isArray(res.timeline)) {
        return res.timeline;
      }
      return [];
    } catch {
      return [];
    }
  },

  getCurrentStatus: async (shipmentCode: string): Promise<TrackingCurrentResponse | null> => {
    const token = authStore.getAccessToken();
    if (!token) return null;

    try {
      return await customerApiClient.request<TrackingCurrentResponse>(
        `/customer/tracking/tracking/${encodeURIComponent(shipmentCode)}/current`,
        { method: 'GET' },
      );
    } catch {
      return null;
    }
  },

  getTracking: async (shipmentCode: string): Promise<UnifiedTrackingResponse> => {
    const [timeline, current] = await Promise.all([
      trackingApi.getTimeline(shipmentCode),
      trackingApi.getCurrentStatus(shipmentCode),
    ]);

    return {
      shipmentCode,
      current,
      timeline,
    };
  },
};
