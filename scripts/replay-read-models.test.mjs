import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReplayQuery,
  mergeAndSortEvents,
  parseReplayArgs,
  selectSourceDatabases,
  SOURCE_DATABASES,
} from './replay-read-models.mjs';

test('TC-059: replay-read-models defaults to safe dry-run and selects all 6 source DBs', () => {
  const opts = parseReplayArgs([]);
  assert.equal(opts.dryRun, true);
  assert.equal(selectSourceDatabases(opts.services).length, SOURCE_DATABASES.length);
  assert.equal(SOURCE_DATABASES.length, 6);
});

test('TC-059: parses filters, builds parameterized SQL, and merges cross-DB events chronologically', () => {
  const opts = parseReplayArgs([
    '--confirm',
    '--service=shipment,scan',
    '--shipment=SHP-202605-0018',
    '--from=2026-05-01T00:00:00Z',
    '--limit=250',
  ]);
  assert.equal(opts.dryRun, false);
  assert.deepEqual(
    selectSourceDatabases(opts.services).map((s) => s.dbName),
    ['shipment_db', 'scan_db'],
  );

  const { sql, params } = buildReplayQuery(opts);
  assert.ok(sql.includes(`status = 'PUBLISHED'`));
  assert.ok(sql.includes(`payload->>'shipment_code' = $2`));
  assert.deepEqual(params, ['2026-05-01T00:00:00.000Z', 'SHP-202605-0018', 250]);

  const merged = mergeAndSortEvents([
    [{ eventId: 'e2', occurredAt: '2026-05-18T08:05:00.000Z' }],
    [
      { eventId: 'e1', occurredAt: '2026-05-18T08:00:00.000Z' },
      { eventId: 'e3', occurredAt: '2026-05-18T08:10:00.000Z' },
    ],
  ]);
  assert.deepEqual(
    merged.map((e) => e.eventId),
    ['e1', 'e2', 'e3'],
  );
});
