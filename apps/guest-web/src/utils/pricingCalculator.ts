import type { PricingQuoteResponse } from '../services/api/pricing.api';

export interface FallbackPricingParams {
  serviceType?: string;
  senderProvince?: string | null;
  receiverProvince?: string | null;
  weightKg?: number;
  codAmount?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export function normalizeProvinceName(val?: string | null): string {
  if (!val) return '';
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/^(THANH PHO|TP|TINH)\s+/i, '')
    .trim();
}

const METRO_CITIES = new Set([
  'HA NOI',
  'HANOI',
  'HN',
  'HO CHI MINH',
  'HO CHI MINH CITY',
  'TP HCM',
  'TP. HCM',
  'TPHCM',
  'SAI GON',
  'SG',
  'DA NANG',
  'DN',
]);

/**
 * Tính cước fallback chuẩn xác theo biểu giá NEXUS_RATES_2026_05 của pricing-service
 * Dùng khi API mạng gián đoạn hoặc offline để đồng nhất hoàn toàn với Mobile và Backend.
 * Chuẩn IATA: Trọng lượng quy đổi thể tích = (Dài x Rộng x Cao) / 6000.
 * Trọng lượng tính cước (Chargeable Weight) = max(Cân thực, Quy đổi thể tích).
 */
export function computeFallbackQuote(params: FallbackPricingParams): PricingQuoteResponse {
  const sType = String(params.serviceType || 'STANDARD').toUpperCase();
  const actualWeight = Math.max(0.1, params.weightKg || 0.5);
  const length = Math.max(0, params.lengthCm || 0);
  const width = Math.max(0, params.widthCm || 0);
  const height = Math.max(0, params.heightCm || 0);

  const volumetricWeight =
    length > 0 && width > 0 && height > 0
      ? Math.round(((length * width * height) / 6000) * 100) / 100
      : 0;

  const chargeableWeight = Math.round(Math.max(actualWeight, volumetricWeight) * 100) / 100;
  const isVolumetric = volumetricWeight > actualWeight;

  let baseFee = 18000;
  let extraRate = 3500;

  if (sType.includes('SAME') || sType.includes('SUPER') || sType.includes('HOA_TOC')) {
    baseFee = 42000;
    extraRate = 8000;
  } else if (sType.includes('EXPRESS') || sType.includes('NHANH')) {
    baseFee = 28000;
    extraRate = 5000;
  }

  const extraHalfKgUnits = Math.max(0, Math.ceil((chargeableWeight - 0.5) / 0.5));
  const weightFee = extraHalfKgUnits * extraRate;

  const sNorm = normalizeProvinceName(params.senderProvince);
  const rNorm = normalizeProvinceName(params.receiverProvince);

  let zoneFee = 0;
  let zoneLabel = 'Nội tỉnh';
  if (sNorm && rNorm && sNorm === rNorm) {
    zoneFee = 0;
    zoneLabel = 'Nội tỉnh';
  } else if (METRO_CITIES.has(sNorm) && METRO_CITIES.has(rNorm)) {
    zoneFee = 7000;
    zoneLabel = 'Trục chính Metro Corridor';
  } else if (sNorm && rNorm) {
    zoneFee = 12000;
    zoneLabel = 'Liên tỉnh phổ thông';
  }

  const cod = params.codAmount || 0;
  const codFee = cod > 0 ? Math.min(Math.max(Math.round(cod * 0.005), 5000), 35000) : 0;

  const total = baseFee + weightFee + zoneFee + codFee;

  const breakdown = [
    { code: 'BASE_SERVICE', label: 'Cước cơ sở (0.5kg đầu)', amount: baseFee, basis: sType },
  ];

  if (weightFee > 0) {
    breakdown.push({
      code: 'CHARGEABLE_WEIGHT',
      label: isVolumetric ? 'Cước vượt nấc (theo thể tích quy đổi)' : 'Cước vượt nấc',
      amount: weightFee,
      basis: isVolumetric
        ? `${chargeableWeight}kg (Quy đổi IATA: ${volumetricWeight}kg > Cân nặng: ${actualWeight}kg)`
        : `${chargeableWeight}kg (${extraHalfKgUnits} nấc 0.5kg)`,
    });
  }

  if (zoneFee > 0) {
    breakdown.push({
      code: 'ZONE_SURCHARGE',
      label: 'Phụ phí vùng miền',
      amount: zoneFee,
      basis: zoneLabel,
    });
  }

  if (codFee > 0) {
    breakdown.push({
      code: 'COD',
      label: 'Phí thu hộ COD',
      amount: codFee,
      basis: `${cod.toLocaleString('vi-VN')}đ COD`,
    });
  }

  return {
    quoteId: `quote-fallback-${Date.now()}`,
    serviceType: sType,
    totalFee: Math.round(total / 100) * 100,
    actualWeightKg: actualWeight,
    volumetricWeightKg: volumetricWeight,
    chargeableWeightKg: chargeableWeight,
    breakdown,
  };
}
