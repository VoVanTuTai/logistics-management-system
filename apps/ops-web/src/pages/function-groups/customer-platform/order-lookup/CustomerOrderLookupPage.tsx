import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { usePickupRequestsQuery } from '../../../../features/pickups/pickups.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import {
  buildCustomerOrderOpsRows,
  formatCustomerOrderDateTime,
  isCustomerOrderInHubScope,
  normalizeCustomerOrderCode,
  normalizeCustomerOrderText,
} from '../customerOrderRows';
import '../customerPlatformOrders.css';

export function CustomerOrderLookupPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeCustomerOrderCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 10000 });
  const pickupsQuery = usePickupRequestsQuery(accessToken, {}, { refetchInterval: 10000 });
  const pickupTasksQuery = useTasksQuery(accessToken, { taskType: 'PICKUP' }, {
    refetchInterval: 10000,
  });

  const rows = useMemo(
    () =>
      buildCustomerOrderOpsRows({
        shipments: shipmentsQuery.data ?? [],
        pickups: pickupsQuery.data ?? [],
        tasks: pickupTasksQuery.data ?? [],
      }).filter((row) =>
        isCustomerOrderInHubScope(row, assignedHubCodes, canViewAllHubAreas),
      ),
    [
      assignedHubCodes,
      canViewAllHubAreas,
      pickupTasksQuery.data,
      pickupsQuery.data,
      shipmentsQuery.data,
    ],
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status))).sort(),
    [rows],
  );
  const hubOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.hubCode))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeCustomerOrderText(keyword);

    return rows.filter((row) => {
      const keywordMatched =
        !normalizedKeyword ||
        normalizeCustomerOrderText(row.orderCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.pickupCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.shipmentCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.customerPhone).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.customerName).includes(normalizedKeyword);

      return (
        keywordMatched &&
        (statusFilter === 'ALL' || row.status === statusFilter) &&
        (hubFilter === 'ALL' || row.hubCode === hubFilter)
      );
    });
  }, [hubFilter, keyword, rows, statusFilter]);

  const isLoading =
    shipmentsQuery.isLoading || pickupsQuery.isLoading || pickupTasksQuery.isLoading;
  const loadError = shipmentsQuery.error ?? pickupsQuery.error ?? pickupTasksQuery.error ?? null;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const scopeText = canViewAllHubAreas
    ? 'Toàn hệ thống'
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa được gán hub';

  useEffect(() => {
    setPage(1);
  }, [hubFilter, keyword, pageSize, statusFilter]);

  return (
    <section className="ops-customer-orders">
      <header className="ops-customer-orders__header">
        <div>
          <small>CUSTOMER_ORDER_LOOKUP</small>
          <h2>Tra cứu đơn đặt</h2>
          <p>
            Tìm đơn theo mã đơn đặt, mã pickup, mã vận đơn, số điện thoại hoặc tên
            khách hàng từ dữ liệu shipment, pickup và task hiện có.
          </p>
        </div>
        <div className="ops-customer-orders__scope">
          <span>Phạm vi hub</span>
          <strong>{scopeText}</strong>
        </div>
      </header>

      <section className="ops-customer-orders__filters" aria-label="Bộ lọc tra cứu đơn đặt">
        <label>
          <span>Từ khóa</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã đơn, mã pickup, SĐT hoặc tên khách"
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Toàn bộ</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {rows.find((row) => row.status === status)?.statusLabel ?? status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Hub</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Toàn bộ</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Backend contract</span>
          <input value="Dùng dữ liệu list hiện có, chưa có endpoint lookup riêng" readOnly disabled />
        </label>
      </section>

      {loadError ? (
        <div className="ops-customer-orders__error" role="alert">
          {getErrorMessage(loadError)}
        </div>
      ) : null}

      <section className="ops-customer-orders__panel">
        <header className="ops-customer-orders__panel-head">
          <h3>Kết quả tra cứu</h3>
          <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} dòng`}</span>
        </header>

        {isLoading ? (
          <div className="ops-customer-orders__loading">Đang tải dữ liệu đơn đặt...</div>
        ) : null}

        <div className="ops-customer-orders__table-wrap">
          <table className="ops-customer-orders__table">
            <thead>
              <tr>
                <th>Đơn đặt</th>
                <th>Khách hàng</th>
                <th>Trạng thái</th>
                <th>Hub</th>
                <th>Courier</th>
                <th>Thời gian tạo</th>
                <th>Shipment/Pickup</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td className="ops-customer-orders__code">
                    {row.orderCode}
                    <small>Pickup: {row.pickupCode}</small>
                  </td>
                  <td>
                    <strong>{row.customerName}</strong>
                    <small>{row.customerPhone}</small>
                  </td>
                  <td>
                    <span
                      className={`ops-customer-orders__status ops-customer-orders__status--${row.status.toLowerCase()}`}
                    >
                      {row.statusLabel}
                    </span>
                    <small>Shipment: {row.shipmentStatusLabel}</small>
                  </td>
                  <td>{row.hubCode}</td>
                  <td>{row.courierId ?? 'Chưa gán'}</td>
                  <td>{formatCustomerOrderDateTime(row.createdAt)}</td>
                  <td>
                    <div className="ops-customer-orders__links">
                      {row.shipmentId ? (
                        <Link to={routePaths.shipmentDetail(row.shipmentId)}>
                          {row.shipmentCode}
                        </Link>
                      ) : (
                        <span>Chưa có shipment</span>
                      )}
                      <Link to={routePaths.customerPlatformOrderDispatch}>
                        Điều phối lấy hàng
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredRows.length === 0 ? (
          <div className="ops-customer-orders__empty">
            Không có đơn đặt phù hợp dữ liệu backend hiện tại.
          </div>
        ) : null}

        <footer className="ops-customer-orders__pagination">
          <span>
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredRows.length, currentPage * pageSize)} / {filteredRows.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
              Trước
            </button>
            <strong>{currentPage}/{totalPages}</strong>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
