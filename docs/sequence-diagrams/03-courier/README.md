# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: NHÂN VIÊN GIAO HÀNG (COURIER / SHIPPER)
## Ứng dụng phục vụ: `apps/courier-mobile` (Port `:8081` - Expo React Native)

---

## 0. Tổng Quan Nhóm Chức Năng Bưu Tá / Shipper

Nhân viên giao nhận (*Courier / Shipper*) thao tác trực tiếp trên ứng dụng di động thực hiện thu gom hàng đầu nguồn (Pickup) và phát hàng chặng cuối (Last-mile Delivery):
- **3.1. Đăng nhập & Quản lý nhiệm vụ giao nhận**: Tiếp nhận danh sách đơn cần lấy và đơn cần giao trong ngày.
- **3.2. Quét mã vạch xác nhận lấy hàng từ Shop (Scan Pickup)**: Sử dụng camera quét barcode/QR, phát sinh sự kiện `scan.pickup_confirmed`.
- **3.3. Xác nhận phát thành công (Xác thực OTP 6 số + Chụp ảnh POD/Chữ ký tải lên MinIO)**: Đảm bảo giao đúng người, đúng địa chỉ.
- **3.4. Báo cáo sự cố phát thất bại (Biên bản NDR)**: Ghi nhận lý do giao không thành công (Khách hẹn lại, Không nghe máy...).
- **3.5. Hàng đợi ngoại tuyến (Offline Queue Synchronization)**: Tiếp tục quét và chụp ảnh khi mất sóng 4G, tự động đồng bộ khi có mạng.
- **3.6. Thu tiền COD mặt & Quyết toán nộp tiền qua VietQR SePay**: Nộp tiền COD thu hộ cuối ngày bằng chuyển khoản ngân hàng tự động.

---

## 3.1. Đăng Nhập & Quản Lý Nhiệm Vụ Giao Nhận

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant Gateway as Gateway BFF (:3000)
    participant Auth as Auth Service (:3010)
    participant Dispatch as Dispatch Service (:3004)

    Courier->>Mobile: Mở App & Nhập thông tin tài khoản bưu tá
    Mobile->>Gateway: POST /api/v1/auth/login { username, password }
    Gateway->>Auth: Xác thực tài khoản & Phân quyền vai trò COURIER
    Auth-->>Gateway: Trả về Token xác thực & Hồ sơ bưu cục phụ trách
    Gateway-->>Mobile: 200 OK (Lưu Token an toàn vào Expo SecureStore)

    Mobile->>Gateway: GET /api/v1/courier/tasks/today (Tải bảng công việc trong ngày)
    Gateway->>Dispatch: GET /internal/dispatch/courier-tasks?courierId={id}
    Dispatch-->>Gateway: Trả về 2 danh sách: Nhiệm vụ Thu gom (Pickup) & Nhiệm vụ Giao hàng (Delivery)
    Gateway-->>Mobile: 200 OK
    Mobile-->>Courier: Hiển thị giao diện phân tab "Cần lấy" và "Cần giao" kèm số lượng đơn
```

---

## 3.2. Quét Mã Vạch Xác Nhận Lấy Hàng (Scan Pickup)

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant Gateway as Gateway BFF (:3000)
    participant Scan as Scan Service (:3006)
    participant Shipment as Shipment Service (:3002)
    participant Pickup as Pickup Service (:3003)
    participant EventBus as RabbitMQ (domain.events)

    Courier->>Mobile: Đến kho shop, mở camera quét mã barcode trên phiếu gửi
    Mobile->>Gateway: POST /api/v1/courier/scans/pickup { barcode, location: {lat, lng} }
    Gateway->>Scan: POST /internal/scans/record-pickup
    
    Scan->>Shipment: GET /internal/shipments/{barcode}
    alt Đơn hợp lệ (Trạng thái CREATED hoặc ASSIGNED_PICKUP)
        Scan->>Shipment: Cập nhật trạng thái đơn sang PICKED_UP
        Scan->>Pickup: Cập nhật trạng thái nhiệm vụ lấy sang COMPLETED
        Scan->>EventBus: Publish sự kiện "scan.pickup_confirmed"
        Scan-->>Gateway: 200 OK { success: true, trackingCode, status: "PICKED_UP" }
        Gateway-->>Mobile: 200 OK
        Mobile->>Mobile: Rung phản hồi (Haptic feedback) & Âm thanh "Bíp" thành công
        Mobile-->>Courier: Hiển thị tick xanh & Chuyển đơn sang danh sách "Đã lấy"
    else Mã vạch không thuộc danh sách nhiệm vụ hoặc đơn đã bị hủy
        Scan-->>Gateway: 400 Bad Request { code: "INVALID_PICKUP_BARCODE" }
        Gateway-->>Mobile: 400 Bad Request
        Mobile-->>Courier: Cảnh báo đỏ: "Đơn không hợp lệ hoặc đã bị shop hủy!"
    end
```

