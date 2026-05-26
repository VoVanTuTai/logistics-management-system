# Admin - Mermaid Sequence Diagrams

> File sơ đồ Mermaid cho nhóm chức năng **Quản trị viên (Admin)** trong Nexus Express System.  
> Mở file này trong VS Code bằng Markdown Preview Mermaid Support để xem và chụp hình sơ đồ.

---

## Mermaid theme xanh dương dùng trong toàn file

Các sơ đồ bên dưới đã được gắn sẵn đoạn `init` màu xanh dương trong từng block Mermaid.

---

## 0. Tổng quan luồng chức năng Admin

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Truy cập trang quản trị
    AdminWeb->>Gateway: Gửi yêu cầu tải dữ liệu quản trị
    Gateway->>Auth: Lấy danh sách tài khoản và vai trò
    Auth-->>Gateway: Trả dữ liệu user, role, permission
    Gateway->>Masterdata: Lấy hub, zone, NDR reason, cấu hình
    Masterdata-->>Gateway: Trả dữ liệu cấu hình hệ thống
    Gateway-->>AdminWeb: Tổng hợp dữ liệu quản trị
    AdminWeb-->>Admin: Hiển thị dashboard quản trị

    Admin->>AdminWeb: Thêm / sửa / khóa tài khoản hoặc cấu hình
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật
    alt Cập nhật tài khoản người dùng
        Gateway->>Auth: Thực hiện thay đổi user / role / trạng thái
        Auth-->>Gateway: Cập nhật thành công
        Auth->>EventBus: Publish user.updated / user.disabled
    else Cập nhật dữ liệu cấu hình
        Gateway->>Masterdata: Thực hiện thay đổi hub / zone / NDR reason
        Masterdata-->>Gateway: Cập nhật thành công
        Masterdata->>EventBus: Publish masterdata.updated
    end
    EventBus-->>Tracking: Đồng bộ thông tin tham chiếu nếu cần
    EventBus-->>Reporting: Cập nhật dữ liệu báo cáo nếu cần
    Gateway-->>AdminWeb: Trả kết quả xử lý
    AdminWeb-->>Admin: Hiển thị thông báo thành công
```

---

# NHÓM 1: Quản lý tài khoản người dùng

## 1. Quản lý tài khoản người gửi / Merchant

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý tài khoản Merchant
    AdminWeb->>Gateway: GET /admin/users?role=MERCHANT
    Gateway->>Auth: Lấy danh sách tài khoản Merchant
    Auth-->>Gateway: Trả danh sách tài khoản
    Gateway-->>AdminWeb: Trả dữ liệu hiển thị
    AdminWeb-->>Admin: Hiển thị danh sách Merchant

    alt Thêm tài khoản Merchant
        Admin->>AdminWeb: Nhập thông tin Merchant mới
        AdminWeb->>Gateway: POST /admin/users
        Gateway->>Auth: Tạo tài khoản role MERCHANT
        Auth-->>Gateway: Tạo tài khoản thành công
        Auth->>EventBus: Publish user.created
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã thêm tài khoản
    else Sửa thông tin Merchant
        Admin->>AdminWeb: Cập nhật thông tin Merchant
        AdminWeb->>Gateway: PATCH /admin/users/{userId}
        Gateway->>Auth: Cập nhật thông tin tài khoản
        Auth-->>Gateway: Cập nhật thành công
        Auth->>EventBus: Publish user.updated
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã cập nhật
    else Khóa tài khoản Merchant
        Admin->>AdminWeb: Chọn khóa tài khoản
        AdminWeb->>Gateway: PATCH /admin/users/{userId}/disable
        Gateway->>Auth: Đổi trạng thái tài khoản sang bị khóa
        Auth-->>Gateway: Khóa tài khoản thành công
        Auth->>EventBus: Publish user.disabled
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã khóa tài khoản
    end
```

---

