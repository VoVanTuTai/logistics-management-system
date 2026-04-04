import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import { tasksClient, useCourierOptionsQuery, useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListFilters, TaskListItemDto } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { deriveHubScopeTokens, isShipmentInScope } from '../../utils/locationScope';
import { queryKeys } from '../../utils/queryKeys';
import { TasksTable } from './TasksTable';

function canBulkAssignTask(task: TaskListItemDto): boolean {
  return task.status === 'CREATED' || task.status === 'ASSIGNED';
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
  const rawDateFilter = searchParams.get('date') ?? '';
  const selectedDate = isValidDateInput(rawDateFilter) ? rawDateFilter : today;

  const [taskTypeInput, setTaskTypeInput] = useState(filters.taskType ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [deliveryAreaInput, setDeliveryAreaInput] = useState(defaultDeliveryArea);
  const [dateInput, setDateInput] = useState(selectedDate);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkCourierId, setBulkCourierId] = useState('');
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignMessage, setBulkAssignMessage] = useState<string | null>(null);
  const [bulkAssignError, setBulkAssignError] = useState<string | null>(null);

  const tasksQuery = useTasksQuery(accessToken, filters);
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
    setDateInput(selectedDate);
  }, [defaultDeliveryArea, filters.status, filters.taskType, selectedDate]);

  useEffect(() => {
    if (bulkCourierId || !courierOptionsQuery.data?.length) {
      return;
    }

    setBulkCourierId(courierOptionsQuery.data[0].courierId);
  }, [bulkCourierId, courierOptionsQuery.data]);

  useEffect(() => {
    if (!bulkAssignMessage && !bulkAssignError) {
      return;
    }

    const clearTimeoutId = window.setTimeout(() => {
      setBulkAssignMessage(null);
      setBulkAssignError(null);
    }, 5000);

    return () => {
      window.clearTimeout(clearTimeoutId);
    };
  }, [bulkAssignError, bulkAssignMessage]);

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
        isSelectable: canBulkAssignTask(task),
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
    // để Ops luôn nhìn thấy đơn vừa duyệt và phân công kịp thời.
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

    const result = scopedTasks.filter((task) => {
      const areaMatched =
        !normalizedDeliveryArea ||
        task.deliveryArea?.toLowerCase() === normalizedDeliveryArea;
      const dateMatched = toDateKey(task.updatedAt) === selectedDate;

      return areaMatched && dateMatched;
    });

    return result.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }, [deliveryAreaInput, scopedTasks, selectedDate]);

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

    setSearchParams(next, { replace: true });
    setSelectedTaskIds([]);
    setBulkAssignMessage(null);
    setBulkAssignError(null);
  };

  const onResetFilters = () => {
    const next = new URLSearchParams();
    next.set('date', today);
    setSearchParams(next, { replace: true });
    setTaskTypeInput('');
    setStatusInput('');
    setDeliveryAreaInput('');
    setDateInput(today);
    setSelectedTaskIds([]);
    setBulkAssignMessage(null);
    setBulkAssignError(null);
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

  const onBulkAssign = async () => {
    if (!accessToken) {
      return;
    }

    const courierId = bulkCourierId.trim();
    if (!courierId) {
      setBulkAssignError('Vui lòng chọn shipper trước khi phân công.');
      return;
    }

    const selectedTasks = filteredTasks.filter((task) =>
      selectedTaskIds.includes(task.id),
    );
    if (selectedTasks.length === 0) {
      setBulkAssignError('Vui lòng chọn ít nhất 1 tác vụ.');
      return;
    }

    setBulkAssignLoading(true);
    setBulkAssignMessage(null);
    setBulkAssignError(null);

    let assignedCount = 0;
    let reassignedCount = 0;
    let skippedCount = 0;
    const failedTasks: string[] = [];

    for (const task of selectedTasks) {
      if (!task.isSelectable) {
        skippedCount += 1;
        continue;
      }

      try {
        if (task.assignedCourierId) {
          if (task.assignedCourierId === courierId) {
            skippedCount += 1;
            continue;
          }

          await tasksClient.reassign(accessToken, {
            taskId: task.id,
            courierId,
            note: 'phân công hàng loạt từ màn hình ops',
          });
          reassignedCount += 1;
          continue;
        }

        await tasksClient.assign(accessToken, {
          taskId: task.id,
          courierId,
          note: 'phân công hàng loạt từ màn hình ops',
        });
        assignedCount += 1;
      } catch (error) {
        const displayCode = task.shipmentCode ?? task.id;
        failedTasks.push(`${displayCode}: ${getErrorMessage(error)}`);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });

    if (failedTasks.length === 0) {
      setSelectedTaskIds([]);
    }

    setBulkAssignMessage(
      `Đã phân công ${assignedCount}, phân công lại ${reassignedCount}, bỏ qua ${skippedCount}.`,
    );

    if (failedTasks.length > 0) {
      setBulkAssignError(`Thất bại ${failedTasks.length}: ${failedTasks.slice(0, 3).join(' | ')}`);
    }

    setBulkAssignLoading(false);
  };

  return (
    <div>
      <h2>Phân công tác vụ</h2>
      <p style={styles.helperText}>
        Lọc theo ngày, loại tác vụ, trạng thái và khu vực giao. Chọn nhiều tác vụ để phân công cho 1 shipper.
      </p>
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
          <strong>Phân công hàng loạt</strong>
          <small>Đã chọn: {selectedTaskIds.length}</small>
        </div>

        <div style={styles.bulkActionsRow}>
          <select
            value={bulkCourierId}
            onChange={(event) => setBulkCourierId(event.target.value)}
            style={styles.select}
            disabled={courierOptionsQuery.isLoading || bulkAssignLoading}
          >
            <option value="">Chọn shipper</option>
            {(courierOptionsQuery.data ?? []).map((courier) => (
              <option key={courier.courierId} value={courier.courierId}>
                {courier.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void onBulkAssign()}
            disabled={bulkAssignLoading || selectedTaskIds.length === 0}
          >
            {bulkAssignLoading ? 'Đang phân công...' : 'Phân công các tác vụ đã chọn'}
          </button>
        </div>

        <small style={styles.helperText}>
          Chỉ các tác vụ có trạng thái CREATED hoặc ASSIGNED mới được chọn để phân công hàng loạt.
        </small>

        {bulkAssignMessage ? (
          <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
            {bulkAssignMessage}
          </div>
        ) : null}
        {bulkAssignError ? (
          <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
            {bulkAssignError}
          </div>
        ) : null}
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
            : 'Không có tác vụ phù hợp theo ngày và bộ lọc hiện tại.'}
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
  helperText: {
    color: '#2d3f99',
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
};
