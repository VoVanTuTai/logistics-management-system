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
