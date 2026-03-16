import React from 'react';
import { useForm } from 'react-hook-form';

import {
  useAssignTaskMutation,
  useReassignTaskMutation,
  useTasksQuery,
} from '../../features/tasks/tasks.api';
import type { AssignTaskInput, ReassignTaskInput } from '../../features/tasks/tasks.types';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

export function TaskAssignmentPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const tasksQuery = useTasksQuery(accessToken);
  const assignMutation = useAssignTaskMutation(accessToken);
  const reassignMutation = useReassignTaskMutation(accessToken);
  const assignForm = useForm<AssignTaskInput>({
    defaultValues: { taskId: '', courierId: '', note: '' },
  });
  const reassignForm = useForm<ReassignTaskInput>({
    defaultValues: { taskId: '', courierId: '', note: '' },
  });

  return (
    <section>
      <h2>Task assignment</h2>
      <div style={styles.grid}>
        <article style={styles.card}>
          <h3>Assign</h3>
          <form onSubmit={assignForm.handleSubmit((v) => assignMutation.mutate(v))}>
            <input placeholder="Task ID" {...assignForm.register('taskId')} />
            <input placeholder="Courier ID" {...assignForm.register('courierId')} />
            <input placeholder="Note" {...assignForm.register('note')} />
            <button type="submit">Assign task</button>
          </form>
        </article>
        <article style={styles.card}>
          <h3>Reassign</h3>
          <form onSubmit={reassignForm.handleSubmit((v) => reassignMutation.mutate(v))}>
            <input placeholder="Task ID" {...reassignForm.register('taskId')} />
            <input placeholder="Courier ID" {...reassignForm.register('courierId')} />
            <input placeholder="Reason/Note" {...reassignForm.register('note')} />
            <button type="submit">Reassign task</button>
          </form>
        </article>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Task</th>
            <th>Type</th>
            <th>Status</th>
            <th>Shipment</th>
            <th>Courier</th>
            <th>Updated at</th>
          </tr>
        </thead>
        <tbody>
          {(tasksQuery.data ?? []).map((task) => (
            <tr key={task.id}>
              <td>{task.taskCode}</td>
              <td>{task.taskType}</td>
              <td>{task.status}</td>
              <td>{task.shipmentCode ?? 'N/A'}</td>
              <td>{task.assignedCourierId ?? 'N/A'}</td>
              <td>{formatDateTime(task.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
  },
};

