import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Config,
  ConfigValue,
  ConfigWriteInput,
} from '../../domain/entities/config.entity';
import { ConfigRepository } from '../../domain/repositories/config.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  normalizeConfigKeyQuery,
  normalizeOptionalConfigKey,
  normalizeOptionalText,
  normalizeRequiredConfigKey,
  normalizeRequiredText,
  normalizeTextQuery,
} from './masterdata-normalizers';

interface ListConfigsQuery {
  key?: string;
  scope?: string;
  q?: string;
}

const CONFIG_VALUE_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    const normalizedInput = this.normalizeUpdateInput(input, currentConfig.key);

    if (Object.keys(normalizedInput).length === 0) {
      return currentConfig;
    }

    if (normalizedInput.key && input.value === undefined) {
      normalizedInput.value = this.normalizeConfigValue(
        currentConfig.value,
        normalizedInput.key,
      );
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
    const key = normalizeRequiredConfigKey(input.key, 'key');
    const description = normalizeOptionalText(
      input.description,
      'description',
      255,
    );

    return {
      key,
      value: this.normalizeConfigValue(input.value, key),
      scope: normalizeRequiredText(input.scope, 'scope', 80),
      description: description === undefined ? null : description,
    };
  }

  private normalizeUpdateInput(
    input: Partial<ConfigWriteInput>,
    currentKey: string,
  ): Partial<ConfigWriteInput> {
    const normalizedInput: Partial<ConfigWriteInput> = {};

    if (input.key !== undefined) {
      normalizedInput.key = normalizeOptionalConfigKey(input.key, 'key');
    }

    if (input.value !== undefined) {
      const key = normalizedInput.key ?? currentKey;
      normalizedInput.value = this.normalizeConfigValue(input.value, key);
    }

    if (input.scope !== undefined) {
      normalizedInput.scope = normalizeRequiredText(input.scope, 'scope', 80);
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

  private normalizeConfigValue(value: unknown, key: string): ConfigValue {
    if (value === undefined) {
      throw new BadRequestException('value is required.');
    }

    const normalizedValue = this.ensureJsonValue(value, 'value');

    if (key.startsWith('merchant.profile.')) {
      this.validateMerchantProfileValue(normalizedValue);
    }

    if (
      isRecord(normalizedValue) &&
      ('valueType' in normalizedValue || 'value' in normalizedValue)
    ) {
      this.validateConfigEnvelope(normalizedValue);
    }

    return normalizedValue;
  }

  private ensureJsonValue(value: unknown, fieldName: string): ConfigValue {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new BadRequestException(`${fieldName} must be a finite number.`);
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) =>
        this.ensureJsonValue(item, `${fieldName}[${index}]`),
      );
    }

    if (isRecord(value)) {
      const normalizedRecord: { [key: string]: ConfigValue } = {};

      for (const [recordKey, recordValue] of Object.entries(value)) {
        if (!recordKey.trim()) {
          throw new BadRequestException(`${fieldName} contains an empty key.`);
        }

        normalizedRecord[recordKey] = this.ensureJsonValue(
          recordValue,
          `${fieldName}.${recordKey}`,
        );
      }

      return normalizedRecord;
    }

    throw new BadRequestException(`${fieldName} must be valid JSON value.`);
  }

  private validateConfigEnvelope(value: Record<string, unknown>): void {
    const valueType =
      typeof value.valueType === 'string' ? value.valueType.toUpperCase() : '';

    if (!CONFIG_VALUE_TYPES.includes(valueType as typeof CONFIG_VALUE_TYPES[number])) {
      throw new BadRequestException(
        `value.valueType must be one of: ${CONFIG_VALUE_TYPES.join(', ')}.`,
      );
    }

    if (!('value' in value)) {
      throw new BadRequestException('value.value is required.');
    }

    if ('name' in value && typeof value.name !== 'string') {
      throw new BadRequestException('value.name must be a string.');
    }

    if ('isActive' in value && typeof value.isActive !== 'boolean') {
      throw new BadRequestException('value.isActive must be a boolean.');
    }

    if ('isEditable' in value && typeof value.isEditable !== 'boolean') {
      throw new BadRequestException('value.isEditable must be a boolean.');
    }
  }

  private validateMerchantProfileValue(value: ConfigValue): void {
    if (!isRecord(value)) {
      throw new BadRequestException('merchant profile value must be an object.');
    }

    for (const fieldName of ['username', 'citizenId', 'regionCode', 'regionLabel']) {
      const fieldValue = value[fieldName];
      if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
        throw new BadRequestException(
          `merchant profile ${fieldName} is required.`,
        );
      }
    }

    for (const fieldName of [
      'defaultHubCode',
      'defaultHubName',
      'defaultSenderAddress',
    ]) {
      if (
        value[fieldName] !== null &&
        value[fieldName] !== undefined &&
        typeof value[fieldName] !== 'string'
      ) {
        throw new BadRequestException(
          `merchant profile ${fieldName} must be a string or null.`,
        );
      }
    }
  }
}