## 2. Quản lý tài khoản nhân viên vận hành / OPS Staff

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý tài khoản OPS Staff
    AdminWeb->>Gateway: GET /admin/users?role=OPS_STAFF
    Gateway->>Auth: Lấy danh sách nhân viên vận hành
    Auth-->>Gateway: Trả danh sách tài khoản OPS
    Gateway->>Masterdata: Lấy danh sách hub/zone để gán phạm vi làm việc
    Masterdata-->>Gateway: Trả danh sách hub/zone
    Gateway-->>AdminWeb: Trả dữ liệu quản lý OPS
    AdminWeb-->>Admin: Hiển thị danh sách OPS Staff

    alt Thêm OPS Staff
        Admin->>AdminWeb: Nhập thông tin và chọn hub phụ trách
        AdminWeb->>Gateway: POST /admin/users
        Gateway->>Auth: Tạo tài khoản role OPS_STAFF
        Auth-->>Gateway: Tạo tài khoản thành công
        Auth->>EventBus: Publish user.created
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã thêm nhân viên vận hành
    else Sửa thông tin OPS Staff
        Admin->>AdminWeb: Sửa thông tin hoặc hub phụ trách
        AdminWeb->>Gateway: PATCH /admin/users/{userId}
        Gateway->>Auth: Cập nhật thông tin OPS Staff
        Auth-->>Gateway: Cập nhật thành công
        Auth->>EventBus: Publish user.updated
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã cập nhật
    else Khóa OPS Staff
        Admin->>AdminWeb: Chọn khóa tài khoản
        AdminWeb->>Gateway: PATCH /admin/users/{userId}/disable
        Gateway->>Auth: Khóa tài khoản OPS Staff
        Auth-->>Gateway: Khóa tài khoản thành công
        Auth->>EventBus: Publish user.disabled
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã khóa tài khoản
    end
```

---

## 3. Quản lý tài khoản nhân viên giao nhận / Courier

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant Dispatch as Dispatch Service
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý Courier
    AdminWeb->>Gateway: GET /admin/users?role=COURIER
    Gateway->>Auth: Lấy danh sách tài khoản Courier
    Auth-->>Gateway: Trả danh sách Courier
    Gateway->>Masterdata: Lấy hub/zone/tuyến phụ trách
    Masterdata-->>Gateway: Trả dữ liệu phạm vi giao nhận
    Gateway-->>AdminWeb: Trả dữ liệu quản lý Courier
    AdminWeb-->>Admin: Hiển thị danh sách Courier

    alt Thêm Courier
        Admin->>AdminWeb: Nhập thông tin và tuyến phụ trách
        AdminWeb->>Gateway: POST /admin/users
        Gateway->>Auth: Tạo tài khoản role COURIER
        Auth-->>Gateway: Tạo tài khoản thành công
        Gateway->>Dispatch: Khởi tạo thông tin courier assignment nếu cần
        Dispatch-->>Gateway: Ghi nhận courier sẵn sàng phân công
        Auth->>EventBus: Publish user.created
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã thêm Courier
    else Sửa thông tin Courier
        Admin->>AdminWeb: Cập nhật thông tin hoặc tuyến phụ trách
        AdminWeb->>Gateway: PATCH /admin/users/{userId}
        Gateway->>Auth: Cập nhật thông tin Courier
        Auth-->>Gateway: Cập nhật thành công
        Auth->>EventBus: Publish user.updated
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã cập nhật
    else Khóa Courier
        Admin->>AdminWeb: Chọn khóa tài khoản Courier
        AdminWeb->>Gateway: PATCH /admin/users/{userId}/disable
        Gateway->>Auth: Khóa tài khoản Courier
        Auth-->>Gateway: Khóa tài khoản thành công
        Auth->>EventBus: Publish user.disabled
        Gateway-->>AdminWeb: Trả kết quả thành công
        AdminWeb-->>Admin: Thông báo đã khóa tài khoản
    end
```

---

# NHÓM 2: Cấu hình hệ thống

## 4. Quản lý Hub

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant EventBus as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Admin->>AdminWeb: Mở màn hình quản lý Hub
    AdminWeb->>Gateway: GET /ops/masterdata/hubs
    Gateway->>Masterdata: Lấy danh sách Hub
    Masterdata-->>Gateway: Trả danh sách Hub
    Gateway-->>AdminWeb: Trả dữ liệu Hub
    AdminWeb-->>Admin: Hiển thị danh sách Hub

    alt Thêm Hub
        Admin->>AdminWeb: Nhập thông tin Hub mới
        AdminWeb->>Gateway: POST /admin/masterdata/hubs
        Gateway->>Masterdata: Tạo Hub mới
        Masterdata-->>Gateway: Tạo Hub thành công
        Masterdata->>EventBus: Publish hub.created
    else Sửa Hub
        Admin->>AdminWeb: Cập nhật thông tin Hub
        AdminWeb->>Gateway: PATCH /admin/masterdata/hubs/{hubId}
        Gateway->>Masterdata: Cập nhật Hub
        Masterdata-->>Gateway: Cập nhật thành công
        Masterdata->>EventBus: Publish hub.updated
    else Vô hiệu hóa Hub
        Admin->>AdminWeb: Chọn vô hiệu hóa Hub
        AdminWeb->>Gateway: PATCH /admin/masterdata/hubs/{hubId}/disable
        Gateway->>Masterdata: Đổi trạng thái Hub sang inactive
        Masterdata-->>Gateway: Vô hiệu hóa thành công
        Masterdata->>EventBus: Publish hub.disabled
    end

    EventBus-->>Tracking: Cập nhật dữ liệu tham chiếu Hub
    EventBus-->>Reporting: Cập nhật báo cáo theo Hub
    Gateway-->>AdminWeb: Trả kết quả xử lý
    AdminWeb-->>Admin: Hiển thị thông báo thành công
