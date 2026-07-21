import { Module } from '@nestjs/common';

import { AdminAuditController } from './api/controllers/admin-audit.controller';
import { ConfigsController } from './api/controllers/configs.controller';
import { HubsController } from './api/controllers/hubs.controller';
import { MerchantProfilesController } from './api/controllers/merchant-profiles.controller';
import { NdrReasonsController } from './api/controllers/ndr-reasons.controller';
import { VietnamAdministrativeUnitsController } from './api/controllers/vietnam-administrative-units.controller';
import { ZonesController } from './api/controllers/zones.controller';
import { CourierAreaAssignmentsController } from './api/controllers/courier-area-assignments.controller';
import { AdminAuditService } from './application/services/admin-audit.service';
import { ConfigsService } from './application/services/configs.service';
import { HubsService } from './application/services/hubs.service';
import { MerchantProfilesService } from './application/services/merchant-profiles.service';
import { NdrReasonsService } from './application/services/ndr-reasons.service';
import { VietnamAdministrativeUnitsService } from './application/services/vietnam-administrative-units.service';
import { ZonesService } from './application/services/zones.service';
import { CourierAreaAssignmentsService } from './application/services/courier-area-assignments.service';
import { ConfigRepository } from './domain/repositories/config.repository';
import { HubRepository } from './domain/repositories/hub.repository';
import { MerchantProfileRepository } from './domain/repositories/merchant-profile.repository';
import { NdrReasonRepository } from './domain/repositories/ndr-reason.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { ZoneRepository } from './domain/repositories/zone.repository';
import { CourierAreaAssignmentRepository } from './domain/repositories/courier-area-assignment.repository';
import { HealthModule } from './health/health.module';
import { ConfigPrismaRepository } from './infrastructure/prisma/config-prisma.repository';
import { HubPrismaRepository } from './infrastructure/prisma/hub-prisma.repository';
import { MerchantProfilePrismaRepository } from './infrastructure/prisma/merchant-profile-prisma.repository';
import { NdrReasonPrismaRepository } from './infrastructure/prisma/ndr-reason-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ZonePrismaRepository } from './infrastructure/prisma/zone-prisma.repository';
import { CourierAreaAssignmentPrismaRepository } from './infrastructure/prisma/courier-area-assignment-prisma.repository';
import { MasterdataOutboxRelayService } from './messaging/outbox/masterdata-outbox-relay.service';
import { MasterdataEventsProducer } from './messaging/producers/masterdata-events.producer';
import { MasterdataOutboxService } from './messaging/outbox/masterdata-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [
    AdminAuditController,
    HubsController,
    ZonesController,
    NdrReasonsController,
    ConfigsController,
    MerchantProfilesController,
    VietnamAdministrativeUnitsController,
    CourierAreaAssignmentsController,
  ],
  providers: [
    PrismaService,
    AdminAuditService,
    HubsService,
    ZonesService,
    NdrReasonsService,
    ConfigsService,
    MerchantProfilesService,
    VietnamAdministrativeUnitsService,
    CourierAreaAssignmentsService,
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
      provide: MerchantProfileRepository,
      useClass: MerchantProfilePrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
    {
      provide: CourierAreaAssignmentRepository,
      useClass: CourierAreaAssignmentPrismaRepository,
    },
  ],
})
export class AppModule {}
