# Báo Cáo Rút Gọn: Hoàn Thiện Module Admin

## 1. Mục Tiêu

Module Admin được hoàn thiện để đáp ứng các yêu cầu quản trị cốt lõi của hệ thống logistics:

- Quản lý người dùng theo nhóm vai trò Admin, Ops, Shipper và Merchant.
- Quản lý dữ liệu danh mục như hub, zone, lý do NDR, cấu hình và hồ sơ merchant.
- Có phân quyền mobile được lưu backend và enforce ở gateway.
- Có audit log để truy vết thao tác quản trị quan trọng.
- Có dashboard lấy số liệu thật từ API.
- Có cơ chế disable/soft delete thay vì xóa cứng dữ liệu nghiệp vụ.
- Có validation ở cả frontend và backend.
- Có session refresh và smoke test để kiểm chứng các luồng chính.

Mục tiêu chính là đưa Admin từ mức prototype lên mức đủ chắc để demo, báo cáo và giải thích được về nghiệp vụ lẫn kỹ thuật.

## 2. Phạm Vi Đã Triển Khai

### 2.1. Dọn Code Prototype Không Dùng

Đã xóa các file permission prototype cũ không còn được import hoặc sử dụng:

- `adminPermissions.ts`
- `permissionStore.ts`
- `AdminAuthorizationPage.tsx`

Việc này giúp giảm code thừa và tránh nhầm lẫn khi review source code.

### 2.2. Dashboard Admin Dùng Dữ Liệu Thật

Dashboard Admin không còn dùng số liệu tĩnh. Các KPI hiện được lấy từ API hiện có:

- Tổng số người dùng.
- Số user ACTIVE / DISABLED.
- Số tài khoản Ops, Shipper, Merchant.
- Số hub active / inactive.
- Số zone active.
- Số lý do NDR active.
- Số cấu hình hệ thống.

Dashboard có loading state, error state và biểu đồ trực quan. Phần biểu đồ được tách lazy chunk để nếu chart lỗi thì dashboard chính vẫn hiển thị được.

### 2.3. Disable / Soft Delete

Admin UI đã chuyển các thao tác xóa nhạy cảm sang vô hiệu hóa:

- User: chuyển `status` giữa `ACTIVE` và `DISABLED`.
- Hub: chuyển `isActive` giữa `true` và `false`.
- Merchant user: vô hiệu hóa/kích hoạt lại thay vì xóa hồ sơ.

Thông báo xác nhận đã được sửa rõ rằng dữ liệu không bị xóa vật lý, chỉ ngừng sử dụng trong vận hành.

### 2.4. Validation Frontend Và Backend

Frontend đã validate sớm các form quản trị:

- Hub: bắt buộc mã/tên, chuẩn hóa mã, chống trùng, validate địa chỉ.
- Zone: bắt buộc mã/tên, chặn parent trỏ về chính nó.
- Config: validate key/scope và JSON/value theo kiểu dữ liệu.
- NDR reason: bắt buộc mã/mô tả, chống trùng mã.

Backend `masterdata-service` cũng enforce validation tương ứng:

- Chuẩn hóa code/key trước khi lưu.
- Chặn duplicate theo nghiệp vụ.
- Chặn parent cycle của zone.
- Validate config value và một số config rủi ro cao.

Nhờ đó, frontend chỉ là lớp hỗ trợ UX; backend vẫn là nơi bảo vệ dữ liệu chính.

### 2.5. Phân Quyền Courier Mobile Lưu Backend

Phân quyền mobile không còn phụ thuộc localStorage làm source of truth.

`auth-service` đã có:

- `MobilePermissionProfile`: lưu ma trận quyền mặc định theo actor.
- `MobilePermissionOverride`: lưu override theo từng user.
- API đọc/ghi ma trận quyền:
  - `GET /auth/mobile-permissions/matrix`
  - `PUT /auth/mobile-permissions/matrix`
