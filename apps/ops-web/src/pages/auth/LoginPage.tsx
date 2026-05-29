import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../features/auth/auth.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { LoginForm } from './LoginForm';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const redirectTo = getRedirectPath(location.state);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const onSubmit = async (values: LoginFormValues) => {
    clearAuthError();
    try {
      await loginMutation.mutateAsync(values);
      navigate(redirectTo, { replace: true });
    } catch {
      // Error message is mapped into auth store by useLoginMutation.
    }
  };

  if (status === 'restoring') {
    return <div className="ops-route-loading">Đang khôi phục phiên đăng nhập...</div>;
  }

  return (
    <div className="auth-page auth-page-ops">
      <div className="auth-card">
        <p className="auth-kicker">Cổng Ops</p>
        <h2 className="auth-title">Đăng nhập NEXUS Ops</h2>
        <p className="auth-subtitle">Trung tâm điều hành nội bộ cho lấy hàng, quét, phân công và bao tải.</p>
        <LoginForm
          isSubmitting={isSubmitting || loginMutation.isPending}
          errorMessage={authError}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

function getRedirectPath(state: unknown): string {
  if (
    state !== null &&
    typeof state === 'object' &&
    'from' in state &&
    state.from !== null &&
    typeof state.from === 'object' &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string' &&
    state.from.pathname.startsWith('/app')
  ) {
    const search =
      'search' in state.from && typeof state.from.search === 'string'
        ? state.from.search
        : '';
    return `${state.from.pathname}${search}`;
  }

  return routePaths.dashboard;
}
