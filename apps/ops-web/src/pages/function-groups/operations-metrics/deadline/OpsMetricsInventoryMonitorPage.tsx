import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { authClient } from '../../../../features/auth/auth.client';
import type { OpsUserDto } from '../../../../features/auth/auth.types';
import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
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
const UNKNOWN_COURIER_ID = 'CHUA_XAC_DINH';
const COURIER_PROBLEM_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
]);
const COURIER_PROBLEM_NDR_STATUSES = new Set([
  'CREATED',
  'PENDING_RESOLUTION',
  'RESCHEDULED',
  'RETURN_REQUESTED',
  'OPEN',
  'RETURNING',
]);
const RETURN_RECORDED_STATUSES = new Set(['RETURN_STARTED', 'RETURNING', INVENTORY_SCAN_STATUS]);
const RETURN_RECORDED_NDR_STATUSES = new Set(['RETURN_REQUESTED', 'RETURNING']);
const DELIVERY_SUCCESS_STATUSES = new Set(['DELIVERED', 'DELIVERY_COMPLETED']);
const DELIVERY_FAILED_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURNING',
  INVENTORY_SCAN_STATUS,
]);

type InventoryAuditStatus = 'SCANNED_TODAY' | 'MISSING_SCAN';
type InventoryFilter = 'ALL' | InventoryAuditStatus | 'COURIER_PROBLEM';

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

interface CourierProblemRow {
  shipment: ShipmentListItemDto;
  task: TaskListItemDto | null;
  ndr: NdrCaseListItemDto | null;
  courierId: string;
  hubCode: string;
  issueLabel: string;
  returnRecordedAt: string | null;
  inventoryCheckedAfterReturnAt: string | null;
  updatedAt: string | null;
}

interface CourierHubGroup {
  courierId: string;
  courierName: string;
  hubCodes: string[];
  deliveryToday: number;
  deliveredSuccess: number;
  deliveryFailed: number;
  inventoryChecked: number;
  problemTotal: number;
  oldestHours: number | null;
  isKnownCourier: boolean;
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
  return formatAgeHours(hours);
}

function formatAgeHours(hours: number | null): string {
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

function isInventoryScannedOnDate(shipment: ShipmentListItemDto, inventoryDate: string): boolean {
  return (
    normalizeCode(shipment.currentStatus) === INVENTORY_SCAN_STATUS &&
    toDateKey(shipment.updatedAt) === inventoryDate
  );
}

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    const shipmentCode = normalizeCode(task.shipmentCode);
    if (!shipmentCode) {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || (task.updatedAt ?? '') > (previous.updatedAt ?? '')) {
      result.set(shipmentCode, task);
    }
  }

  return result;
}

function buildNdrByShipment(ndrCases: NdrCaseListItemDto[]): Map<string, NdrCaseListItemDto> {
  const result = new Map<string, NdrCaseListItemDto>();

  for (const ndr of ndrCases) {
    const shipmentCode = normalizeCode(ndr.shipmentCode);
    if (!shipmentCode) {
      continue;
    }

    const previous = result.get(shipmentCode);
    if (!previous || ndr.updatedAt > previous.updatedAt) {
      result.set(shipmentCode, ndr);
    }
  }

  return result;
}

function buildShipmentByCode(shipments: ShipmentListItemDto[]): Map<string, ShipmentListItemDto> {
  const result = new Map<string, ShipmentListItemDto>();

  for (const shipment of shipments) {
    result.set(normalizeCode(shipment.shipmentCode), shipment);
  }

  return result;
}

function timestampIsAfterOrSame(value: string | null, basis: string | null): boolean {
  if (!value || !basis) {
    return false;
  }

  const valueTime = new Date(value).getTime();
  const basisTime = new Date(basis).getTime();

  return !Number.isNaN(valueTime) && !Number.isNaN(basisTime) && valueTime >= basisTime;
}

