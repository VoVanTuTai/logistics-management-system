import { Module } from '@nestjs/common';

import { CodController } from './api/controllers/cod.controller';
import { CodService } from './application/services/cod.service';
import { CodRecordRepository } from './domain/repositories/cod-record.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { HealthModule } from './health/health.module';
import { CodRecordPrismaRepository } from './infrastructure/prisma/cod-record-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { CodEventsProducer } from './messaging/producers/cod-events.producer';
import { CodOutboxRelayService } from './messaging/outbox/cod-outbox-relay.service';
import { CodOutboxService } from './messaging/outbox/cod-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [CodController],
  providers: [
    PrismaService,
    CodService,
    CodEventsProducer,
    CodOutboxService,
    CodOutboxRelayService,
    {
      provide: CodRecordRepository,
      useClass: CodRecordPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
