import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  RotateCcw,
  MessageSquare,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

import type { NdrCaseListItemDto } from '../../features/ndr/ndr.types';
import { useResizableColumns } from '../../hooks/useResizableColumns';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatAnyCodeLabel } from '../../utils/logisticsLabels';

// Status Label & Styling
export const NDR_STATUS_MAP: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  PENDING_RESOLUTION: {
    label: 'Chờ giải quyết',
    badgeClass: 'ndr-badge--amber',
    desc: 'Cần điều phối viên xác minh và ra quyết định',
  },
  CREATED: {
    label: 'Mới ghi nhận',
    badgeClass: 'ndr-badge--amber',
    desc: 'Bưu tá vừa báo giao thất bại ngoài hiện trường',
  },
  OPEN: {
    label: 'Đang mở',
    badgeClass: 'ndr-badge--amber',
    desc: 'Đang chờ xử lý thông tin giao hàng',
  },
  RESCHEDULED: {
    label: 'Đã hẹn phát lại',
    badgeClass: 'ndr-badge--blue',
    desc: 'Đã dời lịch phát cho ca tiếp theo',
  },
  RETURN_REQUESTED: {
    label: 'Yêu cầu chuyển hoàn',
    badgeClass: 'ndr-badge--purple',
    desc: 'Đã xác nhận hoàn trả về Shop/người gửi',
  },
  RETURNING: {
    label: 'Đang chuyển hoàn',
    badgeClass: 'ndr-badge--indigo',
    desc: 'Bưu kiện đang trên đường hoàn về kho gửi',
  },
  RESOLVED: {
    label: 'Đã xử lý xong',
    badgeClass: 'ndr-badge--green',
    desc: 'Ca sự cố đã hoàn tất',
  },
  CLOSED: {
    label: 'Đã đóng',
    badgeClass: 'ndr-badge--gray',
    desc: 'Hồ sơ đã lưu trữ',
  },
};

export const NDR_REASON_MAP: Record<string, string> = {
  CUSTOMER_UNREACHABLE: 'Khách không nghe máy / Thuê bao',
  CUSTOMER_RESCHEDULED: 'Khách hẹn lại ngày/giờ khác',
  WRONG_ADDRESS: 'Sai địa chỉ / Không tìm thấy nhà',
  CUSTOMER_REJECTED: 'Khách từ chối nhận hàng',
  REJECTED_DAMAGED: 'Khách từ chối do kiện hàng móp/rách',
  OUT_OF_DELIVERY_TIME: 'Hết giờ giao hàng trong ngày',
  WEATHER_FORCE_MAJEURE: 'Thời tiết xấu / Mưa ngập',
  SECURITY_CHECKPOINT_BLOCKED: 'Khu vực phong tỏa / Không tiếp cận được',
  PHYSICAL_DAMAGE: 'Kiện hàng hư hỏng vật lý',
  DAMAGED: 'Hàng bể vỡ / Hư hỏng',
  TORN: 'Rách bao bì niêm phong',
  WET: 'Kiện hàng bị ướt nước',
};

export type NdrColumnKey =
  | 'stt'
  | 'ndrId'
  | 'shipmentCode'
  | 'status'
  | 'reason'
  | 'courier'
  | 'hub'
  | 'note'
  | 'updatedAt'
  | 'actions';

const DEFAULT_NDR_COL_WIDTHS: Record<NdrColumnKey, number> = {
  stt: 46,
  ndrId: 135,
  shipmentCode: 155,
  status: 140,
  reason: 190,
  courier: 155,
  hub: 110,
  note: 180,
  updatedAt: 140,
  actions: 190,
};

const MIN_NDR_COL_WIDTHS: Record<NdrColumnKey, number> = {
  stt: 40,
  ndrId: 100,
  shipmentCode: 120,
  status: 110,
  reason: 130,
  courier: 120,
  hub: 80,
  note: 120,
  updatedAt: 110,
  actions: 150,
};

export const NDR_COLUMN_LABELS: Record<NdrColumnKey, string> = {
  stt: 'STT',
  ndrId: 'Mã NDR',
  shipmentCode: 'Mã vận đơn',
  status: 'Trạng thái xử lý',
  reason: 'Lý do giao thất bại',
  courier: 'Bưu tá (Shipper)',
  hub: 'Bưu cục (Hub)',
  note: 'Ghi chú hiện trường',
  updatedAt: 'Cập nhật lúc',
  actions: 'Thao tác xử lý',
};

