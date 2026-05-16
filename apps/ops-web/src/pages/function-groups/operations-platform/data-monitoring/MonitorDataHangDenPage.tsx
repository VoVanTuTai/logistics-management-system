import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';

import './MonitorDataHangDenPage.css';

interface ArrivalMonitorRow {
  stt: number;
  maVanDon: string;
  thoiGianQuetDen: string;
  bcDen: string;
  maBcDen: string;
  bcGui: string;
  trangThai: string;
  nguoiQuet: string;
}

export function MonitorDataHangDenPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShipmentListItemDto[]>([]);
  const [filterCode, setFilterCode] = useState('');

  const fetchData = useCallback(async () => {
    if (!session?.tokens.accessToken) return;
    
    setLoading(true);
    try {
      const result = await shipmentsClient.list(session.tokens.accessToken, {
        status: 'SCAN_INBOUND',
        q: filterCode || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch arrival data:', error);
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
    <section className="ops-monitor-hang-den">
      <header className="ops-monitor-hang-den__page-header">
        <div>
          <small>MONITOR_DATA_HANG_DEN</small>
          <h2>Giám sát hàng đến</h2>
          <p>Theo dõi những đơn đã có thao tác quét hàng đến tại bưu cục.</p>
        </div>
        <div className="ops-monitor-hang-den__summary">
          <article>
            <span>Đã quét đến</span>
            <strong>{data.length}</strong>
          </article>
          <article>
            <span>Bưu cục đến</span>
            <strong>{new Set(data.map(d => d.currentLocation).filter(Boolean)).size}</strong>
          </article>
        </div>
      </header>

      <section className="ops-monitor-hang-den__toolbar">
        <div className="ops-monitor-hang-den__actions">
          <button type="button" className="ops-monitor-hang-den__action-btn" onClick={handleSearch}>
            Tìm kiếm
          </button>
          <button type="button" className="ops-monitor-hang-den__action-btn">
            Xuất dữ liệu
          </button>
          <button type="button" className="ops-monitor-hang-den__action-btn" onClick={handleRefresh}>
            Làm mới
          </button>
        </div>
        <button type="button" className="ops-monitor-hang-den__collapse-btn">
          Thu gọn
        </button>
      </section>

      <section className="ops-monitor-hang-den__filters">
        <label className="ops-monitor-hang-den__filter-field">
          <span>Thời gian quét đến từ:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-den__filter-field">
          <span>Thời gian quét đến đến:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-den__filter-field">
          <span>BC đến:</span>
          <input type="text" placeholder="Chọn hoặc nhập bưu cục đến" />
        </label>
        <label className="ops-monitor-hang-den__filter-field">
          <span>BC gửi:</span>
          <input type="text" placeholder="Chọn hoặc nhập bưu cục gửi" />
        </label>
        <label className="ops-monitor-hang-den__filter-field">
          <span>Mã vận đơn:</span>
          <input 
            type="text" 
            placeholder="Vui lòng nhập mã vận đơn" 
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
          />
        </label>
      </section>

      <section className="ops-monitor-hang-den__table-wrap">
        {loading && <div className="ops-loading-overlay">Đang tải dữ liệu...</div>}
        <table className="ops-monitor-hang-den__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vận đơn</th>
              <th>Thời gian quét đến</th>
              <th>BC đến</th>
              <th>Mã BC đến</th>
              <th>BC gửi</th>
              <th>Trạng thái</th>
              <th>Người quét</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.shipmentCode}>
                <td>{index + 1}</td>
                <td className="ops-monitor-hang-den__code">{row.shipmentCode}</td>
                <td>{new Date(row.updatedAt).toLocaleString('vi-VN')}</td>
                <td>{row.currentLocation || '---'}</td>
                <td>{row.currentLocation || '---'}</td>
                <td>{row.originHubCode || '---'}</td>
                <td>
                  <span className="ops-monitor-hang-den__status">Hàng đến</span>
                </td>
                <td>Hệ thống</td>
              </tr>
            ))}
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu hàng đến từ server.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
