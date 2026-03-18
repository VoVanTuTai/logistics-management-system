import { Module } from '@nestjs/common';

import { InternalTrackingController } from './api/controllers/internal-tracking.controller';
import { PublicTrackingController } from './api/controllers/public-tracking.controller';
import { TrackingQueryProjection } from './application/projections/tracking-query.projection';
import { TrackingReadProjection } from './application/projections/tracking-read.projection';
import { HealthModule } from './health/health.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { TrackingProjectionStore } from './infrastructure/prisma/tracking-projection.store';
import { TrackingEventsConsumer } from './messaging/consumers/tracking-events.consumer';
import { TrackingRabbitmqConsumerService } from './messaging/consumers/tracking-rabbitmq-consumer.service';

@Module({
  imports: [HealthModule],
  controllers: [PublicTrackingController, InternalTrackingController],
  providers: [
    PrismaService,
    TrackingProjectionStore,
    TrackingReadProjection,
    TrackingQueryProjection,
    TrackingEventsConsumer,
    TrackingRabbitmqConsumerService,
  ],
})
export class AppModule {}