const DEFAULT_VISIBLE_NDR_COLUMNS: Record<NdrColumnKey, boolean> = {
  stt: true,
  ndrId: true,
  shipmentCode: true,
  status: true,
  reason: true,
  courier: true,
  hub: true,
  note: true,
  updatedAt: true,
  actions: true,
};

const STORAGE_NDR_VISIBILITY_KEY = 'nexus_ndr_table_columns_v1';
const STORAGE_NDR_WIDTHS_KEY = 'nexus_ndr_table_col_widths_v1';

export function formatNdrDisplayCode(id: string, createdAt?: string): string {
  if (!id) return '';
  if (id.startsWith('NDR-')) return id;

  // Format legacy cuid or uuid into standard NDR-YYYYMMDD-XXXX
  const datePart = createdAt
    ? createdAt.slice(0, 10).replace(/-/g, '')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hashPart = id.slice(-4).toUpperCase();
  return `NDR-${datePart}-${hashPart}`;
}

// Copyable NDR code with copy check
export function CopyableNdrCode({
  id,
  createdAt,
}: {
  id: string;
  createdAt?: string;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const displayCode = formatNdrDisplayCode(id, createdAt);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Link
        to={routePaths.ndrDetail(id)}
        className="ndr-code-mono"
        title={id !== displayCode ? `ID gốc: ${id} • Nhấp để xem hồ sơ chi tiết` : 'Nhấp để xem hồ sơ chi tiết'}
        onClick={(e) => e.stopPropagation()}
      >
        {displayCode}
      </Link>
      <button
        type="button"
        className="ndr-copy-btn"
        onClick={handleCopy}
        title="Sao chép mã NDR"
      >
        {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// Copyable shipment code with copy check
function CopyableShipmentCode({ code }: { code: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Link
        to={routePaths.trackingDetail(code)}
        className="ndr-code-mono"
        title="Nhấp để tra cứu hành trình bưu kiện"
        onClick={(e) => e.stopPropagation()}
      >
        {code}
      </Link>
      <button
        type="button"
        className="ndr-copy-btn"
        onClick={handleCopy}
        title="Sao chép mã vận đơn"
      >
        {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// Export CSV / Excel with UTF-8 BOM
export function exportNdrToExcel(
  itemsToExport: NdrCaseListItemDto[],
  courierByShipmentCode: Map<string, string> = new Map(),
  filename = `danh-sach-ndr-${new Date().toISOString().slice(0, 10)}.csv`,
) {
  const headers = [
    'Mã NDR',
    'Mã vận đơn',
    'Trạng thái',
    'Lý do giao thất bại',
    'Mã Shipper phụ trách',
    'Bưu cục ghi nhận',
    'Ghi chú bưu tá',
    'Thời gian tạo',
    'Cập nhật lần cuối',
  ];

  const rows = itemsToExport.map((item) => {
    const courierId = courierByShipmentCode.get(item.shipmentCode) || item.reportedBy || '';
    const statusLabel = NDR_STATUS_MAP[item.status]?.label || item.status;
    const reasonLabel = NDR_REASON_MAP[item.reasonCode || ''] || formatAnyCodeLabel(item.reasonCode);
    const noteClean = (item.note || '').replace(/"/g, '""');

    return [
      `"${formatNdrDisplayCode(item.id, item.createdAt)}"`,
      `"${item.shipmentCode}"`,
      `"${statusLabel}"`,
      `"${reasonLabel}"`,
      `"${courierId}"`,
      `"${item.reportedHubCode || ''}"`,
      `"${noteClean}"`,
      `"${item.createdAt ? formatDateTime(item.createdAt) : ''}"`,
      `"${formatDateTime(item.updatedAt)}"`,
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

export interface NdrCasesTableProps {
  items: NdrCaseListItemDto[];
  courierByShipmentCode?: Map<string, string>;
  onOpenReschedule?: (item: NdrCaseListItemDto) => void;
  onOpenReturn?: (item: NdrCaseListItemDto) => void;
  isLoading?: boolean;
}

export function NdrCasesTable({
  items,
  courierByShipmentCode = new Map(),
  onOpenReschedule,
  onOpenReturn,
  isLoading = false,
}: NdrCasesTableProps): React.JSX.Element {
  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<NdrColumnKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NDR_VISIBILITY_KEY);
      if (saved) return { ...DEFAULT_VISIBLE_NDR_COLUMNS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_VISIBLE_NDR_COLUMNS;
  });

  const [isColPickerOpen, setIsColPickerOpen] = useState(false);

  const toggleColumn = (key: NdrColumnKey) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_NDR_VISIBILITY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Resizable Columns Hook
  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns<
    Record<NdrColumnKey, number>
  >(STORAGE_NDR_WIDTHS_KEY, DEFAULT_NDR_COL_WIDTHS, MIN_NDR_COL_WIDTHS);

  // Multi-row Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalRows = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const currentRows = items.slice(startIndex, endIndex);

  const isAllCurrentSelected =
    currentRows.length > 0 && currentRows.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentRows.some((r) => r.id === id)));
    } else {
      const currentIds = currentRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleExportSelected = () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    if (selectedItems.length === 0) return;
    exportNdrToExcel(selectedItems, courierByShipmentCode);
  };

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="ndr-table-shell">
      {/* Multi-selection info strip */}
      {selectedIds.length > 0 && (
        <div className="ndr-selection-strip">
          <span>
            Đã chọn <strong>{selectedIds.length}</strong> / {totalRows} ca sự cố giao hàng
          </span>
          <div className="ndr-selection-strip-actions">
            <button
              type="button"
              className="ndr-btn ndr-btn-subtle ndr-btn-sm"
              onClick={handleExportSelected}
            >
              <FileSpreadsheet size={13} />
              <span>Xuất Excel các ca đã chọn</span>
            </button>
            <button
              type="button"
              className="ndr-btn ndr-btn-subtle ndr-btn-sm"
              onClick={() => setSelectedIds([])}
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="ndr-table-container">
        <table className="ndr-table">
          <thead>
            <tr>
              {/* Checkbox column */}
              <th
                style={{
                  width: 36,
                  minWidth: 36,
                  maxWidth: 36,
                  textAlign: 'center',
                  padding: '8px 4px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllCurrentSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả ca trong trang"
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
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.stt}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('stt', e)}
                    onDoubleClick={() => resetColumnWidth('stt')}
                  />
                </th>
              )}

              {/* Mã NDR */}
              {visibleColumns.ndrId && (
                <th
                  style={{
                    width: widths.ndrId,
                    minWidth: widths.ndrId,
                    maxWidth: widths.ndrId,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.ndrId}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('ndrId', e)}
                    onDoubleClick={() => resetColumnWidth('ndrId')}
                  />
                </th>
              )}

              {/* Mã Vận đơn */}
              {visibleColumns.shipmentCode && (
                <th
                  style={{
                    width: widths.shipmentCode,
                    minWidth: widths.shipmentCode,
                    maxWidth: widths.shipmentCode,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.shipmentCode}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('shipmentCode', e)}
                    onDoubleClick={() => resetColumnWidth('shipmentCode')}
                  />
                </th>
              )}

              {/* Trạng thái */}
              {visibleColumns.status && (
                <th
                  style={{
                    width: widths.status,
                    minWidth: widths.status,
                    maxWidth: widths.status,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.status}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
              )}

              {/* Lý do thất bại */}
              {visibleColumns.reason && (
                <th
                  style={{
                    width: widths.reason,
                    minWidth: widths.reason,
                    maxWidth: widths.reason,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.reason}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('reason', e)}
                    onDoubleClick={() => resetColumnWidth('reason')}
                  />
                </th>
              )}

              {/* Courier (Shipper) */}
              {visibleColumns.courier && (
                <th
                  style={{
                    width: widths.courier,
                    minWidth: widths.courier,
                    maxWidth: widths.courier,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.courier}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('courier', e)}
                    onDoubleClick={() => resetColumnWidth('courier')}
                  />
                </th>
              )}

              {/* Hub */}
              {visibleColumns.hub && (
                <th
                  style={{
                    width: widths.hub,
                    minWidth: widths.hub,
                    maxWidth: widths.hub,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.hub}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('hub', e)}
                    onDoubleClick={() => resetColumnWidth('hub')}
                  />
                </th>
              )}

              {/* Ghi chú */}
              {visibleColumns.note && (
                <th
                  style={{
                    width: widths.note,
                    minWidth: widths.note,
                    maxWidth: widths.note,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.note}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('note', e)}
                    onDoubleClick={() => resetColumnWidth('note')}
                  />
                </th>
              )}

              {/* Cập nhật lúc */}
              {visibleColumns.updatedAt && (
                <th
                  style={{
                    width: widths.updatedAt,
                    minWidth: widths.updatedAt,
                    maxWidth: widths.updatedAt,
                    position: 'relative',
                  }}
                >
                  <span>{NDR_COLUMN_LABELS.updatedAt}</span>
                  <div
                    className="ndr-resizer"
                    onMouseDown={(e) => handleMouseDown('updatedAt', e)}
                    onDoubleClick={() => resetColumnWidth('updatedAt')}
                  />
                </th>
              )}

              {/* Actions Header */}
              {visibleColumns.actions && (
                <th
                  style={{
                    width: widths.actions,
                    minWidth: widths.actions,
                    maxWidth: widths.actions,
                    position: 'relative',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <span>{NDR_COLUMN_LABELS.actions}</span>
                    <button
                      type="button"
                      className="ndr-btn ndr-btn-subtle ndr-btn-sm"
                      onClick={() => setIsColPickerOpen(!isColPickerOpen)}
                      title="Tùy chỉnh ẩn/hiện cột"
                      style={{ padding: '0 4px', height: 22 }}
                    >
                      <SlidersHorizontal size={12} />
                    </button>
                  </div>

                  {/* Column Visibility Dropdown */}
                  {isColPickerOpen && (
                    <div
                      className="ndr-col-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', padding: '2px 4px' }}>
                        Hiển thị cột bảng biểu
                      </span>
                      {Object.keys(DEFAULT_VISIBLE_NDR_COLUMNS).map((k) => {
                        const key = k as NdrColumnKey;
                        return (
                          <label key={key} className="ndr-col-dropdown-item">
                            <input
                              type="checkbox"
                              checked={visibleColumns[key]}
                              onChange={() => toggleColumn(key)}
                            />
                            <span>{NDR_COLUMN_LABELS[key]}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount + 1}
                  style={{ textAlign: 'center', padding: '60px 16px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div className="ndr-spinner" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      Đang tải danh sách hồ sơ giao thất bại (NDR)...
                    </span>
                  </div>
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount + 1}
                  style={{ textAlign: 'center', padding: '60px 16px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={36} color="#94a3b8" />
                    <span style={{ fontSize: 13.5, color: '#475569', fontWeight: 600 }}>
                      Không có ca giao thất bại nào phù hợp với bộ lọc hiện tại.
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      Thử thay đổi từ khóa tìm kiếm hoặc chọn tab quy trình khác.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                const courierId = courierByShipmentCode.get(item.shipmentCode) || item.reportedBy || null;
                const statusMeta = NDR_STATUS_MAP[item.status] || {
                  label: item.status,
                  badgeClass: 'ndr-badge--gray',
                  desc: '',
                };
                const reasonLabel =
                  NDR_REASON_MAP[item.reasonCode || ''] || formatAnyCodeLabel(item.reasonCode);
                const rowStt = startIndex + idx + 1;

                const isPending =
                  item.status === 'PENDING_RESOLUTION' ||
                  item.status === 'CREATED' ||
                  item.status === 'OPEN';

                return (
                  <tr key={item.id} className={isSelected ? 'is-selected' : ''}>
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item.id)}
                        aria-label={`Chọn ca ${item.id}`}
                      />
                    </td>

                    {/* STT */}
                    {visibleColumns.stt && (
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                        {rowStt}
                      </td>
                    )}

                    {/* Mã NDR */}
                    {visibleColumns.ndrId && (
                      <td>
                        <CopyableNdrCode id={item.id} createdAt={item.createdAt} />
                      </td>
                    )}

                    {/* Mã Vận đơn */}
                    {visibleColumns.shipmentCode && (
                      <td>
                        <CopyableShipmentCode code={item.shipmentCode} />
                      </td>
                    )}

                    {/* Trạng thái xử lý */}
                    {visibleColumns.status && (
                      <td>
                        <span
                          className={`ndr-badge ${statusMeta.badgeClass}`}
                          title={statusMeta.desc}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                    )}

                    {/* Lý do thất bại */}
                    {visibleColumns.reason && (
                      <td>
                        <span
                          style={{ fontWeight: 600, color: '#0f172a', fontSize: 12.5, whiteSpace: 'nowrap' }}
                          title={item.issueCategory ? `Phân loại: ${item.issueCategory === 'PHYSICAL' ? 'Hư hỏng vật lý' : 'Thông tin / Liên lạc'}` : undefined}
                        >
                          {reasonLabel}
                        </span>
                      </td>
                    )}

                    {/* Courier & Chat */}
                    {visibleColumns.courier && (
                      <td>
                        {courierId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
                              {courierId}
                            </span>
                            <Link
                              to={routePaths.opsChatWithCourier(courierId)}
                              className="ndr-chat-courier-btn"
                              title={`Nhắn tin điều phối với Shipper ${courierId}`}
                            >
                              <MessageSquare size={11} />
                              <span>Chat</span>
                            </Link>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>Chưa phân công</span>
                        )}
                      </td>
                    )}

                    {/* Hub */}
                    {visibleColumns.hub && (
                      <td>
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {item.reportedHubCode || '---'}
                        </span>
                      </td>
                    )}

                    {/* Ghi chú */}
                    {visibleColumns.note && (
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.note || ''}
                        >
                          {item.note || <em style={{ color: '#94a3b8' }}>Không có ghi chú</em>}
                        </span>
                      </td>
                    )}

                    {/* Cập nhật lúc */}
                    {visibleColumns.updatedAt && (
                      <td>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          {formatDateTime(item.updatedAt)}
                        </span>
                      </td>
                    )}

                    {/* Thao tác trực tiếp */}
                    {visibleColumns.actions && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="ndr-row-actions" style={{ justifyContent: 'flex-end' }}>
                          {/* Nút Hẹn phát lại */}
                          <button
                            type="button"
                            className="ndr-action-btn ndr-action-btn--reschedule"
                            onClick={() => onOpenReschedule && onOpenReschedule(item)}
                            title="Hẹn ngày/giờ phát lại cho ca tiếp theo"
                          >
                            <CalendarClock size={12} />
                            <span>Hẹn lại</span>
                          </button>

                          {/* Nút Chuyển hoàn */}
                          <button
                            type="button"
                            className="ndr-action-btn ndr-action-btn--return"
                            onClick={() => onOpenReturn && onOpenReturn(item)}
                            title="Xác nhận chuyển hoàn về Shop/người gửi"
                          >
                            <RotateCcw size={12} />
                            <span>Hoàn hàng</span>
                          </button>

                          {/* Nút Xem chi tiết */}
                          <Link
                            to={routePaths.ndrDetail(item.id)}
                            className="ndr-action-btn ndr-action-btn--detail"
                            title="Xem chi tiết và lịch sử hồ sơ"
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </Link>
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

      {/* Pagination Footer */}
      <div className="ndr-table-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>
            Hiển thị <strong>{totalRows > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong>{endIndex}</strong> trên <strong>{totalRows}</strong> hồ sơ
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Số dòng:</span>
            <select
              className="ndr-select"
              style={{ height: 26, padding: '0 20px 0 6px', fontSize: 12 }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="ndr-pagination-controls">
          <button
            type="button"
            className="ndr-page-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            title="Trang đầu"
          >
            «
          </button>
          <button
            type="button"
            className="ndr-page-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
          >
            ‹
          </button>

          <span style={{ margin: '0 4px', fontSize: 12 }}>
            Trang <strong>{safeCurrentPage}</strong> / {totalPages}
          </span>

          <button
            type="button"
            className="ndr-page-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Trang sau"
          >
            ›
          </button>
          <button
            type="button"
            className="ndr-page-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Trang cuối"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
