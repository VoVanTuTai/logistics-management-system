import React, { useMemo, useState } from 'react';
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
  isBranchCreatedCustomerOrder,
  isCustomerOrderInHubScope,
  normalizeCustomerOrderCode,
  normalizeCustomerOrderText,
} from '../customerOrderRows';
import '../customerPlatformOrders.css';

export function CustomerOrderMonitorPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeCustomerOrderCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const [keyword, setKeyword] = useState('');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
      })
        .filter(isBranchCreatedCustomerOrder)
        .filter((row) =>
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

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeCustomerOrderText(keyword);

    return rows.filter((row) => {
      const keywordMatched =
        !normalizedKeyword ||
        normalizeCustomerOrderText(row.shipmentCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.orderCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.pickupCode).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.customerName).includes(normalizedKeyword) ||
        normalizeCustomerOrderText(row.customerPhone).includes(normalizedKeyword);

      return (
        keywordMatched &&
        (hubFilter === 'ALL' || row.hubCode === hubFilter) &&
        (statusFilter === 'ALL' || row.status === statusFilter)
      );
    });
  }, [hubFilter, keyword, rows, statusFilter]);

  const hubOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.hubCode))).sort(),
    [rows],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status))).sort(),
    [rows],
  );
  const kpis = useMemo(
    () => ({
      newOrders: rows.filter((row) => row.status === 'NEW').length,
      waitingApproval: rows.filter((row) => row.status === 'WAITING_APPROVAL').length,
      dispatched: rows.filter((row) => row.status === 'DISPATCHED').length,
      overSla: rows.filter((row) => row.isOverSla).length,
    }),
    [rows],
  );

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

  return (
    <section className="ops-customer-orders">
      <header className="ops-customer-orders__header">
        <div>
          <small>CUSTOMER_ORDER_MONITOR</small>
          <h2>Giám sát đơn đã tạo</h2>
          <p>
            Theo dõi các vận đơn được tạo tại bưu cục qua chức năng Thêm mới vận đơn,
            gồm nguồn walk-in/ops và nhóm mã vận đơn khách lẻ.
          </p>
        </div>
        <div className="ops-customer-orders__scope">
          <span>Phạm vi hub</span>
          <strong>{scopeText}</strong>
        </div>
      </header>

      <section className="ops-customer-orders__kpis" aria-label="KPI đơn đặt">
        <article>
          <span>Mới tạo tại bưu cục</span>
          <strong>{kpis.newOrders}</strong>
        </article>
        <article>
          <span>Chờ lấy/tiếp nhận</span>
          <strong>{kpis.waitingApproval}</strong>
        </article>
        <article>
          <span>Đã điều phối lấy</span>
          <strong>{kpis.dispatched}</strong>
        </article>
        <article data-tone="danger">
          <span>Quá SLA lấy hàng</span>
          <strong>{kpis.overSla}</strong>
        </article>
      </section>

      <section className="ops-customer-orders__filters" aria-label="Bộ lọc giám sát đơn đặt">
        <label className="ops-customer-orders__filter-search">
          <span>Tìm mã vận đơn</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="Nhập mã vận đơn, mã đơn hoặc SĐT"
          />
        </label>
        <label>
          <span>Hub</span>
          <select
            value={hubFilter}
            onChange={(event) => {
              setHubFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Toàn bộ</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Toàn bộ</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {rows.find((row) => row.status === status)?.statusLabel ?? status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Ngưỡng SLA</span>
          <input value=">= 4 giờ từ thời điểm tạo/pickup request" readOnly disabled />
        </label>
        <label>
          <span>Nguồn đơn</span>
          <input value="Tạo tại bưu cục / OPS walk-in / mã 333" readOnly disabled />
        </label>
      </section>

      {loadError ? (
        <div className="ops-customer-orders__error" role="alert">
          {getErrorMessage(loadError)}
        </div>
      ) : null}

      <section className="ops-customer-orders__panel">
        <header className="ops-customer-orders__panel-head">
          <h3>Bảng đơn tạo tại bưu cục</h3>
          <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} dòng`}</span>
        </header>

        {isLoading ? (
          <div className="ops-customer-orders__loading">Đang tải dữ liệu giám sát...</div>
        ) : null}

        <div className="ops-customer-orders__table-wrap">
          <table className="ops-customer-orders__table">
            <thead>
              <tr>
                <th>Đơn đặt</th>
                <th>Hub</th>
                <th>Courier</th>
                <th>Trạng thái</th>
                <th>Pickup / shipment</th>
                <th>Tuổi đơn</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td className="ops-customer-orders__code">
                    {row.orderCode}
                    <small>{row.customerName}</small>
                  </td>
                  <td>{row.hubCode}</td>
                  <td>{row.courierId ?? 'Chưa gán'}</td>
                  <td>
                    <span
                      className={`ops-customer-orders__status ops-customer-orders__status--${row.status.toLowerCase()}`}
                    >
                      {row.statusLabel}
                    </span>
                    <small>{row.isOverSla ? 'Quá SLA' : 'Trong ngưỡng SLA'}</small>
                  </td>
                  <td>
                    <strong>{row.pickupStatusLabel}</strong>
                    <small>{row.shipmentStatusLabel}</small>
                  </td>
                  <td>
                    {row.ageHours === null ? 'Không rõ' : `${row.ageHours} giờ`}
                    <small>Tạo: {formatCustomerOrderDateTime(row.createdAt)}</small>
                  </td>
                  <td>
                    <div className="ops-customer-orders__links">
                      {row.shipmentId ? (
                        <Link to={routePaths.shipmentDetail(row.shipmentId)}>Shipment</Link>
                      ) : (
                        <span>Không có shipment</span>
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
            Không có đơn tạo tại bưu cục trong phạm vi hub hiện tại.
          </div>
        ) : null}
        <footer className="ops-customer-orders__pagination">
          <span>
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredRows.length, currentPage * pageSize)} / {filteredRows.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}>
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
