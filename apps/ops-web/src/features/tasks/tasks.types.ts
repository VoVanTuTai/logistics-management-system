export interface TaskItemDto {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  assignedCourierId: string | null;
  updatedAt: string;
}

export interface AssignTaskInput {
  taskId: string;
  courierId: string;
  note?: string | null;
}

export interface ReassignTaskInput extends AssignTaskInput {}

