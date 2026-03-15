import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Zone, ZoneWriteInput } from '../../domain/entities/zone.entity';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';

@Injectable()
export class ZonesService {
  constructor(
    @Inject(ZoneRepository)
    private readonly zoneRepository: ZoneRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(): Promise<Zone[]> {
    return this.zoneRepository.list();
  }

  async getById(id: string): Promise<Zone> {
    const zone = await this.zoneRepository.findById(id);

    if (!zone) {
      throw new NotFoundException(`Zone "${id}" was not found.`);
    }

    return zone;
  }

  async create(input: ZoneWriteInput): Promise<Zone> {
    // TODO: add hierarchy and code normalization rules.
    const zone = await this.zoneRepository.create(input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'zone',
      zone.id,
      {
        action: 'created',
        entity: 'zone',
        record: zone,
      },
    );

    return zone;
  }

  async update(id: string, input: Partial<ZoneWriteInput>): Promise<Zone> {
    await this.getById(id);

    const zone = await this.zoneRepository.update(id, input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'zone',
      zone.id,
      {
        action: 'updated',
        entity: 'zone',
        record: zone,
      },
    );

    return zone;
  }
}
