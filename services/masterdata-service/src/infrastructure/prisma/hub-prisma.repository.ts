import { Injectable } from '@nestjs/common';
import { Prisma, type Hub as PrismaHubRecord } from '@prisma/client';

import {
  Hub,
  HubCreateInput,
  HubListFilters,
  HubWriteInput,
} from '../../domain/entities/hub.entity';
import { HubRepository } from '../../domain/repositories/hub.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class HubPrismaRepository extends HubRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: HubListFilters = {}): Promise<Hub[]> {
    const where: Prisma.HubWhereInput = {};

    if (filters.code) {
      where.code = filters.code;
    }

    if (filters.zoneCode) {
      where.zoneCode = filters.zoneCode;
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
        {
          address: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const records = await this.prisma.hub.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<Hub | null> {
    const record = await this.prisma.hub.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByCode(code: string): Promise<Hub | null> {
    const record = await this.prisma.hub.findFirst({
      where: {
        code: {
          equals: code,
          mode: 'insensitive',
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: HubCreateInput): Promise<Hub> {
    const data: Prisma.HubCreateInput = {
      code: input.code,
      name: input.name,
      level: input.level ?? 2,
      parentCode: input.parentCode ?? null,
      zoneCode: input.zoneCode ?? null,
      address: input.address ?? null,
      district: input.district ?? null,
      ward: input.ward ?? null,
      coverageRadiusKm: input.coverageRadiusKm ?? null,
      boundaryPolygon: input.boundaryPolygon !== undefined ? (input.boundaryPolygon as Prisma.InputJsonValue) : Prisma.DbNull,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isActive: input.isActive ?? true,
    };

    const record = await this.prisma.hub.create({ data });

    return this.toEntity(record);
  }

  async update(id: string, input: Partial<HubWriteInput>): Promise<Hub> {
    const data: Prisma.HubUpdateInput = {};

    if (input.code !== undefined) {
      data.code = input.code;
    }

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.level !== undefined) {
      data.level = input.level;
    }

    if (input.parentCode !== undefined) {
      data.parentCode = input.parentCode;
    }

    if (input.zoneCode !== undefined) {
      data.zoneCode = input.zoneCode;
    }

    if (input.address !== undefined) {
      data.address = input.address;
    }

    if (input.district !== undefined) {
      data.district = input.district;
    }

    if (input.ward !== undefined) {
      data.ward = input.ward;
    }

    if (input.coverageRadiusKm !== undefined) {
      data.coverageRadiusKm = input.coverageRadiusKm;
    }

    if (input.boundaryPolygon !== undefined) {
      data.boundaryPolygon = input.boundaryPolygon !== null ? (input.boundaryPolygon as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    if (input.latitude !== undefined) {
      data.latitude = input.latitude;
    }

    if (input.longitude !== undefined) {
      data.longitude = input.longitude;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const record = await this.prisma.hub.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.hub.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  private toEntity(record: PrismaHubRecord): Hub {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      level: record.level,
      parentCode: record.parentCode,
      zoneCode: record.zoneCode,
      address: record.address,
      district: record.district,
      ward: record.ward,
      coverageRadiusKm: record.coverageRadiusKm,
      boundaryPolygon: record.boundaryPolygon,
      latitude: record.latitude,
      longitude: record.longitude,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
