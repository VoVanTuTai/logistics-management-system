import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { DeliveryAttempt } from '../../domain/entities/delivery-attempt.entity';
import type { NdrCase } from '../../domain/entities/ndr-case.entity';
import type { OtpRecord } from '../../domain/entities/otp-record.entity';
import type {
  DeliveryPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { Pod } from '../../domain/entities/pod.entity';
import type { ReturnCase } from '../../domain/entities/return-case.entity';

@Injectable()
export class DeliveryEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildDeliveryAttemptedEvent(
    deliveryAttempt: DeliveryAttempt,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'delivery.attempted',
      'delivery_attempt',
      deliveryAttempt.id,
      deliveryAttempt.shipmentCode,
      deliveryAttempt.actor,
      deliveryAttempt.locationCode,
      { deliveryAttempt },
      `delivery.attempted:${deliveryAttempt.id}`,
    );
  }

  buildDeliveryDeliveredEvent(
    deliveryAttempt: DeliveryAttempt,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'delivery.delivered',
      'delivery_attempt',
      deliveryAttempt.id,
      deliveryAttempt.shipmentCode,
      deliveryAttempt.actor,
      deliveryAttempt.locationCode,
      { deliveryAttempt },
      `delivery.delivered:${deliveryAttempt.id}`,
    );
  }

  buildDeliveryFailedEvent(
    deliveryAttempt: DeliveryAttempt,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'delivery.failed',
      'delivery_attempt',
      deliveryAttempt.id,
      deliveryAttempt.shipmentCode,
      deliveryAttempt.actor,
      deliveryAttempt.locationCode,
      { deliveryAttempt },
      `delivery.failed:${deliveryAttempt.id}`,
    );
  }

  buildPodCapturedEvent(
    pod: Pod,
    shipmentCode: string,
    actor: string | null,
    locationCode: string | null,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'pod.captured',
      'pod',
      pod.id,
      shipmentCode,
      actor,
      locationCode,
      { pod },
      `pod.captured:${pod.id}`,
    );
  }

  buildOtpSentEvent(
    otpRecord: OtpRecord,
    shipmentCode: string,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'otp.sent',
      'otp_record',
      otpRecord.id,
      shipmentCode,
      otpRecord.sentBy,
      null,
      { otpRecord },
      `otp.sent:${otpRecord.id}`,
    );
  }

  buildOtpVerifiedEvent(
    otpRecord: OtpRecord,
    shipmentCode: string,
  ): QueueOutboxEventInput {
    return this.buildEvent(
      'otp.verified',
      'otp_record',
      otpRecord.id,
      shipmentCode,
      otpRecord.verifiedBy,
      null,
      { otpRecord },
      `otp.verified:${otpRecord.id}`,
    );
  }

  buildNdrCreatedEvent(ndrCase: NdrCase): QueueOutboxEventInput {
    return this.buildEvent(
      'ndr.created',
      'ndr_case',
      ndrCase.id,
      ndrCase.shipmentCode,
      null,
      null,
      { ndrCase },
      `ndr.created:${ndrCase.id}`,
    );
  }

  buildNdrRescheduledEvent(ndrCase: NdrCase): QueueOutboxEventInput {
    return this.buildEvent(
      'ndr.rescheduled',
      'ndr_case',
      ndrCase.id,
      ndrCase.shipmentCode,
      null,
      null,
      { ndrCase },
      `ndr.rescheduled:${ndrCase.id}`,
    );
  }

  buildReturnStartedEvent(returnCase: ReturnCase): QueueOutboxEventInput {
    return this.buildEvent(
      'return.started',
      'return_case',
      returnCase.id,
      returnCase.shipmentCode,
      null,
      null,
      { returnCase },
      `return.started:${returnCase.id}`,
    );
  }

  buildReturnCompletedEvent(returnCase: ReturnCase): QueueOutboxEventInput {
    return this.buildEvent(
      'return.completed',
      'return_case',
      returnCase.id,
      returnCase.shipmentCode,
      null,
      null,
      { returnCase },
      `return.completed:${returnCase.id}`,
    );
  }

  private buildEvent(
    eventType: DeliveryPublishedEventType,
    aggregateType: string,
    aggregateId: string,
    shipmentCode: string | null,
    actor: string | null,
    locationCode: string | null,
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
        event_type: eventType,
        occurred_at: occurredAt.toISOString(),
        shipment_code: shipmentCode,
        actor,
        location: locationCode ? { location_code: locationCode } : null,
        data,
        idempotency_key: idempotencyKey,
      },
      occurredAt,
    };
  }
}
