import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Task as PrismaTaskRecord,
  TaskAssignment as PrismaTaskAssignmentRecord,
  TaskStatus as PrismaTaskStatus,
} from '@prisma/client';

import {
  TASK_STATUSES,
  TASK_TYPES,
  type AssignTaskInput,
  type CreateTaskInput,
  type ListTasksFilters,
  type ReassignTaskInput,
  type Task,
  type TaskAssignment,
  type TaskStatus,
  type TaskType,
  type UpdateTaskStatusInput,
} from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { PrismaService } from './prisma.service';

const VALID_TASK_STATUS_SET = new Set<string>(TASK_STATUSES);
const VALID_TASK_TYPE_SET = new Set<string>(TASK_TYPES);

const TASK_STATUS_ALIASES: Record<string, PrismaTaskStatus> = {
  IN_PROGRESS: 'ASSIGNED',
  DELIVERING: 'ASSIGNED',
  PICKED_UP: 'ASSIGNED',
  DONE: 'COMPLETED',
  SUCCESS: 'COMPLETED',
  FAILED: 'CANCELLED',
};

function resolvePrismaTaskStatus(
  raw?: string | null,
): PrismaTaskStatus | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  if (!upper || upper === 'ALL' || upper === 'TAT_CA') {
    return undefined;
  }
  if (VALID_TASK_STATUS_SET.has(upper)) {
    return upper as PrismaTaskStatus;
  }
  if (TASK_STATUS_ALIASES[upper]) {
    return TASK_STATUS_ALIASES[upper];
  }
  return undefined;
}

type TaskRecordWithAssignments = PrismaTaskRecord & {
  assignments: PrismaTaskAssignmentRecord[];
};

@Injectable()
export class TaskPrismaRepository extends TaskRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: ListTasksFilters = {}): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};
    const courierId = filters.courierId?.trim();
    const shipmentCode = filters.shipmentCode?.trim();
    const pickupRequestId = filters.pickupRequestId?.trim();

    if (courierId) {
      where.assignments = {
        some: {
          courierId,
          unassignedAt: null,
        },
      };
    }

    if (shipmentCode) {
      where.shipmentCode = shipmentCode;
    }

    if (pickupRequestId) {
      where.pickupRequestId = pickupRequestId;
    }

    if (filters.taskType) {
      const upperType = filters.taskType.trim().toUpperCase();
      if (VALID_TASK_TYPE_SET.has(upperType)) {
        where.taskType = upperType as TaskType;
      }
    }

    if (filters.status) {
      const resolved = resolvePrismaTaskStatus(filters.status);
      if (resolved) {
        where.status = resolved as TaskStatus;
      } else if (filters.status.trim().toUpperCase() !== 'ALL') {
        where.taskCode = '__NO_MATCHING_TASK__';
      }
    }

    const records = await this.prisma.task.findMany({
      where,
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findByPickupRequestId(pickupRequestId: string): Promise<Task | null> {
    const record = await this.prisma.task.findFirst({
      where: {
        pickupRequestId,
      },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async listCourierIds(): Promise<string[]> {
    const records = await this.prisma.taskAssignment.findMany({
      select: {
        courierId: true,
      },
      distinct: ['courierId'],
      orderBy: {
        courierId: 'asc',
      },
    });

    return records
      .map((record) => record.courierId.trim())
      .filter((courierId) => courierId.length > 0);
  }

  async findById(id: string): Promise<Task | null> {
    const record = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const data: Prisma.TaskCreateInput = {
      taskCode: input.taskCode,
      taskType: input.taskType,
      shipmentCode: input.shipmentCode ?? null,
      pickupRequestId: input.pickupRequestId ?? null,
      note: input.note ?? null,
    };

    const record = await this.prisma.task.create({
      data,
      include: {
        assignments: true,
      },
    });

    return this.toEntity(record);
  }

  async assign(id: string, input: AssignTaskInput): Promise<Task> {
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        note: input.note !== undefined ? (input.note ?? null) : undefined,
        assignments: {
          create: {
            courierId: input.courierId,
          },
        },
      },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    return this.toEntity(record);
  }

  async reassign(id: string, input: ReassignTaskInput): Promise<Task> {
    await this.prisma.taskAssignment.updateMany({
      where: {
        taskId: id,
        unassignedAt: null,
      },
      data: {
        unassignedAt: new Date(),
      },
    });

    const record = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        note: input.note !== undefined ? (input.note ?? null) : undefined,
        assignments: {
          create: {
            courierId: input.courierId,
          },
        },
      },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    return this.toEntity(record);
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput): Promise<Task> {
    const resolvedStatus =
      resolvePrismaTaskStatus(input.status) ?? ('COMPLETED' as PrismaTaskStatus);
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        status: resolvedStatus,
      },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    return this.toEntity(record);
  }

  async updatePickupRequestId(id: string, pickupRequestId: string): Promise<Task> {
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        pickupRequestId,
      },
      include: {
        assignments: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: TaskRecordWithAssignments): Task {
    return {
      id: record.id,
      taskCode: record.taskCode,
      taskType: record.taskType,
      status: record.status,
      shipmentCode: record.shipmentCode,
      pickupRequestId: record.pickupRequestId,
      note: record.note,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      assignments: record.assignments.map((assignment) =>
        this.toAssignmentEntity(assignment),
      ),
    };
  }

  private toAssignmentEntity(
    record: PrismaTaskAssignmentRecord,
  ): TaskAssignment {
    return {
      id: record.id,
      taskId: record.taskId,
      courierId: record.courierId,
      assignedAt: record.assignedAt,
      unassignedAt: record.unassignedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
