export interface VehicleLabelInfo {
  vehicleCode: string;
  originHubCode: string;
  destinationHubCode: string;
  licensePlate: string;
}

const VEHICLE_FALLBACK_PATTERN = /^(VEH|VH|XE)[A-Z0-9-]{4,}$/;

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
      const vehicleCode = readString(record, ['vehicleCode', 'vehicle_code', 'truckCode', 'code']);
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
        'license_plate',
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

  if (VEHICLE_FALLBACK_PATTERN.test(normalizeCode(trimmed))) {
    return {
      vehicleCode: normalizeCode(trimmed),
      originHubCode: 'UNKNOWN',
      destinationHubCode: 'UNKNOWN',
      licensePlate: 'UNKNOWN',
    };
  }

  return null;
}
