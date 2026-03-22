import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Hub, HubWriteInput } from '../../domain/entities/hub.entity';
import { HubRepository } from '../../domain/repositories/hub.repository';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  normalizeCodeQuery,
  normalizeOptionalCode,
  normalizeOptionalText,
  normalizeRequiredCode,
  normalizeRequiredText,
  normalizeTextQuery,
  parseBooleanQuery,
} from './masterdata-normalizers';

interface ListHubsQuery {
  code?: string;
  name?: string;
  zoneCode?: string;
  isActive?: string;
  q?: string;
}

@Injectable()
export class HubsService {
  constructor(
    @Inject(HubRepository)
    private readonly hubRepository: HubRepository,
    @Inject(ZoneRepository)
    private readonly zoneRepository: ZoneRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(query: ListHubsQuery = {}): Promise<Hub[]> {
    return this.hubRepository.list({
      code: normalizeCodeQuery(query.code, 'code'),
      name: normalizeTextQuery(query.name, 'name', 120),
      zoneCode: normalizeCodeQuery(query.zoneCode, 'zoneCode'),
      isActive: parseBooleanQuery(query.isActive, 'isActive'),
      q: normalizeTextQuery(query.q, 'q', 120),
    });
  }

  async getById(id: string): Promise<Hub> {
    const hub = await this.hubRepository.findById(id);

    if (!hub) {
      throw new NotFoundException(`Hub "${id}" was not found.`);
    }

    return hub;
  }

  async create(input: HubWriteInput): Promise<Hub> {
    const normalizedInput = this.normalizeCreateInput(input);
    const existingHub = await this.hubRepository.findByCode(normalizedInput.code);

    if (existingHub) {
      throw new ConflictException(
        `Hub code "${normalizedInput.code}" already exists.`,
      );
    }

    if (normalizedInput.zoneCode) {
      await this.ensureZoneCodeExists(normalizedInput.zoneCode);
    }

    const hub = await this.hubRepository.create(normalizedInput);

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
    const currentHub = await this.getById(id);
    const normalizedInput = this.normalizeUpdateInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return currentHub;
    }

    if (normalizedInput.code && normalizedInput.code !== currentHub.code) {
      const existingHub = await this.hubRepository.findByCode(normalizedInput.code);
      if (existingHub) {
        throw new ConflictException(
          `Hub code "${normalizedInput.code}" already exists.`,
        );
      }
    }

    const nextZoneCode =
      normalizedInput.zoneCode !== undefined
        ? normalizedInput.zoneCode
        : currentHub.zoneCode;

    if (nextZoneCode) {
      await this.ensureZoneCodeExists(nextZoneCode);
    }

    const hub = await this.hubRepository.update(id, normalizedInput);

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

  async remove(id: string): Promise<{ deleted: boolean; hubId: string | null }> {
    const hub = await this.getById(id);
    const deleted = await this.hubRepository.delete(id);

    if (deleted) {
      await this.masterdataOutboxService.enqueueMasterdataUpdated(
        'hub',
        hub.id,
        {
          action: 'deleted',
          entity: 'hub',
          record: hub,
        },
      );
    }

    return {
      deleted,
      hubId: deleted ? hub.id : null,
    };
  }

  private normalizeCreateInput(input: HubWriteInput): HubWriteInput {
    const zoneCode = normalizeOptionalCode(input.zoneCode, 'zoneCode');
    const address = normalizeOptionalText(input.address, 'address', 2000);

    return {
      code: normalizeRequiredCode(input.code, 'code'),
      name: normalizeRequiredText(input.name, 'name', 120),
      zoneCode: zoneCode === undefined ? null : zoneCode,
      address: address === undefined ? null : address,
      isActive: this.normalizeIsActive(input.isActive, true),
    };
  }

  private normalizeUpdateInput(
    input: Partial<HubWriteInput>,
  ): Partial<HubWriteInput> {
    const normalizedInput: Partial<HubWriteInput> = {};

    if (input.code !== undefined) {
      normalizedInput.code = normalizeRequiredCode(input.code, 'code');
    }

    if (input.name !== undefined) {
      normalizedInput.name = normalizeRequiredText(input.name, 'name', 120);
    }

    if (input.zoneCode !== undefined) {
      normalizedInput.zoneCode = normalizeOptionalCode(input.zoneCode, 'zoneCode');
    }

    if (input.address !== undefined) {
      normalizedInput.address = normalizeOptionalText(
        input.address,
        'address',
        2000,
      );
    }

    if (input.isActive !== undefined) {
      normalizedInput.isActive = this.normalizeIsActive(input.isActive, true);
    }

    return normalizedInput;
  }

  private normalizeIsActive(
    value: unknown,
    defaultValue: boolean,
  ): boolean {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean.');
    }

    return value;
  }

  private async ensureZoneCodeExists(zoneCode: string): Promise<void> {
    const zone = await this.zoneRepository.findByCode(zoneCode);

    if (!zone) {
      throw new BadRequestException(`Zone code "${zoneCode}" was not found.`);
    }
  }
}
