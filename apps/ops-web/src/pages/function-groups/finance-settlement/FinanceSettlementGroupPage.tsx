import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useHubsQuery } from '../../../features/masterdata/masterdata.api';
import type { HubDto } from '../../../features/masterdata/masterdata.types';
import { useShipmentsQuery } from '../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../features/shipments/shipments.types';
import { routePaths } from '../../../navigation/routes';
import { getErrorMessage } from '../../../services/api/errors';
import { useAuthStore } from '../../../store/authStore';
import { formatDateTime } from '../../../utils/format';
import { formatShipmentStatusLabel } from '../../../utils/logisticsLabels';
import '../operations-platform/data-monitoring/OperationalDataMonitorPage.css';
import './FinanceSettlementGroupPage.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface SettlementFilters {
  dateFrom: string;
  dateTo: string;
  hubCode: string;
  customer: string;
  groupBy: 'CUSTOMER' | 'HUB';
}

interface SettlementRow {
  key: string;
  label: string;
  hubCode: string;
  customerKey: string;
  shipmentCount: number;
  codReceivable: number;
  serviceFee: number;
  reconciledCod: number | null;
  remainingDebt: number;
  latestDeliveredAt: string | null;
}

interface ExceptionRow {
  shipment: ShipmentListItemDto;
  customerKey: string;
  hubCode: string;
  codAmount: number;
  serviceFee: number;
  issue: string;
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function formatCurrency(value: number | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, value ?? 0))} đ`;
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
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function monthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

function resolveCustomerKey(shipment: ShipmentListItemDto): string {
  return (
    shipment.platform?.trim() ||
    shipment.senderName?.trim() ||
    shipment.senderPhone?.trim() ||
    shipment.receiverName?.trim() ||
    'Khách hàng chưa xác định'
  );
}

function buildHubLabel(hubCode: string, hubs: HubDto[]): string {
  const hub = hubs.find((item) => normalizeCode(item.code) === hubCode);
  return hub ? `${hub.code} - ${hub.name}` : hubCode;
}

export function FinanceSettlementGroupPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [filters, setFilters] = useState<SettlementFilters>({
    dateFrom: monthStart(new Date()),
    dateTo: today,
    hubCode: canViewAllHubAreas ? 'ALL' : assignedHubCodes[0] ?? 'ALL',
    customer: '',
    groupBy: 'CUSTOMER',
  });
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementPageSize, setSettlementPageSize] = useState(25);
  const [exceptionPage, setExceptionPage] = useState(1);
  const [exceptionPageSize, setExceptionPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(
    accessToken,
    { status: 'DELIVERED' },
    { refetchInterval: 15000 },
  );
  const hubsQuery = useHubsQuery(accessToken, {});

  const allHubs = hubsQuery.data ?? [];
  const hubOptions = useMemo(() => {
    const hubCodes = new Set<string>();

    if (canViewAllHubAreas) {
      for (const hub of allHubs) {
        if (hub.isActive) {
          hubCodes.add(normalizeCode(hub.code));
        }
      }
    } else {
      for (const hubCode of assignedHubCodes) {
        hubCodes.add(hubCode);
      }
    }

    for (const shipment of shipmentsQuery.data ?? []) {
      const hubCode = resolveShipmentHub(shipment);
      if (canViewAllHubAreas || assignedHubCodes.includes(hubCode)) {
        hubCodes.add(hubCode);
      }
    }

    return Array.from(hubCodes).filter(Boolean).sort();
  }, [allHubs, assignedHubCodes, canViewAllHubAreas, shipmentsQuery.data]);

  const scopedDeliveredShipments = useMemo(() => {
    const customerKeyword = normalizeText(filters.customer);

    return (shipmentsQuery.data ?? [])
      .filter((shipment) => normalizeCode(shipment.currentStatus) === 'DELIVERED')
      .filter((shipment) => {
        const deliveredDate = toDateKey(shipment.updatedAt);
        const inDateRange =
          (!filters.dateFrom || deliveredDate >= filters.dateFrom) &&
          (!filters.dateTo || deliveredDate <= filters.dateTo);
        if (!inDateRange) {
          return false;
        }

        const hubCode = resolveShipmentHub(shipment);
        const inHubScope = canViewAllHubAreas || assignedHubCodes.includes(hubCode);
        const hubMatched = filters.hubCode === 'ALL' || hubCode === filters.hubCode;
        const customerMatched =
          !customerKeyword || normalizeText(resolveCustomerKey(shipment)).includes(customerKeyword);

        return inHubScope && hubMatched && customerMatched;
      });
  }, [
    assignedHubCodes,
    canViewAllHubAreas,
    filters.customer,
    filters.dateFrom,
    filters.dateTo,
    filters.hubCode,
    shipmentsQuery.data,
  ]);

  const settlementRows = useMemo<SettlementRow[]>(() => {
    const groups = new Map<string, SettlementRow>();

    for (const shipment of scopedDeliveredShipments) {
      const hubCode = resolveShipmentHub(shipment);
      const customerKey = resolveCustomerKey(shipment);
      const groupKey = filters.groupBy === 'CUSTOMER' ? customerKey : hubCode;
      const row =
        groups.get(groupKey) ??
        {
          key: groupKey,
          label:
            filters.groupBy === 'CUSTOMER'
              ? customerKey
              : buildHubLabel(hubCode, allHubs),
          hubCode: filters.groupBy === 'CUSTOMER' ? hubCode : groupKey,
          customerKey: filters.groupBy === 'CUSTOMER' ? customerKey : 'Tất cả khách hàng',
          shipmentCount: 0,
          codReceivable: 0,
          serviceFee: 0,
          reconciledCod: null,
          remainingDebt: 0,
          latestDeliveredAt: null,
        };

      const codAmount = Math.max(0, shipment.codAmount ?? 0);
      const serviceFee = Math.max(0, shipment.shippingFee ?? 0);
      row.shipmentCount += 1;
      row.codReceivable += codAmount;
      row.serviceFee += serviceFee;
      row.remainingDebt += codAmount + serviceFee;
      if (!row.latestDeliveredAt || shipment.updatedAt > row.latestDeliveredAt) {
        row.latestDeliveredAt = shipment.updatedAt;
      }
      groups.set(groupKey, row);
    }

    return Array.from(groups.values()).sort(
      (left, right) => right.remainingDebt - left.remainingDebt,
    );
  }, [allHubs, filters.groupBy, scopedDeliveredShipments]);

  const exceptionRows = useMemo<ExceptionRow[]>(() => {
    return scopedDeliveredShipments
      .map((shipment) => {
        const hubCode = resolveShipmentHub(shipment);
        const customerKey = resolveCustomerKey(shipment);
        const issues = [
          'Chưa có bản ghi đối soát finance',
          hubCode === 'CHUA_XAC_DINH' ? 'Thiếu hub đối soát' : null,
          customerKey === 'Khách hàng chưa xác định' ? 'Thiếu khách hàng/kênh' : null,
          (shipment.shippingFee ?? null) === null ? 'Thiếu phí dịch vụ' : null,
        ].filter((issue): issue is string => Boolean(issue));

        return {
          shipment,
          customerKey,
          hubCode,
          codAmount: Math.max(0, shipment.codAmount ?? 0),
          serviceFee: Math.max(0, shipment.shippingFee ?? 0),
          issue: issues.join(', '),
        };
      })
      .filter((row) => row.codAmount > 0 || row.serviceFee > 0)
      .slice(0, 50);
  }, [scopedDeliveredShipments]);

  const totals = useMemo(
    () => ({
      codReceivable: settlementRows.reduce((sum, row) => sum + row.codReceivable, 0),
      reconciledCod: 0,
      serviceFee: settlementRows.reduce((sum, row) => sum + row.serviceFee, 0),
      remainingDebt: settlementRows.reduce((sum, row) => sum + row.remainingDebt, 0),
      shipmentCount: settlementRows.reduce((sum, row) => sum + row.shipmentCount, 0),
    }),
    [settlementRows],
  );
  const isLoading = shipmentsQuery.isLoading || hubsQuery.isLoading;
  const isFetching = shipmentsQuery.isFetching || hubsQuery.isFetching;
  const loadError = shipmentsQuery.error ?? hubsQuery.error ?? null;
  const settlementTotalPages = Math.max(1, Math.ceil(settlementRows.length / settlementPageSize));
  const settlementCurrentPage = Math.min(settlementPage, settlementTotalPages);
  const pagedSettlementRows = settlementRows.slice(
    (settlementCurrentPage - 1) * settlementPageSize,
    settlementCurrentPage * settlementPageSize,
  );
  const exceptionTotalPages = Math.max(1, Math.ceil(exceptionRows.length / exceptionPageSize));
  const exceptionCurrentPage = Math.min(exceptionPage, exceptionTotalPages);
  const pagedExceptionRows = exceptionRows.slice(
    (exceptionCurrentPage - 1) * exceptionPageSize,
    exceptionCurrentPage * exceptionPageSize,
  );
  const scopeText = canViewAllHubAreas
    ? 'Toàn hệ thống'
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa gán hub';

  useEffect(() => {
    setSettlementPage(1);
    setExceptionPage(1);
  }, [filters.customer, filters.dateFrom, filters.dateTo, filters.groupBy, filters.hubCode, settlementPageSize, exceptionPageSize]);

  const updateFilter = <Key extends keyof SettlementFilters>(
    key: Key,
    value: SettlementFilters[Key],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="ops-finance-settlement">
      <header className="ops-finance-settlement__header">
        <div>
          <small>FINANCE_SETTLEMENT_OPERATIONS</small>
          <h2>Quyết toán tài chính tổng</h2>
          <p>
            Dashboard tổng hợp COD, phí dịch vụ và công nợ theo khách hàng/bưu cục/kỳ.
            Quyết toán courier nộp COD trong ngày vẫn nằm riêng ở cụm bưu cục.
          </p>
        </div>
        <div className="ops-finance-settlement__scope">
          <span>Phạm vi dữ liệu</span>
          <strong>{scopeText}</strong>
          <Link to={routePaths.branchBusinessFinanceCod}>Mở quyết toán thu hộ bưu cục</Link>
        </div>
      </header>

      <section className="ops-finance-settlement__contract">
        <strong>Read-only từ shipment-service</strong>
        <span>
          Chưa có finance API ghi nhận đối soát kỳ, khoản đã thanh toán hoặc chênh lệch
          đã xác nhận. Các số liệu dưới đây được derive từ vận đơn DELIVERED, không
          phải bản quyết toán chính thức.
        </span>
      </section>

      <section className="ops-finance-settlement__filters">
        <label>
          <span>Từ ngày giao</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          <span>Đến ngày giao</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
        </label>
        <label>
          <span>Bưu cục</span>
          <select
            value={filters.hubCode}
            onChange={(event) => updateFilter('hubCode', event.target.value)}
          >
            <option value="ALL">Tất cả bưu cục</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {buildHubLabel(hubCode, allHubs)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Khách hàng/kênh</span>
          <input
            value={filters.customer}
            onChange={(event) => updateFilter('customer', event.target.value)}
            placeholder="Nhập tên, mã kênh hoặc SĐT"
          />
        </label>
        <label>
          <span>Gom bảng theo</span>
          <select
            value={filters.groupBy}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                groupBy: event.target.value as SettlementFilters['groupBy'],
              }))
            }
          >
            <option value="CUSTOMER">Khách hàng</option>
            <option value="HUB">Bưu cục</option>
          </select>
        </label>
      </section>

      <section className="ops-finance-settlement__kpis">
        <article data-tone="money">
          <span>COD phải thu</span>
          <strong>{formatCurrency(totals.codReceivable)}</strong>
        </article>
        <article data-tone="neutral">
          <span>COD đã đối soát</span>
          <strong>{formatCurrency(totals.reconciledCod)}</strong>
          <em>Chưa có dữ liệu finance</em>
        </article>
        <article data-tone="money">
          <span>Phí dịch vụ</span>
          <strong>{formatCurrency(totals.serviceFee)}</strong>
        </article>
        <article data-tone="danger">
          <span>Công nợ còn lại</span>
          <strong>{formatCurrency(totals.remainingDebt)}</strong>
        </article>
      </section>

      {loadError ? (
        <p className="ops-finance-settlement__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-finance-settlement__grid">
        <section className="ops-finance-settlement__panel">
          <header className="ops-finance-settlement__panel-head">
            <div>
              <h3>Bảng đối soát theo {filters.groupBy === 'CUSTOMER' ? 'khách hàng' : 'bưu cục'}</h3>
              <span>
                {isLoading ? 'Đang tải...' : `${settlementRows.length} dòng / ${totals.shipmentCount} vận đơn`}
              </span>
            </div>
            {isFetching && !isLoading ? <em>Đang đồng bộ...</em> : null}
          </header>

          {isLoading ? (
            <p className="ops-finance-settlement__empty">Đang tải dữ liệu vận đơn đã giao...</p>
          ) : null}
          {!isLoading && settlementRows.length === 0 ? (
            <p className="ops-finance-settlement__empty">
              Không có vận đơn DELIVERED phù hợp bộ lọc hiện tại.
            </p>
          ) : null}

          <div className="ops-finance-settlement__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{filters.groupBy === 'CUSTOMER' ? 'Khách hàng/kênh' : 'Bưu cục'}</th>
                  <th>Hub</th>
                  <th>Vận đơn</th>
                  <th>COD phải thu</th>
                  <th>COD đã đối soát</th>
                  <th>Phí dịch vụ</th>
                  <th>Công nợ còn lại</th>
                  <th>Giao cuối</th>
                </tr>
              </thead>
              <tbody>
                {pagedSettlementRows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <strong>{row.label}</strong>
                      <small>{row.customerKey}</small>
                    </td>
                    <td>{row.hubCode}</td>
                    <td>{row.shipmentCount}</td>
                    <td className="ops-finance-settlement__money">
                      {formatCurrency(row.codReceivable)}
                    </td>
                    <td>
                      <span className="ops-finance-settlement__badge">
                        Chưa có finance API
                      </span>
                    </td>
                    <td className="ops-finance-settlement__money">
                      {formatCurrency(row.serviceFee)}
                    </td>
                    <td className="ops-finance-settlement__money">
                      {formatCurrency(row.remainingDebt)}
                    </td>
                    <td>{row.latestDeliveredAt ? formatDateTime(row.latestDeliveredAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="ops-data-monitor__pagination">
            <span>
              Hiển thị {settlementRows.length === 0 ? 0 : (settlementCurrentPage - 1) * settlementPageSize + 1}-
              {Math.min(settlementRows.length, settlementCurrentPage * settlementPageSize)} / {settlementRows.length} dòng
            </span>
            <label>
              <span>Số dòng</span>
              <select value={settlementPageSize} onChange={(event) => setSettlementPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button type="button" onClick={() => setSettlementPage(settlementCurrentPage - 1)} disabled={settlementCurrentPage <= 1}>
                Trước
              </button>
              <strong>{settlementCurrentPage}/{settlementTotalPages}</strong>
              <button type="button" onClick={() => setSettlementPage(settlementCurrentPage + 1)} disabled={settlementCurrentPage >= settlementTotalPages}>
                Sau
              </button>
            </div>
          </footer>
        </section>

        <aside className="ops-finance-settlement__panel">
          <header className="ops-finance-settlement__panel-head">
            <div>
              <h3>Ghi nhận đối soát</h3>
              <span>Finance contract</span>
            </div>
          </header>
          <div className="ops-finance-settlement__record-empty">
            <strong>Chưa có endpoint finance/reporting</strong>
            <p>
              Cần backend trả về kỳ đối soát, khoản đã thanh toán, COD đã chốt,
              phí đã thu, điều chỉnh và audit người duyệt để ghi nhận chính thức.
            </p>
          </div>
        </aside>
      </section>

      <section className="ops-finance-settlement__panel">
        <header className="ops-finance-settlement__panel-head">
          <div>
            <h3>Ngoại lệ / chênh lệch cần đối soát</h3>
            <span>{exceptionRows.length} vận đơn đọc-only</span>
          </div>
        </header>
        {!isLoading && exceptionRows.length === 0 ? (
          <p className="ops-finance-settlement__empty">
            Chưa có ngoại lệ derive từ vận đơn phù hợp bộ lọc; phần chênh lệch xác nhận đang chờ finance API.
          </p>
        ) : null}
        <div className="ops-finance-settlement__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Khách hàng/kênh</th>
                <th>Bưu cục</th>
                <th>Trạng thái</th>
                <th>COD</th>
                <th>Phí</th>
                <th>Lý do</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {pagedExceptionRows.map((row) => (
                <tr key={row.shipment.shipmentCode}>
                  <td>
                    <Link
                      className="ops-finance-settlement__code"
                      to={routePaths.shipmentDetail(row.shipment.id)}
                    >
                      {row.shipment.shipmentCode}
                    </Link>
                  </td>
                  <td>{row.customerKey}</td>
                  <td>{row.hubCode}</td>
                  <td>{formatShipmentStatusLabel(row.shipment.currentStatus)}</td>
                  <td className="ops-finance-settlement__money">
                    {formatCurrency(row.codAmount)}
                  </td>
                  <td className="ops-finance-settlement__money">
                    {formatCurrency(row.serviceFee)}
                  </td>
                  <td>{row.issue}</td>
                  <td>{formatDateTime(row.shipment.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="ops-data-monitor__pagination">
          <span>
            Hiển thị {exceptionRows.length === 0 ? 0 : (exceptionCurrentPage - 1) * exceptionPageSize + 1}-
            {Math.min(exceptionRows.length, exceptionCurrentPage * exceptionPageSize)} / {exceptionRows.length} dòng
          </span>
          <label>
            <span>Số dòng</span>
            <select value={exceptionPageSize} onChange={(event) => setExceptionPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setExceptionPage(exceptionCurrentPage - 1)} disabled={exceptionCurrentPage <= 1}>
              Trước
            </button>
            <strong>{exceptionCurrentPage}/{exceptionTotalPages}</strong>
            <button type="button" onClick={() => setExceptionPage(exceptionCurrentPage + 1)} disabled={exceptionCurrentPage >= exceptionTotalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
