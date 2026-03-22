const DEFAULT_COURIER_ID = 'CR001';

function normalizeCourierId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^cr\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (/^\d+$/.test(trimmed)) {
    return `CR${trimmed}`;
  }

  return trimmed.toUpperCase();
}

function extractCourierIdFromUsername(username: string): string {
  const directMatch = username.match(/\bcr\d+\b/i);
  if (directMatch?.[0]) {
    return normalizeCourierId(directMatch[0]);
  }

  const digitMatches = username.match(/\d+/g);
  const lastDigits = digitMatches?.[digitMatches.length - 1];
  if (lastDigits) {
    return normalizeCourierId(lastDigits);
  }

  return '';
}

export function resolveCourierId(
  configuredCourierId: string | null | undefined,
  username: string | null | undefined,
): string {
  const fromConfig = normalizeCourierId(configuredCourierId ?? '');
  if (fromConfig) {
    return fromConfig;
  }

  const fromUsername = extractCourierIdFromUsername((username ?? '').trim());
  if (fromUsername) {
    return fromUsername;
  }

  return DEFAULT_COURIER_ID;
}
