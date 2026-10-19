import React from 'react';
import type { HubLocationOption, MerchantProfile, MerchantSession } from '../../types';
import { formatDate } from '../../api';

export interface MerchantAccountViewProps {
  session: MerchantSession;
  profile: MerchantProfile;
  onProfileChange: React.Dispatch<React.SetStateAction<MerchantProfile>>;
  selectedAccountProvinceHub: HubLocationOption | null;
  accountSaving: boolean;
  accountMessage: string | null;
  onSaveAccountProfile: (e?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  passwordOld: string;
  passwordNew: string;
  passwordConfirm: string;
  passwordSaving: boolean;
  passwordMessage: string | null;
  onPasswordOldChange: (value: string) => void;
  onPasswordNewChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
  onChangeAccountPassword: (e?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function MerchantAccountView({
  session,
  profile,
  onProfileChange,
  selectedAccountProvinceHub,
  accountSaving,
  accountMessage,
  onSaveAccountProfile,
  passwordOld,
  passwordNew,
  passwordConfirm,
  passwordSaving,
  passwordMessage,
  onPasswordOldChange,
  onPasswordNewChange,
  onPasswordConfirmChange,
  onChangeAccountPassword,
}: MerchantAccountViewProps): React.JSX.Element {
  return (
    <section className="account-layout">
      <header className="account-page-header">
        <h2>Tài khoản</h2>
        <p className="muted">Quản lý thông tin định danh và cài đặt bảo mật của bạn.</p>
      </header>

      <div className="account-grid">
        <div className="account-main-column">
          <section className="card account-profile-card">
            <div className="account-card-header">
              <span className="account-card-icon">ID</span>
              <h3>Thông tin tài khoản</h3>
            </div>
            <div className="account-profile-content">
              <div className="account-avatar-block">
                <div className="account-avatar">
                  {(session.user.username ?? 'M').slice(0, 2).toUpperCase()}
                </div>
                <button className="account-avatar-edit" type="button">
                  Sửa
                </button>
              </div>
              <form
                className="account-profile-form"
                onSubmit={(e) => {
                  void onSaveAccountProfile(e);
                }}
              >
                <div className="account-fields-grid">
                  <div className="account-field">
                    <label className="label">Tên Merchant</label>
                    <input
                      className="input"
                      value={profile.shopName}
                      onChange={(e) => onProfileChange((p) => ({ ...p, shopName: e.target.value }))}
                      placeholder="Tên cửa hàng"
                    />
                  </div>
                  <div className="account-field">
                    <label className="label">Merchant ID</label>
                    <input className="input account-readonly-input" value={session.user.id} readOnly />
                  </div>
                  <div className="account-field">
                    <label className="label">Số điện thoại</label>
                    <input
                      className="input"
                      value={profile.contactPhone}
                      onChange={(e) =>
                        onProfileChange((p) => ({ ...p, contactPhone: e.target.value }))
                      }
                      placeholder="SĐT liên hệ"
                    />
                  </div>
                  <div className="account-field">
                    <label className="label">Email</label>
                    <input
                      className="input account-readonly-input"
                      value={profile.email}
                      placeholder="Email chưa có contract backend"
                      readOnly
                    />
                  </div>
                  {/* Fixed Warehouse & Auto-Dispatch Hub Card */}
                  <div className="warehouse-fixed-card account-field--span-2">
                    <div className="warehouse-card-header">
                      <div className="warehouse-header-title">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 24, color: '#0052cc' }}
                        >
                          warehouse
                        </span>
                        <div>
                          <h4>Kho Hàng & Điểm Lấy Định Danh (Store Location)</h4>
                          <span className="muted" style={{ fontSize: 11 }}>
                            Cố định theo phân vùng bưu chính & Tuyến shipper
                          </span>
                        </div>
                      </div>
                      <span className="warehouse-badge-lock">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          lock
                        </span>
                        <span>Vị trí cố định (Đã khóa)</span>
                      </span>
                    </div>

                    <div className="warehouse-grid-info">
                      <div className="warehouse-info-item">
                        <span className="warehouse-info-label">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: '#0052cc' }}
                          >
                            storefront
                          </span>
                          <span>Tên Kho / Store ID</span>
                        </span>
                        <span className="warehouse-info-value">
                          {profile.shopName || session.user.username} (Mã: {session.user.id.slice(0, 8)})
                        </span>
                      </div>

