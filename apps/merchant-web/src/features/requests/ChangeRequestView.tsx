import React from 'react';

export interface ChangeRequestViewProps {
  onBackToShipments: () => void;
}

export function ChangeRequestView({ onBackToShipments }: ChangeRequestViewProps): React.JSX.Element {
  return (
    <section
      className="card"
      style={{
        maxWidth: 620,
        margin: '48px auto',
        textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: 14,
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          marginBottom: 16,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
          domain_verification
        </span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
        Tính năng đã được tinh giản theo chuẩn vận hành
      </h3>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Để đảm bảo tính liên tục của hành trình xe tải trục Linehaul và tránh phát sinh in lại tem
        nhãn tại Hub, hệ thống không nhận yêu cầu đổi thông tin giao hàng sau khi hàng đã xuất kho.
      </p>
      <div
        style={{
          textAlign: 'left',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 14,
          margin: '16px 0 24px 0',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: '#334155',
        }}
      >
        <div style={{ marginBottom: 6 }}>
          📦 <strong>Đơn hàng chưa bàn giao bưu tá</strong>: Quý khách có thể sửa trực tiếp thông
          tin người nhận tại màn hình <em>Chi tiết đơn hàng</em>.
        </div>
        <div>
          🔄 <strong>Đơn hàng giao không thành công</strong>: Quý khách vui lòng tạo{' '}
          <em>Yêu cầu hoàn hàng</em> hoặc đăng ký chuyển tiếp khi bưu tá báo sự cố.
        </div>
      </div>
      <button className="btn btn-primary" onClick={onBackToShipments}>
        Quay lại danh sách đơn hàng
      </button>
    </section>
  );
}
