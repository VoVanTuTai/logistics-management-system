import React from 'react';
import { NexusBrandLogo } from '../../components/layout/NexusBrandLogo';

export interface MerchantLoginFormProps {
  loginUsername: string;
  loginPassword: string;
  rememberMe: boolean;
  loginLoading: boolean;
  loginError: string | null;
  showPassword: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onToggleShowPassword: () => void;
  onClearLoginError: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onFillDemoAccount: (username: string) => void;
}

export function MerchantLoginForm({
  loginUsername,
  loginPassword,
  rememberMe,
  loginLoading,
  loginError,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onRememberMeChange,
  onToggleShowPassword,
  onClearLoginError,
  onSubmit,
  onFillDemoAccount,
}: MerchantLoginFormProps): React.JSX.Element {
  return (
    <div className="login-shell">
      <div className="login-layout">
        {/* Left Side: Visual Focus & Brand Identity */}
        <section className="login-hero">
          <img
            className="login-hero-img"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH9tY3PsZjp-XCnVG-y43-sPKhb-INEfJPNHYxHTVdm69WwoXvGDiw7DfuvmU5b3DHK_888jICATCwV5G1g3uvdjTPamNKyM8KJB2Ei4T4RBJ-M4US87urT0uP9tXDcCuNPz6FtF-nTa_G-XDYI2LyIsduJvHEffTuIOfqjWvAttJm8D15E5_GNR64ZxIKkl1kwxBKH-3LgX4daJfTkFTanBTrDiE0qwHwVdRRNZ_O-PizHz0CEsugBHSQU-6tzxan_Mxrdatluq8"
            alt="Logistics Background"
          />
          <div className="login-hero-overlay" />
          <div className="login-hero-content">
            <div className="login-hero-top">
              <NexusBrandLogo size={42} portal="merchant" theme="dark" showLabel={true} />
            </div>
            <div className="login-hero-copy">
              <h2 className="login-hero-title">Nền tảng Logistics thông minh cho doanh nghiệp hiện đại</h2>
              <p className="login-hero-text">Kết nối vận chuyển toàn quốc với quy trình tối ưu và dữ liệu thời gian thực.</p>
            </div>
            <div className="login-hero-stats">
              <div className="login-stat">
                <strong>10k+</strong>
                <span>Đối tác tin dùng</span>
              </div>
              <div className="login-stat">
                <strong>24/7</strong>
                <span>Hỗ trợ kỹ thuật</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <div className="login-card">
          <div className="login-card-inner">
            <div className="login-brand-header">
              <NexusBrandLogo size={36} portal="merchant" theme="light" showLabel={true} />
            </div>

            <div className="login-header-group">
              <h2 className="login-title-new">Chào mừng trở lại</h2>
              <p className="login-subtitle-new">Vui lòng nhập thông tin để truy cập hệ thống quản lý</p>
            </div>

            <form className="login-form-new" onSubmit={onSubmit}>
              <div className="login-field-group">
                <label className="login-field-label" htmlFor="username">Mã Shop / SĐT / Email</label>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined login-input-icon">storefront</span>
                  <input
                    className="login-input"
                    id="username"
                    value={loginUsername}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    placeholder="VD: 41100001 hoặc 0941000001"
                    type="text"
                  />
                </div>
                <span className="login-field-hint">
                  Đăng nhập bằng Mã bưu cục shop (41100001), Số điện thoại (0941000001) hoặc Email demo
                </span>
              </div>

              <div className="login-field-group">
                <label className="login-field-label" htmlFor="password">Mật khẩu</label>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined login-input-icon">lock</span>
                  <input
                    className="login-input login-input-password"
                    id="password"
                    value={loginPassword}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    className="login-input-toggle-btn"
                    type="button"
                    onClick={onToggleShowPassword}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Demo Preset Selector */}
              <div className="login-demo-presets">
                <div className="login-demo-header">
                  <span className="material-symbols-outlined login-demo-icon">bolt</span>
                  <span className="login-demo-title">Tài khoản Demo Nhanh (Click tự điền)</span>
                </div>
                <div className="login-demo-chip-list">
                  <button
                    type="button"
                    className={`login-demo-chip ${loginUsername === '41100001' ? 'active' : ''}`}
                    onClick={() => onFillDemoAccount('41100001')}
                    title="Shop Hàng Bài - Hoàn Kiếm, Hà Nội (SĐT: 0941000001)"
                  >
                    <span className="login-chip-badge hn">HN</span>
                    <span className="login-chip-code">41100001</span>
                    <span className="login-chip-name">P. Hàng Bài</span>
                  </button>
                  <button
                    type="button"
                    className={`login-demo-chip ${loginUsername === '41100048' ? 'active' : ''}`}
                    onClick={() => onFillDemoAccount('41100048')}
                    title="Shop Thạch Thang - Hải Châu, Đà Nẵng (SĐT: 0941000048)"
                  >
                    <span className="login-chip-badge dn">ĐN</span>
                    <span className="login-chip-code">41100048</span>
                    <span className="login-chip-name">P. Thạch Thang</span>
                  </button>
                  <button
                    type="button"
                    className={`login-demo-chip ${loginUsername === '41100079' ? 'active' : ''}`}
                    onClick={() => onFillDemoAccount('41100079')}
                    title="Shop Bến Thành - Quận 1, TP.HCM (SĐT: 0941000079)"
                  >
                    <span className="login-chip-badge hcm">HCM</span>
                    <span className="login-chip-code">41100079</span>
                    <span className="login-chip-name">P. Bến Thành</span>
                  </button>
                </div>
              </div>

              <div className="login-utilities">
                <label className="login-remember-label">
                  <input
                    className="login-remember-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => onRememberMeChange(e.target.checked)}
                  />
                  <span className="login-remember-text">Ghi nhớ đăng nhập</span>
                </label>
                <a className="login-forgot-link" href="#" onClick={(e) => e.preventDefault()}>Quên mật khẩu?</a>
              </div>

              <button className="login-submit-btn" type="submit" disabled={loginLoading}>
                <span>{loginLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}</span>
                <span className="material-symbols-outlined">login</span>
              </button>
            </form>

            {/* Login Error Modal Dialog */}
            {loginError && (
              <div className="ops-modal-backdrop" onClick={onClearLoginError}>
                <div
                  className="ops-modal-card ops-modal-card--sm ops-login-error-modal"
                  onClick={(e) => e.stopPropagation()}
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="merchant-login-error-title"
                >
                  <div className="ops-login-error-header">
                    <div className="ops-login-error-icon-circle">
                      <span className="material-symbols-outlined">error</span>
                    </div>
                    <button
                      type="button"
                      className="ops-modal-close-btn"
                      onClick={onClearLoginError}
                      aria-label="Đóng thông báo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>

                  <div className="ops-login-error-body">
                    <h3 id="merchant-login-error-title" className="ops-login-error-title">
                      Đăng nhập không thành công
                    </h3>
                    <p className="ops-login-error-message">
                      {loginError}
                    </p>
                  </div>

                  <div className="ops-login-error-footer">
                    <button
                      type="button"
                      className="ops-login-error-btn"
                      onClick={onClearLoginError}
                      autoFocus
                    >
                      <span>Đã hiểu & Đăng nhập lại</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="login-footer-support">
              <p className="login-footer-support-text">
                Chưa có tài khoản?
                <a className="login-footer-support-link" href="#" onClick={(e) => e.preventDefault()}>
                  Liên hệ bộ phận hỗ trợ
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
