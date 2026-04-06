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

export interface DeliveryDeliveredPayload {
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

  async handleDeliveryDelivered(payload: DeliveryDeliveredPayload): Promise<void> {
    const taskId = this.readDeliveryTaskId(payload.data);
    if (taskId) {
      await this.tasksService.updateStatus(taskId, { status: 'COMPLETED' });
      return;
    }

    const shipmentCode =
      payload.shipment_code ?? this.readDeliveryShipmentCode(payload.data);
    if (!shipmentCode) {
      return;
    }

    const assignedDeliveryTasks = await this.tasksService.list({
      shipmentCode,
      taskType: 'DELIVERY',
      status: 'ASSIGNED',
    });

    const taskToComplete = assignedDeliveryTasks[0];
    if (!taskToComplete) {
      return;
    }

    await this.tasksService.updateStatus(taskToComplete.id, {
      status: 'COMPLETED',
    });
  }

  private readDeliveryTaskId(data: Record<string, unknown> | undefined): string | null {
    const deliveryAttempt = this.readDeliveryAttempt(data);
    if (!deliveryAttempt) {
      return null;
    }

    return this.readString(deliveryAttempt.taskId) ?? this.readString(deliveryAttempt.task_id);
  }

  private readDeliveryShipmentCode(
    data: Record<string, unknown> | undefined,
  ): string | null {
    const deliveryAttempt = this.readDeliveryAttempt(data);
    if (!deliveryAttempt) {
      return null;
    }

    return (
      this.readString(deliveryAttempt.shipmentCode) ??
      this.readString(deliveryAttempt.shipment_code)
    );
  }

  private readDeliveryAttempt(
    data: Record<string, unknown> | undefined,
  ): Record<string, unknown> | null {
    if (!data) {
      return null;
    }

    return (
      this.readObject(data.deliveryAttempt) ?? this.readObject(data.delivery_attempt)
    );
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
