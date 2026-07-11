import { Injectable } from '@nestjs/common';
import type {
  CourierCurrentLocation as PrismaCourierCurrentLocationRecord,
  CourierLocationHistory as PrismaCourierLocationHistoryRecord,
  CurrentLocation as PrismaCurrentLocationRecord,
} from '@prisma/client';

import type {
  CourierCurrentLocation,
  CourierLocationHistory,
  CurrentLocation,
  UpsertCourierLocationInput,
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

  async findCourierByCourierId(
    courierId: string,
  ): Promise<CourierCurrentLocation | null> {
    const record = await this.prisma.courierCurrentLocation.findUnique({
      where: { courierId },
    });

    return record ? this.toCourierEntity(record) : null;
  }

  async findLatestCourierByShipmentCode(
    shipmentCode: string,
  ): Promise<CourierCurrentLocation | null> {
    const record = await this.prisma.courierCurrentLocation.findFirst({
      where: { shipmentCode },
      orderBy: { capturedAt: 'desc' },
    });

    return record ? this.toCourierEntity(record) : null;
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

  async upsertCourierLocation(
    input: UpsertCourierLocationInput,
  ): Promise<CourierCurrentLocation> {
    const normalizedShipmentCode = normalizeNullableCode(input.shipmentCode);
    const normalizedTaskId = normalizeNullableText(input.taskId);

    const courierRecord = await this.prisma.courierCurrentLocation.upsert({
      where: { courierId: input.courierId },
      update: {
        taskId: normalizedTaskId,
        shipmentCode: normalizedShipmentCode,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? null,
        capturedAt: input.capturedAt,
        source: input.source,
      },
      create: {
        courierId: input.courierId,
        taskId: normalizedTaskId,
        shipmentCode: normalizedShipmentCode,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? null,
        capturedAt: input.capturedAt,
        source: input.source,
      },
    });

    if (normalizedShipmentCode) {
      await this.upsertShipmentPosition({
        shipmentCode: normalizedShipmentCode,
        courierId: input.courierId,
        taskId: normalizedTaskId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? null,
        capturedAt: input.capturedAt,
        source: input.source,
      });
    }

    return this.toCourierEntity(courierRecord);
  }

  private async upsertShipmentPosition(input: {
    shipmentCode: string;
    courierId: string;
    taskId: string | null;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    capturedAt: Date;
    source: UpsertCourierLocationInput['source'];
  }): Promise<void> {
    await this.prisma.currentLocation.upsert({
      where: { shipmentCode: input.shipmentCode },
      update: {
        courierId: input.courierId,
        taskId: input.taskId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        capturedAt: input.capturedAt,
        source: input.source,
      },
      create: {
        shipmentCode: input.shipmentCode,
        locationCode: null,
        lastScanType: null,
        lastScanEventId: null,
        lastScannedAt: null,
        manifestCode: null,
        courierId: input.courierId,
        taskId: input.taskId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        capturedAt: input.capturedAt,
        source: input.source,
      },
    });
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
      courierId: record.courierId,
      taskId: record.taskId,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      capturedAt: record.capturedAt,
      source: record.source,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toCourierEntity(
    record: PrismaCourierCurrentLocationRecord,
  ): CourierCurrentLocation {
    return {
      id: record.id,
      courierId: record.courierId,
      taskId: record.taskId,
      shipmentCode: record.shipmentCode,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      capturedAt: record.capturedAt,
      source: record.source,
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

  async createLocationHistory(
    input: UpsertCourierLocationInput,
  ): Promise<CourierLocationHistory> {
    const record = await this.prisma.courierLocationHistory.create({
      data: {
        courierId: input.courierId,
        taskId: normalizeNullableText(input.taskId),
        shipmentCode: normalizeNullableCode(input.shipmentCode),
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? null,
        capturedAt: input.capturedAt,
        source: input.source,
      },
    });

    return this.toHistoryEntity(record);
  }

  async getCourierHistory(
    courierId: string,
    limit: number,
  ): Promise<CourierLocationHistory[]> {
    const records = await this.prisma.courierLocationHistory.findMany({
      where: {
        courierId,
      },
      orderBy: {
        capturedAt: 'desc',
      },
      take: limit,
    });

    return records.map((record) => this.toHistoryEntity(record));
  }

  async getShipmentHistory(
    shipmentCode: string,
  ): Promise<CourierLocationHistory[]> {
    const records = await this.prisma.courierLocationHistory.findMany({
      where: {
        shipmentCode,
      },
      orderBy: {
        capturedAt: 'desc',
      },
    });

    return records.map((record) => this.toHistoryEntity(record));
  }

  async pruneLocationHistory(cutoff: Date): Promise<number> {
    const result = await this.prisma.courierLocationHistory.deleteMany({
      where: {
        capturedAt: {
          lt: cutoff,
        },
      },
    });

    return result.count;
  }

  private toHistoryEntity(
    record: PrismaCourierLocationHistoryRecord,
  ): CourierLocationHistory {
    return {
      id: record.id,
      courierId: record.courierId,
      taskId: record.taskId,
      shipmentCode: record.shipmentCode,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      capturedAt: record.capturedAt,
      source: record.source,
      createdAt: record.createdAt,
    };
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

function normalizeNullableCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? '';

  return normalized.length > 0 ? normalized : null;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';

  return normalized.length > 0 ? normalized : null;
}
