import React from 'react';

import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type PolicyDto,
} from '../../features/policies/policies.types';
import { formatDateTime } from '../../utils/format';

interface PolicyDetailModalProps {
  policy: PolicyDto | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (policy: PolicyDto) => void;
}

export function PolicyDetailModal({
  policy,
  isOpen,
  onClose,
  onEdit,
}: PolicyDetailModalProps): React.JSX.Element | null {
  if (!isOpen || !policy) return null;

  const catMeta = CATEGORY_LABELS[policy.category] || {
    label: policy.category,
    badgeClass: 'badge-secondary',
  };
  const statusMeta = STATUS_LABELS[policy.status] || {
    label: policy.status,
    badgeClass: 'badge-secondary',
    color: '#64748b',
  };

  return (
    <div
      className="ops-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="ops-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 850,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--stitch-primary, #003d9b)', fontSize: 24 }}
            >
              description
            </span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Chi tiết Điều khoản dịch vụ
            </h3>
          </div>
          <button
            type="button"
            className="ops-modal-close-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Main Info Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                DANH MỤC
              </span>
              <span className={`badge ${catMeta.badgeClass}`} style={{ marginTop: 4, display: 'inline-block' }}>
                {catMeta.label}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                TRẠNG THÁI
              </span>
              <span className={`badge ${statusMeta.badgeClass}`} style={{ marginTop: 4, display: 'inline-block' }}>
                {statusMeta.label}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                PHIÊN BẢN & THỨ TỰ
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                v{policy.version} (STT: {policy.displayOrder})
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                SLUG URL
              </span>
              <code style={{ fontSize: 13, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
                /{policy.slug}
              </code>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                NGƯỜI CẬP NHẬT
              </span>
              <span style={{ fontSize: 13, color: '#334155' }}>
                {policy.updatedBy || policy.createdBy || 'SYSTEM_ADMIN'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>
                NGÀY CÔNG BỐ
              </span>
              <span style={{ fontSize: 13, color: '#334155' }}>
                {policy.publishedAt ? formatDateTime(policy.publishedAt) : 'Chưa công bố'}
              </span>
            </div>
          </div>

          {/* Title & Summary */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              {policy.title}
            </h2>
            {policy.summary && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: '#475569',
                  fontStyle: 'italic',
                  background: '#f1f5f9',
                  padding: '10px 14px',
                  borderRadius: 8,
                }}
              >
                {policy.summary}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Nội dung văn bản
            </span>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 18,
                background: '#ffffff',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {policy.content}
            </div>
          </div>

          {/* Version History Table */}
          {policy.versions && policy.versions.length > 0 && (
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Lịch sử các phiên bản ({policy.versions.length})
              </span>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Phiên bản</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú thay đổi</th>
                      <th>Người tạo</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policy.versions.map((ver) => (
                      <tr key={ver.id}>
                        <td style={{ fontWeight: 700 }}>v{ver.version}</td>
                        <td>
                          <span className={`badge ${STATUS_LABELS[ver.status]?.badgeClass || 'badge-secondary'}`}>
                            {ver.status}
                          </span>
                        </td>
                        <td>{ver.changeNote || '—'}</td>
                        <td>{ver.createdBy || 'Admin'}</td>
                        <td>{formatDateTime(ver.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onEdit(policy);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              edit
            </span>
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
