import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ForbiddenException,
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
import { TasksRealtimeGateway } from '../../realtime/tasks-realtime.gateway';
import {
  OpsAuditService,
  type OpsAuditContext,
} from './ops-audit.service';

const DESTINATION_VISIBLE_STATUSES = new Set<string>([
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'SCAN_INBOUND',
  'INVENTORY_CHECK',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
]);

export interface OpsTaskScopeContext {
  hubCodes: string[];
  canAccessAllHubs: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(TaskRepository)
    private readonly taskRepository: TaskRepository,
    private readonly dispatchOutboxService: DispatchOutboxService,
    private readonly tasksRealtimeGateway: TasksRealtimeGateway,
    private readonly opsAuditService: OpsAuditService,
  ) {}

  async list(
    filters: {
      courierId?: string;
      taskType?: string;
      status?: string;
      shipmentCode?: string;
      pickupRequestId?: string;
    },
    opsScope?: OpsTaskScopeContext,
  ): Promise<Task[]> {
    const normalizedFilters: ListTasksFilters = {
      courierId: filters.courierId?.trim() || undefined,
      shipmentCode: filters.shipmentCode?.trim() || undefined,
      pickupRequestId: filters.pickupRequestId?.trim() || undefined,
      taskType: this.normalizeTaskType(filters.taskType),
      status: this.normalizeTaskStatus(filters.status),
    };

    return this.filterTasksByOpsScope(
      await this.taskRepository.list(normalizedFilters),
      opsScope,
    );
  }

  async listCouriers(): Promise<string[]> {
    const configuredCouriers = (process.env.DISPATCH_COURIER_OPTIONS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const assignedCouriers = await this.taskRepository.listCourierIds();

    return Array.from(new Set([...configuredCouriers, ...assignedCouriers])).sort(
      (left, right) => left.localeCompare(right),
    );
  }

  async getById(id: string, opsScope?: OpsTaskScopeContext): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task "${id}" was not found.`);
    }

    await this.ensureTaskVisibleToOps(task, opsScope);
    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task = await this.taskRepository.create(input);
    this.tasksRealtimeGateway.publishTaskChanged('created', task);
    return task;
  }

  async assign(
    id: string,
    input: AssignTaskInput,
    auditContext?: OpsAuditContext,
  ): Promise<Task> {
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

    const task = await this.taskRepository.assign(id, input);

    await this.dispatchOutboxService.enqueueTaskAssigned(task, {
      actorId: auditContext?.actorId,
      actorUsername: auditContext?.actorUsername,
      hubCode: input.hubCode,
    });
    this.tasksRealtimeGateway.publishTaskChanged('assigned', task);
    await this.opsAuditService.record({
      context: auditContext,
      action: 'TASK_ASSIGNED',
      targetType: 'TASK',
      targetId: task.id,
      before: currentTask,
      after: task,
    });

    return task;
  }

  async reassign(
    id: string,
    input: ReassignTaskInput,
    auditContext?: OpsAuditContext,
  ): Promise<Task> {
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

    const task = await this.taskRepository.reassign(id, input);

    await this.dispatchOutboxService.enqueueTaskAssigned(task, {
      actorId: auditContext?.actorId,
      actorUsername: auditContext?.actorUsername,
      hubCode: input.hubCode,
    });
    this.tasksRealtimeGateway.publishTaskChanged('reassigned', task);
    await this.opsAuditService.record({
      context: auditContext,
      action: 'TASK_REASSIGNED',
      targetType: 'TASK',
      targetId: task.id,
      before: currentTask,
      after: task,
    });

    return task;
  }

  async updateStatus(
    id: string,
    input: UpdateTaskStatusInput,
    opsScope?: OpsTaskScopeContext,
  ): Promise<Task> {
    const currentTask = await this.getById(id, opsScope);

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
    this.tasksRealtimeGateway.publishTaskChanged('status_updated', task);
    return task;
  }

  async createTaskFromPickupApproved(payload: {
    pickup_request_id?: string | null;
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task> {
    const pickupRequestId = payload.pickup_request_id?.trim() ?? null;
    const shipmentCode = payload.shipment_code?.trim() ?? null;

    if (pickupRequestId) {
      const existingTask = await this.taskRepository.findByPickupRequestId(
        pickupRequestId,
      );
      if (existingTask) {
        return existingTask;
      }
    }

    if (shipmentCode) {
      const existingPickupTask = await this.taskRepository.list({
        shipmentCode,
        taskType: 'PICKUP',
      });
      if (existingPickupTask.length > 0) {
        return existingPickupTask[0];
      }
    }

    const task = await this.create({
      taskCode: `task-${randomUUID()}`,
      taskType: 'PICKUP',
      pickupRequestId,
      shipmentCode,
      note: payload.note ?? null,
    });

    return task;
  }

  async handleDeliveryFailed(payload: {
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task | null> {
    void payload;
    return null;
  }

  async handleReturnStarted(payload: {
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task | null> {
    const shipmentCode = payload.shipment_code?.trim() || null;

    if (!shipmentCode) {
      return null;
    }

    const existingReturnTasks = await this.taskRepository.list({
      shipmentCode,
      taskType: 'RETURN',
    });
    const activeReturnTask = existingReturnTasks.find(
      (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
    );

    if (activeReturnTask) {
      return activeReturnTask;
    }

    const taskType: TaskType = 'RETURN';
    const task = await this.create({
      taskCode: `task-${randomUUID()}`,
      taskType,
      shipmentCode,
      note: payload.note ?? 'generated_from_return_started',
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

  private async filterTasksByOpsScope(
    tasks: Task[],
    opsScope?: OpsTaskScopeContext,
  ): Promise<Task[]> {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return tasks;
    }

    if (opsScope.hubCodes.length === 0) {
      return [];
    }

    const visibleTasks: Task[] = [];
    for (const task of tasks) {
      if (await this.isTaskVisibleToOps(task, opsScope)) {
        visibleTasks.push(task);
      }
    }

    return visibleTasks;
  }

  private async ensureTaskVisibleToOps(
    task: Task,
    opsScope?: OpsTaskScopeContext,
  ): Promise<void> {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return;
    }

    if (
      opsScope.hubCodes.length === 0 ||
      !(await this.isTaskVisibleToOps(task, opsScope))
    ) {
      throw new ForbiddenException(
        'Tài khoản OPS không có quyền xem tác vụ ngoài phạm vi hub được gán.',
      );
    }
  }

  private async isTaskVisibleToOps(
    task: Task,
    opsScope: OpsTaskScopeContext,
  ): Promise<boolean> {
    const taskHubCodes = await this.resolveTaskHubCodes(task);
    return taskHubCodes.some((hubCode) =>
      opsScope.hubCodes.some((assignedHubCode) =>
        isSameHubOrScopedLocation(hubCode, assignedHubCode),
      ),
    );
  }

  private async resolveTaskHubCodes(task: Task): Promise<string[]> {
    const hubCodes = new Set<string>(collectHubCodes(task));

    if (task.shipmentCode) {
      const shipmentHubCodes = await this.resolveShipmentHubCodes(
        task.shipmentCode,
      );
      shipmentHubCodes.forEach((hubCode) => hubCodes.add(hubCode));
    }

    if (task.pickupRequestId) {
      const pickup = await this.fetchServiceJson(
        'PICKUP_SERVICE_URL',
        `pickups/${encodeURIComponent(task.pickupRequestId)}`,
      );
      const pickupRecord = asRecord(pickup);
      const pickupItems = Array.isArray(pickupRecord?.items)
        ? pickupRecord.items
        : [];

      for (const item of pickupItems) {
        const shipmentCode = normalizeNonEmptyString(asRecord(item)?.shipmentCode);
        if (!shipmentCode) {
          continue;
      }

        const shipmentHubCodes = await this.resolveShipmentHubCodes(
          shipmentCode,
        );
        shipmentHubCodes.forEach((hubCode) => hubCodes.add(hubCode));
      }
    }

    return [...hubCodes];
  }

  private async resolveShipmentHubCodes(shipmentCode: string): Promise<string[]> {
    const shipment = await this.fetchServiceJson(
      'SHIPMENT_SERVICE_URL',
      `shipments/${encodeURIComponent(shipmentCode)}`,
    );

    return collectHubCodes(shipment);
  }

  private async fetchServiceJson(
    serviceUrlEnv: 'SHIPMENT_SERVICE_URL' | 'PICKUP_SERVICE_URL',
    path: string,
  ): Promise<unknown> {
    const baseUrl = process.env[serviceUrlEnv]?.trim();
    if (!baseUrl) {
      return null;
    }

    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      redirect: 'manual',
    });

    if (!response.ok) {
      return null;
    }

    return response.json().catch(() => null);
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toUpperCase()
    : null;
}

function normalizeNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter((item): item is string => item !== null),
    ),
  );
}

function collectHubCodes(value: unknown): string[] {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const directCodes = [
    record.hubCode,
    record.currentHubCode,
    record.currentLocation,
    record.locationCode,
    record.originHubCode,
    record.senderHubCode,
    record.reportedHubCode,
  ];
  const metadataCodes = collectMetadataHubCodes(asRecord(record.metadata));
  const destinationCodes = DESTINATION_VISIBLE_STATUSES.has(
    normalizeString(record.currentStatus) ?? '',
  )
    ? collectDestinationHubCodes(asRecord(record.metadata))
    : [];

  return normalizeStringList([...directCodes, ...metadataCodes, ...destinationCodes]);
}

function collectMetadataHubCodes(metadata: Record<string, unknown> | null): unknown[] {
  if (!metadata) {
    return [];
  }

  const sender = asRecord(metadata.sender);
  const routing = asRecord(metadata.routing);
  const location = asRecord(metadata.location);
  const hub = asRecord(metadata.hub);

  return [
    metadata.senderHubCode,
    metadata.originHubCode,
    metadata.currentHubCode,
    metadata.currentLocation,
    sender?.hubCode,
    routing?.originHubCode,
    location?.hubCode,
    location?.current,
    hub?.code,
    hub?.currentCode,
  ];
}

function collectDestinationHubCodes(
  metadata: Record<string, unknown> | null,
): unknown[] {
  if (!metadata) {
    return [];
  }

  const receiver = asRecord(metadata.receiver);
  const routing = asRecord(metadata.routing);

  return [
    metadata.receiverHubCode,
    metadata.destinationHubCode,
    receiver?.hubCode,
    routing?.destinationHubCode,
  ];
}

function isSameHubOrScopedLocation(
  targetCode: string,
  assignedHubCode: string,
): boolean {
  return (
    targetCode === assignedHubCode ||
    targetCode.startsWith(`${assignedHubCode}-`) ||
    targetCode.startsWith(`${assignedHubCode}_`) ||
    targetCode.startsWith(`${assignedHubCode}.`)
  );
}
