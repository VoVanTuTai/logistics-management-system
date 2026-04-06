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

  buildManifestSealedEvents(manifest: Manifest): QueueOutboxEventInput[] {
    return this.buildEvents('manifest.sealed', manifest);
  }

  buildManifestReceivedEvents(manifest: Manifest): QueueOutboxEventInput[] {
    return this.buildEvents('manifest.received', manifest);
  }

  private buildEvents(
    eventType: ManifestPublishedEventType,
    manifest: Manifest,
  ): QueueOutboxEventInput[] {
    const targets = this.resolveTargetShipmentCodes(manifest);

    return targets.map((shipmentCode) =>
      this.buildEvent(eventType, manifest, shipmentCode),
    );
  }

  private buildEvent(
    eventType: ManifestPublishedEventType,
    manifest: Manifest,
    shipmentCode: string | null,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const idempotencyShipmentCode = shipmentCode ?? 'none';
    const payload: ManifestEventEnvelope = {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: shipmentCode,
      actor: null,
      location: null,
      data: {
        manifest,
      },
      idempotency_key: `${eventType}:manifest:${manifest.id}:${idempotencyShipmentCode}:${occurredAt.toISOString()}`,
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

  private resolveTargetShipmentCodes(manifest: Manifest): Array<string | null> {
    const normalizedCodes = this.normalizeShipmentCodes(
      manifest.items.map((item) => item.shipmentCode),
    );

    if (normalizedCodes.length === 0) {
      return [null];
    }

    return normalizedCodes;
  }

  private normalizeShipmentCodes(shipmentCodes: string[]): string[] {
    return Array.from(
      new Set(
        shipmentCodes
          .map((shipmentCode) => shipmentCode?.trim())
          .filter((shipmentCode): shipmentCode is string => Boolean(shipmentCode)),
      ),
    );
  }
}
