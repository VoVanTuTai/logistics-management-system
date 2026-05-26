export type JsonObject = Record<string, unknown>;

export interface MarketplaceCreateOrderRequest {
  external?: {
    platform?: string;
    shopId?: string;
    externalOrderId?: string;
    externalOrderCode?: string;
    orderCreatedAt?: string;
    orderStatus?: string;
  };
  merchant?: {
    merchantId?: string;
    shopName?: string;
  };
  sender?: {
    name?: string;
    phone?: string;
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    hubCode?: string;
  };
  receiver?: {
    name?: string;
    phone?: string;
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    note?: string;
  };
  parcel?: {
    items?: Array<{
      sku?: string;
      name?: string;
      quantity?: number;
      unitPrice?: number;
    }>;
    weightGram?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    declaredValue?: number;
  };
  service?: {
    serviceType?: string;
    pickupType?: string;
    expectedPickupAt?: string;
  };
  payment?: {
    codAmount?: number;
    shippingFee?: number;
    payer?: string;
    codIncludesShippingFee?: boolean;
  };
  options?: {
    autoCreatePickup?: boolean;
    printLabelFormat?: string;
  };
}

export interface ShipmentResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: unknown;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickupResponse {
  id: string;
  pickupCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: Array<{
    shipmentCode: string;
    quantity: number;
  }>;
}

export interface ShopMapping {
  shopId: string;
  shopName?: string;
  merchantId: string;
  sender?: {
    name?: string;
    phone?: string;
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    hubCode?: string;
  };
  active?: boolean;
}
