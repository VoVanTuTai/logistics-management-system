# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: NGƯỜI GỬI HÀNG (MERCHANT / SHOP)
## Ứng dụng phục vụ: `apps/merchant-web` (Port `:5176`)

---

## 0. Tổng Quan Nhóm Chức Năng Người Gửi Hàng

Chủ shop / Doanh nghiệp gửi hàng (*Merchant*) sử dụng hệ thống để quản lý vòng đời bưu phẩm từ khi tạo đơn đến khi hoàn tất thanh toán đối soát:
- **2.1. Đăng nhập & Xác thực hệ thống**: Đăng nhập Opaque token an toàn, lưu phiên làm việc.
- **2.2. Tạo đơn hàng & Tự động tính cước IATA**: Kiểm tra trần vật lý, tự động kích hoạt tem cảnh báo `[FRAGILE]` và bảo hiểm toàn diện.
- **2.3. Đặt lịch yêu cầu bưu tá đến lấy hàng (Pickup Request)**: Khởi tạo nhiệm vụ thu gom hàng tận kho shop.
- **2.4. Yêu cầu đổi thông tin giao (Change Request)**: Cập nhật người nhận, địa chỉ, số điện thoại, tiền COD khi đơn chưa lấy.
- **2.5. Hủy đơn hàng**: Hủy đơn trước khi bưu tá đến kho, tự động hủy lệnh pickup liên đới.
- **2.6. In nhãn vận đơn đơn lẻ (A6/A7) & In nhiều vận đơn hàng loạt (Bulk Print)**: Xuất phiếu gửi có mã vạch barcode 1D/QR.
- **2.7. Yêu cầu chuyển hoàn & Tự động khấu trừ cước theo phân tầng**: Khấu trừ 50% cước hoàn đối với SME, 0đ với VIP Enterprise.
- **2.8. Theo dõi đối soát giải ngân COD qua SePay/VietQR**: Tra cứu phiên đối soát và khớp nối dòng tiền tự động.

---

## 2.1. Đăng Nhập & Xác Thực Hệ Thống

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Auth as Auth Service (:3010)
    participant Redis as Redis Session Cache

    Merchant->>Web: Nhập Email/Tên đăng nhập & Mật khẩu
    Web->>Gateway: POST /api/v1/auth/login
    Gateway->>Auth: POST /internal/auth/authenticate
    Auth->>Auth: Kiểm tra mật khẩu (Bcrypt), trạng thái tài khoản (ACTIVE)
    
    alt Thông tin đăng nhập chính xác & Có role MERCHANT
        Auth->>Redis: Lưu Opaque Token & Session Metadata (TTL: 24h)
        Auth-->>Gateway: Trả về { token, user: { id, email, role: "MERCHANT", merchantProfile } }
        Gateway-->>Web: 200 OK (Set HttpOnly Cookie hoặc Authorization Header)
        Web->>Web: Lưu token vào LocalStorage/State
        Web-->>Merchant: Điều hướng vào Dashboard quản lý tổng quan
    else Đăng nhập thất bại (Sai thông tin hoặc tài khoản bị khóa)
        Auth-->>Gateway: 401 Unauthorized / 403 Forbidden
        Gateway-->>Web: 401 Unauthorized { message: "Tài khoản hoặc mật khẩu không chính xác" }
        Web-->>Merchant: Hiển thị thông báo lỗi trên màn hình
    end
```

---

## 2.2. Tạo Đơn Hàng, Tính Cước IATA Tức Thời & Gắn Tem Hàng Dễ Vỡ

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Pricing as Pricing Service (:3012)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Merchant->>Web: Nhập thông tin người nhận, loại hàng (FRAGILE), kích thước (D, R, C), cân nặng, COD, giá trị khai báo
    Note over Web: Gọi tính cước tức thời khi nhập kiện hàng
    Web->>Gateway: POST /api/v1/pricing/quote
    Gateway->>Pricing: POST /internal/pricing/calculate-rate
    Note over Pricing: Tính Chargeable Weight = max(Cân thực, D*R*C/6000)<br/>Kích hoạt bảo hiểm 0.5% nếu HIGH_VALUE<br/>Kiểm tra trần vật lý (≤ 70kg, max cạnh ≤ 150cm)
    Pricing-->>Gateway: Trả về bảng phí cước chuẩn
    Gateway-->>Web: Hiển thị cước phí tạm tính cho Merchant

    Merchant->>Web: Nhấp nút "Tạo đơn hàng"
    Web->>Gateway: POST /api/v1/shipments
    Gateway->>Shipment: POST /internal/shipments/create
    Shipment->>Shipment: Sinh mã vận đơn độc nhất (Tracking Code)<br/>Gán nhãn cảnh báo [FRAGILE - HÀNG DỄ VỠ - XIN NHẸ TAY]<br/>Ghi nhận trạng thái: CREATED
    Shipment->>EventBus: Publish sự kiện "shipment.created"
    Shipment-->>Gateway: Trả về thông tin đơn hàng đã tạo thành công
    Gateway-->>Web: 201 Created { trackingCode, feeDetails, labelData }
    Web-->>Merchant: Thông báo tạo đơn thành công & Cung cấp tùy chọn In phiếu gửi
```

