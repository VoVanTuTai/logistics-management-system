import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Hub, HubWriteInput } from '../../domain/entities/hub.entity';
import { HubRepository } from '../../domain/repositories/hub.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';

@Injectable()
export class HubsService {
  constructor(
    @Inject(HubRepository)
    private readonly hubRepository: HubRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(): Promise<Hub[]> {
    return this.hubRepository.list();
  }

  async getById(id: string): Promise<Hub> {
    const hub = await this.hubRepository.findById(id);

    if (!hub) {
      throw new NotFoundException(`Hub "${id}" was not found.`);
    }

    return hub;
  }

  async create(input: HubWriteInput): Promise<Hub> {
    // TODO: add uniqueness, zone ownership, and payload validation rules.
    const hub = await this.hubRepository.create(input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'hub',
      hub.id,
      {
        action: 'created',
        entity: 'hub',
        record: hub,
      },
    );

    return hub;
  }

  async update(id: string, input: Partial<HubWriteInput>): Promise<Hub> {
    await this.getById(id);

    const hub = await this.hubRepository.update(id, input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'hub',
      hub.id,
      {
        action: 'updated',
        entity: 'hub',
        record: hub,
      },
    );

    return hub;
  }
}
