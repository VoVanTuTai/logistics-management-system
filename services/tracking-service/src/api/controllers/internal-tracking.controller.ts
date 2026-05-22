import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';

import {
  type OperationTimelineEventView,
  type TimelineEventView,
  type TrackingCurrentView,
  TrackingQueryProjection,
} from '../../application/projections/tracking-query.projection';
import type {
  OperationEntityType,
  OperationTimelineFilters,
} from '../../domain/entities/operation-timeline-event.entity';

@Controller('tracking')
export class InternalTrackingController {
  constructor(
    private readonly trackingQueryProjection: TrackingQueryProjection,
  ) {}

  @Get('operation-timeline')
  getOperationTimeline(
    @Query('entityType') entityType?: string,
    @Query('entityCode') entityCode?: string,
    @Query('shipmentCode') shipmentCode?: string,
    @Query('manifestCode') manifestCode?: string,
    @Query('tripCode') tripCode?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: string,
  ): Promise<OperationTimelineEventView[]> {
    return this.trackingQueryProjection.getOperationTimeline({
      entityType: this.normalizeEntityType(entityType),
      entityCode: this.normalizeCode(entityCode),
      shipmentCode: this.normalizeCode(shipmentCode),
      manifestCode: this.normalizeCode(manifestCode),
      tripCode: this.normalizeCode(tripCode),
      eventType: this.normalizeText(eventType),
      limit: this.normalizeLimit(limit),
    });
  }

  @Get('operation-timeline/:entityType/:entityCode')
  getOperationTimelineByEntity(
    @Param('entityType') entityType: string,
    @Param('entityCode') entityCode: string,
    @Query('limit') limit?: string,
  ): Promise<OperationTimelineEventView[]> {
    return this.trackingQueryProjection.getOperationTimeline({
      entityType: this.normalizeRequiredEntityType(entityType),
      entityCode: this.normalizeRequiredCode(entityCode, 'entityCode'),
      limit: this.normalizeLimit(limit),
    });
  }

  @Get(':shipmentCode/timeline')
  getTimeline(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TimelineEventView[]> {
    return this.trackingQueryProjection.getTimeline(shipmentCode);
  }

  @Get(':shipmentCode/current')
  getCurrent(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<TrackingCurrentView> {
    return this.trackingQueryProjection.getCurrent(shipmentCode);
  }

  private normalizeEntityType(value: string | undefined): OperationEntityType | undefined {
    if (!value) {
      return undefined;
    }

    return this.normalizeRequiredEntityType(value);
  }

  private normalizeRequiredEntityType(value: string): OperationEntityType {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'SHIPMENT' || normalized === 'MANIFEST' || normalized === 'TRIP') {
      return normalized;
    }

    throw new BadRequestException('entityType must be SHIPMENT, MANIFEST, or TRIP.');
  }

  private normalizeRequiredCode(value: string | undefined, fieldName: string): string {
    const normalized = this.normalizeCode(value);
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return normalized;
  }

  private normalizeCode(value: string | undefined): string | undefined {
    const normalized = value?.trim().toUpperCase() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeLimit(value: string | undefined): OperationTimelineFilters['limit'] {
    if (!value) {
      return undefined;
    }

    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new BadRequestException('limit must be an integer from 1 to 500.');
    }

    return limit;
  }
}
