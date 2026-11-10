#!/usr/bin/env node
/**
 * Real Live Empirical Benchmark Suite for Nexus Event-Driven Logistics Architecture
 * Measures actual HTTP endpoints, PostgreSQL 16 (scan_db, shipment_db, tracking_db, reporting_db),
 * RabbitMQ 3.13 (AMQP 0-9-1 + HTTP Management API), Idempotency Guards, FSM State Machine,
 * and Multi-tier TTL Retry / DLQ Recovery on the live local cluster.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Pool } = require('/Users/Tai.IS/my-project/logistics-management-system/services/gateway-bff/node_modules/pg');
const amqp = require('/Users/Tai.IS/my-project/logistics-management-system/services/shipment-service/node_modules/amqplib');

const OUT_DIR = path.resolve('docs/research/paper/data_distributed');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URLS = {
  shipment: 'http://localhost:3002',
  scan: 'http://localhost:3006',
  tracking: 'http://localhost:3008',
  reporting: 'http://localhost:3009',
  rabbitmqMgmt: 'http://localhost:15672/api',
  rabbitmqAmqp: 'amqp://guest:guest@localhost:5672',
  baselineSyncPort: 13099,
};

const RMQ_AUTH = 'Basic ' + Buffer.from('guest:guest').toString('base64');

const scanPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/scan_db', max: 10 });
const shipPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/shipment_db', max: 10 });
const trackPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/tracking_db', max: 10 });
const repPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/reporting_db', max: 10 });
// Match Prisma's default connection pool cap on 10-core host (2*10 + 1 = 21)
const basePool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/postgres', max: 21 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function writeCsv(filename, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = row[h] ?? '';
          const s = String(v);
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(','),
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, filename), lines.join('\n') + '\n', 'utf8');
}

async function waitRabbitmqDrained(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${URLS.rabbitmqMgmt}/queues`, {
      headers: { Authorization: RMQ_AUTH },
    });
    const qs = await res.json();
    const active = qs.filter(
      (q) =>
        !q.name.includes('.dlq') &&
        !q.name.includes('.retry.') &&
        ((q.messages_ready ?? 0) > 0 || (q.messages_unacknowledged ?? 0) > 0),
    );
    const pendingOutbox = await scanPool.query(
      `SELECT count(*)::int AS cnt FROM "OutboxEvent" WHERE status = 'PENDING'`,
    );
    const shipPending = await shipPool.query(
      `SELECT count(*)::int AS cnt FROM outbox_events WHERE status = 'PENDING'`,
    );
    if (
      active.length === 0 &&
      pendingOutbox.rows[0].cnt === 0 &&
      shipPending.rows[0].cnt === 0
    ) {
      // Allow 400ms extra settle for consumer SQL TX commit
      await sleep(400);
      return;
    }
    await sleep(250);
  }
  console.warn('[WARN] Timed out waiting for queues/outbox to drain completely.');
}

async function runPool(items, concurrency, workerFn) {
  let idx = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      results[i] = await workerFn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function createShipmentApi(code, options = {}) {
  const hubOrig = options.originHub ?? 'HUB_HCM_01';
  const hubDest = options.destHub ?? 'HUB_HN_01';
  const zone = options.zone ?? 'NORTH';
  const courier = options.courier ?? 'C01';
  const headers = { 'Content-Type': 'application/json' };
  if (options.counterWalkIn !== false) {
    headers['x-ops-user-id'] = 'bench_op';
    headers['x-ops-roles'] = 'SYSTEM_ADMIN';
  }
  const res = await fetch(`${URLS.shipment}/shipments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      code,
      metadata: {
        source: 'dist-benchmark',
        courierId: courier,
        zoneCode: zone,
        sender: {
          name: 'Bench Sender',
          phone: '0901112233',
          address: '123 Le Loi, Q1, TP.HCM',
          province: 'TP.HCM',
          hubCode: hubOrig,
        },
        receiver: {
          name: 'Bench Receiver',
          phone: '0909887766',
          address: '456 Cau Giay, Ha Noi',
          province: 'Ha Noi',
          region: zone,
          hubCode: hubDest,
        },
        package: {
          itemType: 'GENERAL',
          weightKg: 1.5,
          dimensionsCm: { length: 20, width: 15, height: 10 },
          declaredValue: 500000,
        },
        service: { type: 'STANDARD' },
        routing: { originHubCode: hubOrig, destinationHubCode: hubDest },
      },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create shipment ${code} failed (${res.status}): ${txt}`);
  }
  return res.json();
}

// =========================================================================
// COUPLED SYNCHRONOUS BASELINE HTTP SERVER (Same PostgreSQL 16 Instance)
// =========================================================================
async function setupBaselineTables(codes) {
  await basePool.query(`
    DROP TABLE IF EXISTS bench_sync_timeline;
    DROP TABLE IF EXISTS bench_sync_scan_events;
    DROP TABLE IF EXISTS bench_sync_tracking_current;
    DROP TABLE IF EXISTS bench_sync_kpi_daily;
    DROP TABLE IF EXISTS bench_sync_shipments;

    CREATE TABLE bench_sync_shipments (
      code TEXT PRIMARY KEY,
      current_status TEXT NOT NULL,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      courier_code TEXT NOT NULL,
      hub_code TEXT NOT NULL,
      zone_code TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE bench_sync_scan_events (
      id TEXT PRIMARY KEY,
      shipment_code TEXT NOT NULL REFERENCES bench_sync_shipments(code),
      scan_type TEXT NOT NULL,
      location_code TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX bench_sync_scan_ship_idx ON bench_sync_scan_events(shipment_code);

    CREATE TABLE bench_sync_timeline (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      shipment_code TEXT NOT NULL REFERENCES bench_sync_shipments(code),
      event_type TEXT NOT NULL,
      location_code TEXT NOT NULL,
      payload JSONB NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX bench_sync_tl_ship_idx ON bench_sync_timeline(shipment_code, occurred_at);

    CREATE TABLE bench_sync_tracking_current (
      shipment_code TEXT PRIMARY KEY,
      current_status TEXT NOT NULL,
      current_location_code TEXT NOT NULL,
      last_event_id TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE bench_sync_kpi_daily (
      metric_date DATE NOT NULL,
      courier_code TEXT NOT NULL,
      hub_code TEXT NOT NULL,
      zone_code TEXT NOT NULL,
      scans_inbound INT NOT NULL DEFAULT 0,
      PRIMARY KEY (metric_date, courier_code, hub_code, zone_code)
    );
  `);

  const hubs = ['HUB_HCM_01', 'HUB_DN_01', 'HUB_HN_01'];
  const zones = ['SOUTH', 'CENTRAL', 'NORTH'];
  const couriers = ['C01', 'C02', 'C03', 'C04', 'C05'];
  for (let i = 0; i < codes.length; i++) {
    await basePool.query(
      `INSERT INTO bench_sync_shipments(code, current_status, courier_code, hub_code, zone_code)
       VALUES ($1, 'PICKUP_COMPLETED', $2, $3, $4)`,
      [codes[i], couriers[i % couriers.length], hubs[i % hubs.length], zones[i % zones.length]],
    );
  }
}

function startBaselineHttpServer() {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'POST' && req.url === '/sync-scan') {
        const chunks = [];
        for await (const ch of req) chunks.push(ch);
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const { shipmentCode, locationCode, idempotencyKey, payloadMeta } = body;

        const client = await basePool.connect();
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
          // Mirror 8 dimensional rollup combinations identical to ReportingProjectionStore.buildDimensionCombinations
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
          for (const [c, h, z] of combos) {
            await client.query(
              `INSERT INTO bench_sync_kpi_daily(metric_date, courier_code, hub_code, zone_code, scans_inbound)
               VALUES ($1::date, $2, $3, $4, 1)
               ON CONFLICT (metric_date, courier_code, hub_code, zone_code)
               DO UPDATE SET scans_inbound = bench_sync_kpi_daily.scans_inbound + 1`,
              [today, c, h, z],
            );
          }
          await client.query('COMMIT');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ scanId, evId, shipmentCode }));
        } catch (err) {
          await client.query('ROLLBACK').catch(() => {});
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        } finally {
          client.release();
        }
        return;
      }

      if (req.method === 'GET' && req.url?.startsWith('/sync-track/')) {
        const code = req.url.split('/sync-track/')[1];
        const qRes = await basePool.query(
          `SELECT s.code, s.current_status, tc.current_location_code,
                  count(te.id)::int AS timeline_count,
                  max(se.occurred_at) AS last_scan_at,
                  coalesce(sum(k.scans_inbound), 0)::int AS hub_scans
           FROM bench_sync_shipments s
           LEFT JOIN bench_sync_tracking_current tc ON tc.shipment_code = s.code
           LEFT JOIN bench_sync_timeline te ON te.shipment_code = s.code
           LEFT JOIN bench_sync_scan_events se ON se.shipment_code = s.code
           LEFT JOIN bench_sync_kpi_daily k ON k.hub_code = s.hub_code AND k.courier_code = 'ALL' AND k.zone_code = 'ALL'
           WHERE s.code = $1
           GROUP BY s.code, s.current_status, tc.current_location_code`,
          [code],
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(qRes.rows[0] ?? null));
        return;
      }

      res.writeHead(404);
      res.end();
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });

  return new Promise((resolve) => {
    server.listen(URLS.baselineSyncPort, '127.0.0.1', () => resolve(server));
  });
}

// =========================================================================
// MAIN BENCHMARK EXECUTION
// =========================================================================
async function main() {
  const runMeta = {
    startedAtIso: new Date().toISOString(),
    hardware: {},
    notes: [],
  };

  console.log('=== [0] SEEDING 220 BENCHMARK SHIPMENTS ===');
  const poolCodes = Array.from({ length: 220 }, (_, i) => `333991${String(i + 1).padStart(6, '0')}`);
  const hubs = ['HUB_HCM_01', 'HUB_DN_01', 'HUB_HN_01'];
  const zones = ['SOUTH', 'CENTRAL', 'NORTH'];
  const couriers = ['C01', 'C02', 'C03', 'C04', 'C05'];

  await runPool(poolCodes, 20, async (code, i) => {
    await createShipmentApi(code, {
      originHub: hubs[i % hubs.length],
      destHub: hubs[(i + 1) % hubs.length],
      zone: zones[i % zones.length],
      courier: couriers[i % couriers.length],
      counterWalkIn: true,
    });
  });
  await waitRabbitmqDrained(15000);
  console.log(`Seeded ${poolCodes.length} benchmark shipments cleanly & drained queues.`);

  // Setup coupled baseline mirror tables
  await setupBaselineTables(poolCodes);
  const baselineServer = await startBaselineHttpServer();
  console.log(`Coupled Sync RDBMS baseline server listening on :${URLS.baselineSyncPort}`);

  // =======================================================================
  // EXPERIMENT 1A & 1B: Concurrency Scaling (c = 1, 10, 25, 50, 100)
  // =======================================================================
  console.log('\n=== [1] EXPERIMENT 1: Concurrency Scaling (EDA vs Coupled Sync) ===');
  const concurrencies = [1, 10, 25, 50, 100];
  const reqsPerTier = 150;
  const exp1Rows = [];

  for (const c of concurrencies) {
    // System A: Live Nexus EDA (scan-service POST /scans/inbound)
    const itemsA = Array.from({ length: reqsPerTier }, (_, i) => ({
      code: poolCodes[(i + c * 7) % 100], // first 100 shipments so 101..220 stay clean for Exp 2A!
      key: `exp1-eda-c${c}-${i}-${Date.now()}`,
      hub: hubs[i % hubs.length],
    }));

    const wallStartA = performance.now();
    const resA = await runPool(itemsA, c, async (item, i) => {
      const t0 = performance.now();
      let status = 0;
      let ok = false;
      let errMsg = '';
      try {
        const r = await fetch(`${URLS.scan}/scans/inbound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: item.code,
            locationCode: item.hub,
            actor: 'BENCH_PDA',
            idempotencyKey: item.key,
            note: `EXP1 c=${c}`,
          }),
        });
        status = r.status;
        ok = r.ok;
        await r.text();
      } catch (e) {
        errMsg = e.message;
      }
      const dt = performance.now() - t0;
      return {
        architecture: 'Nexus_EDA',
        concurrency: c,
        req_idx: i,
        shipment_code: item.code,
        status_code: status,
        ok: ok ? 1 : 0,
        latency_ms: dt.toFixed(3),
        error: errMsg,
      };
    });
    const wallMsA = performance.now() - wallStartA;
    const throughputA = (reqsPerTier / (wallMsA / 1000)).toFixed(2);
    for (const r of resA) {
      r.tier_wall_ms = wallMsA.toFixed(2);
      r.tier_throughput_rps = throughputA;
      exp1Rows.push(r);
    }
    await waitRabbitmqDrained(20000);
    console.log(`  [Nexus_EDA c=${c}] wall=${wallMsA.toFixed(1)}ms throughput=${throughputA} req/s, ok=${resA.filter((x) => x.ok === 1).length}/${reqsPerTier}`);

    // System B: Coupled Sync RDBMS Baseline
    const itemsB = Array.from({ length: reqsPerTier }, (_, i) => ({
      code: poolCodes[(i + c * 7) % 100],
      key: `exp1-sync-c${c}-${i}-${Date.now()}`,
      hub: hubs[i % hubs.length],
    }));

    const wallStartB = performance.now();
    const resB = await runPool(itemsB, c, async (item, i) => {
      const t0 = performance.now();
      let status = 0;
      let ok = false;
      let errMsg = '';
      try {
        const r = await fetch(`http://127.0.0.1:${URLS.baselineSyncPort}/sync-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: item.code,
            locationCode: item.hub,
            idempotencyKey: item.key,
            payloadMeta: { actor: 'BENCH_PDA', c },
          }),
        });
        status = r.status;
        ok = r.ok;
        await r.text();
      } catch (e) {
        errMsg = e.message;
      }
      const dt = performance.now() - t0;
      return {
        architecture: 'Coupled_Sync_RDBMS',
        concurrency: c,
        req_idx: i,
        shipment_code: item.code,
        status_code: status,
        ok: ok ? 1 : 0,
        latency_ms: dt.toFixed(3),
        error: errMsg,
      };
    });
    const wallMsB = performance.now() - wallStartB;
    const throughputB = (reqsPerTier / (wallMsB / 1000)).toFixed(2);
    for (const r of resB) {
      r.tier_wall_ms = wallMsB.toFixed(2);
      r.tier_throughput_rps = throughputB;
      exp1Rows.push(r);
    }
    console.log(`  [Coupled_Sync c=${c}] wall=${wallMsB.toFixed(1)}ms throughput=${throughputB} req/s, ok=${resB.filter((x) => x.ok === 1).length}/${reqsPerTier}`);
  }

  writeCsv(
    'exp1_scaling_requests.csv',
    ['architecture', 'concurrency', 'req_idx', 'shipment_code', 'status_code', 'ok', 'latency_ms', 'tier_wall_ms', 'tier_throughput_rps', 'error'],
    exp1Rows,
  );

  // =======================================================================
  // EXPERIMENT 1C: CQRS Read Isolation Under Concurrent Write Saturation
  // =======================================================================
  console.log('\n=== [1C] Read Isolation Benchmark (Idle vs Concurrent Write Saturation) ===');
  const readRows = [];
  const N_READS = 200;

  // Helper to run 200 read queries at concurrency=25
  async function measureReads(arch, condition, readUrlFn) {
    const items = Array.from({ length: N_READS }, (_, i) => poolCodes[i % 100]);
    return runPool(items, 25, async (code, i) => {
      const t0 = performance.now();
      const r = await fetch(readUrlFn(code));
      await r.text();
      return {
        architecture: arch,
        condition,
        req_idx: i,
        shipment_code: code,
        status_code: r.status,
        ok: r.ok ? 1 : 0,
        latency_ms: (performance.now() - t0).toFixed(3),
      };
    });
  }

  // Idle reads
  readRows.push(...(await measureReads('Nexus_CQRS_Read', 'Idle', (c) => `${URLS.tracking}/public/track/${c}`)));
  readRows.push(...(await measureReads('Coupled_Sync_Join', 'Idle', (c) => `http://127.0.0.1:${URLS.baselineSyncPort}/sync-track/${c}`)));

  // Reads under concurrent write flood (50 continuous writers during read burst)
  for (const [arch, writeFn, readFn] of [
    [
      'Nexus_CQRS_Read',
      (i) =>
        fetch(`${URLS.scan}/scans/inbound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 100],
            locationCode: 'HUB_HCM_01',
            actor: 'SAT_WRITER',
            idempotencyKey: `sat-eda-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
      (c) => `${URLS.tracking}/public/track/${c}`,
    ],
    [
      'Coupled_Sync_Join',
      (i) =>
        fetch(`http://127.0.0.1:${URLS.baselineSyncPort}/sync-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 100],
            locationCode: 'HUB_HCM_01',
            idempotencyKey: `sat-sync-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
      (c) => `http://127.0.0.1:${URLS.baselineSyncPort}/sync-track/${c}`,
    ],
  ]) {
    let stopWriters = false;
    let wCounter = 0;
    const writers = Array.from({ length: 50 }, async () => {
      while (!stopWriters) {
        const idx = wCounter++;
        await writeFn(idx).catch(() => {});
      }
    });
    await sleep(300);
    const res = await measureReads(arch, 'Under_Write_Load_c50', readFn);
    stopWriters = true;
    await Promise.all(writers);
    readRows.push(...res);
    if (arch === 'Nexus_CQRS_Read') await waitRabbitmqDrained(20000);
  }

  writeCsv(
    'exp1_read_isolation.csv',
    ['architecture', 'condition', 'req_idx', 'shipment_code', 'status_code', 'ok', 'latency_ms'],
    readRows,
  );
  baselineServer.close();
  // Clean up baseline temp tables immediately
  await basePool.query(`
    DROP TABLE IF EXISTS bench_sync_timeline;
    DROP TABLE IF EXISTS bench_sync_scan_events;
    DROP TABLE IF EXISTS bench_sync_tracking_current;
    DROP TABLE IF EXISTS bench_sync_kpi_daily;
    DROP TABLE IF EXISTS bench_sync_shipments;
  `);
  console.log('Saved exp1_read_isolation.csv and dropped temp baseline tables.');

  // =======================================================================
  // EXPERIMENT 2A: End-to-End Eventual Consistency Lag Decomposition (N=120)
  // Using untouched shipments poolCodes[100..219] so every scan makes clean transition!
  // =======================================================================
  console.log('\n=== [2A] End-to-End Stage Propagation Lag Decomposition (N=120) ===');
  const stageShipments = poolCodes.slice(100, 220);
  const exp2aMeta = [];

  for (let i = 0; i < stageShipments.length; i++) {
    const code = stageShipments[i];
    const idem = `exp2a-stage-${i}-${Date.now()}`;
    const scopedIdem = `scan.inbound:${idem}`;
    const tSubMs = Date.now();
    const pStart = performance.now();
    const res = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipmentCode: code,
        locationCode: 'HUB_HN_01',
        actor: 'BENCH_STAGE',
        idempotencyKey: idem,
        note: 'STAGE_DECOMP',
      }),
    });
    const body = await res.json();
    const ingestMs = performance.now() - pStart;
    const tAckMs = Date.now();
    exp2aMeta.push({
      idx: i,
      shipment_code: code,
      scoped_idem: scopedIdem,
      scan_event_id: body.scanEvent.id,
      t_submit_ms: tSubMs,
      t_ack_ms: tAckMs,
      ingest_http_ms: ingestMs,
    });
    // Randomized arrival offset across 1000ms relay tick window (60-210ms)
    await sleep(60 + Math.floor(Math.random() * 150));
  }

  await waitRabbitmqDrained(15000);
  // Also wait extra 1.5s to ensure reporting-service 1s HTTP polling finished all 120 items
  await sleep(1500);

  const scanIds = exp2aMeta.map((x) => x.scan_event_id);
  const outboxQ = await scanPool.query(
    `SELECT "aggregateId" AS scan_id, "eventId" AS event_id,
            EXTRACT(EPOCH FROM ("occurredAt" AT TIME ZONE 'UTC'))*1000.0 AS occurred_ms,
            EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS outbox_created_ms,
            EXTRACT(EPOCH FROM ("publishedAt" AT TIME ZONE 'UTC'))*1000.0 AS outbox_published_ms
     FROM "OutboxEvent"
     WHERE "aggregateId" = ANY($1::text[])`,
    [scanIds],
  );
  const outboxMap = new Map(outboxQ.rows.map((r) => [r.scan_id, r]));
  const eventIds = outboxQ.rows.map((r) => r.event_id);

  const tlQ = await trackPool.query(
    `SELECT "eventId" AS event_id,
            EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS tl_created_ms
     FROM "TimelineEvent"
     WHERE "eventId" = ANY($1::text[])`,
    [eventIds],
  );
  const tlMap = new Map(tlQ.rows.map((r) => [r.event_id, r.tl_created_ms]));

  const repQ = await repPool.query(
    `SELECT "jobKey" AS event_id,
            EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS rep_created_ms
     FROM "AggregationJob"
     WHERE "jobKey" = ANY($1::text[])`,
    [eventIds],
  );
  const repMap = new Map(repQ.rows.map((r) => [r.event_id, r.rep_created_ms]));

  const shipQ = await shipPool.query(
    `SELECT code, "currentStatus",
            EXTRACT(EPOCH FROM ("updatedAt" AT TIME ZONE 'UTC'))*1000.0 AS ship_updated_ms
     FROM shipments
     WHERE code = ANY($1::text[])`,
    [stageShipments],
  );
  const shipMap = new Map(shipQ.rows.map((r) => [r.code, r]));

  const exp2aRows = [];
  for (const m of exp2aMeta) {
    const ob = outboxMap.get(m.scan_event_id);
    if (!ob) continue;
    const tlCreated = tlMap.get(ob.event_id);
    const repCreated = repMap.get(ob.event_id);
    const sh = shipMap.get(m.shipment_code);
    const outboxDwellMs = ob.outbox_published_ms - ob.outbox_created_ms;
    const trackBrokerMs = tlCreated ? tlCreated - ob.outbox_published_ms : null;
    const trackE2eMs = tlCreated ? tlCreated - ob.outbox_created_ms : null;
    const shipFsmMs = sh ? sh.ship_updated_ms - ob.outbox_published_ms : null;
    const shipE2eMs = sh ? sh.ship_updated_ms - ob.outbox_created_ms : null;
    const repPollMs = repCreated ? repCreated - ob.outbox_published_ms : null;
    const repE2eMs = repCreated ? repCreated - ob.outbox_created_ms : null;
    exp2aRows.push({
      idx: m.idx,
      shipment_code: m.shipment_code,
      event_id: ob.event_id,
      ingest_http_ms: m.ingest_http_ms.toFixed(3),
      outbox_dwell_ms: outboxDwellMs.toFixed(3),
      track_broker_ms: trackBrokerMs !== null ? trackBrokerMs.toFixed(3) : '',
      track_e2e_ms: trackE2eMs !== null ? trackE2eMs.toFixed(3) : '',
      ship_fsm_ms: shipFsmMs !== null ? shipFsmMs.toFixed(3) : '',
      ship_e2e_ms: shipE2eMs !== null ? shipE2eMs.toFixed(3) : '',
      rep_poll_ms: repPollMs !== null ? repPollMs.toFixed(3) : '',
      rep_e2e_ms: repE2eMs !== null ? repE2eMs.toFixed(3) : '',
      ship_status: sh?.currentStatus ?? '',
    });
  }
  writeCsv(
    'exp2a_e2e_stage_lags.csv',
    ['idx', 'shipment_code', 'event_id', 'ingest_http_ms', 'outbox_dwell_ms', 'track_broker_ms', 'track_e2e_ms', 'ship_fsm_ms', 'ship_e2e_ms', 'rep_poll_ms', 'rep_e2e_ms', 'ship_status'],
    exp2aRows,
  );
  console.log(`Captured ${exp2aRows.length} joined end-to-end event stage rows.`);

  // =======================================================================
  // EXPERIMENT 2B: Outbox Batch-50 Burst Drain Staircase Curve (N=200 Burst)
  // =======================================================================
  console.log('\n=== [2B] Outbox Burst Drain Staircase Observation (N=200 Burst, c=50) ===');
  const drainRows = [];
  const burstId = `burst-${Date.now()}`;
  const burstStartMs = Date.now();
  const burstPromises = runPool(
    Array.from({ length: 200 }, (_, i) => i),
    50,
    async (i) => {
      await fetch(`${URLS.scan}/scans/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentCode: poolCodes[i % 200],
          locationCode: 'HUB_HCM_01',
          actor: 'BENCH_BURST',
          idempotencyKey: `${burstId}-${i}`,
          note: burstId,
        }),
      }).then((r) => r.text());
    },
  );

  // Sample OutboxEvent table every 100ms for 6.5s concurrently while draining
  let doneBurst = false;
  burstPromises.then(() => { doneBurst = true; });
  for (let tick = 0; tick < 65; tick++) {
    const q = await scanPool.query(
      `SELECT count(*) FILTER (WHERE status = 'PENDING')::int AS pending_cnt,
              count(*) FILTER (WHERE status = 'PUBLISHED')::int AS published_cnt
       FROM "OutboxEvent"
       WHERE payload->'data'->'scanEvent'->>'note' = $1`,
      [burstId],
    );
    const { pending_cnt, published_cnt } = q.rows[0];
    drainRows.push({
      tick,
      elapsed_ms: Date.now() - burstStartMs,
      pending_count: pending_cnt,
      published_count: published_cnt,
      total_seen: pending_cnt + published_cnt,
    });
    if (doneBurst && published_cnt >= 200 && pending_cnt === 0) break;
    await sleep(100);
  }
  await burstPromises;
  await waitRabbitmqDrained(15000);
  writeCsv('exp2b_outbox_drain_curve.csv', ['tick', 'elapsed_ms', 'pending_count', 'published_count', 'total_seen'], drainRows);
  console.log(`Recorded ${drainRows.length} 100ms staircase samples.`);

  // =======================================================================
  // EXPERIMENT 2C: Outbox Relay Transport Micro-Benchmark on Live RabbitMQ
  // Comparing ScanOutboxRelay HTTP Mgmt API vs ShipmentOutboxRelay AMQP ConfirmChannel
  // =======================================================================
  console.log('\n=== [2C] Transport Micro-Benchmark: HTTP Mgmt vs AMQP ConfirmChannel (N=200 each) ===');
  const transportRows = [];
  const exBench = 'bench.transport.ex';
  const qBench = 'bench.transport.q';
  const conn = await amqp.connect(URLS.rabbitmqAmqp);
  const ch = await conn.createConfirmChannel();
  await ch.assertExchange(exBench, 'topic', { durable: true });
  await ch.assertQueue(qBench, { durable: true });
  await ch.bindQueue(qBench, exBench, 'bench.scan');

  const samplePayload = JSON.stringify({
    event_id: crypto.randomUUID(),
    event_type: 'scan.inbound',
    occurred_at: new Date().toISOString(),
    shipment_code: '333991000001',
    idempotency_key: 'transport-microbench',
    data: { scanEvent: { locationCode: 'HUB_HCM_01' } },
  });

  // 1) HTTP Management API sequential (ScanOutboxRelayService pattern)
  const tHttpStart = performance.now();
  for (let i = 0; i < 200; i++) {
    const t0 = performance.now();
    const r = await fetch(`${URLS.rabbitmqMgmt}/exchanges/%2F/${exBench}/publish`, {
      method: 'POST',
      headers: { Authorization: RMQ_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { delivery_mode: 2, message_id: `h-${i}` },
        routing_key: 'bench.scan',
        payload: samplePayload,
        payload_encoding: 'string',
      }),
    });
    await r.json();
    transportRows.push({
      transport: 'HTTP_Mgmt_Sequential',
      msg_idx: i,
      latency_ms: (performance.now() - t0).toFixed(3),
    });
  }
  const httpTotalMs = performance.now() - tHttpStart;

  // 2) AMQP ConfirmChannel sequential (ShipmentOutboxRelayService pattern)
  const tAmqpSeqStart = performance.now();
  for (let i = 0; i < 200; i++) {
    const t0 = performance.now();
    await new Promise((resolve, reject) => {
      ch.publish(
        exBench,
        'bench.scan',
        Buffer.from(samplePayload, 'utf8'),
        { persistent: true, contentType: 'application/json', messageId: `a-${i}` },
        (err) => (err ? reject(err) : resolve()),
      );
    });
    transportRows.push({
      transport: 'AMQP_Confirm_Sequential',
      msg_idx: i,
      latency_ms: (performance.now() - t0).toFixed(3),
    });
  }
  const amqpSeqTotalMs = performance.now() - tAmqpSeqStart;

  // 3) AMQP ConfirmChannel pipelined batch-50 (4 batches of 50 confirms)
  const tAmqpBatchStart = performance.now();
  for (let b = 0; b < 4; b++) {
    const bt0 = performance.now();
    await Promise.all(
      Array.from({ length: 50 }, (_, j) =>
        new Promise((resolve, reject) => {
          ch.publish(
            exBench,
            'bench.scan',
            Buffer.from(samplePayload, 'utf8'),
            { persistent: true, contentType: 'application/json', messageId: `ab-${b}-${j}` },
            (err) => (err ? reject(err) : resolve()),
          );
        }),
      ),
    );
    const batchDt = performance.now() - bt0;
    for (let j = 0; j < 50; j++) {
      transportRows.push({
        transport: 'AMQP_Confirm_Batch50',
        msg_idx: b * 50 + j,
        latency_ms: (batchDt / 50).toFixed(3),
      });
    }
  }
  const amqpBatchTotalMs = performance.now() - tAmqpBatchStart;

  await ch.deleteQueue(qBench);
  await ch.deleteExchange(exBench);
  await ch.close();
  writeCsv('exp2c_transport_microbench.csv', ['transport', 'msg_idx', 'latency_ms'], transportRows);
  console.log(`Transport totals (200 msgs): HTTP_Mgmt=${httpTotalMs.toFixed(1)}ms, AMQP_Seq=${amqpSeqTotalMs.toFixed(1)}ms, AMQP_Batch50=${amqpBatchTotalMs.toFixed(1)}ms`);

  // =======================================================================
  // EXPERIMENT 3: Dual-Layer Idempotency & Duplicate Storm Resilience
  // =======================================================================
  console.log('\n=== [3] Experiment 3: Idempotency & Concurrent Duplicate Storm ===');
  const exp3Rows = [];
  const stormTag = `exp3-${Date.now()}`;

  // 3A: 100 Fresh + 100 Sequential Replays
  for (let i = 0; i < 100; i++) {
    const key = `${stormTag}-seq-${i}`;
    const code = poolCodes[i % 100];
    const t0 = performance.now();
    const r1 = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', actor: 'IDEM_TEST', idempotencyKey: key }),
    });
    const j1 = await r1.json();
    const dt1 = performance.now() - t0;
    exp3Rows.push({ phase: 'Fresh_Write', key_idx: i, attempt: 0, status: r1.status, scan_id: j1.scanEvent.id, latency_ms: dt1.toFixed(3) });

    const t1 = performance.now();
    const r2 = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', actor: 'IDEM_TEST', idempotencyKey: key }),
    });
    const j2 = await r2.json();
    const dt2 = performance.now() - t1;
    exp3Rows.push({ phase: 'Sequential_Replay', key_idx: i, attempt: 1, status: r2.status, scan_id: j2.scanEvent.id, latency_ms: dt2.toFixed(3) });
  }

  // 3B: Concurrent 6-way Race Storm across 50 keys = 300 concurrent duplicate POSTs
  const raceJobs = [];
  for (let k = 0; k < 50; k++) {
    const key = `${stormTag}-race-${k}`;
    const code = poolCodes[k % 100];
    for (let attempt = 0; attempt < 6; attempt++) {
      raceJobs.push({ key_idx: k, attempt, key, code });
    }
  }
  const raceRes = await runPool(raceJobs, 60, async (job) => {
    const t0 = performance.now();
    const r = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: job.code, locationCode: 'HUB_HCM_01', actor: 'RACE_STORM', idempotencyKey: job.key }),
    });
    const j = await r.json().catch(() => ({}));
    return {
      phase: 'Concurrent_Storm_6x',
      key_idx: job.key_idx,
      attempt: job.attempt,
      status: r.status,
      scan_id: j?.scanEvent?.id ?? 'ERR',
      latency_ms: (performance.now() - t0).toFixed(3),
    };
  });
  exp3Rows.push(...raceRes);

  await waitRabbitmqDrained(15000);
  await sleep(1200);

  // Verify exact DB dedup counts for stormTag
  const dbCheckScan = await scanPool.query(
    `SELECT count(*)::int AS scan_cnt FROM "ScanEvent" WHERE "idempotencyKey" LIKE $1`,
    [`%${stormTag}%`],
  );
  const dbCheckOutbox = await scanPool.query(
    `SELECT count(*)::int AS outbox_cnt, array_agg("eventId") AS event_ids, array_agg(payload) AS payloads
     FROM "OutboxEvent" WHERE payload->>'idempotency_key' LIKE $1`,
    [`%${stormTag}%`],
  );

  // 3C: Direct Broker-Level Duplicate Injection of 50 already-processed envelopes into domain.events
  const tlPre = await trackPool.query(`SELECT count(*)::int AS cnt FROM "TimelineEvent"`);
  const repPre = await repPool.query(`SELECT count(*)::int AS cnt, sum("scansInbound")::int AS kpi_sum FROM "KpiDaily" WHERE "courierCode"='ALL' AND "hubCode"='ALL' AND "zoneCode"='ALL'`);
  const injPayloads = dbCheckOutbox.rows[0].payloads.slice(0, 50);
  const injCh = await conn.createConfirmChannel();
  for (const pl of injPayloads) {
    await new Promise((resolve, reject) => {
      injCh.publish('domain.events', 'scan.inbound', Buffer.from(JSON.stringify(pl), 'utf8'), { persistent: true, contentType: 'application/json', messageId: pl.event_id }, (e) => (e ? reject(e) : resolve()));
    });
  }
  await injCh.close();
  await waitRabbitmqDrained(10000);
  await sleep(1500);
  const tlPost = await trackPool.query(`SELECT count(*)::int AS cnt FROM "TimelineEvent"`);
  const repPost = await repPool.query(`SELECT count(*)::int AS cnt, sum("scansInbound")::int AS kpi_sum FROM "KpiDaily" WHERE "courierCode"='ALL' AND "hubCode"='ALL' AND "zoneCode"='ALL'`);

  const idemIntegrity = {
    expected_unique_events: 150,
    total_http_requests: exp3Rows.length,
    http_success_2xx: exp3Rows.filter((x) => x.status >= 200 && x.status < 300).length,
    db_scan_events_created: dbCheckScan.rows[0].scan_cnt,
    db_outbox_events_created: dbCheckOutbox.rows[0].outbox_cnt,
    broker_dup_injected: injPayloads.length,
    tracking_timeline_delta_after_dup: tlPost.rows[0].cnt - tlPre.rows[0].cnt,
    reporting_kpi_delta_after_dup: repPost.rows[0].kpi_sum - repPre.rows[0].kpi_sum,
  };
  writeCsv('exp3_idempotency_requests.csv', ['phase', 'key_idx', 'attempt', 'status', 'scan_id', 'latency_ms'], exp3Rows);
  console.log('Idempotency Integrity Summary:', idemIntegrity);

  // =======================================================================
  // EXPERIMENT 4A: State Machine Safety Under Out-of-Order & Terminal Events + Locks
  // =======================================================================
  console.log('\n=== [4A] State Machine Invariant & Out-of-Order Stress Test ===');
  const fsmCodes = Array.from({ length: 20 }, (_, i) => `333992${String(i + 1).padStart(6, '0')}`);
  for (const code of fsmCodes) {
    await createShipmentApi(code, { counterWalkIn: true });
  }
  await waitRabbitmqDrained(10000);

  // Move:
  // 0..4 -> DELIVERED (via delivery.delivered RabbitMQ event)
  // 5..9 -> RETURN_STARTED -> RETURN_COMPLETED
  // 10..14 -> CANCELLED (via POST /shipments/:code/cancel)
  // 15..19 -> SCAN_INBOUND + locked flag check for 15..19!
  const fsmCh = await conn.createConfirmChannel();
  async function pubDomain(routingKey, shipmentCode, extraData = {}) {
    const evId = crypto.randomUUID();
    const env = {
      event_id: evId,
      event_type: routingKey,
      occurred_at: new Date().toISOString(),
      shipment_code: shipmentCode,
      actor: 'BENCH_FSM',
      location: { location_code: 'HUB_HN_01' },
      data: extraData,
      idempotency_key: `fsm-${routingKey}-${shipmentCode}-${evId}`,
    };
    await new Promise((resolve, reject) => {
      fsmCh.publish('domain.events', routingKey, Buffer.from(JSON.stringify(env), 'utf8'), { persistent: true, contentType: 'application/json', messageId: evId }, (e) => (e ? reject(e) : resolve()));
    });
    return evId;
  }

  for (let i = 0; i < 5; i++) {
    await pubDomain('task.assigned', fsmCodes[i], { task: { taskType: 'DELIVERY' } });
  }
  await waitRabbitmqDrained(8000);
  for (let i = 0; i < 5; i++) {
    await pubDomain('delivery.delivered', fsmCodes[i]);
  }
  for (let i = 5; i < 10; i++) {
    await pubDomain('return.started', fsmCodes[i]);
  }
  await waitRabbitmqDrained(8000);
  for (let i = 5; i < 10; i++) {
    await pubDomain('return.completed', fsmCodes[i]);
  }
  for (let i = 10; i < 15; i++) {
    const cr = await fetch(`${URLS.shipment}/shipments/${fsmCodes[i]}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ops-user-id': 'bench_op', 'x-ops-roles': 'SYSTEM_ADMIN' },
      body: JSON.stringify({ reason: 'Benchmark terminal check' }),
    });
    await cr.text();
  }
  for (let i = 15; i < 20; i++) {
    await pubDomain('scan.inbound', fsmCodes[i], { scanEvent: { locationCode: 'HUB_HCM_01' } });
  }
  await waitRabbitmqDrained(10000);

  // Verify setup baseline
  const baselineFsmQ = await shipPool.query(`SELECT code, "currentStatus" FROM shipments WHERE code = ANY($1::text[]) ORDER BY code`, [fsmCodes]);
  console.log('FSM Pre-Attack States sample:', baselineFsmQ.rows.filter((_, idx) => idx % 5 === 0));

  // Inject 60 illegal / out-of-order events (3 per shipment)
  const exp4aRows = [];
  const attacks = [
    { start: 0, end: 5, expectedState: 'DELIVERED', evTypes: ['scan.inbound', 'scan.outbound', 'delivery.failed'] },
    { start: 5, end: 10, expectedState: 'RETURN_COMPLETED', evTypes: ['scan.inbound', 'pickup.approved', 'delivery.delivered'] },
    { start: 10, end: 15, expectedState: 'CANCELLED', evTypes: ['scan.inbound', 'task.assigned', 'delivery.delivered'] },
    { start: 15, end: 20, expectedState: 'SCAN_INBOUND', evTypes: ['pickup.requested', 'scan.pickup_confirmed', 'manifest.sealed'] },
    // Wait: MANIFEST_SEALED IS allowed from SCAN_INBOUND! Let's make 15..19 strictly out-of-order illegal: pickup.requested (UPDATED), scan.pickup_confirmed (PICKUP_COMPLETED), manifest.received? Look: VALID_TRANSITIONS['SCAN_INBOUND'] does NOT allow UPDATED or PICKUP_COMPLETED or CREATED!
  ];
  attacks[3].evTypes = ['pickup.requested', 'scan.pickup_confirmed', 'delivery.delivered'];

  const attackIds = [];
  for (const grp of attacks) {
    for (let i = grp.start; i < grp.end; i++) {
      for (const evType of grp.evTypes) {
        const evId = await pubDomain(evType, fsmCodes[i], { scanEvent: { locationCode: 'HUB_LATE_99' } });
        attackIds.push({ code: fsmCodes[i], expectedState: grp.expectedState, evType, evId });
      }
    }
  }
  await waitRabbitmqDrained(12000);
  await sleep(1000);

  const postFsmQ = await shipPool.query(`SELECT code, "currentStatus" FROM shipments WHERE code = ANY($1::text[])`, [fsmCodes]);
  const postShipMap = new Map(postFsmQ.rows.map((r) => [r.code, r.currentStatus]));
  const postTrackQ = await trackPool.query(`SELECT "shipmentCode", "currentStatus" FROM "TrackingCurrent" WHERE "shipmentCode" = ANY($1::text[])`, [fsmCodes]);
  const postTrackMap = new Map(postTrackQ.rows.map((r) => [r.shipmentCode, r.currentStatus]));
  const postTlQ = await trackPool.query(`SELECT "eventId" FROM "TimelineEvent" WHERE "eventId" = ANY($1::text[])`, [attackIds.map((x) => x.evId)]);
  const tlFoundSet = new Set(postTlQ.rows.map((r) => r.eventId));

  for (const a of attackIds) {
    const actualShipStatus = postShipMap.get(a.code);
    const actualTrackStatus = postTrackMap.get(a.code);
    exp4aRows.push({
      shipment_code: a.code,
      expected_authoritative_status: a.expectedState,
      injected_ooo_event: a.evType,
      actual_ship_status: actualShipStatus,
      fsm_preserved: actualShipStatus === a.expectedState ? 1 : 0,
      timeline_archived: tlFoundSet.has(a.evId) ? 1 : 0,
      tracking_current_status: actualTrackStatus ?? '',
    });
  }

  // Test Lock Enforcement at scan-service (20 HTTP probes: lock 5 shipments in DB, send 10 normal blocked + 10 INVENTORY_CHECK bypasses)
  const lockCodes = fsmCodes.slice(15, 20);
  await shipPool.query(`UPDATE shipments SET "isLocked" = true WHERE code = ANY($1::text[])`, [lockCodes]);
  const lockProbeRows = [];
  for (let i = 0; i < 10; i++) {
    const c = lockCodes[i % 5];
    const rBlock = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `lock-blk-${i}-${Date.now()}` }),
    });
    await rBlock.text();
    lockProbeRows.push({ type: 'Normal_Scan_Locked', status: rBlock.status, passed_policy: rBlock.status === 400 ? 1 : 0 });

    const rAllow = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `lock-inv-${i}-${Date.now()}`, note: 'INVENTORY_CHECK AUDIT' }),
    });
    await rAllow.text();
    lockProbeRows.push({ type: 'Inventory_Check_Locked', status: rAllow.status, passed_policy: rAllow.status === 201 ? 1 : 0 });
  }
  await waitRabbitmqDrained(8000);
  writeCsv(
    'exp4a_fsm_and_locks.csv',
    ['shipment_code', 'expected_authoritative_status', 'injected_ooo_event', 'actual_ship_status', 'fsm_preserved', 'timeline_archived', 'tracking_current_status'],
    exp4aRows,
  );
  console.log(
    `FSM Invariant preserved: ${exp4aRows.filter((x) => x.fsm_preserved === 1).length}/${exp4aRows.length}, Timeline audited: ${exp4aRows.filter((x) => x.timeline_archived === 1).length}/${exp4aRows.length}, Lock policy: ${lockProbeRows.filter((x) => x.passed_policy === 1).length}/${lockProbeRows.length}`,
  );

  // =======================================================================
  // EXPERIMENT 4B: Live Multi-Tier TTL Retry (10s -> 1m -> DLQ) & Self-Healing
  // =======================================================================
  console.log('\n=== [4B] Live Multi-Tier TTL Retry & Self-Healing Recovery (~80s) ===');
  const healCodes = Array.from({ length: 5 }, (_, i) => `33399300000${i + 1}`);
  const poisonCodes = Array.from({ length: 5 }, (_, i) => `33399399900${i + 1}`);
  const dlqTimeline = [];
  const t4Start = Date.now();

  // Inject all 10 scan.inbound events BEFORE their shipment rows exist in shipment_db!
  for (const c of [...healCodes, ...poisonCodes]) {
    await pubDomain('scan.inbound', c, { scanEvent: { locationCode: 'HUB_HN_01' } });
  }

  let healedCreated = false;
  for (let step = 0; step < 160; step++) {
    const elapsedMs = Date.now() - t4Start;
    if (!healedCreated && elapsedMs >= 3000) {
      healedCreated = true;
      for (const c of healCodes) {
        await createShipmentApi(c, { counterWalkIn: true });
      }
      console.log(`  [t=${elapsedMs}ms] Upstream created 5 delayed shipments (should heal cleanly after 10s retry TTL!)`);
    }

    const r = await fetch(`${URLS.rabbitmqMgmt}/queues`, { headers: { Authorization: RMQ_AUTH } });
    const qs = await r.json();
    const mapQ = Object.fromEntries(qs.map((q) => [q.name, q.messages ?? (q.messages_ready ?? 0) + (q.messages_unacknowledged ?? 0)]));
    const healDoneQ = await shipPool.query(
      `SELECT count(*)::int AS cnt FROM shipments WHERE code = ANY($1::text[]) AND "currentStatus" = 'SCAN_INBOUND'`,
      [healCodes],
    );

    const row = {
      step,
      elapsed_s: (elapsedMs / 1000).toFixed(2),
      main_q: mapQ['shipment-service.q'] ?? 0,
      retry_10s: mapQ['shipment-service.retry.10s'] ?? 0,
      retry_1m: mapQ['shipment-service.retry.1m'] ?? 0,
      dlq: mapQ['shipment-service.dlq'] ?? 0,
      healed_count: healDoneQ.rows[0].cnt,
    };
    dlqTimeline.push(row);

    if (elapsedMs > 72000 && row.retry_10s === 0 && row.retry_1m === 0 && row.main_q === 0 && row.healed_count === 5 && row.dlq >= 5) {
      break;
    }
    await sleep(500);
  }
  await fsmCh.close();
  await conn.close();
  writeCsv('exp4b_dlq_recovery_timeline.csv', ['step', 'elapsed_s', 'main_q', 'retry_10s', 'retry_1m', 'dlq', 'healed_count'], dlqTimeline);

  const finalDlqRow = dlqTimeline[dlqTimeline.length - 1];
  runMeta.finishedAtIso = new Date().toISOString();
  runMeta.idemIntegrity = idemIntegrity;
  runMeta.lockProbes = lockProbeRows;
  runMeta.transportTotalsMs = {
    HTTP_Mgmt_Sequential_200msgs: Number(httpTotalMs.toFixed(2)),
    AMQP_Confirm_Sequential_200msgs: Number(amqpSeqTotalMs.toFixed(2)),
    AMQP_Confirm_Batch50_200msgs: Number(amqpBatchTotalMs.toFixed(2)),
  };
  runMeta.dlqFinal = finalDlqRow;
  fs.writeFileSync(path.join(OUT_DIR, 'benchmark_raw_summary.json'), JSON.stringify(runMeta, null, 2));
  console.log('\n=== BENCHMARK COMPLETE ===');
  console.log('Summary written to', path.join(OUT_DIR, 'benchmark_raw_summary.json'));

  await scanPool.end();
  await shipPool.end();
  await trackPool.end();
  await repPool.end();
  await basePool.end();
}

main().catch((err) => {
  console.error('BENCHMARK FAILED:', err);
  process.exit(1);
});

