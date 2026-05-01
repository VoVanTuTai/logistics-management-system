# manifest-service

## Muc tieu

`manifest-service` quan ly nghiep vu trung chuyen giua cac hub:
- Tao manifest
- Add/remove shipment vao manifest
- Seal manifest (niem phong xe/chuyen)
- Receive manifest (hub dich nhan ban giao)

## Rule nghiep vu

- Manifest chi cho phep add shipment khi status = `CREATED`.
- Gỡ shipment khoi bao duoc phep khi status = `CREATED`, `SEALED` hoac `RECEIVED`; request go bao co thong tin nhan vien/hub hoac bao da dong/da nhan se publish `manifest.unsealed`.
- Khong cho add shipment da nam trong manifest active khac (`CREATED`/`SEALED`).
- Chi seal khi:
  - Manifest dang `CREATED`
  - Co it nhat 1 shipment
  - `originHubCode` va `destinationHubCode` hop le, khac nhau
- Chi receive khi manifest dang `SEALED`.

## API

- `GET /health`
- `GET /manifests`
- `GET /manifests/:id`
- `POST /manifests`
- `PATCH /manifests/:id` (cap nhat thong tin + tuong thich add/remove cu)
- `POST /manifests/:id/shipments/add`
- `POST /manifests/:id/shipments/remove`
- `POST /manifests/:id/seal`
- `POST /manifests/:id/receive`

## Events publish

- `manifest.created`
- `manifest.updated`
- `manifest.sealed`
- `manifest.received`
- `manifest.unsealed`

Event duoc publish theo tung shipment trong manifest de shipment-service/tracking-service co the cap nhat read model day du.

## Events consume

- `scan.outbound`

## Messaging

- Outbox pattern + relay RabbitMQ (`manifest-outbox-relay.service.ts`)
- Consumer scaffold cho `scan.outbound` o `manifest-events.consumer.ts` de mo rong tiep khi can dong bo scan -> manifest.

## Chay local

```bash
cd services/manifest-service
npm install
npm run build
npm run start:dev
```
