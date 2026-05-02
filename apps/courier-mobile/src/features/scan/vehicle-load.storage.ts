import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VehicleLabelInfo } from './vehicle-label';

const VEHICLE_LOAD_STORAGE_KEY = 'courier-mobile.vehicle-loads';

export type VehicleLoadStatus = 'OPEN' | 'IN_TRANSIT' | 'ARRIVED_AT_HUB';

export interface VehicleLoadedBag {
  bagCode: string;
  shipmentCodes: string[];
  loadedAt: string;
}

export interface VehicleLoadedLooseShipment {
  shipmentCode: string;
  loadedAt: string;
}

export interface VehicleLoadRecord {
  vehicle: VehicleLabelInfo;
  status: VehicleLoadStatus;
  bagItems: VehicleLoadedBag[];
  looseShipments: VehicleLoadedLooseShipment[];
  employeeCode: string | null;
  employeeName: string | null;
  hubCode: string | null;
  createdAt: string;
  updatedAt: string;
  departedAt: string | null;
  arrivedAt: string | null;
  arrivedHubCode: string | null;
}

export async function readVehicleLoadRecords(): Promise<VehicleLoadRecord[]> {
  const rawValue = await AsyncStorage.getItem(VEHICLE_LOAD_STORAGE_KEY);
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
      .filter((item): item is VehicleLoadRecord => item !== null);
  } catch {
    return [];
  }
}

export async function findVehicleLoadRecord(
  vehicleCode: string,
): Promise<VehicleLoadRecord | null> {
  const normalizedVehicleCode = normalizeCode(vehicleCode);
  const records = await readVehicleLoadRecords();

  return (
    records.find(
      (record) => normalizeCode(record.vehicle.vehicleCode) === normalizedVehicleCode,
    ) ?? null
  );
}

export async function upsertVehicleLoadRecord(
  input: Omit<
    VehicleLoadRecord,
    'status' | 'createdAt' | 'updatedAt' | 'departedAt' | 'arrivedAt' | 'arrivedHubCode'
  >,
): Promise<VehicleLoadRecord> {
  const records = await readVehicleLoadRecords();
  const normalizedVehicleCode = normalizeCode(input.vehicle.vehicleCode);
  const existingRecord = records.find(
    (record) => normalizeCode(record.vehicle.vehicleCode) === normalizedVehicleCode,
  );
  const now = new Date().toISOString();

  const nextRecord: VehicleLoadRecord = {
    vehicle: input.vehicle,
    status: existingRecord?.status === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'OPEN',
    bagItems: mergeBagItems(existingRecord?.bagItems ?? [], input.bagItems),
    looseShipments: mergeLooseShipments(
      existingRecord?.looseShipments ?? [],
      input.looseShipments,
    ),
    employeeCode: input.employeeCode,
    employeeName: input.employeeName,
    hubCode: input.hubCode,
    createdAt: existingRecord?.createdAt ?? now,
    updatedAt: now,
    departedAt: existingRecord?.departedAt ?? null,
    arrivedAt: existingRecord?.arrivedAt ?? null,
    arrivedHubCode: existingRecord?.arrivedHubCode ?? null,
  };

  await writeVehicleLoadRecords([
    nextRecord,
    ...records.filter(
      (record) => normalizeCode(record.vehicle.vehicleCode) !== normalizedVehicleCode,
    ),
  ]);

  return nextRecord;
}

export async function markVehicleLoadInTransit(
  vehicleCode: string,
): Promise<VehicleLoadRecord | null> {
  const records = await readVehicleLoadRecords();
  const normalizedVehicleCode = normalizeCode(vehicleCode);
  const existingRecord = records.find(
    (record) => normalizeCode(record.vehicle.vehicleCode) === normalizedVehicleCode,
  );

  if (!existingRecord) {
    return null;
  }

  const nextRecord: VehicleLoadRecord = {
    ...existingRecord,
    status: 'IN_TRANSIT',
    updatedAt: new Date().toISOString(),
    departedAt: new Date().toISOString(),
    arrivedAt: null,
    arrivedHubCode: null,
  };

  await writeVehicleLoadRecords([
    nextRecord,
    ...records.filter(
      (record) => normalizeCode(record.vehicle.vehicleCode) !== normalizedVehicleCode,
    ),
  ]);

  return nextRecord;
}

