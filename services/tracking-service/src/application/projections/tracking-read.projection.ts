import { Injectable } from '@nestjs/common';

import type { TrackingEventEnvelope } from '../../domain/entities/timeline-event.entity';
import { TrackingProjectionStore } from '../../infrastructure/prisma/tracking-projection.store';

@Injectable()
export class TrackingReadProjection {
  constructor(
    private readonly trackingProjectionStore: TrackingProjectionStore,
  ) {}

  project(
    event: TrackingEventEnvelope,
  ): Promise<{ projected: boolean; shipmentCode: string | null }> {
    return this.trackingProjectionStore.project(event);
  }
}
