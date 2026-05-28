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

const DEFAULT_RETENTION_DAYS = 45;

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
    await this.deleteExpiredProjectionForShipmentCode(shipmentCode, occurredAt);
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

  private async deleteExpiredProjectionForShipmentCode(
    shipmentCode: string,
    now: Date,
  ): Promise<void> {
    const cutoff = getRetentionCutoff(now);
    const [existingCurrent, existingIndex] = await Promise.all([
      this.prisma.trackingCurrent.findUnique({
        where: {
          shipmentCode,
        },
      }),
      this.prisma.trackingIndex.findUnique({
        where: {
          shipmentCode,
        },
      }),
    ]);
    const currentExpired = existingCurrent
      ? (existingCurrent.lastEventAt ?? existingCurrent.createdAt) < cutoff
      : false;
    const indexExpired = existingIndex
      ? (existingIndex.latestEventAt ?? existingIndex.createdAt) < cutoff
      : false;

    if (!currentExpired && !indexExpired) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.timelineEvent.deleteMany({
        where: {
          shipmentCode,
        },
      }),
      this.prisma.trackingCurrent.deleteMany({
        where: {
          shipmentCode,
        },
      }),
      this.prisma.trackingIndex.deleteMany({
        where: {
          shipmentCode,
        },
      }),
    ]);
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
      this.getFirstNormalizedString(event.location, [
        ['location_code'],
        ['locationCode'],
        ['hub_code'],
        ['hubCode'],
        ['code'],
      ]) ??
      this.getFirstNormalizedString(event.data, [
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
      this.getFirstNormalizedString(event.data, [
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
      this.getFirstNormalizedString(event.data, [
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

  private normalizeLocationCode(value: string | null): string | null {
    const normalized = value?.trim().toUpperCase() ?? '';

    return normalized.length > 0 ? normalized : null;
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

function getRetentionCutoff(now: Date): Date {
  const retentionDays = readPositiveNumber(
    process.env.SHIPMENT_RETENTION_DAYS ?? process.env.ORDER_RETENTION_DAYS,
    DEFAULT_RETENTION_DAYS,
  );

  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
