import { useQuery } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { TaskDto } from './tasks.types';

export const tasksApi = {
  listAssignedTasks: (
    accessToken: string,
    courierId: string,
  ): Promise<TaskDto[]> =>
    courierApiClient.request(courierEndpoints.tasks.list(courierId), {
      accessToken,
    }),
  getTaskDetail: (accessToken: string, taskId: string): Promise<TaskDto> =>
    courierApiClient.request(courierEndpoints.tasks.detail(taskId), {
      accessToken,
    }),
};

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
