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
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Ops Login</h2>
        <p style={styles.subtitle}>Internal access via gateway-bff only</p>
        <LoginForm
          isSubmitting={isSubmitting || loginMutation.isPending}
          errorMessage={authError}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #d9def3',
    padding: 20,
  },
  title: {
    marginTop: 0,
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 16,
    color: '#2d3f99',
  },
};
