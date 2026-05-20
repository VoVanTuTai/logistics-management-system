import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import './OpsMetricsInventoryMonitorPage.css';

const FINAL_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
  'RETURNED',
  'RETURN_COMPLETED',
  'LOST',
]);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date);
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function formatAge(value: string | null | undefined): string {
  const hours = ageHours(value);
  if (hours === null) {
    return 'Không rõ';
  }
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days} ngày ${hours % 24} giờ` : `${hours} giờ`;
}

function resolveInventoryHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

function isInventoryShipment(shipment: ShipmentListItemDto): boolean {
  return !FINAL_STATUSES.has(normalizeCode(shipment.currentStatus));
}

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const inventoryRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return (shipmentsQuery.data ?? [])
      .filter(isInventoryShipment)
      .filter((shipment) => {
        const hubCode = resolveInventoryHub(shipment);
        const status = normalizeCode(shipment.currentStatus);
        const updatedDate = toDateKey(shipment.updatedAt);
        const keywordMatched =
          !normalizedKeyword ||
          normalizeText(shipment.shipmentCode).includes(normalizedKeyword) ||
          normalizeText(hubCode).includes(normalizedKeyword) ||
          normalizeText(shipment.receiverName).includes(normalizedKeyword);

        return (
          keywordMatched &&
          (hubFilter === 'ALL' || hubCode === hubFilter) &&
          (statusFilter === 'ALL' || status === statusFilter) &&
          (!dateFrom || !updatedDate || updatedDate >= dateFrom) &&
          (!dateTo || !updatedDate || updatedDate <= dateTo)
        );
      })
      .sort((left, right) => (ageHours(right.updatedAt) ?? 0) - (ageHours(left.updatedAt) ?? 0));
  }, [dateFrom, dateTo, hubFilter, keyword, shipmentsQuery.data, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, hubFilter, keyword, pageSize, statusFilter]);

  const hubOptions = useMemo(
    () =>
      Array.from(new Set((shipmentsQuery.data ?? []).filter(isInventoryShipment).map(resolveInventoryHub)))
        .filter(Boolean)
        .sort(),
    [shipmentsQuery.data],
  );
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (shipmentsQuery.data ?? [])
            .filter(isInventoryShipment)
            .map((shipment) => normalizeCode(shipment.currentStatus)),
        ),
      ).sort(),
    [shipmentsQuery.data],
  );

  const totalPages = Math.max(1, Math.ceil(inventoryRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => inventoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, inventoryRows, pageSize],
  );
  const overdueCount = inventoryRows.filter((shipment) => (ageHours(shipment.updatedAt) ?? 0) >= 24).length;
  const severeCount = inventoryRows.filter((shipment) => (ageHours(shipment.updatedAt) ?? 0) >= 48).length;
  const hubCount = new Set(inventoryRows.map(resolveInventoryHub)).size;

  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__header">
        <div>
          <small>OPS_METRICS_DEADLINE_INVENTORY</small>
          <h2>Giám sát tồn kho</h2>
          <p>Drill-down vận đơn đang mở theo hub, trạng thái và tuổi tồn SLA từ shipment-service.</p>
        </div>
        <button type="button" onClick={() => void shipmentsQuery.refetch()}>
          Làm mới
        </button>
      </header>

      <section className="ops-metrics-inventory__summary">
        <article>
          <span>Tổng kiện tồn</span>
          <strong>{inventoryRows.length}</strong>
        </article>
        <article data-tone="warning">
          <span>Tồn quá SLA 24h</span>
          <strong>{overdueCount}</strong>
        </article>
        <article data-tone="danger">
          <span>Quá 48h</span>
          <strong>{severeCount}</strong>
        </article>
        <article>
          <span>Hub có tồn</span>
          <strong>{hubCount}</strong>
        </article>
      </section>

      <section className="ops-metrics-inventory__filters">
        <label>
          <span>Từ ngày cập nhật</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày cập nhật</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>Hub</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tìm kiếm</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, hub, người nhận"
          />
        </label>
      </section>

      {shipmentsQuery.error ? (
        <p className="ops-metrics-inventory__error" role="alert">
          {getErrorMessage(shipmentsQuery.error)}
        </p>
      ) : null}

      <section className="ops-metrics-inventory__panel">
        <header className="ops-metrics-inventory__panel-head">
          <h3>Vận đơn gây chỉ số tồn kho</h3>
          <span>{shipmentsQuery.isLoading ? 'Đang tải...' : `${inventoryRows.length} dòng`}</span>
        </header>
        {shipmentsQuery.isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải dữ liệu tồn kho...</p>
        ) : null}
        {!shipmentsQuery.isLoading && inventoryRows.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Không có vận đơn tồn phù hợp bộ lọc.</p>
        ) : null}
        <div className="ops-metrics-inventory__table-wrap">
          <table className="ops-metrics-inventory__table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Hub/địa điểm tồn</th>
                <th>Trạng thái</th>
                <th>Khách hàng</th>
                <th>Cập nhật gần nhất</th>
                <th>Tuổi tồn</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((shipment) => {
                const hours = ageHours(shipment.updatedAt);
                const isOverdue = (hours ?? 0) >= 24;
                return (
                  <tr key={shipment.id}>
                    <td>
                      <Link className="ops-metrics-inventory__code" to={routePaths.shipmentDetail(shipment.id)}>
                        {shipment.shipmentCode}
                      </Link>
                    </td>
                    <td>{resolveInventoryHub(shipment)}</td>
                    <td>{formatShipmentStatusLabel(shipment.currentStatus)}</td>
                    <td>{shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có'}</td>
                    <td>{formatDateTime(shipment.updatedAt)}</td>
                    <td>{formatAge(shipment.updatedAt)}</td>
                    <td>
                      <span
                        className={
                          isOverdue
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            : 'ops-metrics-inventory__badge'
                        }
                      >
                        {isOverdue ? 'Quá SLA' : 'Trong SLA'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="ops-metrics-inventory__pagination">
          <span>
            Hiển thị {inventoryRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(inventoryRows.length, currentPage * pageSize)} / {inventoryRows.length}
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
            <strong>
              {currentPage}/{totalPages}
            </strong>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
