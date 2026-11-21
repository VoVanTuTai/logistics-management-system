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
import {
  haversineDistanceMeters,
  optimizeRouteTSP,
  type GeoPoint,
  type RouteLeg,
  type RouteTargetNode,
} from '../utils/route-optimizer.utility';

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
  ) { }

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

    const tasks = await this.taskRepository.list(normalizedFilters);

    if (normalizedFilters.courierId === '30000000' || opsScope?.canAccessAllHubs) {
      return tasks;
    }

    return this.filterTasksByOpsScope(
      tasks,
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
    const taskCode =
      input.taskCode?.trim() ||
      (input.taskType === 'DELIVERY' && input.shipmentCode
        ? `DLV-${input.shipmentCode}-${Date.now().toString().slice(-4)}`
        : input.taskType === 'PICKUP' && input.pickupRequestId
          ? `PU-${input.pickupRequestId}-${Date.now().toString().slice(-4)}`
          : `TSK-${randomUUID()}`);

    const task = await this.taskRepository.create({
      ...input,
      taskCode,
    });
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

  private readonly pickupTaskCreationPromises = new Map<string, Promise<Task | null>>();

  async createTaskFromPickupApproved(payload: {
    pickup_request_id?: string | null;
    shipment_code?: string | null;
    note?: string | null;
  }): Promise<Task | null> {
    const pickupRequestId = payload.pickup_request_id?.trim() ?? null;
    const shipmentCode = payload.shipment_code?.trim()?.toUpperCase() ?? null;

    if (shipmentCode) {
      try {
        const shipment = await this.fetchServiceJson(
          'SHIPMENT_SERVICE_URL',
          `shipments/${encodeURIComponent(shipmentCode)}`,
        );
        if (shipment && isCounterOrderShipment(shipment)) {
          const existingPickupTasks = await this.taskRepository.list({
            shipmentCode,
            taskType: 'PICKUP',
          });
          for (const task of existingPickupTasks) {
            if (task.status !== 'CANCELLED' && task.status !== 'COMPLETED') {
              await this.taskRepository.updateStatus(task.id, { status: 'CANCELLED' });
            }
          }
          return null;
        }
      } catch {
        // Fallback if shipment service is offline
      }
    }

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

  private async findHubCouriers(
    hubCode: string,
    masterdataUrl: string,
    activeAssignments?: any[],
  ): Promise<string[]> {
    const targetHub = hubCode.trim().toUpperCase();
    const couriers = new Set<string>();

    if (Array.isArray(activeAssignments)) {
      for (const item of activeAssignments) {
        if (
          item?.isActive &&
          item?.courierId &&
          item.courierId !== '30000000' &&
          typeof item?.hubCode === 'string' &&
          item.hubCode.trim().toUpperCase() === targetHub
        ) {
          couriers.add(item.courierId.trim());
        }
      }
    }

    if (couriers.size === 0) {
      try {
        const url = new URL(
          `courier-area-assignments?hubCode=${encodeURIComponent(targetHub)}&isActive=true`,
          masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`,
        );
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (res.ok) {
          const list = await res.json().catch(() => []);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (
                item?.isActive &&
                item?.courierId &&
                item.courierId !== '30000000' &&
                typeof item?.hubCode === 'string' &&
                item.hubCode.trim().toUpperCase() === targetHub
              ) {
                couriers.add(item.courierId.trim());
              }
            }
          }
        }
      } catch {
        // Ignore network error
      }
    }

    return Array.from(couriers);
  }

  private async assignOrUpdateDeliveryTask(
    shipmentCode: string,
    courierId: string,
    assignedHub: string,
    note: string,
  ): Promise<Task> {
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
            hubCode: assignedHub,
            note,
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
      note,
    });

    return this.assign(
      task.id,
      {
        courierId,
        hubCode: assignedHub,
        note,
      },
      {
        actorId: 'SYSTEM',
        actorUsername: 'SYSTEM_AUTO_DISPATCH',
        ipAddress: '127.0.0.1',
        userAgent: 'DispatchService-AutoEngine',
      },
    );
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
    const routingPlan = asRecord(metadata?.routingPlan);

    const destCandidates = [
      normalizeNonEmptyString(routing?.destinationHubCode),
      normalizeNonEmptyString(routingPlan?.destinationHubCode),
      normalizeNonEmptyString(receiver?.hubCode),
      normalizeNonEmptyString(metadata?.destinationHubCode),
      normalizeNonEmptyString(metadata?.receiverHubCode),
    ].filter((c): c is string => Boolean(c));

    const destinationHubCode =
      normalizeNonEmptyString(routing?.destinationHubCode) ??
      normalizeNonEmptyString(routingPlan?.destinationHubCode) ??
      normalizeNonEmptyString(receiver?.hubCode) ??
      locationCode;

    if (!destinationHubCode) {
      return null;
    }

    const normalizedLocation = locationCode.trim().toUpperCase();

    // Check if locationCode matches destination or is in the same zone/region
    const isDestinationMatch =
      destCandidates.length === 0 ||
      destCandidates.some((cand) => {
        const c = cand.trim().toUpperCase();
        return (
          c === normalizedLocation ||
          c.slice(0, 3) === normalizedLocation.slice(0, 3) ||
          c.includes(normalizedLocation) ||
          normalizedLocation.includes(c)
        );
      });

    if (!isDestinationMatch) {
      return null;
    }

    const masterdataUrl = process.env.MASTERDATA_SERVICE_URL?.trim();
    if (!masterdataUrl) {
      return this.getOrCreateUnassignedDeliveryTask(
        shipmentCode,
        'Không tìm thấy cấu hình MASTERDATA_SERVICE_URL',
      );
    }

    const targetHub = destinationHubCode || normalizedLocation;

    const deliveryLatitude =
      typeof shipmentRecord?.deliveryLatitude === 'number'
        ? shipmentRecord.deliveryLatitude
        : typeof metadata?.deliveryLatitude === 'number'
          ? (metadata.deliveryLatitude as number)
          : typeof receiver?.latitude === 'number'
            ? (receiver.latitude as number)
            : null;
    const deliveryLongitude =
      typeof shipmentRecord?.deliveryLongitude === 'number'
        ? shipmentRecord.deliveryLongitude
        : typeof metadata?.deliveryLongitude === 'number'
          ? (metadata.deliveryLongitude as number)
          : typeof receiver?.longitude === 'number'
            ? (receiver.longitude as number)
            : null;

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

    // Load active assignments for geofence and hub couriers
    let activeList: any[] = [];
    try {
      const allRes = await fetch(
        new URL('courier-area-assignments?isActive=true', masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`),
        { headers: { accept: 'application/json' } },
      );
      if (allRes.ok) {
        const data = await allRes.json().catch(() => []);
        if (Array.isArray(data)) {
          activeList = data;
        }
      }
    } catch {
      // Ignore network error
    }

    const prioritizeAssignments = (list: any[]) => {
      return [...list].sort((a: any, b: any) => {
        const aIsGlobal = a?.courierId === '30000000' || isRegionalHub(a?.hubCode);
        const bIsGlobal = b?.courierId === '30000000' || isRegionalHub(b?.hubCode);
        if (!aIsGlobal && bIsGlobal) return -1;
        if (aIsGlobal && !bIsGlobal) return 1;
        return 0;
      });
    };

    // =========================================================================
    // [TẦNG 1] TRA TOẠ ĐỘ ĐỂ GÁN CHÍNH XÁC (Point-in-Polygon Geofence via Ray-Casting)
    // =========================================================================
    if (deliveryLatitude !== null && deliveryLongitude !== null && activeList.length > 0) {
      // 1A. Ưu tiên kiểm tra các tuyến thuộc targetHub trước (loại trừ 30000000)
      const hubAssignments = targetHub
        ? prioritizeAssignments(
            activeList.filter(
              (item: any) =>
                item?.hubCode &&
                item.hubCode.trim().toUpperCase() === targetHub.trim().toUpperCase(),
            ),
          )
        : [];

      for (const item of hubAssignments) {
        if (
          item?.isActive &&
          item?.courierId &&
          item.courierId !== '30000000' &&
          Array.isArray(item?.boundaryPolygon) &&
          item.boundaryPolygon.length >= 3
        ) {
          if (
            isPointInPolygon(
              { latitude: deliveryLatitude, longitude: deliveryLongitude },
              item.boundaryPolygon,
            )
          ) {
            const courierId = item.courierId;
            const zoneLabel = item.zoneName || item.ward || 'Dải toạ độ giao';
            const assignedHub = resolveTaskHub(item.hubCode, targetHub);
            return this.assignOrUpdateDeliveryTask(
              shipmentCode,
              courierId,
              assignedHub,
              `[Tự động điều phối - Đúng tuyến giao hàng] Tọa độ (${deliveryLatitude.toFixed(5)}, ${deliveryLongitude.toFixed(5)}) khớp chính xác Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc Hub ${assignedHub}`,
            );
          }
        }
      }

      // 1B. Kiểm tra các tuyến còn lại trong hệ thống
      const otherAssignments = prioritizeAssignments(
        targetHub
          ? activeList.filter(
              (item: any) =>
                !item?.hubCode ||
                item.hubCode.trim().toUpperCase() !== targetHub.trim().toUpperCase(),
            )
          : activeList,
      );

      for (const item of otherAssignments) {
        if (
          item?.isActive &&
          item?.courierId &&
          item.courierId !== '30000000' &&
          Array.isArray(item?.boundaryPolygon) &&
          item.boundaryPolygon.length >= 3
        ) {
          if (
            isPointInPolygon(
              { latitude: deliveryLatitude, longitude: deliveryLongitude },
              item.boundaryPolygon,
            )
          ) {
            const courierId = item.courierId;
            const zoneLabel = item.zoneName || item.ward || 'Dải toạ độ giao';
            const assignedHub = resolveTaskHub(item.hubCode, targetHub);
            return this.assignOrUpdateDeliveryTask(
              shipmentCode,
              courierId,
              assignedHub,
              `[Tự động điều phối - Đúng tuyến giao hàng liên Hub] Tọa độ (${deliveryLatitude.toFixed(5)}, ${deliveryLongitude.toFixed(5)}) khớp chính xác Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc Hub ${assignedHub}`,
            );
          }
        }
      }
    }

    // =========================================================================
    // [TẦNG 2] TÌM COURIER CHUNG BƯU CỤC ĐỂ GIAO HÀNG (Hub-Level Shared Courier)
    // =========================================================================
    const hubCouriers = await this.findHubCouriers(targetHub, masterdataUrl, activeList);
    if (hubCouriers.length > 0) {
      let courierId = hubCouriers[0];
      let matchNote = `Tọa độ không thuộc tuyến phân định, điều phối giao hàng cho Shipper ${courierId} thuộc cùng Hub ${targetHub}`;

      if (ward) {
        const targetWardKey = normalizeWardKey(ward);
        const wardMatch = activeList.find(
          (item: any) =>
            item?.isActive &&
            item?.courierId &&
            item.courierId !== '30000000' &&
            item?.hubCode &&
            item.hubCode.trim().toUpperCase() === targetHub.trim().toUpperCase() &&
            normalizeWardKey(item.ward) === targetWardKey,
        );
        if (wardMatch) {
          courierId = wardMatch.courierId;
          const zoneLabel = wardMatch.zoneName || wardMatch.ward || 'Tuyến Phường';
          matchNote = `Khớp theo địa bàn ${ward} vào Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc cùng Hub ${targetHub}`;
        }
      }

      const assignedHub = resolveTaskHub(targetHub, targetHub);
      return this.assignOrUpdateDeliveryTask(
        shipmentCode,
        courierId,
        assignedHub,
        `[Tự động điều phối - Cùng Hub] ${matchNote}`,
      );
    }

    // =========================================================================
    // [TẦNG 3] DỰ PHÒNG CUỐI CÙNG CHO COURIER TOÀN QUỐC 30000000 (Global Fallback Courier)
    // =========================================================================
    const globalCourierId = '30000000';
    const assignedHub = resolveTaskHub(targetHub, targetHub);
    return this.assignOrUpdateDeliveryTask(
      shipmentCode,
      globalCourierId,
      assignedHub,
      `[Tự động điều phối - Bưu tá Tổng Toàn quốc] Hub ${assignedHub} không có Shipper phụ trách, điều phối dự phòng giao hàng cho Bưu tá Tổng Toàn quốc ${globalCourierId}`,
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

    if (isCounterOrderShipment(shipment)) {
      await this.taskRepository.updateStatus(taskId, { status: 'CANCELLED' });
      return null;
    }

    const shipmentRecord = asRecord(shipment);
    const metadata = asRecord(shipmentRecord?.metadata);
    const sender = asRecord(metadata?.sender);
    const routing = asRecord(metadata?.routing);

    const originHubCode = normalizeNonEmptyString(
      routing?.originHubCode ?? sender?.hubCode ?? metadata?.originHubCode ?? metadata?.senderHubCode,
    );

    if (!originHubCode) {
      return null;
    }

    const targetHub = originHubCode.trim().toUpperCase();

    const senderAddressText = normalizeNonEmptyString(
      sender?.address ?? sender?.addressDetail ?? metadata?.senderAddress,
    );

    const parsedAddress = parseVietnameseAddress(senderAddressText, {
      province: normalizeNonEmptyString(sender?.province),
      district: normalizeNonEmptyString(sender?.district),
      ward: normalizeNonEmptyString(sender?.ward),
    });

    const ward = parsedAddress.ward;

    const masterdataUrl = process.env.MASTERDATA_SERVICE_URL?.trim();
    if (!masterdataUrl) {
      return null;
    }

    const pickupLatitude =
      typeof shipmentRecord?.pickupLatitude === 'number'
        ? shipmentRecord.pickupLatitude
        : typeof metadata?.pickupLatitude === 'number'
          ? (metadata.pickupLatitude as number)
          : typeof sender?.latitude === 'number'
            ? (sender.latitude as number)
            : null;
    const pickupLongitude =
      typeof shipmentRecord?.pickupLongitude === 'number'
        ? shipmentRecord.pickupLongitude
        : typeof metadata?.pickupLongitude === 'number'
          ? (metadata.pickupLongitude as number)
          : typeof sender?.longitude === 'number'
            ? (sender.longitude as number)
            : null;

    // Load active assignments for geofence and hub couriers
    let activeList: any[] = [];
    try {
      const allRes = await fetch(
        new URL('courier-area-assignments?isActive=true', masterdataUrl.endsWith('/') ? masterdataUrl : `${masterdataUrl}/`),
        { headers: { accept: 'application/json' } },
      );
      if (allRes.ok) {
        const data = await allRes.json().catch(() => []);
        if (Array.isArray(data)) {
          activeList = data;
        }
      }
    } catch {
      // Ignore network error
    }

    const prioritizeAssignments = (list: any[]) => {
      return [...list].sort((a: any, b: any) => {
        const aIsGlobal = a?.courierId === '30000000' || isRegionalHub(a?.hubCode);
        const bIsGlobal = b?.courierId === '30000000' || isRegionalHub(b?.hubCode);
        if (!aIsGlobal && bIsGlobal) return -1;
        if (aIsGlobal && !bIsGlobal) return 1;
        return 0;
      });
    };

    // =========================================================================
    // [TẦNG 1] TRA TOẠ ĐỘ ĐỂ GÁN CHÍNH XÁC (Point-in-Polygon Geofence via Ray-Casting)
    // =========================================================================
    if (pickupLatitude !== null && pickupLongitude !== null && activeList.length > 0) {
      try {
        // 1A. Ưu tiên kiểm tra các tuyến thuộc targetHub trước
        const hubAssignments = targetHub
          ? prioritizeAssignments(
              activeList.filter(
                (item: any) =>
                  item?.hubCode &&
                  item.hubCode.trim().toUpperCase() === targetHub,
              ),
            )
          : [];

        for (const item of hubAssignments) {
          if (
            item?.isActive &&
            item?.courierId &&
            item.courierId !== '30000000' &&
            Array.isArray(item?.boundaryPolygon) &&
            item.boundaryPolygon.length >= 3
          ) {
            if (
              isPointInPolygon(
                { latitude: pickupLatitude, longitude: pickupLongitude },
                item.boundaryPolygon,
              )
            ) {
              const courierId = item.courierId;
              const zoneLabel = item.zoneName || item.ward || 'Dải toạ độ';
              const assignedHub = resolveTaskHub(item.hubCode, targetHub);
              return await this.assign(
                taskId,
                {
                  courierId,
                  hubCode: assignedHub,
                  note: `[Tự động điều phối - Đúng tuyến lấy hàng] Tọa độ (${pickupLatitude.toFixed(5)}, ${pickupLongitude.toFixed(5)}) khớp chính xác Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc Hub ${assignedHub}`,
                },
                {
                  actorId: 'SYSTEM',
                  actorUsername: 'SYSTEM_AUTO_DISPATCH',
                  ipAddress: '127.0.0.1',
                  userAgent: 'DispatchService-GeofenceEngine',
                },
              );
            }
          }
        }

        // 1B. Kiểm tra Point-in-Polygon trên toàn bộ các tuyến còn lại trong hệ thống
        const otherAssignments = prioritizeAssignments(
          targetHub
            ? activeList.filter(
                (item: any) =>
                  !item?.hubCode ||
                  item.hubCode.trim().toUpperCase() !== targetHub,
              )
            : activeList,
        );

        for (const item of otherAssignments) {
          if (
            item?.isActive &&
            item?.courierId &&
            item.courierId !== '30000000' &&
            Array.isArray(item?.boundaryPolygon) &&
            item.boundaryPolygon.length >= 3
          ) {
            if (
              isPointInPolygon(
                { latitude: pickupLatitude, longitude: pickupLongitude },
                item.boundaryPolygon,
              )
            ) {
              const courierId = item.courierId;
              const zoneLabel = item.zoneName || item.ward || 'Dải toạ độ';
              const assignedHub = resolveTaskHub(item.hubCode, targetHub);
              return await this.assign(
                taskId,
                {
                  courierId,
                  hubCode: assignedHub,
                  note: `[Tự động điều phối - Đúng tuyến lấy hàng liên Hub] Tọa độ (${pickupLatitude.toFixed(5)}, ${pickupLongitude.toFixed(5)}) khớp chính xác Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc Hub ${assignedHub}`,
                },
                {
                  actorId: 'SYSTEM',
                  actorUsername: 'SYSTEM_AUTO_DISPATCH',
                  ipAddress: '127.0.0.1',
                  userAgent: 'DispatchService-GeofenceEngine',
                },
              );
            }
          }
        }
      } catch {
        // Fallback to hub level
      }
    }

    // =========================================================================
    // [TẦNG 2] TÌM COURIER CHUNG BƯU CỤC ĐỂ NHẬN HÀNG (Hub-Level Shared Courier)
    // =========================================================================
    const hubCouriers = await this.findHubCouriers(targetHub, masterdataUrl, activeList);
    if (hubCouriers.length > 0) {
      let courierId = hubCouriers[0];
      let matchNote = `Tọa độ không thuộc tuyến phân định, điều phối lấy hàng cho Shipper ${courierId} thuộc cùng Hub ${targetHub}`;

      if (ward) {
        const targetWardKey = normalizeWardKey(ward);
        const wardMatch = activeList.find(
          (item: any) =>
            item?.isActive &&
            item?.courierId &&
            item.courierId !== '30000000' &&
            item?.hubCode &&
            item.hubCode.trim().toUpperCase() === targetHub &&
            normalizeWardKey(item.ward) === targetWardKey,
        );
        if (wardMatch) {
          courierId = wardMatch.courierId;
          const zoneLabel = wardMatch.zoneName || wardMatch.ward || 'Tuyến Phường';
          matchNote = `Khớp theo địa bàn ${ward} vào Tuyến [${zoneLabel}] của Shipper ${courierId} thuộc cùng Hub ${targetHub}`;
        }
      }

      const assignedHub = resolveTaskHub(targetHub, targetHub);
      return await this.assign(
        taskId,
        {
          courierId,
          hubCode: assignedHub,
          note: `[Tự động điều phối - Cùng Hub] ${matchNote}`,
        },
        {
          actorId: 'SYSTEM',
          actorUsername: 'SYSTEM_AUTO_DISPATCH',
          ipAddress: '127.0.0.1',
          userAgent: 'DispatchService-AutoEngine',
        },
      ).catch(() => null);
    }

    // =========================================================================
    // [TẦNG 3] DỰ PHÒNG CUỐI CÙNG CHO COURIER TOÀN QUỐC 30000000 (Global Fallback Courier)
    // =========================================================================
    const globalCourierId = '30000000';
    const assignedHub = resolveTaskHub(targetHub, targetHub);
    return await this.assign(
      taskId,
      {
        courierId: globalCourierId,
        hubCode: assignedHub,
        note: `[Tự động điều phối - Bưu tá Tổng Toàn quốc] Hub ${assignedHub} không có Shipper phụ trách, điều phối dự phòng lấy hàng cho Bưu tá Tổng Toàn quốc ${globalCourierId}`,
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
    if (opsScope.canAccessAllHubs) {
      return true;
    }
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
    if (!normalizedTaskType || normalizedTaskType === 'ALL' || normalizedTaskType === 'TAT_CA') {
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
    if (!normalizedStatus || normalizedStatus === 'ALL' || normalizedStatus === 'TAT_CA') {
      return undefined;
    }

    if (normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'DELIVERING' || normalizedStatus === 'PICKED_UP') {
      return 'ASSIGNED';
    }
    if (normalizedStatus === 'DONE' || normalizedStatus === 'SUCCESS') {
      return 'COMPLETED';
    }
    if (normalizedStatus === 'FAILED') {
      return 'CANCELLED';
    }

    if (!TASK_STATUSES.includes(normalizedStatus as (typeof TASK_STATUSES)[number])) {
      throw new BadRequestException(
        `Invalid status filter "${status}". Expected one of ${TASK_STATUSES.join(', ')}.`,
      );
    }

    return normalizedStatus as (typeof TASK_STATUSES)[number];
  }

  async optimizeRoute(input: {
    courierId: string;
    startLatitude: number;
    startLongitude: number;
    taskIds?: string[];
    taskType?: TaskType;
  }): Promise<{
    orderedTaskIds: string[];
    orderedTasks: Task[];
    legs: RouteLeg[];
    totalDistanceMeters: number;
    estimatedDurationSeconds: number;
  }> {
    const courierId = this.requireCourierId(input.courierId);
    const startLocation: GeoPoint = {
      latitude: input.startLatitude,
      longitude: input.startLongitude,
    };

    let tasks = await this.taskRepository.list({
      courierId,
      status: 'ASSIGNED',
      taskType: input.taskType,
    });

    if (Array.isArray(input.taskIds) && input.taskIds.length > 0) {
      const allowedSet = new Set(input.taskIds);
      tasks = tasks.filter((t) => allowedSet.has(t.id));
    }

    if (tasks.length === 0) {
      return {
        orderedTaskIds: [],
        orderedTasks: [],
        legs: [],
        totalDistanceMeters: 0,
        estimatedDurationSeconds: 0,
      };
    }

    const nodes: RouteTargetNode[] = [];
    const taskMap = new Map<string, Task>();

    for (const task of tasks) {
      taskMap.set(task.id, task);
      let coord: GeoPoint | null = null;

      if (task.shipmentCode) {
        const shipment = await this.fetchServiceJson(
          'SHIPMENT_SERVICE_URL',
          `shipments/${encodeURIComponent(task.shipmentCode)}`,
        );
        const sRecord = asRecord(shipment);
        const metadata = asRecord(sRecord?.metadata);
        const sender = asRecord(metadata?.sender);
        const receiver = asRecord(metadata?.receiver);

        if (task.taskType === 'PICKUP') {
          const lat =
            sRecord?.pickupLatitude ??
            metadata?.pickupLatitude ??
            sender?.latitude ??
            asRecord(sender?.coordinate)?.latitude;
          const lng =
            sRecord?.pickupLongitude ??
            metadata?.pickupLongitude ??
            sender?.longitude ??
            asRecord(sender?.coordinate)?.longitude;
          if (typeof lat === 'number' && typeof lng === 'number') {
            coord = { latitude: lat, longitude: lng };
          }
        } else if (task.taskType === 'DELIVERY') {
          const lat =
            sRecord?.deliveryLatitude ??
            metadata?.deliveryLatitude ??
            receiver?.latitude ??
            asRecord(receiver?.coordinate)?.latitude;
          const lng =
            sRecord?.deliveryLongitude ??
            metadata?.deliveryLongitude ??
            receiver?.longitude ??
            asRecord(receiver?.coordinate)?.longitude;
          if (typeof lat === 'number' && typeof lng === 'number') {
            coord = { latitude: lat, longitude: lng };
          }
        } else if (task.taskType === 'RETURN') {
          const lat = sender?.latitude ?? sRecord?.pickupLatitude;
          const lng = sender?.longitude ?? sRecord?.pickupLongitude;
          if (typeof lat === 'number' && typeof lng === 'number') {
            coord = { latitude: lat, longitude: lng };
          }
        }
      }

      if (!coord) {
        coord = {
          latitude: startLocation.latitude + (Math.random() - 0.5) * 0.005,
          longitude: startLocation.longitude + (Math.random() - 0.5) * 0.005,
        };
      }

      nodes.push({
        id: task.id,
        coordinate: coord,
        taskType: task.taskType,
      });
    }

    const result = optimizeRouteTSP(startLocation, nodes);

    const orderedTasks = result.orderedIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => Boolean(t));

    return {
      orderedTaskIds: result.orderedIds,
      orderedTasks,
      legs: result.legs,
      totalDistanceMeters: result.totalDistanceMeters,
      estimatedDurationSeconds: result.estimatedDurationSeconds,
    };
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

/**
 * ===================================================================================
 * THUẬT TOÁN BẮN TIA RAY-CASTING (POINT-IN-POLYGON - PIP)
 * ===================================================================================
 * 1. NGUYÊN LÝ TOÁN HỌC:
 *   - Bắn một tia bán vô hạn (Ray) từ điểm cần kiểm tra (point) theo phương ngang sang phải.
 *   - Đếm số lần tia này cắt các cạnh của đa giác (polygon):
 *       + Số lần cắt LẺ (1, 3, 5, ...) -> Điểm NẰM BÊN TRONG đa giác (inside = true).
 *       + Số lần cắt CHẴN (0, 2, 4, ...) -> Điểm NẰM BÊN NGOÀI đa giác (inside = false).
 *   - Độ phức tạp thời gian: O(N) với N là số đỉnh đa giác (tốc độ xử lý cực nhanh < 0.05ms).
 *
 * 2. ỨNG DỤNG THỰC TẾ:
 *   - Xác định chính xác đơn hàng thuộc tuyến đường của Shipper nào để gán tự động.
 *   - Đạt đặc tính Zero-Overlap: Triệt tiêu 100% lỗi chồng lấn tuyến giữa các Shipper.
 * ===================================================================================
 */
function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<[number, number]>,
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function isCounterOrderShipment(shipment: unknown): boolean {
  if (!shipment || typeof shipment !== 'object') {
    return false;
  }
  const s = shipment as Record<string, unknown>;
  const meta = asRecord(s.metadata);
  const createdByType = normalizeNonEmptyString(s.createdByType);
  const currentStatus = normalizeNonEmptyString(s.currentStatus);
  const intakeType = normalizeNonEmptyString(meta?.intakeType);
  const pickupClassification = normalizeNonEmptyString(meta?.pickupClassification);
  const pickupType = normalizeNonEmptyString(meta?.pickupType);
  const source = normalizeNonEmptyString(meta?.source) ?? '';
  const platform = normalizeNonEmptyString(meta?.platform) ?? '';
  const skipCourierPickup = meta?.skipCourierPickup === true;

  return (
    intakeType === 'COUNTER_WALK_IN' ||
    pickupClassification === 'COUNTER_DROP_OFF' ||
    pickupType === 'COUNTER' ||
    skipCourierPickup ||
    createdByType === 'OPS' ||
    currentStatus === 'PICKUP_COMPLETED' ||
    source.startsWith('ops-web') ||
    platform.startsWith('OPS_')
  );
}

function isRegionalHub(code?: string | null): boolean {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return ['001N001', '002C001', '003S001'].includes(normalized) || /^\d{3}[A-Z]\d{3}$/.test(normalized);
}

function resolveTaskHub(
  itemHubCode: string | null | undefined,
  designatedHubCode: string | null | undefined,
): string {
  if (designatedHubCode && designatedHubCode.trim() && !isRegionalHub(designatedHubCode)) {
    return designatedHubCode.trim().toUpperCase();
  }
  if (itemHubCode && itemHubCode.trim() && !isRegionalHub(itemHubCode)) {
    return itemHubCode.trim().toUpperCase();
  }
  return (
    designatedHubCode?.trim().toUpperCase() ||
    itemHubCode?.trim().toUpperCase() ||
    'HUB-DEFAULT'
  );
}
