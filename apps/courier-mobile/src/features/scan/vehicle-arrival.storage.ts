import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VehicleDepartureSeal } from './vehicle-departure.storage';
import type { VehicleLabelInfo } from './vehicle-label';

const VEHICLE_ARRIVAL_STORAGE_KEY = 'courier-mobile.vehicle-arrivals';

export interface VehicleArrivalRecord {
  id: string;
  vehicle: VehicleLabelInfo;
  proofPhotoUri: string;
  scannedSealCodes: VehicleDepartureSeal[];
  expectedSealCodes: string[];
  sealMatched: boolean;
  note: string;
  employeeCode: string | null;
  employeeName: string | null;
  hubCode: string | null;
  arrivedAt: string;
}

export async function readVehicleArrivalRecords(): Promise<
  VehicleArrivalRecord[]
> {
  const rawValue = await AsyncStorage.getItem(VEHICLE_ARRIVAL_STORAGE_KEY);
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
      .filter((item): item is VehicleArrivalRecord => item !== null);
  } catch {
    return [];
  }
}

export async function saveVehicleArrivalRecord(
  record: VehicleArrivalRecord,
): Promise<void> {
  const records = await readVehicleArrivalRecords();
  const nextRecords = [
    record,
    ...records.filter((item) => item.id !== record.id),
  ].slice(0, 100);

  await AsyncStorage.setItem(
    VEHICLE_ARRIVAL_STORAGE_KEY,
    JSON.stringify(nextRecords),
  );
}

function normalizeRecord(value: unknown): VehicleArrivalRecord | null {
  if (!isObject(value) || !isObject(value.vehicle) || !Array.isArray(value.scannedSealCodes)) {
    return null;
  }

  const id = stringValue(value.id);
  const proofPhotoUri = stringValue(value.proofPhotoUri);
  const note = stringValue(value.note);
  const arrivedAt = stringValue(value.arrivedAt);
  const vehicleCode = stringValue(value.vehicle.vehicleCode);
  const originHubCode = stringValue(value.vehicle.originHubCode);
  const destinationHubCode = stringValue(value.vehicle.destinationHubCode);
  const licensePlate = stringValue(value.vehicle.licensePlate);

  if (
    !id ||
    !proofPhotoUri ||
    !note ||
    !arrivedAt ||
    !vehicleCode ||
    !originHubCode ||
    !destinationHubCode ||
    !licensePlate
  ) {
    return null;
  }

  const scannedSealCodes = value.scannedSealCodes
    .map((item) => normalizeSeal(item))
    .filter((item): item is VehicleDepartureSeal => item !== null);

  if (scannedSealCodes.length === 0) {
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
    proofPhotoUri,
    scannedSealCodes,
    expectedSealCodes: Array.isArray(value.expectedSealCodes)
      ? value.expectedSealCodes
          .map(stringValue)
          .filter((item): item is string => item !== null)
      : [],
    sealMatched: value.sealMatched === true,
    note,
    employeeCode: stringValue(value.employeeCode),
    employeeName: stringValue(value.employeeName),
    hubCode: stringValue(value.hubCode),
    arrivedAt,
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

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
