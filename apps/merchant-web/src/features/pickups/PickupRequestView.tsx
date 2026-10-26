import React from 'react';
import type { PickupRequest, ShipmentResponse, ShipmentRow } from '../../types';
import { formatDate, normalizeCode, statusClass } from '../../api';

export interface PickupRequestViewProps {
  pickupRows: PickupRequest[];
  pickups: PickupRequest[];
  pickupSelectableRows: ShipmentRow[];
  allPickupRowsSelected: boolean;
  selectedPickupCodeSet: Set<string>;
  selectedPickupRows: ShipmentRow[];
  selectedPickupWindowSummary: string;
  pickupLoading: boolean;
  pickupMessage: string | null;
  pickupStatusFilter: string;
  resolvePickupWindowForShipment: (row: ShipmentRow) => string;
  resolveShipmentStatusClass: (shipment: ShipmentResponse) => string;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
  resolvePickupCancelBlockReason: (item: PickupRequest) => string | null;
  resolveShipperForPickup: (item: PickupRequest) => string;
  onToggleAllPickupShipments: (checked: boolean) => void;
  onTogglePickupShipmentSelection: (shipmentCode: string, checked: boolean) => void;
  onSubmitPickupRequest: () => void | Promise<void>;
  onPickupStatusFilterChange: (status: string) => void;
  onCancelPickup: (item: PickupRequest) => void | Promise<void>;
}

