import { z } from 'zod';

import type {
  CourierActor,
  CourierPermissionFeature,
} from '../permissions/courier-permissions';

export interface AuthenticatedUserDto {
  id: string;
  username: string;
  displayName?: string | null;
  phone?: string | null;
  roles: string[];
  hubCodes?: string[];
  mobilePermissionActor?: CourierActor;
  mobilePermissions?: Partial<Record<CourierPermissionFeature, boolean>>;
  mobilePermissionsLoadedAt?: string;
}

export type UserStatus = 'ACTIVE' | 'DISABLED';
export type UserRoleGroup = 'OPS' | 'SHIPPER' | 'MERCHANT';

export interface UserAccountDto {
  id: string;
  username: string;
  status: UserStatus;
  roles: string[];
  displayName: string | null;
  phone: string | null;
  hubCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListFilters {
  roleGroup?: UserRoleGroup;
  status?: UserStatus | '';
  hubCode?: string;
  q?: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface AuthSessionDto {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'REVOKED';
  issuedAt: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResultDto {
  user: AuthenticatedUserDto;
  session: AuthSessionDto;
  tokens: AuthTokensDto;
}

export interface MobilePermissionEffectiveDto {
  userId: string;
  actor: CourierActor;
  permissions: Record<CourierPermissionFeature, boolean>;
  hasOverride: boolean;
}

export interface LogoutInputDto {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface LogoutResultDto {
  revoked: boolean;
  sessionId: string | null;
}

export interface RefreshSessionInputDto {
  refreshToken: string;
}

export interface IntrospectInputDto {
  accessToken: string;
}

export interface IntrospectResultDto {
  active: boolean;
  sessionId: string | null;
  user: AuthenticatedUserDto | null;
  accessTokenExpiresAt: string | null;
}

export const loginSchema = z.object({
  username: z
    .string()
    .regex(/^\d{8}$/, 'Tai khoan phai la ma 8 chu so.'),
  password: z.string().min(1, 'Mat khau la bat buoc.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
