import { apiClient } from '../client';
import { normalizeMediaPublicUrl } from '../../utils/trackingUtils';

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
  metadata?: Record<string, any> | null;
  photoUrl?: string | null;
  proofImageUrl?: string | null;
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
      // Public / Guest tracking endpoint (strict security)
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

        const rawTimeline: any[] = Array.isArray(publicData.timeline) ? publicData.timeline : [];
        const processedTimeline: TimelineEventResponse[] = rawTimeline.map((ev, idx) => {
          let proof = ev.metadata?.podImageUrl || ev.metadata?.proofImageUrl || ev.metadata?.photoUrl || ev.photoUrl;
          if (!proof && idx === rawTimeline.length - 1 && publicData.order?.metadata?.podImageUrl) {
            proof = publicData.order.metadata.podImageUrl;
          }
          if (!proof && ev.note) {
            const match = ev.note.match(/https?:\/\/[^\s"'<>()]+/i);
            if (match) proof = match[0];
          }
          return {
            ...ev,
            proofImageUrl: normalizeMediaPublicUrl(proof),
          };
        });

        return {
          shipmentCode,
          current: publicData.current ?? null,
          timeline: processedTimeline,
          order: publicData.order ?? null,
          gpsPosition,
          requiresReceiverPhone: false,
        };
      } catch (err: any) {
        if (
          err?.status === 400 ||
          err?.status === 403 ||
          err?.message?.includes('receiver phone') ||
          err?.message?.includes('số điện thoại')
        ) {
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
    const [timelineRes, currentRes, shipmentRes] = await Promise.allSettled([
      apiClient<any>(`/customer/tracking/tracking/${code}/timeline`, { method: 'GET', accessToken }),
      apiClient<any>(`/customer/tracking/tracking/${code}/current`, { method: 'GET', accessToken }),
      apiClient<any>(`/customer/shipment/shipments/${code}`, { method: 'GET', accessToken }),
    ]);

    const rawTimeline: any[] = timelineRes.status === 'fulfilled' && Array.isArray(timelineRes.value) ? timelineRes.value : [];
    const current = currentRes.status === 'fulfilled' ? currentRes.value : null;
    const shipmentData = shipmentRes.status === 'fulfilled' ? shipmentRes.value : null;

    let order: PublicOrderView | null = null;
    if (shipmentData) {
      const meta = shipmentData.metadata || {};
      const s = meta.sender || {};
      const r = meta.receiver || {};
      const p = meta.package || {};
      order = {
        code: shipmentData.code,
        statusCode: shipmentData.currentStatus,
        createdAt: shipmentData.createdAt,
        updatedAt: shipmentData.updatedAt,
        sender: {
          name: s.name || null,
          phone: s.phone || null,
          address: s.address || null,
          addressDetail: s.addressDetail || null,
          ward: s.ward || null,
          district: s.district || null,
          province: s.province || null,
          region: s.region || null,
          hubCode: s.hubCode || null,
        },
        receiver: {
          name: r.name || null,
          phone: r.phone || null,
          address: r.address || null,
          addressDetail: r.addressDetail || null,
          ward: r.ward || null,
          district: r.district || null,
          province: r.province || null,
          region: r.region || null,
          hubCode: r.hubCode || null,
        },
        package: {
          itemType: p.itemName || p.itemType || null,
          weightKg: Number(p.weightKg) || null,
          dimensionsCm: {
            length: Number(p.dimensionsCm?.length) || null,
            width: Number(p.dimensionsCm?.width) || null,
            height: Number(p.dimensionsCm?.height) || null,
          },
          declaredValue: Number(p.declaredValue) || null,
        },
        serviceType: meta.service?.type || meta.serviceType || 'TIÊU CHUẨN',
        codAmount: Number(meta.codAmount || p.codAmount) || 0,
        estimatedFee: Number(meta.estimatedFee || meta.shippingFee || meta.service?.fee) || 0,
        currency: 'VND',
        deliveryNote: meta.deliveryNote || meta.notes || null,
        source: 'CUSTOMER_PORTAL',
        routing: {
          originHubCode: s.hubCode || null,
          destinationHubCode: r.hubCode || null,
        },
      };
    }

    let gpsPosition: GpsPositionView | null = null;
    try {
      gpsPosition = await apiClient<GpsPositionView>(`/public/scan/locations/${code}/latest-position`, {
        method: 'GET',
      });
    } catch {
      // Optional
    }

    const processedTimeline: TimelineEventResponse[] = rawTimeline.map((ev, idx) => {
      let proof = ev.metadata?.podImageUrl || ev.metadata?.proofImageUrl || ev.metadata?.photoUrl || ev.photoUrl;
      if (!proof && idx === rawTimeline.length - 1 && shipmentData?.metadata?.podImageUrl) {
        proof = shipmentData.metadata.podImageUrl;
      }
      if (!proof && ev.note) {
        const match = ev.note.match(/https?:\/\/[^\s"'<>()]+/i);
        if (match) proof = match[0];
      }
      return {
        ...ev,
        proofImageUrl: normalizeMediaPublicUrl(proof),
      };
    });

    return {
      shipmentCode,
      current,
      timeline: processedTimeline,
      order,
      gpsPosition,
      requiresReceiverPhone: false,
    };
  },
};
