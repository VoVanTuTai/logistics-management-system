import React from 'react';
import type {
  CreateShipmentForm,
  HubLocationOption,
  MerchantProfile,
  MerchantProfileConfigPayload,
  MerchantSession,
  PricingQuoteResponse,
  ShipmentDraft,
  ViewId,
} from '../../types';
import { formatCurrency, formatDate } from '../../api';
import { normalizeCreateForm } from '../../utils/shipment.utils';

export interface CreateShipmentViewProps {
  hubLocations: HubLocationOption[];
  lockedSenderHub: HubLocationOption | null;
  profile: MerchantProfile;
  session: MerchantSession;
  createForm: CreateShipmentForm;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateShipmentForm>>;
  provinceOptions: string[];
  receiverHubOptions: HubLocationOption[];
  selectedReceiverHub: HubLocationOption | null;
  pricingQuote: PricingQuoteResponse | null;
  effectiveFee: number;
  codAmount: number;
  showMerchantFormulaHelp: boolean;
  setShowMerchantFormulaHelp: (val: boolean) => void;
  quoteLoading: boolean;
  createLoading: boolean;
  quoteError: string | null;
  createError: string | null;
  createSuccess: string | null;
  insights: {
    isNegativeBalanceLocked: boolean;
    netBalance: number;
  };
  draftName: string;
  setDraftName: (val: string) => void;
  drafts: ShipmentDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<ShipmentDraft[]>>;
  merchantProfileConfig: MerchantProfileConfigPayload | null;
  setQuotedFee: (val: number | null) => void;
  quoteCreateShipmentFee: () => void | Promise<void>;
  saveDraft: () => void;
  submitCreateShipment: (requestPickupNow: boolean) => void | Promise<void>;
  onNavigateView: (view: ViewId) => void;
  findHubByCode: (locations: HubLocationOption[], code?: string | null) => HubLocationOption | null;
}

