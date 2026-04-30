# Nexus Express System - Project Overview

## 1. Thong tin de tai

**Ten he thong:** Nexus Express System

**Ten de tai:** Thiet ke va xay dung he thong quan ly kho va luan chuyen buu kien cho doanh nghiep chuyen phat nhanh theo kien truc microservices.

**Nguon tham khao nghiep vu:** He thong duoc xay dung dua tren cach van hanh tham khao tu JMS cua NEXUS EXPRESS SYSTEM. Muc tieu la mo phong cac nghiep vu cot loi cua doanh nghiep chuyen phat nhanh, bao gom tiep nhan don, lay hang, nhap/xuat kho hub, tao va niem phong bang ke trung chuyen, giao hang, xu ly giao that bai, hoan hang, tracking va bao cao van hanh.

**Muc dich tai lieu:** Tai lieu nay dung de:

- Giai thich tong quan de tai cho giang vien, nguoi review hoac thanh vien moi.
- Lam boi canh cho AI hieu dung pham vi, kien truc va nghiep vu khi ho tro phat trien he thong.
- Lam khung noi dung de viet bao cao, thuyet minh thiet ke va mo ta hien thuc.
- Giu thong nhat ve ten mien nghiep vu, service, luong du lieu va quy tac phat trien.

Luu y: Trong ma nguon hien tai van con mot so ten goi noi bo dang tien to `jms` hoac package name `@jms/...` do lich su scaffold ban dau. Khi viet bao cao va giao dien, ten san pham chinh nen dung la **Nexus Express System**.

## 2. Bai toan va muc tieu

Doanh nghiep chuyen phat nhanh can quan ly mot chuoi van hanh co nhieu diem cham: merchant tao don, nhan vien kho tiep nhan va dieu phoi, shipper lay/giao hang, cac hub luan chuyen buu kien, nguoi nhan tra cuu trang thai, bo phan van hanh theo doi KPI. Neu tat ca nghiep vu duoc gom vao mot ung dung monolithic, he thong kho mo rong, kho tach trach nhiem, kho mo phong bat dong bo va de phat sinh loi lan truyen.

Nexus Express System duoc thiet ke theo kien truc microservices de chia nho he thong theo mien nghiep vu. Moi service so huu du lieu rieng, giao tiep qua HTTP noi bo va domain events, tu do tang kha nang mo rong, bao tri va mo phong gan hon voi he thong logistics thuc te.

Muc tieu chinh:

- Quan ly vong doi van don tu luc tao don den khi giao thanh cong, giao that bai hoac hoan hang.
- Quan ly pickup request, task giao cho courier, scan tai cac diem van hanh va manifest trung chuyen giua hub.
- Cung cap cong thong tin rieng cho merchant, ops/admin, courier va khach hang tra cuu cong khai.
- Ap dung event-driven architecture de dong bo tracking, reporting va trang thai lien quan.
- Ap dung database-per-service, outbox pattern va idempotency cho cac thao tac de bi goi lap.
- Tao nen tang de viet bao cao ve microservices, domain decomposition, event-driven workflow va logistics process.

## 3. Pham vi chuc nang

### 3.1 Nhom nguoi dung

- **System Admin:** Quan ly tai khoan, cau hinh he thong, hub, zone, ly do NDR va du lieu danh muc.
- **Ops/Admin van hanh:** Theo doi dashboard, xu ly pickup, van don, manifest, scan hub, dieu phoi task, xu ly NDR va hoan hang.
- **Merchant:** Tao don, quan ly danh sach don, in phieu gui, theo doi trang thai don cua minh.
- **Courier/Shipper:** Xem task duoc giao, scan pickup/hub, cap nhat giao thanh cong, giao that bai, xem thong tin ca nhan va thong ke cong viec.
- **Khach hang cong khai:** Tra cuu trang thai van don bang ma van don.

### 3.2 Cac nghiep vu chinh

