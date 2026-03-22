import { Inject, Injectable } from '@nestjs/common';

import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import type { PickupRequest } from '../../domain/entities/pickup-request.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { PickupEventsProducer } from '../producers/pickup-events.producer';

@Injectable()
export class PickupOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly pickupEventsProducer: PickupEventsProducer,
  ) {}

  enqueuePickupRequested(pickupRequest: PickupRequest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.pickupEventsProducer.buildPickupRequestedEvent(pickupRequest),
    );
  }

  enqueuePickupApproved(
    pickupRequest: PickupRequest,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.pickupEventsProducer.buildPickupApprovedEvent(pickupRequest, data),
    );
  }

  enqueuePickupUpdated(
    pickupRequest: PickupRequest,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.pickupEventsProducer.buildPickupUpdatedEvent(pickupRequest, data),
    );
  }

  enqueuePickupCancelled(
    pickupRequest: PickupRequest,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.pickupEventsProducer.buildPickupCancelledEvent(pickupRequest, data),
    );
  }

  enqueuePickupCompleted(pickupRequest: PickupRequest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.pickupEventsProducer.buildPickupCompletedEvent(pickupRequest),
    );
  }
}
