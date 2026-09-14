import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginFormValues } from '../../features/auth/auth.types';
import {
  clearRememberedCredentials,
  getRememberedCredentials,
  saveRememberedCredentials,
} from '../../features/auth/auth.session';

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
  const remembered = React.useMemo(() => getRememberedCredentials(), []);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(remembered ? remembered.rememberMe : true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: remembered?.username ?? '',
      password: remembered?.password ?? '',
    },
  });

  React.useEffect(() => {
    const current = getRememberedCredentials();
    if (current) {
      setRememberMe(current.rememberMe);
      form.reset({
        username: current.username ?? '',
        password: current.password ?? '',
      });
    }
  }, [form]);

  const handleFormSubmit = async (values: LoginFormValues) => {
    if (rememberMe) {
      saveRememberedCredentials({
        username: values.username,
        password: values.password,
        rememberMe: true,
      });
    } else {
      clearRememberedCredentials();
    }
    await onSubmit(values);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="login-form-new">
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
            autoComplete="username"
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
            autoComplete="current-password"
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

      <div className="login-utilities">
        <label className="login-remember-label">
          <input
            className="login-remember-checkbox"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
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