- Xac thuc va quan ly phien dang nhap.
- Quan ly danh muc hub, zone, NDR reason va config.
- Tao va cap nhat shipment.
- Tao yeu cau pickup va phe duyet pickup.
- Tao, assign, reassign, complete hoac cancel task.
- Ghi nhan scan pickup, inbound, outbound.
- Quan ly manifest: tao bang ke, them/xoa van don, seal, receive.
- Xu ly delivery attempt, delivery success, delivery fail.
- Tao NDR case khi giao that bai va quyet dinh giao lai/hoan hang.
- Xu ly return started va return completed.
- Public tracking va internal tracking timeline.
- Bao cao KPI theo ngay/thang, courier, hub, zone va trang thai van don.

## 4. Kien truc tong quan

He thong theo mo hinh microservices ket hop BFF gateway va event-driven communication.

```text
Client Apps
  |-- admin-web
  |-- ops-web
  |-- merchant-web
  |-- courier-mobile
  |-- public-tracking
          |
          v
Gateway BFF
          |
          +-- HTTP sync --> Domain Services
          |
          v
Domain Events via RabbitMQ exchange: domain.events
          |
          +-- tracking-service consumes events
          +-- reporting-service consumes events
          +-- other services consume selected events

Each service owns its own PostgreSQL database/schema through Prisma.
```

### 4.1 Nguyen tac kien truc

- **Database per service:** Moi service co database rieng, khong truy cap truc tiep database cua service khac.
- **Service ownership ro rang:** Shipment service so huu `current_status`, scan service so huu scan event va `current_location`, tracking/reporting chi la read model.
- **Gateway as entry point:** Client goi Gateway BFF, Gateway forward request den service phu hop.
- **Event-driven synchronization:** Cac thay doi nghiep vu quan trong duoc publish thanh domain event len RabbitMQ.
- **Outbox pattern:** Service ghi event vao bang outbox trong cung transaction voi thay doi nghiep vu, sau do relay publish sang RabbitMQ.
- **Idempotency:** Cac thao tac scan va delivery success/fail su dung `idempotencyKey` de tranh tao trung event khi client retry.
- **Read model projection:** Tracking va reporting doc domain events de tao view toi uu cho tra cuu va dashboard.

## 5. Cong nghe su dung

### 5.1 Backend

- **Node.js + TypeScript:** Nen tang chay backend va ngon ngu chinh.
- **NestJS 10:** Framework backend cho controller, module, dependency injection va service layer.
- **Prisma ORM:** Mapping voi PostgreSQL, quan ly schema rieng cho tung service.
- **PostgreSQL 16:** He quan tri CSDL chinh cho cac service.
- **RabbitMQ 3.13:** Message broker cho domain events, queue, retry va dead-letter flow.
- **amqplib:** Thu vien Node.js de publish/consume RabbitMQ.
- **Opaque token session:** Auth service hien tai dung opaque access token va refresh token thay vi JWT.
- **Docker Compose:** Khoi tao local infrastructure gom PostgreSQL va RabbitMQ.

### 5.2 Frontend web

- **React 18:** Xay dung giao dien web.
- **Vite 5:** Dev server va build tool cho web apps.
- **TypeScript:** Type safety cho UI.
- **React Router:** Dieu huong client-side trong admin-web va ops-web.
- **TanStack React Query:** Quan ly server state, caching va invalidation.
- **Zustand:** Quan ly client state nhu auth session va UI state.
- **React Hook Form:** Ho tro form nhap lieu o mot so man hinh.

### 5.3 Mobile

- **Expo 54 + React Native 0.81:** Xay dung ung dung courier-mobile.
- **Expo Camera:** Ho tro quet ma trong cac flow van hanh.
- **Expo Secure Store:** Luu tru thong tin nhay cam tren thiet bi.
- **React Navigation:** Dieu huong trong mobile app.
- **TanStack React Query + Zustand:** Dong bo server state va client state tren mobile.

### 5.4 DevOps va cong cu

