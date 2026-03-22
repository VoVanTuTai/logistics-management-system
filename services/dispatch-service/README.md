# dispatch-service

## Muc tieu

`dispatch-service` quan ly task workflow cho:
- pickup
- delivery
- return

Service nay ho tro:
- tao task
- assign task
- reassign task
- complete task
- cancel task
- cung cap task list cho courier
- auto tao pickup task tu event pickup da duoc duyet

## Pham vi scaffold

Scaffold hien tai chi o muc skeleton:
- task workflow khung
- repository/prisma skeleton
- outbox skeleton
- consumer skeleton
- rabbitmq consumer + outbox relay de chay event-driven local

Khong co thuat toan toi uu phan cong.

## API groups

- `GET /health`
- `GET /tasks`
- `GET /tasks/couriers`
- `GET /tasks/:id`
- `POST /tasks`
- `POST /tasks/:id/assign`
- `POST /tasks/:id/reassign`
- `PATCH /tasks/:id/status`

`GET /tasks` ho tro filter query:
- `courierId`
- `taskType` (`PICKUP|DELIVERY|RETURN`)
- `status` (`CREATED|ASSIGNED|COMPLETED|CANCELLED`)
- `shipmentCode`
- `pickupRequestId`

`GET /tasks/couriers` tra ve danh sach courierId de UI Ops render select assign/reassign.

## Events publish

- `task.created`
- `task.assigned`
- `task.reassigned`
- `task.completed`
- `task.cancelled`

## Events consume

- `pickup.approved`
- `delivery.failed`

## Chay local

```bash
cd services/dispatch-service
pnpm install
pnpm build
pnpm start:dev
```
