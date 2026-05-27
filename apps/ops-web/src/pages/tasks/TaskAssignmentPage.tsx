import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import {
  useCourierOptionsQuery,
  useDispatchTasksRealtime,
  useTasksQuery,
} from '../../features/tasks/tasks.api';
import type { TaskListFilters, TaskListItemDto } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { deriveHubScopeTokens, isShipmentInScope } from '../../utils/locationScope';
import { queryKeys } from '../../utils/queryKeys';
import { TasksTable } from './TasksTable';

function canTransferTask(task: TaskListItemDto): boolean {
  return task.status === 'ASSIGNED' && Boolean(task.assignedCourierId);
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

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function formatRealtimeStatus(status: string): string {
  if (status === 'connected') {
    return 'Đang nhận realtime';
  }

  if (status === 'connecting') {
    return 'Đang kết nối realtime';
  }

  if (status === 'reconnecting') {
    return 'Đang nối lại realtime';
  }

  if (status === 'disconnected') {
    return 'Realtime mất kết nối';
  }

  return 'Realtime chưa bật';
}

interface PendingTransferRequest {
  id: string;
  taskId: string;
  shipmentCode: string;
  fromCourierId: string;
  toCourierId: string;
  reason: string;
  requestedAt: string;
}

export function TaskAssignmentPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentUserRoles = session?.user.roles ?? [];
  const assignedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = currentUserRoles.includes('SYSTEM_ADMIN');
  const today = useMemo(() => toDateInputValue(new Date()), []);

  const filters: TaskListFilters = {
    taskType: searchParams.get('taskType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const defaultDeliveryArea = searchParams.get('deliveryArea') ?? '';
  const defaultCourierFilter = searchParams.get('courierId') ?? '';
  const defaultShipmentCode = searchParams.get('shipmentCode') ?? '';
  const rawDateFilter = searchParams.get('date') ?? '';
  const selectedDate = isValidDateInput(rawDateFilter) ? rawDateFilter : today;

  const [taskTypeInput, setTaskTypeInput] = useState(filters.taskType ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [deliveryAreaInput, setDeliveryAreaInput] = useState(defaultDeliveryArea);
  const [courierFilterInput, setCourierFilterInput] = useState(defaultCourierFilter);
  const [shipmentCodeInput, setShipmentCodeInput] = useState(defaultShipmentCode);
  const [dateInput, setDateInput] = useState(selectedDate);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [targetCourierId, setTargetCourierId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [courierSearchText, setCourierSearchText] = useState('');
  const [transferReason, setTransferReason] = useState('Điều chuyển vận hành - lý do bổ sung sau');
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferRequest[]>([]);

  const realtimeStatus = useDispatchTasksRealtime(Boolean(accessToken));
  const realtimeFallbackPollingEnabled =
    Boolean(accessToken) && realtimeStatus !== 'connected';
  const tasksQuery = useTasksQuery(accessToken, filters, {
    refetchInterval: realtimeFallbackPollingEnabled ? 10000 : false,
  });
  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const hubsQuery = useHubsQuery(accessToken, {});
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);
  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const scopedShipments = useMemo(() => {
    if (canViewAllHubAreas) {
      return shipmentsQuery.data ?? [];
    }

    if (assignedHubCodes.length === 0) {
      return [];
    }

    return (shipmentsQuery.data ?? []).filter((shipment) =>
      isShipmentInScope(shipment, hubScopeTokens),
    );
  }, [
    assignedHubCodes.length,
    canViewAllHubAreas,
    hubScopeTokens,
    shipmentsQuery.data,
  ]);

  useEffect(() => {
    setTaskTypeInput(filters.taskType ?? '');
    setStatusInput(filters.status ?? '');
    setDeliveryAreaInput(defaultDeliveryArea);
    setCourierFilterInput(defaultCourierFilter);
    setShipmentCodeInput(defaultShipmentCode);
    setDateInput(selectedDate);
  }, [
    defaultCourierFilter,
    defaultDeliveryArea,
    defaultShipmentCode,
    filters.status,
    filters.taskType,
    selectedDate,
  ]);

  useEffect(() => {
    if (targetCourierId || !courierOptionsQuery.data?.length) {
      return;
    }

    setTargetCourierId(courierOptionsQuery.data[0].courierId);
  }, [targetCourierId, courierOptionsQuery.data]);

  useEffect(() => {
    if (!transferMessage && !transferError) {
      return;
    }

    const clearTimeoutId = window.setTimeout(() => {
      setTransferMessage(null);
      setTransferError(null);
    }, 5000);

    return () => {
      window.clearTimeout(clearTimeoutId);
    };
  }, [transferError, transferMessage]);

  const allShipmentLookupByCode = useMemo(() => {
    const map = new Map<
      string,
      {
        deliveryArea: string | null;
        senderName: string | null;
        receiverName: string | null;
        platform: string | null;
      }
    >();

    for (const shipment of shipmentsQuery.data ?? []) {
      const shipmentCode = normalizeCode(shipment.shipmentCode);
      if (!shipmentCode) {
        continue;
      }

      map.set(shipmentCode, {
        deliveryArea: shipment.receiverRegion ?? null,
        senderName: shipment.senderName ?? null,
        receiverName: shipment.receiverName ?? null,
        platform: shipment.platform ?? null,
      });
    }

    return map;
  }, [shipmentsQuery.data]);

  const scopedShipmentCodeSet = useMemo(() => {
    return new Set(
      scopedShipments
        .map((shipment) => normalizeCode(shipment.shipmentCode))
        .filter((code) => code.length > 0),
    );
  }, [scopedShipments]);

  const tasksWithArea = useMemo(() => {
    return (tasksQuery.data ?? []).map((task) => {
      const shipmentCode = normalizeCode(task.shipmentCode);
      const shipmentLookup = shipmentCode
        ? allShipmentLookupByCode.get(shipmentCode) ?? null
        : null;

      return {
        ...task,
        deliveryArea: shipmentLookup?.deliveryArea ?? null,
        senderName: shipmentLookup?.senderName ?? null,
        receiverName: shipmentLookup?.receiverName ?? null,
        platform: shipmentLookup?.platform ?? null,
        isSelectable: canTransferTask(task),
      } satisfies TaskListItemDto;
    });
  }, [allShipmentLookupByCode, tasksQuery.data]);

  const areaOptions = useMemo(() => {
    const sourceTasks = canViewAllHubAreas
      ? tasksWithArea
      : tasksWithArea.filter((task) =>
          task.shipmentCode ? scopedShipmentCodeSet.has(normalizeCode(task.shipmentCode)) : false,
        );

    return Array.from(
      new Set(
        sourceTasks
          .map((task) => task.deliveryArea?.trim() ?? '')
          .filter((area) => area.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [
    canViewAllHubAreas,
    scopedShipmentCodeSet,
    tasksWithArea,
  ]);

  const scopedTasks = useMemo(() => {
    if (canViewAllHubAreas) {
      return tasksWithArea;
    }

    if (assignedHubCodes.length === 0) {
      return [];
    }

    // Fallback: vẫn giữ task PICKUP mới dù shipment chưa đủ metadata khu vực,
    // để Ops luôn nhìn thấy đơn vừa duyệt trong luồng chuyển đơn.
    return tasksWithArea.filter((task) => {
      if (task.shipmentCode && scopedShipmentCodeSet.has(normalizeCode(task.shipmentCode))) {
        return true;
      }

      return task.taskType === 'PICKUP';
    });
  }, [
    assignedHubCodes.length,
    canViewAllHubAreas,
    scopedShipmentCodeSet,
    tasksWithArea,
  ]);

  const filteredTasks = useMemo(() => {
    const normalizedDeliveryArea = deliveryAreaInput.trim().toLowerCase();
    const normalizedCourierFilter = normalizeCode(courierFilterInput);
    const normalizedShipmentCode = normalizeCode(shipmentCodeInput);

    const result = scopedTasks.filter((task) => {
      const areaMatched =
        !normalizedDeliveryArea ||
        task.deliveryArea?.toLowerCase() === normalizedDeliveryArea;
      const dateMatched = toDateKey(task.updatedAt) === selectedDate;
      const courierMatched =
        !normalizedCourierFilter ||
        normalizeCode(task.assignedCourierId) === normalizedCourierFilter;
      const shipmentMatched =
        !normalizedShipmentCode ||
        normalizeCode(task.shipmentCode).includes(normalizedShipmentCode);

      return areaMatched && dateMatched && courierMatched && shipmentMatched;
    });

    return result.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }, [courierFilterInput, deliveryAreaInput, scopedTasks, selectedDate, shipmentCodeInput]);

  const selectableTaskIds = useMemo(
    () => filteredTasks.filter((task) => task.isSelectable).map((task) => task.id),
    [filteredTasks],
  );

  const allSelectableSelected =
    selectableTaskIds.length > 0 &&
    selectableTaskIds.every((id) => selectedTaskIds.includes(id));

  useEffect(() => {
    const visibleTaskIdSet = new Set(filteredTasks.map((task) => task.id));

    setSelectedTaskIds((previous) =>
      previous.filter((taskId) => visibleTaskIdSet.has(taskId)),
    );
  }, [filteredTasks]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const taskType = String(formData.get('taskType') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const deliveryArea = String(formData.get('deliveryArea') ?? '').trim();
    const courierId = String(formData.get('courierId') ?? '').trim();
    const shipmentCode = normalizeCode(String(formData.get('shipmentCode') ?? ''));
    const date = String(formData.get('date') ?? '').trim();
    const normalizedDate = isValidDateInput(date) ? date : today;
    const next = new URLSearchParams();

    next.set('date', normalizedDate);

    if (taskType) {
      next.set('taskType', taskType);
    }

    if (status) {
      next.set('status', status);
    }

    if (deliveryArea) {
      next.set('deliveryArea', deliveryArea);
    }

    if (courierId) {
      next.set('courierId', courierId);
    }

    if (shipmentCode) {
      next.set('shipmentCode', shipmentCode);
    }

    setSearchParams(next, { replace: true });
    setSelectedTaskIds([]);
    setTransferMessage(null);
    setTransferError(null);
  };

  const onResetFilters = () => {
    const next = new URLSearchParams();
    next.set('date', today);
    setSearchParams(next, { replace: true });
    setTaskTypeInput('');
    setStatusInput('');
    setDeliveryAreaInput('');
    setCourierFilterInput('');
    setShipmentCodeInput('');
    setDateInput(today);
    setSelectedTaskIds([]);
    setTransferMessage(null);
    setTransferError(null);
  };

  const onToggleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((previous) => {
      if (checked) {
        return previous.includes(taskId) ? previous : [...previous, taskId];
      }

      return previous.filter((id) => id !== taskId);
    });
  };

  const onToggleSelectAll = (checked: boolean) => {
    setSelectedTaskIds((previous) => {
      if (checked) {
        return Array.from(new Set([...previous, ...selectableTaskIds]));
      }

      const selectableSet = new Set(selectableTaskIds);
      return previous.filter((id) => !selectableSet.has(id));
    });
  };

  const onCreateTransferRequest = async () => {
    if (!accessToken) {
      return;
    }

    const courierId = targetCourierId.trim();
    if (!courierId) {
      setTransferError('Vui lòng chọn courier nhận trước khi chuyển đơn.');
      return;
    }

    const selectedTasks = filteredTasks.filter((task) =>
      selectedTaskIds.includes(task.id),
    );
    if (selectedTasks.length === 0) {
      setTransferError('Vui lòng chọn ít nhất 1 đơn cần chuyển.');
      return;
    }

    const invalidTasks = selectedTasks.filter(
      (task) => !task.isSelectable || !task.assignedCourierId,
    );
    if (invalidTasks.length > 0) {
      setTransferError(
        'Chỉ đơn đang có courier phụ trách và trạng thái ASSIGNED mới được tạo yêu cầu chuyển.',
      );
      return;
    }

    const sameCourierTasks = selectedTasks.filter(
      (task) => normalizeCode(task.assignedCourierId) === normalizeCode(courierId),
    );
    if (sameCourierTasks.length > 0) {
      setTransferError('Courier nhận phải khác courier hiện tại của các đơn đã chọn.');
      return;
    }

    setTransferLoading(true);
    setTransferMessage(null);
    setTransferError(null);

    const requestedAt = new Date().toISOString();
    const reason = transferReason.trim() || 'Điều chuyển vận hành - lý do bổ sung sau';
    const requests = selectedTasks.map((task) => ({
      id: `${task.id}:${courierId}:${requestedAt}`,
      taskId: task.id,
      shipmentCode: task.shipmentCode ?? task.taskCode,
      fromCourierId: task.assignedCourierId as string,
      toCourierId: courierId,
      reason,
      requestedAt,
    }));

    setPendingTransfers((previous) => [...requests, ...previous].slice(0, 8));
    setSelectedTaskIds([]);
    setTransferMessage(
      `Đã tạo ${requests.length} yêu cầu chuyển đang chờ courier nhận xác nhận. Đơn vẫn nằm ở courier hiện tại cho đến khi có bước xác nhận trên app courier.`,
    );
    setTransferLoading(false);
  };

  const refreshTaskData = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.tasks, type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.shipments, type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.pickups, type: 'active' }),
    ]);
  };

  return (
    <div>
      <h2>Chuyển đơn</h2>
      <p style={styles.helperText}>
        Lọc đơn đang nằm trên app courier theo courier hiện tại, mã vận đơn, ngày và khu vực.
        Tạo yêu cầu chuyển sang courier nhận; đơn chỉ hoàn tất chuyển sau khi courier nhận xác nhận.
      </p>
      <div style={styles.realtimeRow}>
        <span style={styles.realtimeLabel}>Realtime</span>
        <strong
          style={realtimeStatus === 'connected' ? styles.realtimeOk : styles.realtimeWarn}
        >
          {formatRealtimeStatus(realtimeStatus)}
        </strong>
        {realtimeFallbackPollingEnabled ? (
          <span style={styles.realtimeFallback}>Polling dự phòng 10s</span>
        ) : null}
        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => void refreshTaskData()}
          disabled={tasksQuery.isFetching || shipmentsQuery.isFetching}
        >
          {tasksQuery.isFetching || shipmentsQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>
      {!canViewAllHubAreas ? (
        <div style={styles.scopeNotice}>
          <strong>Phạm vi hub:</strong>{' '}
          {assignedHubCodes.length > 0
            ? assignedHubCodes.join(', ')
            : 'Chưa được gán hub. Vui lòng liên hệ admin để cấp hub cho tài khoản OPS này.'}
        </div>
      ) : null}

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          type="date"
          name="date"
          value={dateInput}
          onChange={(event) => setDateInput(event.target.value)}
          style={styles.dateInput}
        />

        <input
          type="search"
          name="shipmentCode"
          value={shipmentCodeInput}
          onChange={(event) => setShipmentCodeInput(event.target.value.toUpperCase())}
          placeholder="Tìm mã vận đơn"
          aria-label="Tìm mã vận đơn"
          style={styles.searchInput}
        />

        <select
          name="courierId"
          value={courierFilterInput}
          onChange={(event) => setCourierFilterInput(event.target.value)}
          style={styles.select}
          disabled={courierOptionsQuery.isLoading}
        >
          <option value="">Tất cả courier hiện tại</option>
          {(courierOptionsQuery.data ?? []).map((courier) => (
            <option key={courier.courierId} value={courier.courierId}>
              {courier.label}
            </option>
          ))}
        </select>

        <select
          name="taskType"
          value={taskTypeInput}
          onChange={(event) => setTaskTypeInput(event.target.value)}
          style={styles.select}
        >
          <option value="">Tất cả loại tác vụ</option>
          <option value="PICKUP">PICKUP</option>
          <option value="DELIVERY">DELIVERY</option>
          <option value="RETURN">RETURN</option>
        </select>

        <select
          name="status"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.select}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="CREATED">CREATED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          name="deliveryArea"
          value={deliveryAreaInput}
          onChange={(event) => setDeliveryAreaInput(event.target.value)}
          style={styles.select}
        >
          <option value="">Tất cả khu vực giao</option>
          {areaOptions.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters}>
          Đặt lại
        </button>
      </form>

      <section style={styles.bulkPanel}>
        <div style={styles.bulkHeaderRow}>
          <strong>Tạo yêu cầu chuyển</strong>
          <small>Đã chọn: {selectedTaskIds.length}</small>
        </div>

        <div style={styles.bulkActionsRow}>
          <div style={styles.courierSearchWrap}>
            <input
              type="text"
              placeholder="Tìm courier nhận theo tên, mã..."
              value={courierSearchText}
              onChange={(event) => setCourierSearchText(event.target.value)}
              style={styles.courierSearchInput}
            />
            <select
              value={targetCourierId}
              onChange={(event) => setTargetCourierId(event.target.value)}
              style={styles.select}
              disabled={courierOptionsQuery.isLoading || transferLoading}
            >
              <option value="">Chọn courier nhận</option>
              {(courierOptionsQuery.data ?? []).filter((courier) => {
                if (!courierSearchText.trim()) return true;
                const search = courierSearchText.trim().toLowerCase();
                return courier.label.toLowerCase().includes(search);
              }).map((courier) => (
                <option key={courier.courierId} value={courier.courierId}>
                  {courier.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={transferReason}
            onChange={(event) => setTransferReason(event.target.value)}
            placeholder="Lý do chuyển"
            aria-label="Lý do chuyển"
            style={styles.reasonInput}
          />
          <button
            type="button"
            onClick={() => void onCreateTransferRequest()}
            disabled={transferLoading || selectedTaskIds.length === 0}
          >
            {transferLoading ? 'Đang tạo yêu cầu...' : 'Gửi yêu cầu chuyển'}
          </button>
        </div>

        <small style={styles.helperText}>
          Chỉ đơn có trạng thái ASSIGNED và đang có courier phụ trách mới được chọn. Với contract
          hiện tại, màn này giữ yêu cầu ở trạng thái chờ xác nhận để không chuyển tức thời khỏi
          courier cũ.
        </small>

        {transferMessage ? (
          <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
            {transferMessage}
          </div>
        ) : null}
        {transferError ? (
          <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
            {transferError}
          </div>
        ) : null}

        {pendingTransfers.length > 0 ? (
          <div style={styles.pendingPanel}>
            <strong>Yêu cầu đang chờ xác nhận</strong>
            <div style={styles.pendingList}>
              {pendingTransfers.map((request) => (
                <div key={request.id} style={styles.pendingItem}>
                  <span>{request.shipmentCode}</span>
                  <small>
                    {request.fromCourierId} sang {request.toCourierId}
                  </small>
                  <em>{request.reason}</em>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Hub destination warnings */}
        {selectedTaskIds.length > 0 && (() => {
          const wrongHubTasks = filteredTasks.filter((task) => {
            if (!selectedTaskIds.includes(task.id)) return false;
            if (task.taskType !== 'DELIVERY') return false;
            const shipmentCode = normalizeCode(task.shipmentCode);
            if (!shipmentCode) return false;
            const shipment = (shipmentsQuery.data ?? []).find(
              (s) => normalizeCode(s.shipmentCode) === shipmentCode,
            );
            if (!shipment) return false;
            // Check if shipment's destination hub matches operator's hub
            const destHub = normalizeCode(shipment.receiverHubCode ?? shipment.destinationHubCode ?? '');
            if (!destHub) return false;
            return !assignedHubCodes.some((h) => normalizeCode(h) === destHub);
          });
          if (wrongHubTasks.length === 0) return null;
          return (
            <div role="alert" style={{ ...styles.notice, ...styles.warningNotice }}>
              {wrongHubTasks.length} đơn giao chưa đến hub của bạn:
              {' '}{wrongHubTasks.slice(0, 5).map((t) => t.shipmentCode).join(', ')}
              {wrongHubTasks.length > 5 ? ` và ${wrongHubTasks.length - 5} đơn khác...` : ''}
            </div>
          );
        })()}
      </section>

      {tasksQuery.isLoading ? <p>Đang tải tác vụ...</p> : null}
      {tasksQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(tasksQuery.error)}</p>
      ) : null}
      {shipmentsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentsQuery.error)}</p>
      ) : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {courierOptionsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(courierOptionsQuery.error)}</p>
      ) : null}

      {tasksQuery.isSuccess && filteredTasks.length === 0 ? (
        <p>
          {assignedHubCodes.length === 0 && !canViewAllHubAreas
            ? 'Không hiển thị được tác vụ vì tài khoản OPS chưa được gán hub.'
            : 'Không có đơn phù hợp theo ngày và bộ lọc hiện tại.'}
        </p>
      ) : null}

      {tasksQuery.isSuccess && filteredTasks.length > 0 ? (
        <TasksTable
          items={filteredTasks}
          selectedTaskIds={selectedTaskIds}
          allSelectableSelected={allSelectableSelected}
          onToggleTaskSelection={onToggleTaskSelection}
          onToggleSelectAll={onToggleSelectAll}
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
    marginBottom: 12,
  },
  select: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 180,
  },
  dateInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 170,
  },
  searchInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 210,
    textTransform: 'uppercase',
  },
  helperText: {
    color: '#2d3f99',
  },
  realtimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  realtimeLabel: {
    color: '#334155',
    fontSize: 13,
  },
  realtimeOk: {
    color: '#166534',
    fontSize: 13,
  },
  realtimeWarn: {
    color: '#9a3412',
    fontSize: 13,
  },
  realtimeFallback: {
    border: '1px solid #fcd34d',
    borderRadius: 999,
    padding: '3px 8px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 12,
    fontWeight: 700,
  },
  refreshButton: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '6px 10px',
    backgroundColor: '#ffffff',
    color: '#0f4c81',
    fontSize: 13,
    fontWeight: 700,
  },
  scopeNotice: {
    marginTop: 10,
    marginBottom: 12,
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#f8faff',
    color: '#1f2b6f',
  },
  bulkPanel: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8faff',
  },
  bulkHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulkActionsRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  notice: {
    marginTop: 8,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid',
    fontWeight: 600,
    animation: 'ops-notice-in 0.22s ease-out',
  },
  successNotice: {
    borderColor: '#86efac',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  errorNotice: {
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 8,
  },
  courierSearchWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  courierSearchInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 260,
    fontSize: 13,
  },
  reasonInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 300,
    flex: '1 1 300px',
  },
  pendingPanel: {
    marginTop: 12,
    borderTop: '1px solid #d9def3',
    paddingTop: 12,
  },
  pendingList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 8,
    marginTop: 8,
  },
  pendingItem: {
    display: 'grid',
    gap: 4,
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    color: '#1f2b6f',
  },
  warningNotice: {
    borderColor: '#fcd34d',
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
};
