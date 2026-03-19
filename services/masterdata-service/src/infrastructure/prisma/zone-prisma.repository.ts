import { Injectable } from '@nestjs/common';
import type { Prisma, Zone as PrismaZoneRecord } from '@prisma/client';

import {
  Zone,
  ZoneListFilters,
  ZoneWriteInput,
} from '../../domain/entities/zone.entity';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ZonePrismaRepository extends ZoneRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: ZoneListFilters = {}): Promise<Zone[]> {
    const where: Prisma.ZoneWhereInput = {};

    if (filters.code) {
      where.code = filters.code;
    }

    if (filters.parentCode) {
      where.parentCode = filters.parentCode;
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
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
          name: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const records = await this.prisma.zone.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<Zone | null> {
    const record = await this.prisma.zone.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByCode(code: string): Promise<Zone | null> {
    const record = await this.prisma.zone.findUnique({
      where: { code },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: ZoneWriteInput): Promise<Zone> {
    const data: Prisma.ZoneCreateInput = {
      code: input.code,
      name: input.name,
      parentCode: input.parentCode ?? null,
      isActive: input.isActive ?? true,
    };

    const record = await this.prisma.zone.create({ data });

    return this.toEntity(record);
  }

  async update(id: string, input: Partial<ZoneWriteInput>): Promise<Zone> {
    const record = await this.prisma.$transaction(async (tx) => {
      const current = await tx.zone.findUnique({
        where: { id },
      });

      if (!current) {
        throw new Error(`Zone "${id}" was not found.`);
      }

      const nextCode = input.code ?? current.code;
      const data: Prisma.ZoneUpdateInput = {};

      if (input.code !== undefined) {
        data.code = input.code;
      }

      if (input.name !== undefined) {
        data.name = input.name;
      }

      if (input.parentCode !== undefined) {
        data.parentCode = input.parentCode;
      }

      if (input.isActive !== undefined) {
        data.isActive = input.isActive;
      }

      const updated = await tx.zone.update({
        where: { id },
        data,
      });

      if (input.code && input.code !== current.code) {
        await tx.zone.updateMany({
          where: { parentCode: current.code },
          data: { parentCode: nextCode },
        });

        await tx.hub.updateMany({
          where: { zoneCode: current.code },
          data: { zoneCode: nextCode },
        });
      }

      return updated;
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaZoneRecord): Zone {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      parentCode: record.parentCode,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
