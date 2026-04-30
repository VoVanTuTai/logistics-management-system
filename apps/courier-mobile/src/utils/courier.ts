function normalizeCourierId(rawValue: string | null | undefined): string {
  const trimmed = (rawValue ?? '').trim();
  if (!trimmed) {
    return '';
  }

  if (/^3000\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Legacy numeric formats (CR001 or 001)
  if (/^cr\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^\d+$/.test(trimmed)) {
    return `CR${trimmed}`;
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
