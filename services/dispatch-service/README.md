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

## Pham vi scaffold

Scaffold hien tai chi o muc skeleton:
- task workflow khung
- repository/prisma skeleton
- outbox skeleton
- consumer skeleton

Khong co thuat toan toi uu phan cong.

## API groups

- `GET /health`
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `POST /tasks/:id/assign`
- `POST /tasks/:id/reassign`
- `PATCH /tasks/:id/status`

## Events publish

- `task.created`
- `task.assigned`
- `task.reassigned`
- `task.completed`
- `task.cancelled`

## Events consume

- `pickup.requested`
- `delivery.failed`

## Chay local

```bash
cd services/dispatch-service
pnpm install
pnpm build
pnpm start:dev
```
