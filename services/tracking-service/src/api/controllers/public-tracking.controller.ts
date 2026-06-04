import { Controller, Get, Param, Query } from '@nestjs/common';

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
    @Query() query: PublicTrackingLookupQuery,
  ): Promise<PublicTrackingView> {
    return this.trackingQueryProjection.getPublicTracking(
      shipmentCode,
      query.receiverPhone ?? query.phone ?? query.recipientPhone,
    );
  }
}

interface PublicTrackingLookupQuery {
  receiverPhone?: string;
  phone?: string;
  recipientPhone?: string;
}
