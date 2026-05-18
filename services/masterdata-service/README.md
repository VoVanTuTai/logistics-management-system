# masterdata-service

## Scope

`masterdata-service` provides admin CRUD for shared master data:

- Hubs
- Zones
- NDR reasons
- Basic configs

Service owns dedicated DB: `masterdata_db`.

## Implemented capabilities

- CRUD APIs for `hubs`, `zones`, `ndr-reasons`, `configs`
- Input normalization:
  - code fields normalized to uppercase
  - config keys normalized to lowercase
  - text fields are trimmed
- Validation and business rules:
  - duplicate `code` / `key` protection
  - `hub.zoneCode` must exist
  - `zone.parentCode` must exist and cannot create cycle
- Admin list filters:
  - `code`, `name`, `isActive`, `q`...
- Outbox event persistence + relay publisher to RabbitMQ:
  - `masterdata.updated`
  - `ndr-reason.updated`

## API

- `GET /health`

### Hubs

- `GET /hubs?code=&name=&zoneCode=&isActive=&q=`
- `GET /hubs/:id`
- `POST /hubs`
- `PATCH /hubs/:id`

### Zones

- `GET /zones?code=&name=&parentCode=&isActive=&q=`
- `GET /zones/:id`
- `POST /zones`
- `PATCH /zones/:id`

### NDR reasons

- `GET /ndr-reasons?code=&description=&isActive=&q=`
- `GET /ndr-reasons/:id`
- `POST /ndr-reasons`
- `PATCH /ndr-reasons/:id`

### Configs

- `GET /configs?key=&scope=&q=`
- `GET /configs/:id`
- `POST /configs`
- `PATCH /configs/:id`

## Environment

See `.env.example`.

Default values:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:15433/masterdata_db
RABBITMQ_URL=amqp://guest:guest@localhost:5672
DOMAIN_EVENTS_EXCHANGE=domain.events
OUTBOX_RELAY_INTERVAL_MS=1000
OUTBOX_RELAY_BATCH_SIZE=50
```

## Local run

```bash
cd services/masterdata-service
npm install
npm run db:prepare
npm run start:dev
```

## Data

Seed data is disabled. Import real zones, hubs, NDR reasons, and configs from a trusted source or create them through the service API.

## Docker

Build context should be `services/masterdata-service`.

```bash
docker build -t masterdata-service .
docker run --env-file .env -p 3001:3001 masterdata-service
```