function resolveCourierProblemRow(
  row: InventoryAuditRow,
  taskByShipment: Map<string, TaskListItemDto>,
  ndrByShipment: Map<string, NdrCaseListItemDto>,
): CourierProblemRow | null {
  const shipmentCode = normalizeCode(row.shipment.shipmentCode);
  const task = taskByShipment.get(shipmentCode) ?? null;
  const ndr = ndrByShipment.get(shipmentCode) ?? null;
  const shipmentStatus = normalizeCode(row.shipment.currentStatus);
  const ndrStatus = normalizeCode(ndr?.status);
  const isProblem =
    COURIER_PROBLEM_STATUSES.has(shipmentStatus) ||
    (ndr ? COURIER_PROBLEM_NDR_STATUSES.has(ndrStatus) : false);

  if (!isProblem) {
    return null;
  }

  const returnRecordedAt =
    RETURN_RECORDED_NDR_STATUSES.has(ndrStatus)
      ? ndr?.updatedAt ?? null
      : RETURN_RECORDED_STATUSES.has(shipmentStatus)
      ? row.shipment.updatedAt
      : null;
  const inventoryCheckedAt =
    normalizeCode(row.shipment.currentStatus) === INVENTORY_SCAN_STATUS ? row.shipment.updatedAt : null;
  const inventoryCheckedAfterReturnAt = timestampIsAfterOrSame(inventoryCheckedAt, returnRecordedAt)
    ? inventoryCheckedAt
    : null;
  const issueLabel = ndr?.reasonCode
    ? `NDR ${ndr.reasonCode}`
    : formatShipmentStatusLabel(row.shipment.currentStatus);

  return {
    shipment: row.shipment,
    task,
    ndr,
    courierId: normalizeCode(task?.assignedCourierId) || UNKNOWN_COURIER_ID,
    hubCode: row.hubCode,
    issueLabel,
    returnRecordedAt,
    inventoryCheckedAfterReturnAt,
    updatedAt: ndr?.updatedAt ?? row.shipment.updatedAt,
  };
}

function createEmptyCourierHubGroup(
  courierId: string,
  courierName: string,
  hubCodes: string[],
  isKnownCourier: boolean,
): CourierHubGroup {
  return {
    courierId,
    courierName,
    hubCodes,
    deliveryToday: 0,
    deliveredSuccess: 0,
    deliveryFailed: 0,
    inventoryChecked: 0,
    problemTotal: 0,
    oldestHours: null,
    isKnownCourier,
  };
}

