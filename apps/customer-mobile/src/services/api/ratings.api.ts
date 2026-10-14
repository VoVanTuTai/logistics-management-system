import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerApiClient } from './client';

export interface CourierRatingItem {
  id: string;
  shipmentCode: string;
  courierId?: string | null;
  courierName?: string | null;
  customerPhone?: string | null;
  stars: number;
  tags?: string[] | null;
  comment?: string | null;
  createdAt: string;
}

export interface SubmitRatingPayload {
  shipmentCode: string;
  courierId?: string;
  courierName?: string;
  customerPhone?: string;
  stars: number;
  tags?: string[];
  comment?: string;
}

const STORAGE_KEY = '@customer_courier_ratings';

async function getStoredRatings(): Promise<CourierRatingItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveStoredRatings(items: CourierRatingItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save ratings locally:', err);
  }
}

export const ratingsApi = {
  async submitRating(payload: SubmitRatingPayload): Promise<CourierRatingItem> {
    try {
      const res = await customerApiClient.request<CourierRatingItem>('/customer/shipment/ratings', {
        method: 'POST',
        body: payload,
      });
      if (res && res.id) {
        const local = await getStoredRatings();
        await saveStoredRatings([res, ...local]);
        return res;
      }
    } catch (err) {
      console.warn('[ratingsApi] Backend submit failed, saving local fallback', err);
    }

    const local = await getStoredRatings();
    const fallbackItem: CourierRatingItem = {
      id: `rating_local_${Date.now()}`,
      shipmentCode: payload.shipmentCode,
      courierId: payload.courierId,
      courierName: payload.courierName,
      customerPhone: payload.customerPhone,
      stars: payload.stars,
      tags: payload.tags,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };
    await saveStoredRatings([fallbackItem, ...local]);
    return fallbackItem;
  },

  async getRatingForShipment(shipmentCode: string): Promise<CourierRatingItem | null> {
    try {
      const res = await customerApiClient.request<CourierRatingItem | null>(
        `/customer/shipment/ratings/shipment/${encodeURIComponent(shipmentCode)}`
      );
      if (res) return res;
    } catch {
      // Ignore
    }

    const local = await getStoredRatings();
    return local.find((r) => r.shipmentCode.toUpperCase() === shipmentCode.toUpperCase()) || null;
  },
};
