# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: NHÂN VIÊN VẬN HÀNH (OPS STAFF)
## Ứng dụng phục vụ: `apps/ops-web` (Port `:5175`)

---

## 0. Tổng Quan Nhóm Chức Năng Nhân Viên Vận Hành

Nhân viên vận hành (*Ops Staff*) tại các bưu cục giao dịch và Hub khai thác chịu trách nhiệm điều phối mạng lưới, luân chuyển kiện hàng qua các công đoạn:
- **4.1. Phê duyệt yêu cầu lấy hàng & Phân công bưu tá thu gom**: Duyệt pickup từ shop và điều phối shipper.
- **4.2. Tạo đơn gửi trực tiếp tại quầy bưu cục (Walk-in)**: Tiếp nhận khách gửi hàng tại chỗ, cân đo IATA, in phiếu gửi A6.
- **4.3. Khởi tạo bao trung chuyển (Manifest MB) & Đóng đơn lẻ vào bao**: Gom kiện lẻ vào bao tải chuyên dụng.
- **4.4. Đóng seal niêm phong kẹp chì an ninh**: Khóa bao bằng số seal kẹp chì độc nhất.
- **4.5. Điều phối xe tải Linehaul & Cấp tem niêm phong xe tải (Mã XT)**: Quản lý tải trọng và tuyến xe kết nối Hub.
- **4.6. Quét xuất kho (Outbound) & Xác nhận xe khởi hành**: Bốc xếp bao hàng lên xe và xuất trạm.
- **4.7. Xác nhận xe đến & Quét nhập kho (Inbound)**: Hạ tải và quét nhận hàng đến Hub đích.
- **4.8. Cắt seal mở bao & Kiểm đếm chia chọn**: Phân loại kiện hàng về các bàn phát tuyến quận/huyện.
- **4.9. Quét bàn giao đơn cho bưu tá đi phát (Handoff)**: Chuyển trạng thái đơn sang `OUT_FOR_DELIVERY`.
- **4.10. Xử lý sự cố giao hàng NDR & Kích hoạt chuyển hoàn**: Tiếp nhận báo cáo lỗi và xử lý sau 3 ca phát.
- **4.11. Đối soát giải ngân COD bưu cục**: Thu nộp tiền COD qua VietQR tự động hoặc duyệt thủ quỹ trực tiếp.

---

## 4.1. Phê Duyệt Yêu Cầu Lấy Hàng & Điều Phối Bưu Tá (Pickup Dispatch)

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Pickup as Pickup Service (:3003)
    participant Dispatch as Dispatch Service (:3004)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Xem danh sách yêu cầu lấy hàng đang chờ duyệt
    Web->>Gateway: GET /api/v1/ops/pickups?status=PENDING_APPROVAL
    Gateway->>Pickup: GET /internal/pickups?hubId={currentHubId}
    Pickup-->>Gateway: Trả về danh sách đơn yêu cầu từ các shop
    Gateway-->>Web: 200 OK
    Web-->>Ops: Hiển thị danh sách kèm địa chỉ kho và số kiện

    Ops->>Web: Chọn yêu cầu & Bấm "Phê duyệt & Phân công Shipper"
    Web->>Gateway: POST /api/v1/ops/pickups/{pickupId}/assign { courierId }
    Gateway->>Pickup: POST /internal/pickups/{pickupId}/approve
    Pickup->>Pickup: Chuyển trạng thái sang APPROVED
    Pickup->>Dispatch: POST /internal/dispatch/create-pickup-task { pickupId, courierId }
    Dispatch->>Dispatch: Tạo nhiệm vụ lấy hàng mới cho Shipper
    Dispatch->>EventBus: Publish sự kiện "pickup.assigned"
    Dispatch-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK
    Web-->>Ops: Cập nhật trạng thái nhiệm vụ: "ĐÃ GÁN SHIPPER"