function buildCourierHubGroups(
  rows: CourierProblemRow[],
  couriers: OpsUserDto[],
  deliveryTasks: TaskListItemDto[],
  shipmentByCode: Map<string, ShipmentListItemDto>,
  scopeShipmentCodes: Set<string>,
  inventoryDate: string,
): CourierHubGroup[] {
  const groups = new Map<string, CourierHubGroup>();

  for (const courier of couriers) {
    const courierId = normalizeCode(courier.username);
    if (!courierId) {
      continue;
    }

    groups.set(
      courierId,
      createEmptyCourierHubGroup(
        courierId,
        courier.displayName ?? courier.username,
        courier.hubCodes.map(normalizeCode).filter(Boolean),
        true,
      ),
    );
  }

  for (const task of deliveryTasks) {
    const shipmentCode = normalizeCode(task.shipmentCode);
    const shipment = shipmentByCode.get(shipmentCode);
    if (!shipment || !scopeShipmentCodes.has(shipmentCode)) {
      continue;
    }

    const courierId = normalizeCode(task.assignedCourierId) || UNKNOWN_COURIER_ID;
    const group =
      groups.get(courierId) ??
      createEmptyCourierHubGroup(
        courierId,
        courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định courier' : courierId,
        [],
        courierId !== UNKNOWN_COURIER_ID,
      );
    const status = normalizeCode(shipment.currentStatus);

    if (toDateKey(task.updatedAt) === inventoryDate) {
      group.deliveryToday += 1;
      if (DELIVERY_SUCCESS_STATUSES.has(status)) {
        group.deliveredSuccess += 1;
      } else if (DELIVERY_FAILED_STATUSES.has(status)) {
        group.deliveryFailed += 1;
      }
    }

    if (status === INVENTORY_SCAN_STATUS && toDateKey(shipment.updatedAt) === inventoryDate) {
      group.inventoryChecked += 1;
    }

    groups.set(courierId, group);
  }

  for (const row of rows) {
    const group =
      groups.get(row.courierId) ??
      createEmptyCourierHubGroup(
        row.courierId,
        row.courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định courier' : row.courierId,
        [],
        row.courierId !== UNKNOWN_COURIER_ID,
      );
    const rowAge = ageHours(row.updatedAt);

    group.problemTotal += 1;
    group.oldestHours = Math.max(group.oldestHours ?? 0, rowAge ?? 0);
    groups.set(row.courierId, group);
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (right.deliveryToday !== left.deliveryToday) {
      return right.deliveryToday - left.deliveryToday;
    }

    if (right.deliveryFailed !== left.deliveryFailed) {
      return right.deliveryFailed - left.deliveryFailed;
    }

    if (left.isKnownCourier !== right.isKnownCourier) {
      return left.isKnownCourier ? -1 : 1;
    }

    return left.courierId.localeCompare(right.courierId);
  });
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
    useState<InventoryFilter>('COURIER_PROBLEM');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken, { refetchInterval: 15000 });

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

  const courierHubCodes = useMemo(() => {
    if (hubFilter !== 'ALL') {
      return [hubFilter].filter(Boolean);
    }

    if (assignedHubCodes.length > 0) {
      return assignedHubCodes;
    }

    return canViewAllHubAreas ? hubOptions : [];
  }, [assignedHubCodes, canViewAllHubAreas, hubFilter, hubOptions]);

  const hubCouriersQuery = useQuery({
    queryKey: [...queryKeys.tasks, 'inventory-hub-couriers', courierHubCodes.join('|')],
    queryFn: async () => {
      const results = await Promise.all(
        courierHubCodes.map((hubCode) =>
          authClient.listUsers(accessToken, {
            roleGroup: 'SHIPPER',
            hubCode,
            status: 'ACTIVE',
          }),
        ),
      );
      const byUsername = new Map<string, OpsUserDto>();

      for (const courier of results.flat()) {
        byUsername.set(normalizeCode(courier.username), courier);
      }

      return Array.from(byUsername.values()).sort((left, right) =>
        normalizeCode(left.username).localeCompare(normalizeCode(right.username)),
      );
    },
    enabled: Boolean(accessToken && courierHubCodes.length > 0),
  });

  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], scopeHubCodes),
    [hubsQuery.data, scopeHubCodes],
  );

  const allResponsibleShipments = useMemo(() => {
    return (shipmentsQuery.data ?? []).filter((shipment) =>
      isShipmentInBranchScope(
        shipment,
        scopeHubCodes,
        scopeTokens,
        canViewAllHubAreas && hubFilter === 'ALL',
      ),
    );
  }, [canViewAllHubAreas, hubFilter, scopeHubCodes, scopeTokens, shipmentsQuery.data]);

  const responsibleRows = useMemo<InventoryAuditRow[]>(() => {
    return allResponsibleShipments
      .filter(isInventoryShipment)
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
              ? 'Đã có kiểm tồn nhưng ngoài ngày đối soát'
              : 'Chưa ghi nhận kiểm tồn trong ngày đối soát',
        };
      })
      .sort((left, right) => {
        if (left.auditStatus !== right.auditStatus) {
          return left.auditStatus === 'MISSING_SCAN' ? -1 : 1;
        }

        return (ageHours(right.shipment.updatedAt) ?? 0) - (ageHours(left.shipment.updatedAt) ?? 0);
      });
  }, [
    allResponsibleShipments,
    inventoryDate,
  ]);

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const ndrByShipment = useMemo(
    () => buildNdrByShipment(ndrQuery.data ?? []),
    [ndrQuery.data],
  );

  const problemByShipment = useMemo(() => {
    const result = new Map<string, CourierProblemRow>();

    for (const row of responsibleRows) {
      const problem = resolveCourierProblemRow(row, taskByShipment, ndrByShipment);
      if (problem) {
        result.set(normalizeCode(row.shipment.shipmentCode), problem);
      }
    }

    return result;
  }, [ndrByShipment, responsibleRows, taskByShipment]);

  const courierProblemRows = useMemo(
    () =>
      Array.from(problemByShipment.values()).sort((left, right) => {
        const courierDelta = left.courierId.localeCompare(right.courierId);
        if (courierDelta !== 0) {
          return courierDelta;
        }

        return (ageHours(right.updatedAt) ?? 0) - (ageHours(left.updatedAt) ?? 0);
      }),
    [problemByShipment],
  );

  const shipmentByCode = useMemo(
    () => buildShipmentByCode(allResponsibleShipments),
    [allResponsibleShipments],
  );

  const scopeShipmentCodes = useMemo(
    () => new Set(allResponsibleShipments.map((shipment) => normalizeCode(shipment.shipmentCode))),
    [allResponsibleShipments],
  );

  const courierHubGroups = useMemo(
    () =>
      buildCourierHubGroups(
        courierProblemRows,
        hubCouriersQuery.data ?? [],
        deliveryTasksQuery.data ?? [],
        shipmentByCode,
        scopeShipmentCodes,
        inventoryDate,
      ),
    [
      courierProblemRows,
      deliveryTasksQuery.data,
      hubCouriersQuery.data,
      inventoryDate,
      scopeShipmentCodes,
      shipmentByCode,
    ],
  );

  const inventoryRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return responsibleRows.filter((row) => {
      const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;
      const keywordMatched =
        !normalizedKeyword ||
        normalizeText(row.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalizeText(row.hubCode).includes(normalizedKeyword) ||
        normalizeText(row.customerName).includes(normalizedKeyword) ||
        normalizeText(problem?.courierId).includes(normalizedKeyword) ||
        normalizeText(problem?.issueLabel).includes(normalizedKeyword);
      const auditMatched =
        auditStatusFilter === 'ALL' ||
        (auditStatusFilter === 'COURIER_PROBLEM' && Boolean(problem)) ||
        row.auditStatus === auditStatusFilter;
      const courierMatched =
        courierFilter === 'ALL' ||
        (problem ? problem.courierId === courierFilter : false);

      return keywordMatched && auditMatched && courierMatched;
    });
  }, [auditStatusFilter, courierFilter, keyword, problemByShipment, responsibleRows]);

  useEffect(() => {
    setPage(1);
  }, [auditStatusFilter, courierFilter, hubFilter, inventoryDate, keyword, pageSize]);

  const totalPages = Math.max(1, Math.ceil(inventoryRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => inventoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, inventoryRows, pageSize],
  );
  const scannedTodayCount = responsibleRows.filter((row) => row.auditStatus === 'SCANNED_TODAY').length;
  const missingScanCount = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN').length;
  const courierProblemCount = courierProblemRows.length;
  const couriersWithProblemCount = courierHubGroups.filter((group) => group.problemTotal > 0).length;
  const couriersWithDeliveryTodayCount = courierHubGroups.filter((group) => group.deliveryToday > 0).length;
  const deliveryTodayCount = courierHubGroups.reduce((total, group) => total + group.deliveryToday, 0);
  const inventoryCheckedAfterReturnCount = courierProblemRows.filter(
    (row) => row.inventoryCheckedAfterReturnAt,
  ).length;
  const isLoading =
    shipmentsQuery.isLoading ||
    hubsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    ndrQuery.isLoading ||
    hubCouriersQuery.isLoading;
  const loadError =
    shipmentsQuery.error ??
    hubsQuery.error ??
    deliveryTasksQuery.error ??
    ndrQuery.error ??
    hubCouriersQuery.error ??
    null;
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
            Theo dõi lượt phát trong ngày theo courier, gồm phát thành công, phát bất thành
            và số kiện đã hoàn tất kiểm kho tại hub.
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
              void deliveryTasksQuery.refetch();
              void ndrQuery.refetch();
            }}
          >
            Làm mới
          </button>
        </div>
      </header>

      <section className="ops-metrics-inventory__summary">
        <article>
          <span>Đơn trong phạm vi hub</span>
          <strong>{responsibleRows.length}</strong>
        </article>
        <article data-tone="warning">
          <span>Kiện phát bất thường</span>
          <strong>{courierProblemCount}</strong>
        </article>
        <article>
          <span>Lượt phát trong ngày</span>
          <strong>{deliveryTodayCount}</strong>
          <small>{couriersWithDeliveryTodayCount} courier có lượt phát</small>
        </article>
        <article data-tone="success">
          <span>Kiện đã kiểm kho</span>
          <strong>{inventoryCheckedAfterReturnCount}</strong>
        </article>
        <article>
          <span>Courier trong hub</span>
          <strong>{courierHubGroups.length}</strong>
          <small>{couriersWithProblemCount} có kiện bất thường</small>
        </article>
        <article data-tone="danger">
          <span>Chưa có kiểm tồn</span>
          <strong>{missingScanCount}</strong>
          <small>{scannedTodayCount} đã quét hôm nay</small>
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
          <span>Courier phụ trách</span>
          <select value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {courierHubGroups.map((group) => (
              <option key={group.courierId} value={group.courierId}>
                {group.courierId === UNKNOWN_COURIER_ID
                  ? 'Chưa xác định'
                  : `${group.courierName} (${group.courierId})`}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Nhóm đối soát</span>
          <select
            value={auditStatusFilter}
            onChange={(event) => setAuditStatusFilter(event.target.value as InventoryFilter)}
          >
            <option value="COURIER_PROBLEM">Kiện phát bất thường</option>
            <option value="ALL">Tất cả</option>
            <option value="MISSING_SCAN">Chưa có kiểm tồn</option>
            <option value="SCANNED_TODAY">Đã kiểm tồn</option>
          </select>
        </label>
        <label>
          <span>Tìm kiếm</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, hub, courier, người nhận"
          />
        </label>
      </section>

      <section className="ops-metrics-inventory__courier-panel">
        <header className="ops-metrics-inventory__panel-head">
          <div>
            <h3>Hiệu suất courier theo hub</h3>
            <small>
              {isLoading
                ? 'Đang tải...'
                : `${couriersWithDeliveryTodayCount}/${courierHubGroups.length} courier có lượt phát · ${deliveryTodayCount} đơn`}
            </small>
          </div>
          <button
            type="button"
            className="ops-metrics-inventory__ghost-button"
            onClick={() => {
              setCourierFilter('ALL');
              setAuditStatusFilter('COURIER_PROBLEM');
            }}
          >
            Xem toàn bộ
          </button>
        </header>
        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải danh sách courier thuộc hub và dữ liệu NDR...</p>
        ) : null}
        {!isLoading && courierHubGroups.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Chưa tìm thấy courier ACTIVE thuộc phạm vi hub hiện tại.</p>
        ) : null}
        {courierHubGroups.length > 0 ? (
          <div className="ops-metrics-inventory__courier-list">
            <table className="ops-metrics-inventory__courier-table">
              <thead>
                <tr>
                  <th>Courier phụ trách</th>
                  <th>Lượt phát</th>
                  <th>Phát thành công</th>
                  <th>Phát bất thành</th>
                  <th>Kiện đã kiểm kho</th>
                  <th>Tồn đọng lâu nhất</th>
                </tr>
              </thead>
              <tbody>
                {courierHubGroups.map((group) => (
                  <tr
                    key={group.courierId}
                    className={
                      [
                        courierFilter === group.courierId ? 'ops-metrics-inventory__courier-row--active' : '',
                        group.deliveryToday === 0 && group.inventoryChecked === 0
                          ? 'ops-metrics-inventory__courier-row--clear'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Lọc courier ${group.courierName}`}
                    onClick={() => {
                      setCourierFilter(group.courierId);
                      setAuditStatusFilter('COURIER_PROBLEM');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCourierFilter(group.courierId);
                        setAuditStatusFilter('COURIER_PROBLEM');
                      }
                    }}
                  >
                    <td>
                      <strong>{group.courierName}</strong>
                      <small>
                        {group.courierId === UNKNOWN_COURIER_ID
                          ? 'Không có task gán courier'
                          : `${group.courierId} · ${group.hubCodes.join(', ') || 'Hub chưa rõ'}`}
                      </small>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryToday > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--warning'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryToday}
                      </span>
                    </td>
                    <td>
                      <span className="ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear">
                        {group.deliveredSuccess}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryFailed > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--danger'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryFailed}
                      </span>
                    </td>
                    <td>{group.inventoryChecked}</td>
                    <td>{group.problemTotal === 0 ? '-' : formatAgeHours(group.oldestHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
                <th>Hub chịu trách nhiệm</th>
                <th>Courier phụ trách</th>
                <th>Kết quả đối soát</th>
                <th>Trạng thái hiện tại</th>
                <th>Người nhận</th>
                <th>Kết quả kiểm kho</th>
                <th>Cập nhật gần nhất</th>
                <th>Ghi chú nghiệp vụ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;

                return (
                  <tr key={row.shipment.id}>
                    <td>
                      <Link className="ops-metrics-inventory__code" to={routePaths.shipmentDetail(row.shipment.id)}>
                        {row.shipment.shipmentCode}
                      </Link>
                    </td>
                    <td>{row.hubCode}</td>
                    <td>
                      {problem ? (
                        <>
                          <strong>{problem.courierId === UNKNOWN_COURIER_ID ? 'Chưa xác định' : problem.courierId}</strong>
                          <br />
                          <small>{problem.task ? problem.task.taskCode : 'Chưa có delivery task'}</small>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          problem
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--warning'
                            : row.auditStatus === 'MISSING_SCAN'
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            : 'ops-metrics-inventory__badge ops-metrics-inventory__badge--success'
                        }
                      >
                        {problem
                          ? 'Phát bất thành'
                          : row.auditStatus === 'MISSING_SCAN'
                          ? 'Chưa có kiểm tồn'
                          : 'Đã kiểm tồn'}
                      </span>
                    </td>
                    <td>{row.statusLabel}</td>
                    <td>{row.customerName}</td>
                    <td>
                      {problem ? (
                        <>
                          <span
                            className={
                              problem.inventoryCheckedAfterReturnAt
                                ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--success'
                                : 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            }
                          >
                            {problem.inventoryCheckedAfterReturnAt ? 'Đã kiểm kho' : 'Chưa kiểm kho'}
                          </span>
                          <br />
                          <small>
                            {problem.inventoryCheckedAfterReturnAt
                              ? formatDateTime(problem.inventoryCheckedAfterReturnAt)
                              : 'Chưa có quét kiểm kho'}
                          </small>
                        </>
                      ) : row.inventoryScannedAt ? (
                        formatDateTime(row.inventoryScannedAt)
                      ) : (
                        'Chưa quét'
                      )}
                    </td>
                    <td>{formatDateTime(row.shipment.updatedAt)}</td>
                    <td>
                      {problem ? (
                        <>
                          {problem.issueLabel}
                          {problem.ndr ? (
                            <>
                              <br />
                              <Link className="ops-metrics-inventory__code" to={routePaths.ndrDetail(problem.ndr.id)}>
                                NDR {formatNdrStatusLabel(problem.ndr.status)}
                              </Link>
                            </>
                          ) : null}
                        </>
                      ) : row.auditStatus === 'MISSING_SCAN' ? (
                        row.missingReason
                      ) : (
                        `Đã quét trong ngày ${inventoryDate}`
                      )}
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