---

## 3.3. Xác Nhận Phát Thành Công: Xác Thực OTP 6 Số & Ảnh POD Tải Lên MinIO

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant Gateway as Gateway BFF (:3000)
    participant Storage as MinIO S3 Object Storage (:9000)
    participant Delivery as Delivery Service (:3007)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Courier->>Mobile: Giao kiện hàng, yêu cầu người nhận đọc mã OTP 6 số & Ký tên
    Mobile->>Gateway: POST /api/v1/storage/upload-pod (Multipart Form: Ảnh bưu kiện + Chữ ký số)
    Gateway->>Storage: Lưu ảnh vào bucket `nexus-pod-evidence/{date}/{trackingCode}.jpg`
    Storage-->>Gateway: Trả về Public/Presigned URL ảnh POD
    Gateway-->>Mobile: 200 OK { podImageUrl }

    Mobile->>Gateway: POST /api/v1/courier/deliveries/confirm-success
    Note over Mobile: Body: { trackingCode, otpCode: "829104", podImageUrl, signatureUrl, idempotencyKey }
    Gateway->>Delivery: POST /internal/delivery/confirm-success
    
    Delivery->>Delivery: Đối chiếu mã OTP 6 số bảo mật với mã sinh ra ban đầu
    alt Mã OTP chính xác
        Delivery->>Shipment: Chuyển trạng thái đơn sang DELIVERED
        Delivery->>EventBus: Publish sự kiện "delivery.delivered" kèm bằng chứng POD
        Delivery-->>Gateway: 200 OK { status: "DELIVERED", deliveredAt: "..." }
        Gateway-->>Mobile: 200 OK
        Mobile-->>Courier: Hiển thị thông báo "Giao hàng thành công", tự động chuyển sang đơn kế tiếp
    else Mã OTP không chính xác / Hết hạn
        Delivery-->>Gateway: 400 Bad Request { code: "INVALID_OTP_CODE" }
        Gateway-->>Mobile: 400 Bad Request
        Mobile-->>Courier: Báo lỗi "Sai mã OTP xác thực. Vui lòng yêu cầu người nhận kiểm tra tin nhắn!"
    end
```

---

## 3.4. Báo Cáo Sự Cố Phát Thất Bại & Lập Biên Bản NDR

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant Gateway as Gateway BFF (:3000)
    participant Delivery as Delivery Service (:3007)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Courier->>Mobile: Không liên hệ được người nhận, bấm "Báo cáo giao không thành công"
    Mobile->>Gateway: GET /api/v1/courier/ndr-reasons (Lấy danh mục chuẩn)
    Gateway-->>Mobile: Trả về danh sách: [KH_HEN_GIAO_LAI, SAI_DIA_CHI, THUE_BAO_KHONG_LIEN_LAC_DUOC, TU_CHOI_NHAN...]
    
    Courier->>Mobile: Chọn lý do "Khách hẹn giao lại ngày mai" & Chụp ảnh nhật ký cuộc gọi
    Mobile->>Gateway: POST /api/v1/courier/deliveries/ndr-report { trackingCode, reasonCode, notes, rescheduleDate }
    Gateway->>Delivery: POST /internal/delivery/record-ndr
    
    Delivery->>Delivery: Tăng số lần giao thất bại (attemptCount++)
    alt attemptCount < 3 (Trong hạn mức cho phép giao lại)
        Delivery->>Shipment: Cập nhật trạng thái đơn: DELIVERY_FAILED (Chờ phát lại)
        Delivery->>EventBus: Publish sự kiện "ndr.created"
        Delivery-->>Gateway: 200 OK { nextAction: "RESCHEDULE_DELIVERY" }
        Gateway-->>Mobile: 200 OK
        Mobile-->>Courier: Xác nhận đã ghi nhận sự cố, đơn xếp vào lịch phát ca tiếp theo
    else attemptCount >= 3 (Vượt quá 3 lần giao theo quy định)
        Delivery->>Shipment: Đánh dấu đơn chuyển sang luồng RETURNING_PENDING_APPROVAL
        Delivery->>EventBus: Publish sự kiện "ndr.max_attempts_exceeded"
        Delivery-->>Gateway: 200 OK { nextAction: "ESCALATE_TO_RETURN" }
        Gateway-->>Mobile: 200 OK
        Mobile-->>Courier: Báo hệ thống: "Đơn đã giao quá 3 lần. Vui lòng mang hàng về Hub nhập kho hoàn!"
    end
```

