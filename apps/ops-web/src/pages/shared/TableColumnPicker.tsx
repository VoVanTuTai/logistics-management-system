import React, { useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export interface TableColumnPickerProps<K extends string> {
  columnLabels: Record<K, string>;
  visibleColumns: Record<K, boolean>;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose?: () => void;
  onToggleColumn: (key: K) => void;
  onSetAll: (val: boolean) => void;
  onReset: () => void;
  visibleCount: number;
  totalCount: number;
  classNamePrefix?: string;
}

export function TableColumnPicker<K extends string>({
  columnLabels,
  visibleColumns,
  isOpen,
  onToggleOpen,
  onClose,
  onToggleColumn,
  onSetAll,
  onReset,
  visibleCount,
  totalCount,
  classNamePrefix = 'ops',
}: TableColumnPickerProps<K>): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const p = classNamePrefix;

  return (
    <div ref={containerRef} className={`${p}-toolbar-right`} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`${p}-btn-col-picker ${isOpen ? 'active' : ''}`}
        onClick={onToggleOpen}
      >
        <SlidersHorizontal size={13} />
        <span>
          Tùy chỉnh cột ({visibleCount}/{totalCount})
        </span>
      </button>

      {isOpen && (
        <div className={`${p}-col-picker-dropdown`}>
          <div className={`${p}-col-picker-header`}>
            <strong>Ẩn / Hiện Cột</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onSetAll(true)}
                className={p === 'claims' ? 'claims-picker-link' : `${p}-text-link`}
              >
                Tất cả
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={onReset}
                className={p === 'claims' ? 'claims-picker-link' : `${p}-text-link`}
                style={{ color: '#64748b' }}
              >
                Mặc định
              </button>
            </div>
          </div>
          <div className={`${p}-col-picker-list`}>
            {(Object.keys(columnLabels) as K[]).map((colKey) => (
              <label key={colKey} className={`${p}-col-picker-item`}>
                <input
                  type="checkbox"
                  checked={Boolean(visibleColumns[colKey])}
                  onChange={() => onToggleColumn(colKey)}
                />
                <span>{columnLabels[colKey]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
