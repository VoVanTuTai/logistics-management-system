import { Injectable } from '@nestjs/common';
import type { Prisma, Zone as PrismaZoneRecord } from '@prisma/client';

import { Zone, ZoneWriteInput } from '../../domain/entities/zone.entity';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ZonePrismaRepository extends ZoneRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<Zone[]> {
    const records = await this.prisma.zone.findMany({
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

    const record = await this.prisma.zone.update({
      where: { id },
      data,
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
