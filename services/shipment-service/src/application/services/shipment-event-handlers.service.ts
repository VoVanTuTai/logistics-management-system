import { Injectable } from '@nestjs/common';

import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentsService } from './shipments.service';

export interface ShipmentInboundEventPayload {
  shipment_code: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class ShipmentEventHandlersService {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  async handle(
    eventType: ShipmentConsumedEventType,
    payload: ShipmentInboundEventPayload,
  ): Promise<void> {
    await this.shipmentsService.applyExternalEvent(
      payload.shipment_code,
      eventType,
      payload.data ?? {},
    );
  }
}
