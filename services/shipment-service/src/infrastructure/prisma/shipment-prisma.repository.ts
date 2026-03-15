import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Shipment as PrismaShipmentRecord,
  ShipmentCurrentStatus as PrismaShipmentCurrentStatus,
} from '@prisma/client';

import type {
  CreateShipmentInput,
  JsonValue,
  Shipment,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentCurrentStatus } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ShipmentPrismaRepository extends ShipmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<Shipment[]> {
    const records = await this.prisma.shipment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findByCode(code: string): Promise<Shipment | null> {
    const record = await this.prisma.shipment.findUnique({
      where: { code },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    const data: Prisma.ShipmentCreateInput = {
      code: input.code,
      metadata: (input.metadata ?? null) as unknown as Prisma.InputJsonValue,
      currentStatus: 'CREATED',
    };

    const record = await this.prisma.shipment.create({ data });

    return this.toEntity(record);
  }

  async update(code: string, input: UpdateShipmentInput): Promise<Shipment> {
    const data: Prisma.ShipmentUpdateInput = {
      currentStatus: 'UPDATED',
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata as unknown as Prisma.InputJsonValue;
    }

    const record = await this.prisma.shipment.update({
      where: { code },
      data,
    });

    return this.toEntity(record);
  }

  async updateCurrentStatus(
    code: string,
    currentStatus: ShipmentCurrentStatus,
  ): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: currentStatus as PrismaShipmentCurrentStatus,
      },
    });

    return this.toEntity(record);
  }

  async cancel(code: string, reason: string | null): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaShipmentRecord): Shipment {
    return {
      id: record.id,
      code: record.code,
      currentStatus: record.currentStatus as ShipmentCurrentStatus,
      metadata: record.metadata as JsonValue | null,
      cancellationReason: record.cancellationReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
