# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: KHÁCH HÀNG CÁ NHÂN (CUSTOMER C-END)
## Ứng dụng phục vụ: `apps/customer-mobile` (Port `:8082` - React Native Expo)

---

## 0. Tổng Quan Nhóm Chức Năng Khách Hàng Cá Nhân

Khách hàng cá nhân (*Customer C-End*) thao tác trên ứng dụng di động riêng biệt (`customer-mobile`), phục vụ nhu cầu gửi bưu phẩm cá nhân, quản lý đơn hàng nhận về và tương tác thông minh với AI:
- **6.1. Tạo đơn gửi hàng lẻ cá nhân**: Nhập địa chỉ, trọng lượng, kích thước và đặt lịch lấy hàng tận nhà.
- **6.2. Tính cước tự động & So sánh gói dịch vụ chuẩn IATA $V/6000$**: So sánh chi phí Tiết kiệm, Tiêu chuẩn và Hỏa tốc.
- **6.3. Tra cứu hành trình bưu kiện thời gian thực & Quản lý sổ địa chỉ**: Theo dõi đơn gửi đi và đơn sắp nhận về.
- **6.4. Tương tác cùng trợ lý ảo AI Logistics RAG qua Widget nổi (Floating Chatbot)**: Hỏi đáp bưu chính 24/7.
- **6.5. Xác thực nhận hàng an toàn bằng mã OTP 6 số**: Cung cấp mã OTP định danh cho bưu tá khi nhận bưu phẩm.

---

## 6.1. Khách Hàng Tạo Đơn Gửi Hàng Lẻ Trên Ứng Dụng Di Động

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
    actor Customer as Khách hàng cá nhân (Customer)
    participant Mobile as Customer Mobile (:8082)
    participant Gateway as Gateway BFF (:3000)
    participant Shipment as Shipment Service (:3002)
    participant Pickup as Pickup Service (:3003)
    participant EventBus as RabbitMQ (domain.events)

    Customer->>Mobile: Chọn địa chỉ từ sổ địa chỉ, nhập kích thước cân nặng kiện hàng & bấm "Đặt đơn"
    Mobile->>Gateway: POST /api/v1/customer/shipments { receiverInfo, packageInfo, serviceType: "STANDARD" }
    Gateway->>Shipment: POST /internal/shipments/customer-create
    Shipment->>Shipment: Khởi tạo mã vận đơn mới & Trạng thái CREATED
    Shipment->>Pickup: Khởi tạo tự động yêu cầu bưu tá tới nhà lấy hàng
    Shipment->>EventBus: Publish sự kiện "shipment.created" & "pickup.requested"
    Shipment-->>Gateway: 201 Created { trackingCode: "333577082099", expectedPickupTime: "14:00 - 16:00" }
    Gateway-->>Mobile: 201 Created
    Mobile-->>Customer: Hiển thị màn hình đặt đơn thành công kèm thời gian dự kiến bưu tá đến lấy
```

---

## 6.2. Ước Tính Cước & So Sánh Gói Dịch Vụ Chuẩn IATA $V/6000$

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
    actor Customer as Khách hàng cá nhân (Customer)
    participant Mobile as Customer Mobile (:8082)
    participant Gateway as Gateway BFF (:3000)
    participant Pricing as Pricing Service (:3012)

    Customer->>Mobile: Nhập địa chỉ đến, nhập cân nặng 2.5kg, kích thước 30x20x10 cm
    Mobile->>Gateway: POST /api/v1/pricing/quote-options { fromAddress, toAddress, weight: 2.5, dimensions: {30,20,10} }
    Gateway->>Pricing: POST /internal/pricing/quote-all-services
    Note over Pricing: Tính thể tích quy đổi: 30x20x10 / 6000 = 1.0kg<br/>Trọng lượng tính cước: max(2.5kg, 1.0kg) = 2.5kg<br/>Tính cước 3 gói: Tiết kiệm, Tiêu chuẩn, Hỏa tốc
    Pricing-->>Gateway: Trả về bảng phí 3 gói dịch vụ và thời gian SLA tương ứng
    Gateway-->>Mobile: 200 OK
    Mobile-->>Customer: Hiển thị 3 thẻ so sánh dịch vụ trực quan để khách hàng chọn lựa
```

