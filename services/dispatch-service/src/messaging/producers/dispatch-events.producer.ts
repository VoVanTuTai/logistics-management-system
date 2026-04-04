import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  DispatchEventEnvelope,
  DispatchPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { Task } from '../../domain/entities/task.entity';

@Injectable()
export class DispatchEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildTaskAssignedEvent(task: Task): QueueOutboxEventInput {
    return this.buildEvent('task.assigned', task);
  }

  private buildEvent(
    eventType: DispatchPublishedEventType,
    task: Task,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: DispatchEventEnvelope = {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: task.shipmentCode,
      actor: null,
      location: null,
      data: {
        task,
      },
      idempotency_key: `${eventType}:task:${task.id}:${occurredAt.toISOString()}`,
    };

    return {
      eventId,
      eventType,
      routingKey: eventType,
      aggregateType: 'task',
      aggregateId: task.id,
      payload,
      occurredAt,
    };
  }
}
