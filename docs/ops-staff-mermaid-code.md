# OPS Staff - Mermaid Sequence Diagrams

> File này dùng để mở bằng VS Code + extension **Markdown Preview Mermaid Support**.  
> Mỗi mục bên dưới là một sơ đồ Mermaid riêng, có thể chụp/copy hình để đưa vào báo cáo hoặc slide.

---

## 0. Tổng quan luồng vận hành OPS Staff

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Pickup as Pickup Service
    participant Dispatch as Dispatch Service
    participant Manifest as Manifest Service
    participant Scan as Scan Service
    participant Delivery as Delivery Service
    participant Payment as Payment Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Ops->>Gateway: Mở bàn điều phối bưu cục
    Gateway->>Shipment: Lấy danh sách đơn mới / đơn đang xử lý
    Shipment-->>Gateway: Danh sách vận đơn và current_status
    Gateway-->>Ops: Hiển thị đơn theo trạng thái

    Ops->>Gateway: Phân công pickup / delivery
    Gateway->>Dispatch: Tạo hoặc assign task cho courier
    Dispatch->>MQ: Publish task.assigned
    MQ-->>Tracking: Cập nhật timeline
    MQ-->>Reporting: Cập nhật KPI vận hành

    Ops->>Gateway: Scan inbound / outbound / handoff
    Gateway->>Scan: Ghi nhận scan event
    Scan->>MQ: Publish scan event
    MQ-->>Tracking: Cập nhật vị trí và lịch sử đơn

    Ops->>Gateway: Tạo / seal / receive manifest
    Gateway->>Manifest: Cập nhật manifest trung chuyển
    Manifest->>MQ: Publish manifest event
    MQ-->>Tracking: Cập nhật hành trình trung chuyển

    Ops->>Gateway: Xử lý NDR / return / COD
    Gateway->>Delivery: Cập nhật giao lỗi hoặc hoàn hàng
    Gateway->>Payment: Tạo hoặc duyệt quyết toán COD
    Delivery->>MQ: Publish delivery / ndr / return event
    Payment->>MQ: Publish cod.settlement event
    MQ-->>Reporting: Cập nhật báo cáo
```

---

# NHÓM 1: TIẾP NHẬN ĐƠN & ĐIỀU PHỐI LẤY HÀNG

## 3.2.4.1. Tiếp nhận đơn hàng tự động

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant Web
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Merchant->>Gateway: Tạo vận đơn từ Merchant Web
    Gateway->>Shipment: POST /merchant/shipments
    Shipment->>Shipment: Lưu shipment với trạng thái CREATED
    Shipment->>MQ: Publish shipment.created
    MQ-->>Tracking: Tạo tracking timeline ban đầu
    MQ-->>Reporting: Cập nhật số đơn mới

    Ops->>Gateway: Mở bàn điều phối bưu cục
    Gateway->>Shipment: Lấy danh sách đơn mới theo hub quản lý
    Shipment-->>Gateway: Danh sách đơn CREATED / PICKUP_REQUESTED
    Gateway-->>Ops: Hiển thị đơn cần xử lý trên bàn điều phối
```

## 3.2.4.2. Tạo đơn hàng Walk-in tại quầy

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant Pricing as Pricing Service
    participant Shipment as Shipment Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Nhập thông tin người gửi, người nhận, hàng hóa
    Gateway->>Masterdata: Lấy hub, zone, cấu hình tuyến
    Masterdata-->>Gateway: Trả dữ liệu nền hợp lệ
    Gateway->>Pricing: POST /merchant/pricing/quotes
    Pricing-->>Gateway: Trả phí vận chuyển dự kiến
    Gateway-->>Ops: Hiển thị cước phí tại quầy

    Ops->>Gateway: Xác nhận tạo đơn Walk-in
    Gateway->>Shipment: Tạo shipment Walk-in
    Shipment->>MQ: Publish shipment.created
    Gateway->>Scan: Ghi nhận hàng đã có tại bưu cục
    Scan->>MQ: Publish scan.inbound
    MQ-->>Tracking: Cập nhật timeline tạo đơn và nhập hub
    Gateway-->>Ops: In mã vận đơn / phiếu gửi
