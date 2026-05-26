# Courier Staff - Mermaid Sequence Diagrams

Tài liệu này gồm các sơ đồ Mermaid cho nhóm chức năng Courier / Nhân viên giao nhận trong Nexus Express System.

> Cách dùng: mở file này trong VS Code, cài extension Markdown Preview Mermaid Support, sau đó bấm `Ctrl + Shift + V` de xem so do.

---

## 0. Tổng quan luồng vận hành Courier

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant Scan as Scan Service
    participant Delivery as Delivery Service
    participant Media as Media Upload / S3
    participant Payment as Payment Service
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service
    participant EventBus as RabbitMQ domain.events

    Courier->>Gateway: Đăng nhập và mở màn hình nhiệm vụ
    Gateway->>Dispatch: Lấy danh sách task được phân công
    Dispatch-->>Gateway: Danh sách pickup / delivery task
    Gateway-->>Courier: Hiển thị task theo trạng thái

    Courier->>Gateway: Xác nhận lấy hàng / scan QR
    Gateway->>Scan: Ghi nhận scan.pickup_confirmed
    Scan->>EventBus: Publish scan.pickup_confirmed
    EventBus-->>Tracking: Cập nhật timeline
    EventBus-->>Reporting: Cập nhật KPI pickup

    Courier->>Gateway: Xác nhận giao thành công + POD
    Gateway->>Media: Upload ảnh bằng chứng giao hàng
    Media-->>Gateway: Trả về POD url
    Gateway->>Delivery: Ghi nhận delivery.delivered
    Delivery->>EventBus: Publish delivery.delivered
    EventBus-->>Tracking: Cập nhật trạng thái Đã giao
    EventBus-->>Reporting: Cập nhật KPI delivery

    Courier->>Gateway: Nộp tiền COD trong ngày
    Gateway->>Payment: Tạo QR / ghi nhận giao dịch COD
    Payment->>EventBus: Publish cod.settlement event
    EventBus-->>Reporting: Cập nhật báo cáo COD
```

---

## 3.2.5.1 Quản lý nhiệm vụ giao nhận

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service

    Courier->>Gateway: Truy cập chức năng quản lý nhiệm vụ
    Gateway->>Dispatch: Lấy danh sách task được phân công
    Dispatch-->>Gateway: Danh sách task pickup / delivery

    alt Có nhiệm vụ
        Gateway->>Shipment: Lấy thông tin vận đơn theo task
        Shipment-->>Gateway: Mã vận đơn, địa chỉ, người gửi / nhận, trạng thái hiện tại
        Gateway-->>Courier: Hiển thị danh sách nhiệm vụ
        Courier->>Gateway: Chọn một nhiệm vụ cụ thể
        Gateway->>Dispatch: Lấy chi tiết task
        Gateway->>Tracking: Lấy timeline tóm tắt của vận đơn
        Dispatch-->>Gateway: Chi tiết task
        Tracking-->>Gateway: Timeline / trạng thái gần nhất
        Gateway-->>Courier: Hiển thị chi tiết nhiệm vụ
    else Không có dữ liệu
        Gateway-->>Courier: Hiển thị danh sách trống
    end
```

---

## 3.2.5.2 Xác nhận lấy hàng

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant Scan as Scan Service
    participant Media as Media Upload / S3
    participant EventBus as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Courier->>Gateway: Mở danh sách nhiệm vụ giao nhận
    Gateway->>Dispatch: Lấy task lấy hàng được phân công
    Dispatch-->>Gateway: Danh sách task lấy hàng
    Gateway-->>Courier: Hiển thị danh sách task

    Courier->>Gateway: Chọn task lấy hàng
    Gateway->>Shipment: Lấy thông tin đơn hàng / địa chỉ lấy
    Shipment-->>Gateway: Thông tin đơn, người gửi, hàng hóa
    Gateway-->>Courier: Hiển thị chi tiết task lấy hàng

    Courier->>Gateway: Quét QR hoặc chụp hình kiện hàng
    opt Có hình ảnh kiện hàng
        Gateway->>Media: Upload ảnh kiện hàng
        Media-->>Gateway: Trả về imageUrl
    end

    alt Courier xác nhận lấy hàng
        Courier->>Gateway: Bấm Xác nhận lấy hàng
        Gateway->>Scan: Ghi nhận pickup scan với idempotencyKey
        Scan->>EventBus: Publish scan.pickup_confirmed
        Gateway->>Dispatch: Cập nhật task lấy hàng hoàn thành
        EventBus-->>Shipment: Cập nhật trạng thái PICKED_UP
        EventBus-->>Tracking: Thêm mốc Đã lấy hàng
        EventBus-->>Reporting: Cập nhật KPI lấy hàng
        Gateway-->>Courier: Thông báo xác nhận lấy hàng thành công
    else Courier bấm Hủy
        Gateway-->>Courier: Quay lại màn hình thông tin đơn hàng
    end
