import React from 'react';
import type {
  ClaimIncidentType,
  MerchantClaim,
  ShipmentResponse,
  ShipmentRow,
} from '../../types';
import { formatCurrency, formatDate, normalizeCode } from '../../api';

export interface ClaimsViewProps {
  claims: MerchantClaim[];
  claimMessage: string | null;
  claimError: string | null;
  claimSearch: string;
  claimStatusFilter: string;
  selectedClaimDetail: MerchantClaim | null;
  isCreateClaimOpen: boolean;
  claimShipmentCode: string;
  claimIncidentType: ClaimIncidentType;
  claimRequestedAmount: string;
  claimPackageDesc: string;
  claimDamageDesc: string;
  claimSubmitting: boolean;
  shipmentRows: ShipmentRow[];
  onSetIsCreateClaimOpen: (open: boolean) => void;
  onSetSelectedClaimDetail: (claim: MerchantClaim | null) => void;
  onSetClaimSearch: (val: string) => void;
  onSetClaimStatusFilter: (val: string) => void;
  onSetClaimShipmentCode: (val: string) => void;
  onSetClaimIncidentType: (val: ClaimIncidentType) => void;
  onSetClaimRequestedAmount: (val: string) => void;
  onSetClaimPackageDesc: (val: string) => void;
  onSetClaimDamageDesc: (val: string) => void;
  onSubmitCreateClaim: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onOpenShipmentDetail: (shipmentCode: string) => void;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
}