```

## 3.2.4.3. Phân công đi lấy hàng

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Pickup as Pickup Service
    participant Dispatch as Dispatch Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Chọn đơn / pickup request cần lấy hàng
    Gateway->>Pickup: Kiểm tra pickup request
    Pickup-->>Gateway: Pickup hợp lệ, chờ điều phối
    Ops->>Gateway: Chỉ định courier phụ trách tuyến pickup
    Gateway->>Dispatch: POST /ops/tasks/assign với taskType=PICKUP
    Dispatch->>Dispatch: Tạo pickup task và gán courier
    Dispatch->>MQ: Publish task.assigned
    MQ-->>Tracking: Cập nhật trạng thái PICKUP_ASSIGNED
    Gateway-->>Ops: Hiển thị đã phân công lấy hàng
    Courier-->>Gateway: Đồng bộ danh sách task được giao
    Gateway-->>Courier: Hiển thị pickup task trên mobile
```

---

# NHÓM 2: ĐÓNG BAO TRUNG CHUYỂN

## 3.2.4.4. Khởi tạo bao trung chuyển

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant Manifest as Manifest Service

    Ops->>Gateway: Chọn Hub đi và Hub đích
    Gateway->>Masterdata: Kiểm tra hub, zone, tuyến trung chuyển
    Masterdata-->>Gateway: Tuyến hợp lệ
    Ops->>Gateway: Tạo bao trung chuyển trống
    Gateway->>Manifest: Tạo manifest/bag với trạng thái OPEN
    Manifest-->>Gateway: Trả mã bao trung chuyển
    Gateway-->>Ops: Hiển thị mã bao và danh sách rỗng chờ đóng đơn
```

## 3.2.4.5. Đóng đơn lẻ vào bao tải

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Manifest as Manifest Service
    participant Scan as Scan Service
    participant Tracking as Tracking Service

    Ops->>Gateway: Quét mã bao đang mở
    Gateway->>Manifest: Kiểm tra manifest trạng thái OPEN
    Manifest-->>Gateway: Bao hợp lệ
    Ops->>Gateway: Quét mã vận đơn lẻ
    Gateway->>Shipment: Kiểm tra vận đơn có thể đóng bao
    Shipment-->>Gateway: Vận đơn hợp lệ tại hub hiện tại
    Gateway->>Manifest: Thêm vận đơn vào bao trung chuyển
    Manifest-->>Gateway: Cập nhật số lượng và trọng lượng bao
    Gateway->>Scan: Ghi nhận scan đóng bao
    Scan-->>Tracking: Cập nhật timeline: đã đóng vào bao
    Gateway-->>Ops: Hiển thị vận đơn đã nằm trong bao
```

## 3.2.4.6. Niêm phong bao tải Seal

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Manifest as Manifest Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Ops->>Gateway: Nhập mã seal nhựa niêm phong
    Gateway->>Manifest: Kiểm tra bao có danh sách vận đơn hợp lệ
    Manifest-->>Gateway: Bao có thể seal
    Ops->>Gateway: Xác nhận niêm phong bao
    Gateway->>Manifest: POST /ops/manifests/seal
    Manifest->>Manifest: Chuyển trạng thái manifest sang SEALED
    Manifest->>MQ: Publish manifest.sealed
    MQ-->>Tracking: Cập nhật trạng thái đang luân chuyển
    MQ-->>Reporting: Cập nhật số bao đã seal
    Gateway-->>Ops: Hiển thị bao đã niêm phong
```

---

# NHÓM 3: VẬN CHUYỂN XE TẢI LINEHAUL

## 3.2.4.7. Tạo niêm phong xe tải

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Masterdata as Masterdata Service
    participant Manifest as Manifest Service
    participant Tracking as Tracking Service

    Ops->>Gateway: Nhập thông tin xe tải, tài xế, tuyến đi
    Gateway->>Masterdata: Kiểm tra Hub đi, Hub đích, tuyến linehaul
    Masterdata-->>Gateway: Tuyến hợp lệ
    Ops->>Gateway: Tạo Vehicle Seal cho xe tải
    Gateway->>Manifest: Tạo vehicle seal / trip trung chuyển
    Manifest-->>Gateway: Trả mã niêm phong xe tải
    Gateway-->>Ops: Hiển thị mã xe tải và trạng thái chờ bốc hàng
    Gateway-->>Tracking: Ghi nhận mốc chuẩn bị linehaul
```

## 3.2.4.8. Quét xuất hàng lên xe tải đi

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Manifest as Manifest Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Quét mã Vehicle Seal
    Gateway->>Manifest: Kiểm tra trip đang chờ bốc hàng
    Manifest-->>Gateway: Trip hợp lệ
    loop Mỗi bao tải đã seal
        Ops->>Gateway: Quét mã bao trung chuyển
        Gateway->>Manifest: Gán bao vào xe tải
        Manifest-->>Gateway: Bao đã được load lên xe
        Gateway->>Scan: Ghi nhận scan.outbound cho bao/vận đơn
        Scan->>MQ: Publish scan.outbound
        MQ-->>Tracking: Cập nhật rời Hub đi
    end
    Ops->>Gateway: Xác nhận xe rời Hub
    Gateway->>Manifest: Chuyển trip sang IN_TRANSIT
    Gateway-->>Ops: Hiển thị xe đang luân chuyển
