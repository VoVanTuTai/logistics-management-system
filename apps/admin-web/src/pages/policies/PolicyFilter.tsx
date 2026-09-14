import React from 'react';

import {
  CATEGORY_LABELS,
  type PolicyCategory,
  type PolicyFilters,
  type PolicyStatus,
} from '../../features/policies/policies.types';

interface PolicyFilterProps {
  filters: PolicyFilters;
  onChange: (next: PolicyFilters) => void;
  onReset: () => void;
}

export function PolicyFilter({
  filters,
  onChange,
  onReset,
}: PolicyFilterProps): React.JSX.Element {
  return (
    <div className="admin-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
      {/* Search keyword */}
      <div style={{ flex: '1 1 240px', minWidth: 200 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input"
            placeholder="Tìm theo tiêu đề, slug, nội dung..."
            value={filters.q || ''}
            onChange={(e) => onChange({ ...filters, q: e.target.value, page: 1 })}
            style={{ width: '100%', paddingLeft: 34 }}
          />
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: 18,
              pointerEvents: 'none',
            }}
          >
            search
          </span>
        </div>
      </div>

      {/* Category select */}
      <div style={{ minWidth: 180 }}>
        <select
          className="select"
          value={filters.category || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              category: (e.target.value as PolicyCategory) || '',
              page: 1,
            })
          }
        >
          <option value="">Tất cả danh mục</option>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
            <option key={catKey} value={catKey}>
              {catVal.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status select */}
      <div style={{ minWidth: 170 }}>
        <select
          className="select"
          value={filters.status || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value as PolicyStatus) || '',
              page: 1,
            })
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="PUBLISHED">Đã công bố (PUBLISHED)</option>
          <option value="ARCHIVED">Đã lưu trữ (ARCHIVED)</option>
        </select>
      </div>

      {/* Reset button */}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onReset}
        title="Đặt lại bộ lọc"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          restart_alt
        </span>
        <span>Đặt lại</span>
      </button>
    </div>
  );
}
