# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: QUẢN TRỊ VIÊN (SYSTEM ADMIN)
## Ứng dụng phục vụ: `apps/admin-web` (Port `:5173`)

---

## 0. Tổng Quan Nhóm Chức Năng Quản Trị Hệ Thống

Quản trị viên (*System Admin*) quản lý danh mục dùng chung (Master Data), phân quyền truy cập, kiểm soát mạng lưới và cấu hình chính sách vận hành toàn hệ thống:
- **5.1. Quản trị người dùng & Phân công nhân sự**: Tạo tài khoản, khóa/mở khóa, gán bưu cục cho Ops, gán tuyến cho Courier.
- **5.2. Quản lý phân quyền RBAC & Mobile Override**: Cấu hình ma trận vai trò và cấp quyền ghi đè ngoại lệ trên app bưu tá.
- **5.3. Quản trị danh mục mạng lưới Hub 4 cấp**: Thêm, sửa, kích hoạt hoặc vô hiệu hóa các Hub từ Cấp 1 tới Cấp 4.
- **5.4. Quản lý Zone địa lý & Ma trận vùng cước**: Thiết lập bảng phân vùng địa lý phục vụ định tuyến và tính phí IATA.
- **5.5. Quản lý danh mục lý do giao thất bại (NDR Reasons)**: Chuẩn hóa bộ mã sự cố phát hàng dùng chung toàn mạng lưới.
- **5.6. Cấu hình tham số hệ thống & Tra soát Audit Log**: Quản lý timeout, tỷ lệ phí bảo hiểm, kiểm toán vết thay đổi nhạy cảm.

---

## 5.1. Quản Trị Người Dùng & Phân Công Nhân Sự (Ops Staff / Courier)

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Auth as Auth Service (:3010)
    participant Masterdata as Masterdata Service (:3001)
    participant Audit as Audit Log Service

    Admin->>Web: Nhập thông tin nhân sự mới: Họ tên, Email, SĐT, Vai trò (OPS_STAFF), Bưu cục trực thuộc
    Web->>Gateway: POST /api/v1/admin/users
    Gateway->>Auth: POST /internal/users/create
    Auth->>Auth: Mã hóa mật khẩu (Bcrypt), kiểm tra tính duy nhất của Email
    Auth->>Masterdata: POST /internal/personnel/assign-hub { userId, hubId: "HUB-TAN-BINH" }
    Masterdata-->>Auth: Xác nhận gán bưu cục thành công
    Auth->>Audit: Ghi nhật ký kiểm toán (action: "USER_CREATED", targetRole: "OPS_STAFF")
    Auth-->>Gateway: 201 Created { userId, email, role, hubId }
    Gateway-->>Web: 201 Created
    Web-->>Admin: Hiển thị thông báo "Tạo tài khoản và phân công nhân sự thành công"
```

---

## 5.2. Quản Lý Phân Quyền RBAC & Mobile Permission Override

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Auth as Auth Service (:3010)

    Admin->>Web: Chọn bưu tá Courier và bật quyền override đặc biệt (VD: Bỏ qua OTP khi sự cố điện thoại)
    Web->>Gateway: PUT /api/v1/admin/users/{courierId}/mobile-permissions
    Gateway->>Auth: PUT /internal/users/{courierId}/permissions
    Note over Auth: Cấu hình profile: CAN_OVERRIDE_OTP = true, EXPIRES_AT = 24h<br/>Kèm lý do phê duyệt của Admin
    Auth->>Auth: Lưu quyền override tạm thời & Đánh dấu phiên làm việc cần làm mới
    Auth-->>Gateway: 200 OK { userId, permissions: [...] }
    Gateway-->>Web: 200 OK
    Web-->>Admin: Hiển thị thông báo cấp quyền override thành công
```

---