---

## 6.3. Tra Cứu Hành Trình Bưu Phẩm & Quản Lý Sổ Địa Chỉ

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
    actor Customer as Khách hàng cá nhân (Customer)
    participant Mobile as Customer Mobile (:8082)
    participant Gateway as Gateway BFF (:3000)
    participant Tracking as Tracking Service (:3008)
    participant Shipment as Shipment Service (:3002)

    Customer->>Mobile: Mở tab "Kiện hàng của tôi" (Xem các đơn chuẩn bị giao tới mình)
    Mobile->>Gateway: GET /api/v1/customer/incoming-shipments
    Gateway->>Shipment: GET /internal/shipments/by-recipient-phone?phone={userPhone}
    Shipment-->>Gateway: Trả về danh sách đơn đang vận chuyển tới số điện thoại này
    Gateway-->>Mobile: 200 OK
    Mobile-->>Customer: Hiển thị danh sách các gói hàng đang trên đường tới

    Customer->>Mobile: Bấm chọn 1 đơn hàng để xem chi tiết
    Mobile->>Gateway: GET /api/v1/customer/tracking/{trackingCode}
    Gateway->>Tracking: GET /internal/tracking/timeline/{trackingCode}
    Tracking-->>Gateway: Trả về timeline chi tiết từng trạm Hub
    Gateway-->>Mobile: 200 OK
    Mobile-->>Customer: Vẽ bản đồ trực quan + tiến trình Timeline của kiện hàng
```

---

## 6.4. Tương Tác Trợ Lý AI Logistics RAG Qua Cửa Sổ Chat Nổi

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
    actor Customer as Khách hàng cá nhân (Customer)
    participant Mobile as Customer Mobile (:8082)
    participant Gateway as Gateway BFF (:3000)
    participant Chatbot as Chatbot Service (:3013)
    participant LLM as Google Gemini Flash SSE

    Customer->>Mobile: Bấm biểu tượng bóng chat nổi (Floating AI Bot) & Hỏi: "Bưu cục nào gần đường Quang Trung Gò Vấp?"
    Mobile->>Gateway: POST /api/v1/chatbot/chat/stream { message, sessionId }
    Gateway->>Chatbot: Proxy SSE Connection
    Chatbot->>Chatbot: Thực thi Dynamic Tool `find_nearest_post_office` với tọa độ/địa danh Gò Vấp
    Chatbot->>LLM: Nạp thông tin bưu cục thực tế từ Masterdata vào Context Prompt
    
    loop Stream phản hồi qua SSE
        LLM-->>Chatbot: Chunk text
        Chatbot-->>Gateway: SSE Event chunk
        Gateway-->>Mobile: Chunk dữ liệu
        Mobile-->>Customer: Hiển thị câu trả lời dạng chữ gõ dần kèm địa chỉ, SĐT hotline bưu cục
    end
    Chatbot-->>Mobile: Kết thúc dòng dữ liệu (Event: done)
```

---

## 6.5. Xác Thực Nhận Hàng An Toàn Bằng Mã OTP 6 Số

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
    actor Courier as Nhân viên giao hàng (Shipper)
    actor Customer as Khách hàng cá nhân (Customer)
    participant Mobile as Customer Mobile (:8082)
    participant Gateway as Gateway BFF (:3000)
    participant Delivery as Delivery Service (:3007)

    Note over Courier,Customer: Shipper mang kiện hàng tới địa chỉ nhận
    Courier->>Customer: "Chào bạn, mình giao bưu kiện Nexus. Bạn vui lòng đọc mã OTP nhận hàng giúp mình nhé!"
    Customer->>Mobile: Mở thông báo hoặc chi tiết đơn hàng trên app
    Mobile->>Gateway: GET /api/v1/customer/shipments/{trackingCode}/delivery-otp
    Gateway->>Delivery: GET /internal/delivery/get-customer-otp
    Delivery-->>Gateway: Trả về mã OTP 6 số bảo mật (VD: "829104")
    Gateway-->>Mobile: 200 OK
    Mobile-->>Customer: Hiển thị mã "829 104" với chữ số to rõ kèm đồng hồ đếm ngược hiệu lực
    Customer->>Courier: Đọc mã "829 104" cho Shipper nhập vào máy
```

