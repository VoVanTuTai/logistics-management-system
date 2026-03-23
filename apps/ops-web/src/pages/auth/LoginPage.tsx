import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../features/auth/auth.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { LoginForm } from './LoginForm';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);

  const onSubmit = async (values: LoginFormValues) => {
    clearAuthError();
    try {
      await loginMutation.mutateAsync(values);
      navigate(routePaths.dashboard, { replace: true });
    } catch {
      // Error message is mapped into auth store by useLoginMutation.
    }
  };

  return (
    <div className="auth-page auth-page-ops">
      <div className="auth-card">
        <p className="auth-kicker">Cong Ops</p>
        <h2 className="auth-title">Đăng nhập JMS Ops</h2>
        <p className="auth-subtitle">Trung tam dieu hanh noi bo cho lay hang, quet, phan cong va manifest.</p>
        <LoginForm
          isSubmitting={isSubmitting || loginMutation.isPending}
          errorMessage={authError}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
