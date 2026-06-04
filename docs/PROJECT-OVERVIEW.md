# Nexus Express System - Project Overview

## 1. Mục đích tài liệu

Tài liệu này tổng hợp bức tranh chuẩn của hệ thống **Nexus Express System** để làm nền cho báo cáo, tài liệu thiết kế, tài liệu vận hành và tài liệu hướng dẫn phát triển.

Nội dung tập trung vào:

- Bối cảnh bài toán logistics mà hệ thống giải quyết.
- Kiến trúc tổng quan và cách các service phối hợp.
- Phạm vi chức năng theo từng nhóm người dùng.
- Vai trò của từng ứng dụng frontend và backend service.
- Quy tắc sở hữu dữ liệu, event, trạng thái vận đơn và luồng nghiệp vụ chính.
- Ghi chú triển khai thực tế trong repository hiện tại.

Lưu ý đặt tên: trong mã nguồn vẫn còn một số package dùng tiền tố `@NEXUS/...` do lịch sử scaffold. Khi viết báo cáo hoặc tài liệu chính thức, tên sản phẩm nên thống nhất là **Nexus Express System**.

## 2. Tổng quan đề tài

**Nexus Express System** là hệ thống quản lý vận hành logistics/chuyển phát nhanh, mô phỏng các nghiệp vụ cốt lõi của doanh nghiệp last-mile và hub-and-spoke logistics.

Hệ thống quản lý toàn bộ vòng đời vận đơn từ lúc merchant tạo đơn, điều phối lấy hàng, xử lý tại hub, trung chuyển, giao hàng, xử lý giao thất bại, hoàn hàng, thu/đối soát COD, cho đến tracking công khai và báo cáo vận hành.

Thông tin chính:

| Hạng mục | Mô tả |
| --- | --- |
| Tên hệ thống | Nexus Express System |
| Loại dự án | Hệ thống quản lý logistics/chuyển phát nhanh |
| Kiến trúc | Microservices + API Gateway/BFF + Event-driven architecture |
| Backend chính | NestJS, TypeScript, Prisma, PostgreSQL |
| Frontend web | React, Vite, TypeScript |
| Mobile | Expo, React Native |
| Messaging | RabbitMQ topic exchange `domain.events` |
| Object storage | MinIO/S3-compatible storage cho ảnh POD |
| Local infrastructure | Docker Compose |

## 3. Bài toán và mục tiêu

Trong vận hành logistics, một vận đơn đi qua nhiều điểm chạm: merchant tạo đơn, ops duyệt/lập pickup, courier lấy hàng, hub scan inbound/outbound, manifest trung chuyển, courier giao hàng, người nhận kiểm tra trạng thái, bộ phận vận hành theo dõi KPI và COD.

Nếu toàn bộ nghiệp vụ nằm trong một khối monolithic, hệ thống dễ bị rối ở các phần có tần suất thay đổi cao như trạng thái vận đơn, scan, tracking, reporting và xử lý bất đồng bộ. Vì vậy dự án chọn hướng microservices để tách miền nghiệp vụ, mỗi service sở hữu dữ liệu riêng và phối hợp qua HTTP nội bộ cùng domain events.

Mục tiêu chính:

- Quản lý vòng đời vận đơn từ tạo đơn đến giao thành công, giao thất bại hoặc hoàn hàng.
- Tách rõ các miền nghiệp vụ: shipment, pickup, dispatch, manifest, scan, delivery, tracking, reporting, payment, pricing, auth và master data.
- Cung cấp giao diện riêng cho admin, ops, merchant, courier và người tra cứu công khai.
- Dùng event-driven architecture để đồng bộ tracking, reporting và trạng thái liên quan.
- Áp dụng database-per-service, outbox pattern và idempotency cho các thao tác dễ bị gọi lặp.
- Tạo nền tảng đủ rõ để phân tích kiến trúc microservices, domain decomposition và quy trình logistics trong tài liệu tốt nghiệp/báo cáo kỹ thuật.

## 4. Nhóm người dùng

