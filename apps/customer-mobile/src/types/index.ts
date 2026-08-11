export type ShipmentStatus =
  | 'CREATED'
  | 'PICKUP_COMPLETED'
  | 'IN_TRANSIT'
  | 'ARRIVED_HUB'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNED'
  | 'CANCELLED';

export type OrderCategory = 'SENT' | 'RECEIVED';

export type OrderType = 'REGULAR' | 'ECOMMERCE' | 'EXPRESS';

export type TimeFilterOption =
  | 'today'
  | 'yesterday'
  | '7days'
  | '14days'
  | '30days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export type StatusFilterOption = 'ALL' | ShipmentStatus;

export interface SenderInfo {
  name: string;
  phone: string;
  addressDetail: string;
  composedAddress?: string;
  ward?: string;
  district?: string;
  province?: string;
  hubCode?: string;
}

export interface ReceiverInfo {
  name: string;
  phone: string;
  addressDetail: string;
  composedAddress?: string;
  ward?: string;
  district?: string;
  province?: string;
  hubCode?: string;
}

export interface TrackingEvent {
  id: string;
  title: string;
  timestamp: string;
  location?: string;
  completed: boolean;
  isCurrent?: boolean;
}

export interface OrderModel {
  id: string;
  code: string;
  category: OrderCategory;
  orderType: OrderType;
  sender: SenderInfo;
  receiver: ReceiverInfo;
  itemName: string;
  weightKg: number;
  declaredValueVnd: number;
  codAmountVnd: number;
  shippingFeeVnd: number;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TrackingEvent[];
  notes?: string;
  isPayerReceiver?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  defaultSenderAddress: SenderInfo;
  points: number;
  vouchersCount: number;
}

export interface ShippingServiceOption {
  id: string;
  name: string;
  estimatedHours: string;
  fee: number;
  popular?: boolean;
}

export interface CreateOrderFormState {
  // Step 1: Address
  senderName: string;
  senderPhone: string;
  senderAddress: string;

  receiverName: string;
  receiverPhone: string;
  receiverProvince: string;
  receiverDistrict: string;
  receiverWard: string;
  receiverAddress: string;

  // Step 2: Package
  itemName: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  hasCod: boolean;
  codAmount: string;

  // Step 3: Fee & Services
  serviceId: string;
  extraCheckGoods: boolean;
  extraInsurance: boolean;
  extraPartialDelivery: boolean;
  payerIsReceiver: boolean;
  notes: string;
}
