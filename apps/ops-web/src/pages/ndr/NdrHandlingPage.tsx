import React from 'react';

import { useNdrCasesQuery } from '../../features/ndr/ndr.api';
import { useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { NdrCasesTable } from './NdrCasesTable';

export function NdrHandlingPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const ndrQuery = useNdrCasesQuery(accessToken);
  const tasksQuery = useTasksQuery(accessToken, {});
  const courierByShipmentCode = React.useMemo(
    () => buildCourierByShipmentCode(tasksQuery.data ?? []),
    [tasksQuery.data],
  );

  return (
    <div>
      <h2>Xử lý NDR</h2>
      <p style={{ color: '#2d3f99' }}>
        Trạng thái và thông tin hồ sơ được hiển thị trực tiếp từ dữ liệu backend.
      </p>
      {ndrQuery.isLoading ? <p>Đang tải danh sách NDR...</p> : null}
      {ndrQuery.isError ? <p style={styles.errorText}>{getErrorMessage(ndrQuery.error)}</p> : null}
      {tasksQuery.isError ? <p style={styles.errorText}>{getErrorMessage(tasksQuery.error)}</p> : null}
      {ndrQuery.isSuccess && (ndrQuery.data?.length ?? 0) === 0 ? <p>Không có hồ sơ NDR.</p> : null}
      {ndrQuery.isSuccess && (ndrQuery.data?.length ?? 0) > 0 ? (
        <NdrCasesTable items={ndrQuery.data ?? []} courierByShipmentCode={courierByShipmentCode} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorText: {
    color: '#b91c1c',
  },
};

function buildCourierByShipmentCode(tasks: TaskListItemDto[]): Map<string, string> {
  const result = new Map<string, string>();
  const newestUpdatedAtByShipment = new Map<string, string>();

  for (const task of tasks) {
    if (!task.shipmentCode || !task.assignedCourierId) {
      continue;
    }

    const previousUpdatedAt = newestUpdatedAtByShipment.get(task.shipmentCode);
    if (previousUpdatedAt && previousUpdatedAt >= task.updatedAt) {
      continue;
    }

    newestUpdatedAtByShipment.set(task.shipmentCode, task.updatedAt);
    result.set(task.shipmentCode, task.assignedCourierId);
  }

  return result;
}
