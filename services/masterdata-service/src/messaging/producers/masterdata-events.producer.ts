import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import {
  MasterdataEventEnvelope,
  MasterdataEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';

interface BuildEventParams {
  eventType: MasterdataEventType;
  aggregateType: string;
  aggregateId: string | null;
  data: Record<string, unknown>;
}

@Injectable()
export class MasterdataEventsProducer {
  buildMasterdataUpdatedEvent(
    aggregateType: string,
    aggregateId: string | null,
    data: Record<string, unknown>,
  ): QueueOutboxEventInput {
    return this.buildEvent({
      eventType: 'masterdata.updated',
      aggregateType,
      aggregateId,
      data,
    });
  }

  buildNdrReasonUpdatedEvent(
    aggregateId: string | null,
    data: Record<string, unknown>,
  ): QueueOutboxEventInput {
    return this.buildEvent({
      eventType: 'ndr-reason.updated',
      aggregateType: 'ndr-reason',
      aggregateId,
      data,
    });
  }

  private buildEvent(params: BuildEventParams): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: MasterdataEventEnvelope = {
      event_id: eventId,
      event_type: params.eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: null,
      actor: null,
      location: null,
      data: params.data,
      idempotency_key: `${params.eventType}:${params.aggregateType}:${params.aggregateId ?? 'na'}:${occurredAt.toISOString()}`,
    };

    return {
      eventId,
      eventType: params.eventType,
      routingKey: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload,
      occurredAt,
    };
  }
}
