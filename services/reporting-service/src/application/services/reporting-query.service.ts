import { Injectable } from '@nestjs/common';
import type { KpiDaily, KpiMonthly } from '@prisma/client';

import type { ShipmentStatusSummaryItem } from '../projections/reporting-event.types';
import { ReportingProjectionStore } from '../../infrastructure/prisma/reporting-projection.store';

export interface DailyReportQuery {
  date?: string;
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

export interface MonthlyReportQuery {
  month?: string;
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

export interface CourierReportQuery {
  date?: string;
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

export interface HubReportQuery {
  date?: string;
  hubCode?: string;
  courierCode?: string;
  zoneCode?: string;
}

export interface ShipmentStatusReportQuery {
  date?: string;
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
}

export interface OpsDashboardView {
  metricDate: string;
  totals: Record<string, number | string | null>;
  shipmentStatusSummary: ShipmentStatusSummaryItem[];
  courierAggregates: KpiDaily[];
  hubAggregates: KpiDaily[];
  zoneAggregates: KpiDaily[];
  sourceType: 'read_model';
}

@Injectable()
export class ReportingQueryService {
  constructor(
    private readonly reportingProjectionStore: ReportingProjectionStore,
  ) {}

  getDaily(query: DailyReportQuery): Promise<KpiDaily[]> {
    return this.reportingProjectionStore.getDaily(query.date, {
      courierCode: query.courierCode,
      hubCode: query.hubCode,
      zoneCode: query.zoneCode,
    });
  }

  getMonthly(query: MonthlyReportQuery): Promise<KpiMonthly[]> {
    return this.reportingProjectionStore.getMonthly(query.month, {
      courierCode: query.courierCode,
      hubCode: query.hubCode,
      zoneCode: query.zoneCode,
    });
  }

  async getOpsDashboard(query: DailyReportQuery): Promise<OpsDashboardView> {
    const metricDate = this.reportingProjectionStore.resolveDate(query.date);
    const filter = {
      courierCode: query.courierCode,
      hubCode: query.hubCode,
      zoneCode: query.zoneCode,
    };
    const hasScopedFilter = this.hasScopedDimensionFilter(query);
    const scopedTotals = await this.reportingProjectionStore.getDailyTotals(
      metricDate,
      filter,
    );
    const totals =
      scopedTotals ??
      (hasScopedFilter
        ? null
        : await this.reportingProjectionStore.getDailyGlobal(metricDate));
    const totalDelivered = totals?.deliveriesDelivered ?? 0;
    const totalFailed = totals?.deliveriesFailed ?? 0;
    const totalDeliveryAttempts = totalDelivered + totalFailed;
    const successRate =
      totalDeliveryAttempts > 0
        ? Number(((totalDelivered / totalDeliveryAttempts) * 100).toFixed(2))
        : 0;
    const failureRate =
      totalDeliveryAttempts > 0
        ? Number(((totalFailed / totalDeliveryAttempts) * 100).toFixed(2))
        : 0;
    const shipmentStatusSummary =
      await this.reportingProjectionStore.getShipmentStatusSummary(query.date, filter);
    const totalsPayload = {
      shipmentsCreated: totals?.shipmentsCreated ?? 0,
      pickupsCompleted: totals?.pickupsCompleted ?? 0,
      deliveriesDelivered: totalDelivered,
      deliveriesFailed: totalFailed,
      ndrCreated: totals?.ndrCreated ?? 0,
      scansInbound: totals?.scansInbound ?? 0,
      scansOutbound: totals?.scansOutbound ?? 0,
      successRate,
      failureRate,
      deliveryAttempts: totalDeliveryAttempts,
      ...shipmentStatusSummary.reduce<Record<string, number>>((acc, item) => {
        acc[`status_${item.status}`] = item.count;
        return acc;
      }, {}),
    };

    return {
      metricDate: metricDate.toISOString().slice(0, 10),
      totals: totalsPayload,
      shipmentStatusSummary,
      courierAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'courier',
        {
          hubCode: query.hubCode,
          zoneCode: query.zoneCode,
        },
      ),
      hubAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'hub',
        {
          courierCode: query.courierCode,
          hubCode: query.hubCode,
          zoneCode: query.zoneCode,
        },
      ),
      zoneAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'zone',
        {
          courierCode: query.courierCode,
          hubCode: query.hubCode,
        },
      ),
      sourceType: 'read_model',
    };
  }

  private hasScopedDimensionFilter(
    query: Pick<DailyReportQuery, 'courierCode' | 'hubCode' | 'zoneCode'>,
  ): boolean {
    return [query.courierCode, query.hubCode, query.zoneCode].some(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
  }

  getCourier(query: CourierReportQuery): Promise<KpiDaily[]> {
    return this.reportingProjectionStore.getDailyByCourier(
      this.reportingProjectionStore.resolveDate(query.date),
      query.courierCode,
      {
        hubCode: query.hubCode,
        zoneCode: query.zoneCode,
      },
    );
  }

  getHub(query: HubReportQuery): Promise<KpiDaily[]> {
    return this.reportingProjectionStore.getDailyByHub(
      this.reportingProjectionStore.resolveDate(query.date),
      query.hubCode,
      {
        courierCode: query.courierCode,
        zoneCode: query.zoneCode,
      },
    );
  }

  getShipmentStatusSummary(
    query: ShipmentStatusReportQuery,
  ): Promise<ShipmentStatusSummaryItem[]> {
    return this.reportingProjectionStore.getShipmentStatusSummary(query.date, {
      courierCode: query.courierCode,
      hubCode: query.hubCode,
      zoneCode: query.zoneCode,
    });
  }
}
