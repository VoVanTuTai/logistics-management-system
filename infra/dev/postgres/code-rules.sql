-- Code governance rules for JMS IDs.
-- Run each section in the matching database.
-- Existing legacy data can stay temporarily because constraints are created with NOT VALID.

/* =====================
   auth_db
   ===================== */
ALTER TABLE "UserAccount"
DROP CONSTRAINT IF EXISTS user_account_username_8_digits_chk;

ALTER TABLE "UserAccount"
ADD CONSTRAINT user_account_username_8_digits_chk
CHECK ("username" ~ '^[0-9]{8}$') NOT VALID;

ALTER TABLE "UserAccount"
DROP CONSTRAINT IF EXISTS user_account_username_by_role_chk;

ALTER TABLE "UserAccount"
ADD CONSTRAINT user_account_username_by_role_chk
CHECK (
  CASE
    WHEN "roles" && ARRAY['SYSTEM_ADMIN']::text[] THEN "username" ~ '^10000[0-9]{3}$'
    WHEN "roles" && ARRAY['OPS_ADMIN', 'OPS_VIEWER']::text[] THEN "username" ~ '^20000[0-9]{3}$'
    WHEN "roles" && ARRAY['COURIER']::text[] THEN "username" ~ '^3000[0-9]{4}$'
    WHEN "roles" && ARRAY['MERCHANT']::text[] THEN "username" ~ '^411[0-9]{5}$'
    ELSE "username" ~ '^[0-9]{8}$'
  END
) NOT VALID;

ALTER TABLE "UserAccount"
DROP CONSTRAINT IF EXISTS user_account_id_equals_username_chk;

ALTER TABLE "UserAccount"
ADD CONSTRAINT user_account_id_equals_username_chk
CHECK ("id" = "username") NOT VALID;

/* =====================
   masterdata_db
   ===================== */
ALTER TABLE hubs
DROP CONSTRAINT IF EXISTS hubs_code_segment2_chk;

ALTER TABLE hubs
ADD CONSTRAINT hubs_code_segment2_chk
CHECK (code ~ '^00[1-3][A-Z][0-9]{3}$') NOT VALID;

ALTER TABLE hubs
DROP CONSTRAINT IF EXISTS hubs_zone_segment1_chk;

ALTER TABLE hubs
ADD CONSTRAINT hubs_zone_segment1_chk
CHECK ("zoneCode" IS NULL OR "zoneCode" ~ '^00[1-3]$') NOT VALID;

ALTER TABLE zones
DROP CONSTRAINT IF EXISTS zones_segment1_chk;

ALTER TABLE zones
ADD CONSTRAINT zones_segment1_chk
CHECK (code ~ '^00[1-3]$') NOT VALID;

CREATE TABLE IF NOT EXISTS hub_routes (
  id bigserial PRIMARY KEY,
  hub_code text NOT NULL REFERENCES hubs(code) ON DELETE CASCADE,
  route_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hub_routes_route_code_chk CHECK (route_code ~ '^(0[1-9]|10)$'),
  CONSTRAINT hub_routes_hub_route_unique UNIQUE (hub_code, route_code)
);

INSERT INTO hub_routes (hub_code, route_code)
SELECT h.code, LPAD(gs::text, 2, '0')
FROM hubs h
CROSS JOIN generate_series(1, 10) AS gs
ON CONFLICT (hub_code, route_code) DO NOTHING;

CREATE OR REPLACE FUNCTION ensure_default_hub_routes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO hub_routes (hub_code, route_code)
  SELECT NEW.code, LPAD(gs::text, 2, '0')
  FROM generate_series(1, 10) AS gs
  ON CONFLICT (hub_code, route_code) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hubs_default_routes ON hubs;

CREATE TRIGGER trg_hubs_default_routes
AFTER INSERT ON hubs
FOR EACH ROW
EXECUTE FUNCTION ensure_default_hub_routes();

CREATE TABLE IF NOT EXISTS vehicle_tags (
  id bigserial PRIMARY KEY,
  tag_code text NOT NULL UNIQUE,
  hub_code text NULL REFERENCES hubs(code),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_tags_code_chk CHECK (tag_code ~ '^XT[0-9]{10}$')
);

/* =====================
   shipment_db
   ===================== */
ALTER TABLE shipments
DROP CONSTRAINT IF EXISTS shipments_waybill_code_chk;

