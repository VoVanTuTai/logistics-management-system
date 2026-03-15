import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  ManifestEventEnvelope,
  ManifestPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { Manifest } from '../../domain/entities/manifest.entity';

@Injectable()
export class ManifestEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildManifestCreatedEvent(manifest: Manifest): QueueOutboxEventInput {
    return this.buildEvent('manifest.created', manifest);
  }

  buildManifestUpdatedEvent(manifest: Manifest): QueueOutboxEventInput {
    return this.buildEvent('manifest.updated', manifest);
  }

  buildManifestSealedEvent(manifest: Manifest): QueueOutboxEventInput {
    return this.buildEvent('manifest.sealed', manifest);
  }

  buildManifestReceivedEvent(manifest: Manifest): QueueOutboxEventInput {
    return this.buildEvent('manifest.received', manifest);
  }

  private buildEvent(
    eventType: ManifestPublishedEventType,
    manifest: Manifest,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const payload: ManifestEventEnvelope = {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: manifest.items[0]?.shipmentCode ?? null,
      actor: null,
      location: null,
      data: {
        manifest,
      },
      idempotency_key: `${eventType}:manifest:${manifest.id}:${occurredAt.toISOString()}`,
    };

    return {
      eventId,
      eventType,
      routingKey: eventType,
      aggregateType: 'manifest',
      aggregateId: manifest.id,
      payload,
      occurredAt,
    };
  }
}
