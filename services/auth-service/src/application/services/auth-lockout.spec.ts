import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { HashService } from '../../infrastructure/security/hash.service';
import { OpaqueTokenService } from '../../infrastructure/security/opaque-token.service';

function createAuthServiceFixture() {
  const hashService = new HashService();
  const validPasswordHash = hashService.digest('Ops@2026');
  const auditLogs: Array<Record<string, unknown>> = [];

  const mockUser = {
    id: 'usr_ops_01',
    username: '20000101',
    passwordHash: validPasswordHash,
    displayName: 'OPS Hub 003P001',
    phone: '0909000001',
    email: 'ops@nexus.vn',
    roles: ['OPS'],
    hubCodes: ['003P001'],
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userAccountRepository = {
    findByUsername: async (u: string) => (u === mockUser.username ? mockUser : null),
  } as never;

  const authSessionRepository = {
    create: async (data: Record<string, unknown>) => ({
      id: 'sess_01',
      ...data,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  } as never;

  const authOutboxService = {
    enqueueSessionCreated: async () => undefined,
  } as never;

  const adminAuditService = {
    record: async (entry: Record<string, unknown>) => {
      auditLogs.push(entry);
    },
  } as never;

  const service = new AuthService(
    userAccountRepository,
    authSessionRepository,
    hashService,
    new OpaqueTokenService(),
    authOutboxService,
    adminAuditService,
  );

  return { service, auditLogs, username: mockUser.username };
}

test('TC-010: locks account with HTTP 429 ACCOUNT_LOCKED after 5 failed password attempts and records audit log', async () => {
  const { service, auditLogs, username } = createAuthServiceFixture();

  // First 4 failed attempts return 401 Unauthorized
  for (let i = 1; i <= 4; i += 1) {
    await assert.rejects(
      () => service.login({ username, password: 'WrongPassword', roleGroup: 'OPS' }),
      (err: unknown) => err instanceof UnauthorizedException,
    );
    const status = service.getLoginLockoutStatus(username);
    assert.equal(status.isLocked, false);
    assert.equal(status.attempts, i);
  }

  // 5th failed attempt triggers ACCOUNT_LOCKED (HTTP 429) and writes audit entry
  await assert.rejects(
    () => service.login({ username, password: 'WrongPassword', roleGroup: 'OPS' }),
    (err: unknown) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const body = err.getResponse() as { code?: string; retryAfterSeconds?: number };
      assert.equal(body.code, 'ACCOUNT_LOCKED');
      assert.ok((body.retryAfterSeconds ?? 0) > 0);
      return true;
    },
  );

  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].action, 'AUTH_ACCOUNT_LOCKED');

  // Even the correct password is blocked while lockout is active
  await assert.rejects(
    () => service.login({ username, password: 'Ops@2026', roleGroup: 'OPS' }),
    (err: unknown) => err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS,
  );

  // After lockout clears, valid login succeeds and resets attempts
  service.clearLoginLockout(username);
  const result = await service.login({ username, password: 'Ops@2026', roleGroup: 'OPS' });
  assert.equal(result.user.username, username);
  assert.equal(service.getLoginLockoutStatus(username).attempts, 0);
});
