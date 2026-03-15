import { randomUUID } from 'crypto';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AssignTaskInput,
  CreateTaskInput,
  ReassignTaskInput,
  Task,
  TaskType,
  UpdateTaskStatusInput,
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

  list(courierId?: string): Promise<Task[]> {
    return this.taskRepository.list(courierId);
  }

  async getById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task "${id}" was not found.`);
    }

    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task = await this.taskRepository.create(input);

    await this.dispatchOutboxService.enqueueTaskCreated(task);

    return task;
  }

  async assign(id: string, input: AssignTaskInput): Promise<Task> {
    await this.getById(id);

    const task = await this.taskRepository.assign(id, input);

    await this.dispatchOutboxService.enqueueTaskAssigned(task);

    return task;
  }

  async reassign(id: string, input: ReassignTaskInput): Promise<Task> {
    await this.getById(id);

    const task = await this.taskRepository.reassign(id, input);

    await this.dispatchOutboxService.enqueueTaskReassigned(task);

    return task;
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task> {
    await this.getById(id);

    const task = await this.taskRepository.updateStatus(id, input);

    if (input.status === 'COMPLETED') {
      await this.dispatchOutboxService.enqueueTaskCompleted(task);
    }

    if (input.status === 'CANCELLED') {
      await this.dispatchOutboxService.enqueueTaskCancelled(task);
    }

    return task;
  }

  async createTaskFromPickupRequested(payload: {
    pickup_request_id?: string | null;
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task> {
    const task = await this.taskRepository.create({
      taskCode: `task-${randomUUID()}`,
      taskType: 'PICKUP',
      pickupRequestId: payload.pickup_request_id ?? null,
      shipmentCode: payload.shipment_code ?? null,
      note: payload.note ?? null,
    });

    await this.dispatchOutboxService.enqueueTaskCreated(task);

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

    await this.dispatchOutboxService.enqueueTaskCreated(task);

    return task;
  }
}
