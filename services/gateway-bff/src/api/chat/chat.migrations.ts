import { Logger } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';

interface ChatMigration {
  id: string;
  up: string;
}

const CHAT_MIGRATIONS: ChatMigration[] = [
  {
    id: '001_chat_schema',
    up: `
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        courier_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        courier_id TEXT NOT NULL,
        sender_role TEXT NOT NULL CHECK (sender_role IN ('OPS', 'COURIER')),
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created
        ON chat_messages(conversation_id, created_at, id);

      CREATE TABLE IF NOT EXISTS chat_read_receipts (
        conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        actor_role TEXT NOT NULL CHECK (actor_role IN ('OPS', 'COURIER')),
        actor_id TEXT NOT NULL,
        last_read_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (conversation_id, actor_role, actor_id)
      );
    `,
  },
  {
    id: '002_chat_conversation_hub_scope',
    up: `
      ALTER TABLE chat_conversations
        ADD COLUMN IF NOT EXISTS hub_code TEXT;

      CREATE INDEX IF NOT EXISTS idx_chat_conversations_hub_updated
        ON chat_conversations(hub_code, updated_at DESC);
    `,
  },
];

export async function runChatMigrations(
  pool: Pool,
  logger = new Logger('ChatMigrations'),
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query("SELECT pg_advisory_xact_lock(hashtext('gateway-bff-chat-migrations'))");

    const applied = await listAppliedMigrations(client);
    for (const migration of CHAT_MIGRATIONS) {
      if (applied.has(migration.id)) {
        continue;
      }

      await client.query(migration.up);
      await client.query(
        'INSERT INTO chat_schema_migrations (id, applied_at) VALUES ($1, now())',
        [migration.id],
      );
      logger.log(`Applied chat migration ${migration.id}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM chat_schema_migrations',
  );

  return new Set(result.rows.map((row) => row.id));
}
