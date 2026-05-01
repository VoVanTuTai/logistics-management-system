import React from 'react';

import './MonitorDataHangGuiPage.css';

interface SentMonitorRow {
  stt: number;
  maVanDon: string;
  thoiGianQuetGui: string;
  bcGui: string;
  maBcGui: string;
  bcDich: string;
  maBcDich: string;
  thoiGianCho: string;
  trangThai: string;
}

const sentRows: SentMonitorRow[] = [];

export function MonitorDataHangGuiPage(): React.JSX.Element {
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
            <strong>{sentRows.length}</strong>
          </article>
          <article>
            <span>Đích chưa nhận</span>
            <strong>{sentRows.length}</strong>
          </article>
        </div>
      </header>

      <section className="ops-monitor-hang-gui__toolbar">
        <div className="ops-monitor-hang-gui__actions">
          <button type="button" className="ops-monitor-hang-gui__action-btn">
            Tìm kiếm
          </button>
          <button type="button" className="ops-monitor-hang-gui__action-btn">
            Xuất dữ liệu
          </button>
          <button type="button" className="ops-monitor-hang-gui__action-btn">
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
          <input type="text" placeholder="Vui lòng nhập mã vận đơn" />
        </label>
      </section>

      <section className="ops-monitor-hang-gui__table-wrap">
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
            {sentRows.map((row) => (
              <tr key={row.maVanDon}>
                <td>{row.stt}</td>
                <td className="ops-monitor-hang-gui__code">{row.maVanDon}</td>
                <td>{row.thoiGianQuetGui}</td>
                <td>{row.bcGui}</td>
                <td>{row.maBcGui}</td>
                <td>{row.bcDich}</td>
                <td>{row.maBcDich}</td>
                <td className="ops-monitor-hang-gui__wait">{row.thoiGianCho}</td>
                <td>
                  <span className="ops-monitor-hang-gui__status">{row.trangThai}</span>
                </td>
              </tr>
            ))}
            {sentRows.length === 0 ? (
              <tr>
                <td colSpan={9}>Chưa có dữ liệu hàng gửi từ server.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
