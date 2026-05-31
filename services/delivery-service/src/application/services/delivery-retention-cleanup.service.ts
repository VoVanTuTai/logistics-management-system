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
export class DeliveryRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Delivery retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredDeliveryData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredDeliveryData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredDeliveryData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [
        ndrCases,
        pods,
        deliveryAttempts,
        otpRecords,
        returnCases,
        idempotencyRecords,
        outboxEvents,
        auditLogs,
      ] = await this.prisma.$transaction([
        this.prisma.ndrCase.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { deliveryAttempt: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.pod.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { deliveryAttempt: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.deliveryAttempt.deleteMany({
          where: {
            createdAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.otpRecord.deleteMany({
          where: {
            createdAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.returnCase.deleteMany({
          where: {
            createdAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.idempotencyRecord.deleteMany({
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
        ndrCases.count > 0 ||
        pods.count > 0 ||
        deliveryAttempts.count > 0 ||
        otpRecords.count > 0 ||
        returnCases.count > 0 ||
        idempotencyRecords.count > 0 ||
        outboxEvents.count > 0 ||
        auditLogs.count > 0
      ) {
        this.logger.log(
          `Deleted expired delivery data before ${cutoff.toISOString()}: ` +
            `${deliveryAttempts.count} attempts, ${pods.count} PODs, ` +
            `${ndrCases.count} NDR cases, ${returnCases.count} return cases, ` +
            `${otpRecords.count} OTP records, ${idempotencyRecords.count} idempotency records, ` +
            `${outboxEvents.count} outbox events, ${auditLogs.count} audit logs.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Delivery retention cleanup failed: ${message}`);
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
    process.env.DELIVERY_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.DELIVERY_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
