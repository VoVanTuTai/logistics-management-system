import React from 'react';
import type {
  PickupRequest,
  ShipmentResponse,
  ShipmentRow,
  TimelineEvent,
  TrackingCurrent,
} from '../../types';
import { formatCurrency, formatDate, normalizeCode, statusClass } from '../../api';
import { formatTrackingEventName, getTrackingEventIcon } from '../../utils/shipment.utils';

export interface TrackingLookupViewProps {
  trackingCode: string;
  trackingLoading: boolean;
  trackingError: string | null;
  shipments: ShipmentResponse[];
  shipmentRows: ShipmentRow[];
  trackingCurrent: TrackingCurrent | null;
  trackingShipmentRow: ShipmentRow | null;
  trackingPickupRequest: PickupRequest | null;
  trackingTimeline: TimelineEvent[];
  copiedTracking: boolean;
  resolveShipmentStatusClass: (shipment: ShipmentResponse) => string;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
  onTrackingCodeChange: (val: string) => void;
  onLookupTracking: (e?: React.FormEvent<HTMLFormElement>, explicitCode?: string) => void | Promise<void>;
  onSetCopiedTracking: (val: boolean) => void;
  onOpenShipmentDetail: (code: string) => void;
  onPrintShipment: (row: ShipmentRow) => void;
}

