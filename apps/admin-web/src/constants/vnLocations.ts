export interface ProvinceOption {
  code: string;
  label: string;
  apiValue: string;
  districts: string[];
  aliases?: string[];
}

function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

export const PROVINCE_OPTIONS: ProvinceOption[] = [
  {
    code: 'HO_CHI_MINH',
    label: 'H\u1ed3 Ch\u00ed Minh',
    apiValue: 'Ho Chi Minh',
    aliases: ['HCM', 'TP Ho Chi Minh', 'Thanh pho Ho Chi Minh'],
    districts: [
      'Qu\u1eadn 1',
      'Qu\u1eadn 3',
      'Qu\u1eadn 7',
      'B\u00ecnh Th\u1ea1nh',
      'T\u00e2n B\u00ecnh',
      'Th\u1ee7 \u0110\u1ee9c',
    ],
  },
  {
    code: 'DA_NANG',
    label: '\u0110\u00e0 N\u1eb5ng',
    apiValue: 'Da Nang',
    aliases: ['DN', 'TP Da Nang', 'Thanh pho Da Nang'],
    districts: [
      'H\u1ea3i Ch\u00e2u',
      'Thanh Kh\u00ea',
      'Li\u00ean Chi\u1ec3u',
      'Ng\u0169 H\u00e0nh S\u01a1n',
      'S\u01a1n Tr\u00e0',
      'C\u1ea9m L\u1ec7',
    ],
  },
  {
    code: 'HA_NOI',
    label: 'H\u00e0 N\u1ed9i',
    apiValue: 'Ha Noi',
    aliases: ['HN', 'TP Ha Noi', 'Thanh pho Ha Noi'],
    districts: [
      'Ba \u0110\u00ecnh',
      'Ho\u00e0n Ki\u1ebfm',
      'C\u1ea7u Gi\u1ea5y',
      '\u0110\u1ed1ng \u0110a',
      'Hai B\u00e0 Tr\u01b0ng',
      'H\u00e0 \u0110\u00f4ng',
    ],
  },
];

export function getProvinceOption(provinceValue: string): ProvinceOption | undefined {
  const normalized = normalizeLocationKey(provinceValue.trim());

  if (!normalized) {
    return undefined;
  }

  return PROVINCE_OPTIONS.find((option) =>
    [option.code, option.label, option.apiValue, ...(option.aliases ?? [])].some(
      (candidate) => normalizeLocationKey(candidate) === normalized,
    ),
  );
}

export function getDistrictOptions(provinceValue: string): string[] {
  return getProvinceOption(provinceValue)?.districts ?? [];
}

export function isKnownProvince(provinceValue: string): boolean {
  return Boolean(getProvinceOption(provinceValue));
}

export function toProvinceLabel(provinceValue: string): string {
  return getProvinceOption(provinceValue)?.label ?? provinceValue.trim();
}

export function toProvinceApiValue(provinceValue: string): string {
  return getProvinceOption(provinceValue)?.apiValue ?? provinceValue.trim();
}
