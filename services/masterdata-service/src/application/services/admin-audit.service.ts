import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface AdminAuditContext {
  actorId?: string | null;
  actorUsername?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RecordAdminAuditInput {
  context?: AdminAuditContext;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
}

export interface ListAdminAuditLogsInput {
  action?: string;
  targetType?: string;
  actor?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListAdminAuditLogsInput = {}) {
    const where: Prisma.AdminAuditLogWhereInput = {};
    const action = input.action?.trim();
    const targetType = input.targetType?.trim();
    const actor = input.actor?.trim();
    const createdFrom = this.parseDate(input.createdFrom);
    const createdTo = this.parseDate(input.createdTo);

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive',
      };
    }

    if (targetType) {
      where.targetType = {
        contains: targetType,
        mode: 'insensitive',
      };
    }

    if (actor) {
      where.OR = [
        {
          actorId: {
            contains: actor,
            mode: 'insensitive',
          },
        },
        {
          actorUsername: {
            contains: actor,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lt: createdTo } : {}),
      };
    }

    return this.prisma.adminAuditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: this.normalizeLimit(input.limit),
    });
  }

  async record(input: RecordAdminAuditInput): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          actorId: this.resolveActorValue(input.context?.actorId),
          actorUsername: this.resolveActorValue(input.context?.actorUsername),
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId ?? null,
          before: this.toJsonInput(input.before),
          after: this.toJsonInput(input.after),
          requestId: input.context?.requestId ?? null,
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown audit log error.';
      this.logger.error(
        `Failed to write admin audit log for ${input.targetType}:${input.targetId ?? 'N/A'} ${input.action}: ${message}`,
      );
    }
  }

  private resolveActorValue(value: string | null | undefined): string {
    // TODO(gateway): pass authenticated admin actor headers from gateway-bff.
    return value?.trim() || 'UNKNOWN_ACTOR';
  }

  private toJsonInput(
    value: unknown,
  ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private normalizeLimit(value: string | undefined): number {
    const parsedLimit = value ? Number(value) : 100;

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return 100;
    }

    return Math.min(Math.trunc(parsedLimit), 250);
  }
}
