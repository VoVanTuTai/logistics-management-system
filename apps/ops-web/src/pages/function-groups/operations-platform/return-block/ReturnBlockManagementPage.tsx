import React, { useState } from 'react';

import './ReturnBlockRegistrationPage.css';

interface ReturnOrder {
  id: string;
  originalCode: string;
  newCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  createdAt: string;
}

const mockReturnOrders: ReturnOrder[] = [
  {
    id: 'R001',
    originalCode: '842502785302',
    newCode: '842502785302-R',
    status: 'APPROVED',
    reason: 'Không liên lạc được với khách hàng',
    createdAt: '2023-10-15 14:30',
  },
  {
    id: 'R002',
    originalCode: '842502785444',
    newCode: '842502785444-R',
    status: 'PENDING',
    reason: 'Người gửi yêu cầu chuyển hoàn',
    createdAt: '2023-10-16 09:15',
  },
];

export function ReturnBlockManagementPage(): React.JSX.Element {
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handlePrintLabel = (order: ReturnOrder) => {
    alert(`Đang in tem cho vận đơn hoàn: ${order.newCode}`);
  };

  return (
    <section className="ops-return-management">

      <section className="ops-return-management__panel">
        <header className="ops-return-management__panel-header">
          <h3>Tra cứu danh sách chuyển hoàn</h3>
          <span aria-hidden="true">⌃</span>
        </header>
        <div className="ops-return-management__panel-body">
          <div className="ops-return-management__proposal" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
            <label className="ops-return-management__field">
              <span>Mã đơn gốc / Mã đơn hoàn:</span>
              <input
                type="text"
                placeholder="Nhập mã đơn..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </label>
            <label className="ops-return-management__field">
              <span>Trạng thái duyệt:</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </label>
            <div className="ops-return-management__actions">
              <button type="button" className="ops-return-management__search-btn">
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ops-return-management__panel">
        <header className="ops-return-management__panel-header">
          <h3>Danh sách yêu cầu chuyển hoàn</h3>
        </header>
        <div className="ops-return-management__panel-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mã đơn gốc</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mã đơn hoàn</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Lý do</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ngày tạo</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockReturnOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px' }}>{order.originalCode}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1d4ed8' }}>{order.newCode}</td>
                  <td style={{ padding: '12px 16px' }}>{order.reason}</td>
                  <td style={{ padding: '12px 16px' }}>{order.createdAt}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {order.status === 'APPROVED' && <span style={{ color: '#16a34a', fontWeight: 600 }}>Đã duyệt</span>}
                    {order.status === 'PENDING' && <span style={{ color: '#f59e0b', fontWeight: 600 }}>Chờ duyệt</span>}
                    {order.status === 'REJECTED' && <span style={{ color: '#dc2626', fontWeight: 600 }}>Từ chối</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {order.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handlePrintLabel(order)}
                        style={{
                          background: '#1d4ed8',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        In tem
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {mockReturnOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
