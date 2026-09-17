# Admin Mermaid Sequence Diagrams - Nexus Express System

> File này tách riêng từng thao tác **Thêm / Sửa / Khóa / Vô hiệu hóa** thành từng sequence diagram riêng, theo yêu cầu chỉnh sửa cho nhóm chức năng Admin.

---

## Mermaid theme xanh dương dùng chung

> Mỗi sơ đồ bên dưới đã nhúng sẵn theme này ngay trong block Mermaid.

---

# 0. Tổng quan nhóm chức năng Admin

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#1565C0",
    "signalTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1565C0",
    "labelBoxBkgColor": "#E3F2FD",
    "labelBoxBorderColor": "#1565C0",
    "labelTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Truy cập màn hình quản trị
    AdminWeb->>Gateway: Gửi yêu cầu theo nhóm chức năng
    alt Quản lý tài khoản
        Gateway->>Auth: Xử lý user, role, trạng thái tài khoản
        Auth-->>Gateway: Trả kết quả xử lý tài khoản
    else Cấu hình hệ thống
        Gateway->>Masterdata: Xử lý hub, zone, NDR reason, app permission
        Masterdata-->>Gateway: Trả kết quả xử lý cấu hình
    end
    Gateway-->>AdminWeb: Trả dữ liệu hiển thị
    AdminWeb-->>Admin: Hiển thị kết quả thao tác
    Auth-->>EventBus: Publish user/config related event nếu cần
    Masterdata-->>EventBus: Publish masterdata changed event nếu cần
    EventBus-->>Tracking: Đồng bộ dữ liệu tra cứu nếu liên quan
    EventBus-->>Reporting: Cập nhật dữ liệu báo cáo nếu liên quan
```

---

# 1. Quản lý tài khoản người gửi Merchant

## 1.1 Thêm tài khoản Merchant

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý tài khoản Merchant
    AdminWeb->>Gateway: Lấy danh sách Merchant hiện có
    Gateway->>Auth: GET /admin/users?role=MERCHANT
    Auth->>AuthDB: Truy vấn danh sách tài khoản Merchant
    AuthDB-->>Auth: Trả danh sách Merchant
    Auth-->>Gateway: Trả danh sách Merchant
    Gateway-->>AdminWeb: Hiển thị danh sách Merchant

    Admin->>AdminWeb: Nhập thông tin Merchant mới
    AdminWeb->>Gateway: Gửi yêu cầu thêm tài khoản Merchant
    Gateway->>Auth: POST /admin/users role=MERCHANT
    Auth->>AuthDB: Kiểm tra trùng email/số điện thoại
    AuthDB-->>Auth: Không trùng dữ liệu
    Auth->>AuthDB: Tạo tài khoản Merchant trạng thái ACTIVE
    AuthDB-->>Auth: Tạo tài khoản thành công
    Auth-->>EventBus: Publish user.created role=MERCHANT
    Auth-->>Gateway: Trả kết quả tạo tài khoản
    Gateway-->>AdminWeb: Thông báo thêm tài khoản thành công
    AdminWeb-->>Admin: Hiển thị Merchant mới trong danh sách
```