export function PickupRequestView({
  pickupRows,
  pickups,
  pickupSelectableRows,
  allPickupRowsSelected,
  selectedPickupCodeSet,
  selectedPickupRows,
  selectedPickupWindowSummary,
  pickupLoading,
  pickupMessage,
  pickupStatusFilter,
  resolvePickupWindowForShipment,
  resolveShipmentStatusClass,
  resolveShipmentStatusLabel,
  resolvePickupCancelBlockReason,
  resolveShipperForPickup,
  onToggleAllPickupShipments,
  onTogglePickupShipmentSelection,
  onSubmitPickupRequest,
  onPickupStatusFilterChange,
  onCancelPickup,
}: PickupRequestViewProps): React.JSX.Element {
  return (
    <>
      <section className="card pickup-hero">
        <div className="pickup-hero__copy">
          <p className="login-kicker">Pickup flow</p>
          <h3>Tạo và quản lý yêu cầu lấy hàng</h3>
          <p className="muted">
            Tập hợp vận đơn, cấu hình thông tin lấy hàng và theo dõi toàn bộ pickup request trong cùng
            một giao diện điều phối.
          </p>
        </div>
        <div className="pickup-hero__stats">
          <span className="badge">Pickup hiện có: {pickupRows.length}</span>
          <span className="badge">Tổng pickup: {pickups.length}</span>
        </div>
      </section>
      <section className="card pickup-selection-card">
        <div className="pickup-form-card__header">
          <div>
            <p className="login-kicker">Available orders</p>
            <h3>Chọn đơn hàng cần lấy</h3>
          </div>
          <div className="pickup-form-card__note muted">
            Đơn tạo buổi sáng sẽ lấy trong ngày. Đơn tạo buổi chiều sẽ được lấy trước 12:00 trưa ngày
            mai.
          </div>
        </div>
        <div className="table-wrap pickup-table-wrap">
          <table className="pickup-table pickup-order-table">
            <thead>
              <tr>
                <th className="pickup-select-cell">
                  <input
                    aria-label="Chọn tất cả đơn hàng"
                    checked={allPickupRowsSelected}
                    className="pickup-checkbox"
                    disabled={pickupSelectableRows.length === 0}
                    type="checkbox"
                    onChange={(event) => onToggleAllPickupShipments(event.target.checked)}
                  />
                </th>
                <th>Mã vận đơn</th>
                <th>Người nhận</th>
                <th>Dịch vụ</th>
                <th>Khối lượng</th>
                <th>Ngày tạo</th>
                <th>Kho lấy</th>
                <th>Thời gian lấy hàng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pickupSelectableRows.map((row) => {
                const normalizedCode = normalizeCode(row.shipment.code);
                return (
                  <tr
                    key={row.shipment.id}
                    className={
                      selectedPickupCodeSet.has(normalizedCode)
                        ? 'pickup-order-row is-selected'
                        : 'pickup-order-row'
                    }
                  >
                    <td className="pickup-select-cell">
                      <input
                        aria-label={`Chọn đơn ${row.shipment.code}`}
                        checked={selectedPickupCodeSet.has(normalizedCode)}
                        className="pickup-checkbox"
                        type="checkbox"
                        onChange={(event) =>
                          onTogglePickupShipmentSelection(row.shipment.code, event.target.checked)
                        }
                      />
                    </td>
                    <td className="pickup-code-cell">{row.shipment.code}</td>
                    <td>
                      <div className="pickup-recipient">
                        <strong>{row.receiverName}</strong>
                        <small>
                          {row.receiverPhone} · {row.receiverAddress}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="shipment-service-chip">{row.serviceType}</span>
                    </td>
                    <td>{row.weightKg} kg</td>
                    <td>{formatDate(row.shipment.createdAt)}</td>
                    <td>{row.senderHubCode || '-'}</td>
                    <td className="pickup-window-cell">{resolvePickupWindowForShipment(row)}</td>
                    <td>
                      <span className={resolveShipmentStatusClass(row.shipment)}>
                        {resolveShipmentStatusLabel(row.shipment)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pickupSelectableRows.length === 0 ? (
          <div className="empty pickup-empty">
            Không có đơn hàng khả dụng để tạo yêu cầu lấy hàng.
          </div>
        ) : null}
        <div className="pickup-request-bar">
          <div>
            <strong>{selectedPickupRows.length} đơn đã chọn</strong>
            <p className="muted">{selectedPickupWindowSummary}</p>
          </div>
          <button
            className="btn btn-primary pickup-submit-btn"
            type="button"
            disabled={pickupLoading || selectedPickupRows.length === 0}
            onClick={() => {
              void onSubmitPickupRequest();
            }}
          >
            {pickupLoading ? 'Đang tạo...' : 'Yêu cầu lấy hàng'}
          </button>
        </div>
        {pickupMessage ? <p className="message">{pickupMessage}</p> : null}
      </section>
      <section className="card pickup-table-card">
        <div className="pickup-table-card__header">
          <div>
            <p className="login-kicker">Request list</p>
            <h3>Danh sách yêu cầu pickup</h3>
          </div>
          <div className="pickup-table-card__controls">
            <label className="label pickup-table-card__label">Trạng thái</label>
            <select
              className="select pickup-table-card__select"
              value={pickupStatusFilter}
              onChange={(e) => onPickupStatusFilterChange(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="REQUESTED">chờ duyệt</option>
              <option value="COMPLETED">đã lấy/hoàn tất</option>
              <option value="CANCELLED">đã hủy</option>
            </select>
          </div>
        </div>
        <div className="table-wrap pickup-table-wrap">
          <table className="pickup-table">
            <thead>
              <tr>
                <th>Mã lấy hàng</th>
                <th>Vận đơn</th>
                <th>Trạng thái</th>
                <th>Shipper</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pickupRows.map((item) => {
                const cancelBlockReason = resolvePickupCancelBlockReason(item);
                return (
                  <tr key={item.id}>
                    <td className="pickup-code-cell">{item.pickupCode}</td>
                    <td>{item.items.map((it) => it.shipmentCode).join(', ') || '-'}</td>
                    <td>
                      <span className={statusClass(item.status)}>{item.status}</span>
                    </td>
                    <td>
                      {(() => {
                        const shipperInfo = resolveShipperForPickup(item);
                        if (shipperInfo === 'Chưa gán') {
                          return <span className="pickup-shipper-chip">Chưa gán</span>;
                        }
                        return (
                          <span
                            className="pickup-shipper-chip"
                            style={{
                              borderColor: 'var(--stitch-primary)',
                              color: 'var(--stitch-primary)',
                              background: 'rgba(0, 89, 184, 0.08)',
                            }}
                          >
                            {shipperInfo}
                          </span>
                        );
                      })()}
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="pickup-actions">
                        <button
                          className="btn btn-danger pickup-action-btn"
                          title={cancelBlockReason ?? undefined}
                          disabled={Boolean(cancelBlockReason)}
                          onClick={() => {
                            void onCancelPickup(item);
                          }}
                        >
                          Hủy pickup
                        </button>
                        {cancelBlockReason ? (
                          <div className="muted pickup-action-note">{cancelBlockReason}</div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pickupRows.length === 0 ? (
          <div className="empty pickup-empty">Chưa có yêu cầu pickup phù hợp bộ lọc.</div>
        ) : null}
      </section>
    </>
  );
}
