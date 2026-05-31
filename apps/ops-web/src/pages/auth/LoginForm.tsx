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
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="login-form-new">
      <div className="login-field-group">
        <label className="login-field-label" htmlFor="username">
          Tên đăng nhập
        </label>
        <div className="login-input-wrapper">
          <span className="material-symbols-outlined login-input-icon">person</span>
          <input
            id="username"
            {...form.register('username')}
            className="login-input"
            placeholder="20000001"
          />
        </div>
        {form.formState.errors.username ? (
          <small className="auth-error">{form.formState.errors.username.message}</small>
        ) : null}
      </div>

      <div className="login-field-group">
        <label className="login-field-label" htmlFor="password">
          Mật khẩu
        </label>
        <div className="login-input-wrapper">
          <span className="material-symbols-outlined login-input-icon">lock</span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('password')}
            className="login-input login-input-password"
            placeholder="••••••••"
          />
          <button
            className="login-input-toggle-btn"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        {form.formState.errors.password ? (
          <small className="auth-error">{form.formState.errors.password.message}</small>
        ) : null}
      </div>

      {errorMessage ? <div className="auth-error-banner">{errorMessage}</div> : null}

      <div className="login-utilities">
        <label className="login-remember-label">
          <input className="login-remember-checkbox" type="checkbox" />
          <span className="login-remember-text">Ghi nhớ đăng nhập</span>
        </label>
        <a className="login-forgot-link" href="#" onClick={(e) => e.preventDefault()}>Quên mật khẩu?</a>
      </div>

      <button type="submit" disabled={isSubmitting} className="login-submit-btn">
        <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
        <span className="material-symbols-outlined">login</span>
      </button>
    </form>
  );
}
