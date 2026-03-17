export interface TaskListItemDto {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  assignedCourierId: string | null;
  updatedAt: string;
}

export interface TaskDetailDto {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  assignedCourierId: string | null;
  note?: string | null;
  updatedAt: string;
}

export interface TaskListFilters {
  taskType?: string;
  status?: string;
}

export interface AssignTaskInput {
  taskId: string;
  courierId: string;
  note?: string | null;
}

export interface ReassignTaskInput extends AssignTaskInput {}

export interface TaskActionResultDto {
  task: TaskDetailDto;
  // TODO(contract): add action metadata when task assignment contract is finalized.
}
