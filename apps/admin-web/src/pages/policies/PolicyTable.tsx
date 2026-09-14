import React from 'react';

import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type PolicyDto,
} from '../../features/policies/policies.types';
import { formatDateTime } from '../../utils/format';
import type { PolicyActionType } from './PolicyConfirmDialog';

interface PolicyTableProps {
  policies: PolicyDto[];
  isLoading: boolean;
  onView: (policy: PolicyDto) => void;
  onEdit: (policy: PolicyDto) => void;
  onActionClick: (policy: PolicyDto, action: PolicyActionType) => void;
}

export function PolicyTable({
  policies,
  isLoading,
  onView,
  onEdit,
  onActionClick,
}: PolicyTableProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
            progress_activity
          </span>
          <span>Đang tải danh sách điều khoản & chính sách...</span>
        </div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          border: '1px dashed #cbd5e1',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8', marginBottom: 12 }}>
          policy
        </span>
        <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#334155' }}>
          Chưa có điều khoản hoặc chính sách nào
        </h4>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Tạo mới điều khoản hoặc thay đổi bộ lọc tìm kiếm để xem kết quả.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: 50, textAlign: 'center' }}>STT</th>
            <th style={{ minWidth: 260 }}>Tiêu đề văn bản</th>
            <th style={{ minWidth: 160 }}>Danh mục</th>
            <th style={{ width: 90, textAlign: 'center' }}>Phiên bản</th>
            <th style={{ minWidth: 150 }}>Trạng thái</th>
            <th style={{ width: 80, textAlign: 'center' }}>Thứ tự</th>
            <th style={{ minWidth: 160 }}>Cập nhật lần cuối</th>
            <th style={{ width: 170, textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy, idx) => {
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
              <tr key={policy.id} style={{ transition: 'background-color 0.15s ease' }}>
                <td style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  {idx + 1}
                </td>

                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                      onClick={() => onView(policy)}
                      title="Xem chi tiết"
                    >
                      {policy.title}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <code style={{ fontSize: 11, color: '#0284c7', backgroundColor: '#f0f9ff', padding: '1px 4px', borderRadius: 4 }}>
                        /{policy.slug}
                      </code>
                    </span>
                  </div>
                </td>

                <td>
                  <span className={`badge ${catMeta.badgeClass}`} style={{ fontSize: 11, fontWeight: 600 }}>
                    {catMeta.label}
                  </span>
                </td>

                <td style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                    }}
                  >
                    v{policy.version}
                  </span>
                </td>

                <td>
                  <span
                    className={`badge ${statusMeta.badgeClass}`}
                    style={{ fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: statusMeta.color,
                      }}
                    />
                    {statusMeta.label}
                  </span>
                </td>

                <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                  {policy.displayOrder}
                </td>

                <td>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    <div>{formatDateTime(policy.updatedAt)}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>
                      {policy.updatedBy || policy.createdBy || 'SYSTEM_ADMIN'}
                    </div>
                  </div>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() => onView(policy)}
                      title="Xem chi tiết"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#2563eb',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                        visibility
                      </span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => onEdit(policy)}
                      title={policy.status === 'PUBLISHED' ? 'Sửa & Nâng phiên bản' : 'Chỉnh sửa'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#0284c7',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                        edit
                      </span>
                    </button>

                    {/* Status specific actions */}
                    {policy.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'publish')}
                          title="Công bố ngay"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#16a34a',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            publish
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'delete')}
                          title="Xóa điều khoản"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            delete
                          </span>
                        </button>
                      </>
                    )}

                    {policy.status === 'PUBLISHED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'archive')}
                          title="Lưu trữ (Archive)"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#d97706',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            archive
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'delete')}
                          title="Xóa điều khoản"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            delete
                          </span>
                        </button>
                      </>
                    )}

                    {policy.status === 'ARCHIVED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'restore')}
                          title="Khôi phục về DRAFT"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#059669',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            unarchive
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onActionClick(policy, 'delete')}
                          title="Xóa vĩnh viễn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffffff' }}>
                            delete
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
