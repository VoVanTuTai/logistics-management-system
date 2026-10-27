import React, { useState, useMemo } from 'react';
import type { HubLocationOption, ViewId } from '../../types';
import { NexusBrandLogo } from './NexusBrandLogo';

export interface NavGroupItem {
  id: ViewId;
  label: string;
  icon: string;
  badge?: string;
  badgeType?: 'hot' | 'cod' | 'count';
  keywords?: string;
}

export interface NavGroup {
  groupTitle: string;
  items: NavGroupItem[];
  icon?: string;
  colorTheme?: 'blue' | 'emerald' | 'amber' | 'purple';
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
  username?: string;
  businessName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const GROUP_THEMES: Record<string, { icon: string; colorTheme: 'blue' | 'emerald' | 'amber' | 'purple' }> = {
  'Tổng quan & Tra cứu': { icon: 'query_stats', colorTheme: 'blue' },
  'Vận hành đơn hàng': { icon: 'local_shipping', colorTheme: 'emerald' },
  'Xử lý sau giao & Sự cố': { icon: 'support_agent', colorTheme: 'amber' },
  'Tài chính & Cấu hình': { icon: 'account_balance_wallet', colorTheme: 'purple' },
};

export function MerchantSidebar({
  lockedSenderHub,
  activeView,
  navGroups,
  unreadNotifications,
  dataLoading,
  onSelectView,
  onRefreshData,
  onLogout,
  username,
  businessName,
  isCollapsed,
  onToggleCollapse,
}: MerchantSidebarProps): React.JSX.Element {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const collapsed = isCollapsed ?? internalCollapsed;
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Filter groups and items when searching
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return navGroups;

    return navGroups
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          const matchLabel = item.label.toLowerCase().includes(query);
          const matchId = item.id.toLowerCase().includes(query);
          const matchKeywords = item.keywords?.toLowerCase().includes(query) ?? false;
          return matchLabel || matchId || matchKeywords;
        });
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery]);

  const shopDisplayName = businessName || username || 'Shop Đối Tác NEXUS';
  const hubDisplayName = lockedSenderHub?.hubName || lockedSenderHub?.hubCode || 'HUB SÀI GÒN';

  return (
    <aside
      className={`sidebar sidebar--stitch ${collapsed ? 'sidebar--collapsed' : ''}`}
      aria-label="Merchant Navigation Sidebar"
    >
      {/* 1. Header Bar: Logo + Collapse/Expand Toggle */}
      <div className="sidebar-top-bar">
        {!collapsed ? (
          <div className="sidebar-brand-wrapper">
            <NexusBrandLogo size={32} portal="merchant" showLabel={true} />
          </div>
        ) : (
          <div className="sidebar-brand-wrapper--mini" title="NEXUS Merchant Portal">
            <NexusBrandLogo size={28} portal="merchant" showLabel={false} />
          </div>
        )}

        <button
          type="button"
          className="sidebar-collapse-toggle-btn"
          onClick={toggleCollapse}
          title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          aria-label={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {collapsed ? 'menu_open' : 'dock_to_right'}
          </span>
        </button>
      </div>

      {/* 2. Customer Scope Card (Shop Profile & Default Warehouse Hub) */}
      {!collapsed ? (
        <div className="merchant-scope-card">
          <div className="merchant-scope-badge-row">
            <span className="merchant-scope-pill">
              <span className="merchant-scope-pulse" aria-hidden="true" />
              <span>SHOP TRỰC TUYẾN</span>
            </span>
            <span className="merchant-tier-tag">VIP MERCHANT</span>
          </div>

          <div className="merchant-scope-shop-row" title={shopDisplayName}>
            <span className="material-symbols-outlined merchant-scope-shop-icon" aria-hidden="true">
              storefront
            </span>
            <strong className="merchant-scope-shop-name">{shopDisplayName}</strong>
          </div>

          <div className="merchant-scope-hub-row" title={`Kho lấy hàng mặc định: ${hubDisplayName}`}>
            <span className="material-symbols-outlined merchant-scope-hub-icon" aria-hidden="true">
              warehouse
            </span>
            <span className="merchant-scope-hub-name">{hubDisplayName}</span>
          </div>
        </div>
      ) : (
        <div className="merchant-scope-card--mini" title={`${shopDisplayName} (${hubDisplayName})`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0052cc' }}>
            storefront
          </span>
          <span className="merchant-scope-pulse" aria-hidden="true" />
        </div>
      )}

      {/* 3. Primary Customer Action Button: Tạo đơn hàng mới */}
      <div className="sidebar-cta-container">
        <button
          type="button"
          className={`sidebar-cta-btn ${activeView === 'create-shipment' ? 'sidebar-cta-btn--active' : ''}`}
          onClick={() => onSelectView('create-shipment')}
          title="Tạo đơn hàng mới (Gửi đơn bưu chính)"
        >
          <span className="material-symbols-outlined cta-icon" style={{ fontSize: '20px' }}>
            add_circle
          </span>
          {!collapsed && <span className="cta-label">Tạo đơn hàng mới</span>}
          {!collapsed && <span className="cta-shortcut">Mới</span>}
        </button>
      </div>

      {/* 4. Quick Feature Search (Ops-Web Synchronized) */}
      {!collapsed && (
        <div className="sidebar-search-wrapper">
          <span className="material-symbols-outlined sidebar-search-icon" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            className="sidebar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh tính năng..."
            aria-label="Tìm kiếm tính năng menu"
          />
          {searchQuery && (
            <button
              type="button"
              className="sidebar-search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                close
              </span>
            </button>
          )}
        </div>
      )}

      {/* 5. Grouped Clusters Navigation */}
      <nav className="nav-list nav-list--stitch" aria-label="Menu chức năng">
        {filteredGroups.length === 0 ? (
          <div className="sidebar-search-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#94a3b8' }}>
              search_off
            </span>
            <p>Không tìm thấy tính năng</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const themeConfig = GROUP_THEMES[group.groupTitle] || {
              icon: 'folder',
              colorTheme: 'blue' as const,
            };
            const themeClass = `nav-cluster--${group.colorTheme || themeConfig.colorTheme}`;

            return (
              <div key={group.groupTitle} className={`nav-cluster ${themeClass}`}>
                {/* Cluster Header */}
                {!collapsed && (
                  <div className="nav-cluster-header">
                    <span className="nav-cluster-icon" aria-hidden="true">
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        {group.icon || themeConfig.icon}
                      </span>
                    </span>
                    <span className="nav-cluster-title">{group.groupTitle}</span>
                    <span className="nav-cluster-count">{group.items.length}</span>
                  </div>
                )}

                {/* Cluster Items */}
                <div className="nav-cluster-items">
                  {group.items.map((item) => {
                    const isActive = activeView === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`nav-btn nav-btn--stitch ${isActive ? 'active' : ''}`}
                        onClick={() => onSelectView(item.id)}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="nav-btn__main">
                          <span className="material-symbols-outlined nav-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          {!collapsed && <span className="nav-label">{item.label}</span>}
                        </span>

                        {!collapsed && item.badge ? (
                          <span className={`nav-badge-pill nav-badge-pill--${item.badgeType || 'count'}`}>
                            {item.badge}
                          </span>
                        ) : null}

                        {item.id === 'notifications' && unreadNotifications > 0 ? (
                          <span className="nav-counter" title={`${unreadNotifications} thông báo chưa đọc`}>
                            {unreadNotifications}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* 6. Footer Actions & Utilities */}
      <div className="sidebar-actions sidebar-actions--stitch">
        <button
          type="button"
          className="btn btn-secondary sidebar-action"
          onClick={onRefreshData}
          disabled={dataLoading}
          title={collapsed ? 'Đồng bộ dữ liệu' : undefined}
        >
          <span
            className={`material-symbols-outlined ${dataLoading ? 'sidebar-spin' : ''}`}
            style={{ fontSize: '18px' }}
          >
            sync
          </span>
          {!collapsed && <span>{dataLoading ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}</span>}
        </button>

        <button
          type="button"
          className="btn btn-danger sidebar-action"
          onClick={onLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            logout
          </span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>

        {!collapsed && (
          <div className="sidebar-footer-hint">
            <span>NEXUS Express · Merchant Suite</span>
            <span className="support-phone">Hotline: 1900-NEXUS</span>
          </div>
        )}
      </div>
    </aside>
  );
}
