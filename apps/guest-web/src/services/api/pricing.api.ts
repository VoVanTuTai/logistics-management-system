import { apiClient } from '../client';

export interface PricingQuotePayload {
  serviceType?: string;
  sender?: {
    province?: string;
    hubCode?: string;
  };
  receiver?: {
    province?: string;
    hubCode?: string;
  };
  package?: {
    weightKg?: number;
    dimensionsCm?: {
      length?: number;
      width?: number;
      height?: number;
    };
    declaredValue?: number;
  };
  codAmount?: number;
}

export interface PricingQuoteResponse {
  quoteId: string;
  serviceType: string;
  totalFee: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  breakdown: Array<{
    code: string;
    label: string;
    amount: number;
    basis: string;
  }>;
}

export const pricingApi = {
  calculateQuote: async (payload: PricingQuotePayload): Promise<PricingQuoteResponse> => {
    return apiClient<PricingQuoteResponse>('/public/pricing/quotes', {
      method: 'POST',
      body: payload,
    });
  },
};
