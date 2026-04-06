export interface TaskListItemDto {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  deliveryArea?: string | null;
  senderName?: string | null;
  receiverName?: string | null;
  platform?: string | null;
  isSelectable?: boolean;
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
  shipmentCode?: string;
}

export interface CreateTaskInput {
  taskCode: string;
  taskType: 'PICKUP' | 'DELIVERY' | 'RETURN';
  shipmentCode?: string | null;
  pickupRequestId?: string | null;
  note?: string | null;
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

export interface CourierOptionDto {
  courierId: string;
  label: string;
}
