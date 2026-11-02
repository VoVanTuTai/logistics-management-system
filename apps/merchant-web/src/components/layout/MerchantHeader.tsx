import React from 'react';
import type { HubLocationOption, ViewId } from '../../types';
import { formatCurrency } from '../../api';

export interface NavItemConfig {
  id: ViewId;
  label: string;
  icon: string;
  subtitle: string;
}

export interface MerchantHeaderProps {
  activeView: ViewId;
  navItems: NavItemConfig[];
  netBalance: number;
  lockedSenderHub: HubLocationOption | null;
  unreadNotifications: number;
  username: string;
  shopName?: string;
  roles?: string[];
  onSelectView: (view: ViewId) => void;
}

export function MerchantHeader({
  activeView,
  navItems,
  netBalance,
  lockedSenderHub,
  unreadNotifications,
  username,
  shopName,
  roles,
  onSelectView,
}: MerchantHeaderProps): React.JSX.Element {
  const currentNav = navItems.find((i) => i.id === activeView);
  const displayName = shopName || username || 'Shop Đối Tác';
  const roleDisplay = roles && roles.length > 0 ? roles.join(', ') : 'MERCHANT';

  return (
    <header className="topbar topbar--stitch">
      <div className="topbar-left-group">
        <div className="topbar-shell-copy">
          <div className="topbar-breadcrumb">
            <span className="topbar-breadcrumb-portal">NEXUS Merchant</span>
            <span className="topbar-breadcrumb-slash">/</span>
            <span className="topbar-breadcrumb-sub">{currentNav?.subtitle || 'Cổng Khách hàng'}</span>
          </div>
          <h2 className="topbar-title">{currentNav?.label || 'Tổng quan'}</h2>
        </div>
      </div>

      <div className="topbar-compact-actions">
        {/* Quick Stat 1: COD Net Balance */}
        <button
          type="button"
          className="topbar-stat-card topbar-stat-card--balance"
          onClick={() => onSelectView('finance')}
          title="Xem chi tiết sổ cái và đối soát tài chính"
        >
          <span className="material-symbols-outlined stat-icon" aria-hidden="true">
            account_balance_wallet
          </span>
          <div className="stat-text-group">
            <span className="stat-label">Ví COD Thực Nhận</span>
            <strong className={`stat-val ${netBalance >= 0 ? 'stat-val--pos' : 'stat-val--neg'}`}>
              {formatCurrency(netBalance)}
            </strong>
          </div>
        </button>

        {/* Quick Stat 2: Sender Hub Scope */}
        <div
          className="topbar-stat-card topbar-stat-card--hub"
          title={`Bưu cục tiếp nhận: ${lockedSenderHub?.hubName || 'Bưu cục mặc định'} (${lockedSenderHub?.hubCode || 'HUB'})`}
        >
          <span className="material-symbols-outlined stat-icon" aria-hidden="true">
            warehouse
          </span>
          <div className="stat-text-group">
            <span className="stat-label">Bưu cục lấy hàng</span>
            <strong className="stat-val">
              {lockedSenderHub?.hubName || lockedSenderHub?.hubCode || 'Bưu cục Sài Gòn'}
            </strong>
          </div>
        </div>

        <div className="topbar-icon-group">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => onSelectView('notifications')}
            title="Thông báo"
          >
            <span className="material-symbols-outlined topbar-icon">notifications</span>
            {unreadNotifications > 0 ? (
              <span className="topbar-notif-indicator" />
            ) : null}
          </button>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => onSelectView('account')}
            title="Cài đặt tài khoản & Cấu hình shop"
          >
            <span className="material-symbols-outlined topbar-icon">settings</span>
          </button>

          {/* Unified Shop Account & Role Badge Lockup */}
          <div
            className="topbar-user-badge"
            onClick={() => onSelectView('account')}
            title={`Shop: ${displayName} · Vai trò: ${roleDisplay} · Nhấp để xem hồ sơ`}
            role="button"
            tabIndex={0}
          >
            <div className="topbar-avatar-container">
              <span className="topbar-avatar">{(displayName ?? 'M').slice(0, 1).toUpperCase()}</span>
              <span className="topbar-avatar-pulse" aria-hidden="true" />
            </div>
            <div className="topbar-user-meta">
              <div className="topbar-user-name-line">
                <strong className="topbar-username">{displayName}</strong>
                <span className="material-symbols-outlined verified-check" style={{ fontSize: '14px', color: '#0284c7' }}>
                  verified
                </span>
              </div>
              <div className="topbar-user-role-line">
                <span className="topbar-role-badge">VAI TRÒ: CHỦ SHOP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
