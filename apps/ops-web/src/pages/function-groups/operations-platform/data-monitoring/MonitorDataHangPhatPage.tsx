import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';

import './MonitorDataHangPhatPage.css';

export function MonitorDataHangPhatPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShipmentListItemDto[]>([]);
  const [filterCode, setFilterCode] = useState('');

  const fetchData = useCallback(async () => {
    if (!session?.tokens.accessToken) return;
    
    setLoading(true);
    try {
      // Giám sát hàng phát thường theo dõi các đơn đang đi giao (TASK_ASSIGNED/DELIVERY)
      // Hoặc các đơn vừa giao thành công (DELIVERED)
      // Ở đây ta lấy tất cả và có thể lọc thêm ở UI nếu cần, 
      // nhưng tốt nhất là filter status phù hợp.
      const result = await shipmentsClient.list(session.tokens.accessToken, {
        q: filterCode || undefined,
      });
      
      // Lọc các trạng thái liên quan đến phát hàng
      const deliveryStatuses = ['TASK_ASSIGNED', 'DELIVERED', 'DELIVERY_FAILED', 'NDR_CREATED'];
      const filtered = result.filter(s => deliveryStatuses.includes(s.currentStatus));
      
      setData(filtered);
    } catch (error) {
      console.error('Failed to fetch delivery monitor data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.tokens.accessToken, filterCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData();

  return (
    <section className="ops-monitor-hang-phat">
      <header className="ops-monitor-hang-phat__header">
        <div>
          <small>MONITOR_DATA_HANG_PHAT</small>
          <h2>Giám sát hàng phát</h2>
          <p>Theo dõi tiến độ giao hàng, các đơn đã bàn giao courier và kết quả đi phát.</p>
        </div>
        <div className="ops-monitor-hang-phat__summary">
          <article>
            <span>Đang giao</span>
            <strong>{data.filter(d => d.currentStatus === 'TASK_ASSIGNED').length}</strong>
          </article>
          <article>
            <span>Thành công</span>
            <strong>{data.filter(d => d.currentStatus === 'DELIVERED').length}</strong>
          </article>
          <article>
            <span>Thất bại/NDR</span>
            <strong>{data.filter(d => ['DELIVERY_FAILED', 'NDR_CREATED'].includes(d.currentStatus)).length}</strong>
          </article>
        </div>
      </header>

      <section className="ops-monitor-hang-phat__filters">
        <div className="ops-monitor-hang-phat__filter-row">
          <label>
            <span>Mã vận đơn</span>
            <input 
              type="text" 
              value={filterCode} 
              onChange={e => setFilterCode(e.target.value)}
              placeholder="Nhập mã vận đơn..."
            />
          </label>
          <button className="ops-monitor-hang-phat__btn" onClick={() => fetchData()}>Tìm kiếm</button>
          <button className="ops-monitor-hang-phat__btn" onClick={handleRefresh}>Làm mới</button>
        </div>
      </section>

      <div className="ops-monitor-hang-phat__table-wrap">
        {loading && <div className="ops-loading-overlay">Đang tải dữ liệu...</div>}
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vận đơn</th>
              <th>Cập nhật cuối</th>
              <th>BC phát</th>
              <th>Trạng thái</th>
              <th>Người xử lý</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td className="ops-monitor-hang-phat__code">{row.shipmentCode}</td>
                <td>{new Date(row.updatedAt).toLocaleString('vi-VN')}</td>
                <td>{row.currentLocation || row.destinationHubCode || '---'}</td>
                <td>
                  <span className={`ops-monitor-hang-phat__status ops-monitor-hang-phat__status--${row.currentStatus.toLowerCase()}`}>
                    {row.currentStatus}
                  </span>
                </td>
                <td>{row.senderName || '---'}</td>
                <td>{row.deliveryNote || '---'}</td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy dữ liệu hàng phát.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
