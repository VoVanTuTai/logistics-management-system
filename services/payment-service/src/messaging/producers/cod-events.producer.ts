import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { CodRecord } from '../../domain/entities/cod-record.entity';
import type { QueueOutboxEventInput } from '../../domain/entities/outbox-event.entity';

@Injectable()
export class CodEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildCodCollectedEvent(codRecord: CodRecord): QueueOutboxEventInput {
    return this.buildEvent(
      'cod.collected',
      'cod_record',
      codRecord.id,
      codRecord.shipmentCode,
      codRecord.courierId,
      {
        codRecord: {
          id: codRecord.id,
          shipmentCode: codRecord.shipmentCode,
          codAmount: codRecord.codAmount,
          collectedAmount: codRecord.collectedAmount,
          paymentMethod: codRecord.paymentMethod,
          currency: codRecord.currency,
          courierId: codRecord.courierId,
          collectedAt: codRecord.collectedAt?.toISOString() ?? null,
        },
      },
      `cod.collected:${codRecord.id}`,
    );
  }

  buildCodCollectionFailedEvent(codRecord: CodRecord): QueueOutboxEventInput {
    return this.buildEvent(
      'cod.collection_failed',
      'cod_record',
      codRecord.id,
      codRecord.shipmentCode,
      codRecord.courierId,
      {
        codRecord: {
          id: codRecord.id,
          shipmentCode: codRecord.shipmentCode,
          codAmount: codRecord.codAmount,
        },
      },
      `cod.collection_failed:${codRecord.id}`,
    );
  }

  buildCodRemittedEvent(codRecord: CodRecord): QueueOutboxEventInput {
    return this.buildEvent(
      'cod.remitted',
      'cod_record',
      codRecord.id,
      codRecord.shipmentCode,
      codRecord.remittedBy,
      {
        codRecord: {
          id: codRecord.id,
          shipmentCode: codRecord.shipmentCode,
          collectedAmount: codRecord.collectedAmount,
          remittedBy: codRecord.remittedBy,
          remittedAt: codRecord.remittedAt?.toISOString() ?? null,
        },
      },
      `cod.remitted:${codRecord.id}`,
    );
  }

  private buildEvent(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    shipmentCode: string | null,
    actor: string | null,
    data: Record<string, unknown>,
    idempotencyKey: string,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();

    return {
      eventId,
      eventType,
      routingKey: eventType,
      aggregateType,
      aggregateId,
      payload: {
        event_id: eventId,
        event_type: eventType as QueueOutboxEventInput['payload']['event_type'],
        occurred_at: occurredAt.toISOString(),
        shipment_code: shipmentCode,
        actor,
        data,
        idempotency_key: idempotencyKey,
      },
      occurredAt,
    };
  }
}
