import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../features/auth/auth.api';
import { hasAdminRole } from '../../features/auth/auth.roles';
import { clearAuthSession } from '../../features/auth/auth.session';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const redirectTo = getRedirectPath(location.state);

  useEffect(() => {
    if (isAuthenticated && hasAdminRole(session)) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo, session]);

  const onSubmit = async (values: LoginFormValues) => {
    clearAuthError();

    try {
      const session = await loginMutation.mutateAsync(values);

      if (!hasAdminRole(session)) {
        await clearAuthSession();
        setAuthError('Tài khoản phải có vai trò SYSTEM_ADMIN.');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch {
      // Error message is mapped into auth store by useLoginMutation.
    }
  };

  if (status === 'restoring') {
    return <div className="admin-route-loading">Đang khôi phục phiên đăng nhập...</div>;
  }

  return (
    <div className="login-shell">
      <div className="login-layout">
        {/* Left Side: Visual Focus & Brand Identity */}
        <section className="login-hero" style={{ background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.72), rgba(67, 56, 202, 0.94))' }}>
          <img className="login-hero-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH9tY3PsZjp-XCnVG-y43-sPKhb-INEfJPNHYxHTVdm69WwoXvGDiw7DfuvmU5b3DHK_888jICATCwV5G1g3uvdjTPamNKyM8KJB2Ei4T4RBJ-M4US87urT0uP9tXDcCuNPz6FtF-nTa_G-XDYI2LyIsduJvHEffTuIOfqjWvAttJm8D15E5_GNR64ZxIKkl1kwxBKH-3LgX4daJfTkFTanBTrDiE0qwHwVdRRNZ_O-PizHz0CEsugBHSQU-6tzxan_Mxrdatluq8" alt="Logistics Background" />
          <div className="login-hero-overlay" style={{ background: 'linear-gradient(to top, rgba(79, 70, 229, 0.8), transparent, rgba(79, 70, 229, 0.4))' }} />
          <div className="login-hero-content">
            <div className="login-hero-top">
              <span className="material-symbols-outlined brand-icon">hub</span>
              <h1 className="brand-title">NEXUS Admin</h1>
            </div>
            <div className="login-hero-copy">
              <h2 className="login-hero-title">Hệ thống Quản trị & Cấu hình Trung tâm</h2>
              <p className="login-hero-text">Phân quyền vai trò chi tiết (RBAC), quản lý cấu hình bưu cục, định tuyến bưu gửi, giám sát hệ thống và phân vùng biểu phí.</p>
            </div>
            <div className="login-hero-stats">
              <div className="login-stat">
                <strong>RBAC</strong>
                <span>Quản trị bảo mật</span>
              </div>
              <div className="login-stat">
                <strong>System</strong>
                <span>Cấu hình dùng chung</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <div className="login-card">
          <div className="login-card-inner">
            <div className="login-brand-header">
              <div className="login-brand-logo">
                <span className="material-symbols-outlined brand-icon" style={{ color: 'var(--stitch-primary)' }}>hub</span>
                <span className="brand-title" style={{ color: 'var(--stitch-primary)' }}>NEXUS Admin</span>
              </div>
              <p className="login-kicker-label">Admin Portal</p>
            </div>
            
            <div className="login-header-group">
              <h2 className="login-title-new">Đăng nhập Quản trị</h2>
              <p className="login-subtitle-new">Nhập tài khoản quản trị hệ thống để tiếp tục</p>
            </div>

            <LoginForm
              isSubmitting={isSubmitting || loginMutation.isPending}
              errorMessage={authError}
              onSubmit={onSubmit}
              usernamePlaceholder="10000001"
            />

            <div className="login-footer-support">
              <p className="login-footer-support-text">
                Cần phân quyền hoặc tài khoản mới?
                <a className="login-footer-support-link" href="#" onClick={(e) => e.preventDefault()}>
                  Liên hệ Quản trị viên
                  <span className="material-symbols-outlined">support_agent</span>
                </a>
              </p>
            </div>

            <div className="login-copyright-section">
              <p className="login-copyright-text">© 2026 NEXUS Logistic System. All rights reserved.</p>
              <div className="login-copyright-icons">
                <span className="material-symbols-outlined">language</span>
                <span className="material-symbols-outlined">security</span>
                <span className="material-symbols-outlined">policy</span>
              </div>
            </div>
          </div>
        </div>
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

  return routePaths.masterdataHubs;
}
