import { Inject, Injectable } from '@nestjs/common';

import type { CurrentLocation } from '../../domain/entities/current-location.entity';
import type { ScanEvent } from '../../domain/entities/scan-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { ScanEventsProducer } from '../producers/scan-events.producer';

@Injectable()
export class ScanOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly scanEventsProducer: ScanEventsProducer,
  ) {}

  async enqueuePickupConfirmed(scanEvent: ScanEvent): Promise<void> {
    await this.outboxEventRepository.create(
      this.scanEventsProducer.buildPickupConfirmedEvent(scanEvent),
    );
  }

  async enqueueInbound(scanEvent: ScanEvent): Promise<void> {
    await this.outboxEventRepository.create(
      this.scanEventsProducer.buildInboundEvent(scanEvent),
    );
  }

  async enqueueOutbound(scanEvent: ScanEvent): Promise<void> {
    await this.outboxEventRepository.create(
      this.scanEventsProducer.buildOutboundEvent(scanEvent),
    );
  }

  async enqueueLocationUpdated(
    currentLocation: CurrentLocation,
    idempotencyKey: string,
  ): Promise<void> {
    await this.outboxEventRepository.create(
      this.scanEventsProducer.buildLocationUpdatedEvent({
        currentLocation,
        idempotencyKey,
      }),
    );
  }
}
