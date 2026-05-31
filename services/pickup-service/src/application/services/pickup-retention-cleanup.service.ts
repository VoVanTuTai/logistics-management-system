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
export class PickupRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PickupRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Pickup retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredPickupData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredPickupData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredPickupData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [pickupItems, pickupRequests, outboxEvents] = await this.prisma.$transaction([
        this.prisma.pickupItem.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { pickupRequest: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.pickupRequest.deleteMany({
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
      ]);

      if (pickupItems.count > 0 || pickupRequests.count > 0 || outboxEvents.count > 0) {
        this.logger.log(
          `Deleted expired pickup data before ${cutoff.toISOString()}: ` +
            `${pickupRequests.count} pickup requests, ${pickupItems.count} pickup items, ` +
            `${outboxEvents.count} outbox events.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Pickup retention cleanup failed: ${message}`);
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
    process.env.PICKUP_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.PICKUP_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
