export type ViewId =
  | 'dashboard'
  | 'create-shipment'
  | 'shipments'
  | 'shipment-detail'
  | 'pickups'
  | 'tracking'
  | 'change-requests'
  | 'returns'
  | 'print'
  | 'account'
  | 'notifications';

export interface AuthUser {
  id: string;
  username: string;
  roles: string[];
  hubCodes?: string[];
}

export interface LoginResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  };
}

export interface IntrospectResponse {
  active: boolean;
  user: AuthUser | null;
  accessTokenExpiresAt: string | null;
}

export interface MerchantSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface ShipmentResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickupItem {
  id: string;
  pickupRequestId: string;
  shipmentCode: string;
  quantity: number;
}

export interface PickupRequest {
  id: string;
  pickupCode: string;
  status: 'REQUESTED' | 'CANCELLED' | 'COMPLETED';
  requesterName: string | null;
  contactPhone: string | null;
  pickupAddress: string | null;
  note: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: PickupItem[];
}

export interface ChangeRequest {
  id: string;
  shipmentCode: string;
  requestType: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingCurrent {
  shipmentCode: string;
  currentStatus: string | null;
  currentLocationCode: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  shipmentCode: string;
  actor: string | null;
  locationCode: string | null;
  occurredAt: string;
}

export interface ShipmentRow {
  shipment: ShipmentResponse;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverRegion: string;
  serviceType: string;
  itemType: string;
  weightKg: number;
  dimensionsText: string;
  declaredValue: number;
  codAmount: number;
  feeEstimate: number;
  deliveryNote: string;
}

export interface NotificationItem {
  id: string;
  level: 'success' | 'info' | 'error';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export interface CreateShipmentForm {
  manualCode: string;
  senderName: string;
  senderPhone: string;
  senderHubCode: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverHubCode: string;
  receiverAddress: string;
  receiverRegion: string;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
  codAmount: string;
  deliveryNote: string;
}

export interface ShipmentDraft {
  id: string;
  createdAt: string;
  name: string;
  quoteFee: number;
  form: CreateShipmentForm;
}

export interface ReturnRequest {
  id: string;
  shipmentCode: string;
  reason: string;
  expectedReturnAt: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface MerchantProfile {
  shopName: string;
  contactPhone: string;
  email: string;
  defaultPickupAddress: string;
}

export const DEFAULT_CREATE_FORM: CreateShipmentForm = {
  manualCode: '',
  senderName: '',
  senderPhone: '',
  senderHubCode: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverHubCode: '',
  receiverAddress: '',
  receiverRegion: '',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  declaredValue: '',
  serviceType: 'STANDARD',
  codAmount: '',
  deliveryNote: '',
};

export const DEFAULT_PROFILE: MerchantProfile = {
  shopName: 'Merchant Demo Store',
  contactPhone: '0900000000',
  email: 'merchant.demo@example.com',
  defaultPickupAddress: '',
};
