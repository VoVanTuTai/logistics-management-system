# scan-service

`scan-service` la source of truth cua scan events va `current_location`.

## Scope

- Ghi nhan `pickup`, `inbound`, `outbound` scan
- Idempotency cho scan request
- Luu va expose `current_location`
- Ghi outbox event cho:
  - `scan.pickup_confirmed`
  - `scan.inbound`
  - `scan.outbound`
  - `location.updated`
- Consume skeleton cho `manifest.sealed`

## Ownership

- `scan-service` la canonical owner cua `current_location`
- `shipment-service` khong so huu `current_location`
- `tracking-service` chi la read model, khong so huu `current_location`

## Idempotency

- API scan nhan `idempotencyKey` trong body
- Service luu `IdempotencyRecord` kem response snapshot
- Request trung `idempotencyKey` se tra lai ket qua cu, khong tao them scan event moi

## APIs

- `POST /scans/pickup`
- `POST /scans/inbound`
- `POST /scans/outbound`
- `GET /locations/:shipmentCode`
- `GET /health`

## Notes

- Scaffold nay chi o muc skeleton
- Khong co validation nghiep vu chi tiet
- Chua co RabbitMQ publisher worker thuc te
- `manifest.sealed` moi duoc scaffold hook xu ly, de `TODO` cho business flow sau
