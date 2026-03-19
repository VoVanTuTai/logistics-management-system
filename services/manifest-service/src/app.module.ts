import { Module } from '@nestjs/common';

import { ManifestsController } from './api/controllers/manifests.controller';
import { ManifestEventHandlersService } from './application/services/manifest-event-handlers.service';
import { ManifestsService } from './application/services/manifests.service';
import { ManifestRepository } from './domain/repositories/manifest.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { HealthModule } from './health/health.module';
import { ManifestPrismaRepository } from './infrastructure/prisma/manifest-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ManifestEventsConsumer } from './messaging/consumers/manifest-events.consumer';
import { ManifestEventsProducer } from './messaging/producers/manifest-events.producer';
import { ManifestOutboxRelayService } from './messaging/outbox/manifest-outbox-relay.service';
import { ManifestOutboxService } from './messaging/outbox/manifest-outbox.service';
import { ManifestStateMachine } from './domain/state-machine/manifest-state-machine';

@Module({
  imports: [HealthModule],
  controllers: [ManifestsController],
  providers: [
    PrismaService,
    ManifestsService,
    ManifestStateMachine,
    ManifestEventHandlersService,
    ManifestEventsProducer,
    ManifestEventsConsumer,
    ManifestOutboxService,
    ManifestOutboxRelayService,
    {
      provide: ManifestRepository,
      useClass: ManifestPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
