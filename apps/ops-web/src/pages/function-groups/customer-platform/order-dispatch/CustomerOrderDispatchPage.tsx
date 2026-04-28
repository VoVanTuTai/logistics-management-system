import React, { useMemo, useState } from 'react';

import './CustomerOrderDispatchPage.css';

type DispatchOrderType = 'shop_pickup' | 'return_pickup';

interface DispatchOrderRow {
  id: string;
  orderCode: string;
  type: DispatchOrderType;
  shopName: string;
  contactPhone: string;
  address: string;
  ward: string;
  district: string;
  parcelCount: number;
  requestedTime: string;
  priority: 'normal' | 'urgent';
}

const DISPATCH_ORDERS: DispatchOrderRow[] = [
  {
    id: 'dispatch-001',
    orderCode: 'OD250428001',
    type: 'shop_pickup',
    shopName: 'Shop Minh Anh',
    contactPhone: '0903***241',
    address: '15 Nguyễn Văn Lộc',
    ward: 'Mộ Lao',
    district: 'Hà Đông',
    parcelCount: 12,
    requestedTime: '08:30 - 10:00',
    priority: 'urgent',
  },
  {
    id: 'dispatch-002',
    orderCode: 'RT250428014',
    type: 'return_pickup',
    shopName: 'Kho trả hàng Shopee',
    contactPhone: '0912***775',
    address: 'KĐT Geleximco, Lê Trọng Tấn',
    ward: 'Dương Nội',
    district: 'Hà Đông',
    parcelCount: 7,
    requestedTime: '10:00 - 12:00',
    priority: 'normal',
  },
  {
    id: 'dispatch-003',
    orderCode: 'OD250428027',
    type: 'shop_pickup',
    shopName: 'Thời trang Bảo Ngọc',
    contactPhone: '0986***103',
    address: '88 Trần Duy Hưng',
    ward: 'Trung Hòa',
    district: 'Cầu Giấy',
    parcelCount: 18,
    requestedTime: '13:30 - 15:00',
    priority: 'urgent',
  },
  {
    id: 'dispatch-004',
    orderCode: 'RT250428032',
    type: 'return_pickup',
    shopName: 'Điểm trả hàng Nam Từ Liêm',
    contactPhone: '0968***520',
    address: '12 Hàm Nghi',
    ward: 'Mỹ Đình 2',
    district: 'Nam Từ Liêm',
    parcelCount: 5,
    requestedTime: '15:00 - 17:00',
    priority: 'normal',
  },
];

const couriers = [
  { id: 'cr-01', name: 'Nguyễn Văn Hùng', route: 'Hà Đông 01', assigned: 8 },
  { id: 'cr-02', name: 'Trần Quốc Bảo', route: 'Cầu Giấy 02', assigned: 6 },
  { id: 'cr-03', name: 'Lê Minh Tuấn', route: 'Nam Từ Liêm 01', assigned: 4 },
];

const orderTypeLabels: Record<DispatchOrderType, string> = {
  shop_pickup: 'Hàng shop',
  return_pickup: 'Hàng trả',
};

function formatOrderType(type: DispatchOrderType): string {
  return orderTypeLabels[type];
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4 15-3-6z" />
      <path d="m12 14 7-9" />
    </svg>
  );
}

