import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileSpreadsheet,
  Package,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  Video,
} from 'lucide-react';

import {
  BREAK_POINT_LABELS,
  INVESTIGATION_STATUS_LABELS,
} from '../../../../features/investigation/investigation.data';
import type {
  InvestigationCase,
  InvestigationStatus,
} from '../../../../features/investigation/investigation.types';
import { useResizableColumns } from '../../../../hooks/useResizableColumns';
import { useTableColumnVisibility } from '../../../../hooks/useTableColumnVisibility';
import { TableColumnPicker } from '../../../shared/TableColumnPicker';

export type StrayColumnKey =
  | 'stt'
  | 'investigationCode'
  | 'shipmentCode'
  | 'customer'
  | 'route'
  | 'packageInfo'
  | 'declaredValue'
  | 'breakPoint'
  | 'suspectParty'
  | 'hearingDeadline'
  | 'status';

export const DEFAULT_STRAY_COL_WIDTHS: Record<StrayColumnKey, number> = {
  stt: 48,
  investigationCode: 165,
  shipmentCode: 150,
  customer: 175,
  route: 140,
  packageInfo: 210,
  declaredValue: 140,
  breakPoint: 230,
  suspectParty: 220,
  hearingDeadline: 155,
  status: 145,
};

export const MIN_STRAY_COL_WIDTHS: Record<StrayColumnKey, number> = {
  stt: 42,
  investigationCode: 130,
  shipmentCode: 130,
  customer: 135,
  route: 110,
  packageInfo: 155,
  declaredValue: 110,
  breakPoint: 165,
  suspectParty: 155,
  hearingDeadline: 120,
  status: 120,
};

export const STRAY_COLUMN_LABELS: Record<StrayColumnKey, string> = {
  stt: 'STT',
  investigationCode: 'Mã hồ sơ & Mức độ',
  shipmentCode: 'Mã vận đơn',
  customer: 'Khách hàng & SĐT',
  route: 'Tuyến vận chuyển',
  packageInfo: 'Kiện hàng & Cân nặng',
  declaredValue: 'Trị giá khai báo',
  breakPoint: 'Điểm đứt gãy phát hiện',
  suspectParty: 'Đơn vị tình nghi (Độ tin cậy)',
  hearingDeadline: 'Thời hạn giải trình 24h',
  status: 'Trạng thái xử lý',
};

export const DEFAULT_VISIBLE_STRAY_COLUMNS: Record<StrayColumnKey, boolean> = {
  stt: true,
  investigationCode: true,
  shipmentCode: true,
  customer: true,
  route: true,
  packageInfo: false,
  declaredValue: true,
  breakPoint: true,
  suspectParty: true,
  hearingDeadline: true,
  status: true,
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function calculateRemainingHours(deadlineIso?: string): { text: string; isUrgent: boolean } {
  if (!deadlineIso) return { text: 'Không áp dụng', isUrgent: false };
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'ĐÃ HẾT HẠN', isUrgent: true };
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { text: `Còn ${hours}h ${mins}p`, isUrgent: hours < 6 };
}

