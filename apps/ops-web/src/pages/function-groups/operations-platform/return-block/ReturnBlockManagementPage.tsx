import React, { useMemo, useState } from 'react';

import { openReturnShippingLabelPrint } from '../../../../printing/returnShippingLabelPrint';
import './ReturnBlockManagementPage.css';

type ReturnOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ReturnOrder {
  id: string;
  originalCode: string;
  newCode: string;
  status: ReturnOrderStatus;
  reason: string;
  createdAt: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  returnHubCode: string;
  returnZoneCode: string;
  itemDescription: string;
  parcelNote: string;
}

const mockReturnOrders: ReturnOrder[] = [
  {
    id: 'R001',
    originalCode: '842502785302',
    newCode: '842502785302-R',
    status: 'APPROVED',
    reason: 'Không liên lạc được với khách hàng',
    createdAt: '2023-10-15 14:30',
    senderName: 'Nguyễn Minh Anh',
    senderPhone: '0901 222 333',
    senderAddress: '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    receiverName: 'Cửa hàng NEXUS Shop',
    receiverPhone: '028 7777 8888',
    receiverAddress: 'Kho hoàn HCM-01, 25 Tân Thuận, Quận 7, TP. Hồ Chí Minh',
    returnHubCode: 'HCM-01',
    returnZoneCode: 'RET-HCM',
    itemDescription: 'Hàng TMĐT - phụ kiện điện tử',
    parcelNote: 'Kiện hoàn nguyên trạng, ưu tiên đối soát trong ngày.',
  },
  {
    id: 'R002',
    originalCode: '842502785444',
    newCode: '842502785444-R',
    status: 'PENDING',
    reason: 'Người gửi yêu cầu chuyển hoàn',
    createdAt: '2023-10-16 09:15',
    senderName: 'Trần Quốc Bảo',
    senderPhone: '0918 456 789',
    senderAddress: '88 Lê Văn Việt, TP. Thủ Đức, TP. Hồ Chí Minh',
    receiverName: 'Kho người gửi - BAO Store',
    receiverPhone: '0909 112 233',
    receiverAddress: '34 Phạm Văn Đồng, TP. Thủ Đức, TP. Hồ Chí Minh',
    returnHubCode: 'SGN-TD',
    returnZoneCode: 'RET-TD',
    itemDescription: 'Thời trang',
    parcelNote: 'Chờ duyệt trước khi in tem chính thức.',
  },
  {
    id: 'R003',
    originalCode: '842502786001',
    newCode: '842502786001-R',
    status: 'REJECTED',
    reason: 'Yêu cầu thiếu căn cứ xử lý',
    createdAt: '2023-10-16 11:45',
    senderName: 'Lê Hoàng Nam',
    senderPhone: '0935 777 222',
    senderAddress: '19 Cầu Giấy, Hà Nội',
    receiverName: 'NEXUS Merchant Care',
    receiverPhone: '024 6666 1111',
    receiverAddress: 'Kho hoàn HN-02, Long Biên, Hà Nội',
    returnHubCode: 'HN-02',
    returnZoneCode: 'RET-HN',
    itemDescription: 'Mỹ phẩm',
    parcelNote: 'Không in tem với yêu cầu đã từ chối.',
  },
];

const statusLabels: Record<ReturnOrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function buildReturnInstruction(order: ReturnOrder): string {
  return [
    'Đây là tem chuyển hoàn, không thu tiền người nhận.',
    `Lý do hoàn: ${order.reason}`,
    `Đối soát theo mã gốc ${order.originalCode}.`,
  ].join('\n');
}

