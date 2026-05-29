import React from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useDispatchTasksRealtime,
  useTaskDetailQuery,
} from '../../features/tasks/tasks.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatTaskStatusLabel, formatTaskTypeLabel } from '../../utils/logisticsLabels';

export function TaskDetailPage(): React.JSX.Element {
  const { taskId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  useDispatchTasksRealtime(Boolean(accessToken));
  const detailQuery = useTaskDetailQuery(accessToken, taskId);

  if (detailQuery.isLoading) {
    return <p>Đang tải chi tiết tác vụ...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Không tìm thấy tác vụ.</p>;
  }

  return (
    <section>
      <h2>Chi tiết đơn chuyển</h2>
      <p>
        <Link to={routePaths.operationsPlatformPickupDispatch}>Quay lại điều phối vận đơn</Link>
      </p>

      <p>Mã tác vụ: {detailQuery.data.taskCode}</p>
      <p>Loại tác vụ: {formatTaskTypeLabel(detailQuery.data.taskType)}</p>
      <p>Trạng thái: {formatTaskStatusLabel(detailQuery.data.status)}</p>
      <p>Mã vận đơn: {detailQuery.data.shipmentCode ?? 'Không có'}</p>
      <p>Courier hiện tại: {detailQuery.data.assignedCourierId ?? 'Không có'}</p>
      <p>Cập nhật lúc: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Ghi chú: {detailQuery.data.note ?? 'Không có'}</p>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorText: {
    color: '#b91c1c',
  },
};
