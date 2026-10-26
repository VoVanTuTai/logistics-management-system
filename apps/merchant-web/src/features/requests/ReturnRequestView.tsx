import React from 'react';
import type { ReturnRequest, ShipmentRow } from '../../types';
import { formatDate, statusClass } from '../../api';
import { resolveShipmentStatusLabel } from '../../utils/shipment.utils';

export interface ReturnRequestViewProps {
  returnCode: string;
  returnShipmentPreview: ShipmentRow | null;
  returnReason: string;
  returnNotes: string;
  returnLoading: boolean;
  returnMessage: string | null;
  returnStatusFilter: string;
  returnRows: ReturnRequest[];
  onReturnCodeChange: (value: string) => void;
  onReturnReasonChange: (value: string) => void;
  onReturnNotesChange: (value: string) => void;
  onReturnStatusFilterChange: (value: string) => void;
  onSubmitReturn: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onOpenShipmentDetail: (shipmentCode: string) => void;
  onLookupTracking: (shipmentCode: string) => void;
}

export function ReturnRequestView({
  returnCode,
  returnShipmentPreview,
  returnReason,
  returnNotes,
  returnLoading,
  returnMessage,
  returnStatusFilter,
  returnRows,
  onReturnCodeChange,
  onReturnReasonChange,
  onReturnNotesChange,
  onReturnStatusFilterChange,
  onSubmitReturn,
  onOpenShipmentDetail,
  onLookupTracking,
}: ReturnRequestViewProps): React.JSX.Element {
  return (
    <section className="returns-layout">
      <div className="returns-top-grid">
        <div className="returns-main-column">
          <section className="card returns-search-card">
            <div className="returns-step-header">
              <span className="returns-step-badge">1</span>
              <h3>Bước 1: Tìm kiếm đơn hàng cần hoàn</h3>
            </div>
            <div className="returns-search-row">
              <div className="returns-search-input">
                <span className="material-symbols-outlined returns-search-icon">search</span>
                <input
                  className="input returns-search-field"
                  value={returnCode}
                  onChange={(e) => onReturnCodeChange(e.target.value)}
                  placeholder="Nhập mã vận đơn (VD: NX-889201...)"
                />
              </div>
              <button className="btn btn-primary returns-search-btn" type="button">
                Tìm kiếm
              </button>
            </div>
          </section>

          <section className="card returns-order-card">
            <div className="returns-order-card__header">
              <h4>Thông tin đơn hàng</h4>
              <span className="returns-order-status">
                {returnShipmentPreview
                  ? resolveShipmentStatusLabel(returnShipmentPreview.shipment)
                  : 'Chờ giao lại'}
              </span>
            </div>
            <div className="returns-order-grid">
              <div className="returns-order-block">
                <div>
                  <p className="muted">Người nhận</p>
                  <strong>{returnShipmentPreview?.receiverName ?? 'Chưa có dữ liệu đơn hàng'}</strong>
                </div>
                <div>
                  <p className="muted">Số điện thoại</p>
                  <strong>{returnShipmentPreview?.receiverPhone ?? '-'}</strong>
                </div>
              </div>
              <div className="returns-order-block">
                <div>
                  <p className="muted">Địa chỉ giao hàng</p>
                  <span>{returnShipmentPreview?.receiverAddress ?? 'Nhập mã vận đơn để xem thông tin.'}</span>
                </div>
                <div>
                  <p className="muted">Lịch sử giao hàng gần nhất</p>
                  <span className="returns-order-note">
                    Yêu cầu hoàn sẽ được duyệt ngay và chặn thao tác thường trên vận đơn.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="card returns-form-card">
            <div className="returns-step-header">
              <span className="returns-step-badge">2</span>
              <h3>Yêu cầu hoàn</h3>
            </div>
            <form className="returns-form" onSubmit={onSubmitReturn}>
              <div className="returns-field">
                <label className="label">Lý do hoàn hàng</label>
                <select
                  className="select"
                  value={returnReason}
                  onChange={(e) => onReturnReasonChange(e.target.value)}
                >
                  <option value="">Chọn lý do hoàn hàng...</option>
                  <option value="Khách hàng hủy đơn">Khách hàng hủy đơn</option>
                  <option value="Không liên lạc được khách hàng">Không liên lạc được khách hàng</option>
                  <option value="Sai địa chỉ giao hàng">Sai địa chỉ giao hàng</option>
                  <option value="Hàng hóa bị hư hỏng">Hàng hóa bị hư hỏng</option>
                  <option value="Khách từ chối nhận hàng">Khách từ chối nhận hàng</option>
                </select>
              </div>
              <div className="returns-field">
                <label className="label">Ghi chú chi tiết</label>
                <textarea
                  className="textarea returns-notes"
                  value={returnNotes}
                  onChange={(e) => onReturnNotesChange(e.target.value)}
                  placeholder="Nhập chi tiết yêu cầu hoàn hàng cho bưu tá..."
                />
              </div>
              <div className="returns-form-actions">
                <button className="btn btn-ghost" type="button">
                  Hủy
                </button>
                <button
                  className="btn btn-primary returns-submit-btn"
                  type="submit"
                  disabled={returnLoading}
                >
                  {returnLoading ? 'Đang gửi...' : 'Gửi yêu cầu hoàn hàng'}
                </button>
              </div>
              {returnMessage ? <p className="message">{returnMessage}</p> : null}
            </form>
          </section>
        </div>

        <div className="returns-side-column">
          <section className="card returns-info-card">
            <div className="returns-info-card__header">
              <span className="returns-info-icon">i</span>
              <h4>Lưu ý quan trọng</h4>
            </div>
            <ul className="returns-info-list">
              <li>
                Yêu cầu hoàn hàng áp dụng cho các đơn đang xử lý giao lại hoặc phát sinh nhu cầu hoàn
                từ merchant.
              </li>
              <li>
                Sau khi gửi yêu cầu, hệ thống sẽ duyệt chuyển hoàn ngay và OPS có thể in tem chuyển hoàn.
              </li>
              <li>Phí hoàn hàng vẫn tuân theo hợp đồng dịch vụ hiện tại của merchant.</li>
              <li>
                Yêu cầu hoàn được lưu vào delivery-service và publish return.started theo contract hiện
                có.
              </li>
            </ul>
          </section>

          <section className="card returns-metric-card">
            <p className="muted">Tỷ lệ hoàn hàng tháng này</p>
            <div className="returns-metric-row">
              <strong>4.2%</strong>
              <span className="returns-metric-chip">+0.5%</span>
            </div>
            <div className="returns-metric-bar">
              <span className="returns-metric-bar__fill" />
            </div>
          </section>
        </div>
      </div>

      <section className="card returns-history-card">
        <div className="returns-history-card__header">
          <h3>Lịch sử yêu cầu hoàn hàng</h3>
          <select
            className="select returns-history-filter"
            value={returnStatusFilter}
            onChange={(e) => onReturnStatusFilterChange(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
        <div className="table-wrap returns-table-wrap">
          <table className="returns-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Ngày gửi yêu cầu</th>
                <th>Lý do</th>
                <th>Dự kiến hoàn</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {returnRows.map((item) => (
                <tr key={item.id}>
                  <td className="returns-code-cell">{item.shipmentCode}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.reason}</td>
                  <td>{item.expectedReturnAt}</td>
                  <td>
                    <span className={statusClass(item.status)}>{item.status}</span>
                  </td>
                  <td>
                    <div className="returns-actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          onOpenShipmentDetail(item.shipmentCode);
                        }}
                      >
                        Xem đơn
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          onLookupTracking(item.shipmentCode);
                        }}
                      >
                        Tracking
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {returnRows.length === 0 ? (
          <div className="empty returns-empty">Chưa có yêu cầu hoàn hàng phù hợp bộ lọc.</div>
        ) : null}
      </section>
    </section>
  );
}