export function exportInvestigationsToExcel(items: InvestigationCase[]): void {
  const headers = [
    'Mã Hồ Sơ',
    'Mã Vận Đơn',
    'Khách Hàng',
    'Số Điện Thoại',
    'Tuyến Gửi',
    'Tuyến Đích',
    'Mô Tả Hàng Hóa',
    'Cân Nặng (kg)',
    'Trị Giá Khai Báo (VNĐ)',
    'Điểm Đứt Gãy',
    'Đơn Vị Tình Nghi',
    'Độ Tin Cậy (%)',
    'Thời Hạn Giải Trình',
    'Trạng Thái',
    'Hồ Sơ Bồi Thường Liên Kết',
    'Vị Trí Tìm Thấy',
  ];

  const rows = items.map((c) => [
    c.investigationCode,
    c.shipmentCode,
    c.customerName,
    c.customerPhone,
    c.originHubName,
    c.destinationHubName,
    c.packageDescription,
    c.declaredWeightKg,
    c.declaredValue,
    BREAK_POINT_LABELS[c.breakPointType] || c.breakPointType,
    c.preliminaryReport?.suspectPartyName || '',
    c.preliminaryReport?.confidenceScorePercent || 0,
    c.hearingDeadlineAt || '',
    INVESTIGATION_STATUS_LABELS[c.status] || c.status,
    c.linkedClaimCode || '',
    c.foundLocation || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
      '\r\n',
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `danh_sach_don_lac_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface StrayShipmentInvestigationTableProps {
  items: InvestigationCase[];
  selectedCaseId?: string;
  onSelectCase: (caseItem: InvestigationCase) => void;
  onExportExcel?: () => void;
}

export const StrayShipmentInvestigationTable: React.FC<StrayShipmentInvestigationTableProps> = ({
  items,
  selectedCaseId,
  onSelectCase,
  onExportExcel,
}) => {
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    'ops.investigations.table.widths.v1',
    DEFAULT_STRAY_COL_WIDTHS,
    MIN_STRAY_COL_WIDTHS,
  );

  const {
    visibleColumns,
    isColPickerOpen,
    setIsColPickerOpen,
    toggleColumn,
    setAllColumns,
    resetColumns,
    visibleCount,
    totalColCount,
  } = useTableColumnVisibility<StrayColumnKey>({
    storageKey: 'ops.investigations.table.cols.v1',
    defaultVisibility: DEFAULT_VISIBLE_STRAY_COLUMNS,
  });

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageOffset = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = useMemo(
    () => items.slice(pageOffset, pageOffset + pageSize),
    [items, pageOffset, pageSize],
  );

  return (
    <div className="stray-table-card">
      {/* Table Toolbar */}
      <div className="stray-table-toolbar">
        <div className="stray-table-toolbar-left">
          <span className="stray-table-count">
            Tổng cộng: <strong>{items.length}</strong> vụ việc giám định
          </span>
        </div>

        <div className="stray-table-toolbar-right">
          <button
            type="button"
            className="stray-btn-tool"
            onClick={onExportExcel || (() => exportInvestigationsToExcel(items))}
            title="Xuất bảng dữ liệu ra file Excel / CSV"
          >
            <FileSpreadsheet size={14} aria-hidden="true" />
            <span>Xuất Excel</span>
          </button>

          <TableColumnPicker
            columnLabels={STRAY_COLUMN_LABELS}
            visibleColumns={visibleColumns}
            isOpen={isColPickerOpen}
            onToggleOpen={() => setIsColPickerOpen(!isColPickerOpen)}
            onClose={() => setIsColPickerOpen(false)}
            onToggleColumn={toggleColumn}
            onSetAll={setAllColumns}
            onReset={resetColumns}
            visibleCount={visibleCount}
            totalCount={totalColCount}
          />
        </div>
      </div>

      {/* Table Scroll Container */}
      <div className="stray-table-scroll-wrap">
        <table className="stray-standard-table">
          <thead>
            <tr>
              {visibleColumns.stt && (
                <th
                  style={{
                    width: widths.stt,
                    minWidth: widths.stt,
                    maxWidth: widths.stt,
                    textAlign: 'center',
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.stt}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('stt', e)}
                    onDoubleClick={() => resetColumnWidth('stt')}
                  />
                </th>
              )}

              {visibleColumns.investigationCode && (
                <th
                  style={{
                    width: widths.investigationCode,
                    minWidth: widths.investigationCode,
                    maxWidth: widths.investigationCode,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.investigationCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('investigationCode', e)}
                    onDoubleClick={() => resetColumnWidth('investigationCode')}
                  />
                </th>
              )}

              {visibleColumns.shipmentCode && (
                <th
                  style={{
                    width: widths.shipmentCode,
                    minWidth: widths.shipmentCode,
                    maxWidth: widths.shipmentCode,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.shipmentCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('shipmentCode', e)}
                    onDoubleClick={() => resetColumnWidth('shipmentCode')}
                  />
                </th>
              )}

              {visibleColumns.customer && (
                <th
                  style={{
                    width: widths.customer,
                    minWidth: widths.customer,
                    maxWidth: widths.customer,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.customer}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('customer', e)}
                    onDoubleClick={() => resetColumnWidth('customer')}
                  />
                </th>
              )}

              {visibleColumns.route && (
                <th
                  style={{
                    width: widths.route,
                    minWidth: widths.route,
                    maxWidth: widths.route,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.route}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('route', e)}
                    onDoubleClick={() => resetColumnWidth('route')}
                  />
                </th>
              )}

              {visibleColumns.packageInfo && (
                <th
                  style={{
                    width: widths.packageInfo,
                    minWidth: widths.packageInfo,
                    maxWidth: widths.packageInfo,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.packageInfo}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('packageInfo', e)}
                    onDoubleClick={() => resetColumnWidth('packageInfo')}
                  />
                </th>
              )}

              {visibleColumns.declaredValue && (
                <th
                  style={{
                    width: widths.declaredValue,
                    minWidth: widths.declaredValue,
                    maxWidth: widths.declaredValue,
                    textAlign: 'right',
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.declaredValue}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('declaredValue', e)}
                    onDoubleClick={() => resetColumnWidth('declaredValue')}
                  />
                </th>
              )}

              {visibleColumns.breakPoint && (
                <th
                  style={{
                    width: widths.breakPoint,
                    minWidth: widths.breakPoint,
                    maxWidth: widths.breakPoint,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.breakPoint}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('breakPoint', e)}
                    onDoubleClick={() => resetColumnWidth('breakPoint')}
                  />
                </th>
              )}

              {visibleColumns.suspectParty && (
                <th
                  style={{
                    width: widths.suspectParty,
                    minWidth: widths.suspectParty,
                    maxWidth: widths.suspectParty,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.suspectParty}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('suspectParty', e)}
                    onDoubleClick={() => resetColumnWidth('suspectParty')}
                  />
                </th>
              )}

              {visibleColumns.hearingDeadline && (
                <th
                  style={{
                    width: widths.hearingDeadline,
                    minWidth: widths.hearingDeadline,
                    maxWidth: widths.hearingDeadline,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.hearingDeadline}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('hearingDeadline', e)}
                    onDoubleClick={() => resetColumnWidth('hearingDeadline')}
                  />
                </th>
              )}

              {visibleColumns.status && (
                <th
                  style={{
                    width: widths.status,
                    minWidth: widths.status,
                    maxWidth: widths.status,
                  }}
                  className="stray-th"
                >
                  <span>{STRAY_COLUMN_LABELS.status}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13px' }}
                >
                  Không tìm thấy hồ sơ giám định nào phù hợp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const isSelected = item.id === selectedCaseId;
                const remaining = calculateRemainingHours(item.hearingDeadlineAt);

                return (
                  <tr
                    key={item.id}
                    className={`stray-table-row ${isSelected ? 'stray-row-selected' : ''}`}
                    onClick={() => onSelectCase(item)}
                    title="Nhấp chuột vào dòng để mở bảng xem toàn cảnh chuỗi vết quét & thực hiện thao tác"
                  >
                    {/* STT */}
                    {visibleColumns.stt && (
                      <td
                        style={{
                          width: widths.stt,
                          maxWidth: widths.stt,
                          textAlign: 'center',
                          color: '#64748b',
                          fontSize: '12px',
                        }}
                        className="stray-td"
                      >
                        {pageOffset + index + 1}
                      </td>
                    )}

                    {/* Investigation Code & Priority */}
                    {visibleColumns.investigationCode && (
                      <td
                        style={{
                          width: widths.investigationCode,
                          maxWidth: widths.investigationCode,
                        }}
                        className="stray-td"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="stray-code-text"
                            title={`Mã giám định: ${item.investigationCode}`}
                          >
                            {item.investigationCode}
                          </span>
                          {item.priority === 'CRITICAL' && (
                            <span className="stray-priority-badge stray-priority--critical" title="Mức độ khẩn cấp">
                              GẤP
                            </span>
                          )}
                          {item.priority === 'HIGH' && (
                            <span className="stray-priority-badge stray-priority--high" title="Mức độ cao">
                              CAO
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Shipment Code: Clean selectable monospace text row */}
                    {visibleColumns.shipmentCode && (
                      <td
                        style={{
                          width: widths.shipmentCode,
                          maxWidth: widths.shipmentCode,
                        }}
                        className="stray-td stray-shipment-code-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className="stray-tracking-code"
                          title="Bôi đen kéo chuột để sao chép mã vận đơn"
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontWeight: 700,
                            color: 'var(--ops-primary, #0052cc)',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            cursor: 'text',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                          }}
                        >
                          {item.shipmentCode}
                        </span>
                      </td>
                    )}

                    {/* Customer */}
                    {visibleColumns.customer && (
                      <td
                        style={{
                          width: widths.customer,
                          maxWidth: widths.customer,
                        }}
                        className="stray-td"
                        title={`${item.customerName} (${item.customerPhone})`}
                      >
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {item.customerName}
                        </span>
                      </td>
                    )}

                    {/* Route */}
                    {visibleColumns.route && (
                      <td
                        style={{
                          width: widths.route,
                          maxWidth: widths.route,
                        }}
                        className="stray-td"
                        title={`${item.originHubName} ➔ ${item.destinationHubName}`}
                      >
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                          {item.originHubCode} ➔ {item.destinationHubCode}
                        </span>
                      </td>
                    )}

                    {/* Package Info */}
                    {visibleColumns.packageInfo && (
                      <td
                        style={{
                          width: widths.packageInfo,
                          maxWidth: widths.packageInfo,
                        }}
                        className="stray-td"
                        title={`${item.packageDescription} (${item.declaredWeightKg} kg)`}
                      >
                        <span>
                          {item.packageDescription} ({item.declaredWeightKg} kg)
                        </span>
                      </td>
                    )}

                    {/* Declared Value */}
                    {visibleColumns.declaredValue && (
                      <td
                        style={{
                          width: widths.declaredValue,
                          maxWidth: widths.declaredValue,
                          textAlign: 'right',
                        }}
                        className="stray-td"
                        title={`Trị giá khai báo: ${formatVND(item.declaredValue)}`}
                      >
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>
                          {formatVND(item.declaredValue)}
                        </span>
                      </td>
                    )}

                    {/* Break Point */}
                    {visibleColumns.breakPoint && (
                      <td
                        style={{
                          width: widths.breakPoint,
                          maxWidth: widths.breakPoint,
                        }}
                        className="stray-td"
                        title={BREAK_POINT_LABELS[item.breakPointType] || item.breakPointType}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle
                            size={12}
                            style={{ color: '#ef4444', flexShrink: 0 }}
                            aria-hidden="true"
                          />
                          <span style={{ color: '#334155' }}>
                            {BREAK_POINT_LABELS[item.breakPointType] || item.breakPointType}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Suspect Party */}
                    {visibleColumns.suspectParty && (
                      <td
                        style={{
                          width: widths.suspectParty,
                          maxWidth: widths.suspectParty,
                        }}
                        className="stray-td"
                        title={`Đơn vị tình nghi: ${item.preliminaryReport.suspectPartyName} - Độ tin cậy: ${item.preliminaryReport.confidenceScorePercent}%`}
                      >
                        <span>
                          {item.preliminaryReport.suspectPartyName}{' '}
                          <strong style={{ color: '#ef4444', fontSize: '11px' }}>
                            ({item.preliminaryReport.confidenceScorePercent}%)
                          </strong>
                        </span>
                      </td>
                    )}

                    {/* Hearing Deadline */}
                    {visibleColumns.hearingDeadline && (
                      <td
                        style={{
                          width: widths.hearingDeadline,
                          maxWidth: widths.hearingDeadline,
                        }}
                        className="stray-td"
                      >
                        {item.status === 'IN_HEARING' ? (
                          <span
                            className={`stray-deadline-tag ${
                              remaining.isUrgent ? 'stray-deadline-tag--urgent' : ''
                            }`}
                            title={`Thời hạn trích xuất camera giải trình: ${item.hearingDeadlineAt}`}
                          >
                            <Clock size={11} aria-hidden="true" />
                            {remaining.text}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Không mở</span>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td
                        style={{
                          width: widths.status,
                          maxWidth: widths.status,
                        }}
                        className="stray-td"
                      >
                        <span className={`stray-status-badge stray-status--${item.status}`}>
                          {INVESTIGATION_STATUS_LABELS[item.status]}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="stray-table-pagination">
        <div className="stray-pagination-info">
          <span>
            Hiển thị {paginatedItems.length === 0 ? 0 : pageOffset + 1} -{' '}
            {Math.min(pageOffset + pageSize, items.length)} trên tổng số {items.length} vụ việc
          </span>
          <div className="stray-page-size-selector">
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="stray-pagination-controls">
          <button
            type="button"
            className="stray-pagination-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <span className="stray-pagination-page-indicator">
            Trang <strong>{safeCurrentPage}</strong> / {totalPages}
          </span>
          <button
            type="button"
            className="stray-pagination-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Trang tiếp"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrayShipmentInvestigationTable;
