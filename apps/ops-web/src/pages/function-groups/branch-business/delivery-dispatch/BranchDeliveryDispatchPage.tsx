import React, { useMemo, useState } from 'react';

import './BranchDeliveryDispatchPage.css';

interface DeliveryOrderRow {
  id: string;
  shipmentCode: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  ward: string;
  district: string;
  serviceType: string;
  codAmount: string;
  lastScan: string;
  sla: 'normal' | 'urgent';
}

const DELIVERY_ORDERS: DeliveryOrderRow[] = [
  {
    id: 'delivery-001',
    shipmentCode: '842502787001',
    receiverName: 'Nguyễn Minh Tâm',
    receiverPhone: '0903***241',
    address: '15 Nguyễn Văn Lộc',
    ward: 'Mộ Lao',
    district: 'Hà Đông',
    serviceType: 'COD',
    codAmount: '450.000 đ',
    lastScan: 'Quét hàng đến - 08:12',
    sla: 'urgent',
  },
  {
    id: 'delivery-002',
    shipmentCode: '842502787018',
    receiverName: 'Trần Hoài An',
    receiverPhone: '0912***775',
    address: 'KĐT Geleximco, Lê Trọng Tấn',
    ward: 'Dương Nội',
    district: 'Hà Đông',
    serviceType: 'Tiêu chuẩn',
    codAmount: '0 đ',
    lastScan: 'Phân loại phát - 08:35',
    sla: 'normal',
  },
  {
    id: 'delivery-003',
    shipmentCode: '842502787025',
    receiverName: 'Phạm Thanh Huyền',
    receiverPhone: '0986***103',
    address: '88 Trần Phú',
    ward: 'Văn Quán',
    district: 'Hà Đông',
    serviceType: 'Nhanh',
    codAmount: '1.250.000 đ',
    lastScan: 'Quét hàng đến - 09:04',
    sla: 'urgent',
  },
  {
    id: 'delivery-004',
    shipmentCode: '842502787032',
    receiverName: 'Lê Quốc Việt',
    receiverPhone: '0968***520',
    address: '12 Tố Hữu',
    ward: 'La Khê',
    district: 'Hà Đông',
    serviceType: 'Tiêu chuẩn',
    codAmount: '180.000 đ',
    lastScan: 'Giữ tại bưu cục - 09:20',
    sla: 'normal',
  },
];

const couriers = [
  { id: 'cr-01', name: 'Nguyễn Văn Hùng', route: 'Hà Đông 01', activeTasks: 12 },
  { id: 'cr-02', name: 'Trần Quốc Bảo', route: 'Hà Đông 02', activeTasks: 9 },
  { id: 'cr-03', name: 'Lê Minh Tuấn', route: 'Hà Đông 03', activeTasks: 7 },
];

