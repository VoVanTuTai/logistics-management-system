import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MerchantProfile,
  MerchantProfileWriteInput,
} from '../../domain/entities/merchant-profile.entity';
import { ConfigRepository } from '../../domain/repositories/config.repository';
import { HubRepository } from '../../domain/repositories/hub.repository';
import { MerchantProfileRepository } from '../../domain/repositories/merchant-profile.repository';
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
} from './masterdata-normalizers';

interface ListMerchantProfilesQuery {
  username?: string;
  citizenId?: string;
  regionCode?: string;
  defaultHubCode?: string;
  q?: string;
}

const MERCHANT_USERNAME_PATTERN = /^411\d{5}$/;
const CITIZEN_ID_PATTERN = /^\d{12}$/;
const LEGACY_MERCHANT_PROFILE_SCOPE = 'MERCHANT_PROFILE';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class MerchantProfilesService {
  constructor(
    @Inject(MerchantProfileRepository)
    private readonly merchantProfileRepository: MerchantProfileRepository,
    @Inject(ConfigRepository)
    private readonly configRepository: ConfigRepository,
    @Inject(HubRepository)
    private readonly hubRepository: HubRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async list(query: ListMerchantProfilesQuery = {}): Promise<MerchantProfile[]> {
    await this.migrateLegacyConfigProfiles();

    return this.merchantProfileRepository.list({
      username: this.normalizeUsernameQuery(query.username),
      citizenId: normalizeTextQuery(query.citizenId, 'citizenId', 12),
      regionCode: normalizeCodeQuery(query.regionCode, 'regionCode'),
      defaultHubCode: normalizeCodeQuery(query.defaultHubCode, 'defaultHubCode'),
      q: normalizeTextQuery(query.q, 'q', 120),
    });
  }

  async getById(id: string): Promise<MerchantProfile> {
    const profile = await this.merchantProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException(`Merchant profile "${id}" was not found.`);
    }

    return profile;
  }

  async getByUsername(username: string): Promise<MerchantProfile> {
    const normalizedUsername = this.normalizeUsername(username);
    await this.migrateLegacyConfigProfiles(normalizedUsername);

    const profile = await this.merchantProfileRepository.findByUsername(
      normalizedUsername,
    );

    if (!profile) {
      throw new NotFoundException(
        `Merchant profile for username "${normalizedUsername}" was not found.`,
      );
    }

    return profile;
  }

  async create(
    input: MerchantProfileWriteInput,
    auditContext?: AdminAuditContext,
  ): Promise<MerchantProfile> {
    const normalizedInput = await this.normalizeInput(input);
    const existingByUsername =
      await this.merchantProfileRepository.findByUsername(
        normalizedInput.username,
      );

    if (existingByUsername) {
      throw new ConflictException(
        `Merchant profile username "${normalizedInput.username}" already exists.`,
      );
    }

    await this.ensureCitizenIdAvailable(normalizedInput.citizenId);

    const profile = await this.merchantProfileRepository.create(normalizedInput);
    await this.emitChanged('created', profile);
    await this.adminAuditService.record({
      context: auditContext,
      action: 'MERCHANT_PROFILE_CREATED',
      targetType: 'MERCHANT_PROFILE',
      targetId: profile.id,
      before: null,
      after: profile,
    });

    return profile;
  }

  async update(
    id: string,
    input: Partial<MerchantProfileWriteInput>,
    auditContext?: AdminAuditContext,
  ): Promise<MerchantProfile> {
    const currentProfile = await this.getById(id);
    const normalizedInput = await this.normalizePartialInput(input, currentProfile);

    if (Object.keys(normalizedInput).length === 0) {
      return currentProfile;
    }

    if (
      normalizedInput.username &&
      normalizedInput.username !== currentProfile.username
    ) {
      const existingByUsername =
        await this.merchantProfileRepository.findByUsername(
          normalizedInput.username,
        );

      if (existingByUsername) {
        throw new ConflictException(
          `Merchant profile username "${normalizedInput.username}" already exists.`,
        );
      }
    }

    if (
      normalizedInput.citizenId &&
      normalizedInput.citizenId !== currentProfile.citizenId
    ) {
      await this.ensureCitizenIdAvailable(
        normalizedInput.citizenId,
        currentProfile.id,
      );
    }

    const profile = await this.merchantProfileRepository.update(
      id,
      normalizedInput,
    );
    await this.emitChanged('updated', profile);
    await this.adminAuditService.record({
      context: auditContext,
      action: 'MERCHANT_PROFILE_UPDATED',
      targetType: 'MERCHANT_PROFILE',
      targetId: profile.id,
      before: currentProfile,
      after: profile,
    });

    return profile;
  }

  async upsertByUsername(
    username: string,
    input: MerchantProfileWriteInput,
    auditContext?: AdminAuditContext,
  ): Promise<MerchantProfile> {
    const normalizedUsername = this.normalizeUsername(username);
    const normalizedInput = await this.normalizeInput({
      ...input,
      username: normalizedUsername,
    });
    const currentProfile = await this.merchantProfileRepository.findByUsername(
      normalizedUsername,
    );

    await this.ensureCitizenIdAvailable(
      normalizedInput.citizenId,
      currentProfile?.id,
    );

    const profile = await this.merchantProfileRepository.upsertByUsername(
      normalizedUsername,
      normalizedInput,
    );
    await this.emitChanged(currentProfile ? 'updated' : 'created', profile);
    await this.adminAuditService.record({
      context: auditContext,
      action: currentProfile
        ? 'MERCHANT_PROFILE_UPDATED'
        : 'MERCHANT_PROFILE_CREATED',
      targetType: 'MERCHANT_PROFILE',
      targetId: profile.id,
      before: currentProfile,
      after: profile,
    });

    return profile;
  }

  async remove(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<{ deleted: boolean; merchantProfileId: string | null }> {
    const profile = await this.getById(id);
    const deleted = await this.merchantProfileRepository.delete(id);

    if (deleted) {
      await this.emitChanged('deleted', profile);
      await this.adminAuditService.record({
        context: auditContext,
        action: 'MERCHANT_PROFILE_DELETED',
        targetType: 'MERCHANT_PROFILE',
        targetId: profile.id,
        before: profile,
        after: null,
      });
    }

    return {
      deleted,
      merchantProfileId: deleted ? profile.id : null,
    };
  }

  private async normalizeInput(
    input: MerchantProfileWriteInput,
  ): Promise<MerchantProfileWriteInput> {
    const username = this.normalizeUsername(input.username);
    const citizenId = normalizeRequiredText(input.citizenId, 'citizenId', 12);

    if (!CITIZEN_ID_PATTERN.test(citizenId)) {
      throw new BadRequestException('citizenId must be exactly 12 digits.');
    }

    const defaultHubCode = normalizeOptionalCode(
      input.defaultHubCode,
      'defaultHubCode',
    );
    const defaultHubName = normalizeOptionalText(
      input.defaultHubName,
      'defaultHubName',
      120,
    );
    const defaultSenderAddress = normalizeOptionalText(
      input.defaultSenderAddress,
      'defaultSenderAddress',
      500,
    );

    if (defaultHubCode) {
      await this.ensureHubCodeExists(defaultHubCode);
    }

    return {
      username,
      citizenId,
      regionCode: normalizeRequiredCode(input.regionCode, 'regionCode'),
      regionLabel: normalizeRequiredText(input.regionLabel, 'regionLabel', 80),
      defaultHubCode: defaultHubCode ?? null,
      defaultHubName: defaultHubName ?? null,
      defaultSenderAddress: defaultSenderAddress ?? null,
    };
  }

  private async normalizePartialInput(
    input: Partial<MerchantProfileWriteInput>,
    currentProfile: MerchantProfile,
  ): Promise<Partial<MerchantProfileWriteInput>> {
    const mergedInput = await this.normalizeInput({
      username: input.username ?? currentProfile.username,
      citizenId: input.citizenId ?? currentProfile.citizenId,
      regionCode: input.regionCode ?? currentProfile.regionCode,
      regionLabel: input.regionLabel ?? currentProfile.regionLabel,
      defaultHubCode:
        input.defaultHubCode !== undefined
          ? input.defaultHubCode
          : currentProfile.defaultHubCode,
      defaultHubName:
        input.defaultHubName !== undefined
          ? input.defaultHubName
          : currentProfile.defaultHubName,
      defaultSenderAddress:
        input.defaultSenderAddress !== undefined
          ? input.defaultSenderAddress
          : currentProfile.defaultSenderAddress,
    });

    const normalizedInput: Partial<MerchantProfileWriteInput> = {};

    if (mergedInput.username !== currentProfile.username) {
      normalizedInput.username = mergedInput.username;
    }

    if (mergedInput.citizenId !== currentProfile.citizenId) {
      normalizedInput.citizenId = mergedInput.citizenId;
    }

    if (mergedInput.regionCode !== currentProfile.regionCode) {
      normalizedInput.regionCode = mergedInput.regionCode;
    }

    if (mergedInput.regionLabel !== currentProfile.regionLabel) {
      normalizedInput.regionLabel = mergedInput.regionLabel;
    }

    if (mergedInput.defaultHubCode !== currentProfile.defaultHubCode) {
      normalizedInput.defaultHubCode = mergedInput.defaultHubCode;
    }

    if (mergedInput.defaultHubName !== currentProfile.defaultHubName) {
      normalizedInput.defaultHubName = mergedInput.defaultHubName;
    }

    if (
      mergedInput.defaultSenderAddress !== currentProfile.defaultSenderAddress
    ) {
      normalizedInput.defaultSenderAddress = mergedInput.defaultSenderAddress;
    }

    return normalizedInput;
  }

  private normalizeUsername(value: unknown): string {
    const username = normalizeRequiredText(value, 'username', 8);

    if (!MERCHANT_USERNAME_PATTERN.test(username)) {
      throw new BadRequestException('username must match merchant code 411xxxxx.');
    }

    return username;
  }

  private normalizeUsernameQuery(value: string | undefined): string | undefined {
    if (value === undefined || !value.trim()) {
      return undefined;
    }

    return this.normalizeUsername(value);
  }

  private async ensureCitizenIdAvailable(
    citizenId: string,
    currentProfileId?: string,
  ): Promise<void> {
    const existingProfile = await this.merchantProfileRepository.findByCitizenId(
      citizenId,
    );

    if (existingProfile && existingProfile.id !== currentProfileId) {
      throw new ConflictException(
        `Merchant profile citizenId "${citizenId}" already exists.`,
      );
    }
  }

  private async ensureHubCodeExists(hubCode: string): Promise<void> {
    const hub = await this.hubRepository.findByCode(hubCode);

    if (!hub) {
      throw new BadRequestException(`Hub "${hubCode}" was not found.`);
    }
  }

  private async emitChanged(action: string, profile: MerchantProfile): Promise<void> {
    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'merchant-profile',
      profile.id,
      {
        action,
        entity: 'merchant-profile',
        record: profile,
      },
    );
  }

  private async migrateLegacyConfigProfiles(username?: string): Promise<void> {
    const configs = await this.configRepository.list({
      scope: LEGACY_MERCHANT_PROFILE_SCOPE,
    });

    for (const config of configs) {
      const legacyProfile = this.parseLegacyProfile(config.value);

      if (!legacyProfile || (username && legacyProfile.username !== username)) {
        continue;
      }

      const existingProfile = await this.merchantProfileRepository.findByUsername(
        legacyProfile.username,
      );

      if (existingProfile) {
        continue;
      }

      const existingCitizenProfile =
        await this.merchantProfileRepository.findByCitizenId(
          legacyProfile.citizenId,
        );

      if (existingCitizenProfile) {
        continue;
      }

      try {
        const normalizedInput = await this.normalizeInput(legacyProfile);
        await this.merchantProfileRepository.create(normalizedInput);
      } catch {
        // Legacy config data should not block normal merchant profile reads.
      }
    }
  }

  private parseLegacyProfile(value: unknown): MerchantProfileWriteInput | null {
    if (!isRecord(value)) {
      return null;
    }

    const username = this.getRequiredLegacyText(value.username);
    const citizenId = this.getRequiredLegacyText(value.citizenId);
    const regionCode = this.getRequiredLegacyText(value.regionCode);
    const regionLabel = this.getRequiredLegacyText(value.regionLabel);

    if (!username || !citizenId || !regionCode || !regionLabel) {
      return null;
    }

    return {
      username,
      citizenId,
      regionCode,
      regionLabel,
      defaultHubCode: this.getOptionalLegacyText(value.defaultHubCode),
      defaultHubName: this.getOptionalLegacyText(value.defaultHubName),
      defaultSenderAddress: this.getOptionalLegacyText(
        value.defaultSenderAddress,
      ),
    };
  }

  private getRequiredLegacyText(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private getOptionalLegacyText(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
