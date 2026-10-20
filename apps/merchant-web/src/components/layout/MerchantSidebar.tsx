import React from 'react';
import type { HubLocationOption, ViewId } from '../../types';

export interface NavGroupItem {
  id: ViewId;
  label: string;
  icon: string;
  badge?: string;
  badgeType?: 'hot' | 'cod' | 'count';
}

export interface NavGroup {
  groupTitle: string;
  items: NavGroupItem[];
}

export interface MerchantSidebarProps {
  lockedSenderHub: HubLocationOption | null;
  activeView: ViewId;
  navGroups: NavGroup[];
  unreadNotifications: number;
  dataLoading: boolean;
  onSelectView: (view: ViewId) => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export function MerchantSidebar({
  lockedSenderHub,
  activeView,
  navGroups,
  unreadNotifications,
  dataLoading,
  onSelectView,
  onRefreshData,
  onLogout,
}: MerchantSidebarProps): React.JSX.Element {
  return (
    <aside className="sidebar sidebar--stitch">
      <div className="brand-lockup brand-lockup--stitch" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#0052cc' }}>hub</span>
          <h2 className="brand-title">NEXUS Logistic</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          <span className="sidebar-badge-verified">
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
            <span>Merchant Partner</span>
          </span>
          <span className="sidebar-badge-hub">{lockedSenderHub?.hubCode || 'HUB SÀI GÒN'}</span>
        </div>
      </div>

      {/* Primary Action: Tạo đơn hàng mới */}
      <div style={{ padding: '0 0 8px' }}>
        <button
          type="button"
          className="sidebar-cta-btn"
          onClick={() => onSelectView('create-shipment')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
          <span>Tạo đơn hàng mới</span>
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav className="nav-list nav-list--stitch" style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="nav-group-section">
            <div className="nav-group-header">
              <span>{group.groupTitle}</span>
            </div>
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-btn nav-btn--stitch ${activeView === item.id ? 'active' : ''}`}
                onClick={() => onSelectView(item.id)}
              >
                <span className="nav-btn__main">
                  <span className="material-symbols-outlined nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {item.badge ? (
                  <span className={`nav-badge-pill nav-badge-pill--${item.badgeType || 'count'}`}>
                    {item.badge}
                  </span>
                ) : null}
                {item.id === 'notifications' && unreadNotifications > 0 ? (
                  <span className="nav-counter">{unreadNotifications}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-actions sidebar-actions--stitch">
        <button
          className="btn btn-secondary sidebar-action"
          onClick={onRefreshData}
          disabled={dataLoading}
          title="Đồng bộ dữ liệu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
          <span>{dataLoading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
        <button className="btn btn-danger sidebar-action" onClick={onLogout}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
