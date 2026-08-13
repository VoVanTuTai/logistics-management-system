export interface ParsedVietnameseAddress {
  province: string | null;
  district: string | null;
  ward: string | null;
  detail: string | null;
  rawAddress: string | null;
}

export interface AddressMetadataFallback {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
}

const PROVINCE_ALIASES: Record<string, string> = {
  TPHCM: 'Hồ Chí Minh',
  'TP HCM': 'Hồ Chí Minh',
  'TP HO CHI MINH': 'Hồ Chí Minh',
  'HO CHI MINH': 'Hồ Chí Minh',
  'SAI GON': 'Hồ Chí Minh',
  HN: 'Hà Nội',
  'HA NOI': 'Hà Nội',
  'TP HA NOI': 'Hà Nội',
  DN: 'Đà Nẵng',
  'DA NANG': 'Đà Nẵng',
  'TP DA NANG': 'Đà Nẵng',
  HP: 'Hải Phòng',
  'HAI PHONG': 'Hải Phòng',
  'TP HAI PHONG': 'Hải Phòng',
  CT: 'Cần Thơ',
  'CAN THO': 'Cần Thơ',
  'TP CAN THO': 'Cần Thơ',
  'BINH DUONG': 'Bình Dương',
  'DONG NAI': 'Đồng Nai',
  'BAC NINH': 'Bắc Ninh',
};

/**
 * Strips Vietnamese diacritics and converts string to uppercase alphanumeric space-separated string.
 */
export function normalizeLocationToken(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/**
 * Normalizes ward/district name to a stripped canonical key for loose comparison.
 * e.g. "Phường 02" -> "2", "P. Bến Nghé" -> "BEN NGHE", "Phường Bến Nghé" -> "BEN NGHE"
 */
export function normalizeWardKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  let cleaned = normalizeLocationToken(value);
  
  // Remove administrative prefixes
  cleaned = cleaned
    .replace(/^(PHUONG|P|XA|X|THI TRAN|TT)\s+/i, '')
    .trim();

  // Normalize leading zeros in numbers (e.g. "02" -> "2")
  cleaned = cleaned.replace(/^0+([1-9]\d*)$/, '$1');

  return cleaned;
}

/**
 * Normalizes district key for comparison (e.g. "Quận 01" -> "1", "Q. Đống Đa" -> "DONG DA").
 */
export function normalizeDistrictKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  let cleaned = normalizeLocationToken(value);
  cleaned = cleaned
    .replace(/^(QUAN|Q|HUYEN|H|THI XA|TX|THANH PHO|TP)\s+/i, '')
    .trim();

  cleaned = cleaned.replace(/^0+([1-9]\d*)$/, '$1');
  return cleaned;
}

/**
 * Normalizes a Ward name for display/saving.
 * e.g. "P. 02" -> "Phường 2", "p.bến nghé" -> "Phường Bến Nghé", "Xã Tân Nhựt" -> "Xã Tân Nhựt"
 */
export function formatWardName(rawWard: string): string {
  const trimmed = rawWard.trim();
  if (!trimmed) {
    return '';
  }

  // If already starts with Phường, Xã, Thị trấn
  if (/^(Phường|Xã|Thị trấn)\s+/i.test(trimmed)) {
    return trimmed.replace(/^P\.\s*/i, 'Phường ').replace(/^X\.\s*/i, 'Xã ');
  }

  if (/^P\.?\s*/i.test(trimmed)) {
    const wardNumOrName = trimmed.replace(/^P\.?\s*/i, '').trim();
    const cleanNum = wardNumOrName.replace(/^0+([1-9]\d*)$/, '$1');
    return `Phường ${cleanNum}`;
  }

  if (/^X\.?\s*/i.test(trimmed)) {
    return `Xã ${trimmed.replace(/^X\.?\s*/i, '').trim()}`;
  }

  if (/^TT\.?\s*/i.test(trimmed)) {
    return `Thị trấn ${trimmed.replace(/^TT\.?\s*/i, '').trim()}`;
  }

  return trimmed;
}

/**
 * Normalizes a District name for display/saving.
 */
export function formatDistrictName(rawDistrict: string): string {
  const trimmed = rawDistrict.trim();
  if (!trimmed) {
    return '';
  }

  if (/^(Quận|Huyện|Thị xã|Thành phố)\s+/i.test(trimmed)) {
    return trimmed;
  }

  if (/^Q\.?\s*/i.test(trimmed)) {
    const numOrName = trimmed.replace(/^Q\.?\s*/i, '').trim();
    const cleanNum = numOrName.replace(/^0+([1-9]\d*)$/, '$1');
    return `Quận ${cleanNum}`;
  }

  if (/^H\.?\s*/i.test(trimmed)) {
    return `Huyện ${trimmed.replace(/^H\.?\s*/i, '').trim()}`;
  }

  if (/^Tx\.?\s*/i.test(trimmed)) {
    return `Thị xã ${trimmed.replace(/^Tx\.?\s*/i, '').trim()}`;
  }

  if (/^TP\.?\s*/i.test(trimmed)) {
    return `Thành phố ${trimmed.replace(/^TP\.?\s*/i, '').trim()}`;
  }

  return trimmed;
}

/**
 * Normalizes a Province name.
 */
