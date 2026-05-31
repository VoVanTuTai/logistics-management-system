export interface VehicleLabelInfo {
  vehicleCode: string;
  originHubCode: string;
  destinationHubCode: string;
  licensePlate: string;
}

const VEHICLE_FALLBACK_PATTERN = /^[A-Z0-9][A-Z0-9._-]{2,}$/;
const NON_VEHICLE_PREFIXES = ['MB', 'SHP'];

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function readString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return '';
}

export function parseVehicleLabel(rawValue: string): VehicleLabelInfo | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const payload = JSON.parse(trimmed) as unknown;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      const vehicleCode = readString(record, ['seal', 'vehicleCode', 'vehicle_code', 'truckCode', 'code']);
      const originHubCode = readString(record, [
        'originHubCode',
        'origin_hub_code',
        'fromHubCode',
        'from',
      ]);
      const destinationHubCode = readString(record, [
        'destinationHubCode',
        'destination_hub_code',
        'toHubCode',
        'to',
      ]);
      const licensePlate = readString(record, [
        'licensePlate',
        'vehiclePlate',
        'license_plate',
        'vehicle_plate',
        'plateNumber',
        'plate',
      ]);

      if (vehicleCode || originHubCode || destinationHubCode || licensePlate) {
        return {
          vehicleCode: vehicleCode || 'UNKNOWN',
          originHubCode: originHubCode || 'UNKNOWN',
          destinationHubCode: destinationHubCode || 'UNKNOWN',
          licensePlate: licensePlate || 'UNKNOWN',
        };
      }
    }
  } catch {
    // Non-JSON vehicle labels are parsed below.
  }

  const parts = trimmed.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 5 && ['VEH', 'VH', 'XE'].includes(parts[0].toUpperCase())) {
    return {
      vehicleCode: normalizeCode(parts[1]),
      originHubCode: normalizeCode(parts[2]),
      destinationHubCode: normalizeCode(parts[3]),
      licensePlate: normalizeCode(parts.slice(4).join('-')),
    };
  }

  const normalizedValue = normalizeCode(trimmed);
  const tripParts = normalizedValue.split('-').filter(Boolean);
  if (tripParts.length >= 5 && tripParts[0] === 'TRIP') {
    return {
      vehicleCode: normalizedValue,
      originHubCode: tripParts[1] || 'UNKNOWN',
      destinationHubCode: tripParts[2] || 'UNKNOWN',
      licensePlate: 'UNKNOWN',
    };
  }

  if (tripParts.length >= 3 && tripParts[0] === 'LH') {
    return {
      vehicleCode: normalizedValue,
      originHubCode: tripParts.length >= 5 ? tripParts[1] || 'UNKNOWN' : 'UNKNOWN',
      destinationHubCode: tripParts.length >= 5 ? tripParts[2] || 'UNKNOWN' : 'UNKNOWN',
      licensePlate: 'UNKNOWN',
    };
  }

  if (
    VEHICLE_FALLBACK_PATTERN.test(normalizedValue) &&
    !NON_VEHICLE_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix))
  ) {
    return {
      vehicleCode: normalizedValue,
      originHubCode: 'UNKNOWN',
      destinationHubCode: 'UNKNOWN',
      licensePlate: 'UNKNOWN',
    };
  }

  return null;
}
