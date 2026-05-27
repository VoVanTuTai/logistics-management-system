import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Pool } from 'pg';

import {
  AuthServiceClient,
  type AuthenticatedUserView,
} from '../../infrastructure/clients/auth-service.client';
import { runChatMigrations } from './chat.migrations';
import { ChatMetricsService } from './chat.metrics';
import type {
  ChatActor,
  ChatActorRole,
  ChatConversationDto,
  ChatMessageDto,
  ChatMessagePageDto,
  ChatWebSocketTicketDto,
} from './chat.types';

const MAX_MESSAGE_HISTORY = 500;
const DEFAULT_MESSAGES_LIMIT = 50;
const MAX_MESSAGES_LIMIT = 100;
const OPS_ROLE_HINTS = new Set(['OPS', 'ADMIN', 'HUB', 'DISPATCHER', 'SUPERVISOR']);

interface ChatMessagePageOptions {
  before?: string | null;
  limit: number;
}

interface ChatStore {
  init(): Promise<void>;
  close(): Promise<void>;
  listConversations(actor: ChatActor): Promise<ChatConversationDto[]>;
  listMessages(
    actor: ChatActor,
    conversationId: string,
    options: ChatMessagePageOptions,
  ): Promise<ChatMessagePageDto>;
  createMessage(input: {
    actor: ChatActor;
    courierId: string;
    text: string;
  }): Promise<{ message: ChatMessageDto; conversation: ChatConversationDto }>;
  markRead(input: {
    actor: ChatActor;
    conversationId: string;
  }): Promise<ChatConversationDto>;
}

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatService.name);
  private readonly store: ChatStore;

  constructor(
    private readonly authServiceClient: AuthServiceClient,
    private readonly metrics: ChatMetricsService,
  ) {
    this.store = process.env.CHAT_DATABASE_URL
      ? new PostgresChatStore(process.env.CHAT_DATABASE_URL)
      : new MemoryChatStore();
  }

  async onModuleInit(): Promise<void> {
    await this.store.init();
    this.logger.log(
      process.env.CHAT_DATABASE_URL
        ? 'Chat store initialized with PostgreSQL.'
        : 'Chat store initialized in memory. Set CHAT_DATABASE_URL for persistence.',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.store.close();
  }

  async resolveActor(input: {
    authorizationHeader?: string | string[] | null;
    roleHint?: string | null;
    courierIdHint?: string | null;
  }): Promise<ChatActor> {
    const accessToken = extractBearerToken(input.authorizationHeader);
    const hintedRole = normalizeRole(input.roleHint);
    const courierIdHint = normalizeOptionalText(input.courierIdHint);

    if (accessToken) {
      const introspection = await this.authServiceClient.introspect(accessToken);
      if (!introspection.active || !introspection.user) {
        throw new UnauthorizedException('Chat access token is inactive.');
      }

      const inferredRole = inferRoleFromUser(introspection.user);
      if (hintedRole === 'OPS' && inferredRole !== 'OPS') {
        throw new UnauthorizedException('User is not allowed to open OPS chat.');
      }

      const role = hintedRole ?? inferredRole;
      return {
        role,
        id: introspection.user.id,
        displayName:
          introspection.user.displayName ??
          introspection.user.username ??
          introspection.user.id,
        courierId:
          role === 'COURIER'
            ? introspection.user.username
            : courierIdHint,
      };
    }

    if (process.env.GATEWAY_AUTH_ENABLED === 'true') {
      throw new UnauthorizedException('Missing chat Authorization header.');
    }

    const role = hintedRole ?? 'OPS';
    const devCourierId = courierIdHint ?? process.env.EXPO_PUBLIC_COURIER_ID ?? '30000001';

    return {
      role,
      id: role === 'COURIER' ? devCourierId : 'ops-dev',
      displayName: role === 'COURIER' ? `Courier ${devCourierId}` : 'Ops Dev',
      courierId: role === 'COURIER' ? devCourierId : courierIdHint,
    };
  }

  listConversations(actor: ChatActor): Promise<ChatConversationDto[]> {
    return this.store.listConversations(actor);
  }

  listMessages(
    actor: ChatActor,
    input: {
      conversationId?: string | null;
      courierId?: string | null;
      before?: string | null;
      limit?: string | number | null;
    },
  ): Promise<ChatMessagePageDto> {
    const conversationId = this.resolveConversationId(actor, input);
    return this.store.listMessages(
      actor,
      conversationId,
      normalizeMessagePageOptions(input.limit, input.before),
    );
  }

  async createMessage(actor: ChatActor, input: {
    courierId?: string | null;
    text?: string | null;
  }): Promise<{ message: ChatMessageDto; conversation: ChatConversationDto }> {
    const courierId = this.resolveCourierId(actor, input.courierId);
    const text = normalizeOptionalText(input.text);

    if (!text) {
      throw new BadRequestException('Message text is required.');
    }

    if (text.length > 2000) {
      throw new BadRequestException('Message text must be at most 2000 characters.');
    }

    try {
      const result = await this.store.createMessage({
        actor,
        courierId,
        text,
      });
      this.metrics.increment('chat_messages_created_total');
      this.logger.log(
        `Chat message created conversationId=${result.message.conversationId} messageId=${result.message.id} senderRole=${actor.role}`,
      );
      return result;
    } catch (error) {
      this.metrics.increment('chat_store_errors_total');
      throw error;
    }
  }

  async markRead(
    actor: ChatActor,
    input: {
      conversationId?: string | null;
      courierId?: string | null;
    },
  ): Promise<ChatConversationDto> {
    const conversationId = this.resolveConversationId(actor, input);
    try {
      const conversation = await this.store.markRead({ actor, conversationId });
      this.metrics.increment('chat_read_marks_total');
      this.logger.log(
        `Chat read marked conversationId=${conversationId} actorRole=${actor.role}`,
      );
      return conversation;
    } catch (error) {
      this.metrics.increment('chat_store_errors_total');
      throw error;
    }
  }

  issueWebSocketTicket(actor: ChatActor): ChatWebSocketTicketDto {
    const ttlSeconds = normalizeTicketTtlSeconds(process.env.CHAT_WS_TICKET_TTL_SECONDS);
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    const payload: ChatTicketPayload = {
      v: 1,
      sub: actor.id,
      role: actor.role,
      displayName: actor.displayName,
      courierId: actor.courierId,
      exp: Math.floor(expiresAtMs / 1000),
      jti: randomUUID(),
    };

    this.metrics.increment('chat_ws_tickets_issued_total');
    return {
      ticket: signTicket(payload),
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  resolveActorFromWebSocketTicket(ticket: string | null): ChatActor {
    const payload = verifyTicket(ticket);
    return {
      role: payload.role,
      id: payload.sub,
      displayName: payload.displayName,
      courierId: payload.courierId,
    };
  }

  canReceive(actor: ChatActor, message: ChatMessageDto): boolean {
    return actor.role === 'OPS' || actor.courierId === message.courierId;
  }

  canReceiveConversation(actor: ChatActor, conversation: ChatConversationDto): boolean {
    return actor.role === 'OPS' || actor.courierId === conversation.courierId;
  }

  private resolveConversationId(
    actor: ChatActor,
    input: {
      conversationId?: string | null;
      courierId?: string | null;
    },
  ): string {
    const conversationId = normalizeOptionalText(input.conversationId);
    if (conversationId) {
      const courierId = parseCourierIdFromConversationId(conversationId);
      if (!courierId) {
        throw new BadRequestException('Invalid conversationId.');
      }

      if (actor.role === 'COURIER' && actor.courierId !== courierId) {
        throw new UnauthorizedException('Courier cannot access another conversation.');
      }

      return conversationId;
    }

    return buildConversationId(this.resolveCourierId(actor, input.courierId));
  }

  private resolveCourierId(actor: ChatActor, courierIdInput?: string | null): string {
    const courierId = actor.role === 'COURIER'
      ? actor.courierId
      : normalizeOptionalText(courierIdInput);

    if (!courierId) {
      throw new BadRequestException('courierId is required for OPS chat.');
    }

    return courierId;
  }
}

class MemoryChatStore implements ChatStore {
  private readonly messagesByConversation = new Map<string, ChatMessageDto[]>();
  private readonly readsByConversation = new Map<string, Map<string, string>>();

  async init(): Promise<void> {}

  async close(): Promise<void> {}

  async listConversations(actor: ChatActor): Promise<ChatConversationDto[]> {
    const conversations = Array.from(this.messagesByConversation.entries())
      .map(([conversationId, messages]) =>
        this.toConversation(conversationId, messages, actor),
      )
      .filter((conversation): conversation is ChatConversationDto => {
        if (!conversation) {
          return false;
        }

        return actor.role === 'OPS' || conversation.courierId === actor.courierId;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    if (
      actor.role === 'COURIER' &&
      actor.courierId &&
      !conversations.some((item) => item.courierId === actor.courierId)
    ) {
      return [createEmptyConversation(actor.courierId, this.getLastReadAt(buildConversationId(actor.courierId), actor))];
    }

    return conversations;
  }

  async listMessages(
    actor: ChatActor,
    conversationId: string,
    options: ChatMessagePageOptions,
  ): Promise<ChatMessagePageDto> {
    const cursor = decodeCursor(options.before);
    const messages = (this.messagesByConversation.get(conversationId) ?? [])
      .filter((message) => isBeforeCursor(message, cursor))
      .map((message) => this.withReadReceipt(message));
    const pageItems = messages.slice(-options.limit);
    const remainingCount = messages.length - pageItems.length;

    return {
      items: pageItems,
      nextCursor: remainingCount > 0 ? encodeCursor(pageItems[0]) : null,
    };
  }

  async createMessage(input: {
    actor: ChatActor;
    courierId: string;
    text: string;
  }): Promise<{ message: ChatMessageDto; conversation: ChatConversationDto }> {
    const conversationId = buildConversationId(input.courierId);
    const messages = this.messagesByConversation.get(conversationId) ?? [];
    const message: ChatMessageDto = {
      id: randomUUID(),
      conversationId,
      courierId: input.courierId,
      senderRole: input.actor.role,
      senderId: input.actor.id,
      senderName: input.actor.displayName,
      text: input.text,
      createdAt: new Date().toISOString(),
      readByOpsAt: null,
      readByCourierAt: null,
    };

    messages.push(message);
    if (messages.length > MAX_MESSAGE_HISTORY) {
      messages.splice(0, messages.length - MAX_MESSAGE_HISTORY);
    }

    this.messagesByConversation.set(conversationId, messages);
    this.setLastReadAt(conversationId, input.actor, message.createdAt);

    return {
      message: this.withReadReceipt(message),
      conversation:
        this.toConversation(conversationId, messages, input.actor) ??
        createEmptyConversation(input.courierId, this.getLastReadAt(conversationId, input.actor)),
    };
  }

  async markRead(input: {
    actor: ChatActor;
    conversationId: string;
  }): Promise<ChatConversationDto> {
    const now = new Date().toISOString();
    this.setLastReadAt(input.conversationId, input.actor, now);
    const messages = this.messagesByConversation.get(input.conversationId) ?? [];
    const courierId = parseCourierIdFromConversationId(input.conversationId);

    return (
      this.toConversation(input.conversationId, messages, input.actor) ??
      createEmptyConversation(courierId ?? '', now)
    );
  }

  private toConversation(
    conversationId: string,
    messages: ChatMessageDto[],
    actor: ChatActor,
  ): ChatConversationDto | null {
    const lastMessage = messages[messages.length - 1] ?? null;
    const courierId =
      lastMessage?.courierId ?? parseCourierIdFromConversationId(conversationId);

    if (!courierId) {
      return null;
    }

    const lastReadAt = this.getLastReadAt(conversationId, actor);
    const unreadCount = countUnread(messages, actor, lastReadAt);

    return {
      id: conversationId,
      courierId,
      title: `Courier ${courierId}`,
      lastMessage: lastMessage ? this.withReadReceipt(lastMessage) : null,
      updatedAt: lastMessage?.createdAt ?? new Date(0).toISOString(),
      messageCount: messages.length,
      unreadCount,
      lastReadAt,
    };
  }

  private withReadReceipt(message: ChatMessageDto): ChatMessageDto {
    const opsReadAt = this.readsByConversation
      .get(message.conversationId)
      ?.get(readKey('OPS', 'ops'));
    const courierReadAt = this.readsByConversation
      .get(message.conversationId)
      ?.get(readKey('COURIER', message.courierId));

    return {
      ...message,
      readByOpsAt:
        opsReadAt && message.senderRole === 'COURIER' && opsReadAt >= message.createdAt
          ? opsReadAt
          : null,
      readByCourierAt:
        courierReadAt && message.senderRole === 'OPS' && courierReadAt >= message.createdAt
          ? courierReadAt
          : null,
    };
  }

  private getLastReadAt(conversationId: string, actor: ChatActor): string | null {
    return this.readsByConversation.get(conversationId)?.get(readKeyForActor(actor)) ?? null;
  }

  private setLastReadAt(
    conversationId: string,
    actor: ChatActor,
    readAt: string,
  ): void {
    const reads = this.readsByConversation.get(conversationId) ?? new Map<string, string>();
    reads.set(readKeyForActor(actor), readAt);
    this.readsByConversation.set(conversationId, reads);
  }
}

class PostgresChatStore implements ChatStore {
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.CHAT_DATABASE_POOL_MAX ?? '10'),
    });
  }

  async init(): Promise<void> {
    await runChatMigrations(this.pool);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async listConversations(actor: ChatActor): Promise<ChatConversationDto[]> {
    const params: unknown[] = [
      actor.role,
      receiptActorId(actor),
      actor.role,
      actor.role === 'OPS' ? null : actor.courierId,
    ];
    const result = await this.pool.query<ConversationRow>(
      `
      SELECT
        c.id,
        c.courier_id,
        c.title,
        c.updated_at,
        COUNT(m.id)::int AS message_count,
        rr.last_read_at,
        COUNT(unread.id)::int AS unread_count,
        lm.id AS last_message_id,
        lm.sender_role AS last_sender_role,
        lm.sender_id AS last_sender_id,
        lm.sender_name AS last_sender_name,
        lm.text AS last_text,
        lm.created_at AS last_created_at,
        ops_rr.last_read_at AS ops_read_at,
        courier_rr.last_read_at AS courier_read_at
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON m.conversation_id = c.id
      LEFT JOIN LATERAL (
        SELECT *
        FROM chat_messages cm
        WHERE cm.conversation_id = c.id
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN chat_read_receipts rr
        ON rr.conversation_id = c.id
        AND rr.actor_role = $1
        AND rr.actor_id = $2
      LEFT JOIN chat_read_receipts ops_rr
        ON ops_rr.conversation_id = c.id
        AND ops_rr.actor_role = 'OPS'
        AND ops_rr.actor_id = 'ops'
      LEFT JOIN chat_read_receipts courier_rr
        ON courier_rr.conversation_id = c.id
        AND courier_rr.actor_role = 'COURIER'
        AND courier_rr.actor_id = c.courier_id
      LEFT JOIN chat_messages unread
        ON unread.conversation_id = c.id
        AND unread.sender_role <> $3
        AND (rr.last_read_at IS NULL OR unread.created_at > rr.last_read_at)
      WHERE ($4::text IS NULL OR c.courier_id = $4)
      GROUP BY c.id, rr.last_read_at, lm.id, lm.sender_role, lm.sender_id,
        lm.sender_name, lm.text, lm.created_at, ops_rr.last_read_at, courier_rr.last_read_at
      ORDER BY c.updated_at DESC
      `,
      params,
    );
    const conversations = result.rows.map((row) => rowToConversation(row));

    if (
      actor.role === 'COURIER' &&
      actor.courierId &&
      conversations.length === 0
    ) {
      return [createEmptyConversation(actor.courierId, null)];
    }

    return conversations;
  }

  async listMessages(
    actor: ChatActor,
    conversationId: string,
    options: ChatMessagePageOptions,
  ): Promise<ChatMessagePageDto> {
    const cursor = decodeCursor(options.before);
    const result = await this.pool.query<MessageRow>(
      `
      SELECT *
      FROM (
        SELECT
          m.*,
          ops_rr.last_read_at AS ops_read_at,
          courier_rr.last_read_at AS courier_read_at
        FROM chat_messages m
        LEFT JOIN chat_read_receipts ops_rr
          ON ops_rr.conversation_id = m.conversation_id
          AND ops_rr.actor_role = 'OPS'
          AND ops_rr.actor_id = 'ops'
        LEFT JOIN chat_read_receipts courier_rr
          ON courier_rr.conversation_id = m.conversation_id
          AND courier_rr.actor_role = 'COURIER'
          AND courier_rr.actor_id = m.courier_id
        WHERE m.conversation_id = $1
          AND (
            $2::timestamptz IS NULL
            OR (m.created_at, m.id) < ($2::timestamptz, $3::text)
          )
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT $4
      ) page
      ORDER BY page.created_at ASC, page.id ASC
      `,
      [
        conversationId,
        cursor?.createdAt ?? null,
        cursor?.id ?? null,
        options.limit + 1,
      ],
    );

    const rows = result.rows;
    const hasMore = rows.length > options.limit;
    const items = (hasMore ? rows.slice(1) : rows).map(rowToMessage);

    return {
      items,
      nextCursor: hasMore && items[0] ? encodeCursor(items[0]) : null,
    };
  }

  async createMessage(input: {
    actor: ChatActor;
    courierId: string;
    text: string;
  }): Promise<{ message: ChatMessageDto; conversation: ChatConversationDto }> {
    const conversationId = buildConversationId(input.courierId);
    const id = randomUUID();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `
        INSERT INTO chat_conversations (id, courier_id, title, created_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT (id)
        DO UPDATE SET updated_at = now(), title = EXCLUDED.title
        `,
        [conversationId, input.courierId, `Courier ${input.courierId}`],
      );
      const messageResult = await client.query<MessageRow>(
        `
        INSERT INTO chat_messages (
          id, conversation_id, courier_id, sender_role, sender_id,
          sender_name, text, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        RETURNING *,
          NULL::timestamptz AS ops_read_at,
          NULL::timestamptz AS courier_read_at
        `,
        [
          id,
          conversationId,
          input.courierId,
          input.actor.role,
          input.actor.id,
          input.actor.displayName,
          input.text,
        ],
      );
      await upsertReadReceipt(client, {
        actor: input.actor,
        conversationId,
        readAtSql: 'now()',
      });
      await client.query('COMMIT');

      const message = rowToMessage(messageResult.rows[0]);
      return {
        message,
        conversation: await this.getConversationForActor(input.actor, conversationId),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markRead(input: {
    actor: ChatActor;
    conversationId: string;
  }): Promise<ChatConversationDto> {
    await this.pool.query(
      `
      INSERT INTO chat_conversations (id, courier_id, title, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (id) DO NOTHING
      `,
      [
        input.conversationId,
        parseCourierIdFromConversationId(input.conversationId),
        `Courier ${parseCourierIdFromConversationId(input.conversationId) ?? ''}`,
      ],
    );
    await upsertReadReceipt(this.pool, {
      actor: input.actor,
      conversationId: input.conversationId,
      readAtSql: 'now()',
    });

    return this.getConversationForActor(input.actor, input.conversationId);
  }

  private async getConversationForActor(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ChatConversationDto> {
    const conversations = await this.listConversations(actor);
    const conversation = conversations.find((item) => item.id === conversationId);
    if (conversation) {
      return conversation;
    }

    const courierId = parseCourierIdFromConversationId(conversationId) ?? '';
    return createEmptyConversation(courierId, null);
  }
}

interface MessageRow {
  id: string;
  conversation_id: string;
  courier_id: string;
  sender_role: ChatActorRole;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: Date | string;
  ops_read_at: Date | string | null;
  courier_read_at: Date | string | null;
}

interface ConversationRow {
  id: string;
  courier_id: string;
  title: string;
  updated_at: Date | string;
  message_count: number;
  unread_count: number;
  last_read_at: Date | string | null;
  last_message_id: string | null;
  last_sender_role: ChatActorRole | null;
  last_sender_id: string | null;
  last_sender_name: string | null;
  last_text: string | null;
  last_created_at: Date | string | null;
  ops_read_at: Date | string | null;
  courier_read_at: Date | string | null;
}

interface ChatCursor {
  createdAt: string;
  id: string;
}

interface ChatTicketPayload {
  v: 1;
  sub: string;
  role: ChatActorRole;
  displayName: string;
  courierId: string | null;
  exp: number;
  jti: string;
}

export function buildConversationId(courierId: string): string {
  return `courier:${courierId}`;
}

function createEmptyConversation(
  courierId: string,
  lastReadAt: string | null,
): ChatConversationDto {
  return {
    id: buildConversationId(courierId),
    courierId,
    title: `Courier ${courierId}`,
    lastMessage: null,
    updatedAt: new Date(0).toISOString(),
    messageCount: 0,
    unreadCount: 0,
    lastReadAt,
  };
}

function rowToConversation(row: ConversationRow): ChatConversationDto {
  const lastMessage: ChatMessageDto | null = row.last_message_id
    ? {
        id: row.last_message_id,
        conversationId: row.id,
        courierId: row.courier_id,
        senderRole: row.last_sender_role ?? 'OPS',
        senderId: row.last_sender_id ?? '',
        senderName: row.last_sender_name ?? '',
        text: row.last_text ?? '',
        createdAt: toIso(row.last_created_at),
        readByOpsAt:
          row.last_sender_role === 'COURIER' &&
          row.ops_read_at &&
          toIso(row.ops_read_at) >= toIso(row.last_created_at)
            ? toIso(row.ops_read_at)
            : null,
        readByCourierAt:
          row.last_sender_role === 'OPS' &&
          row.courier_read_at &&
          toIso(row.courier_read_at) >= toIso(row.last_created_at)
            ? toIso(row.courier_read_at)
            : null,
      }
    : null;

  return {
    id: row.id,
    courierId: row.courier_id,
    title: row.title,
    lastMessage,
    updatedAt: toIso(row.updated_at),
    messageCount: Number(row.message_count),
    unreadCount: Number(row.unread_count),
    lastReadAt: row.last_read_at ? toIso(row.last_read_at) : null,
  };
}

function rowToMessage(row: MessageRow): ChatMessageDto {
  const createdAt = toIso(row.created_at);
  const opsReadAt = row.ops_read_at ? toIso(row.ops_read_at) : null;
  const courierReadAt = row.courier_read_at ? toIso(row.courier_read_at) : null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    courierId: row.courier_id,
    senderRole: row.sender_role,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.text,
    createdAt,
    readByOpsAt:
      row.sender_role === 'COURIER' && opsReadAt && opsReadAt >= createdAt
        ? opsReadAt
        : null,
    readByCourierAt:
      row.sender_role === 'OPS' && courierReadAt && courierReadAt >= createdAt
        ? courierReadAt
        : null,
  };
}

async function upsertReadReceipt(
  queryable: Pick<Pool, 'query'>,
  input: {
    actor: ChatActor;
    conversationId: string;
    readAtSql: string;
  },
): Promise<void> {
  await queryable.query(
    `
    INSERT INTO chat_read_receipts (
      conversation_id, actor_role, actor_id, last_read_at, updated_at
    )
    VALUES ($1, $2, $3, ${input.readAtSql}, now())
    ON CONFLICT (conversation_id, actor_role, actor_id)
    DO UPDATE SET
      last_read_at = GREATEST(chat_read_receipts.last_read_at, EXCLUDED.last_read_at),
      updated_at = now()
    `,
    [input.conversationId, input.actor.role, receiptActorId(input.actor)],
  );
}

function countUnread(
  messages: ChatMessageDto[],
  actor: ChatActor,
  lastReadAt: string | null,
): number {
  return messages.filter(
    (message) =>
      message.senderRole !== actor.role &&
      (!lastReadAt || message.createdAt > lastReadAt),
  ).length;
}

function normalizeMessagePageOptions(
  limitInput?: string | number | null,
  before?: string | null,
): ChatMessagePageOptions {
  const parsedLimit = Number(limitInput ?? DEFAULT_MESSAGES_LIMIT);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(MAX_MESSAGES_LIMIT, Math.max(1, Math.floor(parsedLimit)))
    : DEFAULT_MESSAGES_LIMIT;

  return {
    before: normalizeOptionalText(before),
    limit,
  };
}

function encodeCursor(message: Pick<ChatMessageDto, 'createdAt' | 'id'>): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: message.createdAt,
      id: message.id,
    }),
    'utf8',
  ).toString('base64url');
}