```

## 3.2.4.9. Quét dỡ hàng xe tải đến

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Manifest as Manifest Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Quét mã Vehicle Seal tại Hub nhận
    Gateway->>Manifest: Kiểm tra trip đang IN_TRANSIT
    Manifest-->>Gateway: Danh sách bao dự kiến trên xe
    loop Mỗi bao được dỡ xuống
        Ops->>Gateway: Quét mã bao trung chuyển
        Gateway->>Manifest: Xác nhận bao đã unload khỏi xe
        Gateway->>Scan: Ghi nhận scan.inbound tại Hub nhận
        Scan->>MQ: Publish scan.inbound
        MQ-->>Tracking: Cập nhật đã đến Hub nhận
    end
    Ops->>Gateway: Xác nhận hoàn tất dỡ hàng
    Gateway->>Manifest: Chuyển trip sang ARRIVED / UNLOADED
    Gateway-->>Ops: Hiển thị kết quả dỡ hàng và chênh lệch nếu có
```

---

# NHÓM 4: TIẾP NHẬN HÀNG ĐẾN & GỠ BAO

## 3.2.4.10. Quét nhận bao hàng đến Hub

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Manifest as Manifest Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Quét mã bao tải tại Hub đích
    Gateway->>Manifest: Kiểm tra manifest đã seal và đúng Hub đích
    Manifest-->>Gateway: Bao hợp lệ để nhận
    Gateway->>Manifest: Receive manifest tại Hub đích
    Manifest->>MQ: Publish manifest.received
    Gateway->>Scan: Ghi nhận scan.inbound cho các vận đơn trong bao
    Scan->>MQ: Publish scan.inbound
    MQ-->>Tracking: Cập nhật đã nhận bao tại Hub đích
    Gateway-->>Ops: Hiển thị bao đã được nhận an toàn
```

## 3.2.4.11. Gỡ bao và phân loại đơn lẻ

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Manifest as Manifest Service
    participant Shipment as Shipment Service
    participant Scan as Scan Service
    participant Tracking as Tracking Service

    Ops->>Gateway: Mở bao đã nhận tại Hub đích
    Gateway->>Manifest: Kiểm tra manifest RECEIVED
    Manifest-->>Gateway: Trả danh sách vận đơn trong bao
    loop Mỗi vận đơn trong bao
        Ops->>Gateway: Quét mã vận đơn lẻ khi dỡ bao
        Gateway->>Shipment: Kiểm tra tuyến phát / hub giao
        Shipment-->>Gateway: Xác định khu vực chia chọn
        Gateway->>Scan: Ghi nhận scan phân loại
        Scan-->>Tracking: Cập nhật timeline dỡ bao và phân loại
    end
    Gateway->>Manifest: Chuyển manifest sang OPENED / SORTED
    Gateway-->>Ops: Hiển thị danh sách đơn sẵn sàng phân công phát
```

---

# NHÓM 5: BÀN GIAO ĐI PHÁT

## 3.2.4.12. Phân công đi phát hàng

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Chọn danh sách vận đơn sẵn sàng đi phát
    Gateway->>Shipment: Kiểm tra trạng thái và tuyến phát
    Shipment-->>Gateway: Danh sách hợp lệ
    Ops->>Gateway: Chỉ định courier phụ trách tuyến giao
    Gateway->>Dispatch: POST /ops/tasks/assign với taskType=DELIVERY
    Dispatch->>Dispatch: Tạo delivery task
    Dispatch->>MQ: Publish task.assigned
    MQ-->>Tracking: Cập nhật DELIVERY_ASSIGNED
    Gateway-->>Ops: Hiển thị đã phân công đi phát
    Courier-->>Gateway: Đồng bộ task giao hàng
    Gateway-->>Courier: Hiển thị danh sách đơn cần giao
