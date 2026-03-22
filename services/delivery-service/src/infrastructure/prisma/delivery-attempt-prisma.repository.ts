import { Injectable } from '@nestjs/common';
import type { DeliveryAttempt as PrismaDeliveryAttemptRecord, Prisma } from '@prisma/client';

import type {
  CreateDeliveryAttemptInput,
  DeliveryAttempt,
  UpdateDeliveredAttemptInput,
  UpdateFailedAttemptInput,
} from '../../domain/entities/delivery-attempt.entity';
import { DeliveryAttemptRepository } from '../../domain/repositories/delivery-attempt.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class DeliveryAttemptPrismaRepository extends DeliveryAttemptRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<DeliveryAttempt | null> {
    const record = await this.prisma.deliveryAttempt.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateDeliveryAttemptInput): Promise<DeliveryAttempt> {
    const data: Prisma.DeliveryAttemptCreateInput = {
      shipmentCode: input.shipmentCode,
      taskId: input.taskId ?? null,
      courierId: input.courierId ?? null,
      locationCode: input.locationCode ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      status: input.status,
      failReasonCode: input.failReasonCode ?? null,
      occurredAt: input.occurredAt,
    };

    const record = await this.prisma.deliveryAttempt.create({ data });

    return this.toEntity(record);
  }

  async markDelivered(
    id: string,
    input: UpdateDeliveredAttemptInput,
  ): Promise<DeliveryAttempt> {
    const record = await this.prisma.deliveryAttempt.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        locationCode: input.locationCode ?? null,
        actor: input.actor ?? null,
        note: input.note ?? null,
        occurredAt: input.occurredAt,
        failReasonCode: null,
      },
    });

    return this.toEntity(record);
  }

  async markFailed(
    id: string,
    input: UpdateFailedAttemptInput,
  ): Promise<DeliveryAttempt> {
    const record = await this.prisma.deliveryAttempt.update({
      where: { id },
      data: {
        status: 'FAILED',
        locationCode: input.locationCode ?? null,
        actor: input.actor ?? null,
        note: input.note ?? null,
        occurredAt: input.occurredAt,
        failReasonCode: input.failReasonCode ?? null,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaDeliveryAttemptRecord): DeliveryAttempt {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      taskId: record.taskId,
      courierId: record.courierId,
      locationCode: record.locationCode,
      actor: record.actor,
      note: record.note,
      status: record.status,
      failReasonCode: record.failReasonCode,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
