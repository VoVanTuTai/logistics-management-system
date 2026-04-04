import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { tasksClient } from './tasks.client';
import type {
  AssignTaskInput,
  ReassignTaskInput,
  TaskListFilters,
} from './tasks.types';

export function useTasksQuery(
  accessToken: string | null,
  filters: TaskListFilters,
) {
  return useQuery({
    queryKey: [...queryKeys.tasks, filters.taskType ?? '', filters.status ?? ''],
    queryFn: () => tasksClient.list(accessToken, filters),
    enabled: Boolean(accessToken),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useTaskDetailQuery(
  accessToken: string | null,
  taskId: string,
) {
  return useQuery({
    queryKey: [...queryKeys.tasks, 'detail', taskId],
    queryFn: () => tasksClient.detail(accessToken, taskId),
    enabled: Boolean(accessToken) && Boolean(taskId),
  });
}

export function useCourierOptionsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: [...queryKeys.tasks, 'couriers'],
    queryFn: () => tasksClient.listCouriers(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useAssignTaskMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignTaskInput) =>
      tasksClient.assign(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useReassignTaskMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReassignTaskInput) =>
      tasksClient.reassign(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

