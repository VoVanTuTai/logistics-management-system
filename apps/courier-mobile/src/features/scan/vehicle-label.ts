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

/**
 * Kiểm tra xem chuỗi có phải là biển số xe chuẩn Việt Nam hay không
 * Ví dụ: 29H-123.45, 51D-987.65, 59C-123.45, 43A-1234, 60B-123.45, 29H12345
 */
export function isVehiclePlate(value: string): boolean {
  if (!value) return false;
  const clean = value.trim().toUpperCase().replace(/\s+/g, '');
  return /^[0-9]{2}[A-Z]{1,2}[-]?[0-9]{3,5}(?:\.[0-9]{2})?$/.test(clean);
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

/**
 * Trích xuất thông tin xe (biển số, hub đi, hub đến) từ ghi chú manifest
 * Hỗ trợ cả định dạng key=value (LINEHAUL_TRIP) và key: value (VEHICLE_OUTBOUND / Audit note)
 */
export function parseLinehaulVehicleNote(note: string | null | undefined): Partial<VehicleLabelInfo> {
  if (!note || !note.trim()) {
    return {};
  }

  const result: Partial<VehicleLabelInfo> = {};
  const trimmed = note.trim();

  // 1. Nếu note là JSON chuỗi
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Record<string, unknown>;
        const plate = readString(p, [
          'licensePlate',
          'vehiclePlate',
          'license_plate',
          'vehicle_plate',
          'plate',
          'plateNumber',
          'bienSo',
          'bien_so',
          'truckPlate',
        ]);
        if (plate && plate !== 'UNKNOWN' && plate !== 'N/A') {
          result.licensePlate = plate;
        }
        const origin = readString(p, ['originHubCode', 'fromHubCode', 'from']);
        if (origin && origin !== 'UNKNOWN' && origin !== 'N/A') {
          result.originHubCode = origin;
        }
        const dest = readString(p, ['destinationHubCode', 'toHubCode', 'to']);
        if (dest && dest !== 'UNKNOWN' && dest !== 'N/A') {
          result.destinationHubCode = dest;
        }
      }
    } catch {
      // Bỏ qua lỗi JSON parse
    }
  }

  // 2. Parse các phân đoạn phân tách bằng '|' hoặc xuống dòng
  const segments = trimmed.split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
  for (const segment of segments) {
    // Tìm dấu phân cách '=' hoặc ':'
    const eqIdx = segment.indexOf('=');
    const colonIdx = segment.indexOf(':');
    let sepIdx = -1;
    if (eqIdx >= 0 && colonIdx >= 0) {
      sepIdx = Math.min(eqIdx, colonIdx);
    } else if (eqIdx >= 0) {
      sepIdx = eqIdx;
    } else if (colonIdx >= 0) {
      sepIdx = colonIdx;
    }

    if (sepIdx > 0) {
      const rawKey = segment.slice(0, sepIdx).trim().toLowerCase();
      const val = segment.slice(sepIdx + 1).trim();
      const normVal = val.toUpperCase();

      if (normVal && normVal !== 'UNKNOWN' && normVal !== 'N/A') {
        // Biển số xe keys
        if (
          rawKey === 'licenseplate' ||
          rawKey === 'vehicleplate' ||
          rawKey === 'license_plate' ||
          rawKey === 'vehicle_plate' ||
          rawKey === 'plate' ||
          rawKey === 'platenumber' ||
          rawKey === 'biển số' ||
          rawKey === 'bien so' ||
          rawKey === 'biển số xe' ||
          rawKey === 'bien so xe' ||
          rawKey === 'bsx'
        ) {
          result.licensePlate = normVal;
        } else if (
          rawKey === 'originhubcode' ||
          rawKey === 'fromhubcode' ||
          rawKey === 'hub đi' ||
          rawKey === 'hub di' ||
          rawKey === 'mã hub' ||
          rawKey === 'ma hub'
        ) {
          result.originHubCode = normVal;
        } else if (
          rawKey === 'destinationhubcode' ||
          rawKey === 'tohubcode' ||
          rawKey === 'hub đến' ||
          rawKey === 'hub den'
        ) {
          result.destinationHubCode = normVal;
        }
      }
    } else {
      // Phân đoạn không có dấu phân cách, kiểm tra xem có chứa biển số xe không
      if (isVehiclePlate(segment)) {
        result.licensePlate = segment.toUpperCase();
      }
    }
  }

  // 3. Regex tìm kiếm biển số xe nếu vẫn chưa có
  if (!result.licensePlate) {
    const plateRegex = /\b([0-9]{2}[A-Z]{1,2}[- ]?[0-9]{3,5}(?:\.[0-9]{2})?)\b/i;
    const match = trimmed.match(plateRegex);
    if (match && match[1]) {
      const candidate = match[1].trim().toUpperCase();
      if (/^[0-9]{2}[A-Z]/.test(candidate)) {
        result.licensePlate = candidate;
      }
    }
  }

  return result;
}

