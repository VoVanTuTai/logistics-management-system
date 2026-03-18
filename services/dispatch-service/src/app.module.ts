import { Module } from '@nestjs/common';

import { TasksController } from './api/controllers/tasks.controller';
import { DispatchEventHandlersService } from './application/services/dispatch-event-handlers.service';
import { TasksService } from './application/services/tasks.service';
import { OutboxEventRepository } from './domain/repositories/outbox-event.repository';
import { TaskRepository } from './domain/repositories/task.repository';
import { HealthModule } from './health/health.module';
import { OutboxEventPrismaRepository } from './infrastructure/prisma/outbox-event-prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { TaskPrismaRepository } from './infrastructure/prisma/task-prisma.repository';
import { DispatchEventsConsumer } from './messaging/consumers/dispatch-events.consumer';
import { DispatchRabbitmqConsumerService } from './messaging/consumers/dispatch-rabbitmq-consumer.service';
import { DispatchOutboxRelayService } from './messaging/outbox/dispatch-outbox-relay.service';
import { DispatchEventsProducer } from './messaging/producers/dispatch-events.producer';
import { DispatchOutboxService } from './messaging/outbox/dispatch-outbox.service';

@Module({
  imports: [HealthModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    TasksService,
    DispatchEventHandlersService,
    DispatchEventsProducer,
    DispatchEventsConsumer,
    DispatchRabbitmqConsumerService,
    DispatchOutboxService,
    DispatchOutboxRelayService,
    {
      provide: TaskRepository,
      useClass: TaskPrismaRepository,
    },
    {
      provide: OutboxEventRepository,
      useClass: OutboxEventPrismaRepository,
    },
  ],
})
export class AppModule {}
