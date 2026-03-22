import type {
  AuthSession,
  CreateAuthSessionInput,
  RotateAuthSessionTokensInput,
} from '../entities/auth-session.entity';

export abstract class AuthSessionRepository {
  abstract create(input: CreateAuthSessionInput): Promise<AuthSession>;

  abstract findById(id: string): Promise<AuthSession | null>;

  abstract findActiveByAccessTokenHash(
    accessTokenHash: string,
  ): Promise<AuthSession | null>;

  abstract findActiveByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null>;

  abstract rotateTokens(
    id: string,
    input: RotateAuthSessionTokensInput,
  ): Promise<AuthSession>;

  abstract touch(id: string): Promise<AuthSession>;

  abstract revoke(id: string, reason: string | null): Promise<AuthSession>;
}
