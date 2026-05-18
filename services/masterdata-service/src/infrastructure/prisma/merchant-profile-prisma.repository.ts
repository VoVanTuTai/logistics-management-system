import { Injectable } from '@nestjs/common';
import type {
  MerchantProfile as PrismaMerchantProfileRecord,
  Prisma,
} from '@prisma/client';

import {
  MerchantProfile,
  MerchantProfileListFilters,
  MerchantProfileWriteInput,
} from '../../domain/entities/merchant-profile.entity';
import { MerchantProfileRepository } from '../../domain/repositories/merchant-profile.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class MerchantProfilePrismaRepository extends MerchantProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: MerchantProfileListFilters = {}): Promise<MerchantProfile[]> {
    const where: Prisma.MerchantProfileWhereInput = {};

    if (filters.username) {
      where.username = filters.username;
    }

    if (filters.citizenId) {
      where.citizenId = filters.citizenId;
    }

    if (filters.regionCode) {
      where.regionCode = filters.regionCode;
    }

    if (filters.defaultHubCode) {
      where.defaultHubCode = filters.defaultHubCode;
    }

    if (filters.q) {
      where.OR = [
        {
          username: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          citizenId: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          regionLabel: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
        {
          defaultHubCode: {
            contains: filters.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const records = await this.prisma.merchantProfile.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<MerchantProfile | null> {
    const record = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByUsername(username: string): Promise<MerchantProfile | null> {
    const record = await this.prisma.merchantProfile.findUnique({
      where: { username },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByCitizenId(citizenId: string): Promise<MerchantProfile | null> {
    const record = await this.prisma.merchantProfile.findUnique({
      where: { citizenId },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: MerchantProfileWriteInput): Promise<MerchantProfile> {
    const record = await this.prisma.merchantProfile.create({
      data: this.toPrismaCreateData(input),
    });

    return this.toEntity(record);
  }

  async update(
    id: string,
    input: Partial<MerchantProfileWriteInput>,
  ): Promise<MerchantProfile> {
    const data: Prisma.MerchantProfileUpdateInput = {};

    if (input.username !== undefined) {
      data.username = input.username;
    }

    if (input.citizenId !== undefined) {
      data.citizenId = input.citizenId;
    }

    if (input.regionCode !== undefined) {
      data.regionCode = input.regionCode;
    }

    if (input.regionLabel !== undefined) {
      data.regionLabel = input.regionLabel;
    }

    if (input.defaultHubCode !== undefined) {
      data.defaultHubCode = input.defaultHubCode;
    }

    if (input.defaultHubName !== undefined) {
      data.defaultHubName = input.defaultHubName;
    }

    if (input.defaultSenderAddress !== undefined) {
      data.defaultSenderAddress = input.defaultSenderAddress;
    }

    const record = await this.prisma.merchantProfile.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  async upsertByUsername(
    username: string,
    input: MerchantProfileWriteInput,
  ): Promise<MerchantProfile> {
    const record = await this.prisma.merchantProfile.upsert({
      where: { username },
      create: this.toPrismaCreateData(input),
      update: this.toPrismaUpdateData(input),
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.merchantProfile.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  private toPrismaCreateData(
    input: MerchantProfileWriteInput,
  ): Prisma.MerchantProfileCreateInput {
    return {
      username: input.username,
      citizenId: input.citizenId,
      regionCode: input.regionCode,
      regionLabel: input.regionLabel,
      defaultHubCode: input.defaultHubCode ?? null,
      defaultHubName: input.defaultHubName ?? null,
      defaultSenderAddress: input.defaultSenderAddress ?? null,
    };
  }

  private toPrismaUpdateData(
    input: MerchantProfileWriteInput,
  ): Prisma.MerchantProfileUpdateInput {
    return {
      username: input.username,
      citizenId: input.citizenId,
      regionCode: input.regionCode,
      regionLabel: input.regionLabel,
      defaultHubCode: input.defaultHubCode ?? null,
      defaultHubName: input.defaultHubName ?? null,
      defaultSenderAddress: input.defaultSenderAddress ?? null,
    };
  }

  private toEntity(record: PrismaMerchantProfileRecord): MerchantProfile {
    return {
      id: record.id,
      username: record.username,
      citizenId: record.citizenId,
      regionCode: record.regionCode,
      regionLabel: record.regionLabel,
      defaultHubCode: record.defaultHubCode,
      defaultHubName: record.defaultHubName,
      defaultSenderAddress: record.defaultSenderAddress,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
