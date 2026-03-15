import { Controller, Get, Param } from '@nestjs/common';

import {
  type PublicTrackingView,
  TrackingQueryProjection,
} from '../../application/projections/tracking-query.projection';

@Controller('public/track')
export class PublicTrackingController {
  constructor(
    private readonly trackingQueryProjection: TrackingQueryProjection,
  ) {}

  @Get(':shipmentCode')
  getByShipmentCode(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<PublicTrackingView> {
    return this.trackingQueryProjection.getPublicTracking(shipmentCode);
  }
}
