import { Injectable } from '@nestjs/common';
import type { UserAccount as PrismaUserAccountRecord } from '@prisma/client';

import type { UserAccount } from '../../domain/entities/user-account.entity';
import { UserAccountRepository } from '../../domain/repositories/user-account.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class UserAccountPrismaRepository extends UserAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
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

  private toEntity(record: PrismaUserAccountRecord): UserAccount {
    return {
      id: record.id,
      username: record.username,
      passwordHash: record.passwordHash,
      status: record.status,
      roles: record.roles,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
