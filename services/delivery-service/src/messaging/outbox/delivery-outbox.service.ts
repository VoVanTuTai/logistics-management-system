import { Inject, Injectable } from '@nestjs/common';

import type { DeliveryAttempt } from '../../domain/entities/delivery-attempt.entity';
import type { NdrCase } from '../../domain/entities/ndr-case.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import type { ReturnCase } from '../../domain/entities/return-case.entity';
import { DeliveryEventsProducer } from '../producers/delivery-events.producer';

@Injectable()
export class DeliveryOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly deliveryEventsProducer: DeliveryEventsProducer,
  ) {}

  async enqueueDeliveryAttempted(deliveryAttempt: DeliveryAttempt): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildDeliveryAttemptedEvent(deliveryAttempt),
    );
  }

  async enqueueDeliveryDelivered(deliveryAttempt: DeliveryAttempt): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildDeliveryDeliveredEvent(deliveryAttempt),
    );
  }

  async enqueueDeliveryFailed(deliveryAttempt: DeliveryAttempt): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildDeliveryFailedEvent(deliveryAttempt),
    );
  }

  async enqueueNdrCreated(ndrCase: NdrCase): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildNdrCreatedEvent(ndrCase),
    );
  }

  async enqueueReturnStarted(returnCase: ReturnCase): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildReturnStartedEvent(returnCase),
    );
  }

  async enqueueReturnCompleted(returnCase: ReturnCase): Promise<void> {
    await this.outboxEventRepository.create(
      this.deliveryEventsProducer.buildReturnCompletedEvent(returnCase),
    );
  }
}
