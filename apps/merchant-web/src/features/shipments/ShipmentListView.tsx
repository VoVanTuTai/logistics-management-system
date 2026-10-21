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
            <label className="label">Tìm kiếm</label>
            <input
              className="input"
              placeholder="Tìm mã / tên / SĐT"
              value={listSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="shipment-field">
            <label className="label">Trạng thái</label>
            <select
              className="select"
              value={listStatus}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CREATED">CREATED</option>
              <option value="UPDATED">UPDATED</option>
              <option value="WAITING_PICKUP">CHO_LAY_HANG</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
              <option value="RETURN_STARTED">RETURN_STARTED</option>
              <option value="RETURN_COMPLETED">RETURN_COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
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
          <div className="shipment-table-card__meta muted">
            Tổng số bản ghi khớp bộ lọc: {filteredRows.length}
          </div>
        </div>
        <div className="table-wrap shipment-table-wrap">
          <table className="shipment-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Trạng thái</th>
                <th>COD</th>
                <th>Phí</th>
                <th>Dịch vụ</th>
                <th>Ngày tạo</th>
                <th className="shipment-actions-th">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const normalizedShipmentCode = normalizeCode(row.shipment.code);
                const hasPickup = pickupByShipmentCode.has(normalizedShipmentCode);
                return (
                  <tr key={row.shipment.id}>
                    <td className="shipment-code-cell">{row.shipment.code}</td>
                    <td>
                      <div className="shipment-recipient">
                        <strong>{row.receiverName}</strong>
                      </div>
                    </td>
                    <td>{row.receiverPhone}</td>
                    <td>
                      <span className={resolveShipmentStatusClass(row.shipment)}>
                        {resolveShipmentStatusLabel(row.shipment)}
                      </span>
                    </td>
                    <td>{formatCurrency(row.codAmount)}</td>
                    <td>{formatCurrency(row.feeEstimate)}</td>
                    <td>
                      <span className="shipment-service-chip">{row.serviceType}</span>
                    </td>
                    <td>{formatDate(row.shipment.createdAt)}</td>
                    <td>
                      <div className="shipment-actions">
                        <button
                          type="button"
                          className="btn shipment-action-btn shipment-action-btn--primary"
                          title="Xem chi tiết & cập nhật đơn hàng"
                          onClick={() => {
                            void onOpenShipmentDetail(row.shipment.code);
                          }}
                        >
                          <span className="material-symbols-outlined shipment-action-icon">
                            visibility
                          </span>
                          <span>Chi tiết</span>
                        </button>
                        <button
                          type="button"
                          className="btn shipment-action-btn shipment-action-btn--icon"
                          title="In vận đơn"
                          onClick={() => onPrintShipment(row)}
                        >
                          <span className="material-symbols-outlined shipment-action-icon">
                            print
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`btn shipment-action-btn shipment-action-btn--icon ${
                            hasPickup
                              ? 'shipment-action-btn--pickup-done'
                              : 'shipment-action-btn--pickup'
                          }`}
                          title={
                            hasPickup
                              ? 'Đã tạo yêu cầu lấy hàng'
                              : 'Tạo yêu cầu lấy hàng (Pickup)'
                          }
                          disabled={hasPickup}
                          onClick={() => onCreatePickupForShipment(row.shipment.code)}
                        >
                          <span className="material-symbols-outlined shipment-action-icon">
                            {hasPickup ? 'check_circle' : 'local_shipping'}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="btn shipment-action-btn shipment-action-btn--icon shipment-action-btn--cancel"
                          title="Hủy đơn hàng"
                          onClick={() => onCancelShipment(row.shipment.code)}
                        >
                          <span className="material-symbols-outlined shipment-action-icon">
                            cancel
                          </span>
                        </button>
                      </div>
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
