import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Config, ConfigWriteInput } from '../../domain/entities/config.entity';
import { ConfigRepository } from '../../domain/repositories/config.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';

@Injectable()
export class ConfigsService {
  constructor(
    @Inject(ConfigRepository)
    private readonly configRepository: ConfigRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(): Promise<Config[]> {
    return this.configRepository.list();
  }

  async getById(id: string): Promise<Config> {
    const config = await this.configRepository.findById(id);

    if (!config) {
      throw new NotFoundException(`Config "${id}" was not found.`);
    }

    return config;
  }

  async create(input: ConfigWriteInput): Promise<Config> {
    // TODO: add config key namespace and schema validation.
    const config = await this.configRepository.create(input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'config',
      config.id,
      {
        action: 'created',
        entity: 'config',
        record: config,
      },
    );

    return config;
  }

  async update(id: string, input: Partial<ConfigWriteInput>): Promise<Config> {
    await this.getById(id);

    const config = await this.configRepository.update(id, input);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'config',
      config.id,
      {
        action: 'updated',
        entity: 'config',
        record: config,
      },
    );

    return config;
  }
}
