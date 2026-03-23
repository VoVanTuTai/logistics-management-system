import { Injectable } from '@nestjs/common';

import {
  DeliveryDeliveredPayload,
  DeliveryFailedPayload,
  DispatchEventHandlersService,
  PickupApprovedPayload,
} from '../../application/services/dispatch-event-handlers.service';

export interface DispatchConsumerEnvelope {
  event_type: 'pickup.approved' | 'delivery.delivered' | 'delivery.failed';
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class DispatchEventsConsumer {
  readonly queueName = 'dispatch-service.q';
  readonly routingPatterns = [
    'pickup.approved',
    'delivery.delivered',
    'delivery.failed',
  ];
  readonly retryQueues = ['dispatch-service.retry.10s', 'dispatch-service.retry.1m'];
  readonly deadLetterQueue = 'dispatch-service.dlq';

  constructor(
    private readonly dispatchEventHandlersService: DispatchEventHandlersService,
  ) {}

  async handle(payload: DispatchConsumerEnvelope): Promise<void> {
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

    if (payload.event_type === 'delivery.delivered') {
      await this.dispatchEventHandlersService.handleDeliveryDelivered(
        payload as DeliveryDeliveredPayload,
      );
    }
  }
}
