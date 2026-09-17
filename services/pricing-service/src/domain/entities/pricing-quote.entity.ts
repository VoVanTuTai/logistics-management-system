export type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
export type PricingZone = 'INTRA_PROVINCE' | 'METRO_CORRIDOR' | 'INTER_PROVINCE';
export type CustomerTier = 'GUEST' | 'STANDARD' | 'VIP_ENTERPRISE';

export interface PricingAddressInput {
  province?: string | null;
  hubCode?: string | null;
}

export interface PricingPackageInput {
  weightKg?: number | string | null;
  dimensionsCm?: {
    length?: number | string | null;
    width?: number | string | null;
    height?: number | string | null;
  } | null;
  declaredValue?: number | string | null;
}

export interface PricingQuoteInput {
  serviceType?: ServiceType | string | null;
  service?: {
    type?: ServiceType | string | null;
  } | null;
  customerTier?: CustomerTier | string | null;
  sender?: PricingAddressInput | null;
  receiver?: PricingAddressInput & {
    region?: string | null;
  } | null;
  origin?: PricingAddressInput | null;
  destination?: PricingAddressInput | null;
  package?: PricingPackageInput | null;
  codAmount?: number | string | null;
  currency?: string | null;
}

export interface PricingBreakdownItem {
  code: string;
  label: string;
  amount: number;
  basis: string;
}

export interface ReturnPolicyQuote {
  ratePercent: number;
  fee: number;
  settlementMethod: 'CASH_OR_QR_ON_RETURN' | 'COD_SETTLEMENT_DEDUCTION' | 'WAIVED';
  description: string;
}

export interface PricingQuote {
  quoteId: string;
  quoteVersion: string;
  currency: string;
  serviceType: ServiceType;
  customerTier: CustomerTier;
  zone: PricingZone;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  subtotalFee: number;
  discountAmount: number;
  totalFee: number;
  estimatedReturnFee: number;
  returnPolicy: ReturnPolicyQuote;
  validUntil: string;
  breakdown: PricingBreakdownItem[];
}