```

## 3.2.4.13. Quét bàn giao bưu kiện

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Ops->>Gateway: Mở màn hình bàn giao courier
    Gateway->>Dispatch: Lấy delivery task đã assign
    Dispatch-->>Gateway: Danh sách đơn cần bàn giao
    loop Mỗi bưu kiện bàn giao
        Ops->>Gateway: Quét mã vận đơn lẻ
        Gateway->>Dispatch: Xác nhận vận đơn thuộc task của courier
        Dispatch-->>Gateway: Hợp lệ
        Gateway->>Scan: Ghi nhận courier handoff scan
        Scan->>MQ: Publish scan.courier_handoff
        MQ-->>Tracking: Cập nhật OUT_FOR_DELIVERY
    end
    Gateway-->>Ops: Hoàn tất bàn giao bưu kiện
    Gateway-->>Courier: Courier thấy đơn đã sẵn sàng đi phát
```

---

# NHÓM 6: QUYẾT TOÁN COD TRONG NGÀY

## 3.2.4.14. Quyết toán tiền mặt qua QR

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff / Thủ quỹ
    actor Courier as Courier
    participant Gateway as Gateway BFF
    participant Delivery as Delivery Service
    participant Payment as Payment Service
    participant Bank as SePay QR / Bank Gateway
    participant MQ as RabbitMQ domain.events
    participant Reporting as Reporting Service

    Ops->>Gateway: Chọn courier cần quyết toán COD trong ngày
    Gateway->>Delivery: Lấy danh sách đơn delivered có COD
    Delivery-->>Gateway: Tổng hợp COD đã thu theo courier
    Gateway->>Payment: POST /ops/cod/settlements
    Payment->>Payment: Tạo COD settlement batch
    Payment->>Bank: Yêu cầu tạo QR chuyển khoản động
    Bank-->>Payment: Trả QR thanh toán
    Payment-->>Gateway: Trả số tiền COD và QR
    Gateway-->>Ops: Hiển thị QR cho courier quét thanh toán
    Courier->>Bank: Quét QR và chuyển khoản
    Bank-->>Payment: Webhook thanh toán thành công
    Payment->>MQ: Publish cod.settlement.paid
    MQ-->>Reporting: Cập nhật doanh thu COD đã quyết toán
    Gateway-->>Ops: Hiển thị batch đã thanh toán
```

## 3.2.4.15. Phê duyệt quyết toán thủ công

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Treasurer as OPS Staff / Thủ quỹ
    participant Gateway as Gateway BFF
    participant Payment as Payment Service
    participant MQ as RabbitMQ domain.events
    participant Reporting as Reporting Service

    Treasurer->>Gateway: Mở batch COD đang chờ thanh toán
    Gateway->>Payment: Lấy chi tiết settlement batch
    Payment-->>Gateway: Số tiền, courier, danh sách đơn COD
    Treasurer->>Gateway: Xác nhận đã thu tiền mặt thủ công
    Gateway->>Payment: Duyệt settlement bằng manual approval
    Payment->>Payment: Chuyển trạng thái batch sang APPROVED_MANUAL
    Payment->>MQ: Publish cod.settlement.approved
    MQ-->>Reporting: Cập nhật COD đã quyết toán thủ công
    Gateway-->>Treasurer: Hiển thị quyết toán thành công
```

---

# NHÓM 7: VẬN HÀNH NGOẠI LỆ & HỖ TRỢ

## 3.2.4.16. Tra cứu hành trình đơn Tracking

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Tracking as Tracking Service
    participant Shipment as Shipment Service
    participant Scan as Scan Service
    participant Delivery as Delivery Service

    Ops->>Gateway: Nhập mã vận đơn cần tra cứu
    Gateway->>Tracking: GET /public/tracking/:code hoặc internal tracking
    Tracking-->>Gateway: Current tracking view và timeline
    alt Cần đối chiếu dữ liệu nguồn
        Gateway->>Shipment: Lấy current_status của vận đơn
        Gateway->>Scan: Lấy scan event liên quan
        Gateway->>Delivery: Lấy attempt / POD / NDR nếu có
        Shipment-->>Gateway: Trạng thái nghiệp vụ hiện tại
        Scan-->>Gateway: Lịch sử scan
        Delivery-->>Gateway: Kết quả giao hàng / NDR
    end
    Gateway-->>Ops: Hiển thị hành trình, vị trí, trạng thái thực tế
