import type {
  ConfigApiRecord,
  LoginResponse,
  MerchantProfileApiRecord,
  MerchantProfileConfigPayload,
  MerchantRegionCode,
  MerchantSession,
  RememberedMerchantCredentials,
  StoredMerchantSession,
} from '../types';
import { request } from '../api';

export const STORAGE_KEY_SESSION = 'merchant-web.session.v1';
export const STORAGE_KEY_DRAFTS = 'merchant-web.shipment-drafts.v1';
export const STORAGE_KEY_NOTIFICATIONS = 'merchant-web.notifications.v1';
export const STORAGE_KEY_RETURNS = 'merchant-web.return-requests.v1';
export const STORAGE_KEY_PROFILE = 'merchant-web.profile.v1';
export const STORAGE_KEY_PROFILE_PREFIX = 'merchant-web.profile.v2.';
export const CLIENT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
export const SHIPMENT_PAGE_SIZE = 8;
export const MERCHANT_PROFILE_SCOPE = 'MERCHANT_PROFILE';
export const MERCHANT_PROFILE_KEY_PREFIX = 'merchant.profile.';
export const REMEMBERED_CREDENTIALS_STORAGE_KEY = 'merchant-web.remembered-credentials';

export function buildMerchantProfileKey(username: string): string {
  return `${MERCHANT_PROFILE_KEY_PREFIX}${username.trim().toUpperCase()}`;
}

export function buildProfileStorageKey(username: string): string {
  return `${STORAGE_KEY_PROFILE_PREFIX}${username.trim().toUpperCase()}`;
}

export function readStoredMerchantSession(): StoredMerchantSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY_SESSION);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as MerchantSession | StoredMerchantSession;
    if ('session' in parsed && parsed.session) {
      return parsed;
    }

    return {
      session: parsed as MerchantSession,
      storedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredMerchantSession(session: MerchantSession): void {
  window.localStorage.setItem(
    STORAGE_KEY_SESSION,
    JSON.stringify({
      session,
      storedAt: new Date().toISOString(),
    } satisfies StoredMerchantSession),
  );
}

export function isClientSessionExpired(storedAt: string): boolean {
  const storedAtTime = new Date(storedAt).getTime();
  return Number.isNaN(storedAtTime) || Date.now() - storedAtTime >= CLIENT_SESSION_TTL_MS;
}

export function isTokenExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isNaN(expiryTime) || Date.now() >= expiryTime;
}

export function shouldRefreshAccessToken(session: MerchantSession): boolean {
  const expiryTime = new Date(session.accessTokenExpiresAt).getTime();
  return (
    Number.isNaN(expiryTime) ||
    Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS >= expiryTime
  );
}

export function assertMerchantUser(user: LoginResponse['user']): void {
  const isMerchant = user.roles.some((role) => role.trim().toUpperCase() === 'MERCHANT');

  if (!isMerchant) {
    throw new Error(
      'Tài khoản không thuộc nhóm quyền MERCHANT. Vui lòng đăng nhập đúng cổng hệ thống.',
    );
  }
}

export function mapLoginResponseToMerchantSession(result: LoginResponse): MerchantSession {
  assertMerchantUser(result.user);

  return {
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
    refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt,
  };
}

export async function refreshMerchantSession(
  session: MerchantSession,
): Promise<MerchantSession> {
  if (isTokenExpired(session.refreshTokenExpiresAt)) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const result = await request<LoginResponse>('/merchant/auth/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
      roleGroup: 'MERCHANT',
    }),
  });

  return mapLoginResponseToMerchantSession(result);
}

