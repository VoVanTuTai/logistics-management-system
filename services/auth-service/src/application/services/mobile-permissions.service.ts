import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MOBILE_PERMISSION_ACTORS,
  MOBILE_PERMISSION_FEATURES,
  MobilePermissionActor,
  MobilePermissionEffectiveView,
  MobilePermissionMap,
  MobilePermissionMatrix,
  MobilePermissionMatrixUpdateInput,
  MobilePermissionUserOverrideInput,
  MobilePermissionUserOverrideView,
} from '../../domain/entities/mobile-permission.entity';
import { MobilePermissionRepository } from '../../domain/repositories/mobile-permission.repository';
import { UserAccountRepository } from '../../domain/repositories/user-account.repository';

const OPS_ROLE_SET = new Set([
  'OPS',
  'OPS_STAFF',
  'OPS_MANAGER',
  'OPS_ADMIN',
  'OPS_VIEWER',
  'ADMIN',
  'SYSTEM_ADMIN',
]);

@Injectable()
export class MobilePermissionsService {
  constructor(
    @Inject(MobilePermissionRepository)
    private readonly mobilePermissionRepository: MobilePermissionRepository,
    @Inject(UserAccountRepository)
    private readonly userAccountRepository: UserAccountRepository,
  ) {}

  async getMatrix(): Promise<MobilePermissionMatrix> {
    const profiles = await this.mobilePermissionRepository.listProfiles();
    const matrix = this.createDefaultMatrix();

    for (const profile of profiles) {
      if (!this.isActor(profile.actor)) {
        continue;
      }

      matrix[profile.actor] = this.normalizePermissionMap(
        profile.permissions,
        matrix[profile.actor],
        `matrix.${profile.actor}`,
      );
    }

    return matrix;
  }

  async updateMatrix(
    input: MobilePermissionMatrixUpdateInput,
  ): Promise<MobilePermissionMatrix> {
    const currentMatrix = await this.getMatrix();
    const source = this.resolveMatrixInput(input);
    const nextMatrix = this.createDefaultMatrix();

    for (const actor of MOBILE_PERMISSION_ACTORS) {
      nextMatrix[actor] = this.normalizePermissionMap(
        source[actor],
        currentMatrix[actor],
        `matrix.${actor}`,
      );

      await this.mobilePermissionRepository.upsertProfile(
        actor,
        nextMatrix[actor],
      );
    }

    return nextMatrix;
  }

  async getEffectiveForUser(
    userId: string,
  ): Promise<MobilePermissionEffectiveView> {
    const user = await this.userAccountRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User "${userId}" was not found.`);
    }

    const actor = this.resolveActor(user.roles);
    const matrix = await this.getMatrix();
    const basePermissions = matrix[actor];
    const override = await this.mobilePermissionRepository.findOverrideByUserId(
      user.id,
    );
    const permissions = override
      ? this.normalizePermissionMap(
          override.permissions,
          basePermissions,
          `users.${user.id}.permissions`,
        )
      : basePermissions;

    return {
      userId: user.id,
      actor,
      permissions,
      hasOverride: Boolean(override),
    };
  }

  async updateUserOverride(
    userId: string,
    input: MobilePermissionUserOverrideInput | Partial<MobilePermissionMap>,
  ): Promise<MobilePermissionUserOverrideView> {
    const user = await this.userAccountRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User "${userId}" was not found.`);
    }

    const actor = this.resolveActor(user.roles);
    const matrix = await this.getMatrix();
    const source = this.resolveUserOverrideInput(input);
    const permissions = this.normalizePermissionMap(
      source,
      matrix[actor],
      `users.${user.id}.permissions`,
    );
    const override = await this.mobilePermissionRepository.upsertOverride(
      user.id,
      permissions,
    );

    return {
      userId: override.userId,
      permissions: override.permissions,
    };
  }

  private createDefaultMatrix(): MobilePermissionMatrix {
    return MOBILE_PERMISSION_ACTORS.reduce((actorAcc, actor) => {
      actorAcc[actor] = this.createAllEnabledPermissionMap();
      return actorAcc;
    }, {} as MobilePermissionMatrix);
  }

  private createAllEnabledPermissionMap(): MobilePermissionMap {
    return MOBILE_PERMISSION_FEATURES.reduce((featureAcc, feature) => {
      featureAcc[feature] = true;
      return featureAcc;
    }, {} as MobilePermissionMap);
  }

  private normalizePermissionMap(
    value: unknown,
    fallback: MobilePermissionMap,
    fieldName: string,
  ): MobilePermissionMap {
    if (value === undefined) {
      return { ...fallback };
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(`${fieldName} must be an object.`);
    }

    const source = value as Record<string, unknown>;
    const normalizedMap = { ...fallback };

    for (const [key, rawValue] of Object.entries(source)) {
      if (!this.isFeature(key)) {
        throw new BadRequestException(`Unknown mobile permission key "${key}".`);
      }

      if (typeof rawValue !== 'boolean') {
        throw new BadRequestException(`${fieldName}.${key} must be a boolean.`);
      }

      normalizedMap[key] = rawValue;
    }

    return normalizedMap;
  }

  private resolveMatrixInput(
    input: MobilePermissionMatrixUpdateInput,
  ): Partial<Record<MobilePermissionActor, Partial<MobilePermissionMap>>> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Permission matrix payload must be an object.');
    }

    const source = 'matrix' in input && input.matrix ? input.matrix : input;
    const record = source as Record<string, unknown>;

    for (const actor of Object.keys(record)) {
      if (!this.isActor(actor)) {
        throw new BadRequestException(`Unknown mobile permission actor "${actor}".`);
      }
    }

    return source;
  }

  private resolveUserOverrideInput(
    input: MobilePermissionUserOverrideInput | Partial<MobilePermissionMap>,
  ): Partial<MobilePermissionMap> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('User permission payload must be an object.');
    }

    return 'permissions' in input && input.permissions
      ? input.permissions
      : (input as Partial<MobilePermissionMap>);
  }

  private resolveActor(roles: string[]): MobilePermissionActor {
    const normalizedRoles = roles.map((role) => role.toUpperCase());

    if (normalizedRoles.some((role) => OPS_ROLE_SET.has(role))) {
      return 'OPS';
    }

    return 'COURIER';
  }

  private isActor(value: string): value is MobilePermissionActor {
    return MOBILE_PERMISSION_ACTORS.includes(value as MobilePermissionActor);
  }

  private isFeature(value: string): value is keyof MobilePermissionMap {
    return MOBILE_PERMISSION_FEATURES.includes(
      value as keyof MobilePermissionMap,
    );
  }
}
