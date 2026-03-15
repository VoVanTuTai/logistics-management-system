import { Injectable } from '@nestjs/common';
import type { KpiDaily, KpiMonthly } from '@prisma/client';

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
}

export interface OpsDashboardView {
  metricDate: string;
  totals: KpiDaily | null;
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

  async getOpsDashboard(date?: string): Promise<OpsDashboardView> {
    const metricDate = this.reportingProjectionStore.resolveDate(date);

    return {
      metricDate: metricDate.toISOString().slice(0, 10),
      totals: await this.reportingProjectionStore.getDailyGlobal(metricDate),
      courierAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'courier',
      ),
      hubAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'hub',
      ),
      zoneAggregates: await this.reportingProjectionStore.getDailyByDimension(
        metricDate,
        'zone',
      ),
      sourceType: 'read_model',
    };
  }

  getCourier(query: CourierReportQuery): Promise<KpiDaily[]> {
    return this.reportingProjectionStore.getDailyByCourier(
      this.reportingProjectionStore.resolveDate(query.date),
      query.courierCode,
    );
  }
}
