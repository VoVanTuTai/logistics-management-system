# Admin module report

## 1. RBAC

Admin web chỉ cho phép người dùng có vai trò quản trị truy cập module. Phía client kiểm tra session hiện tại qua `hasAdminRole`, chấp nhận `SYSTEM_ADMIN` và `SYS_ADMIN`; nếu không hợp lệ, người dùng bị chuyển về màn hình đăng nhập. Các nhóm tài khoản vận hành được tách theo role group:

- Admin: `10000xxx`, vai trò `SYSTEM_ADMIN`.
- Ops: `20000xxx`, vai trò `OPS_ADMIN` hoặc `OPS_VIEWER`.
- Shipper: `3000xxxx`, vai trò `COURIER`.
- Merchant: `411xxxxx`, vai trò `MERCHANT`.

Backend `auth-service` tiếp tục kiểm tra tính tương thích giữa mã tài khoản và vai trò khi tạo/cập nhật user, nên UI không phải là lớp bảo vệ duy nhất. Ma trận phân quyền mobile được quản lý riêng cho `OPS` và `COURIER`, có hỗ trợ override theo từng user.

Trang phân quyền courier dùng `auth-service` làm source of truth cho ma trận quyền và override theo user. Trong demo/production, fallback "UI prototype" mặc định bị tắt; nếu permission API lỗi, màn hình hiển thị lỗi "Không tải được phân quyền từ backend", khóa thao tác lưu/sửa và chỉ cho phép tải lại. Fallback prototype chỉ dành cho local dev khi bật rõ env `VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK=true`, đồng thời UI phải ghi nhãn đây là local fallback.

## 2. Audit

Các thao tác quản trị quan trọng đều được ghi audit log qua bảng `AdminAuditLog`. `auth-service` ghi nhận thay đổi user và phân quyền; `masterdata-service` ghi nhận thay đổi hub, zone, lý do NDR, config và merchant profile. Audit log lưu actor, action, target type, target id, trạng thái trước/sau, request id, IP, user agent và thời điểm tạo.

Audit viewer hiện đọc qua API gateway thống nhất `GET /ops/admin/audit-logs`, không còn tự merge hai nguồn ở client. Gateway nhận filter `source`, `action`, `targetType`, `targetId`, `actor`, `createdFrom`, `createdTo`, `q`, `limit`, `offset` và trả response chuẩn `{ items, pageInfo }` với `hasNextPage` và `total`. Hai service audit truy vấn server-side theo `createdAt desc`, có offset pagination, search/filter ở database và index theo `createdAt`, actor, action, target type/target id. Admin web có page size, server-side pagination, search box, filter source và export CSV theo filter hiện tại qua `GET /ops/admin/audit-logs/export`.

## 3. Soft delete

Module admin ưu tiên vô hiệu hóa thay vì xóa vật lý đối với dữ liệu nghiệp vụ đang được tham chiếu. User dùng trạng thái `ACTIVE`/`DISABLED`; hub, zone, lý do NDR và config dùng `isActive` trong record hoặc envelope cấu hình. Khi vô hiệu hóa, dữ liệu, lịch sử và quan hệ gán hub vẫn được giữ lại để phục vụ truy vết và khôi phục.

## 4. Validation

Validation được thực hiện ở cả UI và service. UI dùng pattern/required field và thông báo lỗi tiếng Việt cho đăng nhập, user, merchant, hub, zone, lý do NDR và config. Backend chuẩn hóa username, role, status, hub code, text length và payload JSON trước khi ghi database. Config hỗ trợ kiểm tra kiểu `STRING`, `NUMBER`, `BOOLEAN`, `JSON`; lý do NDR và địa chỉ hub được đóng gói JSON có cấu trúc để UI đọc lại an toàn.

## 5. Merchant profile

Hồ sơ merchant đã được tách khỏi bảng `Config` thành model `MerchantProfile` riêng trong `masterdata-service`. Bảng mới lưu `username`, `citizenId`, khu vực, hub mặc định, địa chỉ gửi mặc định, `createdAt` và `updatedAt`; đồng thời có unique constraint cho `username` và `citizenId`. Admin web gọi API merchant profile chuyên biệt khi tạo/cập nhật merchant, không ghi mới vào config scope `MERCHANT_PROFILE`.

Để không mất dữ liệu seed/demo cũ, service vẫn hỗ trợ đọc legacy config `MERCHANT_PROFILE` và tự migrate profile hợp lệ sang bảng mới khi truy vấn. Hướng nâng cấp tiếp theo là liên kết `MerchantProfile` bằng khóa ngoại tới `UserAccount` hoặc một merchant aggregate riêng nếu hệ thống cần quản trị merchant đầy đủ hơn.

## 6. Session refresh

Admin web lưu access token và refresh token trong auth store. Khi khởi động, client restore session từ storage, kiểm tra hạn access token và gọi refresh nếu cần. Nếu refresh token hết hạn, không hợp lệ hoặc user không còn vai trò admin, session bị xóa và người dùng phải đăng nhập lại. `auth-service` rotate access/refresh token khi refresh thành công và ghi event session refresh vào outbox.

## 7. Smoke tests

Smoke test của admin web nằm tại `apps/admin-web/src/__tests__/admin-smoke.test.tsx` và chạy bằng `npm run test:smoke` trong `apps/admin-web`. Bộ test kiểm tra các luồng chính: login, route bảo vệ admin, quản lý user, quản lý hub, ma trận phân quyền courier và xử lý lỗi backend. Đây là lớp kiểm tra nhanh để xác nhận module admin vẫn render và gửi đúng payload sau các thay đổi UI/API.

Ngoài smoke test, admin web có Playwright E2E thật tại `apps/admin-web/e2e/admin.e2e.spec.ts`, chạy bằng `npm run test:e2e` sau khi gateway/backend và database seed demo đã sẵn sàng. E2E kiểm tra đăng nhập admin, quản lý user/masterdata, permission matrix, audit log và restore session. Nếu backend chưa chạy, test dừng ở preflight với thông báo rõ endpoint gateway cần bật.

## Seed demo

Seed demo được chuẩn bị ở:

- `services/auth-service/prisma/seed.ts`: admin, ops, shipper, merchant, permission profiles và audit logs.
- `services/masterdata-service/prisma/seed.ts`: zone, hub, lý do NDR, config, merchant profile và audit logs.

Chạy seed sau khi database đã sẵn sàng:

```bash
cd services/auth-service && npm run db:seed
cd ../masterdata-service && npm run db:seed
```

Mật khẩu demo mặc định là `password`; có thể đổi bằng biến môi trường `DEMO_PASSWORD`.
