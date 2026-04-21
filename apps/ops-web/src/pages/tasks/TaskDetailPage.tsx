import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useAssignTaskMutation,
  useCourierOptionsQuery,
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
import { formatTaskStatusLabel, formatTaskTypeLabel } from '../../utils/logisticsLabels';
import { TaskActionModal } from './TaskActionModal';

export function TaskDetailPage(): React.JSX.Element {
  const { taskId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useTaskDetailQuery(accessToken, taskId);
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);
  const assignMutation = useAssignTaskMutation(accessToken);
  const reassignMutation = useReassignTaskMutation(accessToken);
  const [openModal, setOpenModal] = useState<'assign' | 'reassign' | null>(null);
  const [lastActionName, setLastActionName] = useState<'assign' | 'reassign' | null>(null);
  const [lastActionResponse, setLastActionResponse] =
    useState<TaskActionResultDto | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!actionNotice) {
      return;
    }

    const clearTimeoutId = window.setTimeout(() => {
      setActionNotice(null);
    }, 5000);

    return () => {
      window.clearTimeout(clearTimeoutId);
    };
  }, [actionNotice]);

  const onAssignSubmit = async (payload: AssignTaskInput) => {
    try {
      const response = await assignMutation.mutateAsync(payload);
      setLastActionName('assign');
      setLastActionResponse(response);
      setActionNotice({
        tone: 'success',
        message: `Đã phân công tác vụ cho nhan vien giao ${response.task.assignedCourierId ?? payload.courierId}.`,
      });
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: getErrorMessage(error),
      });
      throw error;
    }
  };

  const onReassignSubmit = async (payload: ReassignTaskInput) => {
    try {
      const response = await reassignMutation.mutateAsync(payload);
      setLastActionName('reassign');
      setLastActionResponse(response);
      setActionNotice({
        tone: 'success',
        message: `Đã phân công lai tác vụ cho nhan vien giao ${response.task.assignedCourierId ?? payload.courierId}.`,
      });
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: getErrorMessage(error),
      });
      throw error;
    }
  };
  const lastActionLabel =
    lastActionName === 'assign'
      ? 'phan-cong'
      : lastActionName === 'reassign'
        ? 'phan-cong-lai'
        : 'chưa-có';

  if (detailQuery.isLoading) {
    return <p>Đang tải chi tiet tác vụ...</p>;
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
        <Link to={routePaths.tasks}>Quay lại danh sach tác vụ</Link>
      </p>

      <p>Ma tác vụ: {detailQuery.data.taskCode}</p>
      <p>Loai tác vụ: {formatTaskTypeLabel(detailQuery.data.taskType)}</p>
      <p>Trạng thái: {formatTaskStatusLabel(detailQuery.data.status)}</p>
      <p>Ma vận đơn: {detailQuery.data.shipmentCode ?? 'Không có'}</p>
      <p>Nhan vien giao duoc gan: {detailQuery.data.assignedCourierId ?? 'Không có'}</p>
      <p>Cập nhật lúc: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Ghi chu: {detailQuery.data.note ?? 'Không có'}</p>

      <div style={styles.actionButtons}>
        <button type="button" onClick={() => setOpenModal('assign')}>
          Mo form phan cong
        </button>
        <button type="button" onClick={() => setOpenModal('reassign')}>
          Mo form phan cong lai
        </button>
      </div>

      {courierOptionsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(courierOptionsQuery.error)}</p>
      ) : null}

      {actionNotice ? (
        <div
          role={actionNotice.tone === 'error' ? 'alert' : 'status'}
          style={{
            ...styles.notice,
            ...(actionNotice.tone === 'success'
              ? styles.successNotice
              : styles.errorNotice),
          }}
        >
          {actionNotice.message}
        </div>
      ) : null}

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Phan hoi backend gan nhat ({lastActionLabel})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastActionResponse, null, 2)}</pre>
        </div>
      ) : null}

      <TaskActionModal
        taskId={taskId}
        mode="assign"
        isOpen={openModal === 'assign'}
        isSubmitting={assignMutation.isPending}
        courierOptions={courierOptionsQuery.data ?? []}
        courierOptionsLoading={courierOptionsQuery.isLoading}
        onClose={() => setOpenModal(null)}
        onSubmit={onAssignSubmit}
      />
      <TaskActionModal
        taskId={taskId}
        mode="reassign"
        isOpen={openModal === 'reassign'}
        isSubmitting={reassignMutation.isPending}
        courierOptions={courierOptionsQuery.data ?? []}
        courierOptionsLoading={courierOptionsQuery.isLoading}
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
  notice: {
    marginTop: 12,
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
  },
};
