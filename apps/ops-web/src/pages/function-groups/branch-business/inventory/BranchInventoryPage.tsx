import React, { useEffect, useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import {
  buildBranchScopeTokens,
  buildTaskByShipment,
  formatBranchAge,
  formatBranchCurrency,
  isBranchInventoryShipment,
  isShipmentInBranchScope,
  normalizeBranchCode,
  normalizeBranchText,
  resolveBranchAgeHours,
  resolveShipmentHub,
} from '../shared/branchBusinessData';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { BranchTablePagination } from '../shared/BranchTablePagination';
import '../shared/BranchBusinessOperations.css';

interface InventoryRow {
  shipmentId: string;
  shipmentCode: string;
  status: string;
  statusLabel: string;
  hubCode: string;
  courierId: string;
  customerName: string;
  codAmount: number;
  ageText: string;
  ageHours: number | null;
  isOverSla: boolean;
  updatedAt: string;
}

function countBy<T extends string>(rows: InventoryRow[], selector: (row: InventoryRow) => T): Array<{
  key: T;
  count: number;
}> {
  const groups = new Map<T, number>();
  for (const row of rows) {
    const key = selector(row);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  return Array.from(groups.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count);
}

export function BranchInventoryPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const tasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});

  const scopeHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );
  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], scopeHubCodes),
    [hubsQuery.data, scopeHubCodes],
  );
  const taskByShipment = useMemo(
    () => buildTaskByShipment(tasksQuery.data ?? [], 'DELIVERY'),
    [tasksQuery.data],
  );

  const rows = useMemo<InventoryRow[]>(() => {
    return (shipmentsQuery.data ?? [])
      .filter((shipment) =>
        isShipmentInBranchScope(shipment, scopeHubCodes, scopeTokens, canViewAllHubAreas),
      )
      .filter(isBranchInventoryShipment)
      .map((shipment) => {
        const task = taskByShipment.get(normalizeBranchCode(shipment.shipmentCode));
        const ageHours = resolveBranchAgeHours(shipment.updatedAt);

        return {
          shipmentId: shipment.id,
          shipmentCode: shipment.shipmentCode,
          status: normalizeBranchCode(shipment.currentStatus),
          statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
          hubCode: resolveShipmentHub(shipment),
          courierId: task?.assignedCourierId ?? 'Chưa bàn giao',
          customerName: shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có',
          codAmount: shipment.codAmount ?? 0,
          ageText: formatBranchAge(shipment.updatedAt),
          ageHours,
          isOverSla: ageHours !== null && ageHours >= 24,
          updatedAt: shipment.updatedAt,
        };
      })
      .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
  }, [
    canViewAllHubAreas,
    scopeHubCodes,
    scopeTokens,
    shipmentsQuery.data,
    taskByShipment,
  ]);

  const hubOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.hubCode))).sort(),
    [rows],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status))).sort(),
    [rows],
  );
  const courierOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.courierId))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeBranchText(keyword);

    return rows.filter((row) => {
      const keywordMatched =
        !normalizedKeyword ||
        normalizeBranchText(row.shipmentCode).includes(normalizedKeyword) ||
        normalizeBranchText(row.customerName).includes(normalizedKeyword);

      return (
        keywordMatched &&
        (hubFilter === 'ALL' || row.hubCode === hubFilter) &&
        (statusFilter === 'ALL' || row.status === statusFilter) &&
        (courierFilter === 'ALL' || row.courierId === courierFilter)
      );
    });
  }, [courierFilter, hubFilter, keyword, rows, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [courierFilter, hubFilter, keyword, pageSize, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredRows, pageSize],
  );

  const statusGroups = useMemo(() => countBy(rows, (row) => row.statusLabel), [rows]);
  const courierGroups = useMemo(() => countBy(rows, (row) => row.courierId), [rows]);
  const hubGroups = useMemo(() => countBy(rows, (row) => row.hubCode), [rows]);
  const totalCod = filteredRows.reduce((sum, row) => sum + row.codAmount, 0);
  const overSlaCount = rows.filter((row) => row.isOverSla).length;
  const isLoading = shipmentsQuery.isLoading || tasksQuery.isLoading || hubsQuery.isLoading;
  const loadError = shipmentsQuery.error ?? tasksQuery.error ?? hubsQuery.error ?? null;
  const scopeText = canViewAllHubAreas
    ? 'Toàn hệ thống'
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa được gán hub';

  return (
    <section className="ops-branch-workflow">
      <header className="ops-branch-workflow__header">
        <div>
          <small>BRANCH_INVENTORY</small>
          <h2>Đơn tồn bưu cục</h2>
          <p>
            Theo dõi vận đơn còn mở theo tuổi tồn, trạng thái, hub và courier dựa
            trên shipment-service và task giao hàng hiện có.
          </p>
        </div>
        <div className="ops-branch-workflow__scope">
          <span>Phạm vi bưu cục</span>
          <strong>{scopeText}</strong>
        </div>
      </header>

      <section className="ops-branch-workflow__kpis">
        <article>
          <span>Tổng tồn</span>
          <strong>{rows.length}</strong>
        </article>
        <article data-tone="danger">
          <span>Tồn quá SLA 24h</span>
          <strong>{overSlaCount}</strong>
        </article>
        <article>
          <span>Hub có tồn</span>
          <strong>{hubGroups.length}</strong>
        </article>
        <article data-tone="money">
          <span>COD trong tồn</span>
          <strong>{formatBranchCurrency(totalCod)}</strong>
        </article>
      </section>

      <section className="ops-branch-workflow__filters">
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
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Toàn bộ</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Courier</span>
          <select value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="ALL">Toàn bộ</option>
            {courierOptions.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Từ khóa</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn hoặc khách hàng"
          />
        </label>
      </section>

      {loadError ? (
        <p className="ops-branch-workflow__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-branch-workflow__grid">
        <section className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Vận đơn tồn</h3>
            <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} dòng`}</span>
          </header>
          {isLoading ? (
            <p className="ops-branch-workflow__loading">Đang tải dữ liệu tồn kho...</p>
          ) : null}
          <div className="ops-branch-workflow__table-wrap">
            <table className="ops-branch-workflow__table">
              <thead>
                <tr>
                  <th>Mã vận đơn</th>
                  <th>Trạng thái</th>
                  <th>Hub</th>
                  <th>Courier</th>
                  <th>Khách hàng</th>
                  <th>COD</th>
                  <th>Tuổi tồn</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                <tr key={row.shipmentCode}>
                  <td>
                      <CopyableShipmentCode
                        code={row.shipmentCode}
                        className="ops-branch-workflow__code"
                      />
                  </td>
                    <td>{row.statusLabel}</td>
                    <td>{row.hubCode}</td>
                    <td>{row.courierId}</td>
                    <td>{row.customerName}</td>
                    <td className="ops-branch-workflow__money">
                      {formatBranchCurrency(row.codAmount)}
                    </td>
                    <td>{row.ageText}</td>
                    <td>
                      <span
                        className={
                          row.isOverSla
                            ? 'ops-branch-workflow__badge ops-branch-workflow__badge--danger'
                            : 'ops-branch-workflow__badge'
                        }
                      >
                        {row.isOverSla ? 'Quá SLA' : 'Trong SLA'}
                      </span>
                    </td>
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
              Không có vận đơn tồn phù hợp bộ lọc hiện tại.
            </p>
          ) : null}
        </section>

        <aside className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Phân bổ tồn</h3>
          </header>
          <div className="ops-branch-workflow__stack">
            <ul className="ops-branch-workflow__mini-list">
              {statusGroups.slice(0, 6).map((group) => (
                <li key={group.key}>
                  <span>{group.key}</span>
                  <strong>{group.count}</strong>
                </li>
              ))}
            </ul>
            <ul className="ops-branch-workflow__mini-list">
              {courierGroups.slice(0, 6).map((group) => (
                <li key={group.key}>
                  <span>{group.key}</span>
                  <strong>{group.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </section>
  );
}