---

## 2.3. Đặt Lịch Yêu Cầu Lấy Hàng (Pickup Request)

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Pickup as Pickup Service (:3003)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Merchant->>Web: Chọn danh sách các vận đơn đã tạo & Bấm "Yêu cầu lấy hàng"
    Web->>Gateway: POST /api/v1/pickups { shipmentIds: [...], pickupAddress, scheduledTime, notes }
    Gateway->>Pickup: POST /internal/pickups/schedule
    Pickup->>Shipment: POST /internal/shipments/validate-status (Kiểm tra trạng thái CREATED)
    Shipment-->>Pickup: Xác nhận tất cả các đơn đều hợp lệ để lấy
    Pickup->>Pickup: Tạo phiếu yêu cầu thu gom (Pickup Order) trạng thái PENDING_APPROVAL
    Pickup->>EventBus: Publish sự kiện "pickup.requested"
    Pickup-->>Gateway: Trả về { pickupRequestId, status: "PENDING_APPROVAL" }
    Gateway-->>Web: 201 Created
    Web-->>Merchant: Hiển thị thông báo: "Đã gửi yêu cầu lấy hàng tới Bưu cục phụ trách"
```

---

## 2.4. Yêu Cầu Đổi Thông Tin Giao (Change Request)

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Merchant->>Web: Nhấp "Đổi thông tin giao" tại đơn hàng (Sửa SĐT, địa chỉ, hoặc tiền thu hộ COD)
    Web->>Gateway: POST /api/v1/shipments/{trackingCode}/change-request
    Gateway->>Shipment: POST /internal/shipments/{trackingCode}/change-request
    
    alt Đơn hàng chưa xuất phát đi phát (Trạng thái CREATED hoặc PICKED_UP)
        Shipment->>Shipment: Tạo bản ghi ChangeRequest, cập nhật snapshot đơn hàng
        Shipment->>EventBus: Publish sự kiện "shipment.info_changed"
        Shipment-->>Gateway: 200 OK { success: true, message: "Đã cập nhật thông tin giao hàng mới" }
        Gateway-->>Web: 200 OK
        Web-->>Merchant: Hiển thị thông báo thay đổi thành công
    else Đơn hàng đã OUT_FOR_DELIVERY hoặc DELIVERED
        Shipment-->>Gateway: 400 Bad Request { code: "CANNOT_CHANGE_INFO_AT_THIS_STAGE" }
        Gateway-->>Web: 400 Bad Request
        Web-->>Merchant: Cảnh báo: "Kiện hàng đang trên đường đi phát, không thể sửa trực tiếp. Vui lòng liên hệ CSKH!"
    end
```

---

## 2.5. Hủy Đơn Hàng Trước Khi Bưu Tá Đến Lấy

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Shipment as Shipment Service (:3002)
    participant Pickup as Pickup Service (:3003)
    participant EventBus as RabbitMQ (domain.events)

    Merchant->>Web: Nhấp "Hủy đơn hàng" & Nhập lý do hủy (Khách hủy mua, sai thông tin)
    Web->>Gateway: POST /api/v1/shipments/{trackingCode}/cancel { reason }
    Gateway->>Shipment: POST /internal/shipments/{trackingCode}/cancel
    
    alt Đơn ở trạng thái CREATED (Chưa lấy hàng)
        Shipment->>Shipment: Đổi trạng thái sang CANCELLED
        Shipment->>Pickup: POST /internal/pickups/cancel-shipment-link { trackingCode }
        Pickup->>Pickup: Gỡ bỏ đơn khỏi danh sách nhiệm vụ thu gom của bưu tá
        Shipment->>EventBus: Publish sự kiện "shipment.cancelled"
        Shipment-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK
        Web-->>Merchant: Hiển thị đơn đã chuyển sang trạng thái "Đã hủy"
    else Hàng đã được bưu tá quét xác nhận lấy (PICKED_UP / IN_TRANSIT)
        Shipment-->>Gateway: 400 Bad Request { code: "ORDER_ALREADY_PICKED_UP" }
        Gateway-->>Web: 400 Bad Request
        Web-->>Merchant: Báo lỗi: "Hàng đã được bưu tá lấy đi, vui lòng sử dụng chức năng 'Yêu cầu chuyển hoàn'!"
    end
