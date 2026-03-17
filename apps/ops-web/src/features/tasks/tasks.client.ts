import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AssignTaskInput,
  ReassignTaskInput,
  TaskActionResultDto,
  TaskDetailDto,
  TaskListFilters,
  TaskListItemDto,
} from './tasks.types';

interface TaskAssignmentApiResponse {
  courierId: string;
  unassignedAt: string | null;
}

interface TaskApiResponse {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  note: string | null;
  updatedAt: string;
  assignments?: TaskAssignmentApiResponse[];
}

function buildTaskListPath(filters: TaskListFilters): string {
  const params = new URLSearchParams();

  if (filters.taskType?.trim()) {
    params.set('taskType', filters.taskType.trim());
  }

  if (filters.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  const queryString = params.toString();
  return queryString ? `${opsEndpoints.tasks.list}?${queryString}` : opsEndpoints.tasks.list;
}

function mapTask(payload: TaskApiResponse): TaskDetailDto {
  const currentAssignment = payload.assignments?.find(
    (assignment) => assignment.unassignedAt === null,
  );

  return {
    id: payload.id,
    taskCode: payload.taskCode,
    taskType: payload.taskType,
    status: payload.status,
    shipmentCode: payload.shipmentCode,
    assignedCourierId: currentAssignment?.courierId ?? null,
    note: payload.note,
    updatedAt: payload.updatedAt,
  };
}

export const tasksClient = {
  list: (
    accessToken: string | null,
    filters: TaskListFilters,
  ): Promise<TaskListItemDto[]> =>
    opsApiClient
      .request<TaskApiResponse[]>(buildTaskListPath(filters), {
        accessToken,
      })
      .then((items) => items.map(mapTask)),
  detail: (
    accessToken: string | null,
    taskId: string,
  ): Promise<TaskDetailDto> =>
    opsApiClient
      .request<TaskApiResponse>(opsEndpoints.tasks.detail(taskId), {
        accessToken,
      })
      .then(mapTask),
  assign: (
    accessToken: string | null,
    payload: AssignTaskInput,
  ): Promise<TaskActionResultDto> =>
    opsApiClient.request<TaskActionResultDto>(opsEndpoints.tasks.assign(payload.taskId), {
      method: 'POST',
      accessToken,
      body: {
        courierId: payload.courierId,
      },
    }),
  reassign: (
    accessToken: string | null,
    payload: ReassignTaskInput,
  ): Promise<TaskActionResultDto> =>
    opsApiClient.request<TaskActionResultDto>(opsEndpoints.tasks.reassign(payload.taskId), {
      method: 'POST',
      accessToken,
      body: {
        courierId: payload.courierId,
      },
    }),
};
