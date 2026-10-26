import type { CreateShipmentForm } from '../types';
import { asNumber } from '../api';
import { normalizeLocationKey } from './location.utils';

export const PRICING_METRO_CITIES = new Set([
  'HANOI',
  'HN',
  'TPHANOI',
  'THANHPHOHANOI',
  'HOCHIMINH',
  'HCM',
  'TPHOCHIMINH',
  'THANHPHOHOCHIMINH',
  'SAIGON',
  'HCM',
  'DANANG',
  'DN',
  'TPDANANG',
  'THANHPHODANANG',
]);

export function computeAccurateEstimatedFee(
  form: CreateShipmentForm,
  senderProvince?: string | null,
  receiverProvince?: string | null,
): number {
  const serviceType = String(form.serviceType || 'STANDARD').toUpperCase();
  let baseFee = 18000;
  let extraRate = 3500;

  if (serviceType.includes('SAME') || serviceType.includes('SUPER') || serviceType.includes('HOA_TOC')) {
    baseFee = 42000;
    extraRate = 8000;
  } else if (serviceType.includes('EXPRESS') || serviceType.includes('NHANH')) {
    baseFee = 28000;
    extraRate = 5000;
  }

  const actualWeight = Math.max(0, asNumber(form.weightKg, 0));
  const length = Math.max(0, asNumber(form.lengthCm, 0));
  const width = Math.max(0, asNumber(form.widthCm, 0));
  const height = Math.max(0, asNumber(form.heightCm, 0));

  const volumetricWeight =
    length > 0 && width > 0 && height > 0
      ? (length * width * height) / 6000
      : 0;

  const chargeableWeight = Math.max(actualWeight, volumetricWeight);
  const extraHalfKgUnits = Math.max(0, Math.ceil((chargeableWeight - 0.5) / 0.5));
  const weightFee = extraHalfKgUnits * extraRate;

  const normSender = normalizeLocationKey(senderProvince || form.senderProvince || '');
  const normReceiver = normalizeLocationKey(receiverProvince || form.receiverProvince || form.receiverRegion || '');

  let zoneFee = 0;
  if (normSender && normReceiver && normSender === normReceiver) {
    zoneFee = 0;
  } else if (PRICING_METRO_CITIES.has(normSender) && PRICING_METRO_CITIES.has(normReceiver)) {
    zoneFee = 7000;
  } else if (normSender && normReceiver) {
    zoneFee = 12000;
  }

  const cod = Math.max(0, asNumber(form.codAmount, 0));
  const codFee = cod > 0 ? Math.min(Math.max(Math.round(cod * 0.005), 5000), 35000) : 0;

  return Math.round(baseFee + weightFee + zoneFee + codFee);
}
