/**
 * Database Hub Address Resolver
 * Maps Hub Codes (e.g., 001004B001, 001001B001, HUB_CAOBANG, HUB_HANOI) to complete Hub Addresses in DB.
 */

export interface HubDatabaseRecord {
  code: string;
  name: string;
  fullAddress: string;
}

// Complete Masterdata dictionary of Regional & Branch Hubs matching DB seed
const HUB_DATABASE_DICT: Record<string, HubDatabaseRecord> = {
  // Regional Hubs
  'HUB_HANOI': {
    code: 'HUB_HANOI',
    name: 'Trung tâm phân loại Hà Nội',
    fullAddress: 'Trung tâm phân loại Hà Nội, Phường Hàng Bạc, Quận Hoàn Kiếm, TP. Hà Nội',
  },
  '001001B001': {
    code: '001001B001',
    name: 'Trung tâm phân loại Hà Nội',
    fullAddress: 'Trung tâm phân loại Hà Nội, Phường Hàng Bạc, Quận Hoàn Kiếm, TP. Hà Nội',
  },
  'HUB_HCM': {
    code: 'HUB_HCM',
    name: 'Trung tâm phân loại TP. Hồ Chí Minh',
    fullAddress: 'Trung tâm phân loại TP. Hồ Chí Minh, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  },
  '002079B001': {
    code: '002079B001',
    name: 'Trung tâm phân loại TP. Hồ Chí Minh',
    fullAddress: 'Trung tâm phân loại TP. Hồ Chí Minh, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  },
  'HUB_DANANG': {
    code: 'HUB_DANANG',
    name: 'Trung tâm phân loại Đà Nẵng',
    fullAddress: 'Trung tâm phân loại Đà Nẵng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
  },
  '003048B001': {
    code: '003048B001',
    name: 'Trung tâm phân loại Đà Nẵng',
    fullAddress: 'Trung tâm phân loại Đà Nẵng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
  },

  // Cao Bằng Branch Hub (001004B001)
  '001004B001': {
    code: '001004B001',
    name: 'Trung tâm khai thác Cao Bằng',
    fullAddress: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
  },
  'HUB_CAOBANG': {
    code: 'HUB_CAOBANG',
    name: 'Trung tâm khai thác Cao Bằng',
    fullAddress: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
  },
};

/**
 * Resolves full Hub Address from database by location code or location text.
 */
export function resolveHubFullAddress(
  locationCode?: string | null,
  locationText?: string | null,
  fallbackAddress?: string | null,
): string {
  const codeKey = (locationCode || '').trim().toUpperCase();
  if (codeKey && HUB_DATABASE_DICT[codeKey]) {
    return HUB_DATABASE_DICT[codeKey].fullAddress;
  }

  const textKey = (locationText || '').trim();
  if (textKey && HUB_DATABASE_DICT[textKey.toUpperCase()]) {
    return HUB_DATABASE_DICT[textKey.toUpperCase()].fullAddress;
  }

  // Extract raw code inside locationText like "001004B001" or "Kho 001004B001"
  const rawCodeMatch = textKey.match(/(00[1-3][0-9]{3}B001|HUB_[A-Z]+)/i);
  if (rawCodeMatch && HUB_DATABASE_DICT[rawCodeMatch[0].toUpperCase()]) {
    return HUB_DATABASE_DICT[rawCodeMatch[0].toUpperCase()].fullAddress;
  }

  // If locationText contains province name e.g. "Cao Bằng" or "Phường Nùng Trí Cao, Tỉnh Cao Bằng"
  if (textKey.includes('Cao Bằng')) {
    return 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng';
  }
  if (textKey.includes('Hà Nội')) {
    return 'Trung tâm phân loại Hà Nội, Phường Hàng Bạc, Quận Hoàn Kiếm, TP. Hà Nội';
  }
  if (textKey.includes('Hồ Chí Minh') || textKey.includes('HCM')) {
    return 'Trung tâm phân loại TP. Hồ Chí Minh, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  }
  if (textKey.includes('Đà Nẵng')) {
    return 'Trung tâm phân loại Đà Nẵng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng';
  }

  // If text is already a full address (contains comma), use it
  if (textKey && textKey.includes(',')) {
    return textKey.replace(/^Kho\s+/i, '');
  }

  if (textKey && textKey.length > 5 && !textKey.startsWith('Kho ')) {
    return textKey;
  }

  return fallbackAddress || textKey || 'Bưu cục vận chuyển Nexus';
}
