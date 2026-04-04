import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  BuildScanPublishedEventInput,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';

@Injectable()
export class ScanEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildPickupConfirmedEvent(
    scanEvent: BuildScanPublishedEventInput['scanEvent'],
  ): QueueOutboxEventInput {
    return this.buildScanEvent({
      eventType: 'scan.pickup_confirmed',
      scanEvent,
    });
  }

  buildInboundEvent(
    scanEvent: BuildScanPublishedEventInput['scanEvent'],
  ): QueueOutboxEventInput {
    return this.buildScanEvent({
      eventType: 'scan.inbound',
      scanEvent,
    });
  }

  buildOutboundEvent(
    scanEvent: BuildScanPublishedEventInput['scanEvent'],
  ): QueueOutboxEventInput {
    return this.buildScanEvent({
      eventType: 'scan.outbound',
      scanEvent,
    });
  }

  private buildScanEvent(
    input: BuildScanPublishedEventInput,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();

    return {
      eventId,
      eventType: input.eventType,
      routingKey: input.eventType,
      aggregateType: 'scan_event',
      aggregateId: input.scanEvent.id,
      payload: {
        event_id: eventId,
        event_type: input.eventType,
        occurred_at: occurredAt.toISOString(),
        shipment_code: input.scanEvent.shipmentCode,
        actor: input.scanEvent.actor,
        location: input.scanEvent.locationCode
          ? { location_code: input.scanEvent.locationCode }
          : null,
        data: {
          scanEvent: input.scanEvent,
        },
        idempotency_key: input.scanEvent.idempotencyKey,
      },
      occurredAt,
    };
  }
}
