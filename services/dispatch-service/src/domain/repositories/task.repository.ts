import type {
  AssignTaskInput,
  CreateTaskInput,
  ReassignTaskInput,
  Task,
  UpdateTaskStatusInput,
} from '../entities/task.entity';

export abstract class TaskRepository {
  abstract list(courierId?: string): Promise<Task[]>;
  abstract findById(id: string): Promise<Task | null>;
  abstract create(input: CreateTaskInput): Promise<Task>;
  abstract assign(id: string, input: AssignTaskInput): Promise<Task>;
  abstract reassign(id: string, input: ReassignTaskInput): Promise<Task>;
  abstract updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task>;
}
