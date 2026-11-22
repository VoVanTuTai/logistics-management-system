import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  Package,
  Printer,
  Search,
  ShieldCheck,
  Truck,
  User,
  X,
} from 'lucide-react';

import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { useTrackingDetailQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import {
  getOpsStatusBadgeStyle,
  resolveChargeableWeight,
  resolveInspectionPolicy,
  resolveParcelClassification,
  resolveShipmentStatusLabel,
} from './ShipmentsTable';
import './ShipmentDetailDrawer.css';

export interface ShipmentDetailDrawerProps {
  shipment: ShipmentListItemDto | null;
  onClose: () => void;
  onPrintLabel?: (shipment: ShipmentListItemDto) => void;
  deliveryCourierName?: string;
  primaryHubName?: string;
  oppositeHubName?: string;
}

export function ShipmentDetailDrawer({
  shipment,
  onClose,
  onPrintLabel,
  deliveryCourierName,
  primaryHubName,
  oppositeHubName,
}: ShipmentDetailDrawerProps): React.JSX.Element | null {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const trackingQuery = useTrackingDetailQuery(accessToken, shipment?.shipmentCode ?? '');

  if (!shipment) {
    return null;
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shipment.shipmentCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {}
  };

  const handleOpenIntegratedLookup = () => {
    navigate(
      `${routePaths.serviceQualityIntegratedLookup}?shipmentCode=${encodeURIComponent(shipment.shipmentCode)}`,
    );
  };

  const statusLabel = resolveShipmentStatusLabel(shipment);
  const statusBadgeStyle = getOpsStatusBadgeStyle(shipment.currentStatus);
  const classification = resolveParcelClassification(shipment);
  const chargeableWeightInfo = resolveChargeableWeight(shipment);
  const inspectionPolicy = resolveInspectionPolicy(shipment);

  const timelineEvents = trackingQuery.data?.timeline ?? [];

  return (
    <div className="ops-shipment-detail-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="ops-shipment-detail-drawer" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <header className="ops-shipment-detail-drawer__header">
          <div className="ops-shipment-detail-drawer__code-wrap">
            <div className="ops-shipment-detail-drawer__code">
              <span>{shipment.shipmentCode}</span>
              <button
                type="button"
                className="ops-shipment-detail-drawer__copy-btn"
                onClick={handleCopyCode}
                title="Sao chép mã vận đơn"
              >
                {copyFeedback ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                <span>{copyFeedback ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={statusBadgeStyle}>{statusLabel}</span>
              <span style={classification.badgeStyle}>{classification.label}</span>
              {shipment.requiresLabelReprint && (
                <span
                  style={{
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    border: '1px solid #fecdd3',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  Cần in lại tem
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="ops-shipment-detail-drawer__close-btn"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            title="Đóng (ESC)"
          >
            <X size={20} />
          </button>
        </header>

        {/* Body Content */}
        <div className="ops-shipment-detail-drawer__body">
          {/* Quick Jump Banner to Integrated Lookup */}
          <div
            className="ops-shipment-detail-drawer__jump-banner"
            onClick={handleOpenIntegratedLookup}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleOpenIntegratedLookup();
              }
            }}
            title="Mở toàn màn hình Tra cứu tích hợp: giải mã số điện thoại PII, xem ảnh ký nhận giao hàng POD, và hồ sơ sự cố NDR"
          >
            <div className="ops-shipment-detail-drawer__jump-info">
              <span className="ops-shipment-detail-drawer__jump-title">
                <ShieldCheck size={16} />
                <span>Mở Tra cứu tích hợp 360°</span>
              </span>
              <p className="ops-shipment-detail-drawer__jump-desc">
                Xem chi tiết người gửi/nhận, giải mã SĐT PII, trích xuất ảnh giao hàng thực tế (POD) &amp; hồ sơ sự cố
              </p>
            </div>
            <span className="ops-shipment-detail-drawer__jump-btn">
              <span>Mở tra cứu</span>
              <ExternalLink size={13} />
            </span>
          </div>

          {/* Card 1: Thông tin Giao nhận */}
          <section className="ops-shipment-detail-drawer__card">
            <h4 className="ops-shipment-detail-drawer__card-title">
              <User size={14} />
              <span>Thông tin Giao nhận</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="ops-shipment-detail-drawer__party-row">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ops-shipment-detail-drawer__item-label">Bên gửi (Shipper)</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                    {shipment.senderPhone || '---'}
                  </span>
                </div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shipment.senderName || '---'}</strong>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {shipment.senderAddress || [shipment.senderWard, shipment.senderDistrict, shipment.senderProvince].filter(Boolean).join(', ') || 'Chưa có địa chỉ gửi'}
                </span>
              </div>

              <div className="ops-shipment-detail-drawer__party-row">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ops-shipment-detail-drawer__item-label">Bên nhận (Consignee)</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                    {shipment.receiverPhone || '---'}
                  </span>
                </div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shipment.receiverName || '---'}</strong>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {shipment.receiverAddress || shipment.receiverRegion || 'Chưa có địa chỉ giao'}
                </span>
              </div>

              {shipment.deliveryNote && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#0369a1' }}>Ghi chú giao hàng: </span>
                  <span style={{ color: '#0c4a6e' }}>{shipment.deliveryNote}</span>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Quy chuẩn Hàng hóa & Cước phí */}
          <section className="ops-shipment-detail-drawer__card">
            <h4 className="ops-shipment-detail-drawer__card-title">
              <Package size={14} />
              <span>Quy chuẩn Kiện hàng &amp; Cước phí (Carrier SOP)</span>
            </h4>
            <div className="ops-shipment-detail-drawer__grid">
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Phân loại mặt hàng</span>
                <span className="ops-shipment-detail-drawer__item-value">
                  {classification.label}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Khối lượng tính cước (IATA)</span>
                <span className="ops-shipment-detail-drawer__item-value ops-shipment-detail-drawer__item-value--mono" style={{ color: '#0284c7' }}>
                  {chargeableWeightInfo.weightText}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Tiền thu hộ COD</span>
                <span className="ops-shipment-detail-drawer__item-value ops-shipment-detail-drawer__item-value--mono" style={{ color: '#dc2626' }}>
                  {typeof shipment.codAmount === 'number' ? `${shipment.codAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Cước vận chuyển</span>
                <span className="ops-shipment-detail-drawer__item-value ops-shipment-detail-drawer__item-value--mono" style={{ color: '#16a34a' }}>
                  {typeof shipment.shippingFee === 'number' ? `${shipment.shippingFee.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Chính sách đồng kiểm</span>
                <span className="ops-shipment-detail-drawer__item-value" style={{ color: '#475569' }}>
                  {inspectionPolicy}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Gói dịch vụ</span>
                <span className="ops-shipment-detail-drawer__item-value">
                  {shipment.serviceType || 'TIÊU CHUẨN'}
                </span>
              </div>
            </div>
          </section>

          {/* Card 3: Bưu cục & Tuyến phát */}
          <section className="ops-shipment-detail-drawer__card">
            <h4 className="ops-shipment-detail-drawer__card-title">
              <MapPin size={14} />
              <span>Bưu cục &amp; Tuyến phát</span>
            </h4>
            <div className="ops-shipment-detail-drawer__grid">
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Bưu cục đến / Quản lý</span>
                <span className="ops-shipment-detail-drawer__item-value ops-shipment-detail-drawer__item-value--mono" style={{ color: '#1e40af' }}>
                  {primaryHubName || shipment.receiverHubCode || shipment.destinationHubCode || '---'}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Hub gửi / Gốc</span>
                <span className="ops-shipment-detail-drawer__item-value ops-shipment-detail-drawer__item-value--mono" style={{ color: '#475569' }}>
                  {oppositeHubName || shipment.senderHubCode || shipment.originHubCode || '---'}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Bưu tá phụ trách</span>
                <span className="ops-shipment-detail-drawer__item-value">
                  {deliveryCourierName || (typeof shipment.metadata?.deliveryCourierName === 'string' ? shipment.metadata.deliveryCourierName : 'Chưa gán bưu tá')}
                </span>
              </div>
              <div className="ops-shipment-detail-drawer__item">
                <span className="ops-shipment-detail-drawer__item-label">Cập nhật lần cuối</span>
                <span className="ops-shipment-detail-drawer__item-value" style={{ fontSize: '12px' }}>
                  {formatDateTime(shipment.updatedAt)}
                </span>
              </div>
            </div>
          </section>

          {/* Card 4: Chuỗi vết quét & Dòng thời gian */}
          <section className="ops-shipment-detail-drawer__card">
            <h4 className="ops-shipment-detail-drawer__card-title">
              <Clock size={14} />
              <span>Chuỗi Vết quét &amp; Hành trình (Chain of Custody)</span>
            </h4>
            {timelineEvents.length > 0 ? (
              <div className="ops-shipment-detail-drawer__timeline">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="ops-shipment-detail-drawer__timeline-item">
                    <span
                      className="ops-shipment-detail-drawer__timeline-dot"
                      style={{
                        backgroundColor:
                          event.eventType === 'DELIVERED'
                            ? '#16a34a'
                            : event.eventType.includes('FAIL') || event.eventType.includes('NDR')
                            ? '#dc2626'
                            : '#0284c7',
                      }}
                    />
                    <div>
                      <strong style={{ color: '#0f172a' }}>{event.eventType}</strong>
                      <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>
                        {formatDateTime(event.occurredAt)}
                      </span>
                    </div>
                    {event.locationText && (
                      <div style={{ color: '#475569', fontSize: '11.5px', marginTop: '2px' }}>
                        Tại: {event.locationText}
                      </div>
                    )}
                    {event.note && (
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        {event.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <p style={{ margin: 0 }}>
                  Đơn tạo lúc: <strong>{formatDateTime(shipment.createdAt)}</strong>
                </p>
                <p style={{ margin: '4px 0 0 0' }}>
                  Trạng thái hiện tại: <strong>{statusLabel}</strong> (cập nhật {formatDateTime(shipment.updatedAt)})
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="ops-shipment-detail-drawer__footer">
          <div className="ops-shipment-detail-drawer__footer-left">
            {onPrintLabel && (
              <button
                type="button"
                className="ops-shipment-detail-drawer__btn ops-shipment-detail-drawer__btn--secondary"
                onClick={() => onPrintLabel(shipment)}
              >
                <Printer size={14} />
                <span>In tem</span>
              </button>
            )}
            <button
              type="button"
              className="ops-shipment-detail-drawer__btn ops-shipment-detail-drawer__btn--secondary"
              onClick={handleCopyCode}
            >
              <Copy size={14} />
              <span>{copyFeedback ? 'Đã sao chép' : 'Sao chép mã'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ops-shipment-detail-drawer__btn ops-shipment-detail-drawer__btn--primary"
              onClick={handleOpenIntegratedLookup}
            >
              <Search size={14} />
              <span>Tra cứu tích hợp 360°</span>
            </button>
            <button
              type="button"
              className="ops-shipment-detail-drawer__btn ops-shipment-detail-drawer__btn--secondary"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
