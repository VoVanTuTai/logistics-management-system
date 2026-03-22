export interface TaskAssignmentSnapshot {
  id: string;
  taskId: string;
  courierId: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