export function ReturnBlockManagementPage(): React.JSX.Element {
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnOrderStatus | ''>('');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const query = normalizeSearch(searchCode);

    return mockReturnOrders.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesSearch = query
        ? [order.originalCode, order.newCode, order.reason]
            .some((value) => value.toLowerCase().includes(query))
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [searchCode, statusFilter]);

  const handlePrintLabel = (order: ReturnOrder) => {
    const didOpen = openReturnShippingLabelPrint({
      brandName: 'NEXUS Express',
      serviceName: 'Chuyển hoàn',
      shipmentCode: order.newCode,
      originalShipmentCode: order.originalCode,
      senderName: order.senderName,
      senderPhone: order.senderPhone,
      senderAddress: order.senderAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      receiverAddress: order.receiverAddress,
      hubCode: order.returnHubCode,
      zoneCode: order.returnZoneCode,
      itemDescription: order.itemDescription,
      parcelNote: order.parcelNote,
      qrValue: order.newCode,
      routeTag: 'RETURN',
      sortCode: `${order.returnHubCode}\n${order.returnZoneCode}`,
      codAmountText: '0 VND',
      createdAtText: order.createdAt,
      deliveryInstruction: buildReturnInstruction(order),
      hotlineText: 'NEXUS Express - Tem chuyển hoàn nội bộ | Hotline: 1900 1000',
    });

    setNotice(
      didOpen
        ? `Đã mở cửa sổ in tem chuyển hoàn ${order.newCode}.`
        : 'Trình duyệt đang chặn popup in. Hãy cho phép popup rồi bấm In tem lại.',
    );
  };

  return (
    <section className="ops-return-list">
      <section className="ops-return-list__hero">
        <div>
          <small>Operations platform</small>
          <h2>Quản lý chuyển hoàn</h2>
          <p>Theo dõi yêu cầu hoàn, duyệt trạng thái và in tem hoàn hàng theo chuẩn vận đơn.</p>
        </div>
        <div className="ops-return-list__hero-stats" aria-label="Thống kê chuyển hoàn">
          <span>
            <strong>{mockReturnOrders.length}</strong>
            Yêu cầu
          </span>
          <span>
            <strong>{mockReturnOrders.filter((order) => order.status === 'APPROVED').length}</strong>
            Sẵn sàng in
          </span>
        </div>
      </section>

      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Tra cứu danh sách chuyển hoàn</h3>
        </header>
        <div className="ops-return-list__panel-body">
          <div className="ops-return-list__filters">
            <label className="ops-return-list__field">
              <span>Mã đơn gốc / Mã đơn hoàn</span>
              <input
                type="text"
                placeholder="Nhập mã đơn..."
                value={searchCode}
                onChange={(event) => setSearchCode(event.target.value)}
              />
            </label>
            <label className="ops-return-list__field">
              <span>Trạng thái duyệt</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ReturnOrderStatus | '')}
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </label>
            <div className="ops-return-list__actions">
              <button type="button" className="ops-return-list__search-btn">
                Tìm kiếm
              </button>
              <button
                type="button"
                className="ops-return-list__reset-btn"
                onClick={() => {
                  setSearchCode('');
                  setStatusFilter('');
                  setNotice(null);
                }}
              >
                Làm mới
              </button>
            </div>
          </div>
          {notice ? <p className="ops-return-list__notice">{notice}</p> : null}
        </div>
      </section>

      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Danh sách yêu cầu chuyển hoàn</h3>
          <span>{filteredOrders.length} dòng</span>
        </header>
        <div className="ops-return-list__table-wrap">
          <table className="ops-return-list__table">
            <thead>
              <tr>
                <th>Mã đơn gốc</th>
                <th>Mã đơn hoàn</th>
                <th>Tuyến hoàn</th>
                <th>Lý do</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="ops-return-list__mono">{order.originalCode}</span>
                  </td>
                  <td>
                    <strong className="ops-return-list__code">{order.newCode}</strong>
                  </td>
                  <td>
                    <div className="ops-return-list__route-cell">
                      <strong>{order.returnHubCode}</strong>
                      <span>{order.returnZoneCode}</span>
                    </div>
                  </td>
                  <td>{order.reason}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <span
                      className={`ops-return-list__status ops-return-list__status--${order.status.toLowerCase()}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td>
                    {order.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handlePrintLabel(order)}
                        className="ops-return-list__print-btn"
                      >
                        In tem
                      </button>
                    ) : (
                      <span className="ops-return-list__disabled-text">
                        {order.status === 'PENDING' ? 'Chờ duyệt' : 'Không in'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="ops-return-list__empty">
                      Không có yêu cầu chuyển hoàn phù hợp bộ lọc.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
