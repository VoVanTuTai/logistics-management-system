import { Injectable } from '@nestjs/common';

export interface PickupConsumerEnvelope {
  event_type: string;
  shipment_code?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PickupEventsConsumer {
  readonly queueName = 'pickup-service.q';
  readonly retryQueues = ['pickup-service.retry.10s', 'pickup-service.retry.1m'];
  readonly deadLetterQueue = 'pickup-service.dlq';
  readonly routingPatterns: string[] = [];

  async handle(_payload: PickupConsumerEnvelope): Promise<void> {
    // No inbound domain events are required for pickup-service in the slim event model.
  }
}
