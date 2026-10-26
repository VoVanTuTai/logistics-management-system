import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Store,
  Truck,
  User,
  UserX,
  X,
} from 'lucide-react';

import {
  CSKH_CATEGORY_LABELS,
  CSKH_PRIORITY_LABELS,
  CSKH_SOURCE_LABELS,
  CSKH_STATUS_LABELS,
} from '../../../../features/cskh/cskh.data';
import type {
  CskhTicket,
  CskhTicketStatus,
} from '../../../../features/cskh/cskh.types';
import { useResizableColumns } from '../../../../hooks/useResizableColumns';
import { useTableColumnVisibility } from '../../../../hooks/useTableColumnVisibility';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { TableColumnPicker } from '../../../shared/TableColumnPicker';

export type CskhColumnKey =
  | 'stt'
  | 'ticketCode'
  | 'shipmentCode'
  | 'customer'
  | 'category'
  | 'title'
  | 'priority'
  | 'assignedHub'
  | 'assignedAgent'
  | 'slaDeadline'
  | 'status'
  | 'createdAt'
  | 'actions';

export const DEFAULT_CSKH_COL_WIDTHS: Record<CskhColumnKey, number> = {
  stt: 50,
  ticketCode: 170,
  shipmentCode: 150,
  customer: 165,
  category: 155,
  title: 250,
  priority: 130,
  assignedHub: 165,
  assignedAgent: 140,
  slaDeadline: 155,
  status: 140,
  createdAt: 135,
  actions: 125,
};

export const MIN_CSKH_COL_WIDTHS: Record<CskhColumnKey, number> = {
  stt: 45,
  ticketCode: 135,
  shipmentCode: 125,
  customer: 130,
  category: 120,
  title: 170,
  priority: 100,
  assignedHub: 125,
  assignedAgent: 105,
  slaDeadline: 125,
  status: 110,
  createdAt: 105,
  actions: 110,
};

export const CSKH_COLUMN_LABELS: Record<CskhColumnKey, string> = {
  stt: 'STT',
  ticketCode: 'Mã Ticket & Kênh',
  shipmentCode: 'Mã vận đơn',
  customer: 'Khách hàng & SĐT',
  category: 'Phân loại khiếu nại',
  title: 'Tiêu đề & Nội dung',
  priority: 'Mức độ ưu tiên',
  assignedHub: 'Bưu cục phụ trách',
  assignedAgent: 'Chuyên viên CSKH',
  slaDeadline: 'Thời hạn SLA & Đếm ngược',
  status: 'Trạng thái xử lý',
  createdAt: 'Thời gian tiếp nhận',
  actions: 'Hành động',
};

export const DEFAULT_VISIBLE_CSKH_COLUMNS: Record<CskhColumnKey, boolean> = {
  stt: true,
  ticketCode: true,
  shipmentCode: true,
  customer: true,
  category: true,
  title: true,
  priority: true,
  assignedHub: true,
  assignedAgent: false,
  slaDeadline: true,
  status: true,
  createdAt: false,
  actions: true,
};

const STORAGE_COL_VISIBILITY_KEY = 'nexus_cskh_table_col_visibility_v1';
const STORAGE_COL_WIDTHS_KEY = 'nexus_cskh_table_col_widths_v1';

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSlaRemainingInfo(deadlineStr: string, isClosed: boolean): {
  text: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  if (isClosed) {
    return { text: 'Đã hoàn tất', isOverdue: false, isUrgent: false };
  }

  const now = Date.now();
  const deadline = new Date(deadlineStr).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / 60000));
    const hours = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { text: `Quá hạn ${timeStr}`, isOverdue: true, isUrgent: true };
  }

  const remainingMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  if (hours < 2) {
    return { text: `Còn ${hours > 0 ? `${hours}h ` : ''}${mins}m`, isOverdue: false, isUrgent: true };
  }

  return { text: `Còn ${hours}h ${mins}m`, isOverdue: false, isUrgent: false };
}

