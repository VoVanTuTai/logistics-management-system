import { randomUUID } from 'crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AssignTaskInput,
  CreateTaskInput,
  ListTasksFilters,
  ReassignTaskInput,
  Task,
  TaskAssignment,
  TaskType,
  UpdateTaskStatusInput,
} from '../../domain/entities/task.entity';
import {
  TASK_STATUSES,
  TASK_TYPES,
} from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { DispatchOutboxService } from '../../messaging/outbox/dispatch-outbox.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TaskRepository)
    private readonly taskRepository: TaskRepository,
    private readonly dispatchOutboxService: DispatchOutboxService,
  ) {}

  list(filters: {
    courierId?: string;
    taskType?: string;
    status?: string;
    shipmentCode?: string;
    pickupRequestId?: string;
  }): Promise<Task[]> {
    const normalizedFilters: ListTasksFilters = {
      courierId: filters.courierId?.trim() || undefined,
      shipmentCode: filters.shipmentCode?.trim() || undefined,
      pickupRequestId: filters.pickupRequestId?.trim() || undefined,
      taskType: this.normalizeTaskType(filters.taskType),
      status: this.normalizeTaskStatus(filters.status),
    };

    return this.taskRepository.list(normalizedFilters);
  }

  async listCouriers(): Promise<string[]> {
    const seededCouriers = (process.env.DISPATCH_COURIER_OPTIONS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const assignedCouriers = await this.taskRepository.listCourierIds();

    return Array.from(new Set([...seededCouriers, ...assignedCouriers])).sort(
      (left, right) => left.localeCompare(right),
    );
  }

  async getById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task "${id}" was not found.`);
    }

    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return this.taskRepository.create(input);
  }

  async assign(id: string, input: AssignTaskInput): Promise<Task> {
    const currentTask = await this.getById(id);
    this.ensureAssignableTask(currentTask);
    const courierId = this.requireCourierId(input.courierId);

    const activeAssignment = this.getActiveAssignment(currentTask);
    if (activeAssignment) {
      if (activeAssignment.courierId === courierId) {
        return currentTask;
      }

      throw new BadRequestException(
        `Task "${id}" is already assigned. Use reassign endpoint instead.`,
      );
    }

    const task = await this.taskRepository.assign(id, { courierId });

    await this.dispatchOutboxService.enqueueTaskAssigned(task);

    return task;
  }

  async reassign(id: string, input: ReassignTaskInput): Promise<Task> {
    const currentTask = await this.getById(id);
    this.ensureAssignableTask(currentTask);
    const courierId = this.requireCourierId(input.courierId);

    const activeAssignment = this.getActiveAssignment(currentTask);
    if (!activeAssignment) {
      throw new BadRequestException(
        `Task "${id}" has no active courier assignment. Use assign endpoint first.`,
      );
    }

    if (activeAssignment.courierId === courierId) {
      return currentTask;
    }

    const task = await this.taskRepository.reassign(id, { courierId });

    await this.dispatchOutboxService.enqueueTaskAssigned(task);

    return task;
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task> {
    const currentTask = await this.getById(id);

    if (currentTask.status === input.status) {
      return currentTask;
    }

    if (
      currentTask.status === 'COMPLETED' ||
      currentTask.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        `Task "${id}" is already terminal with status "${currentTask.status}".`,
      );
    }

    if (
      input.status === 'COMPLETED' &&
      currentTask.status !== 'ASSIGNED'
    ) {
      throw new BadRequestException(
        `Task "${id}" must be assigned before completion.`,
      );
    }

    const task = await this.taskRepository.updateStatus(id, input);
    return task;
  }

  async createTaskFromPickupApproved(payload: {
    pickup_request_id?: string | null;
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task> {
    const pickupRequestId = payload.pickup_request_id?.trim() ?? null;

    if (pickupRequestId) {
      const existingTask = await this.taskRepository.findByPickupRequestId(
        pickupRequestId,
      );
      if (existingTask) {
        return existingTask;
      }
    }

    const task = await this.taskRepository.create({
      taskCode: `task-${randomUUID()}`,
      taskType: 'PICKUP',
      pickupRequestId,
      shipmentCode: payload.shipment_code ?? null,
      note: payload.note ?? null,
    });

    return task;
  }

  async handleDeliveryFailed(payload: {
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task> {
    // TODO: replace this placeholder with explicit return-task policy when business rules are defined.
    const taskType: TaskType = 'RETURN';
    const task = await this.taskRepository.create({
      taskCode: `task-${randomUUID()}`,
      taskType,
      shipmentCode: payload.shipment_code ?? null,
      note: payload.note ?? 'generated_from_delivery_failed',
    });

    return task;
  }

  private ensureAssignableTask(task: Task): void {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new BadRequestException(
        `Task "${task.id}" cannot be assigned from status "${task.status}".`,
      );
    }
  }

  private getActiveAssignment(task: Task): TaskAssignment | null {
    return (
      task.assignments.find((assignment) => assignment.unassignedAt === null) ??
      null
    );
  }

  private requireCourierId(courierId: string): string {
    const normalizedCourierId = courierId.trim();
    if (!normalizedCourierId) {
      throw new BadRequestException('courierId is required.');
    }

    return normalizedCourierId;
  }

  private normalizeTaskType(taskType: string | undefined): TaskType | undefined {
    if (!taskType) {
      return undefined;
    }

    const normalizedTaskType = taskType.trim().toUpperCase();
    if (!normalizedTaskType) {
      return undefined;
    }

    if (!TASK_TYPES.includes(normalizedTaskType as TaskType)) {
      throw new BadRequestException(
        `Invalid taskType filter "${taskType}". Expected one of ${TASK_TYPES.join(', ')}.`,
      );
    }

    return normalizedTaskType as TaskType;
  }

  private normalizeTaskStatus(
    status: string | undefined,
  ): ListTasksFilters['status'] {
    if (!status) {
      return undefined;
    }

    const normalizedStatus = status.trim().toUpperCase();
    if (!normalizedStatus) {
      return undefined;
    }

    if (!TASK_STATUSES.includes(normalizedStatus as (typeof TASK_STATUSES)[number])) {
      throw new BadRequestException(
        `Invalid status filter "${status}". Expected one of ${TASK_STATUSES.join(', ')}.`,
      );
    }

    return normalizedStatus as (typeof TASK_STATUSES)[number];
  }
}
