const DEFAULT_COURIER_ID = '30000001';

const SEEDED_COURIER_NAMES: Record<string, string> = {
  '30000001': 'Nguyễn Văn Hùng',
  '30000002': 'Trần Quốc Bảo',
  '30000003': 'Lê Minh Tuấn',
  '30000004': 'Phạm Quốc Dũng',
};

function normalizeCourierId(rawValue: string | null | undefined): string {
  const trimmed = (rawValue ?? '').trim();
  if (!trimmed) {
    return '';
  }

  // Auth usernames / employee codes are the canonical courier ids in the backend.
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // Keep explicit legacy ids for old local data, but never add a CR prefix automatically.
  if (/^cr\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Otherwise, keep developer / username provided id; normalize to lower for consistency.
  return trimmed.toLowerCase();
}

export function resolveCourierId(
  configuredCourierId: string | null | undefined,
  username: string | null | undefined,
): string {
  const fromConfig = normalizeCourierId(configuredCourierId);
  if (fromConfig) return fromConfig;

  const fromUsername = normalizeCourierId(username);
  if (fromUsername) return fromUsername;

  return '';
}

export function resolveCourierDisplayName(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
}): string {
  const normalizedDisplayName = input.displayName?.trim();
  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const courierId = resolveCourierId(input.courierId, input.username);
  return SEEDED_COURIER_NAMES[courierId] ?? input.username ?? 'Courier';
}
