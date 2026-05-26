# Courier Staff - Mermaid Sequence Diagrams

Tai lieu nay gom cac so do Mermaid cho nhom chuc nang Courier / Nhan vien giao nhan trong Nexus Express System.

> Cach dung: mo file nay trong VS Code, cai extension Markdown Preview Mermaid Support, sau do bam `Ctrl + Shift + V` de xem so do.

---

## 0. Tong quan luong van hanh Courier

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

    Courier->>Gateway: Dang nhap va mo man hinh nhiem vu
    Gateway->>Dispatch: Lay danh sach task duoc phan cong
    Dispatch-->>Gateway: Danh sach pickup / delivery task
    Gateway-->>Courier: Hien thi task theo trang thai

    Courier->>Gateway: Xac nhan lay hang / scan QR
    Gateway->>Scan: Ghi nhan scan.pickup_confirmed
    Scan->>EventBus: Publish scan.pickup_confirmed
    EventBus-->>Tracking: Cap nhat timeline
    EventBus-->>Reporting: Cap nhat KPI pickup

    Courier->>Gateway: Xac nhan giao thanh cong + POD
    Gateway->>Media: Upload anh bang chung giao hang
    Media-->>Gateway: Tra ve POD url
    Gateway->>Delivery: Ghi nhan delivery.delivered
    Delivery->>EventBus: Publish delivery.delivered
    EventBus-->>Tracking: Cap nhat trang thai Da giao
    EventBus-->>Reporting: Cap nhat KPI delivery

    Courier->>Gateway: Nop tien COD trong ngay
    Gateway->>Payment: Tao QR / ghi nhan giao dich COD
    Payment->>EventBus: Publish cod.settlement event
    EventBus-->>Reporting: Cap nhat bao cao COD
```

---

## 3.2.5.1 Quan ly nhiem vu giao nhan

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

    Courier->>Gateway: Truy cap chuc nang quan ly nhiem vu
    Gateway->>Dispatch: Lay danh sach task duoc phan cong
    Dispatch-->>Gateway: Danh sach task pickup / delivery

    alt Co nhiem vu
        Gateway->>Shipment: Lay thong tin van don theo task
        Shipment-->>Gateway: Ma van don, dia chi, nguoi gui / nhan, trang thai hien tai
        Gateway-->>Courier: Hien thi danh sach nhiem vu
        Courier->>Gateway: Chon mot nhiem vu cu the
        Gateway->>Dispatch: Lay chi tiet task
        Gateway->>Tracking: Lay timeline tom tat cua van don
        Dispatch-->>Gateway: Chi tiet task
        Tracking-->>Gateway: Timeline / trang thai gan nhat
        Gateway-->>Courier: Hien thi chi tiet nhiem vu
    else Khong co du lieu
        Gateway-->>Courier: Hien thi danh sach trong
    end
```

---

## 3.2.5.2 Xac nhan lay hang

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

    Courier->>Gateway: Mo danh sach nhiem vu giao nhan
    Gateway->>Dispatch: Lay task lay hang duoc phan cong
    Dispatch-->>Gateway: Danh sach task lay hang
    Gateway-->>Courier: Hien thi danh sach task

    Courier->>Gateway: Chon task lay hang
    Gateway->>Shipment: Lay thong tin don hang / dia chi lay
    Shipment-->>Gateway: Thong tin don, nguoi gui, hang hoa
    Gateway-->>Courier: Hien thi chi tiet task lay hang

    Courier->>Gateway: Quet QR hoac chup hinh kien hang
    opt Co hinh anh kien hang
        Gateway->>Media: Upload anh kien hang
        Media-->>Gateway: Tra ve imageUrl
    end

    alt Courier xac nhan lay hang
        Courier->>Gateway: Bam Xac nhan lay hang
        Gateway->>Scan: Ghi nhan pickup scan voi idempotencyKey
        Scan->>EventBus: Publish scan.pickup_confirmed
        Gateway->>Dispatch: Cap nhat task lay hang hoan thanh
        EventBus-->>Shipment: Cap nhat trang thai PICKED_UP
        EventBus-->>Tracking: Them moc Da lay hang
        EventBus-->>Reporting: Cap nhat KPI lay hang
        Gateway-->>Courier: Thong bao xac nhan lay hang thanh cong
    else Courier bam Huy
        Gateway-->>Courier: Quay lai man hinh thong tin don hang
    end
