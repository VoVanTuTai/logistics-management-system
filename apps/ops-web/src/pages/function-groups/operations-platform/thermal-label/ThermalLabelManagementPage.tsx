import React from 'react';

import './ThermalLabelManagementPage.css';

interface UsedBagLabelRow {
  id: string;
  bagCode: string;
  shipmentCount: number;
  operationAt: string;
  uploadedAt: string;
  originHubCode: string;
  destinationHubCode: string;
}

const usedBagLabels: UsedBagLabelRow[] = [];

export function ThermalLabelManagementPage(): React.JSX.Element {
  const totalShipments = usedBagLabels.reduce(
    (sum, item) => sum + item.shipmentCount,
    0,
  );

  return (
    <section className="ops-thermal-management">
      <header className="ops-thermal-management__header">
        <small>THERMAL_LABEL_MANAGEMENT</small>
        <h2>Quản lý tem bao đã sử dụng</h2>
        <p>
          Danh sách bên dưới là các tem bao đã có thao tác đóng bao và đã tải lên hệ thống.
        </p>
      </header>

      <section className="ops-thermal-management__summary">
        <article className="ops-thermal-management__summary-card">
          <span>Tổng tem bao đã sử dụng</span>
          <strong>{usedBagLabels.length}</strong>
        </article>
        <article className="ops-thermal-management__summary-card">
          <span>Tổng số đơn trong các bao</span>
          <strong>{totalShipments}</strong>
        </article>
      </section>

      <section className="ops-thermal-management__table-wrap">
        <table className="ops-thermal-management__table">
          <thead>
            <tr>
              <th>Mã bao</th>
              <th>Số lượng đơn trong bao</th>
              <th>Ngày giờ thao tác</th>
              <th>Ngày giờ tải lên</th>
              <th>Mã hub đi</th>
              <th>Mã hub đến</th>
            </tr>
          </thead>
          <tbody>
            {usedBagLabels.map((item) => (
              <tr key={item.id}>
                <td className="ops-thermal-management__bag-code">{item.bagCode}</td>
                <td>{item.shipmentCount}</td>
                <td>{item.operationAt}</td>
                <td>{item.uploadedAt}</td>
                <td>{item.originHubCode}</td>
                <td>{item.destinationHubCode}</td>
              </tr>
            ))}
            {usedBagLabels.length === 0 ? (
              <tr>
                <td colSpan={6}>Chưa có dữ liệu tem bao từ server.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
