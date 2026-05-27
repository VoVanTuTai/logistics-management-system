import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  AssignTaskInput,
  CreateTaskInput,
  TaskDto,
  TaskListFilters,
  TaskStatus,
} from './tasks.types';

function buildTaskListPath(filters: TaskListFilters): string {
  const params = new URLSearchParams();

  if (filters.courierId?.trim()) {
    params.set('courierId', filters.courierId.trim());
  }

  if (filters.taskType) {
    params.set('taskType', filters.taskType);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.shipmentCode?.trim()) {
    params.set('shipmentCode', filters.shipmentCode.trim().toUpperCase());
  }

  const query = params.toString();
  return query ? `${courierEndpoints.tasks.base}?${query}` : courierEndpoints.tasks.base;
}

export const tasksApi = {
  listTasks: (
    accessToken: string,
    filters: TaskListFilters,
  ): Promise<TaskDto[]> =>
    courierApiClient.request<TaskDto[]>(buildTaskListPath(filters), {
      accessToken,
    }),
  listAssignedTasks: (
    accessToken: string,
    courierId: string,
  ): Promise<TaskDto[]> =>
    courierApiClient.request<TaskDto[]>(courierEndpoints.tasks.list(courierId), {
      accessToken,
    }),
  getTaskDetail: (accessToken: string, taskId: string): Promise<TaskDto> =>
    courierApiClient.request<TaskDto>(courierEndpoints.tasks.detail(taskId), {
      accessToken,
    }),
  createTask: (
    accessToken: string,
    payload: CreateTaskInput,
  ): Promise<TaskDto> =>
    courierApiClient.request<TaskDto>(courierEndpoints.tasks.base, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  assignTask: (
    accessToken: string,
    payload: AssignTaskInput,
  ): Promise<TaskDto> =>
    courierApiClient.request<TaskDto>(courierEndpoints.tasks.assign(payload.taskId), {
      method: 'POST',
      accessToken,
      body: {
        courierId: payload.courierId,
      },
    }),
  reassignTask: (
    accessToken: string,
    payload: AssignTaskInput,
  ): Promise<TaskDto> =>
    courierApiClient.request<TaskDto>(courierEndpoints.tasks.reassign(payload.taskId), {
      method: 'POST',
      accessToken,
      body: {
        courierId: payload.courierId,
      },
    }),
  updateTaskStatus: (
    accessToken: string,
    taskId: string,
    status: Extract<TaskStatus, 'COMPLETED' | 'CANCELLED'>,
  ): Promise<TaskDto> =>
    courierApiClient.request<TaskDto>(courierEndpoints.tasks.updateStatus(taskId), {
      method: 'PATCH',
      accessToken,
      body: { status },
    }),
};
