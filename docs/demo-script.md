# Demo Script - Nexus Express System End-to-End

Phien ban: 2026-05-21. Tac gia: AI Codex.

Script nay mo ta toan bo luong demo toan trinh tu khi tao don, thuc hien chuoi van hanh, den khi KPI hien tren dashboard. Muc tieu: chung minh toan bo he thong event-driven hoat dong dung.

---

## Dieu kien tien quyet

### 1. Khoi dong ha tang

```powershell
# Terminal 1: Khoi dong Docker (Postgres + RabbitMQ)
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

# Terminal 2: Khoi dong tat ca backend service + frontend
powershell -ExecutionPolicy Bypass -File scripts/start-all-retry.ps1
```

Kiem tra health:
- Gateway: `http://localhost:3000/health`
- Ops Web: `http://localhost:5173`
- Merchant Web: `http://localhost:5174`
- Admin Web: `http://localhost:5175`
- Public Tracking: `http://localhost:5176` (neu co)

### 2. Xac nhan Build/Typecheck truoc demo

```powershell
# Reporting service typecheck
cd services\reporting-service && pnpm exec tsc -p tsconfig.json --noEmit

# Ops-web build + smoke
cd apps\ops-web && pnpm run build && pnpm run test:smoke

# Courier-mobile typecheck
cd apps\courier-mobile && pnpm run typecheck
```

Tat ca phai pass truoc khi demo.

---

## Buoc 1 - Admin tao va gan User

**App:** Admin Web `http://localhost:5175`
**Tai khoan dang nhap:** Admin (username dang `10000xxx`, mat khau da tao)

### Tao Merchant User
1. Vao menu **Quan ly nguoi dung** → **Merchant**.
2. Chon **Tao tai khoan**.
3. Nhap:
   - Username: `41100001` (theo quy tac merchant)
   - Password: tuy chon
   - Roles: `MERCHANT`
   - Hub: _(khong can)_
4. Luu. Xac nhan tai khoan xuat hien trong danh sach.

### Tao Ops User
1. Vao **Quan ly nguoi dung** → **Ops**.
2. Tao tai khoan:
   - Username: `20000001`
   - Roles: `OPS`
   - Hub: gan hub `HCM01`

### Tao Courier User
1. Vao **Quan ly nguoi dung** → **Courier / Shipper**.
2. Tao tai khoan:
   - Username: `30000001`
   - Roles: `COURIER`
   - Hub: gan hub `HCM01`
3. Vao **Phan quyen Courier Mobile** → enable cac permission:
   - `scan.pickup`, `scan.inbound`, `scan.outbound`
   - `scan.delivery-sign`, `scan.issue`

### Tao Hub (neu chua co)
1. Vao **Masterdata** → **Hub**.
2. Tao hub `HCM01`, zone `HCM`.

---

## Buoc 2 - Merchant tao Shipment COD

**App:** Merchant Web `http://localhost:5174`
**Tai khoan:** `41100001`

1. Dang nhap.
2. Chon **Tao van don**.
3. Nhap thong tin don:
   - Ten nguoi gui / nguoi nhan
   - Dia chi nguoi nhan
   - Hub gui: `HCM01`, Hub nhan: `HCM02` (hoac bat ky hub dich)
   - Loai dich vu: `STANDARD`
   - COD Amount: `250000` (ví dụ)
4. Chon **Tao van don** (khong kem pickup) → xac nhan `shipmentCode` duoc tra ve.
5. Chon **In phieu gui** → PDF/label hien ra.

> **Event duoc publish:** `shipment.created`
> **Reporting:** `shipmentsCreated` tang 1 trong KpiDaily.

---

## Buoc 3 - Merchant tao Pickup Request

**App:** Merchant Web (tiep tuc)

1. Vao man hinh **Quan ly pickup** hoac chon **Tao kem pickup** khi tao don.
2. Chon cac van don can lay (chon don vua tao).
3. Dat lich lay hang: ngay hom nay, hub `HCM01`.
4. Gui yeu cau → xac nhan `pickupRequestCode` duoc tao.

> **Event duoc publish:** `pickup.requested`

---

## Buoc 4 - Ops Approve Pickup va Assign Task

**App:** Ops Web `http://localhost:5173`
**Tai khoan:** `20000001`

### Approve Pickup
1. Vao **Lay hang** → danh sach yeu cau pickup → tim yeu cau vua tao.
2. Bam **Phe duyet** → pickup chuyen sang `APPROVED`.

> **Event duoc publish:** `pickup.approved`
> **Dispatch service** tu dong tao pickup task.

### Assign Pickup Task
1. Vao **Phan cong tac vu** → danh sach task → tim task pickup moi tao (status `PENDING_ASSIGNMENT` hoac `CREATED`).
2. Chon task → Bam **Phan cong** → chon courier `30000001`.
3. Xac nhan task chuyen sang `ASSIGNED`.

