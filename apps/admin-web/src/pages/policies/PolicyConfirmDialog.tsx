import React from 'react';

import type { PolicyDto } from '../../features/policies/policies.types';

export type PolicyActionType = 'publish' | 'archive' | 'restore' | 'delete';

interface PolicyConfirmDialogProps {
  policy: PolicyDto | null;
  actionType: PolicyActionType | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PolicyConfirmDialog({
  policy,
  actionType,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: PolicyConfirmDialogProps): React.JSX.Element | null {
  if (!isOpen || !policy || !actionType) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'publish':
        return {
          title: 'Xác nhận Công bố Điều khoản',
          icon: 'publish',
          iconBg: '#dcfce7',
          iconColor: '#16a34a',
          message: (
            <span>
              Bạn có chắc chắn muốn công bố điều khoản <strong>"{policy.title}"</strong> (v{policy.version}) lên hệ thống? Khách hàng sẽ ngay lập tức thấy văn bản này trên trang Điều khoản dịch vụ.
            </span>
          ),
          confirmText: 'Công bố ngay',
          confirmBtnClass: 'btn-primary',
        };
      case 'archive':
        return {
          title: 'Xác nhận Lưu trữ Điều khoản',
          icon: 'archive',
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          message: (
            <span>
              Bạn có chắc chắn muốn chuyển điều khoản <strong>"{policy.title}"</strong> sang trạng thái <strong>ARCHIVED (Lưu trữ)</strong>? Văn bản này sẽ bị ẩn khỏi trang của khách hàng.
            </span>
          ),
          confirmText: 'Lưu trữ điều khoản',
          confirmBtnClass: 'btn-secondary',
        };
      case 'restore':
        return {
          title: 'Khôi phục Điều khoản',
          icon: 'unarchive',
          iconBg: '#e0f2fe',
          iconColor: '#0284c7',
          message: (
            <span>
              Khôi phục điều khoản <strong>"{policy.title}"</strong> về trạng thái <strong>Bản nháp (DRAFT)</strong> để tiếp tục chỉnh sửa?
            </span>
          ),
          confirmText: 'Khôi phục DRAFT',
          confirmBtnClass: 'btn-primary',
        };
      case 'delete':
        return {
          title: 'Xác nhận Xóa vĩnh viễn Điều khoản',
          icon: 'delete_forever',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          message: (
            <span>
              Hành động này sẽ <strong>xóa vĩnh viễn</strong> điều khoản <strong>"{policy.title}"</strong> cùng toàn bộ lịch sử các phiên bản cũ. Bạn có chắc chắn muốn tiếp tục?
            </span>
          ),
          confirmText: 'Xóa vĩnh viễn',
          confirmBtnClass: 'btn-danger',
        };
    }
  };

  const config = getActionConfig();

  return (
    <div
      className="ops-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="ops-modal-card ops-modal-card--sm"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 480,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: config.iconBg,
            color: config.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
            {config.icon}
          </span>
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          {config.title}
        </h3>

        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
          {config.message}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ minWidth: 100 }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className={`btn ${config.confirmBtnClass}`}
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{ minWidth: 140 }}
            autoFocus
          >
            {isSubmitting ? 'Đang xử lý...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
