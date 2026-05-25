import React from 'react';
import './BranchBusinessOperations.css';

interface BranchTablePaginationProps {
  totalRows: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

export function BranchTablePagination({
  totalRows,
  page,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}: BranchTablePaginationProps): React.JSX.Element {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const firstRow = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, safePage * pageSize);

  return (
    <footer className="ops-branch-pagination">
      <span>
        Hiển thị {firstRow}-{lastRow} / {totalRows}
      </span>
      <label>
        <span>Số dòng</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="ops-branch-pagination__buttons" aria-label="Phân trang">
        <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
          Trước
        </button>
        <strong>
          {safePage}/{totalPages}
        </strong>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
        >
          Sau
        </button>
      </div>
    </footer>
  );
}
