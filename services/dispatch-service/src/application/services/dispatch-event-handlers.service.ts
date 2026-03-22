import { Injectable } from '@nestjs/common';

import { TasksService } from './tasks.service';

export interface PickupApprovedPayload {
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

  async handlePickupApproved(payload: PickupApprovedPayload): Promise<void> {
    const pickupRequest = this.readObject(payload.data?.pickup_request);
    const pickupRequestId =
      this.readString(payload.data?.pickup_request_id) ??
      this.readString(pickupRequest?.id);
    const pickupItems = Array.isArray(pickupRequest?.items)
      ? pickupRequest.items
      : [];
    const firstPickupItem = this.readObject(pickupItems[0]);
    const pickupRequestShipmentCode = this.readString(
      firstPickupItem?.shipmentCode,
    );

    await this.tasksService.createTaskFromPickupApproved({
      pickup_request_id: pickupRequestId,
      shipment_code: payload.shipment_code ?? pickupRequestShipmentCode ?? null,
      note: this.readString(payload.data?.note),
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

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
