import React, { useEffect, useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import {
  buildBranchScopeTokens,
  formatBranchCurrency,
  isShipmentInBranchScope,
  normalizeBranchCode,
  normalizeBranchText,
  resolveShipmentHub,
  toBranchDateInputValue,
  toBranchDateKey,
} from '../shared/branchBusinessData';
import { BranchTablePagination } from '../shared/BranchTablePagination';
import '../shared/BranchBusinessOperations.css';

interface DebtRow {
  customerKey: string;
  hubCode: string;
  shipmentCount: number;
  codTotal: number;
  feeTotal: number;
  receivable: number;
  discrepancy: number;
}

function monthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function BranchFinanceReconcilePage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toBranchDateInputValue(new Date()), []);
  const [dateFrom, setDateFrom] = useState(monthStart(new Date()));
  const [dateTo, setDateTo] = useState(today);
  const [hubFilter, setHubFilter] = useState(assignedHubCodes[0] ?? 'ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});

  const selectedHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );
  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], selectedHubCodes),
    [hubsQuery.data, selectedHubCodes],
  );

  const rows = useMemo<DebtRow[]>(() => {
    const groups = new Map<string, DebtRow>();

    for (const shipment of shipmentsQuery.data ?? []) {
      if (!isShipmentInBranchScope(shipment, selectedHubCodes, scopeTokens, canViewAllHubAreas)) {
        continue;
      }

      const createdDate = toBranchDateKey(shipment.createdAt);
      if ((dateFrom && createdDate < dateFrom) || (dateTo && createdDate > dateTo)) {
        continue;
      }

      const customerKey =
        shipment.platform ??
        shipment.senderName ??
        shipment.receiverName ??
        shipment.senderPhone ??
        'Khách hàng chưa xác định';
      const hubCode = resolveShipmentHub(shipment);
      const key = `${customerKey}::${hubCode}`;
      const current =
        groups.get(key) ??
        {
          customerKey,
          hubCode,
          shipmentCount: 0,
          codTotal: 0,
          feeTotal: 0,
          receivable: 0,
          discrepancy: 0,
        };

      const codAmount = Math.max(0, shipment.codAmount ?? 0);
      const feeAmount = Math.max(0, shipment.shippingFee ?? 0);
      current.shipmentCount += 1;
      current.codTotal += codAmount;
      current.feeTotal += feeAmount;
      current.receivable += codAmount + feeAmount;
      groups.set(key, current);
    }

    return Array.from(groups.values()).sort((left, right) => right.receivable - left.receivable);
  }, [
    canViewAllHubAreas,
    dateFrom,
    dateTo,
    scopeTokens,
    selectedHubCodes,
    shipmentsQuery.data,
  ]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeBranchText(keyword);
    return rows.filter(
      (row) =>
        !normalizedKeyword ||
        normalizeBranchText(row.customerKey).includes(normalizedKeyword) ||
        normalizeBranchText(row.hubCode).includes(normalizedKeyword),
    );
  }, [keyword, rows]);
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, hubFilter, keyword, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredRows, pageSize],
  );
  const hubOptions = useMemo(
    () =>
      Array.from(
        new Set((shipmentsQuery.data ?? []).map(resolveShipmentHub).concat(assignedHubCodes)),
      ).filter(Boolean).sort(),
    [assignedHubCodes, shipmentsQuery.data],
  );
  const totals = useMemo(
    () => ({
      cod: filteredRows.reduce((sum, row) => sum + row.codTotal, 0),
      fee: filteredRows.reduce((sum, row) => sum + row.feeTotal, 0),
      receivable: filteredRows.reduce((sum, row) => sum + row.receivable, 0),
      discrepancy: filteredRows.reduce((sum, row) => sum + row.discrepancy, 0),
    }),
    [filteredRows],
  );
  const isLoading = shipmentsQuery.isLoading || hubsQuery.isLoading;
  const loadError = shipmentsQuery.error ?? hubsQuery.error ?? null;

  return (
    <section className="ops-branch-workflow">
      <header className="ops-branch-workflow__header">
        <div>
          <small>BRANCH_FINANCE_RECONCILE</small>
          <h2>Đối soát công nợ</h2>
          <p>
            Bảng preview theo khách hàng, bưu cục và kỳ đối soát từ dữ liệu vận
            đơn. Chưa có endpoint finance chính thức để xác nhận công nợ.
          </p>
        </div>
        <div className="ops-branch-workflow__scope">
          <span>Backend contract</span>
          <strong>Chưa có endpoint finance reconcile</strong>
        </div>
      </header>

      <section className="ops-branch-workflow__filters">
        <label>
          <span>Từ ngày</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>Bưu cục</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            {canViewAllHubAreas ? <option value="ALL">Toàn bộ</option> : null}
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Khách hàng / hub</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tên khách, kênh hoặc hub"
          />
        </label>
      </section>

      <section className="ops-branch-workflow__kpis">
        <article data-tone="money">
          <span>Tổng COD</span>
          <strong>{formatBranchCurrency(totals.cod)}</strong>
        </article>
        <article data-tone="money">
          <span>Tổng phí</span>
          <strong>{formatBranchCurrency(totals.fee)}</strong>
        </article>
        <article data-tone="money">
          <span>Công nợ phải thu</span>
          <strong>{formatBranchCurrency(totals.receivable)}</strong>
        </article>
        <article>
          <span>Chênh lệch</span>
          <strong>{formatBranchCurrency(totals.discrepancy)}</strong>
        </article>
      </section>

      <p className="ops-branch-workflow__contract">
        Chưa có endpoint finance để trả về kỳ đối soát, khoản đã thanh toán,
        khoản điều chỉnh và chênh lệch đã xác nhận. Các số dưới đây là preview
        từ shipment-service, không phải bản đối soát chính thức.
      </p>

      {loadError ? (
        <p className="ops-branch-workflow__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-branch-workflow__panel">
        <header className="ops-branch-workflow__panel-head">
          <h3>Bảng công nợ theo khách hàng/bưu cục/kỳ</h3>
          <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} dòng`}</span>
        </header>
        {isLoading ? (
          <p className="ops-branch-workflow__loading">Đang tải dữ liệu vận đơn...</p>
        ) : null}
        <div className="ops-branch-workflow__table-wrap">
          <table className="ops-branch-workflow__table">
            <thead>
              <tr>
                <th>Khách hàng/kênh</th>
                <th>Bưu cục</th>
                <th>Kỳ đối soát</th>
                <th>Vận đơn</th>
                <th>Tổng COD</th>
                <th>Tổng phí</th>
                <th>Công nợ</th>
                <th>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={`${row.customerKey}-${row.hubCode}`}>
                  <td>{row.customerKey}</td>
                  <td>{row.hubCode}</td>
                  <td>
                    {dateFrom} - {dateTo}
                  </td>
                  <td>{row.shipmentCount}</td>
                  <td className="ops-branch-workflow__money">{formatBranchCurrency(row.codTotal)}</td>
                  <td className="ops-branch-workflow__money">{formatBranchCurrency(row.feeTotal)}</td>
                  <td className="ops-branch-workflow__money">{formatBranchCurrency(row.receivable)}</td>
                  <td>{formatBranchCurrency(row.discrepancy)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
        <BranchTablePagination
          totalRows={filteredRows.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {!isLoading && filteredRows.length === 0 ? (
          <p className="ops-branch-workflow__empty">
            Chưa có dữ liệu vận đơn phù hợp kỳ đối soát hoặc chưa có endpoint finance chính thức.
          </p>
        ) : null}
      </section>
    </section>
  );
}
