import React from 'react';

import './BranchLocalOrderOverviewPage.css';

interface LocalOrderRow {
  shipmentCode: string;
  currentStage: string;
  customerName: string;
  serviceType: string;
  lastScan: string;
  courier: string;
  aging: string;
  alert: string;
}

const LOCAL_ORDER_ROWS: LocalOrderRow[] = [
  {
    shipmentCode: '842502786501',
    currentStage: 'Chờ phát',
    customerName: 'Shop Minh Anh',
    serviceType: 'Tiêu chuẩn',
    lastScan: 'Đã quét hàng đến - 08:12',
    courier: 'Chưa bàn giao',
    aging: '2 giờ 15 phút',
    alert: 'Trong hạn',
  },
  {
    shipmentCode: '842502786518',
    currentStage: 'Chờ gửi đi',
    customerName: 'TikTok Pte. Ltd.',
    serviceType: 'Nhanh',
    lastScan: 'Đã nhận tại bưu cục - 09:04',
    courier: 'Không áp dụng',
    aging: '1 giờ 23 phút',
    alert: 'Chưa quét gửi',
  },
  {
    shipmentCode: '842502786525',
    currentStage: 'Đã bàn giao courier',
    customerName: 'Kho trả hàng Shopee',
    serviceType: 'Hàng trả',
    lastScan: 'Bàn giao phát - 09:30',
    courier: 'Nguyễn Văn Hùng',
    aging: '57 phút',
    alert: 'Đang xử lý',
  },
  {
    shipmentCode: '842502786532',
    currentStage: 'Tồn bưu cục',
    customerName: 'Nguyễn Thị Đào',
    serviceType: 'COD',
    lastScan: 'Giữ tại bưu cục - Hôm qua',
    courier: 'Trần Quốc Bảo',
    aging: '26 giờ',
    alert: 'Quá hạn',
  },
];

const KPI_ITEMS = [
  { label: 'Đơn đang ở bưu cục', value: 146 },
  { label: 'Chờ phát', value: 58 },
  { label: 'Chờ gửi đi', value: 31 },
  { label: 'Đã bàn giao courier', value: 42 },
  { label: 'Đơn tồn quá hạn', value: 15 },
];

export function BranchLocalOrderOverviewPage(): React.JSX.Element {
  return (
    <section className="ops-branch-local-orders">
      <header className="ops-branch-local-orders__header">
        <div>
          <small>BRANCH_LOCAL_ORDER_OVERVIEW</small>
          <h2>Tổng quan đơn tại bưu cục</h2>
          <p>Theo dõi toàn bộ đơn đang nằm trong phạm vi bưu cục của nhân viên đăng nhập.</p>
        </div>
        <div className="ops-branch-local-orders__scope">
          <span>Bưu cục hiện tại</span>
          <strong>BC Hà Đông | 001K03</strong>
        </div>
      </header>

      <section className="ops-branch-local-orders__kpis">
        {KPI_ITEMS.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="ops-branch-local-orders__filters">
        <label>
          <span>Trạng thái tại bưu cục</span>
          <select defaultValue="all">
            <option value="all">Tất cả</option>
            <option value="waiting-delivery">Chờ phát</option>
            <option value="waiting-outbound">Chờ gửi đi</option>
            <option value="handed-over">Đã bàn giao courier</option>
            <option value="aging">Tồn bưu cục</option>
          </select>
        </label>
        <label>
          <span>Courier phụ trách</span>
          <select defaultValue="all">
            <option value="all">Tất cả</option>
            <option value="hung">Nguyễn Văn Hùng</option>
            <option value="bao">Trần Quốc Bảo</option>
          </select>
        </label>
        <label>
          <span>Mã vận đơn</span>
          <input type="text" placeholder="Nhập mã vận đơn" />
        </label>
        <label>
          <span>Cảnh báo</span>
          <select defaultValue="all">
            <option value="all">Tất cả</option>
            <option value="overdue">Quá hạn</option>
            <option value="pending-scan">Chưa quét gửi</option>
          </select>
        </label>
      </section>

      <section className="ops-branch-local-orders__content">
        <article className="ops-branch-local-orders__work-card">
          <h3>Luồng xử lý trong bưu cục</h3>
          <ol>
            <li>
              <strong>Nhận vào</strong>
              <span>Đơn được quét nhận hoặc quét hàng đến bưu cục.</span>
            </li>
            <li>
              <strong>Phân loại</strong>
              <span>Chia đơn chờ phát, chờ gửi đi, hàng trả hoặc giữ tại quầy.</span>
            </li>
            <li>
              <strong>Bàn giao</strong>
              <span>Giao courier đi phát/lấy hoặc gửi tiếp sang tuyến đích.</span>
            </li>
            <li>
              <strong>Chốt ca</strong>
              <span>Đối soát đơn đã xử lý và đơn tồn cuối ca.</span>
            </li>
          </ol>
        </article>

        <section className="ops-branch-local-orders__table-card">
          <div className="ops-branch-local-orders__table-title">
            <h3>Danh sách đơn đang ở bưu cục</h3>
            <button type="button">Xuất dữ liệu</button>
          </div>
          <div className="ops-branch-local-orders__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã vận đơn</th>
                  <th>Trạng thái tại bưu cục</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Thao tác cuối</th>
                  <th>Courier</th>
                  <th>Thời gian lưu</th>
                  <th>Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {LOCAL_ORDER_ROWS.map((row) => (
                  <tr key={row.shipmentCode}>
                    <td className="ops-branch-local-orders__code">{row.shipmentCode}</td>
                    <td>{row.currentStage}</td>
                    <td>{row.customerName}</td>
                    <td>{row.serviceType}</td>
                    <td>{row.lastScan}</td>
                    <td>{row.courier}</td>
                    <td>{row.aging}</td>
                    <td>
                      <span
                        className={
                          row.alert === 'Quá hạn'
                            ? 'ops-branch-local-orders__alert ops-branch-local-orders__alert--danger'
                            : 'ops-branch-local-orders__alert'
                        }
                      >
                        {row.alert}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  );
}
