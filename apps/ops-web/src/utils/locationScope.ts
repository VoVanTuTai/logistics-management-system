import type { HubDto } from '../features/masterdata/masterdata.types';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';

interface HubAddressPayload {
  province: string;
  district: string;
  ward: string;
  serviceAreas: string[];
  type: string;
  coverageProvinceNames: string[];
}

export const PROVINCE_CITY_OPTIONS = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Bắc Ninh',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function parseHubAddress(address: string | null): HubAddressPayload {
  if (!address) {
    return {
      province: '',
      district: '',
      ward: '',
      serviceAreas: [],
      type: '',
      coverageProvinceNames: [],
    };
  }

  try {
    const parsed = asRecord(JSON.parse(address));
    if (!parsed) {
      return { province: '', district: '', ward: '', serviceAreas: [], type: '', coverageProvinceNames: [] };
    }

    return {
      province: toStringValue(parsed.province),
      district: toStringValue(parsed.district),
      ward: toStringValue(parsed.ward),
      serviceAreas: toStringArray(parsed.serviceAreas),
      type: toStringValue(parsed.type).toUpperCase(),
      coverageProvinceNames: toStringArray(parsed.coverageProvinceNames),
    };
  } catch {
    const parts = address
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return {
      province: parts[parts.length - 1] ?? '',
      district: parts.length > 1 ? parts[parts.length - 2] : '',
      ward: parts.length > 2 ? parts[parts.length - 3] : '',
      serviceAreas: [],
      type: '',
      coverageProvinceNames: [],
    };
  }
}

