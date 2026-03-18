# shipment-service

## Muc tieu

`shipment-service` quan ly shipment write model:
- tao shipment
- cap nhat shipment
- huy shipment
- quan ly change request
- nhan domain events de cap nhat state machine

## Ownership

`shipment-service` la canonical owner cua `shipment.current_status`.

Luu y:
- `tracking-service` chi la read model, khong ghi `current_status`
- `scan-service` la source of truth cua scan events, khong so huu `current_status`
- moi thay doi `current_status` phai di qua `shipment-service`

## Pham vi scaffold

Pham vi hien tai:
- route controller
- application service
- state machine skeleton
- prisma repository
- outbox relay publish den RabbitMQ exchange `domain.events`
- consumer skeleton

Khong co validation nghiep vu chi tiet.

## API groups

- `GET /health`
- `GET /shipments`
- `GET /shipments/:code`
- `POST /shipments`
- `PATCH /shipments/:code`
- `POST /shipments/:code/cancel`
- `GET /change-requests`
- `GET /change-requests/:id`
- `POST /change-requests`
- `PATCH /change-requests/:id/approve`

## Chay local

```bash
cd services/shipment-service
pnpm install
pnpm build
pnpm start:dev
```
