export interface FallbackPricingParams {
  serviceType?: string;
  senderProvince?: string | null;
  receiverProvince?: string | null;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  codAmount?: number;
  declaredValue?: number;
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
 * Dùng khi API mạng gián đoạn hoặc offline để đảm bảo không lệch giá giữa các nền tảng.
 */
export function computeFallbackPricing(params: FallbackPricingParams): number {
  const sType = String(params.serviceType || 'STANDARD').toUpperCase();
  const weight = Math.max(0.1, params.weightKg || 0.5);
  const length = Math.max(1, params.lengthCm || 10);
  const width = Math.max(1, params.widthCm || 10);
  const height = Math.max(1, params.heightCm || 5);

  const volumetricWeight = (length * width * height) / 6000;
  const chargeableWeight = Math.max(weight, volumetricWeight);

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
  if (sNorm && rNorm && sNorm === rNorm) {
    zoneFee = 0; // Nội tỉnh
  } else if (METRO_CITIES.has(sNorm) && METRO_CITIES.has(rNorm)) {
    zoneFee = 7000; // Trục chính Metro Corridor (Hà Nội - TP.HCM - Đà Nẵng)
  } else if (sNorm && rNorm) {
    zoneFee = 12000; // Liên tỉnh thông thường
  }

  const cod = params.codAmount || 0;
  const codFee = cod > 0 ? Math.min(Math.max(Math.round(cod * 0.005), 5000), 35000) : 0;

  const declared = params.declaredValue || 0;
  const insuranceFee = declared > 0 ? Math.round(declared * 0.002) : 0;

  return Math.round((baseFee + weightFee + zoneFee + codFee + insuranceFee) / 100) * 100;
}