export function formatHubFullAddress(hub: HubDto | null | undefined): string {
  if (!hub) return '';
  if (hub.address) {
    try {
      const parsed = JSON.parse(hub.address);
      if (parsed && typeof parsed === 'object') {
        const parts = [
          parsed.addressLine,
          parsed.ward || hub.ward,
          parsed.district || hub.district,
          parsed.province,
        ].filter((val) => typeof val === 'string' && val.trim().length > 0);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch {
      return hub.address;
    }
  }
  const fallbackParts = [hub.address, hub.ward, hub.district].filter(Boolean);
  return fallbackParts.length > 0 ? fallbackParts.join(', ') : '';
}

function splitAddressTokens(address: string | null): string[] {
  if (!address) {
    return [];
  }

  return address
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function normalizeLocationToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

export function deriveHubScopeTokens(
  hubs: HubDto[],
  assignedHubCodes: string[],
): Set<string> {
  const hubByCode = new Map(
    hubs.map((hub) => [hub.code.trim().toUpperCase(), hub] as const),
  );
  const tokens = new Set<string>();

  for (const hubCode of assignedHubCodes) {
    const normalizedHubCode = hubCode.trim().toUpperCase();
    if (!normalizedHubCode) {
      continue;
    }

    const hub = hubByCode.get(normalizedHubCode);
    if (!hub) {
      continue;
    }

    const parsed = parseHubAddress(hub.address);
    const province = normalizeLocationToken(parsed.province);
    const district = normalizeLocationToken(parsed.district);

    if (province) {
      tokens.add(province);
    }

    if (district) {
      tokens.add(district);
    }

    if (district && province) {
      tokens.add(`${district} ${province}`.trim());
    }

    for (const serviceArea of parsed.serviceAreas) {
      const normalizedServiceArea = normalizeLocationToken(serviceArea);
      if (normalizedServiceArea) {
        tokens.add(normalizedServiceArea);
      }
    }
  }

  return tokens;
}

export function resolveDestinationHub(
  hubs: HubDto[],
  province: string | null | undefined,
  ward?: string | null | undefined,
  address?: string | null | undefined,
): HubDto | null {
  const provinceToken = normalizeLocationToken(province ?? '');

  if (!provinceToken) {
    return null;
  }

  const wardToken = normalizeLocationToken(ward ?? '');
  const addressToken = normalizeLocationToken(address ?? '');

  // Lọc các hubs hoạt động thuộc Tỉnh/Thành này
  const provinceHubs = hubs.filter((hub) => {
    if (!hub.isActive) {
      return false;
    }

    const parsed = parseHubAddress(hub.address);
    const hubProvinceToken = normalizeLocationToken(parsed.province || hub.province || '');

    if (
      hubProvinceToken &&
      (hubProvinceToken === provinceToken ||
        hubProvinceToken.includes(provinceToken) ||
        provinceToken.includes(hubProvinceToken))
    ) {
      return true;
    }

    if (
      parsed.coverageProvinceNames.some((coverageProvince) => {
        const covToken = normalizeLocationToken(coverageProvince);
        return (
          covToken === provinceToken ||
          covToken.includes(provinceToken) ||
          provinceToken.includes(covToken)
        );
      })
    ) {
      return true;
    }

    const rawAddress = normalizeLocationToken(hub.address ?? '');
    const hubName = normalizeLocationToken(hub.name ?? '');
    return rawAddress.includes(provinceToken) || hubName.includes(provinceToken);
  });

  if (provinceHubs.length === 0) {
    return null;
  }

  // 1. Nếu có Phường/Xã (ward): Ưu tiên khớp chính xác bưu cục phụ trách phường đó
  if (wardToken) {
    const coreWard = wardToken.replace(/^(PHUONG|XA|THI TRAN)\s+/, '');

    const exactWardMatch = provinceHubs.find((hub) => {
      const parsed = parseHubAddress(hub.address);
      const hubWardToken = normalizeLocationToken(hub.ward ?? '');
      const parsedWardToken = normalizeLocationToken(parsed.ward ?? '');

      if (
        hubWardToken &&
        (hubWardToken === wardToken ||
          wardToken.includes(hubWardToken) ||
          hubWardToken.includes(wardToken))
      ) {
        return true;
      }
      if (
        parsedWardToken &&
        (parsedWardToken === wardToken ||
          wardToken.includes(parsedWardToken) ||
          parsedWardToken.includes(wardToken))
      ) {
        return true;
      }

      const hubNameToken = normalizeLocationToken(hub.name ?? '');
      if (hubNameToken.includes(wardToken)) {
        return true;
      }

      if (coreWard && (hubNameToken.includes(coreWard) || hubWardToken.includes(coreWard))) {
        return true;
      }

      return parsed.serviceAreas.some((area) => {
        const areaToken = normalizeLocationToken(area);
        return areaToken === wardToken || (coreWard && areaToken.includes(coreWard));
      });
    });

    if (exactWardMatch) {
      return exactWardMatch;
    }
  }

  // 2. Nếu có địa chỉ chi tiết (address): thử tìm bưu cục khớp theo quận/huyện hoặc tên phường có trong chuỗi địa chỉ
  if (addressToken) {
    const addressMatch = provinceHubs.find((hub) => {
      const parsed = parseHubAddress(hub.address);
      const hubWardToken = normalizeLocationToken(hub.ward ?? parsed.ward ?? '');
      if (hubWardToken) {
        const coreWard = hubWardToken.replace(/^(PHUONG|XA|THI TRAN)\s+/, '');
        if (addressToken.includes(hubWardToken) || (coreWard && addressToken.includes(coreWard))) {
          return true;
        }
      }

      const hubDistrictToken = normalizeLocationToken(hub.district ?? parsed.district ?? '');
      if (hubDistrictToken) {
        const coreDistrict = hubDistrictToken.replace(/^(QUAN|HUYEN|THI XA|THANH PHO)\s+/, '');
        if (addressToken.includes(hubDistrictToken) || (coreDistrict && addressToken.includes(coreDistrict))) {
          return true;
        }
      }

      return false;
    });

    if (addressMatch) {
      return addressMatch;
    }
  }

  // 3. Nếu chưa chọn phường hoặc không tìm thấy bưu cục riêng cho phường đó:
  // QUY TẮC BẮT BUỘC: KHÔNG ĐƯỢC CHỌN NGẪU NHIÊN BƯU CỤC CẤP PHƯỜNG NGOẠI VI (như An Phú Đông).
  // Ưu tiên chọn Hub cấp Tỉnh/Thành phố (Level 2 Hub hoặc Hub trung tâm của tỉnh):
  const provincialHub = provinceHubs.find((hub) => {
    const code = hub.code.trim().toUpperCase();
    const name = normalizeLocationToken(hub.name ?? '');
    return (
      hub.level === 2 ||
      code.endsWith('B001') ||
      name.startsWith('HUB TP') ||
      name.startsWith('HUB TINH') ||
      name.includes('TRUNG TAM PHAN LOAI') ||
      name.includes('TRUNG TAM KHAI THAC')
    );
  });

  if (provincialHub) {
    return provincialHub;
  }

  // 4. Nếu không có Hub cấp tỉnh rõ ràng, ưu tiên hub cấp cao hơn (level 2 > level 3)
  const sorted = [...provinceHubs].sort((a, b) => {
    const levelA = a.level ?? 3;
    const levelB = b.level ?? 3;
    if (levelA === 2 && levelB !== 2) return -1;
    if (levelB === 2 && levelA !== 2) return 1;
    return 0;
  });

  return sorted[0] ?? null;
}

export function resolveBranchHubByProvince(
  hubs: HubDto[],
  province: string | null | undefined,
): HubDto | null {
  return resolveDestinationHub(hubs, province);
}

export function shipmentDestinationHubCode(shipment: ShipmentListItemDto): string {
  return (
    shipment.receiverHubCode?.trim().toUpperCase() ||
    shipment.destinationHubCode?.trim().toUpperCase() ||
    ''
  );
}

export function deriveShipmentAreaTokens(shipment: ShipmentListItemDto): string[] {
  const tokens = new Set<string>();

  if (shipment.receiverRegion) {
    tokens.add(normalizeLocationToken(shipment.receiverRegion));
  }

  for (const part of splitAddressTokens(shipment.receiverAddress)) {
    tokens.add(normalizeLocationToken(part));
  }

  return Array.from(tokens).filter((token) => token.length > 0);
}

export function isShipmentInScope(
  shipment: ShipmentListItemDto,
  scopeTokens: Set<string>,
): boolean {
  if (scopeTokens.size === 0) {
    return false;
  }

  const shipmentTokens = deriveShipmentAreaTokens(shipment);
  if (shipmentTokens.length === 0) {
    return false;
  }

  for (const shipmentToken of shipmentTokens) {
    for (const scopeToken of scopeTokens) {
      if (
        shipmentToken === scopeToken ||
        shipmentToken.includes(scopeToken) ||
        scopeToken.includes(shipmentToken)
      ) {
        return true;
      }
    }
  }

  return false;
}
