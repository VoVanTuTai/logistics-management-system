import { Injectable, NotFoundException } from '@nestjs/common';

import {
  resolveTrackingStatusFromEvent,
  toTimelineTextVi,
  toTrackingStatusLabelVi,
  extractTimelineNote,
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
  note: string | null;
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
      const locationCode =
        event.locationCode ?? this.extractLocationCode(event.payload);
      const eventText = toTimelineTextVi(event.payload, locationCode);
      const source = event.actor?.trim() ? event.actor : 'Hệ thống';

      return {
        id: event.id,
        eventId: event.eventId,
        eventTypeCode: event.eventType,
        eventType: eventText,
        shipmentCode: event.shipmentCode,
        actor: event.actor,
        eventSource: source,
        locationCode,
        locationText: locationCode ? `Kho ${locationCode}` : null,
        statusAfterEventCode: statusCursor,
        statusAfterEvent: statusLabel,
        occurredAt: event.occurredAt,
        payload: event.payload,
        note: extractTimelineNote(event.payload),
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
    const currentLocationCode =
      current.currentLocationCode ?? latestTimeline?.locationCode ?? null;
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
              currentLocationCode,
            )
          : null;

    return {
      shipmentCode: current.shipmentCode,
      currentStatusCode: statusCode,
      currentStatus: toTrackingStatusLabelVi(statusCode),
      currentLocationCode,
      currentLocationText: currentLocationCode
        ? `Kho ${currentLocationCode}`
        : null,
      lastEventTypeCode,
      lastEventType: lastEventTypeLabel,
      lastEventAt: current.lastEventAt,
      updatedAt: current.updatedAt,
      viewPayload: current.viewPayload,
    };
  }

  private extractLocationCode(payload: TimelineEvent['payload']): string | null {
    return (
      this.getFirstNormalizedString(payload.location, [
        ['location_code'],
        ['locationCode'],
        ['hub_code'],
        ['hubCode'],
        ['code'],
      ]) ??
      this.getFirstNormalizedString(payload.data, [
        ['currentLocation', 'locationCode'],
        ['currentLocation', 'location_code'],
        ['currentLocation', 'hubCode'],
        ['currentLocation', 'code'],
        ['trackingCurrent', 'currentLocationCode'],
        ['trackingCurrent', 'current_location_code'],
        ['scanEvent', 'locationCode'],
        ['scanEvent', 'location_code'],
        ['scanEvent', 'hubCode'],
      ]) ??
      this.getFirstNormalizedString(payload.data, [
        ['shipment', 'currentLocationCode'],
        ['shipment', 'currentLocation'],
        ['shipment', 'current_location_code'],
        ['shipment', 'metadata', 'currentLocationCode'],
        ['shipment', 'metadata', 'currentLocation'],
        ['shipment', 'metadata', 'current_location_code'],
        ['shipment', 'metadata', 'routing', 'originHubCode'],
        ['shipment', 'metadata', 'sender', 'hubCode'],
        ['shipment', 'metadata', 'senderHubCode'],
        ['shipment', 'metadata', 'originHubCode'],
        ['shipment', 'metadata', 'hubCode'],
        ['shipment', 'metadata', 'routing', 'destinationHubCode'],
        ['shipment', 'metadata', 'receiver', 'hubCode'],
        ['shipment', 'metadata', 'receiverHubCode'],
        ['shipment', 'metadata', 'destinationHubCode'],
      ]) ??
      this.getFirstNormalizedString(payload.data, [
        ['pickup', 'hubCode'],
        ['pickupRequest', 'hubCode'],
        ['pickup_request', 'hubCode'],
        ['manifest', 'currentHubCode'],
        ['manifest', 'originHubCode'],
        ['manifest', 'destinationHubCode'],
      ]) ??
      null
    );
  }

  private getFirstNormalizedString(
    source: unknown,
    paths: string[][],
  ): string | null {
    for (const path of paths) {
      const value = this.normalizeLocationCode(
        this.getNestedString(source, path),
      );

      if (value) {
        return value;
      }
    }

    return null;
  }

  private getNestedString(source: unknown, path: string[]): string | null {
    let cursor: unknown = source;

    for (const segment of path) {
      if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
        return null;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return typeof cursor === 'string' ? cursor : null;
  }

  private normalizeLocationCode(value: string | null): string | null {
    const normalized = value?.trim().toUpperCase() ?? '';

    return normalized.length > 0 ? normalized : null;
  }
}
