import { Injectable } from '@nestjs/common';
import type { CurrentLocation as PrismaCurrentLocationRecord } from '@prisma/client';

import type {
  CurrentLocation,
  UpsertCurrentLocationInput,
} from '../../domain/entities/current-location.entity';
import { CurrentLocationRepository } from '../../domain/repositories/current-location.repository';
import { PrismaService } from './prisma.service';

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
}