- **Docker / Docker Compose:** Chay PostgreSQL va RabbitMQ local.
- **PowerShell scripts:** Script khoi dong, migrate, seed va start nhieu service tren Windows.
- **Makefile:** Shortcut cho mot so lenh phat trien.
- **Package manager:** Repo hien co ca `package-lock.json`, `pnpm-lock.yaml` o mot so service/app; khi phat trien nen thong nhat cach cai dat theo tung module hien co.

## 6. Cau truc repository

```text
logistics-management-system/
  apps/
    admin-web/          Web quan tri he thong va danh muc
    ops-web/            Web van hanh kho, shipment, pickup, manifest, task
    merchant-web/       Web cho merchant tao va theo doi don
    courier-mobile/     Ung dung mobile cho shipper/courier
    public-tracking/    Web tra cuu van don cong khai

  services/
    gateway-bff/        Entry point cho client apps, proxy den backend services
    auth-service/       Xac thuc, session, token, user account
    masterdata-service/ Hub, zone, config, NDR reason
    shipment-service/   Shipment write model va current status
    pickup-service/     Pickup request lifecycle
    dispatch-service/   Task workflow va courier assignment
    manifest-service/   Manifest trung chuyen giua hub
    scan-service/       Scan event va current location
    delivery-service/   Delivery attempt, POD, NDR, return
    tracking-service/   Tracking timeline va current tracking read model
    reporting-service/  KPI, dashboard va bao cao van hanh

  contracts/
    events/             Danh sach event, naming convention va event contracts

  docs/
    architecture/       Tai lieu kien truc bo sung
    runbook/            Huong dan local dev, migrations, test accounts
    service-description/ Mo ta chi tiet theo service

  infra/
    dev/                Docker Compose va script init database

  scripts/              PowerShell scripts de dev, migrate, seed, start services
```

## 7. Mo ta cac ung dung client

| App | Vai tro | Cong nghe |
| --- | --- | --- |
| `admin-web` | Quan ly user, hub, zone, config, NDR reason va dashboard admin | React, Vite, React Query, Zustand |
| `ops-web` | Man hinh van hanh chinh cho ops: shipment, pickup, manifest, scan, task, NDR, tracking, dashboard | React, Vite, React Query, Zustand |
| `merchant-web` | Cho merchant tao don, quan ly don, in shipping label | React, Vite |
| `courier-mobile` | Cho courier xem task, scan, cap nhat giao hang, tra cuu, thong ke | Expo, React Native, React Query, Zustand |
| `public-tracking` | Cho khach hang tra cuu trang thai van don cong khai | React, Vite |

## 8. Mo ta cac backend service

| Service | Port mac dinh | Trach nhiem chinh | Database |
| --- | ---: | --- | --- |
| `gateway-bff` | 3000 | Entry point cho client, proxy request theo group `/public`, `/merchant`, `/ops`, `/courier` | Khong so huu DB |
| `auth-service` | 3010 | Login, refresh, logout, introspect, user account | `auth_db` |
| `masterdata-service` | 3001 | Hub, zone, NDR reason, config | `masterdata_db` |
| `shipment-service` | 3002 | Tao/cap nhat/huy shipment, change request, state machine shipment | `shipment_db` |
| `pickup-service` | 3003 | Pickup request, approve, cancel, complete | `pickup_db` |
| `dispatch-service` | 3004 | Task pickup/delivery/return, assign/reassign/complete/cancel | `dispatch_db` |
| `manifest-service` | 3005 | Manifest, add/remove shipment, seal, receive | `manifest_db` |
| `scan-service` | 3006 | Scan pickup/inbound/outbound, current location, idempotency | `scan_db` |
| `delivery-service` | 3007 | Delivery attempt, success/fail, POD, NDR, return | `delivery_db` |
| `tracking-service` | 3008 | Public/internal tracking read model, timeline, current view | `tracking_db` |
| `reporting-service` | 3009 | KPI, dashboard, aggregate theo courier/hub/zone/status | `reporting_db` |

## 9. Domain data ownership

