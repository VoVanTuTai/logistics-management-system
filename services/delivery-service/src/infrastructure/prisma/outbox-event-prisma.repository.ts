import { Injectable } from '@nestjs/common';
import type {
  OutboxEvent as PrismaOutboxEventRecord,
  Prisma,
} from '@prisma/client';

import type {
  DeliveryEventEnvelope,
  OutboxEvent,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class OutboxEventPrismaRepository extends OutboxEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: QueueOutboxEventInput): Promise<OutboxEvent> {
    const data: Prisma.OutboxEventCreateInput = {
      eventId: input.eventId,
      eventType: input.eventType,
      routingKey: input.routingKey,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload as unknown as Prisma.InputJsonValue,
      occurredAt: input.occurredAt,
    };

    const record = await this.prisma.outboxEvent.create({ data });

    return this.toEntity(record);
  }

  async listPending(limit: number): Promise<OutboxEvent[]> {
    const records = await this.prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: limit,
    });

    return records.map((record) => this.toEntity(record));
  }

  async markPublished(id: string, publishedAt: Date): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt,
      },
    });
  }

  private toEntity(record: PrismaOutboxEventRecord): OutboxEvent {
    return {
      id: record.id,
      eventId: record.eventId,
      eventType: record.eventType as OutboxEvent['eventType'],
      routingKey: record.routingKey,
      aggregateType: record.aggregateType,
      aggregateId: record.aggregateId,
      payload: record.payload as unknown as DeliveryEventEnvelope,
      status: record.status as OutboxEvent['status'],
      retryCount: record.retryCount,
      occurredAt: record.occurredAt,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
