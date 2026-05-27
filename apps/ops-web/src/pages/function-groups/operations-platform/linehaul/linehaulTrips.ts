export type LinehaulTripType = 'PICKUP' | 'DELIVERY';
export type LinehaulTripStatus = 'PLANNED' | 'ARRIVED' | 'PRINTED';

export interface LinehaulTrip {
  id: string;
  tripCode: string;
  originHubCode: string;
  destinationHubCode: string;
  tripType: LinehaulTripType;
  plannedStartAt: string;
  plannedEndAt: string;
  createdAt: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  arrivedAt?: string;
  printedAt?: string;
}

const LINEHAUL_TRIPS_STORAGE_KEY = 'ops.linehaul.trips.v2';

export const LINEHAUL_TRIP_TYPE_LABELS: Record<LinehaulTripType, string> = {
  PICKUP: 'Gom hàng',
  DELIVERY: 'Phát hàng',
};

export function normalizeTripCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toDateTimeLocalValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${toDateInputValue(date)}T${hours}:${minutes}`;
}

export function toLocalInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateTimeLocalValue(date);
}

export function fromDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

export function getLinehaulTripStatus(trip: LinehaulTrip): LinehaulTripStatus {
  if (trip.printedAt) {
    return 'PRINTED';
  }
  return 'PLANNED';
}

export function getLinehaulTripStatusLabel(status: LinehaulTripStatus): string {
  switch (status) {
    case 'ARRIVED':
      return 'Xe đã tới';
    case 'PRINTED':
      return 'Đã in tem';
    case 'PLANNED':
    default:
      return 'Chờ bổ sung tài xế/xe';
  }
}

export function isLinehaulTripType(value: unknown): value is LinehaulTripType {
  return value === 'PICKUP' || value === 'DELIVERY';
}

function isIsoDateLike(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isLinehaulTrip(value: unknown): value is LinehaulTrip {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LinehaulTrip>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.tripCode === 'string' &&
    typeof candidate.originHubCode === 'string' &&
    typeof candidate.destinationHubCode === 'string' &&
    isLinehaulTripType(candidate.tripType) &&
    isIsoDateLike(candidate.plannedStartAt) &&
    isIsoDateLike(candidate.plannedEndAt) &&
    isIsoDateLike(candidate.createdAt)
  );
}

export function readLinehaulTrips(): LinehaulTrip[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(LINEHAUL_TRIPS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isLinehaulTrip)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch {
    return [];
  }
}

export function writeLinehaulTrips(trips: LinehaulTrip[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LINEHAUL_TRIPS_STORAGE_KEY, JSON.stringify(trips));
}

export function createLinehaulTripCode(): string {
  const tripDate = new Date()
    .toISOString()
    .replace(/\D/g, '')
    .slice(2, 8);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `LH-${tripDate}-${suffix}`;
}

export function createLinehaulTrip(input: {
  originHubCode: string;
  destinationHubCode: string;
  tripType: LinehaulTripType;
  plannedStartAt: string;
  plannedEndAt: string;
}): LinehaulTrip {
  const originHubCode = normalizeTripCode(input.originHubCode);
  const destinationHubCode = normalizeTripCode(input.destinationHubCode);
  const now = new Date().toISOString();
  const tripCode = createLinehaulTripCode();

  return {
    id: `trip-${now.replace(/\D/g, '')}-${Math.random().toString(36).slice(2, 8)}`,
    tripCode,
    originHubCode,
    destinationHubCode,
    tripType: input.tripType,
    plannedStartAt: input.plannedStartAt,
    plannedEndAt: input.plannedEndAt,
    createdAt: now,
  };
}
