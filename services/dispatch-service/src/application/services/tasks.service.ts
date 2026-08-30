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
import {
  normalizeWardKey,
  parseVietnameseAddress,
} from '../utils/vietnamese-address-parser.utility';

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

  private readonly pickupTaskCreationPromises = new Map<string, Promise<Task>>();

  async createTaskFromPickupApproved(payload: {
    pickup_request_id?: string | null;
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task> {
    const pickupRequestId = payload.pickup_request_id?.trim() ?? null;
    const shipmentCode = payload.shipment_code?.trim()?.toUpperCase() ?? null;

    if (shipmentCode && this.pickupTaskCreationPromises.has(shipmentCode)) {
      await this.pickupTaskCreationPromises.get(shipmentCode)?.catch(() => undefined);
    }

    if (pickupRequestId) {
      const existingTask = await this.taskRepository.findByPickupRequestId(
        pickupRequestId,
      );
      if (existingTask) {
        return existingTask;
      }
    }

    if (shipmentCode) {
      const existingPickupTasks = await this.taskRepository.list({
        shipmentCode,
        taskType: 'PICKUP',
      });
      const activeTask = existingPickupTasks.find(
        (t) => t.status !== 'CANCELLED',
      );
      if (activeTask) {
        if (pickupRequestId && !activeTask.pickupRequestId) {
          return this.taskRepository.updatePickupRequestId(
            activeTask.id,
            pickupRequestId,
          );
        }
        return activeTask;
      }
    }

    const executeCreate = async (): Promise<Task> => {
      const task = await this.create({
        taskCode: `task-${randomUUID()}`,
        taskType: 'PICKUP',
        pickupRequestId,
        shipmentCode,
        note: payload.note ?? null,
      });

      if (shipmentCode) {
        void this.autoAssignPickupTask(task.id, shipmentCode);
      }

      return task;
    };

    const creationPromise = executeCreate();
    if (shipmentCode) {
      this.pickupTaskCreationPromises.set(shipmentCode, creationPromise);
    }

    try {
      const createdTask = await creationPromise;
      return createdTask;
    } finally {
      if (shipmentCode) {
        this.pickupTaskCreationPromises.delete(shipmentCode);
      }
    }
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

    // Cancel active delivery / redelivery tasks so courier app clears the task
    const activeDeliveryTasks = await this.taskRepository.list({
      shipmentCode,
      taskType: 'DELIVERY',
    });
    for (const deliveryTask of activeDeliveryTasks) {
      if (deliveryTask.status !== 'COMPLETED' && deliveryTask.status !== 'CANCELLED') {
        await this.taskRepository.updateStatus(deliveryTask.id, {
          status: 'CANCELLED',
        });
      }
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

  async autoAssignDeliveryTask(
    shipmentCode: string,
    locationCode: string,
  ): Promise<Task | null> {
    const shipment = await this.fetchServiceJson(
      'SHIPMENT_SERVICE_URL',
      `shipments/${encodeURIComponent(shipmentCode)}`,
    );

    if (!shipment) {
      return null;
    }

    const shipmentRecord = asRecord(shipment);
    const metadata = asRecord(shipmentRecord?.metadata);
    const receiver = asRecord(metadata?.receiver);

    const routing = asRecord(metadata?.routing);
    const destinationHubCode = normalizeNonEmptyString(
      routing?.destinationHubCode ?? receiver?.hubCode ?? metadata?.receiverHubCode,
    );

    if (!destinationHubCode) {
      return null;
    }

    if (locationCode.toUpperCase() !== destinationHubCode.toUpperCase()) {
      return null;
    }

    const receiverAddressText = normalizeNonEmptyString(
      receiver?.address ?? receiver?.addressDetail ?? metadata?.receiverAddress,
    );

    const parsedAddress = parseVietnameseAddress(receiverAddressText, {
      province: normalizeNonEmptyString(receiver?.province),
      district: normalizeNonEmptyString(receiver?.district),
      ward: normalizeNonEmptyString(receiver?.ward),
    });

    const province = parsedAddress.province;
    const district = parsedAddress.district;
    const ward = parsedAddress.ward;

    if (!province || !district || !ward) {
      return this.getOrCreateUnassignedDeliveryTask(
        shipmentCode,
        'Thiếu hoặc không cắt được đủ địa chỉ (Phường/Quận/Tỉnh) để tự động gán',
      );
    }

    const masterdataUrl = process.env.MASTERDATA_SERVICE_URL?.trim();
    if (!masterdataUrl) {
      return this.getOrCreateUnassignedDeliveryTask(
        shipmentCode,
        'Không tìm thấy cấu hình MASTERDATA_SERVICE_URL',
      );
    }

    const query = new URLSearchParams({
      hubCode: destinationHubCode,
      province,
      district,
      ward,
      isActive: 'true',
    });

    const url = new URL(
      `courier-area-assignments?${query.toString()}`,
      masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`,
    );

    let assignments: any = null;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      });

      if (response.ok) {
        assignments = await response.json().catch(() => null);
      }
    } catch (error) {
      // Ignore network error and default to unassigned
    }

    let assignmentList = Array.isArray(assignments) ? assignments : [];

    // Fallback: nếu truy vấn trùng khớp hoàn toàn chuỗi trả về rỗng, thử tải phân công của hub và so khớp linh hoạt tên Phường
    if (assignmentList.length === 0) {
      try {
        const fallbackQuery = new URLSearchParams({
          hubCode: destinationHubCode,
          isActive: 'true',
        });
        const fallbackUrl = new URL(
          `courier-area-assignments?${fallbackQuery.toString()}`,
          masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`,
        );
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers: { accept: 'application/json' },
        });

        if (fallbackResponse.ok) {
          const allHubAssignments = await fallbackResponse.json().catch(() => []);
          if (Array.isArray(allHubAssignments)) {
            const targetWardKey = normalizeWardKey(ward);
            assignmentList = allHubAssignments.filter((item: any) => {
              return normalizeWardKey(item.ward) === targetWardKey;
            });
          }
        }
      } catch (error) {
        // Ignore fallback error
      }
    }

    const firstAssignment = assignmentList[0];

    if (!firstAssignment || !firstAssignment.courierId) {
      return this.getOrCreateUnassignedDeliveryTask(
        shipmentCode,
        `Không tìm thấy shipper phụ trách tuyến ${ward}, ${district}, ${province}`,
      );
    }

    const courierId = firstAssignment.courierId;

    const existingTasks = await this.taskRepository.list({
      shipmentCode,
      taskType: 'DELIVERY',
    });
    const activeTask = existingTasks.find(
      (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
    );

    if (activeTask) {
      if (activeTask.status === 'CREATED') {
        return this.assign(
          activeTask.id,
          {
            courierId,
            hubCode: destinationHubCode,
            note: `Hệ thống tự động điều phối giao hàng cho Shipper ${courierId} theo phân vùng: ${ward}, ${district} thuộc bưu cục ${destinationHubCode}`,
          },
          {
            actorId: 'SYSTEM',
            actorUsername: 'SYSTEM_AUTO_DISPATCH',
            ipAddress: '127.0.0.1',
            userAgent: 'DispatchService-AutoEngine',
          },
        );
      }

      return activeTask;
    }

    const task = await this.create({
      taskCode: `DLV-AUTO-${randomUUID()}`,
      taskType: 'DELIVERY',
      shipmentCode,
      note: `Hệ thống tự động tạo và phân công giao hàng cho Shipper ${courierId} theo phân vùng: ${ward}, ${district}`,
    });

    return this.assign(
      task.id,
      {
        courierId,
        hubCode: destinationHubCode,
        note: `Hệ thống tự động điều phối theo phân vùng tuyến: ${ward}, ${district} thuộc bưu cục ${destinationHubCode}`,
      },
      {
        actorId: 'SYSTEM',
        actorUsername: 'SYSTEM_AUTO_DISPATCH',
        ipAddress: '127.0.0.1',
        userAgent: 'DispatchService-AutoEngine',
      },
    );
  }

  async autoAssignPickupTask(
    taskId: string,
    shipmentCode: string,
  ): Promise<Task | null> {
    const shipment = await this.fetchServiceJson(
      'SHIPMENT_SERVICE_URL',
      `shipments/${encodeURIComponent(shipmentCode)}`,
    );

    if (!shipment) {
      return null;
    }

    const shipmentRecord = asRecord(shipment);
    const metadata = asRecord(shipmentRecord?.metadata);
    const sender = asRecord(metadata?.sender);
    const routing = asRecord(metadata?.routing);

    const originHubCode = normalizeNonEmptyString(
      routing?.originHubCode ?? sender?.hubCode ?? metadata?.senderHubCode,
    );

    if (!originHubCode) {
      return null;
    }

    const senderAddressText = normalizeNonEmptyString(
      sender?.address ?? sender?.addressDetail ?? metadata?.senderAddress,
    );

    const parsedAddress = parseVietnameseAddress(senderAddressText, {
      province: normalizeNonEmptyString(sender?.province),
      district: normalizeNonEmptyString(sender?.district),
      ward: normalizeNonEmptyString(sender?.ward),
    });

    const province = parsedAddress.province;
    const district = parsedAddress.district;
    const ward = parsedAddress.ward;

    if (!province || !ward) {
      return null;
    }

    const masterdataUrl = process.env.MASTERDATA_SERVICE_URL?.trim();
    if (!masterdataUrl) {
      return null;
    }

    const queryParams: Record<string, string> = {
      hubCode: originHubCode,
      province,
      ward,
      isActive: 'true',
    };
    if (district) {
      queryParams.district = district;
    }

    const query = new URLSearchParams(queryParams);

    const url = new URL(
      `courier-area-assignments?${query.toString()}`,
      masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`,
    );

    let assignments: any = null;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      if (response.ok) {
        assignments = await response.json().catch(() => null);
      }
    } catch {
      // Ignore network error
    }

    let assignmentList = Array.isArray(assignments) ? assignments : [];

    if (assignmentList.length === 0) {
      try {
        const fallbackQuery = new URLSearchParams({
          hubCode: originHubCode,
          isActive: 'true',
        });
        const fallbackUrl = new URL(
          `courier-area-assignments?${fallbackQuery.toString()}`,
          masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`,
        );
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers: { accept: 'application/json' },
        });

        if (fallbackResponse.ok) {
          const allHubAssignments = await fallbackResponse.json().catch(() => []);
          if (Array.isArray(allHubAssignments)) {
            const targetWardKey = normalizeWardKey(ward);
            assignmentList = allHubAssignments.filter((item: any) => {
              return normalizeWardKey(item.ward) === targetWardKey;
            });
          }
        }
      } catch {
        // Ignore fallback error
      }
    }

    const firstAssignment = assignmentList[0];
    if (!firstAssignment || !firstAssignment.courierId) {
      return null;
    }

    const courierId = firstAssignment.courierId;
    return this.assign(
      taskId,
      {
        courierId,
        hubCode: originHubCode,
        note: `Hệ thống tự động điều phối lấy hàng cho Shipper ${courierId} theo phân vùng: ${ward}, ${district || ''} thuộc bưu cục ${originHubCode}`,
      },
      {
        actorId: 'SYSTEM',
        actorUsername: 'SYSTEM_AUTO_DISPATCH',
        ipAddress: '127.0.0.1',
        userAgent: 'DispatchService-AutoEngine',
      },
    ).catch(() => null);
  }

  private async getOrCreateUnassignedDeliveryTask(
    shipmentCode: string,
    reason: string,
  ): Promise<Task> {
    const existingTasks = await this.taskRepository.list({
      shipmentCode,
      taskType: 'DELIVERY',
    });
    const activeTask = existingTasks.find(
      (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
    );

    if (activeTask) {
      return activeTask;
    }

    return this.create({
      taskCode: `DLV-AUTO-${randomUUID()}`,
      taskType: 'DELIVERY',
      shipmentCode,
      note: `Chờ gán thủ công: ${reason}`,
    });
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
  if (
    targetCode === assignedHubCode ||
    targetCode.startsWith(`${assignedHubCode}-`) ||
    targetCode.startsWith(`${assignedHubCode}_`) ||
    targetCode.startsWith(`${assignedHubCode}.`)
  ) {
    return true;
  }

  // Regional hub matching (e.g. 003S001 regional hub matches 003079B001 branch hub)
  if (assignedHubCode.length >= 3 && targetCode.length >= 3) {
    const assignedRegion = assignedHubCode.substring(0, 3);
    const targetRegion = targetCode.substring(0, 3);
    if (assignedRegion === targetRegion) {
      return true;
    }
  }

  return false;
}
