import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  UserAccount as PrismaUserAccountRecord,
} from '@prisma/client';

import type {
  UserAccount,
  UserAccountCreateInput,
  UserAccountListFilters,
  UserAccountUpdateInput,
} from '../../domain/entities/user-account.entity';
import { UserAccountRepository } from '../../domain/repositories/user-account.repository';
import { PrismaService } from './prisma.service';

const ROLE_GROUPS: Record<'OPS' | 'SHIPPER', string[]> = {
  OPS: ['OPS_ADMIN', 'OPS_VIEWER'],
  SHIPPER: ['COURIER'],
};

@Injectable()
export class UserAccountPrismaRepository extends UserAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: UserAccountListFilters = {}): Promise<UserAccount[]> {
    const where: Prisma.UserAccountWhereInput = {};

    if (filters.roleGroup) {
      const mappedRoles = ROLE_GROUPS[filters.roleGroup];
      where.roles = {
        hasSome: mappedRoles,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.hubCode) {
      where.hubCodes = {
        has: filters.hubCode,
      };
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
          displayName: {
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
      ];
    }

    const records = await this.prisma.userAccount.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<UserAccount | null> {
    const record = await this.prisma.userAccount.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    const record = await this.prisma.userAccount.findUnique({
      where: { username },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: UserAccountCreateInput): Promise<UserAccount> {
    const data: Prisma.UserAccountCreateInput = {
      id: input.id,
      username: input.username,
      passwordHash: input.passwordHash,
      status: input.status,
      roles: input.roles,
      displayName: input.displayName ?? null,
      phone: input.phone ?? null,
      hubCodes: input.hubCodes ?? [],
    };

    const record = await this.prisma.userAccount.create({ data });

    return this.toEntity(record);
  }

  async update(id: string, input: UserAccountUpdateInput): Promise<UserAccount> {
    const data: Prisma.UserAccountUpdateInput = {};

    if (input.username !== undefined) {
      data.username = input.username;
    }

    if (input.passwordHash !== undefined) {
      data.passwordHash = input.passwordHash;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.roles !== undefined) {
      data.roles = input.roles;
    }

    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }

    if (input.phone !== undefined) {
      data.phone = input.phone;
    }

    if (input.hubCodes !== undefined) {
      data.hubCodes = input.hubCodes;
    }

    const record = await this.prisma.userAccount.update({
      where: { id },
      data,
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({
        where: { userId: id },
      });

      const result = await tx.userAccount.deleteMany({
        where: { id },
      });

      return result.count > 0;
    });

    return deleted;
  }

  private toEntity(record: PrismaUserAccountRecord): UserAccount {
    return {
      id: record.id,
      username: record.username,
      passwordHash: record.passwordHash,
      status: record.status,
      roles: record.roles,
      displayName: record.displayName,
      phone: record.phone,
      hubCodes: record.hubCodes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
