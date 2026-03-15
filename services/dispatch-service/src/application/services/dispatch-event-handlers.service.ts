import { Injectable } from '@nestjs/common';

import { TasksService } from './tasks.service';

export interface PickupRequestedPayload {
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

export interface DeliveryFailedPayload {
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class DispatchEventHandlersService {
  constructor(private readonly tasksService: TasksService) {}

  async handlePickupRequested(payload: PickupRequestedPayload): Promise<void> {
    await this.tasksService.createTaskFromPickupRequested({
      pickup_request_id:
        typeof payload.data?.pickup_request_id === 'string'
          ? payload.data.pickup_request_id
          : null,
      shipment_code: payload.shipment_code ?? null,
      note:
        typeof payload.data?.note === 'string' ? payload.data.note : null,
    });
  }

  async handleDeliveryFailed(payload: DeliveryFailedPayload): Promise<void> {
    await this.tasksService.handleDeliveryFailed({
      shipment_code: payload.shipment_code ?? null,
      note:
        typeof payload.data?.note === 'string'
          ? payload.data.note
          : null,
    });
  }
}
