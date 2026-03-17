import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useAssignTaskMutation,
  useReassignTaskMutation,
  useTaskDetailQuery,
} from '../../features/tasks/tasks.api';
import type {
  AssignTaskInput,
  ReassignTaskInput,
  TaskActionResultDto,
} from '../../features/tasks/tasks.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { TaskActionModal } from './TaskActionModal';

export function TaskDetailPage(): React.JSX.Element {
  const { taskId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useTaskDetailQuery(accessToken, taskId);
  const assignMutation = useAssignTaskMutation(accessToken);
  const reassignMutation = useReassignTaskMutation(accessToken);
  const [openModal, setOpenModal] = useState<'assign' | 'reassign' | null>(null);
  const [lastActionName, setLastActionName] = useState<'assign' | 'reassign' | null>(null);
  const [lastActionResponse, setLastActionResponse] =
    useState<TaskActionResultDto | null>(null);

  const onAssignSubmit = async (payload: AssignTaskInput) => {
    const response = await assignMutation.mutateAsync(payload);
    setLastActionName('assign');
    setLastActionResponse(response);
  };

  const onReassignSubmit = async (payload: ReassignTaskInput) => {
    const response = await reassignMutation.mutateAsync(payload);
    setLastActionName('reassign');
    setLastActionResponse(response);
  };
  const lastActionLabel =
    lastActionName === 'assign'
      ? 'phân công'
      : lastActionName === 'reassign'
        ? 'phân công lại'
        : 'không có';

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
      <h2>Chi tiết tác vụ</h2>
      <p>
        <Link to={routePaths.tasks}>Quay lại danh sách tác vụ</Link>
      </p>

      <p>Mã tác vụ: {detailQuery.data.taskCode}</p>
      <p>Loại tác vụ: {detailQuery.data.taskType}</p>
      <p>Trạng thái: {detailQuery.data.status}</p>
      <p>Mã vận đơn: {detailQuery.data.shipmentCode ?? 'Không có'}</p>
      <p>Courier đang gán: {detailQuery.data.assignedCourierId ?? 'Không có'}</p>
      <p>Cập nhật lúc: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Ghi chú: {detailQuery.data.note ?? 'Không có'}</p>

      <div style={styles.actionButtons}>
        <button type="button" onClick={() => setOpenModal('assign')}>
          Mở form phân công
        </button>
        <button type="button" onClick={() => setOpenModal('reassign')}>
          Mở form phân công lại
        </button>
      </div>

      {assignMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(assignMutation.error)}</p>
      ) : null}
      {reassignMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(reassignMutation.error)}</p>
      ) : null}

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Phản hồi server gần nhất ({lastActionLabel})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastActionResponse, null, 2)}</pre>
        </div>
      ) : null}

      <TaskActionModal
        taskId={taskId}
        mode="assign"
        isOpen={openModal === 'assign'}
        isSubmitting={assignMutation.isPending}
        onClose={() => setOpenModal(null)}
        onSubmit={onAssignSubmit}
      />
      <TaskActionModal
        taskId={taskId}
        mode="reassign"
        isOpen={openModal === 'reassign'}
        isSubmitting={reassignMutation.isPending}
        onClose={() => setOpenModal(null)}
        onSubmit={onReassignSubmit}
      />
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  actionButtons: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  responseBox: {
    marginTop: 16,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
  },
  pre: {
    marginTop: 8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
  },
  errorText: {
    color: '#b91c1c',
  },
};