```

---

## 3.2.5.3 Xác nhận đã giao hàng

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant Media as Media Upload / S3
    participant Delivery as Delivery Service
    participant Payment as Payment Service
    participant EventBus as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Reporting as Reporting Service

    Courier->>Gateway: Truy cập quản lý nhiệm vụ giao nhận
    Gateway->>Dispatch: Lấy danh sách task giao hàng
    Dispatch-->>Gateway: Danh sách đơn cần giao
    Gateway-->>Courier: Hiển thị danh sách đơn cần giao

    Courier->>Gateway: Chọn task giao hàng
    Gateway->>Shipment: Lấy chi tiết vận đơn
    Shipment-->>Gateway: Mã vận đơn, người nhận, địa chỉ, COD
    Gateway-->>Courier: Hiển thị chi tiết đơn hàng

    Courier->>Gateway: Bấm Xác nhận đã giao hàng
    Gateway-->>Courier: Yêu cầu chụp ảnh bằng chứng giao hàng

    alt Có đầy đủ ảnh bằng chứng
        Courier->>Gateway: Gửi ảnh POD và bấm Xác nhận
        Gateway->>Media: Upload ảnh POD
        Media-->>Gateway: Trả về podImageUrl
        Gateway->>Delivery: Ghi nhận delivery success với POD
        Delivery->>EventBus: Publish delivery.delivered
        Gateway->>Dispatch: Cập nhật task giao hàng Hoàn thành
        opt Đơn hàng có COD
            Gateway->>Payment: Ghi nhận COD courier đang giữ
            Payment-->>Gateway: COD pending settlement
        end
        EventBus-->>Shipment: Cap nhat trang thai DELIVERED
        EventBus-->>Tracking: Thêm mốc Đã giao hàng
        EventBus-->>Reporting: Cập nhật KPI giao thành công
        Gateway-->>Courier: Thông báo Xác nhận giao hàng thành công
    else Thiếu ảnh bằng chứng
        Gateway-->>Courier: Vui lòng cung cấp đầy đủ thông tin xác nhận giao hàng
        Gateway-->>Courier: Quay lại màn hình xác nhận giao hàng
    end
```

---

## 3.2.5.4 Liên hệ người nhận

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant ContactLog as Delivery Service
    participant Receiver as Người nhận
    participant Tracking as Tracking Service

    Courier->>Gateway: Mở chi tiết task giao hàng
    Gateway->>Dispatch: Lấy chi tiết task
    Gateway->>Shipment: Lấy thông tin người nhận
    Dispatch-->>Gateway: Thông tin task
    Shipment-->>Gateway: Số điện thoại, địa chỉ, COD
    Gateway-->>Courier: Hiển thị chi tiết đơn hàng

    Courier->>Gateway: Bấm Liên hệ người nhận
    Gateway-->>Courier: Hiển thị lựa chọn gọi điện / nhắn tin
    Courier->>Receiver: Thực hiện cuộc gọi hoặc nhắn tin
    Courier->>Gateway: Ghi nhận kết quả liên hệ
    Gateway->>ContactLog: Lưu lịch sử liên hệ
    ContactLog-->>Gateway: Đã ghi nhận liên hệ
    Gateway->>Tracking: Cập nhật ghi chú liên hệ vào timeline nội bộ
    Gateway-->>Courier: Hiển thị màn hình xác nhận giao hàng
