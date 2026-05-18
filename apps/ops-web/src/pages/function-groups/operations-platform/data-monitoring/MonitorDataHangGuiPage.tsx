import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';

import './MonitorDataHangGuiPage.css';

export function MonitorDataHangGuiPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShipmentListItemDto[]>([]);
  const [filterCode, setFilterCode] = useState('');

  const fetchData = useCallback(async () => {
    if (!session?.tokens.accessToken) return;
    
    setLoading(true);
    try {
      const result = await shipmentsClient.list(session.tokens.accessToken, {
        status: 'SCAN_OUTBOUND',
        q: filterCode || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch outbound data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.tokens.accessToken, filterCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleSearch = () => {
    fetchData();
  };

  return (
    <section className="ops-monitor-hang-gui">
      <header className="ops-monitor-hang-gui__page-header">
        <div>
          <small>MONITOR_DATA_HANG_GUI</small>
          <h2>Giám sát hàng gửi</h2>
          <p>Theo dõi những đơn đã quét gửi ra khỏi bưu cục nhưng bưu cục đích chưa quét hàng nhận.</p>
        </div>
        <div className="ops-monitor-hang-gui__summary">
          <article>
            <span>Đã quét gửi</span>
            <strong>{data.length}</strong>
          </article>
          <article>
            <span>Đích chưa nhận</span>
            <strong>{data.length}</strong>
          </article>
        </div>
      </header>

      <section className="ops-monitor-hang-gui__toolbar">
        <div className="ops-monitor-hang-gui__actions">
          <button type="button" className="ops-monitor-hang-gui__action-btn" onClick={handleSearch}>
            Tìm kiếm
          </button>
          <button type="button" className="ops-monitor-hang-gui__action-btn">
            Xuất dữ liệu
          </button>
          <button type="button" className="ops-monitor-hang-gui__action-btn" onClick={handleRefresh}>
            Làm mới
          </button>
        </div>
        <button type="button" className="ops-monitor-hang-gui__collapse-btn">
          Thu gọn
        </button>
      </section>

      <section className="ops-monitor-hang-gui__filters">
        <label className="ops-monitor-hang-gui__filter-field">
          <span>Thời gian quét gửi từ:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-gui__filter-field">
          <span>Thời gian quét gửi đến:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-gui__filter-field">
          <span>BC gửi:</span>
          <input type="text" placeholder="Chọn hoặc nhập bưu cục gửi" />
        </label>
        <label className="ops-monitor-hang-gui__filter-field">
          <span>BC đích:</span>
          <input type="text" placeholder="Chọn hoặc nhập bưu cục đích" />
        </label>
        <label className="ops-monitor-hang-gui__filter-field">
          <span>Mã vận đơn:</span>
          <input 
            type="text" 
            placeholder="Vui lòng nhập mã vận đơn" 
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
          />
        </label>
      </section>

      <section className="ops-monitor-hang-gui__table-wrap">
        {loading && <div className="ops-loading-overlay">Đang tải dữ liệu...</div>}
        <table className="ops-monitor-hang-gui__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vận đơn</th>
              <th>Thời gian quét gửi</th>
              <th>BC gửi</th>
              <th>Mã BC gửi</th>
              <th>BC đích</th>
              <th>Mã BC đích</th>
              <th>Thời gian chờ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.shipmentCode}>
                <td>{index + 1}</td>
                <td className="ops-monitor-hang-gui__code">{row.shipmentCode}</td>
                <td>{new Date(row.updatedAt).toLocaleString('vi-VN')}</td>
                <td>{row.currentLocation || '---'}</td>
                <td>{row.currentLocation || '---'}</td>
                <td>{row.destinationHubCode || '---'}</td>
                <td>{row.destinationHubCode || '---'}</td>
                <td className="ops-monitor-hang-gui__wait">
                  {Math.floor((new Date().getTime() - new Date(row.updatedAt).getTime()) / (1000 * 60))} phút
                </td>
                <td>
                  <span className="ops-monitor-hang-gui__status">Đang vận chuyển</span>
                </td>
              </tr>
            ))}
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu hàng gửi từ server.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
