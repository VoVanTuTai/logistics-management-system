# pickup-service

## Muc tieu

`pickup-service` quan ly pickup request lifecycle:
- tao pickup request
- cap nhat pickup request
- huy pickup request
- hoan tat pickup request

## Pham vi scaffold

Scaffold hien tai chi o muc flow khung:
- create
- update
- cancel
- complete
- outbox skeleton
- consumer skeleton cho `shipment.cancelled`

Khong co scheduling logic.
Khong co validation nghiep vu chi tiet.

## API groups

- `GET /health`
- `GET /pickups`
- `GET /pickups/:id`
- `POST /pickups`
- `PATCH /pickups/:id`
- `POST /pickups/:id/cancel`
- `POST /pickups/:id/complete`

## Events publish

- `pickup.requested`
- `pickup.updated`
- `pickup.cancelled`
- `pickup.completed`

## Events consume

- `shipment.cancelled`

## Chay local

```bash
cd services/pickup-service
pnpm install
pnpm build
pnpm start:dev
```