```

---

## 3.2.5.5 Báo cáo kiện vấn đề

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Dispatch as Dispatch Service
    participant Shipment as Shipment Service
    participant Delivery as Delivery Service
    participant EventBus as RabbitMQ domain.events
    participant Tracking as Tracking Service
    participant Ops as OPS Staff

    Courier->>Gateway: Mở chi tiết nhiệm vụ giao nhận
    Gateway->>Dispatch: Lấy thông tin task
    Gateway->>Shipment: Lấy thông tin đơn hàng
    Dispatch-->>Gateway: Chi tiết task
    Shipment-->>Gateway: Chi tiết vận đơn
    Gateway-->>Courier: Hiển thị thông tin kiện hàng

    Courier->>Gateway: Chọn Báo cáo kiện vấn đề
    Gateway-->>Courier: Hiển thị danh sách vấn đề
    Note over Courier,Gateway: Ví dụ: hàng hư hỏng, sai thông tin, không liên hệ được, khách từ chối, mất hàng, lý do khác

    alt Đã chọn loại vấn đề
        Courier->>Gateway: Chọn loại vấn đề, nhập mô tả, gửi báo cáo
        Gateway->>Delivery: Kiểm tra và lưu báo cáo vấn đề
        Delivery->>EventBus: Publish delivery.failed hoặc ndr.created
        EventBus-->>Shipment: Cập nhật trạng thái ISSUE / DELIVERY_FAILED
        EventBus-->>Tracking: Thêm mốc kiện hàng có vấn đề
        EventBus-->>Ops: Chuyển về OPS xử lý NDR / ngoại lệ
        Gateway-->>Courier: Thông báo gửi báo cáo thành công
    else Chưa chọn loại vấn đề
        Courier->>Gateway: Bấm Gửi báo cáo
        Gateway-->>Courier: Vui lòng chọn vấn đề
    end
```

---

## 3.2.5.6 Nộp tiền COD

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
    actor Courier as Courier Mobile
    participant Gateway as Gateway BFF
    participant Payment as Payment Service
    participant Bank as Hệ thống ngân hàng / SePay
    participant EventBus as RabbitMQ domain.events
    participant Reporting as Reporting Service
    participant Ops as OPS Staff / Thủ quỹ

    Courier->>Gateway: Truy cập chức năng Nộp tiền COD
    Gateway->>Payment: Lấy tổng COD cần nộp trong ngày
    Payment-->>Gateway: Tổng COD pending của courier
    Gateway-->>Courier: Hiển thị số tiền COD và nút tạo QR

    Courier->>Gateway: Bấm Tạo mã QR thanh toán
    Gateway->>Payment: Tạo COD settlement batch
    Payment->>Bank: Tạo QR ngân hàng động
    Bank-->>Payment: QR thanh toán / payment reference
    Payment-->>Gateway: Thông tin QR và mã đối soát
    Gateway-->>Courier: Hiển thị QR và nút Tải về

    Courier->>Bank: Quét QR và thanh toán bằng app ngân hàng
    Bank-->>Payment: Webhook / thông báo kết quả thanh toán

    alt Thanh toán thành công
        Payment->>EventBus: Publish cod.settlement.paid
        EventBus-->>Reporting: Cập nhật báo cáo COD
        EventBus-->>Ops: Cập nhật trạng thái đã thu COD
        Payment-->>Gateway: COD can nop = 0
        Gateway-->>Courier: Hiển thị nộp COD thành công
    else Thanh toán thất bại
        Payment-->>Gateway: Thanh toán thất bại
        Gateway-->>Courier: Hiển thị thông báo thất bại và quay lại màn hình QR
    end
