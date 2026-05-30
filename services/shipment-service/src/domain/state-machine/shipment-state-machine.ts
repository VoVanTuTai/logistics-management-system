import { Injectable, Logger } from '@nestjs/common';

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

/**
 * Valid transition whitelist.
 *
 * Key = current status, Value = set of statuses that are reachable from it.
 * A status may transition to itself (idempotent replay) – this is intentional
 * because event-driven consumers may replay the same event.
 *
 * Terminal statuses (DELIVERED, RETURN_COMPLETED, CANCELLED) have very
 * limited outgoing transitions to prevent accidental rollback.
 */
const VALID_TRANSITIONS: Record<ShipmentCurrentStatus, ReadonlySet<ShipmentCurrentStatus>> = {
  CREATED: new Set([
    'CREATED', 'UPDATED', 'TASK_ASSIGNED', 'PICKUP_COMPLETED',
    'SCAN_OUTBOUND', 'SEND_GOODS', 'MANIFEST_SEALED', 'RETURN_STARTED',
    'CANCELLED',
  ]),
  UPDATED: new Set([
    'UPDATED', 'TASK_ASSIGNED', 'PICKUP_COMPLETED',
    'SCAN_OUTBOUND', 'SEND_GOODS', 'MANIFEST_SEALED', 'RETURN_STARTED',
    'CANCELLED',
  ]),
  TASK_ASSIGNED: new Set([
    'TASK_ASSIGNED', 'PICKUP_COMPLETED', 'SCAN_OUTBOUND', 'SEND_GOODS',
    'MANIFEST_SEALED', 'SCAN_INBOUND', 'IN_TRANSIT',
    'DELIVERED', 'DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION',
    'RETURN_STARTED', 'CANCELLED',
  ]),
  PICKUP_COMPLETED: new Set([
    'PICKUP_COMPLETED', 'TASK_ASSIGNED', 'SCAN_OUTBOUND', 'SEND_GOODS',
    'MANIFEST_SEALED', 'SCAN_INBOUND', 'IN_TRANSIT', 'RETURN_STARTED',
    'CANCELLED',
  ]),
  MANIFEST_SEALED: new Set([
    'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED',
    'SCAN_OUTBOUND', 'SEND_GOODS', 'IN_TRANSIT', 'SCAN_INBOUND',
    'RETURN_STARTED', 'CANCELLED',
  ]),
  MANIFEST_RECEIVED: new Set([
    'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED', 'SCAN_INBOUND',
    'INVENTORY_CHECK', 'TASK_ASSIGNED', 'SCAN_OUTBOUND', 'SEND_GOODS',
    'IN_TRANSIT', 'RETURN_STARTED', 'CANCELLED',
  ]),
  MANIFEST_UNSEALED: new Set([
    'MANIFEST_UNSEALED', 'SCAN_INBOUND', 'INVENTORY_CHECK',
    'TASK_ASSIGNED', 'SCAN_OUTBOUND', 'SEND_GOODS', 'IN_TRANSIT',
    'RETURN_STARTED', 'CANCELLED',
  ]),
  SEND_GOODS: new Set([
    'SEND_GOODS', 'IN_TRANSIT', 'SCAN_OUTBOUND', 'MANIFEST_SEALED',
    'SCAN_INBOUND', 'RETURN_STARTED', 'CANCELLED',
  ]),
  IN_TRANSIT: new Set([
    'IN_TRANSIT', 'SCAN_INBOUND', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED',
    'INVENTORY_CHECK', 'SCAN_OUTBOUND', 'SEND_GOODS', 'RETURN_STARTED',
    'CANCELLED',
  ]),
  INVENTORY_CHECK: new Set([
    'INVENTORY_CHECK', 'SCAN_INBOUND', 'TASK_ASSIGNED', 'SCAN_OUTBOUND',
    'SEND_GOODS', 'IN_TRANSIT', 'RETURN_STARTED', 'CANCELLED',
  ]),
  SCAN_INBOUND: new Set([
    'SCAN_INBOUND', 'INVENTORY_CHECK', 'TASK_ASSIGNED', 'SCAN_OUTBOUND',
    'SEND_GOODS', 'IN_TRANSIT', 'MANIFEST_SEALED', 'RETURN_STARTED',
    'CANCELLED',
  ]),
  SCAN_OUTBOUND: new Set([
    'SCAN_OUTBOUND', 'SEND_GOODS', 'IN_TRANSIT', 'MANIFEST_SEALED',
    'SCAN_INBOUND', 'TASK_ASSIGNED', 'RETURN_STARTED', 'CANCELLED',
  ]),
  DELIVERED: new Set([
    'DELIVERED',
    // After delivery, only NDR/return events can move status forward.
  ]),
  DELIVERY_FAILED: new Set([
    'DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION',
    'INVENTORY_CHECK', 'TASK_ASSIGNED', 'RETURN_STARTED', 'CANCELLED',
  ]),
  NDR_CREATED: new Set([
    'NDR_CREATED', 'EXCEPTION', 'INVENTORY_CHECK', 'TASK_ASSIGNED',
    'RETURN_STARTED', 'CANCELLED',
  ]),
  EXCEPTION: new Set([
    'EXCEPTION', 'NDR_CREATED', 'INVENTORY_CHECK', 'TASK_ASSIGNED',
    'RETURN_STARTED', 'CANCELLED',
  ]),
  RETURN_STARTED: new Set([
    'RETURN_STARTED', 'RETURN_COMPLETED',
    'SCAN_INBOUND', 'SCAN_OUTBOUND', 'IN_TRANSIT',
  ]),
  RETURN_COMPLETED: new Set([
    'RETURN_COMPLETED',
    // Terminal: hàng đã hoàn, không cho chuyển tiếp.
  ]),
  CANCELLED: new Set([
    'CANCELLED',
    // Terminal: đã hủy.
  ]),
};