| Mien du lieu | Service so huu | Ghi chu |
| --- | --- | --- |
| User, session, token | `auth-service` | Quan ly tai khoan va phien dang nhap |
| Hub, zone, config, NDR reason | `masterdata-service` | Du lieu danh muc dung chung |
| Shipment va current status | `shipment-service` | Source of truth cho trang thai nghiep vu cua van don |
| Pickup request | `pickup-service` | Source of truth cho yeu cau lay hang |
| Task va courier assignment | `dispatch-service` | Source of truth cho cong viec cua courier |
| Manifest | `manifest-service` | Source of truth cho bang ke luan chuyen giua hub |
| Scan event va current location | `scan-service` | Source of truth cho vi tri hien tai va log scan |
| Delivery attempt, NDR, return | `delivery-service` | Source of truth cho ket qua giao va xu ly ngoai le giao hang |
| Tracking timeline/current view | `tracking-service` | Read model tao tu event, khong phai source of truth |
| KPI/reporting | `reporting-service` | Read model/aggregate tao tu event |

## 10. Domain events chinh

RabbitMQ exchange chinh: `domain.events`.

Danh sach event milestone dang duoc dinh huong su dung:

1. `shipment.created`
2. `pickup.requested`
3. `pickup.approved`
4. `task.assigned` voi `taskType=PICKUP`
5. `scan.pickup_confirmed`
6. `manifest.sealed`
7. `manifest.received`
8. `scan.outbound`
9. `scan.inbound`
10. `task.assigned` voi `taskType=DELIVERY`
11. `delivery.attempted`
12. `delivery.delivered`
13. `delivery.failed`
14. `ndr.created`
15. `return.started`
16. `return.completed`

Cac event nay giup tracking-service tao timeline, reporting-service tao KPI va cac service khac cap nhat state lien quan.

## 11. Luong nghiep vu tieu bieu

### 11.1 Tao don va pickup

1. Merchant tao shipment qua `merchant-web`.
2. Gateway forward request den `shipment-service`.
3. `shipment-service` tao shipment va publish `shipment.created`.
4. Merchant hoac ops tao pickup request qua `pickup-service`.
5. Ops approve pickup request.
6. `pickup-service` publish `pickup.approved`.
7. `dispatch-service` consume event va tao/assign pickup task cho courier.
8. Courier nhan task tren `courier-mobile`.
9. Courier scan pickup, `scan-service` ghi scan va publish `scan.pickup_confirmed`.
10. `shipment-service`, `tracking-service`, `reporting-service` cap nhat read model/trang thai tu event.

### 11.2 Luan chuyen hub va manifest

1. Ops tao manifest gom nhieu shipment.
2. Ops seal manifest tai hub goc.
3. `manifest-service` publish `manifest.sealed`.
4. Khi hang roi hub, ops/courier scan outbound qua `scan-service`.
5. Khi hang den hub dich, ops scan inbound.
6. Hub dich receive manifest, `manifest-service` publish `manifest.received`.
7. Tracking timeline hien thi cac moc luan chuyen.

### 11.3 Giao hang va NDR/return

1. `dispatch-service` tao hoac assign delivery task.
2. Courier giao hang va cap nhat ket qua tren mobile.
3. Neu thanh cong, `delivery-service` ghi attempt/POD va publish `delivery.delivered`.
4. Neu that bai, `delivery-service` ghi attempt fail va publish `delivery.failed`.
5. He thong tao NDR case khi can xu ly giao lai hoac hoan hang.
6. Neu hoan hang, service publish `return.started` va `return.completed` khi hoan tat.
7. Tracking va reporting duoc cap nhat tu domain events.

## 12. API entry convention

Client khong nen goi truc tiep domain service trong moi truong tich hop. Client goi qua `gateway-bff`.

Gateway forward theo nhom:

```text
/public/...
/merchant/...
/ops/...
/courier/...
```

Vi du:

```text
GET  /public/tracking/...
POST /merchant/shipment/...
POST /ops/scan/...
GET  /courier/tasks/...
```

Quy tac nay giup tach contract theo tung loai client va de bo sung auth/authorization tai gateway.

## 13. Yeu cau phi chuc nang

