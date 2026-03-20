import { Injectable } from '@nestjs/common';

import {
  type TaskAssignedPayload,
  DeliveryEventHandlersService,
} from '../../application/services/delivery-event-handlers.service';

export interface TaskAssignedEnvelope extends TaskAssignedPayload {
  event_type: 'task.assigned';
}

@Injectable()
export class DeliveryEventsConsumer {
  readonly queueName = 'delivery-service.q';
  readonly routingPatterns = ['task.assigned'];
  readonly retryQueue10s = 'delivery-service.retry.10s';
  readonly retryQueue1m = 'delivery-service.retry.1m';
  readonly dlqName = 'delivery-service.dlq';

  constructor(
    private readonly deliveryEventHandlersService: DeliveryEventHandlersService,
  ) {}

  handle(
    event: TaskAssignedEnvelope,
  ): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    return this.deliveryEventHandlersService.handleTaskAssigned(event);
  }
}