function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4 15-3-6z" />
      <path d="m12 14 7-9" />
    </svg>
  );
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function BranchDeliveryDispatchPage(): React.JSX.Element {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([
    DELIVERY_ORDERS[0].id,
    DELIVERY_ORDERS[2].id,
  ]);
  const [districtFilter, setDistrictFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    if (districtFilter === 'all') {
      return DELIVERY_ORDERS;
    }

    return DELIVERY_ORDERS.filter((order) => order.ward === districtFilter);
  }, [districtFilter]);

  const selectedOrders = DELIVERY_ORDERS.filter((order) => selectedOrderIds.includes(order.id));
  const urgentSelectedCount = selectedOrders.filter((order) => order.sla === 'urgent').length;

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((selectedId) => selectedId !== orderId)
        : [...current, orderId],
    );
  };

  return (
    <section className="ops-branch-delivery">
      <header className="ops-branch-delivery__header">
        <div>
          <small>BRANCH_DELIVERY_DISPATCH</small>
          <h2>Phát hàng</h2>
          <p>Chọn đơn chờ phát tại bưu cục và đẩy danh sách giao hàng sang app courier.</p>
        </div>
        <div className="ops-branch-delivery__summary">
          <article>
            <span>Chờ phát</span>
            <strong>{DELIVERY_ORDERS.length}</strong>
          </article>
          <article>
            <span>Đã chọn</span>
            <strong>{selectedOrderIds.length}</strong>
          </article>
          <article>
            <span>Ưu tiên</span>
            <strong>{urgentSelectedCount}</strong>
          </article>
        </div>
      </header>

      <section className="ops-branch-delivery__filters">
        <label>
          <span>Tuyến / phường</span>
          <select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Mộ Lao">Mộ Lao</option>
            <option value="Dương Nội">Dương Nội</option>
            <option value="Văn Quán">Văn Quán</option>
            <option value="La Khê">La Khê</option>
          </select>
        </label>
        <label>
          <span>Dịch vụ</span>
          <select defaultValue="all">
            <option value="all">Tất cả</option>
            <option value="cod">COD</option>
            <option value="fast">Nhanh</option>
            <option value="standard">Tiêu chuẩn</option>
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select defaultValue="waiting-delivery">
            <option value="waiting-delivery">Chờ phát</option>
            <option value="held">Giữ tại bưu cục</option>
          </select>
        </label>
        <label className="ops-branch-delivery__search">
          <span>Tìm kiếm</span>
          <div>
            <SearchIcon />
            <input type="text" placeholder="Mã vận đơn, người nhận, số điện thoại" />
          </div>
        </label>
      </section>

      <div className="ops-branch-delivery__content">
        <section className="ops-branch-delivery__table-card">
          <div className="ops-branch-delivery__table-title">
            <h3>Danh sách đơn chờ phát</h3>
            <span>{filteredOrders.length} đơn</span>
          </div>
          <div className="ops-branch-delivery__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>Mã vận đơn</th>
                  <th>Người nhận</th>
                  <th>Địa chỉ giao</th>
                  <th>Dịch vụ</th>
                  <th>COD</th>
                  <th>Thao tác cuối</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        aria-label={`Chọn ${order.shipmentCode}`}
                      />
                    </td>
                    <td className="ops-branch-delivery__code">{order.shipmentCode}</td>
                    <td>
                      <strong>{order.receiverName}</strong>
                      <small>{order.receiverPhone}</small>
                    </td>
                    <td>
                      {order.address}
                      <small>
                        {order.ward}, {order.district}
                      </small>
                    </td>
                    <td>{order.serviceType}</td>
                    <td>{order.codAmount}</td>
                    <td>{order.lastScan}</td>
                    <td>
                      <span
                        className={
                          order.sla === 'urgent'
                            ? 'ops-branch-delivery__sla ops-branch-delivery__sla--urgent'
                            : 'ops-branch-delivery__sla'
                        }
                      >
                        {order.sla === 'urgent' ? 'Cần phát sớm' : 'Trong hạn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ops-branch-delivery__assign-card">
          <h3>Đẩy sang app courier</h3>
          <label>
            <span>Courier đi giao</span>
            <select defaultValue={couriers[0].id}>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name} - {courier.route}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ca giao</span>
            <select defaultValue="current">
              <option value="current">Ca hiện tại</option>
              <option value="afternoon">Ca chiều</option>
              <option value="evening">Ca tối</option>
            </select>
          </label>
          <label>
            <span>Ghi chú giao hàng</span>
            <textarea defaultValue="Ưu tiên đơn COD và đơn có SLA cần phát sớm." />
          </label>

          <div className="ops-branch-delivery__courier-load">
            {couriers.map((courier) => (
              <article key={courier.id}>
                <span>{courier.name}</span>
                <strong>{courier.activeTasks} đơn đang giao</strong>
              </article>
            ))}
          </div>

          <button type="button" className="ops-branch-delivery__assign-btn">
            <SendIcon />
            Phát hàng sang app courier
          </button>
        </aside>
      </div>
    </section>
  );
}
