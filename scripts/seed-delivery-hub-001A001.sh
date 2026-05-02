#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-jms-dev-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
HUB_CODE="${HUB_CODE:-001A001}"
COURIER_ID="${COURIER_ID:-30000001}"
COURIER_PASSWORD_SHA256="${COURIER_PASSWORD_SHA256:-5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8}"
COUNT="${COUNT:-10}"
RUN_KEY="${RUN_KEY:-delivery-${HUB_CODE}-${COURIER_ID}}"

psql_db() {
  local db="$1"
  docker exec -i "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$db"
}

echo "[seed] courier=${COURIER_ID} hub=${HUB_CODE} count=${COUNT}"

psql_db auth_db <<SQL
INSERT INTO "UserAccount" (
  id,
  username,
  "passwordHash",
  status,
  roles,
  "displayName",
  phone,
  "hubCodes",
  "createdAt",
  "updatedAt"
)
VALUES (
  '${COURIER_ID}',
  '${COURIER_ID}',
  '${COURIER_PASSWORD_SHA256}',
  'ACTIVE',
  ARRAY['COURIER'],
  'Courier ${COURIER_ID}',
  '090${COURIER_ID}',
  ARRAY['${HUB_CODE}'],
  now(),
  now()
)
ON CONFLICT (username) DO UPDATE
SET
  status = 'ACTIVE',
  roles = ARRAY['COURIER'],
  "displayName" = COALESCE("UserAccount"."displayName", EXCLUDED."displayName"),
  "hubCodes" = CASE
    WHEN '${HUB_CODE}' = ANY("UserAccount"."hubCodes") THEN "UserAccount"."hubCodes"
    ELSE array_append("UserAccount"."hubCodes", '${HUB_CODE}')
  END,
  "updatedAt" = now();
SQL

