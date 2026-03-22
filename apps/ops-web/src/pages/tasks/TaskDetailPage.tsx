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
        message: `Assigned task to courier ${response.task.assignedCourierId ?? payload.courierId}.`,
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
        message: `Reassigned task to courier ${response.task.assignedCourierId ?? payload.courierId}.`,
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
      ? 'assign'
      : lastActionName === 'reassign'
        ? 'reassign'
        : 'none';

  if (detailQuery.isLoading) {
    return <p>Loading task detail...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Task was not found.</p>;
  }

  return (
    <section>
      <h2>Task Detail</h2>
      <p>
        <Link to={routePaths.tasks}>Back to task list</Link>
      </p>

      <p>Task code: {detailQuery.data.taskCode}</p>
      <p>Task type: {detailQuery.data.taskType}</p>
      <p>Status: {detailQuery.data.status}</p>
      <p>Shipment code: {detailQuery.data.shipmentCode ?? 'N/A'}</p>
      <p>Assigned courier: {detailQuery.data.assignedCourierId ?? 'N/A'}</p>
      <p>Updated at: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Note: {detailQuery.data.note ?? 'N/A'}</p>

      <div style={styles.actionButtons}>
        <button type="button" onClick={() => setOpenModal('assign')}>
          Open assign form
        </button>
        <button type="button" onClick={() => setOpenModal('reassign')}>
          Open reassign form
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
          <strong>Latest server response ({lastActionLabel})</strong>
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
