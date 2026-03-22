import { useQuery } from '@tanstack/react-query';

import { tasksApi } from './tasks.api';

export function useAssignedTasksQuery(params: {
  accessToken: string | null;
  courierId: string;
}) {
  return useQuery({
    queryKey: ['tasks', 'assigned', params.courierId],
    queryFn: () =>
      tasksApi.listAssignedTasks(params.accessToken as string, params.courierId),
    enabled: Boolean(params.accessToken) && Boolean(params.courierId),
  });
}

export function useTaskDetailQuery(params: {
  accessToken: string | null;
  taskId: string;
}) {
  return useQuery({
    queryKey: ['tasks', 'detail', params.taskId],
    queryFn: () =>
      tasksApi.getTaskDetail(params.accessToken as string, params.taskId),
    enabled: Boolean(params.accessToken) && Boolean(params.taskId),
  });
}
