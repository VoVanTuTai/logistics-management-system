import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import {
  buildBranchScopeTokens,
  isShipmentInBranchScope,
  normalizeBranchCode,
} from '../../branch-business/shared/branchBusinessData';
import './OpsMetricsInventoryMonitorPage.css';

const FINAL_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
  'RETURNED',
  'RETURN_COMPLETED',
  'LOST',
]);

const INVENTORY_SCAN_STATUS = 'INVENTORY_CHECK';

type InventoryAuditStatus = 'SCANNED_TODAY' | 'MISSING_SCAN';

interface InventoryAuditRow {
  shipment: ShipmentListItemDto;
  hubCode: string;
  customerName: string;
  status: string;
  statusLabel: string;
  auditStatus: InventoryAuditStatus;
  inventoryScannedAt: string | null;
  missingReason: string;
}

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

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Math.round(value)}%`;
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

function isInventoryScannedOnDate(shipment: ShipmentListItemDto, inventoryDate: string): boolean {
  return (
    normalizeCode(shipment.currentStatus) === INVENTORY_SCAN_STATUS &&
    toDateKey(shipment.updatedAt) === inventoryDate
  );
}

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [inventoryDate, setInventoryDate] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] =
    useState<'ALL' | InventoryAuditStatus>('MISSING_SCAN');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});

  const allOpenShipments = useMemo(
    () => (shipmentsQuery.data ?? []).filter(isInventoryShipment),
    [shipmentsQuery.data],
  );

  const allScopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const hubOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allOpenShipments
            .filter((shipment) =>
              isShipmentInBranchScope(
                shipment,
                assignedHubCodes,
                allScopeTokens,
                canViewAllHubAreas,
              ),
            )
            .map(resolveInventoryHub),
        ),
      )
        .filter(Boolean)
        .sort(),
    [allOpenShipments, allScopeTokens, assignedHubCodes, canViewAllHubAreas],
  );

  const scopeHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );

  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], scopeHubCodes),
    [hubsQuery.data, scopeHubCodes],
  );

  const responsibleRows = useMemo<InventoryAuditRow[]>(() => {
    return allOpenShipments
      .filter((shipment) =>
        isShipmentInBranchScope(
          shipment,
          scopeHubCodes,
          scopeTokens,
          canViewAllHubAreas && hubFilter === 'ALL',
        ),
      )
      .map((shipment) => {
        const status = normalizeCode(shipment.currentStatus);
        const inventoryScannedAt = isInventoryScannedOnDate(shipment, inventoryDate)
          ? shipment.updatedAt
          : null;
        const auditStatus: InventoryAuditStatus = inventoryScannedAt
          ? 'SCANNED_TODAY'
          : 'MISSING_SCAN';

        return {
          shipment,
          hubCode: resolveInventoryHub(shipment),
          customerName: shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có',
          status,
          statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
          auditStatus,
          inventoryScannedAt,
          missingReason:
            status === INVENTORY_SCAN_STATUS
              ? 'Có tồn kho nhưng không phải ngày kiểm'
              : 'Chưa có thao tác quét tồn kho trong ngày',
        };
      })
      .sort((left, right) => {
        if (left.auditStatus !== right.auditStatus) {
          return left.auditStatus === 'MISSING_SCAN' ? -1 : 1;
        }

        return (ageHours(right.shipment.updatedAt) ?? 0) - (ageHours(left.shipment.updatedAt) ?? 0);
      });
  }, [
    allOpenShipments,
    canViewAllHubAreas,
    hubFilter,
    inventoryDate,
    scopeHubCodes,
    scopeTokens,
  ]);

  const inventoryRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return responsibleRows.filter((row) => {
      const keywordMatched =
        !normalizedKeyword ||
        normalizeText(row.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalizeText(row.hubCode).includes(normalizedKeyword) ||
        normalizeText(row.customerName).includes(normalizedKeyword);

      return keywordMatched && (auditStatusFilter === 'ALL' || row.auditStatus === auditStatusFilter);
    });
  }, [auditStatusFilter, keyword, responsibleRows]);

  useEffect(() => {
    setPage(1);
  }, [auditStatusFilter, hubFilter, inventoryDate, keyword, pageSize]);

  const totalPages = Math.max(1, Math.ceil(inventoryRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => inventoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, inventoryRows, pageSize],
  );
  const scannedTodayCount = responsibleRows.filter((row) => row.auditStatus === 'SCANNED_TODAY').length;
  const missingScanCount = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN').length;
  const scanRate = responsibleRows.length > 0 ? (scannedTodayCount / responsibleRows.length) * 100 : 0;
  const isLoading = shipmentsQuery.isLoading || hubsQuery.isLoading;
  const loadError = shipmentsQuery.error ?? hubsQuery.error ?? null;
  const scopeText = canViewAllHubAreas
    ? hubFilter === 'ALL'
      ? 'Toàn hệ thống'
      : hubFilter
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa được gán hub';

  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__header">
        <div>
          <small>OPS_METRICS_DEADLINE_INVENTORY</small>
          <h2>Giám sát tồn kho</h2>
          <p>
            Đối soát đơn thuộc trách nhiệm bưu cục với thao tác quét tồn kho trong ngày.
            Đơn chưa có quét tồn kho sẽ được xem là nghi mất hàng.
          </p>
        </div>
        <div className="ops-metrics-inventory__header-actions">
          <div className="ops-metrics-inventory__scope">
            <span>Phạm vi chịu trách nhiệm</span>
            <strong>{scopeText}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              void shipmentsQuery.refetch();
              void hubsQuery.refetch();
            }}
          >
            Làm mới
          </button>
        </div>
      </header>

      <section className="ops-metrics-inventory__summary">
        <article>
          <span>Tổng đơn chịu trách nhiệm</span>
          <strong>{responsibleRows.length}</strong>
        </article>
        <article data-tone="success">
          <span>Đã quét tồn kho trong ngày</span>
          <strong>{scannedTodayCount}</strong>
        </article>
        <article data-tone="danger">
          <span>Nghi mất hàng</span>
          <strong>{missingScanCount}</strong>
        </article>
        <article>
          <span>Tỷ lệ kiểm tồn</span>
          <strong>{formatPercent(scanRate)}</strong>
        </article>
      </section>

      <section className="ops-metrics-inventory__filters">
        <label>
          <span>Ngày kiểm tồn</span>
          <input type="date" value={inventoryDate} onChange={(event) => setInventoryDate(event.target.value)} />
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
          <span>Đối soát</span>
          <select
            value={auditStatusFilter}
            onChange={(event) => setAuditStatusFilter(event.target.value as 'ALL' | InventoryAuditStatus)}
          >
            <option value="ALL">Tất cả</option>
            <option value="MISSING_SCAN">Nghi mất hàng</option>
            <option value="SCANNED_TODAY">Đã quét tồn kho</option>
          </select>
        </label>
        <label>
          <span>Tìm kiếm</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, hub, khách hàng"
          />
        </label>
      </section>

      {loadError ? (
        <p className="ops-metrics-inventory__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-metrics-inventory__panel">
        <header className="ops-metrics-inventory__panel-head">
          <h3>Danh sách đối soát tồn kho</h3>
          <span>{isLoading ? 'Đang tải...' : `${inventoryRows.length} dòng`}</span>
        </header>
        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải dữ liệu tồn kho...</p>
        ) : null}
        {!isLoading && inventoryRows.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Không có vận đơn phù hợp bộ lọc đối soát.</p>
        ) : null}
        <div className="ops-metrics-inventory__table-wrap">
          <table className="ops-metrics-inventory__table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Bưu cục chịu trách nhiệm</th>
                <th>Kết luận</th>
                <th>Trạng thái hiện tại</th>
                <th>Khách hàng</th>
                <th>Quét tồn kho trong ngày</th>
                <th>Cập nhật gần nhất</th>
                <th>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                return (
                  <tr key={row.shipment.id}>
                    <td>
                      <Link className="ops-metrics-inventory__code" to={routePaths.shipmentDetail(row.shipment.id)}>
                        {row.shipment.shipmentCode}
                      </Link>
                    </td>
                    <td>{row.hubCode}</td>
                    <td>
                      <span
                        className={
                          row.auditStatus === 'MISSING_SCAN'
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            : 'ops-metrics-inventory__badge ops-metrics-inventory__badge--success'
                        }
                      >
                        {row.auditStatus === 'MISSING_SCAN' ? 'Nghi mất hàng' : 'Đã quét tồn kho'}
                      </span>
                    </td>
                    <td>{row.statusLabel}</td>
                    <td>{row.customerName}</td>
                    <td>{row.inventoryScannedAt ? formatDateTime(row.inventoryScannedAt) : 'Chưa quét'}</td>
                    <td>{formatDateTime(row.shipment.updatedAt)}</td>
                    <td>
                      {row.auditStatus === 'MISSING_SCAN'
                        ? row.missingReason
                        : `Đã quét trong ngày ${inventoryDate}`}
                      <br />
                      <small>Tuổi cập nhật: {formatAge(row.shipment.updatedAt)}</small>
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
