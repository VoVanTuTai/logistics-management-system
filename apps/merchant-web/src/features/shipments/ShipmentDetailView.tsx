import React from 'react';
import type {
  PickupRequest,
  ShipmentResponse,
  ShipmentRow,
  TimelineEvent,
  TrackingCurrent,
} from '../../types';
import { formatCurrency, formatDate, normalizeCode } from '../../api';

export interface ShipmentDetailViewProps {
  selectedShipment: ShipmentRow | null;
  pickupByShipmentCode: Map<string, PickupRequest>;
  detailReceiverPhone: string;
  detailReceiverAddress: string;
  detailDeliveryNote: string;
  detailUpdating: boolean;
  detailError: string | null;
  detailSuccess: string | null;
  detailTrackError: string | null;
  detailTrackTimeline: TimelineEvent[];
  detailTrackCurrent: TrackingCurrent | null;
  resolveShipmentStatusClass: (shipment: ShipmentResponse) => string;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
  resolveDeliveryInfoChangeBlockReason: (shipment: ShipmentRow) => string | null;
  onReceiverPhoneChange: (val: string) => void;
  onReceiverAddressChange: (val: string) => void;
  onDeliveryNoteChange: (val: string) => void;
  onSaveDetailUpdate: () => void | Promise<void>;
  onCancelShipment: (code: string) => void;
  onPrintShipment: (row: ShipmentRow) => void;
  onRequestReturn: (code: string) => void;
  onCreateClaim: (code: string) => void;
}

