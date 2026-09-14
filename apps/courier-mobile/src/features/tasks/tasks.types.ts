export interface TaskAssignmentDto {
  id: string;
  taskId: string;
  courierId: string;
  assignedAt: string;
  unassignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskType = 'PICKUP' | 'DELIVERY' | 'RETURN';
export type TaskStatus = 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type TaskListFilter = 'ALL' | TaskType;

export interface TaskDto {
  id: string;
  taskCode: string;
  taskType: TaskType;
  status: TaskStatus;
  shipmentCode: string | null;
  pickupRequestId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: TaskAssignmentDto[];
}

export interface TaskListFilters {
  courierId?: string;
  taskType?: TaskType;
  status?: TaskStatus;
  shipmentCode?: string;
}

export interface CreateTaskInput {
  taskCode: string;
  taskType: TaskType;
  shipmentCode?: string | null;
  pickupRequestId?: string | null;
  note?: string | null;
}

export interface AssignTaskInput {
  taskId: string;
  courierId: string;
}

export interface RouteLegDto {
  fromId: string;
  toId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteOptimizationResultDto {
  orderedTaskIds: string[];
  legs: RouteLegDto[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
}

export interface OptimizeRoutePayloadDto {
  courierId: string;
  startLatitude: number;
  startLongitude: number;
  taskIds?: string[];
  taskType?: TaskType;
}