export function parseVehicleLabel(rawValue: string): VehicleLabelInfo | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Trường hợp quét trực tiếp biển số xe
  if (isVehiclePlate(trimmed)) {
    const cleanPlate = normalizeCode(trimmed);
    return {
      vehicleCode: cleanPlate,
      originHubCode: 'UNKNOWN',
      destinationHubCode: 'UNKNOWN',
      licensePlate: cleanPlate,
    };
  }

  // 2. Trường hợp QR Code định dạng JSON
  try {
    const payload = JSON.parse(trimmed) as unknown;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      const vehicleCode = readString(record, [
        'seal',
        'vehicleCode',
        'vehicle_code',
        'tripCode',
        'trip_code',
        'truckCode',
        'code',
      ]);
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
        'bienSo',
        'bien_so',
        'truckPlate',
        'truck_plate',
        'license_plate_number',
        'carPlate',
      ]);

      if (vehicleCode || originHubCode || destinationHubCode || licensePlate) {
        return {
          vehicleCode: vehicleCode || 'UNKNOWN',
          originHubCode: originHubCode || 'UNKNOWN',
          destinationHubCode: destinationHubCode || 'UNKNOWN',
          licensePlate: licensePlate || (isVehiclePlate(vehicleCode) ? vehicleCode : 'UNKNOWN'),
        };
      }
    }
  } catch {
    // Non-JSON vehicle labels are parsed below.
  }

  // 3. Trường hợp chuỗi phân tách bằng '|'
  const parts = trimmed.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 5 && ['VEH', 'VH', 'XE'].includes(parts[0].toUpperCase())) {
    return {
      vehicleCode: normalizeCode(parts[1]),
      originHubCode: normalizeCode(parts[2]),
      destinationHubCode: normalizeCode(parts[3]),
      licensePlate: normalizeCode(parts.slice(4).join('-')),
    };
  }

  // Kiểm tra nếu chuỗi '|' chứa key=value (như LINEHAUL_TRIP hoặc VEHICLE_OUTBOUND)
  if (parts.length >= 2) {
    const parsedNote = parseLinehaulVehicleNote(trimmed);
    // Tìm xem trong các parts có part nào là biển số xe không
    let foundPlate = parsedNote.licensePlate || '';
    if (!foundPlate) {
      for (const p of parts) {
        if (isVehiclePlate(p)) {
          foundPlate = p.toUpperCase();
          break;
        }
      }
    }

    if (parsedNote.originHubCode || parsedNote.destinationHubCode || foundPlate) {
      return {
        vehicleCode: normalizeCode(parts[0]),
        originHubCode: parsedNote.originHubCode || 'UNKNOWN',
        destinationHubCode: parsedNote.destinationHubCode || 'UNKNOWN',
        licensePlate: foundPlate || 'UNKNOWN',
      };
    }
  }

  const normalizedValue = normalizeCode(trimmed);
  const tripParts = normalizedValue.split('-').filter(Boolean);

  // 4. Trường hợp mã chuyến TRIP-xxx
  if (tripParts.length >= 5 && tripParts[0] === 'TRIP') {
    // Kiểm tra xem part cuối có phải biển số xe không
    const potentialPlate = tripParts.slice(3).join('-');
    const plate = isVehiclePlate(potentialPlate) ? potentialPlate : 'UNKNOWN';

    return {
      vehicleCode: normalizedValue,
      originHubCode: tripParts[1] || 'UNKNOWN',
      destinationHubCode: tripParts[2] || 'UNKNOWN',
      licensePlate: plate,
    };
  }

  // 5. Trường hợp mã tuyến LH-xxx
  if (tripParts.length >= 3 && tripParts[0] === 'LH') {
    return {
      vehicleCode: normalizedValue,
      originHubCode: tripParts.length >= 5 ? tripParts[1] || 'UNKNOWN' : 'UNKNOWN',
      destinationHubCode: tripParts.length >= 5 ? tripParts[2] || 'UNKNOWN' : 'UNKNOWN',
      licensePlate: 'UNKNOWN',
    };
  }

  // 6. Trường hợp Fallback
  if (
    VEHICLE_FALLBACK_PATTERN.test(normalizedValue) &&
    !NON_VEHICLE_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix))
  ) {
    const plate = isVehiclePlate(normalizedValue) ? normalizedValue : 'UNKNOWN';
    return {
      vehicleCode: normalizedValue,
      originHubCode: 'UNKNOWN',
      destinationHubCode: 'UNKNOWN',
      licensePlate: plate,
    };
  }

  return null;
}
