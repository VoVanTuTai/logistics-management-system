import { Injectable, Logger } from '@nestjs/common';

import type {
  LinehaulHandover,
  LinehaulIncident,
  LinehaulSeal,
  LinehaulTrip,
  LinehaulTripManifest,
} from '../domain/entities/linehaul.entity';

export type LinehaulEventType =
  | 'linehaul.trip_created'
  | 'linehaul.vehicle_assigned'
  | 'linehaul.manifest_loaded'
  | 'linehaul.vehicle_sealed'
  | 'linehaul.departed'
  | 'linehaul.arrived'
  | 'linehaul.manifest_received'
  | 'linehaul.completed'
  | 'linehaul.cancelled'
  | 'linehaul.incident_reported'
  | 'linehaul.handover_signed';

interface LinehaulEventEnvelope {
  event_id: string;
  event_type: LinehaulEventType;
  occurred_at: string;
  shipment_code: null;
  actor: Record<string, unknown> | null;
  location: Record<string, unknown> | null;
  data: Record<string, unknown>;
  idempotency_key: string;
}

interface RabbitmqHttpConfig {
  publishUrl: string;
  authHeader: string;
}

interface PublishLinehaulEventInput {
  eventType: LinehaulEventType;
  trip: LinehaulTrip;
  aggregateKey: string;
  actor?: string | null;
  locationCode?: string | null;
  manifest?: LinehaulTripManifest | null;
  seal?: LinehaulSeal | null;
  incident?: LinehaulIncident | null;
  handover?: LinehaulHandover | null;
  extraData?: Record<string, unknown>;
}

@Injectable()
export class LinehaulEventsPublisher {
  private readonly logger = new Logger(LinehaulEventsPublisher.name);
  private readonly exchangeName =
    process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';
  private readonly rabbitmqHttpConfig = this.buildRabbitmqHttpConfig();

  async publish(input: PublishLinehaulEventInput): Promise<void> {
    const occurredAt = new Date();
    const event = this.buildEvent(input, occurredAt);

    try {
      const response = await fetch(this.rabbitmqHttpConfig.publishUrl, {
        method: 'POST',
        headers: {
          Authorization: this.rabbitmqHttpConfig.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            delivery_mode: 2,
            message_id: event.event_id,
            type: event.event_type,
            timestamp: Math.floor(occurredAt.getTime() / 1000),
            headers: {
              idempotency_key: event.idempotency_key,
              aggregate_type: 'linehaul_trip',
              aggregate_id: input.trip.id,
            },
          },
          routing_key: event.event_type,
          payload: JSON.stringify(event),
          payload_encoding: 'string',
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `RabbitMQ publish request failed (${response.status}): ${responseText}`,
        );
      }

      const publishResult = (await response.json()) as { routed?: boolean };
      if (!publishResult.routed) {
        this.logger.warn(
          `Linehaul event "${event.event_type}" was not routed by exchange "${this.exchangeName}".`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Linehaul event "${event.event_type}" was not published: ${this.toErrorMessage(error)}`,
      );
    }
  }

  private buildEvent(
    input: PublishLinehaulEventInput,
    occurredAt: Date,
  ): LinehaulEventEnvelope {
    const eventId = `${input.eventType}:${input.aggregateKey}`;
    const actor = this.buildActor(input.actor);
    const locationCode =
      input.locationCode ??
      this.resolveDefaultLocation(input.eventType, input.trip);

    return {
      event_id: eventId,
      event_type: input.eventType,
      occurred_at: occurredAt.toISOString(),
      shipment_code: null,
      actor,
      location: locationCode ? { location_code: locationCode } : null,
      data: {
        trip: input.trip,
        tripCode: input.trip.tripCode,
        manifestCode: input.manifest?.manifestCode ?? null,
        manifest: input.manifest ?? null,
        tripManifest: input.manifest ?? null,
        seal: input.seal ?? null,
        incident: input.incident ?? null,
        handover: input.handover ?? null,
        ...(input.extraData ?? {}),
      },
      idempotency_key: eventId,
    };
  }

  private buildActor(actor: string | null | undefined): Record<string, unknown> | null {
    const normalized = actor?.trim() ?? '';
    if (!normalized) {
      return {
        service: 'linehaul-service',
      };
    }

    return {
      service: 'linehaul-service',
      id: normalized,
    };
  }

  private resolveDefaultLocation(
    eventType: LinehaulEventType,
    trip: LinehaulTrip,
  ): string | null {
    if (
      eventType === 'linehaul.arrived' ||
      eventType === 'linehaul.manifest_received' ||
      eventType === 'linehaul.completed' ||
      eventType === 'linehaul.handover_signed'
    ) {
      return trip.destinationHubCode;
    }

    return trip.originHubCode;
  }

  private buildRabbitmqHttpConfig(): RabbitmqHttpConfig {
    const rabbitmqUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    const parsedUrl = new URL(rabbitmqUrl);
    const username = decodeURIComponent(parsedUrl.username || 'guest');
    const password = decodeURIComponent(parsedUrl.password || 'guest');
    const host = parsedUrl.hostname || 'localhost';
    const managementPort = process.env.RABBITMQ_MANAGEMENT_PORT ?? '15672';

    return {
      publishUrl: `http://${host}:${managementPort}/api/exchanges/%2F/${encodeURIComponent(this.exchangeName)}/publish`,
      authHeader: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
