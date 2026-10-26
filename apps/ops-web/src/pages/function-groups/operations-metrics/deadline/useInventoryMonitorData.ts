import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { authClient } from '../../../../features/auth/auth.client';
import type { AuthSessionDto, OpsUserDto } from '../../../../features/auth/auth.types';
import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
import {
  buildBranchScopeTokens,
  isShipmentInBranchScope,
  normalizeBranchCode,
} from '../../branch-business/shared/branchBusinessData';
import {
  ageHours,
  buildCourierHubGroups,
  buildNdrByShipment,
  buildShipmentByCode,
  buildTaskByShipment,
  INVENTORY_SCAN_STATUS,
  isInventoryScannedOnDate,
  isInventoryShipment,
  normalizeCode,
  normalizeText,
  resolveAgingTier,
  resolveCourierProblemRow,
  resolveInventoryHub,
  resolveLastActorInfo,
  toDateInputValue,
  UNKNOWN_COURIER_ID,
  type AgingTier,
  type CourierHubGroup,
  type CourierProblemRow,
  type InventoryAuditRow,
  type InventoryAuditStatus,
  type InventoryFilter,
  type ResponsiblePartyFilter,
} from './inventoryMonitorHelpers';

interface UseInventoryMonitorDataProps {
  session: AuthSessionDto | null;
}

