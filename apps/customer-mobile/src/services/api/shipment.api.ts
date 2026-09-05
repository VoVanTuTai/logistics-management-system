import { customerApiClient } from './client';

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
  service?: {
    type?: string;
    fee?: number;
  };
  shippingFee?: number;
  codAmount?: number;
  notes?: string;
  originHubCode?: string;
  destinationHubCode?: string;
  senderHubCode?: string;
  receiverHubCode?: string;
  routing?: {
    originHubCode?: string;
    destinationHubCode?: string;
  };
  [key: string]: unknown;
}

export interface ShipmentResponse {
  id: string;
  code: string;
  currentStatus: string;
  isLocked: boolean;
  metadata: Record<string, unknown> | null;
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
    return customerApiClient.request<ShipmentResponse>('/customer/shipment/shipments', {
      method: 'POST',
      accessToken,
      body: {
        pickupLatitude: metadata.pickupLatitude,
        pickupLongitude: metadata.pickupLongitude,
        deliveryLatitude: metadata.deliveryLatitude,
        deliveryLongitude: metadata.deliveryLongitude,
        metadata,
      },
    });
  },

  getShipments: async (
    accessToken: string,
    filters: ShipmentFilters = {},
  ): Promise<ShipmentResponse[] | ShipmentListPageResponse> => {
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

    return customerApiClient.request<ShipmentResponse[] | ShipmentListPageResponse>(url, {
      method: 'GET',
      accessToken,
    });
  },

  getReceivedShipments: async (
    accessToken: string,
    filters: ShipmentFilters = {},
  ): Promise<ShipmentResponse[] | ShipmentListPageResponse> => {
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

    return customerApiClient.request<ShipmentResponse[] | ShipmentListPageResponse>(url, {
      method: 'GET',
      accessToken,
    });
  },

  getShipmentByCode: async (
    accessToken: string,
    code: string,
  ): Promise<ShipmentResponse> => {
    return customerApiClient.request<ShipmentResponse>(`/customer/shipment/shipments/${code}`, {
      method: 'GET',
      accessToken,
    });
  },
};