> **Event duoc publish:** `task.assigned` (taskType=PICKUP)
> **Reporting:** ShipmentStatusProjection chuyen sang `PICKUP_ASSIGNED`.

---

## Buoc 5 - Courier Scan Pickup

**App:** Courier Mobile (chay tren may that hoac simulator)
**Tai khoan:** `30000001`

1. Dang nhap.
2. Vao tab **Task** → xem task pickup moi duoc gan.
3. Vao task → Bam **Scan pickup** → quet ma van don hoac nhap tay.
4. Bam **Xac nhan** → task chuyen sang `IN_PROGRESS`.

**Tren Ops Web:** Vao **Hub scan** → **Scan pickup** → nhap shipment code hoac scan barcode. POST `/ops/scan/scans/pickup` duoc goi voi `idempotencyKey`.

> **Event duoc publish:** `scan.pickup_confirmed`
> **Reporting:** `pickupsCompleted` tang 1, shipment status → `PICKED_UP`.

---

## Buoc 6 - Scan Inbound/Outbound va tao Manifest

**App:** Ops Web `http://localhost:5173`

### Tao va Seal Manifest
1. Vao **Bao tai / Manifest** → **Tao moi**.
2. Chon hub goc `HCM01`, hub dich `HCM02`.
3. Them van don vao manifest.
4. Bam **Seal (Niem phong)** → manifest chuyen sang `SEALED`.

> **Event duoc publish:** `manifest.sealed`
> **Reporting:** shipment status → `IN_TRANSIT`.

### Scan Outbound (Xuat kho)
1. Vao **Hub scan** → **Scan outbound**.
2. Nhap hoac quet shipment code.
3. Xac nhan → ghi nhan xuat kho tai hub `HCM01`.

> **Event duoc publish:** `scan.outbound`
> **Reporting:** `scansOutbound` tang 1.

### Scan Inbound (Nhap kho tại hub đích)
1. Chuyen sang hub `HCM02` (doi voi demo co the dung cung hub hoac hub khac).
2. Vao **Hub scan** → **Scan inbound**.
3. Nhap shipment code.
4. Xac nhan → ghi nhan nhap kho.

> **Event duoc publish:** `scan.inbound`
> **Reporting:** `scansInbound` tang 1.

### Receive Manifest
1. Vao **Bao tai / Manifest** → tim manifest da `SEALED`.
2. Bam **Nhan bao tai (Receive)** → chuyen sang `RECEIVED`.

> **Event duoc publish:** `manifest.received`
> **Reporting:** shipment status → `INBOUND_AT_HUB`.

---

## Buoc 7 - Ops Assign Delivery Task

**App:** Ops Web

1. Vao **Phan cong tac vu** → task danh sach.
2. Tim task delivery duoc tao tu dong sau scan inbound.
3. Assign cho courier `30000001`.

> **Event duoc publish:** `task.assigned` (taskType=DELIVERY)
> **Reporting:** shipment status → `OUT_FOR_DELIVERY`.

---

## Buoc 8 - Courier Giao Hang Thanh Cong co POD va thu COD

**App:** Courier Mobile

### Thuc hien giao hang
1. Vao tab **Task** → chon task delivery.
2. Giao hang thanh cong: Bam **Giao thanh cong**.
3. Nhap:
   - Ten nguoi nhan / OTP (neu co)
   - Chup anh POD (neu co camera)
   - Xac nhan thu COD: `250000 VND`
4. Submit → `idempotencyKey` tu dong tao.

> **Event duoc publish:**
> - `delivery.delivered`
> - `cod.collected` (tu payment-service)
>
> **Reporting:**
> - `deliveriesDelivered` tang 1
> - Shipment status → `DELIVERED`
> - COD shipment status → `COD_COLLECTED`

---

## Buoc 9 - COD Settlement: Pending Remit → Batch QR → Confirm

**App:** Ops Web → **Quyet toan tai chinh / COD Settlement**

1. Vao **Nhanh / COD** → **Quyet toan COD**.
2. Chon ngay hom nay, hub `HCM01`, courier `30000001`.
3. Xem **Tong hop**: don `COLLECTED` xuat hien trong `Pending remit`.
4. Bam **Tao batch quyet toan** → nhap hub + courier + chon cac don.
5. He thong tra ve QR VietQR de chuyen khoan.
6. Sau khi chuyen, Bam **Xac nhan da nhan tien** → status `PAID`.

> **Event duoc publish:** `cod.remitted`
> **Reporting:** shipment status → `COD_REMITTED`.

---

## Buoc 10 - Don Giao That Bai → Sinh NDR → Quyet Dinh Return

**App:** Courier Mobile (doi voi don thu 2 da duoc tao tuong tu Buoc 2-7)

### Giao that bai
1. Vao task delivery thu 2.
2. Bam **Giao that bai**.
3. Chon ly do: vi du `KHACH_HANG_VANG_NHA` (khong co mat).
4. Submit.