@Injectable()
export class ShipmentStateMachine {
  private readonly logger = new Logger(ShipmentStateMachine.name);

  resolveNextStatus(
    currentStatus: ShipmentCurrentStatus,
    eventType: ShipmentConsumedEventType,
    eventData: Record<string, unknown> = {},
  ): ShipmentCurrentStatus {
    // shipment-service is the only writer of current_status.
    // tracking-service and scan-service must not own or mutate this field.
    if (eventType === 'scan.outbound' && isSendGoodsEventData(eventData)) {
      return this.applyIfAllowed(currentStatus, 'SEND_GOODS', eventType);
    }

    if (eventType === 'ndr.created' && isExceptionNdrEventData(eventData)) {
      return this.applyIfAllowed(currentStatus, 'EXCEPTION', eventType);
    }

    if (eventType === 'scan.outbound' && isVehicleOutboundEventData(eventData)) {
      return this.applyIfAllowed(currentStatus, 'IN_TRANSIT', eventType);
    }

    if (eventType === 'scan.inbound' && isInventoryCheckEventData(eventData)) {
      return this.applyIfAllowed(currentStatus, 'INVENTORY_CHECK', eventType);
    }

    const nextStatus = EVENT_TO_STATUS[eventType];

    if (!nextStatus) {
      return currentStatus;
    }

    return this.applyIfAllowed(currentStatus, nextStatus, eventType);
  }

  canCancel(currentStatus: ShipmentCurrentStatus): boolean {
    return !['DELIVERED', 'RETURN_COMPLETED', 'CANCELLED'].includes(
      currentStatus,
    );
  }

  /**
   * Check the transition whitelist. If the transition is not allowed,
   * log a warning and keep the current status (safe default).
   */
  private applyIfAllowed(
    currentStatus: ShipmentCurrentStatus,
    nextStatus: ShipmentCurrentStatus,
    eventType: ShipmentConsumedEventType,
  ): ShipmentCurrentStatus {
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.has(nextStatus)) {
      this.logger.warn(
        `Transition rejected: ${currentStatus} → ${nextStatus} (event: ${eventType}). Keeping current status.`,
      );
      return currentStatus;
    }

    return nextStatus;
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
