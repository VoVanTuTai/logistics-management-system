# Auth Service Specification

## 1. Muc tieu va pham vi

### 1.1 Muc tieu

`auth-service` cung cap xac thuc dang nhap theo mo hinh session + opaque token cho cac client noi bo (hien tai chu yeu la `courier-mobile` qua `gateway-bff`). Service chiu trach nhiem:

- Xac minh thong tin dang nhap (`username` + `password`).
- Cap cap token (`accessToken`, `refreshToken`) va tao session.
- Refresh session (rotate token trong cung mot session).
- Revoke session khi logout.
- Introspect access token de tra ve trang thai active/inactive.
- Ghi su kien domain auth vao outbox de phuc vu event-driven integration.

### 1.2 Non-goals (ngoai pham vi hien tai)

- Khong co register user.
- Khong co forgot/reset/change password.
- Khong co MFA/OTP dang nhap.
- Khong co RBAC policy engine chi tiet (chi tra ve `roles` tu DB).
- Khong co consumer domain event thuc te.
- Khong co verify token o gateway theo co che introspect (gateway guard hien tai chi check header ton tai).

### 1.3 Trang thai implementation

Service dang o muc scaffold co chuc nang core cho auth flow, nhung chua hoan thien cac phan sau:

- Password hash dang dung SHA-256 skeleton (chua dung Argon2/Bcrypt).
- Outbox worker chua publish event ra RabbitMQ (moi skeleton TODO).
- Chua co migration/seed script chinh thuc cho user mac dinh.
- Chua co rate limit/lockout/chong brute-force.

## 2. Boi canh kien truc va tich hop

### 2.1 Vi tri trong he thong

- Service: `services/auth-service`
- Runtime: NestJS + Prisma + PostgreSQL
- Port mac dinh: `3010`
- DB de xuat local dev: `auth_db`

### 2.2 Giao tiep voi gateway-bff

Gateway proxy theo convention `/{group}/{service}/...`.

- Client `courier-mobile` dang goi auth qua cac URL:
  - `/courier/auth/auth/login`
  - `/courier/auth/auth/refresh`
  - `/courier/auth/auth/logout`
  - `/courier/auth/auth/introspect`
- Segment service la `auth`, duoc `gateway-bff` map toi `AUTH_SERVICE_URL`.
- Duong dan con lai `/auth/...` duoc forward nguyen van sang `auth-service`.

Luu y hien tai:

- Neu bat `GATEWAY_AUTH_ENABLED=true`, gateway chi yeu cau co `Authorization` header, chua verify token.
- Vi vay token validation phai dua vao endpoint `/auth/introspect` khi tich hop day du.

### 2.3 Giao tiep event-driven

- Auth service tao outbox event cho:
  - `auth.session_created`
  - `auth.session_refreshed`
  - `auth.session_revoked`
- Exchange mac dinh: `domain.events`.
- Hien tai outbox worker chua publish (TODO), nen event dang dung o muc persist trong DB.

## 3. Domain model va data ownership

### 3.1 Aggregate/Entity

#### `UserAccount`

- Dai dien tai khoan dang nhap.
- Thuoc tinh chinh:
  - `id`
  - `username` (unique)
  - `passwordHash`
  - `status`: `ACTIVE | DISABLED`
  - `roles: string[]`

#### `AuthSession`

