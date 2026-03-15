# auth-service

`auth-service` duoc scaffold o muc toi thieu de cap `session/token` cho gateway va internal auth layer.

## Assumption

Vi chua co contract chi tiet cho auth domain, scaffold nay dung assumption toi thieu:
- opaque access token
- opaque refresh token
- session-based auth
- gateway se verify token qua auth layer/service sau nay

## Scope

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/introspect`
- `GET /health`

## Entities

- `UserAccount`
- `AuthSession`
- `OutboxEvent`

## Events publish

- `auth.session_created`
- `auth.session_refreshed`
- `auth.session_revoked`

## Notes

- day la scaffold skeleton
- khong co user registration flow
- khong co RBAC/business policy chi tiet
- khong consume event
- token hien tai la opaque token, khong phai JWT
- password hash skeleton dung SHA-256; TODO thay bang password hashing thuc te
