import { Module } from '@nestjs/common';

import { ConfigsController } from './api/controllers/configs.controller';
import { HubsController } from './api/controllers/hubs.controller';
import { NdrReasonsController } from './api/controllers/ndr-reasons.controller';
import { ZonesController } from './api/controllers/zones.controller';
import { ConfigsService } from './application/services/configs.service';
import { HubsService } from './application/services/hubs.service';
import { NdrReasonsService } from './application/services/ndr-reasons.service';
import { ZonesService } from './application/services/zones.service';
import { ConfigRepository } from './domain/repositories/config.repository';
import { HubRepository } from './domain/repositories/hub.repository';
import { NdrReasonRepository } from './domain/repositories/ndr-reason.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { ZoneRepository } from './domain/repositories/zone.repository';
import { HealthModule } from './health/health.module';
import { ConfigPrismaRepository } from './infrastructure/prisma/config-prisma.repository';
import { HubPrismaRepository } from './infrastructure/prisma/hub-prisma.repository';
import { NdrReasonPrismaRepository } from './infrastructure/prisma/ndr-reason-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ZonePrismaRepository } from './infrastructure/prisma/zone-prisma.repository';
import { MasterdataOutboxRelayService } from './messaging/outbox/masterdata-outbox-relay.service';
import { MasterdataEventsProducer } from './messaging/producers/masterdata-events.producer';
import { MasterdataOutboxService } from './messaging/outbox/masterdata-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [
    HubsController,
    ZonesController,
    NdrReasonsController,
    ConfigsController,
  ],
  providers: [
    PrismaService,
    HubsService,
    ZonesService,
    NdrReasonsService,
    ConfigsService,
    MasterdataEventsProducer,
    MasterdataOutboxService,
    MasterdataOutboxRelayService,
    {
      provide: HubRepository,
      useClass: HubPrismaRepository,
    },
    {
      provide: ZoneRepository,
      useClass: ZonePrismaRepository,
    },
    {
      provide: NdrReasonRepository,
      useClass: NdrReasonPrismaRepository,
    },
    {
      provide: ConfigRepository,
      useClass: ConfigPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
