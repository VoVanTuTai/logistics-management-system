export type ViewId =
  | 'dashboard'
  | 'create-shipment'
  | 'shipments'
  | 'shipment-detail'
  | 'pickups'
  | 'tracking'
  | 'change-requests'
  | 'returns'
  | 'claims'
  | 'finance'
  | 'print'
  | 'account'
  | 'notifications';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  phone: string | null;
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
  currentStatusCode?: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText?: string | null;
  lastEventTypeCode?: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
}

export interface TimelineEvent {
  id: string;
  eventTypeCode?: string;
  eventType: string;
  eventSource?: string;
  statusAfterEventCode?: string | null;
  statusAfterEvent?: string | null;
  shipmentCode: string;
  actor: string | null;
  locationCode: string | null;
  locationText?: string | null;
  occurredAt: string;
}

export interface ShipmentRow {
  shipment: ShipmentResponse;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderProvince: string;
  senderWard: string;
  senderHubCode: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  receiverWard: string;
  receiverHubCode: string;
  receiverRegion: string;
  serviceType: string;
  itemType: string;
  weightKg: number;
  dimensionsText: string;
  declaredValue: number;
  codAmount: number;
  feeEstimate: number;
  deliveryNote: string;
  pricingBreakdown?: Array<{ code: string; label: string; amount: number; basis?: string }>;
  chargeableWeightKg?: number;
  pricingZone?: string;
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
  senderName: string;
  senderPhone: string;
  senderProvince: string;
  senderWard: string;
  senderAddressDetail: string;
  senderHubCode: string;
  senderAddress: string;
  senderLatitude?: number;
  senderLongitude?: number;
  receiverName: string;
  receiverPhone: string;
  receiverProvince: string;
  receiverWard: string;
  receiverAddressDetail: string;
  receiverHubCode: string;
  receiverAddress: string;
  receiverRegion: string;
  receiverLatitude?: number;
  receiverLongitude?: number;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  codAmount: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
  deliveryNote: string;
  inspectionPolicy?: 'NONE' | 'VIEW_ONLY' | 'TRY_ON';
}

export interface ShipmentDraft {
  id: string;
  createdAt: string;
  name: string;
  quoteFee: number;
  form: CreateShipmentForm;
}

export interface HubLocation {
  province: string;
  ward: string;
  hubCode: string;
  hubName: string;
  latitude?: number;
  longitude?: number;
}

export interface PricingBreakdownItem {
  code: string;
  label: string;
  amount: number;
  basis: string;
}

export interface PricingQuoteResponse {
  quoteId: string;
  quoteVersion: string;
  currency: string;
  serviceType: string;
  zone: string;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  totalFee: number;
  validUntil: string;
  breakdown: PricingBreakdownItem[];
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
  defaultPickupProvince: string;
  defaultPickupAddressDetail: string;
  defaultPickupAddress: string;
  latitude?: number;
  longitude?: number;
}

export const DEFAULT_CREATE_FORM: CreateShipmentForm = {
  senderName: '',
  senderPhone: '',
  senderProvince: '',
  senderWard: '',
  senderAddressDetail: '',
  senderHubCode: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverProvince: '',
  receiverWard: '',
  receiverAddressDetail: '',
  receiverHubCode: '',
  receiverAddress: '',
  receiverRegion: '',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  codAmount: '',
  serviceType: 'STANDARD',
  deliveryNote: '',
  inspectionPolicy: 'VIEW_ONLY',
};

export const DEFAULT_PROFILE: MerchantProfile = {
  shopName: '',
  contactPhone: '',
  email: '',
  defaultPickupProvince: '',
  defaultPickupAddressDetail: '',
  defaultPickupAddress: '',
};

export type ClaimIncidentType =
  | 'DAMAGE'
  | 'LOST_IN_TRANSIT'
  | 'DELAY'
  | 'COD_DISPUTE'
  | 'WRONG_DELIVERY';

