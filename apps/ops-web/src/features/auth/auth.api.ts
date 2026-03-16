import { useMutation } from '@tanstack/react-query';

import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { authClient } from './auth.client';
import { clearAuthSession, persistAuthSession } from './auth.session';
import type { LoginFormValues } from './auth.types';

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