```

---

## 4.2. Tạo Đơn Hàng Gửi Trực Tiếp Tại Quầy Bưu Cục (Walk-in)

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Pricing as Pricing Service (:3012)
    participant Shipment as Shipment Service (:3002)
    participant Scan as Scan Service (:3006)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Nhập thông tin khách gửi tại quầy: Tên, SĐT, Địa chỉ đích, Cân thực tế, Kích thước D-R-C
    Web->>Gateway: POST /api/v1/pricing/quote
    Gateway->>Pricing: POST /internal/pricing/calculate-rate
    Note over Pricing: Tính Chargeable Weight = max(Cân thực, D*R*C/6000)<br/>Tính cước phí theo vùng
    Pricing-->>Gateway: Trả về báo giá cước phí chính xác
    Gateway-->>Web: 200 OK (Hiển thị tiền cước cần thu)

    Ops->>Web: Nhận tiền mặt từ khách & Bấm "Tạo đơn & Nhập kho quầy"
    Web->>Gateway: POST /api/v1/ops/shipments/walk-in
    Gateway->>Shipment: POST /internal/shipments/create-walkin
    Shipment->>Shipment: Khởi tạo mã vận đơn mới, trạng thái: RECEIVED_AT_ORIGIN_POST_OFFICE
    Shipment->>Scan: Ghi nhận vết quét nhập kho đầu tiên tại bưu cục quầy
    Shipment->>EventBus: Publish sự kiện "shipment.created" & "scan.inbound"
    Shipment-->>Gateway: 201 Created { trackingCode, labelData }
    Gateway-->>Web: 201 Created
    Web->>Web: Kích hoạt in nhiệt phiếu gửi bưu phẩm A6/A7
    Web-->>Ops: Xuất phiếu gửi dán lên bưu kiện của khách
```

---

## 4.3. Khởi Tạo Bao Trung Chuyển (Manifest MB) & Đóng Đơn Lẻ Vào Bao

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Manifest as Manifest Service (:3005)
    participant Shipment as Shipment Service (:3002)

    Ops->>Web: Mở màn hình "Đóng bao trung chuyển", chọn Hub đích (VD: Mega Hub Tân Bình)
    Web->>Gateway: POST /api/v1/manifests { destinationHubId }
    Gateway->>Manifest: POST /internal/manifests/create-bag
    Manifest->>Manifest: Khởi tạo mã bao trung chuyển mới (mã `MB...`, trạng thái OPENING)
    Manifest-->>Gateway: Trả về { manifestCode: "MB789201", status: "OPENING" }
    Gateway-->>Web: 201 Created
    Web-->>Ops: Mở phiên quét barcode đơn lẻ cho bao MB789201

    loop Quét từng bưu phẩm đóng vào bao
        Ops->>Web: Bắn súng quét barcode mã vận đơn (VD: 333577082054)
        Web->>Gateway: POST /api/v1/manifests/MB789201/add-item { trackingCode }
        Gateway->>Manifest: POST /internal/manifests/MB789201/add-item
        Manifest->>Shipment: GET /internal/shipments/{trackingCode} (Kiểm tra đúng tuyến đến Hub đích)
        alt Hợp lệ đúng tuyến & Trạng thái hàng sẵn sàng
            Shipment-->>Manifest: Xác nhận đơn hợp lệ
            Manifest->>Manifest: Thêm mã đơn vào danh sách bảng kê của bao
            Manifest-->>Gateway: 200 OK { itemCount: 12, totalWeight: 18.5 }
            Gateway-->>Web: 200 OK
            Web-->>Ops: Âm thanh "Bíp" xác nhận, tăng số kiện trong bao lên 1
        else Sai tuyến hoặc đơn chưa nhập kho
            Shipment-->>Manifest: Sai tuyến Hub đích (Misrouted)
            Manifest-->>Gateway: 400 Bad Request { code: "MISROUTED_DESTINATION" }
            Gateway-->>Web: 400 Bad Request
            Web-->>Ops: Chuông cảnh báo đỏ: "Đơn sai tuyến! Vui lòng phân loại lại!"
        end
    end
```

---

## 4.4. Đóng Seal Niêm Phong Kẹp Chì An Ninh

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Manifest as Manifest Service (:3005)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Kiểm đếm xong bao hàng MB789201, bấm "Khóa niêm phong bao"
    Ops->>Web: Nhập mã kẹp chì kim loại / Seal an ninh (VD: SEAL-881920) & Khối lượng cân tổng bao
    Web->>Gateway: POST /api/v1/manifests/MB789201/seal { sealCode: "SEAL-881920", grossWeight: 24.5 }
    Gateway->>Manifest: POST /internal/manifests/MB789201/seal
    Manifest->>Manifest: Gán mã seal vào bảng kê bao & Đổi trạng thái sang SEALED
    Manifest->>EventBus: Publish sự kiện "manifest.sealed"
    Manifest-->>Gateway: 200 OK { manifestCode: "MB789201", status: "SEALED", sealCode: "SEAL-881920" }
    Gateway-->>Web: 200 OK
    Web->>Web: In tem thẻ bao trung chuyển A6 có barcode MB và số Seal
    Web-->>Ops: Bao hàng đã sẵn sàng đưa vào khu vực chờ xếp lên xe tải
```

