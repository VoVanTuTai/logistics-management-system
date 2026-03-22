import { Injectable } from '@nestjs/common';
import type {
  IdempotencyRecord as PrismaIdempotencyRecordEntity,
  Prisma,
} from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

import type {
  CreateIdempotencyRecordInput,
  IdempotencyRecord,
} from '../../domain/entities/idempotency-record.entity';
import { IdempotencyRecordRepository } from '../../domain/repositories/idempotency-record.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class IdempotencyRecordPrismaRepository extends IdempotencyRecordRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByKey(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    return record ? this.toEntity(record) : null;
  }

  async createIfAbsent(
    input: CreateIdempotencyRecordInput,
  ): Promise<IdempotencyRecord> {
    const data: Prisma.IdempotencyRecordCreateInput = {
      idempotencyKey: input.idempotencyKey,
      scope: input.scope,
      responsePayload: input.responsePayload as unknown as Prisma.InputJsonValue,
    };

    try {
      const record = await this.prisma.idempotencyRecord.create({ data });

      return this.toEntity(record);
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingRecord = await this.prisma.idempotencyRecord.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });

        if (existingRecord) {
          return this.toEntity(existingRecord);
        }
      }

      throw error;
    }
  }

  private toEntity(record: PrismaIdempotencyRecordEntity): IdempotencyRecord {
    return {
      id: record.id,
      idempotencyKey: record.idempotencyKey,
      scope: record.scope,
      responsePayload:
        record.responsePayload as unknown as IdempotencyRecord['responsePayload'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
