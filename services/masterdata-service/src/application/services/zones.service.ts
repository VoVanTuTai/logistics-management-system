import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Zone, ZoneWriteInput } from '../../domain/entities/zone.entity';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  normalizeCodeQuery,
  normalizeOptionalCode,
  normalizeRequiredCode,
  normalizeRequiredText,
  normalizeTextQuery,
  parseBooleanQuery,
} from './masterdata-normalizers';

interface ListZonesQuery {
  code?: string;
  name?: string;
  parentCode?: string;
  isActive?: string;
  q?: string;
}

@Injectable()
export class ZonesService {
  constructor(
    @Inject(ZoneRepository)
    private readonly zoneRepository: ZoneRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(query: ListZonesQuery = {}): Promise<Zone[]> {
    return this.zoneRepository.list({
      code: normalizeCodeQuery(query.code, 'code'),
      name: normalizeTextQuery(query.name, 'name', 120),
      parentCode: normalizeCodeQuery(query.parentCode, 'parentCode'),
      isActive: parseBooleanQuery(query.isActive, 'isActive'),
      q: normalizeTextQuery(query.q, 'q', 120),
    });
  }

  async getById(id: string): Promise<Zone> {
    const zone = await this.zoneRepository.findById(id);

    if (!zone) {
      throw new NotFoundException(`Zone "${id}" was not found.`);
    }

    return zone;
  }

  async create(input: ZoneWriteInput): Promise<Zone> {
    const normalizedInput = this.normalizeCreateInput(input);
    const existingZone = await this.zoneRepository.findByCode(normalizedInput.code);

    if (existingZone) {
      throw new ConflictException(
        `Zone code "${normalizedInput.code}" already exists.`,
      );
    }

    await this.ensureValidParentChain(
      normalizedInput.code,
      normalizedInput.parentCode ?? null,
    );

    const zone = await this.zoneRepository.create(normalizedInput);

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
    const currentZone = await this.getById(id);
    const normalizedInput = this.normalizeUpdateInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return currentZone;
    }

    if (normalizedInput.code && normalizedInput.code !== currentZone.code) {
      const existingZone = await this.zoneRepository.findByCode(normalizedInput.code);
      if (existingZone) {
        throw new ConflictException(
          `Zone code "${normalizedInput.code}" already exists.`,
        );
      }
    }

    const nextCode = normalizedInput.code ?? currentZone.code;
    const nextParentCode =
      normalizedInput.parentCode !== undefined
        ? normalizedInput.parentCode
        : currentZone.parentCode;

    await this.ensureValidParentChain(nextCode, nextParentCode ?? null);

    const zone = await this.zoneRepository.update(id, normalizedInput);

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

  private normalizeCreateInput(input: ZoneWriteInput): ZoneWriteInput {
    const parentCode = normalizeOptionalCode(input.parentCode, 'parentCode');

    return {
      code: normalizeRequiredCode(input.code, 'code'),
      name: normalizeRequiredText(input.name, 'name', 120),
      parentCode: parentCode === undefined ? null : parentCode,
      isActive: this.normalizeIsActive(input.isActive, true),
    };
  }

  private normalizeUpdateInput(
    input: Partial<ZoneWriteInput>,
  ): Partial<ZoneWriteInput> {
    const normalizedInput: Partial<ZoneWriteInput> = {};

    if (input.code !== undefined) {
      normalizedInput.code = normalizeRequiredCode(input.code, 'code');
    }

    if (input.name !== undefined) {
      normalizedInput.name = normalizeRequiredText(input.name, 'name', 120);
    }

    if (input.parentCode !== undefined) {
      normalizedInput.parentCode = normalizeOptionalCode(
        input.parentCode,
        'parentCode',
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

  private async ensureValidParentChain(
    zoneCode: string,
    parentCode: string | null,
  ): Promise<void> {
    if (!parentCode) {
      return;
    }

    if (zoneCode === parentCode) {
      throw new BadRequestException(
        `Zone "${zoneCode}" cannot use itself as parentCode.`,
      );
    }

    const visitedCodes = new Set<string>([zoneCode]);
    let cursorCode: string | null = parentCode;

    while (cursorCode) {
      if (visitedCodes.has(cursorCode)) {
        throw new BadRequestException(
          `Zone hierarchy cycle detected via parentCode "${cursorCode}".`,
        );
      }

      visitedCodes.add(cursorCode);
      const parentZone = await this.zoneRepository.findByCode(cursorCode);

      if (!parentZone) {
        throw new BadRequestException(
          `parentCode "${cursorCode}" was not found.`,
        );
      }

      cursorCode = parentZone.parentCode;
    }
  }
}
