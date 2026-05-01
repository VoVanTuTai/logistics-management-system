import React from 'react';

import './OpsMetricsInventoryMonitorPage.css';

interface InventoryMonitorRow {
  stt: number;
  thoiGianTttc: string;
  tongKienTon: number;
  tonQuaHan: number;
  canhBao: string;
}

const rows: InventoryMonitorRow[] = [];

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__tabs" role="tablist" aria-label="Tổng hợp tồn kho">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="ops-metrics-inventory__tab ops-metrics-inventory__tab--active"
        >
          Tổng
        </button>
        <button type="button" role="tab" aria-selected="false" className="ops-metrics-inventory__tab">
          Chi tiết
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
          Tìm kiếm
        </button>

        <button type="button" className="ops-metrics-inventory__export-btn">
          Xuất dữ liệu
        </button>
      </div>

      <div className="ops-metrics-inventory__filters">
        <label className="ops-metrics-inventory__filter-field">
          <span>Phạm vi lựa chọn:</span>
          <select defaultValue="tttc-quet-gui-kien">
            <option value="tttc-quet-gui-kien">Theo TTTC quét gửi kiện</option>
            <option value="hub-vung">Theo hub/vùng</option>
            <option value="chi-nhanh">Theo chi nhánh</option>
          </select>
        </label>
      </div>

      <div className="ops-metrics-inventory__table-wrap">
        <table className="ops-metrics-inventory__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Thời gian TTTC phát hàng</th>
              <th>Tổng kiện tồn</th>
              <th>Tồn quá hạn</th>
              <th>Mức cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stt}>
                <td>{row.stt}</td>
                <td>{row.thoiGianTttc}</td>
                <td>{row.tongKienTon}</td>
                <td className="ops-metrics-inventory__danger-cell">{row.tonQuaHan}</td>
                <td>{row.canhBao}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>Chưa có dữ liệu tồn kho từ server.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