export function formatProvinceName(rawProvince: string): string {
  const normalizedKey = normalizeLocationToken(rawProvince);
  if (PROVINCE_ALIASES[normalizedKey]) {
    return PROVINCE_ALIASES[normalizedKey];
  }

  const trimmed = rawProvince.trim();
  if (/^TP\.?\s*/i.test(trimmed) || /^Tỉnh\s+/i.test(trimmed)) {
    return trimmed.replace(/^TP\.?\s*/i, 'TP. ');
  }

  return trimmed;
}

/**
 * Automatically cuts and parses a raw Vietnamese address string into structured parts:
 * province, district, ward, and street detail.
 */
export function parseVietnameseAddress(
  addressInput: string | null | undefined,
  metadataFallback?: AddressMetadataFallback | null,
): ParsedVietnameseAddress {
  const rawAddress = addressInput?.trim() || null;
  let parsedProvince: string | null = null;
  let parsedDistrict: string | null = null;
  let parsedWard: string | null = null;
  let parsedDetail: string | null = null;

  if (rawAddress) {
    const parts = rawAddress
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    for (const part of parts) {
      if (!parsedWard && /^(Phường|P\.|Xã|X\.|Thị trấn|TT\.)\s+/i.test(part)) {
        parsedWard = formatWardName(part);
      } else if (!parsedDistrict && /^(Quận|Q\.|Huyện|H\.|Thị xã|TX\.)\s+/i.test(part)) {
        parsedDistrict = formatDistrictName(part);
      } else if (!parsedProvince && (/^(TP\.|Tỉnh)\s+/i.test(part) || PROVINCE_ALIASES[normalizeLocationToken(part)])) {
        parsedProvince = formatProvinceName(part);
      }
    }

    if (parts.length >= 3) {
      const provincePart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      const thirdLastPart = parts[parts.length - 3];

      if (!parsedProvince && provincePart) {
        parsedProvince = formatProvinceName(provincePart);
      }

      const isSecondLastPartWard =
        /^(Phường|P\.|Xã|X\.|Thị trấn|TT\.)\s+/i.test(secondLastPart);

      if (isSecondLastPartWard) {
        if (!parsedWard) {
          parsedWard = formatWardName(secondLastPart);
        }
        const detailParts = parts.slice(0, parts.length - 2);
        if (!parsedDetail && detailParts.length > 0) {
          parsedDetail = detailParts.join(', ');
        }
      } else {
        if (!parsedDistrict && secondLastPart) {
          parsedDistrict = formatDistrictName(secondLastPart);
        }
        if (!parsedWard && thirdLastPart) {
          parsedWard = formatWardName(thirdLastPart);
        }
        const detailParts = parts.slice(0, parts.length - 3);
        if (!parsedDetail && detailParts.length > 0) {
          parsedDetail = detailParts.join(', ');
        }
      }
    } else if (parts.length === 2) {
      const secondPart = parts[1];
      const firstPart = parts[0];

      if (!parsedProvince) {
        parsedProvince = formatProvinceName(secondPart);
      }

      if (/^(Phường|P\.|Xã|X\.|Thị trấn|TT\.)\s+/i.test(firstPart)) {
        if (!parsedWard) {
          parsedWard = formatWardName(firstPart);
        }
      } else if (!parsedDetail) {
        parsedDetail = firstPart;
      }
    } else if (parts.length === 1) {
      const fullText = parts[0];

      if (!parsedProvince) {
        for (const [aliasKey, canonicalProvince] of Object.entries(PROVINCE_ALIASES)) {
          const regex = new RegExp(`\\b${aliasKey.replace(/\./g, '\\.')}\\b`, 'i');
          if (regex.test(fullText)) {
            parsedProvince = canonicalProvince;
            break;
          }
        }
      }

      if (!parsedWard) {
        const wardMatch = fullText.match(/(?:Phường|P\.|Xã|X\.|Thị trấn|Tt\.)\s*(\d+|[A-ZÀ-Ỹà-ỹ]+(?:\s+[A-ZÀ-Ỹà-ỹ]+)*)/i);
        if (wardMatch) {
          parsedWard = formatWardName(wardMatch[0]);
        }
      }

      if (!parsedDistrict) {
        const districtMatch = fullText.match(/(?:Quận|Q\.|Huyện|H\.|Thị xã|Tx\.)\s*(\d+|[A-ZÀ-Ỹà-ỹ]+(?:\s+[A-ZÀ-Ỹà-ỹ]+)*)/i);
        if (districtMatch) {
          parsedDistrict = formatDistrictName(districtMatch[0]);
        }
      }

      if (!parsedDetail) {
        parsedDetail = fullText;
      }
    }
  }

  if (!parsedProvince && metadataFallback?.province) {
    parsedProvince = formatProvinceName(metadataFallback.province);
  }
  if (!parsedDistrict && metadataFallback?.district) {
    parsedDistrict = formatDistrictName(metadataFallback.district);
  }
  if (!parsedWard && metadataFallback?.ward) {
    parsedWard = formatWardName(metadataFallback.ward);
  }
  if (!parsedDetail && metadataFallback?.addressDetail) {
    parsedDetail = metadataFallback.addressDetail.trim();
  }

  // Ensure formatting consistency
  if (parsedProvince) {
    parsedProvince = formatProvinceName(parsedProvince);
  }
  if (parsedDistrict) {
    parsedDistrict = formatDistrictName(parsedDistrict);
  }
  if (parsedWard) {
    parsedWard = formatWardName(parsedWard);
  }

  return {
    province: parsedProvince,
    district: parsedDistrict,
    ward: parsedWard,
    detail: parsedDetail,
    rawAddress,
  };
}