- **Mo rong doc lap:** Moi service co the duoc scale rieng theo tai nghiep vu.
- **Giam coupling:** Service giao tiep qua contract HTTP va event, khong chia se database.
- **Kha nang chong retry:** Idempotency giup client retry an toan voi scan va delivery action.
- **Quan sat trang thai:** Tracking/reporting read model giup doc nhanh ma khong lam nang write service.
- **Tinh nhat quan cuoi cung:** Event-driven workflow chap nhan eventual consistency giua cac read model.
- **De bao tri:** Domain decomposition giup tach code theo nghiep vu.
- **De trinh bay hoc thuat:** Kien truc the hien duoc cac pattern microservices nhu API Gateway/BFF, database per service, outbox, event bus, CQRS-like read model.

## 14. Huong dan cho AI khi ho tro phat trien

Khi AI ho tro sua code, viet bao cao hoac thiet ke tinh nang cho Nexus Express System, can tuan thu cac nguyen tac sau:

- Dung ten he thong la **Nexus Express System** trong tai lieu, UI va bao cao.
- Hieu day la he thong logistics/chuyen phat nhanh tham khao JMS cua J&T, khong phai clone chinh thuc hay tich hop noi bo voi J&T.
- Khong de service doc/ghi truc tiep database cua service khac.
- Neu tinh nang lam thay doi trang thai nghiep vu, can xac dinh service nao la source of truth.
- Neu thay doi can duoc tracking/reporting nhin thay, can xem co can publish/consume domain event khong.
- Cac thao tac co nguy co retry nhu scan, delivery success/fail nen co `idempotencyKey`.
- Gateway BFF la entry point cho client; client-side API nen goi gateway URL.
- Tracking-service va reporting-service la read model, khong nen chua business logic write-side.
- Nen giu route, DTO, type va event naming nhat quan voi cac file trong `contracts/events`.
- Khi viet bao cao, nen nhan manh ly do dung microservices: tach mien nghiep vu, doc lap du lieu, bat dong bo, scale doc lap va de mo phong chuoi van hanh thuc te.

## 15. Goi y cau truc bao cao

Tai lieu bao cao co the trien khai theo cac chuong:

1. **Gioi thieu de tai:** Ly do chon de tai, bai toan doanh nghiep chuyen phat nhanh, muc tieu va pham vi.
2. **Co so ly thuyet:** Microservices, API Gateway/BFF, event-driven architecture, RabbitMQ, database per service, outbox pattern, eventual consistency.
3. **Khao sat va phan tich nghiep vu:** Vai tro nguoi dung, quy trinh tao don, pickup, kho hub, manifest, delivery, NDR, return va tracking.
4. **Thiet ke he thong:** Kien truc tong quan, so do service, data ownership, domain events, database schema theo service, API convention.
5. **Thiet ke giao dien va chuc nang:** Admin/Ops/Merchant/Public/Courier app, cac man hinh chinh va luong thao tac.
6. **Cai dat va hien thuc:** Cong nghe, cau truc source code, mo ta tung service, cach chay local, seed data.
7. **Kiem thu va danh gia:** Test case theo luong nghiep vu, kiem thu API, kiem thu UI, danh gia uu/nhuoc diem.
8. **Ket luan va huong phat trien:** Tong ket ket qua, han che, de xuat mo rong nhu route optimization, realtime notification, map, barcode/QR nang cao, CI/CD va observability.

## 16. Huong phat trien tiep theo

- Chuan hoa branding tu `jms` sang `nexus` trong UI, README va package khi can.
- Bo sung authentication/authorization day du tai gateway va tung service noi bo.
- Bo sung contract test cho API va event payload.
- Bo sung observability: structured logging, tracing, metrics va dashboard health.
- Bo sung notification service cho merchant/courier/ops.
- Bo sung map/geocoding, toi uu tuyen giao va phan cong courier.
- Bo sung CI/CD va deployment manifest cho moi service.
- Bo sung diagram kien truc, sequence diagram va ERD cho bao cao.

