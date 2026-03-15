import { Injectable } from '@nestjs/common';
import type {
  AggregationJob,
  KpiDaily,
  KpiMonthly,
  Prisma,
} from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

import type {
  ProjectionResult,
  ReportingEventEnvelope,
} from '../../application/projections/reporting-event.types';
import { PrismaService } from './prisma.service';

const ALL = 'ALL';

const METRIC_FIELDS: Record<
  string,
  keyof Pick<
    KpiDaily,
    | 'shipmentsCreated'
    | 'pickupsCompleted'
    | 'deliveriesDelivered'
    | 'deliveriesFailed'
    | 'ndrCreated'
    | 'scansInbound'
    | 'scansOutbound'
  >
> = {
  'shipment.created': 'shipmentsCreated',
  'pickup.completed': 'pickupsCompleted',
  'delivery.delivered': 'deliveriesDelivered',
  'delivery.failed': 'deliveriesFailed',
  'ndr.created': 'ndrCreated',
  'scan.inbound': 'scansInbound',
  'scan.outbound': 'scansOutbound',
};

type DimensionKey = 'courier' | 'hub' | 'zone';

interface DimensionFilter {
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

@Injectable()
export class ReportingProjectionStore {
  constructor(private readonly prisma: PrismaService) {}

  async project(event: ReportingEventEnvelope): Promise<ProjectionResult> {
    const metricField = METRIC_FIELDS[event.event_type];

    if (!metricField) {
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
    const metricDate = this.resolveDate(event.occurred_at);
    const monthKey = occurredAt.toISOString().slice(0, 7);
    const dimensions = this.extractDimensions(event);

    await this.incrementDaily(metricDate, metricField, {
      courierCode: ALL,
      hubCode: ALL,
      zoneCode: ALL,
    });
    await this.incrementMonthly(monthKey, metricField, {
      courierCode: ALL,
      hubCode: ALL,
      zoneCode: ALL,
    });

    if (dimensions.courierCode !== ALL) {
      await this.incrementDaily(metricDate, metricField, {
        courierCode: dimensions.courierCode,
        hubCode: ALL,
        zoneCode: ALL,
      });
      await this.incrementMonthly(monthKey, metricField, {
        courierCode: dimensions.courierCode,
        hubCode: ALL,
        zoneCode: ALL,
      });
    }

    if (dimensions.hubCode !== ALL) {
      await this.incrementDaily(metricDate, metricField, {
        courierCode: ALL,
        hubCode: dimensions.hubCode,
        zoneCode: ALL,
      });
      await this.incrementMonthly(monthKey, metricField, {
        courierCode: ALL,
        hubCode: dimensions.hubCode,
        zoneCode: ALL,
      });
    }

    if (dimensions.zoneCode !== ALL) {
      await this.incrementDaily(metricDate, metricField, {
        courierCode: ALL,
        hubCode: ALL,
        zoneCode: dimensions.zoneCode,
      });
      await this.incrementMonthly(monthKey, metricField, {
        courierCode: ALL,
        hubCode: ALL,
        zoneCode: dimensions.zoneCode,
      });
    }

    return {
      projected: true,
      eventId: event.event_id,
      eventType: event.event_type,
    };
  }

  resolveDate(date?: string): Date {
    const baseDate = date ? new Date(date) : new Date();

    return new Date(Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
    ));
  }

  async getDaily(
    date?: string,
    filter?: DimensionFilter,
  ): Promise<KpiDaily[]> {
    return this.prisma.kpiDaily.findMany({
      where: {
        metricDate: this.resolveDate(date),
        courierCode: filter?.courierCode ?? undefined,
        hubCode: filter?.hubCode ?? undefined,
        zoneCode: filter?.zoneCode ?? undefined,
      },
      orderBy: [
        { courierCode: 'asc' },
        { hubCode: 'asc' },
        { zoneCode: 'asc' },
      ],
    });
  }

