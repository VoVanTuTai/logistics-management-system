import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { ChatMetricsService } from './chat.metrics';
import { ChatService } from './chat.service';
import type { ChatActor } from './chat.types';

const previousEnv = {
  CHAT_DATABASE_URL: process.env.CHAT_DATABASE_URL,
  CHAT_WS_TICKET_SECRET: process.env.CHAT_WS_TICKET_SECRET,
  CHAT_WS_TICKET_TTL_SECONDS: process.env.CHAT_WS_TICKET_TTL_SECONDS,
  GATEWAY_AUTH_ENABLED: process.env.GATEWAY_AUTH_ENABLED,
};

beforeEach(() => {
  delete process.env.CHAT_DATABASE_URL;
  process.env.CHAT_WS_TICKET_SECRET = 'unit-test-chat-ticket-secret';
  process.env.CHAT_WS_TICKET_TTL_SECONDS = '60';
  process.env.GATEWAY_AUTH_ENABLED = 'false';
});

afterEach(() => {
  restoreEnv('CHAT_DATABASE_URL', previousEnv.CHAT_DATABASE_URL);
  restoreEnv('CHAT_WS_TICKET_SECRET', previousEnv.CHAT_WS_TICKET_SECRET);
  restoreEnv('CHAT_WS_TICKET_TTL_SECONDS', previousEnv.CHAT_WS_TICKET_TTL_SECONDS);
  restoreEnv('GATEWAY_AUTH_ENABLED', previousEnv.GATEWAY_AUTH_ENABLED);
});

test('issues and verifies a short-lived WebSocket ticket', async () => {
  const service = createService();
  await service.onModuleInit();

  const actor: ChatActor = {
    role: 'COURIER',
    id: 'courier-user-1',
    displayName: 'Courier 30000001',
    courierId: '30000001',
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };
  const ticket = service.issueWebSocketTicket(actor);
  const resolvedActor = service.resolveActorFromWebSocketTicket(ticket.ticket);

  assert.equal(resolvedActor.role, actor.role);
  assert.equal(resolvedActor.id, actor.id);
  assert.equal(resolvedActor.courierId, actor.courierId);
  assert.equal(resolvedActor.displayName, actor.displayName);
  assert.ok(new Date(ticket.expiresAt).getTime() > Date.now());
});

test('paginates chat messages with a stable before cursor', async () => {
  const service = createService();
  await service.onModuleInit();

  const actor: ChatActor = {
    role: 'OPS',
    id: 'ops-user-1',
    displayName: 'Ops User',
    courierId: null,
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };

  await service.createMessage(actor, { courierId: '30000001', text: 'one' });
  await sleep(2);
  await service.createMessage(actor, { courierId: '30000001', text: 'two' });
  await sleep(2);
  await service.createMessage(actor, { courierId: '30000001', text: 'three' });

  const newestPage = await service.listMessages(actor, {
    courierId: '30000001',
    limit: 2,
  });
  assert.deepEqual(newestPage.items.map((item) => item.text), ['two', 'three']);
  assert.ok(newestPage.nextCursor);

  const olderPage = await service.listMessages(actor, {
    courierId: '30000001',
    before: newestPage.nextCursor,
    limit: 2,
  });
  assert.deepEqual(olderPage.items.map((item) => item.text), ['one']);
  assert.equal(olderPage.nextCursor, null);
});

test('resolves current OPS roles for chat access', async () => {
  const service = createService({
    introspect: async () => ({
      active: true,
      sessionId: 'session-1',
      user: {
        id: 'ops-user-1',
        username: '88000001',
        displayName: 'Ops HCM',
        roles: ['OPS_ADMIN'],
        hubCodes: ['HCM01'],
      },
      accessTokenExpiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
  });

  const actor = await service.resolveActor({
    authorizationHeader: 'Bearer token',
    roleHint: 'OPS',
  });

  assert.equal(actor.role, 'OPS');
  assert.deepEqual(actor.hubCodes, ['HCM01']);
});

test('blocks OPS chat to courier outside assigned hub', async () => {
  process.env.GATEWAY_AUTH_ENABLED = 'true';
  const service = createService({
    listUsers: async () => [
      {
        id: '30000001',
        username: '30000001',
        displayName: 'Courier Ha Noi',
        roles: ['COURIER'],
        hubCodes: ['HAN01'],
        status: 'ACTIVE',
      },
    ],
  });
  await service.onModuleInit();

  const actor: ChatActor = {
    role: 'OPS',
    id: 'ops-user-1',
    displayName: 'Ops HCM',
    courierId: null,
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };

  await assert.rejects(
    () => service.createMessage(actor, { courierId: '30000001', text: 'hello' }),
    /outside assigned hub/,
  );
});

test('tracks unread state separately for OPS users while sharing the courier thread', async () => {
  const service = createService();
  await service.onModuleInit();

  const courier: ChatActor = {
    role: 'COURIER',
    id: 'courier-user-1',
    displayName: 'Courier 30000001',
    courierId: '30000001',
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };
  const opsOne: ChatActor = {
    role: 'OPS',
    id: 'ops-user-1',
    displayName: 'Ops One',
    courierId: null,
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };
  const opsTwo: ChatActor = {
    role: 'OPS',
    id: 'ops-user-2',
    displayName: 'Ops Two',
    courierId: null,
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };

  await service.createMessage(courier, { courierId: '30000001', text: 'need help' });

  assert.equal((await service.listConversations(opsOne))[0]?.unreadCount, 1);
  assert.equal((await service.listConversations(opsTwo))[0]?.unreadCount, 1);

  await service.markRead(opsOne, { courierId: '30000001' });

  assert.equal((await service.listConversations(opsOne))[0]?.unreadCount, 0);
  assert.equal((await service.listConversations(opsTwo))[0]?.unreadCount, 1);

  const courierMessages = await service.listMessages(courier, {
    courierId: '30000001',
  });
  assert.ok(courierMessages.items[0]?.readByOpsAt);
});

test('allows OPS to claim a shared courier conversation', async () => {
  const service = createService();
  await service.onModuleInit();

  const actor: ChatActor = {
    role: 'OPS',
    id: 'ops-user-1',
    displayName: 'Ops HCM',
    courierId: null,
    hubCodes: ['HCM01'],
    canAccessAllHubs: false,
  };

  const conversation = await service.claimConversation(actor, {
    courierId: '30000001',
  });

  assert.equal(conversation.assignedOpsId, actor.id);
  assert.equal(conversation.assignedOpsName, actor.displayName);
  assert.ok(conversation.assignedOpsAt);
});

function createService(authClientOverrides: Record<string, unknown> = {}): ChatService {
  return new ChatService(
    {
      introspect: async () => ({
        active: false,
        sessionId: null,
        user: null,
        accessTokenExpiresAt: null,
      }),
      listUsers: async () => [],
      ...authClientOverrides,
    } as never,
    new ChatMetricsService(),
  );
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
