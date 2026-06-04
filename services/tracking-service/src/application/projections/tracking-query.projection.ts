import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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
  order: PublicShipmentOrderView | null;
  sourceOfTruth: {
    currentStatus: string;
    currentLocation: string;
  };
}

export interface PublicContactView {
  name: string | null;
  phone: string | null;
  address: string | null;
  addressDetail: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  region: string | null;
  hubCode: string | null;
}

export interface PublicPackageView {
  itemType: string | null;
  weightKg: number | null;
  dimensionsCm: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
  declaredValue: number | null;
}

export interface PublicShipmentOrderView {
  code: string;
  statusCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sender: PublicContactView;
  receiver: PublicContactView;
  package: PublicPackageView;
  serviceType: string | null;
  codAmount: number | null;
  estimatedFee: number | null;
  currency: string | null;
  deliveryNote: string | null;
  source: string | null;
  routing: {
    originHubCode: string | null;
    destinationHubCode: string | null;
  };
}

@Injectable()
export class TrackingQueryProjection {
  constructor(
    private readonly trackingProjectionStore: TrackingProjectionStore,
  ) {}

  async getPublicTracking(
    shipmentCode: string,
    receiverPhone: string | undefined,
  ): Promise<PublicTrackingView> {
    const normalizedShipmentCode = shipmentCode.trim().toUpperCase();
    const normalizedLookupPhone = normalizePhone(receiverPhone);

    if (!normalizedLookupPhone) {
      throw new BadRequestException(
        'Vui lòng nhập số điện thoại người nhận để xem hành trình đơn.',
      );
    }

    const timelineRecords = await this.trackingProjectionStore.getTimeline(
      normalizedShipmentCode,
    );
    const currentRecord = await this.trackingProjectionStore.getCurrent(
      normalizedShipmentCode,
    );

    if (!currentRecord && timelineRecords.length === 0) {
      throw new NotFoundException(
        `Tracking data for shipment "${normalizedShipmentCode}" was not found.`,
      );
    }

    const shipmentSnapshot = this.extractShipmentSnapshot(timelineRecords, currentRecord);
    const receiverPhoneFromOrder = this.extractReceiverPhone(shipmentSnapshot);

    if (!phonesMatch(receiverPhoneFromOrder, normalizedLookupPhone)) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng khớp mã vận đơn và số điện thoại người nhận.',
      );
    }

    const timeline = this.mapTimeline(timelineRecords);
    const current = this.mapCurrent(currentRecord, timeline);

    return {
      shipmentCode: normalizedShipmentCode,
      current,
      timeline,
      order: this.mapPublicOrder(normalizedShipmentCode, shipmentSnapshot),
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

    let senderAddress: string | null = null;
    let receiverAddress: string | null = null;

    for (const record of timelineRecords) {
      const payload = record.payload as any;
      const shipment = payload?.data?.shipment;
      if (shipment) {
        const metadata = shipment.metadata || {};
        const sender = metadata.sender || {};
        const receiver = metadata.receiver || {};
        
        const sa = sender.address || metadata.senderAddress || shipment.senderAddress;
        if (sa && typeof sa === 'string') {
          senderAddress = sa;
        }
        
        const ra = receiver.address || metadata.receiverAddress || shipment.receiverAddress;
        if (ra && typeof ra === 'string') {
          receiverAddress = ra;
        }
        
        if (senderAddress && receiverAddress) {
          break;
        }
      }
    }

    return timelineRecords.map((event) => {
      statusCursor = resolveTrackingStatusFromEvent(event.payload, statusCursor);
      const statusLabel = toTrackingStatusLabelVi(statusCursor);
      const locationCode =
        event.locationCode ?? this.extractLocationCode(event.payload);
      const eventText = toTimelineTextVi(event.payload, locationCode);
      const source = event.actor?.trim() ? event.actor : 'Hệ thống';

      let locationText = locationCode ? `Kho ${locationCode}` : null;
      if (
        statusCursor === 'PICKUP_REQUESTED' ||
        statusCursor === 'PICKUP_ASSIGNED' ||
        statusCursor === 'UPDATED' ||
        statusCursor === 'TASK_ASSIGNED'
      ) {
        if (senderAddress) {
          locationText = senderAddress;
        }
      } else if (
        statusCursor === 'DELIVERING' ||
        statusCursor === 'OUT_FOR_DELIVERY' ||
        statusCursor === 'DELIVERED'
      ) {
        if (receiverAddress) {
          locationText = receiverAddress;
        }
      }

      return {
        id: event.id,
        eventId: event.eventId,
        eventTypeCode: event.eventType,
        eventType: eventText,
        shipmentCode: event.shipmentCode,
        actor: event.actor,
        eventSource: source,
        locationCode,
        locationText,
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

    const currentLocationText =
      latestTimeline?.locationText ??
      (currentLocationCode ? `Kho ${currentLocationCode}` : null);

    return {
      shipmentCode: current.shipmentCode,
      currentStatusCode: statusCode,
      currentStatus: toTrackingStatusLabelVi(statusCode),
      currentLocationCode,
      currentLocationText,
      lastEventTypeCode,
      lastEventType: lastEventTypeLabel,
      lastEventAt: current.lastEventAt,
      updatedAt: current.updatedAt,
      viewPayload: current.viewPayload,
    };
  }

  private extractShipmentSnapshot(
    timelineRecords: TimelineEvent[],
    current: TrackingCurrent | null,
  ): Record<string, unknown> | null {
    const fromCurrent = this.getNestedRecord(current?.viewPayload, [
      'event_data',
      'shipment',
    ]);

    if (fromCurrent) {
      return fromCurrent;
    }

    for (const record of [...timelineRecords].reverse()) {
      const shipment = this.getNestedRecord(record.payload, ['data', 'shipment']);
      if (shipment) {
        return shipment;
      }
    }

    return null;
  }

  private extractReceiverPhone(
    shipmentSnapshot: Record<string, unknown> | null,
  ): string | null {
    const metadata = this.asRecord(shipmentSnapshot?.metadata);

    return (
      this.getNestedString(metadata, ['receiver', 'phone']) ??
      this.getNestedString(shipmentSnapshot, ['receiver', 'phone']) ??
      this.getNestedString(metadata, ['receiverPhone']) ??
      this.getNestedString(shipmentSnapshot, ['receiverPhone']) ??
      null
    );
  }

  private mapPublicOrder(
    shipmentCode: string,
    shipmentSnapshot: Record<string, unknown> | null,
  ): PublicShipmentOrderView | null {
    if (!shipmentSnapshot) {
      return null;
    }

    const metadata = this.asRecord(shipmentSnapshot.metadata) ?? {};
    const sender = this.asRecord(metadata.sender) ?? this.asRecord(shipmentSnapshot.sender);
    const receiver = this.asRecord(metadata.receiver) ?? this.asRecord(shipmentSnapshot.receiver);
    const packageInfo =
      this.asRecord(metadata.package) ??
      this.asRecord(metadata.parcel) ??
      this.asRecord(metadata.item);
    const dimensions = this.asRecord(packageInfo?.dimensionsCm);
    const service = this.asRecord(metadata.service);
    const routing = this.asRecord(metadata.routing);
    const pricing = this.asRecord(metadata.pricing);

    return {
      code:
        this.asString(shipmentSnapshot.code) ??
        this.asString(shipmentSnapshot.shipmentCode) ??
        shipmentCode,
      statusCode:
        this.asString(shipmentSnapshot.currentStatus) ??
        this.asString(shipmentSnapshot.status) ??
        null,
      createdAt: this.asString(shipmentSnapshot.createdAt),
      updatedAt: this.asString(shipmentSnapshot.updatedAt),
      sender: {
        name: this.asString(sender?.name) ?? this.asString(metadata.senderName),
        phone: this.asString(sender?.phone) ?? this.asString(metadata.senderPhone),
        address: this.asString(sender?.address) ?? this.asString(metadata.senderAddress),
        addressDetail:
          this.asString(sender?.addressDetail) ??
          this.asString(metadata.senderAddressDetail),
        ward: this.asString(sender?.ward) ?? this.asString(metadata.senderWard),
        district: this.asString(sender?.district) ?? this.asString(metadata.senderDistrict),
        province: this.asString(sender?.province) ?? this.asString(metadata.senderProvince),
        region: this.asString(sender?.region) ?? this.asString(metadata.senderRegion),
        hubCode:
          this.asString(sender?.hubCode) ??
          this.asString(metadata.senderHubCode) ??
          this.asString(routing?.originHubCode),
      },
      receiver: {
        name: this.asString(receiver?.name) ?? this.asString(metadata.receiverName),
        phone: this.asString(receiver?.phone) ?? this.asString(metadata.receiverPhone),
        address:
          this.asString(receiver?.address) ??
          this.asString(metadata.receiverAddress),
        addressDetail:
          this.asString(receiver?.addressDetail) ??
          this.asString(metadata.receiverAddressDetail),
        ward: this.asString(receiver?.ward) ?? this.asString(metadata.receiverWard),
        district:
          this.asString(receiver?.district) ??
          this.asString(metadata.receiverDistrict),
        province:
          this.asString(receiver?.province) ??
          this.asString(metadata.receiverProvince),
        region:
          this.asString(receiver?.region) ??
          this.asString(metadata.receiverRegion),
        hubCode:
          this.asString(receiver?.hubCode) ??
          this.asString(metadata.receiverHubCode) ??
          this.asString(routing?.destinationHubCode),
      },
      package: {
        itemType:
          this.asString(packageInfo?.itemType) ??
          this.asString(packageInfo?.type) ??
          this.asString(metadata.itemType) ??
          this.asString(metadata.goodsType),
        weightKg:
          this.asNumber(packageInfo?.weightKg) ??
          this.asNumber(packageInfo?.weight) ??
          this.asNumber(metadata.weightKg),
        dimensionsCm: {
          length: this.asNumber(dimensions?.length) ?? this.asNumber(metadata.lengthCm),
          width: this.asNumber(dimensions?.width) ?? this.asNumber(metadata.widthCm),
          height: this.asNumber(dimensions?.height) ?? this.asNumber(metadata.heightCm),
        },
        declaredValue:
          this.asNumber(packageInfo?.declaredValue) ??
          this.asNumber(metadata.declaredValue),
      },
      serviceType:
        this.asString(service?.type) ??
        this.asString(metadata.serviceType) ??
        null,
      codAmount: this.asNumber(metadata.codAmount),
      estimatedFee:
        this.asNumber(metadata.estimatedFee) ??
        this.asNumber(metadata.shippingFee) ??
        this.asNumber(metadata.deliveryFee) ??
        this.asNumber(pricing?.totalFee) ??
        this.asNumber(pricing?.fee),
      currency:
        this.asString(metadata.currency) ??
        this.asString(pricing?.currency) ??
        'VND',
      deliveryNote:
        this.asString(metadata.deliveryNote) ??
        this.asString(metadata.note) ??
        null,
      source:
        this.asString(metadata.source) ??
        this.asString(metadata.platform) ??
        this.asString(metadata.salesChannel) ??
        null,
      routing: {
        originHubCode:
          this.asString(routing?.originHubCode) ??
          this.asString(metadata.originHubCode) ??
          this.asString(sender?.hubCode) ??
          null,
        destinationHubCode:
          this.asString(routing?.destinationHubCode) ??
          this.asString(metadata.destinationHubCode) ??
          this.asString(receiver?.hubCode) ??
          null,
      },
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

  private getNestedRecord(
    source: unknown,
    path: string[],
  ): Record<string, unknown> | null {
    let cursor: unknown = source;

    for (const segment of path) {
      if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
        return null;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return this.asRecord(cursor);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeLocationCode(value: string | null): string | null {
    const normalized = value?.trim().toUpperCase() ?? '';

    return normalized.length > 0 ? normalized : null;
  }
}

function normalizePhone(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';

  return digits.length > 0 ? digits : null;
}

function phoneVariants(value: string | null | undefined): Set<string> {
  const normalized = normalizePhone(value);
  const variants = new Set<string>();

  if (!normalized) {
    return variants;
  }

  variants.add(normalized);

  if (normalized.startsWith('84') && normalized.length >= 10) {
    variants.add(`0${normalized.slice(2)}`);
  }

  if (normalized.startsWith('0') && normalized.length >= 10) {
    variants.add(`84${normalized.slice(1)}`);
  }

  return variants;
}

function phonesMatch(
  storedPhone: string | null | undefined,
  lookupPhone: string | null | undefined,
): boolean {
  const storedVariants = phoneVariants(storedPhone);
  const lookupVariants = phoneVariants(lookupPhone);

  for (const variant of lookupVariants) {
    if (storedVariants.has(variant)) {
      return true;
    }
  }

  return false;
}
