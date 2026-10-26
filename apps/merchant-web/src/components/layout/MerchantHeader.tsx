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
  onSelectView: (view: ViewId) => void;
}

export function MerchantHeader({
  activeView,
  navItems,
  netBalance,
  lockedSenderHub,
  unreadNotifications,
  username,
  onSelectView,
}: MerchantHeaderProps): React.JSX.Element {
  const currentNav = navItems.find((i) => i.id === activeView);

  return (
    <header className="topbar topbar--stitch">
      <div className="topbar-shell-copy">
        <strong className="topbar-title">{currentNav?.label}</strong>
        <div className="topbar-breadcrumb muted">{currentNav?.subtitle}</div>
      </div>
      <div className="topbar-compact-actions">
        {/* Quick Stat: COD Net Balance */}
        <button
          type="button"
          className="topbar-quick-stat topbar-quick-stat--balance"
          onClick={() => onSelectView('finance')}
          title="Xem chi tiết sổ cái và đối soát tài chính"
        >
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span>
            Số dư:{' '}
            <strong style={{ color: netBalance >= 0 ? '#127a56' : '#ba1a1a' }}>
              {formatCurrency(netBalance)}
            </strong>
          </span>
        </button>

        {/* Quick Stat: Sender Hub */}
        <div className="topbar-quick-stat topbar-quick-stat--hub" title="Bưu cục phụ trách tiếp nhận">
          <span className="material-symbols-outlined">storefront</span>
          <span>{lockedSenderHub?.hubName || lockedSenderHub?.hubCode || 'Bưu cục Sài Gòn'}</span>
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
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#dc2626',
                }}
              />
            ) : null}
          </button>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => onSelectView('account')}
            title="Cài đặt tài khoản"
          >
            <span className="material-symbols-outlined topbar-icon">settings</span>
          </button>
          <div
            className="topbar-user-badge"
            onClick={() => onSelectView('account')}
            title="Hồ sơ tài khoản"
          >
            <span className="topbar-avatar">{(username ?? 'M').slice(0, 1).toUpperCase()}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#102548' }}>{username}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
