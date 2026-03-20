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
        setAuthError('Account must include SYSTEM_ADMIN role.');
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
        <p className="auth-kicker">Admin Portal</p>
        <h2 className="auth-title">Sign In To System Governance</h2>
        <p className="auth-subtitle">Manage RBAC, hubs, zones, NDR reasons, and shared configs.</p>
        <LoginForm
          isSubmitting={isSubmitting || loginMutation.isPending}
          errorMessage={authError}
          onSubmit={onSubmit}
          usernamePlaceholder="admin.root"
        />
      </div>
    </div>
  );
}
