import { Module } from '@nestjs/common';

import { AdminAuditController } from './api/controllers/admin-audit.controller';
import { AuthController } from './api/controllers/auth.controller';
import { MobilePermissionsController } from './api/controllers/mobile-permissions.controller';
import { AdminAuditService } from './application/services/admin-audit.service';
import { AuthService } from './application/services/auth.service';
import { MobilePermissionsService } from './application/services/mobile-permissions.service';
import { AuthSessionRepository } from './domain/repositories/auth-session.repository';
import { MobilePermissionRepository } from './domain/repositories/mobile-permission.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { UserAccountRepository } from './domain/repositories/user-account.repository';
import { HealthModule } from './health/health.module';
import { AuthSessionPrismaRepository } from './infrastructure/prisma/auth-session-prisma.repository';
import { MobilePermissionPrismaRepository } from './infrastructure/prisma/mobile-permission-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { UserAccountPrismaRepository } from './infrastructure/prisma/user-account-prisma.repository';
import { HashService } from './infrastructure/security/hash.service';
import { OpaqueTokenService } from './infrastructure/security/opaque-token.service';
import { AuthEventsProducer } from './messaging/producers/auth-events.producer';
import { AuthOutboxService } from './messaging/outbox/auth-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [AuthController, AdminAuditController, MobilePermissionsController],
  providers: [
    PrismaService,
    AdminAuditService,
    AuthService,
    MobilePermissionsService,
    HashService,
    OpaqueTokenService,
    AuthEventsProducer,
    AuthOutboxService,
    {
      provide: UserAccountRepository,
      useClass: UserAccountPrismaRepository,
    },
    {
      provide: AuthSessionRepository,
      useClass: AuthSessionPrismaRepository,
    },
    {
      provide: MobilePermissionRepository,
      useClass: MobilePermissionPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
