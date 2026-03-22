import { Module } from '@nestjs/common';

import { ChangeRequestController } from './api/controllers/change-request.controller';
import { ShipmentController } from './api/controllers/shipment.controller';
import { ChangeRequestsService } from './application/services/change-requests.service';
import { ShipmentEventHandlersService } from './application/services/shipment-event-handlers.service';
import { ShipmentsService } from './application/services/shipments.service';
import { ChangeRequestRepository } from './domain/repositories/change-request.repository';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { ShipmentRepository } from './domain/repositories/shipment.repository';
import { ShipmentStateMachine } from './domain/state-machine/shipment-state-machine';
import { HealthModule } from './health/health.module';
import { ChangeRequestPrismaRepository } from './infrastructure/prisma/change-request-prisma.repository';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ShipmentPrismaRepository } from './infrastructure/prisma/shipment-prisma.repository';
import { ShipmentEventsConsumer } from './messaging/consumers/shipment-events.consumer';
import { ShipmentRabbitmqConsumerService } from './messaging/consumers/shipment-rabbitmq-consumer.service';
import { ShipmentEventsProducer } from './messaging/producers/shipment-events.producer';
import { ShipmentOutboxRelayService } from './messaging/outbox/shipment-outbox-relay.service';
import { ShipmentOutboxService } from './messaging/outbox/shipment-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [ShipmentController, ChangeRequestController],
  providers: [
    PrismaService,
    ShipmentStateMachine,
    ShipmentsService,
    ChangeRequestsService,
    ShipmentEventHandlersService,
    ShipmentEventsProducer,
    ShipmentEventsConsumer,
    ShipmentRabbitmqConsumerService,
    ShipmentOutboxService,
    ShipmentOutboxRelayService,
    {
      provide: ShipmentRepository,
      useClass: ShipmentPrismaRepository,
    },
    {
      provide: ChangeRequestRepository,
      useClass: ChangeRequestPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