---

## 4.5. Điều Phối Xe Tải Linehaul & Cấp Tem Niêm Phong Xe (Mã XT)

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Linehaul as Linehaul Service (:3014)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Mở phân hệ "Chuyến xe đường trục Linehaul", chọn tuyến xe Bắc - Nam
    Web->>Gateway: POST /api/v1/linehauls/trips { routeCode, truckPlateNumber: "29C-881.92", driverName, destinationHubId }
    Gateway->>Linehaul: POST /internal/linehauls/create-trip
    Linehaul->>Linehaul: Khởi tạo chuyến xe mới trạng thái PLANNED
    Linehaul->>Linehaul: Cấp mã tem niêm phong thùng xe tải (Mã `XT...`, VD: XT-HN-SG-001)
    Linehaul->>EventBus: Publish sự kiện "linehaul.created"
    Linehaul-->>Gateway: 201 Created { tripId, tripCode: "XT-HN-SG-001" }
    Gateway-->>Web: 201 Created
    Web-->>Ops: Hiển thị bảng điều khiển bốc xếp hàng cho chuyến xe XT-HN-SG-001
```

---

## 4.6. Quét Xuất Kho Outbound Lên Xe & Xác Nhận Xe Đi

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Scan as Scan Service (:3006)
    participant Linehaul as Linehaul Service (:3014)
    participant EventBus as RabbitMQ (domain.events)

    loop Quét từng bao hàng xếp lên thùng xe tải
        Ops->>Web: Quét barcode bao hàng (MB789201)
        Web->>Gateway: POST /api/v1/linehauls/XT-HN-SG-001/load-bag { manifestCode: "MB789201" }
        Gateway->>Scan: Ghi nhận vết quét OUTBOUND cho toàn bộ đơn trong bao
        Gateway->>Linehaul: POST /internal/linehauls/load-bag
        Linehaul-->>Gateway: 200 OK (Ghi nhận bao đã vào khoang xe)
        Gateway-->>Web: 200 OK
        Web-->>Ops: Cập nhật tổng tải trọng trên xe (kg / % tải)
    end

    Ops->>Web: Đóng cửa thùng xe, dán niêm phong tem XT & Bấm "Xác nhận xe xuất bến"
    Web->>Gateway: POST /api/v1/linehauls/XT-HN-SG-001/dispatch { departureTime: NOW }
    Gateway->>Linehaul: POST /internal/linehauls/dispatch
    Linehaul->>Linehaul: Đổi trạng thái chuyến xe sang DISPATCHED (Đang trên đường trục)
    Linehaul->>EventBus: Publish sự kiện "linehaul.dispatched"
    Linehaul-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK
    Web-->>Ops: Thông báo: "Chuyến xe XT-HN-SG-001 đã rời bến thành công!"
```

---

## 4.7. Quét Nhập Kho Inbound Khi Xe Đến Hub Đích

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
    actor Ops as Nhân viên vận hành Hub đích
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Linehaul as Linehaul Service (:3014)
    participant Scan as Scan Service (:3006)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Xe tải cập bến bàn dỡ, chọn chuyến xe XT-HN-SG-001 & Bấm "Xác nhận xe đến"
    Web->>Gateway: POST /api/v1/linehauls/XT-HN-SG-001/arrive
    Gateway->>Linehaul: POST /internal/linehauls/arrive
    Linehaul->>Linehaul: Đổi trạng thái chuyến xe sang ARRIVED
    Linehaul->>EventBus: Publish sự kiện "linehaul.arrived"
    Linehaul-->>Gateway: 200 OK
    Gateway-->>Web: 200 OK

    loop Dỡ hàng xuống băng chuyền & Quét nhập kho từng bao
        Ops->>Web: Bắn barcode từng bao hàng dỡ xuống
        Web->>Gateway: POST /api/v1/scans/inbound { code: "MB789201", hubId }
        Gateway->>Scan: POST /internal/scans/record-inbound
        Scan->>Scan: Ghi nhận sự kiện scan.inbound cho bao và danh sách vận đơn con
        Scan->>EventBus: Publish sự kiện "scan.inbound"
        Scan-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK
        Web-->>Ops: Âm thanh báo nhập kho thành công
    end
