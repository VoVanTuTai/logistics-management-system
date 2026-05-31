import { Injectable } from '@nestjs/common';
import type { CurrentLocation as PrismaCurrentLocationRecord } from '@prisma/client';

import type {
  CurrentLocation,
  UpsertCurrentLocationInput,
} from '../../domain/entities/current-location.entity';
import { CurrentLocationRepository } from '../../domain/repositories/current-location.repository';
import { PrismaService } from './prisma.service';

const DEFAULT_RETENTION_DAYS = 45;

@Injectable()
export class CurrentLocationPrismaRepository extends CurrentLocationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByShipmentCode(
    shipmentCode: string,
  ): Promise<CurrentLocation | null> {
    const record = await this.prisma.currentLocation.findUnique({
      where: { shipmentCode },
    });

    return record ? this.toEntity(record) : null;
  }

  async upsert(input: UpsertCurrentLocationInput): Promise<CurrentLocation> {
    await this.deleteExpiredCurrentForShipmentCode(
      input.shipmentCode,
      input.lastScannedAt ?? new Date(),
    );

    const record = await this.prisma.currentLocation.upsert({
      where: { shipmentCode: input.shipmentCode },
      update: {
        locationCode: input.locationCode,
        lastScanType: input.lastScanType,
        lastScanEventId: input.lastScanEventId,
        lastScannedAt: input.lastScannedAt,
        manifestCode: input.manifestCode,
      },
      create: {
        shipmentCode: input.shipmentCode,
        locationCode: input.locationCode,
        lastScanType: input.lastScanType,
        lastScanEventId: input.lastScanEventId,
        lastScannedAt: input.lastScannedAt,
        manifestCode: input.manifestCode,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaCurrentLocationRecord): CurrentLocation {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      locationCode: record.locationCode,
      lastScanType: record.lastScanType,
      lastScanEventId: record.lastScanEventId,
      lastScannedAt: record.lastScannedAt,
      manifestCode: record.manifestCode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async deleteExpiredCurrentForShipmentCode(
    shipmentCode: string,
    now: Date,
  ): Promise<void> {
    const existingRecord = await this.prisma.currentLocation.findUnique({
      where: {
        shipmentCode,
      },
    });

    if (!existingRecord) {
      return;
    }

    const cutoff = getRetentionCutoff(now);
    const recordAgeSource = existingRecord.lastScannedAt ?? existingRecord.createdAt;

    if (recordAgeSource >= cutoff) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.scanEvent.deleteMany({
        where: {
          shipmentCode,
        },
      }),
      this.prisma.currentLocation.deleteMany({
        where: {
          shipmentCode,
        },
      }),
    ]);
  }
}

function getRetentionCutoff(now: Date): Date {
  const retentionDays = readPositiveNumber(
    process.env.SHIPMENT_RETENTION_DAYS ?? process.env.ORDER_RETENTION_DAYS,
    DEFAULT_RETENTION_DAYS,
  );

  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
