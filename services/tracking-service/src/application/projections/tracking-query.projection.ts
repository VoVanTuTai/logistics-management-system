import { Injectable, NotFoundException } from '@nestjs/common';

import {
  resolveTrackingStatusFromEvent,
  toTimelineTextVi,
  toTrackingStatusLabelVi,
} from '../mappers/tracking-display.mapper';
import type { TimelineEvent } from '../../domain/entities/timeline-event.entity';
import type { TrackingCurrent } from '../../domain/entities/tracking-current.entity';
import { TrackingProjectionStore } from '../../infrastructure/prisma/tracking-projection.store';

export interface TimelineEventView {
  id: string;
  eventId: string;
  eventTypeCode: string;
  eventType: string;
  shipmentCode: string;
  actor: string | null;
  eventSource: string;
  locationCode: string | null;
  locationText: string | null;
  statusAfterEventCode: string | null;
  statusAfterEvent: string | null;
  occurredAt: Date;
  payload: TimelineEvent['payload'];
}

export interface TrackingCurrentView {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText: string | null;
  lastEventTypeCode: string | null;
  lastEventType: string | null;
  lastEventAt: Date | null;
  updatedAt: Date;
  viewPayload: Record<string, unknown> | null;
}

export interface PublicTrackingView {
  shipmentCode: string;
  current: TrackingCurrentView | null;
  timeline: TimelineEventView[];
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
    const timelineRecords = await this.trackingProjectionStore.getTimeline(
      shipmentCode,
    );
    const currentRecord = await this.trackingProjectionStore.getCurrent(
      shipmentCode,
    );

    if (!currentRecord && timelineRecords.length === 0) {
      throw new NotFoundException(
        `Tracking data for shipment "${shipmentCode}" was not found.`,
      );
    }

    const timeline = this.mapTimeline(timelineRecords);
    const current = this.mapCurrent(currentRecord, timeline);

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

  async getTimeline(shipmentCode: string): Promise<TimelineEventView[]> {
    const timeline = this.mapTimeline(
      await this.trackingProjectionStore.getTimeline(shipmentCode),
    );

    if (timeline.length === 0) {
      throw new NotFoundException(
        `Tracking timeline for shipment "${shipmentCode}" was not found.`,
      );
    }

    return timeline;
  }

  async getCurrent(shipmentCode: string): Promise<TrackingCurrentView> {
    const timeline = this.mapTimeline(
      await this.trackingProjectionStore.getTimeline(shipmentCode),
    );
    const current = this.mapCurrent(
      await this.trackingProjectionStore.getCurrent(shipmentCode),
      timeline,
    );

    if (!current) {
      throw new NotFoundException(
        `Tracking current view for shipment "${shipmentCode}" was not found.`,
      );
    }

    return current;
  }

  private mapTimeline(timelineRecords: TimelineEvent[]): TimelineEventView[] {
    let statusCursor: string | null = null;

    return timelineRecords.map((event) => {
      statusCursor = resolveTrackingStatusFromEvent(event.payload, statusCursor);
      const statusLabel = toTrackingStatusLabelVi(statusCursor);
      const eventText = toTimelineTextVi(event.payload, event.locationCode);
      const source = event.actor?.trim() ? event.actor : 'Hệ thống';

      return {
        id: event.id,
        eventId: event.eventId,
        eventTypeCode: event.eventType,
        eventType: eventText,
        shipmentCode: event.shipmentCode,
        actor: event.actor,
        eventSource: source,
        locationCode: event.locationCode,
        locationText: event.locationCode ? `Kho ${event.locationCode}` : null,
        statusAfterEventCode: statusCursor,
        statusAfterEvent: statusLabel,
        occurredAt: event.occurredAt,
        payload: event.payload,
      };
    });
  }

  private mapCurrent(
    current: TrackingCurrent | null,
    timeline: TimelineEventView[],
  ): TrackingCurrentView | null {
    if (!current) {
      return null;
    }

    const latestTimeline = timeline[timeline.length - 1] ?? null;
    const statusCode = current.currentStatus ?? latestTimeline?.statusAfterEventCode ?? null;
    const lastEventTypeCode = current.lastEventType ?? latestTimeline?.eventTypeCode ?? null;
    const lastEventTypeLabel =
      latestTimeline && latestTimeline.eventTypeCode === lastEventTypeCode
        ? latestTimeline.eventType
        : lastEventTypeCode
          ? toTimelineTextVi(
              {
                event_id: current.lastEventId ?? 'latest',
                event_type: lastEventTypeCode,
                occurred_at: current.lastEventAt?.toISOString() ?? '',
                shipment_code: current.shipmentCode,
                actor: null,
                location: null,
                data: {},
                idempotency_key: current.lastEventId ?? 'latest',
              },
              current.currentLocationCode,
            )
          : null;

    return {
      shipmentCode: current.shipmentCode,
      currentStatusCode: statusCode,
      currentStatus: toTrackingStatusLabelVi(statusCode),
      currentLocationCode: current.currentLocationCode,
      currentLocationText: current.currentLocationCode
        ? `Kho ${current.currentLocationCode}`
        : null,
      lastEventTypeCode,
      lastEventType: lastEventTypeLabel,
      lastEventAt: current.lastEventAt,
      updatedAt: current.updatedAt,
      viewPayload: current.viewPayload,
    };
  }
}