```

---

## 5. Quản lý Zone

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant Pricing as Pricing Service
    participant EventBus as RabbitMQ domain.events
    participant Reporting as Reporting Service

    Admin->>AdminWeb: Mở màn hình quản lý Zone
    AdminWeb->>Gateway: GET /admin/masterdata/zones
    Gateway->>Masterdata: Lấy danh sách Zone
    Masterdata-->>Gateway: Trả danh sách Zone
    Gateway-->>AdminWeb: Trả dữ liệu Zone
    AdminWeb-->>Admin: Hiển thị danh sách Zone

    alt Thêm Zone
        Admin->>AdminWeb: Nhập thông tin Zone mới
        AdminWeb->>Gateway: POST /admin/masterdata/zones
        Gateway->>Masterdata: Tạo Zone mới
        Masterdata-->>Gateway: Tạo Zone thành công
        Masterdata->>EventBus: Publish zone.created
    else Sửa Zone
        Admin->>AdminWeb: Cập nhật thông tin Zone
        AdminWeb->>Gateway: PATCH /admin/masterdata/zones/{zoneId}
        Gateway->>Masterdata: Cập nhật Zone
        Masterdata-->>Gateway: Cập nhật thành công
        Masterdata->>EventBus: Publish zone.updated
    else Vô hiệu hóa Zone
        Admin->>AdminWeb: Chọn vô hiệu hóa Zone
        AdminWeb->>Gateway: PATCH /admin/masterdata/zones/{zoneId}/disable
        Gateway->>Masterdata: Đổi trạng thái Zone sang inactive
        Masterdata-->>Gateway: Vô hiệu hóa thành công
        Masterdata->>EventBus: Publish zone.disabled
    end

    EventBus-->>Pricing: Đồng bộ zone phục vụ tính cước
    EventBus-->>Reporting: Cập nhật báo cáo theo zone
    Gateway-->>AdminWeb: Trả kết quả xử lý
    AdminWeb-->>Admin: Hiển thị thông báo thành công
```

---

## 6. Quản lý phân quyền chức năng app mobile cho OPS / Courier

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant CourierMobile as Courier Mobile
    participant OpsWeb as OPS Web
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình phân quyền chức năng
    AdminWeb->>Gateway: GET /admin/permissions
    Gateway->>Auth: Lấy danh sách role và permission
    Auth-->>Gateway: Trả ma trận phân quyền
    Gateway-->>AdminWeb: Trả dữ liệu phân quyền
    AdminWeb-->>Admin: Hiển thị quyền theo vai trò OPS / Courier

    Admin->>AdminWeb: Bật/tắt quyền chức năng
    AdminWeb->>Gateway: PATCH /admin/permissions
    Gateway->>Auth: Cập nhật permission cho role hoặc user
    Auth-->>Gateway: Cập nhật phân quyền thành công
    Auth->>EventBus: Publish permission.updated
    Gateway-->>AdminWeb: Trả kết quả thành công
    AdminWeb-->>Admin: Hiển thị thông báo đã lưu phân quyền

    EventBus-->>CourierMobile: Lần đồng bộ tiếp theo nhận quyền mới
    EventBus-->>OpsWeb: Lần đồng bộ tiếp theo nhận quyền mới
