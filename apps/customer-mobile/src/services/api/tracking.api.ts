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
  createdAt?: string | null;
  note?: string | null;
  metadata?: Record<string, any> | null;
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
    const encodedCode = encodeURIComponent(shipmentCode);

    // List of candidate endpoints matching Ops Web & Customer API
    const endpoints = [
      `/customer/tracking/tracking/${encodedCode}/timeline`,
      `/ops/tracking/tracking/${encodedCode}/timeline`,
      `/public/tracking/public/track/${encodedCode}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await customerApiClient.request<any>(endpoint, {
          method: 'GET',
          accessToken: token || undefined,
        });

        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
        if (res && Array.isArray(res.timeline) && res.timeline.length > 0) {
          return res.timeline;
        }
      } catch {
        // Try next endpoint
      }
    }

    return [];
  },

  getCurrentStatus: async (shipmentCode: string): Promise<TrackingCurrentResponse | null> => {
    const token = authStore.getAccessToken();
    const encodedCode = encodeURIComponent(shipmentCode);

    const endpoints = [
      `/customer/tracking/tracking/${encodedCode}/current`,
      `/ops/tracking/tracking/${encodedCode}/current`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await customerApiClient.request<TrackingCurrentResponse>(endpoint, {
          method: 'GET',
          accessToken: token || undefined,
        });
        if (res && res.shipmentCode) {
          return res;
        }
      } catch {
        // Try next endpoint
      }
    }

    return null;
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
