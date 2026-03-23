import { z } from 'zod';

export interface AuthUserDto {
  id: string;
  username: string;
  roles: string[];
  hubCodes?: string[];
}

export type UserStatus = 'ACTIVE' | 'DISABLED';
export type UserRoleGroup = 'OPS' | 'SHIPPER';

export interface AdminUserDto {
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

export interface AdminUserFilters {
  roleGroup: UserRoleGroup;
  status?: UserStatus | '';
  hubCode?: string;
  q?: string;
}

export interface AdminUserCreateInput {
  username: string;
  password: string;
  roles: string[];
  status?: UserStatus;
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}

export interface AdminUserUpdateInput {
  username?: string;
  password?: string;
  roles?: string[];
  status?: UserStatus;
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  tokens: AuthTokensDto;
}

export interface LogoutResultDto {
  revoked: boolean;
  sessionId?: string | null;
}

export interface RefreshTokenInputDto {
  refreshToken: string;
}

export const loginSchema = z.object({
  username: z.string().min(1, 'Ten dang nhap la bat buoc.'),
  password: z.string().min(1, 'Mật khẩu la bat buoc.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;