function decodeCursor(cursor?: string | null): ChatCursor | null {
  const normalizedCursor = normalizeOptionalText(cursor);
  if (!normalizedCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(normalizedCursor, 'base64url').toString('utf8')) as
      Partial<ChatCursor>;
    if (
      typeof parsed.createdAt === 'string' &&
      typeof parsed.id === 'string' &&
      parsed.id.length > 0 &&
      !Number.isNaN(new Date(parsed.createdAt).getTime())
    ) {
      return parsed as ChatCursor;
    }
  } catch {
    throw new BadRequestException('Invalid chat pagination cursor.');
  }

  throw new BadRequestException('Invalid chat pagination cursor.');
}

function isBeforeCursor(message: ChatMessageDto, cursor: ChatCursor | null): boolean {
  if (!cursor) {
    return true;
  }

  return (
    message.createdAt < cursor.createdAt ||
    (message.createdAt === cursor.createdAt && message.id < cursor.id)
  );
}

function readKeyForActor(actor: ChatActor): string {
  return readKey(actor.role, receiptActorId(actor));
}

function readKey(role: ChatActorRole, actorId: string): string {
  return `${role}:${actorId}`;
}

function receiptActorId(actor: ChatActor): string {
  return actor.role === 'OPS' ? 'ops' : actor.courierId ?? actor.id;
}

