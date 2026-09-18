# Mermaid Diagrams - Nhóm chức năng Merchant (Người gửi / Shop)

> File này dùng để mở trong VS Code bằng Markdown Preview Mermaid Support.
> Mỗi sơ đồ Mermaid đã được cấu hình màu xanh dương để dễ nhìn khi chụp hình đưa vào báo cáo.

---

## 0. Tổng quan luồng vận hành Merchant

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
    "labelTextColor": "#0D47A1",
    "loopTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Pricing as Pricing Service
    participant Shipment as Shipment Service
    participant Pickup as Pickup Service
    participant Delivery as Delivery Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Đăng nhập và mở trang quản lý
    Web->>Gateway: Gửi yêu cầu lấy dữ liệu dashboard
    Gateway->>Reporting: Lấy số liệu tổng quan đơn hàng
    Reporting-->>Gateway: Trả số liệu dashboard
    Gateway-->>Web: Hiển thị dashboard

    Merchant->>Web: Tạo / cập nhật / hủy đơn hàng
    Web->>Gateway: Gửi request quản lý shipment
    Gateway->>Pricing: Tính cước nếu cần
    Pricing-->>Gateway: Trả phí vận chuyển
    Gateway->>Shipment: Tạo hoặc cập nhật shipment
    Shipment-->>MQ: Publish shipment event
    MQ-->>Tracking: Cập nhật timeline vận đơn
    MQ-->>Reporting: Cập nhật KPI / dashboard
    Shipment-->>Gateway: Trả kết quả xử lý đơn
    Gateway-->>Web: Hiển thị trạng thái mới

    Merchant->>Web: Tạo / cập nhật / hủy yêu cầu lấy hàng
    Web->>Gateway: Gửi request pickup
    Gateway->>Pickup: Xử lý pickup request
    Pickup-->>MQ: Publish pickup event
    MQ-->>Tracking: Cập nhật timeline pickup
    MQ-->>Reporting: Cập nhật thống kê pickup
    Pickup-->>Gateway: Trả kết quả pickup
    Gateway-->>Web: Hiển thị yêu cầu lấy hàng

    Merchant->>Web: Theo dõi đơn / in nhãn / yêu cầu hoàn
    Web->>Gateway: Gửi request tương ứng
    Gateway->>Tracking: Lấy timeline hoặc trạng thái đơn
    Tracking-->>Gateway: Trả thông tin tracking
    Gateway-->>Web: Hiển thị kết quả cho Merchant
```

---

## 3.5.2.1.1 Tạo đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Pricing as Pricing Service
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Nhập thông tin người nhận, hàng hóa, COD
    Web->>Gateway: POST /merchant/pricing/quotes
    Gateway->>Pricing: Tính phí vận chuyển
    Pricing-->>Gateway: Trả phí dự kiến
    Gateway-->>Web: Hiển thị phí cho Merchant xác nhận

    Merchant->>Web: Xác nhận tạo đơn hàng
    Web->>Gateway: POST /merchant/shipments
    Gateway->>Shipment: Tạo shipment mới
    Shipment-->>MQ: Publish shipment.created
    MQ-->>Tracking: Tạo timeline ban đầu
    MQ-->>Reporting: Cập nhật thống kê đơn mới
    Shipment-->>Gateway: Trả mã vận đơn và trạng thái CREATED
    Gateway-->>Web: Hiển thị tạo đơn thành công
```

---

## 3.5.2.1.2 Cập nhật đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Chọn đơn hàng cần cập nhật
    Web->>Gateway: GET /merchant/shipments/:code
    Gateway->>Shipment: Lấy chi tiết đơn hàng
    Shipment-->>Gateway: Trả thông tin đơn hàng
    Gateway-->>Web: Hiển thị form cập nhật

    Merchant->>Web: Sửa thông tin người nhận / hàng hóa / ghi chú
    Web->>Gateway: PUT /merchant/shipments/:code
    Gateway->>Shipment: Kiểm tra trạng thái và cập nhật đơn
    alt Đơn còn được phép cập nhật
        Shipment-->>MQ: Publish shipment.updated
        MQ-->>Tracking: Ghi nhận thay đổi thông tin đơn
        Shipment-->>Gateway: Cập nhật thành công
        Gateway-->>Web: Hiển thị thông tin mới
    else Đơn đã qua giai đoạn cho phép sửa
        Shipment-->>Gateway: Từ chối cập nhật
        Gateway-->>Web: Thông báo không thể cập nhật đơn
    end
