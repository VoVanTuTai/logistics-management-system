import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const PAYLOADS_DIR = path.join(__dirname, 'payloads');

const REQUIRED_ENVELOPE_FIELDS = [
  'event_id',
  'event_type',
  'occurred_at',
  'shipment_code',
  'actor',
  'location',
  'data',
];

const EVENT_NAME_REGEX = /^[a-z]+\.[a-z_]+$/;
const SEMVER_MINOR_REGEX = /^\d+\.\d+$/;

test('TC-060: all event payload schemas declare valid SemVer schema_version and required envelope fields', () => {
  const files = fs
    .readdirSync(PAYLOADS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  assert.ok(files.length >= 9, `Expected >= 9 event contract JSON files, found ${files.length}`);

  for (const file of files) {
    const fullPath = path.join(PAYLOADS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf8').trim();
    assert.ok(raw.length > 0, `Contract file ${file} must not be empty`);

    const schema = JSON.parse(raw);
    const expectedEventType = file.replace(/\.json$/, '');

    assert.equal(schema.event_type, expectedEventType, `${file}: event_type must match filename`);
    assert.match(schema.event_type, EVENT_NAME_REGEX, `${file}: event_type violates naming convention`);
    assert.match(
      String(schema.schema_version ?? ''),
      SEMVER_MINOR_REGEX,
      `${file}: schema_version must follow MAJOR.MINOR`,
    );
    assert.ok(Array.isArray(schema.required_envelope), `${file}: required_envelope must be array`);

    for (const key of REQUIRED_ENVELOPE_FIELDS) {
      assert.ok(
        schema.required_envelope.includes(key),
        `${file}: missing required envelope key "${key}"`,
      );
    }

    assert.ok(
      schema.data_properties && typeof schema.data_properties === 'object' && Object.keys(schema.data_properties).length > 0,
      `${file}: data_properties must define domain payload structure`,
    );
    assert.ok(
      schema.example && schema.example.event_type === expectedEventType,
      `${file}: example payload must match event_type`,
    );
    for (const key of REQUIRED_ENVELOPE_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(schema.example, key),
        `${file}: example missing envelope key "${key}"`,
      );
    }
  }
});

test('TC-060: all active backend event producers conform to the canonical envelope contract', () => {
  const producerFiles = [
    'services/shipment-service/src/messaging/producers/shipment-events.producer.ts',
    'services/manifest-service/src/messaging/producers/manifest-events.producer.ts',
    'services/scan-service/src/messaging/producers/scan-events.producer.ts',
    'services/delivery-service/src/messaging/producers/delivery-events.producer.ts',
    'services/dispatch-service/src/messaging/producers/dispatch-events.producer.ts',
  ];

  for (const relPath of producerFiles) {
    const absPath = path.join(REPO_ROOT, relPath);
    assert.ok(fs.existsSync(absPath), `Missing producer file: ${relPath}`);
    const source = fs.readFileSync(absPath, 'utf8');

    for (const key of ['event_id', 'event_type', 'occurred_at', 'shipment_code', 'data']) {
      assert.ok(
        source.includes(key),
        `Producer ${relPath} is missing required envelope field "${key}"`,
      );
    }
  }
});
