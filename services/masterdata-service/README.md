# masterdata-service

## Muc tieu

`masterdata-service` quan ly du lieu master dung chung:
- `Hub`
- `Zone`
- `NdrReason`
- `Config`

Service so huu DB rieng `masterdata_db`.

## Pham vi scaffold

Ban scaffold hien tai chi o muc CRUD skeleton:
- route controller
- application service
- repository abstraction
- prisma repository
- outbox record skeleton

Khong co validation nghiep vu chi tiet.

## API groups

- `GET /health`
- `GET /hubs`
- `GET /hubs/:id`
- `POST /hubs`
- `PATCH /hubs/:id`
- `GET /zones`
- `GET /zones/:id`
- `POST /zones`
- `PATCH /zones/:id`
- `GET /ndr-reasons`
- `GET /ndr-reasons/:id`
- `POST /ndr-reasons`
- `PATCH /ndr-reasons/:id`
- `GET /configs`
- `GET /configs/:id`
- `POST /configs`
- `PATCH /configs/:id`

## Events

Write path ghi `OutboxEvent` cho:
- `masterdata.updated`
- `ndr-reason.updated`

Luu y:
- Scaffold hien tai chi persist outbox record
- Chua co worker publish RabbitMQ thuc te

## Bien moi truong

Xem `.env.example`.

Mac dinh:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masterdata_db
```

## Chay local

```bash
cd services/masterdata-service
pnpm install
pnpm build
pnpm start:dev
```

## Docker

Build context nen la thu muc `services/masterdata-service`.

```bash
docker build -t masterdata-service .
docker run --env-file .env -p 3001:3001 masterdata-service
```
