# manifest-service

## Muc tieu

`manifest-service` quan ly manifest/handover:
- create manifest
- update manifest
- seal manifest
- receive handover

## Pham vi scaffold

Scaffold hien tai chi o muc khung:
- create
- update
- seal
- receive
- outbox skeleton
- consumer skeleton cho `scan.outbound`

Khong co validation doi soat chi tiet.

## API groups

- `GET /health`
- `GET /manifests`
- `GET /manifests/:id`
- `POST /manifests`
- `PATCH /manifests/:id`
- `POST /manifests/:id/seal`
- `POST /manifests/:id/receive`

## Events publish

- `manifest.created`
- `manifest.updated`
- `manifest.sealed`
- `manifest.received`

## Events consume

- `scan.outbound`

## Chay local

```bash
cd services/manifest-service
pnpm install
pnpm build
pnpm start:dev
```
