import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const DEFAULT_RETENTION_DAYS = 45;
const DEFAULT_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DispatchRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DispatchRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Dispatch retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredDispatchData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredDispatchData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredDispatchData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [taskAssignments, tasks, outboxEvents, auditLogs] = await this.prisma.$transaction([
        this.prisma.taskAssignment.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { task: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.task.deleteMany({
          where: {
            createdAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.outboxEvent.deleteMany({
          where: {
            status: 'PUBLISHED',
            occurredAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.opsAuditLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoff,
            },
          },
        }),
      ]);

      if (
        taskAssignments.count > 0 ||
        tasks.count > 0 ||
        outboxEvents.count > 0 ||
        auditLogs.count > 0
      ) {
        this.logger.log(
          `Deleted expired dispatch data before ${cutoff.toISOString()}: ` +
            `${tasks.count} tasks, ${taskAssignments.count} assignments, ` +
            `${outboxEvents.count} outbox events, ${auditLogs.count} audit logs.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dispatch retention cleanup failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}

function getRetentionCutoff(now: Date): Date {
  const retentionDays = readPositiveNumber(
    process.env.SHIPMENT_RETENTION_DAYS ?? process.env.ORDER_RETENTION_DAYS,
    DEFAULT_RETENTION_DAYS,
  );

  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

function getCleanupIntervalMs(): number {
  return readPositiveNumber(
    process.env.DISPATCH_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.DISPATCH_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