## 1.2 Sửa thông tin tài khoản Merchant

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn tài khoản Merchant cần sửa
    AdminWeb->>Gateway: Lấy chi tiết tài khoản Merchant
    Gateway->>Auth: GET /admin/users/{userId}
    Auth->>AuthDB: Truy vấn chi tiết tài khoản
    AuthDB-->>Auth: Trả thông tin tài khoản
    Auth-->>Gateway: Trả chi tiết tài khoản
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa

    Admin->>AdminWeb: Cập nhật thông tin Merchant
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật tài khoản
    Gateway->>Auth: PATCH /admin/users/{userId}
    Auth->>AuthDB: Kiểm tra quyền và dữ liệu cập nhật
    Auth->>AuthDB: Lưu thông tin mới
    AuthDB-->>Auth: Cập nhật thành công
    Auth-->>EventBus: Publish user.updated role=MERCHANT
    Auth-->>Gateway: Trả kết quả cập nhật
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị thông tin mới
```

## 1.3 Khóa tài khoản Merchant

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn khóa tài khoản Merchant
    AdminWeb-->>Admin: Hiển thị hộp thoại xác nhận khóa
    Admin->>AdminWeb: Xác nhận khóa tài khoản
    AdminWeb->>Gateway: Gửi yêu cầu khóa tài khoản
    Gateway->>Auth: PATCH /admin/users/{userId}/lock
    Auth->>AuthDB: Kiểm tra tài khoản tồn tại và còn hoạt động
    AuthDB-->>Auth: Tài khoản hợp lệ
    Auth->>AuthDB: Cập nhật trạng thái LOCKED
    AuthDB-->>Auth: Khóa tài khoản thành công
    Auth-->>EventBus: Publish user.locked role=MERCHANT
    Auth-->>Gateway: Trả kết quả khóa tài khoản
    Gateway-->>AdminWeb: Thông báo khóa tài khoản thành công
    AdminWeb-->>Admin: Hiển thị trạng thái LOCKED
```

---

# 2. Quản lý tài khoản nhân viên vận hành OPS Staff

## 2.1 Thêm tài khoản OPS Staff

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình thêm OPS Staff
    AdminWeb->>Gateway: Lấy danh sách hub/zone để gán nhân viên
    Gateway->>Masterdata: GET /ops/masterdata/hubs
    Masterdata-->>Gateway: Trả danh sách hub/zone
    Gateway-->>AdminWeb: Hiển thị dữ liệu hub/zone

    Admin->>AdminWeb: Nhập thông tin OPS Staff và hub phụ trách
    AdminWeb->>Gateway: Gửi yêu cầu thêm tài khoản OPS
    Gateway->>Auth: POST /admin/users role=OPS_STAFF
    Auth->>AuthDB: Kiểm tra trùng thông tin đăng nhập
    AuthDB-->>Auth: Không trùng dữ liệu
    Auth->>AuthDB: Tạo tài khoản OPS Staff trạng thái ACTIVE
    AuthDB-->>Auth: Tạo tài khoản thành công
    Auth-->>EventBus: Publish user.created role=OPS_STAFF
    Auth-->>Gateway: Trả kết quả tạo tài khoản
    Gateway-->>AdminWeb: Thông báo thêm OPS Staff thành công
    AdminWeb-->>Admin: Hiển thị tài khoản mới
```

## 2.2 Sửa thông tin tài khoản OPS Staff

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn OPS Staff cần sửa
    AdminWeb->>Gateway: Lấy chi tiết OPS Staff
    Gateway->>Auth: GET /admin/users/{userId}
    Auth->>AuthDB: Truy vấn thông tin tài khoản
    AuthDB-->>Auth: Trả thông tin tài khoản
    Auth-->>Gateway: Trả chi tiết tài khoản
    Gateway->>Masterdata: Lấy danh sách hub/zone hiện có
    Masterdata-->>Gateway: Trả danh sách hub/zone
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa

    Admin->>AdminWeb: Cập nhật thông tin hoặc hub phụ trách
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật OPS Staff
    Gateway->>Auth: PATCH /admin/users/{userId}
    Auth->>AuthDB: Lưu thông tin mới
    AuthDB-->>Auth: Cập nhật thành công
    Auth-->>EventBus: Publish user.updated role=OPS_STAFF
    Auth-->>Gateway: Trả kết quả cập nhật
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị thông tin mới
```

