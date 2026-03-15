import { Module } from '@nestjs/common';

import { ReportsController } from './api/controllers/reports.controller';
import { ReportingProjectionService } from './application/projections/reporting-projection.service';
import { ReportingQueryService } from './application/services/reporting-query.service';
import { HealthModule } from './health/health.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ReportingProjectionStore } from './infrastructure/prisma/reporting-projection.store';
import { ReportingEventsConsumer } from './messaging/consumers/reporting-events.consumer';

@Module({
  imports: [HealthModule],
  controllers: [ReportsController],
  providers: [
    PrismaService,
    ReportingProjectionStore,
    ReportingProjectionService,
    ReportingQueryService,
    ReportingEventsConsumer,
  ],
})
export class AppModule {}
