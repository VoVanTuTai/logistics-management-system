import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type {
  AuthSession,
  IntrospectInput,
  IntrospectResult,
  LoginInput,
  LoginResult,
  LogoutInput,
  LogoutResult,
  RefreshSessionInput,
} from '../../domain/entities/auth-session.entity';
import type { AuthenticatedUser, UserAccount } from '../../domain/entities/user-account.entity';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { UserAccountRepository } from '../../domain/repositories/user-account.repository';
import { HashService } from '../../infrastructure/security/hash.service';
import { OpaqueTokenService } from '../../infrastructure/security/opaque-token.service';
import { AuthOutboxService } from '../../messaging/outbox/auth-outbox.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserAccountRepository)
    private readonly userAccountRepository: UserAccountRepository,
    @Inject(AuthSessionRepository)
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly hashService: HashService,
    private readonly opaqueTokenService: OpaqueTokenService,
    private readonly authOutboxService: AuthOutboxService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    if (!input.username || !input.password) {
      throw new BadRequestException('username and password are required.');
    }

    const user = await this.userAccountRepository.findByUsername(input.username);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!this.hashService.verify(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const issuedAt = new Date();
    const tokens = this.opaqueTokenService.issueTokens(issuedAt);
    const session = await this.authSessionRepository.create({
      userId: user.id,
      accessTokenHash: this.hashService.digest(tokens.accessToken),
      refreshTokenHash: this.hashService.digest(tokens.refreshToken),
      issuedAt,
      accessTokenExpiresAt: new Date(tokens.accessTokenExpiresAt),
      refreshTokenExpiresAt: new Date(tokens.refreshTokenExpiresAt),
    });

    await this.authOutboxService.enqueueSessionCreated(session, user.username);

    return {
      user: this.toAuthenticatedUser(user),
      session,
      tokens,
    };
  }

  async refresh(input: RefreshSessionInput): Promise<LoginResult> {
    if (!input.refreshToken) {
      throw new BadRequestException('refreshToken is required.');
    }

    const refreshTokenHash = this.hashService.digest(input.refreshToken);
    const currentSession = await this.authSessionRepository.findActiveByRefreshTokenHash(
      refreshTokenHash,
    );

    if (!currentSession || this.isExpired(currentSession.refreshTokenExpiresAt)) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const user = await this.getActiveUser(currentSession.userId);
    const issuedAt = new Date();
    const tokens = this.opaqueTokenService.issueTokens(issuedAt);
    const session = await this.authSessionRepository.rotateTokens(currentSession.id, {
      accessTokenHash: this.hashService.digest(tokens.accessToken),
      refreshTokenHash: this.hashService.digest(tokens.refreshToken),
      accessTokenExpiresAt: new Date(tokens.accessTokenExpiresAt),
      refreshTokenExpiresAt: new Date(tokens.refreshTokenExpiresAt),
    });

    await this.authOutboxService.enqueueSessionRefreshed(session, user.username);

    return {
      user: this.toAuthenticatedUser(user),
      session,
      tokens,
    };
  }

  async logout(input: LogoutInput): Promise<LogoutResult> {
    const accessToken = input.accessToken ?? null;
    const refreshToken = input.refreshToken ?? null;

    if (!accessToken && !refreshToken) {
      throw new BadRequestException(
        'accessToken or refreshToken is required for logout.',
      );
    }

    const session =
      (accessToken
        ? await this.authSessionRepository.findActiveByAccessTokenHash(
            this.hashService.digest(accessToken),
          )
        : null) ??
      (refreshToken
        ? await this.authSessionRepository.findActiveByRefreshTokenHash(
            this.hashService.digest(refreshToken),
          )
        : null);

    if (!session) {
      return {
        revoked: false,
        sessionId: null,
      };
    }

    const revokedSession = await this.authSessionRepository.revoke(
      session.id,
      'logout',
    );
    const user = await this.userAccountRepository.findById(revokedSession.userId);

    await this.authOutboxService.enqueueSessionRevoked(
      revokedSession,
      user?.username ?? revokedSession.userId,
    );

    return {
      revoked: true,
      sessionId: revokedSession.id,
    };
  }

  async introspect(input: IntrospectInput): Promise<IntrospectResult> {
    if (!input.accessToken) {
      throw new BadRequestException('accessToken is required.');
    }

    const accessTokenHash = this.hashService.digest(input.accessToken);
    const session = await this.authSessionRepository.findActiveByAccessTokenHash(
      accessTokenHash,
    );

    if (!session || this.isExpired(session.accessTokenExpiresAt)) {
      return {
        active: false,
        sessionId: null,
        user: null,
        accessTokenExpiresAt: null,
      };
    }

    const touchedSession = await this.authSessionRepository.touch(session.id);
    const user = await this.userAccountRepository.findById(touchedSession.userId);

    if (!user || user.status !== 'ACTIVE') {
      return {
        active: false,
        sessionId: null,
        user: null,
        accessTokenExpiresAt: null,
      };
    }

    return {
      active: true,
      sessionId: touchedSession.id,
      user: this.toAuthenticatedUser(user),
      accessTokenExpiresAt: touchedSession.accessTokenExpiresAt.toISOString(),
    };
  }

  private async getActiveUser(userId: string): Promise<UserAccount> {
    const user = await this.userAccountRepository.findById(userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active.');
    }

    return user;
  }

  private isExpired(date: Date): boolean {
    return date.getTime() <= Date.now();
  }

  private toAuthenticatedUser(user: UserAccount): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
    };
  }
}
