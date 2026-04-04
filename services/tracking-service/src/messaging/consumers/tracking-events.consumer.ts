import { Injectable } from '@nestjs/common';

import { TRACKING_BUSINESS_EVENTS } from '../../application/mappers/tracking-display.mapper';
import { TrackingReadProjection } from '../../application/projections/tracking-read.projection';
import type { TrackingEventEnvelope } from '../../domain/entities/timeline-event.entity';

@Injectable()
export class TrackingEventsConsumer {
  readonly queueName = 'tracking-service.q';
  readonly retryQueue10s = 'tracking-service.retry.10s';
  readonly retryQueue1m = 'tracking-service.retry.1m';
  readonly dlqName = 'tracking-service.dlq';
  readonly routingPatterns = [...TRACKING_BUSINESS_EVENTS];

  constructor(
    private readonly trackingReadProjection: TrackingReadProjection,
  ) {}

  handle(
    event: TrackingEventEnvelope,
  ): Promise<{ projected: boolean; shipmentCode: string | null }> {
    return this.trackingReadProjection.project(event);
  }
}