```

---

## 3.5.2.1.3 Theo dõi đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service

    Merchant->>Web: Mở chi tiết vận đơn
    Web->>Gateway: GET /merchant/shipments/:code
    Gateway->>Shipment: Lấy thông tin vận đơn
    Shipment-->>Gateway: Trả current_status và thông tin đơn

    Web->>Gateway: GET /merchant/tracking/:code
    Gateway->>Tracking: Lấy timeline vận đơn
    Tracking-->>Gateway: Trả lịch sử trạng thái và vị trí
    Gateway-->>Web: Hiển thị thông tin đơn và hành trình
    Web-->>Merchant: Merchant theo dõi tiến trình giao hàng
```

---

## 3.5.2.1.4 Tìm kiếm đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service

    Merchant->>Web: Nhập mã vận đơn / SĐT / trạng thái / thời gian
    Web->>Gateway: GET /merchant/shipments?filters=...
    Gateway->>Shipment: Tìm kiếm đơn theo bộ lọc của Merchant
    Shipment-->>Gateway: Trả danh sách đơn phù hợp
    opt Cần trạng thái tracking mới nhất
        Gateway->>Tracking: Lấy current tracking cho các mã vận đơn
        Tracking-->>Gateway: Trả trạng thái hiển thị
    end
    Gateway-->>Web: Hiển thị danh sách đơn hàng
    Web-->>Merchant: Merchant xem kết quả tìm kiếm
```

---

## 3.5.2.1.5 Hủy đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Pickup as Pickup Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Chọn hủy đơn hàng
    Web->>Gateway: DELETE /merchant/shipments/:code
    Gateway->>Shipment: Yêu cầu hủy shipment
    alt Đơn chưa được lấy hàng
        Shipment-->>MQ: Publish shipment.cancelled
        MQ-->>Tracking: Cập nhật trạng thái CANCELLED
        MQ-->>Reporting: Cập nhật thống kê đơn hủy
        Gateway->>Pickup: Hủy pickup liên quan nếu có
        Pickup-->>Gateway: Pickup đã hủy hoặc không tồn tại
        Shipment-->>Gateway: Hủy đơn thành công
        Gateway-->>Web: Hiển thị đơn đã hủy
    else Đơn đã vào luồng vận hành
        Shipment-->>Gateway: Không cho phép hủy trực tiếp
        Gateway-->>Web: Gợi ý tạo yêu cầu hoàn hàng / liên hệ OPS
    end
```

---

## 3.5.2.2.1 Tạo yêu cầu lấy hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Pickup as Pickup Service
    participant Dispatch as Dispatch Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Chọn các đơn cần lấy hàng
    Merchant->>Web: Nhập địa chỉ, thời gian hẹn, ghi chú
    Web->>Gateway: POST /merchant/pickups
    Gateway->>Pickup: Tạo pickup request
    Pickup-->>MQ: Publish pickup.requested
    MQ-->>Tracking: Ghi nhận yêu cầu lấy hàng
    MQ-->>Reporting: Cập nhật số lượng pickup mới
    opt Tự động tạo task chờ điều phối
        MQ-->>Dispatch: Tạo pickup task ở trạng thái chờ assign
    end
    Pickup-->>Gateway: Trả mã yêu cầu lấy hàng
    Gateway-->>Web: Hiển thị pickup request đã tạo
