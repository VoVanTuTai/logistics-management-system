import { Injectable } from '@nestjs/common';
import type {
  AuthSession as PrismaAuthSessionRecord,
  Prisma,
} from '@prisma/client';

import type {
  AuthSession,
  CreateAuthSessionInput,
  RotateAuthSessionTokensInput,
} from '../../domain/entities/auth-session.entity';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthSessionPrismaRepository extends AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const data: Prisma.AuthSessionCreateInput = {
      issuedAt: input.issuedAt,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      accessTokenHash: input.accessTokenHash,
      refreshTokenHash: input.refreshTokenHash,
      user: {
        connect: {
          id: input.userId,
        },
      },
    };

    const record = await this.prisma.authSession.create({ data });

    return this.toEntity(record);
  }

  async findById(id: string): Promise<AuthSession | null> {
    const record = await this.prisma.authSession.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async findActiveByAccessTokenHash(
    accessTokenHash: string,
  ): Promise<AuthSession | null> {
    const record = await this.prisma.authSession.findFirst({
      where: {
        accessTokenHash,
        status: 'ACTIVE',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findActiveByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null> {
    const record = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash,
        status: 'ACTIVE',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async rotateTokens(
    id: string,
    input: RotateAuthSessionTokensInput,
  ): Promise<AuthSession> {
    const record = await this.prisma.authSession.update({
      where: { id },
      data: {
        accessTokenHash: input.accessTokenHash,
        refreshTokenHash: input.refreshTokenHash,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    return this.toEntity(record);
  }

  async touch(id: string): Promise<AuthSession> {
    const record = await this.prisma.authSession.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return this.toEntity(record);
  }

  async revoke(id: string, reason: string | null): Promise<AuthSession> {
    const record = await this.prisma.authSession.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokeReason: reason,
        revokedAt: new Date(),
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaAuthSessionRecord): AuthSession {
    return {
      id: record.id,
      userId: record.userId,
      accessTokenHash: record.accessTokenHash,
      refreshTokenHash: record.refreshTokenHash,
      status: record.status,
      issuedAt: record.issuedAt,
      accessTokenExpiresAt: record.accessTokenExpiresAt,
      refreshTokenExpiresAt: record.refreshTokenExpiresAt,
      lastUsedAt: record.lastUsedAt,
      revokedAt: record.revokedAt,
      revokeReason: record.revokeReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