## 5.3. Quản Trị Danh Mục Mạng Lưới Hub 4 Cấp (Thêm, Sửa, Vô Hiệu Hóa)

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Masterdata as Masterdata Service (:3001)
    participant Audit as Audit Log Service

    Admin->>Web: Chọn cấp Hub (Mega Hub / Regional / Provincial / Post Office) & Điền tọa độ Geofence
    Web->>Gateway: POST /api/v1/admin/hubs { code: "HUB_TB_01", name: "Mega Hub Tân Bình", level: 1, lat: 10.801, lng: 106.654 }
    Gateway->>Masterdata: POST /internal/masterdata/hubs
    Masterdata->>Masterdata: Kiểm tra trùng mã code, lưu ranh giới Geofence Polygon
    Masterdata->>Audit: Ghi nhận vết tạo Hub mới
    Masterdata-->>Gateway: 201 Created { hubId, code: "HUB_TB_01", status: "ACTIVE" }
    Gateway-->>Web: 201 Created
    Web-->>Admin: Cập nhật Hub mới lên bản đồ số tương tác (Leaflet/Mapbox)
```

---

## 5.4. Quản Lý Khu Vực / Zone Địa Lý & Ma Trận Vùng Cước

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Masterdata as Masterdata Service (:3001)
    participant Pricing as Pricing Service (:3012)

    Admin->>Web: Cấu hình ánh xạ tỉnh/thành sang các phân vùng (INTRA_PROVINCE, REGIONAL, INTER_PROVINCE)
    Web->>Gateway: PUT /api/v1/admin/zones/matrix
    Gateway->>Masterdata: PUT /internal/masterdata/zones
    Masterdata->>Masterdata: Cập nhật bảng liên kết ProvincePair -> ZoneType
    Masterdata->>Pricing: POST /internal/pricing/cache-evict (Xóa cache bảng cước cũ)
    Pricing-->>Masterdata: Xác nhận nạp cache ma trận vùng mới
    Masterdata-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK
    Web-->>Admin: Báo thành công: "Đã cập nhật bảng phân vùng cước toàn mạng lưới"
```

---

## 5.5. Quản Trị Danh Mục Mã Lý Do Giao Thất Bại (NDR Reasons)

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Masterdata as Masterdata Service (:3001)

    Admin->>Web: Thêm mã lý do mới: Mã "KH_CHUYEN_CHO_O", Tên "Khách đã chuyển nơi cư trú", Cho phép giao lại: FALSE
    Web->>Gateway: POST /api/v1/admin/ndr-reasons { code, name, allowReschedule: false, autoReturn: true }
    Gateway->>Masterdata: POST /internal/masterdata/ndr-reasons
    Masterdata->>Masterdata: Lưu vào danh mục mã chuẩn hóa hệ thống
    Masterdata-->>Gateway: 201 Created
    Gateway-->>Web: 201 Created
    Web-->>Admin: Danh mục mã NDR đã được bổ sung, sẵn sàng đồng bộ sang ứng dụng di động bưu tá
```

---

## 5.6. Cấu Hình Tham Số Hệ Thống & Kiểm Toán Tra Soát Audit Log

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant Web as Admin Web (:5173)
    participant Gateway as Gateway BFF (:3000)
    participant Masterdata as Masterdata Service (:3001)
    participant Audit as Audit Log Service

    Admin->>Web: Thay đổi tham số "Tỷ lệ phí bảo hiểm khai giá" từ 0.5% lên 0.6%
    Web->>Gateway: PUT /api/v1/admin/system-config { key: "INSURANCE_RATE_PERCENT", value: 0.6 }
    Gateway->>Masterdata: PUT /internal/system-config
    Masterdata->>Masterdata: Cập nhật giá trị cấu hình mới
    Masterdata->>Audit: Ghi vết kiểm toán: { actor: Admin.email, ip: clientIp, oldValue: "0.5", newValue: "0.6" }
    Masterdata-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK
    Web-->>Admin: Báo thành công & Cập nhật danh sách lịch sử Audit Log thời gian thực
```

