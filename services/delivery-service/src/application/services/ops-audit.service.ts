import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface OpsAuditContext {
  actorId?: string | null;
  actorUsername?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RecordOpsAuditInput {
  context?: OpsAuditContext;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
}

export interface ListOpsAuditLogsInput {
  action?: string;
  targetType?: string;
  targetId?: string;
  actor?: string;
  createdFrom?: string;
  createdTo?: string;
  q?: string;
  limit?: string;
  offset?: string;
}

export interface OpsAuditLogPage {
  items: Awaited<ReturnType<PrismaService['opsAuditLog']['findMany']>>;
  pageInfo: {
    hasNextPage: boolean;
    total: number;
  };
}

@Injectable()
export class OpsAuditService {
  private readonly logger = new Logger(OpsAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListOpsAuditLogsInput = {}): Promise<OpsAuditLogPage> {
    const where = this.buildWhere(input);
    const limit = this.normalizeLimit(input.limit);
    const offset = this.normalizeOffset(input.offset);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.opsAuditLog.count({ where }),
      this.prisma.opsAuditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      items,
      pageInfo: {
        hasNextPage: offset + items.length < total,
        total,
      },
    };
  }

  async record(input: RecordOpsAuditInput): Promise<void> {
    try {
      await this.prisma.opsAuditLog.create({
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
        `Failed to write ops audit log for ${input.targetType}:${input.targetId ?? 'N/A'} ${input.action}: ${message}`,
      );
    }
  }

  private buildWhere(input: ListOpsAuditLogsInput): Prisma.OpsAuditLogWhereInput {
    const and: Prisma.OpsAuditLogWhereInput[] = [];
    const action = input.action?.trim();
    const targetType = input.targetType?.trim();
    const targetId = input.targetId?.trim();
    const actor = input.actor?.trim();
    const q = input.q?.trim();
    const createdFrom = this.parseDate(input.createdFrom);
    const createdTo = this.parseDate(input.createdTo);

    if (action) {
      and.push({ action: { contains: action, mode: 'insensitive' } });
    }

    if (targetType) {
      and.push({ targetType: { contains: targetType, mode: 'insensitive' } });
    }

    if (targetId) {
      and.push({ targetId: { contains: targetId, mode: 'insensitive' } });
    }

    if (actor) {
      and.push({
        OR: [
          { actorId: { contains: actor, mode: 'insensitive' } },
          { actorUsername: { contains: actor, mode: 'insensitive' } },
        ],
      });
    }

    if (q) {
      and.push({
        OR: [
          { actorId: { contains: q, mode: 'insensitive' } },
          { actorUsername: { contains: q, mode: 'insensitive' } },
          { action: { contains: q, mode: 'insensitive' } },
          { targetType: { contains: q, mode: 'insensitive' } },
          { targetId: { contains: q, mode: 'insensitive' } },
          { requestId: { contains: q, mode: 'insensitive' } },
          { ipAddress: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (createdFrom || createdTo) {
      and.push({
        createdAt: {
          ...(createdFrom ? { gte: createdFrom } : {}),
          ...(createdTo ? { lt: createdTo } : {}),
        },
      });
    }

    return and.length > 0 ? { AND: and } : {};
  }

  private resolveActorValue(value: string | null | undefined): string {
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

    return Math.min(Math.trunc(parsedLimit), 5000);
  }

  private normalizeOffset(value: string | undefined): number {
    const parsedOffset = value ? Number(value) : 0;
    if (!Number.isFinite(parsedOffset) || parsedOffset <= 0) {
      return 0;
    }

    return Math.trunc(parsedOffset);
  }
}