export function parseMerchantProfileConfig(
  records: ConfigApiRecord[],
  username: string,
): MerchantProfileConfigPayload | null {
  const normalizedUsername = username.trim().toUpperCase();
  if (!normalizedUsername) {
    return null;
  }

  const targetKey = buildMerchantProfileKey(normalizedUsername);
  const record =
    records.find((item) => item.key === targetKey) ??
    records.find((item) => item.key.endsWith(`.${normalizedUsername}`));

  if (!record || !record.value || typeof record.value !== 'object' || Array.isArray(record.value)) {
    return null;
  }

  const payload = record.value as Record<string, unknown>;
  const regionCode = payload.regionCode;

  if (
    typeof payload.username !== 'string' ||
    typeof payload.citizenId !== 'string' ||
    typeof regionCode !== 'string' ||
    typeof payload.regionLabel !== 'string'
  ) {
    return null;
  }

  const normalizedRegionCode = regionCode as MerchantRegionCode;
  if (!['HA_NOI', 'DA_NANG', 'HO_CHI_MINH'].includes(normalizedRegionCode)) {
    return null;
  }

  return {
    username: payload.username.trim().toUpperCase(),
    citizenId: payload.citizenId.trim(),
    regionCode: normalizedRegionCode,
    regionLabel: payload.regionLabel.trim(),
    defaultHubCode:
      typeof payload.defaultHubCode === 'string' && payload.defaultHubCode.trim()
        ? payload.defaultHubCode.trim().toUpperCase()
        : null,
    defaultHubName:
      typeof payload.defaultHubName === 'string' && payload.defaultHubName.trim()
        ? payload.defaultHubName.trim()
        : null,
    defaultSenderAddress:
      typeof payload.defaultSenderAddress === 'string' && payload.defaultSenderAddress.trim()
        ? payload.defaultSenderAddress.trim()
        : null,
    businessAddressDetail:
      typeof payload.businessAddressDetail === 'string' && payload.businessAddressDetail.trim()
        ? payload.businessAddressDetail.trim()
        : null,
  };
}

export function mapMerchantProfileRecord(
  record: MerchantProfileApiRecord | null,
): MerchantProfileConfigPayload | null {
  if (!record) {
    return null;
  }

  return {
    username: record.username.trim().toUpperCase(),
    citizenId: record.citizenId.trim(),
    regionCode: record.regionCode,
    regionLabel: record.regionLabel.trim(),
    defaultHubCode: record.defaultHubCode?.trim().toUpperCase() || null,
    defaultHubName: record.defaultHubName?.trim() || null,
    defaultSenderAddress: record.defaultSenderAddress?.trim() || null,
    businessAddressDetail: null,
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
  };
}

export function getRememberedCredentials(): RememberedMerchantCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_CREDENTIALS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedMerchantCredentials>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.username !== 'string') {
      return null;
    }
    return {
      username: parsed.username.trim(),
      password: typeof parsed.password === 'string' ? parsed.password : '',
      rememberMe: Boolean(parsed.rememberMe ?? true),
    };
  } catch {
    return null;
  }
}

export function saveRememberedCredentials(credentials: {
  username: string;
  password?: string;
  rememberMe: boolean;
}): void {
  if (typeof window === 'undefined') return;
  try {
    if (!credentials.rememberMe || !credentials.username.trim()) {
      window.localStorage.removeItem(REMEMBERED_CREDENTIALS_STORAGE_KEY);
      return;
    }
    const payload: RememberedMerchantCredentials = {
      username: credentials.username.trim(),
      password: credentials.password || '',
      rememberMe: true,
    };
    window.localStorage.setItem(REMEMBERED_CREDENTIALS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage write failures
  }
}

export function clearRememberedCredentials(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REMEMBERED_CREDENTIALS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function formatMerchantAuthErrorMessage(rawMessage: string | null | undefined): string {
  if (!rawMessage) {
    return 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại.';
  }
  const normalized = rawMessage.trim().toLowerCase();
  if (
    normalized.includes('invalid credentials') ||
    normalized.includes('unauthorized') ||
    normalized.includes('sai tên') ||
    normalized.includes('mật khẩu không đúng') ||
    normalized.includes('wrong password')
  ) {
    return 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại.';
  }
  return rawMessage;
}
