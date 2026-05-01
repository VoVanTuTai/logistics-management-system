import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type {
  ManifestEventEnvelope,
  ManifestPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { Manifest } from '../../domain/entities/manifest.entity';

interface ManifestUnsealedActorInput {
  unsealedBy?: string | null;
  unsealedByName?: string | null;
  processingHubCode?: string | null;
  note?: string | null;
}

@Injectable()
export class ManifestEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildManifestSealedEvents(manifest: Manifest): QueueOutboxEventInput[] {
    return this.buildEvents('manifest.sealed', manifest);
  }

  buildManifestReceivedEvents(manifest: Manifest): QueueOutboxEventInput[] {
    return this.buildEvents('manifest.received', manifest);
  }

  buildManifestUnsealedEvents(
    manifest: Manifest,
    shipmentCodes: string[],
    actorInput: ManifestUnsealedActorInput,
  ): QueueOutboxEventInput[] {
    const targetShipmentCodes = this.normalizeShipmentCodes(shipmentCodes);
    const targets = targetShipmentCodes.length > 0 ? targetShipmentCodes : [null];

    return targets.map((shipmentCode) =>
      this.buildEvent('manifest.unsealed', manifest, shipmentCode, actorInput),
    );
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
    actorInput?: ManifestUnsealedActorInput,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const idempotencyShipmentCode = shipmentCode ?? 'none';
    const actor = this.buildActor(actorInput);
    const location = this.buildLocation(actorInput);
    const payload: ManifestEventEnvelope = {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: shipmentCode,
      actor,
      location,
      data: {
        manifest,
        ...(eventType === 'manifest.unsealed'
          ? {
              unseal: {
                shipmentCode,
                note: actorInput?.note ?? null,
                employeeCode: actorInput?.unsealedBy ?? null,
                employeeName: actorInput?.unsealedByName ?? null,
                processingHubCode: actorInput?.processingHubCode ?? null,
              },
            }
          : {}),
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

  private buildActor(
    input: ManifestUnsealedActorInput | undefined,
  ): Record<string, unknown> | null {
    const employeeCode = input?.unsealedBy?.trim() ?? '';
    const employeeName = input?.unsealedByName?.trim() ?? '';
    const hubCode = input?.processingHubCode?.trim() ?? '';

    if (!employeeCode && !employeeName && !hubCode) {
      return null;
    }

    return {
      id: employeeCode || null,
      name: employeeName || null,
      hub_code: hubCode || null,
    };
  }

  private buildLocation(
    input: ManifestUnsealedActorInput | undefined,
  ): Record<string, unknown> | null {
    const hubCode = input?.processingHubCode?.trim() ?? '';

    if (!hubCode) {
      return null;
    }

    return {
      location_code: hubCode,
    };
  }
}
