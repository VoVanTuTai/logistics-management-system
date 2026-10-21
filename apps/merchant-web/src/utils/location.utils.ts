import type { HubApiRecord, HubLocationOption, MerchantRegionCode } from '../types';
import { normalizeCode } from '../api';

export function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

export function resolveProvinceLabel(rawProvince: string): string | null {
  const trimmedProvince = rawProvince.trim();
  if (!trimmedProvince) {
    return null;
  }

  const normalized = normalizeLocationKey(rawProvince);
  if (['HOCHIMINH', 'HCM', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH'].includes(normalized)) {
    return 'Hồ Chí Minh';
  }
  if (['DANANG', 'DN', 'TPDANANG', 'THANHPHODANANG'].includes(normalized)) {
    return 'Đà Nẵng';
  }
  if (['HANOI', 'HN', 'TPHANOI', 'THANHPHOHANOI'].includes(normalized)) {
    return 'Hà Nội';
  }

  return trimmedProvince;
}

export function resolveRegionCode(rawProvince: string): MerchantRegionCode | null {
  const normalized = normalizeLocationKey(rawProvince);

  if (!normalized) {
    return null;
  }

  if (['HANOI', 'HN', 'TPHANOI', 'THANHPHOHANOI'].includes(normalized)) {
    return 'HA_NOI';
  }
  if (['DANANG', 'DN', 'TPDANANG', 'THANHPHODANANG'].includes(normalized)) {
    return 'DA_NANG';
  }
  if (['HOCHIMINH', 'HCM', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH'].includes(normalized)) {
    return 'HO_CHI_MINH';
  }

  return null;
}

export function resolveRegionCodeByZoneCode(zoneCode: string | null | undefined): MerchantRegionCode | null {
  if (zoneCode === '001') {
    return 'HA_NOI';
  }
  if (zoneCode === '002') {
    return 'DA_NANG';
  }
  if (zoneCode === '003') {
    return 'HO_CHI_MINH';
  }

  return null;
}

export function resolveRegionLabel(regionCode: MerchantRegionCode): string {
  if (regionCode === 'HA_NOI') {
    return 'miền Bắc';
  }
  if (regionCode === 'DA_NANG') {
    return 'miền Trung';
  }
  return 'miền Nam';
}

export function parseHubLocation(hub: HubApiRecord): HubLocationOption | null {
  if (!hub.address) {
    return null;
  }

  let province = '';
  let ward = '';
  let district = '';
  let fullAddress = '';
  let type: HubLocationOption['type'] = 'UNKNOWN';

  try {
    const payload = JSON.parse(hub.address) as Record<string, unknown>;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const addressLine =
      typeof payload.addressLine === 'string' ? payload.addressLine.trim() : '';
    ward = typeof payload.ward === 'string' ? payload.ward.trim() : '';
    province = typeof payload.province === 'string' ? payload.province.trim() : '';
    district = typeof payload.district === 'string' ? payload.district.trim() : '';
    if (
      payload.type === 'BRANCH' ||
      payload.type === 'SORTING_CENTER' ||
      payload.type === 'TRANSIT_HUB'
    ) {
      type = payload.type;
    }
    const addressParts = [addressLine, ward, district, province]
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    fullAddress = Array.from(new Set(addressParts)).join(', ');
  } catch {
    const segments = hub.address.split(',').map((segment) => segment.trim());
    province = segments.length > 0 ? segments[segments.length - 1] : '';
    district = segments.length > 1 ? segments[segments.length - 2] : '';
    ward = district;
    fullAddress = hub.address.trim();
  }

  const normalizedProvince = resolveProvinceLabel(province);
  if (!normalizedProvince) {
    return null;
  }

  const wardOrDistrict = ward || district || normalizedProvince;
  const normalizedFullAddress =
    fullAddress ||
    [ward, district, normalizedProvince].filter((part) => part.length > 0).join(', ');

  return {
    hubCode: hub.code,
    hubName: hub.name,
    province: normalizedProvince,
    ward: wardOrDistrict,
    district,
    type,
    regionCode: resolveRegionCode(normalizedProvince) ?? resolveRegionCodeByZoneCode(hub.zoneCode),
    fullAddress: normalizedFullAddress || hub.name,
    latitude: hub.latitude ?? null,
    longitude: hub.longitude ?? null,
    label: `${hub.name} (${wardOrDistrict}, ${normalizedProvince})`,
  };
}

export function findHubByCode(
  hubLocations: HubLocationOption[],
  hubCode: string,
): HubLocationOption | null {
  const normalizedHubCode = normalizeCode(hubCode);

  if (!normalizedHubCode) {
    return null;
  }

  return (
    hubLocations.find((location) => normalizeCode(location.hubCode) === normalizedHubCode) ??
    null
  );
}

export function findHubByProvinceWard(
  hubLocations: HubLocationOption[],
  province: string,
  ward: string,
): HubLocationOption | null {
  const normalizedProvince = normalizeLocationKey(province);
  const normalizedWard = normalizeLocationKey(ward);

  if (!normalizedProvince || !normalizedWard) {
    return null;
  }

  return (
    hubLocations.find(
      (location) =>
        normalizeLocationKey(location.province) === normalizedProvince &&
        normalizeLocationKey(location.ward) === normalizedWard,
    ) ?? null
  );
}

export function resolveSelectedHub(
  hubLocations: HubLocationOption[],
  hubCode: string,
  province: string,
  ward: string,
): HubLocationOption | null {
  const hubByCode = findHubByCode(hubLocations, hubCode);
  if (hubByCode) {
    const provinceMatches =
      !province || normalizeLocationKey(hubByCode.province) === normalizeLocationKey(province);
    const wardMatches =
      !ward || normalizeLocationKey(hubByCode.ward) === normalizeLocationKey(ward);

    if (provinceMatches && wardMatches) {
      return hubByCode;
    }
  }

  const hubByProvinceWard = findHubByProvinceWard(hubLocations, province, ward);
  if (hubByProvinceWard) {
    return hubByProvinceWard;
  }

  if (hubByCode) {
    return hubByCode;
  }

  return null;
}

export function resolveHubByRegion(
  hubLocations: HubLocationOption[],
  regionCode: MerchantRegionCode,
): HubLocationOption | null {
  const matchedLocations = hubLocations.filter(
    (location) => location.regionCode === regionCode,
  );

  if (matchedLocations.length === 0) {
    return null;
  }

  return matchedLocations.sort((left, right) => left.label.localeCompare(right.label, 'vi'))[0];
}

export function composeDefaultPickupAddress(addressDetail: string, province: string): string {
  return [addressDetail.trim(), province.trim()]
    .filter((part) => part.length > 0)
    .join(', ');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitDefaultPickupAddress(
  defaultAddress: string,
  knownProvinces: string[],
): { addressDetail: string; province: string } {
  const trimmedAddress = defaultAddress.trim();
  if (!trimmedAddress) {
    return {
      addressDetail: '',
      province: '',
    };
  }

  const matchedProvince = knownProvinces
    .slice()
    .sort((left, right) => right.length - left.length)
    .find(
      (province) =>
        normalizeLocationKey(trimmedAddress) === normalizeLocationKey(province) ||
        normalizeLocationKey(trimmedAddress).endsWith(normalizeLocationKey(`, ${province}`)) ||
        normalizeLocationKey(trimmedAddress).endsWith(normalizeLocationKey(province)),
    );

  if (!matchedProvince) {
    return {
      addressDetail: trimmedAddress,
      province: '',
    };
  }

  const detail = trimmedAddress
    .replace(new RegExp(`\\s*,?\\s*${escapeRegExp(matchedProvince)}\\s*$`, 'iu'), '')
    .trim();

  return {
    addressDetail: detail,
    province: matchedProvince,
  };
}

export async function geocodeAddress(
  address: string,
  fallbackCoords?: { latitude?: number | null; longitude?: number | null } | null,
): Promise<{ latitude: number | null; longitude: number | null }> {
  const trimmed = address.trim();
  if (!trimmed) {
    return {
      latitude: fallbackCoords?.latitude ?? null,
      longitude: fallbackCoords?.longitude ?? null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed,
    )}&format=json&limit=1&countrycodes=vn`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
  } catch {
    // Network or timeout failure, smoothly fall back to hub/default coordinates
  }

  return {
    latitude: fallbackCoords?.latitude ?? null,
    longitude: fallbackCoords?.longitude ?? null,
  };
}

export function findHubByProvince(
  hubLocations: HubLocationOption[],
  province: string,
): HubLocationOption | null {
  const normalizedProvince = normalizeLocationKey(province);
  if (!normalizedProvince) {
    return null;
  }

  const matchedLocations = hubLocations.filter(
    (location) => normalizeLocationKey(location.province) === normalizedProvince,
  );

  return (
    matchedLocations.find((location) => location.type === 'BRANCH') ??
    matchedLocations.find((location) => location.type === 'SORTING_CENTER') ??
    matchedLocations[0] ??
    null
  );
}
