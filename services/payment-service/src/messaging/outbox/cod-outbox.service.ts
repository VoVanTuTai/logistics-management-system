import { Inject, Injectable } from '@nestjs/common';

import type { CodRecord } from '../../domain/entities/cod-record.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { CodEventsProducer } from '../producers/cod-events.producer';

@Injectable()
export class CodOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly codEventsProducer: CodEventsProducer,
  ) {}

  async enqueueCodCollected(codRecord: CodRecord): Promise<void> {
    await this.outboxEventRepository.create(
      this.codEventsProducer.buildCodCollectedEvent(codRecord),
    );
  }

  async enqueueCodCollectionFailed(codRecord: CodRecord): Promise<void> {
    await this.outboxEventRepository.create(
      this.codEventsProducer.buildCodCollectionFailedEvent(codRecord),
    );
  }

  async enqueueCodRemitted(codRecord: CodRecord): Promise<void> {
    await this.outboxEventRepository.create(
      this.codEventsProducer.buildCodRemittedEvent(codRecord),
    );
  }
}