```

---

## 4. State tổng quát của Courier Task

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
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1"
  }
}}%%
stateDiagram-v2
    [*] --> ASSIGNED: task.assigned
    ASSIGNED --> VIEWED: Courier mở chi tiết task

    VIEWED --> PICKUP_IN_PROGRESS: Task lấy hàng
    PICKUP_IN_PROGRESS --> PICKED_UP: scan.pickup_confirmed
    PICKED_UP --> PICKUP_COMPLETED: Cập nhật task hoàn thành

    VIEWED --> DELIVERY_IN_PROGRESS: Task giao hàng
    DELIVERY_IN_PROGRESS --> CONTACTED_RECEIVER: Liên hệ người nhận
    CONTACTED_RECEIVER --> DELIVERED: delivery.delivered
    CONTACTED_RECEIVER --> DELIVERY_FAILED: delivery.failed
    DELIVERY_IN_PROGRESS --> ISSUE_REPORTED: Báo cáo kiện vấn đề

    DELIVERED --> COD_PENDING: Đơn hàng có COD
    COD_PENDING --> COD_PAID: cod.settlement.paid
    DELIVERY_FAILED --> NDR_CREATED: ndr.created
    ISSUE_REPORTED --> NDR_CREATED: Cần OPS xử lý

    PICKUP_COMPLETED --> [*]
    COD_PAID --> [*]
    NDR_CREATED --> [*]
```

---

## 5. Mapping chức năng Courier với service xử lý

| Chức năng | Endpoint đại diện gợi ý | Service chính | Event / State liên quan |
|---|---|---|---|
| Quản lý nhiệm vụ giao nhận | `GET /courier/tasks` | `dispatch-service` | `task.assigned`, `task.completed` |
| Xem chi tiết nhiệm vụ | `GET /courier/tasks/:id` | `dispatch-service`, `shipment-service` | Trạng thái task và shipment hiện tại |
| Xác nhận lấy hàng | `POST /courier/pickups/confirm` | `scan-service` | `scan.pickup_confirmed`, `PICKED_UP` |
| Xác nhận đã giao hàng | `POST /courier/deliveries/success` | `delivery-service` | `delivery.delivered`, `DELIVERED` |
| Liên hệ người nhận | `POST /courier/deliveries/contact-log` | `delivery-service` | Lịch sử liên hệ nội bộ |
| Báo cáo kiện vấn đề | `POST /courier/deliveries/issues` | `delivery-service` | `delivery.failed`, `ndr.created`, `ISSUE_REPORTED` |
| Upload ảnh POD | `POST /media/upload` | `gateway-bff`, MinIO/S3 | POD image URL |
| Nộp tiền COD | `POST /courier/cod/settlements` | `payment-service` | `cod.settlement.created`, `cod.settlement.paid` |

---

## 6. Ghi chú trình bày báo cáo

- Courier không xử lý trực tiếp database của service nào. Tất cả thao tác đi qua Gateway BFF.
- `dispatch-service` là source of truth cho task được phân công.
- `scan-service` ghi nhận hành động quét mã khi lấy hàng hoặc bàn giao.
- `delivery-service` là source of truth cho kết quả giao hàng, giao thất bại, vấn đề và NDR.
- `payment-service` quản lý COD pending, QR thanh toán và settlement.
- `tracking-service` va `reporting-service` cập nhật dữ liệu thông qua domain events.

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
    actor Guest as Khách vãng lai
    participant Web as Website / Tracking Page
    participant Gateway as Gateway BFF
    participant Shipment as Shipment Service
    participant Tracking as Tracking Service

    Guest->>Web: Truy cập trang tra cứu hành trình đơn hàng
    Web-->>Guest: Hiển thị ô nhập mã đơn hàng

    Guest->>Web: Nhập mã đơn hàng và bấm Tra cứu
    Web->>Gateway: Gửi yêu cầu tra cứu theo mã đơn hàng

    Gateway->>Shipment: Kiểm tra mã đơn hàng có tồn tại không

    alt Mã đơn hàng hợp lệ
        Shipment-->>Gateway: Trả về thông tin cơ bản của đơn hàng
        Gateway->>Tracking: Lấy hành trình / timeline của đơn hàng
        Tracking-->>Gateway: Trả về các mốc trạng thái vận chuyển
        Gateway-->>Web: Trả về thông tin đơn hàng và hành trình
        Web-->>Guest: Hiển thị hành trình đơn hàng
    else Mã đơn hàng không tồn tại
        Shipment-->>Gateway: Không tìm thấy đơn hàng
        Gateway-->>Web: Trả về lỗi không tìm thấy
        Web-->>Guest: Hiển thị thông báo mã đơn hàng không hợp lệ
    end