export function ShipmentDetailView({
  selectedShipment,
  pickupByShipmentCode,
  detailReceiverPhone,
  detailReceiverAddress,
  detailDeliveryNote,
  detailUpdating,
  detailError,
  detailSuccess,
  detailTrackError,
  detailTrackTimeline,
  detailTrackCurrent,
  resolveShipmentStatusClass,
  resolveShipmentStatusLabel,
  resolveDeliveryInfoChangeBlockReason,
  onReceiverPhoneChange,
  onReceiverAddressChange,
  onDeliveryNoteChange,
  onSaveDetailUpdate,
  onCancelShipment,
  onPrintShipment,
  onRequestReturn,
  onCreateClaim,
}: ShipmentDetailViewProps): React.JSX.Element {
  if (!selectedShipment) {
    return (
      <section className="grid">
        <div className="card">
          <div className="empty">Chưa chọn shipment.</div>
        </div>
      </section>
    );
  }

  const pickup = pickupByShipmentCode.get(normalizeCode(selectedShipment.shipment.code));
  const deliveryInfoChangeBlockReason = resolveDeliveryInfoChangeBlockReason(selectedShipment);

  return (
    <section className="grid">
      <div className="card">
        <h3>Chi tiết shipment {selectedShipment.shipment.code}</h3>
        <div className="details-grid">
          <div className="detail-box">
            <div className="label">Người gửi</div>
            <div>
              {selectedShipment.senderName}
              <br />
              {selectedShipment.senderPhone}
              <br />
              {selectedShipment.senderAddress}
            </div>
          </div>
          <div className="detail-box">
            <div className="label">Hub gửi</div>
            <div>
              {selectedShipment.senderHubCode}
              <br />
              {selectedShipment.senderWard}, {selectedShipment.senderProvince}
            </div>
          </div>
          <div className="detail-box">
            <div className="label">Người nhận</div>
            <div>
              {selectedShipment.receiverName}
              <br />
              {selectedShipment.receiverPhone}
              <br />
              {selectedShipment.receiverAddress}
            </div>
          </div>
          <div className="detail-box">
            <div className="label">Hub nhận</div>
            <div>
              {selectedShipment.receiverHubCode}
              <br />
              {selectedShipment.receiverWard}, {selectedShipment.receiverProvince}
            </div>
          </div>
          <div className="detail-box">
            <div className="label">Hàng hóa</div>
            <div>
              {selectedShipment.itemType}
              <br />
              {selectedShipment.weightKg}kg
            </div>
          </div>
          <div className="detail-box">
            <div className="label">COD / Phí</div>
            <div>
              {formatCurrency(selectedShipment.codAmount)}
              <br />
              {formatCurrency(selectedShipment.feeEstimate)}
            </div>
          </div>
          <div className="detail-box">
            <div className="label">Dịch vụ</div>
            <div>{selectedShipment.serviceType}</div>
          </div>
          <div className="detail-box">
            <div className="label">Pickup</div>
            <div>{pickup?.pickupCode ?? 'Chưa tạo pickup'}</div>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <span className={resolveShipmentStatusClass(selectedShipment.shipment)}>
            {resolveShipmentStatusLabel(selectedShipment.shipment)}
          </span>
          <button
            className="btn btn-danger"
            onClick={() => onCancelShipment(selectedShipment.shipment.code)}
          >
            Hủy đơn
          </button>
          <button className="btn btn-ghost" onClick={() => onPrintShipment(selectedShipment)}>
            In vận đơn
          </button>
        </div>
      </div>

      {/* KHỐI MINH BẠCH GIÁ CẢ & BÓC TÁCH CHI PHÍ (PRICE TRANSPARENCY) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--stitch-primary)' }}>receipt_long</span>
            <h3 style={{ margin: 0, fontSize: 16 }}>Minh bạch cước phí & Bảng kê chiết tính</h3>
          </div>
          <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            ✓ Đã chốt theo biểu phí hệ thống
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 8, marginBottom: 14, border: '1px solid #e2e8f0' }}>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Gói dịch vụ</div>
            <strong style={{ color: 'var(--stitch-primary)' }}>{selectedShipment.serviceType}</strong>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Tuyến vận chuyển</div>
            <strong>{selectedShipment.senderProvince || 'Bưu cục gửi'} ➔ {selectedShipment.receiverProvince || 'Bưu cục nhận'}</strong>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Trọng lượng tính cước</div>
            <strong>
              {selectedShipment.chargeableWeightKg ? `${selectedShipment.chargeableWeightKg} kg` : `${selectedShipment.weightKg} kg`}
              {selectedShipment.dimensionsText !== '0x0x0 cm' ? ` (KT: ${selectedShipment.dimensionsText})` : ''}
            </strong>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Khu vực cước</div>
            <strong>{selectedShipment.pricingZone || (selectedShipment.senderProvince === selectedShipment.receiverProvince ? 'Nội tỉnh (INTRA_PROVINCE)' : 'Liên tỉnh (INTER_PROVINCE)')}</strong>
          </div>
        </div>

        {selectedShipment.pricingBreakdown && selectedShipment.pricingBreakdown.length > 0 ? (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Khoản mục chi phí</th>
                  <th style={{ padding: '8px 12px' }}>Căn cứ tính cước</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Số tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {selectedShipment.pricingBreakdown.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px' }}>{item.label}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{item.basis || '-'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 12, background: '#fdf8f6', borderRadius: 8, border: '1px solid #fed7aa' }}>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Cước phí vận chuyển</div>
            <strong style={{ fontSize: 16, color: '#c2410c' }}>{formatCurrency(selectedShipment.feeEstimate)}</strong>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Tiền thu hộ COD</div>
            <strong style={{ fontSize: 16, color: '#047857' }}>+{formatCurrency(selectedShipment.codAmount)}</strong>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Thực nhận dự kiến đối soát</div>
            <strong style={{ fontSize: 16, color: '#0284c7' }}>
              {formatCurrency(selectedShipment.codAmount - selectedShipment.feeEstimate)}
            </strong>
          </div>
        </div>
      </div>

      <div className="card grid">
        <h3>Sửa đơn nếu còn cho phép</h3>
        <div className="grid grid-3">
          <input
            className="input"
            value={detailReceiverPhone}
            onChange={(e) => onReceiverPhoneChange(e.target.value)}
            placeholder="SĐT người nhận"
          />
          <input
            className="input"
            value={detailReceiverAddress}
            onChange={(e) => onReceiverAddressChange(e.target.value)}
            placeholder="Địa chỉ người nhận"
          />
          <input
            className="input"
            value={detailDeliveryNote}
            onChange={(e) => onDeliveryNoteChange(e.target.value)}
            placeholder="Ghi chú giao hàng"
          />
        </div>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            title={deliveryInfoChangeBlockReason ?? undefined}
            disabled={detailUpdating || Boolean(deliveryInfoChangeBlockReason)}
            onClick={() => {
              void onSaveDetailUpdate();
            }}
          >
            {detailUpdating ? 'Đang cập nhật...' : 'Sửa đơn'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onRequestReturn(selectedShipment.shipment.code)}
          >
            Yêu cầu hoàn hàng
          </button>
          <button
            className="btn btn-secondary"
            style={{
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
              color: '#b45309',
            }}
            onClick={() => onCreateClaim(selectedShipment.shipment.code)}
          >
            Khiếu nại / Bồi thường
          </button>
        </div>
        {detailError ? <p className="message error">{detailError}</p> : null}
        {detailSuccess ? <p className="message success">{detailSuccess}</p> : null}
      </div>

      <div className="card">
        <h3>Timeline xử lý đơn</h3>
        {detailTrackError ? <p className="message error">{detailTrackError}</p> : null}
        <div className="timeline">
          {detailTrackTimeline.length === 0 ? (
            <div className="empty">Chưa có tracking event.</div>
          ) : (
            detailTrackTimeline.map((ev) => (
              <div key={ev.id} className="timeline-item">
                <strong>{ev.eventType}</strong>
                <div className="muted">
                  {formatDate(ev.occurredAt)} | actor={ev.actor ?? 'system'} | loc=
                  {ev.locationText ?? ev.locationCode ?? 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
        {detailTrackCurrent ? (
          <p className="muted">
            Current: {detailTrackCurrent.currentStatus ?? 'N/A'} | Last event:{' '}
            {detailTrackCurrent.lastEventType ?? 'N/A'}
          </p>
        ) : null}
      </div>
    </section>
  );
}
