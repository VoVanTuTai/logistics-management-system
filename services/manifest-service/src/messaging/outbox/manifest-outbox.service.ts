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

  async enqueueManifestSealed(
    manifest: Manifest,
    actorInput?: {
      sealedBy?: string | null;
      sealedByName?: string | null;
      processingHubCode?: string | null;
      note?: string | null;
    },
  ): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestSealedEvents(manifest, actorInput);
    return this.enqueueMany(events);
  }

  async enqueueManifestReceived(manifest: Manifest): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestReceivedEvents(manifest);
    return this.enqueueMany(events);
  }

  async enqueueManifestUnsealed(
    manifest: Manifest,
    shipmentCodes: string[],
    actorInput: {
      unsealedBy?: string | null;
      unsealedByName?: string | null;
      processingHubCode?: string | null;
      note?: string | null;
    },
  ): Promise<OutboxEvent[]> {
    const events = this.manifestEventsProducer.buildManifestUnsealedEvents(
      manifest,
      shipmentCodes,
      actorInput,
    );
    return this.enqueueMany(events);
  }

  private enqueueMany(events: QueueOutboxEventInput[]): Promise<OutboxEvent[]> {
    return Promise.all(events.map((event) => this.outboxEventRepository.create(event)));
  }
}