function signTicket(payload: ChatTicketPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', getTicketSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifyTicket(ticket: string | null): ChatTicketPayload {
  const normalizedTicket = normalizeOptionalText(ticket);
  if (!normalizedTicket) {
    throw new UnauthorizedException('Missing chat WebSocket ticket.');
  }

  const [encodedPayload, signature] = normalizedTicket.split('.');
  if (!encodedPayload || !signature) {
    throw new UnauthorizedException('Invalid chat WebSocket ticket.');
  }

  const expectedSignature = createHmac('sha256', getTicketSecret())
    .update(encodedPayload)
    .digest('base64url');
  if (!safeEqual(signature, expectedSignature)) {
    throw new UnauthorizedException('Invalid chat WebSocket ticket.');
  }

  let payload: Partial<ChatTicketPayload>;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as
      Partial<ChatTicketPayload>;
  } catch {
    throw new UnauthorizedException('Invalid chat WebSocket ticket.');
  }

  if (!isValidTicketPayload(payload)) {
    throw new UnauthorizedException('Invalid chat WebSocket ticket.');
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Chat WebSocket ticket expired.');
  }

  return payload;
}

function isValidTicketPayload(payload: Partial<ChatTicketPayload>): payload is ChatTicketPayload {
  return (
    payload.v === 1 &&
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    (payload.role === 'OPS' || payload.role === 'COURIER') &&
    typeof payload.displayName === 'string' &&
    (typeof payload.courierId === 'string' || payload.courierId === null) &&
    typeof payload.exp === 'number' &&
    Number.isFinite(payload.exp) &&
    typeof payload.jti === 'string' &&
    payload.jti.length > 0
  );
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getTicketSecret(): string {
  const secret = process.env.CHAT_WS_TICKET_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.GATEWAY_AUTH_ENABLED === 'true') {
    throw new UnauthorizedException('CHAT_WS_TICKET_SECRET is required.');
  }

  return 'dev-chat-ticket-secret';
}

