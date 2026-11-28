import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import { ChatHistoryMessage, ChatSessionContext } from '../chat.types';
import { extractTrackingCode } from '../guardrails/carrier-guardrails.service';

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 60 minutes
const MAX_HISTORY_MESSAGES = 20; // 10 turns
const MAX_MEMORY_SESSIONS = 2000;

export interface SessionStoreHealth {
  backend: 'redis' | 'postgres' | 'file' | 'memory';
  persistent: boolean;
  details: string;
}

/**
 * Minimal zero-dependency RESP2 Redis client for GET / SETEX / PING.
 * Avoids requiring external npm packages while speaking native Redis protocol.
 */
class LightweightRedisClient {
  private readonly host: string;
  private readonly port: number;
  private readonly password?: string;
  private readonly dbIndex: number;

  constructor(redisUrl: string) {
    const parsed = new URL(redisUrl);
    this.host = parsed.hostname || '127.0.0.1';
    this.port = parsed.port ? parseInt(parsed.port, 10) : 6379;
    this.password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
    const pathDb = parsed.pathname?.replace('/', '').trim();
    this.dbIndex = pathDb && /^\d+$/.test(pathDb) ? parseInt(pathDb, 10) : 0;
  }

  private encodeCommand(args: string[]): Buffer {
    const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`, 'utf8')];
    for (const arg of args) {
      const buf = Buffer.from(arg, 'utf8');
      parts.push(Buffer.from(`$${buf.length}\r\n`, 'utf8'), buf, Buffer.from('\r\n', 'utf8'));
    }
    return Buffer.concat(parts);
  }

  private execRaw(commands: string[][], timeoutMs = 1500): Promise<Array<string | null>> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      let buffer = Buffer.alloc(0);
      const results: Array<string | null> = [];
      let settled = false;

      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (err) reject(err);
        else resolve(results);
      };

      socket.setTimeout(timeoutMs, () => finish(new Error('Redis command timeout')));
      socket.on('error', (err) => finish(err));

      socket.on('connect', () => {
        const allCmds: string[][] = [];
        if (this.password) allCmds.push(['AUTH', this.password]);
        if (this.dbIndex > 0) allCmds.push(['SELECT', String(this.dbIndex)]);
        allCmds.push(...commands);
        socket.write(Buffer.concat(allCmds.map((c) => this.encodeCommand(c))));
      });

      const expectedCount =
        (this.password ? 1 : 0) + (this.dbIndex > 0 ? 1 : 0) + commands.length;

      const tryParseNext = (): boolean => {
        if (buffer.length === 0) return false;
        const prefix = String.fromCharCode(buffer[0]);
        const crlfIdx = buffer.indexOf('\r\n');
        if (crlfIdx === -1) return false;

        if (prefix === '+' || prefix === ':' || prefix === '-') {
          const line = buffer.slice(1, crlfIdx).toString('utf8');
          buffer = buffer.slice(crlfIdx + 2);
          if (prefix === '-') {
            finish(new Error(`Redis error: ${line}`));
            return false;
          }
          results.push(line);
          return true;
        }

        if (prefix === '$') {
          const len = parseInt(buffer.slice(1, crlfIdx).toString('utf8'), 10);
          if (len === -1) {
            buffer = buffer.slice(crlfIdx + 2);
            results.push(null);
            return true;
          }
          const totalNeeded = crlfIdx + 2 + len + 2;
          if (buffer.length < totalNeeded) return false;
          const payload = buffer.slice(crlfIdx + 2, crlfIdx + 2 + len).toString('utf8');
          buffer = buffer.slice(totalNeeded);
          results.push(payload);
          return true;
        }

        finish(new Error(`Unsupported RESP prefix: ${prefix}`));
        return false;
      };

      socket.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (tryParseNext()) {
          if (results.length >= expectedCount) {
            const offset = (this.password ? 1 : 0) + (this.dbIndex > 0 ? 1 : 0);
            settled = true;
            socket.destroy();
            resolve(results.slice(offset));
            return;
          }
        }
      });
    });
  }

  async ping(): Promise<boolean> {
    const res = await this.execRaw([['PING']]);
    return res[0] === 'PONG';
  }

  async get(key: string): Promise<string | null> {
    const res = await this.execRaw([['GET', key]]);
    return res[0] ?? null;
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.execRaw([['SETEX', key, String(Math.max(1, ttlSeconds)), value]]);
  }
}

/**
 * Multi-tier Persistent Session Store for Chatbot Service:
 * Priority: Redis (if reachable) -> PostgreSQL (if pg & CHATBOT_DATABASE_URL configured) -> Disk JSON / Memory Map.
 */
@Injectable()
export class ChatSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatSessionService.name);
  private readonly memoryCache = new Map<string, ChatSessionContext>();

  private redisClient: LightweightRedisClient | null = null;
  private redisAvailable = false;

  private pgPool: any = null;
  private pgAvailable = false;

  private sessionFilePath: string | null = null;
  private fileFlushTimer: NodeJS.Timeout | null = null;

  async onModuleInit(): Promise<void> {
    await this.initializeBackends();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.fileFlushTimer) {
      clearTimeout(this.fileFlushTimer);
      this.flushToFileSync();
    }
    if (this.pgPool && typeof this.pgPool.end === 'function') {
      try {
        await this.pgPool.end();
      } catch {
        // ignore close error
      }
    }
  }

  private async initializeBackends(): Promise<void> {
    const redisUrl = (process.env.CHATBOT_REDIS_URL || process.env.REDIS_URL || '').trim();
    if (redisUrl) {
      try {
        const client = new LightweightRedisClient(redisUrl);
        if (await client.ping()) {
          this.redisClient = client;
          this.redisAvailable = true;
          this.logger.log(`Session Store connected to Redis (${redisUrl.replace(/:[^:@]+@/, ':***@')})`);
        }
      } catch (err: any) {
        this.logger.warn(`Redis configured but unavailable (${err?.message}). Falling back cleanly.`);
      }
    }

    const pgUrl = (process.env.CHATBOT_DATABASE_URL || '').trim();
    if (pgUrl) {
      try {
        // Dynamically attempt to load 'pg' if installed in node_modules
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: pgUrl, max: 5, connectionTimeoutMillis: 2000 });
        await pool.query(`
          CREATE TABLE IF NOT EXISTS chatbot_sessions (
            conversation_id TEXT PRIMARY KEY,
            payload JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
        this.pgPool = pool;
        this.pgAvailable = true;
        this.logger.log('Session Store connected to PostgreSQL (chatbot_sessions)');
      } catch (err: any) {
        this.logger.warn(`PostgreSQL session store unavailable (${err?.message}). Falling back cleanly.`);
      }
    }

