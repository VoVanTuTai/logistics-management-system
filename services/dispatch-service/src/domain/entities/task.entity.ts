export const TASK_TYPES = ['PICKUP', 'DELIVERY', 'RETURN'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ['CREATED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  taskCode: string;
  taskType: TaskType;
  status: TaskStatus;
  shipmentCode: string | null;
  pickupRequestId: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignments: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  courierId: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  taskCode: string;
  taskType: TaskType;
  shipmentCode?: string | null;
  pickupRequestId?: string | null;
  note?: string | null;
}

export interface AssignTaskInput {
  courierId: string;
}

export interface ReassignTaskInput {
  courierId: string;
}

export interface UpdateTaskStatusInput {
  status: Extract<TaskStatus, 'COMPLETED' | 'CANCELLED'>;
}

export interface ListTasksFilters {
  courierId?: string;
  taskType?: TaskType;
  status?: TaskStatus;
  shipmentCode?: string;
  pickupRequestId?: string;
}