export async function markVehicleLoadArrivedAtHub(
  vehicleCode: string,
  hubCode: string | null,
): Promise<VehicleLoadRecord | null> {
  const records = await readVehicleLoadRecords();
  const normalizedVehicleCode = normalizeCode(vehicleCode);
  const existingRecord = records.find(
    (record) => normalizeCode(record.vehicle.vehicleCode) === normalizedVehicleCode,
  );

  if (!existingRecord) {
    return null;
  }

  const now = new Date().toISOString();
  const nextRecord: VehicleLoadRecord = {
    ...existingRecord,
    status: 'ARRIVED_AT_HUB',
    updatedAt: now,
    arrivedAt: now,
    arrivedHubCode: hubCode?.trim().toUpperCase() || null,
  };

  await writeVehicleLoadRecords([
    nextRecord,
    ...records.filter(
      (record) => normalizeCode(record.vehicle.vehicleCode) !== normalizedVehicleCode,
    ),
  ]);

  return nextRecord;
}

export function flattenVehicleLoadShipmentCodes(
  record: VehicleLoadRecord,
): Array<{ shipmentCode: string; manifestCode: string | null }> {
  const looseShipments = record.looseShipments.map((item) => ({
    shipmentCode: item.shipmentCode,
    manifestCode: null,
  }));
  const bagShipments = record.bagItems.flatMap((bag) =>
    bag.shipmentCodes.map((shipmentCode) => ({
      shipmentCode,
      manifestCode: bag.bagCode,
    })),
  );

  return [...looseShipments, ...bagShipments];
}

async function writeVehicleLoadRecords(records: VehicleLoadRecord[]): Promise<void> {
  await AsyncStorage.setItem(
    VEHICLE_LOAD_STORAGE_KEY,
    JSON.stringify(records.slice(0, 100)),
  );
}

function mergeBagItems(
  currentItems: VehicleLoadedBag[],
  nextItems: VehicleLoadedBag[],
): VehicleLoadedBag[] {
  const bagByCode = new Map<string, VehicleLoadedBag>();

  [...currentItems, ...nextItems].forEach((item) => {
    const normalizedBagCode = normalizeCode(item.bagCode);
    const existingItem = bagByCode.get(normalizedBagCode);
    const shipmentCodes = Array.from(
      new Set([
        ...(existingItem?.shipmentCodes ?? []),
        ...item.shipmentCodes.map(normalizeCode),
      ]),
    );

    bagByCode.set(normalizedBagCode, {
      bagCode: normalizedBagCode,
      shipmentCodes,
      loadedAt: existingItem?.loadedAt ?? item.loadedAt,
    });
  });

  return Array.from(bagByCode.values());
}

function mergeLooseShipments(
  currentItems: VehicleLoadedLooseShipment[],
  nextItems: VehicleLoadedLooseShipment[],
): VehicleLoadedLooseShipment[] {
  const shipmentByCode = new Map<string, VehicleLoadedLooseShipment>();

  [...currentItems, ...nextItems].forEach((item) => {
    const normalizedShipmentCode = normalizeCode(item.shipmentCode);
    shipmentByCode.set(normalizedShipmentCode, {
      shipmentCode: normalizedShipmentCode,
      loadedAt: shipmentByCode.get(normalizedShipmentCode)?.loadedAt ?? item.loadedAt,
    });
  });

  return Array.from(shipmentByCode.values());
}

function normalizeRecord(value: unknown): VehicleLoadRecord | null {
  if (!isObject(value) || !isObject(value.vehicle)) {
    return null;
  }

  const vehicleCode = stringValue(value.vehicle.vehicleCode);
  const originHubCode = stringValue(value.vehicle.originHubCode);
  const destinationHubCode = stringValue(value.vehicle.destinationHubCode);
  const licensePlate = stringValue(value.vehicle.licensePlate);
  const createdAt = stringValue(value.createdAt);
  const updatedAt = stringValue(value.updatedAt);

  if (!vehicleCode || !originHubCode || !destinationHubCode || !licensePlate || !createdAt || !updatedAt) {
    return null;
  }

  return {
    vehicle: {
      vehicleCode,
      originHubCode,
      destinationHubCode,
      licensePlate,
    },
    status:
      value.status === 'ARRIVED_AT_HUB'
        ? 'ARRIVED_AT_HUB'
        : value.status === 'IN_TRANSIT'
          ? 'IN_TRANSIT'
          : 'OPEN',
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
    updatedAt,
    departedAt: stringValue(value.departedAt),
    arrivedAt: stringValue(value.arrivedAt),
    arrivedHubCode: stringValue(value.arrivedHubCode),
  };
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
    bagCode: normalizeCode(bagCode),
    shipmentCodes: shipmentCodes.map(normalizeCode),
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

  return {
    shipmentCode: normalizeCode(shipmentCode),
    loadedAt,
  };
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
