import { randomUUID } from 'crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  CustomerTier,
  PricingBreakdownItem,
  PricingQuote,
  PricingQuoteInput,
  PricingZone,
  ReturnPolicyQuote,
  ServiceType,
} from '../../domain/entities/pricing-quote.entity';

const QUOTE_VERSION = 'NEXUS_RATES_2026_05';
const DEFAULT_CURRENCY = 'VND';

const SERVICE_RATES: Record<
  ServiceType,
  {
    baseFee: number;
    extraHalfKgFee: number;
  }
> = {
  STANDARD: { baseFee: 18000, extraHalfKgFee: 3500 },
  EXPRESS: { baseFee: 28000, extraHalfKgFee: 5000 },
  SAME_DAY: { baseFee: 42000, extraHalfKgFee: 8000 },
};

const ZONE_SURCHARGES: Record<PricingZone, number> = {
  INTRA_PROVINCE: 0,
  METRO_CORRIDOR: 7000,
  INTER_PROVINCE: 12000,
};

const METRO_PROVINCES = new Set([
  'HA NOI',
  'HANOI',
  'HN',
  'TP HCM',
  'TP. HCM',
  'TPHCM',
  'HO CHI MINH',
  'HO CHI MINH CITY',
  'SAI GON',
  'SG',
  'DA NANG',
  'DN',
]);

@Injectable()
export class PricingService {
  quote(input: PricingQuoteInput): PricingQuote {
    const serviceType = this.resolveServiceType(input);
    const customerTier = this.resolveCustomerTier(input);
    const rates = SERVICE_RATES[serviceType];
    const actualWeightKg = this.normalizeNonNegativeNumber(input.package?.weightKg);
    const length = this.normalizeNonNegativeNumber(input.package?.dimensionsCm?.length);
    const width = this.normalizeNonNegativeNumber(input.package?.dimensionsCm?.width);
    const height = this.normalizeNonNegativeNumber(input.package?.dimensionsCm?.height);
    const volumetricWeightKg = this.roundWeight((length * width * height) / 6000);
    const chargeableWeightKg = this.roundWeight(Math.max(actualWeightKg, volumetricWeightKg));
    const declaredValue = this.normalizeNonNegativeNumber(input.package?.declaredValue);
    const codAmount = this.normalizeNonNegativeNumber(input.codAmount);
    const zone = this.resolveZone(input);
    const currency = this.resolveCurrency(input.currency);
    const breakdown: PricingBreakdownItem[] = [];

    breakdown.push({
      code: 'BASE_SERVICE',
      label: 'Base service fee',
      amount: rates.baseFee,
      basis: serviceType,
    });

    const extraHalfKgUnits = Math.max(0, Math.ceil((chargeableWeightKg - 0.5) / 0.5));
    const weightFee = extraHalfKgUnits * rates.extraHalfKgFee;
    if (weightFee > 0) {
      breakdown.push({
        code: 'CHARGEABLE_WEIGHT',
        label: 'Chargeable weight surcharge',
        amount: weightFee,
        basis: `${chargeableWeightKg}kg tinh cuoc, ${extraHalfKgUnits} nac 0.5kg`,
      });
    }

    const zoneFee = ZONE_SURCHARGES[zone];
    if (zoneFee > 0) {
      breakdown.push({
        code: 'ZONE_SURCHARGE',
        label: 'Route zone surcharge',
        amount: zoneFee,
        basis: zone,
      });
    }

    const insuranceFee = declaredValue > 0 ? Math.round(declaredValue * 0.002) : 0;
    if (insuranceFee > 0) {
      breakdown.push({
        code: 'INSURANCE',
        label: 'Declared value insurance',
        amount: insuranceFee,
        basis: '0.2% gia tri khai bao',
      });
    }

    const codFee = codAmount > 0 ? Math.min(Math.max(Math.round(codAmount * 0.005), 5000), 35000) : 0;
    if (codFee > 0) {
      breakdown.push({
        code: 'COD',
        label: 'COD handling fee',
        amount: codFee,
        basis: '0.5% COD, toi thieu 5.000d, toi da 35.000d',
      });
    }

    const rawSubtotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const subtotalFee = this.roundMoney(rawSubtotal);

    // Apply Tier Commercial Discount
    let discountAmount = 0;
    if (customerTier === 'STANDARD') {
      discountAmount = this.roundMoney(subtotalFee * 0.05);
      if (discountAmount > 0) {
        breakdown.push({
          code: 'MERCHANT_DISCOUNT',
          label: 'Standard Merchant discount (5%)',
          amount: -discountAmount,
          basis: '5% uu dai danh rieng cho Shop tieu chuan',
        });
      }
    } else if (customerTier === 'VIP_ENTERPRISE') {
      discountAmount = this.roundMoney(subtotalFee * 0.15);
      if (discountAmount > 0) {
        breakdown.push({
          code: 'VIP_ENTERPRISE_DISCOUNT',
          label: 'VIP Enterprise contract discount (15%)',
          amount: -discountAmount,
          basis: '15% chiet khau theo hop dong san luong lon (>1.000 don/thang)',
        });
      }
    }

    const totalFee = Math.max(0, subtotalFee - discountAmount);
    const returnPolicy = this.resolveReturnPolicy(totalFee, customerTier);
    const estimatedReturnFee = returnPolicy.fee;

    const quoteTtlMinutes = this.resolveQuoteTtlMinutes();
    const validUntil = new Date(Date.now() + quoteTtlMinutes * 60 * 1000).toISOString();

    return {
      quoteId: randomUUID(),
      quoteVersion: QUOTE_VERSION,
      currency,
      serviceType,
      customerTier,
      zone,
      actualWeightKg,
      volumetricWeightKg,
      chargeableWeightKg,
      subtotalFee,
      discountAmount,
      totalFee,
      estimatedReturnFee,
      returnPolicy,
      validUntil,
      breakdown,
    };
  }