> **Event duoc publish:**
> - `delivery.failed`
> - `ndr.created` (tu delivery-service)
>
> **Reporting:**
> - `deliveriesFailed` tang 1
> - `ndrCreated` tang 1
> - Shipment status → `DELIVERY_FAILED`

### Xu ly NDR
**App:** Ops Web → **NDR**

1. Tim NDR case vua tao → status `PENDING_RESOLUTION`.
2. Chon hanh dong: **Quyet dinh hoan hang (Return Decision)**.
3. Xac nhan.

### Khoi dong Return
1. Sau khi quyet dinh return, **return-case** duoc tao.
2. Vao **Quan ly hoan hang** → xac nhan return case.

> **Event duoc publish:** `return.started`
> **Reporting:** Shipment status → `RETURNING`.

---

## Buoc 11 - Hoan Tat Return

**App:** Ops Web → **Hoan hang**

1. Tim return case, status `IN_PROGRESS`.
2. Bam **Hoan tat hoan hang (Complete Return)**.
3. Xac nhan da nhan hang ve kho.

> **Event duoc publish:** `return.completed`
> **Reporting:** Shipment status → `RETURNED`.

---

## Buoc 12 - Public Tracking Hien Du Timeline

**App:** Public Tracking `http://localhost:5176` (hoac `/public/tracking` qua gateway)

1. Nhap shipment code cua don da giao thanh cong.
2. Xem timeline day du cac milestones:
   - `CREATED` (shipment tao)
   - `PICKUP_ASSIGNED` (task gan)
   - `PICKED_UP` (scan pickup)
   - `IN_TRANSIT` (manifest sealed)
   - `INBOUND_AT_HUB` (scan inbound / manifest received)
   - `OUT_FOR_DELIVERY` (delivery task gan)
   - `DELIVERED` (giao thanh cong)

3. Nhap shipment code cua don hoan hang:
   - Thay them: `DELIVERY_FAILED`, `RETURNING`, `RETURNED`.

---

## Buoc 13 - Ops Dashboard / Reporting Hien KPI Thay Doi

**App:** Ops Web → **Dashboard** (`http://localhost:5173/dashboard`)

1. Xem **Bo KPI** (dong du lieu tu `GET /ops/reporting/reports/ops-dashboard`):
   - `shipmentsCreated`: so don da tao hom nay
   - `pickupsCompleted`: so lan scan pickup
   - `deliveriesDelivered`: so don giao thanh cong
   - `deliveriesFailed`: so don that bai
   - `ndrCreated`: so NDR case
   - `scansInbound / scansOutbound`: so lan scan hub
   - `successRate`: ti le giao thanh cong (%)

2. Bam **Analytics Dashboard** (tu trang Dashboard chính) de xem bieu do:
   - Bar chart: chi so theo hub/courier
   - Pie chart: phan bo ket qua giao hang
   - Progress chart: ti le giao thanh cong / luot giao

3. Kiem tra **Chon loc bao cao**:
   - Loc theo ngay cu the → chi so khop voi ngay chay demo
   - Loc theo hub `HCM01` → chi so goi gon theo hub

4. Kiem tra **Trang thai trong / Error**:
   - Xoa filter hoac chon ngay khong co du lieu → hien empty state
   - Tat reporting service → dashboard hien loi ket noi

**Courier Mobile - Stats Screen:**
1. Vao tab **Thong ke** tren app Courier.
2. Xem:
   - Task hom nay: completed, assigned, cancelled (tu dispatch-service)
   - KPI tu reporting-service: `pickupsCompleted`, `deliveriesDelivered`, `deliveriesFailed`, `ndrCreated` cho courier hom nay

---

## Checklist Ket Thuc

| Hang muc | Ket qua mong doi |
|---|---|
| Khong con scaffold message o cac flow chinh | ✅ Tat ca flow goi API that |
| Courier delivery success/fail co idempotency | ✅ `idempotencyKey` trong moi request |
| COD settlement co source of truth trong payment-service | ✅ `CodRecord` + `CodSettlementBatch` |
| Return lifecycle co event start/complete | ✅ `return.started` + `return.completed` |
| Merchant action quan trong goi API that | ✅ Tao don, tao pickup → API that |
| Reporting KPI doc tu event/read model | ✅ `KpiDaily`/`KpiMonthly` tu event projection |
| Build/typecheck/smoke pass theo Wave 0 | ✅ Chay truoc demo |

---

## Luu Y Khi Demo

- **Duplicate event:** Bam nhieu lan nut scan van khong tang KPI 2 lan (projection ledger `AggregationJob` chon trung).
- **Multi-dimension KPI:** Mot event tang ca 3 cap do: tong (ALL), theo courier, theo hub.
- **Eventual consistency:** KPI co the tre 1-2 giay sau event vi la read model bat dong bo.
- **Auth:** Moi client group co prefix rieng (`/ops/`, `/merchant/`, `/courier/`, `/public/`) - khong the giao nhau.
- **Password:** Dang nhap API khong co rate limit tren local dev - dung tai khoan da tao dung quy tac so (8 so).