- API đọc/ghi quyền effective theo user:
  - `GET /auth/mobile-permissions/users/:userId/effective`
  - `PUT /auth/mobile-permissions/users/:userId`

Admin web đã tích hợp các API này để load/save phân quyền. Khi API hoạt động, dữ liệu luôn lấy từ `auth-service`.

### 2.6. Enforce Permission Ở Gateway Và Courier App

Phân quyền không chỉ dùng để ẩn/hiện nút trên UI. Gateway đã enforce quyền cho các thao tác courier quan trọng:

- Pickup scan.
- Hub inbound/outbound scan.
- Bag seal / bag unseal.
- Delivery success / delivery fail.
- COD collect.

Gateway gọi `auth-service` để lấy effective permission theo user. Nếu permission API lỗi hoặc user không có quyền, gateway mặc định chặn thao tác nhạy cảm.

Courier mobile cũng fetch effective permission sau login/restore session và ẩn/disable các action không được phép.

### 2.7. Bỏ Fallback UI Prototype Khỏi Demo Mode Permission

Trang phân quyền courier trước đây có fallback “UI prototype” khi API lỗi. Cơ chế này đã được đổi thành opt-in bằng env:

```env
VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK=false
```

Mặc định trong demo/production là `false`.

Khi permission API lỗi và fallback không được bật:

- UI hiển thị lỗi rõ: “Không tải được phân quyền từ backend”.
- Các thao tác sửa/lưu permission bị disable.
- Có nút “Tải lại”.

Khi cần dev local, có thể bật fallback bằng:

```env
VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK=true
```

Khi đó UI vẫn dùng prototype nhưng label ghi rõ là local fallback, không dùng cho demo.

### 2.8. Audit Log Quản Trị

`auth-service` và `masterdata-service` đã có bảng `AdminAuditLog` để ghi nhận thao tác quản trị.

Audit log lưu các trường chính:

- actor id / username.
- action.
- target type.
- target id.
- before / after.
- request id.
- IP, user agent.
- thời điểm tạo.

Các thao tác tạo, sửa, vô hiệu hóa hoặc xóa mềm user/masterdata đều được ghi audit. Lỗi ghi audit được log lại nhưng không làm hỏng transaction chính.

### 2.9. Audit Server-Side Pagination, Search Và Export

Audit viewer đã được nâng cấp qua gateway unified:

- `GET /ops/admin/audit-logs`
- `GET /ops/admin/audit-logs/export`

Gateway nhận các filter:

- `source`
- `action`
- `targetType`
- `targetId`
- `actor`
- `createdFrom`
- `createdTo`
- `q`
- `limit`
- `offset`

Response chuẩn:

```json
{
  "items": [],
  "pageInfo": {
    "hasNextPage": false,
    "total": 0
  }
}
```

Admin web không còn tự merge audit từ hai service ở client. UI đã có search box, source filter, page size, server-side pagination và export CSV theo filter hiện tại.

Schema audit đã bổ sung index theo `createdAt`, `actor`, `action`, `targetType` và `targetId` để hỗ trợ truy vấn dữ liệu lớn hơn.

### 2.10. Session Refresh

Admin web đã xử lý refresh session:

- Khi hydrate app, nếu access token gần hết hạn thì refresh trước.
- Khi API trả 401, client thử refresh một lần rồi retry request.
- Nếu refresh fail, session bị clear và user quay về màn hình đăng nhập.
- Có cơ chế tránh nhiều request cùng refresh một lúc.

Điều này giúp Admin web không bị trắng màn hình khi token hết hạn trong lúc sử dụng.

### 2.11. Merchant Profile Thành Dữ Liệu Riêng

Merchant profile đã được tách khỏi config scope thành model riêng trong `masterdata-service`:

- `MerchantProfile`
- unique `username`
- unique `citizenId`
- region/default hub/default sender address

Service vẫn có hướng đọc/migrate dữ liệu legacy nếu cần, giúp không mất dữ liệu demo cũ.