function normalizeTicketTtlSeconds(value?: string): number {
  const parsed = Number(value ?? '60');
  if (!Number.isFinite(parsed)) {
    return 60;
  }

  return Math.min(300, Math.max(10, Math.floor(parsed)));
}

function parseCourierIdFromConversationId(conversationId: string): string | null {
  const match = /^courier:(.+)$/.exec(conversationId);
  return match?.[1] ?? null;
}

function extractBearerToken(
  authorizationHeader?: string | string[] | null,
): string | null {
  const rawHeader = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const match = /^Bearer\s+(.+)$/i.exec(rawHeader ?? '');
  return match?.[1]?.trim() || null;
}

function normalizeRole(value?: string | null): ChatActorRole | null {
  const normalizedValue = value?.trim().toUpperCase();
  if (normalizedValue === 'OPS' || normalizedValue === 'COURIER') {
    return normalizedValue;
  }

  return null;
}

function inferRoleFromUser(user: AuthenticatedUserView): ChatActorRole {
  return user.roles.some((role) => OPS_ROLE_HINTS.has(role.trim().toUpperCase()))
    ? 'OPS'
    : 'COURIER';
}

function normalizeOptionalText(value?: string | null): string | null {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : null;
}

function toIso(value: Date | string | null): string {
  if (!value) {
    return new Date(0).toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
