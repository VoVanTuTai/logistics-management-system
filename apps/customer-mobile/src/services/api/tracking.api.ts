import { customerApiClient } from './client';

export interface TimelineEventResponse {
  id: string;
  eventId: string;
  eventTypeCode: string;
  eventType: string;
  shipmentCode: string;
  actor: string | null;
  locationCode: string | null;
  locationText: string | null;
  statusAfterEventCode: string | null;
  statusAfterEvent: string | null;
  occurredAt: string;
  note: string | null;
}

export interface PublicTrackingResponse {
  shipmentCode: string;
  current: {
    shipmentCode: string;
    currentStatusCode: string | null;
    currentStatus: string | null;
    currentLocationCode: string | null;
    currentLocationText: string | null;
    lastEventAt: string | null;
  } | null;
  timeline: TimelineEventResponse[];
  order: {
    code: string;
    statusCode: string | null;
    createdAt: string | null;
    sender?: {
      name: string | null;
      phone: string | null;
      addressDetail: string | null;
    };
    receiver?: {
      name: string | null;
      phone: string | null;
      addressDetail: string | null;
    };
    package?: {
      itemType: string | null;
      weightKg: number | null;
      declaredValue: number | null;
    };
    codAmount?: number | null;
    shippingFee?: number | null;
  } | null;
}

export const trackingApi = {
  getTracking: async (shipmentCode: string): Promise<PublicTrackingResponse> => {
    return customerApiClient.request<PublicTrackingResponse>(
      `/public/tracking/public/track/${shipmentCode}`,
      { method: 'GET' },
    );
  },
};
