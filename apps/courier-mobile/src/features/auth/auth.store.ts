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
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
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
    return {
      ...session,
      user: {
        ...session.user,
        mobilePermissionActor: undefined,
        mobilePermissions: undefined,
        mobilePermissionsLoadedAt: undefined,
      },
    };
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
    set({
      status: 'authenticated',
      session: sessionWithPermissions,
    });
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
      // TODO(auth): add refresh token rotation + silent refresh flow when contract is finalized.
      set({
        status: 'guest',
        session: null,
        isLoading: false,
      });
    }
  },
}));
