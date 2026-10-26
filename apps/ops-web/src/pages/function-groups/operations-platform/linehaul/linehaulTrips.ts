import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';

export type LinehaulTripType = 'PICKUP' | 'DELIVERY';
export type LinehaulTripStatus = 'PLANNED' | 'ARRIVED' | 'PRINTED' | 'SEALED' | 'RECEIVED';

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
  manifestId?: string;
  shipmentCount?: number;
  sealCode?: string;
  sealedAt?: string;
  sealedBy?: string;
  receivedAt?: string;
  receivedBy?: string;
  receiveNote?: string;
  isDbSynced?: boolean;
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
  if (trip.receivedAt) {
    return 'RECEIVED';
  }
  if (trip.sealedAt) {
    return 'SEALED';
  }
  if (trip.printedAt) {
    return 'PRINTED';
  }
  return 'PLANNED';
}

export function getLinehaulTripStatusLabel(status: LinehaulTripStatus): string {
  switch (status) {
    case 'RECEIVED':
      return 'Đã tiếp nhận tại Hub đích';
    case 'SEALED':
      return 'Đang vận chuyển (Đã kẹp chì)';
    case 'ARRIVED':
      return 'Xe đã tới Hub đích';
    case 'PRINTED':
      return 'Sẵn sàng xuất bến (Đã in tem)';
    case 'PLANNED':
    default:
      return 'Chờ bổ sung tài xế/xe';
  }
}

export function parseTripFromManifest(manifest: ManifestListItemDto): LinehaulTrip {
  const note = manifest.note ?? '';
  let tripType: LinehaulTripType = 'DELIVERY';
  let driverName = '';
  let driverPhone = '';
  let vehiclePlate = '';
  let plannedStartAt = manifest.createdAt || new Date().toISOString();
  let plannedEndAt = manifest.sealedAt || manifest.createdAt || new Date().toISOString();
  let receiveNote = '';
  let noteShipmentCount = 0;

  if (note.includes('LINEHAUL_TRIP') || note.includes('=')) {
    const parts = note.split('|');
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (!k || !v) continue;
      const key = k.trim().toLowerCase();
      const val = v.trim();
      if (key === 'triptype' && (val === 'PICKUP' || val === 'DELIVERY')) {
        tripType = val;
      } else if (key === 'drivername') {
        driverName = val;
      } else if (key === 'driverphone') {
        driverPhone = val;
      } else if (key === 'vehicleplate' || key === 'licenseplate') {
        vehiclePlate = val;
      } else if (key === 'plannedstartat') {
        plannedStartAt = val;
      } else if (key === 'plannedendat') {
        plannedEndAt = val;
      } else if (key === 'receivenote') {
        receiveNote = val;
      } else if (key === 'shipmentcount') {
        noteShipmentCount = parseInt(val, 10) || 0;
      }
    }
  }

  const sealRecord = manifest.sealRecord;
  const receiveRecord = manifest.receiveRecord;

  // Extract sealCode
  let sealCode = sealRecord?.sealedBy || undefined;
  if (sealRecord?.note) {
    const match = sealRecord.note.match(/sealCode=([^|]+)/i);
    if (match && match[1]) {
      sealCode = match[1].trim();
    } else if (!sealCode && sealRecord.note.trim()) {
      sealCode = sealRecord.note.trim();
    }
  }

  // Extract shipmentCount
  const count =
    manifest.shipmentCount !== undefined && manifest.shipmentCount > 0
      ? manifest.shipmentCount
      : noteShipmentCount;

  return {
    id: manifest.id,
    manifestId: manifest.id,
    tripCode: manifest.manifestCode,
    originHubCode: manifest.originHubCode || 'N/A',
    destinationHubCode: manifest.destinationHubCode || 'N/A',
    tripType,
    plannedStartAt,
    plannedEndAt,
    createdAt: manifest.createdAt || plannedStartAt,
    driverName: driverName || undefined,
    driverPhone: driverPhone || undefined,
    vehiclePlate: vehiclePlate || undefined,
    shipmentCount: count,
    sealedAt: manifest.sealedAt || sealRecord?.sealedAt || undefined,
    sealedBy: sealRecord?.sealedBy || undefined,
    sealCode,
    receivedAt: manifest.receivedAt || receiveRecord?.receivedAt || undefined,
    receivedBy: receiveRecord?.receivedBy || undefined,
    receiveNote: receiveRecord?.note || receiveNote || undefined,
    isDbSynced: true,
  };
}

export function mergeTripsWithManifests(
  manifests: ManifestListItemDto[],
  localTrips: LinehaulTrip[],
): LinehaulTrip[] {
  const dbTripsMap = new Map<string, LinehaulTrip>();

  for (const m of manifests) {
    // Recognize manifests that are linehaul trips (exclude bagging manifests starting with BAG-)
    const isLinehaul =
      (m.note?.includes('LINEHAUL_TRIP') ||
        m.manifestCode.startsWith('LH-') ||
        m.manifestCode.startsWith('XT-') ||
        m.manifestCode.startsWith('TRIP-')) &&
      !m.manifestCode.startsWith('BAG-');

    if (isLinehaul) {
      const trip = parseTripFromManifest(m);
      dbTripsMap.set(normalizeTripCode(trip.tripCode), trip);
    }
  }

  const result: LinehaulTrip[] = Array.from(dbTripsMap.values());

  for (const local of localTrips) {
    const code = normalizeTripCode(local.tripCode);
    const existing = dbTripsMap.get(code);
    if (!existing) {
      result.push(local);
    } else {
      if (local.printedAt && !existing.printedAt) {
        existing.printedAt = local.printedAt;
      }
      if (!existing.driverName && local.driverName) {
        existing.driverName = local.driverName;
        existing.driverPhone = local.driverPhone;
        existing.vehiclePlate = local.vehiclePlate;
      }
      if (!existing.shipmentCount && local.shipmentCount) {
        existing.shipmentCount = local.shipmentCount;
      }
    }
  }

  return result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
