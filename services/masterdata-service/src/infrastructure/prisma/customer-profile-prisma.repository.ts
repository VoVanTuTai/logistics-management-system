import { Injectable } from '@nestjs/common';
import type {
  CustomerProfile as PrismaCustomerProfileRecord,
  Prisma,
} from '@prisma/client';

import {
  CustomerProfile,
  CustomerProfileListFilters,
  CustomerProfileWriteInput,
} from '../../domain/entities/customer-profile.entity';
import { CustomerProfileRepository } from '../../domain/repositories/customer-profile.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class CustomerProfilePrismaRepository extends CustomerProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: CustomerProfileListFilters = {}): Promise<CustomerProfile[]> {
    const where: Prisma.CustomerProfileWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.phone) {
      where.phone = filters.phone;
    }

    if (filters.q) {
      where.OR = [
        {
          fullName: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const records = await this.prisma.customerProfile.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<CustomerProfile | null> {
    const record = await this.prisma.customerProfile.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const record = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByPhone(phone: string): Promise<CustomerProfile | null> {
    const record = await this.prisma.customerProfile.findFirst({
      where: { phone },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CustomerProfileWriteInput): Promise<CustomerProfile> {
    const record = await this.prisma.customerProfile.create({
      data: this.toPrismaCreateData(input),
    });

    return this.toEntity(record);
  }

  async update(
    id: string,
    input: Partial<CustomerProfileWriteInput>,
  ): Promise<CustomerProfile> {
    const record = await this.prisma.customerProfile.update({
      where: { id },
      data: this.toPrismaUpdateData(input),
    });

    return this.toEntity(record);
  }

  async upsertByUserId(
    userId: string,
    input: CustomerProfileWriteInput,
  ): Promise<CustomerProfile> {
    const record = await this.prisma.customerProfile.upsert({
      where: { userId },
      create: this.toPrismaCreateData(input),
      update: this.toPrismaUpdateData(input),
    });

    return this.toEntity(record);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.prisma.customerProfile.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  private toPrismaCreateData(
    input: CustomerProfileWriteInput,
  ): Prisma.CustomerProfileCreateInput {
    return {
      userId: input.userId.trim(),
      fullName: input.fullName.trim(),
      phone: input.phone ? input.phone.trim() : null,
      email: input.email ? input.email.trim() : null,
      defaultAddress: input.defaultAddress ? input.defaultAddress.trim() : null,
    };
  }

  private toPrismaUpdateData(
    input: Partial<CustomerProfileWriteInput>,
  ): Prisma.CustomerProfileUpdateInput {
    const data: Prisma.CustomerProfileUpdateInput = {};

    if (input.userId !== undefined) {
      data.userId = input.userId.trim();
    }

    if (input.fullName !== undefined) {
      data.fullName = input.fullName.trim();
    }

    if (input.phone !== undefined) {
      data.phone = input.phone ? input.phone.trim() : null;
    }

    if (input.email !== undefined) {
      data.email = input.email ? input.email.trim() : null;
    }

    if (input.defaultAddress !== undefined) {
      data.defaultAddress = input.defaultAddress ? input.defaultAddress.trim() : null;
    }

    return data;
  }

  private toEntity(record: PrismaCustomerProfileRecord): CustomerProfile {
    return {
      id: record.id,
      userId: record.userId,
      fullName: record.fullName,
      phone: record.phone,
      email: record.email,
      defaultAddress: record.defaultAddress,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
