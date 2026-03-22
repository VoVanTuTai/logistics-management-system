import { Injectable } from '@nestjs/common';

import { PickupsService } from './pickups.service';

export interface ShipmentCancelledPayload {
  shipment_code: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PickupEventHandlersService {
  constructor(private readonly pickupsService: PickupsService) {}

  async handleShipmentCancelled(
    payload: ShipmentCancelledPayload,
  ): Promise<void> {
    await this.pickupsService.cancelByShipmentCode(
      payload.shipment_code,
      'cancelled_due_to_shipment_cancelled',
    );
  }
}
