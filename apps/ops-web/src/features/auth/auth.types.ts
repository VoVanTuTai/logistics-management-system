import { z } from 'zod';

export interface AuthUserDto {
  id: string;
  username: string;
  roles: string[];
  hubCodes?: string[];
}

export type UserStatus = 'ACTIVE' | 'DISABLED';
export type UserRoleGroup = 'OPS' | 'SHIPPER';

export interface OpsUserDto {
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

export interface OpsUserFilters {
  roleGroup: UserRoleGroup;
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
  username: z
    .string()
    .regex(/^\d{8}$/, 'Tai khoan phai la ma 8 chu so.'),
  password: z.string().min(1, 'Mat khau la bat buoc.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
