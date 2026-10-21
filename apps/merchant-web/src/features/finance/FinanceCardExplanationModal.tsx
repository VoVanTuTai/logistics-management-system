import React, { useState, useEffect } from 'react';

export type FinanceExplanationTab =
  | 'lifecycle'
  | 'netBalance'
  | 'deliveredCod'
  | 'deliveringCod'
  | 'incurredFee';

export interface FinanceCardExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: FinanceExplanationTab;
  onOpenBankModal?: () => void;
  onOpenTopupModal?: () => void;
}

export function FinanceCardExplanationModal({
  isOpen,
  onClose,
  initialTab = 'lifecycle',
  onOpenBankModal,
  onOpenTopupModal,
}: FinanceCardExplanationModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<FinanceExplanationTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal-card finance-explain-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-modal-title"
      >
        {/* Modal Header */}
        <div className="finance-explain-header">
          <div className="finance-explain-header-info">
            <div className="finance-explain-icon-circle">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 id="finance-modal-title" className="finance-explain-title">
                Cẩm nang Dòng tiền & Giải thích Chỉ số Tài chính
              </h3>
              <p className="finance-explain-subtitle">
                Dành cho Chủ shop & Người mới • Minh bạch 100% công thức, chuyển dịch dòng tiền và lịch nhận tiền
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ops-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ giải thích"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="finance-explain-tabs">
          <button
            type="button"
            className={`finance-explain-tab-btn ${activeTab === 'lifecycle' ? 'active' : ''}`}
            onClick={() => setActiveTab('lifecycle')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              schema
            </span>
            <span>Vòng đời & Sơ đồ luồng tiền</span>
          </button>
          <button
            type="button"
            className={`finance-explain-tab-btn ${activeTab === 'netBalance' ? 'active' : ''}`}
            onClick={() => setActiveTab('netBalance')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#127a56' }}>
              account_balance
            </span>
            <span>Số dư ròng</span>
          </button>
          <button
            type="button"
            className={`finance-explain-tab-btn ${activeTab === 'deliveredCod' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveredCod')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
              payments
            </span>
            <span>COD đã thu</span>
          </button>
          <button
            type="button"
            className={`finance-explain-tab-btn ${activeTab === 'deliveringCod' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveringCod')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0059b8' }}>
              local_shipping
            </span>
            <span>COD đang giao</span>
          </button>
          <button
            type="button"
            className={`finance-explain-tab-btn ${activeTab === 'incurredFee' ? 'active' : ''}`}
            onClick={() => setActiveTab('incurredFee')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ba1a1a' }}>
              receipt_long
            </span>
            <span>Cước phát sinh</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="finance-explain-body">
          {/* TAB 1: Sơ đồ luồng tiền & Vòng đời */}
          {activeTab === 'lifecycle' && (
            <div className="finance-explain-content">
              <div className="finance-explain-callout finance-explain-callout--highlight">
                <div className="callout-icon">💡</div>
                <div className="callout-text">
                  <strong>Nguyên lý quản lý tiền hàng thông minh:</strong> Bạn không cần nạp tiền thanh toán cước
                  cho từng đơn hàng. Hệ thống tự động thu tiền hộ (COD) từ người mua, cấn trừ cước phí vận chuyển
                  và chuyển thẳng phần chênh lệch (Số dư ròng) vào tài khoản ngân hàng của bạn.
                </div>
              </div>

              <h4 className="explain-section-heading">Sơ đồ chuyển dịch tiền khi đơn hàng thay đổi trạng thái</h4>

              <div className="finance-flow-diagram">
                {/* Bước 1 */}
                <div className="finance-flow-card">
                  <div className="flow-card-badge">Bước 1: Khởi tạo & Đang giao</div>
                  <div className="flow-card-icon flow-card-icon--blue">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div className="flow-card-title">Đơn hàng đang trên đường giao</div>
                  <ul className="flow-card-list">
                    <li>
                      Tiền thu hộ được ghi nhận vào: <strong>COD đang giao (Dự kiến)</strong>.
                    </li>
                    <li>Cước phí tạm tính, chưa trừ vào số dư thực tế.</li>
                    <li>Chưa phát sinh tiền chuyển khoản.</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="finance-flow-arrow">
                  <span className="flow-arrow-text">Shipper phát thành công</span>
                  <span className="material-symbols-outlined">arrow_downward</span>
                </div>

                {/* Bước 2 */}
                <div className="finance-flow-card finance-flow-card--active">
                  <div className="flow-card-badge flow-card-badge--success">
                    Bước 2: Giao thành công (Ký nhận)
                  </div>
                  <div className="flow-card-icon flow-card-icon--green">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div className="flow-card-title">Tự động hạch toán tiền tươi</div>
                  <ul className="flow-card-list">
                    <li>
                      <span className="flow-tag flow-tag--minus">Giảm</span>{' '}
                      <strong>COD đang giao</strong> giảm trừ số tiền của đơn này.
                    </li>
                    <li>
                      <span className="flow-tag flow-tag--plus">Tăng</span>{' '}
                      <strong>COD đã thu</strong> tăng lên (tiền đã nộp về bưu cục).
                    </li>
                    <li>
                      <span className="flow-tag flow-tag--plus">Tăng</span>{' '}
                      <strong>Cước phát sinh trong kỳ</strong> ghi nhận phí vận chuyển.
                    </li>
                    <li>
                      <span className="flow-tag flow-tag--balance">Cập nhật</span>{' '}
                      <strong>Số dư ròng</strong> tăng thêm = (COD thu hộ - Cước phí).
                    </li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="finance-flow-arrow">
                  <span className="flow-arrow-text">Đến kỳ đối soát (T2 • T4 • T6)</span>
                  <span className="material-symbols-outlined">arrow_downward</span>
                </div>

                {/* Bước 3 */}
                <div className="finance-flow-card">
                  <div className="flow-card-badge">Bước 3: Chi trả tự động</div>
                  <div className="flow-card-icon flow-card-icon--purple">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div className="flow-card-title">Chuyển tiền vào tài khoản Ngân hàng</div>
                  <ul className="flow-card-list">
                    <li>Hệ thống chốt bảng kê kỳ đối soát.</li>
                    <li>
                      Tự động bắn khoản <strong>Số dư ròng khả dụng</strong> về số tài khoản Shop.
                    </li>
                    <li>Cung cấp mã tham chiếu ngân hàng & xuất file sao kê chi tiết (.csv).</li>
                  </ul>
                </div>
              </div>

              {/* Bảng ví dụ thực tế */}
              <div className="finance-simulation-box">
                <div className="simulation-header">
                  <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                    calculate
                  </span>
                  <strong>Ví dụ thực tế dễ hiểu cho Chủ shop:</strong>
                </div>
                <p style={{ margin: '6px 0 12px', fontSize: '13px', color: '#475569' }}>
                  Giả sử bạn gửi 01 đơn hàng <strong>Áo sơ mi</strong> có thu hộ COD <strong>400.000 đ</strong>, cước phí vận chuyển là <strong>30.000 đ</strong>:
                </p>
                <div className="simulation-table-wrap">
                  <table className="simulation-table">
                    <thead>
                      <tr>
                        <th>Giai đoạn đơn hàng</th>
                        <th>COD đang giao</th>
                        <th>COD đã thu</th>
                        <th>Cước phát sinh</th>
                        <th>Số dư ròng bạn nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="sim-status sim-status--delivering">Đang giao hàng</span>
                        </td>
                        <td style={{ color: '#0059b8', fontWeight: 600 }}>+400.000 đ</td>
                        <td>0 đ</td>
                        <td>0 đ (chưa trừ)</td>
                        <td className="muted">Chưa thay đổi</td>
                      </tr>
                      <tr style={{ background: '#f0fdf4' }}>
                        <td>
                          <span className="sim-status sim-status--delivered">Giao thành công</span>
                        </td>
                        <td style={{ color: '#ba1a1a', fontWeight: 600 }}>0 đ (Giảm -400k)</td>
                        <td style={{ color: '#0052cc', fontWeight: 700 }}>+400.000 đ</td>
                        <td style={{ color: '#ba1a1a', fontWeight: 600 }}>+30.000 đ</td>
                        <td style={{ color: '#127a56', fontWeight: 800, fontSize: '14px' }}>
                          +370.000 đ (400k - 30k)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="simulation-note">
                  🎯 <strong>Kết luận:</strong> Bạn không cần làm gì thêm, hệ thống sẽ tự động chuyển khoản đúng{' '}
                  <strong>370.000 đ</strong> về tài khoản ngân hàng của bạn vào kỳ thanh toán tiếp theo!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Số dư ròng khả dụng */}
          {activeTab === 'netBalance' && (
            <div className="finance-explain-content">
              <div className="explain-card-banner explain-card-banner--success">
                <div className="banner-icon">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                  <h4 className="banner-title">Số dư ròng khả dụng (Tiền thực nhận)</h4>
                  <div className="banner-desc">
                    Khoản tiền thực tế Shop sẽ nhận về tài khoản ngân hàng sau khi đã cấn trừ toàn bộ chi phí vận chuyển.
                  </div>
                </div>
              </div>

              <div className="explain-formula-card">
                <div className="formula-label">Công thức tính toán minh bạch:</div>
                <div className="formula-display">
                  <span className="formula-part formula-part--target">Số dư ròng khả dụng</span>
                  <span className="formula-op">=</span>
                  <span className="formula-part formula-part--plus">COD đã thu (Chờ chi)</span>
                  <span className="formula-op">-</span>
                  <span className="formula-part formula-part--minus">Cước phát sinh trong kỳ</span>
                </div>
              </div>

              <div className="explain-qa-list">
                <div className="explain-qa-item">
                  <div className="qa-q">
                    <span className="material-symbols-outlined qa-q-icon">help</span>
                    <span>Khi nào khoản tiền này được chuyển vào tài khoản ngân hàng của tôi?</span>
                  </div>
                  <div className="qa-a">
                    Hệ thống tự động chi trả định kỳ <strong>3 lần/tuần (Thứ 2, Thứ 4, Thứ 6)</strong>. Tiền sẽ được
                    chuyển thẳng vào số tài khoản ngân hàng bạn đã cài đặt ở mục{' '}
                    <button
                      type="button"
                      className="link-inline-btn"
                      onClick={() => {
                        onClose();
                        onOpenBankModal?.();
                      }}
                    >
                      Tài khoản nhận tiền
                    </button>{' '}
                    mà không cần tạo yêu cầu rút tiền thủ công.
                  </div>
                </div>

                <div className="explain-qa-item">
                  <div className="qa-q">
                    <span className="material-symbols-outlined qa-q-icon">help</span>
                    <span>Tại sao số dư ròng của tôi lại có màu đỏ và bị số âm (-)?</span>
                  </div>
                  <div className="qa-a">
                    Số dư ròng bị âm khi <strong>Cước vận chuyển phát sinh nhiều hơn số tiền COD thu được</strong>.
                    Điều này thường xảy ra khi Shop gửi nhiều đơn hàng không thu COD (khách đã chuyển khoản trước)
                    hoặc đơn hàng miễn phí ship. Hệ thống hỗ trợ hạn mức nợ âm đến{' '}
                    <strong>-500.000 đ</strong>. Nếu vượt trần này, bạn chỉ cần bấm{' '}
                    <button
                      type="button"
                      className="link-inline-btn"
                      onClick={() => {
                        onClose();
                        onOpenTopupModal?.();
                      }}
                    >
                      Nạp tiền VietQR
                    </button>{' '}
                    để tiếp tục tạo đơn bình thường.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COD đã thu (Chờ chi) */}
          {activeTab === 'deliveredCod' && (
            <div className="finance-explain-content">
              <div className="explain-card-banner explain-card-banner--primary">
                <div className="banner-icon">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h4 className="banner-title">COD đã thu (Chờ chi trả)</h4>
                  <div className="banner-desc">
                    Tổng tiền hàng shipper đã thu hộ thành công từ tay người nhận và đã nộp đầy đủ về quỹ bưu cục.
                  </div>
                </div>
              </div>

              <div className="explain-bullets">
                <div className="explain-bullet-item">
                  <div className="bullet-num">1</div>
                  <div className="bullet-body">
                    <strong>100% tiền tươi đã chốt:</strong> Đây là số tiền chắc chắn thuộc về Shop, đã an toàn nằm
                    trong hệ thống và chỉ chờ đến lịch chuyển khoản định kỳ tiếp theo.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">2</div>
                  <div className="bullet-body">
                    <strong>Thời điểm ghi nhận:</strong> Ngay tại giây phút shipper quét cập nhật{' '}
                    <em>&quot;Giao hàng thành công (Ký nhận)&quot;</em>, tiền sẽ lập tức được cộng vào thẻ này.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">3</div>
                  <div className="bullet-body">
                    <strong>Nguồn cấn trừ cước:</strong> Khoản COD đã thu này sẽ được hệ thống dùng để cấn trừ tiền cước
                    vận chuyển của bạn. Số tiền dôi dư chính là <strong>Số dư ròng</strong> sẽ chuyển về tài khoản bạn.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COD đang giao (Dự kiến) */}
          {activeTab === 'deliveringCod' && (
            <div className="finance-explain-content">
              <div className="explain-card-banner explain-card-banner--info">
                <div className="banner-icon">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <h4 className="banner-title">COD đang giao (Dự kiến thu)</h4>
                  <div className="banner-desc">
                    Tổng số tiền COD của các kiện hàng đang trên đường giao hoặc đang được xử lý trong mạng lưới bưu cục.
                  </div>
                </div>
              </div>

              <div className="explain-bullets">
                <div className="explain-bullet-item">
                  <div className="bullet-num">⏳</div>
                  <div className="bullet-body">
                    <strong>Tiền tiềm năng:</strong> Đây là dòng tiền dự kiến sẽ thu được nếu khách hàng nhận hàng. Khoản
                    này chưa thể rút hay chuyển khoản vì hàng vẫn đang trên đường vận chuyển.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">🔄</div>
                  <div className="bullet-body">
                    <strong>Khi khách nhận hàng thành công:</strong> Tiền ở thẻ này sẽ tự động giảm trừ và chuyển toàn bộ
                    vào <strong>COD đã thu</strong>, đồng thời cước phí được ghi nhận và cập nhật vào Số dư ròng.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">❌</div>
                  <div className="bullet-body">
                    <strong>Nếu khách không nhận (chuyển hoàn):</strong> Tiền COD này sẽ bị hủy bỏ (vì không thu được tiền),
                    đơn hàng chuyển sang quy trình chuyển hoàn hàng về kho Shop.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Cước phát sinh trong kỳ */}
          {activeTab === 'incurredFee' && (
            <div className="finance-explain-content">
              <div className="explain-card-banner explain-card-banner--danger">
                <div className="banner-icon">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <h4 className="banner-title">Cước phát sinh trong kỳ</h4>
                  <div className="banner-desc">
                    Tổng phí vận chuyển và các phụ phí dịch vụ phát sinh của các đơn hàng trong tháng đã chọn.
                  </div>
                </div>
              </div>

              <div className="explain-bullets">
                <div className="explain-bullet-item">
                  <div className="bullet-num">⚖️</div>
                  <div className="bullet-body">
                    <strong>Cơ chế cấn trừ tự động thuận tiện:</strong> Bạn không phải lo chuyển tiền lẻ từng đơn hàng
                    cho shipper. Tiền cước được tự động trừ vào tiền thu hộ COD khi đối soát.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">📈</div>
                  <div className="bullet-body">
                    <strong>Khi nào cước được ghi nhận?:</strong> Khi đơn hàng giao thành công hoặc có kết quả phát hàng,
                    cước phí dịch vụ mới chính thức được tính vào kỳ đối soát và cấn trừ tương ứng.
                  </div>
                </div>
                <div className="explain-bullet-item">
                  <div className="bullet-num">🛡️</div>
                  <div className="bullet-body">
                    <strong>Hạn mức nợ linh hoạt (-500.000 đ):</strong> Trong trường hợp bạn bán hàng online mà khách đã
                    chuyển khoản trước (đơn COD = 0đ), hệ thống vẫn hỗ trợ phát hàng bình thường với hạn mức nợ âm tối đa
                    500.000 đ mà không bị ngắt quãng hoạt động kinh doanh.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="finance-explain-footer">
          <div className="footer-left-hint">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#127a56' }}>
              verified_user
            </span>
            <span>Hệ thống đối soát tự động chuẩn ngân hàng • Minh bạch từng đồng</span>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Đã hiểu rõ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
