import React from 'react';
import type { PickupRequest, ShipmentResponse, ShipmentRow } from '../../types';
import { formatCurrency, formatDate, normalizeCode } from '../../api';
import { SHIPMENT_PAGE_SIZE } from '../../utils/session.utils';

export interface ShipmentListViewProps {
  visibleRows: ShipmentRow[];
  filteredRows: ShipmentRow[];
  listPage: number;
  totalPages: number;
  listSearch: string;
  listStatus: string;
  listService: string;
  listRegion: string;
  listFromDate: string;
  listToDate: string;
  serviceOptions: string[];
  regionOptions: string[];
  pickupByShipmentCode: Map<string, PickupRequest>;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onServiceChange: (val: string) => void;
  onRegionChange: (val: string) => void;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onPageChange: (updater: (p: number) => number) => void;
  resolveShipmentStatusClass: (shipment: ShipmentResponse) => string;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
  onOpenShipmentDetail: (code: string) => void;
  onPrintShipment: (row: ShipmentRow) => void;
  onCreatePickupForShipment: (code: string) => void;
  onCancelShipment: (code: string) => void;
}

const DEFAULT_MERCHANT_COL_WIDTHS = {
  code: 160,
  status: 130,
  senderName: 130,
  senderPhone: 120,
  senderAddress: 220,
  receiverName: 130,
  receiverPhone: 120,
  receiverAddress: 240,
  cod: 110,
  fee: 110,
  service: 110,
  createdAt: 150,
  deliveredAt: 150,
};

const MIN_MERCHANT_COL_WIDTHS: Record<keyof typeof DEFAULT_MERCHANT_COL_WIDTHS, number> = {
  code: 120,
  status: 100,
  senderName: 80,
  senderPhone: 95,
  senderAddress: 120,
  receiverName: 80,
  receiverPhone: 95,
  receiverAddress: 120,
  cod: 90,
  fee: 90,
  service: 85,
  createdAt: 110,
  deliveredAt: 110,
};