```

## 3.2.4.17. Xử lý đơn giao lỗi NDR

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Courier as Courier Mobile
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Delivery as Delivery Service
    participant Dispatch as Dispatch Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service

    Courier->>Gateway: Báo giao thất bại và nhập lý do
    Gateway->>Delivery: POST /courier/deliveries/fail
    Delivery->>Delivery: Ghi nhận delivery failed attempt
    Delivery->>MQ: Publish delivery.failed
    Delivery->>MQ: Publish ndr.created
    MQ-->>Tracking: Cập nhật DELIVERY_FAILED và NDR_CREATED

    Ops->>Gateway: Mở danh sách NDR cần xử lý
    Gateway->>Delivery: Lấy chi tiết NDR case
    Delivery-->>Gateway: Lý do thất bại và thông tin liên hệ
    Ops->>Gateway: Chọn giao lại hoặc chuyển hoàn
    alt Giao lại
        Gateway->>Dispatch: Tạo lại delivery task cho courier
        Dispatch->>MQ: Publish task.assigned với taskType=DELIVERY
        MQ-->>Tracking: Cập nhật trạng thái chờ giao lại
    else Chuyển hoàn
        Gateway->>Delivery: Kích hoạt return flow
        Delivery->>MQ: Publish return.started
        MQ-->>Tracking: Cập nhật RETURN_STARTED
    end
    Gateway-->>Ops: Hiển thị kết quả xử lý NDR
```

## 3.2.4.18. Quản lý quy trình hoàn hàng

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280', 'actorBkg': '#FDF2FF', 'actorBorder': '#D946EF', 'actorTextColor': '#111827', 'signalColor': '#374151', 'signalTextColor': '#374151', 'noteBkgColor': '#FFF7ED', 'noteTextColor': '#7C2D12' }}}%%
sequenceDiagram
    autonumber
    actor Courier as Courier Mobile
    actor Ops as OPS Staff
    participant Gateway as Gateway BFF
    participant Delivery as Delivery Service
    participant Scan as Scan Service
    participant MQ as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Ops->>Gateway: Xác nhận đơn cần hoàn hàng về kho xuất phát
    Gateway->>Delivery: Kích hoạt return flow nếu chưa có
    Delivery->>MQ: Publish return.started
    MQ-->>Tracking: Cập nhật RETURN_STARTED

    Courier->>Gateway: Mang hàng hoàn về bưu cục / kho xuất phát
    Ops->>Gateway: Quét mã vận đơn hoàn trả
    Gateway->>Scan: Ghi nhận scan return inbound
    Scan->>MQ: Publish scan.inbound với return context
    Gateway->>Delivery: Xác nhận Return Completed
    Delivery->>Delivery: Chuyển trạng thái hoàn tất hoàn hàng
    Delivery->>MQ: Publish return.completed
    MQ-->>Tracking: Cập nhật RETURN_COMPLETED
    MQ-->>Reporting: Cập nhật KPI hoàn hàng
    Gateway-->>Ops: Hiển thị đơn hoàn hàng đã hoàn tất
```

---

# Phụ lục: State tổng quát của vận đơn cho OPS

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#2196F3",
    "lineColor": "#1976D2",
    "actorBkg": "#E3F2FD",
    "actorBorder": "#2196F3",
    "actorTextColor": "#0D47A1",
    "activationBkgColor": "#BBDEFB",
    "activationBorderColor": "#1976D2",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'mainBkg': '#ffffff', 'primaryColor': '#EAF7FF', 'primaryBorderColor': '#4DB6E2', 'primaryTextColor': '#1F2937', 'lineColor': '#6B7280' }}}%%
stateDiagram-v2
    [*] --> CREATED
    CREATED --> PICKUP_REQUESTED
    PICKUP_REQUESTED --> PICKUP_ASSIGNED
    PICKUP_ASSIGNED --> PICKED_UP
    CREATED --> INBOUND_AT_HUB: Walk-in tại quầy
    PICKED_UP --> INBOUND_AT_HUB
    INBOUND_AT_HUB --> READY_FOR_MANIFEST
    READY_FOR_MANIFEST --> MANIFEST_SEALED
    MANIFEST_SEALED --> OUTBOUND_FROM_HUB
    OUTBOUND_FROM_HUB --> INBOUND_AT_DEST_HUB
    INBOUND_AT_DEST_HUB --> MANIFEST_RECEIVED
    MANIFEST_RECEIVED --> SORTED_FOR_DELIVERY
    SORTED_FOR_DELIVERY --> DELIVERY_ASSIGNED
    DELIVERY_ASSIGNED --> OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY --> DELIVERED
    OUT_FOR_DELIVERY --> DELIVERY_FAILED
    DELIVERY_FAILED --> NDR_CREATED
    NDR_CREATED --> DELIVERY_ASSIGNED: Giao lại
    NDR_CREATED --> RETURN_STARTED: Chuyển hoàn
    RETURN_STARTED --> RETURN_COMPLETED
    DELIVERED --> [*]
    RETURN_COMPLETED --> [*]
```
