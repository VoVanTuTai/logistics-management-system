import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  PickupEventEnvelope,
  PickupPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { PickupRequest } from '../../domain/entities/pickup-request.entity';

interface BuildEventParams {
  eventType: PickupPublishedEventType;
  aggregateId: string | null;
  data: Record<string, unknown>;
  shipmentCode: string | null;
}

@Injectable()
export class PickupEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildPickupRequestedEvent(pickupRequest: PickupRequest): QueueOutboxEventInput {
    return this.buildEvent({
      eventType: 'pickup.requested',
      aggregateId: pickupRequest.id,
      shipmentCode: pickupRequest.items[0]?.shipmentCode ?? null,
      data: {
        pickup_request: pickupRequest,
      },
    });
  }

  buildPickupApprovedEvent(
    pickupRequest: PickupRequest,
    data: Record<string, unknown>,
  ): QueueOutboxEventInput {
    return this.buildEvent({
      eventType: 'pickup.approved',
      aggregateId: pickupRequest.id,
      shipmentCode: pickupRequest.items[0]?.shipmentCode ?? null,
      data: {
        pickup_request: pickupRequest,
        ...data,
      },
    });
  }

  private buildEvent(params: BuildEventParams): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: PickupEventEnvelope = {
      event_id: eventId,
      event_type: params.eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: params.shipmentCode,
      actor: null,
      location: null,
      data: params.data,
      idempotency_key: `${params.eventType}:pickup-request:${params.aggregateId ?? 'na'}:${occurredAt.toISOString()}`,
    };

    return {
      eventId,
      eventType: params.eventType,
      routingKey: params.eventType,
      aggregateType: 'pickup-request',
      aggregateId: params.aggregateId,
      payload,
      occurredAt,
    };
  }
}
