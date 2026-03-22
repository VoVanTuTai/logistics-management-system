import { z } from 'zod';

export interface AuthenticatedUserDto {
  id: string;
  username: string;
  roles: string[];
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
  username: z.string().min(1, 'Vui lòng nhập tài khoản.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
