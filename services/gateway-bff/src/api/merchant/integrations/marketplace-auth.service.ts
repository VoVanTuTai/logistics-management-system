import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

interface AuthContext {
  partnerCode: string;
  apiKey: string;
}

interface ErrorDetail {
  field?: string;
  reason: string;
}

@Injectable()
export class MarketplaceAuthService {
  private readonly seenNonces = new Map<string, number>();

  verify(request: RawBodyRequest): AuthContext {
    if (process.env.NEXUS_INTEGRATION_AUTH_ENABLED === 'false') {
      return {
        partnerCode: this.expectedPartnerCode,
        apiKey: 'auth-disabled',
      };
    }

    const apiSecret = this.requiredEnv(
      ['NEXUS_INTEGRATION_API_SECRET', 'PROD_NEXUS_API_SECRET'],
      'NEXUS_INTEGRATION_API_SECRET',
    );
    const expectedApiKey = this.requiredEnv(
      ['NEXUS_INTEGRATION_API_KEY', 'PROD_NEXUS_API_KEY'],
      'NEXUS_INTEGRATION_API_KEY',
    );
    const partnerCode = this.header(request, 'x-nexus-partner-code');
    const apiKey = this.header(request, 'x-nexus-api-key');
    const timestamp = this.header(request, 'x-nexus-timestamp');
    const nonce = this.header(request, 'x-nexus-nonce');
    const signature = this.header(request, 'x-nexus-signature');

    if (!partnerCode || !apiKey || !timestamp || !nonce || !signature) {
      this.fail(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Missing Nexus auth headers.');
    }

    if (partnerCode !== this.expectedPartnerCode || apiKey !== expectedApiKey) {
      this.fail(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Invalid partner code or API key.');
    }

    this.assertTimestamp(timestamp);
    this.assertNonceUnused(partnerCode, nonce);

    const expectedSignature = this.signRequest(request, timestamp, nonce, apiSecret);

    if (!this.safeEqual(signature, expectedSignature)) {
      this.fail(HttpStatus.FORBIDDEN, 'SIGNATURE_INVALID', 'Invalid request signature.');
    }

    this.rememberNonce(partnerCode, nonce);

    return { partnerCode, apiKey };
  }

  private get expectedPartnerCode(): string {
    return (
      process.env.NEXUS_INTEGRATION_PARTNER_CODE ??
      process.env.PROD_NEXUS_PARTNER_CODE ??
      'DT_COMMERCE'
    );
  }

  private requiredEnv(keys: string[], displayName: string): string {
    for (const key of keys) {
      const value = process.env[key]?.trim();

      if (value) {
        return value;
      }
    }

    this.fail(
      HttpStatus.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
      `${displayName} is not configured.`,
    );
  }

  private header(request: Request, name: string): string {
    const value = request.headers[name];

    if (Array.isArray(value)) {
      return value[0]?.trim() ?? '';
    }

    return value?.trim() ?? '';
  }

  private assertTimestamp(timestamp: string): void {
    const parsed = Date.parse(timestamp);

    if (!Number.isFinite(parsed)) {
      this.fail(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Invalid X-Nexus-Timestamp.');
    }

    const maxSkewMs = Number(process.env.NEXUS_INTEGRATION_TIMESTAMP_SKEW_MS ?? 300000);
    const skewMs = Math.abs(Date.now() - parsed);

    if (skewMs > maxSkewMs) {
      this.fail(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'X-Nexus-Timestamp expired.');
    }
  }

  private assertNonceUnused(partnerCode: string, nonce: string): void {
    const now = Date.now();

    for (const [key, expiresAt] of this.seenNonces.entries()) {
      if (expiresAt <= now) {
        this.seenNonces.delete(key);
      }
    }

    const nonceKey = `${partnerCode}:${nonce}`;

    if (this.seenNonces.has(nonceKey)) {
      this.fail(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'X-Nexus-Nonce was already used.');
    }
  }

  private rememberNonce(partnerCode: string, nonce: string): void {
    const ttlMs = Number(process.env.NEXUS_INTEGRATION_NONCE_TTL_MS ?? 86400000);

    this.seenNonces.set(`${partnerCode}:${nonce}`, Date.now() + ttlMs);
  }

  private signRequest(
    request: RawBodyRequest,
    timestamp: string,
    nonce: string,
    apiSecret: string,
  ): string {
    const path = request.originalUrl.split('?')[0] ?? request.path;
    const rawBody = request.rawBody ?? Buffer.alloc(0);
    const bodyHash = createHash('sha256').update(rawBody).digest('hex');
    const signingPayload = [
      request.method.toUpperCase(),
      path,
      timestamp,
      nonce,
      bodyHash,
    ].join('\n');

    return createHmac('sha256', apiSecret)
      .update(signingPayload)
      .digest('hex');
  }

  private safeEqual(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private fail(
    status: HttpStatus,
    code: string,
    message: string,
    details: ErrorDetail[] = [],
  ): never {
    throw new HttpException(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      status,
    );
  }
}
