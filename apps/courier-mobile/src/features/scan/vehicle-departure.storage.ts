import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VehicleLabelInfo } from './vehicle-label';
import type {
  VehicleLoadedBag,
  VehicleLoadedLooseShipment,
  VehicleLoadStatus,
} from './vehicle-load.storage';

const VEHICLE_DEPARTURE_STORAGE_KEY = 'courier-mobile.vehicle-departures';

export interface VehicleDepartureSeal {
  code: string;
  scannedAt: string;
}

export interface VehicleDepartureRecord {
  id: string;
  vehicle: VehicleLabelInfo;
  sealCodes: VehicleDepartureSeal[];
  proofPhotoUri: string;
  vehicleStatus: VehicleLoadStatus;
  bagItems: VehicleLoadedBag[];
  looseShipments: VehicleLoadedLooseShipment[];
  employeeCode: string | null;
  employeeName: string | null;
  hubCode: string | null;
  createdAt: string;
}

export async function readVehicleDepartureRecords(): Promise<
  VehicleDepartureRecord[]
> {
  const rawValue = await AsyncStorage.getItem(VEHICLE_DEPARTURE_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeRecord(item))
      .filter((item): item is VehicleDepartureRecord => item !== null);
  } catch {
    return [];
  }
}

export async function saveVehicleDepartureRecord(
  record: VehicleDepartureRecord,
): Promise<void> {
  const records = await readVehicleDepartureRecords();
  const nextRecords = [
    record,
    ...records.filter((item) => item.id !== record.id),
  ].slice(0, 100);

  await AsyncStorage.setItem(
    VEHICLE_DEPARTURE_STORAGE_KEY,
    JSON.stringify(nextRecords),
  );
}

function normalizeRecord(value: unknown): VehicleDepartureRecord | null {
  if (!isObject(value) || !isObject(value.vehicle) || !Array.isArray(value.sealCodes)) {
    return null;
  }

  const id = stringValue(value.id);
  const proofPhotoUri = stringValue(value.proofPhotoUri);
  const createdAt = stringValue(value.createdAt);
  const vehicleCode = stringValue(value.vehicle.vehicleCode);
  const originHubCode = stringValue(value.vehicle.originHubCode);
  const destinationHubCode = stringValue(value.vehicle.destinationHubCode);
  const licensePlate = stringValue(value.vehicle.licensePlate);

  if (
    !id ||
    !proofPhotoUri ||
    !createdAt ||
    !vehicleCode ||
    !originHubCode ||
    !destinationHubCode ||
    !licensePlate
  ) {
    return null;
  }

  const sealCodes = value.sealCodes
    .map((item) => normalizeSeal(item))
    .filter((item): item is VehicleDepartureSeal => item !== null);

  if (sealCodes.length === 0) {
    return null;
  }

  return {
    id,
    vehicle: {
      vehicleCode,
      originHubCode,
      destinationHubCode,
      licensePlate,
    },
    sealCodes,
    proofPhotoUri,
    vehicleStatus: value.vehicleStatus === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'OPEN',
    bagItems: Array.isArray(value.bagItems)
      ? value.bagItems
          .map((item) => normalizeBagItem(item))
          .filter((item): item is VehicleLoadedBag => item !== null)
      : [],
    looseShipments: Array.isArray(value.looseShipments)
      ? value.looseShipments
          .map((item) => normalizeLooseShipment(item))
          .filter((item): item is VehicleLoadedLooseShipment => item !== null)
      : [],
    employeeCode: stringValue(value.employeeCode),
    employeeName: stringValue(value.employeeName),
    hubCode: stringValue(value.hubCode),
    createdAt,
  };
}

function normalizeSeal(value: unknown): VehicleDepartureSeal | null {
  if (!isObject(value)) {
    return null;
  }

  const code = stringValue(value.code);
  const scannedAt = stringValue(value.scannedAt);

  if (!code || !scannedAt) {
    return null;
  }

  return { code, scannedAt };
}

function normalizeBagItem(value: unknown): VehicleLoadedBag | null {
  if (!isObject(value) || !Array.isArray(value.shipmentCodes)) {
    return null;
  }

  const bagCode = stringValue(value.bagCode);
  const loadedAt = stringValue(value.loadedAt);
  const shipmentCodes = value.shipmentCodes
    .map(stringValue)
    .filter((item): item is string => item !== null);

  if (!bagCode || !loadedAt || shipmentCodes.length === 0) {
    return null;
  }

  return {
    bagCode,
    shipmentCodes,
    loadedAt,
  };
}

function normalizeLooseShipment(value: unknown): VehicleLoadedLooseShipment | null {
  if (!isObject(value)) {
    return null;
  }

  const shipmentCode = stringValue(value.shipmentCode);
  const loadedAt = stringValue(value.loadedAt);

  if (!shipmentCode || !loadedAt) {
    return null;
  }

  return { shipmentCode, loadedAt };
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
