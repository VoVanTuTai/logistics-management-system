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

const MOCK_USED_BAG_LABELS: UsedBagLabelRow[] = [
  {
    id: 'bag-001',
    bagCode: 'MB0286521001',
    shipmentCount: 26,
    operationAt: '2026-04-21 08:13:42',
    uploadedAt: '2026-04-21 08:14:03',
    originHubCode: '028C01',
    destinationHubCode: '030C02',
  },
  {
    id: 'bag-002',
    bagCode: 'MB0286521002',
    shipmentCount: 31,
    operationAt: '2026-04-21 08:27:11',
    uploadedAt: '2026-04-21 08:27:45',
    originHubCode: '028C01',
    destinationHubCode: '030C02',
  },
  {
    id: 'bag-003',
    bagCode: 'MB0026521003',
    shipmentCount: 19,
    operationAt: '2026-04-21 09:05:23',
    uploadedAt: '2026-04-21 09:05:58',
    originHubCode: '002A15',
    destinationHubCode: '003B09',
  },
  {
    id: 'bag-004',
    bagCode: 'MB0036521004',
    shipmentCount: 42,
    operationAt: '2026-04-21 09:41:08',
    uploadedAt: '2026-04-21 09:41:39',
    originHubCode: '003B09',
    destinationHubCode: '001A01',
  },
  {
    id: 'bag-005',
    bagCode: 'MB0016521005',
    shipmentCount: 14,
    operationAt: '2026-04-21 10:12:57',
    uploadedAt: '2026-04-21 10:13:22',
    originHubCode: '001A01',
    destinationHubCode: '002A15',
  },
];

export function ThermalLabelManagementPage(): React.JSX.Element {
  const totalShipments = MOCK_USED_BAG_LABELS.reduce(
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
          <strong>{MOCK_USED_BAG_LABELS.length}</strong>
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
            {MOCK_USED_BAG_LABELS.map((item) => (
              <tr key={item.id}>
                <td className="ops-thermal-management__bag-code">{item.bagCode}</td>
                <td>{item.shipmentCount}</td>
                <td>{item.operationAt}</td>
                <td>{item.uploadedAt}</td>
                <td>{item.originHubCode}</td>
                <td>{item.destinationHubCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
