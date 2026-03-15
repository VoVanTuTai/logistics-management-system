import { Injectable } from '@nestjs/common';

import {
  ShipmentEventHandlersService,
  type ShipmentInboundEventPayload,
} from '../../application/services/shipment-event-handlers.service';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';

export interface ShipmentConsumerEnvelope extends ShipmentInboundEventPayload {
  event_type: ShipmentConsumedEventType;
}

@Injectable()
export class ShipmentEventsConsumer {
  readonly queueName = 'shipment-service.q';
  readonly retryQueues = ['shipment-service.retry.10s', 'shipment-service.retry.1m'];
  readonly deadLetterQueue = 'shipment-service.dlq';

  constructor(
    private readonly shipmentEventHandlersService: ShipmentEventHandlersService,
  ) {}

  async handle(payload: ShipmentConsumerEnvelope): Promise<void> {
    await this.shipmentEventHandlersService.handle(
      payload.event_type,
      payload,
    );
  }
}
