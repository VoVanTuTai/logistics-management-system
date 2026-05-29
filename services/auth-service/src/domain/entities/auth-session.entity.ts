import type { AuthenticatedUser } from './user-account.entity';
import type { UserRoleGroup } from './user-account.entity';

export type SessionStatus = 'ACTIVE' | 'REVOKED';

export interface AuthSession {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  status: SessionStatus;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface LoginInput {
  username: string;
  password: string;
  roleGroup?: UserRoleGroup;
}

export interface RefreshSessionInput {
  refreshToken: string;
  roleGroup?: UserRoleGroup;
}

export interface LogoutInput {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface IntrospectInput {
  accessToken: string;
}

export interface UpdateOwnProfileInput {
  accessToken: string;
  displayName?: string | null;
  phone?: string | null;
}

export interface ChangePasswordInput {
  accessToken: string;
  currentPassword: string;
  newPassword: string;
}

export interface CreateAuthSessionInput {
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface RotateAuthSessionTokensInput {
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface LoginResult {
  user: AuthenticatedUser;
  session: AuthSession;
  tokens: AuthTokens;
}

export interface LogoutResult {
  revoked: boolean;
  sessionId: string | null;
}

export interface IntrospectResult {
  active: boolean;
  sessionId: string | null;
  user: AuthenticatedUser | null;
  accessTokenExpiresAt: string | null;
}

export interface ChangePasswordResult {
  changed: boolean;
  userId: string | null;
}
