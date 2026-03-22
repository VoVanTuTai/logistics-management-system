import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { AuthTokens } from '../../domain/entities/auth-session.entity';

@Injectable()
export class OpaqueTokenService {
  issueTokens(now = new Date()): AuthTokens {
    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
    const refreshTtlSeconds = Number(
      process.env.REFRESH_TOKEN_TTL_SECONDS ?? 2592000,
    );
    const accessTokenExpiresAt = new Date(
      now.getTime() + accessTtlSeconds * 1000,
    );
    const refreshTokenExpiresAt = new Date(
      now.getTime() + refreshTtlSeconds * 1000,
    );

    return {
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      tokenType: 'Bearer',
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      expiresInSeconds: accessTtlSeconds,
      refreshExpiresInSeconds: refreshTtlSeconds,
    };
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