export function CustomerOrderDispatchPage(): React.JSX.Element {
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | DispatchOrderType>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([
    DISPATCH_ORDERS[0].id,
    DISPATCH_ORDERS[1].id,
  ]);

  const filteredOrders = useMemo(() => {
    if (orderTypeFilter === 'all') {
      return DISPATCH_ORDERS;
    }

    return DISPATCH_ORDERS.filter((order) => order.type === orderTypeFilter);
  }, [orderTypeFilter]);

  const selectedOrders = DISPATCH_ORDERS.filter((order) => selectedOrderIds.includes(order.id));
  const selectedParcelCount = selectedOrders.reduce((sum, order) => sum + order.parcelCount, 0);

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((selectedId) => selectedId !== orderId)
        : [...current, orderId],
    );
  };

  return (
    <section className="ops-customer-dispatch">
      <header className="ops-customer-dispatch__header">
        <div>
          <small>CUSTOMER_ORDER_DISPATCH</small>
          <h2>Điều phối hàng shop / hàng trả</h2>
          <p>Phân công đơn cần lấy sang app courier của bưu cục để nhân viên đi lấy hàng.</p>
        </div>
        <div className="ops-customer-dispatch__summary">
          <article>
            <span>Chờ điều phối</span>
            <strong>{DISPATCH_ORDERS.length}</strong>
          </article>
          <article>
            <span>Đã chọn</span>
            <strong>{selectedOrderIds.length}</strong>
          </article>
          <article>
            <span>Kiện cần lấy</span>
            <strong>{selectedParcelCount}</strong>
          </article>
        </div>
      </header>

      <section className="ops-customer-dispatch__filters">
        <label>
          <span>Loại hàng</span>
          <select
            value={orderTypeFilter}
            onChange={(event) =>
              setOrderTypeFilter(event.target.value as 'all' | DispatchOrderType)
            }
          >
            <option value="all">Tất cả</option>
            <option value="shop_pickup">Hàng của shop</option>
            <option value="return_pickup">Hàng trả</option>
          </select>
        </label>
        <label>
          <span>Bưu cục xử lý</span>
          <select defaultValue="BC-HNI-HAD">
            <option value="BC-HNI-HAD">BC Hà Đông</option>
            <option value="BC-HNI-CG">BC Cầu Giấy</option>
            <option value="BC-HNI-NTL">BC Nam Từ Liêm</option>
          </select>
        </label>
        <label>
          <span>Khung giờ lấy</span>
          <select defaultValue="today">
            <option value="today">Hôm nay</option>
            <option value="morning">Ca sáng</option>
            <option value="afternoon">Ca chiều</option>
          </select>
        </label>
        <label className="ops-customer-dispatch__search">
          <span>Tìm kiếm</span>
          <div>
            <SearchIcon />
            <input type="text" placeholder="Mã đơn, shop, địa chỉ" />
          </div>
        </label>
      </section>

      <div className="ops-customer-dispatch__content">
        <section className="ops-customer-dispatch__table-card">
          <div className="ops-customer-dispatch__table-title">
            <h3>Danh sách đơn chờ điều phối</h3>
            <span>{filteredOrders.length} đơn</span>
          </div>
          <div className="ops-customer-dispatch__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>Mã đơn</th>
                  <th>Loại hàng</th>
                  <th>Shop / điểm lấy</th>
                  <th>Địa chỉ lấy</th>
                  <th>Số kiện</th>
                  <th>Khung giờ</th>
                  <th>Ưu tiên</th>
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
                        aria-label={`Chọn ${order.orderCode}`}
                      />
                    </td>
                    <td className="ops-customer-dispatch__code">{order.orderCode}</td>
                    <td>
                      <span
                        className={
                          order.type === 'shop_pickup'
                            ? 'ops-customer-dispatch__type ops-customer-dispatch__type--shop'
                            : 'ops-customer-dispatch__type ops-customer-dispatch__type--return'
                        }
                      >
                        {formatOrderType(order.type)}
                      </span>
                    </td>
                    <td>
                      <strong>{order.shopName}</strong>
                      <small>{order.contactPhone}</small>
                    </td>
                    <td>
                      {order.address}
                      <small>
                        {order.ward}, {order.district}
                      </small>
                    </td>
                    <td>{order.parcelCount}</td>
                    <td>{order.requestedTime}</td>
                    <td>
                      <span
                        className={
                          order.priority === 'urgent'
                            ? 'ops-customer-dispatch__priority ops-customer-dispatch__priority--urgent'
                            : 'ops-customer-dispatch__priority'
                        }
                      >
                        {order.priority === 'urgent' ? 'Gấp' : 'Thường'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ops-customer-dispatch__assign-card">
          <h3>Phân công sang app courier</h3>
          <label>
            <span>Courier nhận việc</span>
            <select defaultValue={couriers[0].id}>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name} - {courier.route}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Hạn hoàn thành</span>
            <select defaultValue="2h">
              <option value="2h">Trong 2 giờ</option>
              <option value="4h">Trong 4 giờ</option>
              <option value="today">Trong ngày</option>
            </select>
          </label>
          <label>
            <span>Ghi chú cho courier</span>
            <textarea defaultValue="Ưu tiên lấy hàng shop và hàng trả trong cùng tuyến." />
          </label>

          <div className="ops-customer-dispatch__courier-load">
            {couriers.map((courier) => (
              <article key={courier.id}>
                <span>{courier.name}</span>
                <strong>{courier.assigned} việc</strong>
              </article>
            ))}
          </div>

          <button type="button" className="ops-customer-dispatch__assign-btn">
            <SendIcon />
            Điều phối sang app courier
          </button>
        </aside>
      </div>
    </section>
  );
}