```

---

## 7. Quản lý bộ mã lý do ngoại lệ giao hàng / NDR Reason

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
    actor Admin as Admin
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant Delivery as Delivery Service
    participant EventBus as RabbitMQ domain.events
    participant Reporting as Reporting Service

    Admin->>AdminWeb: Mở màn hình quản lý NDR Reason
    AdminWeb->>Gateway: GET /admin/masterdata/ndr-reasons
    Gateway->>Masterdata: Lấy danh sách mã lý do NDR
    Masterdata-->>Gateway: Trả danh sách NDR Reason
    Gateway-->>AdminWeb: Trả dữ liệu hiển thị
    AdminWeb-->>Admin: Hiển thị bộ mã lý do ngoại lệ

    alt Thêm NDR Reason
        Admin->>AdminWeb: Nhập mã lý do mới
        AdminWeb->>Gateway: POST /admin/masterdata/ndr-reasons
        Gateway->>Masterdata: Tạo NDR Reason mới
        Masterdata-->>Gateway: Tạo thành công
        Masterdata->>EventBus: Publish ndr_reason.created
    else Sửa NDR Reason
        Admin->>AdminWeb: Cập nhật tên/mô tả/mức xử lý
        AdminWeb->>Gateway: PATCH /admin/masterdata/ndr-reasons/{reasonId}
        Gateway->>Masterdata: Cập nhật NDR Reason
        Masterdata-->>Gateway: Cập nhật thành công
        Masterdata->>EventBus: Publish ndr_reason.updated
    else Vô hiệu hóa NDR Reason
        Admin->>AdminWeb: Chọn vô hiệu hóa lý do
        AdminWeb->>Gateway: PATCH /admin/masterdata/ndr-reasons/{reasonId}/disable
        Gateway->>Masterdata: Đổi trạng thái lý do sang inactive
        Masterdata-->>Gateway: Vô hiệu hóa thành công
        Masterdata->>EventBus: Publish ndr_reason.disabled
    end

    EventBus-->>Delivery: Đồng bộ danh sách lý do cho flow giao thất bại
    EventBus-->>Reporting: Đồng bộ lý do để thống kê lỗi giao hàng
    Gateway-->>AdminWeb: Trả kết quả xử lý
    AdminWeb-->>Admin: Hiển thị thông báo thành công
```

---

## 8. State tài khoản người dùng

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
stateDiagram-v2
    [*] --> CREATED: Admin thêm tài khoản
    CREATED --> ACTIVE: Kích hoạt / cho phép đăng nhập
    ACTIVE --> UPDATED: Admin sửa thông tin
    UPDATED --> ACTIVE: Lưu thành công
    ACTIVE --> DISABLED: Admin khóa tài khoản
    DISABLED --> ACTIVE: Mở khóa tài khoản
    DISABLED --> [*]: Ngừng sử dụng
```

---

## 9. State dữ liệu cấu hình Hub / Zone / NDR Reason

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
stateDiagram-v2
    [*] --> DRAFT: Admin nhập dữ liệu mới
    DRAFT --> ACTIVE: Lưu và kích hoạt
    ACTIVE --> UPDATED: Sửa thông tin
    UPDATED --> ACTIVE: Lưu thành công
    ACTIVE --> INACTIVE: Vô hiệu hóa
    INACTIVE --> ACTIVE: Kích hoạt lại
    INACTIVE --> [*]: Không còn sử dụng
```

---

## 10. Mapping chức năng Admin với service xử lý

| Nhóm chức năng | Chức năng | Endpoint gợi ý | Service xử lý chính | Ghi chú |
|---|---|---|---|---|
| Quản lý tài khoản | Quản lý Merchant | `GET/POST/PATCH /admin/users` | `auth-service` | Role `MERCHANT` |
| Quản lý tài khoản | Quản lý OPS Staff | `GET/POST/PATCH /admin/users` | `auth-service` | Role `OPS_STAFF` |
| Quản lý tài khoản | Quản lý Courier | `GET/POST/PATCH /admin/users` | `auth-service` | Role `COURIER` |
| Cấu hình hệ thống | Quản lý Hub | `/admin/masterdata/hubs` | `masterdata-service` | Dữ liệu vận hành nền |
| Cấu hình hệ thống | Quản lý Zone | `/admin/masterdata/zones` | `masterdata-service` | Phục vụ tuyến, hub và tính cước |
| Cấu hình hệ thống | Quản lý phân quyền mobile/app | `/admin/permissions` | `auth-service` | Kiểm soát quyền theo role/user |
| Cấu hình hệ thống | Quản lý NDR Reason | `/admin/masterdata/ndr-reasons` | `masterdata-service` | Dùng cho giao thất bại/NDR |

---

## 11. Gợi ý nội dung đưa vào báo cáo

Nhóm chức năng Admin tập trung vào quản trị tài khoản người dùng và cấu hình dữ liệu nền của hệ thống. Admin có thể thêm, sửa hoặc khóa tài khoản Merchant, OPS Staff và Courier; đồng thời quản lý các danh mục vận hành như Hub, Zone, phân quyền chức năng và bộ mã lý do ngoại lệ giao hàng. Các thao tác quản lý tài khoản được xử lý bởi `auth-service`, trong khi dữ liệu cấu hình vận hành được xử lý bởi `masterdata-service`. Khi có thay đổi quan trọng, hệ thống có thể phát sinh domain event để các service liên quan như tracking-service, reporting-service, delivery-service hoặc pricing-service cập nhật dữ liệu tham chiếu.
