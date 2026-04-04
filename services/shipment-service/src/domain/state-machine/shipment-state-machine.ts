import { Injectable } from '@nestjs/common';

import type {
  ShipmentConsumedEventType,
  ShipmentCurrentStatus,
} from '../entities/shipment-status.entity';

const EVENT_TO_STATUS: Record<ShipmentConsumedEventType, ShipmentCurrentStatus> =
  {
    'pickup.requested': 'UPDATED',
    'pickup.approved': 'TASK_ASSIGNED',
    'scan.pickup_confirmed': 'PICKUP_COMPLETED',
    'task.assigned': 'TASK_ASSIGNED',
    'manifest.sealed': 'MANIFEST_SEALED',
    'manifest.received': 'MANIFEST_RECEIVED',
    'scan.inbound': 'SCAN_INBOUND',
    'scan.outbound': 'SCAN_OUTBOUND',
    'delivery.attempted': 'TASK_ASSIGNED',
    'delivery.delivered': 'DELIVERED',
    'delivery.failed': 'DELIVERY_FAILED',
    'ndr.created': 'NDR_CREATED',
    'return.started': 'RETURN_STARTED',
    'return.completed': 'RETURN_COMPLETED',
  };

@Injectable()
export class ShipmentStateMachine {
  resolveNextStatus(
    currentStatus: ShipmentCurrentStatus,
    eventType: ShipmentConsumedEventType,
    _eventData: Record<string, unknown> = {},
  ): ShipmentCurrentStatus {
    // shipment-service is the only writer of current_status.
    // tracking-service and scan-service must not own or mutate this field.
    const nextStatus = EVENT_TO_STATUS[eventType];

    if (!nextStatus) {
      return currentStatus;
    }

    // TODO: enforce full transition validation matrix.
    return nextStatus;
  }

  canCancel(currentStatus: ShipmentCurrentStatus): boolean {
    return !['DELIVERED', 'RETURN_COMPLETED', 'CANCELLED'].includes(
      currentStatus,
    );
  }
}
