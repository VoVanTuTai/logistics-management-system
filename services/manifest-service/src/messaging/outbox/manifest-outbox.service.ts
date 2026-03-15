import { Inject, Injectable } from '@nestjs/common';

import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
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

  enqueueManifestCreated(manifest: Manifest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.manifestEventsProducer.buildManifestCreatedEvent(manifest),
    );
  }

  enqueueManifestUpdated(
    manifest: Manifest,
    _data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.manifestEventsProducer.buildManifestUpdatedEvent(manifest),
    );
  }

  enqueueManifestSealed(manifest: Manifest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.manifestEventsProducer.buildManifestSealedEvent(manifest),
    );
  }

  enqueueManifestReceived(manifest: Manifest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.manifestEventsProducer.buildManifestReceivedEvent(manifest),
    );
  }
}
