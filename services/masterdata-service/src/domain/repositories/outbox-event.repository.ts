import { OutboxEvent, QueueOutboxEventInput } from '../entities/outbox-event.entity';

export abstract class OutboxEventRepository {
  abstract create(input: QueueOutboxEventInput): Promise<OutboxEvent>;
  abstract listPending(limit: number): Promise<OutboxEvent[]>;
  abstract markPublished(id: string, publishedAt: Date): Promise<void>;
}
