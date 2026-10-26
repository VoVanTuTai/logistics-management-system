import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Headphones, Globe2, Shield, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useLoginMutation } from '../../features/auth/auth.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
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
  const clearGlobalError = useUiStore((state) => state.clearGlobalError);
  const redirectTo = getRedirectPath(location.state);

  useEffect(() => {
    clearGlobalError();
  }, [clearGlobalError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const onSubmit = async (values: LoginFormValues) => {
    clearAuthError();
    clearGlobalError();
    try {
      await loginMutation.mutateAsync(values);
      navigate(redirectTo, { replace: true });
    } catch {
      // Error message is mapped into auth store by useLoginMutation.
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && authError) {
        clearAuthError();
      }
    }
    if (authError) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [authError, clearAuthError]);

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
              <span className="ops-topbar-logo" style={{ width: '38px', height: '38px', borderRadius: '10px' }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4.5 19.5V4.5L16.5 17.5V4.5"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="19.5" cy="5" r="2.2" fill="#93c5fd" />
                </svg>
              </span>
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
                <span className="ops-topbar-logo" style={{ width: '30px', height: '30px', borderRadius: '8px' }} aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.5 19.5V4.5L16.5 17.5V4.5"
                      stroke="#ffffff"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="19.5" cy="5" r="2.2" fill="#93c5fd" />
                  </svg>
                </span>
                <span className="brand-title">NEXUS Ops</span>
              </div>
              <p className="login-kicker-label">Ops Portal</p>
            </div>
            
            <div className="login-header-group">
              <h2 className="login-title-new">Đăng nhập NEXUS Ops</h2>
              <p className="login-subtitle-new">Nhập thông tin nhân viên điều hành để truy cập hệ thống</p>
            </div>

            <LoginForm
              isSubmitting={isSubmitting || loginMutation.isPending}
              errorMessage={null}
              onSubmit={onSubmit}
            />

            <div className="login-footer-support">
              <p className="login-footer-support-text">
                Gặp sự cố đăng nhập?
                <a className="login-footer-support-link" href="#" onClick={(e) => e.preventDefault()}>
                  Liên hệ bộ phận kỹ thuật
                  <Headphones size={15} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                </a>
              </p>
            </div>

            <div className="login-copyright-section">
              <p className="login-copyright-text">© 2026 NEXUS Logistic System. All rights reserved.</p>
              <div className="login-copyright-icons">
                <Globe2 size={16} />
                <Shield size={16} />
                <FileText size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Error Modal Dialog */}
      {authError && (
        <div className="ops-modal-backdrop" onClick={clearAuthError}>
          <div
            className="ops-modal-card ops-modal-card--sm ops-login-error-modal"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
          >
            <div className="ops-login-error-header">
              <div className="ops-login-error-icon-circle">
                <AlertCircle size={24} style={{ color: '#ef4444' }} />
              </div>
              <button
                type="button"
                className="ops-modal-close-btn"
                onClick={clearAuthError}
                aria-label="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ops-login-error-body">
              <h3 id="login-error-title" className="ops-login-error-title">
                Đăng nhập không thành công
              </h3>
              <p className="ops-login-error-message">
                {authError}
              </p>
            </div>

            <div className="ops-login-error-footer">
              <button
                type="button"
                className="ops-login-error-btn"
                onClick={clearAuthError}
                autoFocus
              >
                <span>Đã hiểu & Đăng nhập lại</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
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
