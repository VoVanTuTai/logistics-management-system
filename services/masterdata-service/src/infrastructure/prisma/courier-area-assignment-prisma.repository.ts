import { Injectable } from '@nestjs/common';
import type { CourierAreaAssignment as PrismaCourierAreaAssignmentRecord, Prisma } from '@prisma/client';

import {
  CourierAreaAssignment,
  CourierAreaAssignmentListFilters,
  CourierAreaAssignmentWriteInput,
} from '../../domain/entities/courier-area-assignment.entity';
import { CourierAreaAssignmentRepository } from '../../domain/repositories/courier-area-assignment.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class CourierAreaAssignmentPrismaRepository extends CourierAreaAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: CourierAreaAssignmentListFilters = {}): Promise<CourierAreaAssignment[]> {
    const where: Prisma.CourierAreaAssignmentWhereInput = {};

    if (filters.courierId) {
      where.courierId = filters.courierId;
    }

    if (filters.hubCode) {
      where.hubCode = filters.hubCode;
    }

    if (filters.province) {
      where.province = {
        equals: filters.province,
        mode: 'insensitive',
      };
    }

    if (filters.district) {
      where.district = {
        equals: filters.district,
        mode: 'insensitive',
      };
    }

    if (filters.ward) {
      where.ward = {
        equals: filters.ward,
        mode: 'insensitive',
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const records = await this.prisma.courierAreaAssignment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<CourierAreaAssignment | null> {
    const record = await this.prisma.courierAreaAssignment.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByUniqueKey(
    courierId: string,
    province: string,
    district: string,
    ward: string,
  ): Promise<CourierAreaAssignment | null> {
    const record = await this.prisma.courierAreaAssignment.findUnique({
      where: {
        courierId_province_district_ward: {
          courierId,
          province,
          district,
          ward,
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CourierAreaAssignmentWriteInput): Promise<CourierAreaAssignment> {
    const data: Prisma.CourierAreaAssignmentCreateInput = {
      courierId: input.courierId,
      hubCode: input.hubCode,
      province: input.province,
      district: input.district,
      ward: input.ward,
      isActive: input.isActive ?? true,
    };

    const record = await this.prisma.courierAreaAssignment.create({ data });

    return this.toEntity(record);
  }

  async update(id: string, input: Partial<CourierAreaAssignmentWriteInput>): Promise<CourierAreaAssignment> {
    const data: Prisma.CourierAreaAssignmentUpdateInput = {};

    if (input.courierId !== undefined) {
      data.courierId = input.courierId;
    }

    if (input.hubCode !== undefined) {
      data.hubCode = input.hubCode;
    }

    if (input.province !== undefined) {
      data.province = input.province;
    }

    if (input.district !== undefined) {
      data.district = input.district;
    }

    if (input.ward !== undefined) {
      data.ward = input.ward;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const record = await this.prisma.courierAreaAssignment.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.courierAreaAssignment.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  private toEntity(record: PrismaCourierAreaAssignmentRecord): CourierAreaAssignment {
    return {
      id: record.id,
      courierId: record.courierId,
      hubCode: record.hubCode,
      province: record.province,
      district: record.district,
      ward: record.ward,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