function useResizableColumns<T extends Record<string, number>>(
  storageKey: string,
  defaultWidths: T,
  minWidths: Record<keyof T, number>,
) {
  const [widths, setWidths] = React.useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultWidths;
  });

  const resizingRef = React.useRef<{
    colKey: keyof T | null;
    startX: number;
    startWidth: number;
  }>({ colKey: null, startX: 0, startWidth: 0 });

  const handleMouseDown = React.useCallback(
    (colKey: keyof T, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = widths[colKey];
      resizingRef.current = { colKey, startX, startWidth };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current.colKey) return;
        const diff = moveEvent.clientX - resizingRef.current.startX;
        const minW = minWidths[resizingRef.current.colKey] || 60;
        const newWidth = Math.max(minW, Math.round(resizingRef.current.startWidth + diff));

        setWidths((prev) => ({
          ...prev,
          [resizingRef.current.colKey!]: newWidth,
        }));
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (resizingRef.current.colKey) {
          setWidths((latest) => {
            try {
              localStorage.setItem(storageKey, JSON.stringify(latest));
            } catch {
              // ignore
            }
            return latest;
          });
        }
        resizingRef.current = { colKey: null, startX: 0, startWidth: 0 };
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [widths, minWidths, storageKey],
  );

  const resetColumnWidth = React.useCallback(
    (colKey: keyof T) => {
      setWidths((prev) => {
        const next = { ...prev, [colKey]: defaultWidths[colKey] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [defaultWidths, storageKey],
  );

  return { widths, handleMouseDown, resetColumnWidth };
}

export function ShipmentListView({
  visibleRows,
  filteredRows,
  listPage,
  totalPages,
  listSearch,
  listStatus,
  listService,
  listRegion,
  listFromDate,
  listToDate,
  serviceOptions,
  regionOptions,
  pickupByShipmentCode,
  onSearchChange,
  onStatusChange,
  onServiceChange,
  onRegionChange,
  onFromDateChange,
  onToDateChange,
  onPageChange,
  resolveShipmentStatusClass,
  resolveShipmentStatusLabel,
  onOpenShipmentDetail,
  onPrintShipment,
  onCreatePickupForShipment,
  onCancelShipment,
}: ShipmentListViewProps): React.JSX.Element {
  const [isBatchMode, setIsBatchMode] = React.useState(false);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    'merchant_shipments_col_widths_v1',
    DEFAULT_MERCHANT_COL_WIDTHS,
    MIN_MERCHANT_COL_WIDTHS,
  );

  const parsedCodes = React.useMemo(() => {
    return listSearch
      .split(/[\s,;\n\r\t]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
  }, [listSearch]);

  React.useEffect(() => {
    if (listSearch.includes('\n') || listSearch.includes('\r')) {
      setIsBatchMode(true);
    }
  }, [listSearch]);

  const handlePasteSearch = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const codes = text
      .split(/[\s,;\n\r\t]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (codes.length > 1) {
      e.preventDefault();
      onSearchChange(codes.join('\n'));
      setIsBatchMode(true);
    }
  };

  const [selectedCodes, setSelectedCodes] = React.useState<string[]>([]);

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedCodes.includes(r.shipment.code));
  const someVisibleSelected = visibleRows.some((r) => selectedCodes.includes(r.shipment.code));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const set = new Set(selectedCodes);
      visibleRows.forEach((r) => set.add(r.shipment.code));
      setSelectedCodes(Array.from(set));
    } else {
      const visibleSet = new Set(visibleRows.map((r) => r.shipment.code));
      setSelectedCodes(selectedCodes.filter((c) => !visibleSet.has(c)));
    }
  };

  const toggleSelectOne = (code: string, checked: boolean) => {
    setSelectedCodes((prev) =>
      checked ? [...prev, code] : prev.filter((c) => c !== code),
    );
  };

  const selectedRows = React.useMemo(() => {
    const set = new Set(selectedCodes);
    return visibleRows.filter((r) => set.has(r.shipment.code));
  }, [visibleRows, selectedCodes]);

  const handleCopyAllCodes = async () => {
    const codes =
      selectedCodes.length > 0
        ? selectedCodes
        : filteredRows.map((r) => r.shipment.code);
    if (codes.length === 0) return;
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopyFeedback(`Đã chép ${codes.length} mã!`);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <>
      <section className="card shipment-list-hero">
        <div className="shipment-list-hero__copy">
          <p className="login-kicker">Shipment management</p>
          <h3>Danh sách shipment</h3>
          <p className="muted">
            Theo dõi, lọc và thao tác trên toàn bộ đơn hàng merchant trong cùng một bảng điều phối.
          </p>
        </div>
        <div className="shipment-list-hero__stats">
          <span className="badge">Hiển thị: {visibleRows.length}</span>
          <span className="badge">Tổng khớp: {filteredRows.length}</span>
          <span className="badge">
            Trang: {listPage}/{totalPages}
          </span>
        </div>
      </section>

      <section className="card shipment-filters">
        <div className="shipment-filters__header">
          <div>
            <p className="login-kicker">Filters</p>
            <h3>Bộ lọc đơn hàng</h3>
          </div>
          <div className="shipment-filters__summary muted">
            Tìm theo mã, tên người nhận, số điện thoại, trạng thái, dịch vụ, khu vực và thời gian tạo.
          </div>
        </div>
        <div className="shipment-filters__grid">
          <div className="shipment-field shipment-field--search">
            <div className="shipment-batch-paste-header">
              <label className="label" style={{ marginBottom: 0 }}>
                Tìm kiếm {parsedCodes.length > 1 ? `(${parsedCodes.length} mã)` : ''}
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {listSearch && (
                  <button
                    type="button"
                    className="shipment-batch-clear-btn"
                    onClick={() => {
                      onSearchChange('');
                      setIsBatchMode(false);
                    }}
                  >
                    Xóa mã
                  </button>
                )}
                <button
                  type="button"
                  className="shipment-batch-toggle-btn"
                  onClick={() => setIsBatchMode((prev) => !prev)}
                  title="Chuyển chế độ dán nhiều mã đơn (tự xếp xuống dòng kiểu J&T)"
                >
                  {isBatchMode ? 'Thu gọn' : 'Dán nhiều mã (J&T)'}
                </button>
              </div>
            </div>
            {isBatchMode ? (
              <textarea
                className="shipment-batch-textarea"
                placeholder="Dán danh sách mã đơn từ Excel, J&T hoặc bảng (Mỗi mã 1 dòng)..."
                value={listSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                onPaste={handlePasteSearch}
                rows={3}
              />
            ) : (
              <input
                className="input"
                placeholder="Tìm mã / tên / SĐT (Có thể dán nhiều mã)..."
                value={listSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                onPaste={handlePasteSearch}
              />
            )}
            {parsedCodes.length > 1 && (
              <div className="shipment-batch-badge">
                ⚡ Đang lọc <strong>{parsedCodes.length}</strong> mã vận đơn đồng thời (Tự động tách dòng).
              </div>
            )}
          </div>
          <div className="shipment-field">
            <label className="label">Trạng thái</label>
            <select
              className="select"
              value={listStatus}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CREATED">Đã tạo</option>
              <option value="UPDATED">Cập nhật</option>
              <option value="WAITING_PICKUP">Chờ lấy hàng</option>
              <option value="DELIVERED">Ký nhận</option>
              <option value="DELIVERY_FAILED">Ghi nhận vấn đề</option>
              <option value="RETURN_STARTED">Đang chuyển hoàn</option>
              <option value="RETURN_COMPLETED">Đã hoàn hàng</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="shipment-field">
            <label className="label">Dịch vụ</label>
            <select
              className="select"
              value={listService}
              onChange={(e) => onServiceChange(e.target.value)}
            >
              <option value="ALL">Tất cả dịch vụ</option>
              {serviceOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="shipment-field">
            <label className="label">Khu vực</label>
            <select
              className="select"
              value={listRegion}
              onChange={(e) => onRegionChange(e.target.value)}
            >
              <option value="ALL">Tất cả khu vực</option>
              {regionOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="shipment-field">
            <label className="label">Từ ngày</label>
            <input
              className="input"
              type="date"
              value={listFromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>
          <div className="shipment-field">
            <label className="label">Đến ngày</label>
            <input
              className="input"
              type="date"
              value={listToDate}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card shipment-table-card">
        <div className="shipment-table-card__header">
          <div>
            <p className="login-kicker">Data table</p>
            <h3>Đơn hàng đang hiển thị</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {selectedCodes.length > 0 && (
              <>
                <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                  Đã chọn {selectedCodes.length} đơn
                </span>
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => {
                    selectedRows.forEach((row) => onPrintShipment(row));
                  }}
                  title="In tem các đơn hàng đã chọn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    print
                  </span>
                  <span>In tem ({selectedCodes.length})</span>
                </button>
                <button
                  type="button"
                  className="btn btn--subtle"
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => {
                    selectedCodes.forEach((code) => onCreatePickupForShipment(code));
                  }}
                  title="Tạo yêu cầu lấy hàng cho các đơn đã chọn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    local_shipping
                  </span>
                  <span>Tạo Pickup ({selectedCodes.length})</span>
                </button>
                {selectedCodes.length === 1 && (
                  <button
                    type="button"
                    className="btn btn--subtle"
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => void onOpenShipmentDetail(selectedCodes[0])}
                    title="Xem chi tiết đơn hàng đang chọn"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      visibility
                    </span>
                    <span>Chi tiết</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--subtle"
                  style={{ fontSize: '12px', padding: '6px 10px', color: '#dc2626' }}
                  onClick={() => setSelectedCodes([])}
                >
                  Bỏ chọn
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--subtle"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: copyFeedback ? '#10b981' : undefined,
                color: copyFeedback ? '#059669' : undefined,
                fontWeight: 600,
              }}
              title="Sao chép toàn bộ danh sách mã vận đơn phân tách bằng dấu xuống dòng"
              onClick={() => void handleCopyAllCodes()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {copyFeedback ? 'check' : 'content_copy'}
              </span>
              <span>
                {copyFeedback ??
                  (selectedCodes.length > 0
                    ? `Sao chép ${selectedCodes.length} mã đã chọn`
                    : `Sao chép ${filteredRows.length} mã đơn`)}
              </span>
            </button>
            <div className="shipment-table-card__meta muted">
              Tổng số bản ghi: {filteredRows.length}
            </div>
          </div>
        </div>
        <div className="table-wrap shipment-table-wrap">
          <table className="shipment-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center', padding: '8px' }}>
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả đơn trên trang"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ width: widths.code, minWidth: widths.code, maxWidth: widths.code }}>
                  <span>Mã vận đơn</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('code', e)}
                    onDoubleClick={() => resetColumnWidth('code')}
                  />
                </th>
                <th style={{ width: widths.status, minWidth: widths.status, maxWidth: widths.status }}>
                  <span>Trạng thái</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
                <th style={{ width: widths.senderName, minWidth: widths.senderName, maxWidth: widths.senderName }}>
                  <span>Người gửi</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('senderName', e)}
                    onDoubleClick={() => resetColumnWidth('senderName')}
                  />
                </th>
                <th style={{ width: widths.senderPhone, minWidth: widths.senderPhone, maxWidth: widths.senderPhone }}>
                  <span>SĐT gửi</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('senderPhone', e)}
                    onDoubleClick={() => resetColumnWidth('senderPhone')}
                  />
                </th>
                <th style={{ width: widths.senderAddress, minWidth: widths.senderAddress, maxWidth: widths.senderAddress }}>
                  <span>Địa chỉ gửi</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('senderAddress', e)}
                    onDoubleClick={() => resetColumnWidth('senderAddress')}
                  />
                </th>
                <th style={{ width: widths.receiverName, minWidth: widths.receiverName, maxWidth: widths.receiverName }}>
                  <span>Người nhận</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('receiverName', e)}
                    onDoubleClick={() => resetColumnWidth('receiverName')}
                  />
                </th>
                <th style={{ width: widths.receiverPhone, minWidth: widths.receiverPhone, maxWidth: widths.receiverPhone }}>
                  <span>SĐT nhận</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('receiverPhone', e)}
                    onDoubleClick={() => resetColumnWidth('receiverPhone')}
                  />
                </th>
                <th style={{ width: widths.receiverAddress, minWidth: widths.receiverAddress, maxWidth: widths.receiverAddress }}>
                  <span>Địa chỉ giao</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('receiverAddress', e)}
                    onDoubleClick={() => resetColumnWidth('receiverAddress')}
                  />
                </th>
                <th style={{ width: widths.cod, minWidth: widths.cod, maxWidth: widths.cod }}>
                  <span>COD</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('cod', e)}
                    onDoubleClick={() => resetColumnWidth('cod')}
                  />
                </th>
                <th style={{ width: widths.fee, minWidth: widths.fee, maxWidth: widths.fee }}>
                  <span>Cước phí</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('fee', e)}
                    onDoubleClick={() => resetColumnWidth('fee')}
                  />
                </th>
                <th style={{ width: widths.service, minWidth: widths.service, maxWidth: widths.service }}>
                  <span>Dịch vụ</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('service', e)}
                    onDoubleClick={() => resetColumnWidth('service')}
                  />
                </th>
                <th style={{ width: widths.createdAt, minWidth: widths.createdAt, maxWidth: widths.createdAt }}>
                  <span>Ngày tạo</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('createdAt', e)}
                    onDoubleClick={() => resetColumnWidth('createdAt')}
                  />
                </th>
                <th style={{ width: widths.deliveredAt, minWidth: widths.deliveredAt, maxWidth: widths.deliveredAt }}>
                  <span>Ngày nhận hàng</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('deliveredAt', e)}
                    onDoubleClick={() => resetColumnWidth('deliveredAt')}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const isDelivered = row.shipment.currentStatus === 'DELIVERED';
                const isChecked = selectedCodes.includes(row.shipment.code);
                const fullSenderAddress =
                  row.senderAddress ||
                  [row.senderWard, row.senderProvince].filter(Boolean).join(', ') ||
                  '-';
                const fullReceiverAddress =
                  row.receiverAddress ||
                  [row.receiverWard, row.receiverProvince].filter(Boolean).join(', ') ||
                  row.receiverRegion ||
                  '-';

                return (
                  <tr key={row.shipment.id} style={{ background: isChecked ? '#f0f7ff' : undefined }}>
                    <td style={{ width: 44, textAlign: 'center', padding: '6px 8px' }}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn đơn ${row.shipment.code}`}
                        checked={isChecked}
                        onChange={(e) => toggleSelectOne(row.shipment.code, e.target.checked)}
                      />
                    </td>
                    <td style={{ width: widths.code, maxWidth: widths.code }} className="shipment-code-cell">
                      <span
                        className="shipment-code-text"
                        title="Bôi đen kéo chuột để sao chép mã"
                        style={{
                          cursor: 'text',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontWeight: 700,
                          color: 'var(--stitch-primary, #0059b8)',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                        onDoubleClick={() => void onOpenShipmentDetail(row.shipment.code)}
                      >
                        {row.shipment.code}
                      </span>
                    </td>
                    <td style={{ width: widths.status, maxWidth: widths.status }}>
                      <span className={resolveShipmentStatusClass(row.shipment)}>
                        {resolveShipmentStatusLabel(row.shipment)}
                      </span>
                    </td>
                    <td style={{ width: widths.senderName, maxWidth: widths.senderName }}>
                      <div
                        className="shipment-cell-scrollable"
                        title={row.senderName || '-'}
                        style={{ width: '100%', maxWidth: '100%', fontWeight: 600 }}
                      >
                        {row.senderName || '-'}
                      </div>
                    </td>
                    <td style={{ width: widths.senderPhone, maxWidth: widths.senderPhone }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.senderPhone || '-'}
                      </span>
                    </td>
                    <td style={{ width: widths.senderAddress, maxWidth: widths.senderAddress }}>
                      <div
                        className="shipment-cell-scrollable"
                        title={fullSenderAddress}
                        style={{ width: '100%', maxWidth: '100%', fontSize: 12, color: 'var(--stitch-on-surface-variant)' }}
                      >
                        {fullSenderAddress}
                      </div>
                    </td>
                    <td style={{ width: widths.receiverName, maxWidth: widths.receiverName }}>
                      <div
                        className="shipment-cell-scrollable"
                        title={row.receiverName}
                        style={{ width: '100%', maxWidth: '100%', fontWeight: 600 }}
                      >
                        {row.receiverName}
                      </div>
                    </td>
                    <td style={{ width: widths.receiverPhone, maxWidth: widths.receiverPhone }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.receiverPhone}
                      </span>
                    </td>
                    <td style={{ width: widths.receiverAddress, maxWidth: widths.receiverAddress }}>
                      <div
                        className="shipment-cell-scrollable"
                        title={fullReceiverAddress}
                        style={{ width: '100%', maxWidth: '100%', fontSize: 12, color: 'var(--stitch-on-surface-variant)' }}
                      >
                        {fullReceiverAddress}
                      </div>
                    </td>
                    <td style={{ width: widths.cod, maxWidth: widths.cod }}>
                      <span style={{ fontWeight: 700, color: row.codAmount ? '#059669' : undefined, whiteSpace: 'nowrap' }}>
                        {formatCurrency(row.codAmount)}
                      </span>
                    </td>
                    <td style={{ width: widths.fee, maxWidth: widths.fee }}>
                      <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(row.feeEstimate)}</span>
                    </td>
                    <td style={{ width: widths.service, maxWidth: widths.service }}>
                      <span className="shipment-service-chip" style={{ whiteSpace: 'nowrap' }}>
                        {row.serviceType}
                      </span>
                    </td>
                    <td style={{ width: widths.createdAt, maxWidth: widths.createdAt }}>
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(row.shipment.createdAt)}</span>
                    </td>
                    <td style={{ width: widths.deliveredAt, maxWidth: widths.deliveredAt }}>
                      {isDelivered ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', whiteSpace: 'nowrap' }}>
                          {formatDate(row.shipment.updatedAt)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--stitch-outline)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                          Chưa nhận
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleRows.length === 0 ? (
          <div className="empty shipment-empty">Không có dữ liệu.</div>
        ) : null}
        <div className="shipment-pagination">
          <div className="shipment-pagination__summary muted">
            Hiển thị {(listPage - 1) * SHIPMENT_PAGE_SIZE + (visibleRows.length > 0 ? 1 : 0)} -{' '}
            {(listPage - 1) * SHIPMENT_PAGE_SIZE + visibleRows.length} trong tổng số{' '}
            {filteredRows.length} đơn khớp bộ lọc
          </div>
          <div className="shipment-pagination__controls">
            <button
              className="btn btn-ghost shipment-pagination__btn"
              disabled={listPage <= 1}
              onClick={() => onPageChange((p) => Math.max(p - 1, 1))}
            >
              Trước
            </button>
            <span className="badge shipment-pagination__badge">
              Trang {listPage}/{totalPages}
            </span>
            <button
              className="btn btn-ghost shipment-pagination__btn"
              disabled={listPage >= totalPages}
              onClick={() => onPageChange((p) => Math.min(p + 1, totalPages))}
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
