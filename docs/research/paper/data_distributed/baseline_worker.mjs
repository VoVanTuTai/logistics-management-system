#!/usr/bin/env node
/**
 * Isolated Node.js worker process hosting synchronous monolithic baseline endpoints
 * and SQL-only Outbox ablation endpoint on 127.0.0.1:13099 (PostgreSQL 16 pool = 21,
 * matching Prisma default pool cap on 10-core host).
 *
 * Endpoints:
 *   POST /sync-scan-all       -> Single-TX ACID + 8-way KPI w/ unsharded ALL|ALL|ALL row lock
 *   POST /sync-scan-sharded   -> Single-TX ACID + 16-shard 8-way KPI (no hot ALL|ALL|ALL row lock)
 *   POST /sync-scan-nokpi     -> Single-TX ACID deferring KPI rollups outside write TX
 *   POST /ablation-outbox-scan -> Single-TX local Outbox + Idempotency + Location (no HTTP Lock RPC, no sync projections)
 *   GET  /sync-track-all/:code
 *   GET  /sync-track-sharded/:code
 *   GET  /sync-track-nokpi/:code
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Pool } = require('/Users/Tai.IS/my-project/logistics-management-system/services/gateway-bff/node_modules/pg');

const PORT = Number(process.env.BASELINE_PORT || 13099);
const SHARD_COUNT = 16;

// Mirror Prisma's default connection pool cap on 10-core host (2*10 + 1 = 21) for monolith baselines,
// plus an explicit max=3 pool matching scan-service's production PM2 connection_limit=3 cap.
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/postgres',
  max: 21,
});
const ablationPoolP3 = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/postgres',
  max: 3,
});

function hashShard(code) {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % SHARD_COUNT;
}

async function readJson(req) {
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleSyncScan(mode, req, res) {
  const body = await readJson(req);
  const { shipmentCode, locationCode, idempotencyKey, payloadMeta } = body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shipRes = await client.query(
      `SELECT code, current_status, is_locked, courier_code, hub_code, zone_code
       FROM bench_sync_shipments WHERE code = $1 FOR UPDATE`,
      [shipmentCode],
    );
    if (shipRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    const s = shipRes.rows[0];
    await client.query(
      `UPDATE bench_sync_shipments SET current_status = 'SCAN_INBOUND', updated_at = NOW() WHERE code = $1`,
      [shipmentCode],
    );
    const scanId = crypto.randomUUID();
    const evId = crypto.randomUUID();
    await client.query(
      `INSERT INTO bench_sync_scan_events(id, shipment_code, scan_type, location_code, idempotency_key)
       VALUES ($1, $2, 'INBOUND', $3, $4)`,
      [scanId, shipmentCode, locationCode, idempotencyKey],
    );
    await client.query(
      `INSERT INTO bench_sync_timeline(id, event_id, shipment_code, event_type, location_code, payload)
       VALUES ($1, $2, $3, 'scan.inbound', $4, $5::jsonb)`,
      [crypto.randomUUID(), evId, shipmentCode, locationCode, JSON.stringify(payloadMeta || {})],
    );
    await client.query(
      `INSERT INTO bench_sync_tracking_current(shipment_code, current_status, current_location_code, last_event_id, updated_at)
       VALUES ($1, 'INBOUND_AT_HUB', $2, $3, NOW())
       ON CONFLICT (shipment_code) DO UPDATE SET
         current_status = EXCLUDED.current_status,
         current_location_code = EXCLUDED.current_location_code,
         last_event_id = EXCLUDED.last_event_id,
         updated_at = NOW()`,
      [shipmentCode, locationCode, evId],
    );

    if (mode === 'all' || mode === 'sharded') {
      const combos = [
        ['ALL', 'ALL', 'ALL'],
        [s.courier_code, 'ALL', 'ALL'],
        ['ALL', s.hub_code, 'ALL'],
        ['ALL', 'ALL', s.zone_code],
        [s.courier_code, s.hub_code, 'ALL'],
        [s.courier_code, 'ALL', s.zone_code],
        ['ALL', s.hub_code, s.zone_code],
        [s.courier_code, s.hub_code, s.zone_code],
      ];
      const today = new Date().toISOString().slice(0, 10);
      if (mode === 'all') {
        for (const [c, h, z] of combos) {
          await client.query(
            `INSERT INTO bench_sync_kpi_daily(metric_date, courier_code, hub_code, zone_code, scans_inbound)
             VALUES ($1::date, $2, $3, $4, 1)
             ON CONFLICT (metric_date, courier_code, hub_code, zone_code)
             DO UPDATE SET scans_inbound = bench_sync_kpi_daily.scans_inbound + 1`,
            [today, c, h, z],
          );
        }
      } else {
        const shardId = hashShard(`${shipmentCode}:${evId}`);
        for (const [c, h, z] of combos) {
          await client.query(
            `INSERT INTO bench_sync_kpi_sharded(metric_date, shard_id, courier_code, hub_code, zone_code, scans_inbound)
             VALUES ($1::date, $2, $3, $4, $5, 1)
             ON CONFLICT (metric_date, shard_id, courier_code, hub_code, zone_code)
             DO UPDATE SET scans_inbound = bench_sync_kpi_sharded.scans_inbound + 1`,
            [today, shardId, c, h, z],
          );
        }
      }
    }

    await client.query('COMMIT');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ scanId, evId, shipmentCode, mode }));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    client.release();
  }
}

async function handleAblationOutboxScan(req, res, targetPool = pool) {
  const body = await readJson(req);
  const { shipmentCode, locationCode, idempotencyKey, note } = body;
  const scopedKey = `scan.inbound:${idempotencyKey}`;
  const client = await targetPool.connect();
  try {
    await client.query('BEGIN');
    const lockRes = await client.query(
      `SELECT is_locked, current_status FROM bench_ablation_shipments WHERE code = $1`,
      [shipmentCode],
    );
    if (lockRes.rowCount > 0 && lockRes.rows[0].is_locked && !(note || '').startsWith('INVENTORY_CHECK')) {
      await client.query('ROLLBACK');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Shipment locked' }));
      return;
    }

    const existing = await client.query(
      `SELECT response_payload FROM bench_ablation_idempotency WHERE idempotency_key = $1`,
      [scopedKey],
    );
    if (existing.rowCount > 0) {
      await client.query('COMMIT');
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(existing.rows[0].response_payload));
      return;
    }

    const scanId = crypto.randomUUID();
    const evId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await client.query(
      `INSERT INTO bench_ablation_scan_events(id, shipment_code, scan_type, location_code, idempotency_key)
       VALUES ($1, $2, 'INBOUND', $3, $4)`,
      [scanId, shipmentCode, locationCode, scopedKey],
    );

    await client.query(
      `INSERT INTO bench_ablation_current_location(shipment_code, location_code, last_scan_type, last_scan_event_id, last_scanned_at, updated_at)
       VALUES ($1, $2, 'INBOUND', $3, NOW(), NOW())
       ON CONFLICT (shipment_code) DO UPDATE SET
         location_code = EXCLUDED.location_code,
         last_scan_type = EXCLUDED.last_scan_type,
         last_scan_event_id = EXCLUDED.last_scan_event_id,
         last_scanned_at = NOW(),
         updated_at = NOW()`,
      [shipmentCode, locationCode, scanId],
    );

    const outboxPayload = {
      event_id: evId,
      event_type: 'scan.inbound',
      occurred_at: nowIso,
      shipment_code: shipmentCode,
      idempotency_key: scopedKey,
      data: { scanEvent: { id: scanId, locationCode, note: note || '' } },
    };

    await client.query(
      `INSERT INTO bench_ablation_outbox_events(id, event_id, event_type, aggregate_id, routing_key, payload, status)
       VALUES ($1, $2, 'scan.inbound', $3, 'scan.inbound', $4::jsonb, 'PENDING')`,
      [crypto.randomUUID(), evId, scanId, JSON.stringify(outboxPayload)],
    );

    const snapshot = { scanEvent: { id: scanId, shipmentCode, locationCode }, outboxEventId: evId };
    await client.query(
      `INSERT INTO bench_ablation_idempotency(idempotency_key, scope, response_payload)
       VALUES ($1, 'scan.inbound', $2::jsonb)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [scopedKey, JSON.stringify(snapshot)],
    );

    await client.query('COMMIT');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(snapshot));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    client.release();
  }
}

async function handleSyncTrack(mode, code, res) {
  try {
    let sql;
    if (mode === 'all') {
      sql = `
        SELECT s.code, s.current_status, tc.current_location_code, tc.updated_at,
               (SELECT count(*)::int FROM bench_sync_timeline te WHERE te.shipment_code = s.code) AS timeline_count,
               (SELECT json_agg(t) FROM (
                  SELECT event_type, location_code, occurred_at
                  FROM bench_sync_timeline te WHERE te.shipment_code = s.code
                  ORDER BY occurred_at DESC LIMIT 10
               ) t) AS recent_events,
               COALESCE((
                  SELECT sum(k.scans_inbound)::int
                  FROM bench_sync_kpi_daily k
                  WHERE k.hub_code = s.hub_code AND k.courier_code = 'ALL' AND k.zone_code = 'ALL'
               ), 0) AS hub_scans
        FROM bench_sync_shipments s
        LEFT JOIN bench_sync_tracking_current tc ON tc.shipment_code = s.code
        WHERE s.code = $1`;
    } else if (mode === 'sharded') {
      sql = `
        SELECT s.code, s.current_status, tc.current_location_code, tc.updated_at,
               (SELECT count(*)::int FROM bench_sync_timeline te WHERE te.shipment_code = s.code) AS timeline_count,
               (SELECT json_agg(t) FROM (
                  SELECT event_type, location_code, occurred_at
                  FROM bench_sync_timeline te WHERE te.shipment_code = s.code
                  ORDER BY occurred_at DESC LIMIT 10
               ) t) AS recent_events,
               COALESCE((
                  SELECT sum(k.scans_inbound)::int
                  FROM bench_sync_kpi_sharded k
                  WHERE k.hub_code = s.hub_code AND k.courier_code = 'ALL' AND k.zone_code = 'ALL'
               ), 0) AS hub_scans
        FROM bench_sync_shipments s
        LEFT JOIN bench_sync_tracking_current tc ON tc.shipment_code = s.code
        WHERE s.code = $1`;
    } else {
      sql = `
        SELECT s.code, s.current_status, tc.current_location_code, tc.updated_at,
               (SELECT count(*)::int FROM bench_sync_timeline te WHERE te.shipment_code = s.code) AS timeline_count,
               (SELECT json_agg(t) FROM (
                  SELECT event_type, location_code, occurred_at
                  FROM bench_sync_timeline te WHERE te.shipment_code = s.code
                  ORDER BY occurred_at DESC LIMIT 10
               ) t) AS recent_events
        FROM bench_sync_shipments s
        LEFT JOIN bench_sync_tracking_current tc ON tc.shipment_code = s.code
        WHERE s.code = $1`;
    }
    const qRes = await pool.query(sql, [code]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(qRes.rows[0] ?? null));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', pid: process.pid }));
      return;
    }
    if (req.method === 'POST' && req.url === '/sync-scan-all') return await handleSyncScan('all', req, res);
    if (req.method === 'POST' && req.url === '/sync-scan-sharded') return await handleSyncScan('sharded', req, res);
    if (req.method === 'POST' && req.url === '/sync-scan-nokpi') return await handleSyncScan('nokpi', req, res);
    if (req.method === 'POST' && req.url === '/ablation-outbox-scan') return await handleAblationOutboxScan(req, res, pool);
    if (req.method === 'POST' && req.url === '/ablation-outbox-p3') return await handleAblationOutboxScan(req, res, ablationPoolP3);

    if (req.method === 'GET' && req.url?.startsWith('/sync-track-all/')) {
      return await handleSyncTrack('all', req.url.split('/sync-track-all/')[1], res);
    }
    if (req.method === 'GET' && req.url?.startsWith('/sync-track-sharded/')) {
      return await handleSyncTrack('sharded', req.url.split('/sync-track-sharded/')[1], res);
    }
    if (req.method === 'GET' && req.url?.startsWith('/sync-track-nokpi/')) {
      return await handleSyncTrack('nokpi', req.url.split('/sync-track-nokpi/')[1], res);
    }

    res.writeHead(404);
    res.end();
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  if (process.send) process.send({ ready: true, port: PORT, pid: process.pid });
  else console.log(`Baseline worker listening on 127.0.0.1:${PORT} (pid=${process.pid})`);
});

process.on('SIGTERM', async () => {
  server.close();
  await pool.end();
  await ablationPoolP3.end();
  process.exit(0);
});
