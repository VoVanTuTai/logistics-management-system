import { Injectable } from '@nestjs/common';
import type { Prisma, ReturnCase as PrismaReturnCaseRecord } from '@prisma/client';

import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ReturnCase,
} from '../../domain/entities/return-case.entity';
import { ReturnCaseRepository } from '../../domain/repositories/return-case.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReturnCasePrismaRepository extends ReturnCaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<ReturnCase | null> {
    const record = await this.prisma.returnCase.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByNdrCaseId(ndrCaseId: string): Promise<ReturnCase | null> {
    const record = await this.prisma.returnCase.findFirst({
      where: { ndrCaseId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateReturnCaseInput): Promise<ReturnCase> {
    const data: Prisma.ReturnCaseCreateInput = {
      shipmentCode: input.shipmentCode,
      ndrCaseId: input.ndrCaseId ?? null,
      note: input.note ?? null,
      status: 'STARTED',
      startedAt: new Date(),
    };

    const record = await this.prisma.returnCase.create({ data });

    return this.toEntity(record);
  }

  async complete(
    id: string,
    input: CompleteReturnCaseInput,
  ): Promise<ReturnCase> {
    const record = await this.prisma.returnCase.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        note: input.note !== undefined ? input.note : undefined,
        completedAt: new Date(),
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaReturnCaseRecord): ReturnCase {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      ndrCaseId: record.ndrCaseId,
      note: record.note,
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
