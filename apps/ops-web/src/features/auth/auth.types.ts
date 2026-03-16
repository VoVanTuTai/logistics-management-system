import { z } from 'zod';

export interface AuthUserDto {
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
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
