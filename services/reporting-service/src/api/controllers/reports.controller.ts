import { Controller, Get, Query } from '@nestjs/common';
import type { KpiDaily, KpiMonthly } from '@prisma/client';

import {
  type CourierReportQuery,
  type DailyReportQuery,
  type MonthlyReportQuery,
  type OpsDashboardView,
  ReportingQueryService,
} from '../../application/services/reporting-query.service';

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
  getOpsDashboard(
    @Query('date') date?: string,
  ): Promise<OpsDashboardView> {
    return this.reportingQueryService.getOpsDashboard(date);
  }

  @Get('courier')
  getCourier(@Query() query: CourierReportQuery): Promise<KpiDaily[]> {
    return this.reportingQueryService.getCourier(query);
  }
}