- Dai dien 1 phien dang nhap logic cua user.
- Luu hash cua access/refresh token, TTL, trang thai revoke.
- Thuoc tinh chinh:
  - `status`: `ACTIVE | REVOKED`
  - `accessTokenHash`, `refreshTokenHash` (unique)
  - `issuedAt`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`
  - `lastUsedAt`
  - `revokedAt`, `revokeReason`

#### `OutboxEvent`

- Luu su kien can publish ra message broker.
- Trang thai: `PENDING | PUBLISHED | FAILED`.

### 3.2 Data ownership

`auth-service` la owner duy nhat cua:

- user account auth metadata (`UserAccount` trong pham vi service).
- auth session va token hash (`AuthSession`).
- auth domain outbox (`OutboxEvent`).

Service khac khong duoc ghi truc tiep vao cac bang nay.

## 4. Session state machine

### 4.1 Trang thai logic

`AuthSession.status`:

- `ACTIVE`: session hop le ve mat business status.
- `REVOKED`: session da logout/revoke.

Luu y: expiry khong doi `status` trong DB. Expired duoc tinh dong qua so sanh thoi gian (`now > tokenExpiresAt`).

### 4.2 Chuyen trang thai

| Trigger | Dieu kien | Transition | Ket qua |
| --- | --- | --- | --- |
| Login thanh cong | User ACTIVE + password dung | Tao session moi `ACTIVE` | Cap access/refresh token moi |
| Refresh thanh cong | Tim thay session ACTIVE theo refresh token hash, refresh token chua expired | Giu session `ACTIVE`, rotate access/refresh token hash | Token cu mat hieu luc theo hash cu |
| Logout thanh cong | Tim thay session ACTIVE boi access hoac refresh token | `ACTIVE -> REVOKED` | Session bi vo hieu hoa |
| Introspect | Token khong tim thay/expired/user DISABLED | Khong doi state DB | Tra `active=false` |

### 4.3 Hanh vi token cu sau refresh

Sau refresh, hash token moi overwrite hash token cu trong cung session:

- Access token cu khong con map duoc den session -> introspect inactive.
- Refresh token cu cung khong con map duoc -> refresh tiep theo voi token cu se fail.

## 5. API contract chi tiet

Tat ca endpoint nam duoi prefix `/auth` (tru health check).

### 5.1 `POST /auth/login`

#### Muc dich
Xac thuc user va tao session moi.

#### Request body

```json
{
  "username": "demo",
  "password": "123456"
}
```

#### Validation

- `username` bat buoc.
- `password` bat buoc.

Neu thieu field -> `400 Bad Request` voi message:

- `username and password are required.`

#### Xu ly nghiep vu

1. Tim user theo `username`.
2. Kiem tra `user.status === ACTIVE`.
3. Verify password (`HashService.verify`).
4. Tao token moi (`OpaqueTokenService`).
5. Luu session (`AuthSession`).
6. Ghi outbox event `auth.session_created`.

#### Response `200 OK`

```json
{
  "user": {
    "id": "cuid",
    "username": "demo",
    "roles": ["COURIER"]
  },
  "session": {
    "id": "cuid",
    "userId": "cuid",
    "accessTokenHash": "sha256hex",
    "refreshTokenHash": "sha256hex",
    "status": "ACTIVE",
    "issuedAt": "2026-03-17T01:00:00.000Z",
    "accessTokenExpiresAt": "2026-03-17T01:15:00.000Z",
    "refreshTokenExpiresAt": "2026-04-16T01:00:00.000Z",
    "lastUsedAt": null,
    "revokedAt": null,
    "revokeReason": null,
    "createdAt": "2026-03-17T01:00:00.000Z",
    "updatedAt": "2026-03-17T01:00:00.000Z"
  },
  "tokens": {
    "accessToken": "opaque_hex_64_bytes",
    "refreshToken": "opaque_hex_64_bytes",
    "tokenType": "Bearer",
    "accessTokenExpiresAt": "2026-03-17T01:15:00.000Z",
    "refreshTokenExpiresAt": "2026-04-16T01:00:00.000Z",
    "expiresInSeconds": 900,
    "refreshExpiresInSeconds": 2592000
  }
}
```

#### Loi nghiep vu

- `401 Unauthorized`: `Invalid credentials.`

### 5.2 `POST /auth/refresh`

#### Muc dich
Cap lai cap token moi tu refresh token hop le.

#### Request body

```json
{
  "refreshToken": "opaque_refresh_token"
}
```

#### Validation

- `refreshToken` bat buoc.
- Thieu field -> `400 Bad Request`: `refreshToken is required.`

#### Xu ly nghiep vu

1. Hash refresh token input.
2. Tim session ACTIVE theo `refreshTokenHash`.
3. Kiem tra refresh token chua expired.
4. Kiem tra user con ACTIVE.
5. Sinh cap token moi.
6. Rotate token hash tren cung session.
7. Ghi outbox event `auth.session_refreshed`.

#### Response

- `200 OK` cung schema voi `/auth/login`.

#### Loi nghiep vu

- `401 Unauthorized`: `Refresh token is invalid or expired.`
- `401 Unauthorized`: `User account is not active.`

### 5.3 `POST /auth/logout`

#### Muc dich
Revoke session theo `accessToken` hoac `refreshToken`.

#### Request body

```json
{
  "accessToken": "opaque_access_token",
  "refreshToken": "opaque_refresh_token"
}
```

Co the gui 1 trong 2 token.

#### Validation

- Neu ca `accessToken` va `refreshToken` deu khong co -> `400 Bad Request`:
  - `accessToken or refreshToken is required for logout.`

#### Xu ly nghiep vu

1. Neu co access token -> uu tien tim session ACTIVE theo access token hash.
2. Neu khong tim thay va co refresh token -> tim theo refresh token hash.
3. Neu khong tim thay session -> tra ket qua thanh cong mem (`revoked=false`).
4. Neu tim thay -> set `status=REVOKED`, set `revokedAt`, `revokeReason='logout'`.
5. Ghi outbox event `auth.session_revoked`.

#### Response `200 OK`

Case revoke thanh cong:

```json
{
  "revoked": true,
  "sessionId": "session_cuid"
}
```

Case token khong ton tai/da revoke:

```json
{
  "revoked": false,
  "sessionId": null
}
```

### 5.4 `POST /auth/introspect`

#### Muc dich
Kiem tra access token co con active de su dung cho authorization hay khong.

#### Request body

```json
{
  "accessToken": "opaque_access_token"
}
```

#### Validation

- `accessToken` bat buoc.
- Thieu field -> `400 Bad Request`: `accessToken is required.`

#### Xu ly nghiep vu

1. Hash access token.
2. Tim session ACTIVE theo access token hash.
3. Neu khong tim thay hoac token expired -> inactive.
4. Neu tim thay -> update `lastUsedAt`.
5. Lay user theo `userId`.
6. Neu user khong ton tai hoac DISABLED -> inactive.
7. Neu hop le -> tra active + user claims.

#### Response `200 OK` - token active

```json
{
  "active": true,
  "sessionId": "session_cuid",
  "user": {
    "id": "user_cuid",
    "username": "demo",
    "roles": ["COURIER"]
  },
  "accessTokenExpiresAt": "2026-03-17T01:15:00.000Z"
}
```

#### Response `200 OK` - token inactive

```json
{
  "active": false,
  "sessionId": null,
  "user": null,
  "accessTokenExpiresAt": null
}
```

Luu y: introspect khong throw `401` cho token invalid/expired, ma tra `active=false`.

### 5.5 `GET /health`

Response:

```json
{
  "service": "auth-service",
  "status": "ok",
  "timestamp": "2026-03-17T01:00:00.000Z"
}
```

## 6. Persistence schema (Prisma/PostgreSQL)

### 6.1 Bang `UserAccount`

- `id` (PK, cuid)
- `username` (UNIQUE)
- `passwordHash`
- `status` (`ACTIVE|DISABLED`)
- `roles` (`text[]`)
- `createdAt`, `updatedAt`

### 6.2 Bang `AuthSession`

- `id` (PK)
- `userId` (FK -> `UserAccount.id`)
- `accessTokenHash` (UNIQUE)
- `refreshTokenHash` (UNIQUE)
- `status` (`ACTIVE|REVOKED`)
- `issuedAt`
- `accessTokenExpiresAt`, `refreshTokenExpiresAt`
- `lastUsedAt`
- `revokedAt`, `revokeReason`
- `createdAt`, `updatedAt`

### 6.3 Bang `OutboxEvent`

- `id` (PK)
- `eventId` (UNIQUE)
- `eventType`
- `routingKey`
- `aggregateType`
- `aggregateId`
- `payload` (JSON)
- `status` (`PENDING|PUBLISHED|FAILED`)
- `retryCount`
- `occurredAt`
- `publishedAt`
- `createdAt`, `updatedAt`

### 6.4 Rang buoc va he qua

- Luu hash token giup khong luu plain token trong DB.
- Unique hash giup moi token map den toi da 1 session.
- Chua co co che auto cleanup session expired.
- Chua co index bo sung theo (`status`, `accessTokenExpiresAt`) cho quet cleanup.

## 7. Bao mat

### 7.1 Token model

- Access token va refresh token la opaque string hex (32 bytes random -> 64 ky tu hex).
- Token khong chua claim nhu JWT, nen can introspect de validate.

### 7.2 Hashing

- Token hash va password verify dang dung SHA-256.
- `verify` co dung `timingSafeEqual` de tranh timing leak co ban.

### 7.3 Cac diem yeu (can nang cap)

- SHA-256 khong phu hop de hash password production.
- Chua co salt/work factor password hash.
- Chua co rate-limit/login attempt lockout.
- Chua co audit log security event day du.

### 7.4 Khuyen nghi production

- Chuyen password hash sang Argon2id hoac bcrypt (cost phu hop).
- Them brute-force protection (IP + username bucket).
- Them anomaly detection cho refresh bat thuong.
- Bat buoc TLS end-to-end.

## 8. Event va outbox

### 8.1 Event types

- `auth.session_created`
- `auth.session_refreshed`
- `auth.session_revoked`

### 8.2 Event envelope

```json
{
  "event_id": "uuid",
  "event_type": "auth.session_created",
  "occurred_at": "2026-03-17T01:00:00.000Z",
  "shipment_code": null,
  "actor": "demo",
  "location": null,
  "data": {
    "session": {
      "id": "..."
    }
  },
  "idempotency_key": "auth.session_created:session:<sessionId>:<timestamp>"
}
```

### 8.3 Outbox publish lifecycle

Hien tai:

1. Business flow tao session/revoke.
2. Outbox record duoc insert vao DB (`PENDING`).
3. Worker publish chua implement -> event chua ra RabbitMQ.

Rui ro hien tai:

- Chua co retry/DLQ.
- Chua co mark `FAILED`.
- Chua co transaction bao dam atomic giua write business va write outbox.

## 9. Cau hinh moi truong

| Env var | Bat buoc | Mac dinh | Mo ta |
| --- | --- | --- | --- |
| `PORT` | Khong | `3010` | Port HTTP cua auth-service |
| `DATABASE_URL` | Co | `""` | Chuoi ket noi PostgreSQL |
| `DOMAIN_EVENTS_EXCHANGE` | Khong | `domain.events` | Exchange de publish domain events |
| `ACCESS_TOKEN_TTL_SECONDS` | Khong | `900` | TTL access token |
| `REFRESH_TOKEN_TTL_SECONDS` | Khong | `2592000` | TTL refresh token |

## 10. Trinh tu xu ly (sequence)

### 10.1 Login

1. Client -> `POST /auth/login`.
2. Auth service verify credential.
3. Auth service issue token + create `AuthSession`.
4. Auth service enqueue `auth.session_created` vao outbox.
5. Auth service tra user/session/tokens.

### 10.2 Refresh

1. Client -> `POST /auth/refresh` voi refresh token.
2. Auth service tim session ACTIVE theo refresh token hash.
3. Kiem tra expiry + user status.
4. Rotate token hash trong session.
5. Enqueue `auth.session_refreshed`.
6. Tra token moi.

### 10.3 Logout

1. Client -> `POST /auth/logout`.
2. Auth service tim session ACTIVE boi access hoac refresh token.
3. Neu co session: revoke + enqueue `auth.session_revoked`.
4. Tra `{ revoked: true|false }`.

### 10.4 Introspect

1. Client/Gateway -> `POST /auth/introspect`.
2. Auth service tim session ACTIVE theo access token hash.
3. Check expiry + user status.
4. Update `lastUsedAt` neu active.
5. Tra ket qua `active`.

## 11. Failure handling va edge cases

### 11.1 Input invalid

- Missing field -> `400`.
- Sai credential -> `401`.

### 11.2 Token khong hop le

- Refresh token invalid/expired -> `401`.
- Introspect token invalid/expired -> `200 active=false`.

### 11.3 Logout idempotent-like behavior

- Logout voi token da vo hieu/khong ton tai -> `200 revoked=false`.
- Dam bao client co the goi logout lap lai ma khong fail flow.

### 11.4 Concurrency

- Refresh dong thoi co kha nang race condition do khong co lock/version check explicit.
- Login cung user nhieu lan -> tao nhieu session ACTIVE song song (hien tai cho phep).

### 11.5 Outbox consistency

- Neu insert outbox fail sau khi create/revoke session, su kien co the bi mat.
- Can transaction hoac reliable outbox unit-of-work de tranh split-brain state.

## 12. Van hanh va quan sat

### 12.1 Health

- `GET /health` chi phan anh process level, chua deep-check DB/RabbitMQ.

### 12.2 Logging

- Chua co structured audit log cho login fail/success/refresh/logout.
- Outbox worker skeleton co log debug TODO.

### 12.3 Chay local

```bash
cd services/auth-service
pnpm install
pnpm build
pnpm start:dev
```

### 12.4 Docker

- Dockerfile build tu `node:20-alpine`.
- Expose `3010`.

## 13. Test scenario de xac nhan

Collection co san: `services/auth-service/postman/auth-service.postman_collection.json`.

Smoke flow de xac nhan:

1. `GET /health` -> 200.
2. `POST /auth/login` -> lay token.
3. `POST /auth/introspect` voi access token moi -> `active=true`.
4. `POST /auth/refresh` -> lay cap token moi.
5. `POST /auth/introspect` voi access token cu -> `active=false`.
6. `POST /auth/logout` voi token moi -> `revoked=true`.
7. `POST /auth/introspect` token sau logout -> `active=false`.

## 14. Backlog ky thuat uu tien

### 14.1 P0 (bat buoc truoc production)

- Thay password hashing sang Argon2id/bcrypt + migration strategy.
- Implement outbox worker publish that su + retry + mark FAILED + DLQ.
- Them transaction boundary cho write business + outbox.
- Tich hop gateway verify token qua introspect (hoac JWT verification neu doi model).

### 14.2 P1

- Rate limit login, lockout tam thoi theo policy.
- Session policy: gioi han so session ACTIVE/user.
- Session cleanup job cho token expired/revoked cu.
- Bo sung OpenAPI contract tai `contracts/openapi/auth.yaml`.

### 14.3 P2

- Audit log security events + dashboard.
- Device fingerprint/session metadata.
- Token revocation list cache cho throughput cao.

## 15. Quyet dinh ky thuat quan trong (hien tai)

- Chon opaque token thay vi JWT de don gian hoa scaffold va tap trung vao introspection flow.
- Chon state session toi gian (`ACTIVE`, `REVOKED`) va coi expiry la runtime check.
- Chon outbox pattern cho event consistency, nhung implementation van dang incomplete.

## 16. Ma tran route tong hop

| Method | Path | Mo ta ngan | Auth yeu cau |
| --- | --- | --- | --- |
| `GET` | `/health` | Health check process | Khong |
| `POST` | `/auth/login` | Dang nhap, tao session + token | Khong |
| `POST` | `/auth/refresh` | Rotate token tu refresh token | Khong |
| `POST` | `/auth/logout` | Revoke session | Khong (nhung can token trong body) |
| `POST` | `/auth/introspect` | Kiem tra access token active/inactive | Khong (nhung can token trong body) |

Luu y: auth header khong duoc su dung truc tiep trong logic `auth-service` hien tai; token duoc truyen trong JSON body theo contract scaffold.
