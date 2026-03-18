import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import { tasksClient, useCourierOptionsQuery, useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListFilters, TaskListItemDto } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { queryKeys } from '../../utils/queryKeys';
import { TasksTable } from './TasksTable';

function canBulkAssignTask(task: TaskListItemDto): boolean {
  return task.status === 'CREATED' || task.status === 'ASSIGNED';
}

export function TaskAssignmentPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const filters: TaskListFilters = {
    taskType: searchParams.get('taskType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const defaultDeliveryArea = searchParams.get('deliveryArea') ?? '';

  const [taskTypeInput, setTaskTypeInput] = useState(filters.taskType ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [deliveryAreaInput, setDeliveryAreaInput] = useState(defaultDeliveryArea);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkCourierId, setBulkCourierId] = useState('');
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignMessage, setBulkAssignMessage] = useState<string | null>(null);
  const [bulkAssignError, setBulkAssignError] = useState<string | null>(null);

  const tasksQuery = useTasksQuery(accessToken, filters);
  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);

  useEffect(() => {
    setTaskTypeInput(filters.taskType ?? '');
    setStatusInput(filters.status ?? '');
    setDeliveryAreaInput(defaultDeliveryArea);
  }, [defaultDeliveryArea, filters.status, filters.taskType]);

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

  const shipmentLookupByCode = useMemo(() => {
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
      if (!shipment.shipmentCode) {
        continue;
      }

      map.set(shipment.shipmentCode, {
        deliveryArea: shipment.receiverRegion ?? null,
        senderName: shipment.senderName ?? null,
        receiverName: shipment.receiverName ?? null,
        platform: shipment.platform ?? null,
      });
    }

    return map;
  }, [shipmentsQuery.data]);

  const tasksWithArea = useMemo(() => {
    return (tasksQuery.data ?? []).map((task) => {
      const shipmentLookup = task.shipmentCode
        ? shipmentLookupByCode.get(task.shipmentCode) ?? null
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
  }, [shipmentLookupByCode, tasksQuery.data]);

  const areaOptions = useMemo(() => {
    return Array.from(
      new Set(
        tasksWithArea
          .map((task) => task.deliveryArea?.trim() ?? '')
          .filter((area) => area.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [tasksWithArea]);

  const filteredTasks = useMemo(() => {
    const normalizedDeliveryArea = deliveryAreaInput.trim().toLowerCase();

    if (!normalizedDeliveryArea) {
      return tasksWithArea;
    }

    return tasksWithArea.filter(
      (task) => task.deliveryArea?.toLowerCase() === normalizedDeliveryArea,
    );
  }, [deliveryAreaInput, tasksWithArea]);

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
    const next = new URLSearchParams();

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
    setSearchParams(new URLSearchParams(), { replace: true });
    setTaskTypeInput('');
    setStatusInput('');
    setDeliveryAreaInput('');
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
      setBulkAssignError('Please select a courier before assigning.');
      return;
    }

    const selectedTasks = filteredTasks.filter((task) =>
      selectedTaskIds.includes(task.id),
    );
    if (selectedTasks.length === 0) {
      setBulkAssignError('Please select at least one task.');
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
            note: 'bulk assign from ops task page',
          });
          reassignedCount += 1;
          continue;
        }

        await tasksClient.assign(accessToken, {
          taskId: task.id,
          courierId,
          note: 'bulk assign from ops task page',
        });
        assignedCount += 1;
      } catch (error) {
        failedTasks.push(`${task.taskCode}: ${getErrorMessage(error)}`);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });

    if (failedTasks.length === 0) {
      setSelectedTaskIds([]);
    }

    setBulkAssignMessage(
      `Assigned ${assignedCount}, reassigned ${reassignedCount}, skipped ${skippedCount}.`,
    );

    if (failedTasks.length > 0) {
      setBulkAssignError(`Failed ${failedTasks.length}: ${failedTasks.slice(0, 3).join(' | ')}`);
    }

    setBulkAssignLoading(false);
  };

  return (
    <div>
      <h2>Task Assignment</h2>
      <p style={styles.helperText}>
        Filter by task type, status, and delivery area. Select multiple tasks and assign one courier.
      </p>

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <select
          name="taskType"
          value={taskTypeInput}
          onChange={(event) => setTaskTypeInput(event.target.value)}
          style={styles.select}
        >
          <option value="">All task types</option>
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
          <option value="">All statuses</option>
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
          <option value="">All delivery areas</option>
          {areaOptions.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <button type="submit">Apply</button>
        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
      </form>

      <section style={styles.bulkPanel}>
        <div style={styles.bulkHeaderRow}>
          <strong>Bulk Assign</strong>
          <small>Selected: {selectedTaskIds.length}</small>
        </div>

        <div style={styles.bulkActionsRow}>
          <select
            value={bulkCourierId}
            onChange={(event) => setBulkCourierId(event.target.value)}
            style={styles.select}
            disabled={courierOptionsQuery.isLoading || bulkAssignLoading}
          >
            <option value="">Select courier</option>
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
            {bulkAssignLoading ? 'Assigning...' : 'Assign selected tasks'}
          </button>
        </div>

        <small style={styles.helperText}>
          Only tasks in status CREATED or ASSIGNED can be selected for bulk assignment.
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

      {tasksQuery.isLoading ? <p>Loading tasks...</p> : null}
      {tasksQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(tasksQuery.error)}</p>
      ) : null}
      {shipmentsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentsQuery.error)}</p>
      ) : null}
      {courierOptionsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(courierOptionsQuery.error)}</p>
      ) : null}

      {tasksQuery.isSuccess && filteredTasks.length === 0 ? (
        <p>No tasks match current filters.</p>
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
  helperText: {
    color: '#2d3f99',
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
