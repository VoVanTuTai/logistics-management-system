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
    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
      <label className="auth-label" htmlFor="username">
        Ten dang nhap
      </label>
      <input
        id="username"
        {...form.register('username')}
        className="auth-input"
        placeholder="20000001"
      />
      {form.formState.errors.username ? (
        <small className="auth-error">{form.formState.errors.username.message}</small>
      ) : null}

      <label className="auth-label" htmlFor="password">
        Mật khẩu
      </label>
      <input
        id="password"
        type="password"
        {...form.register('password')}
        className="auth-input"
        placeholder="********"
      />
      {form.formState.errors.password ? (
        <small className="auth-error">{form.formState.errors.password.message}</small>
      ) : null}

      {errorMessage ? <div className="auth-error-banner">{errorMessage}</div> : null}

      <button type="submit" disabled={isSubmitting} className="auth-submit">
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
