import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Hub,
  HubCreateInput,
  HubWriteInput,
} from '../../domain/entities/hub.entity';
import { HubRepository } from '../../domain/repositories/hub.repository';
import { ZoneRepository } from '../../domain/repositories/zone.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  AdminAuditService,
  type AdminAuditContext,
} from './admin-audit.service';
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

interface HubCityRule {
  canonicalProvince: string;
  aliases: string[];
}

const HUB_CITY_RULES: HubCityRule[] = [
  {
    canonicalProvince: 'Ho Chi Minh',
    aliases: ['HOCHIMINH', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH', 'HCM'],
  },
  {
    canonicalProvince: 'Da Nang',
    aliases: ['DANANG', 'TPDANANG', 'THANHPHODANANG', 'DN'],
  },
  {
    canonicalProvince: 'Ha Noi',
    aliases: ['HANOI', 'TPHANOI', 'THANHPHOHANOI', 'HN'],
  },
];

@Injectable()
export class HubsService {
  constructor(
    @Inject(HubRepository)
    private readonly hubRepository: HubRepository,
    @Inject(ZoneRepository)
    private readonly zoneRepository: ZoneRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
    private readonly adminAuditService: AdminAuditService,
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

  async create(
    input: HubWriteInput,
    auditContext?: AdminAuditContext,
  ): Promise<Hub> {
    const normalizedInput = await this.normalizeCreateInput(input);
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

    await this.adminAuditService.record({
      context: auditContext,
      action: 'HUB_CREATED',
      targetType: 'HUB',
      targetId: hub.id,
      before: null,
      after: hub,
    });

    return hub;
  }

  async update(
    id: string,
    input: Partial<HubWriteInput>,
    auditContext?: AdminAuditContext,
  ): Promise<Hub> {
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

    await this.adminAuditService.record({
      context: auditContext,
      action:
        currentHub.isActive !== hub.isActive && hub.isActive === false
          ? 'HUB_DISABLED'
          : 'HUB_UPDATED',
      targetType: 'HUB',
      targetId: hub.id,
      before: currentHub,
      after: hub,
    });

    return hub;
  }

  async remove(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<{ deleted: boolean; hubId: string | null }> {
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

      await this.adminAuditService.record({
        context: auditContext,
        action: 'HUB_DELETED',
        targetType: 'HUB',
        targetId: hub.id,
        before: hub,
        after: null,
      });
    }

    return {
      deleted,
      hubId: deleted ? hub.id : null,
    };
  }

  private async normalizeCreateInput(input: HubWriteInput): Promise<HubCreateInput> {
    const zoneCode = normalizeOptionalCode(input.zoneCode, 'zoneCode');
    const address = normalizeOptionalText(input.address, 'address', 2000);
    this.extractHubLocation(address ?? null);

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
      const normalizedAddress = normalizeOptionalText(
        input.address,
        'address',
        2000,
      );
      if (normalizedAddress === null || normalizedAddress === undefined) {
        throw new BadRequestException('address is required.');
      }
      this.extractHubLocation(normalizedAddress);
      normalizedInput.address = normalizedAddress;
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

  private extractHubLocation(address: string | null): {
    province: string;
    district: string;
  } {
    if (!address) {
      throw new BadRequestException(
        'address is required and must contain province and district.',
      );
    }

    const parsedAddress = this.parseAddressPayload(address);
    const provinceRaw =
      typeof parsedAddress.province === 'string' ? parsedAddress.province : '';
    const districtRaw =
      typeof parsedAddress.district === 'string' ? parsedAddress.district : '';

    const province = provinceRaw.trim();
    const district = districtRaw.trim();

    if (!province) {
      throw new BadRequestException('address.province is required.');
    }

    if (!district) {
      throw new BadRequestException('address.district is required.');
    }

    const cityRule = this.resolveCityRule(province);

    if (!cityRule) {
      const supportedCities = HUB_CITY_RULES.map((rule) => rule.canonicalProvince).join(
        ', ',
      );
      throw new BadRequestException(
        `address.province must be one of: ${supportedCities}.`,
      );
    }

    return {
      province: cityRule.canonicalProvince,
      district,
    };
  }

  private parseAddressPayload(address: string): Record<string, unknown> {
    let payload: unknown;
    try {
      payload = JSON.parse(address);
    } catch {
      throw new BadRequestException(
        'address must be a JSON string with province and district.',
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException(
        'address must be a JSON object with province and district.',
      );
    }

    return payload as Record<string, unknown>;
  }

  private normalizeLocationKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }

  private resolveCityRule(province: string): HubCityRule | null {
    const normalizedProvince = this.normalizeLocationKey(province);
    for (const rule of HUB_CITY_RULES) {
      if (rule.aliases.includes(normalizedProvince)) {
        return rule;
      }
    }

    return null;
  }
}
