import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  ScanEvent as PrismaScanEventRecord,
} from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

import type {
  CreateScanEventInput,
  PersistedScanEventResult,
  ScanEvent,
} from '../../domain/entities/scan-event.entity';
import { ScanEventRepository } from '../../domain/repositories/scan-event.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ScanEventPrismaRepository extends ScanEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<ScanEvent | null> {
    const record = await this.prisma.scanEvent.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ScanEvent | null> {
    const record = await this.prisma.scanEvent.findUnique({
      where: { idempotencyKey },
    });

    return record ? this.toEntity(record) : null;
  }

  async createIfAbsent(
    input: CreateScanEventInput,
  ): Promise<PersistedScanEventResult> {
    const data: Prisma.ScanEventCreateInput = {
      shipmentCode: input.shipmentCode,
      scanType: input.scanType,
      locationCode: input.locationCode,
      manifestCode: input.manifestCode,
      actor: input.actor,
      note: input.note,
      idempotencyKey: input.idempotencyKey,
      occurredAt: input.occurredAt,
    };

    try {
      const record = await this.prisma.scanEvent.create({ data });

      return {
        scanEvent: this.toEntity(record),
        created: true,
      };
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingRecord = await this.prisma.scanEvent.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });

        if (existingRecord) {
          return {
            scanEvent: this.toEntity(existingRecord),
            created: false,
          };
        }
      }

      throw error;
    }
  }

  private toEntity(record: PrismaScanEventRecord): ScanEvent {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      scanType: record.scanType,
      locationCode: record.locationCode,
      manifestCode: record.manifestCode,
      actor: record.actor,
      note: record.note,
      idempotencyKey: record.idempotencyKey,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
