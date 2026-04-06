import { Injectable } from '@nestjs/common';
import type { KpiDaily, KpiMonthly, Prisma } from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

import type {
  ProjectionResult,
  ReportingEventEnvelope,
  ShipmentStatusSummaryItem,
} from '../../application/projections/reporting-event.types';
import { PrismaService } from './prisma.service';

const ALL = 'ALL';

type MetricField = keyof Pick<
  KpiDaily,
  | 'shipmentsCreated'
  | 'pickupsCompleted'
  | 'deliveriesDelivered'
  | 'deliveriesFailed'
  | 'ndrCreated'
  | 'scansInbound'
  | 'scansOutbound'
>;

const METRIC_FIELDS: Record<string, MetricField> = {
  'shipment.created': 'shipmentsCreated',
  'scan.pickup_confirmed': 'pickupsCompleted',
  'delivery.delivered': 'deliveriesDelivered',
  'delivery.failed': 'deliveriesFailed',
  'ndr.created': 'ndrCreated',
  'scan.inbound': 'scansInbound',
  'scan.outbound': 'scansOutbound',
};

const STATUS_BY_EVENT: Record<string, string> = {
  'shipment.created': 'CREATED',
  'pickup.requested': 'PICKUP_REQUESTED',
  'pickup.approved': 'PICKUP_ASSIGNED',
  'scan.pickup_confirmed': 'PICKED_UP',
  'manifest.sealed': 'IN_TRANSIT',
  'manifest.received': 'INBOUND_AT_HUB',
  'scan.inbound': 'INBOUND_AT_HUB',
  'scan.outbound': 'OUTBOUND_FROM_HUB',
  'delivery.attempted': 'DELIVERING',
  'delivery.delivered': 'DELIVERED',
  'delivery.failed': 'DELIVERY_FAILED',
  'ndr.created': 'DELIVERY_FAILED',
  'return.started': 'RETURNING',
  'return.completed': 'RETURNED',
};

type DimensionKey = 'courier' | 'hub' | 'zone';

interface DimensionFilter {
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

interface NormalizedDimensions {
  courierCode: string;
  hubCode: string;
  zoneCode: string;
}

@Injectable()
export class ReportingProjectionStore {
  constructor(private readonly prisma: PrismaService) {}

  async project(event: ReportingEventEnvelope): Promise<ProjectionResult> {
    const metricField = METRIC_FIELDS[event.event_type];
    const status = this.resolveStatusByEvent(event);

    if (!metricField && !status) {
      return {
        projected: false,
        eventId: event.event_id,
        eventType: event.event_type,
      };
    }

    const jobCreated = await this.createProjectionLedgerIfAbsent(event);
    if (!jobCreated) {
      return {
        projected: false,
        eventId: event.event_id,
        eventType: event.event_type,
      };
    }

    const occurredAt = this.resolveOccurredAt(event.occurred_at);
    const dimensions = this.extractDimensions(event);

    if (metricField) {
      const metricDate = this.resolveDate(event.occurred_at);
      const monthKey = occurredAt.toISOString().slice(0, 7);
      const dimensionCombinations = this.buildDimensionCombinations(dimensions);

      for (const combination of dimensionCombinations) {
        await this.incrementDaily(metricDate, metricField, combination);
        await this.incrementMonthly(monthKey, metricField, combination);
      }
    }

    if (status) {
      await this.upsertShipmentStatusProjection(event, status, occurredAt, dimensions);
    }

    return {
      projected: true,
      eventId: event.event_id,
      eventType: event.event_type,
    };
  }

  private resolveStatusByEvent(event: ReportingEventEnvelope): string | null {
    if (event.event_type === 'task.assigned') {
      const taskType =
        this.findString(event.data, [
          ['task', 'taskType'],
          ['task', 'task_type'],
        ])?.toUpperCase() ?? null;

      if (taskType === 'DELIVERY') {
        return 'OUT_FOR_DELIVERY';
      }

      if (taskType === 'PICKUP') {
        return 'PICKUP_ASSIGNED';
      }
    }

    return STATUS_BY_EVENT[event.event_type] ?? null;
  }

