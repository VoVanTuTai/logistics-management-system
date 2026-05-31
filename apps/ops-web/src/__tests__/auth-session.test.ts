import { beforeEach, describe, expect, it, vi } from 'vitest';

const authStoreMock = vi.hoisted(() => {
  const initialState = {
    authError: null as string | null,
    isAuthenticated: false,
    isSubmitting: false,
    session: null as AuthSessionDto | null,
    status: 'guest' as 'guest' | 'authenticated' | 'restoring',
  };
  const state = { ...initialState };
  const actions = {
    setStatus: (status: typeof state.status) => {
      state.status = status;
    },
    setSubmitting: (value: boolean) => {
      state.isSubmitting = value;
    },
    setAuthError: (message: string | null) => {
      state.authError = message;
    },
    clearAuthError: () => {
      state.authError = null;
    },
    setSession: (session: AuthSessionDto) => {
      state.status = 'authenticated';
      state.isAuthenticated = true;
      state.session = session;
      state.authError = null;
    },
    clearSession: () => {
      state.status = 'guest';
      state.isAuthenticated = false;
      state.session = null;
      state.isSubmitting = false;
    },
  };
  const useAuthStore = Object.assign(() => undefined, {
    getState: () => ({
      ...state,
      ...actions,
    }),
  });

  return {
    reset: () => {
      Object.assign(state, initialState);
    },
    state,
    useAuthStore,
  };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: authStoreMock.useAuthStore,
}));

import {
  clearAuthSession,
  getStoredAuthSession,
  persistAuthSession,
  refreshAuthSession,
  subscribeToAuthSessionStorage,
} from '../features/auth/auth.session';
import type { AuthSessionDto } from '../features/auth/auth.types';

function createSession(params: {
  accessToken: string;
  refreshToken: string;
}): AuthSessionDto {
  return {
    user: {
      id: 'ops-user-1',
      username: '10000001',
      displayName: 'Ops User',
      roles: ['OPS_ADMIN'],
      hubCodes: ['HCM01'],
    },
    tokens: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    },
  };
}

function serializeSession(session: AuthSessionDto): string {
  return JSON.stringify({
    session,
    storedAt: new Date().toISOString(),
  });
}

describe('auth session refresh', () => {
  beforeEach(async () => {
    authStoreMock.reset();
    await clearAuthSession();
    vi.restoreAllMocks();
  });

  it('keeps a newer stored session when refresh fails after another tab rotated tokens', async () => {
    const staleSession = createSession({
      accessToken: 'stale-access-token',
      refreshToken: 'stale-refresh-token',
    });
    const rotatedSession = createSession({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    await persistAuthSession(staleSession);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      await persistAuthSession(rotatedSession);
      return new Response(
        JSON.stringify({ message: 'Refresh token is invalid or expired.' }),
        { status: 401 },
      );
    });

    const result = await refreshAuthSession(staleSession);

    expect(result.tokens.accessToken).toBe('rotated-access-token');
    expect(getStoredAuthSession()?.tokens.refreshToken).toBe('rotated-refresh-token');
    expect(authStoreMock.state.isAuthenticated).toBe(true);
  });

  it('updates the auth store when another tab writes a new session', async () => {
    const staleSession = createSession({
      accessToken: 'stale-access-token',
      refreshToken: 'stale-refresh-token',
    });
    const rotatedSession = createSession({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    await persistAuthSession(staleSession);
    const unsubscribe = subscribeToAuthSessionStorage();

    localStorage.setItem('ops-web.auth-session', serializeSession(rotatedSession));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'ops-web.auth-session',
        newValue: serializeSession(rotatedSession),
      }),
    );

    expect(authStoreMock.state.session?.tokens.accessToken).toBe('rotated-access-token');

    unsubscribe();
  });
});
