import { useMutation } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { queryKeys } from '../../utils/queryKeys';
import { authClient } from './auth.client';
import { clearAuthSession, persistAuthSession } from './auth.session';
import type { AdminUserCreateInput, AdminUserFilters, AdminUserUpdateInput, LoginFormValues } from './auth.types';

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

export function useAdminUsersQuery(
  accessToken: string | null,
  filters: AdminUserFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.adminUsers,
      filters.roleGroup,
      filters.status ?? '',
      filters.hubCode ?? '',
      filters.q ?? '',
    ],
    queryFn: () => authClient.listUsers(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateAdminUserMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminUserCreateInput) =>
      authClient.createUser(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });
}

export function useUpdateAdminUserMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; payload: AdminUserUpdateInput }) =>
      authClient.updateUser(accessToken, params.userId, params.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });
}

export function useDeleteAdminUserMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authClient.deleteUser(accessToken, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });
}
