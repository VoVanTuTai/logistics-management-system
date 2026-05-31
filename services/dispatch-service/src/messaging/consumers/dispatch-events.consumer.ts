import { Injectable } from '@nestjs/common';

import {
  ShipmentCreatedPayload,
  DeliveryDeliveredPayload,
  DeliveryFailedPayload,
  DispatchEventHandlersService,
  PickupApprovedPayload,
  ReturnStartedPayload,
} from '../../application/services/dispatch-event-handlers.service';

export interface DispatchConsumerEnvelope {
  event_type:
    | 'shipment.created'
    | 'pickup.requested'
    | 'pickup.approved'
    | 'delivery.delivered'
    | 'delivery.failed'
    | 'return.started';
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class DispatchEventsConsumer {
  readonly queueName = 'dispatch-service.q';
  readonly routingPatterns = [
    'shipment.created',
    'pickup.requested',
    'pickup.approved',
    'delivery.delivered',
    'delivery.failed',
    'return.started',
  ];
  readonly retryQueues = ['dispatch-service.retry.10s', 'dispatch-service.retry.1m'];
  readonly deadLetterQueue = 'dispatch-service.dlq';

  constructor(
    private readonly dispatchEventHandlersService: DispatchEventHandlersService,
  ) {}

  async handle(payload: DispatchConsumerEnvelope): Promise<void> {
    if (payload.event_type === 'shipment.created') {
      await this.dispatchEventHandlersService.handleShipmentCreated(
        payload as ShipmentCreatedPayload,
      );
      return;
    }

    if (payload.event_type === 'pickup.requested') {
      await this.dispatchEventHandlersService.handlePickupRequested(
        payload as PickupApprovedPayload,
      );
      return;
    }

    if (payload.event_type === 'pickup.approved') {
      await this.dispatchEventHandlersService.handlePickupApproved(
        payload as PickupApprovedPayload,
      );
      return;
    }

    if (payload.event_type === 'delivery.failed') {
      await this.dispatchEventHandlersService.handleDeliveryFailed(
        payload as DeliveryFailedPayload,
      );
      return;
    }

    if (payload.event_type === 'return.started') {
      await this.dispatchEventHandlersService.handleReturnStarted(
        payload as ReturnStartedPayload,
      );
      return;
    }

    if (payload.event_type === 'delivery.delivered') {
      await this.dispatchEventHandlersService.handleDeliveryDelivered(
        payload as DeliveryDeliveredPayload,
      );
    }
  }
}