  async getMonthly(
    month?: string,
    filter?: DimensionFilter,
  ): Promise<KpiMonthly[]> {
    const monthKey = month ?? new Date().toISOString().slice(0, 7);

    return this.prisma.kpiMonthly.findMany({
      where: {
        monthKey,
        courierCode: filter?.courierCode ?? undefined,
        hubCode: filter?.hubCode ?? undefined,
        zoneCode: filter?.zoneCode ?? undefined,
      },
      orderBy: [
        { courierCode: 'asc' },
        { hubCode: 'asc' },
        { zoneCode: 'asc' },
      ],
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

  getDailyByCourier(
    metricDate: Date,
    courierCode?: string,
  ): Promise<KpiDaily[]> {
    return this.prisma.kpiDaily.findMany({
      where: {
        metricDate,
        courierCode: courierCode ?? { not: ALL },
        hubCode: ALL,
        zoneCode: ALL,
      },
      orderBy: {
        courierCode: 'asc',
      },
    });
  }

  getDailyByDimension(
    metricDate: Date,
    dimension: DimensionKey,
  ): Promise<KpiDaily[]> {
    if (dimension === 'courier') {
      return this.getDailyByCourier(metricDate);
    }

    if (dimension === 'hub') {
      return this.prisma.kpiDaily.findMany({
        where: {
          metricDate,
          courierCode: ALL,
          hubCode: { not: ALL },
          zoneCode: ALL,
        },
        orderBy: {
          hubCode: 'asc',
        },
      });
    }

    return this.prisma.kpiDaily.findMany({
      where: {
        metricDate,
        courierCode: ALL,
        hubCode: ALL,
        zoneCode: { not: ALL },
      },
      orderBy: {
        zoneCode: 'asc',
      },
    });
  }

  private resolveOccurredAt(value: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
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

  private extractDimensions(event: ReportingEventEnvelope): {
    courierCode: string;
    hubCode: string;
    zoneCode: string;
  } {
    return {
      courierCode:
        this.findString(event.data, [
          ['courierCode'],
          ['courierId'],
          ['task', 'courierId'],
          ['task', 'courierCode'],
          ['deliveryAttempt', 'courierId'],
          ['pickupRequest', 'courierId'],
        ]) ?? ALL,
      hubCode:
        this.findString(event.data, [
          ['hubCode'],
          ['originHubCode'],
          ['destinationHubCode'],
          ['manifest', 'originHubCode'],
          ['manifest', 'destinationHubCode'],
          ['deliveryAttempt', 'locationCode'],
          ['scanEvent', 'locationCode'],
        ]) ??
        this.findString(event.location, [['location_code'], ['locationCode']]) ??
        ALL,
      zoneCode:
        this.findString(event.data, [
          ['zoneCode'],
          ['zone_id'],
          ['zoneId'],
          ['shipment', 'zoneCode'],
          ['pickupRequest', 'zoneCode'],
          ['ndrCase', 'zoneCode'],
        ]) ?? ALL,
    };
  }

  private findString(
    source: unknown,
    paths: string[][],
  ): string | null {
    for (const path of paths) {
      const value = this.getNestedValue(source, path);

      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return null;
  }

  private getNestedValue(
    source: unknown,
    path: string[],
  ): unknown {
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
    field: keyof Pick<
      KpiDaily,
      | 'shipmentsCreated'
      | 'pickupsCompleted'
      | 'deliveriesDelivered'
      | 'deliveriesFailed'
      | 'ndrCreated'
      | 'scansInbound'
      | 'scansOutbound'
    >,
    dimensions: Required<DimensionFilter>,
  ): Promise<void> {
    const where = {
      daily_dimension_unique: {
        metricDate,
        courierCode: dimensions.courierCode,
        hubCode: dimensions.hubCode,
        zoneCode: dimensions.zoneCode,
      },
    };
    const incrementData = this.buildIncrementData<KpiDaily>(field);
    const createData = this.buildCreateData<KpiDaily>(
      metricDate,
      dimensions,
      field,
    );

    await this.prisma.kpiDaily.upsert({
      where,
      update: incrementData,
      create: createData,
    });
  }

  private async incrementMonthly(
    monthKey: string,
    field: keyof Pick<
      KpiMonthly,
      | 'shipmentsCreated'
      | 'pickupsCompleted'
      | 'deliveriesDelivered'
      | 'deliveriesFailed'
      | 'ndrCreated'
      | 'scansInbound'
      | 'scansOutbound'
    >,
    dimensions: Required<DimensionFilter>,
  ): Promise<void> {
    const where = {
      monthly_dimension_unique: {
        monthKey,
        courierCode: dimensions.courierCode,
        hubCode: dimensions.hubCode,
        zoneCode: dimensions.zoneCode,
      },
    };
    const incrementData = this.buildIncrementData<KpiMonthly>(field);
    const createData = this.buildCreateMonthlyData(
      monthKey,
      dimensions,
      field,
    );

    await this.prisma.kpiMonthly.upsert({
      where,
      update: incrementData,
      create: createData,
    });
  }

  private buildIncrementData<T extends KpiDaily | KpiMonthly>(
    field: keyof Pick<
      T,
      | 'shipmentsCreated'
      | 'pickupsCompleted'
      | 'deliveriesDelivered'
      | 'deliveriesFailed'
      | 'ndrCreated'
      | 'scansInbound'
      | 'scansOutbound'
    >,
  ): Record<string, { increment: number }> {
    return {
      [field]: {
        increment: 1,
      },
    };
  }

  private buildCreateData<T extends KpiDaily>(
    metricDate: Date,
    dimensions: Required<DimensionFilter>,
    field: keyof Pick<
      T,
      | 'shipmentsCreated'
      | 'pickupsCompleted'
      | 'deliveriesDelivered'
      | 'deliveriesFailed'
      | 'ndrCreated'
      | 'scansInbound'
      | 'scansOutbound'
    >,
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
    dimensions: Required<DimensionFilter>,
    field: keyof Pick<
      KpiMonthly,
      | 'shipmentsCreated'
      | 'pickupsCompleted'
      | 'deliveriesDelivered'
      | 'deliveriesFailed'
      | 'ndrCreated'
      | 'scansInbound'
      | 'scansOutbound'
    >,
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