export function ClaimsView({
  claims,
  claimMessage,
  claimError,
  claimSearch,
  claimStatusFilter,
  selectedClaimDetail,
  isCreateClaimOpen,
  claimShipmentCode,
  claimIncidentType,
  claimRequestedAmount,
  claimPackageDesc,
  claimDamageDesc,
  claimSubmitting,
  shipmentRows,
  onSetIsCreateClaimOpen,
  onSetSelectedClaimDetail,
  onSetClaimSearch,
  onSetClaimStatusFilter,
  onSetClaimShipmentCode,
  onSetClaimIncidentType,
  onSetClaimRequestedAmount,
  onSetClaimPackageDesc,
  onSetClaimDamageDesc,
  onSubmitCreateClaim,
  onOpenShipmentDetail,
  resolveShipmentStatusLabel,
}: ClaimsViewProps): React.JSX.Element {
  return (
    <section className="claims-layout">
      {/* Claims Page Hero */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 700,
                opacity: 0.9,
              }}
            >
              Claims & Disputes Management
            </span>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: '6px 0 4px',
                color: '#ffffff',
              }}
            >
              Khiếu nại & Thẩm định Bồi thường Bưu phẩm
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                opacity: 0.85,
                maxWidth: '680px',
                lineHeight: 1.5,
              }}
            >
              Cổng tiếp nhận yêu cầu đền bù thiệt hại (hàng vỡ, mất mát, giao chậm, sai lệch COD).
              Hệ thống tự động phân định trách nhiệm bưu cục/shipper theo Ma trận 4 ô chuẩn SOP Nexus.
            </p>
          </div>

          <button
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              color: '#0369a1',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            onClick={() => {
              onSetIsCreateClaimOpen(true);
              onSetSelectedClaimDetail(null);
            }}
          >
            + Tạo yêu cầu bồi thường mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="claims-kpi-grid">
        <div className="claims-kpi-card">
          <div className="claims-kpi-header">
            <span className="claims-kpi-title">Tổng hồ sơ khiếu nại</span>
            <div
              className="claims-kpi-icon"
              style={{ background: '#e0f2fe', color: '#0284c7' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                gavel
              </span>
            </div>
          </div>
          <div className="claims-kpi-value">{claims.length}</div>
          <div className="claims-kpi-subtext">Hồ sơ đã ghi nhận trên hệ thống</div>
        </div>

        <div className="claims-kpi-card">
          <div className="claims-kpi-header">
            <span className="claims-kpi-title">Đang chờ giám định</span>
            <div
              className="claims-kpi-icon"
              style={{ background: '#fef3c7', color: '#b45309' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                pending_actions
              </span>
            </div>
          </div>
          <div className="claims-kpi-value" style={{ color: '#b45309' }}>
            {claims.filter((c) => c.status === 'PENDING_INSPECTION').length}
          </div>
          <div className="claims-kpi-subtext">Hội đồng đang kiểm tra camera & seal</div>
        </div>

        <div className="claims-kpi-card">
          <div className="claims-kpi-header">
            <span className="claims-kpi-title">Đã có phán quyết / Duyệt chi</span>
            <div
              className="claims-kpi-icon"
              style={{ background: '#ecfdf5', color: '#059669' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                verified
              </span>
            </div>
          </div>
          <div className="claims-kpi-value" style={{ color: '#059669' }}>
            {
              claims.filter(
                (c) =>
                  c.status === 'ADJUDICATED' ||
                  c.status === 'PAYMENT_APPROVED' ||
                  c.status === 'SETTLED',
              ).length
            }
          </div>
          <div className="claims-kpi-subtext">Đã phân định bên chịu trách nhiệm</div>
        </div>

        <div className="claims-kpi-card">
          <div className="claims-kpi-header">
            <span className="claims-kpi-title">Đã tất toán đền bù</span>
            <div
              className="claims-kpi-icon"
              style={{ background: '#f3e8ff', color: '#7e22ce' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                payments
              </span>
            </div>
          </div>
          <div className="claims-kpi-value" style={{ color: '#7e22ce', fontSize: '20px' }}>
            {formatCurrency(
              claims
                .filter((c) => c.status === 'SETTLED' || c.status === 'PAYMENT_APPROVED')
                .reduce(
                  (sum, c) =>
                    sum + (c.approvedCompensationAmount || c.claimRequestedAmount || 0),
                  0,
                ),
            )}
          </div>
          <div className="claims-kpi-subtext">Đã cấn trừ khấu trừ hoàn tất</div>
        </div>
      </div>

      {/* Status Message */}
      {claimMessage ? <p className="message success">{claimMessage}</p> : null}
      {claimError ? <p className="message error">{claimError}</p> : null}

      {/* Main Content: Split Grid */}
      <div
        className={`claims-main-grid ${
          isCreateClaimOpen || selectedClaimDetail ? 'claims-main-grid--split' : ''
        }`}
      >
        {/* Left: Table of Claims */}
        <div className="card">
          <div className="claims-toolbar">
            <div className="claims-search-wrap">
              <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>
                search
              </span>
              <input
                className="input"
                placeholder="Tìm theo Mã hồ sơ CLM, Mã vận đơn NX..."
                value={claimSearch}
                onChange={(e) => onSetClaimSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <select
              className="claims-filter-select"
              value={claimStatusFilter}
              onChange={(e) => onSetClaimStatusFilter(e.target.value)}
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="PENDING_INSPECTION">Chờ giám định</option>
              <option value="ADJUDICATED">Đã phán quyết</option>
              <option value="PAYMENT_APPROVED">Đã duyệt chi trả</option>
              <option value="SETTLED">Đã tất toán</option>
              <option value="REJECTED">Từ chối bồi thường</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Mã vận đơn</th>
                  <th>Loại sự cố</th>
                  <th>Số tiền yêu cầu</th>
                  <th>Phán quyết duyệt</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {claims
                  .filter((c) => {
                    if (claimStatusFilter !== 'ALL' && c.status !== claimStatusFilter) return false;
                    if (claimSearch.trim()) {
                      const q = claimSearch.trim().toLowerCase();
                      return (
                        c.claimCode.toLowerCase().includes(q) ||
                        c.shipmentCode.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((item) => {
                    const isSelected = selectedClaimDetail?.id === item.id;
                    let statusBadgeBg = '#f1f5f9';
                    let statusBadgeText = '#475569';
                    let statusLabel: string = item.status;
                    if (item.status === 'PENDING_INSPECTION') {
                      statusBadgeBg = '#fef3c7';
                      statusBadgeText = '#b45309';
                      statusLabel = 'Chờ giám định';
                    } else if (item.status === 'ADJUDICATED') {
                      statusBadgeBg = '#e0f2fe';
                      statusBadgeText = '#0369a1';
                      statusLabel = 'Đã phán quyết';
                    } else if (item.status === 'PAYMENT_APPROVED') {
                      statusBadgeBg = '#dcfce7';
                      statusBadgeText = '#15803d';
                      statusLabel = 'Đã duyệt chi';
                    } else if (item.status === 'SETTLED') {
                      statusBadgeBg = '#ecfdf5';
                      statusBadgeText = '#047857';
                      statusLabel = 'Đã tất toán';
                    } else if (item.status === 'REJECTED') {
                      statusBadgeBg = '#fee2e2';
                      statusBadgeText = '#b91c1c';
                      statusLabel = 'Từ chối';
                    }

                    let incidentLabel: string = item.incidentType;
                    if (item.incidentType === 'DAMAGE') incidentLabel = 'Hư hỏng / Bể vỡ';
                    else if (item.incidentType === 'LOST_IN_TRANSIT')
                      incidentLabel = 'Thất lạc bưu kiện';
                    else if (item.incidentType === 'DELAY') incidentLabel = 'Chậm trễ giao hàng';
                    else if (item.incidentType === 'COD_DISPUTE') incidentLabel = 'Sai lệch tiền COD';

                    return (
                      <tr key={item.id} style={{ background: isSelected ? '#f8fafc' : undefined }}>
                        <td>
                          <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                            {item.claimCode}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {item.shipmentCode}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>{incidentLabel}</span>
                        </td>
                        <td>
                          <strong>
                            {formatCurrency(item.claimRequestedAmount || item.declaredValue || 0)}
                          </strong>
                        </td>
                        <td>
                          {item.approvedCompensationAmount ? (
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>
                              {formatCurrency(item.approvedCompensationAmount)} (
                              {item.liabilityRatioPercent}%)
                            </span>
                          ) : (
                            <span className="muted">Chưa chốt</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: statusBadgeBg,
                              color: statusBadgeText,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => {
                              onSetSelectedClaimDetail(item);
                              onSetIsCreateClaimOpen(false);
                            }}
                          >
                            Xem phán quyết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {claims.length === 0 ? (
            <div className="empty" style={{ padding: '36px 16px', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '40px', color: '#10b981', marginBottom: '8px' }}
              >
                verified_user
              </span>
              <h4>Hiện tại chưa có yêu cầu bồi thường nào</h4>
              <p className="muted" style={{ maxWidth: '420px', margin: '4px auto 14px' }}>
                Các đơn hàng của bạn đang được xử lý an toàn. Nếu có bưu kiện bị nứt vỡ hoặc thất
                lạc, hãy bấm nút tạo khiếu nại để được bồi thường.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onSetIsCreateClaimOpen(true);
                  onSetSelectedClaimDetail(null);
                }}
              >
                + Tạo khiếu nại đầu tiên
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Column: Claim Form OR Claim Verdict Detail */}
        {isCreateClaimOpen ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0 }}>Tạo yêu cầu Bồi thường mới</h3>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={() => onSetIsCreateClaimOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={onSubmitCreateClaim}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label className="label">Mã vận đơn cần khiếu nại (*)</label>
                <input
                  className="input"
                  placeholder="VD: NX-88992211"
                  value={claimShipmentCode}
                  onChange={(e) => onSetClaimShipmentCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              {/* Matching shipment preview */}
              {(() => {
                const row = shipmentRows.find(
                  (r) => r.shipment.code === normalizeCode(claimShipmentCode),
                );
                if (!row) return null;
                return (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '14px',
                          marginRight: '4px',
                          color: 'var(--stitch-primary)',
                        }}
                      >
                        inventory_2
                      </span>
                      <span>
                        {row.itemType} ({row.weightKg}kg)
                      </span>
                    </div>
                    <div style={{ color: '#475569' }}>
                      Người nhận: {row.receiverName} ({row.receiverPhone}) - COD:{' '}
                      {formatCurrency(row.codAmount)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      Trạng thái hiện tại: {resolveShipmentStatusLabel(row.shipment)}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="label">Loại sự cố / Tổn thất (*)</label>
                <select
                  className="input"
                  value={claimIncidentType}
                  onChange={(e) => onSetClaimIncidentType(e.target.value as ClaimIncidentType)}
                >
                  <option value="DAMAGE">Hàng hóa bị nứt vỡ, móp méo, hư hỏng (DAMAGE)</option>
                  <option value="LOST_IN_TRANSIT">
                    Thất lạc bưu kiện trong quá trình vận chuyển (LOST)
                  </option>
                  <option value="DELAY">Giao trễ hạn cam kết SLA quá 48h (DELAY)</option>
                  <option value="COD_DISPUTE">Sai lệch tiền thu hộ COD khi đối soát (COD_DISPUTE)</option>
                </select>
              </div>

              <div>
                <label className="label">Số tiền yêu cầu bồi thường (VND) (*)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="VD: 500000"
                  value={claimRequestedAmount}
                  onChange={(e) => onSetClaimRequestedAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Mô tả hàng hóa bên trong</label>
                <input
                  className="input"
                  placeholder="VD: 2 bộ áo quần thể thao nam Coolmate"
                  value={claimPackageDesc}
                  onChange={(e) => onSetClaimPackageDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Mô tả chi tiết sự cố / Biên bản đồng kiểm (*)</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Mô tả cụ thể tình trạng hàng hóa khi người nhận đồng kiểm, chữ ký shipper trên biên bản, hoặc thời điểm phát hiện thất lạc..."
                  value={claimDamageDesc}
                  onChange={(e) => onSetClaimDamageDesc(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <strong>Quy chuẩn SOP Thẩm định:</strong> Ban Giám Định Trách Nhiệm sẽ truy xuất dữ
                liệu cân điện tử lúc nhập Hub và camera phân loại tự động để phân định trách nhiệm
                bưu cục/shipper trong vòng 24h.
              </div>

              <div className="btn-row" style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={claimSubmitting}
                  style={{ flex: 1 }}
                >
                  {claimSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi yêu cầu bồi thường'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onSetIsCreateClaimOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        ) : selectedClaimDetail ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  Chi tiết Phán quyết Trách nhiệm
                </span>
                <h3 style={{ margin: '2px 0 0', color: '#0284c7', fontFamily: 'monospace' }}>
                  {selectedClaimDetail.claimCode}
                </h3>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={() => onSetSelectedClaimDetail(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div>
                Vận đơn: <strong>{selectedClaimDetail.shipmentCode}</strong>
              </div>
              <div>
                Ngày lập hồ sơ:{' '}
                {formatDate(selectedClaimDetail.createdAt || selectedClaimDetail.reportedAt)}
              </div>
              <div>
                Số tiền yêu cầu:{' '}
                <strong>
                  {formatCurrency(
                    selectedClaimDetail.claimRequestedAmount ||
                      selectedClaimDetail.declaredValue ||
                      0,
                  )}
                </strong>
              </div>
            </div>

            {/* 4-Cell Liability Matrix Visualization */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '6px',
                }}
              >
                Ma trận Phân định Trách nhiệm 4 Ô (4-Cell Liability Matrix)
              </div>
              <div className="claims-matrix-grid">
                <div
                  className={`claims-matrix-cell ${
                    selectedClaimDetail.responsibleParty === 'ORIGIN_HUB'
                      ? 'claims-matrix-cell--active'
                      : ''
                  }`}
                >
                  <div className="claims-matrix-cell-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      warehouse
                    </span>
                    1. Hub Gửi (Origin)
                  </div>
                  <div className="claims-matrix-cell-desc">
                    Khâu tiếp nhận, cân đo & bao gói ban đầu
                  </div>
                </div>

                <div
                  className={`claims-matrix-cell ${
                    selectedClaimDetail.responsibleParty === 'LINEHAUL_CARRIER'
                      ? 'claims-matrix-cell--active'
                      : ''
                  }`}
                >
                  <div className="claims-matrix-cell-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      local_shipping
                    </span>
                    2. Linehaul (Vận chuyển)
                  </div>
                  <div className="claims-matrix-cell-desc">
                    Vận chuyển xe tải liên tỉnh & seal niêm phong
                  </div>
                </div>

                <div
                  className={`claims-matrix-cell ${
                    selectedClaimDetail.responsibleParty === 'LAST_MILE_COURIER' ||
                    selectedClaimDetail.responsibleParty === 'DESTINATION_HUB'
                      ? 'claims-matrix-cell--active'
                      : ''
                  }`}
                >
                  <div className="claims-matrix-cell-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      sports_motorsports
                    </span>
                    3. Hub Phát / Shipper
                  </div>
                  <div className="claims-matrix-cell-desc">
                    Khâu phát hàng, đồng kiểm với khách nhận
                  </div>
                </div>

                <div
                  className={`claims-matrix-cell ${
                    selectedClaimDetail.responsibleParty === 'MERCHANT'
                      ? 'claims-matrix-cell--active'
                      : ''
                  }`}
                >
                  <div className="claims-matrix-cell-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      store
                    </span>
                    4. Shop đóng gói
                  </div>
                  <div className="claims-matrix-cell-desc">
                    Tiêu chuẩn chèn bọc chống va đập của shop
                  </div>
                </div>
              </div>
            </div>

            {/* Official Verdict Banner */}
            <div className="claims-verdict-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#059669', fontSize: '20px' }}
                >
                  gavel
                </span>
                <strong style={{ fontSize: '14px', color: '#065f46' }}>
                  Kết luận của Hội đồng Giám định
                </strong>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#047857',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div>
                  Đơn vị chịu trách nhiệm:{' '}
                  <strong>{selectedClaimDetail.responsibleParty || 'Đang thẩm định'}</strong>
                </div>
                <div>
                  Tỷ lệ đền bù phê duyệt:{' '}
                  <strong>
                    {selectedClaimDetail.liabilityRatioPercent ||
                      (selectedClaimDetail.approvedCompensationAmount ? 100 : 0)}
                    %
                  </strong>
                </div>
                <div>
                  Số tiền bồi thường:{' '}
                  <strong style={{ fontSize: '16px', color: '#047857' }}>
                    {formatCurrency(selectedClaimDetail.approvedCompensationAmount || 0)}
                  </strong>
                </div>
              </div>
              {selectedClaimDetail.damageDescription ? (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#475569',
                    marginTop: '6px',
                    fontStyle: 'italic',
                    background: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '6px',
                  }}
                >
                  &quot;Mô tả sự cố: {selectedClaimDetail.damageDescription}&quot;
                </div>
              ) : null}
            </div>

            <div className="btn-row" style={{ marginTop: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  onOpenShipmentDetail(selectedClaimDetail.shipmentCode);
                }}
              >
                Xem chi tiết đơn hàng
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => onSetSelectedClaimDetail(null)}
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