```

---

## 3.2.5.3 Xac nhan da giao hang

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

    Courier->>Gateway: Truy cap quan ly nhiem vu giao nhan
    Gateway->>Dispatch: Lay danh sach task giao hang
    Dispatch-->>Gateway: Danh sach don can giao
    Gateway-->>Courier: Hien thi danh sach don can giao

    Courier->>Gateway: Chon task giao hang
    Gateway->>Shipment: Lay chi tiet van don
    Shipment-->>Gateway: Ma van don, nguoi nhan, dia chi, COD
    Gateway-->>Courier: Hien thi chi tiet don hang

    Courier->>Gateway: Bam Xac nhan da giao hang
    Gateway-->>Courier: Yeu cau chup anh bang chung giao hang

    alt Co day du anh bang chung
        Courier->>Gateway: Gui anh POD va bam Xac nhan
        Gateway->>Media: Upload anh POD
        Media-->>Gateway: Tra ve podImageUrl
        Gateway->>Delivery: Ghi nhan delivery success voi POD
        Delivery->>EventBus: Publish delivery.delivered
        Gateway->>Dispatch: Cap nhat task giao hang Hoan thanh
        opt Don hang co COD
            Gateway->>Payment: Ghi nhan COD courier dang giu
            Payment-->>Gateway: COD pending settlement
        end
        EventBus-->>Shipment: Cap nhat trang thai DELIVERED
        EventBus-->>Tracking: Them moc Da giao hang
        EventBus-->>Reporting: Cap nhat KPI giao thanh cong
        Gateway-->>Courier: Thong bao Xac nhan giao hang thanh cong
    else Thieu anh bang chung
        Gateway-->>Courier: Vui long cung cap day du thong tin xac nhan giao hang
        Gateway-->>Courier: Quay lai man hinh xac nhan giao hang
    end
```

---

## 3.2.5.4 Lien he nguoi nhan

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
    participant Receiver as Nguoi nhan
    participant Tracking as Tracking Service

    Courier->>Gateway: Mo chi tiet task giao hang
    Gateway->>Dispatch: Lay chi tiet task
    Gateway->>Shipment: Lay thong tin nguoi nhan
    Dispatch-->>Gateway: Thong tin task
    Shipment-->>Gateway: So dien thoai, dia chi, COD
    Gateway-->>Courier: Hien thi chi tiet don hang

    Courier->>Gateway: Bam Lien he nguoi nhan
    Gateway-->>Courier: Hien thi lua chon goi dien / nhan tin
    Courier->>Receiver: Thuc hien cuoc goi hoac nhan tin
    Courier->>Gateway: Ghi nhan ket qua lien he
    Gateway->>ContactLog: Luu lich su lien he
    ContactLog-->>Gateway: Da ghi nhan lien he
    Gateway->>Tracking: Cap nhat ghi chu lien he vao timeline noi bo
    Gateway-->>Courier: Hien thi man hinh xac nhan giao hang
```

---

## 3.2.5.5 Bao cao kien van de

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

    Courier->>Gateway: Mo chi tiet nhiem vu giao nhan
    Gateway->>Dispatch: Lay thong tin task
    Gateway->>Shipment: Lay thong tin don hang
    Dispatch-->>Gateway: Chi tiet task
    Shipment-->>Gateway: Chi tiet van don
    Gateway-->>Courier: Hien thi thong tin kien hang

    Courier->>Gateway: Chon Bao cao kien van de
    Gateway-->>Courier: Hien thi danh sach van de
    Note over Courier,Gateway: Vi du: hang hu hong, sai thong tin, khong lien he duoc, khach tu choi, mat hang, ly do khac

    alt Da chon loai van de
        Courier->>Gateway: Chon loai van de, nhap mo ta, gui bao cao
        Gateway->>Delivery: Kiem tra va luu bao cao van de
        Delivery->>EventBus: Publish delivery.failed hoac ndr.created
        EventBus-->>Shipment: Cap nhat trang thai ISSUE / DELIVERY_FAILED
        EventBus-->>Tracking: Them moc kien hang co van de
        EventBus-->>Ops: Chuyen ve OPS xu ly NDR / ngoai le
        Gateway-->>Courier: Thong bao gui bao cao thanh cong
    else Chua chon loai van de
        Courier->>Gateway: Bam Gui bao cao
        Gateway-->>Courier: Vui long chon van de
    end
```

---

