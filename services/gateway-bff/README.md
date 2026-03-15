# gateway-bff

## Muc tieu

`gateway-bff` la entry point duy nhat cho:
- `ops-web`
- `merchant-web`
- `public-tracking`
- `courier-mobile`

Service nay chi lam:
- health check
- auth/guard o muc gateway
- proxy request den backend services qua internal HTTP

Service nay khong chua business logic nghiep vu va khong so huu domain DB.

## Route convention

Gateway forward theo mau:

```text
/{group}/{service}/...
```

Vi du:

```text
GET /public/tracking/shipments/TRK123
GET /merchant/shipment/shipments/SHP001
POST /ops/scan/scans
POST /courier/delivery/tasks/TASK001/complete
```

## API groups

- `/public`
- `/merchant`
- `/ops`
- `/courier`

Luu y:
- Scaffold hien tai khong hardcode service exposure matrix theo tung group
- TODO: khoa allowlist theo tung client/group sau khi contract API duoc chot

## Auth guard

- `public` khong ap guard
- `merchant`, `ops`, `courier` co the bat guard bang `GATEWAY_AUTH_ENABLED=true`
- Guard hien tai chi kiem tra su ton tai cua header `Authorization`
- TODO: thay bang verify token thuc te thong qua auth layer/service khi contract duoc chot

## Bien moi truong

Gateway se auto-load file `.env` khi boot. Xem file `.env.example`.

Tat ca backend service URLs duoc inject qua env:
- `AUTH_SERVICE_URL`
- `DELIVERY_SERVICE_URL`
- `DISPATCH_SERVICE_URL`
- `MANIFEST_SERVICE_URL`
- `MASTERDATA_SERVICE_URL`
- `PICKUP_SERVICE_URL`
- `REPORTING_SERVICE_URL`
- `SCAN_SERVICE_URL`
- `SHIPMENT_SERVICE_URL`
- `TRACKING_SERVICE_URL`

## Chay local

```bash
cd services/gateway-bff
pnpm install
pnpm start:dev
```
