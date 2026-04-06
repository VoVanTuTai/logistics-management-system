import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  QueueOutboxEventInput,
  ShipmentEventEnvelope,
  ShipmentPublishedEventType,
} from '../../domain/entities/outbox-event.entity';
import type { Shipment } from '../../domain/entities/shipment.entity';

interface BuildEventParams {
  eventType: ShipmentPublishedEventType;
  shipmentCode: string | null;
  aggregateType: string;
  aggregateId: string | null;
  data: Record<string, unknown>;
}

@Injectable()
export class ShipmentEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildShipmentCreatedEvent(shipment: Shipment): QueueOutboxEventInput {
    return this.buildEvent({
      eventType: 'shipment.created',
      shipmentCode: shipment.code,
      aggregateType: 'shipment',
      aggregateId: shipment.id,
      data: {
        shipment,
      },
    });
  }

  private buildEvent(params: BuildEventParams): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: ShipmentEventEnvelope = {
      event_id: eventId,
      event_type: params.eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: params.shipmentCode,
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
