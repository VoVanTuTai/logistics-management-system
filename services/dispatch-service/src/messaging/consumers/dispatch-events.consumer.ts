import { Injectable } from '@nestjs/common';

import {
  DeliveryFailedPayload,
  DispatchEventHandlersService,
  PickupRequestedPayload,
} from '../../application/services/dispatch-event-handlers.service';

export interface DispatchConsumerEnvelope {
  event_type: 'pickup.requested' | 'delivery.failed';
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class DispatchEventsConsumer {
  readonly queueName = 'dispatch-service.q';
  readonly retryQueues = ['dispatch-service.retry.10s', 'dispatch-service.retry.1m'];
  readonly deadLetterQueue = 'dispatch-service.dlq';

  constructor(
    private readonly dispatchEventHandlersService: DispatchEventHandlersService,
  ) {}

  async handle(payload: DispatchConsumerEnvelope): Promise<void> {
    if (payload.event_type === 'pickup.requested') {
      await this.dispatchEventHandlersService.handlePickupRequested(
        payload as PickupRequestedPayload,
      );
      return;
    }

    if (payload.event_type === 'delivery.failed') {
      await this.dispatchEventHandlersService.handleDeliveryFailed(
        payload as DeliveryFailedPayload,
      );
    }
  }
}
