import { Injectable } from '@nestjs/common';

import { CodService } from '../../application/services/cod.service';

export interface PaymentConsumerEnvelope {
  event_type: 'shipment.created' | 'task.assigned';
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class PaymentEventsConsumer {
  readonly queueName = 'payment-service.q';
  readonly routingPatterns = ['shipment.created', 'task.assigned'];
  readonly retryQueues = ['payment-service.retry.10s', 'payment-service.retry.1m'];
  readonly deadLetterQueue = 'payment-service.dlq';

  constructor(private readonly codService: CodService) {}

  async handle(event: PaymentConsumerEnvelope): Promise<void> {
    if (event.event_type === 'shipment.created') {
      const shipment = readObject(event.data?.shipment);

      await this.codService.syncShipmentCodRecord({
        shipmentCode:
          event.shipment_code ??
          readString(shipment?.shipmentCode) ??
          readString(shipment?.code),
        code: readString(shipment?.code),
        merchantId: readString(shipment?.merchantId),
        codAmount: shipment?.codAmount as number | string | null | undefined,
        currency: readString(shipment?.currency),
        metadata: readObject(shipment?.metadata),
      });
    } else if (event.event_type === 'task.assigned') {
      const task = readObject(event.data?.task);
      const shipmentCode = event.shipment_code ?? readString(task?.shipmentCode);
      const assignments = Array.isArray(task?.assignments) ? task.assignments : [];
      const activeAssignment = assignments.find((a: any) => a.unassignedAt === null);
      const courierId = readString(activeAssignment?.courierId);

      if (shipmentCode && courierId) {
        await this.codService.assignCourier(shipmentCode, courierId);
      }
    }
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
