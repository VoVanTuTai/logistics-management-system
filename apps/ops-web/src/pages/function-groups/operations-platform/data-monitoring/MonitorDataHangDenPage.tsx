import React from 'react';

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

const MOCK_ARRIVAL_ROWS: ArrivalMonitorRow[] = [
  {
    stt: 1,
    maVanDon: '842502785302',
    thoiGianQuetDen: '2026-04-28 08:12:35',
    bcDen: '(HNI) Hà Đông',
    maBcDen: '001K03',
    bcGui: '(NAA) Nghi Lộc 2',
    trangThai: 'Đã quét hàng đến',
    nguoiQuet: 'OPS_HAD_01',
  },
  {
    stt: 2,
    maVanDon: '842502785319',
    thoiGianQuetDen: '2026-04-28 08:18:11',
    bcDen: '(HNI) Hà Đông',
    maBcDen: '001K03',
    bcGui: '(NAA) Nghi Lộc 2',
    trangThai: 'Đã quét hàng đến',
    nguoiQuet: 'OPS_HAD_01',
  },
  {
    stt: 3,
    maVanDon: '842502785326',
    thoiGianQuetDen: '2026-04-28 09:04:27',
    bcDen: '(HNI) Nam Từ Liêm',
    maBcDen: '001K07',
    bcGui: '(THA) Bỉm Sơn',
    trangThai: 'Đã quét hàng đến',
    nguoiQuet: 'OPS_NTL_02',
  },
  {
    stt: 4,
    maVanDon: '842502785333',
    thoiGianQuetDen: '2026-04-28 09:21:09',
    bcDen: '(HNI) Cầu Giấy',
    maBcDen: '001K05',
    bcGui: '(NAA) Vinh',
    trangThai: 'Đã quét hàng đến',
    nguoiQuet: 'OPS_CG_03',
  },
];

export function MonitorDataHangDenPage(): React.JSX.Element {
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
            <strong>{MOCK_ARRIVAL_ROWS.length}</strong>
          </article>
          <article>
            <span>Bưu cục đến</span>
            <strong>3</strong>
          </article>
        </div>
      </header>

      <section className="ops-monitor-hang-den__toolbar">
        <div className="ops-monitor-hang-den__actions">
          <button type="button" className="ops-monitor-hang-den__action-btn">
            Tìm kiếm
          </button>
          <button type="button" className="ops-monitor-hang-den__action-btn">
            Xuất dữ liệu
          </button>
          <button type="button" className="ops-monitor-hang-den__action-btn">
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
          <input type="text" placeholder="Vui lòng nhập mã vận đơn" />
        </label>
      </section>

      <section className="ops-monitor-hang-den__table-wrap">
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
            {MOCK_ARRIVAL_ROWS.map((row) => (
              <tr key={row.maVanDon}>
                <td>{row.stt}</td>
                <td className="ops-monitor-hang-den__code">{row.maVanDon}</td>
                <td>{row.thoiGianQuetDen}</td>
                <td>{row.bcDen}</td>
                <td>{row.maBcDen}</td>
                <td>{row.bcGui}</td>
                <td>
                  <span className="ops-monitor-hang-den__status">{row.trangThai}</span>
                </td>
                <td>{row.nguoiQuet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
