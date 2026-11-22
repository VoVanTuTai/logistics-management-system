#!/usr/bin/env node
/**
 * Nexus Express — Global Read-Model Event Replay CLI (TC-059)
 *
 * Replays historical domain events stored in `outbox_events` across all 6 core
 * logistics source databases (shipment_db, pickup_db, dispatch_db, manifest_db,
 * scan_db, delivery_db) onto RabbitMQ exchange `domain.events` in strict
 * chronological order (`occurredAt ASC`) to rebuild `tracking_db` and
 * `reporting_db` read models.
 *
 * Safe by default (`--dry-run`). Pass `--confirm` to publish live messages.
 *
 * Usage:
 *   node scripts/replay-read-models.mjs --dry-run
 *   node scripts/replay-read-models.mjs --service=shipment,scan --shipment=SHP-01 --confirm
 */

import { createRequire } from 'node:module';

export const SOURCE_DATABASES = [
  { service: 'shipment-service', dbName: 'shipment_db' },
  { service: 'pickup-service', dbName: 'pickup_db' },
  { service: 'dispatch-service', dbName: 'dispatch_db' },
  { service: 'manifest-service', dbName: 'manifest_db' },
  { service: 'scan-service', dbName: 'scan_db' },
  { service: 'delivery-service', dbName: 'delivery_db' },
];

export const DEFAULT_EXCHANGE = process.env.DOMAIN_EVENTS_EXCHANGE || 'domain.events';
export const DEFAULT_DB_BASE =
  process.env.DATABASE_URL_BASE || 'postgresql://postgres:postgres@localhost:15432';
export const DEFAULT_RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672?heartbeat=60';

export function parseReplayArgs(argv) {
  const options = {
    dryRun: true,
    services: null,
    shipmentCode: null,
    fromIso: null,
    limit: 5000,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--confirm') {
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--service=')) {
      const vals = arg
        .slice('--service='.length)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      options.services = vals.length > 0 ? vals : null;
    } else if (arg.startsWith('--shipment=')) {
      options.shipmentCode = arg.slice('--shipment='.length).trim() || null;
    } else if (arg.startsWith('--from=')) {
      const raw = arg.slice('--from='.length).trim();
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --from ISO timestamp: "${raw}"`);
      }
      options.fromIso = parsed.toISOString();
    } else if (arg.startsWith('--limit=')) {
      const n = Number.parseInt(arg.slice('--limit='.length), 10);
      if (!Number.isFinite(n) || n < 1 || n > 100000) {
        throw new Error(`--limit must be an integer between 1 and 100000`);
      }
      options.limit = n;
    }
  }

  return options;
}

export function selectSourceDatabases(serviceFilters) {
  if (!serviceFilters || serviceFilters.length === 0) {
    return SOURCE_DATABASES;
  }
  const normalized = serviceFilters.map((s) => s.toLowerCase());
  return SOURCE_DATABASES.filter(
    (entry) =>
      normalized.includes(entry.service.toLowerCase()) ||
      normalized.includes(entry.service.replace('-service', '').toLowerCase()) ||
      normalized.includes(entry.dbName.toLowerCase()),
  );
}

export function mergeAndSortEvents(eventLists) {
  return eventLists
    .flat()
    .slice()
    .sort((a, b) => {
      const tDiff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      if (tDiff !== 0) return tDiff;
      return String(a.eventId).localeCompare(String(b.eventId));
    });
}

export function buildReplayQuery(options) {
  const clauses = [`status = 'PUBLISHED'`];
  const params = [];

  if (options.fromIso) {
    params.push(options.fromIso);
    clauses.push(`"occurredAt" >= $${params.length}`);
  }
  if (options.shipmentCode) {
    params.push(options.shipmentCode);
    clauses.push(`payload->>'shipment_code' = $${params.length}`);
  }

  params.push(options.limit);
  const sql = `
    SELECT "eventId", "eventType", "routingKey", payload, "occurredAt"
    FROM outbox_events
    WHERE ${clauses.join(' AND ')}
    ORDER BY "occurredAt" ASC
    LIMIT $${params.length}
  `.trim();

  return { sql, params };
}

async function runCli() {
  const options = parseReplayArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      [
        'Nexus Express — Global Read-Model Event Replay CLI',
        'Usage: node scripts/replay-read-models.mjs [--dry-run|--confirm] [--service=shipment,scan] [--shipment=SHP-01] [--from=ISO] [--limit=5000]',
      ].join('\n'),
    );
    return;
  }

  const targets = selectSourceDatabases(options.services);
  if (targets.length === 0) {
    throw new Error('No matching source databases for --service filter.');
  }

  const require = createRequire(import.meta.url);
  let pg;
  let amqplib;
  try {
    pg = require('../services/gateway-bff/node_modules/pg');
    amqplib = require('../services/payment-service/node_modules/amqplib');
  } catch {
    console.log(
      JSON.stringify(
        {
          mode: options.dryRun ? 'DRY_RUN_PLAN' : 'LIVE',
          exchange: DEFAULT_EXCHANGE,
          sources: targets.map((t) => t.dbName),
          filters: {
            shipmentCode: options.shipmentCode,
            fromIso: options.fromIso,
            limit: options.limit,
          },
          note: 'Install service dependencies or run inside workspace with pg/amqplib to execute live DB read.',
        },
        null,
        2,
      ),
    );
    return;
  }

  const { sql, params } = buildReplayQuery(options);
  const perSourceEvents = [];
  const summary = {};

  for (const source of targets) {
    const client = new pg.Client({ connectionString: `${DEFAULT_DB_BASE}/${source.dbName}` });
    await client.connect();
    try {
      const res = await client.query(sql, params);
      summary[source.dbName] = res.rows.length;
      perSourceEvents.push(
        res.rows.map((row) => ({
          sourceDb: source.dbName,
          eventId: row.eventId,
          eventType: row.eventType,
          routingKey: row.routingKey,
          payload: row.payload,
          occurredAt: row.occurredAt,
        })),
      );
    } finally {
      await client.end();
    }
  }

  const ordered = mergeAndSortEvents(perSourceEvents);
  console.log(
    JSON.stringify(
      {
        mode: options.dryRun ? 'DRY_RUN' : 'LIVE_REPLAY',
        exchange: DEFAULT_EXCHANGE,
        totalEvents: ordered.length,
        bySourceDb: summary,
      },
      null,
      2,
    ),
  );

  if (options.dryRun || ordered.length === 0) {
    return;
  }

  const conn = await amqplib.connect(DEFAULT_RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(DEFAULT_EXCHANGE, 'topic', { durable: true });

  let published = 0;
  for (const evt of ordered) {
    const body = Buffer.from(JSON.stringify(evt.payload), 'utf8');
    channel.publish(DEFAULT_EXCHANGE, evt.routingKey, body, {
      persistent: true,
      contentType: 'application/json',
      headers: {
        'x-replayed': 'true',
        'x-replay-source-db': evt.sourceDb,
        'x-event-id': evt.eventId,
      },
    });
    published += 1;
  }

  await channel.close();
  await conn.close();
  console.log(`[OK] Replayed ${published} domain events to exchange "${DEFAULT_EXCHANGE}".`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((err) => {
    console.error('[ERROR] Replay failed:', err.message);
    process.exit(1);
  });
}
