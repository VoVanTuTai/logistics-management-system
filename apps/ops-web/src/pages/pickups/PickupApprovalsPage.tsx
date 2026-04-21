import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { pickupsClient, usePickupRequestsQuery } from '../../features/pickups/pickups.api';
import type { PickupRequestListFilters } from '../../features/pickups/pickups.types';
import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatPickupStatusLabel } from '../../utils/logisticsLabels';
import { queryKeys } from '../../utils/queryKeys';
import { PickupRequestsTable, type PickupApprovalRow } from './PickupRequestsTable';

function normalizeCode(value: string | null): string {
  if (!value) {
    return '';
  }

  return value.trim().toUpperCase();
}

interface BulkApproveResult {
  successIds: string[];
  failed: Array<{ pickupId: string; message: string }>;
}

const PICKUP_STATUS_OPTIONS = ['REQUESTED', 'APPROVED', 'CANCELLED', 'COMPLETED'] as const;
const PICKUP_STATUS_SET = new Set<string>(PICKUP_STATUS_OPTIONS);

export function PickupApprovalsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const rawStatusFilter = searchParams.get('status') ?? '';
  const statusFilter = PICKUP_STATUS_SET.has(rawStatusFilter) ? rawStatusFilter : '';
  const filters: PickupRequestListFilters = {
    status: statusFilter || undefined,
  };
  const [statusInput, setStatusInput] = useState(statusFilter);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pickupsQuery = usePickupRequestsQuery(accessToken, filters);
  const shipmentsQuery = useShipmentsQuery(accessToken, {});

  const bulkApproveMutation = useMutation({
    mutationFn: async (pickupIds: string[]): Promise<BulkApproveResult> => {
      if (!accessToken) {
        throw new Error('Thiếu access token.');
      }

      const settled = await Promise.allSettled(
        pickupIds.map((pickupId) =>
          pickupsClient.approve(accessToken, pickupId, {
            note: null,
          }),
        ),
      );

      const successIds: string[] = [];
      const failed: Array<{ pickupId: string; message: string }> = [];

      settled.forEach((result, index) => {
        const pickupId = pickupIds[index];

        if (result.status === 'fulfilled') {
          successIds.push(pickupId);
          return;
        }

        failed.push({
          pickupId,
          message: getErrorMessage(result.reason),
        });
      });

      return {
        successIds,
        failed,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });

  useEffect(() => {
    setStatusInput(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    const hasLegacyShipmentStatus = searchParams.has('shipmentStatus');
    const hasInvalidStatus = Boolean(rawStatusFilter) && !statusFilter;

    if (!hasLegacyShipmentStatus && !hasInvalidStatus) {
      return;
    }

    const next = new URLSearchParams();
    if (statusFilter) {
      next.set('status', statusFilter);
    }
    setSearchParams(next, { replace: true });
  }, [rawStatusFilter, searchParams, setSearchParams, statusFilter]);

  const shipmentByCode = useMemo(() => {
    const map = new Map<string, (typeof shipmentsQuery.data)[number]>();

    for (const shipment of shipmentsQuery.data ?? []) {
      map.set(normalizeCode(shipment.shipmentCode), shipment);
    }

    return map;
  }, [shipmentsQuery.data]);

  const rows = useMemo<PickupApprovalRow[]>(() => {
    return (pickupsQuery.data ?? []).map((pickup) => {
      const shipment = shipmentByCode.get(normalizeCode(pickup.shipmentCode));

      return {
        pickupId: pickup.id,
        shipmentCode: pickup.shipmentCode,
        status: pickup.status,
        senderName: shipment?.senderName ?? null,
        receiverName: shipment?.receiverName ?? null,
        receiverPhone: shipment?.receiverPhone ?? shipment?.senderPhone ?? null,
        itemType: shipment?.parcelType ?? shipment?.serviceType ?? null,
        codAmount: shipment?.codAmount ?? null,
        shippingFee: shipment?.shippingFee ?? null,
        selectable: pickup.status.trim().toUpperCase() === 'REQUESTED',
      };
    });
  }, [pickupsQuery.data, shipmentByCode]);

  const selectableIds = useMemo(
    () => rows.filter((row) => row.selectable).map((row) => row.pickupId),
    [rows],
  );

  useEffect(() => {
    const activeIds = new Set(rows.map((row) => row.pickupId));
    setSelectedIds((current) => current.filter((pickupId) => activeIds.has(pickupId)));
  }, [rows]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = String(formData.get('status') ?? '').trim();
    const next = new URLSearchParams();

    if (PICKUP_STATUS_SET.has(status)) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
    setSelectedIds([]);
  };

  const onResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setStatusInput('');
    setSelectedIds([]);
  };

  const onToggleRow = (pickupId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        if (current.includes(pickupId)) {
          return current;
        }

        return [...current, pickupId];
      }

      return current.filter((id) => id !== pickupId);
    });
  };

  const onToggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(selectableIds);
  };

  const onApproveSelected = async () => {
    if (selectedIds.length === 0 || bulkApproveMutation.isPending) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    const confirmed = window.confirm(`Xác nhận duyệt ${selectedIds.length} yêu cầu lấy hàng đã chọn?`);
    if (!confirmed) {
      return;
    }

    try {
      const result = await bulkApproveMutation.mutateAsync(selectedIds);

      if (result.successIds.length > 0) {
        setActionMessage(`Da duyệt thành công ${result.successIds.length} yêu cầu.`);
      }

      if (result.failed.length > 0) {
        setActionError(
          `Thất bại ${result.failed.length} yêu cầu. Ví dụ: ${result.failed[0].message}`,
        );
      }

      setSelectedIds((current) =>
        current.filter((pickupId) => !result.successIds.includes(pickupId)),
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Duyệt lấy hàng</h2>
      <p style={{ color: '#2d3f99' }}>
        Bo cot ma yêu cầu. Chon nhieu don cho duyệt de duyệt 1 lan.
      </p>
      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <select
          name="status"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.input}
        >
          <option value="">Tat ca trạng thái lấy hàng</option>
          {PICKUP_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatPickupStatusLabel(option)}
            </option>
          ))}
        </select>
        <button type="submit">Ap dung</button>
        <button type="button" onClick={onResetFilters}>
          Dat lai
        </button>
      </form>

      <div style={styles.bulkActions}>
        <button
          type="button"
          onClick={() => void onApproveSelected()}
          disabled={selectedIds.length === 0 || bulkApproveMutation.isPending}
        >
          {bulkApproveMutation.isPending
            ? 'Đang duyệt...'
            : `Duyệt đã chọn (${selectedIds.length})`}
        </button>
        <small style={styles.hintText}>
          Chi dong co trạng thái {formatPickupStatusLabel('REQUESTED')} moi co the tick chon.
        </small>
      </div>

      {actionMessage ? <p style={styles.successText}>{actionMessage}</p> : null}
      {actionError ? <p style={styles.errorText}>{actionError}</p> : null}

      {pickupsQuery.isLoading ? <p>Đang tải yêu cầu lấy hàng...</p> : null}
      {pickupsQuery.isError ? <p style={styles.errorText}>{getErrorMessage(pickupsQuery.error)}</p> : null}
      {shipmentsQuery.isLoading ? <p>Đang tải thong tin vận đơn...</p> : null}
      {shipmentsQuery.isError ? (
        <p style={styles.errorText}>Khong the tai thong tin vận đơn: {getErrorMessage(shipmentsQuery.error)}</p>
      ) : null}

      {pickupsQuery.isSuccess && (pickupsQuery.data?.length ?? 0) === 0 ? (
        <p>Không có yêu cầu lấy hàng phù hợp bộ lọc hiện tại.</p>
      ) : null}

      {pickupsQuery.isSuccess && (pickupsQuery.data?.length ?? 0) > 0 ? (
        <PickupRequestsTable
          items={rows}
          selectedIds={selectedIds}
          onToggleRow={onToggleRow}
          onToggleAll={onToggleAll}
        />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  filterForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 240,
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  hintText: {
    color: '#4b5ea7',
  },
  successText: {
    color: '#15803d',
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 8,
    marginBottom: 8,
  },
};


