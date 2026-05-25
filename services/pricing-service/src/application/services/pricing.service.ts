import { randomUUID } from 'crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  PricingBreakdownItem,
  PricingQuote,
  PricingQuoteInput,
  PricingZone,
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
  'TP HCM',
  'TP. HCM',
  'HO CHI MINH',
  'HO CHI MINH CITY',
  'DA NANG',
]);

@Injectable()
export class PricingService {
  quote(input: PricingQuoteInput): PricingQuote {
    const serviceType = this.resolveServiceType(input);
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

    const rawTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const totalFee = this.roundMoney(rawTotal);
    const quoteTtlMinutes = this.resolveQuoteTtlMinutes();
    const validUntil = new Date(Date.now() + quoteTtlMinutes * 60 * 1000).toISOString();

    return {
      quoteId: randomUUID(),
      quoteVersion: QUOTE_VERSION,
      currency,
      serviceType,
      zone,
      actualWeightKg,
      volumetricWeightKg,
      chargeableWeightKg,
      totalFee,
      validUntil,
      breakdown,
    };
  }

  private resolveServiceType(input: PricingQuoteInput): ServiceType {
    const value = String(input.serviceType ?? input.service?.type ?? 'STANDARD')
      .trim()
      .toUpperCase();

    if (value === 'STANDARD' || value === 'EXPRESS' || value === 'SAME_DAY') {
      return value;
    }

    throw new BadRequestException(
      'serviceType must be one of STANDARD, EXPRESS, SAME_DAY.',
    );
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
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
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