| Nhóm người dùng | Vai trò chính |
| --- | --- |
| System Admin | Quản lý tài khoản, phân quyền, hub, zone, NDR reason, cấu hình hệ thống và dữ liệu danh mục. |
| Ops/nhân viên vận hành | Theo dõi dashboard, xử lý shipment, pickup, task assignment, manifest, scan hub, NDR, return và COD settlement. |
| Merchant | Tạo đơn, quản lý đơn, in vận đơn, tạo pickup request, theo dõi trạng thái và gửi yêu cầu thay đổi. |
| Courier/Shipper | Xem task được giao, scan pickup/hub, cập nhật giao thành công hoặc giao thất bại, chụp POD, nhập OTP và đồng bộ offline queue. |
| Khách tra cứu công khai | Tra cứu timeline vận đơn bằng mã vận đơn, không cần đăng nhập. |

## 5. Phạm vi chức năng

Các nghiệp vụ chính đang được hệ thống bao phủ:

- Đăng nhập, refresh/logout session, introspect token và quản lý user.
- Quản lý hub, zone, merchant profile, NDR reason và cấu hình.
- Tạo/cập nhật/hủy vận đơn, lưu snapshot pricing khi tạo đơn.
- Tính phí vận chuyển dựa trên service type, khối lượng, kích thước, tuyến vùng, khai giá và COD.
- Tạo và duyệt pickup request.
- Tạo, gán, phân công lại, hoàn tất hoặc hủy task cho courier.
- Scan pickup, inbound, outbound và cập nhật vị trí hiện tại.
- Quản lý manifest/bag: tạo, thêm/xóa shipment, seal, receive, unseal.
- Giao hàng thành công với POD/OTP hoặc giao thất bại với NDR.
- Xử lý return started/return completed.
- Thu COD, tạo batch settlement, tạo VietQR/SePay webhook và xác nhận remittance.
- Tracking công khai/nội bộ theo timeline.
- Reporting KPI theo ngày/tháng, courier, hub, zone và trạng thái vận đơn.
- Chat realtime trong gateway BFF cho các kịch bản hỗ trợ/nội bộ nếu module được bật.

## 6. Kiến trúc tổng quan

Hệ thống đi theo mô hình client apps gọi vào một gateway BFF, gateway forward đến domain services, còn các thay đổi nghiệp vụ quan trọng được phát tán qua RabbitMQ.

```text
Client Apps
  admin-web
  ops-web
  merchant-web
  courier-mobile
  public-tracking
        |
        v
gateway-bff
        |
        +-- HTTP sync --> domain services
        |
        v
RabbitMQ topic exchange: domain.events
        |
        +-- tracking-service projects timeline/current tracking
        +-- reporting-service projects KPI/read models
        +-- domain services consume selected events

Each domain service owns its own PostgreSQL database through Prisma.
```

Nguyên tắc kiến trúc:

| Nguyên tắc | Ý nghĩa |
| --- | --- |
| Database per service | Mỗi service sở hữu database/schema riêng, không service nào đọc/ghi DB của service khác. |
| Gateway/BFF entry point | Frontend và mobile gọi `gateway-bff`, không gọi trực tiếp domain service. |
| Event-driven synchronization | Các mốc nghiệp vụ được publish thành domain event để service khác cập nhật bất đồng bộ. |
| Outbox pattern | Service ghi business data và event record trước, outbox relay publish RabbitMQ sau. |
| Clear ownership | `shipment-service` sở hữu trạng thái nghiệp vụ của vận đơn; `scan-service` sở hữu scan/current location; tracking/reporting là read model. |
| Idempotency | Các thao tác scan, delivery, payment/reporting dùng key/ledger để chống xử lý trùng khi retry. |

## 7. Cấu trúc repository