```

---

## 3.5.2.2.2 Cập nhật yêu cầu lấy hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Pickup as Pickup Service
    participant Dispatch as Dispatch Service
    participant Tracking as Tracking Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Mở yêu cầu lấy hàng cần sửa
    Web->>Gateway: GET /merchant/pickups/:id
    Gateway->>Pickup: Lấy chi tiết pickup request
    Pickup-->>Gateway: Trả thông tin pickup
    Gateway-->>Web: Hiển thị form cập nhật

    Merchant->>Web: Cập nhật thời gian hẹn / địa chỉ / ghi chú
    Web->>Gateway: PUT /merchant/pickups/:id
    Gateway->>Pickup: Kiểm tra trạng thái và cập nhật pickup
    alt Pickup chưa được courier nhận xử lý
        Pickup-->>MQ: Publish pickup.updated
        MQ-->>Tracking: Cập nhật timeline pickup
        MQ-->>Dispatch: Cập nhật thông tin task nếu đã tạo
        Pickup-->>Gateway: Cập nhật thành công
        Gateway-->>Web: Hiển thị thông tin mới
    else Pickup đã trong quá trình lấy hàng
        Pickup-->>Gateway: Từ chối cập nhật
        Gateway-->>Web: Thông báo không thể sửa yêu cầu
    end
```

---

## 3.5.2.2.3 Hủy yêu cầu lấy hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Pickup as Pickup Service
    participant Dispatch as Dispatch Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Chọn hủy yêu cầu lấy hàng
    Web->>Gateway: DELETE /merchant/pickups/:id
    Gateway->>Pickup: Yêu cầu hủy pickup request
    alt Courier chưa hoàn tất pickup
        Pickup-->>MQ: Publish pickup.cancelled
        MQ-->>Dispatch: Hủy hoặc đóng pickup task liên quan
        MQ-->>Tracking: Ghi nhận pickup đã hủy
        MQ-->>Reporting: Cập nhật thống kê pickup hủy
        Pickup-->>Gateway: Hủy pickup thành công
        Gateway-->>Web: Hiển thị yêu cầu đã hủy
    else Hàng đã được pickup
        Pickup-->>Gateway: Không thể hủy pickup
        Gateway-->>Web: Thông báo hàng đã được lấy
    end
```

---

## 3.5.2.3 Tạo yêu cầu hoàn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Delivery as Delivery Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant MQ as RabbitMQ domain.events

    Merchant->>Web: Chọn đơn cần yêu cầu hoàn hàng
    Web->>Gateway: GET /merchant/shipments/:code
    Gateway->>Shipment: Kiểm tra trạng thái đơn
    Shipment-->>Gateway: Trả trạng thái hiện tại

    alt Đơn đủ điều kiện yêu cầu hoàn
        Merchant->>Web: Nhập lý do hoàn hàng
        Web->>Gateway: POST /merchant/returns
        Gateway->>Delivery: Tạo return request
        Delivery-->>MQ: Publish return.requested
        MQ-->>Tracking: Cập nhật timeline yêu cầu hoàn
        MQ-->>Reporting: Cập nhật thống kê return
        Delivery-->>Gateway: Trả kết quả tạo yêu cầu hoàn
        Gateway-->>Web: Hiển thị yêu cầu hoàn hàng đã tạo
    else Đơn chưa đủ điều kiện hoàn
        Gateway-->>Web: Thông báo không thể tạo yêu cầu hoàn
    end
```

---

## 3.5.2.4 In nhãn vận đơn

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Label as Label / PDF Renderer

    Merchant->>Web: Chọn một hoặc nhiều đơn cần in nhãn
    Web->>Gateway: GET /merchant/shipments/labels?codes=...
    Gateway->>Shipment: Lấy dữ liệu nhãn vận đơn
    Shipment-->>Gateway: Trả mã vận đơn, người nhận, barcode, COD, serviceType
    Gateway->>Label: Render nhãn PDF / HTML
    Label-->>Gateway: Trả file nhãn vận đơn
    Gateway-->>Web: Tải hoặc mở file nhãn
    Web-->>Merchant: Merchant in và dán nhãn lên bưu kiện
