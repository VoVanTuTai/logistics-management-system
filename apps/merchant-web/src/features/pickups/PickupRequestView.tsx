import React, { useMemo, useState } from 'react';
import type { PickupRequest, ShipmentResponse, ShipmentRow } from '../../types';
import { formatDate, normalizeCode, statusClass } from '../../api';

export interface PickupRequestViewProps {
  pickupRows: PickupRequest[];
  pickups: PickupRequest[];
  pickupSelectableRows: ShipmentRow[];
  shipmentRows?: ShipmentRow[];
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
  onNavigateToCreateShipment?: () => void;
  onNavigateToShipmentDetail?: (code: string) => void;
}

export function PickupRequestView({
  pickupRows,
  pickups,
  pickupSelectableRows,
  shipmentRows = [],
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
  onNavigateToCreateShipment,
  onNavigateToShipmentDetail,
}: PickupRequestViewProps): React.JSX.Element {
  const [viewingPickup, setViewingPickup] = useState<PickupRequest | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const shipmentByCode = useMemo(() => {
    const map = new Map<string, ShipmentRow>();
    for (const row of shipmentRows) {
      map.set(normalizeCode(row.shipment.code), row);
    }
    return map;
  }, [shipmentRows]);

  const handleCopyCodes = (codes: string[]) => {
    const text = codes.join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback(`Đã sao chép ${codes.length} mã vận đơn!`);
        setTimeout(() => setCopyFeedback(null), 2500);
      })
      .catch(() => {
        setCopyFeedback('Không thể sao chép');
        setTimeout(() => setCopyFeedback(null), 2500);
      });
  };

  return (
    <>
      <section className="card pickup-hero">
        <div className="pickup-hero__copy">
          <p className="login-kicker">Pickup flow</p>
          <h3>Tạo và quản lý yêu cầu lấy hàng</h3>
          <p className="muted">
            Tập hợp các vận đơn đã đóng gói, phát lệnh yêu cầu Bưu cục điều phối Shipper đến kho gom hàng
            và theo dõi tiến độ lấy hàng.
          </p>
        </div>
        <div className="pickup-hero__stats">
          <span className="badge">Đơn chờ lấy: {pickupSelectableRows.length}</span>
          <span className="badge">Phiếu pickup: {pickups.length}</span>
        </div>
      </section>

      <section className="card pickup-selection-card">
        <div className="pickup-form-card__header">
          <div>
            <p className="login-kicker">Available orders</p>
            <h3>Chọn đơn hàng cần lấy</h3>
          </div>
          <div className="pickup-form-card__note muted">
            Đơn tạo buổi sáng sẽ lấy trong ngày. Đơn tạo buổi chiều sẽ được lấy trước 12:00 trưa ngày mai.
          </div>
        </div>

        <div className="pickup-domain-hint">
          <span className="material-symbols-outlined pickup-domain-hint__icon">verified_user</span>
          <span>
            <strong>Quy chuẩn bưu cục:</strong> Chỉ hiển thị các đơn mới tạo hoặc chờ lấy hàng. Đơn đã bàn giao, đang luân chuyển, đã giao hoặc đã hủy được tự động loại trừ khỏi danh sách để tránh điều phối trùng lặp.
          </span>
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
                    <td className="pickup-code-cell">
                      <span className="monospace-code tracking-code-cell">
                        {row.shipment.code}
                      </span>
                    </td>
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
            <span className="material-symbols-outlined pickup-empty__icon">inventory_2</span>
            <h4>Hiện không có đơn hàng nào chờ lấy</h4>
            <p className="muted">
              Tất cả các đơn hàng đã được đưa vào phiếu lấy hàng hoặc đang trong hành trình vận chuyển.
            </p>
            {onNavigateToCreateShipment ? (
              <button
                type="button"
                className="btn btn-primary pickup-empty__cta"
                onClick={onNavigateToCreateShipment}
              >
                + Tạo đơn hàng mới
              </button>
            ) : null}
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
            {pickupLoading ? 'Đang tạo...' : `Yêu cầu lấy hàng (${selectedPickupRows.length})`}
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
                    <td className="pickup-code-cell">
                      <span className="monospace-code tracking-code-cell">
                        {item.pickupCode}
                      </span>
                    </td>
                    <td className="pickup-parcels-cell">
                      <div className="pickup-parcels-summary">
                        <button
                          type="button"
                          className="pickup-parcel-badge"
                          title="Bấm để xem danh sách chi tiết các vận đơn trong phiếu này"
                          onClick={() => setViewingPickup(item)}
                        >
                          <span className="material-symbols-outlined pickup-parcel-icon">inventory_2</span>
                          <strong>{item.items.length} kiện</strong>
                        </button>
                        <span
                          className="pickup-parcel-first-code monospace-code"
                          title={item.items.map((it) => it.shipmentCode).join(', ')}
                        >
                          {item.items[0]?.shipmentCode || '-'}
                          {item.items.length > 1 ? ` (+${item.items.length - 1})` : ''}
                        </span>
                        <button
                          type="button"
                          className="pickup-view-parcels-btn"
                          title="Mở popup xem tất cả vận đơn"
                          onClick={() => setViewingPickup(item)}
                        >
                          Xem danh sách
                        </button>
                      </div>
                    </td>
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

      {/* Modal chi tiết danh sách vận đơn của phiếu lấy hàng */}
      {viewingPickup ? (
        <div className="ops-modal-backdrop" onClick={() => setViewingPickup(null)}>
          <div
            className="ops-modal-card ops-modal-card--lg pickup-parcels-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pickup-parcels-modal__header">
              <div>
                <span className="pickup-parcels-modal__kicker">DANH SÁCH VẬN ĐƠN TRONG PHIẾU LẤY HÀNG</span>
                <h3 className="pickup-parcels-modal__title">
                  Phiếu lấy hàng <span className="monospace-code text-primary">{viewingPickup.pickupCode}</span>
                </h3>
                <div className="pickup-parcels-modal__tags">
                  <span className="badge">
                    <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>inventory_2</span>
                    {viewingPickup.items.length} kiện hàng
                  </span>
                  <span className={statusClass(viewingPickup.status)}>
                    {viewingPickup.status}
                  </span>
                  <span className="badge">
                    <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>person</span>
                    Shipper: {resolveShipperForPickup(viewingPickup)}
                  </span>
                  <span className="badge">
                    <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>schedule</span>
                    {formatDate(viewingPickup.createdAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="ops-modal-close-btn"
                aria-label="Đóng modal"
                onClick={() => setViewingPickup(null)}
              >
                ✕
              </button>
            </div>

            <div className="pickup-parcels-modal__actions">
              <button
                type="button"
                className="btn btn-secondary pickup-modal-copy-btn"
                onClick={() => handleCopyCodes(viewingPickup.items.map((it) => it.shipmentCode))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                Sao chép tất cả mã ({viewingPickup.items.length})
              </button>
              {copyFeedback ? (
                <span className="pickup-modal-copy-feedback">{copyFeedback}</span>
              ) : null}
            </div>

            <div className="table-wrap pickup-parcels-modal__table-wrap">
              <table className="pickup-table pickup-parcels-modal-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>STT</th>
                    <th>Mã vận đơn</th>
                    <th>Người nhận</th>
                    <th>Dịch vụ & Khối lượng</th>
                    <th>Thu hộ COD</th>
                    <th>Trạng thái hiện tại</th>
                    {onNavigateToShipmentDetail ? <th style={{ textAlign: 'center' }}>Chi tiết</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {viewingPickup.items.map((item, idx) => {
                    const row = shipmentByCode.get(normalizeCode(item.shipmentCode));
                    return (
                      <tr key={item.id || item.shipmentCode}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td className="pickup-code-cell">
                          <span className="monospace-code tracking-code-cell">
                            {item.shipmentCode}
                          </span>
                        </td>
                        <td>
                          {row ? (
                            <div className="pickup-recipient">
                              <strong>{row.receiverName}</strong>
                              <small>{row.receiverPhone} · {row.receiverAddress}</small>
                            </div>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row ? (
                            <div>
                              <span className="shipment-service-chip">{row.serviceType}</span>
                              <span className="muted" style={{ marginLeft: 6 }}>{row.weightKg} kg</span>
                            </div>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row ? (
                            <strong>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.codAmount)}
                            </strong>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row ? (
                            <span className={resolveShipmentStatusClass(row.shipment)}>
                              {resolveShipmentStatusLabel(row.shipment)}
                            </span>
                          ) : (
                            <span className="badge">Đã liên kết</span>
                          )}
                        </td>
                        {onNavigateToShipmentDetail ? (
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setViewingPickup(null);
                                onNavigateToShipmentDetail(item.shipmentCode);
                              }}
                            >
                              Xem đơn
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pickup-parcels-modal__footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setViewingPickup(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
