import { Module } from '@nestjs/common';

import { DeliveryController } from './api/controllers/delivery.controller';
import { NdrController } from './api/controllers/ndr.controller';
import { ReturnsController } from './api/controllers/returns.controller';
import { DeliveryEventHandlersService } from './application/services/delivery-event-handlers.service';
import { DeliveryService } from './application/services/delivery.service';
import { NdrService } from './application/services/ndr.service';
import { ReturnsService } from './application/services/returns.service';
import { DeliveryAttemptRepository } from './domain/repositories/delivery-attempt.repository';
import { IdempotencyRecordRepository } from './domain/repositories/idempotency-record.repository';
import { NdrCaseRepository } from './domain/repositories/ndr-case.repository';
import { OtpRecordRepository } from './domain/repositories/otp-record.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { PodRepository } from './domain/repositories/pod.repository';
import { ReturnCaseRepository } from './domain/repositories/return-case.repository';
import { HealthModule } from './health/health.module';
import { DeliveryAttemptPrismaRepository } from './infrastructure/prisma/delivery-attempt-prisma.repository';
import { IdempotencyRecordPrismaRepository } from './infrastructure/prisma/idempotency-record-prisma.repository';
import { NdrCasePrismaRepository } from './infrastructure/prisma/ndr-case-prisma.repository';
import { OtpRecordPrismaRepository } from './infrastructure/prisma/otp-record-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PodPrismaRepository } from './infrastructure/prisma/pod-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ReturnCasePrismaRepository } from './infrastructure/prisma/return-case-prisma.repository';
import { DeliveryEventsConsumer } from './messaging/consumers/delivery-events.consumer';
import { DeliveryEventsProducer } from './messaging/producers/delivery-events.producer';
import { DeliveryOutboxService } from './messaging/outbox/delivery-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [DeliveryController, NdrController, ReturnsController],
  providers: [
    PrismaService,
    DeliveryService,
    NdrService,
    ReturnsService,
    DeliveryEventHandlersService,
    DeliveryEventsProducer,
    DeliveryEventsConsumer,
    DeliveryOutboxService,
    {
      provide: DeliveryAttemptRepository,
      useClass: DeliveryAttemptPrismaRepository,
    },
    {
      provide: PodRepository,
      useClass: PodPrismaRepository,
    },
    {
      provide: OtpRecordRepository,
      useClass: OtpRecordPrismaRepository,
    },
    {
      provide: NdrCaseRepository,
      useClass: NdrCasePrismaRepository,
    },
    {
      provide: ReturnCaseRepository,
      useClass: ReturnCasePrismaRepository,
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
