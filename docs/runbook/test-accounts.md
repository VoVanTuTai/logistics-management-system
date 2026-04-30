# Tài khoản test local

Cập nhật: 2026-04-30

Tai khoan duoc seed tai `services/auth-service/prisma/seed.ts`.

## 1) Tai khoan theo vai tro (de dang nhap nhanh)

| Vai tro | Username | Password | Login route |
|---|---|---|---|
| Admin | `10000001` | `password` | `/ops/auth/auth/login` |
| Ops | `20000001` | `password` | `/ops/auth/auth/login` |
| Courier | `30000001` | `password` | `/courier/auth/auth/login` |
| Merchant | `41100001` | `password` | `/merchant/auth/auth/login` |

Gateway local: `http://localhost:3000`

## 2) Day du cac tai khoan seed

| Vai trò | Khu vực | Username | Password | Ghi chú |
|---|---|---|---|---|
| Admin | Toàn hệ thống | `10000001` | `password` | Hub HN + HCM |
| Ops | Hà Nội | `20000001` | `password` | Hub `001A001` |
| Ops | HCM | `20000002` | `password` | Hub `003A001` |
| Merchant | Hà Nội | `41100001` | `password` | Shop Minh Anh Hà Nội |
| Merchant | Hà Nội | `41100002` | `password` | Thời trang Bảo Ngọc Hà Nội |
| Merchant | HCM | `41100003` | `password` | Shop Sài Gòn Fresh |
| Merchant | HCM | `41100004` | `password` | Mỹ phẩm An Nhiên HCM |
| Courier | Hà Nội | `30000001` | `password` | Nguyễn Văn Hùng |
| Courier | Hà Nội | `30000002` | `password` | Trần Quốc Bảo |
| Courier | HCM | `30000003` | `password` | Võ Văn Tú Tài |
| Courier | HCM | `30000004` | `password` | Lê Minh Tuấn |

## 3) Dữ liệu vận hành seed

- Hub Hà Nội: `001A001`.
- Hub Hồ Chí Minh: `003A001`.
- Mỗi hub có 10 task giao hàng `DELIVERY` và 10 task lấy hàng `PICKUP`.
- Các task được chia theo trạng thái `CREATED`, `ASSIGNED`, `COMPLETED`, `CANCELLED`.
- Pickup request có id cố định dạng `seed-pickup-hn-01` và `seed-pickup-hcm-01` để dispatch task trỏ đúng dữ liệu.

## 4) Luat ma username/user id

- User id bang username.
- Username phai la 8 chu so.
- Pattern theo vai tro:
  - Admin: `10000xxx`
  - Ops: `20000xxx`
  - Courier: `3000xxxx`
  - Merchant: `411xxxxx`

## 5) URL dang nhap giao dien

- Ops web: `http://localhost:5173`
- Merchant web: `http://localhost:5174`
- Admin web: `http://localhost:5175`
- Gateway API: `http://localhost:3000`

## 6) Lenh thao tac nhanh

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