export function CreateShipmentView({
  hubLocations,
  lockedSenderHub,
  profile,
  session,
  createForm,
  setCreateForm,
  provinceOptions,
  receiverHubOptions,
  selectedReceiverHub,
  pricingQuote,
  effectiveFee,
  codAmount,
  showMerchantFormulaHelp,
  setShowMerchantFormulaHelp,
  quoteLoading,
  createLoading,
  quoteError,
  createError,
  createSuccess,
  insights,
  draftName,
  setDraftName,
  drafts,
  setDrafts,
  merchantProfileConfig,
  setQuotedFee,
  quoteCreateShipmentFee,
  saveDraft,
  submitCreateShipment,
  onNavigateView,
  findHubByCode,
}: CreateShipmentViewProps): React.JSX.Element {
  return (
    <section className="create-shipment-bento">
      <div className="bento-left-stack">
        {hubLocations.length === 0 ? (
          <p className="message error">
            Chưa có hub hợp lệ. Admin cần tạo hub trước để merchant chọn địa chỉ gửi/nhận.
          </p>
        ) : null}
        {hubLocations.length > 0 && !lockedSenderHub ? (
          <p className="message error">
            Tài khoản này chưa được admin gán khu vực/bưu cục gửi. Vui lòng liên hệ admin để cập nhật.
          </p>
        ) : null}

        {/* THẺ 1: KHO LẤY HÀNG (CỐ ĐỊNH THEO HỢP ĐỒNG) - READ-ONLY */}
        <section className="contract-pickup-card">
          <div className="contract-pickup-header">
            <div>
              <div className="contract-pickup-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  verified
                </span>
                <span>Kho lấy hàng cố định</span>
              </div>
              <h3
                style={{
                  margin: '8px 0 0',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--stitch-on-surface)',
                }}
              >
                Điểm lấy hàng hợp đồng
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateView('account')}
              title="Đến mục Hồ sơ để sửa đổi địa chỉ kho và đồng bộ lại tọa độ"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                edit_location_alt
              </span>
              <span>Thay đổi tại Hồ sơ</span>
            </button>
          </div>

          <div className="contract-pickup-grid">
            <div className="contract-pickup-item">
              <span className="contract-pickup-label">Tên cửa hàng / Người gửi</span>
              <span className="contract-pickup-value">
                {profile.shopName || session.user.displayName || session.user.username}
              </span>
            </div>
            <div className="contract-pickup-item">
              <span className="contract-pickup-label">Số điện thoại liên hệ</span>
              <span className="contract-pickup-value">
                {profile.contactPhone || session.user.phone || 'Chưa cập nhật'}
              </span>
            </div>
            <div className="contract-pickup-item contract-pickup-full-address">
              <span className="contract-pickup-label">Địa chỉ kho lấy hàng</span>
              <div
                className="contract-pickup-value"
                style={{ marginTop: '4px', fontSize: '13px', lineHeight: '1.5' }}
              >
                {profile.defaultPickupAddress ||
                  createForm.senderAddress ||
                  lockedSenderHub?.fullAddress ||
                  'Chưa thiết lập địa chỉ kho'}
              </div>
            </div>
            <div className="contract-pickup-item">
              <span className="contract-pickup-label">Khu vực & Bưu cục phụ trách</span>
              <span className="contract-pickup-value">
                {lockedSenderHub
                  ? `${lockedSenderHub.hubName} (${lockedSenderHub.hubCode}) - ${lockedSenderHub.province}`
                  : 'Chưa gán bưu cục'}
              </span>
            </div>
            <div className="contract-pickup-item">
              <span className="contract-pickup-label">Phương thức điều phối</span>
              <span className="contract-pickup-value" style={{ color: 'var(--stitch-primary)' }}>
                Tự động gom & phân công tài xế (Auto-dispatch)
              </span>
            </div>
          </div>

          <div className="pickup-gps-badge">
            <span className="gps-indicator-dot" />
            <span>Tọa độ GPS điều phối: </span>
            <strong>
              {profile.latitude && profile.longitude
                ? `${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`
                : lockedSenderHub?.latitude && lockedSenderHub?.longitude
                ? `${lockedSenderHub.latitude.toFixed(5)}, ${lockedSenderHub.longitude.toFixed(5)}`
                : 'Đang xác định'}
            </strong>
            <span
              className="gps-verified-tag"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                verified
              </span>
              Đã liên kết hợp đồng
            </span>
          </div>

          <div className="contract-pickup-notice">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              lock
            </span>
            <span>
              Địa chỉ lấy hàng được cố định theo hồ sơ đăng ký để đảm bảo điều phối tài xế chính xác.
            </span>
          </div>
        </section>

        {/* THẺ 2: THÔNG TIN NGƯỜI NHẬN HÀNG */}
        <section className="form-section-card">
          <div className="form-section-header">
            <div className="form-section-title-group">
              <div className="form-section-icon">
                <span className="material-symbols-outlined">person_pin_circle</span>
              </div>
              <div>
                <h3>Thông tin người nhận</h3>
                <p className="form-section-subtitle">Nhập thông tin người nhận và bưu cục phát hàng</p>
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="field-label">
                <span>
                  Họ và tên người nhận <span className="field-required">*</span>
                </span>
              </label>
              <input
                className="input"
                placeholder="Nguyễn Văn A"
                value={createForm.receiverName}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    receiverName: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">
                <span>
                  Số điện thoại <span className="field-required">*</span>
                </span>
              </label>
              <input
                className="input"
                placeholder="0912345678"
                value={createForm.receiverPhone}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    receiverPhone: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">
                <span>
                  Tỉnh / Thành phố nhận <span className="field-required">*</span>
                </span>
              </label>
              <select
                className="select"
                value={createForm.receiverProvince}
                onChange={(event) => {
                  const receiverProvince = event.target.value;
                  setCreateForm((previous) => ({
                    ...previous,
                    receiverProvince,
                    receiverWard: '',
                    receiverHubCode: '',
                    receiverRegion: receiverProvince,
                    receiverAddress: '',
                  }));
                }}
              >
                <option value="">Chọn Tỉnh / Thành phố nhận</option>
                {provinceOptions.map((province) => (
                  <option key={'receiver-' + province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label className="field-label">
                <span>
                  Phường / Xã & Bưu cục phát <span className="field-required">*</span>
                </span>
              </label>
              <select
                className="select"
                value={selectedReceiverHub?.hubCode ?? ''}
                disabled={!createForm.receiverProvince}
                onChange={(event) => {
                  const selectedHub = findHubByCode(hubLocations, event.target.value);
                  setCreateForm((previous) => ({
                    ...previous,
                    receiverWard: selectedHub?.ward ?? '',
                    receiverHubCode: selectedHub?.hubCode ?? '',
                    receiverRegion: createForm.receiverProvince,
                  }));
                }}
              >
                <option value="">Chọn phường/xã và bưu cục phụ trách</option>
                {receiverHubOptions.map((location) => (
                  <option key={'receiver-hub-' + location.hubCode} value={location.hubCode}>
                    {location.ward} - {location.hubName} ({location.hubCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group form-field-group--span-2">
              <label className="field-label">
                <span>
                  Địa chỉ chi tiết người nhận <span className="field-required">*</span>
                </span>
                <span className="field-hint">Số nhà, ngõ ngách, tên đường/tòa nhà</span>
              </label>
              <input
                className="input"
                placeholder="Ví dụ: Tòa nhà Landmark 81, 720A Điện Biên Phủ"
                value={createForm.receiverAddressDetail}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    receiverAddressDetail: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field-group form-field-group--span-2">
              <label className="field-label">
                <span>Ghi chú giao hàng</span>
                <span className="field-hint">Chỉ dẫn cho tài xế giao hàng</span>
              </label>
              <textarea
                className="textarea"
                style={{ minHeight: '80px' }}
                placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao, cho khách kiểm tra hàng..."
                value={createForm.deliveryNote}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    deliveryNote: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* THẺ 3: THÔNG TIN KIỆN HÀNG & DỊCH VỤ */}
        <section className="form-section-card">
          <div className="form-section-header">
            <div className="form-section-title-group">
              <div className="form-section-icon">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <h3>Kiện hàng & Dịch vụ</h3>
                <p className="form-section-subtitle">
                  Thông số kích thước, tiền thu hộ và gói dịch vụ vận chuyển
                </p>
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="field-label">
                <span>Loại hàng hóa / Tên sản phẩm</span>
              </label>
              <input
                className="input"
                placeholder="Thời trang, mỹ phẩm, đồ gia dụng..."
                value={createForm.itemType}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    itemType: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">
                <span>Gói cước dịch vụ</span>
              </label>
              <select
                className="select"
                value={createForm.serviceType}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    serviceType: event.target.value as CreateShipmentForm['serviceType'],
                  }))
                }
              >
                <option value="STANDARD">STANDARD - Tiết kiệm tiêu chuẩn</option>
                <option value="EXPRESS">EXPRESS - Chuyển phát nhanh</option>
                <option value="SAME_DAY">SAME_DAY - Giao hỏa tốc trong ngày</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="field-label">
                <span>Chính sách đồng kiểm (Quyền xem hàng)</span>
                <span className="field-hint">Quy định quyền mở hàng của người nhận</span>
              </label>
              <select
                className="select"
                value={createForm.inspectionPolicy ?? 'VIEW_ONLY'}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    inspectionPolicy: event.target.value as CreateShipmentForm['inspectionPolicy'],
                  }))
                }
              >
                <option value="VIEW_ONLY">Cho xem hàng, không thử (Mặc định)</option>
                <option value="NONE">Không cho xem hàng (Thu COD trước khi mở)</option>
                <option value="TRY_ON">Cho thử hàng (Thử đồ / Kiểm tra hoạt động 5 phút)</option>
              </select>
            </div>

            <div className="form-field-group form-field-group--span-2">
              <label className="field-label">
                <span>Tiền thu hộ COD (VNĐ)</span>
                <span className="field-hint">
                  Số tiền tài xế cần thu khi giao hàng (để 0 nếu đã thanh toán)
                </span>
              </label>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={createForm.codAmount}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    codAmount: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field-group form-field-group--span-2">
              <label className="field-label">
                <span>Khối lượng & Kích thước kiện hàng</span>
                <span className="field-hint">Hệ thống tự tính trọng lượng quy đổi thể tích</span>
              </label>
              <div className="form-grid-4">
                <div className="form-field-group">
                  <input
                    className="input"
                    placeholder="Khối lượng (kg)"
                    value={createForm.weightKg}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        weightKg: event.target.value,
                      }))
                    }
                    title="Khối lượng (kg)"
                  />
                </div>
                <div className="form-field-group">
                  <input
                    className="input"
                    placeholder="Dài (cm)"
                    value={createForm.lengthCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        lengthCm: event.target.value,
                      }))
                    }
                    title="Chiều dài (cm)"
                  />
                </div>
                <div className="form-field-group">
                  <input
                    className="input"
                    placeholder="Rộng (cm)"
                    value={createForm.widthCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        widthCm: event.target.value,
                      }))
                    }
                    title="Chiều rộng (cm)"
                  />
                </div>
                <div className="form-field-group">
                  <input
                    className="input"
                    placeholder="Cao (cm)"
                    value={createForm.heightCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        heightCm: event.target.value,
                      }))
                    }
                    title="Chiều cao (cm)"
                  />
                </div>
              </div>

              <div className="dimension-summary-box">
                <span>
                  Quy đổi thể tích (D x R x C / 6000):{' '}
                  <strong className="dimension-summary-highlight">
                    {(
                      (Number(createForm.lengthCm || 0) *
                        Number(createForm.widthCm || 0) *
                        Number(createForm.heightCm || 0)) /
                      6000
                    ).toFixed(2)}{' '}
                    kg
                  </strong>
                </span>
                <span>
                  Khối lượng thực tế:{' '}
                  <strong className="dimension-summary-highlight">
                    {Number(createForm.weightKg || 0).toFixed(2)} kg
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BENTO RIGHT STACK: TÓM TẮT CƯỚC, ACTIONS, & NHÁP ĐÃ LƯU */}
      <div className="bento-right-stack">
        <section className="order-summary-card">
          <div className="order-summary-header">
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--stitch-primary)' }}
            >
              receipt_long
            </span>
            <h3>Chi phí & Báo giá</h3>
          </div>

          <div className="summary-rows-stack">
            <div className="summary-row">
              <span>Gói dịch vụ</span>
              <strong style={{ color: 'var(--stitch-primary)' }}>{createForm.serviceType}</strong>
            </div>
            <div className="summary-row">
              <span>Hub lấy hàng</span>
              <strong>{lockedSenderHub ? `${lockedSenderHub.hubCode}` : 'Chưa gán'}</strong>
            </div>
            <div className="summary-row">
              <span>Hub phát hàng</span>
              <strong>{createForm.receiverHubCode || 'Chưa chọn'}</strong>
            </div>

            {/* Khối phân tích trọng lượng IATA */}
            <div className="summary-weight-breakdown-box">
              <div className="summary-weight-row">
                <span>
                  Cân thực: <strong>{Number(createForm.weightKg || 0).toFixed(2)} kg</strong>
                </span>
                <span>
                  Thể tích:{' '}
                  <strong>
                    {(
                      (Number(createForm.lengthCm || 0) *
                        Number(createForm.widthCm || 0) *
                        Number(createForm.heightCm || 0)) /
                      6000
                    ).toFixed(2)}{' '}
                    kg
                  </strong>
                </span>
              </div>
              <div className="summary-weight-highlight">
                <span>Khối lượng tính cước:</span>
                <strong style={{ color: 'var(--stitch-primary)', fontSize: '13px' }}>
                  {Math.max(
                    Number(createForm.weightKg || 0),
                    Number(
                      (
                        (Number(createForm.lengthCm || 0) *
                          Number(createForm.widthCm || 0) *
                          Number(createForm.heightCm || 0)) /
                        6000
                      ).toFixed(2),
                    ),
                  ).toFixed(2)}{' '}
                  kg
                </strong>
              </div>
            </div>

            {/* Chi tiết từng khoản phí nếu có quote breakdown */}
            {pricingQuote?.breakdown && pricingQuote.breakdown.length > 0 ? (
              <div className="summary-breakdown-items">
                {pricingQuote.breakdown.map((item, idx) => (
                  <div key={idx} className="summary-row summary-row-sub">
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="summary-row">
                <span>Cước phí ước tính</span>
                <strong>{formatCurrency(effectiveFee)}</strong>
              </div>
            )}

            <div className="summary-row">
              <span>Tiền thu hộ COD</span>
              <strong>{formatCurrency(codAmount)}</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng cước tạm tính</span>
              <span className="summary-total-fee">{formatCurrency(effectiveFee)}</span>
            </div>

            {/* Nút bấm & Hộp giải thích công thức chuẩn bưu chính */}
            <div className="summary-formula-box">
              <button
                type="button"
                className="summary-formula-btn"
                onClick={() => setShowMerchantFormulaHelp(!showMerchantFormulaHelp)}
              >
                <span>
                  {showMerchantFormulaHelp ? 'Thu gọn thuyết minh' : 'Chi tiết công thức chiết tính'}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {showMerchantFormulaHelp ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showMerchantFormulaHelp ? (
                <div className="summary-formula-popover">
                  <div className="summary-formula-item">
                    <strong>Khối lượng tính cước (Chuẩn IATA)</strong>
                    <code>max(Cân thực, (D×R×C)/6000)</code>
                  </div>
                  <div className="summary-formula-item">
                    <strong>Cơ chế lũy tiến</strong>
                    <span>Cước cơ sở (0.5kg đầu) + Nấc 0.5kg vượt + Phụ phí tuyến vùng miền.</span>
                  </div>
                  <div className="summary-formula-item">
                    <strong>Bảo mật thông tin Người nhận</strong>
                    <span>
                      Người nhận chỉ thấy số tiền COD cần thanh toán, hoàn toàn bảo mật biểu phí chi
                      tiết của Shop.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="summary-actions-grid">
            <div className="btn-secondary-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={quoteLoading}
                onClick={() => {
                  void quoteCreateShipmentFee();
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  calculate
                </span>
                <span>{quoteLoading ? 'Đang tính...' : 'Tính phí'}</span>
              </button>
              <button type="button" className="btn btn-ghost" onClick={saveDraft}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  save
                </span>
                <span>Lưu nháp</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-primary-action"
              disabled={
                createLoading ||
                hubLocations.length === 0 ||
                !lockedSenderHub ||
                insights.isNegativeBalanceLocked
              }
              onClick={() => {
                void submitCreateShipment(false);
              }}
            >
              <span className="material-symbols-outlined">add_task</span>
              <span>{createLoading ? 'Đang xử lý...' : 'Tạo đơn hàng'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-primary-action"
              style={{
                background: 'linear-gradient(135deg, #0052cc 0%, #0c56d0 100%)',
                boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)',
              }}
              disabled={
                createLoading ||
                hubLocations.length === 0 ||
                !lockedSenderHub ||
                insights.isNegativeBalanceLocked
              }
              onClick={() => {
                void submitCreateShipment(true);
              }}
            >
              <span className="material-symbols-outlined">electric_bolt</span>
              <span>Tạo đơn & Yêu cầu lấy ngay</span>
            </button>
          </div>

          {insights.isNegativeBalanceLocked ? (
            <p className="message error" style={{ marginTop: '14px' }}>
              Tài khoản đang vượt hạn mức nợ cước ({formatCurrency(insights.netBalance)} &lt;
              -500.000đ). Vui lòng thanh toán cước qua VietQR để mở khóa tạo đơn.
            </p>
          ) : null}
          {quoteError ? (
            <p className="message error" style={{ marginTop: '14px' }}>
              {quoteError}
            </p>
          ) : null}
          {createError ? (
            <p className="message error" style={{ marginTop: '14px' }}>
              {createError}
            </p>
          ) : null}
          {createSuccess ? (
            <p className="message success" style={{ marginTop: '14px' }}>
              {createSuccess}
            </p>
          ) : null}
        </section>

        {/* DANH SÁCH BẢN NHÁP */}
        <section className="form-section-card" style={{ padding: '20px' }}>
          <div
            className="order-summary-header"
            style={{ marginBottom: '14px', paddingBottom: '10px' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--stitch-primary)' }}>
              draft
            </span>
            <h3 style={{ fontSize: '15px' }}>Nháp đã lưu</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              className="input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Tên bản nháp..."
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>

          {drafts.length === 0 ? (
            <div className="empty" style={{ padding: '16px', fontSize: '13px' }}>
              Chưa có nháp nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drafts.slice(0, 5).map((draft) => (
                <div
                  key={draft.id}
                  style={{
                    background: 'var(--stitch-surface-container-low)',
                    border: '1px solid var(--stitch-surface-container-high)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <strong style={{ fontSize: '13px', color: 'var(--stitch-on-surface)' }}>
                      {draft.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--stitch-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(draft.quoteFee)}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: '11px', color: 'var(--stitch-on-surface-variant)' }}
                  >
                    {formatDate(draft.createdAt)}
                  </div>
                  <div className="btn-row" style={{ marginTop: '4px', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        const draftForm = normalizeCreateForm(draft.form);
                        const senderProvince =
                          lockedSenderHub?.province ?? draftForm.senderProvince;
                        const senderWard = lockedSenderHub?.ward ?? draftForm.senderWard;
                        setCreateForm({
                          ...draftForm,
                          senderProvince,
                          senderWard,
                          senderHubCode: lockedSenderHub?.hubCode ?? draftForm.senderHubCode,
                          senderAddressDetail:
                            profile.defaultPickupAddressDetail || draftForm.senderAddressDetail,
                          senderAddress:
                            profile.defaultPickupAddress ||
                            [
                              draftForm.senderAddressDetail.trim(),
                              senderWard,
                              senderProvince,
                            ]
                              .filter(Boolean)
                              .join(', '),
                          senderLatitude:
                            profile.latitude ??
                            merchantProfileConfig?.latitude ??
                            lockedSenderHub?.latitude ??
                            undefined,
                          senderLongitude:
                            profile.longitude ??
                            merchantProfileConfig?.longitude ??
                            lockedSenderHub?.longitude ??
                            undefined,
                        });
                        setQuotedFee(draft.quoteFee);
                      }}
                    >
                      Tải lại
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() =>
                        setDrafts((previous) => previous.filter((item) => item.id !== draft.id))
                      }
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