```text
logistics-management-system/
  apps/
    admin-web/          Web quản trị hệ thống và dữ liệu danh mục
    ops-web/            Web vận hành kho, shipment, pickup, manifest, task, COD
    merchant-web/       Web cho merchant tạo và theo dõi đơn
    courier-mobile/     Ứng dụng Expo/React Native cho courier
    public-tracking/    Web tra cứu vận đơn công khai

  services/
    gateway-bff/        API Gateway/BFF, media upload, chat, marketplace integration
    auth-service/       User account, session, token, permission profile
    masterdata-service/ Hub, zone, config, NDR reason, merchant profile
    shipment-service/   Shipment lifecycle và current status
    pickup-service/     Pickup request lifecycle
    dispatch-service/   Task và courier assignment
    manifest-service/   Manifest/bag, seal, receive, unseal
    scan-service/       Scan event và current location
    delivery-service/   Delivery attempt, POD, OTP, NDR, return
    tracking-service/   Tracking timeline/current tracking read model
    reporting-service/  KPI/dashboard read model
    payment-service/    COD record, settlement batch, SePay webhook
    pricing-service/    Quote/rate calculation, không dùng database riêng

  packages/
    messaging/          Shared messaging utilities
    shared/             Shared types/constants
    testing/            Test helpers
    ui/                 Shared UI components

  contracts/
    events/             Event naming và payload examples
    openapi/            OpenAPI contracts theo service

  docs/
    architecture/       Tài liệu kiến trúc
    runbook/            Hướng dẫn local dev, deploy, migration, troubleshooting
    service-description/ Mô tả chi tiết một số service/API

  infra/
    dev/                Docker Compose, PostgreSQL init DB, RabbitMQ/MinIO/Redis
    prod/               Mẫu cấu hình production

  scripts/              Script hỗ trợ dev/migration/seed/start services
```

Ghi chú triển khai: repository hiện không có `package.json` root; mỗi app/service có package script riêng. Khi build/test/start nên chạy lệnh trong đúng thư mục app/service tương ứng hoặc dùng các script tổng hợp như `run-all.ps1`, `run-all-mac.sh`, `Makefile`.

## 8. Tech stack

### Backend

| Công nghệ | Vai trò |
| --- | --- |
| Node.js + TypeScript | Runtime và ngôn ngữ chính cho backend. |
| NestJS 10 | Module, controller, dependency injection và service layer. |
| Prisma | ORM/schema mapping cho PostgreSQL. |
| PostgreSQL 16 | CSDL chính theo mô hình database-per-service. |
| RabbitMQ 3.13 | Message broker cho domain events, queue, retry/DLQ. |
| amqplib | RabbitMQ client ở các service có publish/consume event. |
| MinIO/S3 SDK | Lưu ảnh POD và media upload. |
| Redis | Hỗ trợ module chat/realtime trong gateway BFF. |

### Frontend web

| Công nghệ | Vai trò |
| --- | --- |
| React 18 | Xây dựng web apps. |
| Vite 5 | Dev server và bundler. |
| TypeScript | Type safety. |
| React Router | Routing cho admin-web và ops-web. |
| TanStack React Query | Server state/caching ở các app giàu nghiệp vụ. |
| Zustand | Client state như auth/session/UI state. |
| React Hook Form + Zod | Form và validation ở admin/ops/courier tùy module. |
| Recharts | Biểu đồ dashboard/reporting. |

### Mobile

| Công nghệ | Vai trò |
| --- | --- |
| Expo 54 | Runtime/tooling cho courier-mobile. |
| React Native 0.81 | Mobile UI. |
| React Navigation | Điều hướng trong mobile app. |
| Expo Camera | Camera/scan trong các flow vận hành. |
| Expo Secure Store | Lưu thông tin nhạy cảm trên thiết bị. |
| NetInfo + offline queue | Hỗ trợ retry khi mất mạng. |

## 9. Ứng dụng client

