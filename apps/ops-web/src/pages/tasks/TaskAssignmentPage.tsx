import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListFilters } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { TasksTable } from './TasksTable';

export function TaskAssignmentPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const filters: TaskListFilters = {
    taskType: searchParams.get('taskType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const [taskTypeInput, setTaskTypeInput] = useState(filters.taskType ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const tasksQuery = useTasksQuery(accessToken, filters);

  useEffect(() => {
    setTaskTypeInput(filters.taskType ?? '');
    setStatusInput(filters.status ?? '');
  }, [filters.status, filters.taskType]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const taskType = String(formData.get('taskType') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const next = new URLSearchParams();

    if (taskType) {
      next.set('taskType', taskType);
    }

    if (status) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setTaskTypeInput('');
    setStatusInput('');
  };

  return (
    <div>
      <h2>Task assignment</h2>
      <p style={{ color: '#2d3f99' }}>
        Task type/status are displayed and filtered from API payload only.
      </p>
      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="taskType"
          placeholder="Filter by task type"
          value={taskTypeInput}
          onChange={(event) => setTaskTypeInput(event.target.value)}
          style={styles.input}
        />
        <input
          name="status"
          placeholder="Filter by status"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.input}
        />
        <button type="submit">Apply</button>
        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
      </form>

      {tasksQuery.isLoading ? <p>Loading tasks...</p> : null}
      {tasksQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(tasksQuery.error)}</p>
      ) : null}
      {tasksQuery.isSuccess && (tasksQuery.data?.length ?? 0) === 0 ? (
        <p>No tasks found for current filters.</p>
      ) : null}
      {tasksQuery.isSuccess && (tasksQuery.data?.length ?? 0) > 0 ? (
        <TasksTable items={tasksQuery.data ?? []} />
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
    marginBottom: 8,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 220,
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
};