## 3.2.5.6 Nop tien COD

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
    participant Bank as He thong ngan hang / SePay
    participant EventBus as RabbitMQ domain.events
    participant Reporting as Reporting Service
    participant Ops as OPS Staff / Thu quy

    Courier->>Gateway: Truy cap chuc nang Nop tien COD
    Gateway->>Payment: Lay tong COD can nop trong ngay
    Payment-->>Gateway: Tong COD pending cua courier
    Gateway-->>Courier: Hien thi so tien COD va nut tao QR

    Courier->>Gateway: Bam Tao ma QR thanh toan
    Gateway->>Payment: Tao COD settlement batch
    Payment->>Bank: Tao QR ngan hang dong
    Bank-->>Payment: QR thanh toan / payment reference
    Payment-->>Gateway: Thong tin QR va ma doi soat
    Gateway-->>Courier: Hien thi QR va nut Tai ve

    Courier->>Bank: Quet QR va thanh toan bang app ngan hang
    Bank-->>Payment: Webhook / thong bao ket qua thanh toan

    alt Thanh toan thanh cong
        Payment->>EventBus: Publish cod.settlement.paid
        EventBus-->>Reporting: Cap nhat bao cao COD
        EventBus-->>Ops: Cap nhat trang thai da thu COD
        Payment-->>Gateway: COD can nop = 0
        Gateway-->>Courier: Hien thi nop COD thanh cong
    else Thanh toan that bai
        Payment-->>Gateway: Thanh toan that bai
        Gateway-->>Courier: Hien thi thong bao that bai va quay lai man hinh QR
    end
```

---

## 4. State tong quat cua Courier Task

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
    ASSIGNED --> VIEWED: Courier mo chi tiet task

    VIEWED --> PICKUP_IN_PROGRESS: Task lay hang
    PICKUP_IN_PROGRESS --> PICKED_UP: scan.pickup_confirmed
    PICKED_UP --> PICKUP_COMPLETED: Cap nhat task hoan thanh

    VIEWED --> DELIVERY_IN_PROGRESS: Task giao hang
    DELIVERY_IN_PROGRESS --> CONTACTED_RECEIVER: Lien he nguoi nhan
    CONTACTED_RECEIVER --> DELIVERED: delivery.delivered
    CONTACTED_RECEIVER --> DELIVERY_FAILED: delivery.failed
    DELIVERY_IN_PROGRESS --> ISSUE_REPORTED: Bao cao kien van de

    DELIVERED --> COD_PENDING: Don hang co COD
    COD_PENDING --> COD_PAID: cod.settlement.paid
    DELIVERY_FAILED --> NDR_CREATED: ndr.created
    ISSUE_REPORTED --> NDR_CREATED: Can OPS xu ly

    PICKUP_COMPLETED --> [*]
    COD_PAID --> [*]
    NDR_CREATED --> [*]
```

---

## 5. Mapping chuc nang Courier voi service xu ly

| Chuc nang | Endpoint dai dien goi y | Service chinh | Event / State lien quan |
|---|---|---|---|
| Quan ly nhiem vu giao nhan | `GET /courier/tasks` | `dispatch-service` | `task.assigned`, `task.completed` |
| Xem chi tiet nhiem vu | `GET /courier/tasks/:id` | `dispatch-service`, `shipment-service` | Trang thai task va shipment hien tai |
| Xac nhan lay hang | `POST /courier/pickups/confirm` | `scan-service` | `scan.pickup_confirmed`, `PICKED_UP` |
| Xac nhan da giao hang | `POST /courier/deliveries/success` | `delivery-service` | `delivery.delivered`, `DELIVERED` |
| Lien he nguoi nhan | `POST /courier/deliveries/contact-log` | `delivery-service` | Lich su lien he noi bo |
| Bao cao kien van de | `POST /courier/deliveries/issues` | `delivery-service` | `delivery.failed`, `ndr.created`, `ISSUE_REPORTED` |
| Upload anh POD | `POST /media/upload` | `gateway-bff`, MinIO/S3 | POD image URL |
| Nop tien COD | `POST /courier/cod/settlements` | `payment-service` | `cod.settlement.created`, `cod.settlement.paid` |

---

## 6. Ghi chu trinh bay bao cao

- Courier khong xu ly truc tiep database cua service nao. Tat ca thao tac di qua Gateway BFF.
- `dispatch-service` la source of truth cho task duoc phan cong.
- `scan-service` ghi nhan hanh dong quet ma khi lay hang hoac ban giao.
- `delivery-service` la source of truth cho ket qua giao hang, giao that bai, van de va NDR.
- `payment-service` quan ly COD pending, QR thanh toan va settlement.
- `tracking-service` va `reporting-service` cap nhat du lieu thong qua domain events.
