import React from 'react';
import type { NotificationItem } from '../../types';
import { formatDate } from '../../api';

export interface MerchantNotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkItemRead: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export function MerchantNotificationsView({
  notifications,
  onMarkAllRead,
  onMarkItemRead,
  onDeleteItem,
  onClearAll,
}: MerchantNotificationsViewProps): React.JSX.Element {
  return (
    <section className="notifications-layout">
      <div className="notifications-toolbar">
        <div className="notifications-tabs">
          <button className="notifications-tab notifications-tab--active" type="button">
            Tất cả
          </button>
          <button className="notifications-tab" type="button">
            Đơn hàng
          </button>
          <button className="notifications-tab" type="button">
            Hệ thống
          </button>
          <button className="notifications-tab" type="button">
            Khuyến mãi
          </button>
        </div>
        <button className="notifications-mark-all" onClick={onMarkAllRead}>
          <span className="material-symbols-outlined notifications-inline-icon">done_all</span>
          <span>Đánh dấu tất cả là đã đọc</span>
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty notifications-empty">Chưa có thông báo.</div>
        ) : (
          notifications.map((n) => {
            const accentClass = !n.read ? 'notifications-card--unread' : 'notifications-card--read';
            let levelClass = 'info';
            let typeLabel = 'Hỗ trợ';
            let iconSymbol = 'notifications';
            if (n.level === 'success') {
              levelClass = 'success';
              typeLabel = 'Đơn hàng';
              iconSymbol = 'check_circle';
            } else if (n.level === 'error') {
              levelClass = 'error';
              typeLabel = 'Hệ thống';
              iconSymbol = 'warning';
            } else if (n.level === 'info') {
              levelClass = 'info';
              typeLabel = 'Hỗ trợ';
              iconSymbol = 'notifications';
            }
            return (
              <article className={`notifications-card ${accentClass}`} key={n.id}>
                {!n.read ? <div className="notifications-card-accent" /> : null}
                <div className={`notifications-card-icon notifications-card-icon--${levelClass}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {iconSymbol}
                  </span>
                </div>
                <div className="notifications-card-body">
                  <div className="notifications-card-head">
                    <h3>{n.title}</h3>
                    <span className="notifications-card-time">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="notifications-card-description">{n.description}</p>
                  <div className="notifications-card-meta">
                    <span className={`notifications-chip notifications-chip--${levelClass}`}>
                      {typeLabel}
                    </span>
                    {!n.read ? <span className="notifications-unread-dot" /> : null}
                  </div>
                  <div className="notifications-card-actions">
                    <button className="btn btn-ghost" onClick={() => onMarkItemRead(n.id)}>
                      Đánh dấu đã đọc
                    </button>
                    <button className="btn btn-danger" onClick={() => onDeleteItem(n.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="notifications-footer-bar">
        <span className="muted">
          Hiển thị {Math.min(notifications.length, 5)} trên tổng số {notifications.length} thông báo
        </span>
        <button className="btn btn-danger notifications-clear-btn" onClick={onClearAll}>
          Xóa toàn bộ
        </button>
      </div>
    </section>
  );
}
