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
export class ManifestRetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ManifestRetentionCleanupService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (!isRetentionCleanupEnabled()) {
      this.logger.log('Manifest retention cleanup is disabled.');
      return;
    }

    void this.cleanupExpiredManifestData();
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredManifestData(),
      getCleanupIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredManifestData(now = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const cutoff = getRetentionCutoff(now);

    try {
      const [
        manifestItems,
        sealRecords,
        receiveRecords,
        manifests,
        outboxEvents,
        auditLogs,
      ] = await this.prisma.$transaction([
        this.prisma.manifestItem.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { manifest: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.sealRecord.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { manifest: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.receiveRecord.deleteMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff } },
              { manifest: { createdAt: { lt: cutoff } } },
            ],
          },
        }),
        this.prisma.manifest.deleteMany({
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
        manifestItems.count > 0 ||
        sealRecords.count > 0 ||
        receiveRecords.count > 0 ||
        manifests.count > 0 ||
        outboxEvents.count > 0 ||
        auditLogs.count > 0
      ) {
        this.logger.log(
          `Deleted expired manifest data before ${cutoff.toISOString()}: ` +
            `${manifests.count} manifests, ${manifestItems.count} items, ` +
            `${sealRecords.count} seal records, ${receiveRecords.count} receive records, ` +
            `${outboxEvents.count} outbox events, ${auditLogs.count} audit logs.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Manifest retention cleanup failed: ${message}`);
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
    process.env.MANIFEST_RETENTION_CLEANUP_INTERVAL_MS ??
      process.env.DATA_RETENTION_CLEANUP_INTERVAL_MS,
    DEFAULT_CLEANUP_INTERVAL_MS,
  );
}

function isRetentionCleanupEnabled(): boolean {
  const value =
    process.env.MANIFEST_RETENTION_CLEANUP_ENABLED ??
    process.env.DATA_RETENTION_CLEANUP_ENABLED;

  return value?.trim().toLowerCase() !== 'false';
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
