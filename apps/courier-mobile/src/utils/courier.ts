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

export function buildPickupReceiveAuditNote(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
  hubCode?: string | null;
}): string {
  const employeeId =
    resolveCourierId(input.courierId, input.username) ||
    input.username?.trim() ||
    'N/A';
  const employeeName = resolveCourierDisplayName({
    displayName: input.displayName,
    username: input.username,
    courierId: employeeId,
  });
  const hubCode = input.hubCode?.trim().toUpperCase() || 'N/A';

  return `Nhận hàng về hub | Nhân viên: ${employeeName} | Mã NV: ${employeeId} | Mã hub: ${hubCode}`;
}

export function buildGoodsArrivalAuditNote(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
  hubCode?: string | null;
  vehicleCode?: string | null;
  licensePlate?: string | null;
  originHubCode?: string | null;
  destinationHubCode?: string | null;
  bagCode?: string | null;
}): string {
  const employeeId =
    resolveCourierId(input.courierId, input.username) ||
    input.username?.trim() ||
    'N/A';
  const employeeName = resolveCourierDisplayName({
    displayName: input.displayName,
    username: input.username,
    courierId: employeeId,
  });
  const hubCode = input.hubCode?.trim().toUpperCase() || 'N/A';
  const bagCode = input.bagCode?.trim().toUpperCase();
  const vehicleCode = input.vehicleCode?.trim().toUpperCase();
  const licensePlate = input.licensePlate?.trim().toUpperCase();
  const originHubCode = input.originHubCode?.trim().toUpperCase();
  const destinationHubCode = input.destinationHubCode?.trim().toUpperCase();

  return [
    'Hàng đến',
    `Nhân viên: ${employeeName}`,
    `Mã NV: ${employeeId}`,
    `Mã hub: ${hubCode}`,
    vehicleCode ? `Mã xe: ${vehicleCode}` : null,
    licensePlate ? `Biển số: ${licensePlate}` : null,
    originHubCode ? `Hub đi: ${originHubCode}` : null,
    destinationHubCode ? `Hub đến: ${destinationHubCode}` : null,
    bagCode ? `Mã bao: ${bagCode}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}
