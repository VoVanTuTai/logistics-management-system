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
    <div className="login-shell">
      <div className="login-layout">
        {/* Left Side: Visual Focus & Brand Identity */}
        <section className="login-hero">
          <img className="login-hero-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH9tY3PsZjp-XCnVG-y43-sPKhb-INEfJPNHYxHTVdm69WwoXvGDiw7DfuvmU5b3DHK_888jICATCwV5G1g3uvdjTPamNKyM8KJB2Ei4T4RBJ-M4US87urT0uP9tXDcCuNPz6FtF-nTa_G-XDYI2LyIsduJvHEffTuIOfqjWvAttJm8D15E5_GNR64ZxIKkl1kwxBKH-3LgX4daJfTkFTanBTrDiE0qwHwVdRRNZ_O-PizHz0CEsugBHSQU-6tzxan_Mxrdatluq8" alt="Logistics Background" />
          <div className="login-hero-overlay" />
          <div className="login-hero-content">
            <div className="login-hero-top">
              <span className="material-symbols-outlined brand-icon">hub</span>
              <h1 className="brand-title">NEXUS Ops</h1>
            </div>
            <div className="login-hero-copy">
              <h2 className="login-hero-title">Trung tâm Điều phối & Vận hành Nội bộ</h2>
              <p className="login-hero-text">Hệ thống quản lý thời gian thực giúp tối ưu quy trình lấy hàng, phân loại bưu gửi, đóng bao và phân công giao vận.</p>
            </div>
            <div className="login-hero-stats">
              <div className="login-stat">
                <strong>50+</strong>
                <span>Bưu cục bưu điện</span>
              </div>
              <div className="login-stat">
                <strong>24/7</strong>
                <span>Vận hành liên tục</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <div className="login-card">
          <div className="login-card-inner">
            <div className="login-brand-header">
              <div className="login-brand-logo">
                <span className="material-symbols-outlined brand-icon">hub</span>
                <span className="brand-title">NEXUS Ops</span>
              </div>
              <p className="login-kicker-label">Ops Portal</p>
            </div>
            
            <div className="login-header-group">
              <h2 className="login-title-new">Đăng nhập tài khoản</h2>
              <p className="login-subtitle-new">Nhập thông tin nhân viên điều hành để truy cập hệ thống</p>
            </div>

            <LoginForm
              isSubmitting={isSubmitting || loginMutation.isPending}
              errorMessage={authError}
              onSubmit={onSubmit}
            />

            <div className="login-footer-support">
              <p className="login-footer-support-text">
                Gặp sự cố đăng nhập?
                <a className="login-footer-support-link" href="#" onClick={(e) => e.preventDefault()}>
                  Liên hệ bộ phận kỹ thuật
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

  return routePaths.dashboard;
}
