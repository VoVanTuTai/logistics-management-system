import React from 'react';
import { formatCurrency } from '../../api';

export interface TopupVietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  netBalance: number;
  username?: string;
  onConfirmTransfer?: () => void;
}

export function TopupVietQRModal({
  isOpen,
  onClose,
  netBalance,
  username,
  onConfirmTransfer,
}: TopupVietQRModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const dueAmount = Math.max(50000, Math.abs(netBalance));
  const transferUser = username || 'SHOP';
  const qrUrl = `https://img.vietqr.io/image/970422-123456789-compact2.png?amount=${dueAmount}&addInfo=${encodeURIComponent(
    `NO CUOC ${transferUser}`,
  )}&accountName=${encodeURIComponent('NEXUS LOGISTICS')}`;

  const handleConfirm = () => {
    onClose();
    if (onConfirmTransfer) {
      onConfirmTransfer();
    } else {
      alert(
        'Hệ thống đang kiểm tra giao dịch chuyển khoản VietQR tự động. Số dư sẽ được cập nhật trong ít phút!',
      );
    }
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal-card"
        style={{ maxWidth: '440px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--stitch-on-surface)',
            }}
          >
            Thanh toán nợ cước VietQR
          </h3>
          <button type="button" className="ops-modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px' }}>
            Quét mã QR bằng App ngân hàng bất kỳ để thanh toán nợ cước và mở khóa tạo đơn tự động.
          </p>
          <img
            src={qrUrl}
            alt="VietQR Thanh toán nợ cước"
            style={{
              width: '240px',
              height: '240px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              margin: '0 auto',
              display: 'block',
            }}
          />
          <div
            style={{
              marginTop: '16px',
              textAlign: 'left',
              background: '#F8FAFC',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            <div>
              <strong>Ngân hàng thụ hưởng:</strong> MBBank (Ngân hàng Quân Đội)
            </div>
            <div>
              <strong>Số tài khoản:</strong> 123456789
            </div>
            <div>
              <strong>Chủ tài khoản:</strong> CÔNG TY CỔ PHẦN NEXUS LOGISTICS
            </div>
            <div>
              <strong>Số tiền nợ cần thanh toán:</strong>{' '}
              <span style={{ color: '#DC2626', fontWeight: 700 }}>
                {formatCurrency(dueAmount)}
              </span>
            </div>
            <div>
              <strong>Nội dung:</strong> NO CUOC {transferUser}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Đã chuyển khoản
          </button>
        </div>
      </div>
    </div>
  );
}
