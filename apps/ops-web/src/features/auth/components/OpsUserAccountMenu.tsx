import React, { useState, useEffect, useRef } from 'react';
import type { AuthSessionDto } from '../auth.types';
import type { HubDto } from '../../masterdata/masterdata.types';

export interface OpsUserAccountMenuProps {
  session: AuthSessionDto | null;
  operatorName: string;
  operatorInitial: string;
  roleText: string;
  opsTierMeta: {
    badgeLabel: string;
    badgeColor: string;
    icon: string;
    description: string;
  };
  currentOperatorHub: HubDto | null;
  currentOperatorHubAddress: string;
  onLogout: () => Promise<void> | void;
  isLoggingOut: boolean;
  variant?: 'topbar' | 'func';
  isNotificationsOpen?: boolean;
  onToggleNotifications?: () => void;
}

export function OpsUserAccountMenu({
  session,
  operatorName,
  operatorInitial,
  roleText,
  opsTierMeta,
  currentOperatorHub,
  currentOperatorHubAddress,
  onLogout,
  isLoggingOut,
  variant = 'func',
  isNotificationsOpen,
  onToggleNotifications,
}: OpsUserAccountMenuProps): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [localNotificationsOpen, setLocalNotificationsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const showNotificationsModal =
    isNotificationsOpen !== undefined ? isNotificationsOpen : localNotificationsOpen;
  const setShowNotificationsModal = (open: boolean) => {
    if (onToggleNotifications) {
      if (open !== isNotificationsOpen) {
        onToggleNotifications();
      }
    } else {
      setLocalNotificationsOpen(open);
    }
  };

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsAccountModalOpen(false);
        setShowNotificationsModal(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleCopyUsername = () => {
    if (session?.user.username) {
      navigator.clipboard.writeText(session.user.username);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const isTopbar = variant === 'topbar';

  return (
    <div className="ops-user-menu-wrapper" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={
          isTopbar
            ? 'ops-topbar-profile ops-topbar-profile--button'
            : 'ops-func-user ops-func-user--button'
        }
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        aria-label="Tài khoản người dùng"
        title="Bấm để xem thông tin tài khoản, thông báo hoặc đăng xuất"
      >
        <span className={isTopbar ? 'ops-topbar-avatar' : 'ops-func-user-avatar'}>
          {operatorInitial}
        </span>
        <span className={isTopbar ? 'ops-topbar-user' : 'ops-func-user-name'}>
          {operatorName}
        </span>
        {isTopbar && <span className="ops-topbar-role">{roleText}</span>}
        <span
          className="material-symbols-outlined ops-user-menu-chevron"
          style={{
            fontSize: '18px',
            color: '#64748b',
            transition: 'transform 0.2s ease',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>

      {/* Floating Dropdown Menu */}
      {isDropdownOpen && (
        <div className="ops-user-menu-dropdown" role="menu">
          {/* User Brief Card */}
          <div className="ops-user-menu-card">
            <div className="ops-user-menu-card-avatar">{operatorInitial}</div>
            <div className="ops-user-menu-card-info">
              <div className="ops-user-menu-card-name">
                {session?.user.displayName || operatorName}
              </div>
              <div className="ops-user-menu-card-sub">
                Mã NV: <strong>{session?.user.username || operatorName}</strong>
              </div>
              <div className="ops-user-menu-badges">
                <span className="ops-user-role-badge" title={roleText}>
                  {roleText}
                </span>
                <span
                  className="ops-user-tier-badge"
                  style={{
                    backgroundColor: `${opsTierMeta.badgeColor}18`,
                    color: opsTierMeta.badgeColor,
                    borderColor: `${opsTierMeta.badgeColor}40`,
                  }}
                >
                  {opsTierMeta.badgeLabel}
                </span>
              </div>
            </div>
          </div>

          {currentOperatorHub && (
            <div className="ops-user-menu-hub-info">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#0284c7' }}>
                apartment
              </span>
              <span className="ops-user-menu-hub-text">
                <strong>{currentOperatorHub.code}</strong> - {currentOperatorHub.name}
              </span>
            </div>
          )}

          <div className="ops-user-menu-divider" />

          {/* Action: Account info */}
          <button
            type="button"
            className="ops-user-menu-item"
            role="menuitem"
            onClick={() => {
              setIsDropdownOpen(false);
              setIsAccountModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined ops-user-menu-item-icon">
              account_circle
            </span>
            <div className="ops-user-menu-item-content">
              <span className="ops-user-menu-item-title">Thông tin tài khoản</span>
              <span className="ops-user-menu-item-desc">Xem mã nhân viên, bưu cục & phân quyền</span>
            </div>
            <span className="material-symbols-outlined ops-user-menu-item-arrow">
              chevron_right
            </span>
          </button>

          {/* Action: Notifications */}
          <button
            type="button"
            className="ops-user-menu-item"
            role="menuitem"
            onClick={() => {
              setIsDropdownOpen(false);
              setShowNotificationsModal(true);
            }}
          >
            <span className="material-symbols-outlined ops-user-menu-item-icon" style={{ color: '#f59e0b' }}>
              notifications
            </span>
            <div className="ops-user-menu-item-content">
              <span className="ops-user-menu-item-title">Thông báo hệ thống</span>
              <span className="ops-user-menu-item-desc">Cảnh báo ca trực & trạng thái vận hành</span>
            </div>
            <span className="ops-user-notif-pill">Mới</span>
          </button>

          <div className="ops-user-menu-divider" />

          {/* Action: Logout */}
          <button
            type="button"
            className="ops-user-menu-item ops-user-menu-item--danger"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={() => {
              setIsDropdownOpen(false);
              void onLogout();
            }}
          >
            <span className="material-symbols-outlined ops-user-menu-item-icon">
              logout
            </span>
            <div className="ops-user-menu-item-content">
              <span className="ops-user-menu-item-title">
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </span>
              <span className="ops-user-menu-item-desc">Thoát phiên làm việc trên Ops Web</span>
            </div>
          </button>
        </div>
      )}

      {/* Account Info Modal */}
      {isAccountModalOpen && (
        <div className="ops-modal-backdrop" onClick={() => setIsAccountModalOpen(false)}>
          <div
            className="ops-modal-card ops-modal-card--md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ops-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="ops-modal-header-icon-circle">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div>
                  <h3 className="ops-modal-title">Thông tin tài khoản nhân viên</h3>
                  <p className="ops-modal-subtitle">Chi tiết hồ sơ nhân sự & phân quyền vận hành</p>
                </div>
              </div>
              <button
                type="button"
                className="ops-modal-close-btn"
                onClick={() => setIsAccountModalOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="ops-modal-body">
              <div className="ops-profile-hero">
                <div className="ops-profile-hero-avatar">{operatorInitial}</div>
                <div className="ops-profile-hero-details">
                  <div className="ops-profile-hero-name">
                    {session?.user.displayName || operatorName}
                  </div>
                  <div className="ops-profile-hero-code-row">
                    <span className="ops-profile-code-badge">
                      Mã tài khoản: <strong>{session?.user.username || operatorName}</strong>
                    </span>
                    <button
                      type="button"
                      className="ops-btn-copy"
                      onClick={handleCopyUsername}
                      title="Sao chép mã tài khoản"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        content_copy
                      </span>
                      {copiedText ? 'Đã chép!' : 'Chép mã'}
                    </button>
                  </div>
                </div>
                <div className="ops-profile-status-tag">
                  <span className="ops-status-dot-active" />
                  <span>Hoạt động</span>
                </div>
              </div>

              <div className="ops-profile-grid">
                <div className="ops-profile-field">
                  <label className="ops-profile-label">Mã định danh User ID</label>
                  <div className="ops-profile-value ops-profile-value--mono">
                    {session?.user.id || 'N/A'}
                  </div>
                </div>

                <div className="ops-profile-field">
                  <label className="ops-profile-label">Cấp độ vận hành (Tier)</label>
                  <div className="ops-profile-value">
                    <span
                      className="ops-user-tier-badge"
                      style={{
                        backgroundColor: `${opsTierMeta.badgeColor}18`,
                        color: opsTierMeta.badgeColor,
                        borderColor: `${opsTierMeta.badgeColor}40`,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {opsTierMeta.icon}
                      </span>
                      {opsTierMeta.badgeLabel}
                    </span>
                  </div>
                </div>

                <div className="ops-profile-field ops-profile-field--full">
                  <label className="ops-profile-label">Vai trò & Phân quyền</label>
                  <div className="ops-profile-tags-row">
                    {(session?.user.roles ?? []).length > 0 ? (
                      session?.user.roles.map((r) => (
                        <span key={r} className="ops-role-pill">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="ops-role-pill">{roleText}</span>
                    )}
                  </div>
                </div>

                <div className="ops-profile-field ops-profile-field--full">
                  <label className="ops-profile-label">Bưu cục / Hub trực thuộc</label>
                  <div className="ops-profile-hub-box">
                    <div className="ops-profile-hub-title">
                      🏢 <strong>{currentOperatorHub?.code || 'N/A'}</strong> - {currentOperatorHub?.name || 'Tất cả bưu cục hệ thống'}
                    </div>
                    {currentOperatorHubAddress && (
                      <div className="ops-profile-hub-address">
                        📍 {currentOperatorHubAddress}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ops-profile-field">
                  <label className="ops-profile-label">Loại phiên xác thực</label>
                  <div className="ops-profile-value">
                    {session?.tokens.tokenType || 'Bearer'} Token
                  </div>
                </div>

                <div className="ops-profile-field">
                  <label className="ops-profile-label">Thời hạn phiên làm việc</label>
                  <div className="ops-profile-value">
                    {session?.tokens.accessTokenExpiresAt
                      ? new Date(session.tokens.accessTokenExpiresAt).toLocaleString('vi-VN')
                      : 'Đang hoạt động'}
                  </div>
                </div>
              </div>
            </div>

            <div className="ops-modal-footer">
              <button
                type="button"
                className="ops-btn ops-btn-secondary"
                onClick={() => setIsAccountModalOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ops-btn ops-btn-danger"
                disabled={isLoggingOut}
                onClick={() => {
                  setIsAccountModalOpen(false);
                  void onLogout();
                }}
              >
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div
          className="ops-modal-backdrop"
          onClick={() => setShowNotificationsModal(false)}
        >
          <div
            className="ops-modal-card ops-modal-card--md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ops-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="ops-modal-header-icon-circle" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                  <h3 className="ops-modal-title">Thông báo hệ thống & Vận hành</h3>
                  <p className="ops-modal-subtitle">Cập nhật đơn hàng, quét hub & ca trực vận hành</p>
                </div>
              </div>
              <button
                type="button"
                className="ops-modal-close-btn"
                onClick={() => setShowNotificationsModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="ops-modal-body">
              <div className="ops-notif-list">
                <div className="ops-notif-item ops-notif-item--unread">
                  <div className="ops-notif-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div className="ops-notif-content">
                    <div className="ops-notif-header">
                      <span className="ops-notif-title">Điều phối bưu tá & Tuyến phát</span>
                      <span className="ops-notif-time">Vừa xong</span>
                    </div>
                    <div className="ops-notif-desc">
                      Tất cả các tuyến phát và xe trung chuyển tại bưu cục {currentOperatorHub?.name || 'hiện tại'} đã sẵn sàng nhận lệnh điều phối.
                    </div>
                  </div>
                </div>

                <div className="ops-notif-item">
                  <div className="ops-notif-icon-box" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                  </div>
                  <div className="ops-notif-content">
                    <div className="ops-notif-header">
                      <span className="ops-notif-title">Quét nhập xuất hub liên tỉnh</span>
                      <span className="ops-notif-time">10 phút trước</span>
                    </div>
                    <div className="ops-notif-desc">
                      Hệ thống ghi nhận trạng thái quét túi/seal xe liên hub đồng bộ trực tiếp theo thời gian thực.
                    </div>
                  </div>
                </div>

                <div className="ops-notif-item">
                  <div className="ops-notif-icon-box" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <div className="ops-notif-content">
                    <div className="ops-notif-header">
                      <span className="ops-notif-title">Bảo mật phiên đăng nhập</span>
                      <span className="ops-notif-time">Hôm nay</span>
                    </div>
                    <div className="ops-notif-desc">
                      Tài khoản <strong>{session?.user.username}</strong> đã xác thực an toàn trên hệ thống NEXUS VN.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ops-modal-footer">
              <button
                type="button"
                className="ops-btn ops-btn-primary"
                onClick={() => setShowNotificationsModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