## 2.3 Khóa tài khoản OPS Staff

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn khóa tài khoản OPS Staff
    AdminWeb-->>Admin: Hiển thị xác nhận khóa tài khoản
    Admin->>AdminWeb: Xác nhận khóa
    AdminWeb->>Gateway: Gửi yêu cầu khóa OPS Staff
    Gateway->>Auth: PATCH /admin/users/{userId}/lock
    Auth->>AuthDB: Kiểm tra tài khoản OPS Staff
    AuthDB-->>Auth: Tài khoản hợp lệ
    Auth->>AuthDB: Cập nhật trạng thái LOCKED
    AuthDB-->>Auth: Khóa tài khoản thành công
    Auth-->>EventBus: Publish user.locked role=OPS_STAFF
    Auth-->>Gateway: Trả kết quả khóa
    Gateway-->>AdminWeb: Thông báo khóa thành công
    AdminWeb-->>Admin: Hiển thị trạng thái LOCKED
```

---

# 3. Quản lý tài khoản nhân viên giao nhận Courier

## 3.1 Thêm tài khoản Courier

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình thêm Courier
    AdminWeb->>Gateway: Lấy hub/zone/tuyến giao hàng
    Gateway->>Masterdata: GET /ops/masterdata/hubs
    Masterdata-->>Gateway: Trả dữ liệu hub/zone
    Gateway-->>AdminWeb: Hiển thị dữ liệu gán tuyến

    Admin->>AdminWeb: Nhập thông tin Courier
    AdminWeb->>Gateway: Gửi yêu cầu thêm tài khoản Courier
    Gateway->>Auth: POST /admin/users role=COURIER
    Auth->>AuthDB: Kiểm tra trùng thông tin đăng nhập
    AuthDB-->>Auth: Không trùng dữ liệu
    Auth->>AuthDB: Tạo tài khoản Courier trạng thái ACTIVE
    AuthDB-->>Auth: Tạo tài khoản thành công
    Auth-->>EventBus: Publish user.created role=COURIER
    Auth-->>Gateway: Trả kết quả tạo tài khoản
    Gateway-->>AdminWeb: Thông báo thêm Courier thành công
    AdminWeb-->>Admin: Hiển thị Courier mới
```

## 3.2 Sửa thông tin tài khoản Courier

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant Masterdata as Masterdata Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn Courier cần sửa
    AdminWeb->>Gateway: Lấy chi tiết Courier
    Gateway->>Auth: GET /admin/users/{userId}
    Auth->>AuthDB: Truy vấn thông tin Courier
    AuthDB-->>Auth: Trả thông tin Courier
    Auth-->>Gateway: Trả chi tiết Courier
    Gateway->>Masterdata: Lấy hub/zone/tuyến hiện có
    Masterdata-->>Gateway: Trả danh sách cấu hình tuyến
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa

    Admin->>AdminWeb: Cập nhật thông tin Courier
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật Courier
    Gateway->>Auth: PATCH /admin/users/{userId}
    Auth->>AuthDB: Lưu thông tin mới
    AuthDB-->>Auth: Cập nhật thành công
    Auth-->>EventBus: Publish user.updated role=COURIER
    Auth-->>Gateway: Trả kết quả cập nhật
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị thông tin mới
```

## 3.3 Khóa tài khoản Courier

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn khóa tài khoản Courier
    AdminWeb-->>Admin: Hiển thị xác nhận khóa tài khoản
    Admin->>AdminWeb: Xác nhận khóa
    AdminWeb->>Gateway: Gửi yêu cầu khóa Courier
    Gateway->>Auth: PATCH /admin/users/{userId}/lock
    Auth->>AuthDB: Kiểm tra Courier tồn tại và còn hoạt động
    AuthDB-->>Auth: Tài khoản hợp lệ
    Auth->>AuthDB: Cập nhật trạng thái LOCKED
    AuthDB-->>Auth: Khóa tài khoản thành công
    Auth-->>EventBus: Publish user.locked role=COURIER
    Auth-->>Gateway: Trả kết quả khóa
    Gateway-->>AdminWeb: Thông báo khóa thành công
    AdminWeb-->>Admin: Hiển thị trạng thái LOCKED
```

---

# 4. Quản lý Hub

