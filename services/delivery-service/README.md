# delivery-service

`delivery-service` quan ly delivery attempt, success/fail, POD, OTP, NDR va return flow o muc skeleton.

## Scope

- `POST /deliveries/attempts`
- `POST /deliveries/success`
- `POST /deliveries/fail`
- `POST /ndr`
- `POST /ndr/:id/reschedule`
- `POST /returns`
- `POST /returns/:id/complete`
- `GET /health`

## Idempotency

- `success/fail` bat buoc co `idempotencyKey`
- Duplicate request se tra lai ket qua cu tu `IdempotencyRecord`
- Khong tao them `DeliveryAttempt`, `NdrCase`, `ReturnCase` hay outbox event moi khi request bi replay

## Notes

- Scaffold nay chi la skeleton
- Khong co logic reporting/tracking trong service nay
- Khong co validation nghiep vu chi tiet
- `task.assigned` moi duoc scaffold consumer hook
- OTP va POD duoc the hien trong flow delivery, khong mo them API group ngoai pham vi yeu cau
