import { Injectable } from '@nestjs/common';
import type {
  PickupItem as PrismaPickupItemRecord,
  PickupRequest as PrismaPickupRequestRecord,
  Prisma,
} from '@prisma/client';

import type {
  CreatePickupRequestInput,
  PickupItem,
  PickupRequest,
  PickupRequestStatus,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';
import { PickupRequestRepository } from '../../domain/repositories/pickup-request.repository';
import { PrismaService } from './prisma.service';

type PickupRequestRecordWithItems = PrismaPickupRequestRecord & {
  items: PrismaPickupItemRecord[];
};

@Injectable()
export class PickupRequestPrismaRepository extends PickupRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(status?: PickupRequestStatus): Promise<PickupRequest[]> {
    const records = await this.prisma.pickupRequest.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<PickupRequest | null> {
    const record = await this.prisma.pickupRequest.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByShipmentCode(shipmentCode: string): Promise<PickupRequest | null> {
    const record = await this.prisma.pickupRequest.findFirst({
      where: {
        items: {
          some: {
            shipmentCode,
          },
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreatePickupRequestInput): Promise<PickupRequest> {
    const data: Prisma.PickupRequestCreateInput = {
      pickupCode: input.pickupCode,
      requesterName: input.requesterName ?? null,
      contactPhone: input.contactPhone ?? null,
      pickupAddress: input.pickupAddress ?? null,
      note: input.note ?? null,
      approvedBy: null,
      approvedAt: null,
      items: {
        create:
          input.items?.map((item) => ({
            shipmentCode: item.shipmentCode,
            quantity: item.quantity ?? 1,
          })) ?? [],
      },
    };

    const record = await this.prisma.pickupRequest.create({
      data,
      include: {
        items: true,
      },
    });

    return this.toEntity(record);
  }

  async update(
    id: string,
    input: UpdatePickupRequestInput,
  ): Promise<PickupRequest> {
    const data: Prisma.PickupRequestUpdateInput = {};

    if (input.requesterName !== undefined) {
      data.requesterName = input.requesterName;
    }

    if (input.contactPhone !== undefined) {
      data.contactPhone = input.contactPhone;
    }

    if (input.pickupAddress !== undefined) {
      data.pickupAddress = input.pickupAddress;
    }

    if (input.note !== undefined) {
      data.note = input.note;
    }

    const record = await this.prisma.pickupRequest.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });

    return this.toEntity(record);
  }

  async approve(
    id: string,
    approvedBy: string | null,
    note: string | null,
  ): Promise<PickupRequest> {
    const data: Prisma.PickupRequestUpdateInput = {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
    };

    if (note !== null) {
      data.note = note;
    }

    const record = await this.prisma.pickupRequest.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });

    return this.toEntity(record);
  }

  async cancel(id: string, reason: string | null): Promise<PickupRequest> {
    const record = await this.prisma.pickupRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        approvedAt: null,
        cancellationReason: reason,
      },
      include: {
        items: true,
      },
    });

    return this.toEntity(record);
  }

  async complete(id: string): Promise<PickupRequest> {
    const record = await this.prisma.pickupRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        cancellationReason: null,
        completedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PickupRequestRecordWithItems): PickupRequest {
    return {
      id: record.id,
      pickupCode: record.pickupCode,
      status: record.status,
      requesterName: record.requesterName,
      contactPhone: record.contactPhone,
      pickupAddress: record.pickupAddress,
      note: record.note,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      cancellationReason: record.cancellationReason,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map((item) => this.toPickupItem(item)),
    };
  }

  private toPickupItem(record: PrismaPickupItemRecord): PickupItem {
    return {
      id: record.id,
      pickupRequestId: record.pickupRequestId,
      shipmentCode: record.shipmentCode,
      quantity: record.quantity,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
