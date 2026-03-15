import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateManifestInput,
  Manifest,
  ReceiveManifestInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';
import { ManifestRepository } from '../../domain/repositories/manifest.repository';
import { ManifestOutboxService } from '../../messaging/outbox/manifest-outbox.service';

@Injectable()
export class ManifestsService {
  constructor(
    @Inject(ManifestRepository)
    private readonly manifestRepository: ManifestRepository,
    private readonly manifestOutboxService: ManifestOutboxService,
  ) {}

  list(): Promise<Manifest[]> {
    return this.manifestRepository.list();
  }

  async getById(id: string): Promise<Manifest> {
    const manifest = await this.manifestRepository.findById(id);

    if (!manifest) {
      throw new NotFoundException(`Manifest "${id}" was not found.`);
    }

    return manifest;
  }

  async create(input: CreateManifestInput): Promise<Manifest> {
    const manifest = await this.manifestRepository.create(input);

    await this.manifestOutboxService.enqueueManifestCreated(manifest);

    return manifest;
  }

  async update(id: string, input: UpdateManifestInput): Promise<Manifest> {
    await this.getById(id);

    const manifest = await this.manifestRepository.update(id, input);

    await this.manifestOutboxService.enqueueManifestUpdated(manifest, {
      source: 'api',
    });

    return manifest;
  }

  async seal(id: string, input: SealManifestInput): Promise<Manifest> {
    await this.getById(id);

    const manifest = await this.manifestRepository.seal(id, input);

    await this.manifestOutboxService.enqueueManifestSealed(manifest);

    return manifest;
  }

  async receive(id: string, input: ReceiveManifestInput): Promise<Manifest> {
    await this.getById(id);

    const manifest = await this.manifestRepository.receive(id, input);

    await this.manifestOutboxService.enqueueManifestReceived(manifest);

    return manifest;
  }

  async handleScanOutbound(payload: {
    shipment_code?: string | null;
    data?: Record<string, unknown>;
  }): Promise<Manifest | null> {
    if (!payload.shipment_code) {
      return null;
    }

    const manifest = await this.manifestRepository.findByShipmentCode(
      payload.shipment_code,
    );

    if (!manifest) {
      return null;
    }

    // TODO: add reconciliation/update behavior for scan.outbound when rules are defined.
    return manifest;
  }
}