ALTER TABLE shipments
ADD CONSTRAINT shipments_waybill_code_chk
CHECK (code ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE change_requests
DROP CONSTRAINT IF EXISTS change_requests_shipment_code_chk;

ALTER TABLE change_requests
ADD CONSTRAINT change_requests_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

/* =====================
   manifest_db
   ===================== */
ALTER TABLE manifests
DROP CONSTRAINT IF EXISTS manifests_bag_code_chk;

ALTER TABLE manifests
ADD CONSTRAINT manifests_bag_code_chk
CHECK ("manifestCode" ~ '^MB[0-9]{10}$') NOT VALID;

ALTER TABLE manifests
DROP CONSTRAINT IF EXISTS manifests_origin_hub_code_chk;

ALTER TABLE manifests
ADD CONSTRAINT manifests_origin_hub_code_chk
CHECK ("originHubCode" IS NULL OR "originHubCode" ~ '^00[1-3][A-Z][0-9]{3}$') NOT VALID;

ALTER TABLE manifests
DROP CONSTRAINT IF EXISTS manifests_destination_hub_code_chk;

ALTER TABLE manifests
ADD CONSTRAINT manifests_destination_hub_code_chk
CHECK ("destinationHubCode" IS NULL OR "destinationHubCode" ~ '^00[1-3][A-Z][0-9]{3}$') NOT VALID;

ALTER TABLE manifest_items
DROP CONSTRAINT IF EXISTS manifest_items_shipment_code_chk;

ALTER TABLE manifest_items
ADD CONSTRAINT manifest_items_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

/* =====================
   dispatch_db
   ===================== */
ALTER TABLE task_assignments
DROP CONSTRAINT IF EXISTS task_assignments_courier_code_chk;

ALTER TABLE task_assignments
ADD CONSTRAINT task_assignments_courier_code_chk
CHECK ("courierId" ~ '^3000[0-9]{4}$') NOT VALID;

ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_shipment_code_chk;

ALTER TABLE tasks
ADD CONSTRAINT tasks_shipment_code_chk
CHECK ("shipmentCode" IS NULL OR "shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

/* =====================
   scan_db
   ===================== */
ALTER TABLE "ScanEvent"
DROP CONSTRAINT IF EXISTS scan_event_shipment_code_chk;

ALTER TABLE "ScanEvent"
ADD CONSTRAINT scan_event_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "ScanEvent"
DROP CONSTRAINT IF EXISTS scan_event_manifest_code_chk;

ALTER TABLE "ScanEvent"
ADD CONSTRAINT scan_event_manifest_code_chk
CHECK ("manifestCode" IS NULL OR "manifestCode" ~ '^MB[0-9]{10}$') NOT VALID;

ALTER TABLE "CurrentLocation"
DROP CONSTRAINT IF EXISTS current_location_shipment_code_chk;

ALTER TABLE "CurrentLocation"
ADD CONSTRAINT current_location_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "CurrentLocation"
DROP CONSTRAINT IF EXISTS current_location_manifest_code_chk;

ALTER TABLE "CurrentLocation"
ADD CONSTRAINT current_location_manifest_code_chk
CHECK ("manifestCode" IS NULL OR "manifestCode" ~ '^MB[0-9]{10}$') NOT VALID;

/* =====================
   delivery_db
   ===================== */
ALTER TABLE "DeliveryAttempt"
DROP CONSTRAINT IF EXISTS delivery_attempt_shipment_code_chk;

ALTER TABLE "DeliveryAttempt"
ADD CONSTRAINT delivery_attempt_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "DeliveryAttempt"
DROP CONSTRAINT IF EXISTS delivery_attempt_courier_id_chk;

ALTER TABLE "DeliveryAttempt"
ADD CONSTRAINT delivery_attempt_courier_id_chk
CHECK ("courierId" IS NULL OR "courierId" ~ '^3000[0-9]{4}$') NOT VALID;

ALTER TABLE "OtpRecord"
DROP CONSTRAINT IF EXISTS otp_record_shipment_code_chk;

ALTER TABLE "OtpRecord"
ADD CONSTRAINT otp_record_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "NdrCase"
DROP CONSTRAINT IF EXISTS ndr_case_shipment_code_chk;

ALTER TABLE "NdrCase"
ADD CONSTRAINT ndr_case_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "ReturnCase"
DROP CONSTRAINT IF EXISTS return_case_shipment_code_chk;

ALTER TABLE "ReturnCase"
ADD CONSTRAINT return_case_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

/* =====================
   tracking_db
   ===================== */
ALTER TABLE "TimelineEvent"
DROP CONSTRAINT IF EXISTS timeline_event_shipment_code_chk;

ALTER TABLE "TimelineEvent"
ADD CONSTRAINT timeline_event_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "TrackingCurrent"
DROP CONSTRAINT IF EXISTS tracking_current_shipment_code_chk;

ALTER TABLE "TrackingCurrent"
ADD CONSTRAINT tracking_current_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "TrackingIndex"
DROP CONSTRAINT IF EXISTS tracking_index_shipment_code_chk;

ALTER TABLE "TrackingIndex"
ADD CONSTRAINT tracking_index_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

/* =====================
   reporting_db
   ===================== */
ALTER TABLE "ShipmentStatusProjection"
DROP CONSTRAINT IF EXISTS shipment_status_projection_shipment_code_chk;

ALTER TABLE "ShipmentStatusProjection"
ADD CONSTRAINT shipment_status_projection_shipment_code_chk
CHECK ("shipmentCode" ~ '^(111|101|222|333)[0-9]{9}$') NOT VALID;

ALTER TABLE "ShipmentStatusProjection"
DROP CONSTRAINT IF EXISTS shipment_status_projection_courier_code_chk;

ALTER TABLE "ShipmentStatusProjection"
ADD CONSTRAINT shipment_status_projection_courier_code_chk
CHECK ("courierCode" IS NULL OR "courierCode" ~ '^3000[0-9]{4}$') NOT VALID;

ALTER TABLE "ShipmentStatusProjection"
DROP CONSTRAINT IF EXISTS shipment_status_projection_hub_code_chk;

ALTER TABLE "ShipmentStatusProjection"
ADD CONSTRAINT shipment_status_projection_hub_code_chk
CHECK ("hubCode" IS NULL OR "hubCode" ~ '^00[1-3][A-Z][0-9]{3}$') NOT VALID;

-- After legacy data is migrated, run VALIDATE CONSTRAINT per table.
