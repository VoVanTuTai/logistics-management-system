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
    'manifest.unsealed': 'MANIFEST_UNSEALED',
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
    eventData: Record<string, unknown> = {},
  ): ShipmentCurrentStatus {
    // shipment-service is the only writer of current_status.
    // tracking-service and scan-service must not own or mutate this field.
    if (eventType === 'scan.outbound' && isSendGoodsEventData(eventData)) {
      return 'SEND_GOODS';
    }

    if (eventType === 'ndr.created' && isExceptionNdrEventData(eventData)) {
      return 'EXCEPTION';
    }

    if (eventType === 'scan.outbound' && isVehicleOutboundEventData(eventData)) {
      return 'IN_TRANSIT';
    }

    if (eventType === 'scan.inbound' && isInventoryCheckEventData(eventData)) {
      return 'INVENTORY_CHECK';
    }

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

function isSendGoodsEventData(eventData: Record<string, unknown>): boolean {
  const scanEvent = eventData.scanEvent;
  if (!scanEvent || typeof scanEvent !== 'object') {
    return false;
  }

  const note = (scanEvent as Record<string, unknown>).note;
  if (typeof note !== 'string') return false;
  const trimmed = note.trim();
  return trimmed.startsWith('SEND_GOODS') || trimmed.startsWith('Gửi bao hàng') || trimmed.startsWith('Gửi kiện rời');
}

function isExceptionNdrEventData(eventData: Record<string, unknown>): boolean {
  const ndrCase = eventData.ndrCase;
  if (!ndrCase || typeof ndrCase !== 'object') {
    return false;
  }

  const status = (ndrCase as Record<string, unknown>).status;
  const issueType = (ndrCase as Record<string, unknown>).issueType;
  return status === 'PENDING_RESOLUTION' || typeof issueType === 'string';
}

function isVehicleOutboundEventData(eventData: Record<string, unknown>): boolean {
  const scanEvent = eventData.scanEvent;
  if (!scanEvent || typeof scanEvent !== 'object') {
    return false;
  }

  const note = (scanEvent as Record<string, unknown>).note;
  if (typeof note !== 'string') return false;
  const trimmed = note.trim();
  return trimmed.startsWith('VEHICLE_OUTBOUND') || trimmed.startsWith('Rời kho');
}

function isInventoryCheckEventData(eventData: Record<string, unknown>): boolean {
  const scanEvent = eventData.scanEvent;
  if (!scanEvent || typeof scanEvent !== 'object') {
    return false;
  }

  const note = (scanEvent as Record<string, unknown>).note;
  if (typeof note !== 'string') return false;
  const trimmed = note.trim();
  return trimmed.startsWith('INVENTORY_CHECK') || trimmed.startsWith('Kiểm tồn kho');
}
