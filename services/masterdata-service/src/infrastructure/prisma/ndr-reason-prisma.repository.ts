import { Injectable } from '@nestjs/common';
import type {
  NdrReason as PrismaNdrReasonRecord,
  Prisma,
} from '@prisma/client';

import {
  NdrReason,
  NdrReasonListFilters,
  NdrReasonWriteInput,
} from '../../domain/entities/ndr-reason.entity';
import { NdrReasonRepository } from '../../domain/repositories/ndr-reason.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class NdrReasonPrismaRepository extends NdrReasonRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: NdrReasonListFilters = {}): Promise<NdrReason[]> {
    const where: Prisma.NdrReasonWhereInput = {};

    if (filters.code) {
      where.code = filters.code;
    }

    if (filters.description) {
      where.description = {
        contains: filters.description,
        mode: 'insensitive',
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.q) {
      where.OR = [
        {
          code: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const records = await this.prisma.ndrReason.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<NdrReason | null> {
    const record = await this.prisma.ndrReason.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByCode(code: string): Promise<NdrReason | null> {
    const record = await this.prisma.ndrReason.findUnique({
      where: { code },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: NdrReasonWriteInput): Promise<NdrReason> {
    const data: Prisma.NdrReasonCreateInput = {
      code: input.code,
      description: input.description,
      isActive: input.isActive ?? true,
    };

    const record = await this.prisma.ndrReason.create({ data });

    return this.toEntity(record);
  }

  async update(
    id: string,
    input: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReason> {
    const data: Prisma.NdrReasonUpdateInput = {};

    if (input.code !== undefined) {
      data.code = input.code;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const record = await this.prisma.ndrReason.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaNdrReasonRecord): NdrReason {
    return {
      id: record.id,
      code: record.code,
      description: record.description,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
