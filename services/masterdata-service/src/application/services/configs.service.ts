import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Config, ConfigWriteInput } from '../../domain/entities/config.entity';
import { ConfigRepository } from '../../domain/repositories/config.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  normalizeConfigKeyQuery,
  normalizeOptionalConfigKey,
  normalizeOptionalText,
  normalizeRequiredConfigKey,
  normalizeTextQuery,
} from './masterdata-normalizers';

interface ListConfigsQuery {
  key?: string;
  scope?: string;
  q?: string;
}

@Injectable()
export class ConfigsService {
  constructor(
    @Inject(ConfigRepository)
    private readonly configRepository: ConfigRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(query: ListConfigsQuery = {}): Promise<Config[]> {
    return this.configRepository.list({
      key: normalizeConfigKeyQuery(query.key, 'key'),
      scope: normalizeTextQuery(query.scope, 'scope', 80),
      q: normalizeTextQuery(query.q, 'q', 120),
    });
  }

  async getById(id: string): Promise<Config> {
    const config = await this.configRepository.findById(id);

    if (!config) {
      throw new NotFoundException(`Config "${id}" was not found.`);
    }

    return config;
  }

  async create(input: ConfigWriteInput): Promise<Config> {
    const normalizedInput = this.normalizeCreateInput(input);
    const existingConfig = await this.configRepository.findByKey(
      normalizedInput.key,
    );

    if (existingConfig) {
      throw new ConflictException(
        `Config key "${normalizedInput.key}" already exists.`,
      );
    }

    const config = await this.configRepository.create(normalizedInput);

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
    const currentConfig = await this.getById(id);
    const normalizedInput = this.normalizeUpdateInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return currentConfig;
    }

    if (normalizedInput.key && normalizedInput.key !== currentConfig.key) {
      const existingConfig = await this.configRepository.findByKey(
        normalizedInput.key,
      );

      if (existingConfig) {
        throw new ConflictException(
          `Config key "${normalizedInput.key}" already exists.`,
        );
      }
    }

    const config = await this.configRepository.update(id, normalizedInput);

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

  private normalizeCreateInput(input: ConfigWriteInput): ConfigWriteInput {
    if (input.value === undefined) {
      throw new BadRequestException('value is required.');
    }

    const scope = normalizeOptionalText(input.scope, 'scope', 80);
    const description = normalizeOptionalText(
      input.description,
      'description',
      255,
    );

    return {
      key: normalizeRequiredConfigKey(input.key, 'key'),
      value: input.value,
      scope: scope === undefined ? null : scope,
      description: description === undefined ? null : description,
    };
  }

  private normalizeUpdateInput(
    input: Partial<ConfigWriteInput>,
  ): Partial<ConfigWriteInput> {
    const normalizedInput: Partial<ConfigWriteInput> = {};

    if (input.key !== undefined) {
      normalizedInput.key = normalizeOptionalConfigKey(input.key, 'key');
    }

    if (input.value !== undefined) {
      normalizedInput.value = input.value;
    }

    if (input.scope !== undefined) {
      normalizedInput.scope = normalizeOptionalText(input.scope, 'scope', 80);
    }

    if (input.description !== undefined) {
      normalizedInput.description = normalizeOptionalText(
        input.description,
        'description',
        255,
      );
    }

    return normalizedInput;
  }
}
