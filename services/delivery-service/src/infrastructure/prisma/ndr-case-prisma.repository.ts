import { Injectable } from '@nestjs/common';
import type { NdrCase as PrismaNdrCaseRecord, Prisma } from '@prisma/client';

import type {
  CreateNdrCaseInput,
  NdrCase,
  RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class NdrCasePrismaRepository extends NdrCaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
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
    const record = await this.prisma.ndrCase.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        note: input.note ?? null,
        rescheduleAt: input.rescheduleAt ? new Date(input.rescheduleAt) : null,
      },
    });

    return this.toEntity(record);
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