### 2.12. Smoke Tests

Admin web đã có smoke test bằng Vitest + Testing Library.

Các luồng được kiểm tra:

- Login guard: chưa đăng nhập không vào được app.
- Dashboard KPI shell render với data mock.
- User form validation và update payload.
- Hub form validation và disable flow.
- Permission matrix save thành công và báo lỗi khi backend save fail.
- Permission API lỗi khi fallback không bật thì UI báo lỗi và disable thao tác.

Smoke test không cần database thật, phù hợp để kiểm tra nhanh các luồng UI chính.

## 3. Kiểm Chứng

Các lệnh đã được chạy trong quá trình hoàn thiện:

```bash
cd apps/admin-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

Kết quả:

- Smoke test pass.
- Admin web build pass.

Các service liên quan cũng đã được typecheck/build trong các wave triển khai:

- `auth-service`
- `masterdata-service`
- `gateway-bff`
- `courier-mobile`

## 4. Giá Trị Đạt Được

### RBAC

Phân quyền courier mobile được lưu backend, đọc qua API và enforce ở gateway. Người dùng không thể bypass UI để gọi các thao tác nhạy cảm nếu không có quyền.

### Auditability

Các thay đổi quan trọng của admin có audit log với actor, action, before/after và timestamp. Khi cần trả lời “ai đã sửa dữ liệu này”, hệ thống có nguồn truy vết rõ ràng.

### Data Integrity

Danh mục có validation cả frontend lẫn backend. Các lỗi như duplicate code, JSON sai hoặc parent zone không hợp lệ được chặn trước khi ảnh hưởng dữ liệu.

### Operational Safety

User và hub được disable thay vì xóa cứng, phù hợp với nghiệp vụ logistics vì dữ liệu đã phát sinh cần được giữ để truy vết.

### Observability

Dashboard Admin lấy dữ liệu thật từ API và có biểu đồ hỗ trợ trình bày trạng thái hệ thống.

### Reliability

Session refresh giúp admin sử dụng hệ thống ổn định hơn. Smoke test giúp phát hiện sớm lỗi ở các luồng chính.

## 5. Lưu Ý Khi Demo

- Permission API của `auth-service` phải chạy ổn vì demo mode không bật fallback prototype.
- Nếu muốn fallback khi dev local, chỉ bật `VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK=true` trong môi trường local.
- Cần seed sẵn dữ liệu demo: admin, ops, shipper, merchant, hub, zone, config, NDR reason và audit logs.
- Audit export hiện dùng CSV, đủ cho báo cáo/demo. Nếu phát triển production có thể bổ sung Excel.
- Smoke test là UI test mock API, không thay thế E2E chạy với backend thật.

## 6. Hướng Nâng Cấp Sau Báo Cáo

- Bổ sung Playwright E2E chạy với backend và database seed thật.
- Chuẩn hóa toàn bộ UI text tiếng Việt nếu còn chỗ chưa đồng bộ.
- Bổ sung role/permission chi tiết hơn cho từng nhóm Admin/Ops.
- Bổ sung dashboard audit/security event riêng.
- Tối ưu audit search nâng cao hơn nếu dữ liệu tăng lớn.
- Bổ sung export Excel cho audit log và báo cáo admin.

## 7. Kết Luận

Module Admin đã được hoàn thiện ở mức đủ tốt để báo cáo đồ án:

- Có dashboard số liệu thật.
- Có quản lý user/masterdata an toàn.
- Có validation frontend/backend.
- Có RBAC backend và gateway enforcement.
- Có audit log, server-side pagination, search và export.
- Có session refresh.
- Có smoke test kiểm chứng luồng chính.

So với prototype ban đầu, Admin hiện đã có cơ sở kỹ thuật rõ ràng hơn, giảm rủi ro khi demo và dễ giải thích trước hội đồng về các khía cạnh bảo mật, truy vết, toàn vẹn dữ liệu và vận hành.
