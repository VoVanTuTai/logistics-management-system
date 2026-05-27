import { create } from 'zustand';

import { useAppStore } from '../../store/appStore';
import { queryClient } from '../../store/queryClient';
import { authApi } from './auth.api';
import {
  clearAuthSession,
  loadStoredAuthSession,
  persistAuthSession,
} from './auth.session';
import type { LoginFormValues, LoginResultDto } from './auth.types';

type AuthStoreStatus = 'booting' | 'authenticated' | 'guest';

interface AuthStoreState {
  status: AuthStoreStatus;
  session: LoginResultDto | null;
  isLoading: boolean;
  errorMessage: string | null;
  restoreSession: () => Promise<void>;
  refreshMobilePermissions: () => Promise<void>;
  getValidAccessToken: () => Promise<string>;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

let refreshSessionPromise: Promise<LoginResultDto> | null = null;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

function isExpiringAt(value: string | null | undefined, skewMs = 0): boolean {
  if (!value) {
    return true;
  }

  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) {
    return true;
  }

  return expiresAt <= Date.now() + skewMs;
}

async function withEffectiveMobilePermissions(
  session: LoginResultDto,
): Promise<LoginResultDto> {
  try {
    const effectivePermissions = await authApi.getMobilePermissionEffective(
      session.tokens.accessToken,
      session.user.id,
    );

    return {
      ...session,
      user: {
        ...session.user,
        mobilePermissionActor: effectivePermissions.actor,
        mobilePermissions: effectivePermissions.permissions,
        mobilePermissionsLoadedAt: new Date().toISOString(),
      },
    };
  } catch {
    return session;
  }
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'booting',
  session: null,
  isLoading: false,
  errorMessage: null,
  clearError: () => {
    set({ errorMessage: null });
  },
  restoreSession: async () => {
    set({ status: 'booting', errorMessage: null });

    try {
      const storedSession = await loadStoredAuthSession();
      if (!storedSession) {
        useAppStore.getState().setGuest();
        set({ status: 'guest', session: null });
        return;
      }

      const sessionWithPermissions =
        await withEffectiveMobilePermissions(storedSession);
      await persistAuthSession(sessionWithPermissions);
      useAppStore.getState().setSession(sessionWithPermissions);
      set({
        status: 'authenticated',
        session: sessionWithPermissions,
      });
    } catch (error) {
      useAppStore.getState().setGuest();
      set({
        status: 'guest',
        session: null,
        errorMessage: toErrorMessage(error, 'Khôi phục phiên đăng nhập thất bại.'),
      });
    }
  },
  refreshMobilePermissions: async () => {
    const currentSession = get().session;

    if (!currentSession) {
      return;
    }

    const sessionWithPermissions =
      await withEffectiveMobilePermissions(currentSession);
    await persistAuthSession(sessionWithPermissions);
    useAppStore.getState().setSession(sessionWithPermissions);
    set({
      status: 'authenticated',
      session: sessionWithPermissions,
    });
  },
  getValidAccessToken: async () => {
    const currentSession = get().session;

    if (!currentSession) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (
      !isExpiringAt(
        currentSession.tokens.accessTokenExpiresAt,
        ACCESS_TOKEN_REFRESH_SKEW_MS,
      )
    ) {
      return currentSession.tokens.accessToken;
    }

    if (isExpiringAt(currentSession.tokens.refreshTokenExpiresAt)) {
      await clearAuthSession();
      queryClient.clear();
      useAppStore.getState().clearSession();
      set({
        status: 'guest',
        session: null,
      });
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    try {
      refreshSessionPromise ??= authApi
        .refresh({ refreshToken: currentSession.tokens.refreshToken })
        .then(withEffectiveMobilePermissions)
        .finally(() => {
          refreshSessionPromise = null;
        });

      const refreshedSession = await refreshSessionPromise;
      await persistAuthSession(refreshedSession);
      useAppStore.getState().setSession(refreshedSession);
      set({
        status: 'authenticated',
        session: refreshedSession,
      });

      return refreshedSession.tokens.accessToken;
    } catch (error) {
      await clearAuthSession();
      queryClient.clear();
      useAppStore.getState().clearSession();
      set({
        status: 'guest',
        session: null,
        errorMessage: toErrorMessage(
          error,
          'Làm mới phiên đăng nhập thất bại. Vui lòng đăng nhập lại.',
        ),
      });
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  },
  login: async (credentials) => {
    set({
      isLoading: true,
      errorMessage: null,
    });

    try {
      const loginResult = await withEffectiveMobilePermissions(
        await authApi.login(credentials),
      );
      await persistAuthSession(loginResult);
      useAppStore.getState().setSession(loginResult);
      set({
        status: 'authenticated',
        session: loginResult,
      });
    } catch (error) {
      set({
        errorMessage: toErrorMessage(error, 'Đăng nhập thất bại.'),
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    const currentSession = get().session;
    set({
      isLoading: true,
      errorMessage: null,
    });

    try {
      if (currentSession) {
        await authApi.logout(currentSession.tokens.accessToken, {
          accessToken: currentSession.tokens.accessToken,
          refreshToken: currentSession.tokens.refreshToken,
        });
      }
    } catch (error) {
      set({
        errorMessage: toErrorMessage(error, 'Gửi yêu cầu đăng xuất thất bại.'),
      });
    } finally {
      await clearAuthSession();
      queryClient.clear();
      useAppStore.getState().clearSession();
      // TODO(auth): add refresh token rotation + silent refresh flow when contract is finalized.
      set({
        status: 'guest',
        session: null,
        isLoading: false,
      });
    }
  },
}));
