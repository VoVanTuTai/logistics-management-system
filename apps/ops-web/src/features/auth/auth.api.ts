import { useMutation } from '@tanstack/react-query';

import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { authClient } from './auth.client';
import { clearAuthSession, persistAuthSession } from './auth.session';
import type { LoginFormValues } from './auth.types';

const OPS_ALLOWED_ROLES = new Set(['SYSTEM_ADMIN', 'OPS_ADMIN', 'OPS_VIEWER']);

export const authApi = {
  login: authClient.login,
  logout: authClient.logout,
  refresh: authClient.refresh,
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (payload: LoginFormValues) => {
      useAuthStore.getState().setSubmitting(true);
      useAuthStore.getState().clearAuthError();

      try {
        const session = await authApi.login(payload);
        if (!isOpsSession(session)) {
          throw new Error(
            'Tài khoản không thuộc nhóm quyền OPS. Vui lòng đăng nhập đúng cổng hệ thống.',
          );
        }
        await persistAuthSession(session);
        return session;
      } catch (error) {
        useAuthStore.getState().setAuthError(getErrorMessage(error));
        throw error;
      } finally {
        useAuthStore.getState().setSubmitting(false);
      }
    },
  });
}

function isOpsSession(session: { user: { roles: string[] } }): boolean {
  return session.user.roles.some((role) =>
    OPS_ALLOWED_ROLES.has(role.trim().toUpperCase()),
  );
}

export function useLogoutMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: async () => {
      useAuthStore.getState().setSubmitting(true);
      useAuthStore.getState().clearAuthError();

      try {
        await authApi.logout(accessToken);
      } catch (error) {
        useAuthStore.getState().setAuthError(getErrorMessage(error));
      } finally {
        await clearAuthSession();
        useAuthStore.getState().setSubmitting(false);
      }
    },
  });
}