    const configuredFile = (process.env.CHATBOT_SESSION_FILE || '').trim();
    if (configuredFile) {
      this.sessionFilePath = path.resolve(configuredFile);
      this.loadFromFileSync();
    }
  }

  getHealthInfo(): SessionStoreHealth {
    if (this.redisAvailable) {
      return { backend: 'redis', persistent: true, details: 'Redis RESP2 + Memory L1 cache' };
    }
    if (this.pgAvailable) {
      return { backend: 'postgres', persistent: true, details: 'PostgreSQL chatbot_sessions + Memory L1 cache' };
    }
    if (this.sessionFilePath) {
      return { backend: 'file', persistent: true, details: `JSON snapshot (${this.sessionFilePath}) + Memory L1 cache` };
    }
    return { backend: 'memory', persistent: false, details: 'In-Memory LRU/TTL Map + client history hydration fallback' };
  }

  private redisKey(conversationId: string): string {
    return `nexus:chatbot:session:${conversationId}`;
  }

  private normalizeHistory(history?: ChatHistoryMessage[]): ChatHistoryMessage[] {
    if (!Array.isArray(history) || history.length === 0) return [];
    return history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({
        role: m.role,
        content: m.content.trim(),
        timestamp: m.timestamp || Date.now(),
      }));
  }

  private isExpired(session: ChatSessionContext): boolean {
    return Date.now() - (session.lastUpdated || 0) > DEFAULT_TTL_MS;
  }

  private pruneMemory(): void {
    const now = Date.now();
    for (const [key, val] of this.memoryCache.entries()) {
      if (now - val.lastUpdated > DEFAULT_TTL_MS) {
        this.memoryCache.delete(key);
      }
    }
    if (this.memoryCache.size > MAX_MEMORY_SESSIONS) {
      const oldestKeys = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated)
        .slice(0, this.memoryCache.size - MAX_MEMORY_SESSIONS);
      for (const [k] of oldestKeys) {
        this.memoryCache.delete(k);
      }
    }
  }

  async getSession(
    conversationId: string,
    clientHistory?: ChatHistoryMessage[],
    selectedShipmentCode?: string,
  ): Promise<ChatSessionContext> {
    let loaded: ChatSessionContext | null = null;

    // 1. L1 Memory Cache
    const cached = this.memoryCache.get(conversationId);
    if (cached && !this.isExpired(cached)) {
      loaded = cached;
    }

    // 2. Redis L2
    if (!loaded && this.redisAvailable && this.redisClient) {
      try {
        const raw = await this.redisClient.get(this.redisKey(conversationId));
        if (raw) {
          const parsed = JSON.parse(raw) as ChatSessionContext;
          if (!this.isExpired(parsed)) {
            loaded = { ...parsed, history: this.normalizeHistory(parsed.history) };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Redis GET failed for ${conversationId}: ${err?.message}`);
      }
    }

    // 3. PostgreSQL L3
    if (!loaded && this.pgAvailable && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          'SELECT payload FROM chatbot_sessions WHERE conversation_id = $1 LIMIT 1',
          [conversationId],
        );
        if (res.rows?.[0]?.payload) {
          const parsed = res.rows[0].payload as ChatSessionContext;
          if (!this.isExpired(parsed)) {
            loaded = { ...parsed, history: this.normalizeHistory(parsed.history) };
          }
        }
      } catch (err: any) {
        this.logger.warn(`PG SELECT failed for ${conversationId}: ${err?.message}`);
      }
    }

    if (!loaded) {
      loaded = {
        history: [],
        lastUpdated: Date.now(),
      };
    } else if (!Array.isArray(loaded.history)) {
      loaded.history = [];
    }

    // Hydrate from UI client history when server session is empty or client sends richer history
    const normalizedClientHistory = this.normalizeHistory(clientHistory);
    if (normalizedClientHistory.length > 0 && (loaded.history.length === 0 || normalizedClientHistory.length > loaded.history.length)) {
      loaded.history = normalizedClientHistory;
    }

    if (selectedShipmentCode && !loaded.selectedCode) {
      loaded.selectedCode = selectedShipmentCode.trim().toUpperCase();
    } else if (!loaded.selectedCode && loaded.history.length > 0) {
      // Recover latest tracking code directly from client-supplied history if omitted
      for (let i = loaded.history.length - 1; i >= 0; i--) {
        const recoveredCode = extractTrackingCode(loaded.history[i].content);
        if (recoveredCode) {
          loaded.selectedCode = recoveredCode;
          break;
        }
      }
    }

    this.memoryCache.set(conversationId, loaded);
    return loaded;
  }

  async saveSession(conversationId: string, session: ChatSessionContext): Promise<void> {
    const normalized: ChatSessionContext = {
      ...session,
      history: this.normalizeHistory(session.history),
      lastUpdated: Date.now(),
    };

    this.memoryCache.set(conversationId, normalized);
    this.pruneMemory();

    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.setEx(
          this.redisKey(conversationId),
          Math.floor(DEFAULT_TTL_MS / 1000),
          JSON.stringify(normalized),
        );
      } catch (err: any) {
        this.logger.warn(`Redis SETEX failed for ${conversationId}: ${err?.message}`);
      }
    }

    if (this.pgAvailable && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO chatbot_sessions (conversation_id, payload, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (conversation_id)
           DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [conversationId, JSON.stringify(normalized)],
        );
      } catch (err: any) {
        this.logger.warn(`PG UPSERT failed for ${conversationId}: ${err?.message}`);
      }
    }

    if (this.sessionFilePath) {
      this.scheduleFileFlush();
    }
  }

  /**
   * Append a completed User + Assistant turn together with any session state patch.
   */
  async commitTurn(
    conversationId: string,
    baseSession: ChatSessionContext,
    userMessage: string,
    assistantAnswer: string,
    patch?: Partial<ChatSessionContext>,
  ): Promise<ChatSessionContext> {
    const now = Date.now();
    const existingHistory = this.normalizeHistory(baseSession.history);

    const trimmedUser = userMessage.trim();
    const trimmedAssistant = assistantAnswer.trim();

    const nextHistory = [...existingHistory];
    if (trimmedUser) {
      nextHistory.push({ role: 'user', content: trimmedUser, timestamp: now });
    }
    if (trimmedAssistant) {
      nextHistory.push({ role: 'assistant', content: trimmedAssistant, timestamp: now + 1 });
    }

    const updated: ChatSessionContext = {
      ...baseSession,
      ...patch,
      history: nextHistory.slice(-MAX_HISTORY_MESSAGES),
      lastUpdated: now,
    };

    await this.saveSession(conversationId, updated);
    return updated;
  }

  private scheduleFileFlush(): void {
    if (this.fileFlushTimer) return;
    this.fileFlushTimer = setTimeout(() => {
      this.fileFlushTimer = null;
      this.flushToFileSync();
    }, 300);
  }

  private flushToFileSync(): void {
    if (!this.sessionFilePath) return;
    try {
      const dir = path.dirname(this.sessionFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data: Record<string, ChatSessionContext> = {};
      for (const [k, v] of this.memoryCache.entries()) {
        if (!this.isExpired(v)) data[k] = v;
      }
      fs.writeFileSync(this.sessionFilePath, JSON.stringify(data), 'utf8');
    } catch (err: any) {
      this.logger.warn(`Session file write failed: ${err?.message}`);
    }
  }

  private loadFromFileSync(): void {
    if (!this.sessionFilePath || !fs.existsSync(this.sessionFilePath)) return;
    try {
      const raw = fs.readFileSync(this.sessionFilePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, ChatSessionContext>;
      const now = Date.now();
      let count = 0;
      for (const [k, v] of Object.entries(parsed)) {
        if (v && now - (v.lastUpdated || 0) <= DEFAULT_TTL_MS) {
          this.memoryCache.set(k, { ...v, history: this.normalizeHistory(v.history) });
          count++;
        }
      }
      this.logger.log(`Hydrated ${count} chatbot sessions from ${this.sessionFilePath}`);
    } catch (err: any) {
      this.logger.warn(`Failed reading session snapshot ${this.sessionFilePath}: ${err?.message}`);
    }
  }
}
