import React, { useEffect, useState } from 'react';

import {
  CATEGORY_LABELS,
  type PolicyCategory,
  type PolicyDto,
  type PolicyStatus,
  type PolicyWriteInput,
} from '../../features/policies/policies.types';

interface PolicyFormModalProps {
  policy: PolicyDto | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: PolicyWriteInput) => void;
}

export function PolicyFormModal({
  policy,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: PolicyFormModalProps): React.JSX.Element | null {
  const isEdit = Boolean(policy);
  const isPublished = policy?.status === 'PUBLISHED';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('GENERAL');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PolicyStatus>('DRAFT');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [createNewVersion, setCreateNewVersion] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setTitle(policy.title);
      setSlug(policy.slug);
      setCategory(policy.category);
      setSummary(policy.summary || '');
      setContent(policy.content);
      setStatus(policy.status);
      setDisplayOrder(policy.displayOrder);
      setEffectiveDate(
        policy.effectiveDate ? policy.effectiveDate.substring(0, 10) : '',
      );
      setChangeNote('');
      setCreateNewVersion(policy.status === 'PUBLISHED');
      setAutoSlug(false);
      setError(null);
    } else {
      setTitle('');
      setSlug('');
      setCategory('GENERAL');
      setSummary('');
      setContent('');
      setStatus('DRAFT');
      setDisplayOrder(0);
      setEffectiveDate(new Date().toISOString().substring(0, 10));
      setChangeNote('');
      setCreateNewVersion(false);
      setAutoSlug(true);
      setError(null);
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(generateSlug(val));
    }
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề điều khoản.');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung chi tiết điều khoản.');
      return;
    }

    setError(null);
    onSubmit({
      title: title.trim(),
      slug: slug.trim() || generateSlug(title),
      category,
      summary: summary.trim() || null,
      content: content.trim(),
      status,
      displayOrder: Number(displayOrder) || 0,
      effectiveDate: effectiveDate || null,
      changeNote: changeNote.trim() || null,
      createNewVersion,
    });
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
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
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
              {isEdit ? 'edit_document' : 'post_add'}
            </span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {isEdit ? `Chỉnh sửa Điều khoản (v${policy?.version})` : 'Tạo mới Điều khoản & Chính sách'}
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

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            gap: 16,
          }}
        >
          {error && (
            <div className="message error" style={{ margin: 0 }}>
              {error}
            </div>
          )}

          {isPublished && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                info
              </span>
              <span>
                Điều khoản này đang ở trạng thái <strong>PUBLISHED</strong>. Chỉnh sửa sẽ tự động lưu lại snapshot lịch sử và nâng cấp lên phiên bản mới (v{policy!.version + 1}).
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            {/* Title */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Tiêu đề điều khoản <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: 1. Quy định chung & Phạm vi áp dụng"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Danh mục / Nhóm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value as PolicyCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
            {/* Slug */}
            <div>
              <label className="label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Đường dẫn (Slug URL) <span style={{ color: '#ef4444' }}>*</span></span>
                <label style={{ fontSize: 11, color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                    style={{ marginRight: 4 }}
                  />
                  Tự động theo tiêu đề
                </label>
              </label>
              <input
                type="text"
                className="input"
                placeholder="quy-dinh-chung"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                required
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                className="input"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>

            {/* Status */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Trạng thái
              </label>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as PolicyStatus)}
              >
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="PUBLISHED">Công bố (PUBLISHED)</option>
                <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Tóm tắt ngắn gọn (Hiển thị đầu mục / Hỗ trợ RAG)
            </label>
            <input
              type="text"
              className="input"
              placeholder="Tóm tắt ngắn gọn nội dung và mục tiêu của điều khoản này..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Content Editor / Preview Tabs */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <label className="label">
                Nội dung chi tiết (Hỗ trợ định dạng Markdown, Tiêu đề ###, Bảng biểu) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className={`btn ${activeTab === 'edit' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('edit')}
                  style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6 }}
                >
                  Soạn thảo
                </button>
                <button
                  type="button"
                  className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('preview')}
                  style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6 }}
                >
                  Xem trước
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                className="textarea"
                rows={12}
                placeholder={`### 1.1. Tiêu đề mục con\nNội dung chi tiết quy định...\n\n- Điểm a: ...\n- Điểm b: ...\n\n### 1.2. Mục tiếp theo...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.5,
                  minHeight: 220,
                  width: '100%',
                }}
                required
              />
            ) : (
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 220,
                  maxHeight: 350,
                  overflowY: 'auto',
                  backgroundColor: '#f8fafc',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {content ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có nội dung để xem trước...</p>
                )}
              </div>
            )}
          </div>

          {/* Change Note for versioning */}
          {isEdit && (
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Ghi chú thay đổi (Change note phiên bản)
              </label>
              <input
                type="text"
                className="input"
                placeholder="VD: Cập nhật mức bồi thường theo biểu phí mới tháng 9/2026..."
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
              />
            </div>
          )}

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid #e2e8f0',
              marginTop: 'auto',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: 140 }}
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <span>{isEdit ? 'Lưu cập nhật' : 'Tạo điều khoản'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
