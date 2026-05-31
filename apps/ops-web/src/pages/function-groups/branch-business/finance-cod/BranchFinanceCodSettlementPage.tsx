import React, { useEffect, useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import {
  useCodDailySettlementQuery,
  useConfirmCodSettlementMutation,
  useCreateCodSettlementMutation,
} from '../../../../features/payments/payment.api';
import type {
  CodCollectionStatus,
  CodDailySettlementRecordDto,
  CodSettlementBatchDto,
} from '../../../../features/payments/payment.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../../../utils/locationScope';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { BranchTablePagination } from '../shared/BranchTablePagination';
import './BranchFinanceCodSettlementPage.css';

interface CodSettlementFilters {
  reportDate: string;
  hubCode: string;
  courierId: string;
}

interface EnrichedCodSettlementRecord extends CodDailySettlementRecordDto {
  courierId: string;
  shipment: ShipmentListItemDto | null;
  hubCode: string;
  receiverName: string;
  receiverPhone: string;
  source: 'payment' | 'preview';
}

interface CourierCodSummary {
  key: string;
  courierId: string;
  hubCode: string;
  codOrders: number;
  collectedOrders: number;
  remittedOrders: number;
  pendingOrders: number;
  codTotal: number;
  collectedTotal: number;
  remittedTotal: number;
  pendingRemitTotal: number;
  latestCollectedAt: string | null;
  records: EnrichedCodSettlementRecord[];
  creatableRecords: EnrichedCodSettlementRecord[];
  waitingBatch: CodSettlementBatchDto | null;
  latestBatch: CodSettlementBatchDto | null;
}

const UNKNOWN_COURIER = 'Chưa xác định';
const UNKNOWN_HUB = 'UNKNOWN';

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, value))} đ`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    if (!task.shipmentCode || task.taskType !== 'DELIVERY') {
      continue;
    }

    const previous = result.get(task.shipmentCode);
    if (!previous || previous.updatedAt < task.updatedAt) {
      result.set(task.shipmentCode, task);
    }
  }

  return result;
}

function buildShipmentByCode(
  shipments: ShipmentListItemDto[],
): Map<string, ShipmentListItemDto> {
  return new Map(
    shipments.map((shipment) => [
      shipment.shipmentCode.trim().toUpperCase(),
      shipment,
    ]),
  );
}

function shipmentHubCandidates(shipment: ShipmentListItemDto): string[] {
  return [
    shipment.currentLocation,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
    shipment.originHubCode,
    shipment.senderHubCode,
  ]
    .map((value) => (value ?? '').trim().toUpperCase())
    .filter(Boolean);
}

function shipmentMatchesHubCodes(shipment: ShipmentListItemDto, hubCodes: string[]): boolean {
  if (hubCodes.length === 0) {
    return false;
  }

  const candidates = shipmentHubCandidates(shipment);
  return candidates.some((candidate) => hubCodes.includes(candidate));
}

function resolveShipmentHubCode(shipment: ShipmentListItemDto, hubCodes: string[]): string {
  const candidates = shipmentHubCandidates(shipment);
  return candidates.find((candidate) => hubCodes.includes(candidate)) ?? candidates[0] ?? UNKNOWN_HUB;
}

function isShipmentInBranchScope(
  shipment: ShipmentListItemDto,
  hubCodes: string[],
  scopeTokens: Set<string>,
): boolean {
  if (shipmentMatchesHubCodes(shipment, hubCodes)) {
    return true;
  }

  return isShipmentInScope(shipment, scopeTokens);
}

function buildSummaryKey(courierId: string, hubCode: string): string {
  return `${courierId}::${hubCode}`;
}

function getCollectedAmount(record: CodDailySettlementRecordDto): number {
  return Math.max(0, record.collectedAmount ?? record.codAmount);
}

function getStatusLabel(status: CodCollectionStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chưa thu COD';
    case 'COLLECTED':
      return 'Đã thu, chưa nộp';
    case 'REMITTED':
      return 'Đã nộp công ty';
    case 'FAILED':
      return 'Thu hộ thất bại';
    default:
      return status;
  }
}

function getBankTransferStatusLabel(record: CodDailySettlementRecordDto): string {
  if (record.status === 'REMITTED') {
    return 'Đã vào công ty';
  }

  if (record.status === 'FAILED') {
    return 'Giao dịch lỗi';
  }

  return 'Chờ ngân hàng xác nhận';
}

function getBankTransferStatusTone(record: CodDailySettlementRecordDto): string {
  if (record.status === 'REMITTED') {
    return 'success';
  }

  if (record.status === 'FAILED') {
    return 'danger';
  }

  return 'warning';
}

function getBatchStatusLabel(status: CodSettlementBatchDto['status']): string {
  switch (status) {
    case 'WAITING_PAYMENT':
      return 'Chờ SePay xác nhận';
    case 'PAID':
      return 'Đã nộp';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}

function getStatusTone(status: CodCollectionStatus | CodSettlementBatchDto['status']): string {
  switch (status) {
    case 'REMITTED':
    case 'PAID':
      return 'success';
    case 'COLLECTED':
    case 'WAITING_PAYMENT':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
      return 'danger';
    default:
      return 'muted';
  }
}

export function BranchFinanceCodSettlementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const defaultHubCode = assignedHubCodes[0] ?? (canViewAllHubAreas ? 'all' : '');

  const initialFilters = useMemo<CodSettlementFilters>(
    () => ({
      reportDate: today,
      hubCode: defaultHubCode,
      courierId: 'all',
    }),
    [defaultHubCode, today],
  );
  const [draftFilters, setDraftFilters] = useState<CodSettlementFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CodSettlementFilters>(initialFilters);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(25);
  const [localBatchesByKey, setLocalBatchesByKey] = useState<Map<string, CodSettlementBatchDto>>(
    () => new Map(),
  );
  const [pendingQrSummary, setPendingQrSummary] = useState<CourierCodSummary | null>(null);
  const [pendingConfirmBatch, setPendingConfirmBatch] = useState<CodSettlementBatchDto | null>(null);
  const [viewQrBatch, setViewQrBatch] = useState<CodSettlementBatchDto | null>(null);
  const [confirmNote, setConfirmNote] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  const selectedHubCodes = useMemo(() => {
    if (appliedFilters.hubCode && appliedFilters.hubCode !== 'all') {
      return [appliedFilters.hubCode.trim().toUpperCase()];
    }

    return canViewAllHubAreas ? [] : assignedHubCodes;
  }, [appliedFilters.hubCode, assignedHubCodes, canViewAllHubAreas]);

  const settlementQuery = useCodDailySettlementQuery(accessToken, {
    date: appliedFilters.reportDate,
    hubCode: appliedFilters.hubCode === 'all' ? null : appliedFilters.hubCode,
    courierId: appliedFilters.courierId === 'all' ? null : appliedFilters.courierId,
    status: 'ALL',
  });
  const shipmentsQuery = useShipmentsQuery(
    accessToken,
    {
      status: 'DELIVERED',
      hubCodes: selectedHubCodes.length > 0 ? selectedHubCodes : undefined,
    },
    { refetchInterval: false },
  );
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, { refetchInterval: false });
  const hubsQuery = useHubsQuery(accessToken, {});
  const createSettlementMutation = useCreateCodSettlementMutation(accessToken);
  const confirmSettlementMutation = useConfirmCodSettlementMutation(accessToken);

  const allHubs = hubsQuery.data ?? [];
  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(allHubs, selectedHubCodes),
    [allHubs, selectedHubCodes],
  );
  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );
  const shipmentByCode = useMemo(
    () => buildShipmentByCode(shipmentsQuery.data ?? []),
    [shipmentsQuery.data],
  );

  const hubOptions = useMemo(() => {
    if (canViewAllHubAreas) {
      return allHubs
        .filter((hub) => hub.isActive)
        .map((hub) => ({ code: hub.code.trim().toUpperCase(), label: `${hub.code} - ${hub.name}` }));
    }

    const hubByCode = new Map(
      allHubs.map((hub) => [hub.code.trim().toUpperCase(), `${hub.code} - ${hub.name}`] as const),
    );

    return assignedHubCodes.map((code) => ({
      code,
      label: hubByCode.get(code) ?? code,
    }));
  }, [allHubs, assignedHubCodes, canViewAllHubAreas]);

  const backendBatches = settlementQuery.data?.batches ?? [];
  const batchedShipmentCodes = useMemo(
    () =>
      new Set(
        [...backendBatches, ...localBatchesByKey.values()]
          .filter((batch) => batch.status !== 'CANCELLED')
          .flatMap((batch) => batch.items.map((item) => item.shipmentCode)),
      ),
    [backendBatches, localBatchesByKey],
  );
  const latestBatchByKey = useMemo(() => {
    const result = new Map<string, CodSettlementBatchDto>();

    for (const batch of backendBatches) {
      result.set(buildSummaryKey(batch.courierId, batch.hubCode), batch);
    }

    for (const [key, batch] of localBatchesByKey.entries()) {
      result.set(key, batch);
    }

    return result;
  }, [backendBatches, localBatchesByKey]);

  const paymentRecords = useMemo<EnrichedCodSettlementRecord[]>(() => {
    const shouldFilterByHub = selectedHubCodes.length > 0;

    return (settlementQuery.data?.records ?? [])
      .map((record) => {
        const shipment = shipmentByCode.get(record.shipmentCode.trim().toUpperCase()) ?? null;
        const task = taskByShipment.get(record.shipmentCode);
        const recordHubCode = record.hubCode?.trim().toUpperCase() ?? null;

        if (
          shouldFilterByHub &&
          !recordHubCode &&
          shipment &&
          !isShipmentInBranchScope(shipment, selectedHubCodes, hubScopeTokens)
        ) {
          return null;
        }

        if (
          shouldFilterByHub &&
          recordHubCode &&
          !selectedHubCodes.includes(recordHubCode)
        ) {
          return null;
        }

        if (shouldFilterByHub && !recordHubCode && !shipment) {
          return null;
        }

        const resolvedHubCode =
          recordHubCode ??
          (shipment
            ? resolveShipmentHubCode(shipment, selectedHubCodes)
            : appliedFilters.hubCode === 'all'
              ? UNKNOWN_HUB
              : appliedFilters.hubCode.trim().toUpperCase());

        return {
          ...record,
          paymentMethod: record.paymentMethod ?? 'COD',
          shipment,
          courierId: record.courierId ?? task?.assignedCourierId ?? UNKNOWN_COURIER,
          hubCode: resolvedHubCode,
          receiverName: shipment?.receiverName ?? 'Chưa khớp vận đơn',
          receiverPhone: shipment?.receiverPhone ?? '-',
          source: 'payment',
        };
      })
      .filter((record): record is EnrichedCodSettlementRecord => Boolean(record));
  }, [
    appliedFilters.hubCode,
    hubScopeTokens,
    selectedHubCodes,
    settlementQuery.data?.records,
    shipmentByCode,
    taskByShipment,
  ]);

  const previewRecords = useMemo<EnrichedCodSettlementRecord[]>(() => {
    const shipments = shipmentsQuery.data ?? [];
    const shouldFilterByHub = selectedHubCodes.length > 0;

    return shipments
      .filter((shipment) => shipment.currentStatus === 'DELIVERED')
      .filter((shipment) => Math.max(0, shipment.codAmount ?? 0) > 0)
      .filter((shipment) => toDateKey(shipment.updatedAt) === appliedFilters.reportDate)
      .filter((shipment) => {
        if (!shouldFilterByHub) {
          return true;
        }

        return isShipmentInBranchScope(shipment, selectedHubCodes, hubScopeTokens);
      })
      .map((shipment): EnrichedCodSettlementRecord | null => {
        const task = taskByShipment.get(shipment.shipmentCode);
        const courierId = task?.assignedCourierId ?? UNKNOWN_COURIER;

        if (appliedFilters.courierId !== 'all' && courierId !== appliedFilters.courierId) {
          return null;
        }

        const codAmount = Math.max(0, shipment.codAmount ?? 0);

        return {
          shipmentCode: shipment.shipmentCode,
          codAmount,
          collectedAmount: codAmount,
          status: 'COLLECTED' as const,
          courierId,
          collectedAt: shipment.updatedAt,
          remittedAt: null,
          companyReceivedAt: null,
          companyReceivedRef: null,
          paymentMethod: 'COD' as const,
          shipment,
          hubCode: resolveShipmentHubCode(shipment, selectedHubCodes),
          receiverName: shipment.receiverName ?? 'Người nhận',
          receiverPhone: shipment.receiverPhone ?? '-',
          source: 'preview' as const,
        };
      })
      .filter((record): record is EnrichedCodSettlementRecord => Boolean(record));
  }, [
    appliedFilters.courierId,
    appliedFilters.reportDate,
    hubScopeTokens,
    selectedHubCodes,
    shipmentsQuery.data,
    taskByShipment,
  ]);

  const isUsingPreviewData =
    settlementQuery.isError || (!settlementQuery.isLoading && paymentRecords.length === 0);
  const enrichedRecords = isUsingPreviewData ? previewRecords : paymentRecords;
  const cashRecords = useMemo(
    () => enrichedRecords.filter((record) => record.paymentMethod === 'COD'),
    [enrichedRecords],
  );
  const bankTransferRecords = useMemo(
    () => enrichedRecords.filter((record) => record.paymentMethod === 'BANK_TRANSFER'),
    [enrichedRecords],
  );

  const courierOptions = useMemo(
    () =>
      Array.from(
        new Set(
          enrichedRecords
            .map((record) => record.courierId)
            .filter((courierId) => courierId !== UNKNOWN_COURIER),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [enrichedRecords],
  );

  const courierSummaries = useMemo<CourierCodSummary[]>(() => {
    const summaryByCourier = new Map<string, CourierCodSummary>();

    for (const record of cashRecords) {
      const key = buildSummaryKey(record.courierId, record.hubCode);
      const latestBatch = latestBatchByKey.get(key) ?? null;
      const summary =
        summaryByCourier.get(key) ??
        {
          key,
          courierId: record.courierId,
          hubCode: record.hubCode,
          codOrders: 0,
          collectedOrders: 0,
          remittedOrders: 0,
          pendingOrders: 0,
          codTotal: 0,
          collectedTotal: 0,
          remittedTotal: 0,
          pendingRemitTotal: 0,
          latestCollectedAt: null,
          records: [],
          creatableRecords: [],
          waitingBatch: latestBatch?.status === 'WAITING_PAYMENT' ? latestBatch : null,
          latestBatch,
        };
      const collectedAmount = getCollectedAmount(record);

      summary.codOrders += 1;
      summary.codTotal += Math.max(0, record.codAmount);
      summary.records.push(record);

      if (record.status === 'COLLECTED' || record.status === 'REMITTED') {
        summary.collectedOrders += 1;
        summary.collectedTotal += collectedAmount;
      }

      if (record.status === 'REMITTED') {
        summary.remittedOrders += 1;
        summary.remittedTotal += collectedAmount;
      }

      if (record.status === 'COLLECTED') {
        summary.pendingOrders += 1;
        summary.pendingRemitTotal += collectedAmount;

        if (!batchedShipmentCodes.has(record.shipmentCode)) {
          summary.creatableRecords.push(record);
        }
      }

      if (record.collectedAt && (!summary.latestCollectedAt || record.collectedAt > summary.latestCollectedAt)) {
        summary.latestCollectedAt = record.collectedAt;
      }

      summaryByCourier.set(key, summary);
    }

    return Array.from(summaryByCourier.values()).sort(
      (a, b) => b.pendingRemitTotal - a.pendingRemitTotal || b.codTotal - a.codTotal,
    );
  }, [batchedShipmentCodes, cashRecords, latestBatchByKey]);

  useEffect(() => {
    setDetailPage(1);
  }, [appliedFilters, detailPageSize]);

  const detailTotalPages = Math.max(1, Math.ceil(enrichedRecords.length / detailPageSize));
  const currentDetailPage = Math.min(detailPage, detailTotalPages);
  const paginatedDetailRows = useMemo(
    () =>
      enrichedRecords.slice(
        (currentDetailPage - 1) * detailPageSize,
        currentDetailPage * detailPageSize,
      ),
    [currentDetailPage, detailPageSize, enrichedRecords],
  );

  const derivedTotals = useMemo(() => {
    let codTotal = 0;
    let cashCollectedTotal = 0;
    let bankTransferTotal = 0;
    let companyReceivedTotal = 0;
    let pendingCashRemitTotal = 0;
    let waitingBankConfirmTotal = 0;

    for (const record of enrichedRecords) {
      const amount = getCollectedAmount(record);
      codTotal += Math.max(0, record.codAmount);

      if (record.paymentMethod === 'COD' && (record.status === 'COLLECTED' || record.status === 'REMITTED')) {
        cashCollectedTotal += amount;
      }

      if (record.paymentMethod === 'BANK_TRANSFER' && (record.status === 'COLLECTED' || record.status === 'REMITTED')) {
        bankTransferTotal += amount;
      }

      if (record.status === 'REMITTED') {
        companyReceivedTotal += amount;
      }

      if (record.paymentMethod === 'COD' && record.status === 'COLLECTED') {
        pendingCashRemitTotal += amount;
      }

      if (record.paymentMethod === 'BANK_TRANSFER' && record.status === 'COLLECTED') {
        waitingBankConfirmTotal += amount;
      }
    }

    return {
      codTotal,
      cashCollectedTotal,
      bankTransferTotal,
      companyReceivedTotal,
      pendingCashRemitTotal,
      waitingBankConfirmTotal,
    };
  }, [enrichedRecords]);
  const codTotal = isUsingPreviewData ? derivedTotals.codTotal : settlementQuery.data?.codTotal ?? derivedTotals.codTotal;
  const cashCollectedTotal = isUsingPreviewData
    ? derivedTotals.cashCollectedTotal
    : settlementQuery.data?.cashCollectedTotal ?? derivedTotals.cashCollectedTotal;
  const bankTransferTotal = isUsingPreviewData
    ? derivedTotals.bankTransferTotal
    : settlementQuery.data?.bankTransferTotal ?? derivedTotals.bankTransferTotal;
  const companyReceivedTotal = isUsingPreviewData
    ? derivedTotals.companyReceivedTotal
    : settlementQuery.data?.companyReceivedTotal ?? settlementQuery.data?.remittedTotal ?? derivedTotals.companyReceivedTotal;
  const pendingCashRemitTotal = isUsingPreviewData
    ? derivedTotals.pendingCashRemitTotal
    : settlementQuery.data?.pendingCashRemitTotal ?? settlementQuery.data?.pendingRemitTotal ?? derivedTotals.pendingCashRemitTotal;
  const waitingBankConfirmTotal = isUsingPreviewData
    ? derivedTotals.waitingBankConfirmTotal
    : settlementQuery.data?.waitingBankConfirmTotal ?? derivedTotals.waitingBankConfirmTotal;
  const isLoading =
    settlementQuery.isLoading ||
    shipmentsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    hubsQuery.isLoading;
  const isSearching =
    settlementQuery.isFetching ||
    shipmentsQuery.isFetching ||
    deliveryTasksQuery.isFetching ||
    hubsQuery.isFetching;
  const hasScopeWarning = assignedHubCodes.length === 0 && !canViewAllHubAreas;
  const mutationError = createSettlementMutation.error ?? confirmSettlementMutation.error ?? null;

  const updateDraftFilter = (key: keyof CodSettlementFilters, value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'hubCode' ? { courierId: 'all' } : {}),
    }));
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setPendingQrSummary(null);
    setPendingConfirmBatch(null);
    setViewQrBatch(null);
    setAppliedFilters(draftFilters);
    void Promise.all([
      settlementQuery.refetch(),
      shipmentsQuery.refetch(),
      deliveryTasksQuery.refetch(),
      hubsQuery.refetch(),
    ]);
  };

  const createSettlement = async (summary: CourierCodSummary) => {
    if (
      summary.courierId === UNKNOWN_COURIER ||
      summary.hubCode === UNKNOWN_HUB ||
      summary.creatableRecords.length === 0
    ) {
      return;
    }

    setSuccessMessage(null);

    try {
      const batch = await createSettlementMutation.mutateAsync({
        reportDate: appliedFilters.reportDate,
        hubCode: summary.hubCode,
        courierId: summary.courierId,
        shipmentCodes: summary.creatableRecords.map((record) => record.shipmentCode),
        createdBy: session?.user.username ?? null,
      });

      setLocalBatchesByKey((current) => {
        const next = new Map(current);
        next.set(summary.key, batch);
        return next;
      });
      setSuccessMessage(`Đã tạo QR quyết toán ${batch.settlementCode}.`);
      setPendingQrSummary(null);
      void settlementQuery.refetch();
    } catch {
      // React Query exposes the mutation error for rendering below.
    }
  };

  const openConfirmModal = (batch: CodSettlementBatchDto) => {
    setConfirmNote('');
    setPendingConfirmBatch(batch);
    setSuccessMessage(null);
  };

  const confirmSettlement = async () => {
    if (!pendingConfirmBatch) {
      return;
    }

    setSuccessMessage(null);

    try {
      const updatedBatch = await confirmSettlementMutation.mutateAsync({
        settlementId: pendingConfirmBatch.id,
        payload: {
          confirmedBy: session?.user.username ?? 'OPS',
          note: [
            'Manual fallback confirmation from ops-web: SePay webhook not received or manual reconciliation required.',
            confirmNote.trim(),
          ].filter(Boolean).join(' '),
        },
      });
      const key = buildSummaryKey(updatedBatch.courierId, updatedBatch.hubCode);

      setLocalBatchesByKey((current) => {
        const next = new Map(current);
        next.set(key, updatedBatch);
        return next;
      });
      setSuccessMessage(`Đã xác nhận thủ công khoản tiền cho ${updatedBatch.settlementCode}.`);
      setPendingConfirmBatch(null);
      setConfirmNote('');
      await settlementQuery.refetch();
    } catch {
      // React Query exposes the mutation error for rendering below.
    }
  };

  return (
    <section className="ops-branch-cod">
      <header className="ops-branch-cod__header">
        <div>
          <small>BRANCH_FINANCE_COD_SETTLEMENT</small>
          <h2>Quyết toán thu hộ</h2>
          <p>Payment-service là nguồn trạng thái COD; QR chỉ là yêu cầu nộp tiền.</p>
        </div>
        <div className="ops-branch-cod__summary" aria-label="Tổng quan thu hộ">
          <article>
            <span>Tổng COD</span>
            <strong>{formatCurrency(codTotal)}</strong>
          </article>
          <article>
            <span>Tiền mặt courier thu</span>
            <strong>{formatCurrency(cashCollectedTotal)}</strong>
          </article>
          <article>
            <span>Khách chuyển khoản công ty</span>
            <strong>{formatCurrency(bankTransferTotal)}</strong>
          </article>
          <article>
            <span>Đã vào công ty</span>
            <strong>{formatCurrency(companyReceivedTotal)}</strong>
          </article>
          <article>
            <span>Tiền mặt chưa nộp</span>
            <strong>{formatCurrency(pendingCashRemitTotal)}</strong>
          </article>
          <article>
            <span>Chờ ngân hàng xác nhận</span>
            <strong>{formatCurrency(waitingBankConfirmTotal)}</strong>
          </article>
        </div>
      </header>

      <form className="ops-branch-cod__filters" onSubmit={submitSearch}>
        <label>
          <span>Ngày quyết toán</span>
          <input
            type="date"
            value={draftFilters.reportDate}
            onChange={(event) => updateDraftFilter('reportDate', event.target.value)}
          />
        </label>
        <label>
          <span>Bưu cục</span>
          <select
            value={draftFilters.hubCode}
            onChange={(event) => updateDraftFilter('hubCode', event.target.value)}
            disabled={!canViewAllHubAreas && hubOptions.length <= 1}
          >
            {canViewAllHubAreas ? <option value="all">Tất cả bưu cục</option> : null}
            {hubOptions.map((hub) => (
              <option key={hub.code} value={hub.code}>
                {hub.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Courier</span>
          <select
            value={draftFilters.courierId}
            onChange={(event) => updateDraftFilter('courierId', event.target.value)}
          >
            <option value="all">Tất cả courier</option>
            {courierOptions.map((courierId) => (
              <option key={courierId} value={courierId}>
                {courierId}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Đang tải...' : 'Tìm kiếm'}
        </button>
      </form>

      <p className="ops-branch-cod__contract">
        Tạo QR settlement chỉ áp dụng cho COD tiền mặt courier đã thu. SePay webhook là nguồn xác
        nhận chính khi tiền vào tài khoản công ty; xác nhận thủ công chỉ dùng làm fallback đối soát.
      </p>

      {successMessage ? <p className="ops-branch-cod__notice ops-branch-cod__notice--success">{successMessage}</p> : null}
      {mutationError ? (
        <p className="ops-branch-cod__notice ops-branch-cod__notice--danger">
          {getErrorMessage(mutationError)}
        </p>
      ) : null}
      {settlementQuery.isError ? (
        <p className="ops-branch-cod__notice ops-branch-cod__notice--warning">
          Chưa lấy được dữ liệu payment. Preview từ vận đơn/task chỉ để tham khảo vận hành,
          không phải dữ liệu quyết toán thật và không được dùng để xác nhận dòng tiền.
        </p>
      ) : null}
      {!settlementQuery.isError && isUsingPreviewData && previewRecords.length > 0 ? (
        <p className="ops-branch-cod__notice ops-branch-cod__notice--warning">
          Payment chưa có bản ghi COD cho bộ lọc này. Preview từ vận đơn đã giao không thay thế
          daily settlement của payment-service.
        </p>
      ) : null}

      <section className="ops-branch-cod__table-card">
        <div className="ops-branch-cod__table-title">
          <h3>Courier tiền mặt</h3>
          <span>{courierSummaries.length} courier</span>
        </div>

        {isLoading ? <p className="ops-branch-cod__empty">Đang tải dữ liệu thu hộ...</p> : null}
        {settlementQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(settlementQuery.error)}</p>
        ) : null}
        {shipmentsQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(shipmentsQuery.error)}</p>
        ) : null}
        {deliveryTasksQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(deliveryTasksQuery.error)}</p>
        ) : null}
        {hubsQuery.isError ? (
          <p className="ops-branch-cod__empty">{getErrorMessage(hubsQuery.error)}</p>
        ) : null}
        {hasScopeWarning ? (
          <p className="ops-branch-cod__empty">
            Tài khoản OPS chưa được gán hub nên chưa thể xác định phạm vi bưu cục.
          </p>
        ) : null}
        {!isLoading && courierSummaries.length === 0 ? (
          <p className="ops-branch-cod__empty">
            Không có COD tiền mặt phù hợp bộ lọc hiện tại.
          </p>
        ) : null}

        <div className="ops-branch-cod__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Courier</th>
                <th>Bưu cục</th>
                <th>Đơn COD tiền mặt</th>
                <th>Tổng tiền mặt</th>
                <th>Đã nộp</th>
                <th>Chưa nộp</th>
                <th>Trạng thái settlement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courierSummaries.map((summary) => {
                const batch = summary.waitingBatch ?? summary.latestBatch;
                const canCreateQr =
                  summary.pendingRemitTotal > 0 &&
                  summary.creatableRecords.length > 0 &&
                  !summary.waitingBatch &&
                  !isUsingPreviewData &&
                  summary.courierId !== UNKNOWN_COURIER &&
                  summary.hubCode !== UNKNOWN_HUB;
                const canConfirmBatch = Boolean(batch && batch.status === 'WAITING_PAYMENT');

                return (
                  <tr key={summary.key}>
                    <td className="ops-branch-cod__courier">{summary.courierId}</td>
                    <td>{summary.hubCode}</td>
                    <td>{summary.codOrders}</td>
                    <td className="ops-branch-cod__money">{formatCurrency(summary.codTotal)}</td>
                    <td className="ops-branch-cod__money">{formatCurrency(summary.remittedTotal)}</td>
                    <td className="ops-branch-cod__money">{formatCurrency(summary.pendingRemitTotal)}</td>
                    <td>
                      {batch ? (
                        <div className="ops-branch-cod__batch-cell">
                          <strong>{batch.settlementCode}</strong>
                          <span className={`ops-branch-cod__status ops-branch-cod__status--${getStatusTone(batch.status)}`}>
                            {getBatchStatusLabel(batch.status)}
                          </span>
                        </div>
                      ) : isUsingPreviewData ? (
                        <span className="ops-branch-cod__status ops-branch-cod__status--muted">
                          Preview từ vận đơn
                        </span>
                      ) : (
                        <span className="ops-branch-cod__muted">Chưa tạo batch</span>
                      )}
                    </td>
                    <td>
                      <div className="ops-branch-cod__actions">
                        <button
                          type="button"
                          onClick={() => setPendingQrSummary(summary)}
                          disabled={!canCreateQr || createSettlementMutation.isPending}
                        >
                          Tạo QR
                        </button>
                        <button
                          className="ops-branch-cod__secondary-button"
                          disabled={!batch?.qrUrl}
                          onClick={() => batch && setViewQrBatch(batch)}
                          type="button"
                        >
                          Xem QR
                        </button>
                        <button
                          className="ops-branch-cod__secondary-button"
                          disabled={!canConfirmBatch || confirmSettlementMutation.isPending}
                          onClick={() => batch && openConfirmModal(batch)}
                          type="button"
                        >
                          Xác nhận thủ công
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-branch-cod__table-card">
        <div className="ops-branch-cod__table-title">
          <h3>Chuyển khoản theo đơn</h3>
          <span>{bankTransferRecords.length} vận đơn</span>
        </div>

        {isUsingPreviewData ? (
          <p className="ops-branch-cod__empty">
            Preview không có dữ liệu ngân hàng. Chỉ payment-service mới xác nhận được chuyển khoản theo đơn.
          </p>
        ) : null}
        {!isUsingPreviewData && bankTransferRecords.length === 0 ? (
          <p className="ops-branch-cod__empty">
            Không có COD chuyển khoản theo đơn phù hợp bộ lọc hiện tại.
          </p>
        ) : null}

        <div className="ops-branch-cod__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Courier</th>
                <th>Số tiền</th>
                <th>Memo</th>
                <th>Trạng thái ngân hàng</th>
                <th>Mã giao dịch SePay</th>
                <th>Thời điểm nhận tiền</th>
              </tr>
            </thead>
            <tbody>
              {bankTransferRecords.map((record) => (
                <tr key={record.shipmentCode}>
                  <td>
                    {record.shipment ? (
                      <CopyableShipmentCode
                        code={record.shipmentCode}
                        className="ops-branch-cod__code"
                      />
                    ) : (
                      <span className="ops-branch-cod__code">{record.shipmentCode}</span>
                    )}
                  </td>
                  <td>{record.courierId}</td>
                  <td className="ops-branch-cod__money">{formatCurrency(getCollectedAmount(record))}</td>
                  <td className="ops-branch-cod__memo">COD {record.shipmentCode}</td>
                  <td>
                    <span className={`ops-branch-cod__status ops-branch-cod__status--${getBankTransferStatusTone(record)}`}>
                      {getBankTransferStatusLabel(record)}
                    </span>
                  </td>
                  <td>{record.companyReceivedRef ?? '-'}</td>
                  <td>{record.companyReceivedAt ? formatDateTime(record.companyReceivedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pendingQrSummary ? (
        <div className="ops-branch-cod__modal-backdrop" role="presentation">
          <section
            aria-labelledby="cod-create-qr-title"
            aria-modal="true"
            className="ops-branch-cod__modal"
            role="dialog"
          >
            <header>
              <div>
                <span>Tạo QR quyết toán</span>
                <h3 id="cod-create-qr-title">{pendingQrSummary.courierId}</h3>
              </div>
              <button
                aria-label="Đóng"
                className="ops-branch-cod__modal-close"
                onClick={() => setPendingQrSummary(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <dl>
              <div>
                <dt>Bưu cục</dt>
                <dd>{pendingQrSummary.hubCode}</dd>
              </div>
              <div>
                <dt>Số vận đơn</dt>
                <dd>{pendingQrSummary.creatableRecords.length}</dd>
              </div>
              <div>
                <dt>Tiền mặt chưa nộp</dt>
                <dd>{formatCurrency(pendingQrSummary.pendingRemitTotal)}</dd>
              </div>
              <div>
                <dt>Ngày quyết toán</dt>
                <dd>{appliedFilters.reportDate}</dd>
              </div>
            </dl>
            <p>
              QR chỉ bao gồm COD tiền mặt courier đã thu. Hệ thống không tự đánh dấu đã nộp
              sau khi tạo QR; SePay webhook hoặc đối soát thủ công mới xác nhận tiền vào công ty.
            </p>
            <footer>
              <button
                className="ops-branch-cod__secondary-button"
                onClick={() => setPendingQrSummary(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                disabled={createSettlementMutation.isPending}
                onClick={() => void createSettlement(pendingQrSummary)}
                type="button"
              >
                {createSettlementMutation.isPending ? 'Đang tạo...' : 'Xác nhận tạo QR'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {pendingConfirmBatch ? (
        <div className="ops-branch-cod__modal-backdrop" role="presentation">
          <section
            aria-labelledby="cod-confirm-title"
            aria-modal="true"
            className="ops-branch-cod__modal"
            role="dialog"
          >
            <header>
              <div>
                <span>Fallback đối soát thủ công</span>
                <h3 id="cod-confirm-title">{pendingConfirmBatch.settlementCode}</h3>
              </div>
              <button
                aria-label="Đóng"
                className="ops-branch-cod__modal-close"
                onClick={() => setPendingConfirmBatch(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <dl>
              <div>
                <dt>Courier</dt>
                <dd>{pendingConfirmBatch.courierId}</dd>
              </div>
              <div>
                <dt>Số tiền</dt>
                <dd>{formatCurrency(pendingConfirmBatch.totalAmount)}</dd>
              </div>
              <div>
                <dt>Nội dung CK</dt>
                <dd>{pendingConfirmBatch.transferMemo}</dd>
              </div>
              <div>
                <dt>Bưu cục</dt>
                <dd>{pendingConfirmBatch.hubCode}</dd>
              </div>
            </dl>
            <label className="ops-branch-cod__modal-note">
              <span>Ghi chú đối soát</span>
              <textarea
                onChange={(event) => setConfirmNote(event.target.value)}
                placeholder="Ví dụ: đã đối soát sao kê, webhook SePay chưa về"
                value={confirmNote}
              />
            </label>
            <p>
              SePay webhook sẽ tự xác nhận batch khi giao dịch khớp. Chỉ dùng nút này khi webhook
              chưa về hoặc kế toán đã đối soát thủ công trên sao kê; ghi chú sẽ được gửi vào audit
              note của payment-service.
            </p>
            <footer>
              <button
                className="ops-branch-cod__secondary-button"
                onClick={() => setPendingConfirmBatch(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                disabled={confirmSettlementMutation.isPending}
                onClick={() => void confirmSettlement()}
                type="button"
              >
                {confirmSettlementMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận thủ công'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {viewQrBatch ? (
        <div className="ops-branch-cod__modal-backdrop" role="presentation">
          <section
            aria-labelledby="cod-view-qr-title"
            aria-modal="true"
            className="ops-branch-cod__modal"
            role="dialog"
          >
            <header>
              <div>
                <span>QR nộp tiền mặt</span>
                <h3 id="cod-view-qr-title">{viewQrBatch.settlementCode}</h3>
              </div>
              <button
                aria-label="Đóng"
                className="ops-branch-cod__modal-close"
                onClick={() => setViewQrBatch(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="ops-branch-cod__qr-modal-body">
              {viewQrBatch.qrUrl ? (
                <img src={viewQrBatch.qrUrl} alt={`QR quyết toán ${viewQrBatch.settlementCode}`} />
              ) : null}
              <dl>
                <div>
                  <dt>Số tiền</dt>
                  <dd>{formatCurrency(viewQrBatch.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Nội dung CK</dt>
                  <dd>{viewQrBatch.transferMemo}</dd>
                </div>
                <div>
                  <dt>Courier</dt>
                  <dd>{viewQrBatch.courierId}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{getBatchStatusLabel(viewQrBatch.status)}</dd>
                </div>
              </dl>
            </div>
            <p>
              QR này chỉ dành cho khoản tiền mặt courier đã thu. SePay webhook sẽ tự xác nhận
              khi giao dịch khớp settlement code và số tiền.
            </p>
          </section>
        </div>
      ) : null}

      {courierSummaries
        .map((summary) => summary.waitingBatch ?? summary.latestBatch)
        .filter((batch): batch is CodSettlementBatchDto => Boolean(batch))
        .map((batch) => (
          <section className="ops-branch-cod__qr-card" key={batch.id}>
            <div>
              <span className={`ops-branch-cod__status ops-branch-cod__status--${getStatusTone(batch.status)}`}>
                {getBatchStatusLabel(batch.status)}
              </span>
              <h3>{batch.settlementCode}</h3>
              <p>
                {batch.courierId} - {batch.hubCode} - {formatCurrency(batch.totalAmount)}
              </p>
              <dl>
                <div>
                  <dt>Mã settlement</dt>
                  <dd>{batch.settlementCode}</dd>
                </div>
                <div>
                  <dt>Số tiền</dt>
                  <dd>{formatCurrency(batch.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Nội dung CK</dt>
                  <dd>{batch.transferMemo}</dd>
                </div>
                <div>
                  <dt>Số vận đơn</dt>
                  <dd>{batch.items.length}</dd>
                </div>
              </dl>
            </div>
            {batch.qrUrl ? <img src={batch.qrUrl} alt={`QR quyết toán ${batch.settlementCode}`} /> : null}
          </section>
        ))}

      <section className="ops-branch-cod__table-card">
        <div className="ops-branch-cod__table-title">
          <h3>Chi tiết COD trong ngày</h3>
          <span>{enrichedRecords.length} vận đơn</span>
        </div>
        <div className="ops-branch-cod__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Thời gian thu</th>
                <th>Courier</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Bưu cục</th>
                <th>COD</th>
                <th>Đã thu</th>
                <th>Trạng thái tiền</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDetailRows.map((row) => (
                <tr key={row.shipmentCode}>
                  <td>
                    {row.shipment ? (
                      <CopyableShipmentCode
                        code={row.shipmentCode}
                        className="ops-branch-cod__code"
                      />
                    ) : (
                      <span className="ops-branch-cod__code">{row.shipmentCode}</span>
                    )}
                  </td>
                  <td>{row.collectedAt ? formatDateTime(row.collectedAt) : '-'}</td>
                  <td>{row.courierId}</td>
                  <td>{row.receiverName}</td>
                  <td>{row.receiverPhone}</td>
                  <td>{row.hubCode}</td>
                  <td className="ops-branch-cod__money">{formatCurrency(row.codAmount)}</td>
                  <td className="ops-branch-cod__money">{formatCurrency(getCollectedAmount(row))}</td>
                  <td>
                    <span className={`ops-branch-cod__status ops-branch-cod__status--${getStatusTone(row.status)}`}>
                      {row.source === 'preview' ? 'Preview từ vận đơn' : getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BranchTablePagination
          totalRows={enrichedRecords.length}
          page={currentDetailPage}
          pageSize={detailPageSize}
          onPageChange={setDetailPage}
          onPageSizeChange={setDetailPageSize}
        />
      </section>
    </section>
  );
}
