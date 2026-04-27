import React from 'react';

import './MonitorDataHangNhanPage.css';

interface MonitorReceiveRow {
  stt: number;
  ngay: string;
  bcNhan: string;
  maBcNhan: string;
  tenKhachHang: string;
  maKhachHang: string;
  tongDonNhan: number;
  soDonChuaQuetGui: number;
}

const MOCK_ROWS: MonitorReceiveRow[] = [
  {
    stt: 1,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: '-',
    maKhachHang: '-',
    tongDonNhan: 1,
    soDonChuaQuetGui: 1,
  },
  {
    stt: 2,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'CÔNG TY TNHH SHOP M...',
    maKhachHang: '084LC00005',
    tongDonNhan: 2,
    soDonChuaQuetGui: 2,
  },
  {
    stt: 3,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'TikTok Pte. Ltd.',
    maKhachHang: '084LC00076',
    tongDonNhan: 25,
    soDonChuaQuetGui: 25,
  },
  {
    stt: 4,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'NGUYỄN THỊ KIM NG...',
    maKhachHang: '262LC06159',
    tongDonNhan: 1,
    soDonChuaQuetGui: 1,
  },
  {
    stt: 5,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'NGUYỄN THỊ ĐÀO',
    maKhachHang: '238LC07166',
    tongDonNhan: 1,
    soDonChuaQuetGui: 1,
  },
  {
    stt: 6,
    ngay: '2026-04-28',
    bcNhan: '(NAA) Nghi Lộc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'TRẦN VĂN HÒA',
    maKhachHang: '238LC21035',
    tongDonNhan: 7,
    soDonChuaQuetGui: 7,
  },
];

export function MonitorDataHangNhanPage(): React.JSX.Element {
  const totalReceived = MOCK_ROWS.reduce((sum, row) => sum + row.tongDonNhan, 0);
  const totalPendingOutboundScan = MOCK_ROWS.reduce(
    (sum, row) => sum + row.soDonChuaQuetGui,
    0,
  );

  return (
    <section className="ops-monitor-hang-nhan">
      <header className="ops-monitor-hang-nhan__page-header">
        <div>
          <small>MONITOR_DATA_HANG_NHAN</small>
          <h2>Giám sát hàng nhận</h2>
          <p>Theo dõi các đơn đã nhận tại bưu cục nhưng chưa có thao tác quét gửi ra khỏi bưu cục.</p>
        </div>
        <div className="ops-monitor-hang-nhan__summary">
          <article>
            <span>Tổng đơn nhận</span>
            <strong>{totalReceived}</strong>
          </article>
          <article>
            <span>Chưa quét gửi</span>
            <strong>{totalPendingOutboundScan}</strong>
          </article>
        </div>
      </header>

      <header className="ops-monitor-hang-nhan__tabs">
        <button
          type="button"
          className="ops-monitor-hang-nhan__tab ops-monitor-hang-nhan__tab--active"
        >
          Tổng
        </button>
        <button type="button" className="ops-monitor-hang-nhan__tab">
          Chi tiết
        </button>
      </header>

      <section className="ops-monitor-hang-nhan__toolbar">
        <div className="ops-monitor-hang-nhan__actions">
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Tìm kiếm
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Xuất dữ liệu
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Làm mới
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Trung tâm tải xuống
          </button>
        </div>
        <button type="button" className="ops-monitor-hang-nhan__collapse-btn">
          Thu gọn
        </button>
      </section>

      <section className="ops-monitor-hang-nhan__filters">
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Thời gian bắt đầu:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Thời gian kết thúc:</span>
          <input type="date" defaultValue="2026-04-28" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Phạm vi tổng hợp:</span>
          <select defaultValue="bc-nhan">
            <option value="bc-nhan">BC nhận</option>
            <option value="chi-nhanh">Chi nhánh</option>
          </select>
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>BC nhận:</span>
          <input type="text" defaultValue="(NAA) Nghi Lộc 2 | 238K02" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Chi nhánh nhận hàng:</span>
          <input type="text" defaultValue="(NAA) Nghi Lộc 2 | 238K02" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Mã khách hàng:</span>
          <input type="text" placeholder="Vui lòng nhập nội dung" />
        </label>
      </section>

      <section className="ops-monitor-hang-nhan__table-wrap">
        <table className="ops-monitor-hang-nhan__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ngày</th>
              <th>BC nhận</th>
              <th>Mã BC nhận</th>
              <th>Tên KH</th>
              <th>Mã khách hàng</th>
              <th>Tổng đơn nhận ({totalReceived})</th>
              <th>Số đơn chưa quét gửi ({totalPendingOutboundScan})</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row) => (
              <tr key={row.stt}>
                <td>{row.stt}</td>
                <td>{row.ngay}</td>
                <td>{row.bcNhan}</td>
                <td>{row.maBcNhan}</td>
                <td>{row.tenKhachHang}</td>
                <td>{row.maKhachHang}</td>
                <td className="ops-monitor-hang-nhan__metric-cell">{row.tongDonNhan}</td>
                <td className="ops-monitor-hang-nhan__metric-cell">
                  {row.soDonChuaQuetGui}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
