# Tai khoan va du lieu local

Cap nhat: 2026-04-30

Seed du lieu da duoc tat. Local/dev hien dung du lieu that co san trong database hoac du lieu duoc tao/import qua API.

## Dang nhap

Khong con tai khoan seed mac dinh. Tao tai khoan that bang auth-service users API hoac import tu nguon du lieu duoc phe duyet.

Gateway local: `http://localhost:3000`

## Luat ma username/user id

- User id bang username.
- Username phai la 8 chu so.
- Pattern theo vai tro:
  - Admin: `10000xxx`
  - Ops: `20000xxx`
  - Courier: `3000xxxx`
  - Merchant: `411xxxxx`

## URL giao dien

- Ops web: `http://localhost:5173`
- Merchant web: `http://localhost:5174`
- Admin web: `http://localhost:5175`
- Gateway API: `http://localhost:3000`

## Khoi dong

Khoi dong backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-services-retry.ps1
```

Khoi dong full local:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-all-retry.ps1
```

Lenh `scripts/seed-all.ps1` hien chi in thong bao disabled va khong tao fixture.
