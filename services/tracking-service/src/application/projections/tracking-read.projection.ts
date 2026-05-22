import { Injectable } from '@nestjs/common';

import type { TrackingEventEnvelope } from '../../domain/entities/timeline-event.entity';
import { TrackingProjectionStore } from '../../infrastructure/prisma/tracking-projection.store';

@Injectable()
export class TrackingReadProjection {
  constructor(
    private readonly trackingProjectionStore: TrackingProjectionStore,
  ) {}

  async project(
    event: TrackingEventEnvelope,
  ): Promise<{ projected: boolean; shipmentCode: string | null }> {
    const [trackingResult, operationProjected] = await Promise.all([
      this.trackingProjectionStore.project(event),
      this.trackingProjectionStore.projectOperation(event),
    ]);

    return {
      projected: trackingResult.projected || operationProjected,
      shipmentCode: trackingResult.shipmentCode,
    };
  }
}
