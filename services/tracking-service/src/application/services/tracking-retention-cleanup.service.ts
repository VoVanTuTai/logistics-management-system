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
export class TrackingRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Tracking retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredTrackingData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredTrackingData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredTrackingData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [timelineEvents, trackingCurrents, trackingIndexes] = await this.prisma.$transaction([
        this.prisma.timelineEvent.deleteMany({
          where: {
            occurredAt: {
              lt: cutoff,
            },
          },
        }),
        this.prisma.trackingCurrent.deleteMany({
          where: {
            OR: [
              {
                lastEventAt: {
                  lt: cutoff,
                },
              },
              {
                lastEventAt: null,
                createdAt: {
                  lt: cutoff,
                },
              },
            ],
          },
        }),
        this.prisma.trackingIndex.deleteMany({
          where: {
            OR: [
              {
                latestEventAt: {
                  lt: cutoff,
                },
              },
              {
                latestEventAt: null,
                createdAt: {
                  lt: cutoff,
                },
              },
            ],
          },
        }),
      ]);

      if (timelineEvents.count > 0 || trackingCurrents.count > 0 || trackingIndexes.count > 0) {
        this.logger.log(
          `Deleted expired tracking data before ${cutoff.toISOString()}: ` +
            `${timelineEvents.count} timeline events, ${trackingCurrents.count} current rows, ` +
            `${trackingIndexes.count} index rows.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Tracking retention cleanup failed: ${message}`);
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
    process.env.TRACKING_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.TRACKING_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
