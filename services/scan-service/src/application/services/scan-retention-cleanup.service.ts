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
export class ScanRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScanRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Scan retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredScanData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredScanData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredScanData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [scanEvents, currentLocations, idempotencyRecords, outboxEvents] =
        await this.prisma.$transaction([
          this.prisma.scanEvent.deleteMany({
            where: {
              occurredAt: {
                lt: cutoff,
              },
            },
          }),
          this.prisma.currentLocation.deleteMany({
            where: {
              OR: [
                {
                  lastScannedAt: {
                    lt: cutoff,
                  },
                },
                {
                  lastScannedAt: null,
                  createdAt: {
                    lt: cutoff,
                  },
                },
              ],
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
        ]);

      if (
        scanEvents.count > 0 ||
        currentLocations.count > 0 ||
        idempotencyRecords.count > 0 ||
        outboxEvents.count > 0
      ) {
        this.logger.log(
          `Deleted expired scan data before ${cutoff.toISOString()}: ` +
            `${scanEvents.count} scan events, ${currentLocations.count} current locations, ` +
            `${idempotencyRecords.count} idempotency records, ${outboxEvents.count} outbox events.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Scan retention cleanup failed: ${message}`);
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
    process.env.SCAN_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.SCAN_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