export function useInventoryMonitorData({ session }: UseInventoryMonitorDataProps) {
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);

  const [inventoryDate, setInventoryDate] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState<InventoryFilter>('COURIER_PROBLEM');
  const [responsiblePartyFilter, setResponsiblePartyFilter] = useState<ResponsiblePartyFilter>('ALL');
  const [agingTierFilter, setAgingTierFilter] = useState<AgingTier>('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
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

  const hubOpsUsersQuery = useQuery({
    queryKey: [...queryKeys.tasks, 'inventory-hub-ops-users', courierHubCodes.join('|')],
    queryFn: async () => {
      const results = await Promise.all(
        courierHubCodes.map((hubCode) =>
          authClient.listUsers(accessToken, {
            roleGroup: 'OPS',
            hubCode,
            status: 'ACTIVE',
          }),
        ),
      );
      const byUsername = new Map<string, OpsUserDto>();

      for (const opsUser of results.flat()) {
        byUsername.set(normalizeCode(opsUser.username), opsUser);
      }

      return Array.from(byUsername.values()).sort((left, right) =>
        normalizeCode(left.username).localeCompare(normalizeCode(right.username)),
      );
    },
    enabled: Boolean(accessToken && courierHubCodes.length > 0),
  });

  const userByUsername = useMemo(() => {
    const map = new Map<string, OpsUserDto>();
    for (const courier of hubCouriersQuery.data ?? []) {
      map.set(normalizeCode(courier.username), courier);
    }
    for (const opsUser of hubOpsUsersQuery.data ?? []) {
      map.set(normalizeCode(opsUser.username), opsUser);
    }
    return map;
  }, [hubCouriersQuery.data, hubOpsUsersQuery.data]);

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

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const ndrByShipment = useMemo(
    () => buildNdrByShipment(ndrQuery.data ?? []),
    [ndrQuery.data],
  );

  const responsibleRows = useMemo<InventoryAuditRow[]>(() => {
    return allResponsibleShipments
      .filter(isInventoryShipment)
      .map((shipment) => {
        const shipmentCode = normalizeCode(shipment.shipmentCode);
        const task = taskByShipment.get(shipmentCode) ?? null;
        const ndr = ndrByShipment.get(shipmentCode) ?? null;
        const status = normalizeCode(shipment.currentStatus);
        const inventoryScannedAt = isInventoryScannedOnDate(shipment, inventoryDate)
          ? shipment.updatedAt
          : null;
        const auditStatus: InventoryAuditStatus = inventoryScannedAt
          ? 'SCANNED_TODAY'
          : 'MISSING_SCAN';

        const cumulativeAge = ageHours(shipment.createdAt);
        const lastUpdateAge = ageHours(shipment.updatedAt);
        const tier = resolveAgingTier(cumulativeAge);
        const lastActor = resolveLastActorInfo(shipment, task, ndr, userByUsername);

        return {
          shipment,
          hubCode: resolveInventoryHub(shipment),
          customerName: shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có',
          receiverPhone: shipment.receiverPhone ?? null,
          status,
          statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
          auditStatus,
          inventoryScannedAt,
          missingReason:
            status === INVENTORY_SCAN_STATUS
              ? 'Đã có kiểm tồn nhưng ngoài ngày đối soát'
              : 'Chưa ghi nhận quét kiểm tồn trong ngày đối soát',
          cumulativeAgeHours: cumulativeAge,
          lastUpdateAgeHours: lastUpdateAge,
          agingTier: tier,
          lastActor,
        };
      })
      .sort((left, right) => {
        if (left.auditStatus !== right.auditStatus) {
          return left.auditStatus === 'MISSING_SCAN' ? -1 : 1;
        }

        return (right.cumulativeAgeHours ?? 0) - (left.cumulativeAgeHours ?? 0);
      });
  }, [allResponsibleShipments, inventoryDate, ndrByShipment, taskByShipment, userByUsername]);

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
        responsibleRows,
      ),
    [
      courierProblemRows,
      deliveryTasksQuery.data,
      hubCouriersQuery.data,
      inventoryDate,
      responsibleRows,
      scopeShipmentCodes,
      shipmentByCode,
    ],
  );

  const distinctActors = useMemo(() => {
    const courierMap = new Map<string, string>();
    const opsMap = new Map<string, string>();

    for (const row of responsibleRows) {
      if (row.lastActor.partyType === 'COURIER' && row.lastActor.actorId !== UNKNOWN_COURIER_ID) {
        courierMap.set(row.lastActor.actorId, row.lastActor.actorName);
      } else if (
        row.lastActor.partyType === 'OPS_WAREHOUSE' ||
        row.lastActor.partyType === 'OPS_INBOUND'
      ) {
        if (row.lastActor.actorId && row.lastActor.actorId !== 'OPS_STAFF') {
          opsMap.set(row.lastActor.actorId, row.lastActor.actorName);
        }
      }
    }

    return {
      couriers: Array.from(courierMap.entries()).map(([id, name]) => ({ id, name })),
      opsStaff: Array.from(opsMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [responsibleRows]);

  const inventoryRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return responsibleRows.filter((row) => {
      const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;

      const keywordMatched =
        !normalizedKeyword ||
        normalizeText(row.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalizeText(row.hubCode).includes(normalizedKeyword) ||
        normalizeText(row.customerName).includes(normalizedKeyword) ||
        normalizeText(row.receiverPhone).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.actorName).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.actorId).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.phone).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.lastActionTitle).includes(normalizedKeyword) ||
        normalizeText(row.lastActor.lastActionDetail).includes(normalizedKeyword) ||
        normalizeText(problem?.courierId).includes(normalizedKeyword) ||
        normalizeText(problem?.issueLabel).includes(normalizedKeyword);

      const auditMatched =
        auditStatusFilter === 'ALL' ||
        (auditStatusFilter === 'COURIER_PROBLEM' && Boolean(problem)) ||
        row.auditStatus === auditStatusFilter;

      const partyMatched =
        responsiblePartyFilter === 'ALL' || row.lastActor.partyType === responsiblePartyFilter;

      const agingMatched = agingTierFilter === 'ALL' || row.agingTier === agingTierFilter;

      const actorMatched =
        actorFilter === 'ALL' ||
        row.lastActor.actorId === actorFilter ||
        (problem ? problem.courierId === actorFilter : false);

      const courierMatched =
        courierFilter === 'ALL' ||
        row.lastActor.actorId === courierFilter ||
        (problem ? problem.courierId === courierFilter : false);

      return (
        keywordMatched &&
        auditMatched &&
        partyMatched &&
        agingMatched &&
        actorMatched &&
        courierMatched
      );
    });
  }, [
    actorFilter,
    agingTierFilter,
    auditStatusFilter,
    courierFilter,
    keyword,
    problemByShipment,
    responsiblePartyFilter,
    responsibleRows,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    actorFilter,
    agingTierFilter,
    auditStatusFilter,
    courierFilter,
    hubFilter,
    inventoryDate,
    keyword,
    pageSize,
    responsiblePartyFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(inventoryRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => inventoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, inventoryRows, pageSize],
  );

  // Statistics
  const totalInventoryCount = responsibleRows.length;
  const scannedTodayCount = responsibleRows.filter((row) => row.auditStatus === 'SCANNED_TODAY').length;
  const missingScanCount = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN').length;
  const missingDueToCourierCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'COURIER',
  ).length;
  const missingDueToWarehouseCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'OPS_WAREHOUSE',
  ).length;
  const missingDueToInboundCount = responsibleRows.filter(
    (row) => row.auditStatus === 'MISSING_SCAN' && row.lastActor.partyType === 'OPS_INBOUND',
  ).length;

  const over72hCount = responsibleRows.filter((row) => row.agingTier === 'OVER_72H').length;
  const backlog24to72hCount = responsibleRows.filter(
    (row) => row.agingTier === '24H_TO_48H' || row.agingTier === '48H_TO_72H',
  ).length;
  const backlogOver24hCount = backlog24to72hCount + over72hCount;
  const auditCompliancePercent =
    totalInventoryCount > 0 ? Math.round((scannedTodayCount / totalInventoryCount) * 100) : 100;

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
    hubCouriersQuery.isLoading ||
    hubOpsUsersQuery.isLoading;

  const loadError =
    shipmentsQuery.error ??
    hubsQuery.error ??
    deliveryTasksQuery.error ??
    ndrQuery.error ??
    hubCouriersQuery.error ??
    hubOpsUsersQuery.error;

  const refetchAll = () => {
    void Promise.all([
      shipmentsQuery.refetch(),
      hubsQuery.refetch(),
      deliveryTasksQuery.refetch(),
      ndrQuery.refetch(),
      hubCouriersQuery.refetch(),
      hubOpsUsersQuery.refetch(),
    ]);
  };

  return {
    inventoryDate,
    setInventoryDate,
    hubFilter,
    setHubFilter,
    auditStatusFilter,
    setAuditStatusFilter,
    responsiblePartyFilter,
    setResponsiblePartyFilter,
    agingTierFilter,
    setAgingTierFilter,
    courierFilter,
    setCourierFilter,
    actorFilter,
    setActorFilter,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    currentPage,
    paginatedRows,
    inventoryRows,
    responsibleRows,
    courierHubGroups,
    hubOptions,
    distinctActors,
    problemByShipment,
    scopeHubCodes,
    isLoading,
    loadError,
    refetchAll,
    // Statistics
    stats: {
      totalInventoryCount,
      scannedTodayCount,
      missingScanCount,
      missingDueToCourierCount,
      missingDueToWarehouseCount,
      missingDueToInboundCount,
      over72hCount,
      backlog24to72hCount,
      backlogOver24hCount,
      auditCompliancePercent,
      courierProblemCount,
      couriersWithProblemCount,
      couriersWithDeliveryTodayCount,
      deliveryTodayCount,
      inventoryCheckedAfterReturnCount,
    },
  };
}
