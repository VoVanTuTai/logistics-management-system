import { customerApiClient } from './client';

export interface CreateShipmentMetadata {
  sender?: {
    name?: string;
    phone?: string;
    addressDetail?: string;
    province?: string;
    district?: string;
    ward?: string;
  };
  receiver?: {
    name?: string;
    phone?: string;
    addressDetail?: string;
    province?: string;
    district?: string;
    ward?: string;
  };
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
}

export const shipmentApi = {
  createShipment: async (
    accessToken: string,
    metadata: CreateShipmentMetadata,
  ): Promise<ShipmentResponse> => {
    return customerApiClient.request<ShipmentResponse>('/customer/shipment/shipments', {
      method: 'POST',
      accessToken,
      body: { metadata },
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
