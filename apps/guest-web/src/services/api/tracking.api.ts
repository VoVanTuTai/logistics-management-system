import { apiClient } from '../client';

export interface TimelineEventResponse {
  id: string;
  eventId?: string;
  eventTypeCode?: string;
  eventType?: string;
  eventSource?: string;
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
  lastEventTypeCode?: string | null;
  lastEventType?: string | null;
  lastEventAt?: string | null;
  updatedAt?: string | null;
}

export interface PublicContactView {
  name: string | null;
  phone: string | null;
  address: string | null;
  addressDetail: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  region: string | null;
  hubCode: string | null;
}

export interface PublicOrderView {
  code: string;
  statusCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sender: PublicContactView;
  receiver: PublicContactView;
  package: {
    itemType: string | null;
    weightKg: number | null;
    dimensionsCm: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    declaredValue: number | null;
  };
  serviceType: string | null;
  codAmount: number | null;
  estimatedFee: number | null;
  currency: string | null;
  deliveryNote: string | null;
  source: string | null;
  routing: {
    originHubCode: string | null;
    destinationHubCode: string | null;
  };
}

export interface GpsPositionView {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  capturedAt?: string | null;
  source?: string | null;
}

export interface UnifiedTrackingResponse {
  shipmentCode: string;
  current: TrackingCurrentResponse | null;
  timeline: TimelineEventResponse[];
  order?: PublicOrderView | null;
  gpsPosition?: GpsPositionView | null;
  requiresReceiverPhone?: boolean;
}

export const trackingApi = {
  getTracking: async (
    shipmentCode: string,
    accessToken?: string | null,
    receiverPhone?: string,
  ): Promise<UnifiedTrackingResponse> => {
    const code = encodeURIComponent(shipmentCode.trim().toUpperCase());
    const phoneParam = receiverPhone?.trim() ? `?receiverPhone=${encodeURIComponent(receiverPhone.trim())}` : '';

    if (!accessToken) {
      // Public / Guest tracking endpoint
      try {
        const publicData = await apiClient<any>(`/public/tracking/public/track/${code}${phoneParam}`, {
          method: 'GET',
        });

        let gpsPosition: GpsPositionView | null = null;
        try {
          gpsPosition = await apiClient<GpsPositionView>(`/public/scan/locations/${code}/latest-position`, {
            method: 'GET',
          });
        } catch {
          // GPS is optional
        }

        return {
          shipmentCode,
          current: publicData.current ?? null,
          timeline: Array.isArray(publicData.timeline) ? publicData.timeline : [],
          order: publicData.order ?? null,
          gpsPosition,
          requiresReceiverPhone: false,
        };
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('receiver phone') || err?.message?.includes('số điện thoại')) {
          return {
            shipmentCode,
            current: null,
            timeline: [],
            requiresReceiverPhone: true,
          };
        }
        throw err;
      }
    }

    // Logged-in Customer tracking endpoints
    const [timelineRes, currentRes] = await Promise.allSettled([
      apiClient<any>(`/customer/tracking/tracking/${code}/timeline`, { method: 'GET', accessToken }),
      apiClient<any>(`/customer/tracking/tracking/${code}/current`, { method: 'GET', accessToken }),
    ]);

    const timeline = timelineRes.status === 'fulfilled' && Array.isArray(timelineRes.value) ? timelineRes.value : [];
    const current = currentRes.status === 'fulfilled' ? currentRes.value : null;

    let gpsPosition: GpsPositionView | null = null;
    try {
      gpsPosition = await apiClient<GpsPositionView>(`/public/scan/locations/${code}/latest-position`, {
        method: 'GET',
      });
    } catch {
      // Optional
    }

    return {
      shipmentCode,
      current,
      timeline,
      gpsPosition,
    };
  },
};
