import { Module } from '@nestjs/common';

import { ManifestsController } from './api/controllers/manifests.controller';
import { OpsAuditController } from './api/controllers/ops-audit.controller';
import { ManifestEventHandlersService } from './application/services/manifest-event-handlers.service';
import { ManifestRetentionCleanupService } from './application/services/manifest-retention-cleanup.service';
import { ManifestsService } from './application/services/manifests.service';
import { OpsAuditService } from './application/services/ops-audit.service';
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
  controllers: [ManifestsController, OpsAuditController],
  providers: [
    PrismaService,
    ManifestsService,
    ManifestRetentionCleanupService,
    OpsAuditService,
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
