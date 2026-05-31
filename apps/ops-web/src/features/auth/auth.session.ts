import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { appEnv } from '../../utils/env';
import type { AuthSessionDto } from './auth.types';

const AUTH_STORAGE_KEY = 'ops-web.auth-session';
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const CLIENT_SESSION_TTL_MS = 10 * 60 * 60 * 1000;
const REFRESH_FAILURE_RECOVERY_DELAY_MS = 300;
const OPS_ALLOWED_ROLES = new Set(['SYSTEM_ADMIN', 'OPS_ADMIN', 'OPS_VIEWER']);

let refreshSessionPromise: Promise<AuthSessionDto> | null = null;

interface StoredAuthSession {
  session: AuthSessionDto;
  storedAt: string;
}

export async function hydrateAuthSession(): Promise<void> {
  useAuthStore.getState().setStatus('restoring');
  const storedSession = getStoredAuthSession();
  if (!storedSession) {
    useAuthStore.getState().setStatus('guest');
    return;
  }

  try {
    if (isClientSessionExpired()) {
      throw new Error('Phiên đăng nhập đã quá 10 giờ. Vui lòng đăng nhập lại.');
    }

    if (isTokenExpired(storedSession.tokens.refreshTokenExpiresAt)) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!isOpsSession(storedSession)) {
      throw new Error(
        'Tài khoản không thuộc nhóm quyền OPS. Vui lòng đăng nhập đúng cổng hệ thống.',
      );
    }

    if (shouldRefreshAccessToken(storedSession)) {
      await refreshAuthSession(storedSession);
      return;
    }

    await persistAuthSession(storedSession);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    useAuthStore.getState().clearSession();
    useAuthStore
      .getState()
      .setAuthError(
        error instanceof Error
          ? error.message
          : 'Dữ liệu phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      );
  } finally {
    if (!useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().setStatus('guest');
    }
  }
}

export async function persistAuthSession(session: AuthSessionDto): Promise<void> {
  assertOpsSession(session);
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      session,
      storedAt: new Date().toISOString(),
    } satisfies StoredAuthSession),
  );
  useAuthStore.getState().setSession(session);
}

export async function clearAuthSession(): Promise<void> {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  refreshSessionPromise = null;
  useAuthStore.getState().clearSession();
}

export function subscribeToAuthSessionStorage(): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key !== AUTH_STORAGE_KEY ||
      (event.storageArea && event.storageArea !== localStorage)
    ) {
      return;
    }

    const session = getStoredAuthSession();
    if (!session) {
      useAuthStore.getState().clearSession();
      return;
    }

    if (
      !isOpsSession(session) ||
      isClientSessionExpired() ||
      isTokenExpired(session.tokens.refreshTokenExpiresAt)
    ) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      useAuthStore.getState().clearSession();
      return;
    }

    useAuthStore.getState().setSession(session);
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}

export function getStoredAuthSession(): AuthSessionDto | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSessionDto | StoredAuthSession;
    if ('session' in parsed && parsed.session) {
      return parsed.session;
    }

    return parsed as AuthSessionDto;
  } catch {
    return null;
  }
}

function isClientSessionExpired(): boolean {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return true;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSessionDto | StoredAuthSession;
    if (!('storedAt' in parsed)) {
      return false;
    }

    const storedAt = new Date(parsed.storedAt).getTime();
    return Number.isNaN(storedAt) || Date.now() - storedAt >= CLIENT_SESSION_TTL_MS;
  } catch {
    return true;
  }
}

export async function getValidAccessToken(
  currentAccessToken: string | null | undefined,
): Promise<string | null> {
  if (!currentAccessToken) {
    return null;
  }

  const session = getStoredAuthSession();
  if (!session) {
    return currentAccessToken;
  }

  assertOpsSession(session);

  if (session.tokens.accessToken !== currentAccessToken) {
    return session.tokens.accessToken;
  }

  if (!shouldRefreshAccessToken(session)) {
    return session.tokens.accessToken;
  }

  const refreshedSession = await refreshAuthSession(session);
  return refreshedSession.tokens.accessToken;
}

export async function refreshAuthSession(
  session: AuthSessionDto | null = getStoredAuthSession(),
): Promise<AuthSessionDto> {
  if (!session) {
    throw new Error('Không có phiên đăng nhập để làm mới.');
  }

  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = requestSessionRefresh(session)
    .then(async (refreshedSession) => {
      await persistAuthSession(refreshedSession);
      return refreshedSession;
    })
    .catch(async (error) => {
      const recoveredSession = await getRefreshFailureRecoverySession(session);
      if (recoveredSession) {
        useAuthStore.getState().setSession(recoveredSession);
        return recoveredSession;
      }

      await clearAuthSession();
      useAuthStore
        .getState()
        .setAuthError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      throw error;
    })
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

async function getRefreshFailureRecoverySession(
  attemptedSession: AuthSessionDto,
): Promise<AuthSessionDto | null> {
  const immediateSession = getRecoverableStoredSession(attemptedSession);
  if (immediateSession) {
    return immediateSession;
  }

  await delay(REFRESH_FAILURE_RECOVERY_DELAY_MS);
  return getRecoverableStoredSession(attemptedSession);
}

function getRecoverableStoredSession(
  attemptedSession: AuthSessionDto,
): AuthSessionDto | null {
  const latestSession = getStoredAuthSession();
  if (!latestSession) {
    return null;
  }

  const hasRotatedTokens =
    latestSession.tokens.refreshToken !== attemptedSession.tokens.refreshToken ||
    latestSession.tokens.accessToken !== attemptedSession.tokens.accessToken;
  if (!hasRotatedTokens) {
    return null;
  }

  if (!isOpsSession(latestSession)) {
    return null;
  }

  if (isTokenExpired(latestSession.tokens.refreshTokenExpiresAt)) {
    return null;
  }

  return latestSession;
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function shouldRefreshAccessToken(session: AuthSessionDto): boolean {
  const accessTokenExpiresAt = new Date(session.tokens.accessTokenExpiresAt).getTime();
  if (Number.isNaN(accessTokenExpiresAt)) {
    return true;
  }

  return Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS >= accessTokenExpiresAt;
}

function isTokenExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isNaN(expiryTime) || Date.now() >= expiryTime;
}

async function requestSessionRefresh(
  session: AuthSessionDto,
): Promise<AuthSessionDto> {
  const response = await fetch(
    `${appEnv.gatewayBaseUrl}${opsEndpoints.auth.refresh}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: session.tokens.refreshToken,
        roleGroup: 'OPS',
      }),
    },
  );

  const text = await response.text();
  const payload = text.length > 0 ? safeParseJson(text) : null;

  if (!response.ok) {
    throw new ApiClientError({
      message: extractErrorMessage(payload, response.status),
      status: response.status,
      payload: payload as Record<string, unknown> | null,
    });
  }

  return payload as AuthSessionDto;
}

function isOpsSession(session: AuthSessionDto): boolean {
  return session.user.roles.some((role) =>
    OPS_ALLOWED_ROLES.has(role.trim().toUpperCase()),
  );
}

function assertOpsSession(session: AuthSessionDto): void {
  if (!isOpsSession(session)) {
    throw new Error(
      'Tài khoản không thuộc nhóm quyền OPS. Vui lòng đăng nhập đúng cổng hệ thống.',
    );
  }
}

function safeParseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return { message: input };
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return `Yêu cầu làm mới phiên thất bại với mã trạng thái ${status}.`;
}