## 4.1 Thêm Hub

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý Hub
    AdminWeb->>Gateway: Lấy danh sách Hub hiện có
    Gateway->>Masterdata: GET /ops/masterdata/hubs
    Masterdata->>MasterDB: Truy vấn danh sách Hub
    MasterDB-->>Masterdata: Trả danh sách Hub
    Masterdata-->>Gateway: Trả danh sách Hub
    Gateway-->>AdminWeb: Hiển thị danh sách Hub

    Admin->>AdminWeb: Nhập thông tin Hub mới
    AdminWeb->>Gateway: Gửi yêu cầu thêm Hub
    Gateway->>Masterdata: POST /admin/masterdata/hubs
    Masterdata->>MasterDB: Kiểm tra mã Hub trùng lặp
    MasterDB-->>Masterdata: Không trùng mã Hub
    Masterdata->>MasterDB: Tạo Hub trạng thái ACTIVE
    MasterDB-->>Masterdata: Tạo Hub thành công
    Masterdata-->>EventBus: Publish hub.created
    Masterdata-->>Gateway: Trả kết quả tạo Hub
    Gateway-->>AdminWeb: Thông báo thêm Hub thành công
    AdminWeb-->>Admin: Hiển thị Hub mới
```

## 4.2 Sửa Hub

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn Hub cần sửa
    AdminWeb->>Gateway: Lấy chi tiết Hub
    Gateway->>Masterdata: GET /admin/masterdata/hubs/{hubId}
    Masterdata->>MasterDB: Truy vấn chi tiết Hub
    MasterDB-->>Masterdata: Trả thông tin Hub
    Masterdata-->>Gateway: Trả chi tiết Hub
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa Hub

    Admin->>AdminWeb: Cập nhật tên, địa chỉ, khu vực hoặc cấu hình Hub
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật Hub
    Gateway->>Masterdata: PATCH /admin/masterdata/hubs/{hubId}
    Masterdata->>MasterDB: Kiểm tra dữ liệu cập nhật
    Masterdata->>MasterDB: Lưu thông tin Hub mới
    MasterDB-->>Masterdata: Cập nhật Hub thành công
    Masterdata-->>EventBus: Publish hub.updated
    Masterdata-->>Gateway: Trả kết quả cập nhật Hub
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị thông tin Hub mới
```

## 4.3 Vô hiệu hóa Hub

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn vô hiệu hóa Hub
    AdminWeb-->>Admin: Hiển thị cảnh báo ảnh hưởng vận hành
    Admin->>AdminWeb: Xác nhận vô hiệu hóa Hub
    AdminWeb->>Gateway: Gửi yêu cầu vô hiệu hóa Hub
    Gateway->>Masterdata: PATCH /admin/masterdata/hubs/{hubId}/disable
    Masterdata->>MasterDB: Kiểm tra Hub còn đang được sử dụng
    MasterDB-->>Masterdata: Hub hợp lệ để vô hiệu hóa
    Masterdata->>MasterDB: Cập nhật trạng thái DISABLED
    MasterDB-->>Masterdata: Vô hiệu hóa Hub thành công
    Masterdata-->>EventBus: Publish hub.disabled
    Masterdata-->>Gateway: Trả kết quả vô hiệu hóa
    Gateway-->>AdminWeb: Thông báo vô hiệu hóa thành công
    AdminWeb-->>Admin: Hiển thị trạng thái DISABLED
```

---

# 5. Quản lý Zone

## 5.1 Thêm Zone

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý Zone
    AdminWeb->>Gateway: Lấy danh sách Zone hiện có
    Gateway->>Masterdata: GET /admin/masterdata/zones
    Masterdata->>MasterDB: Truy vấn danh sách Zone
    MasterDB-->>Masterdata: Trả danh sách Zone
    Masterdata-->>Gateway: Trả danh sách Zone
    Gateway-->>AdminWeb: Hiển thị danh sách Zone

    Admin->>AdminWeb: Nhập thông tin Zone mới
    AdminWeb->>Gateway: Gửi yêu cầu thêm Zone
    Gateway->>Masterdata: POST /admin/masterdata/zones
    Masterdata->>MasterDB: Kiểm tra mã Zone trùng lặp
    MasterDB-->>Masterdata: Không trùng mã Zone
    Masterdata->>MasterDB: Tạo Zone trạng thái ACTIVE
    MasterDB-->>Masterdata: Tạo Zone thành công
    Masterdata-->>EventBus: Publish zone.created
    Masterdata-->>Gateway: Trả kết quả tạo Zone
    Gateway-->>AdminWeb: Thông báo thêm Zone thành công
    AdminWeb-->>Admin: Hiển thị Zone mới
```

