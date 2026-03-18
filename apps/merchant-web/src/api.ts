import type { CreateShipmentForm, ShipmentResponse, ShipmentRow } from './types';

export const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';

interface ApiErrorPayload {
  message?: string | string[];
}

export function parseStorage<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function toInputDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function parseApiError(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  const maybePayload = payload as ApiErrorPayload | null;

  if (Array.isArray(maybePayload?.message)) {
    return maybePayload.message.join(', ');
  }

  if (typeof maybePayload?.message === 'string') {
    return maybePayload.message;
  }

  return `Request failed (${status})`;
}

function resolveApiUrl(path: string): string {
  if (!gatewayBaseUrl) {
    return path;
  }

  const normalizedBase = gatewayBaseUrl.endsWith('/')
    ? gatewayBaseUrl.slice(0, -1)
    : gatewayBaseUrl;
  return `${normalizedBase}${path}`;
}

export async function request<T>(
  path: string,
  options: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
  });
  const text = await response.text();
  let payload: unknown = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(parseApiError(payload, response.status));
  }

  return payload as T;
}

export function randomCodeSegment(size: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';

  for (let index = 0; index < size; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
}

export function generatePickupCode(): string {
  const date = new Date();
  const datePart = `${date.getFullYear().toString().slice(-2)}${`${date.getMonth() + 1}`.padStart(2, '0')}${`${date.getDate()}`.padStart(2, '0')}`;
  return `PU${datePart}${randomCodeSegment(4)}`;
}

export function generateLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function computeEstimatedFee(form: CreateShipmentForm): number {
  const serviceBase = {
    STANDARD: 18000,
    EXPRESS: 28000,
    SAME_DAY: 42000,
  }[form.serviceType];

  const weightKg = Math.max(asNumber(form.weightKg, 0), 0);
  const length = Math.max(asNumber(form.lengthCm, 0), 0);
  const width = Math.max(asNumber(form.widthCm, 0), 0);
  const height = Math.max(asNumber(form.heightCm, 0), 0);
  const declaredValue = Math.max(asNumber(form.declaredValue, 0), 0);
  const codAmount = Math.max(asNumber(form.codAmount, 0), 0);

  const weightFee = weightKg * 4500;
  const volumetricWeight = (length * width * height) / 6000;
  const volumeFee = volumetricWeight * 3200;
  const insuredFee = declaredValue * 0.002;
  const codFee = Math.min(codAmount * 0.005, 35000);

  return Math.round(serviceBase + weightFee + volumeFee + insuredFee + codFee);
}

export function buildShipmentMetadata(
  form: CreateShipmentForm,
  estimatedFee: number,
): Record<string, unknown> {
  return {
    sender: {
      name: form.senderName.trim() || null,
      phone: form.senderPhone.trim() || null,
      address: form.senderAddress.trim() || null,
    },
    receiver: {
      name: form.receiverName.trim() || null,
      phone: form.receiverPhone.trim() || null,
      address: form.receiverAddress.trim() || null,
      region: form.receiverRegion.trim() || null,
    },
    package: {
      itemType: form.itemType.trim() || null,
      weightKg: asNumber(form.weightKg, 0),
      dimensionsCm: {
        length: asNumber(form.lengthCm, 0),
        width: asNumber(form.widthCm, 0),
        height: asNumber(form.heightCm, 0),
      },
      declaredValue: asNumber(form.declaredValue, 0),
    },
    service: {
      type: form.serviceType,
    },
    codAmount: asNumber(form.codAmount, 0),
    deliveryNote: form.deliveryNote.trim() || null,
    estimatedFee,
    source: 'merchant-web',
  };
}

export function extractShipmentRow(shipment: ShipmentResponse): ShipmentRow {
  const metadata = asRecord(shipment.metadata) ?? {};
  const sender = asRecord(metadata.sender);
  const receiver = asRecord(metadata.receiver);
  const packageInfo = asRecord(metadata.package);
  const service = asRecord(metadata.service);
  const dimensions = asRecord(packageInfo?.dimensionsCm);

  const senderName = asString(sender?.name) || asString(metadata.senderName) || '-';
  const senderPhone = asString(sender?.phone) || '-';
  const senderAddress = asString(sender?.address) || '-';
  const receiverName =
    asString(receiver?.name) || asString(metadata.receiverName) || '-';
  const receiverPhone =
    asString(receiver?.phone) || asString(metadata.receiverPhone) || '-';
  const receiverAddress = asString(receiver?.address) || '-';
  const receiverRegion = asString(receiver?.region) || '-';
  const serviceType = asString(service?.type) || 'STANDARD';
  const itemType = asString(packageInfo?.itemType) || '-';
  const weightKg = asNumber(packageInfo?.weightKg, 0);
  const length = asNumber(dimensions?.length, 0);
  const width = asNumber(dimensions?.width, 0);
  const height = asNumber(dimensions?.height, 0);
  const declaredValue = asNumber(packageInfo?.declaredValue, 0);
  const codAmount = asNumber(metadata.codAmount, 0);
  const feeEstimate = asNumber(metadata.estimatedFee, 0);
  const deliveryNote =
    asString(metadata.deliveryNote) || asString(metadata.note) || '-';

  return {
    shipment,
    senderName,
    senderPhone,
    senderAddress,
    receiverName,
    receiverPhone,
    receiverAddress,
    receiverRegion,
    serviceType,
    itemType,
    weightKg,
    dimensionsText: `${length}x${width}x${height} cm`,
    declaredValue,
    codAmount,
    feeEstimate,
    deliveryNote,
  };
}

export function statusClass(status: string): string {
  if (status === 'CREATED' || status === 'UPDATED') {
    return 'status status-created';
  }
  if (status === 'DELIVERED' || status === 'COMPLETED') {
    return 'status status-done';
  }
  if (
    status === 'DELIVERY_FAILED' ||
    status === 'RETURN_STARTED' ||
    status === 'RETURN_COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'NDR_CREATED'
  ) {
    return 'status status-fail';
  }

  return 'status status-inprogress';
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

