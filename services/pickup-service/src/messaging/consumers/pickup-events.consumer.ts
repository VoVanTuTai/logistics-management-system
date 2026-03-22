import { Injectable } from '@nestjs/common';

import {
  PickupEventHandlersService,
  type ShipmentCancelledPayload,
} from '../../application/services/pickup-event-handlers.service';

export interface PickupConsumerEnvelope extends ShipmentCancelledPayload {
  event_type: 'shipment.cancelled';
}

@Injectable()
export class PickupEventsConsumer {
  readonly queueName = 'pickup-service.q';
  readonly retryQueues = ['pickup-service.retry.10s', 'pickup-service.retry.1m'];
  readonly deadLetterQueue = 'pickup-service.dlq';

  constructor(
    private readonly pickupEventHandlersService: PickupEventHandlersService,
  ) {}

  async handle(payload: PickupConsumerEnvelope): Promise<void> {
    await this.pickupEventHandlersService.handleShipmentCancelled(payload);
  }
}
