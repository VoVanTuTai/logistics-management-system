import { Injectable, NotFoundException } from '@nestjs/common';

import type { TimelineEvent } from '../../domain/entities/timeline-event.entity';
import type { TrackingCurrent } from '../../domain/entities/tracking-current.entity';
import { TrackingProjectionStore } from '../../infrastructure/prisma/tracking-projection.store';

export interface PublicTrackingView {
  shipmentCode: string;
  current: TrackingCurrent | null;
  timeline: TimelineEvent[];
  sourceOfTruth: {
    currentStatus: string;
    currentLocation: string;
  };
}

@Injectable()
export class TrackingQueryProjection {
  constructor(
    private readonly trackingProjectionStore: TrackingProjectionStore,
  ) {}

  async getPublicTracking(shipmentCode: string): Promise<PublicTrackingView> {
    const timeline = await this.trackingProjectionStore.getTimeline(shipmentCode);
    const current = await this.trackingProjectionStore.getCurrent(shipmentCode);

    if (!current && timeline.length === 0) {
      throw new NotFoundException(
        `Tracking data for shipment "${shipmentCode}" was not found.`,
      );
    }

    return {
      shipmentCode,
      current,
      timeline,
      sourceOfTruth: {
        currentStatus: 'shipment-service',
        currentLocation: 'scan-service',
      },
    };
  }

  async getTimeline(shipmentCode: string): Promise<TimelineEvent[]> {
    const timeline = await this.trackingProjectionStore.getTimeline(shipmentCode);

    if (timeline.length === 0) {
      throw new NotFoundException(
        `Tracking timeline for shipment "${shipmentCode}" was not found.`,
      );
    }

    return timeline;
  }

  async getCurrent(shipmentCode: string): Promise<TrackingCurrent> {
    const current = await this.trackingProjectionStore.getCurrent(shipmentCode);

    if (!current) {
      throw new NotFoundException(
        `Tracking current view for shipment "${shipmentCode}" was not found.`,
      );
    }

    return current;
  }
}