```

---

## 2.6. In Nhãn Vận Đơn Đơn Lẻ (A6/A7) & In Hàng Loạt (Bulk Print)

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Shipment as Shipment Service (:3002)

    alt Trường hợp 1: In đơn lẻ (In phiếu gửi A6/A7)
        Merchant->>Web: Nhấp biểu tượng "In nhãn" tại dòng vận đơn
        Web->>Gateway: GET /api/v1/shipments/{trackingCode}/thermal-label
        Gateway->>Shipment: GET /internal/shipments/{trackingCode}/label-data
        Shipment-->>Gateway: Trả về dữ liệu in (Mã vạch Code128, QR Code, Tag FRAGILE, thông tin người gửi/nhận)
        Gateway-->>Web: 200 OK
        Web->>Web: Mở cửa sổ Print Preview trình duyệt (CSS `@media print` khổ A6/A7)
        Web-->>Merchant: Trình điều khiển in nhiệt xuất phiếu gửi dán thùng
    else Trường hợp 2: In hàng loạt (Bulk Print)
        Merchant->>Web: Dán danh sách mã đơn hoặc tick chọn nhiều đơn & Nhấp "In hàng loạt"
        Web->>Gateway: POST /api/v1/shipments/bulk-label { trackingCodes: [...] }
        Gateway->>Shipment: POST /internal/shipments/bulk-label-data
        Shipment-->>Gateway: Trả về danh sách dữ liệu phiếu in gộp (Batch PDF/HTML stream)
        Gateway-->>Web: 200 OK (Batch Print Payload)
        Web->>Web: Ghép trang in liên tục ngắt trang chuẩn A6
        Web-->>Merchant: Xuất hàng loạt tem nhãn trên cùng một lệnh in
    end
```

---

## 2.7. Yêu Cầu Chuyển Hoàn & Tự Động Khấu Trừ Cước Hoàn Theo Phân Tầng

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Delivery as Delivery Service (:3007)
    participant Pricing as Pricing Service (:3012)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Merchant->>Web: Nhận thông báo giao thất bại (NDR) & Chọn thao tác "Yêu cầu chuyển hoàn"
    Web->>Gateway: POST /api/v1/shipments/{trackingCode}/return-request
    Gateway->>Delivery: POST /internal/delivery/initiate-return
    Delivery->>Shipment: POST /internal/shipments/{trackingCode}/set-returning
    Shipment->>Shipment: Chuyển trạng thái đơn sang RETURNING
    
    Delivery->>Pricing: POST /internal/pricing/calculate-return-fee { merchantId, originalFee }
    Note over Pricing: Kiểm tra phân tầng đối tác:<br/>- Standard SME: Thu 50% cước gốc<br/>- VIP Enterprise: Miễn phí 0đ
    Pricing-->>Delivery: Trả về phí hoàn { returnFee, policyTier: "SME_50_PERCENT" }
    
    Delivery->>EventBus: Publish sự kiện "return.started" { trackingCode, returnFee }
    Delivery-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK (Chấp thuận chuyển hoàn)
    Web-->>Merchant: Hiển thị đơn đang chuyển hoàn & Thông báo cước hoàn khấu trừ vào bảng kê COD
```

---

## 2.8. Theo Dõi Đối Soát Giải Ngân COD Qua SePay / VietQR

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
    actor Merchant as Người gửi hàng (Merchant)
    participant Web as Merchant Web (:5176)
    participant Gateway as Gateway BFF (:3000)
    participant Payment as Payment Service (:3011)

    Merchant->>Web: Truy cập menu "Đối soát COD & Công nợ"
    Web->>Gateway: GET /api/v1/reconciliation/merchant-statements?page=1&limit=10
    Gateway->>Payment: GET /internal/reconciliation/statements?merchantId={id}
    Payment-->>Gateway: Trả về danh sách phiên đối soát (Mã phiên, Tổng tiền COD thu hộ, Cước vận chuyển, Cước hoàn trừ, Số tiền thực nhận)
    Gateway-->>Web: 200 OK
    Web-->>Merchant: Hiển thị danh sách bảng kê đối soát minh bạch

    Merchant->>Web: Bấm xem chi tiết 1 phiên đối soát đã giải ngân
    Web->>Gateway: GET /api/v1/reconciliation/statements/{statementId}/details
    Gateway->>Payment: GET /internal/reconciliation/statements/{statementId}
    Payment-->>Gateway: Trả về danh sách chi tiết từng vận đơn trong kỳ và mã giao dịch ngân hàng VietQR/SePay
    Gateway-->>Web: 200 OK
    Web-->>Merchant: Hiển thị chứng từ chuyển khoản và trạng thái "ĐÃ THANH TOÁN"
```