                      <div className="warehouse-info-item">
                        <span className="warehouse-info-label">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: '#0052cc' }}
                          >
                            hub
                          </span>
                          <span>Bưu Cục Quản Lý (Origin Hub)</span>
                        </span>
                        <span className="warehouse-info-value">
                          {selectedAccountProvinceHub
                            ? `${selectedAccountProvinceHub.hubName} (${selectedAccountProvinceHub.hubCode})`
                            : 'Hub Bưu Chính Khu Vực'}
                        </span>
                      </div>
                    </div>

                    <div className="warehouse-info-item" style={{ marginBottom: 14 }}>
                      <span className="warehouse-info-label">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14, color: '#0052cc' }}
                        >
                          location_on
                        </span>
                        <span>Địa chỉ kho lấy hàng vật lý</span>
                      </span>
                      <span className="warehouse-info-value" style={{ fontSize: 13, color: '#1e293b' }}>
                        {profile.defaultPickupAddress ||
                          `${profile.defaultPickupAddressDetail || 'Địa chỉ kho'}, ${
                            profile.defaultPickupProvince || 'TP.HCM'
                          }`}
                      </span>
                    </div>

                    <div className="warehouse-gps-strip">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 20, color: '#0284c7' }}
                        >
                          my_location
                        </span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                            TỌA ĐỘ GPS AUTO-DISPATCH
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Phục vụ thuật toán phân vùng đa giác Tuyến bưu tá
                          </div>
                        </div>
                      </div>
                      <span className="warehouse-coords-code">
                        {profile.latitude && profile.longitude
                          ? `${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`
                          : selectedAccountProvinceHub?.latitude && selectedAccountProvinceHub?.longitude
                          ? `${selectedAccountProvinceHub.latitude.toFixed(
                              5,
                            )}, ${selectedAccountProvinceHub.longitude.toFixed(5)}`
                          : '10.86500, 106.68500'}
                      </span>
                    </div>

                    <div className="warehouse-notice-box">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: '#d97706', flexShrink: 0, marginTop: 1 }}
                      >
                        info
                      </span>
                      <span>
                        <strong>Quy chuẩn bưu chính:</strong> Mỗi tài khoản Store gắn liền với một
                        tọa độ kho cố định để đảm bảo bưu tá lấy hàng chính xác theo tuyến. Nếu Quý
                        khách có thêm kho tại địa chỉ khác, vui lòng liên hệ bưu cục để được cấp thêm{' '}
                        <strong>Mã Store ID chi nhánh mới</strong>.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="account-profile-actions">
                  <button className="btn btn-primary" type="submit" disabled={accountSaving}>
                    {accountSaving ? 'Đang lưu...' : 'Lưu thông tin tài khoản'}
                  </button>
                </div>
              </form>
            </div>
            {accountMessage ? <p className="message">{accountMessage}</p> : null}
          </section>
        </div>

        <div className="account-side-column">
          <section className="card account-security-card">
            <div className="account-card-header">
              <span className="material-symbols-outlined account-card-icon">lock_reset</span>
              <h3>Đổi mật khẩu</h3>
            </div>
            <form
              className="account-password-form"
              onSubmit={(e) => {
                void onChangeAccountPassword(e);
              }}
            >
              <div className="account-field">
                <label className="label">Mật khẩu hiện tại</label>
                <input
                  className="input"
                  type="password"
                  value={passwordOld}
                  onChange={(e) => onPasswordOldChange(e.target.value)}
                  placeholder="Mật khẩu hiện tại"
                />
              </div>
              <div className="account-field">
                <label className="label">Mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  value={passwordNew}
                  onChange={(e) => onPasswordNewChange(e.target.value)}
                  placeholder="Mật khẩu mới"
                />
                <span className="muted">Tối thiểu 8 ký tự, bao gồm chữ cái và số.</span>
              </div>
              <div className="account-field">
                <label className="label">Xác nhận mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => onPasswordConfirmChange(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
              <button
                className="btn btn-ghost account-password-btn"
                type="submit"
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
            {passwordMessage ? <p className="message">{passwordMessage}</p> : null}
          </section>

          <section className="card account-session-card">
            <div className="account-session-copy">
              <h4>Trạng thái tài khoản</h4>
              <div className="account-session-badge">Đã xác thực</div>
            </div>
            <div className="account-session-meta">
              <div>
                <span className="muted">Username</span>
                <strong>{session.user.username}</strong>
              </div>
              <div>
                <span className="muted">Roles</span>
                <strong>{session.user.roles.join(', ')}</strong>
              </div>
              <div>
                <span className="muted">Token hết hạn</span>
                <strong>{formatDate(session.accessTokenExpiresAt)}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="account-footer muted">
        Bảo mật thông tin merchant là ưu tiên hàng đầu của Nexus Logistic.
      </footer>
    </section>
  );
}
