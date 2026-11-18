#!/usr/bin/env node
/**
 * Live Empirical Benchmark Suite v2 for Nexus Event-Driven Outbox & CQRS Paper
 * Addresses full experimental rigor:
 *  - Dynamic hardware & database configuration introspection
 *  - Explicit warmup phase eliminating cold-pool / JIT artifacts
 *  - R = 5 independent repeated runs with block-rotated comparator execution
 *  - 5 write comparators + isolated LockRPC probe:
 *      Nexus_EDA | Ablation_Outbox_SQL | Sync_DeferredKPI | Sync_Sharded (16-shard) | Sync_ALL | LockRPC_Probe
 *  - Live PostgreSQL 16 lock/wait profiler (pg_stat_activity, pg_locks NOT granted, pg_stat_database)
 *    paired with host CPU utilization (os.cpus user/sys/busy %) per tier & read saturation run
 *  - Exp 1C CQRS Read Isolation across R = 5 runs vs Sync_Sharded, Sync_DeferredKPI, and Sync_ALL
 *  - Exp 2A (R=5 x 40 = 200 clean staggered parcels), Exp 2B (R=5 x 200 bursts), Exp 2C (R=5 x 200 msgs),
 *    Exp 2D (independent non-circular L_batch component micro-probes)
 *  - Exp 3 & 3C (R=5 runs clean drained idempotency + F2 pop-ahead crash-window probe)
 *  - Exp 4A (60 FSM attacks + F1 view skew + 60 phased lock probes + 20 F3 interleaved TOCTOU probes)
 *  - Exp 4B (10 transient + 10 poison faults + direct AMQP x-death header timestamp verification)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fork } from 'node:child_process';
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
const BASELINE_URL = `http://127.0.0.1:${URLS.baselineSyncPort}`;
const RMQ_AUTH = 'Basic ' + Buffer.from('guest:guest').toString('base64');

const scanPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/scan_db', max: 5 });
const shipPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/shipment_db', max: 5 });
const trackPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/tracking_db', max: 5 });
const repPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/reporting_db', max: 5 });
const setupPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/postgres', max: 6 });
const monPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:15432/postgres', max: 2 });

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

function summarizeArr(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return { mean: 0, sd: 0, p50: 0, p95: 0, p99: 0 };
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1 ? s.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1) : 0;
  const pct = (p) => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
  };
  return {
    mean,
    sd: Math.sqrt(variance),
    p50: pct(50),
    p95: pct(95),
    p99: pct(99),
  };
}

function getCpuTimes() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (const c of cpus) {
    user += c.times.user;
    nice += c.times.nice;
    sys += c.times.sys;
    idle += c.times.idle;
    irq += c.times.irq;
  }
  return { user: user + nice, sys: sys + irq, idle, total: user + nice + sys + irq + idle };
}

async function getPgDbStats() {
  const q = await monPool.query(`
    SELECT COALESCE(sum(xact_commit),0)::bigint AS xact_commit,
           COALESCE(sum(xact_rollback),0)::bigint AS xact_rollback,
           COALESCE(sum(deadlocks),0)::bigint AS deadlocks
    FROM pg_stat_database
    WHERE datname IN ('postgres', 'scan_db', 'shipment_db', 'tracking_db', 'reporting_db')
  `);
  return {
    xact_commit: Number(q.rows[0].xact_commit),
    xact_rollback: Number(q.rows[0].xact_rollback),
    deadlocks: Number(q.rows[0].deadlocks),
  };
}

async function withResourceMonitor(metaTag, fn) {
  const cpuStart = getCpuTimes();
  const dbStart = await getPgDbStats();
  let running = true;
  const samples = [];

  const samplerLoop = (async () => {
    while (running) {
      try {
        const q = await monPool.query(`
          SELECT
            count(*) FILTER (WHERE state = 'active')::int AS active,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'Lock')::int AS lock_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'Lock' AND wait_event = 'transactionid')::int AS txid_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'Lock' AND wait_event = 'tuple')::int AS tuple_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'Lock' AND wait_event IN ('relation','extend','page'))::int AS rel_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'LWLock')::int AS lwlock_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type = 'IO')::int AS io_wait,
            count(*) FILTER (WHERE state = 'active' AND wait_event_type IS NULL)::int AS cpu_running,
            (SELECT count(*)::int FROM pg_locks WHERE NOT granted) AS ungranted_locks
          FROM pg_stat_activity
          WHERE pid <> pg_backend_pid()
            AND state IS NOT NULL
            AND datname IN ('postgres', 'scan_db', 'shipment_db', 'tracking_db', 'reporting_db')
        `);
        samples.push(q.rows[0]);
      } catch {
        // ignore transient cancel on teardown
      }
      if (running) await sleep(5);
    }
  })();

  let fnResult;
  try {
    fnResult = await fn();
  } finally {
    running = false;
    await samplerLoop;
  }

  const cpuEnd = getCpuTimes();
  const dbEnd = await getPgDbStats();
  const dTotal = Math.max(1, cpuEnd.total - cpuStart.total);
  const cpuUserPct = ((cpuEnd.user - cpuStart.user) / dTotal) * 100.0;
  const cpuSysPct = ((cpuEnd.sys - cpuStart.sys) / dTotal) * 100.0;
  const cpuBusyPct = 100.0 - ((cpuEnd.idle - cpuStart.idle) / dTotal) * 100.0;

  const n = Math.max(1, samples.length);
  const sum = (k) => samples.reduce((acc, s) => acc + (s[k] || 0), 0);
  const maxOf = (k) => samples.reduce((acc, s) => Math.max(acc, s[k] || 0), 0);

  const totalActive = sum('active');
  const totalLockWait = sum('lock_wait');
  const totalTxid = sum('txid_wait');
  const totalTuple = sum('tuple_wait');
  const totalRel = sum('rel_wait');
  const totalLwlock = sum('lwlock_wait');
  const totalIo = sum('io_wait');
  const totalCpuRun = sum('cpu_running');
  const samplesWithLockWait = samples.filter((s) => (s.lock_wait || 0) > 0 || (s.ungranted_locks || 0) > 0).length;

  const telemetry = {
    ...metaTag,
    samples: samples.length,
    mean_active_backends: Number((totalActive / n).toFixed(3)),
    max_active_backends: maxOf('active'),
    lock_wait_sample_pct: Number(((samplesWithLockWait / n) * 100.0).toFixed(2)),
    lock_wait_backend_share_pct: totalActive > 0 ? Number(((totalLockWait / totalActive) * 100.0).toFixed(2)) : 0,
    lock_txid_waits: totalTxid,
    lock_tuple_waits: totalTuple,
    lock_rel_waits: totalRel,
    lwlock_waits: totalLwlock,
    io_waits: totalIo,
    cpu_running_backends: totalCpuRun,
    ungranted_locks_sum: sum('ungranted_locks'),
    ungranted_locks_max: maxOf('ungranted_locks'),
    pg_xact_commit_delta: dbEnd.xact_commit - dbStart.xact_commit,
    pg_xact_rollback_delta: dbEnd.xact_rollback - dbStart.xact_rollback,
    pg_deadlocks_delta: dbEnd.deadlocks - dbStart.deadlocks,
    host_cpu_busy_pct: Number(cpuBusyPct.toFixed(2)),
    host_cpu_user_pct: Number(cpuUserPct.toFixed(2)),
    host_cpu_sys_pct: Number(cpuSysPct.toFixed(2)),
    loadavg_1m: Number(os.loadavg()[0].toFixed(2)),
  };

  return { fnResult, telemetry };
}

async function waitRabbitmqDrained(timeoutMs = 35000, waitReportingQueue = true) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${URLS.rabbitmqMgmt}/queues`, {
      headers: { Authorization: RMQ_AUTH },
    });
    const qs = await res.json();
    const active = qs.filter((q) => {
      if (q.name.includes('.dlq') || q.name.includes('.retry.')) return false;
      if (!waitReportingQueue && q.name === 'reporting-service.q') return false;
      return (q.messages_ready ?? 0) > 0 || (q.messages_unacknowledged ?? 0) > 0;
    });
    const pendingOutbox = await scanPool.query(`SELECT count(*)::int AS cnt FROM "OutboxEvent" WHERE status = 'PENDING'`);
    const shipPending = await shipPool.query(`SELECT count(*)::int AS cnt FROM outbox_events WHERE status = 'PENDING'`);
    if (active.length === 0 && pendingOutbox.rows[0].cnt === 0 && shipPending.rows[0].cnt === 0) {
      await sleep(waitReportingQueue ? 800 : 350);
      return true;
    }
    await sleep(250);
  }
  console.warn('[WARN] Timed out waiting for queues/outbox to drain completely.');
  return false;
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
        source: 'dist-benchmark-v2',
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

async function setupBaselineAndAblationTables(codes) {
  await setupPool.query(`
    DROP TABLE IF EXISTS bench_sync_timeline;
    DROP TABLE IF EXISTS bench_sync_scan_events;
    DROP TABLE IF EXISTS bench_sync_tracking_current;
    DROP TABLE IF EXISTS bench_sync_kpi_daily;
    DROP TABLE IF EXISTS bench_sync_kpi_sharded;
    DROP TABLE IF EXISTS bench_sync_shipments;
    DROP TABLE IF EXISTS bench_ablation_idempotency;
    DROP TABLE IF EXISTS bench_ablation_scan_events;
    DROP TABLE IF EXISTS bench_ablation_current_location;
    DROP TABLE IF EXISTS bench_ablation_outbox_events;
    DROP TABLE IF EXISTS bench_ablation_shipments;

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
    CREATE INDEX bench_sync_tl_ship_idx ON bench_sync_timeline(shipment_code, occurred_at DESC);

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

    CREATE TABLE bench_sync_kpi_sharded (
      metric_date DATE NOT NULL,
      shard_id INT NOT NULL,
      courier_code TEXT NOT NULL,
      hub_code TEXT NOT NULL,
      zone_code TEXT NOT NULL,
      scans_inbound INT NOT NULL DEFAULT 0,
      PRIMARY KEY (metric_date, shard_id, courier_code, hub_code, zone_code)
    );

    CREATE TABLE bench_ablation_shipments (
      code TEXT PRIMARY KEY,
      current_status TEXT NOT NULL,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE bench_ablation_idempotency (
      idempotency_key TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      response_payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE bench_ablation_scan_events (
      id TEXT PRIMARY KEY,
      shipment_code TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      location_code TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE bench_ablation_current_location (
      shipment_code TEXT PRIMARY KEY,
      location_code TEXT NOT NULL,
      last_scan_type TEXT NOT NULL,
      last_scan_event_id TEXT NOT NULL,
      last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE bench_ablation_outbox_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      event_type TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      routing_key TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const hubs = ['HUB_HCM_01', 'HUB_DN_01', 'HUB_HN_01'];
  const zones = ['SOUTH', 'CENTRAL', 'NORTH'];
  const couriers = ['C01', 'C02', 'C03', 'C04', 'C05'];
  for (let i = 0; i < codes.length; i++) {
    await setupPool.query(
      `INSERT INTO bench_sync_shipments(code, current_status, courier_code, hub_code, zone_code)
       VALUES ($1, 'PICKUP_COMPLETED', $2, $3, $4)`,
      [codes[i], couriers[i % couriers.length], hubs[i % hubs.length], zones[i % zones.length]],
    );
    await setupPool.query(
      `INSERT INTO bench_ablation_shipments(code, current_status, is_locked) VALUES ($1, 'PICKUP_COMPLETED', FALSE)`,
      [codes[i]],
    );
  }
}

async function truncateBaselineTransientTables() {
  await setupPool.query(`
    TRUNCATE bench_sync_timeline, bench_sync_scan_events, bench_sync_tracking_current,
             bench_sync_kpi_daily, bench_sync_kpi_sharded,
             bench_ablation_idempotency, bench_ablation_scan_events,
             bench_ablation_current_location, bench_ablation_outbox_events;
  `);
}

async function dropBaselineAndAblationTables() {
  await setupPool.query(`
    DROP TABLE IF EXISTS bench_sync_timeline;
    DROP TABLE IF EXISTS bench_sync_scan_events;
    DROP TABLE IF EXISTS bench_sync_tracking_current;
    DROP TABLE IF EXISTS bench_sync_kpi_daily;
    DROP TABLE IF EXISTS bench_sync_kpi_sharded;
    DROP TABLE IF EXISTS bench_sync_shipments;
    DROP TABLE IF EXISTS bench_ablation_idempotency;
    DROP TABLE IF EXISTS bench_ablation_scan_events;
    DROP TABLE IF EXISTS bench_ablation_current_location;
    DROP TABLE IF EXISTS bench_ablation_outbox_events;
    DROP TABLE IF EXISTS bench_ablation_shipments;
  `);
}

function startBaselineWorkerProcess() {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve('docs/research/paper/data_distributed/baseline_worker.mjs');
    const child = fork(workerPath, [], {
      env: { ...process.env, BASELINE_PORT: String(URLS.baselineSyncPort) },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    child.on('message', (msg) => {
      if (msg?.ready) resolve(child);
    });
    child.on('error', reject);
    setTimeout(() => reject(new Error('Baseline worker startup timeout')), 10000);
  });
}

async function collectHardwareMeta() {
  const cpus = os.cpus();
  const pgVerQ = await setupPool.query(`SHOW server_version`);
  const pgMaxQ = await setupPool.query(`SHOW max_connections`);
  const pgBufQ = await setupPool.query(`SHOW shared_buffers`);
  let rmqOverview = {};
  try {
    const r = await fetch(`${URLS.rabbitmqMgmt}/overview`, { headers: { Authorization: RMQ_AUTH } });
    const ov = await r.json();
    rmqOverview = {
      rabbitmq_version: ov.rabbitmq_version,
      erlang_version: ov.erlang_version,
      rates_mode: ov.rates_mode,
    };
  } catch {}
  return {
    os_platform: os.platform(),
    os_release: os.release(),
    arch: os.arch(),
    cpu_model: cpus[0]?.model ?? 'unknown',
    cpu_cores: cpus.length,
    total_mem_gb: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    node_version: process.version,
    service_runtime: 'Native macOS Node.js PM2 processes backed by Docker PostgreSQL 16 & RabbitMQ 3.13',
    postgres_version: pgVerQ.rows[0].server_version,
    postgres_max_connections: Number(pgMaxQ.rows[0].max_connections),
    postgres_shared_buffers: pgBufQ.rows[0].shared_buffers,
    pm2_service_pools: {
      scan_service_pool: 3,
      shipment_service_pool: 15,
      tracking_service_pool: 3,
      reporting_service_pool: 3,
      reporting_consumer_interval_ms: 1000,
      reporting_consumer_batch_size: 20,
    },
    baseline_pool_cap: 21,
    ablation_p3_pool_cap: 3,
    rabbitmq: rmqOverview,
  };
}

async function main() {
  const runMeta = {
    startedAtIso: new Date().toISOString(),
    hardware: await collectHardwareMeta(),
    repeats_R: 5,
    notes: [
      'Explicit warmup executed prior to all R=5 timed repetitions.',
      'Baseline and ablation endpoints execute inside isolated child process (:13099, pg pool=21) symmetric with NestJS services.',
    ],
  };
  console.log('Hardware & Engine Metadata:', JSON.stringify(runMeta.hardware, null, 2));

  console.log('\n=== [0] SEEDING 420 BENCHMARK SHIPMENTS & ISOLATED WORKER ===');
  const poolCodes = Array.from({ length: 420 }, (_, i) => `333991${String(i + 1).padStart(6, '0')}`);
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
  await waitRabbitmqDrained(30000, true);
  console.log(`Seeded ${poolCodes.length} benchmark shipments & drained all queues.`);

  await setupBaselineAndAblationTables(poolCodes);
  const baselineChild = await startBaselineWorkerProcess();
  console.log(`Started isolated baseline/ablation worker pid=${baselineChild.pid} on :${URLS.baselineSyncPort}`);

  // =========================================================================
  // EXPLICIT WARMUP PHASE (Eliminates cold TCP / Prisma / JIT initialization)
  // =========================================================================
  console.log('\n=== [WARMUP] Warming HTTP pools, Prisma engines, and public tracking ===');
  const warmCodes = poolCodes.slice(400, 420);
  const tWarm0 = performance.now();
  await runPool(Array.from({ length: 40 }, (_, i) => i), 10, async (i) => {
    const code = warmCodes[i % warmCodes.length];
    await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', actor: 'WARMUP', idempotencyKey: `warm-eda-${i}-${Date.now()}` }),
    }).then((r) => r.text());
    await fetch(`${BASELINE_URL}/ablation-outbox-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', idempotencyKey: `warm-abl-${i}-${Date.now()}` }),
    }).then((r) => r.text());
    await fetch(`${BASELINE_URL}/ablation-outbox-p3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', idempotencyKey: `warm-ablp3-${i}-${Date.now()}` }),
    }).then((r) => r.text());
    for (const ep of ['/sync-scan-nokpi', '/sync-scan-sharded', '/sync-scan-all']) {
      await fetch(`${BASELINE_URL}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', idempotencyKey: `warm-${ep}-${i}-${Date.now()}` }),
      }).then((r) => r.text());
    }
    await fetch(`${URLS.shipment}/shipments/${code}`).then((r) => r.text());
  });
  await waitRabbitmqDrained(25000, true);
  await runPool(Array.from({ length: 60 }, (_, i) => warmCodes[i % warmCodes.length]), 15, async (c) => {
    await fetch(`${URLS.tracking}/public/track/${c}`).then((r) => r.text());
    await fetch(`${BASELINE_URL}/sync-track-all/${c}`).then((r) => r.text());
    await fetch(`${BASELINE_URL}/sync-track-sharded/${c}`).then((r) => r.text());
    await fetch(`${BASELINE_URL}/sync-track-nokpi/${c}`).then((r) => r.text());
  });
  await truncateBaselineTransientTables();
  runMeta.warmupDurationMs = Number((performance.now() - tWarm0).toFixed(1));
  console.log(`Warmup complete in ${runMeta.warmupDurationMs} ms (excluded from benchmark stats).`);

  // =========================================================================
  // EXPERIMENT 1: R=5 Repeats Concurrency Scaling + Ablation + PG Lock & CPU
  // =========================================================================
  console.log('\n=== [1] EXPERIMENT 1: R=5 Runs x 5 Tiers x 6 Comparators + PG Lock/CPU Telemetry ===');
  const R = 5;
  const concurrencies = [1, 10, 25, 50, 100];
  const reqsPerTier = 200;
  const lockProbeReqs = 100;
  const exp1ReqRows = [];
  const exp1RunRows = [];
  const exp1TelRows = [];

  const targets = [
    { name: 'Nexus_EDA', nReqs: reqsPerTier, isNexus: true },
    { name: 'Ablation_Outbox_P3', nReqs: reqsPerTier, isNexus: false, endpoint: `${BASELINE_URL}/ablation-outbox-p3` },
    { name: 'Ablation_Outbox_SQL', nReqs: reqsPerTier, isNexus: false, endpoint: `${BASELINE_URL}/ablation-outbox-scan` },
    { name: 'Sync_DeferredKPI', nReqs: reqsPerTier, isNexus: false, endpoint: `${BASELINE_URL}/sync-scan-nokpi` },
    { name: 'Sync_Sharded', nReqs: reqsPerTier, isNexus: false, endpoint: `${BASELINE_URL}/sync-scan-sharded` },
    { name: 'Sync_ALL', nReqs: reqsPerTier, isNexus: false, endpoint: `${BASELINE_URL}/sync-scan-all` },
    { name: 'LockRPC_Probe', nReqs: lockProbeReqs, isNexus: false, isGetProbe: true },
  ];

  for (let runIdx = 1; runIdx <= R; runIdx++) {
    console.log(`\n--- Exp 1 Run ${runIdx}/${R} ---`);
    // Rotate execution order across runs to eliminate monotonic thermal/GC bias
    const rotated = targets.map((_, k) => targets[(k + runIdx - 1) % targets.length]);

    for (const c of concurrencies) {
      for (const tgt of rotated) {
        const items = Array.from({ length: tgt.nReqs }, (_, i) => ({
          code: poolCodes[i % 200],
          key: `e1-r${runIdx}-${tgt.name}-c${c}-${i}-${Date.now()}`,
          hub: hubs[i % hubs.length],
        }));

        const { fnResult, telemetry } = await withResourceMonitor(
          { run: runIdx, architecture: tgt.name, concurrency: c },
          async () => {
            const wallStart = performance.now();
            const resList = await runPool(items, c, async (item, i) => {
              const t0 = performance.now();
              let status = 0;
              let ok = false;
              let errMsg = '';
              try {
                let r;
                if (tgt.isGetProbe) {
                  r = await fetch(`${URLS.shipment}/shipments/${item.code}`);
                } else if (tgt.isNexus) {
                  r = await fetch(`${URLS.scan}/scans/inbound`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      shipmentCode: item.code,
                      locationCode: item.hub,
                      actor: 'BENCH_PDA',
                      idempotencyKey: item.key,
                      note: `E1 r=${runIdx} c=${c}`,
                    }),
                  });
                } else {
                  r = await fetch(tgt.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      shipmentCode: item.code,
                      locationCode: item.hub,
                      idempotencyKey: item.key,
                      payloadMeta: { actor: 'BENCH_PDA', run: runIdx, c },
                    }),
                  });
                }
                status = r.status;
                ok = r.ok;
                await r.text();
              } catch (e) {
                errMsg = e.message;
              }
              return {
                run: runIdx,
                architecture: tgt.name,
                concurrency: c,
                req_idx: i,
                shipment_code: item.code,
                status_code: status,
                ok: ok ? 1 : 0,
                latency_ms: Number((performance.now() - t0).toFixed(3)),
                error: errMsg,
              };
            });
            const wallMs = performance.now() - wallStart;
            return { resList, wallMs };
          },
        );

        const { resList, wallMs } = fnResult;
        const rps = tgt.nReqs / (wallMs / 1000.0);
        const latStats = summarizeArr(resList.map((x) => x.latency_ms));
        const okCnt = resList.filter((x) => x.ok === 1).length;

        for (const row of resList) {
          exp1ReqRows.push({
            ...row,
            latency_ms: row.latency_ms.toFixed(3),
            tier_wall_ms: wallMs.toFixed(2),
            tier_throughput_rps: rps.toFixed(2),
          });
        }
        exp1RunRows.push({
          run: runIdx,
          architecture: tgt.name,
          concurrency: c,
          n: tgt.nReqs,
          ok_cnt: okCnt,
          wall_ms: wallMs.toFixed(2),
          throughput_rps: rps.toFixed(2),
          mean_ms: latStats.mean.toFixed(3),
          sd_ms: latStats.sd.toFixed(3),
          p50_ms: latStats.p50.toFixed(3),
          p95_ms: latStats.p95.toFixed(3),
          p99_ms: latStats.p99.toFixed(3),
        });
        exp1TelRows.push(telemetry);

        console.log(
          `  [R${runIdx} c=${String(c).padStart(3)} ${tgt.name.padEnd(19)}] ` +
          `rps=${rps.toFixed(1).padStart(7)} p50=${latStats.p50.toFixed(2).padStart(6)}ms p95=${latStats.p95.toFixed(2).padStart(6)}ms ` +
          `LockWait=${String(telemetry.lock_wait_sample_pct).padStart(5)}% (txid=${telemetry.lock_txid_waits}, ungrantedMax=${telemetry.ungranted_locks_max}) CPU=${telemetry.host_cpu_busy_pct}%`
        );

        if (tgt.isNexus) {
          await waitRabbitmqDrained(45000, true);
        } else {
          await sleep(120);
        }
      }
    }
  }

  writeCsv(
    'exp1_scaling_requests.csv',
    ['run', 'architecture', 'concurrency', 'req_idx', 'shipment_code', 'status_code', 'ok', 'latency_ms', 'tier_wall_ms', 'tier_throughput_rps', 'error'],
    exp1ReqRows,
  );
  writeCsv(
    'exp1_scaling_runs.csv',
    ['run', 'architecture', 'concurrency', 'n', 'ok_cnt', 'wall_ms', 'throughput_rps', 'mean_ms', 'sd_ms', 'p50_ms', 'p95_ms', 'p99_ms'],
    exp1RunRows,
  );
  writeCsv(
    'exp1_resource_telemetry.csv',
    [
      'run', 'architecture', 'concurrency', 'samples', 'mean_active_backends', 'max_active_backends',
      'lock_wait_sample_pct', 'lock_wait_backend_share_pct', 'lock_txid_waits', 'lock_tuple_waits', 'lock_rel_waits',
      'lwlock_waits', 'io_waits', 'cpu_running_backends', 'ungranted_locks_sum', 'ungranted_locks_max',
      'pg_xact_commit_delta', 'pg_xact_rollback_delta', 'pg_deadlocks_delta',
      'host_cpu_busy_pct', 'host_cpu_user_pct', 'host_cpu_sys_pct', 'loadavg_1m',
    ],
    exp1TelRows,
  );
  await waitRabbitmqDrained(60000, true);

  // =========================================================================
  // EXPERIMENT 1C: CQRS Read Isolation Under c=50 Write Saturation (R=5 Runs)
  // =========================================================================
  console.log('\n=== [1C] CQRS Read Isolation Benchmark (R=5 runs, Idle vs c=50 Writes) ===');
  const readRows = [];
  const readRunRows = [];
  const readTelRows = [];
  const N_READS = 200;

  async function measureReads(runIdx, arch, condition, readUrlFn) {
    const items = Array.from({ length: N_READS }, (_, i) => poolCodes[i % 200]);
    const t0 = performance.now();
    const res = await runPool(items, 25, async (code, i) => {
      const rt0 = performance.now();
      const r = await fetch(readUrlFn(code));
      await r.text();
      return {
        run: runIdx,
        architecture: arch,
        condition,
        req_idx: i,
        shipment_code: code,
        status_code: r.status,
        ok: r.ok ? 1 : 0,
        latency_ms: Number((performance.now() - rt0).toFixed(3)),
      };
    });
    return { res, wallMs: performance.now() - t0 };
  }

  const readConfigs = [
    {
      arch: 'Nexus_CQRS_Read',
      isNexus: true,
      readFn: (c) => `${URLS.tracking}/public/track/${c}`,
      writeFn: (i, runIdx) =>
        fetch(`${URLS.scan}/scans/inbound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 200],
            locationCode: 'HUB_HCM_01',
            actor: 'SAT_WRITER',
            idempotencyKey: `sat-r${runIdx}-eda-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
    },
    {
      arch: 'Sync_Sharded',
      isNexus: false,
      readFn: (c) => `${BASELINE_URL}/sync-track-sharded/${c}`,
      writeFn: (i, runIdx) =>
        fetch(`${BASELINE_URL}/sync-scan-sharded`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 200],
            locationCode: 'HUB_HCM_01',
            idempotencyKey: `sat-r${runIdx}-shr-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
    },
    {
      arch: 'Sync_DeferredKPI',
      isNexus: false,
      readFn: (c) => `${BASELINE_URL}/sync-track-nokpi/${c}`,
      writeFn: (i, runIdx) =>
        fetch(`${BASELINE_URL}/sync-scan-nokpi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 200],
            locationCode: 'HUB_HCM_01',
            idempotencyKey: `sat-r${runIdx}-nokpi-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
    },
    {
      arch: 'Sync_ALL',
      isNexus: false,
      readFn: (c) => `${BASELINE_URL}/sync-track-all/${c}`,
      writeFn: (i, runIdx) =>
        fetch(`${BASELINE_URL}/sync-scan-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentCode: poolCodes[i % 200],
            locationCode: 'HUB_HCM_01',
            idempotencyKey: `sat-r${runIdx}-all-${i}-${Date.now()}-${Math.random()}`,
          }),
        }).then((r) => r.text()),
    },
  ];

  for (let runIdx = 1; runIdx <= R; runIdx++) {
    const rotConfigs = readConfigs.map((_, k) => readConfigs[(k + runIdx - 1) % readConfigs.length]);

    // Idle pass first
    for (const cfg of rotConfigs) {
      const { fnResult, telemetry } = await withResourceMonitor(
        { run: runIdx, architecture: cfg.arch, condition: 'Idle' },
        () => measureReads(runIdx, cfg.arch, 'Idle', cfg.readFn),
      );
      const st = summarizeArr(fnResult.res.map((x) => x.latency_ms));
      for (const row of fnResult.res) {
        readRows.push({ ...row, latency_ms: row.latency_ms.toFixed(3) });
      }
      readRunRows.push({
        run: runIdx,
        architecture: cfg.arch,
        condition: 'Idle',
        n: N_READS,
        mean_ms: st.mean.toFixed(3),
        sd_ms: st.sd.toFixed(3),
        p50_ms: st.p50.toFixed(3),
        p95_ms: st.p95.toFixed(3),
      });
      readTelRows.push(telemetry);
    }

    // Under c=50 concurrent write saturation pass
    for (const cfg of rotConfigs) {
      let stopWriters = false;
      let wCounter = 0;
      const writers = Array.from({ length: 50 }, async () => {
        while (!stopWriters) {
          const idx = wCounter++;
          await cfg.writeFn(idx, runIdx).catch(() => {});
        }
      });
      await sleep(300);
      const { fnResult, telemetry } = await withResourceMonitor(
        { run: runIdx, architecture: cfg.arch, condition: 'Under_Write_Load_c50' },
        () => measureReads(runIdx, cfg.arch, 'Under_Write_Load_c50', cfg.readFn),
      );
      stopWriters = true;
      await Promise.all(writers);

      const st = summarizeArr(fnResult.res.map((x) => x.latency_ms));
      for (const row of fnResult.res) {
        readRows.push({ ...row, latency_ms: row.latency_ms.toFixed(3) });
      }
      readRunRows.push({
        run: runIdx,
        architecture: cfg.arch,
        condition: 'Under_Write_Load_c50',
        n: N_READS,
        mean_ms: st.mean.toFixed(3),
        sd_ms: st.sd.toFixed(3),
        p50_ms: st.p50.toFixed(3),
        p95_ms: st.p95.toFixed(3),
      });
      readTelRows.push(telemetry);
      console.log(
        `  [1C R${runIdx} ${cfg.arch.padEnd(16)}] c=50 Read p50=${st.p50.toFixed(2)}ms p95=${st.p95.toFixed(2)}ms ` +
        `LockWait=${telemetry.lock_wait_sample_pct}% CPU=${telemetry.host_cpu_busy_pct}%`,
      );
      if (cfg.isNexus) await waitRabbitmqDrained(60000, true);
    }
  }

  writeCsv('exp1_read_isolation.csv', ['run', 'architecture', 'condition', 'req_idx', 'shipment_code', 'status_code', 'ok', 'latency_ms'], readRows);
  writeCsv('exp1c_read_runs.csv', ['run', 'architecture', 'condition', 'n', 'mean_ms', 'sd_ms', 'p50_ms', 'p95_ms'], readRunRows);
  writeCsv(
    'exp1c_read_telemetry.csv',
    [
      'run', 'architecture', 'condition', 'samples', 'mean_active_backends', 'max_active_backends',
      'lock_wait_sample_pct', 'lock_wait_backend_share_pct', 'lock_txid_waits', 'lock_tuple_waits', 'lock_rel_waits',
      'lwlock_waits', 'io_waits', 'cpu_running_backends', 'ungranted_locks_sum', 'ungranted_locks_max',
      'pg_xact_commit_delta', 'pg_xact_rollback_delta', 'pg_deadlocks_delta',
      'host_cpu_busy_pct', 'host_cpu_user_pct', 'host_cpu_sys_pct', 'loadavg_1m',
    ],
    readTelRows,
  );

  // Cleanly stop isolated baseline/ablation worker & drop temporary tables so Nexus cluster runs alone for Exp 2-4
  baselineChild.kill('SIGTERM');
  await dropBaselineAndAblationTables();
  console.log('Stopped baseline worker and dropped temporary SQL baseline/ablation tables.');
  await waitRabbitmqDrained(45000, true);

  // =========================================================================
  // EXPERIMENT 2A: End-to-End Stage Propagation Lag (R=5 Runs x 40 = 200 Clean Scans)
  // =========================================================================
  console.log('\n=== [2A] Stage Propagation Lag Decomposition (R=5 runs x 40 clean scans = 200) ===');
  const exp2aRows = [];
  for (let runIdx = 1; runIdx <= R; runIdx++) {
    await waitRabbitmqDrained(30000, true);
    const offset = 200 + (runIdx - 1) * 40;
    const stageShipments = poolCodes.slice(offset, offset + 40);
    const metaList = [];
    const scanIds = [];

    for (let i = 0; i < stageShipments.length; i++) {
      const code = stageShipments[i];
      const idem = `exp2a-r${runIdx}-s${i}-${Date.now()}`;
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
      metaList.push({ run: runIdx, idx: i, shipment_code: code, scan_event_id: body.scanEvent.id, ingest_http_ms: ingestMs });
      scanIds.push(body.scanEvent.id);
      const staggerMs = 60 + Math.floor(Math.random() * 150);
      metaList[metaList.length - 1].stagger_ms = staggerMs;
      await sleep(staggerMs);
    }

    // Wait explicitly until all 40 events drain through both AMQP push & HTTP Reporting pull!
    await waitRabbitmqDrained(30000, true);
    const outboxQ = await scanPool.query(
      `SELECT "aggregateId" AS scan_id, "eventId" AS event_id,
              EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS outbox_created_ms,
              EXTRACT(EPOCH FROM ("publishedAt" AT TIME ZONE 'UTC'))*1000.0 AS outbox_published_ms
       FROM "OutboxEvent" WHERE "aggregateId" = ANY($1::text[])`,
      [scanIds],
    );
    const outboxMap = new Map(outboxQ.rows.map((r) => [r.scan_id, r]));
    const eventIds = outboxQ.rows.map((r) => r.event_id);

    // Wait until AggregationJob has committed all 40 events cleanly
    const waitRepStart = Date.now();
    while (Date.now() - waitRepStart < 15000) {
      const cQ = await repPool.query(`SELECT count(*)::int AS cnt FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`, [eventIds]);
      if (cQ.rows[0].cnt >= eventIds.length) break;
      await sleep(200);
    }

    const tlQ = await trackPool.query(
      `SELECT "eventId" AS event_id, EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS tl_created_ms
       FROM "TimelineEvent" WHERE "eventId" = ANY($1::text[])`,
      [eventIds],
    );
    const tlMap = new Map(tlQ.rows.map((r) => [r.event_id, r.tl_created_ms]));

    const repQ = await repPool.query(
      `SELECT "jobKey" AS event_id, EXTRACT(EPOCH FROM ("createdAt" AT TIME ZONE 'UTC'))*1000.0 AS rep_created_ms
       FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`,
      [eventIds],
    );
    const repMap = new Map(repQ.rows.map((r) => [r.event_id, r.rep_created_ms]));

    const shipQ = await shipPool.query(
      `SELECT code, "currentStatus", EXTRACT(EPOCH FROM ("updatedAt" AT TIME ZONE 'UTC'))*1000.0 AS ship_updated_ms
       FROM shipments WHERE code = ANY($1::text[])`,
      [stageShipments],
    );
    const shipMap = new Map(shipQ.rows.map((r) => [r.code, r]));

    for (const m of metaList) {
      const ob = outboxMap.get(m.scan_event_id);
      if (!ob || ob.outbox_published_ms === null) continue;
      const tlCreated = tlMap.get(ob.event_id);
      const repCreated = repMap.get(ob.event_id);
      const sh = shipMap.get(m.shipment_code);
      const dwellMs = ob.outbox_published_ms - ob.outbox_created_ms;
      const trackBrokerMs = tlCreated ? tlCreated - ob.outbox_published_ms : null;
      const trackE2eMs = tlCreated ? tlCreated - ob.outbox_created_ms : null;
      const shipFsmMs = sh ? sh.ship_updated_ms - ob.outbox_published_ms : null;
      const shipE2eMs = sh ? sh.ship_updated_ms - ob.outbox_created_ms : null;
      const repPollMs = repCreated ? repCreated - ob.outbox_published_ms : null;
      const repE2eMs = repCreated ? repCreated - ob.outbox_created_ms : null;
      exp2aRows.push({
        run: runIdx,
        idx: m.idx,
        shipment_code: m.shipment_code,
        event_id: ob.event_id,
        stagger_ms: m.stagger_ms,
        ingest_http_ms: m.ingest_http_ms.toFixed(3),
        outbox_dwell_ms: dwellMs.toFixed(3),
        track_broker_ms: trackBrokerMs !== null ? trackBrokerMs.toFixed(3) : '',
        track_e2e_ms: trackE2eMs !== null ? trackE2eMs.toFixed(3) : '',
        ship_fsm_ms: shipFsmMs !== null ? shipFsmMs.toFixed(3) : '',
        ship_e2e_ms: shipE2eMs !== null ? shipE2eMs.toFixed(3) : '',
        rep_poll_ms: repPollMs !== null ? repPollMs.toFixed(3) : '',
        rep_e2e_ms: repE2eMs !== null ? repE2eMs.toFixed(3) : '',
        ship_status: sh?.currentStatus ?? '',
      });
    }
    const rDwell = summarizeArr(exp2aRows.filter((x) => x.run === runIdx).map((x) => Number(x.outbox_dwell_ms)));
    console.log(`  [2A Run ${runIdx}] n=${metaList.length} dwell_mean=${rDwell.mean.toFixed(2)}ms`);
  }
  writeCsv(
    'exp2a_e2e_stage_lags.csv',
    ['run', 'idx', 'shipment_code', 'event_id', 'stagger_ms', 'ingest_http_ms', 'outbox_dwell_ms', 'track_broker_ms', 'track_e2e_ms', 'ship_fsm_ms', 'ship_e2e_ms', 'rep_poll_ms', 'rep_e2e_ms', 'ship_status'],
    exp2aRows,
  );

  // =========================================================================
  // EXPERIMENT 2D: Independent (Non-Circular) L_batch Component Micro-Probes
  // =========================================================================
  console.log('\n=== [2D] Independent Non-Circular L_batch Micro-Probes ===');
  const exp2dRows = [];

  // Probe 1: setInterval(1000) timer wakeup overshoot (20 intervals)
  let timerPrev = performance.now();
  await new Promise((resolve) => {
    let ticks = 0;
    const iv = setInterval(() => {
      const now = performance.now();
      const dt = now - timerPrev;
      timerPrev = now;
      ticks++;
      exp2dRows.push({ component: 'timer_interval_overshoot_ms', idx: ticks, value_ms: (dt - 1000.0).toFixed(3) });
      if (ticks >= 15) {
        clearInterval(iv);
        resolve();
      }
    }, 1000);
  });

  // Probe 2: Outbox listPending(50) SQL query latency (50 probes on scan_db)
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    await scanPool.query(
      `SELECT id, "eventId", "eventType", "aggregateType", "aggregateId", "routingKey", payload, status, "occurredAt", "createdAt"
       FROM "OutboxEvent" WHERE status = 'PENDING' ORDER BY "createdAt" ASC LIMIT 50`,
    );
    exp2dRows.push({ component: 'sql_list_pending_ms', idx: i + 1, value_ms: (performance.now() - t0).toFixed(3) });
  }

  // Probe 3: Outbox markPublished(id, now) SQL update latency on a synthetic probe row (100 updates)
  const dummyOutboxId = crypto.randomUUID();
  try {
    await scanPool.query(
      `INSERT INTO "OutboxEvent"(id, "eventId", "eventType", "aggregateType", "aggregateId", "routingKey", payload, status, "occurredAt", "publishedAt", "updatedAt")
       VALUES ($1, $2, 'scan.probe', 'SCAN_EVENT', 'probe-0', 'scan.probe', '{}'::jsonb, 'PUBLISHED', NOW(), NOW(), NOW())`,
      [dummyOutboxId, dummyOutboxId],
    );
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      await scanPool.query(`UPDATE "OutboxEvent" SET status = 'PUBLISHED', "publishedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`, [dummyOutboxId]);
      exp2dRows.push({ component: 'sql_mark_published_ms', idx: i + 1, value_ms: (performance.now() - t0).toFixed(3) });
    }
  } finally {
    await scanPool.query(`DELETE FROM "OutboxEvent" WHERE id = $1`, [dummyOutboxId]).catch(() => {});
  }
  writeCsv('exp2d_independent_lbatch.csv', ['component', 'idx', 'value_ms'], exp2dRows);

  // =========================================================================
  // EXPERIMENT 2B: Outbox Batch-50 Burst Drain Staircase (R=5 Bursts x 200, c=50)
  // =========================================================================
  console.log('\n=== [2B] Outbox Burst Drain Staircase (R=5 x N=200 Burst, c=50) ===');
  const drainRows = [];
  const drainSummaryRuns = [];
  for (let runIdx = 1; runIdx <= R; runIdx++) {
    await waitRabbitmqDrained(30000, true);
    const burstId = `burst-r${runIdx}-${Date.now()}`;
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
    let doneBurst = false;
    burstPromises.then(() => { doneBurst = true; });
    let runDrainMs = null;
    for (let tick = 0; tick < 80; tick++) {
      const q = await scanPool.query(
        `SELECT count(*) FILTER (WHERE status = 'PENDING')::int AS pending_cnt,
                count(*) FILTER (WHERE status = 'PUBLISHED')::int AS published_cnt
         FROM "OutboxEvent" WHERE payload->'data'->'scanEvent'->>'note' = $1`,
        [burstId],
      );
      const elapsedMs = Date.now() - burstStartMs;
      const { pending_cnt, published_cnt } = q.rows[0];
      drainRows.push({
        run: runIdx,
        tick,
        elapsed_ms: elapsedMs,
        pending_count: pending_cnt,
        published_count: published_cnt,
        total_seen: pending_cnt + published_cnt,
      });
      if (doneBurst && published_cnt >= 200 && pending_cnt === 0) {
        runDrainMs = elapsedMs;
        break;
      }
      await sleep(100);
    }
    await burstPromises;
    const spanQ = await scanPool.query(
      `SELECT EXTRACT(EPOCH FROM (max("publishedAt") - min("createdAt")))*1000.0 AS full_span_ms
       FROM "OutboxEvent" WHERE payload->'data'->'scanEvent'->>'note' = $1`,
      [burstId],
    );
    const dbSpanMs = Number(spanQ.rows[0].full_span_ms ?? runDrainMs);
    drainSummaryRuns.push({ run: runIdx, sample_drain_ms: runDrainMs, db_span_ms: Number(dbSpanMs.toFixed(1)) });
    console.log(`  [2B Run ${runIdx}] full 200/200 published @ ${runDrainMs}ms (DB span ${dbSpanMs.toFixed(1)}ms)`);
  }
  writeCsv('exp2b_outbox_drain_curve.csv', ['run', 'tick', 'elapsed_ms', 'pending_count', 'published_count', 'total_seen'], drainRows);
  await waitRabbitmqDrained(45000, true);

  // =========================================================================
  // EXPERIMENT 2C: Outbox Relay Transport Micro-Benchmark (R=5 x 200 msgs each)
  // =========================================================================
  console.log('\n=== [2C] Transport Micro-Benchmark: HTTP Mgmt vs AMQP ConfirmChannel (R=5 x 200 msgs) ===');
  const transportRows = [];
  const transportRunTotals = [];
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

  for (let runIdx = 1; runIdx <= R; runIdx++) {
    // 1) HTTP Mgmt Sequential
    const tHttpStart = performance.now();
    for (let i = 0; i < 200; i++) {
      const t0 = performance.now();
      const r = await fetch(`${URLS.rabbitmqMgmt}/exchanges/%2F/${exBench}/publish`, {
        method: 'POST',
        headers: { Authorization: RMQ_AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { delivery_mode: 2, message_id: `h-r${runIdx}-${i}` },
          routing_key: 'bench.scan',
          payload: samplePayload,
          payload_encoding: 'string',
        }),
      });
      await r.json();
      transportRows.push({ run: runIdx, transport: 'HTTP_Mgmt_Sequential', msg_idx: i, latency_ms: (performance.now() - t0).toFixed(3) });
    }
    const httpTotalMs = performance.now() - tHttpStart;

    // 2) AMQP ConfirmChannel Sequential
    const tAmqpSeqStart = performance.now();
    for (let i = 0; i < 200; i++) {
      const t0 = performance.now();
      await new Promise((resolve, reject) => {
        ch.publish(exBench, 'bench.scan', Buffer.from(samplePayload, 'utf8'),
          { persistent: true, contentType: 'application/json', messageId: `a-r${runIdx}-${i}` },
          (err) => (err ? reject(err) : resolve()),
        );
      });
      transportRows.push({ run: runIdx, transport: 'AMQP_Confirm_Sequential', msg_idx: i, latency_ms: (performance.now() - t0).toFixed(3) });
    }
    const amqpSeqTotalMs = performance.now() - tAmqpSeqStart;

    // 3) AMQP ConfirmChannel Pipelined Batch-50
    const tAmqpBatchStart = performance.now();
    for (let b = 0; b < 4; b++) {
      const bt0 = performance.now();
      await Promise.all(
        Array.from({ length: 50 }, (_, j) =>
          new Promise((resolve, reject) => {
            ch.publish(exBench, 'bench.scan', Buffer.from(samplePayload, 'utf8'),
              { persistent: true, contentType: 'application/json', messageId: `ab-r${runIdx}-${b}-${j}` },
              (err) => (err ? reject(err) : resolve()),
            );
          }),
        ),
      );
      const batchDt = performance.now() - bt0;
      for (let j = 0; j < 50; j++) {
        transportRows.push({ run: runIdx, transport: 'AMQP_Confirm_Batch50', msg_idx: b * 50 + j, latency_ms: (batchDt / 50).toFixed(3) });
      }
    }
    const amqpBatchTotalMs = performance.now() - tAmqpBatchStart;
    transportRunTotals.push({
      run: runIdx,
      HTTP_Mgmt_Sequential_ms: Number(httpTotalMs.toFixed(2)),
      AMQP_Confirm_Sequential_ms: Number(amqpSeqTotalMs.toFixed(2)),
      AMQP_Confirm_Batch50_ms: Number(amqpBatchTotalMs.toFixed(2)),
    });
    console.log(`  [2C Run ${runIdx}] HTTP=${httpTotalMs.toFixed(1)}ms, AMQP_Seq=${amqpSeqTotalMs.toFixed(1)}ms, AMQP_B50=${amqpBatchTotalMs.toFixed(1)}ms`);
    await ch.purgeQueue(qBench);
  }

  await ch.deleteQueue(qBench);
  await ch.deleteExchange(exBench);
  await ch.close();
  writeCsv('exp2c_transport_microbench.csv', ['run', 'transport', 'msg_idx', 'latency_ms'], transportRows);

  // =========================================================================
  // EXPERIMENT 3 & 3C + F2: Dual-Layer Idempotency (R=5) & Crash Window Probe
  // =========================================================================
  console.log('\n=== [3] Dual-Layer Idempotency & Clean Consumer Dup Audit (R=5 runs) ===');
  const exp3Rows = [];
  const exp3RunSummary = [];
  await waitRabbitmqDrained(30000, true);

  for (let runIdx = 1; runIdx <= R; runIdx++) {
    const stormTag = `exp3-r${runIdx}-${Date.now()}`;
    const runRows = [];

    // 40 Fresh + 40 Sequential Replay
    for (let i = 0; i < 40; i++) {
      const key = `${stormTag}-seq-${i}`;
      const code = poolCodes[i % 200];
      const t0 = performance.now();
      const r1 = await fetch(`${URLS.scan}/scans/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', actor: 'IDEM_TEST', idempotencyKey: key }),
      });
      const j1 = await r1.json();
      runRows.push({ run: runIdx, phase: 'Fresh_Write', key_idx: i, attempt: 0, status: r1.status, scan_id: j1.scanEvent.id, latency_ms: (performance.now() - t0).toFixed(3) });

      const t1 = performance.now();
      const r2 = await fetch(`${URLS.scan}/scans/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentCode: code, locationCode: 'HUB_HCM_01', actor: 'IDEM_TEST', idempotencyKey: key }),
      });
      const j2 = await r2.json();
      runRows.push({ run: runIdx, phase: 'Sequential_Replay', key_idx: i, attempt: 1, status: r2.status, scan_id: j2.scanEvent.id, latency_ms: (performance.now() - t1).toFixed(3) });
    }

    // 20 keys x 6 parallel concurrent POSTs = 120 race requests
    const raceJobs = [];
    for (let k = 0; k < 20; k++) {
      const key = `${stormTag}-race-${k}`;
      const code = poolCodes[k % 200];
      for (let attempt = 0; attempt < 6; attempt++) raceJobs.push({ key_idx: k, attempt, key, code });
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
        run: runIdx,
        phase: 'Concurrent_Storm_6x',
        key_idx: job.key_idx,
        attempt: job.attempt,
        status: r.status,
        scan_id: j?.scanEvent?.id ?? 'ERR',
        latency_ms: (performance.now() - t0).toFixed(3),
      };
    });
    runRows.push(...raceRes);
    exp3Rows.push(...runRows);

    // Wait explicitly until all 60 outbox rows publish & all 60 AggregationJob rows commit cleanly!
    await waitRabbitmqDrained(25000, true);
    const dbCheckScan = await scanPool.query(
      `SELECT count(*)::int AS scan_cnt FROM "ScanEvent" WHERE "idempotencyKey" LIKE $1`,
      [`%${stormTag}%`],
    );
    const dbCheckOutbox = await scanPool.query(
      `SELECT count(*)::int AS outbox_cnt, array_agg("eventId") AS event_ids, array_agg(payload) AS payloads
       FROM "OutboxEvent" WHERE payload->>'idempotency_key' LIKE $1`,
      [`%${stormTag}%`],
    );
    const evIds = dbCheckOutbox.rows[0].event_ids || [];
    const waitAgg0 = Date.now();
    while (Date.now() - waitAgg0 < 20000) {
      const aggQ = await repPool.query(`SELECT count(*)::int AS cnt FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`, [evIds]);
      if (aggQ.rows[0].cnt >= evIds.length) break;
      await sleep(200);
    }
    await sleep(500);
    const aggFinalQ = await repPool.query(`SELECT count(*)::int AS cnt FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`, [evIds]);

    // Exp 3C: Inject 30 already-processed RabbitMQ frames into domain.events
    const tlPre = await trackPool.query(`SELECT count(*)::int AS cnt FROM "TimelineEvent"`);
    const repPre = await repPool.query(`SELECT coalesce(sum("scansInbound"),0)::int AS kpi_sum FROM "KpiDaily" WHERE "courierCode"='ALL' AND "hubCode"='ALL' AND "zoneCode"='ALL'`);
    const dupPayloads = dbCheckOutbox.rows[0].payloads.slice(0, 30);
    const dupCh = await conn.createConfirmChannel();
    for (const pl of dupPayloads) {
      await new Promise((resolve, reject) => {
        dupCh.publish('domain.events', 'scan.inbound', Buffer.from(JSON.stringify(pl), 'utf8'),
          { persistent: true, contentType: 'application/json', messageId: pl.event_id },
          (e) => (e ? reject(e) : resolve()),
        );
      });
    }
    await dupCh.close();
    await waitRabbitmqDrained(15000, true);
    await sleep(1500);
    const tlPost = await trackPool.query(`SELECT count(*)::int AS cnt FROM "TimelineEvent"`);
    const repPost = await repPool.query(`SELECT coalesce(sum("scansInbound"),0)::int AS kpi_sum FROM "KpiDaily" WHERE "courierCode"='ALL' AND "hubCode"='ALL' AND "zoneCode"='ALL'`);

    const sumR = {
      run: runIdx,
      expected_unique: 60,
      http_requests: runRows.length,
      http_2xx: runRows.filter((x) => x.status >= 200 && x.status < 300).length,
      db_scans: dbCheckScan.rows[0].scan_cnt,
      db_outbox: dbCheckOutbox.rows[0].outbox_cnt,
      db_aggregation_jobs: aggFinalQ.rows[0].cnt,
      broker_dups_injected: dupPayloads.length,
      tracking_dup_leak: tlPost.rows[0].cnt - tlPre.rows[0].cnt,
      reporting_dup_leak: repPost.rows[0].kpi_sum - repPre.rows[0].kpi_sum,
    };
    exp3RunSummary.push(sumR);
    console.log(
      `  [Exp 3 Run ${runIdx}] HTTP=${sumR.http_2xx}/${sumR.http_requests} Scans=${sumR.db_scans}/60 AggJobs=${sumR.db_aggregation_jobs}/60 DupLeaks(Track=${sumR.tracking_dup_leak}, KPI=${sumR.reporting_dup_leak})`,
    );
  }
  writeCsv('exp3_idempotency_requests.csv', ['run', 'phase', 'key_idx', 'attempt', 'status', 'scan_id', 'latency_ms'], exp3Rows);

  // Measure Finding F2 explicitly: HTTP /get ack_requeue_false pop-ahead crash exposure window
  console.log('\n=== [F2 Probe] Measuring Reporting HTTP /get ack_requeue_false pop-to-commit window (N=40) ===');
  await waitRabbitmqDrained(15000, true);
  const f2EvIds = [];
  const f2Ch = await conn.createConfirmChannel();
  const f2PubStartMs = Date.now();
  for (let i = 0; i < 40; i++) {
    const evId = crypto.randomUUID();
    f2EvIds.push(evId);
    const env = {
      event_id: evId,
      event_type: 'scan.inbound',
      occurred_at: new Date().toISOString(),
      shipment_code: poolCodes[i % 50],
      actor: 'F2_PROBE',
      location: { location_code: 'HUB_HCM_01' },
      data: { scanEvent: { locationCode: 'HUB_HCM_01' } },
      idempotency_key: `f2-probe-${evId}`,
    };
    await new Promise((resolve, reject) => {
      f2Ch.publish('domain.events', 'scan.inbound', Buffer.from(JSON.stringify(env), 'utf8'),
        { persistent: true, contentType: 'application/json', messageId: evId },
        (e) => (e ? reject(e) : resolve()),
      );
    });
  }
  await f2Ch.close();
  // Wait for reporting-service.q queue count to hit 0 on /queues/reporting-service.q and simultaneously watch AggregationJob commits!
  let f2LastPopMs = null;
  const f2PollEnd = Date.now() + 12000;
  let f2PeakExposed = 0;
  while (Date.now() < f2PollEnd) {
    const qRes = await fetch(`${URLS.rabbitmqMgmt}/queues/%2F/reporting-service.q`, { headers: { Authorization: RMQ_AUTH } });
    const qInfo = await qRes.json();
    const qReady = qInfo.messages_ready ?? 0;
    const jobRes = await repPool.query(`SELECT count(*)::int AS cnt FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`, [f2EvIds]);
    const committed = jobRes.rows[0].cnt;
    const exposed = 40 - qReady - committed;
    if (exposed > f2PeakExposed) f2PeakExposed = exposed;
    if (qReady === 0 && f2LastPopMs === null) f2LastPopMs = Date.now();
    if (committed >= 40) break;
    await sleep(100);
  }
  const f2TimesQ = await repPool.query(
    `SELECT EXTRACT(EPOCH FROM min("createdAt"))*1000.0 AS first_ms,
            EXTRACT(EPOCH FROM max("createdAt"))*1000.0 AS last_ms
     FROM "AggregationJob" WHERE "jobKey" = ANY($1::text[])`,
    [f2EvIds],
  );
  const f2DrainSpanMs = Number(((f2TimesQ.rows[0].last_ms ?? 0) - (f2TimesQ.rows[0].first_ms ?? 0)).toFixed(1));
  const f2PopToLastCommitMs = f2LastPopMs ? Number(((f2TimesQ.rows[0].last_ms ?? 0) - f2LastPopMs).toFixed(1)) : f2DrainSpanMs;
  const f2Probe = {
    injected: 40,
    peak_popped_uncommitted_frames: f2PeakExposed,
    commit_span_ms: f2DrainSpanMs,
    last_pop_to_commit_tail_ms: f2PopToLastCommitMs,
  };
  console.log('F2 Crash-Window Probe:', f2Probe);

  // =========================================================================
  // EXPERIMENT 4A: FSM Invariant (60 attacks) + F1 View Skew + F3 Lock Probes
  // =========================================================================
  console.log('\n=== [4A] FSM State Machine Attacks (60), F1 View Skew, and Lock Policy/TOCTOU ===');
  const fsmCodes = Array.from({ length: 20 }, (_, i) => `333992${String(i + 1).padStart(6, '0')}`);
  for (const code of fsmCodes) await createShipmentApi(code, { counterWalkIn: true });
  await waitRabbitmqDrained(15000, true);

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
      fsmCh.publish('domain.events', routingKey, Buffer.from(JSON.stringify(env), 'utf8'),
        { persistent: true, contentType: 'application/json', messageId: evId },
        (e) => (e ? reject(e) : resolve()),
      );
    });
    return evId;
  }

  for (let i = 0; i < 5; i++) await pubDomain('task.assigned', fsmCodes[i], { task: { taskType: 'DELIVERY' } });
  await waitRabbitmqDrained(10000, false);
  for (let i = 0; i < 5; i++) await pubDomain('delivery.delivered', fsmCodes[i]);
  for (let i = 5; i < 10; i++) await pubDomain('return.started', fsmCodes[i]);
  await waitRabbitmqDrained(10000, false);
  for (let i = 5; i < 10; i++) await pubDomain('return.completed', fsmCodes[i]);
  for (let i = 10; i < 15; i++) {
    await fetch(`${URLS.shipment}/shipments/${fsmCodes[i]}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ops-user-id': 'bench_op', 'x-ops-roles': 'SYSTEM_ADMIN' },
      body: JSON.stringify({ reason: 'Benchmark terminal check' }),
    }).then((r) => r.text());
  }
  for (let i = 15; i < 20; i++) await pubDomain('scan.inbound', fsmCodes[i], { scanEvent: { locationCode: 'HUB_HCM_01' } });
  await waitRabbitmqDrained(15000, true);

  const attacks = [
    { start: 0, end: 5, expectedState: 'DELIVERED', evTypes: ['scan.inbound', 'scan.outbound', 'delivery.failed'] },
    { start: 5, end: 10, expectedState: 'RETURN_COMPLETED', evTypes: ['scan.inbound', 'pickup.approved', 'delivery.delivered'] },
    { start: 10, end: 15, expectedState: 'CANCELLED', evTypes: ['scan.inbound', 'task.assigned', 'delivery.delivered'] },
    { start: 15, end: 20, expectedState: 'SCAN_INBOUND', evTypes: ['pickup.requested', 'scan.pickup_confirmed', 'delivery.delivered'] },
  ];
  const attackIds = [];
  for (const grp of attacks) {
    for (let i = grp.start; i < grp.end; i++) {
      for (const evType of grp.evTypes) {
        const evId = await pubDomain(evType, fsmCodes[i], { scanEvent: { locationCode: 'HUB_LATE_99' } });
        attackIds.push({ code: fsmCodes[i], expectedState: grp.expectedState, evType, evId });
      }
    }
  }
  await waitRabbitmqDrained(15000, true);

  const postFsmQ = await shipPool.query(`SELECT code, "currentStatus" FROM shipments WHERE code = ANY($1::text[])`, [fsmCodes]);
  const postShipMap = new Map(postFsmQ.rows.map((r) => [r.code, r.currentStatus]));
  const postTrackQ = await trackPool.query(`SELECT "shipmentCode", "currentStatus" FROM "TrackingCurrent" WHERE "shipmentCode" = ANY($1::text[])`, [fsmCodes]);
  const postTrackMap = new Map(postTrackQ.rows.map((r) => [r.shipmentCode, r.currentStatus]));
  const postTlQ = await trackPool.query(`SELECT "eventId" FROM "TimelineEvent" WHERE "eventId" = ANY($1::text[])`, [attackIds.map((x) => x.evId)]);
  const tlFoundSet = new Set(postTlQ.rows.map((r) => r.eventId));

  const exp4aRows = attackIds.map((a) => {
    const actualShipStatus = postShipMap.get(a.code);
    return {
      shipment_code: a.code,
      expected_authoritative_status: a.expectedState,
      injected_ooo_event: a.evType,
      actual_ship_status: actualShipStatus,
      fsm_preserved: actualShipStatus === a.expectedState ? 1 : 0,
      timeline_archived: tlFoundSet.has(a.evId) ? 1 : 0,
      tracking_current_status: postTrackMap.get(a.code) ?? '',
    };
  });

  // Lock probes: Phased (60 probes: 30 Normal locked -> 400 first, then 30 INVENTORY_CHECK -> 201)
  // AND Interleaved F3 TOCTOU probe (20 interleaved pairs after re-locking!)
  const lockCodes = fsmCodes.slice(15, 20);
  const phasedLockProbes = [];
  await shipPool.query(`UPDATE shipments SET "isLocked" = true WHERE code = ANY($1::text[])`, [lockCodes]);
  for (let i = 0; i < 30; i++) {
    const c = lockCodes[i % 5];
    const rBlock = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `ph-blk-${i}-${Date.now()}` }),
    });
    await rBlock.text();
    phasedLockProbes.push({ mode: 'phased', type: 'Normal_Scan_Locked', status: rBlock.status, passed_policy: rBlock.status === 400 ? 1 : 0 });
  }
  for (let i = 0; i < 30; i++) {
    const c = lockCodes[i % 5];
    const rAllow = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `ph-inv-${i}-${Date.now()}`, note: 'INVENTORY_CHECK AUDIT' }),
    });
    await rAllow.text();
    phasedLockProbes.push({ mode: 'phased', type: 'Inventory_Check_Locked', status: rAllow.status, passed_policy: rAllow.status === 201 ? 1 : 0 });
  }
  await waitRabbitmqDrained(12000, true);

  // Interleaved TOCTOU F3 probe: re-lock 5 parcels, then alternate Normal and INVENTORY_CHECK across 10 pairs
  const interleavedLockProbes = [];
  await shipPool.query(`UPDATE shipments SET "isLocked" = true WHERE code = ANY($1::text[])`, [lockCodes]);
  for (let i = 0; i < 10; i++) {
    const c = lockCodes[i % 5];
    const rBlock = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `int-blk-${i}-${Date.now()}` }),
    });
    await rBlock.text();
    interleavedLockProbes.push({ mode: 'interleaved', type: 'Normal_Scan_Locked', status: rBlock.status, passed_policy: rBlock.status === 400 ? 1 : 0 });

    const rAllow = await fetch(`${URLS.scan}/scans/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentCode: c, locationCode: 'HUB_HCM_01', idempotencyKey: `int-inv-${i}-${Date.now()}`, note: 'INVENTORY_CHECK AUDIT' }),
    });
    await rAllow.text();
    interleavedLockProbes.push({ mode: 'interleaved', type: 'Inventory_Check_Locked', status: rAllow.status, passed_policy: rAllow.status === 201 ? 1 : 0 });
    await sleep(600); // spans Outbox 1000ms ticks so async unlock race manifests empirically
  }
  await waitRabbitmqDrained(12000, true);

  writeCsv(
    'exp4a_fsm_and_locks.csv',
    ['shipment_code', 'expected_authoritative_status', 'injected_ooo_event', 'actual_ship_status', 'fsm_preserved', 'timeline_archived', 'tracking_current_status'],
    exp4aRows,
  );
  console.log(
    `  FSM=${exp4aRows.filter((x) => x.fsm_preserved === 1).length}/60, ` +
    `PhasedLock=${phasedLockProbes.filter((x) => x.passed_policy === 1).length}/60, ` +
    `InterleavedLock(F3)=${interleavedLockProbes.filter((x) => x.passed_policy === 1).length}/20`,
  );

  // =========================================================================
  // EXPERIMENT 4B: Live Multi-Tier TTL Retry (10 delayed + 10 poison) + x-death
  // =========================================================================
  console.log('\n=== [4B] Live Multi-Tier TTL Retry (10 delayed + 10 poison) + Broker x-death Proof (~80s) ===');
  const healCodes = Array.from({ length: 10 }, (_, i) => `333993000${String(i + 1).padStart(3, '0')}`);
  const poisonCodes = Array.from({ length: 10 }, (_, i) => `333993999${String(i + 1).padStart(3, '0')}`);
  const dlqTimeline = [];
  const t4Start = Date.now();

  for (const c of [...healCodes, ...poisonCodes]) {
    await pubDomain('scan.inbound', c, { scanEvent: { locationCode: 'HUB_HN_01' } });
  }

  let healedCreated = false;
  let healCreateElapsedS = null;
  for (let step = 0; step < 170; step++) {
    const elapsedMs = Date.now() - t4Start;
    if (!healedCreated && elapsedMs >= 3000) {
      healedCreated = true;
      healCreateElapsedS = Number((elapsedMs / 1000).toFixed(2));
      for (const c of healCodes) await createShipmentApi(c, { counterWalkIn: true });
      console.log(`  [t=${elapsedMs}ms] Upstream created 10 delayed shipments (expect heal after .retry.10s expiry!)`);
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

    if (elapsedMs > 73000 && row.retry_10s === 0 && row.retry_1m === 0 && row.main_q === 0 && row.healed_count === 10 && row.dlq >= 10) {
      break;
    }
    await sleep(500);
  }
  await fsmCh.close();

  // Directly inspect AMQP x-death headers from quarantined frames in shipment-service.dlq!
  const dlqCh = await conn.createChannel();
  const xDeathProofs = [];
  while (true) {
    const msg = await dlqCh.get('shipment-service.dlq', { noAck: false });
    if (!msg) break;
    const xDeath = msg.properties.headers?.['x-death'] || [];
    const parsed = JSON.parse(msg.content.toString('utf8'));
    const deaths = xDeath.map((d) => ({
      queue: d.queue,
      reason: d.reason,
      count: d.count,
      epoch_s: typeof d.time === 'object' && d.time !== null ? Number(d.time.value) : Number(d.time),
    }));
    const d10s = deaths.find((d) => d.queue === 'shipment-service.retry.10s');
    const d1m = deaths.find((d) => d.queue === 'shipment-service.retry.1m');
    xDeathProofs.push({
      shipment_code: parsed.shipment_code,
      x_retry_count: msg.properties.headers?.['x-retry-count'],
      retry_10s_expire_epoch_s: d10s?.epoch_s ?? null,
      retry_1m_expire_epoch_s: d1m?.epoch_s ?? null,
      broker_ttl_1m_dwell_s: d10s && d1m ? d1m.epoch_s - d10s.epoch_s : null,
      broker_total_ttl_s: d10s && d1m ? d1m.epoch_s - Math.floor(t4Start / 1000) : null,
      deaths,
    });
    dlqCh.ack(msg);
  }
  await dlqCh.close();
  await conn.close();
  console.log('  Extracted x-death broker timestamps from DLQ:', xDeathProofs.slice(0, 3));

  writeCsv('exp4b_dlq_recovery_timeline.csv', ['step', 'elapsed_s', 'main_q', 'retry_10s', 'retry_1m', 'dlq', 'healed_count'], dlqTimeline);

  runMeta.finishedAtIso = new Date().toISOString();
  runMeta.exp2bDrainRuns = drainSummaryRuns;
  runMeta.exp2cRunTotals = transportRunTotals;
  runMeta.exp3Runs = exp3RunSummary;
  runMeta.f2CrashWindowProbe = f2Probe;
  runMeta.phasedLockProbes = phasedLockProbes;
  runMeta.interleavedLockProbes = interleavedLockProbes;
  runMeta.dlqFinal = {
    healCreateElapsedS,
    finalRow: dlqTimeline[dlqTimeline.length - 1],
    xDeathProofs,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'benchmark_raw_summary.json'), JSON.stringify(runMeta, null, 2));
  console.log('\n=== ALL BENCHMARKS COMPLETE ===');

  await scanPool.end();
  await shipPool.end();
  await trackPool.end();
  await repPool.end();
  await setupPool.end();
  await monPool.end();
}

main().catch((err) => {
  console.error('BENCHMARK FAILED:', err);
  process.exit(1);
});
