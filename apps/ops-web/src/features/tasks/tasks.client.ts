import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AssignTaskInput,
  CreateTaskInput,
  CourierOptionDto,
  ReassignTaskInput,
  TaskActionResultDto,
  TaskDetailDto,
  TaskListFilters,
  TaskListItemDto,
  UpdateTaskStatusInput,
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
  if (filters.shipmentCode?.trim()) {
    params.set('shipmentCode', filters.shipmentCode.trim());
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

function mapTaskActionResult(payload: TaskApiResponse): TaskActionResultDto {
  return {
    task: mapTask(payload),
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
  create: (
    accessToken: string | null,
    payload: CreateTaskInput,
  ): Promise<TaskDetailDto> =>
    opsApiClient
      .request<TaskApiResponse>(opsEndpoints.tasks.list, {
        method: 'POST',
        accessToken,
        body: payload,
      })
      .then(mapTask),
  listCouriers: (accessToken: string | null): Promise<CourierOptionDto[]> =>
    opsApiClient
      .request<string[]>(opsEndpoints.tasks.couriers, {
        accessToken,
      })
      .then((items) =>
        items.map((courierId) => ({
          courierId,
          label: courierId,
        })),
      ),
  assign: (
    accessToken: string | null,
    payload: AssignTaskInput,
  ): Promise<TaskActionResultDto> =>
    opsApiClient
      .request<TaskApiResponse>(opsEndpoints.tasks.assign(payload.taskId), {
        method: 'POST',
        accessToken,
        body: {
          courierId: payload.courierId,
        },
      })
      .then(mapTaskActionResult),
  reassign: (
    accessToken: string | null,
    payload: ReassignTaskInput,
  ): Promise<TaskActionResultDto> =>
    opsApiClient
      .request<TaskApiResponse>(opsEndpoints.tasks.reassign(payload.taskId), {
        method: 'POST',
        accessToken,
        body: {
          courierId: payload.courierId,
        },
      })
      .then(mapTaskActionResult),
  updateStatus: (
    accessToken: string | null,
    payload: UpdateTaskStatusInput,
  ): Promise<TaskActionResultDto> =>
    opsApiClient
      .request<TaskApiResponse>(opsEndpoints.tasks.status(payload.taskId), {
        method: 'PATCH',
        accessToken,
        body: {
          status: payload.status,
        },
      })
      .then(mapTaskActionResult),
};