  resolveDate(date?: string): Date {
    const baseDate = date ? new Date(date) : new Date();

    return new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
      ),
    );
  }

  async getDaily(date?: string, filter?: DimensionFilter): Promise<KpiDaily[]> {
    const hasScopedFilter = this.hasAnyDimensionFilter(filter);

    return this.prisma.kpiDaily.findMany({
      where: {
        metricDate: this.resolveDate(date),
        courierCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.courierCode)
          : this.toWhereDimensionValue(filter?.courierCode),
        hubCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.hubCode)
          : this.toWhereDimensionValue(filter?.hubCode),
        zoneCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.zoneCode)
          : this.toWhereDimensionValue(filter?.zoneCode),
      },
      orderBy: [{ courierCode: 'asc' }, { hubCode: 'asc' }, { zoneCode: 'asc' }],
    });
  }

  async getMonthly(month?: string, filter?: DimensionFilter): Promise<KpiMonthly[]> {
    const monthKey = month ?? new Date().toISOString().slice(0, 7);
    const hasScopedFilter = this.hasAnyDimensionFilter(filter);

    return this.prisma.kpiMonthly.findMany({
      where: {
        monthKey,
        courierCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.courierCode)
          : this.toWhereDimensionValue(filter?.courierCode),
        hubCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.hubCode)
          : this.toWhereDimensionValue(filter?.hubCode),
        zoneCode: hasScopedFilter
          ? this.normalizeDimensionValue(filter?.zoneCode)
          : this.toWhereDimensionValue(filter?.zoneCode),
      },
      orderBy: [{ courierCode: 'asc' }, { hubCode: 'asc' }, { zoneCode: 'asc' }],
    });
  }

  getDailyGlobal(metricDate: Date): Promise<KpiDaily | null> {
    return this.prisma.kpiDaily.findUnique({
      where: {
        daily_dimension_unique: {
          metricDate,
          courierCode: ALL,
          hubCode: ALL,
          zoneCode: ALL,
        },
      },
    });
  }

  getDailyTotals(metricDate: Date, filter?: DimensionFilter): Promise<KpiDaily | null> {
    const dimensions = this.normalizeDimensions(filter);

    return this.prisma.kpiDaily.findUnique({
      where: {
        daily_dimension_unique: {
          metricDate,
          courierCode: dimensions.courierCode,
          hubCode: dimensions.hubCode,
          zoneCode: dimensions.zoneCode,
        },
      },
    });
  }

  getDailyByCourier(
    metricDate: Date,
    courierCode?: string,
    scope?: Omit<DimensionFilter, 'courierCode'>,
  ): Promise<KpiDaily[]> {
    return this.getDailyByDimension(metricDate, 'courier', {
      ...scope,
      courierCode,
    });
  }

  getDailyByHub(
    metricDate: Date,
    hubCode?: string,
    scope?: Omit<DimensionFilter, 'hubCode'>,
  ): Promise<KpiDaily[]> {
    return this.getDailyByDimension(metricDate, 'hub', {
      ...scope,
      hubCode,
    });
  }

  getDailyByDimension(
    metricDate: Date,
    dimension: DimensionKey,
    scope?: DimensionFilter,
  ): Promise<KpiDaily[]> {
    const normalizedScope = this.normalizeDimensions(scope);
    const hasCourierScope = this.hasScopeValue(scope?.courierCode);
    const hasHubScope = this.hasScopeValue(scope?.hubCode);
    const hasZoneScope = this.hasScopeValue(scope?.zoneCode);

    const where: Prisma.KpiDailyWhereInput = {
      metricDate,
      courierCode:
        dimension === 'courier'
          ? hasCourierScope
            ? normalizedScope.courierCode
            : { not: ALL }
          : normalizedScope.courierCode,
      hubCode:
        dimension === 'hub'
          ? hasHubScope
            ? normalizedScope.hubCode
            : { not: ALL }
          : normalizedScope.hubCode,
      zoneCode:
        dimension === 'zone'
          ? hasZoneScope
            ? normalizedScope.zoneCode
            : { not: ALL }
          : normalizedScope.zoneCode,
    };

    const orderBy =
      dimension === 'courier'
        ? { courierCode: 'asc' as const }
        : dimension === 'hub'
          ? { hubCode: 'asc' as const }
          : { zoneCode: 'asc' as const };

    return this.prisma.kpiDaily.findMany({ where, orderBy });
  }

  async getShipmentStatusSummary(
    date?: string,
    filter?: DimensionFilter,
  ): Promise<ShipmentStatusSummaryItem[]> {
    const dateRange = this.resolveDateRange(date);
    const where: Prisma.ShipmentStatusProjectionWhereInput = {
      courierCode: this.toWhereDimensionValue(filter?.courierCode),
      hubCode: this.toWhereDimensionValue(filter?.hubCode),
      zoneCode: this.toWhereDimensionValue(filter?.zoneCode),
      updatedAt: dateRange
        ? {
            gte: dateRange.start,
            lt: dateRange.end,
          }
        : undefined,
    };

    const rows = await this.prisma.shipmentStatusProjection.groupBy({
      by: ['currentStatus'],
      where,
      _count: {
        _all: true,
      },
      orderBy: {
        currentStatus: 'asc',
      },
    });

    return rows.map((row) => ({
      status: row.currentStatus,
      count: row._count._all,
    }));
  }

  private resolveOccurredAt(value: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }

  private resolveDateRange(date?: string): { start: Date; end: Date } | null {
    if (!date) {
      return null;
    }

    const start = this.resolveDate(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  private toWhereDimensionValue(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  }

  private hasScopeValue(value?: string): boolean {
    return Boolean(value && value.trim().length > 0);
  }

  private hasAnyDimensionFilter(filter?: DimensionFilter): boolean {
    return (
      this.hasScopeValue(filter?.courierCode) ||
      this.hasScopeValue(filter?.hubCode) ||
      this.hasScopeValue(filter?.zoneCode)
    );
  }

  private normalizeDimensions(filter?: DimensionFilter): NormalizedDimensions {
    return {
      courierCode: this.normalizeDimensionValue(filter?.courierCode),
      hubCode: this.normalizeDimensionValue(filter?.hubCode),
      zoneCode: this.normalizeDimensionValue(filter?.zoneCode),
    };
  }

  private normalizeDimensionValue(value?: string): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : ALL;
  }

  private buildDimensionCombinations(
    dimensions: NormalizedDimensions,
  ): NormalizedDimensions[] {
    const combinations: NormalizedDimensions[] = [
      {
        courierCode: ALL,
        hubCode: ALL,
        zoneCode: ALL,
      },
    ];

    const dimensionCandidates: Array<[keyof NormalizedDimensions, string]> = [
      ['courierCode', dimensions.courierCode],
      ['hubCode', dimensions.hubCode],
      ['zoneCode', dimensions.zoneCode],
    ];

    for (const [key, value] of dimensionCandidates) {
      if (value === ALL) {
        continue;
      }

      const next = combinations.map((item) => ({
        ...item,
        [key]: value,
      }));

      combinations.push(...next);
    }

    const unique = new Map<string, NormalizedDimensions>();
    for (const item of combinations) {
      const key = `${item.courierCode}|${item.hubCode}|${item.zoneCode}`;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    }

    return Array.from(unique.values());
  }

  private async createProjectionLedgerIfAbsent(
    event: ReportingEventEnvelope,
  ): Promise<boolean> {
    const data: Prisma.AggregationJobCreateInput = {
      jobType: 'event_projection',
      jobKey: event.event_id,
      status: 'COMPLETED',
      occurredAt: this.resolveOccurredAt(event.occurred_at),
      payload: event as unknown as Prisma.InputJsonValue,
    };

    try {
      await this.prisma.aggregationJob.create({ data });
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

  private async upsertShipmentStatusProjection(
    event: ReportingEventEnvelope,
    status: string,
    occurredAt: Date,
    dimensions: NormalizedDimensions,
  ): Promise<void> {
    const shipmentCode = this.resolveShipmentCode(event);
    if (!shipmentCode) {
      return;
    }

    const existing = await this.prisma.shipmentStatusProjection.findUnique({
      where: { shipmentCode },
    });

    const courierCode = this.resolveStatusDimensionValue(
      existing?.courierCode,
      dimensions.courierCode,
    );
    const hubCode = this.resolveStatusDimensionValue(
      existing?.hubCode,
      dimensions.hubCode,
    );
    const zoneCode = this.resolveStatusDimensionValue(
      existing?.zoneCode,
      dimensions.zoneCode,
    );

    await this.prisma.shipmentStatusProjection.upsert({
      where: { shipmentCode },
      update: {
        currentStatus: status,
        lastEventType: event.event_type,
        lastEventAt: occurredAt,
        courierCode,
        hubCode,
        zoneCode,
      },
      create: {
        shipmentCode,
        currentStatus: status,
        lastEventType: event.event_type,
        lastEventAt: occurredAt,
        courierCode,
        hubCode,
        zoneCode,
      },
    });
  }

  private resolveStatusDimensionValue(
    existingValue: string | null | undefined,
    incomingValue: string,
  ): string | null {
    if (incomingValue !== ALL) {
      return incomingValue;
    }

    return existingValue ?? null;
  }

  private resolveShipmentCode(event: ReportingEventEnvelope): string | null {
    const directShipmentCode =
      typeof event.shipment_code === 'string' ? event.shipment_code.trim() : '';
    if (directShipmentCode.length > 0) {
      return directShipmentCode;
    }

    return this.findString(event.data, [
      ['shipmentCode'],
      ['shipment', 'code'],
      ['deliveryAttempt', 'shipmentCode'],
      ['delivery_attempt', 'shipmentCode'],
      ['ndrCase', 'shipmentCode'],
      ['ndr_case', 'shipmentCode'],
      ['returnCase', 'shipmentCode'],
      ['return_case', 'shipmentCode'],
      ['pickup_request', 'items', '0', 'shipmentCode'],
      ['pickupRequest', 'items', '0', 'shipmentCode'],
    ]);
  }

  private extractDimensions(event: ReportingEventEnvelope): NormalizedDimensions {
    return {
      courierCode:
        this.findString(event.data, [
          ['courierCode'],
          ['courierId'],
          ['task', 'courierId'],
          ['task', 'courierCode'],
          ['deliveryAttempt', 'courierId'],
          ['delivery_attempt', 'courierId'],
          ['pickupRequest', 'courierId'],
          ['pickup_request', 'courierId'],
        ]) ?? ALL,
      hubCode:
        this.findString(event.data, [
          ['hubCode'],
          ['originHubCode'],
          ['destinationHubCode'],
          ['manifest', 'originHubCode'],
          ['manifest', 'destinationHubCode'],
          ['deliveryAttempt', 'locationCode'],
          ['delivery_attempt', 'locationCode'],
          ['scanEvent', 'locationCode'],
          ['scan_event', 'locationCode'],
          ['pickupRequest', 'hubCode'],
          ['pickup_request', 'hubCode'],
        ]) ??
        this.findString(event.location, [['location_code'], ['locationCode']]) ??
        ALL,
      zoneCode:
        this.findString(event.data, [
          ['zoneCode'],
          ['zone_id'],
          ['zoneId'],
          ['shipment', 'zoneCode'],
          ['shipment', 'receiverRegion'],
          ['pickupRequest', 'zoneCode'],
          ['pickup_request', 'zoneCode'],
          ['ndrCase', 'zoneCode'],
          ['ndr_case', 'zoneCode'],
        ]) ?? ALL,
    };
  }

  private findString(source: unknown, paths: string[][]): string | null {
    for (const path of paths) {
      const value = this.getNestedValue(source, path);

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    return null;
  }

  private getNestedValue(source: unknown, path: string[]): unknown {
    let cursor: unknown = source;

    for (const segment of path) {
      if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
        return null;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return cursor;
  }

  private async incrementDaily(
    metricDate: Date,
    field: MetricField,
    dimensions: NormalizedDimensions,
  ): Promise<void> {
    const where = {
      daily_dimension_unique: {
        metricDate,
        courierCode: dimensions.courierCode,
        hubCode: dimensions.hubCode,
        zoneCode: dimensions.zoneCode,
      },
    };

    await this.prisma.kpiDaily.upsert({
      where,
      update: this.buildIncrementData(field),
      create: this.buildCreateDailyData(metricDate, dimensions, field),
    });
  }

  private async incrementMonthly(
    monthKey: string,
    field: MetricField,
    dimensions: NormalizedDimensions,
  ): Promise<void> {
    const where = {
      monthly_dimension_unique: {
        monthKey,
        courierCode: dimensions.courierCode,
        hubCode: dimensions.hubCode,
        zoneCode: dimensions.zoneCode,
      },
    };

    await this.prisma.kpiMonthly.upsert({
      where,
      update: this.buildIncrementData(field),
      create: this.buildCreateMonthlyData(monthKey, dimensions, field),
    });
  }

  private buildIncrementData(field: MetricField): Record<string, { increment: number }> {
    return {
      [field]: {
        increment: 1,
      },
    };
  }

  private buildCreateDailyData(
    metricDate: Date,
    dimensions: NormalizedDimensions,
    field: MetricField,
  ): Prisma.KpiDailyCreateInput {
    return {
      metricDate,
      courierCode: dimensions.courierCode,
      hubCode: dimensions.hubCode,
      zoneCode: dimensions.zoneCode,
      shipmentsCreated: field === 'shipmentsCreated' ? 1 : 0,
      pickupsCompleted: field === 'pickupsCompleted' ? 1 : 0,
      deliveriesDelivered: field === 'deliveriesDelivered' ? 1 : 0,
      deliveriesFailed: field === 'deliveriesFailed' ? 1 : 0,
      ndrCreated: field === 'ndrCreated' ? 1 : 0,
      scansInbound: field === 'scansInbound' ? 1 : 0,
      scansOutbound: field === 'scansOutbound' ? 1 : 0,
    };
  }

  private buildCreateMonthlyData(
    monthKey: string,
    dimensions: NormalizedDimensions,
    field: MetricField,
  ): Prisma.KpiMonthlyCreateInput {
    return {
      monthKey,
      courierCode: dimensions.courierCode,
      hubCode: dimensions.hubCode,
      zoneCode: dimensions.zoneCode,
      shipmentsCreated: field === 'shipmentsCreated' ? 1 : 0,
      pickupsCompleted: field === 'pickupsCompleted' ? 1 : 0,
      deliveriesDelivered: field === 'deliveriesDelivered' ? 1 : 0,
      deliveriesFailed: field === 'deliveriesFailed' ? 1 : 0,
      ndrCreated: field === 'ndrCreated' ? 1 : 0,
      scansInbound: field === 'scansInbound' ? 1 : 0,
      scansOutbound: field === 'scansOutbound' ? 1 : 0,
    };
  }
}