## 5.2 Sửa Zone

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn Zone cần sửa
    AdminWeb->>Gateway: Lấy chi tiết Zone
    Gateway->>Masterdata: GET /admin/masterdata/zones/{zoneId}
    Masterdata->>MasterDB: Truy vấn chi tiết Zone
    MasterDB-->>Masterdata: Trả thông tin Zone
    Masterdata-->>Gateway: Trả chi tiết Zone
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa Zone

    Admin->>AdminWeb: Cập nhật tên, phạm vi hoặc cấu hình Zone
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật Zone
    Gateway->>Masterdata: PATCH /admin/masterdata/zones/{zoneId}
    Masterdata->>MasterDB: Kiểm tra dữ liệu cập nhật
    Masterdata->>MasterDB: Lưu thông tin Zone mới
    MasterDB-->>Masterdata: Cập nhật Zone thành công
    Masterdata-->>EventBus: Publish zone.updated
    Masterdata-->>Gateway: Trả kết quả cập nhật Zone
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị thông tin Zone mới
```

## 5.3 Vô hiệu hóa Zone

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn vô hiệu hóa Zone
    AdminWeb-->>Admin: Hiển thị cảnh báo ảnh hưởng cấu hình tuyến
    Admin->>AdminWeb: Xác nhận vô hiệu hóa Zone
    AdminWeb->>Gateway: Gửi yêu cầu vô hiệu hóa Zone
    Gateway->>Masterdata: PATCH /admin/masterdata/zones/{zoneId}/disable
    Masterdata->>MasterDB: Kiểm tra Zone còn được sử dụng
    MasterDB-->>Masterdata: Zone hợp lệ để vô hiệu hóa
    Masterdata->>MasterDB: Cập nhật trạng thái DISABLED
    MasterDB-->>Masterdata: Vô hiệu hóa Zone thành công
    Masterdata-->>EventBus: Publish zone.disabled
    Masterdata-->>Gateway: Trả kết quả vô hiệu hóa
    Gateway-->>AdminWeb: Thông báo vô hiệu hóa thành công
    AdminWeb-->>Admin: Hiển thị trạng thái DISABLED
```

---

# 6. Quản lý phân quyền chức năng app mobile cho OPS/Courier

## 6.1 Thêm cấu hình phân quyền app mobile

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình phân quyền app mobile
    AdminWeb->>Gateway: Lấy danh sách vai trò OPS/Courier và quyền hiện có
    Gateway->>Auth: GET /admin/permissions/mobile
    Auth->>AuthDB: Truy vấn quyền app mobile
    AuthDB-->>Auth: Trả danh sách quyền
    Auth-->>Gateway: Trả dữ liệu phân quyền
    Gateway-->>AdminWeb: Hiển thị ma trận phân quyền

    Admin->>AdminWeb: Thêm cấu hình quyền mới cho role/chức năng
    AdminWeb->>Gateway: Gửi yêu cầu thêm quyền
    Gateway->>Auth: POST /admin/permissions/mobile
    Auth->>AuthDB: Kiểm tra quyền trùng lặp
    AuthDB-->>Auth: Không trùng quyền
    Auth->>AuthDB: Tạo cấu hình quyền mới
    AuthDB-->>Auth: Tạo quyền thành công
    Auth-->>EventBus: Publish permission.created
    Auth-->>Gateway: Trả kết quả thêm quyền
    Gateway-->>AdminWeb: Thông báo thêm quyền thành công
    AdminWeb-->>Admin: Hiển thị quyền mới trong ma trận
