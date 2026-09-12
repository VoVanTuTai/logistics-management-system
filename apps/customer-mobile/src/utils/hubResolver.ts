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
  '003079B001': {
    code: '003079B001',
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
  'HUB_CAOBANG': {
    code: 'HUB_CAOBANG',
    name: 'Trung tâm khai thác Cao Bằng',
    fullAddress: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
  },
  '001004B001': {
    code: '001004B001',
    name: 'Trung tâm khai thác Cao Bằng',
    fullAddress: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
  },

  // TP.HCM Branch Hubs (Quận 1)
  '07901W001': {
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành (Quận 1)',
    fullAddress: 'Bưu cục Phường Bến Thành, 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  },
  '07901W002': {
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé (Quận 1)',
    fullAddress: 'Bưu cục Phường Bến Nghé, 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  },
  '07901W003': {
    code: '07901W003',
    name: 'Bưu cục Phường Phạm Ngũ Lão (Quận 1)',
    fullAddress: 'Bưu cục Phường Phạm Ngũ Lão, 185 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
  },
  '07901W004': {
    code: '07901W004',
    name: 'Bưu cục Phường Đa Kao (Quận 1)',
    fullAddress: 'Bưu cục Phường Đa Kao, 72 Đinh Tiên Hoàng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
  },
  '07901W005': {
    code: '07901W005',
    name: 'Bưu cục Phường Tân Định (Quận 1)',
    fullAddress: 'Bưu cục Phường Tân Định, 128 Hai Bà Trưng, Phường Tân Định, Quận 1, TP. Hồ Chí Minh',
  },
  '07901W006': {
    code: '07901W006',
    name: 'Bưu cục Phường Cầu Ông Lãnh (Quận 1)',
    fullAddress: 'Bưu cục Phường Cầu Ông Lãnh, 56 Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh',
  },
  '07903W001': {
    code: '07903W001',
    name: 'Bưu cục Phường Võ Thị Sáu (Quận 3)',
    fullAddress: 'Bưu cục Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
  },
  '07905W001': {
    code: '07905W001',
    name: 'Bưu cục Phường 1 (Quận 5)',
    fullAddress: 'Bưu cục Phường 1, Quận 5, TP. Hồ Chí Minh',
  },
  '07912W001': {
    code: '07912W001',
    name: 'Bưu cục Phường Thảo Điền (TP. Thủ Đức)',
    fullAddress: 'Bưu cục Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
  },
  '07913W001': {
    code: '07913W001',
    name: 'Bưu cục Phường Tân Phong (Quận 7)',
    fullAddress: 'Bưu cục Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
  },

  // Bình Dương Branch Hubs (Dĩ An)
  '07401W001': {
    code: '07401W001',
    name: 'Bưu cục Phường Dĩ An',
    fullAddress: 'Bưu cục Phường Dĩ An, TP. Dĩ An, Tỉnh Bình Dương',
  },
  '07401W002': {
    code: '07401W002',
    name: 'Bưu cục Phường An Bình',
    fullAddress: 'Bưu cục Phường An Bình, TP. Dĩ An, Tỉnh Bình Dương',
  },
  '07401W003': {
    code: '07401W003',
    name: 'Bưu cục Phường Tân Đông Hiệp',
    fullAddress: 'Bưu cục Phường Tân Đông Hiệp, Đường ĐT743B, TP. Dĩ An, Tỉnh Bình Dương',
  },
  '07401W004': {
    code: '07401W004',
    name: 'Bưu cục Phường Đông Hòa',
    fullAddress: 'Bưu cục Phường Đông Hòa, Đường QL1K, TP. Dĩ An, Tỉnh Bình Dương',
  },

  // Hà Nội Branch Hubs (Khớp chính xác Seed DB)
  '00104W001': {
    code: '00104W001',
    name: 'Bưu cục Phường Trung Liệt (Đống Đa)',
    fullAddress: 'Bưu cục Phường Trung Liệt, 88 Thái Hà, Phường Trung Liệt, Quận Đống Đa, TP. Hà Nội',
  },
  '00101W001': {
    code: '00101W001',
    name: 'Bưu cục Phường Tràng Tiền (Hoàn Kiếm)',
    fullAddress: 'Bưu cục Phường Tràng Tiền, 12 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội',
  },
  '00102W001': {
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã (Ba Đình)',
    fullAddress: 'Bưu cục Phường Kim Mã, 56 Kim Mã, Phường Kim Mã, Quận Ba Đình, TP. Hà Nội',
  },
  '00103W001': {
    code: '00103W001',
    name: 'Bưu cục Phường Dịch Vọng (Cầu Giấy)',
    fullAddress: 'Bưu cục Phường Dịch Vọng, 234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, TP. Hà Nội',
  },

  // Đà Nẵng Branch Hubs (Khớp chính xác Seed DB)
  '04801W001': {
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang (Hải Châu)',
    fullAddress: 'Bưu cục Phường Thạch Thang, 12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng',
  },
  '04801W002': {
    code: '04801W002',
    name: 'Bưu cục Phường Hòa Cường Bắc (Hải Châu)',
    fullAddress: 'Bưu cục Phường Hòa Cường Bắc, 45 2 Tháng 9, Phường Hòa Cường Bắc, Quận Hải Châu, TP. Đà Nẵng',
  },
  '04802W001': {
    code: '04802W001',
    name: 'Bưu cục Phường An Hải Bắc (Sơn Trà)',
    fullAddress: 'Bưu cục Phường An Hải Bắc, 78 Phạm Văn Đồng, Phường An Hải Bắc, Quận Sơn Trà, TP. Đà Nẵng',
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

  // Extract raw code inside locationCode / locationText like "07901W001", "00104W001", or "HUB_CAOBANG"
  const rawCodeMatch = (codeKey + ' ' + textKey).match(/(00[1-3][0-9]{3}B001|[0-9]{5}W[0-9]{3}|HUB_[A-Z0-9]+)/i);
  if (rawCodeMatch && HUB_DATABASE_DICT[rawCodeMatch[0].toUpperCase()]) {
    return HUB_DATABASE_DICT[rawCodeMatch[0].toUpperCase()].fullAddress;
  }

  // Specific Ward/District keyword checks
  if (textKey.includes('Trung Liệt') || codeKey.includes('00104')) {
    return 'Bưu cục Phường Trung Liệt, 88 Thái Hà, Phường Trung Liệt, Quận Đống Đa, TP. Hà Nội';
  }
  if (textKey.includes('Bến Thành') || codeKey.includes('07901')) {
    return 'Bưu cục Phường Bến Thành, 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
  }
  if (textKey.includes('Bến Nghé')) {
    return 'Bưu cục Phường Bến Nghé, 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  }
  if (textKey.includes('Tràng Tiền') || textKey.includes('Hoàn Kiếm')) {
    return 'Bưu cục Phường Tràng Tiền, 12 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội';
  }
  if (textKey.includes('Kim Mã')) {
    return 'Bưu cục Phường Kim Mã, 56 Kim Mã, Phường Kim Mã, Quận Ba Đình, TP. Hà Nội';
  }
  if (textKey.includes('Dịch Vọng') || textKey.includes('Cầu Giấy')) {
    return 'Bưu cục Phường Dịch Vọng, 234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, TP. Hà Nội';
  }
  if (textKey.includes('Thạch Thang') || codeKey.includes('04801')) {
    return 'Bưu cục Phường Thạch Thang, 12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng';
  }
  if (textKey.includes('Dĩ An') || codeKey.includes('07401')) {
    return 'Bưu cục Phường Dĩ An, TP. Dĩ An, Tỉnh Bình Dương';
  }

  // Province-level matches
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