export function exportTicketsToCsv(ticketsToExport: CskhTicket[], filename = 'danh-sach-cskh-tickets.csv'): void {
  const headers = [
    'Mã Ticket',
    'Nguồn tiếp nhận',
    'Mã vận đơn',
    'Khách hàng',
    'Số điện thoại',
    'Email',
    'Phân loại',
    'Mức độ ưu tiên',
    'Trạng thái',
    'Bưu cục phụ trách',
    'Chuyên viên CSKH',
    'Hạn SLA',
    'Quá hạn',
    'Tiêu đề',
    'Mô tả chi tiết',
    'Ngày tiếp nhận',
  ];

  const rows = ticketsToExport.map((t) => {
    const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';
    const isOverdue = !isClosed && new Date(t.slaDeadline).getTime() < Date.now();
    return [
      `"${t.ticketCode}"`,
      `"${CSKH_SOURCE_LABELS[t.source]?.label || t.source}"`,
      `"${t.shipmentCode}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.customerPhone}"`,
      `"${t.customerEmail || ''}"`,
      `"${CSKH_CATEGORY_LABELS[t.category]?.label || t.category}"`,
      `"${CSKH_PRIORITY_LABELS[t.priority]?.label || t.priority}"`,
      `"${CSKH_STATUS_LABELS[t.status]?.label || t.status}"`,
      `"${t.assignedHubName || ''}"`,
      `"${t.assignedAgent || ''}"`,
      `"${t.slaDeadline}"`,
      `"${isOverdue ? 'CÓ' : 'KHÔNG'}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.createdAt}"`,
    ].join(',');
  });

  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface CustomerServiceTicketsTableProps {
  tickets: CskhTicket[];
  selectedTicket: CskhTicket | null;
  onSelectTicket: (ticket: CskhTicket) => void;
  onQuickAddNote?: (ticket: CskhTicket) => void;
  onBatchUpdateStatus?: (ticketIds: string[], status: CskhTicketStatus) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerServiceTicketsTable({
  tickets,
  selectedTicket,
  onSelectTicket,
  onQuickAddNote,
  onBatchUpdateStatus,
  isLoading,
}: CustomerServiceTicketsTableProps): React.JSX.Element {
  // Column visibility state
  const {
    visibleColumns,
    isColPickerOpen,
    setIsColPickerOpen,
    toggleColumn,
    setAllColumns,
    resetColumns,
    visibleCount,
    totalColCount,
  } = useTableColumnVisibility<CskhColumnKey>({
    storageKey: STORAGE_COL_VISIBILITY_KEY,
    defaultVisibility: DEFAULT_VISIBLE_CSKH_COLUMNS,
  });

  // Resizable columns
  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    STORAGE_COL_WIDTHS_KEY,
    DEFAULT_CSKH_COL_WIDTHS,
    MIN_CSKH_COL_WIDTHS
  );

  // Row selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchStatusDropdownOpen, setIsBatchStatusDropdownOpen] = useState<boolean>(false);
  const [isUpdatingBatch, setIsUpdatingBatch] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = useMemo(() => {
    return tickets.slice(startIndex, startIndex + pageSize);
  }, [tickets, startIndex, pageSize]);

  const allCurrentSelected =
    currentRows.length > 0 && currentRows.every((row) => selectedIds.includes(row.id));
  const someCurrentSelected =
    currentRows.some((row) => selectedIds.includes(row.id)) && !allCurrentSelected;

  const handleToggleAllCurrent = (checked: boolean) => {
    if (checked) {
      const currentIds = currentRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      const currentIdSet = new Set(currentRows.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIdSet.has(id)));
    }
  };

  const handleToggleRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(tickets.map((t) => t.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBatchStatusApply = async (status: CskhTicketStatus) => {
    if (selectedIds.length === 0 || !onBatchUpdateStatus) return;
    setIsUpdatingBatch(true);
    try {
      await onBatchUpdateStatus(selectedIds, status);
      setIsBatchStatusDropdownOpen(false);
      setSelectedIds([]);
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  const handleExportSelected = () => {
    const selectedTickets = tickets.filter((t) => selectedIds.includes(t.id));
    exportTicketsToCsv(
      selectedTickets.length > 0 ? selectedTickets : tickets,
      `cskh-tickets-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="cskh-standard-table-card">
      {/* Table Top Toolbar */}
      <div className="cskh-table-toolbar-strip">
        <div className="cskh-toolbar-left">
          <div className="cskh-count-badge">
            Hiển thị <strong>{tickets.length}</strong> Ticket khiếu nại
          </div>
          {tickets.length > 0 && (
            <button
              type="button"
              className="cskh-btn-export-csv"
              onClick={() => exportTicketsToCsv(tickets)}
              title="Xuất toàn bộ kết quả lọc ra file Excel / CSV"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              Xuất CSV ({tickets.length})
            </button>
          )}
        </div>

        <TableColumnPicker
          columnLabels={CSKH_COLUMN_LABELS}
          visibleColumns={visibleColumns}
          isOpen={isColPickerOpen}
          onToggleOpen={() => setIsColPickerOpen(!isColPickerOpen)}
          onClose={() => setIsColPickerOpen(false)}
          onToggleColumn={toggleColumn}
          onSetAll={setAllColumns}
          onReset={resetColumns}
          visibleCount={visibleCount}
          totalCount={totalColCount}
          classNamePrefix="cskh"
        />
      </div>

      {/* Batch Selection Strip */}
      {selectedIds.length > 0 && (
        <div className="cskh-selection-strip">
          <div className="cskh-selection-info">
            <span className="cskh-selection-badge">
              ✓ Đã chọn: <strong>{selectedIds.length}</strong> Ticket
            </span>
            {selectedIds.length < tickets.length && (
              <button
                type="button"
                className="cskh-text-link-bold"
                onClick={handleSelectAllFiltered}
              >
                Chọn tất cả {tickets.length} Ticket trong danh sách lọc
              </button>
            )}
          </div>

          <div className="cskh-selection-actions">
            {onBatchUpdateStatus && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="cskh-btn-batch-action"
                  onClick={() => setIsBatchStatusDropdownOpen(!isBatchStatusDropdownOpen)}
                  disabled={isUpdatingBatch}
                >
                  <span>Chuyển trạng thái hàng loạt</span>
                  <ChevronDown size={13} />
                </button>

                {isBatchStatusDropdownOpen && (
                  <div className="cskh-batch-status-menu">
                    <div className="cskh-batch-menu-title">Cập nhật {selectedIds.length} Ticket sang:</div>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusApply('RESOLVED')}
                      className="cskh-batch-menu-item text-emerald-700 font-semibold"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600 mr-2 flex-shrink-0" />
                      Xử lý & Đóng phiếu ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusApply('WAITING_CUSTOMER')}
                      className="cskh-batch-menu-item"
                    >
                      <Clock size={13} className="text-purple-600 mr-2 flex-shrink-0" />
                      Chờ khách phản hồi ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusApply('IN_PROGRESS')}
                      className="cskh-batch-menu-item"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-2 flex-shrink-0" />
                      Đang xử lý ({selectedIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="cskh-btn-batch-export"
              onClick={handleExportSelected}
            >
              <Download size={13} />
              Xuất {selectedIds.length} Ticket đã chọn
            </button>

            <button
              type="button"
              className="cskh-btn-batch-clear"
              onClick={handleClearSelection}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table Shell with Sticky Header & Resizable Columns */}
      <div className="cskh-table-shell">
        <table className="cskh-universal-table">
          <thead>
            <tr>
              {/* Select Checkbox Col */}
              <th
                className="cskh-th-select"
                style={{ width: 44, minWidth: 44, maxWidth: 44 }}
              >
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả Ticket trên trang hiện tại"
                  checked={allCurrentSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someCurrentSelected;
                    }
                  }}
                  onChange={(e) => handleToggleAllCurrent(e.target.checked)}
                />
              </th>

              {/* STT */}
              {visibleColumns.stt && (
                <th
                  style={{
                    width: widths.stt,
                    minWidth: widths.stt,
                    maxWidth: widths.stt,
                    textAlign: 'center',
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.stt}</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('stt', e)}
                    onDoubleClick={() => resetColumnWidth('stt')}
                  />
                </th>
              )}

              {/* Ticket Code & Source */}
              {visibleColumns.ticketCode && (
                <th
                  style={{
                    width: widths.ticketCode,
                    minWidth: widths.ticketCode,
                    maxWidth: widths.ticketCode,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.ticketCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('ticketCode', e)}
                    onDoubleClick={() => resetColumnWidth('ticketCode')}
                  />
                </th>
              )}

              {/* Shipment Code */}
              {visibleColumns.shipmentCode && (
                <th
                  style={{
                    width: widths.shipmentCode,
                    minWidth: widths.shipmentCode,
                    maxWidth: widths.shipmentCode,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.shipmentCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('shipmentCode', e)}
                    onDoubleClick={() => resetColumnWidth('shipmentCode')}
                  />
                </th>
              )}

              {/* Customer & Phone */}
              {visibleColumns.customer && (
                <th
                  style={{
                    width: widths.customer,
                    minWidth: widths.customer,
                    maxWidth: widths.customer,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.customer}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('customer', e)}
                    onDoubleClick={() => resetColumnWidth('customer')}
                  />
                </th>
              )}

              {/* Category */}
              {visibleColumns.category && (
                <th
                  style={{
                    width: widths.category,
                    minWidth: widths.category,
                    maxWidth: widths.category,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.category}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('category', e)}
                    onDoubleClick={() => resetColumnWidth('category')}
                  />
                </th>
              )}

              {/* Title & Notes */}
              {visibleColumns.title && (
                <th
                  style={{
                    width: widths.title,
                    minWidth: widths.title,
                    maxWidth: widths.title,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.title}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('title', e)}
                    onDoubleClick={() => resetColumnWidth('title')}
                  />
                </th>
              )}

              {/* Priority */}
              {visibleColumns.priority && (
                <th
                  style={{
                    width: widths.priority,
                    minWidth: widths.priority,
                    maxWidth: widths.priority,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.priority}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('priority', e)}
                    onDoubleClick={() => resetColumnWidth('priority')}
                  />
                </th>
              )}

              {/* Assigned Hub */}
              {visibleColumns.assignedHub && (
                <th
                  style={{
                    width: widths.assignedHub,
                    minWidth: widths.assignedHub,
                    maxWidth: widths.assignedHub,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.assignedHub}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('assignedHub', e)}
                    onDoubleClick={() => resetColumnWidth('assignedHub')}
                  />
                </th>
              )}

              {/* Assigned Agent */}
              {visibleColumns.assignedAgent && (
                <th
                  style={{
                    width: widths.assignedAgent,
                    minWidth: widths.assignedAgent,
                    maxWidth: widths.assignedAgent,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.assignedAgent}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('assignedAgent', e)}
                    onDoubleClick={() => resetColumnWidth('assignedAgent')}
                  />
                </th>
              )}

              {/* SLA Deadline */}
              {visibleColumns.slaDeadline && (
                <th
                  style={{
                    width: widths.slaDeadline,
                    minWidth: widths.slaDeadline,
                    maxWidth: widths.slaDeadline,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.slaDeadline}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('slaDeadline', e)}
                    onDoubleClick={() => resetColumnWidth('slaDeadline')}
                  />
                </th>
              )}

              {/* Status */}
              {visibleColumns.status && (
                <th
                  style={{
                    width: widths.status,
                    minWidth: widths.status,
                    maxWidth: widths.status,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.status}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
              )}

              {/* Created At */}
              {visibleColumns.createdAt && (
                <th
                  style={{
                    width: widths.createdAt,
                    minWidth: widths.createdAt,
                    maxWidth: widths.createdAt,
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.createdAt}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('createdAt', e)}
                    onDoubleClick={() => resetColumnWidth('createdAt')}
                  />
                </th>
              )}

              {/* Actions */}
              {visibleColumns.actions && (
                <th
                  style={{
                    width: widths.actions,
                    minWidth: widths.actions,
                    maxWidth: widths.actions,
                    textAlign: 'right',
                  }}
                >
                  <span>{CSKH_COLUMN_LABELS.actions}</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={visibleCount + 1}
                  style={{ textAlign: 'center', padding: '60px 16px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div className="cskh-spinner" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      Đang tải danh sách phiếu CSKH...
                    </span>
                  </div>
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount + 1}
                  style={{ textAlign: 'center', padding: '60px 16px', color: '#94a3b8' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <FileText size={38} className="text-slate-300" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      Không tìm thấy Ticket khiếu nại nào phù hợp với bộ lọc hiện tại.
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      Hãy thử thay đổi điều kiện tìm kiếm hoặc chọn tab phân loại khác.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((t, idx) => {
                const isSelected = selectedIds.includes(t.id);
                const isCurrentActive = selectedTicket?.id === t.id;
                const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';
                const slaInfo = getSlaRemainingInfo(t.slaDeadline, isClosed);
                const cat = CSKH_CATEGORY_LABELS[t.category] || CSKH_CATEGORY_LABELS.GENERAL_INQUIRY;
                const priority = CSKH_PRIORITY_LABELS[t.priority];
                const status = CSKH_STATUS_LABELS[t.status];
                const source = CSKH_SOURCE_LABELS[t.source];
                const rowStt = startIndex + idx + 1;

                return (
                  <tr
                    key={t.id}
                    className={`cskh-table-row ${isCurrentActive ? 'cskh-row-active' : ''} ${
                      isSelected ? 'cskh-row-selected' : ''
                    }`}
                    onClick={() => onSelectTicket(t)}
                  >
                    {/* Checkbox */}
                    <td
                      className="cskh-td-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleRow(t.id, e.target.checked)}
                      />
                    </td>

                    {/* STT */}
                    {visibleColumns.stt && (
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                        {rowStt}
                      </td>
                    )}

                    {/* Ticket Code & Source */}
                    {visibleColumns.ticketCode && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span className="cskh-cell-ticket-code" title="Xem chi tiết ticket">
                            {t.ticketCode}
                          </span>
                          <span className={`cskh-source-pill source-${t.source.toLowerCase()}`} title={source?.label || t.source}>
                            {t.source === 'AI_CHATBOT' ? (
                              <Bot size={11} className="text-indigo-600" />
                            ) : t.source === 'HOTLINE_1900' ? (
                              <PhoneCall size={11} className="text-blue-600" />
                            ) : t.source === 'MERCHANT_PORTAL' ? (
                              <Store size={11} className="text-emerald-600" />
                            ) : (
                              <Smartphone size={11} className="text-amber-600" />
                            )}
                            {source?.label || t.source}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Shipment Code */}
                    {visibleColumns.shipmentCode && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <CopyableShipmentCode code={t.shipmentCode} />
                      </td>
                    )}

                    {/* Customer & Phone */}
                    {visibleColumns.customer && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 12.5 }}>
                            {t.customerName}
                          </span>
                          <span style={{ color: '#94a3b8' }}>•</span>
                          <a
                            href={`tel:${t.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="cskh-phone-link"
                            title="Bấm để gọi hotline"
                          >
                            <Phone size={11} />
                            {t.customerPhone}
                          </a>
                        </div>
                      </td>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <td>
                        <span className={`cskh-category-badge cat-${cat.color || 'blue'}`}>
                          {t.category === 'DELIVERY_EXPEDITE' && <Truck size={12} />}
                          {t.category === 'ADDRESS_CHANGE' && <MapPin size={12} />}
                          {t.category === 'DAMAGE_COMPLAINT' && <AlertTriangle size={12} />}
                          {t.category === 'COURIER_ATTITUDE' && <UserX size={12} />}
                          {t.category === 'AI_HANDOVER' && <Bot size={12} />}
                          {cat.label}
                        </span>
                      </td>
                    )}

                    {/* Title & Notes count */}
                    {visibleColumns.title && (
                      <td style={{ maxWidth: widths.title, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span
                            className="cskh-cell-title"
                            title={t.title}
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {t.title}
                          </span>
                          {t.notes && t.notes.length > 0 && (
                            <span className="cskh-notes-count-badge" title={`${t.notes.length} ghi chú nội bộ`}>
                              <MessageSquare size={10} />
                              {t.notes.length}
                            </span>
                          )}
                          {(t.linkedClaimCode || t.claimCode) && (
                            <span className="cskh-claim-link-badge" title="Đã chuyển sang Hồ sơ bồi thường">
                              ⚡ CLM: {t.linkedClaimCode || t.claimCode}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Priority */}
                    {visibleColumns.priority && (
                      <td>
                        <span className={`cskh-priority-pill ${priority.badgeClass}`}>
                          <span className={`cskh-priority-dot ${priority.dotColor}`} />
                          {priority.label.split(' - ')[0]}
                        </span>
                      </td>
                    )}

                    {/* Assigned Hub */}
                    {visibleColumns.assignedHub && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                            {t.assignedHubName || 'Chưa gán Hub'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Assigned Agent */}
                    {visibleColumns.assignedAgent && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={13} className="text-slate-400 flex-shrink-0" />
                          <span style={{ fontSize: 12, color: t.assignedAgent ? '#1e293b' : '#94a3b8' }}>
                            {t.assignedAgent || 'Chưa phân công'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* SLA Deadline & Countdown */}
                    {visibleColumns.slaDeadline && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span
                            className={`cskh-sla-pill ${
                              isClosed
                                ? 'status-closed'
                                : slaInfo.isOverdue
                                ? 'status-overdue'
                                : slaInfo.isUrgent
                                ? 'status-warning'
                                : 'status-normal'
                            }`}
                            title={`Hạn: ${formatDateTime(t.slaDeadline)}`}
                          >
                            <Clock size={11} />
                            {slaInfo.text}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#94a3b8' }} title={`Hạn chót: ${formatDateTime(t.slaDeadline)}`}>
                            ({formatDateTime(t.slaDeadline)})
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td>
                        <span className={`cskh-status-pill ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                    )}

                    {/* Created At */}
                    {visibleColumns.createdAt && (
                      <td style={{ fontSize: 11.5, color: '#64748b' }}>
                        {formatDateTime(t.createdAt)}
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.actions && (
                      <td
                        style={{ textAlign: 'right' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {onQuickAddNote && (
                            <button
                              type="button"
                              className="cskh-btn-icon-action"
                              title="Thêm ghi chú nhanh"
                              onClick={() => onQuickAddNote(t)}
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="cskh-btn-table-action"
                            onClick={() => onSelectTicket(t)}
                          >
                            <span>{isClosed ? 'Xem chi tiết' : 'Xử lý & Đóng'}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Internal Table Pagination Footer */}
      <div className="cskh-table-pagination-footer">
        <div className="cskh-pagination-info">
          <span>
            Hiển thị <strong>{tickets.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong>{Math.min(startIndex + pageSize, tickets.length)}</strong> trong số{' '}
            <strong>{tickets.length}</strong> Ticket
          </span>
          <div className="cskh-page-size-selector">
            <span>Dòng / trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="cskh-pagination-controls">
          <button
            type="button"
            className="cskh-pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="cskh-pagination-pages">
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>

          <button
            type="button"
            className="cskh-pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerServiceTicketsTable;
