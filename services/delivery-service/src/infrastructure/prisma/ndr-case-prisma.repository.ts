import { Injectable } from '@nestjs/common';
import type { NdrCase as PrismaNdrCaseRecord, Prisma } from '@prisma/client';

import {
  NDR_CASE_STATUSES,
  type CreateNdrCaseInput,
  type ListNdrCasesFilter,
  type NdrCase,
  type NdrCaseStatus,
  type RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class NdrCasePrismaRepository extends NdrCaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filter?: ListNdrCasesFilter): Promise<NdrCase[]> {
    const records = await this.prisma.ndrCase.findMany({
      where: {
        shipmentCode: filter?.shipmentCode ?? undefined,
        status: filter?.status ?? undefined,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<NdrCase | null> {
    const record = await this.prisma.ndrCase.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateNdrCaseInput): Promise<NdrCase> {
    const data: Prisma.NdrCaseCreateInput = {
      shipmentCode: input.shipmentCode,
      reasonCode: input.reasonCode ?? null,
      note: input.note ?? null,
      status: 'CREATED',
      deliveryAttempt: input.deliveryAttemptId
        ? {
            connect: {
              id: input.deliveryAttemptId,
            },
          }
        : undefined,
    };

    const record = await this.prisma.ndrCase.create({ data });

    return this.toEntity(record);
  }

  async reschedule(
    id: string,
    input: RescheduleNdrCaseInput,
  ): Promise<NdrCase> {
    const rescheduleAt = input.rescheduleAt ?? input.nextDeliveryAt ?? null;
    const record = await this.prisma.ndrCase.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        note: input.note !== undefined ? input.note : undefined,
        rescheduleAt: rescheduleAt ? new Date(rescheduleAt) : null,
      },
    });

    return this.toEntity(record);
  }

  async markReturnRequested(
    id: string,
    input: { note?: string | null },
  ): Promise<NdrCase> {
    const record = await this.prisma.ndrCase.update({
      where: { id },
      data: {
        status: 'RETURN_REQUESTED',
        note: input.note !== undefined ? input.note : undefined,
      },
    });

    return this.toEntity(record);
  }

  isValidStatus(value: string): value is NdrCaseStatus {
    return (NDR_CASE_STATUSES as readonly string[]).includes(value);
  }

  private toEntity(record: PrismaNdrCaseRecord): NdrCase {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      deliveryAttemptId: record.deliveryAttemptId,
      reasonCode: record.reasonCode,
      note: record.note,
      status: record.status,
      rescheduleAt: record.rescheduleAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
