import { Injectable } from '@nestjs/common';
import type { Pod as PrismaPodRecord, Prisma } from '@prisma/client';

import type { Pod, UpsertPodInput } from '../../domain/entities/pod.entity';
import { PodRepository } from '../../domain/repositories/pod.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PodPrismaRepository extends PodRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async upsertForAttempt(input: UpsertPodInput): Promise<Pod> {
    const capturedAt = input.capturedAt ? new Date(input.capturedAt) : new Date();
    const createData: Prisma.PodCreateInput = {
      imageUrl: input.imageUrl ?? null,
      note: input.note ?? null,
      capturedBy: input.capturedBy ?? null,
      capturedAt,
      deliveryAttempt: {
        connect: {
          id: input.deliveryAttemptId,
        },
      },
    };

    const record = await this.prisma.pod.upsert({
      where: {
        deliveryAttemptId: input.deliveryAttemptId,
      },
      update: {
        imageUrl: input.imageUrl ?? null,
        note: input.note ?? null,
        capturedBy: input.capturedBy ?? null,
        capturedAt,
      },
      create: createData,
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaPodRecord): Pod {
    return {
      id: record.id,
      deliveryAttemptId: record.deliveryAttemptId,
      imageUrl: record.imageUrl,
      note: record.note,
      capturedBy: record.capturedBy,
      capturedAt: record.capturedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