```

## 6.2 Sửa cấu hình phân quyền app mobile

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn cấu hình quyền cần sửa
    AdminWeb->>Gateway: Lấy chi tiết quyền
    Gateway->>Auth: GET /admin/permissions/mobile/{permissionId}
    Auth->>AuthDB: Truy vấn chi tiết quyền
    AuthDB-->>Auth: Trả thông tin quyền
    Auth-->>Gateway: Trả chi tiết quyền
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa quyền

    Admin->>AdminWeb: Cập nhật quyền bật/tắt chức năng
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật quyền
    Gateway->>Auth: PATCH /admin/permissions/mobile/{permissionId}
    Auth->>AuthDB: Lưu cấu hình quyền mới
    AuthDB-->>Auth: Cập nhật quyền thành công
    Auth-->>EventBus: Publish permission.updated
    Auth-->>Gateway: Trả kết quả cập nhật quyền
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị ma trận quyền mới
```

## 6.3 Vô hiệu hóa cấu hình phân quyền app mobile

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Auth as Auth Service
    participant AuthDB as Auth DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn vô hiệu hóa một quyền app mobile
    AdminWeb-->>Admin: Hiển thị xác nhận vô hiệu hóa quyền
    Admin->>AdminWeb: Xác nhận vô hiệu hóa
    AdminWeb->>Gateway: Gửi yêu cầu vô hiệu hóa quyền
    Gateway->>Auth: PATCH /admin/permissions/mobile/{permissionId}/disable
    Auth->>AuthDB: Kiểm tra quyền đang tồn tại
    AuthDB-->>Auth: Quyền hợp lệ
    Auth->>AuthDB: Cập nhật trạng thái DISABLED
    AuthDB-->>Auth: Vô hiệu hóa quyền thành công
    Auth-->>EventBus: Publish permission.disabled
    Auth-->>Gateway: Trả kết quả vô hiệu hóa
    Gateway-->>AdminWeb: Thông báo vô hiệu hóa thành công
    AdminWeb-->>Admin: Hiển thị quyền đã bị vô hiệu hóa
```

---

# 7. Quản lý bộ mã lý do ngoại lệ giao hàng NDR Reason

## 7.1 Thêm NDR Reason

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Mở màn hình quản lý NDR Reason
    AdminWeb->>Gateway: Lấy danh sách lý do ngoại lệ
    Gateway->>Masterdata: GET /admin/masterdata/ndr-reasons
    Masterdata->>MasterDB: Truy vấn danh sách NDR Reason
    MasterDB-->>Masterdata: Trả danh sách NDR Reason
    Masterdata-->>Gateway: Trả danh sách lý do
    Gateway-->>AdminWeb: Hiển thị danh sách lý do ngoại lệ

    Admin->>AdminWeb: Nhập mã và mô tả lý do mới
    AdminWeb->>Gateway: Gửi yêu cầu thêm NDR Reason
    Gateway->>Masterdata: POST /admin/masterdata/ndr-reasons
    Masterdata->>MasterDB: Kiểm tra mã lý do trùng lặp
    MasterDB-->>Masterdata: Không trùng mã lý do
    Masterdata->>MasterDB: Tạo NDR Reason trạng thái ACTIVE
    MasterDB-->>Masterdata: Tạo lý do thành công
    Masterdata-->>EventBus: Publish ndr_reason.created
    Masterdata-->>Gateway: Trả kết quả tạo lý do
    Gateway-->>AdminWeb: Thông báo thêm lý do thành công
    AdminWeb-->>Admin: Hiển thị lý do mới
```