  private resolveCustomerTier(input: PricingQuoteInput): CustomerTier {
    const value = String(input.customerTier ?? '').trim().toUpperCase();

    if (value === 'VIP_ENTERPRISE' || value === 'VIP') {
      return 'VIP_ENTERPRISE';
    }

    if (value === 'STANDARD' || value === 'MERCHANT') {
      return 'STANDARD';
    }

    return 'GUEST';
  }

  private resolveReturnPolicy(forwardFee: number, tier: CustomerTier): ReturnPolicyQuote {
    if (tier === 'VIP_ENTERPRISE') {
      return {
        ratePercent: 0,
        fee: 0,
        settlementMethod: 'WAIVED',
        description: 'Mien phi chuyen hoan 100% (0 VND) cho Doi tac VIP Doanh nghiep theo hop dong.',
      };
    }

    if (tier === 'STANDARD') {
      const returnFee = this.roundMoney(forwardFee * 0.5);
      return {
        ratePercent: 50,
        fee: returnFee,
        settlementMethod: 'COD_SETTLEMENT_DEDUCTION',
        description: 'Thu 50% cuoc chieu di; he thong tu dong can tru vao ky doi soat COD tiep theo cua Shop.',
      };
    }

    const returnFee = this.roundMoney(forwardFee * 0.5);
    return {
      ratePercent: 50,
      fee: returnFee,
      settlementMethod: 'CASH_OR_QR_ON_RETURN',
      description: 'Thu 50% cuoc chieu di; nguoi gui thanh toan tien mat hoac VietQR khi buu ta giao tra hang.',
    };
  }

  private resolveServiceType(input: PricingQuoteInput): ServiceType {
    const raw = String(input.serviceType ?? input.service?.type ?? 'STANDARD')
      .trim()
      .toUpperCase();

    if (raw === 'STANDARD' || raw === 'EXPRESS' || raw === 'SAME_DAY') {
      return raw;
    }

    // Support client aliases gracefully to prevent 400 errors
    if (raw.includes('SAME') || raw.includes('SUPER') || raw.includes('HOA_TOC') || raw.includes('HOATOC')) {
      return 'SAME_DAY';
    }

    if (raw.includes('EXPRESS') || raw.includes('NHANH') || raw.includes('FAST')) {
      return 'EXPRESS';
    }

    if (raw.includes('REGULAR') || raw.includes('TIET_KIEM') || raw.includes('CARGO') || raw.includes('ECO')) {
      return 'STANDARD';
    }

    return 'STANDARD';
  }

  private resolveZone(input: PricingQuoteInput): PricingZone {
    const originProvince = this.normalizeProvince(
      input.origin?.province ?? input.sender?.province ?? null,
    );
    const destinationProvince = this.normalizeProvince(
      input.destination?.province ??
        input.receiver?.province ??
        input.receiver?.region ??
        null,
    );

    if (originProvince && destinationProvince && originProvince === destinationProvince) {
      return 'INTRA_PROVINCE';
    }

    if (METRO_PROVINCES.has(originProvince) && METRO_PROVINCES.has(destinationProvince)) {
      return 'METRO_CORRIDOR';
    }

    return 'INTER_PROVINCE';
  }

  private normalizeProvince(value: string | null | undefined): string {
    const raw = String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    // Strip common administrative prefixes (Thanh pho, TP, Tinh)
    return raw.replace(/^(THANH PHO|TP|TINH)\s+/i, '').trim();
  }

  private normalizeNonNegativeNumber(value: number | string | null | undefined): number {
    const parsed = typeof value === 'number' ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.max(parsed, 0);
  }

  private resolveCurrency(value: string | null | undefined): string {
    const currency = String(value ?? DEFAULT_CURRENCY).trim().toUpperCase();

    return currency || DEFAULT_CURRENCY;
  }

  private resolveQuoteTtlMinutes(): number {
    const ttl = Number(process.env.PRICING_QUOTE_TTL_MINUTES ?? 15);

    return Number.isFinite(ttl) && ttl > 0 ? ttl : 15;
  }

  private roundWeight(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return Math.ceil(value * 2) / 2;
  }

  private roundMoney(value: number): number {
    return Math.round(value / 100) * 100;
  }
}
