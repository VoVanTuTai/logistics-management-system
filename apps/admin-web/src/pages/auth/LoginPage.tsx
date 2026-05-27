import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../features/auth/auth.api';
import { hasAdminRole } from '../../features/auth/auth.roles';
import { clearAuthSession } from '../../features/auth/auth.session';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  const onSubmit = async (values: LoginFormValues) => {
    clearAuthError();

    try {
      const session = await loginMutation.mutateAsync(values);

      if (!hasAdminRole(session)) {
        await clearAuthSession();
        setAuthError('Tài khoản phải có vai trò SYSTEM_ADMIN.');
        return;
      }

      navigate(routePaths.masterdataHubs, { replace: true });
    } catch {
      // Error message is mapped into auth store by useLoginMutation.
    }
  };

  return (
    <div className="auth-page auth-page-admin">
      <div className="auth-card">
        <p className="auth-kicker">Cổng Admin</p>
        <h2 className="auth-title">Đăng nhập Hệ Thống Quản Trị</h2>
        <p className="auth-subtitle">Quản lý RBAC, hub, zone, lý do NDR và cấu hình dùng chung.</p>
        <LoginForm
          isSubmitting={isSubmitting || loginMutation.isPending}
          errorMessage={authError}
          onSubmit={onSubmit}
          usernamePlaceholder="10000001"
        />
      </div>
    </div>
  );
}
