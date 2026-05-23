import { Controller, Get, Param } from '@nestjs/common';

import {
  type TimelineEventView,
  type TrackingCurrentView,
  TrackingQueryProjection,
} from '../../application/projections/tracking-query.projection';

@Controller('tracking')
export class InternalTrackingController {
  constructor(
    private readonly trackingQueryProjection: TrackingQueryProjection,
  ) {}

  @Get(':shipmentCode/timeline')
  getTimeline(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TimelineEventView[]> {
    return this.trackingQueryProjection.getTimeline(shipmentCode);
  }

  @Get(':shipmentCode/current')
  getCurrent(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TrackingCurrentView> {
    return this.trackingQueryProjection.getCurrent(shipmentCode);
  }
}
