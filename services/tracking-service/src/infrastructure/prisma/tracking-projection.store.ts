import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  TimelineEvent as PrismaTimelineEventRecord,
  TrackingCurrent as PrismaTrackingCurrentRecord,
  TrackingIndex as PrismaTrackingIndexRecord,
} from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

import {
  isTrackingBusinessEventType,
  resolveTrackingStatusFromEvent,
  toTimelineTextVi,
  toTrackingStatusLabelVi,
} from '../../application/mappers/tracking-display.mapper';
import type {
  TimelineEvent,
  TrackingEventEnvelope,
} from '../../domain/entities/timeline-event.entity';
import type { TrackingCurrent } from '../../domain/entities/tracking-current.entity';
import type { TrackingIndex } from '../../domain/entities/tracking-index.entity';
import { PrismaService } from './prisma.service';

@Injectable()
export class TrackingProjectionStore {
  constructor(private readonly prisma: PrismaService) {}

  async project(
    event: TrackingEventEnvelope,
  ): Promise<{ projected: boolean; shipmentCode: string | null }> {
    if (!isTrackingBusinessEventType(event.event_type)) {
      return {
        projected: false,
        shipmentCode: null,
      };
    }

    const shipmentCode = this.extractShipmentCode(event);
    if (!shipmentCode) {
      return {
        projected: false,
        shipmentCode: null,
      };
    }

    const occurredAt = new Date(event.occurred_at);
    const actor = this.extractActor(event);
    const locationCode = this.extractLocationCode(event);
    const existingCurrent = await this.prisma.trackingCurrent.findUnique({
      where: {
        shipmentCode,
      },
    });
    const currentStatus = this.deriveCurrentStatus(event, existingCurrent);
    const currentStatusLabelVi = toTrackingStatusLabelVi(currentStatus);
    const timelineTextVi = toTimelineTextVi(event, locationCode);
    const currentLocationCode =
      locationCode ?? existingCurrent?.currentLocationCode ?? null;

    const timelineCreated = await this.createTimelineIfAbsent({
      eventId: event.event_id,
      eventType: event.event_type,
      shipmentCode,
      actor,
      locationCode,
      payload: event as unknown as Prisma.InputJsonValue,
      occurredAt,
    });

    await this.prisma.trackingCurrent.upsert({
      where: {
        shipmentCode,
      },
      update: {
        currentStatus,
        currentLocationCode,
        lastEventId: event.event_id,
        lastEventType: event.event_type,
        lastEventAt: occurredAt,
        viewPayload: {
          source_of_truth: {
            current_status: 'shipment-service',
            current_location: 'scan-service',
          },
          display: {
            timeline_text_vi: timelineTextVi,
            current_status_label_vi: currentStatusLabelVi,
          },
          event_data: event.data,
        } as unknown as Prisma.InputJsonValue,
      },
      create: {
        shipmentCode,
        currentStatus,
        currentLocationCode,
        lastEventId: event.event_id,
        lastEventType: event.event_type,
        lastEventAt: occurredAt,
        viewPayload: {
          source_of_truth: {
            current_status: 'shipment-service',
            current_location: 'scan-service',
          },
          display: {
            timeline_text_vi: timelineTextVi,
            current_status_label_vi: currentStatusLabelVi,
          },
          event_data: event.data,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.trackingIndex.upsert({
      where: {
        shipmentCode,
      },
      update: {
        latestEventType: event.event_type,
        latestEventAt: occurredAt,
      },
      create: {
        shipmentCode,
        latestEventType: event.event_type,
        latestEventAt: occurredAt,
      },
    });

    return {
      projected: timelineCreated,
      shipmentCode,
    };
  }

  async getTimeline(shipmentCode: string): Promise<TimelineEvent[]> {
    const records = await this.prisma.timelineEvent.findMany({
      where: {
        shipmentCode,
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    return records.map((record) => this.toTimelineEntity(record));
  }

  async getCurrent(shipmentCode: string): Promise<TrackingCurrent | null> {
    const record = await this.prisma.trackingCurrent.findUnique({
      where: {
        shipmentCode,
      },
    });

    return record ? this.toTrackingCurrentEntity(record) : null;
  }

  async getIndex(shipmentCode: string): Promise<TrackingIndex | null> {
    const record = await this.prisma.trackingIndex.findUnique({
      where: {
        shipmentCode,
      },
    });

    return record ? this.toTrackingIndexEntity(record) : null;
  }

  private async createTimelineIfAbsent(
    data: Prisma.TimelineEventCreateInput,
  ): Promise<boolean> {
    try {
      await this.prisma.timelineEvent.create({ data });
      return true;
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }

      throw error;
    }
  }

  private deriveCurrentStatus(
    event: TrackingEventEnvelope,
    existingCurrent: PrismaTrackingCurrentRecord | null,
  ): string | null {
    const currentFromPayload =
      this.getNestedString(event.data, ['shipment', 'currentStatus']) ??
      this.getNestedString(event.data, ['shipment', 'status']) ??
      this.getNestedString(event.data, ['trackingCurrent', 'currentStatus']) ??
      null;

    return resolveTrackingStatusFromEvent(
      event,
      currentFromPayload ?? existingCurrent?.currentStatus ?? null,
    );
  }

  private extractLocationCode(event: TrackingEventEnvelope): string | null {
    return (
      this.getNestedString(event.location, ['location_code']) ??
      this.getNestedString(event.location, ['locationCode']) ??
      this.getNestedString(event.data, ['currentLocation', 'locationCode']) ??
      this.getNestedString(event.data, ['currentLocation', 'location_code']) ??
      this.getNestedString(event.data, ['scanEvent', 'locationCode']) ??
      null
    );
  }

  private extractShipmentCode(event: TrackingEventEnvelope): string | null {
    if (typeof event.shipment_code === 'string' && event.shipment_code.trim()) {
      return event.shipment_code;
    }

    return (
      this.getNestedString(event.data, ['shipment', 'code']) ??
      this.getNestedString(event.data, ['shipmentCode']) ??
      null
    );
  }

  private extractActor(event: TrackingEventEnvelope): string | null {
    if (typeof event.actor === 'string' && event.actor.trim()) {
      return event.actor;
    }

    if (!event.actor || typeof event.actor !== 'object' || Array.isArray(event.actor)) {
      return null;
    }

    return (
      this.getNestedString(event.actor, ['service']) ??
      this.getNestedString(event.actor, ['name']) ??
      this.getNestedString(event.actor, ['id']) ??
      null
    );
  }

  private getNestedString(
    source: unknown,
    path: string[],
  ): string | null {
    let cursor: unknown = source;

    for (const segment of path) {
      if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
        return null;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return typeof cursor === 'string' ? cursor : null;
  }

  private toTimelineEntity(record: PrismaTimelineEventRecord): TimelineEvent {
    return {
      id: record.id,
      eventId: record.eventId,
      eventType: record.eventType,
      shipmentCode: record.shipmentCode,
      actor: record.actor,
      locationCode: record.locationCode,
      payload: record.payload as unknown as TrackingEventEnvelope,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toTrackingCurrentEntity(
    record: PrismaTrackingCurrentRecord,
  ): TrackingCurrent {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      currentStatus: record.currentStatus,
      currentLocationCode: record.currentLocationCode,
      lastEventId: record.lastEventId,
      lastEventType: record.lastEventType,
      lastEventAt: record.lastEventAt,
      viewPayload: record.viewPayload as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toTrackingIndexEntity(record: PrismaTrackingIndexRecord): TrackingIndex {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      latestEventType: record.latestEventType,
      latestEventAt: record.latestEventAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
