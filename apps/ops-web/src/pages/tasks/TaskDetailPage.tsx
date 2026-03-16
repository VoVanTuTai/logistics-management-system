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

  if (detailQuery.isLoading) {
    return <p>Loading task detail...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Task not found.</p>;
  }

  return (
    <section>
      <h2>Task detail</h2>
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
          Open assign skeleton
        </button>
        <button type="button" onClick={() => setOpenModal('reassign')}>
          Open reassign skeleton
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
          <strong>Last server response ({lastActionName})</strong>
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