## 7.2 Sửa NDR Reason

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn NDR Reason cần sửa
    AdminWeb->>Gateway: Lấy chi tiết NDR Reason
    Gateway->>Masterdata: GET /admin/masterdata/ndr-reasons/{reasonId}
    Masterdata->>MasterDB: Truy vấn chi tiết lý do
    MasterDB-->>Masterdata: Trả thông tin lý do
    Masterdata-->>Gateway: Trả chi tiết lý do
    Gateway-->>AdminWeb: Hiển thị form chỉnh sửa lý do

    Admin->>AdminWeb: Cập nhật tên, mô tả hoặc loại xử lý
    AdminWeb->>Gateway: Gửi yêu cầu cập nhật NDR Reason
    Gateway->>Masterdata: PATCH /admin/masterdata/ndr-reasons/{reasonId}
    Masterdata->>MasterDB: Kiểm tra dữ liệu cập nhật
    Masterdata->>MasterDB: Lưu thông tin lý do mới
    MasterDB-->>Masterdata: Cập nhật lý do thành công
    Masterdata-->>EventBus: Publish ndr_reason.updated
    Masterdata-->>Gateway: Trả kết quả cập nhật lý do
    Gateway-->>AdminWeb: Thông báo cập nhật thành công
    AdminWeb-->>Admin: Hiển thị lý do mới
```

## 7.3 Vô hiệu hóa NDR Reason

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","actorBkg":"#E3F2FD","actorBorder":"#1565C0","actorTextColor":"#0D47A1","actorLineColor":"#1565C0","signalColor":"#1565C0","signalTextColor":"#0D47A1","activationBkgColor":"#BBDEFB","activationBorderColor":"#1565C0","labelBoxBkgColor":"#E3F2FD","labelBoxBorderColor":"#1565C0","labelTextColor":"#0D47A1"}}}%%
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant AdminWeb as Admin Web
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant MasterDB as Masterdata DB
    participant EventBus as RabbitMQ domain.events

    Admin->>AdminWeb: Chọn vô hiệu hóa NDR Reason
    AdminWeb-->>Admin: Hiển thị xác nhận vô hiệu hóa lý do
    Admin->>AdminWeb: Xác nhận vô hiệu hóa
    AdminWeb->>Gateway: Gửi yêu cầu vô hiệu hóa NDR Reason
    Gateway->>Masterdata: PATCH /admin/masterdata/ndr-reasons/{reasonId}/disable
    Masterdata->>MasterDB: Kiểm tra lý do đang tồn tại
    MasterDB-->>Masterdata: Lý do hợp lệ
    Masterdata->>MasterDB: Cập nhật trạng thái DISABLED
    MasterDB-->>Masterdata: Vô hiệu hóa lý do thành công
    Masterdata-->>EventBus: Publish ndr_reason.disabled
    Masterdata-->>Gateway: Trả kết quả vô hiệu hóa
    Gateway-->>AdminWeb: Thông báo vô hiệu hóa thành công
    AdminWeb-->>Admin: Hiển thị trạng thái DISABLED
```

---

# 8. State tài khoản người dùng

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","primaryColor":"#E3F2FD","primaryTextColor":"#0D47A1","primaryBorderColor":"#1565C0","lineColor":"#1565C0","secondaryColor":"#BBDEFB","tertiaryColor":"#EAF4FF"}}}%%
stateDiagram-v2
    [*] --> ACTIVE: Admin thêm tài khoản
    ACTIVE --> LOCKED: Admin khóa tài khoản
    LOCKED --> ACTIVE: Admin mở khóa nếu có chức năng
    ACTIVE --> UPDATED: Admin sửa thông tin
    UPDATED --> ACTIVE: Lưu thành công
```

---

# 9. State dữ liệu cấu hình hệ thống

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","primaryColor":"#E3F2FD","primaryTextColor":"#0D47A1","primaryBorderColor":"#1565C0","lineColor":"#1565C0","secondaryColor":"#BBDEFB","tertiaryColor":"#EAF4FF"}}}%%
stateDiagram-v2
    [*] --> ACTIVE: Admin thêm dữ liệu cấu hình
    ACTIVE --> UPDATED: Admin sửa thông tin
    UPDATED --> ACTIVE: Lưu thành công
    ACTIVE --> DISABLED: Admin vô hiệu hóa
    DISABLED --> ACTIVE: Admin kích hoạt lại nếu có chức năng
```