```

---

## 3.5.2.5 Xem dashboard tổng quan đơn hàng

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
    "labelTextColor": "#0D47A1",
    "noteBkgColor": "#EAF4FF",
    "noteBorderColor": "#64B5F6",
    "noteTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Shop
    participant Web as Merchant Web
    participant Gateway as Gateway BFF
    participant Reporting as Reporting Service
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service

    Merchant->>Web: Mở dashboard Merchant
    Web->>Gateway: GET /merchant/dashboard/summary
    Gateway->>Reporting: Lấy tổng quan đơn hàng theo Merchant
    Reporting-->>Gateway: Trả số đơn mới, đang vận chuyển, đã giao, giao lỗi, hoàn hàng

    Gateway->>Shipment: Lấy danh sách đơn gần đây
    Shipment-->>Gateway: Trả danh sách đơn mới nhất

    Gateway->>Tracking: Lấy trạng thái nổi bật cần theo dõi
    Tracking-->>Gateway: Trả timeline / cảnh báo trạng thái

    Gateway-->>Web: Trả dữ liệu dashboard
    Web-->>Merchant: Hiển thị biểu đồ và danh sách tổng quan
```

---

## 4. State tổng quát của đơn hàng nhìn từ Merchant

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "lineColor": "#1565C0",
    "secondaryColor": "#BBDEFB",
    "tertiaryColor": "#EAF4FF",
    "noteBkgColor": "#EAF4FF",
    "noteTextColor": "#0D47A1",
    "noteBorderColor": "#64B5F6"
  }
}}%%
stateDiagram-v2
    [*] --> CREATED: Merchant tạo đơn
    CREATED --> PICKUP_REQUESTED: Tạo yêu cầu lấy hàng
    PICKUP_REQUESTED --> PICKUP_ASSIGNED: OPS phân công courier
    PICKUP_ASSIGNED --> PICKED_UP: Courier lấy hàng
    PICKED_UP --> INBOUND_AT_HUB: Hàng vào hub
    INBOUND_AT_HUB --> IN_TRANSIT: Đóng bao / trung chuyển
    IN_TRANSIT --> OUT_FOR_DELIVERY: Bàn giao đi phát
    OUT_FOR_DELIVERY --> DELIVERED: Giao thành công
    OUT_FOR_DELIVERY --> DELIVERY_FAILED: Giao thất bại
    DELIVERY_FAILED --> NDR_CREATED: Tạo NDR
    NDR_CREATED --> OUT_FOR_DELIVERY: Giao lại
    NDR_CREATED --> RETURN_STARTED: Chuyển hoàn
    RETURN_STARTED --> RETURN_COMPLETED: Hoàn tất hoàn hàng
    CREATED --> CANCELLED: Merchant hủy đơn trước pickup
    PICKUP_REQUESTED --> CANCELLED: Hủy yêu cầu / hủy đơn
    DELIVERED --> [*]
    RETURN_COMPLETED --> [*]
    CANCELLED --> [*]
```

---

## 5. Mapping chức năng Merchant với service xử lý

| Nhóm chức năng | Chức năng | Service chính | Event / trạng thái liên quan |
| --- | --- | --- | --- |
| Quản lý đơn hàng | Tạo đơn hàng | shipment-service, pricing-service | shipment.created, CREATED |
| Quản lý đơn hàng | Cập nhật đơn hàng | shipment-service | shipment.updated |
| Quản lý đơn hàng | Theo dõi đơn hàng | tracking-service, shipment-service | tracking timeline |
| Quản lý đơn hàng | Tìm kiếm đơn hàng | shipment-service | current_status |
| Quản lý đơn hàng | Hủy đơn hàng | shipment-service, pickup-service | shipment.cancelled, CANCELLED |
| Quản lý yêu cầu lấy hàng | Tạo yêu cầu lấy hàng | pickup-service | pickup.requested, PICKUP_REQUESTED |
| Quản lý yêu cầu lấy hàng | Cập nhật yêu cầu lấy hàng | pickup-service, dispatch-service | pickup.updated |
| Quản lý yêu cầu lấy hàng | Hủy yêu cầu lấy hàng | pickup-service, dispatch-service | pickup.cancelled |
| Hoàn hàng | Tạo yêu cầu hoàn hàng | delivery-service | return.requested / return.started |
| Nhãn vận đơn | In nhãn vận đơn | shipment-service, gateway-bff | shipping label / barcode |
| Dashboard | Xem tổng quan đơn hàng | reporting-service, tracking-service | KPI, aggregate, timeline |