export type ClaimStatus =
  | 'PENDING_INSPECTION'
  | 'ADJUDICATED'
  | 'PAYMENT_APPROVED'
  | 'SETTLED'
  | 'REJECTED';

export type ResponsibleParty =
  | 'UNASSIGNED'
  | 'ORIGIN_HUB'
  | 'TRANSIT_HUB'
  | 'DESTINATION_HUB'
  | 'LINEHAUL_CARRIER'
  | 'LAST_MILE_COURIER'
  | 'MERCHANT';

export interface MerchantClaim {
  id: string;
  claimCode: string;
  shipmentCode: string;
  customerName?: string | null;
  customerPhone?: string | null;
  incidentType: ClaimIncidentType;
  status: ClaimStatus;
  responsibleParty: ResponsibleParty;
  declaredValue: number;
  codAmount: number;
  claimRequestedAmount: number;
  approvedCompensationAmount: number;
  liabilityRatioPercent: number;
  packageDescription?: string | null;
  damageDescription?: string | null;
  adjudicationNotes?: string | null;
  adjudicatedAt?: string | null;
  merchantPaidAt?: string | null;
  reportedAt: string;
  createdAt: string;
}

export interface SettlementBatch {
  id: string;
  code: string;
  cycleName: string;
  fromDate: string;
  toDate: string;
  payoutDate: string;
  orderCount: number;
  codTotal: number;
  feeTotal: number;
  returnFeeTotal: number;
  netPayout: number;
  status: 'PAID' | 'PROCESSING' | 'PENDING';
  bankInfo: string;
  transferRef?: string;
  shipmentCodes: string[];
}

export interface FinancialLedgerEntry {
  id: string;
  occurredAt: string;
  type: 'COD_COLLECTED' | 'SHIPPING_FEE' | 'RETURN_FEE' | 'CLAIM_COMPENSATION' | 'SETTLEMENT_PAYOUT' | 'DEBT_TOPUP';
  title: string;
  shipmentCode?: string;
  amount: number;
  balanceAfter: number;
  note?: string;
}

export interface MerchantBankProfile {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  payoutSchedule: 'MWF' | 'DAILY';
  autoPayout: boolean;
}

export type MerchantRegionCode = 'HA_NOI' | 'DA_NANG' | 'HO_CHI_MINH';

export interface HubApiRecord {
  id: string;
  code: string;
  name: string;
  zoneCode: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface HubLocationOption {
  hubCode: string;
  hubName: string;
  province: string;
  ward: string;
  district: string;
  type: 'BRANCH' | 'SORTING_CENTER' | 'TRANSIT_HUB' | 'UNKNOWN';
  regionCode: MerchantRegionCode | null;
  fullAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  label: string;
}

export interface ConfigApiRecord {
  id: string;
  key: string;
  value: unknown;
  scope: string | null;
}

export interface MerchantProfileConfigPayload {
  username: string;
  citizenId: string;
  regionCode: MerchantRegionCode;
  regionLabel: string;
  defaultHubCode: string | null;
  defaultHubName: string | null;
  defaultSenderAddress: string | null;
  businessAddressDetail: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MerchantProfileApiRecord {
  id: string;
  username: string;
  citizenId: string;
  regionCode: MerchantRegionCode;
  regionLabel: string;
  defaultHubCode: string | null;
  defaultHubName: string | null;
  defaultSenderAddress: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnCaseApiRecord {
  id: string;
  shipmentCode: string;
  ndrCaseId: string | null;
  note: string | null;
  status: 'STARTED' | 'COMPLETED';
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTrackingSnapshotResponse {
  shipmentCode: string;
  current: TrackingCurrent | null;
  timeline: TimelineEvent[];
}

export interface StoredMerchantSession {
  session: MerchantSession;
  storedAt: string;
}

export interface RememberedMerchantCredentials {
  username: string;
  password?: string;
  rememberMe: boolean;
}

