import { Injectable } from '@nestjs/common';
import type {
  MobilePermissionOverride as PrismaMobilePermissionOverrideRecord,
  MobilePermissionProfile as PrismaMobilePermissionProfileRecord,
  Prisma,
} from '@prisma/client';

import type {
  MobilePermissionActor,
  MobilePermissionMap,
  MobilePermissionOverride,
  MobilePermissionProfile,
} from '../../domain/entities/mobile-permission.entity';
import { MobilePermissionRepository } from '../../domain/repositories/mobile-permission.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class MobilePermissionPrismaRepository extends MobilePermissionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listProfiles(): Promise<MobilePermissionProfile[]> {
    const records = await this.prisma.mobilePermissionProfile.findMany();
    return records.map((record) => this.toProfileEntity(record));
  }

  async upsertProfile(
    actor: MobilePermissionActor,
    permissions: MobilePermissionMap,
  ): Promise<MobilePermissionProfile> {
    const record = await this.prisma.mobilePermissionProfile.upsert({
      where: { actor },
      create: {
        actor,
        permissions: permissions as Prisma.InputJsonValue,
      },
      update: {
        permissions: permissions as Prisma.InputJsonValue,
      },
    });

    return this.toProfileEntity(record);
  }

  async findOverrideByUserId(
    userId: string,
  ): Promise<MobilePermissionOverride | null> {
    const record = await this.prisma.mobilePermissionOverride.findUnique({
      where: { userId },
    });

    return record ? this.toOverrideEntity(record) : null;
  }

  async upsertOverride(
    userId: string,
    permissions: MobilePermissionMap,
  ): Promise<MobilePermissionOverride> {
    const record = await this.prisma.mobilePermissionOverride.upsert({
      where: { userId },
      create: {
        userId,
        permissions: permissions as Prisma.InputJsonValue,
      },
      update: {
        permissions: permissions as Prisma.InputJsonValue,
      },
    });

    return this.toOverrideEntity(record);
  }

  private toProfileEntity(
    record: PrismaMobilePermissionProfileRecord,
  ): MobilePermissionProfile {
    return {
      id: record.id,
      actor: record.actor as MobilePermissionActor,
      permissions: record.permissions as MobilePermissionMap,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toOverrideEntity(
    record: PrismaMobilePermissionOverrideRecord,
  ): MobilePermissionOverride {
    return {
      id: record.id,
      userId: record.userId,
      permissions: record.permissions as MobilePermissionMap,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
