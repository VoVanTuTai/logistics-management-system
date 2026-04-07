# Tai khoan test local

Cap nhat: 2026-04-07

Tai khoan duoc seed tai `services/auth-service/prisma/seed.ts`.

## 1) Tai khoan theo vai tro (de dang nhap nhanh)

| Vai tro | Username | Password | Login route |
|---|---|---|---|
| Admin | `10000001` | `password` | `/ops/auth/auth/login` |
| Ops | `20000001` | `password` | `/ops/auth/auth/login` |
| Courier | `30000001` | `password` | `/courier/auth/auth/login` |
| Merchant | `41100001` | `merchant123456` | `/merchant/auth/auth/login` |

Gateway local: `http://localhost:3000`

## 2) Day du cac tai khoan seed

| Vai tro | Khu vuc | Username | Password |
|---|---|---|---|
| Admin | HCM | `10000001` | `password` |
| Admin | HN | `10000002` | `password` |
| Ops | HCM | `20000001` | `password` |
| Ops | HN | `20000002` | `password` |
| Merchant | HCM | `41100001` | `merchant123456` |
| Merchant | HN | `41100002` | `merchant123456` |
| Courier | HCM | `30000001` | `password` |
| Courier | HN | `30000002` | `password` |

## 3) Luat ma username/user id

- User id bang username.
- Username phai la 8 chu so.
- Pattern theo vai tro:
  - Admin: `10000xxx`
  - Ops: `20000xxx`
  - Courier: `3000xxxx`
  - Merchant: `411xxxxx`

## 4) URL dang nhap giao dien

- Ops web: `http://localhost:5173`
- Merchant web: `http://localhost:5174`
- Admin web: `http://localhost:5175`
- Gateway API: `http://localhost:3000`

## 5) Lenh thao tac nhanh

Khoi dong backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-services-retry.ps1
```

Khoi dong full local (web + backend):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-all-retry.ps1 -SkipInfra -SkipMobile
```

Re-seed auth accounts:

```powershell
cd services/auth-service
npm run seed
```
