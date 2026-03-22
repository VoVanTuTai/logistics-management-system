import { Injectable } from '@nestjs/common';

import { DeliveryService } from './delivery.service';

export interface TaskAssignedPayload {
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class DeliveryEventHandlersService {
  constructor(private readonly deliveryService: DeliveryService) {}

  handleTaskAssigned(
    payload: TaskAssignedPayload,
  ): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    return this.deliveryService.handleTaskAssigned(payload);
  }
}
