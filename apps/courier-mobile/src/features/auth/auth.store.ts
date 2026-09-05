import { create } from 'zustand';

import { useAppStore } from '../../store/appStore';
import { queryClient } from '../../store/queryClient';
import { ApiClientError } from '../../services/api/client';
import { appEnv } from '../../utils/env';
import { authApi } from './auth.api';
import {
  clearAuthSession,
  getTodayDateString,
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
  checkDayExpiry: () => Promise<boolean>;
}

const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;
const COURIER_APP_ALLOWED_ROLES = new Set([
  'SYSTEM_ADMIN',
  'OPS_ADMIN',
  'OPS_VIEWER',
  'COURIER',
]);

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

    console.warn(
      '[permissions] Loaded effective permissions for user',
      session.user.id,
      'actor=',
      effectivePermissions.actor,
      'hasOverride=',
      effectivePermissions.hasOverride,
      'permissions=',
      JSON.stringify(effectivePermissions.permissions),
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      '[permissions] FAILED to load effective permissions for user',
      session.user.id,
      'error=',
      errorMsg,
    );

    // If unauthorized or token is expired/invalid, reject session restoration
    if (
      (error instanceof ApiClientError && error.status === 401) ||
      /invalid or expired/i.test(errorMsg) ||
      /unauthorized/i.test(errorMsg) ||
      /jwt/i.test(errorMsg)
    ) {
      throw error;
    }

    return session;
  }
}

function assertCourierSession(session: LoginResultDto): void {
  const canUseCourierApp = session.user.roles.some((role) =>
    COURIER_APP_ALLOWED_ROLES.has(role.trim().toUpperCase()),
  );

  if (!canUseCourierApp) {
    throw new Error(
      'Tai khoan khong thuoc nhom quyen COURIER hoac OPS. Vui long dang nhap dung ung dung.',
    );
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

      // 1. Build check: If app was rebuilt or build ID mismatch, require fresh login
      if (
        !storedSession.buildId ||
        (appEnv.buildId && storedSession.buildId !== appEnv.buildId)
      ) {
        console.warn('[auth] App build updated or re-bundled. Requiring fresh login.');
        await clearAuthSession();
        useAppStore.getState().setGuest();
        set({
          status: 'guest',
          session: null,
          errorMessage: 'Ứng dụng đã được cập nhật phiên bản mới. Vui lòng đăng nhập lại.',
        });
        return;
      }

      // 2. Day check: Shift session expires when the day ends (same-day retention)
      const today = getTodayDateString();
      if (!storedSession.sessionDate || storedSession.sessionDate !== today) {
        console.warn('[auth] Session has expired for the day. Requiring fresh login.');
        await clearAuthSession();
        useAppStore.getState().setGuest();
        set({
          status: 'guest',
          session: null,
          errorMessage: 'Phiên làm việc trong ngày đã kết thúc. Vui lòng đăng nhập lại ca mới.',
        });
        return;
      }

      assertCourierSession(storedSession);

      // 3. Token check: If access token is expiring, refresh it
      let activeSession = storedSession;
      if (isExpiringAt(storedSession.tokens.accessTokenExpiresAt, ACCESS_TOKEN_REFRESH_SKEW_MS)) {
        if (isExpiringAt(storedSession.tokens.refreshTokenExpiresAt)) {
          console.warn('[auth] Refresh token expired. Requiring login.');
          await clearAuthSession();
          useAppStore.getState().setGuest();
          set({
            status: 'guest',
            session: null,
            errorMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          });
          return;
        }

        try {
          const refreshed = await authApi.refresh({
            refreshToken: storedSession.tokens.refreshToken,
          });
          assertCourierSession(refreshed);
          activeSession = {
            ...refreshed,
            sessionDate: today,
            loggedInAt: storedSession.loggedInAt ?? new Date().toISOString(),
            buildId: appEnv.buildId,
          };
        } catch (refreshErr) {
          console.warn('[auth] Token refresh failed on restore:', refreshErr);
          await clearAuthSession();
          useAppStore.getState().setGuest();
          set({
            status: 'guest',
            session: null,
            errorMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          });
          return;
        }
      }

      const sessionWithPermissions =
        await withEffectiveMobilePermissions(activeSession);
      await persistAuthSession(sessionWithPermissions);
      useAppStore.getState().setSession(sessionWithPermissions);
      set({
        status: 'authenticated',
        session: sessionWithPermissions,
      });
    } catch (error) {
      console.warn('[auth] Session restoration error:', error);
      await clearAuthSession();
      useAppStore.getState().setGuest();
      set({
        status: 'guest',
        session: null,
        errorMessage: toErrorMessage(error, 'Khôi phục phiên đăng nhập thất bại. Vui lòng đăng nhập lại.'),
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
        .then((refreshedSession) => {
          assertCourierSession(refreshedSession);
          return refreshedSession;
        })
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
      const sessionForToday: LoginResultDto = {
        ...loginResult,
        sessionDate: getTodayDateString(),
        loggedInAt: new Date().toISOString(),
        buildId: appEnv.buildId,
      };
      await persistAuthSession(sessionForToday);
      useAppStore.getState().setSession(sessionForToday);
      set({
        status: 'authenticated',
        session: sessionForToday,
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
  checkDayExpiry: async () => {
    const currentSession = get().session;
    if (!currentSession) {
      return false;
    }

    const today = getTodayDateString();
    if (currentSession.sessionDate && currentSession.sessionDate !== today) {
      console.warn('[auth] Session expired for the day. Auto logging out.');
      await get().logout();
      useAppStore.getState().setGlobalError(
        'Phiên làm việc trong ngày đã kết thúc. Vui lòng đăng nhập lại ca mới.',
      );
      return true;
    }
    return false;
  },
}));
