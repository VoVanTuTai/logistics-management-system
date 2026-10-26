import React from 'react';
import type { ShipmentRow } from '../../types';
import { formatDate, normalizeCode } from '../../api';

export interface PrintShipmentViewProps {
  shipmentRows: ShipmentRow[];
  printSingleCode: string;
  printBulkCodes: string;
  printPreviewRow: ShipmentRow | null;
  printBulkPreviewRows: ShipmentRow[];
  printMessage: string | null;
  onPrintSingleCodeChange: (val: string) => void;
  onPrintBulkCodesChange: (val: string) => void;
  onPrintSingle: () => void;
  onPrintBulk: () => void;
  onDownloadCsv: () => void;
  onExportPdf: () => void;
}

export function PrintShipmentView({
  shipmentRows,
  printSingleCode,
  printBulkCodes,
  printPreviewRow,
  printBulkPreviewRows,
  printMessage,
  onPrintSingleCodeChange,
  onPrintBulkCodesChange,
  onPrintSingle,
  onPrintBulk,
  onDownloadCsv,
  onExportPdf,
}: PrintShipmentViewProps): React.JSX.Element {
  return (
    <section className="print-layout">
      <div className="print-main-column">
        <section className="card print-filters-card">
          <div className="print-filters-grid">
            <div className="print-filter-block">
              <label className="label">Tìm kiếm vận đơn</label>
              <input
                className="input"
                value={printSingleCode}
                onChange={(e) => onPrintSingleCodeChange(e.target.value)}
                placeholder="Nhập mã vận đơn (VD: NX123...)"
              />
            </div>
            <div className="print-filter-block">
              <label className="label">Trạng thái in</label>
              <div className="print-toggle-row">
                <span className="print-toggle-chip print-toggle-chip--active">Tất cả</span>
                <span className="print-toggle-chip">Chờ in</span>
                <span className="print-toggle-chip">Đã in</span>
              </div>
            </div>
            <div className="print-filter-block">
              <label className="label">Mã vận đơn hàng loạt</label>
              <textarea
                className="textarea print-bulk-input"
                value={printBulkCodes}
                onChange={(e) => onPrintBulkCodesChange(e.target.value)}
                placeholder="Nhập nhiều mã, cách nhau bằng dấu phẩy hoặc xuống dòng"
              />
            </div>
          </div>
        </section>

        <section className="card print-table-card">
          <div className="print-table-card__header">
            <div>
              <p className="login-kicker">Ready to print</p>
              <h3>Danh sách chờ in</h3>
            </div>
            <div className="print-table-card__meta muted">
              Hiển thị {Math.min(shipmentRows.length, 6)} trên {shipmentRows.length} vận đơn hiện có
            </div>
          </div>
          <div className="table-wrap print-table-wrap">
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}></th>
                  <th>Mã vận đơn</th>
                  <th>Người nhận</th>
                  <th>Dịch vụ</th>
                  <th>Trạng thái in</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {shipmentRows.slice(0, 6).map((row) => {
                  const isSelected =
                    normalizeCode(printSingleCode) === normalizeCode(row.shipment.code);
                  return (
                    <tr
                      key={row.shipment.id}
                      className={isSelected ? 'print-row-selected' : ''}
                      onClick={() => onPrintSingleCodeChange(row.shipment.code)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ width: 44, textAlign: 'center' }}>
                        <input
                          type="radio"
                          name="selectedPrintShipment"
                          checked={isSelected}
                          onChange={() => onPrintSingleCodeChange(row.shipment.code)}
                          aria-label={`Chọn đơn ${row.shipment.code} để in`}
                        />
                      </td>
                      <td className="print-code-cell">
                        <strong>{row.shipment.code}</strong>
                      </td>
                      <td>
                        <div className="print-recipient-cell">
                          <strong>{row.receiverName}</strong>
                          <span>{row.receiverPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="shipment-service-chip">{row.serviceType}</span>
                      </td>
                      <td>
                        <span
                          className={`print-status ${
                            isSelected ? 'print-status--pending' : 'print-status--muted'
                          }`}
                        >
                          {isSelected ? 'Đang chọn' : 'Sẵn sàng'}
                        </span>
                      </td>
                      <td>{formatDate(row.shipment.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shipmentRows.length === 0 ? (
            <div className="empty print-empty">Chưa có vận đơn để in.</div>
          ) : null}
        </section>
      </div>

      <aside className="card print-sidebar-card">
        <div className="print-sidebar-card__header">
          <span className="material-symbols-outlined print-sidebar-icon">print</span>
          <h3>Cấu hình in</h3>
        </div>

        <div className="print-config-group">
          <label className="label">Khổ giấy</label>
          <div className="print-option-list">
            <div className="print-option print-option--active">
              <div>
                <strong>A5 (Standard)</strong>
                <span>Phù hợp in laser văn phòng</span>
              </div>
              <span className="print-option-dot" />
            </div>
            <div className="print-option">
              <div>
                <strong>K80 (Thermal)</strong>
                <span>In nhiệt liên tục, tiết kiệm</span>
              </div>
            </div>
            <div className="print-option">
              <div>
                <strong>100x150mm</strong>
                <span>Chuẩn tem nhãn thương mại</span>
              </div>
            </div>
          </div>
        </div>

        <div className="print-config-group">
          <label className="label">Nội dung in</label>
          <select className="select">
            <option>Vận đơn đầy đủ (Full)</option>
            <option>Vận đơn rút gọn (Mini)</option>
            <option>Chỉ mã QR (QR Only)</option>
          </select>
        </div>

        <div className="print-preview-card">
          <div className="print-preview-sheet">
            <div className="print-preview-sheet__bar" />
            <div className="print-preview-sheet__hero">
              <div className="print-preview-sheet__qr">QR</div>
              <div className="print-preview-sheet__copy">
                <strong>{printPreviewRow?.shipment.code ?? 'Mã vận đơn'}</strong>
                <span>{printPreviewRow?.receiverName ?? 'Người nhận'}</span>
              </div>
            </div>
            <div className="print-preview-sheet__lines">
              <span />
              <span />
              <span />
            </div>
            <div className="print-preview-sheet__footer" />
          </div>
          <p className="muted">Bản xem trước khổ A5</p>
        </div>

        <div className="print-summary-row">
          <span>Vận đơn đã chọn:</span>
          <strong>
            {printBulkPreviewRows.length > 0
              ? printBulkPreviewRows.length
              : printPreviewRow
              ? 1
              : 0}
          </strong>
        </div>

        <div className="print-action-stack">
          <button className="btn btn-primary print-primary-btn" onClick={onPrintSingle}>
            In 1 vận đơn
          </button>
          <button className="btn btn-secondary print-secondary-btn" onClick={onPrintBulk}>
            In nhiều vận đơn
          </button>
          <div className="print-utility-row">
            <button className="btn btn-ghost" onClick={onDownloadCsv}>
              Tải danh sách đơn
            </button>
            <button className="btn btn-ghost" onClick={onExportPdf}>
              Xuất PDF
            </button>
          </div>
        </div>

        {printMessage ? <p className="message">{printMessage}</p> : null}
      </aside>
    </section>
  );
}