| App | Người dùng | Vai trò | Script chính |
| --- | --- | --- | --- |
| `admin-web` | Admin | Quản lý user, role, hub, zone, merchant profile, config, NDR reason. | `pnpm run dev`, `pnpm run build`, `pnpm run test:smoke`, `pnpm run test:e2e` |
| `ops-web` | Ops | Dashboard, shipment, pickup, task, manifest, scan, NDR, return, tracking, COD. | `pnpm run dev`, `pnpm run build`, `pnpm run test:smoke` |
| `merchant-web` | Merchant | Tạo đơn, quản lý đơn, in vận đơn, tạo pickup, tracking, change request. | `pnpm run dev`, `pnpm run build` |
| `courier-mobile` | Courier | Task list, scan, delivery success/fail, POD/OTP, stats, offline retry. | `pnpm run start`, `pnpm run typecheck`, `pnpm run test:maestro` |
| `public-tracking` | Guest/người nhận | Tra cứu vận đơn công khai bằng mã vận đơn. | `pnpm run dev`, `pnpm run build` |

Frontend gọi gateway qua biến môi trường như `VITE_GATEWAY_BFF_URL` hoặc `EXPO_PUBLIC_GATEWAY_BASE_URL`.

## 10. Backend services

| Service | Port | Database | Trách nhiệm chính |
| --- | ---: | --- | --- |
| `gateway-bff` | 3000 | Không sở hữu domain DB; module chat dùng `chat_db` và Redis | Entry point cho client, proxy `/merchant`, `/ops`, `/courier`, `/public`, media upload, marketplace integration, chat realtime. |
| `masterdata-service` | 3001 | `masterdata_db` | Hub, zone, config, NDR reason, merchant profile. |
| `shipment-service` | 3002 | `shipment_db` | Shipment lifecycle, change request, current status, state machine, pricing snapshot. |
| `pickup-service` | 3003 | `pickup_db` | Pickup request và pickup item lifecycle. |
| `dispatch-service` | 3004 | `dispatch_db` | Task, task assignment, courier assignment/reassignment và realtime task update. |
| `manifest-service` | 3005 | `manifest_db` | Manifest, manifest item, seal, receive, unseal. |
| `scan-service` | 3006 | `scan_db` | Scan pickup/inbound/outbound, current location, idempotency. |
| `delivery-service` | 3007 | `delivery_db` | Delivery attempt, POD, OTP, NDR, return case, idempotency. |
| `tracking-service` | 3008 | `tracking_db` | Timeline/current tracking read model, public/internal tracking query. |
| `reporting-service` | 3009 | `reporting_db` | KPI daily/monthly, shipment status projection, aggregation job chống trùng event. |
| `auth-service` | 3010 | `auth_db` | User account, auth session, opaque token, mobile permission profile/override, admin audit. |
| `payment-service` | 3011 | `payment_db` | COD record, settlement batch/item, payment webhook, idempotency, COD events. |
| `pricing-service` | 3012 | Không có DB riêng | Tính quote/rate theo service type, weight, dimension, zone, declared value và COD. |

## 11. Data ownership

| Miền dữ liệu | Service sở hữu | Ghi chú |
| --- | --- | --- |
| User, session, token, permission profile | `auth-service` | Source of truth cho đăng nhập và session. |
| Hub, zone, config, NDR reason, merchant profile | `masterdata-service` | Dữ liệu danh mục dùng chung. |
| Shipment và `currentStatus` | `shipment-service` | Source of truth cho trạng thái nghiệp vụ của vận đơn. |
| Pricing quote/rule | `pricing-service` | Tính phí tại thời điểm tạo đơn; shipment lưu snapshot trong metadata. |
| Pickup request | `pickup-service` | Source of truth cho yêu cầu lấy hàng. |
| Task và courier assignment | `dispatch-service` | Source of truth cho công việc được giao. |
| Manifest/bag/seal/receive | `manifest-service` | Source of truth cho luân chuyển theo bao/manifest. |
| Scan event và current location | `scan-service` | Source of truth cho vị trí vật lý và lịch sử scan. |
| Delivery attempt, POD, OTP, NDR, return | `delivery-service` | Source of truth cho kết quả giao hàng và xử lý ngoại lệ. |
| COD record/settlement/payment event | `payment-service` | Source of truth cho COD settlement. |
| Timeline/current tracking | `tracking-service` | Read model từ event, không quyết định trạng thái gốc. |
| KPI/reporting | `reporting-service` | Read model/aggregate từ event. |
| Chat conversation/message | `gateway-bff` chat module | Dùng `chat_db` và Redis khi bật tính năng chat. |

