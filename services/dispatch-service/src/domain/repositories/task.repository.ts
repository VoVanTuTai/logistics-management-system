import type {
  AssignTaskInput,
  CreateTaskInput,
  ListTasksFilters,
  ReassignTaskInput,
  Task,
  UpdateTaskStatusInput,
} from '../entities/task.entity';

export abstract class TaskRepository {
  abstract list(filters?: ListTasksFilters): Promise<Task[]>;
  abstract listCourierIds(): Promise<string[]>;
  abstract findById(id: string): Promise<Task | null>;
  abstract findByPickupRequestId(pickupRequestId: string): Promise<Task | null>;
  abstract create(input: CreateTaskInput): Promise<Task>;
  abstract assign(id: string, input: AssignTaskInput): Promise<Task>;
  abstract reassign(id: string, input: ReassignTaskInput): Promise<Task>;
  abstract updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task>;
}
