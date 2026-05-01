# Flow test scripts

Thu muc nay chua cac script smoke/e2e bang API de kiem tra du lieu di chuyen qua cac service. Script khong them dependency, chi can Node.js co `fetch` global.

## Chuan bi

Khoi dong backend, infra, migration va seed nhu runbook local:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-services-retry.ps1
powershell -ExecutionPolicy Bypass -File scripts/migrate-all.ps1
powershell -ExecutionPolicy Bypass -File scripts/seed-all.ps1
```

Gateway mac dinh: `http://localhost:3000`.

## Flow 01: Merchant tao don lay hang tai nha

Chay:

```bash
node scripts/flow-tests/pickup-at-home-flow.mjs
```

Script se kiem tra cac diem chinh:

1. Merchant tao shipment loai lay hang tai nha va tao pickup request.
2. Ops cung hub nhin thay pickup status `REQUESTED`.
3. Ops approve pickup, dispatch-service tao task `PICKUP` status `CREATED`.
4. Ops assign task cho courier, courier nhin thay task status `ASSIGNED`.
5. Courier scan nhan kien, scan-service ghi actor/note/location, shipment-service chuyen don sang `PICKUP_COMPLETED`, tracking-service co event `scan.pickup_confirmed`.

## Bien moi truong

Co the override cac gia tri mac dinh:

```bash
GATEWAY_URL=http://localhost:3000 \
MERCHANT_USERNAME=41100001 MERCHANT_PASSWORD=password \
OPS_USERNAME=20000001 OPS_PASSWORD=password \
COURIER_USERNAME=30000001 COURIER_PASSWORD=password \
HUB_CODE=001A001 \
node scripts/flow-tests/pickup-at-home-flow.mjs
```

Mac dinh script dung tai khoan seed HCM. Neu merchant seed cu van dung mat khau `merchant123456`, script se tu thu fallback sau khi thu `MERCHANT_PASSWORD`.
