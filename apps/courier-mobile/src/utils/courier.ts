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

  const label = bagCode ? `Bao hàng đến (${bagCode})` : 'Kiện rời đến';
  const journey = originHubCode && destinationHubCode ? ` | [${originHubCode}] -> [${destinationHubCode}]` : '';
  const vehicle = vehicleCode ? ` | Xe: ${vehicleCode}${licensePlate ? ` (${licensePlate})` : ''}` : '';

  return `${label}${journey} | Nhân viên: ${employeeName} | Mã NV: ${employeeId} | Mã hub: ${hubCode}${vehicle}`;
}

export function buildInventoryCheckAuditNote(input: {
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

  return `INVENTORY_CHECK | Kiểm tra hàng tồn | Nhân viên: ${employeeName} | Mã NV: ${employeeId} | Mã hub: ${hubCode}`;
}

export function buildShipmentIssueAuditNote(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
  hubCode?: string | null;
  issueType?: string | null;
  issueTitle?: string | null;
  note?: string | null;
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
  const issueType = input.issueType?.trim().toUpperCase() || 'N/A';
  const issueTitle = input.issueTitle?.trim();
  const note = input.note?.trim();

  return [
    'Vấn đề đơn hàng',
    `Loại: ${issueTitle || issueType}`,
    issueTitle ? `Mã lỗi: ${issueType}` : null,
    `Nhân viên: ${employeeName}`,
    `Mã NV: ${employeeId}`,
    `Mã hub: ${hubCode}`,
    note ? `Ghi chú: ${note}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}

export function buildVehicleOutboundAuditNote(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
  hubCode?: string | null;
  vehicleCode?: string | null;
  licensePlate?: string | null;
  sealCodes?: string[];
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
  const vehicleCode = input.vehicleCode?.trim().toUpperCase() || 'N/A';
  const licensePlate = input.licensePlate?.trim().toUpperCase() || 'N/A';
  const seals = input.sealCodes?.map((code) => code.trim().toUpperCase()).filter(Boolean);

  return [
    'VEHICLE_OUTBOUND',
    'Xe đi - Đang luân chuyển',
    `Nhân viên: ${employeeName}`,
    `Mã NV: ${employeeId}`,
    `Mã hub: ${hubCode}`,
    `Tem xe: ${vehicleCode}`,
    `Biển số: ${licensePlate}`,
    seals && seals.length > 0 ? `Seal xe: ${seals.join(',')}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}

export function buildVehicleInboundAuditNote(input: {
  displayName?: string | null;
  username?: string | null;
  courierId?: string | null;
  hubCode?: string | null;
  vehicleCode?: string | null;
  licensePlate?: string | null;
  sealCodes?: string[];
  sealMatched?: boolean;
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
  const vehicleCode = input.vehicleCode?.trim().toUpperCase() || 'N/A';
  const licensePlate = input.licensePlate?.trim().toUpperCase() || 'N/A';
  const seals = input.sealCodes?.map((code) => code.trim().toUpperCase()).filter(Boolean);

  return [
    'VEHICLE_INBOUND',
    'Xe đến',
    `Nhân viên: ${employeeName}`,
    `Mã NV: ${employeeId}`,
    `Mã hub: ${hubCode}`,
    `Tem xe: ${vehicleCode}`,
    `Biển số: ${licensePlate}`,
    seals && seals.length > 0 ? `Seal xe: ${seals.join(',')}` : null,
    input.sealMatched === true ? 'Đối chứng seal: Khớp' : 'Đối chứng seal: Cần kiểm tra',
  ]
    .filter(Boolean)
    .join(' | ');
}
