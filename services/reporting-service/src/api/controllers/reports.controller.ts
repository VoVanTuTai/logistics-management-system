import { Controller, Get, Query } from '@nestjs/common';
import type { KpiDaily, KpiMonthly } from '@prisma/client';

import {
  type CourierReportQuery,
  type DailyReportQuery,
  type HubReportQuery,
  type MonthlyReportQuery,
  type OpsDashboardView,
  type ShipmentStatusReportQuery,
  ReportingQueryService,
} from '../../application/services/reporting-query.service';
import type { ShipmentStatusSummaryItem } from '../../application/projections/reporting-event.types';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportingQueryService: ReportingQueryService,
  ) {}

  @Get('daily')
  getDaily(@Query() query: DailyReportQuery): Promise<KpiDaily[]> {
    return this.reportingQueryService.getDaily(query);
  }

  @Get('monthly')
  getMonthly(@Query() query: MonthlyReportQuery): Promise<KpiMonthly[]> {
    return this.reportingQueryService.getMonthly(query);
  }

  @Get('ops-dashboard')
  getOpsDashboard(@Query() query: DailyReportQuery): Promise<OpsDashboardView> {
    return this.reportingQueryService.getOpsDashboard(query);
  }

  @Get('courier')
  getCourier(@Query() query: CourierReportQuery): Promise<KpiDaily[]> {
    return this.reportingQueryService.getCourier(query);
  }

  @Get('hub')
  getHub(@Query() query: HubReportQuery): Promise<KpiDaily[]> {
    return this.reportingQueryService.getHub(query);
  }

  @Get('shipment-status')
  getShipmentStatus(
    @Query() query: ShipmentStatusReportQuery,
  ): Promise<ShipmentStatusSummaryItem[]> {
    return this.reportingQueryService.getShipmentStatusSummary(query);
  }
}
