import React from 'react';

import './OpsMetricsInventoryMonitorPage.css';

interface InventoryMonitorRow {
  stt: number;
  thoiGianTttc: string;
  tongKienTon: number;
  tonQuaHan: number;
  canhBao: string;
}

const MOCK_ROWS: InventoryMonitorRow[] = [
  {
    stt: 1,
    thoiGianTttc: '2023-07',
    tongKienTon: 321,
    tonQuaHan: 14,
    canhBao: 'Muc 2',
  },
  {
    stt: 2,
    thoiGianTttc: '2023-08',
    tongKienTon: 298,
    tonQuaHan: 9,
    canhBao: 'Muc 1',
  },
  {
    stt: 3,
    thoiGianTttc: '2023-09',
    tongKienTon: 344,
    tonQuaHan: 17,
    canhBao: 'Muc 3',
  },
  {
    stt: 4,
    thoiGianTttc: '2023-10',
    tongKienTon: 280,
    tonQuaHan: 8,
    canhBao: 'Muc 1',
  },
  {
    stt: 5,
    thoiGianTttc: '2023-11',
    tongKienTon: 306,
    tonQuaHan: 12,
    canhBao: 'Muc 2',
  },
];

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__tabs" role="tablist" aria-label="Tong hop ton kho">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="ops-metrics-inventory__tab ops-metrics-inventory__tab--active"
        >
          Tong
        </button>
        <button type="button" role="tab" aria-selected="false" className="ops-metrics-inventory__tab">
          Chi tiet
        </button>
      </header>

      <div className="ops-metrics-inventory__toolbar">
        <button type="button" className="ops-metrics-inventory__search-btn">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </span>
          Tim kiem
        </button>

        <button type="button" className="ops-metrics-inventory__export-btn">
          Xuat du lieu
        </button>
      </div>

      <div className="ops-metrics-inventory__filters">
        <label className="ops-metrics-inventory__filter-field">
          <span>Pham vi lua chon:</span>
          <select defaultValue="tttc-quet-gui-kien">
            <option value="tttc-quet-gui-kien">Theo TTTC quet gui kien</option>
            <option value="hub-vung">Theo hub/vung</option>
            <option value="chi-nhanh">Theo chi nhanh</option>
          </select>
        </label>
      </div>

      <div className="ops-metrics-inventory__table-wrap">
        <table className="ops-metrics-inventory__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Thoi gian TTTC phat hang</th>
              <th>Tong kien ton</th>
              <th>Ton qua han</th>
              <th>Muc canh bao</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row) => (
              <tr key={row.stt}>
                <td>{row.stt}</td>
                <td>{row.thoiGianTttc}</td>
                <td>{row.tongKienTon}</td>
                <td className="ops-metrics-inventory__danger-cell">{row.tonQuaHan}</td>
                <td>{row.canhBao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
