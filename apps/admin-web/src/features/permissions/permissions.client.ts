import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  CourierPermissionActor,
  CourierPermissionMatrix,
  UserPermissionMap,
} from './courierPermissionMatrix';

export interface EffectiveCourierPermissionDto {
  userId: string;
  actor: CourierPermissionActor;
  permissions: UserPermissionMap;
  hasOverride: boolean;
}

export interface UserPermissionOverrideDto {
  userId: string;
  permissions: UserPermissionMap;
}

export const permissionsClient = {
  getCourierPermissionMatrix: (
    accessToken: string | null,
  ): Promise<CourierPermissionMatrix> =>
    opsApiClient.request<CourierPermissionMatrix>(
      opsEndpoints.auth.mobilePermissionMatrix,
      {
        accessToken,
      },
    ),
  updateCourierPermissionMatrix: (
    accessToken: string | null,
    matrix: CourierPermissionMatrix,
  ): Promise<CourierPermissionMatrix> =>
    opsApiClient.request<CourierPermissionMatrix>(
      opsEndpoints.auth.mobilePermissionMatrix,
      {
        method: 'PUT',
        accessToken,
        body: {
          matrix,
        },
      },
    ),
  getUserEffectivePermissions: (
    accessToken: string | null,
    userId: string,
  ): Promise<EffectiveCourierPermissionDto> =>
    opsApiClient.request<EffectiveCourierPermissionDto>(
      opsEndpoints.auth.mobilePermissionUserEffective(userId),
      {
        accessToken,
      },
    ),
  updateUserPermissionOverride: (
    accessToken: string | null,
    userId: string,
    permissions: UserPermissionMap,
  ): Promise<UserPermissionOverrideDto> =>
    opsApiClient.request<UserPermissionOverrideDto>(
      opsEndpoints.auth.mobilePermissionUserOverride(userId),
      {
        method: 'PUT',
        accessToken,
        body: {
          permissions,
        },
      },
    ),
};
