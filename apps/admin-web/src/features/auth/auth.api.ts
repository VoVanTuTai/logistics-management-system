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

export function formatAuthErrorMessage(rawMessage: string | null | undefined): string {
  if (!rawMessage) return 'Đã xảy ra lỗi không xác định khi đăng nhập.';
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes('invalid credential') ||
    lower.includes('invalid credentials') ||
    lower.includes('unauthorized') ||
    lower.includes('sai mật khẩu') ||
    lower.includes('user not found') ||
    lower.includes('không tìm thấy') ||
    lower.includes('401')
  ) {
    return 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại thông tin đã nhập.';
  }
  if (lower.includes('tài khoản phải có vai trò')) {
    return 'Tài khoản không có vai trò Quản trị viên (SYSTEM_ADMIN).';
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('kết nối')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
  }
  return rawMessage;
}

export function useLoginMutation() {
  return useMutation({
    meta: {
      suppressGlobalError: true,
    },
    mutationFn: async (payload: LoginFormValues) => {
      useAuthStore.getState().setSubmitting(true);
      useAuthStore.getState().clearAuthError();

      try {
        const session = await authApi.login(payload);
        await persistAuthSession(session);
        return session;
      } catch (error) {
        useAuthStore.getState().setAuthError(formatAuthErrorMessage(getErrorMessage(error)));
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