```

---

## 4.8. Cắt Seal Mở Bao & Kiểm Đếm Chia Chọn Vận Đơn

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Manifest as Manifest Service (:3005)
    participant Scan as Scan Service (:3006)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Mở bao MB789201, nhập mã Seal thực tế để đối soát kiểm tra nguyên vẹn
    Web->>Gateway: POST /api/v1/manifests/MB789201/unseal { verifySealCode: "SEAL-881920" }
    Gateway->>Manifest: POST /internal/manifests/MB789201/unseal
    Manifest->>Manifest: Kiểm tra mã seal khớp với lúc đóng bao ban đầu<br/>Đổi trạng thái sang UNSEALED
    Manifest->>EventBus: Publish sự kiện "manifest.unsealed"
    Manifest-->>Gateway: 200 OK (Danh sách đơn dự kiến trong bao)
    Gateway-->>Web: 200 OK
    Web-->>Ops: Hiển thị bảng đối soát kiểm đếm kiện lẻ

    loop Quét kiểm đếm từng gói hàng trong bao ra
        Ops->>Web: Quét mã vận đơn đơn lẻ (333577082054)
        Web->>Gateway: POST /api/v1/manifests/MB789201/verify-item { trackingCode }
        Gateway->>Scan: Ghi nhận kiểm đếm nhập kho trạm phát
        Scan-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK (Chuyển dòng đơn sang màu xanh "ĐÃ KIỂM ĐẾM")
    end
    Ops->>Web: Bấm "Hoàn tất kiểm đếm & Phân chia tuyến phát"
```

---

## 4.9. Quét Bàn Giao Đơn Cho Bưu Tá Đi Phát (Handoff)

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Dispatch as Dispatch Service (:3004)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Mở màn hình "Bàn giao đơn cho bưu tá", chọn Shipper (Nguyễn Văn A)
    Web->>Gateway: GET /api/v1/dispatch/courier-handover-session { courierId }
    Gateway-->>Web: Khởi tạo phiên bàn giao mới

    loop Quét barcode từng gói hàng bàn giao tận tay Shipper
        Ops->>Web: Quét mã vận đơn (333577082054)
        Web->>Gateway: POST /api/v1/dispatch/handoff { courierId, trackingCode }
        Gateway->>Dispatch: Gán đơn vào chuyến phát của bưu tá
        Gateway->>Shipment: Cập nhật trạng thái đơn sang OUT_FOR_DELIVERY
        Shipment->>EventBus: Publish sự kiện "shipment.out_for_delivery"
        Shipment-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK
        Web-->>Ops: Hiển thị đơn đã được thêm vào giỏ phát của bưu tá
    end
    Ops->>Web: Nhấp "In biên bản bàn giao ca phát" để 2 bên ký nhận
```

---

## 4.10. Xử Lý Sự Cố Giao Thất Bại & Kích Hoạt Hoàn Hàng

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
    actor Ops as Nhân viên vận hành (Ops Staff)
    participant Web as Ops Web (:5175)
    participant Gateway as Gateway BFF (:3000)
    participant Delivery as Delivery Service (:3007)
    participant Shipment as Shipment Service (:3002)
    participant EventBus as RabbitMQ (domain.events)

    Ops->>Web: Mở danh sách xử lý sự cố phát thất bại (NDR Incident Queue)
    Web->>Gateway: GET /api/v1/delivery/ndr-incidents?status=PENDING_ACTION
    Gateway->>Delivery: GET /internal/delivery/ndr-list
    Delivery-->>Gateway: Trả về danh sách đơn gặp sự cố kèm lịch sử cuộc gọi và ảnh biên bản
    Gateway-->>Web: 200 OK
    Web-->>Ops: Hiển thị chi tiết đơn hàng và số lần phát thất bại

    alt Quyết định cho phát lại lần tiếp theo
        Ops->>Web: Chọn "Gia hạn phát lại" & Chỉ định ngày phát mới
        Web->>Gateway: POST /api/v1/delivery/{trackingCode}/reschedule
        Gateway->>Delivery: POST /internal/delivery/reschedule
        Delivery-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK
        Web-->>Ops: Đơn được xếp vào lịch giao ngày mai
    else Quyết định chuyển hoàn về cho Shop
        Ops->>Web: Bấm "Chốt hoàn hàng về bưu cục gốc"
        Web->>Gateway: POST /api/v1/delivery/{trackingCode}/approve-return
        Gateway->>Delivery: POST /internal/delivery/initiate-return
        Delivery->>Shipment: Đổi trạng thái sang RETURNING
        Delivery->>EventBus: Publish sự kiện "return.started"
        Delivery-->>Gateway: 200 OK
        Gateway-->>Web: 200 OK
        Web-->>Ops: Đơn chuyển sang luồng hàng hoàn, chuẩn bị đóng bao gửi ngược về kho shop
    end
```

