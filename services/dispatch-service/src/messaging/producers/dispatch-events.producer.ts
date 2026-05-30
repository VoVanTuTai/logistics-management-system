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

  buildTaskAssignedEvent(
    task: Task,
    context?: { actorId?: string | null; actorUsername?: string | null; hubCode?: string | null },
  ): QueueOutboxEventInput {
    return this.buildEvent('task.assigned', task, context);
  }

  private buildEvent(
    eventType: DispatchPublishedEventType,
    task: Task,
    context?: { actorId?: string | null; actorUsername?: string | null; hubCode?: string | null },
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: DispatchEventEnvelope = {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: task.shipmentCode,
      actor: context?.actorUsername
        ? {
            id: context.actorId ?? 'UNKNOWN',
            name: context.actorUsername,
          }
        : null,
      location: context?.hubCode
        ? {
            locationCode: context.hubCode,
          }
        : null,
      data: {
        task,
        actor: context?.actorUsername
          ? {
              id: context.actorId ?? 'UNKNOWN',
              name: context.actorUsername,
            }
          : null,
        location: context?.hubCode
          ? {
              locationCode: context.hubCode,
            }
          : null,
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