psql_db shipment_db <<SQL
WITH rows AS (
  SELECT
    gs AS idx,
    'DLV${HUB_CODE}-' || lpad(gs::text, 2, '0') AS code
  FROM generate_series(1, ${COUNT}) AS gs
)
INSERT INTO shipments (
  id,
  code,
  "currentStatus",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  'seed-shipment-${RUN_KEY}-' || lpad(idx::text, 2, '0'),
  code,
  'TASK_ASSIGNED',
  jsonb_build_object(
    'receiverName', 'Nguoi nhan test ' || lpad(idx::text, 2, '0'),
    'receiverPhone', '09880010' || lpad(idx::text, 2, '0'),
    'receiverAddress', 'Dia chi phat hang test ' || idx || ', khu vuc hub ${HUB_CODE}',
    'senderName', 'Shop test hub ${HUB_CODE}',
    'senderPhone', '0900000001',
    'originHubCode', '${HUB_CODE}',
    'destinationHubCode', '${HUB_CODE}',
    'routing', jsonb_build_object(
      'originHubCode', '${HUB_CODE}',
      'destinationHubCode', '${HUB_CODE}',
      'currentHubCode', '${HUB_CODE}'
    ),
    'delivery', jsonb_build_object(
      'hubCode', '${HUB_CODE}',
      'courierId', '${COURIER_ID}',
      'seed', true
    ),
    'note', 'Seed phat hang courier ${COURIER_ID} tai hub ${HUB_CODE}'
  ),
  now(),
  now()
FROM rows
ON CONFLICT (code) DO UPDATE
SET
  "currentStatus" = 'TASK_ASSIGNED',
  metadata = EXCLUDED.metadata,
  "updatedAt" = now();
SQL

psql_db scan_db <<SQL
WITH rows AS (
  SELECT
    gs AS idx,
    'DLV${HUB_CODE}-' || lpad(gs::text, 2, '0') AS code,
    'seed-scan-${RUN_KEY}-' || lpad(gs::text, 2, '0') AS event_id
  FROM generate_series(1, ${COUNT}) AS gs
),
scan_upsert AS (
  INSERT INTO "ScanEvent" (
    id,
    "shipmentCode",
    "scanType",
    "locationCode",
    "manifestCode",
    actor,
    note,
    "idempotencyKey",
    "occurredAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    event_id,
    code,
    'INBOUND',
    '${HUB_CODE}',
    null,
    'seed:${COURIER_ID}',
    'Seed hang o hub ${HUB_CODE} cho courier di phat',
    'seed-${RUN_KEY}-inbound-' || lpad(idx::text, 2, '0'),
    now(),
    now(),
    now()
  FROM rows
  ON CONFLICT ("idempotencyKey") DO UPDATE
  SET
    "locationCode" = EXCLUDED."locationCode",
    note = EXCLUDED.note,
    "updatedAt" = now()
  RETURNING id, "shipmentCode"
)
INSERT INTO "CurrentLocation" (
  id,
  "shipmentCode",
  "locationCode",
  "lastScanType",
  "lastScanEventId",
  "lastScannedAt",
  "manifestCode",
  "createdAt",
  "updatedAt"
)
SELECT
  'seed-location-${RUN_KEY}-' || lpad(rows.idx::text, 2, '0'),
  rows.code,
  '${HUB_CODE}',
  'INBOUND',
  scan_upsert.id,
  now(),
  null,
  now(),
  now()
FROM rows
JOIN scan_upsert ON scan_upsert."shipmentCode" = rows.code
ON CONFLICT ("shipmentCode") DO UPDATE
SET
  "locationCode" = EXCLUDED."locationCode",
  "lastScanType" = EXCLUDED."lastScanType",
  "lastScanEventId" = EXCLUDED."lastScanEventId",
  "lastScannedAt" = EXCLUDED."lastScannedAt",
  "updatedAt" = now();
SQL

psql_db dispatch_db <<SQL
WITH rows AS (
  SELECT
    gs AS idx,
    'DLV${HUB_CODE}-' || lpad(gs::text, 2, '0') AS shipment_code,
    'DEL-${HUB_CODE}-${COURIER_ID}-' || lpad(gs::text, 2, '0') AS task_code,
    'seed-task-${RUN_KEY}-' || lpad(gs::text, 2, '0') AS task_id,
    'seed-assignment-${RUN_KEY}-' || lpad(gs::text, 2, '0') AS assignment_id
  FROM generate_series(1, ${COUNT}) AS gs
),
task_upsert AS (
  INSERT INTO tasks (
    id,
    "taskCode",
    "taskType",
    status,
    "shipmentCode",
    "pickupRequestId",
    note,
    "createdAt",
    "updatedAt"
  )
  SELECT
    task_id,
    task_code,
    'DELIVERY',
    'ASSIGNED',
    shipment_code,
    null,
    'Seed task phat hang tai hub ${HUB_CODE} cho courier ${COURIER_ID}',
    now(),
    now()
  FROM rows
  ON CONFLICT ("taskCode") DO UPDATE
  SET
    "taskType" = 'DELIVERY',
    status = 'ASSIGNED',
    "shipmentCode" = EXCLUDED."shipmentCode",
    note = EXCLUDED.note,
    "updatedAt" = now()
  RETURNING id, "taskCode"
)
INSERT INTO task_assignments (
  id,
  "taskId",
  "courierId",
  "assignedAt",
  "unassignedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  rows.assignment_id,
  task_upsert.id,
  '${COURIER_ID}',
  now(),
  null,
  now(),
  now()
FROM rows
JOIN task_upsert ON task_upsert."taskCode" = rows.task_code
WHERE NOT EXISTS (
  SELECT 1
  FROM task_assignments existing
  WHERE existing."taskId" = task_upsert.id
    AND existing."courierId" = '${COURIER_ID}'
    AND existing."unassignedAt" IS NULL
)
ON CONFLICT (id) DO NOTHING;
SQL

psql_db tracking_db <<SQL
WITH rows AS (
  SELECT
    gs AS idx,
    'DLV${HUB_CODE}-' || lpad(gs::text, 2, '0') AS code,
    'seed-track-${RUN_KEY}-' || lpad(gs::text, 2, '0') AS event_id
  FROM generate_series(1, ${COUNT}) AS gs
),
timeline_upsert AS (
  INSERT INTO "TimelineEvent" (
    id,
    "eventId",
    "eventType",
    "shipmentCode",
    actor,
    "locationCode",
    payload,
    "occurredAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    event_id,
    event_id,
    'task.assigned',
    code,
    '${COURIER_ID}',
    '${HUB_CODE}',
    jsonb_build_object(
      'event_type', 'task.assigned',
      'shipment_code', code,
      'data', jsonb_build_object(
        'task', jsonb_build_object(
          'taskType', 'DELIVERY',
          'shipmentCode', code,
          'courierId', '${COURIER_ID}',
          'hubCode', '${HUB_CODE}'
        )
      )
    ),
    now(),
    now(),
    now()
  FROM rows
  ON CONFLICT ("eventId") DO UPDATE
  SET
    actor = EXCLUDED.actor,
    "locationCode" = EXCLUDED."locationCode",
    payload = EXCLUDED.payload,
    "updatedAt" = now()
  RETURNING "eventId", "shipmentCode"
)
INSERT INTO "TrackingCurrent" (
  id,
  "shipmentCode",
  "currentStatus",
  "currentLocationCode",
  "lastEventId",
  "lastEventType",
  "lastEventAt",
  "viewPayload",
  "createdAt",
  "updatedAt"
)
SELECT
  'seed-current-${RUN_KEY}-' || lpad(rows.idx::text, 2, '0'),
  rows.code,
  'OUT_FOR_DELIVERY',
  '${HUB_CODE}',
  timeline_upsert."eventId",
  'task.assigned',
  now(),
  jsonb_build_object(
    'shipmentCode', rows.code,
    'currentStatus', 'OUT_FOR_DELIVERY',
    'currentLocationCode', '${HUB_CODE}',
    'courierId', '${COURIER_ID}'
  ),
  now(),
  now()
FROM rows
JOIN timeline_upsert ON timeline_upsert."shipmentCode" = rows.code
ON CONFLICT ("shipmentCode") DO UPDATE
SET
  "currentStatus" = EXCLUDED."currentStatus",
  "currentLocationCode" = EXCLUDED."currentLocationCode",
  "lastEventId" = EXCLUDED."lastEventId",
  "lastEventType" = EXCLUDED."lastEventType",
  "lastEventAt" = EXCLUDED."lastEventAt",
  "viewPayload" = EXCLUDED."viewPayload",
  "updatedAt" = now();

WITH rows AS (
  SELECT
    gs AS idx,
    'DLV${HUB_CODE}-' || lpad(gs::text, 2, '0') AS code,
    'seed-track-${RUN_KEY}-' || lpad(gs::text, 2, '0') AS event_id
  FROM generate_series(1, ${COUNT}) AS gs
)
INSERT INTO "TrackingIndex" (
  id,
  "shipmentCode",
  "latestEventType",
  "latestEventAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'seed-index-${RUN_KEY}-' || lpad(idx::text, 2, '0'),
  code,
  'task.assigned',
  now(),
  now(),
  now()
FROM rows
ON CONFLICT ("shipmentCode") DO UPDATE
SET
  "latestEventType" = EXCLUDED."latestEventType",
  "latestEventAt" = EXCLUDED."latestEventAt",
  "updatedAt" = now();
SQL

echo "[seed] done"
echo "[seed] courier login: ${COURIER_ID} / password"
echo "[seed] shipment codes: DLV${HUB_CODE}-01 .. DLV${HUB_CODE}-$(printf '%02d' "$COUNT")"
