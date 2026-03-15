import { Module } from '@nestjs/common';

import { LocationController } from './api/controllers/location.controller';
import { ScanController } from './api/controllers/scan.controller';
import { LocationsService } from './application/services/locations.service';
import { ScanEventHandlersService } from './application/services/scan-event-handlers.service';
import { ScansService } from './application/services/scans.service';
import { CurrentLocationRepository } from './domain/repositories/current-location.repository';
import { IdempotencyRecordRepository } from './domain/repositories/idempotency-record.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { ScanEventRepository } from './domain/repositories/scan-event.repository';
import { HealthModule } from './health/health.module';
import { CurrentLocationPrismaRepository } from './infrastructure/prisma/current-location-prisma.repository';
import { IdempotencyRecordPrismaRepository } from './infrastructure/prisma/idempotency-record-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ScanEventPrismaRepository } from './infrastructure/prisma/scan-event-prisma.repository';
import { ScanEventsConsumer } from './messaging/consumers/scan-events.consumer';
import { ScanEventsProducer } from './messaging/producers/scan-events.producer';
import { ScanOutboxService } from './messaging/outbox/scan-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [ScanController, LocationController],
  providers: [
    PrismaService,
    ScansService,
    LocationsService,
    ScanEventHandlersService,
    ScanEventsProducer,
    ScanEventsConsumer,
    ScanOutboxService,
    {
      provide: ScanEventRepository,
      useClass: ScanEventPrismaRepository,
    },
    {
      provide: CurrentLocationRepository,
      useClass: CurrentLocationPrismaRepository,
    },
    {
      provide: IdempotencyRecordRepository,
      useClass: IdempotencyRecordPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
