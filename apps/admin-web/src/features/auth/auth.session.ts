import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { appEnv } from '../../utils/env';
import type { AuthSessionDto } from './auth.types';
import { hasAdminRole } from './auth.roles';

const AUTH_STORAGE_KEY = 'admin-web.auth-session';
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;

let refreshSessionPromise: Promise<AuthSessionDto> | null = null;

export async function hydrateAuthSession(): Promise<void> {
  useAuthStore.getState().setStatus('restoring');
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    useAuthStore.getState().setStatus('guest');
    return;
  }

  try {
    const session = JSON.parse(raw) as AuthSessionDto;
    if (!hasAdminRole(session)) {
      throw new Error('Tài khoản hiện tại không có vai trò admin.');
    }

    if (isTokenExpired(session.tokens.refreshTokenExpiresAt)) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (shouldRefreshAccessToken(session)) {
      await refreshAuthSession(session);
      return;
    }

    useAuthStore.getState().setSession(session);
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
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  useAuthStore.getState().setSession(session);
}

export async function clearAuthSession(): Promise<void> {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  refreshSessionPromise = null;
  useAuthStore.getState().clearSession();
}

export function getStoredAuthSession(): AuthSessionDto | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionDto;
  } catch {
    return null;
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
      if (!hasAdminRole(refreshedSession)) {
        throw new Error('Tài khoản hiện tại không có vai trò admin.');
      }

      await persistAuthSession(refreshedSession);
      return refreshedSession;
    })
    .catch(async (error) => {
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
