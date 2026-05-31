import type {
  MobilePermissionActor,
  MobilePermissionMap,
  MobilePermissionOverride,
  MobilePermissionProfile,
} from '../entities/mobile-permission.entity';

export abstract class MobilePermissionRepository {
  abstract listProfiles(): Promise<MobilePermissionProfile[]>;

  abstract upsertProfile(
    actor: MobilePermissionActor,
    permissions: MobilePermissionMap,
  ): Promise<MobilePermissionProfile>;

  abstract findOverrideByUserId(
    userId: string,
  ): Promise<MobilePermissionOverride | null>;

  abstract upsertOverride(
    userId: string,
    permissions: MobilePermissionMap,
  ): Promise<MobilePermissionOverride>;
}
