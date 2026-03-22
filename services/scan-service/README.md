# scan-service

`scan-service` is the source of truth for scan events and `current_location`.

## Scope

- Record scan flows:
  - `pickup`
  - `inbound`
  - `outbound`
- Store and expose `current_location`
- Enforce idempotency for scan requests
- Publish outbox domain events:
  - `scan.pickup_confirmed`
  - `scan.inbound`
  - `scan.outbound`
  - `location.updated`
- Consume `manifest.sealed` event contract (application handler scaffold)

## Ownership

- `scan-service` is the canonical owner of `current_location`
- `shipment-service` owns `current_status`
- `tracking-service` is a read model (does not own source-of-truth state)

## Idempotency

- Scan APIs require `idempotencyKey` in request body
- Service stores `IdempotencyRecord` with response snapshot
- Duplicate idempotency requests return the existing response and do not create extra scan rows

## APIs

- `POST /scans/pickup`
- `POST /scans/inbound`
- `POST /scans/outbound`
- `GET /locations/:shipmentCode`
- `GET /health`

## Messaging

- Scan APIs enqueue outbox rows for:
  - `scan.pickup_confirmed`
  - `scan.inbound`
  - `scan.outbound`
  - `location.updated`
- `manifest.sealed` handling contract is scaffolded in `ScanEventsConsumer`
