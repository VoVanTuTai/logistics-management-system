export interface TaskAssignmentDto {
  id: string;
  taskId: string;
  courierId: string;
  assignedAt: string;
  unassignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: string;
  taskCode: string;
  taskType: 'PICKUP' | 'DELIVERY' | 'RETURN';
  status: 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  shipmentCode: string | null;
  pickupRequestId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: TaskAssignmentDto[];
}
