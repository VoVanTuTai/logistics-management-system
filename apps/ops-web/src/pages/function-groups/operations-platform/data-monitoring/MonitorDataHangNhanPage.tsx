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
  soDonKhongQuetGui: number;
}

const MOCK_ROWS: MonitorReceiveRow[] = [
  {
    stt: 1,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: '-',
    maKhachHang: '-',
    tongDonNhan: 1,
    soDonKhongQuetGui: 1,
  },
  {
    stt: 2,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'CONG TY TNHH SHOP M...',
    maKhachHang: '084LC00005',
    tongDonNhan: 2,
    soDonKhongQuetGui: 2,
  },
  {
    stt: 3,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'TikTok Pte. Ltd.',
    maKhachHang: '084LC00076',
    tongDonNhan: 25,
    soDonKhongQuetGui: 25,
  },
  {
    stt: 4,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'NGUYEN THI KIM NG...',
    maKhachHang: '262LC06159',
    tongDonNhan: 1,
    soDonKhongQuetGui: 1,
  },
  {
    stt: 5,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'NGUYEN THI DAO',
    maKhachHang: '238LC07166',
    tongDonNhan: 1,
    soDonKhongQuetGui: 1,
  },
  {
    stt: 6,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'TRAN VAN HOA',
    maKhachHang: '238LC21035',
    tongDonNhan: 7,
    soDonKhongQuetGui: 7,
  },
  {
    stt: 7,
    ngay: '2023-07-22',
    bcNhan: '(NAA) Nghi Loc 2',
    maBcNhan: '238K02',
    tenKhachHang: 'Tran Thi Binh',
    maKhachHang: '238LC02627',
    tongDonNhan: 1,
    soDonKhongQuetGui: 1,
  },
];

export function MonitorDataHangNhanPage(): React.JSX.Element {
  return (
    <section className="ops-monitor-hang-nhan">
      <header className="ops-monitor-hang-nhan__tabs">
        <button
          type="button"
          className="ops-monitor-hang-nhan__tab ops-monitor-hang-nhan__tab--active"
        >
          Tong
        </button>
        <button type="button" className="ops-monitor-hang-nhan__tab">
          Chi tiet
        </button>
      </header>

      <section className="ops-monitor-hang-nhan__toolbar">
        <div className="ops-monitor-hang-nhan__actions">
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Tim kiem
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Xuat du lieu
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Lam moi
          </button>
          <button type="button" className="ops-monitor-hang-nhan__action-btn">
            Trung tam tai xuong
          </button>
        </div>
        <button type="button" className="ops-monitor-hang-nhan__collapse-btn">
          Thu gon
        </button>
      </section>

      <section className="ops-monitor-hang-nhan__filters">
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Thoi gian bat dau:</span>
          <input type="date" defaultValue="2023-07-22" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Thoi gian ket thuc:</span>
          <input type="date" defaultValue="2023-07-22" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Pham vi tong hop:</span>
          <select defaultValue="bc-nhan">
            <option value="bc-nhan">BC nhan</option>
            <option value="chi-nhanh">Chi nhanh</option>
          </select>
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>BC nhan:</span>
          <input type="text" defaultValue="(NAA) Nghi Loc 2 | 238K02" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Chi nhanh nhan hang:</span>
          <input type="text" defaultValue="(NAA) Nghi Loc 2 | 238K02" />
        </label>
        <label className="ops-monitor-hang-nhan__filter-field">
          <span>Ma khach hang:</span>
          <input type="text" placeholder="Vui long nhap noi dung" />
        </label>
        <button type="button" className="ops-monitor-hang-nhan__summary-btn">
          So don khong quet gui (38)
        </button>
      </section>

      <section className="ops-monitor-hang-nhan__table-wrap">
        <table className="ops-monitor-hang-nhan__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ngay</th>
              <th>BC nhan</th>
              <th>Ma BC nhan</th>
              <th>Ten KH</th>
              <th>Ma khach hang</th>
              <th>Tong don nhan (38)</th>
              <th>So don khong quet gui (38)</th>
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
                  {row.soDonKhongQuetGui}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