export function TrackingLookupView({
  trackingCode,
  trackingLoading,
  trackingError,
  shipments,
  shipmentRows,
  trackingCurrent,
  trackingShipmentRow,
  trackingPickupRequest,
  trackingTimeline,
  copiedTracking,
  resolveShipmentStatusClass,
  resolveShipmentStatusLabel,
  onTrackingCodeChange,
  onLookupTracking,
  onSetCopiedTracking,
  onOpenShipmentDetail,
  onPrintShipment,
}: TrackingLookupViewProps): React.JSX.Element {
  return (
    <>
      <section className="card tracking-search-card">
        <div className="tracking-search-card__header">
          <div>
            <p className="login-kicker">Tracking lookup</p>
            <h3>Tra cứu hành trình vận đơn</h3>
            <p className="muted">
              Nhập mã vận đơn bưu chính (Shipment Code) để tra cứu nhật ký phân loại và các mốc luân
              chuyển theo thời gian thực.
            </p>
          </div>
        </div>

        <form
          className="tracking-search-form"
          onSubmit={(e) => {
            void onLookupTracking(e);
          }}
        >
          <div className="tracking-search-input">
            <span className="material-symbols-outlined tracking-search-input__icon">search</span>
            <input
              className="input tracking-search-input__field"
              value={trackingCode}
              onChange={(e) => onTrackingCodeChange(e.target.value)}
              placeholder="Nhập mã vận đơn (VD: SHIP-123456789)"
            />
            {trackingCode ? (
              <button
                type="button"
                className="tracking-search-input__clear"
                title="Xóa mã"
                onClick={() => onTrackingCodeChange('')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : null}
          </div>
          <button
            className="btn btn-primary tracking-search-btn"
            type="submit"
            disabled={trackingLoading || !trackingCode.trim()}
          >
            <span className="material-symbols-outlined">search</span>
            <span>{trackingLoading ? 'Đang tra cứu...' : 'Tra cứu'}</span>
          </button>
        </form>

        {/* Quick Sample / Recent Shipments Suggestions */}
        {shipments.length > 0 ? (
          <div className="tracking-quick-suggestions">
            <span className="tracking-quick-label">
              <span className="material-symbols-outlined">schedule</span>
              Đơn hàng gần đây:
            </span>
            <div className="tracking-quick-chips">
              {shipments.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tracking-quick-chip ${
                    normalizeCode(trackingCode) === normalizeCode(s.code)
                      ? 'tracking-quick-chip--active'
                      : ''
                  }`}
                  onClick={() => {
                    onTrackingCodeChange(s.code);
                    void onLookupTracking(undefined, s.code);
                  }}
                >
                  <strong>{s.code}</strong>
                  <span>({resolveShipmentStatusLabel(s)})</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {trackingError ? (
          <div className="tracking-error-banner">
            <span className="material-symbols-outlined">error_outline</span>
            <div>
              <strong>Không tìm thấy dữ liệu vận đơn</strong>
              <p>{trackingError}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="tracking-summary-grid">
        <div className="card tracking-summary-card">
          <div className="tracking-summary-card__header">
            <span className="tracking-summary-card__label">Trạng thái hiện tại</span>
            <span className="material-symbols-outlined tracking-summary-card__icon">sync_alt</span>
          </div>
          <div className="tracking-summary-card__body">
            {trackingCurrent?.currentStatus || trackingShipmentRow ? (
              <span
                className={`status ${
                  trackingShipmentRow
                    ? resolveShipmentStatusClass(trackingShipmentRow.shipment)
                    : statusClass(trackingCurrent?.currentStatus ?? '')
                }`}
              >
                {trackingShipmentRow
                  ? resolveShipmentStatusLabel(trackingShipmentRow.shipment)
                  : trackingCurrent?.currentStatus ?? 'N/A'}
              </span>
            ) : (
              <h4 className="tracking-summary-card__placeholder">N/A</h4>
            )}
          </div>
        </div>

        <div className="card tracking-summary-card">
          <div className="tracking-summary-card__header">
            <span className="tracking-summary-card__label">Vị trí hiện tại</span>
            <span className="material-symbols-outlined tracking-summary-card__icon">location_on</span>
          </div>
          <div className="tracking-summary-card__body">
            <h4
              className={
                trackingCurrent?.currentLocationText ||
                trackingCurrent?.currentLocationCode ||
                trackingShipmentRow?.senderHubCode
                  ? 'tracking-summary-card__value'
                  : 'tracking-summary-card__placeholder'
              }
            >
              {trackingCurrent?.currentLocationText ??
                trackingCurrent?.currentLocationCode ??
                trackingShipmentRow?.senderHubCode ??
                'N/A'}
            </h4>
          </div>
        </div>

        <div className="card tracking-summary-card">
          <div className="tracking-summary-card__header">
            <span className="tracking-summary-card__label">Sự kiện cuối</span>
            <span className="material-symbols-outlined tracking-summary-card__icon">event_note</span>
          </div>
          <div className="tracking-summary-card__body">
            <h4
              className={
                trackingCurrent?.lastEventType
                  ? 'tracking-summary-card__value'
                  : 'tracking-summary-card__placeholder'
              }
            >
              {trackingCurrent?.lastEventType
                ? formatTrackingEventName(trackingCurrent.lastEventType)
                : 'N/A'}
            </h4>
          </div>
        </div>

        <div className="card tracking-summary-card">
          <div className="tracking-summary-card__header">
            <span className="tracking-summary-card__label">Thời điểm sự kiện cuối</span>
            <span className="material-symbols-outlined tracking-summary-card__icon">schedule</span>
          </div>
          <div className="tracking-summary-card__body">
            <h4
              className={
                trackingCurrent?.lastEventAt
                  ? 'tracking-summary-card__value'
                  : 'tracking-summary-card__placeholder'
              }
            >
              {trackingCurrent?.lastEventAt ? formatDate(trackingCurrent.lastEventAt) : '-'}
            </h4>
          </div>
        </div>
      </section>

      {!trackingShipmentRow && !trackingCurrent && trackingTimeline.length === 0 ? (
        <section className="card tracking-empty-stitch">
          <div className="tracking-empty-stitch__icon-wrap">
            <span className="material-symbols-outlined tracking-empty-stitch__icon">history</span>
          </div>
          <h4 className="tracking-empty-stitch__title">
            {trackingLoading ? 'Đang tra cứu dữ liệu...' : 'Chưa có timeline event.'}
          </h4>
          <p className="tracking-empty-stitch__desc muted">
            {trackingLoading
              ? 'Hệ thống đang kết nối và đồng bộ hành trình vận đơn từ mạng lưới hub & courier...'
              : 'Nhập mã vận đơn và nhấn "Tra cứu" để xem lịch sử hành trình chi tiết của đơn hàng này.'}
          </p>

          {shipments.length > 0 && !trackingLoading ? (
            <div className="tracking-empty-stitch__quick-panel">
              <div className="tracking-empty-stitch__quick-title">
                Hoặc chọn nhanh từ danh sách đơn hàng gần đây của bạn:
              </div>
              <div className="tracking-empty-stitch__quick-list">
                {shipments.slice(0, 5).map((s) => {
                  const sRow = shipmentRows.find((r) => r.shipment.id === s.id);
                  return (
                    <div key={s.id} className="tracking-empty-stitch__quick-item">
                      <div className="tracking-empty-stitch__quick-info">
                        <strong>{s.code}</strong>
                        <span>
                          {sRow
                            ? `${sRow.receiverName} · ${sRow.receiverProvince}`
                            : formatDate(s.createdAt)}
                        </span>
                      </div>
                      <span className={resolveShipmentStatusClass(s)}>
                        {resolveShipmentStatusLabel(s)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          onTrackingCodeChange(s.code);
                          void onLookupTracking(undefined, s.code);
                        }}
                      >
                        Tra cứu ngay
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="tracking-detail-layout">
          <div className="card tracking-order-card">
            <div className="tracking-order-card__header">
              <div>
                <p className="login-kicker">Shipment info</p>
                <h3>Thông tin đơn hàng</h3>
              </div>
              {trackingShipmentRow ? (
                <span className={resolveShipmentStatusClass(trackingShipmentRow.shipment)}>
                  {resolveShipmentStatusLabel(trackingShipmentRow.shipment)}
                </span>
              ) : null}
            </div>

            {!trackingShipmentRow ? (
              <div className="empty tracking-empty tracking-empty--compact">
                {trackingLoading
                  ? 'Đang tải thông tin đơn hàng...'
                  : 'Đơn hàng không thuộc danh sách quản lý trực tiếp của tài khoản, thông tin hành trình được đồng bộ từ mạng lưới bưu cục.'}
              </div>
            ) : (
              <>
                {/* Code & Quick Action Toolbar */}
                <div className="tracking-code-action-bar">
                  <div className="tracking-code-tag">
                    <span className="material-symbols-outlined">tag</span>
                    <strong>{trackingShipmentRow.shipment.code}</strong>
                    <button
                      type="button"
                      className="tracking-copy-btn"
                      title="Sao chép mã vận đơn"
                      onClick={() => {
                        void navigator.clipboard.writeText(trackingShipmentRow.shipment.code);
                        onSetCopiedTracking(true);
                        setTimeout(() => onSetCopiedTracking(false), 2000);
                      }}
                    >
                      <span className="material-symbols-outlined">
                        {copiedTracking ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedTracking ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="tracking-quick-action-btns">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="Xem chi tiết đơn hàng"
                      onClick={() => {
                        onOpenShipmentDetail(trackingShipmentRow.shipment.code);
                      }}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                      <span>Chi tiết</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="In vận đơn"
                      onClick={() => onPrintShipment(trackingShipmentRow)}
                    >
                      <span className="material-symbols-outlined">print</span>
                      <span>In đơn</span>
                    </button>
                  </div>
                </div>

                {/* Visual Route Flow: Sender -> Receiver */}
                <div className="tracking-route-flow">
                  <div className="tracking-route-node tracking-route-node--sender">
                    <div className="tracking-route-node__header">
                      <span className="material-symbols-outlined tracking-route-node__icon">
                        upload
                      </span>
                      <div>
                        <span className="tracking-route-node__kicker">Người gửi</span>
                        <strong className="tracking-route-node__name">
                          {trackingShipmentRow.senderName}
                        </strong>
                      </div>
                    </div>
                    <div className="tracking-route-node__phone">
                      <span className="material-symbols-outlined">call</span>
                      <span>{trackingShipmentRow.senderPhone}</span>
                    </div>
                    <div className="tracking-route-node__address">
                      <span className="material-symbols-outlined">place</span>
                      <span>
                        {trackingShipmentRow.senderAddress}, {trackingShipmentRow.senderWard},{' '}
                        {trackingShipmentRow.senderProvince}
                      </span>
                    </div>
                    {trackingShipmentRow.senderHubCode ? (
                      <div className="tracking-route-node__hub">
                        <span className="material-symbols-outlined">warehouse</span>
                        <span>
                          Hub gửi: <strong>{trackingShipmentRow.senderHubCode}</strong>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="tracking-route-connector">
                    <span className="material-symbols-outlined">arrow_forward</span>
                    <span className="tracking-route-connector__line"></span>
                  </div>

                  <div className="tracking-route-node tracking-route-node--receiver">
                    <div className="tracking-route-node__header">
                      <span className="material-symbols-outlined tracking-route-node__icon">
                        download
                      </span>
                      <div>
                        <span className="tracking-route-node__kicker">Người nhận</span>
                        <strong className="tracking-route-node__name">
                          {trackingShipmentRow.receiverName}
                        </strong>
                      </div>
                    </div>
                    <div className="tracking-route-node__phone">
                      <span className="material-symbols-outlined">call</span>
                      <span>{trackingShipmentRow.receiverPhone}</span>
                    </div>
                    <div className="tracking-route-node__address">
                      <span className="material-symbols-outlined">place</span>
                      <span>
                        {trackingShipmentRow.receiverAddress}, {trackingShipmentRow.receiverWard},{' '}
                        {trackingShipmentRow.receiverProvince}
                      </span>
                    </div>
                    {trackingShipmentRow.receiverHubCode ? (
                      <div className="tracking-route-node__hub">
                        <span className="material-symbols-outlined">warehouse</span>
                        <span>
                          Hub nhận: <strong>{trackingShipmentRow.receiverHubCode}</strong>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Package Specifications & Financials */}
                <div className="tracking-info-grid">
                  <div className="tracking-info-item">
                    <span>Dịch vụ</span>
                    <strong>{trackingShipmentRow.serviceType}</strong>
                  </div>
                  <div className="tracking-info-item">
                    <span>Khối lượng</span>
                    <strong>{trackingShipmentRow.weightKg} kg</strong>
                  </div>
                  <div className="tracking-info-item">
                    <span>Thu hộ (COD)</span>
                    <strong className="text-primary">
                      {formatCurrency(trackingShipmentRow.codAmount)}
                    </strong>
                  </div>
                  <div className="tracking-info-item">
                    <span>Cước phí</span>
                    <strong>{formatCurrency(trackingShipmentRow.feeEstimate)}</strong>
                  </div>
                  <div className="tracking-info-item">
                    <span>Yêu cầu lấy hàng</span>
                    <strong>{trackingPickupRequest?.pickupCode ?? 'Chưa tạo pickup'}</strong>
                  </div>
                  <div className="tracking-info-item">
                    <span>Ngày tạo đơn</span>
                    <strong>{formatDate(trackingShipmentRow.shipment.createdAt)}</strong>
                  </div>
                  {trackingShipmentRow.deliveryNote ? (
                    <div className="tracking-info-item tracking-info-item--wide tracking-info-item--note">
                      <span>Ghi chú giao hàng</span>
                      <strong>{trackingShipmentRow.deliveryNote}</strong>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Journey Timeline Stepper */}
          <div className="card tracking-timeline-card">
            <div className="tracking-timeline-card__header">
              <div>
                <p className="login-kicker">Journey</p>
                <h3>Hành trình vận đơn</h3>
              </div>
              <span className="badge tracking-status-badge">
                <span className="material-symbols-outlined">format_list_bulleted</span>
                {trackingTimeline.length} sự kiện
              </span>
            </div>

            <div className="tracking-progress">
              {trackingTimeline.length === 0 ? (
                <div className="empty tracking-empty">
                  {trackingLoading
                    ? 'Đang tải hành trình vận đơn...'
                    : 'Chưa có timeline event nào được ghi nhận.'}
                </div>
              ) : (
                <div className="tracking-stepper">
                  {trackingTimeline.map((ev, index) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={ev.id}
                        className={`tracking-stepper-node ${
                          isLatest ? 'tracking-stepper-node--latest' : ''
                        }`}
                      >
                        <div className="tracking-stepper-dot">
                          <span className="material-symbols-outlined">
                            {getTrackingEventIcon(ev.eventType)}
                          </span>
                        </div>
                        <div className="tracking-stepper-content">
                          <div className="tracking-stepper-header">
                            <div className="tracking-stepper-title-wrap">
                              <h4 className="tracking-stepper-title">
                                {formatTrackingEventName(ev.eventType)}
                              </h4>
                              {isLatest ? (
                                <span className="tracking-stepper-latest-badge">Mới nhất</span>
                              ) : null}
                            </div>
                            <span className="tracking-stepper-code-tag">{ev.eventType}</span>
                          </div>

                          {ev.statusAfterEvent ? (
                            <div className="tracking-stepper-status-after">
                              <span className="tracking-stepper-status-label">Trạng thái:</span>
                              <span className={statusClass(ev.statusAfterEvent)}>
                                {ev.statusAfterEvent}
                              </span>
                            </div>
                          ) : null}

                          <div className="tracking-stepper-meta">
                            <div className="tracking-stepper-meta-item" title="Thời điểm xảy ra">
                              <span className="material-symbols-outlined">schedule</span>
                              <span>{formatDate(ev.occurredAt)}</span>
                            </div>
                            <div className="tracking-stepper-meta-item" title="Địa điểm / Kho">
                              <span className="material-symbols-outlined">location_on</span>
                              <span>
                                {ev.locationText ?? ev.locationCode ?? 'Trạm trung chuyển'}
                              </span>
                            </div>
                            <div className="tracking-stepper-meta-item" title="Người thực hiện">
                              <span className="material-symbols-outlined">
                                {ev.actor ? 'person' : 'smart_toy'}
                              </span>
                              <span>{ev.actor ?? 'Hệ thống'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
