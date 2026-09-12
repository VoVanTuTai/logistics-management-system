import { useMutation, useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { authClient } from './auth.client';
import { clearAuthSession, persistAuthSession } from './auth.session';
import type { LoginFormValues } from './auth.types';

const OPS_ALLOWED_ROLES = new Set(['SYSTEM_ADMIN', 'OPS_ADMIN', 'OPS_VIEWER', 'OPS_MANAGER']);

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
  if (lower.includes('tài khoản không thuộc nhóm quyền ops')) {
    return 'Tài khoản không thuộc nhóm quyền OPS. Vui lòng đăng nhập đúng cổng hệ thống.';
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
        if (!isOpsSession(session)) {
          throw new Error(
            'Tài khoản không thuộc nhóm quyền OPS. Vui lòng đăng nhập đúng cổng hệ thống.',
          );
        }
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

export function useShipperUsersQuery(
  accessToken: string | null,
  filters?: { hubCode?: string; status?: 'ACTIVE' | 'DISABLED'; q?: string },
) {
  return useQuery({
    queryKey: [
      'auth',
      'users',
      'shipper',
      filters?.hubCode ?? 'all',
      filters?.status ?? 'all',
      filters?.q ?? '',
    ],
    queryFn: () =>
      authClient.listUsers(accessToken, {
        roleGroup: 'SHIPPER',
        hubCode: filters?.hubCode,
        status: filters?.status,
        q: filters?.q,
      }),
    enabled: Boolean(accessToken),
  });
}

