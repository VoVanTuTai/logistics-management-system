import { Module } from '@nestjs/common';

import { AuthController } from './api/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { AuthSessionRepository } from './domain/repositories/auth-session.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { UserAccountRepository } from './domain/repositories/user-account.repository';
import { HealthModule } from './health/health.module';
import { AuthSessionPrismaRepository } from './infrastructure/prisma/auth-session-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { UserAccountPrismaRepository } from './infrastructure/prisma/user-account-prisma.repository';
import { HashService } from './infrastructure/security/hash.service';
import { OpaqueTokenService } from './infrastructure/security/opaque-token.service';
import { AuthEventsProducer } from './messaging/producers/auth-events.producer';
import { AuthOutboxService } from './messaging/outbox/auth-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
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
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
