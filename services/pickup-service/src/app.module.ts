import { Module } from '@nestjs/common';

import { PickupsController } from './api/controllers/pickups.controller';
import { PickupEventHandlersService } from './application/services/pickup-event-handlers.service';
import { PickupsService } from './application/services/pickups.service';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { PickupRequestRepository } from './domain/repositories/pickup-request.repository';
import { HealthModule } from './health/health.module';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PickupRequestPrismaRepository } from './infrastructure/prisma/pickup-request-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PickupEventsConsumer } from './messaging/consumers/pickup-events.consumer';
import { PickupOutboxRelayService } from './messaging/outbox/pickup-outbox-relay.service';
import { PickupEventsProducer } from './messaging/producers/pickup-events.producer';
import { PickupOutboxService } from './messaging/outbox/pickup-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [PickupsController],
  providers: [
    PrismaService,
    PickupsService,
    PickupEventHandlersService,
    PickupEventsProducer,
    PickupEventsConsumer,
    PickupOutboxService,
    PickupOutboxRelayService,
    {
      provide: PickupRequestRepository,
      useClass: PickupRequestPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
