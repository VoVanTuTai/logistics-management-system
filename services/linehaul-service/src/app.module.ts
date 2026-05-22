import { Module } from '@nestjs/common';

import { LinehaulController } from './api/controllers/linehaul.controller';
import { LinehaulService } from './application/services/linehaul.service';
import { LinehaulRepository } from './domain/repositories/linehaul.repository';
import { HealthModule } from './health/health.module';
import { LinehaulPrismaRepository } from './infrastructure/prisma/linehaul-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { LinehaulEventsPublisher } from './messaging/linehaul-events.publisher';

@Module({
  imports: [HealthModule],
  controllers: [LinehaulController],
  providers: [
    PrismaService,
    LinehaulService,
    LinehaulEventsPublisher,
    {
      provide: LinehaulRepository,
      useClass: LinehaulPrismaRepository,
    },
  ],
})
export class AppModule {}
