import { Injectable } from '@nestjs/common';
import type {
  Config as PrismaConfigRecord,
  Prisma,
} from '@prisma/client';

import {
  Config,
  ConfigValue,
  ConfigWriteInput,
} from '../../domain/entities/config.entity';
import { ConfigRepository } from '../../domain/repositories/config.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ConfigPrismaRepository extends ConfigRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<Config[]> {
    const records = await this.prisma.config.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<Config | null> {
    const record = await this.prisma.config.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: ConfigWriteInput): Promise<Config> {
    const data: Prisma.ConfigCreateInput = {
      key: input.key,
      value: input.value as Prisma.InputJsonValue,
      scope: input.scope ?? null,
      description: input.description ?? null,
    };

    const record = await this.prisma.config.create({ data });

    return this.toEntity(record);
  }

  async update(id: string, input: Partial<ConfigWriteInput>): Promise<Config> {
    const data: Prisma.ConfigUpdateInput = {};

    if (input.key !== undefined) {
      data.key = input.key;
    }

    if (input.value !== undefined) {
      data.value = input.value as Prisma.InputJsonValue;
    }

    if (input.scope !== undefined) {
      data.scope = input.scope;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    const record = await this.prisma.config.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaConfigRecord): Config {
    return {
      id: record.id,
      key: record.key,
      value: record.value as ConfigValue,
      scope: record.scope,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
