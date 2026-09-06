import { apiClient } from '../client';

export interface CreateShipmentMetadata {
  sender?: {
    name?: string;
    phone?: string;
    addressDetail?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    hubCode?: string;
    latitude?: number;
    longitude?: number;
    coordinate?: { latitude: number; longitude: number };
  };
  receiver?: {
    name?: string;
    phone?: string;
    addressDetail?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    hubCode?: string;
    latitude?: number;
    longitude?: number;
    coordinate?: { latitude: number; longitude: number };
  };
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupCoordinate?: { latitude: number; longitude: number };
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryCoordinate?: { latitude: number; longitude: number };
  package?: {
    itemName?: string;
    weightKg?: number;
    dimensionsCm?: {
      length?: number;
      width?: number;
      height?: number;
    };
    declaredValue?: number;
    codAmount?: number;
  };
  pickupType?: 'PICKUP' | 'DROP_OFF';
  service?: {
    type?: string;
    pickupType?: 'PICKUP' | 'DROP_OFF';
    fee?: number;
  };
  shippingFee?: number;
  codAmount?: number;
  notes?: string | null;
  deliveryNote?: string | null;
  originHubCode?: string;
  destinationHubCode?: string;
  senderHubCode?: string;
  receiverHubCode?: string;
  routing?: {
    originHubCode?: string;
    destinationHubCode?: string;
  };
}

export interface ShipmentResponse {
  id: string;
  code: string;
  currentStatus: string;
  isLocked: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentListPageResponse {
  items: ShipmentResponse[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
  };
}

export interface ShipmentFilters {
  q?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
  userId?: string | null;
  phone?: string | null;
}

export const shipmentApi = {
  createShipment: async (
    accessToken: string,
    metadata: CreateShipmentMetadata,
  ): Promise<ShipmentResponse> => {
    return apiClient<ShipmentResponse>('/customer/shipment/shipments', {
      method: 'POST',
      accessToken,
      body: { metadata },
    });
  },

  getShipments: async (
    accessToken: string,
    filters: ShipmentFilters = {},
  ): Promise<ShipmentResponse[]> => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    if (filters.userId) params.append('userId', filters.userId);

    const queryString = params.toString();
    const url = `/customer/shipment/shipments/sent${queryString ? `?${queryString}` : ''}`;

    try {
      const res = await apiClient<any>(url, {
        method: 'GET',
        accessToken,
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.items)) return res.items;
      return [];
    } catch {
      return [];
    }
  },

  getReceivedShipments: async (
    accessToken: string,
    filters: ShipmentFilters = {},
  ): Promise<ShipmentResponse[]> => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    if (filters.phone) params.append('phone', filters.phone);

    const queryString = params.toString();
    const url = `/customer/shipment/shipments/received${queryString ? `?${queryString}` : ''}`;

    try {
      const res = await apiClient<any>(url, {
        method: 'GET',
        accessToken,
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.items)) return res.items;
      return [];
    } catch {
      return [];
    }
  },

  getShipmentByCode: async (
    accessToken: string,
    code: string,
  ): Promise<ShipmentResponse> => {
    return apiClient<ShipmentResponse>(`/customer/shipment/shipments/${encodeURIComponent(code)}`, {
      method: 'GET',
      accessToken,
    });
  },
};
