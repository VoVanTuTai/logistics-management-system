import { Inject, Injectable } from '@nestjs/common';

import type {
  OutboxEvent,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';
import type { Manifest } from '../../domain/entities/manifest.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { ManifestEventsProducer } from '../producers/manifest-events.producer';

@Injectable()
export class ManifestOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly manifestEventsProducer: ManifestEventsProducer,
  ) {}

  async enqueueManifestCreated(manifest: Manifest): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestCreatedEvents(manifest);
    return this.enqueueMany(events);
  }

  enqueueManifestUpdated(
    manifest: Manifest,
    data: Record<string, unknown>,
    shipmentCodes?: string[],
  ): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestUpdatedEvents(
      manifest,
      data,
      shipmentCodes,
    );
    return this.enqueueMany(events);
  }

  async enqueueManifestSealed(manifest: Manifest): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestSealedEvents(manifest);
    return this.enqueueMany(events);
  }

  async enqueueManifestReceived(manifest: Manifest): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestReceivedEvents(manifest);
    return this.enqueueMany(events);
  }

  private enqueueMany(events: QueueOutboxEventInput[]): Promise<OutboxEvent[]> {
    return Promise.all(events.map((event) => this.outboxEventRepository.create(event)));
  }
}
