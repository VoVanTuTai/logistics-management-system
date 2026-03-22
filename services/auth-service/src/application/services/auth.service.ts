import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
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
import type {
  AuthenticatedUser,
  UserAccount,
  UserAccountCreateInput,
  UserAccountListFilters,
  UserAccountUpdateInput,
  UserAccountView,
  UserCreateInput,
  UserRoleGroup,
  UserStatus,
  UserUpdateInput,
} from '../../domain/entities/user-account.entity';
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

  async listUsers(filters: UserAccountListFilters = {}): Promise<UserAccountView[]> {
    const users = await this.userAccountRepository.list({
      roleGroup: this.normalizeRoleGroup(filters.roleGroup),
      status: this.normalizeStatusFilter(filters.status),
      hubCode: this.normalizeOptionalCode(filters.hubCode),
      q: this.normalizeOptionalText(filters.q, 120),
    });

    return users.map((user) => this.toUserAccountView(user));
  }

  async createUser(input: UserCreateInput): Promise<UserAccountView> {
    const normalizedInput = this.normalizeCreateUserInput(input);

    const existingUser = await this.userAccountRepository.findByUsername(
      normalizedInput.username,
    );

    if (existingUser) {
      throw new ConflictException(
        `Username "${normalizedInput.username}" already exists.`,
      );
    }

    const user = await this.userAccountRepository.create({
      username: normalizedInput.username,
      passwordHash: this.hashService.digest(normalizedInput.password),
      roles: normalizedInput.roles,
      status: normalizedInput.status,
      displayName: normalizedInput.displayName,
      phone: normalizedInput.phone,
      hubCodes: normalizedInput.hubCodes,
    });

    return this.toUserAccountView(user);
  }

  async updateUser(id: string, input: UserUpdateInput): Promise<UserAccountView> {
    const currentUser = await this.getUserById(id);
    const normalizedInput = this.normalizeUpdateUserInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return this.toUserAccountView(currentUser);
    }

    if (
      normalizedInput.username &&
      normalizedInput.username !== currentUser.username
    ) {
      const existingUser = await this.userAccountRepository.findByUsername(
        normalizedInput.username,
      );

      if (existingUser) {
        throw new ConflictException(
          `Username "${normalizedInput.username}" already exists.`,
        );
      }
    }

    const payload: UserAccountUpdateInput = {
      username: normalizedInput.username,
      roles: normalizedInput.roles,
      status: normalizedInput.status,
      displayName: normalizedInput.displayName,
      phone: normalizedInput.phone,
      hubCodes: normalizedInput.hubCodes,
    };

    if (normalizedInput.password) {
      payload.passwordHash = this.hashService.digest(normalizedInput.password);
    }

    const user = await this.userAccountRepository.update(id, payload);

    return this.toUserAccountView(user);
  }

  async deleteUser(id: string): Promise<{ deleted: boolean; userId: string | null }> {
    const user = await this.userAccountRepository.findById(id);

    if (!user) {
      return {
        deleted: false,
        userId: null,
      };
    }

    const deleted = await this.userAccountRepository.delete(id);

    return {
      deleted,
      userId: deleted ? id : null,
    };
  }

  private async getActiveUser(userId: string): Promise<UserAccount> {
    const user = await this.userAccountRepository.findById(userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active.');
    }

    return user;
  }

  private async getUserById(userId: string): Promise<UserAccount> {
    const user = await this.userAccountRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User "${userId}" was not found.`);
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
      hubCodes: user.hubCodes,
    };
  }

  private toUserAccountView(user: UserAccount): UserAccountView {
    return {
      id: user.id,
      username: user.username,
      status: user.status,
      roles: user.roles,
      displayName: user.displayName,
      phone: user.phone,
      hubCodes: user.hubCodes,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private normalizeCreateUserInput(input: UserCreateInput): {
    username: string;
    password: string;
    roles: string[];
    status: UserStatus;
    displayName: string | null;
    phone: string | null;
    hubCodes: string[];
  } {
    const username = this.normalizeRequiredText(input.username, 'username', 64);
    const password = this.normalizeRequiredText(input.password, 'password', 128);
    const roles = this.normalizeRoles(input.roles);

    return {
      username,
      password,
      roles,
      status: this.normalizeStatus(input.status, 'ACTIVE'),
      displayName: this.normalizeOptionalText(input.displayName, 120) ?? null,
      phone: this.normalizeOptionalText(input.phone, 30) ?? null,
      hubCodes: this.normalizeHubCodes(input.hubCodes),
    };
  }

  private normalizeUpdateUserInput(input: UserUpdateInput): {
    username?: string;
    password?: string;
    roles?: string[];
    status?: UserStatus;
    displayName?: string | null;
    phone?: string | null;
    hubCodes?: string[];
  } {
    const normalizedInput: {
      username?: string;
      password?: string;
      roles?: string[];
      status?: UserStatus;
      displayName?: string | null;
      phone?: string | null;
      hubCodes?: string[];
    } = {};

    if (input.username !== undefined) {
      normalizedInput.username = this.normalizeRequiredText(
        input.username,
        'username',
        64,
      );
    }

    if (input.password !== undefined) {
      normalizedInput.password = this.normalizeRequiredText(
        input.password,
        'password',
        128,
      );
    }

    if (input.roles !== undefined) {
      normalizedInput.roles = this.normalizeRoles(input.roles);
    }

    if (input.status !== undefined) {
      normalizedInput.status = this.normalizeStatus(input.status, 'ACTIVE');
    }

    if (input.displayName !== undefined) {
      normalizedInput.displayName = this.normalizeOptionalText(
        input.displayName,
        120,
      ) ?? null;
    }

    if (input.phone !== undefined) {
      normalizedInput.phone = this.normalizeOptionalText(input.phone, 30) ?? null;
    }

    if (input.hubCodes !== undefined) {
      normalizedInput.hubCodes = this.normalizeHubCodes(input.hubCodes);
    }

    return normalizedInput;
  }

  private normalizeRequiredText(
    value: unknown,
    field: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string.`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${field} is required.`);
    }

    if (normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${field} must be at most ${maxLength} characters.`,
      );
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Optional text fields must be strings.');
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return undefined;
    }

    if (normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `Optional text must be at most ${maxLength} characters.`,
      );
    }

    return normalizedValue;
  }

  private normalizeStatus(value: unknown, defaultValue: UserStatus): UserStatus {
    if (value === undefined || value === null) {
      return defaultValue;
    }

    if (value === 'ACTIVE' || value === 'DISABLED') {
      return value;
    }

    throw new BadRequestException('status must be ACTIVE or DISABLED.');
  }

  private normalizeStatusFilter(value: unknown): UserStatus | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.normalizeStatus(value, 'ACTIVE');
  }

  private normalizeRoles(value: unknown): string[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException('roles must be a non-empty string array.');
    }

    const roles = Array.from(
      new Set(
        value
          .map((item) => {
            if (typeof item !== 'string') {
              throw new BadRequestException('roles must be a string array.');
            }

            return item.trim().toUpperCase();
          })
          .filter((item) => item.length > 0),
      ),
    );

    if (roles.length === 0) {
      throw new BadRequestException('roles must contain at least one role.');
    }

    return roles;
  }

  private normalizeHubCodes(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException('hubCodes must be an array of strings.');
    }

    return Array.from(
      new Set(
        value
          .map((item) => {
            if (typeof item !== 'string') {
              throw new BadRequestException('hubCodes must be an array of strings.');
            }

            return item.trim().toUpperCase();
          })
          .filter((item) => item.length > 0),
      ),
    );
  }

  private normalizeOptionalCode(value: unknown): string | undefined {
    const normalizedValue = this.normalizeOptionalText(value, 64);
    return normalizedValue ? normalizedValue.toUpperCase() : undefined;
  }

  private normalizeRoleGroup(value: unknown): UserRoleGroup | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value === 'OPS' || value === 'SHIPPER') {
      return value;
    }

    throw new BadRequestException('roleGroup must be OPS or SHIPPER.');
  }
}
