$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

function Invoke-PsqlInContainer(
  [string]$Container,
  [string]$Database,
  [string]$Sql
) {
  $Sql | docker exec -i $Container psql -v ON_ERROR_STOP=1 -U postgres -d $Database
  if ($LASTEXITCODE -ne 0) {
    throw "Failed running SQL in container=$Container database=$Database"
  }
}

$shipmentSql = @'
WITH seed_rows AS (
  SELECT *
  FROM (
    VALUES
      ('SHPHCMDLV001', 'Nguyen Van A', '0909000001', 'Quan 1, Ho Chi Minh City'),
      ('SHPHCMDLV002', 'Tran Thi B', '0909000002', 'Quan 3, Ho Chi Minh City'),
      ('SHPHCMDLV003', 'Le Van C', '0909000003', 'Quan 5, Ho Chi Minh City'),
      ('SHPHCMDLV004', 'Pham Thi D', '0909000004', 'Quan 7, Ho Chi Minh City'),
      ('SHPHCMDLV005', 'Hoang Van E', '0909000005', 'Thu Duc, Ho Chi Minh City'),
      ('SHPHCMDLV006', 'Do Thi F', '0909000006', 'Binh Thanh, Ho Chi Minh City'),
      ('SHPHCMDLV007', 'Bui Van G', '0909000007', 'Go Vap, Ho Chi Minh City'),
      ('SHPHCMDLV008', 'Dang Thi H', '0909000008', 'Tan Binh, Ho Chi Minh City'),
      ('SHPHCMDLV009', 'Vu Van I', '0909000009', 'Phu Nhuan, Ho Chi Minh City'),
      ('SHPHCMDLV010', 'Ngo Thi K', '0909000010', 'Binh Tan, Ho Chi Minh City')
  ) AS t(code, receiver_name, receiver_phone, receiver_address)
),
upserted AS (
  INSERT INTO shipments (
    "id",
    "code",
    "currentStatus",
    "metadata",
    "cancellationReason",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'seed-' || lower(code),
    code,
    'SCAN_INBOUND'::"ShipmentCurrentStatus",
    jsonb_build_object(
      'sender', jsonb_build_object(
        'name', 'HCM Merchant Seed',
        'phone', '0908000000',
        'address', 'District 1, Ho Chi Minh City'
      ),
      'receiver', jsonb_build_object(
        'name', receiver_name,
        'phone', receiver_phone,
        'address', receiver_address,
        'region', 'Ho Chi Minh',
        'province', 'Ho Chi Minh'
      ),
      'service', jsonb_build_object(
        'type', 'STANDARD'
      ),
      'parcelType', 'General Goods',
      'platform', 'HCM_DELIVERY_SEED',
      'source', 'seed-hcm-delivery-orders',
      'currentLocation', 'HUB_HCM_01',
      'currentHubCode', 'HUB_HCM_01',
      'deliveryNote', 'Xuong hang kien den HUB_HCM_01 ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      'note', 'Xuong hang kien den HUB_HCM_01 ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      'shippingFee', 25000,
      'codAmount', 0
    ),
    NULL,
    now(),
    now()
  FROM seed_rows
  ON CONFLICT ("code")
  DO UPDATE
    SET
      "currentStatus" = 'SCAN_INBOUND'::"ShipmentCurrentStatus",
      "metadata" = EXCLUDED."metadata",
      "cancellationReason" = NULL,
      "createdAt" = now(),
      "updatedAt" = now()
  RETURNING "code"
)
SELECT count(*) AS upserted_hcm_delivery_shipments FROM upserted;
'@

$dispatchSql = @'
WITH seed_rows AS (
  SELECT *
  FROM (
    VALUES
      ('TSKHCMDLV001', 'SHPHCMDLV001', 'Quan 1'),
      ('TSKHCMDLV002', 'SHPHCMDLV002', 'Quan 3'),
      ('TSKHCMDLV003', 'SHPHCMDLV003', 'Quan 5'),
      ('TSKHCMDLV004', 'SHPHCMDLV004', 'Quan 7'),
      ('TSKHCMDLV005', 'SHPHCMDLV005', 'Thu Duc'),
      ('TSKHCMDLV006', 'SHPHCMDLV006', 'Binh Thanh'),
      ('TSKHCMDLV007', 'SHPHCMDLV007', 'Go Vap'),
      ('TSKHCMDLV008', 'SHPHCMDLV008', 'Tan Binh'),
      ('TSKHCMDLV009', 'SHPHCMDLV009', 'Phu Nhuan'),
      ('TSKHCMDLV010', 'SHPHCMDLV010', 'Binh Tan')
  ) AS t(task_code, shipment_code, area_name)
),
upserted AS (
  INSERT INTO tasks (
    "id",
    "taskCode",
    "taskType",
    "status",
    "shipmentCode",
    "pickupRequestId",
    "note",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'seed-' || lower(task_code),
    task_code,
    'DELIVERY'::"TaskType",
    'ASSIGNED'::"TaskStatus",
    shipment_code,
    NULL,
    'Don phat HCM khu vuc ' || area_name,
    now(),
    now()
  FROM seed_rows
  ON CONFLICT ("taskCode")
  DO UPDATE
    SET
      "taskType" = EXCLUDED."taskType",
      "status" = EXCLUDED."status",
      "shipmentCode" = EXCLUDED."shipmentCode",
      "pickupRequestId" = NULL,
      "note" = EXCLUDED."note",
      "createdAt" = now(),
      "updatedAt" = now()
  RETURNING "id", "taskCode"
),
deleted_assignments AS (
  DELETE FROM task_assignments ta
  USING upserted u
  WHERE ta."taskId" = u."id"
  RETURNING ta."id"
),
inserted_assignments AS (
  INSERT INTO task_assignments (
    "id",
    "taskId",
    "courierId",
    "assignedAt",
    "unassignedAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'seed-assign-' || lower(u."taskCode"),
    u."id",
    'courier.hcm',
    now(),
    NULL,
    now(),
    now()
  FROM upserted u
  RETURNING "id"
)
SELECT
  (SELECT count(*) FROM upserted) AS upserted_hcm_delivery_tasks,
  (SELECT count(*) FROM deleted_assignments) AS replaced_old_assignments,
  (SELECT count(*) FROM inserted_assignments) AS inserted_assignments;
'@

$verifyShipmentSql = @'
SELECT
  "code",
  "currentStatus",
  "metadata"->>'currentLocation' AS current_location,
  "metadata"->>'deliveryNote' AS delivery_note,
  "createdAt"
FROM shipments
WHERE "code" LIKE 'SHPHCMDLV%'
ORDER BY "code";
'@

$verifyTaskSql = @'
SELECT
  t."taskCode",
  t."taskType",
  t."status",
  t."shipmentCode",
  a."courierId",
  a."assignedAt"
FROM tasks t
LEFT JOIN task_assignments a
  ON a."taskId" = t."id"
  AND a."unassignedAt" IS NULL
WHERE t."taskCode" LIKE 'TSKHCMDLV%'
ORDER BY t."taskCode";
'@

Write-Host '[seed] upserting 10 HCM delivery shipments into shipment_db...'
Invoke-PsqlInContainer -Container 'jms-dev-postgres-shipment' -Database 'shipment_db' -Sql $shipmentSql

Write-Host '[seed] upserting 10 HCM delivery tasks into dispatch_db...'
Invoke-PsqlInContainer -Container 'jms-dev-postgres-dispatch' -Database 'dispatch_db' -Sql $dispatchSql

Write-Host '[verify] shipment rows'
Invoke-PsqlInContainer -Container 'jms-dev-postgres-shipment' -Database 'shipment_db' -Sql $verifyShipmentSql

Write-Host '[verify] dispatch task rows'
Invoke-PsqlInContainer -Container 'jms-dev-postgres-dispatch' -Database 'dispatch_db' -Sql $verifyTaskSql

Write-Host 'seed-hcm-delivery-orders completed'