---

## 3.5. Đồng Bộ Hàng Đợi Ngoại Tuyến (Offline Queue Synchronization)

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant LocalDB as SQLite / Async Storage (Cục bộ)
    participant NetInfo as Network Listener (Offline/Online)
    participant Gateway as Gateway BFF (:3000)
    participant Scan as Scan Service (:3006)

    Note over Mobile,NetInfo: Bưu tá đi vào khu vực mất sóng (Tầng hầm / Vùng sâu)
    Courier->>Mobile: Quét bưu kiện khi không có kết nối Internet
    Mobile->>NetInfo: Kiểm tra trạng thái mạng -> IsConnected = FALSE
    Mobile->>LocalDB: Enqueue bản ghi scan { trackingCode, timestamp, idempotencyKey, offline: true }
    Mobile-->>Courier: Thông báo: "Đã lưu tạm ngoại tuyến (Offline Queue: 1 đơn)"

    Note over Mobile,NetInfo: Bưu tá di chuyển ra vùng có sóng 4G/Wifi trở lại
    NetInfo-->>Mobile: Phát sự kiện Mạng đã kết nối trở lại (Online event)
    Mobile->>LocalDB: Truy vấn toàn bộ các thao tác đang chờ đồng bộ
    LocalDB-->>Mobile: Trả về danh sách n hành động chưa gửi

    loop Xử lý tuần tự từng bản ghi trong hàng đợi
        Mobile->>Gateway: POST /api/v1/courier/scans/sync-batch { batchActions: [...] }
        Gateway->>Scan: Ghi nhận vết quét kèm timestamp gốc ngoại tuyến
        Scan-->>Gateway: 200 OK (Xác nhận xử lý thành công)
        Gateway-->>Mobile: 200 OK
        Mobile->>LocalDB: Dequeue / Xóa bản ghi đã đồng bộ xong
    end
    Mobile-->>Courier: Hiển thị biểu tượng "Đã đồng bộ toàn bộ dữ liệu ngoại tuyến lên máy chủ"
```

---

## 3.6. Thu Tiền COD Mặt & Quyết Toán Nộp Tiền Qua VietQR SePay

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
    actor Courier as Nhân viên giao hàng (Courier)
    participant Mobile as Courier Mobile (:8081)
    participant Gateway as Gateway BFF (:3000)
    participant Payment as Payment Service (:3011)
    participant BankApp as Ứng dụng Ngân hàng (Mobile Banking)
    participant SePay as Cổng SePay Webhook

    Courier->>Mobile: Cuối ca, mở màn hình "Quyết toán tiền mặt COD thu hộ trong ngày"
    Mobile->>Gateway: POST /api/v1/courier/reconciliation/generate-settlement-qr
    Gateway->>Payment: POST /internal/payment/generate-courier-qr { courierId, date }
    Note over Payment: Tổng hợp toàn bộ các đơn COD đã thu tiền mặt trong ca<br/>Tạo mã VietQR động chứa mã giao dịch đối soát
    Payment-->>Gateway: Trả về { totalAmount: 4850000, qrDataUrl, referenceCode: "COD_COU_9182" }
    Gateway-->>Mobile: 200 OK
    Mobile-->>Courier: Hiển thị mã VietQR động kèm cú pháp chuyển tiền chính xác

    Courier->>BankApp: Quét mã VietQR trên điện thoại hoặc dùng App ngân hàng chuyển khoản
    BankApp->>Payment: Giao dịch chuyển khoản Napas 247 tới tài khoản công ty
    SePay->>Payment: Webhook thông báo biến động số dư tài khoản kèm nội dung "COD_COU_9182"
    Payment->>Payment: Tự động đối chiếu mã giao dịch, khớp số tiền nộp
    Payment-->>Mobile: Push Notification thời gian thực qua WebSocket/FCM
    Mobile-->>Courier: Chuông thông báo vang lên: "Xác nhận nộp tiền COD thành công. Phiên giao ca hoàn tất!"
```

