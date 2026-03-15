import { Controller, Get, Param } from '@nestjs/common';

import { TrackingQueryProjection } from '../../application/projections/tracking-query.projection';
import type { TimelineEvent } from '../../domain/entities/timeline-event.entity';
import type { TrackingCurrent } from '../../domain/entities/tracking-current.entity';

@Controller('tracking')
export class InternalTrackingController {
  constructor(
    private readonly trackingQueryProjection: TrackingQueryProjection,
  ) {}

  @Get(':shipmentCode/timeline')
  getTimeline(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TimelineEvent[]> {
    return this.trackingQueryProjection.getTimeline(shipmentCode);
  }

  @Get(':shipmentCode/current')
  getCurrent(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TrackingCurrent> {
    return this.trackingQueryProjection.getCurrent(shipmentCode);
  }
}
