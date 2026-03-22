import type { HubDto } from '../features/masterdata/masterdata.types';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';

interface HubAddressPayload {
  province: string;
  district: string;
  serviceAreas: string[];
}

export const PROVINCE_CITY_OPTIONS = [
  'Ha Noi',
  'Ho Chi Minh',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Binh Duong',
  'Dong Nai',
  'Bac Ninh',
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
      serviceAreas: [],
    };
  }

  try {
    const parsed = asRecord(JSON.parse(address));
    if (!parsed) {
      return { province: '', district: '', serviceAreas: [] };
    }

    return {
      province: toStringValue(parsed.province),
      district: toStringValue(parsed.district),
      serviceAreas: toStringArray(parsed.serviceAreas),
    };
  } catch {
    const parts = address
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return {
      province: parts[parts.length - 1] ?? '',
      district: parts.length > 1 ? parts[parts.length - 2] : '',
      serviceAreas: [],
    };
  }
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