## 12. Database architecture

Local PostgreSQL được khởi tạo qua `infra/dev/postgres/init-multiple-dbs.sql`.

Các database domain chính:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE masterdata_db;
CREATE DATABASE shipment_db;
CREATE DATABASE pickup_db;
CREATE DATABASE dispatch_db;
CREATE DATABASE manifest_db;
CREATE DATABASE scan_db;
CREATE DATABASE delivery_db;
CREATE DATABASE tracking_db;
CREATE DATABASE reporting_db;
CREATE DATABASE payment_db;
CREATE DATABASE chat_db;
```

`pricing-service` hiện không có database riêng. Các service có Prisma schema riêng, ví dụ:

| Service | Model chính |
| --- | --- |
| `auth-service` | `UserAccount`, `AuthSession`, `MobilePermissionProfile`, `MobilePermissionOverride`, `AdminAuditLog`, `OutboxEvent` |
| `masterdata-service` | `Hub`, `Zone`, `NdrReason`, `Config`, `MerchantProfile`, `AdminAuditLog`, `OutboxEvent` |
| `shipment-service` | `Shipment`, `ChangeRequest`, `OutboxEvent` |
| `pickup-service` | `PickupRequest`, `PickupItem`, `OutboxEvent` |
| `dispatch-service` | `Task`, `TaskAssignment`, `OpsAuditLog`, `OutboxEvent` |
| `manifest-service` | `Manifest`, `ManifestItem`, `SealRecord`, `ReceiveRecord`, `OpsAuditLog`, `OutboxEvent` |
| `scan-service` | `ScanEvent`, `CurrentLocation`, `IdempotencyRecord`, `OpsAuditLog`, `OutboxEvent` |
| `delivery-service` | `DeliveryAttempt`, `Pod`, `OtpRecord`, `NdrCase`, `ReturnCase`, `IdempotencyRecord`, `OpsAuditLog`, `OutboxEvent` |
| `tracking-service` | `TimelineEvent`, `TrackingCurrent`, `TrackingIndex` |
| `reporting-service` | `KpiDaily`, `KpiMonthly`, `AggregationJob`, `ShipmentStatusProjection` |
| `payment-service` | `CodRecord`, `CodSettlementBatch`, `CodSettlementPaymentEvent`, `CodSettlementItem`, `IdempotencyRecord`, `OutboxEvent` |

## 13. Event-driven architecture

RabbitMQ exchange chính:

```text
Exchange: domain.events
Type: topic
Queue naming: {service-name}.q
Retry/DLQ convention: {service-name}.retry.* / {service-name}.dlq
```

Domain events chính:

| Nhóm | Event tiêu biểu |
| --- | --- |
| Shipment | `shipment.created` |
| Pickup | `pickup.requested`, `pickup.approved` |
| Dispatch | `task.assigned` |
| Manifest | `manifest.sealed`, `manifest.received`, `manifest.unsealed` |
| Scan | `scan.pickup_confirmed`, `scan.inbound`, `scan.outbound` |
| Delivery | `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed` |
| Payment | `cod.collected`, `cod.collection_failed`, `cod.remitted` |
| Auth/Master data | `auth.session_created`, `auth.session_refreshed`, `auth.session_revoked`, `masterdata.updated`, `ndr-reason.updated` |

Luồng publish/consume ở mức tổng quan:

| Service | Publish | Consume |
| --- | --- | --- |
| `shipment-service` | `shipment.created` | Pickup/task/scan/manifest/delivery/NDR/return events để cập nhật `currentStatus`. |
| `pickup-service` | `pickup.requested`, `pickup.approved` | Tùy flow pickup hiện hành. |
| `dispatch-service` | `task.assigned` | `pickup.approved`, `delivery.failed`, `return.started`, `return.completed`. |
| `manifest-service` | `manifest.sealed`, `manifest.received`, `manifest.unsealed` | `scan.outbound`. |
| `scan-service` | `scan.pickup_confirmed`, `scan.inbound`, `scan.outbound` | `manifest.sealed`. |
| `delivery-service` | `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed` | `task.assigned`. |
| `payment-service` | `cod.collected`, `cod.collection_failed`, `cod.remitted` | `shipment.created`. |
| `tracking-service` | Không publish | Business events để dựng timeline/current tracking. |
| `reporting-service` | Không publish | Business events để aggregate KPI và projection. |

## 14. Vòng đời vận đơn

Vòng đời vận đơn được quyết định bởi `shipment-service`. Các service khác phát sinh sự kiện nghiệp vụ; `shipment-service` tiêu thụ event hợp lệ và cập nhật trạng thái theo state machine.

Luồng chuẩn:

```text
CREATED
-> UPDATED / PICKUP_REQUESTED
-> TASK_ASSIGNED
-> PICKUP_COMPLETED
-> MANIFEST_SEALED
-> SEND_GOODS
-> IN_TRANSIT
-> SCAN_INBOUND
-> SCAN_OUTBOUND / TASK_ASSIGNED
-> DELIVERED
```

Luồng giao thất bại/hoàn:

```text
DELIVERY_FAILED
-> NDR_CREATED
-> RETURN_STARTED
-> RETURN_COMPLETED
```

Trạng thái terminal thường gặp:

- `DELIVERED`
- `RETURN_COMPLETED`
- `CANCELLED`

Các trạng thái vận hành phụ có thể xuất hiện tùy flow:

- `MANIFEST_RECEIVED`
- `MANIFEST_UNSEALED`
- `INVENTORY_CHECK`
- `EXCEPTION`

## 15. Luồng nghiệp vụ tiêu biểu

### 15.1 Tạo đơn và pickup

1. Merchant tạo shipment trên `merchant-web`.
2. `gateway-bff` forward request đến `shipment-service`.
3. `shipment-service` gọi/tính pricing, tạo shipment và publish `shipment.created`.
4. Merchant hoặc ops tạo pickup request qua `pickup-service`.
5. Ops duyệt pickup request, `pickup-service` publish `pickup.approved`.
6. `dispatch-service` tạo/gán pickup task cho courier và publish `task.assigned`.
7. Courier nhận task trên `courier-mobile`.
8. Courier scan pickup, `scan-service` ghi scan và publish `scan.pickup_confirmed`.
9. `shipment-service`, `tracking-service`, `reporting-service` cập nhật trạng thái/read model từ event.

### 15.2 Trung chuyển qua hub

1. Ops tạo manifest/bag và thêm các shipment.
2. Ops seal manifest tại hub gốc, `manifest-service` publish `manifest.sealed`.
3. Hàng được gửi đi, scan outbound/inbound được ghi nhận qua `scan-service`.
4. Nếu qua nhiều hub, chu kỳ `SCAN_INBOUND -> SEND_GOODS -> IN_TRANSIT -> SCAN_INBOUND` có thể lặp lại.
5. Khi hàng đến hub giao cuối, hệ thống/ops gán delivery task cho courier.

### 15.3 Giao hàng, NDR và return

1. Courier nhận delivery task.
2. Nếu giao thành công, courier gửi POD/OTP và idempotency key.
3. `delivery-service` ghi delivery attempt, POD/OTP, publish `delivery.delivered`.
4. Nếu giao thất bại, courier chọn lý do, `delivery-service` publish `delivery.failed` và có thể tạo `ndr.created`.
5. Ops xử lý NDR: giao lại, exception hoặc bắt đầu hoàn hàng.
6. Return flow publish `return.started` và `return.completed` khi hoàn tất.

### 15.4 COD settlement

1. `payment-service` consume `shipment.created` để tạo `CodRecord` nếu đơn có COD.
2. Khi giao thành công và thu COD, ops/courier flow cập nhật record thành collected và publish `cod.collected`.
3. Ops tạo settlement batch theo ngày/hub/courier.
4. Hệ thống tạo thông tin chuyển khoản/VietQR.
5. SePay webhook hoặc thao tác xác nhận cập nhật remittance và publish `cod.remitted`.

## 16. API Gateway routing

`gateway-bff` là cổng vào duy nhất cho web/mobile client.

```text
Client request
  -> gateway-bff :3000
      /merchant/*  -> shipment, pickup, tracking, pricing, integration...
      /ops/*       -> domain services phục vụ vận hành
      /courier/*   -> auth, dispatch, scan, delivery, media...
      /public/*    -> tracking/payment public endpoints
      /media/*     -> MinIO/S3 upload/download
      /health      -> self health check
```

Auth gateway hiện có `GatewayAuthGuard`. Tùy cấu hình `GATEWAY_AUTH_ENABLED`, gateway có thể chỉ kiểm tra sự tồn tại của `Authorization` header ở perimeter; token/session chi tiết thuộc phạm vi `auth-service`.

## 17. Idempotency và reliability

Các điểm chống trùng chính:

| Tầng | Cơ chế |
| --- | --- |
| Courier mobile | Tạo `idempotencyKey` cố định cho mỗi delivery/scan attempt, giữ nguyên khi offline retry. |
| `scan-service` | `IdempotencyRecord` chống ghi trùng scan khi retry. |
| `delivery-service` | Scoped key như `delivery.success:{key}` hoặc `delivery.fail:{key}` để trả lại response cũ nếu request lặp. |
| `payment-service` | `IdempotencyRecord` và unique constraints cho các thao tác thanh toán/COD. |
| `reporting-service` | `AggregationJob.jobKey = event_id` unique để mỗi event chỉ project một lần. |
| Outbox relay | Ghi event vào DB trước, publish sau để giảm rủi ro mất event khi service lỗi giữa chừng. |

## 18. Quy tắc sinh mã

| Loại mã | Quy tắc | Ví dụ |
| --- | --- | --- |
| Mã miền/hub tổng | `001`, `002`, `003` cho Bắc/Trung/Nam | `001` |
| Mã hub/bưu cục | `<mã miền><chữ khu vực><3 số>` | `001A001`, `002C001`, `003S001` |
| Mã tuyến | Mỗi hub có tuyến `01` đến `10` | `001A001-01` |
| Mã vận đơn sàn TMĐT | `111` + 9 số | `111000000001` |
| Mã vận đơn shop | `101` + 9 số | `101000000001` |
| Mã đơn thu hồi/hoàn | `222` + 9 số | `222000000001` |
| Mã đơn khách lẻ | `333` + 9 số | `333000000001` |
| Mã bao | `MB` + 10 số | `MB0000000001` |
| Mã tem xe | `XT` + 10 số | `XT0000000001` |
| Admin username | `10000` + 3 số | `10000001` |
| Ops username | `20000` + 3 số | `20000001` |
| Courier username | `3000` + 4 số | `30000001` |
| Merchant username | `411` + 5 số | `41100001` |

## 19. Local development

### 19.1 Start infrastructure

```bash
cd infra/dev
docker compose up -d
```

Infra dev gồm:

| Thành phần | Port |
| --- | ---: |
| PostgreSQL | `15432 -> 5432` |
| RabbitMQ | `5672`, management UI `15672` |
| Redis | `6379` |
| MinIO | API `9000`, console `9001` |

### 19.2 Prepare database cho service

Chạy trong từng service có Prisma:

```bash
pnpm install
pnpm run db:prepare
```

Seed data chính thường nằm ở:

```bash
cd services/auth-service && pnpm run db:seed
cd services/masterdata-service && pnpm run db:seed
```

### 19.3 Start services và apps

Có thể dùng script tổng hợp:

```bash
./run-all-mac.sh
# hoặc trên Windows
./run-all.ps1
```

Hoặc chạy riêng từng app/service:

```bash
cd services/gateway-bff && pnpm run start:dev
cd apps/ops-web && pnpm run dev
cd apps/merchant-web && pnpm run dev
cd apps/courier-mobile && pnpm run start
```

## 20. Environment variables quan trọng

| Nhóm | Biến tiêu biểu |
| --- | --- |
| Gateway/service URLs | `AUTH_SERVICE_URL`, `SHIPMENT_SERVICE_URL`, `PICKUP_SERVICE_URL`, `DELIVERY_SERVICE_URL`, `PRICING_SERVICE_URL` |
| Database | `DATABASE_URL`, `CHAT_DATABASE_URL` |
| RabbitMQ | `RABBITMQ_URL`, `DOMAIN_EVENTS_EXCHANGE`, `RABBITMQ_MANAGEMENT_PORT` |
| Outbox/reporting | `OUTBOX_RELAY_INTERVAL_MS`, `OUTBOX_RELAY_BATCH_SIZE`, `REPORTING_CONSUMER_INTERVAL_MS` |
| Object storage | `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE` |
| Frontend web | `VITE_GATEWAY_BFF_URL`, `VITE_REQUEST_TIMEOUT_MS` |
| Courier mobile | `EXPO_PUBLIC_GATEWAY_BASE_URL`, `EXPO_PUBLIC_REQUEST_TIMEOUT_MS`, `EXPO_PUBLIC_COURIER_ID` |
| COD/SePay | `COMPANY_BANK_*`, `SEPAY_WEBHOOK_SECRET`, `SEPAY_BANK_ACCOUNT_NUMBER`, `SEPAY_AMOUNT_TOLERANCE_VND` |
| Marketplace integration | `NEXUS_INTEGRATION_*`, `PUBLIC_TRACKING_PUBLIC_URL`, `OPS_PUBLIC_URL` |

## 21. Testing và build

Một số lệnh kiểm tra đang có trong repo:

| Module | Lệnh |
| --- | --- |
| Backend services | `pnpm run build` trong từng service |
| `gateway-bff` chat | `pnpm run test:chat` |
| `ops-web` | `pnpm run test:smoke`, `pnpm run build` |
| `admin-web` | `pnpm run test:smoke`, `pnpm run test:e2e`, `pnpm run build` |
| `merchant-web` | `pnpm run build` |
| `public-tracking` | `pnpm run build` |
| `courier-mobile` | `pnpm run typecheck`, `pnpm run test:maestro`, `pnpm run build:web` |

## 22. Tài liệu liên quan

Các tài liệu nên đọc tiếp khi viết báo cáo:

| File/thư mục | Nội dung |
| --- | --- |
| `README.md` | Tổng quan tiếng Anh và sơ đồ kiến trúc ban đầu. |
| `docs/nexus-express-system-overview.md` | Bản overview cũ/nháp có nhiều nội dung dùng lại cho báo cáo. |
| `docs/order-lifecycle-report.md` | Mô tả luồng vận đơn qua nhiều hub. |
| `docs/architecture/` | Tài liệu kiến trúc, event, data ownership, status machine. |
| `docs/runbook/` | Hướng dẫn local dev, migration, deploy và troubleshooting. |
| `docs/service-description/` | Mô tả chi tiết một số service/API. |
| `contracts/events/` | Quy ước naming và payload event. |
| `contracts/openapi/` | OpenAPI contract theo service. |
| `luat-sinh-ma.txt` | Quy tắc mã vận đơn, mã hub, mã user, mã bao, mã tem xe. |

## 23. Ghi chú hiện trạng và giới hạn

Một số điểm cần nêu rõ khi viết tài liệu kỹ thuật:

- Gateway auth hiện thiên về perimeter check; logic session/token chi tiết thuộc `auth-service`.
- `tracking-service` và `reporting-service` là read model, không phải source of truth nghiệp vụ.
- `pricing-service` tính quote/rate nhưng không sở hữu DB riêng; shipment lưu snapshot giá khi tạo đơn.
- Local dev tạo nhiều DB trong cùng một PostgreSQL container, nhưng nguyên tắc thiết kế vẫn là database-per-service.
- Mỗi app/service có dependency và script riêng; repo chưa có root package script thống nhất.
- Một số tài liệu cũ có thể dùng thuật ngữ/trạng thái khác nhau. Khi viết tài liệu chính thức, ưu tiên trạng thái và ownership theo `shipment-service`, schema Prisma, contract events và file overview này.
