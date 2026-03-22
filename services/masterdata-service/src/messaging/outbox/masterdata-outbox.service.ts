import { Inject, Injectable } from '@nestjs/common';

import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { MasterdataEventsProducer } from '../producers/masterdata-events.producer';

@Injectable()
export class MasterdataOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly masterdataEventsProducer: MasterdataEventsProducer,
  ) {}

  enqueueMasterdataUpdated(
    aggregateType: string,
    aggregateId: string | null,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    const event = this.masterdataEventsProducer.buildMasterdataUpdatedEvent(
      aggregateType,
      aggregateId,
      data,
    );

    return this.outboxEventRepository.create(event);
  }

  enqueueNdrReasonUpdated(
    aggregateId: string | null,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    const event = this.masterdataEventsProducer.buildNdrReasonUpdatedEvent(
      aggregateId,
      data,
    );

    return this.outboxEventRepository.create(event);
  }
}
