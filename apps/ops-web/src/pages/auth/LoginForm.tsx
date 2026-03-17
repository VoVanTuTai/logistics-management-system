import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginFormValues } from '../../features/auth/auth.types';

interface LoginFormProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export function LoginForm({
  isSubmitting,
  errorMessage,
  onSubmit,
}: LoginFormProps): React.JSX.Element {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={styles.form}>
      <label style={styles.label} htmlFor="username">
        Tên đăng nhập
      </label>
      <input
        id="username"
        {...form.register('username')}
        style={styles.input}
        placeholder="ops.username"
      />
      {form.formState.errors.username ? (
        <small style={styles.errorText}>{form.formState.errors.username.message}</small>
      ) : null}

      <label style={styles.label} htmlFor="password">
        Mật khẩu
      </label>
      <input
        id="password"
        type="password"
        {...form.register('password')}
        style={styles.input}
        placeholder="********"
      />
      {form.formState.errors.password ? (
        <small style={styles.errorText}>{form.formState.errors.password.message}</small>
      ) : null}

      {errorMessage ? <div style={styles.errorBanner}>{errorMessage}</div> : null}

      <button type="submit" disabled={isSubmitting} style={styles.button}>
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontWeight: 600,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '10px 12px',
  },
  errorText: {
    color: '#b91c1c',
  },
  errorBanner: {
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: 10,
    padding: '8px 10px',
  },
  button: {
    marginTop: 8,
    border: 'none',
    borderRadius: 10,
    backgroundColor: '#000080',
    color: '#ffffff',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
