# NEXUS Express – Logistics Management System

## Tổng quan dự án

**NEXUS Express** là hệ thống quản lý vận hành logistics last-mile, lấy cảm hứng từ cách vận hành thực tế của **NEXUS (J&T Express)**. Hệ thống được xây dựng theo kiến trúc **microservices event-driven**, hỗ trợ toàn bộ vòng đời vận đơn từ tạo đơn → lấy hàng → vận chuyển → giao hàng → thu COD → hoàn trả.

- **Tên hệ thống**: NEXUS Express
- **Loại dự án**: Đồ án tốt nghiệp
- **Ngôn ngữ chính**: TypeScript (100%)
- **Kiến trúc**: Microservices + Event-Driven Architecture
- **Monorepo tool**: pnpm workspace
- **Repository**: `VoVanTuTai/Logistics_management_system`

---

## Tech Stack

### Backend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Node.js** | 20+ | Runtime |
| **NestJS** | 10.x | Framework cho tất cả backend services |
| **Prisma** | 6.19.x | ORM + Schema-first migration |
| **PostgreSQL** | 16-alpine | Database (mỗi service 1 DB riêng) |
| **RabbitMQ** | 3.13-management | Message broker (exchange: `domain.events`) |
| **MinIO** | latest | S3-compatible object storage (ảnh POD) |
| **TypeScript** | 5.x | Ngôn ngữ |

### Frontend
| App | Framework | Build tool |
|---|---|---|
| **ops-web** | React 18 + React Router v6 | Vite |
| **merchant-web** | React 18 + React Router v6 | Vite |
| **admin-web** | React 18 + React Router v6 | Vite |
| **public-tracking** | React 18 | Vite |
| **courier-mobile** | React Native + Expo | Metro |

### Infrastructure
| Thành phần | Công nghệ |
|---|---|
| Container runtime | Docker Compose (dev) |
| Object storage | MinIO (S3 compatible) |
| Package manager | pnpm |
| Monorepo orchestrator | Turborepo |

---

## Cấu trúc thư mục gốc

```
logistics-management-system/
├── apps/                          # Frontend applications
│   ├── admin-web/                 # @NEXUS/admin-web (Vite + React)
│   ├── courier-mobile/            # courier-mobile (React Native)
│   ├── merchant-web/              # @NEXUS/merchant-web (Vite + React)
│   ├── ops-web/                   # @NEXUS/ops-web (Vite + React)
│   └── public-tracking/           # @NEXUS/public-tracking (Vite + React)
├── services/                      # Backend microservices
│   ├── auth-service/              # Port 3010
│   ├── masterdata-service/        # Port 3001
│   ├── shipment-service/          # Port 3002
│   ├── pickup-service/            # Port 3003
│   ├── dispatch-service/          # Port 3004
│   ├── manifest-service/          # Port 3005
│   ├── scan-service/              # Port 3006
│   ├── delivery-service/          # Port 3007
│   ├── tracking-service/          # Port 3008
│   ├── reporting-service/         # Port 3009
│   ├── payment-service/           # Port 3011
│   ├── pricing-service/           # Port 3012
│   └── gateway-bff/               # Port 3000 (API Gateway)
├── packages/                      # Shared packages
│   ├── messaging/                 # RabbitMQ utilities
│   ├── shared/                    # Shared types & constants
│   ├── testing/                   # Test utilities
│   └── ui/                        # Shared UI components
├── infra/
│   └── dev/
│       ├── docker-compose.yml     # PostgreSQL + RabbitMQ + MinIO
│       └── postgres/init-multiple-dbs.sql
├── contracts/                     # API contracts (if any)
├── design-reference/              # UI redesign mockups
├── docs/                          # Documentation
├── scripts/                       # Dev scripts
├── run-all.ps1                    # Start all services (PowerShell)
├── turbo.json                     # Turborepo config
├── tsconfig.base.json             # Base TypeScript config
└── pnpm-lock.yaml
```

---

## Database Architecture

**11 PostgreSQL databases** riêng biệt, mỗi service sở hữu 1 database. Không service nào đọc/ghi database của service khác.

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
```

Docker container PostgreSQL chạy ở port `15432`, bên trong map `5432`.

---

## Chi tiết từng Microservice

### 1. gateway-bff (Port 3000)
**Vai trò**: API Gateway / Backend-for-Frontend. Proxy tất cả request từ frontend đến domain services.

**Đặc điểm**:
- Không có database riêng
- Proxy forwarding theo prefix: `/merchant`, `/ops`, `/courier`, `/public`, `/media`
- `GatewayAuthGuard`: kiểm tra `Authorization` header tồn tại (perimeter auth)
- `ServiceRegistryClient`: đăng ký URL nội bộ cho từng domain service
- Media upload endpoint: nhận file từ courier → upload S3 (MinIO) → trả URL

**API Groups** (mỗi group là 1 NestJS module):
| Prefix | Module | Target service |
|---|---|---|
| `/merchant/*` | MerchantModule | shipment-service, pickup-service, tracking-service |
| `/ops/*` | OpsModule | Tất cả domain services |
| `/courier/*` | CourierModule | delivery-service, dispatch-service, scan-service |
| `/public/*` | PublicModule | tracking-service |
| `/media/*` | MediaModule | MinIO S3 |
| `/health` | HealthModule | Self health check |

---

### 2. auth-service (Port 3010)
**Vai trò**: Xác thực, quản lý user, session, phân quyền.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `UserAccount` | Tài khoản user (admin, ops, courier, merchant) |
| `AuthSession` | Phiên đăng nhập (JWT token) |
| `MobilePermissionProfile` | Profile quyền cho app courier |
| `MobilePermissionOverride` | Override quyền cá nhân |
| `AdminAuditLog` | Lịch sử thao tác admin |
| `OutboxEvent` | Outbox pattern |

**Events Publish**: `auth.session_created`, `auth.session_refreshed`, `auth.session_revoked`

**API chính**: Login, register, refresh token, change password, user management (CRUD)

---

### 3. masterdata-service (Port 3001)
**Vai trò**: Quản lý dữ liệu nền tảng (hub, zone, lý do NDR, cấu hình, merchant profile).

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `Hub` | Kho/bưu cục (mã đoạn 2) |
| `Zone` | Vùng/khu vực |
| `NdrReason` | Danh mục lý do giao thất bại |
| `Config` | Cấu hình hệ thống (key-value) |
| `MerchantProfile` | Thông tin merchant |
| `AdminAuditLog` | Lịch sử thao tác |
| `OutboxEvent` | Outbox pattern |

**Events Publish**: `masterdata.updated`, `ndr-reason.updated`

---

### 4. shipment-service (Port 3002)
**Vai trò**: Quản lý vận đơn (shipment). Là owner duy nhất của `currentStatus`.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `Shipment` | Vận đơn chính |
| `ChangeRequest` | Yêu cầu thay đổi đơn (merchant) |
| `OutboxEvent` | Outbox pattern |

**Events Publish**: `shipment.created`

**Events Consume** (queue: `shipment-service.q`):
`pickup.requested`, `pickup.approved`, `task.assigned`, `scan.pickup_confirmed`, `manifest.sealed`, `manifest.received`, `manifest.unsealed`, `scan.outbound`, `scan.inbound`, `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed`

**State Machine** (`ShipmentStateMachine`):
- 20 trạng thái: `CREATED` → `UPDATED` → `TASK_ASSIGNED` → `PICKUP_COMPLETED` → `MANIFEST_SEALED` → `MANIFEST_RECEIVED` → `MANIFEST_UNSEALED` → `SEND_GOODS` → `IN_TRANSIT` → `INVENTORY_CHECK` → `SCAN_INBOUND` → `SCAN_OUTBOUND` → `DELIVERED` / `DELIVERY_FAILED` → `NDR_CREATED` → `EXCEPTION` → `RETURN_STARTED` → `RETURN_COMPLETED` / `CANCELLED`
- **Transition whitelist** (`VALID_TRANSITIONS`): mỗi trạng thái có tập hợp trạng thái tiếp theo hợp lệ
- Terminal statuses (`DELIVERED`, `RETURN_COMPLETED`, `CANCELLED`): chỉ transition về chính nó
- Invalid transition → log warning + giữ nguyên status hiện tại

---

### 5. pickup-service (Port 3003)
**Vai trò**: Quản lý yêu cầu lấy hàng từ merchant.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `PickupRequest` | Yêu cầu lấy hàng |
| `PickupItem` | Danh sách đơn trong pickup request |
| `OutboxEvent` | Outbox pattern |

**Events Publish**: `pickup.requested`, `pickup.approved`

---

### 6. dispatch-service (Port 3004)
**Vai trò**: Phân công nhiệm vụ (task) cho courier.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `Task` | Nhiệm vụ (PICKUP / DELIVERY) |
| `TaskAssignment` | Gán task cho courier |
| `OutboxEvent` | Outbox pattern |
| `OpsAuditLog` | Lịch sử thao tác |

**Events Publish**: `task.assigned`

**Events Consume** (queue: `dispatch-service.q`): `pickup.approved`, `delivery.failed`, `return.started`, `return.completed`

---

### 7. manifest-service (Port 3005)
**Vai trò**: Quản lý bao hàng (manifest), seal, receive.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `Manifest` | Bao hàng (bag) |
| `ManifestItem` | Vận đơn trong bao |
| `SealRecord` | Niêm phong bao |
| `ReceiveRecord` | Nhận bao tại hub đích |
| `OutboxEvent` | Outbox pattern |
| `OpsAuditLog` | Lịch sử thao tác |

**Events Publish**: `manifest.sealed`, `manifest.received`, `manifest.unsealed`

**Events Consume** (queue: `manifest-service.q`): `scan.outbound`

---

### 8. scan-service (Port 3006)
**Vai trò**: Quản lý các sự kiện quét hàng (pickup scan, inbound, outbound).

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `ScanEvent` | Sự kiện quét |
| `IdempotencyRecord` | Chống trùng lặp |
| `CurrentLocation` | Vị trí hiện tại của vận đơn |
| `OutboxEvent` | Outbox pattern |
| `OpsAuditLog` | Lịch sử thao tác |

**Events Publish**: `scan.pickup_confirmed`, `scan.inbound`, `scan.outbound`

**Events Consume** (queue: `scan-service.q`): `manifest.sealed`

---

### 9. delivery-service (Port 3007)
**Vai trò**: Quản lý giao hàng, POD, OTP, NDR, return case.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `DeliveryAttempt` | Lần thử giao (status: ATTEMPTED / DELIVERED / FAILED) |
| `Pod` | Proof of Delivery (ảnh, ghi chú) |
| `OtpRecord` | OTP xác nhận giao hàng |
| `NdrCase` | Non-Delivery Report |
| `ReturnCase` | Trường hợp hoàn trả (status: STARTED / COMPLETED) |
| `IdempotencyRecord` | Chống trùng lặp (scoped: `delivery.success:key`, `delivery.fail:key`) |
| `OutboxEvent` | Outbox pattern |
| `OpsAuditLog` | Lịch sử thao tác |

**Events Publish**: `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed`

**Events Consume** (queue: `delivery-service.q`): `task.assigned`

**Idempotency Logic**:
1. Courier gửi `idempotencyKey` (UUID) khi giao thành công/thất bại
2. Service tạo `IdempotencyRecord` với scoped key (`delivery.success:{key}`)
3. Nếu P2002 (unique constraint) → trả về response đã lưu
4. `assertShipmentNotLocked()` gọi HTTP đến shipment-service kiểm tra shipment chưa bị lock

**Return Lifecycle**:
- `markFail()` với `startReturn: true` → tạo `ReturnCase` + publish `return.started`
- `ReturnsService.complete()` → kiểm tra not COMPLETED → cập nhật + publish `return.completed`
- Prevent duplicate: kiểm tra `findByNdrCaseId` / `findByShipmentCode` trước khi tạo

---

### 10. tracking-service (Port 3008)
**Vai trò**: Timeline tracking công khai.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `TimelineEvent` | Sự kiện timeline (mỗi event 1 dòng) |
| `TrackingCurrent` | Trạng thái hiện tại của vận đơn |
| `TrackingIndex` | Index tra cứu nhanh |

**Events Consume** (queue: `tracking-service.q`): Tất cả business events (TRACKING_BUSINESS_EVENTS)

**Không publish event** – chỉ đọc/ghi timeline.

---

### 11. reporting-service (Port 3009)
**Vai trò**: Read model cho KPI/dashboard. Không chứa business logic write-side.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `KpiDaily` | KPI ngày (shipmentsCreated, pickupsCompleted, deliveriesDelivered, deliveriesFailed, ndrCreated, scansInbound, scansOutbound, codCollected, codRemitted) |
| `KpiMonthly` | KPI tháng (cùng fields) |
| `AggregationJob` | Ledger chống duplicate projection (jobKey = event_id, unique constraint) |
| `ShipmentStatusProjection` | Trạng thái hiện tại mỗi vận đơn (cho groupBy dashboard) |

**Events Consume** (queue: `reporting-service.q`, 18 patterns):
`shipment.created`, `pickup.requested`, `pickup.approved`, `task.assigned`, `manifest.sealed`, `manifest.received`, `manifest.unsealed`, `scan.pickup_confirmed`, `scan.outbound`, `scan.inbound`, `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed`, `cod.collected`, `cod.remitted`

**KPI Dimensions**: Mỗi event tạo aggregation theo combinations: (ALL, ALL, ALL), (courier, ALL, ALL), (ALL, hub, ALL), (ALL, ALL, zone), ...

**Idempotency**: `AggregationJob.jobKey = event_id` unique → P2002 = skip (duplicate event)

**Không publish event** – read-only service.

---

### 12. payment-service (Port 3011)
**Vai trò**: Source of truth cho COD settlement.

**Prisma Models**:
| Model | Mô tả |
|---|---|
| `CodRecord` | Bản ghi COD mỗi vận đơn (codAmount, collectedAmount, status) |
| `CodSettlementBatch` | Batch quyết toán COD (ngày, hub, courier) |
| `CodSettlementPaymentEvent` | Sự kiện thanh toán (SePay webhook) |
| `CodSettlementItem` | Liên kết CodRecord ↔ Batch |
| `IdempotencyRecord` | Chống trùng lặp |
| `OutboxEvent` | Outbox pattern |

**Events Publish**: `cod.collected`, `cod.collection_failed`, `cod.remitted`

**Events Consume** (queue: `payment-service.q`): `shipment.created` (tạo CodRecord pending)

**COD Settlement Flow**:
1. `shipment.created` → payment-service tạo `CodRecord` (status: PENDING)
2. Courier giao thành công → ops gọi collect API → CodRecord = COLLECTED, publish `cod.collected`

---

### 13. pricing-service (Port 3012)
**Vai tro**: Source of truth cho tinh gia/cuoc khi len don.

**Endpoint chinh**:
| Method | Path | Mo ta |
|---|---|---|
| `POST` | `/quotes` | Tinh cuoc va tra ve quote co version, breakdown, validUntil |
| `GET` | `/rates` | Mo ta rule basis hien hanh |

**Co so tinh gia**:
- `serviceType`: STANDARD, EXPRESS, SAME_DAY
- Trong luong thuc va trong luong quy doi: `lengthCm * widthCm * heightCm / 6000`
- Trong luong tinh cuoc: `max(actualWeightKg, volumetricWeightKg)`, lam tron len nac 0.5kg
- Zone tuyen gui/nhan: noi tinh, metro corridor, lien tinh
- Phi khai gia tu `declaredValue`
- Phi thu ho COD tu `codAmount`

**Tich hop**: `shipment-service` goi `pricing-service` khi tao shipment va ghi ket qua vao `metadata.estimatedFee` + `metadata.pricing`. Frontend co the goi `/merchant/pricing/quotes` de hien thi phi tam tinh, nhung backend van tinh lai khi tao don.
3. Ops tạo batch settlement → group by ngày/hub/courier → tạo `CodSettlementBatch`
4. Generate VietQR link (napas247 format)
5. SePay webhook confirm → match `codRecord.codAmount` với `transaction.amount` (tolerance)
6. Confirm remitted → CodRecord = REMITTED, publish `cod.remitted`

**Transaction safety**: `Prisma.$transaction()` cho batch operations

---

## Event Flow Architecture

### Exchange & Queue Pattern
```
Exchange: domain.events (topic exchange)
Queue naming: {service-name}.q
Retry queues: {service-name}.retry.10s, {service-name}.retry.1m
Dead letter: {service-name}.dlq
```

### Outbox Pattern
Mỗi domain service (trừ gateway-bff, tracking-service, reporting-service) có:
1. `OutboxEvent` Prisma model
2. `*-outbox.service.ts` – ghi event vào DB
3. `*-outbox-relay.service.ts` – poll DB → publish RabbitMQ (HTTP Management API)
   - Poll interval: `OUTBOX_RELAY_INTERVAL_MS` (default 1000ms)
   - Batch size: `OUTBOX_RELAY_BATCH_SIZE` (default 50)
   - Publish qua RabbitMQ HTTP Management API (port 15672)
   - Mark published sau khi RabbitMQ confirm

### Complete Event Map

```
┌─────────────────────┐
│   shipment-service   │──publish──▶ shipment.created
│   (Port 3002)       │◀─consume── pickup.*, task.*, scan.*, manifest.*, delivery.*, ndr.*, return.*
└─────────────────────┘

┌─────────────────────┐
│   pickup-service     │──publish──▶ pickup.requested, pickup.approved
│   (Port 3003)       │
└─────────────────────┘

┌─────────────────────┐
│   dispatch-service   │──publish──▶ task.assigned
│   (Port 3004)       │◀─consume── pickup.approved, delivery.failed, return.started, return.completed
└─────────────────────┘

┌─────────────────────┐
│   manifest-service   │──publish──▶ manifest.sealed, manifest.received, manifest.unsealed
│   (Port 3005)       │◀─consume── scan.outbound
└─────────────────────┘

┌─────────────────────┐
│   scan-service       │──publish──▶ scan.pickup_confirmed, scan.inbound, scan.outbound
│   (Port 3006)       │◀─consume── manifest.sealed
└─────────────────────┘

┌─────────────────────┐
│   delivery-service   │──publish──▶ delivery.attempted/delivered/failed, ndr.created, return.started/completed
│   (Port 3007)       │◀─consume── task.assigned
└─────────────────────┘

┌─────────────────────┐
│   tracking-service   │ (no publish)
│   (Port 3008)       │◀─consume── ALL business events
└─────────────────────┘

┌─────────────────────┐
│   reporting-service  │ (no publish)
│   (Port 3009)       │◀─consume── 18 event types (including cod.collected, cod.remitted)
└─────────────────────┘

┌─────────────────────┐
│   payment-service    │──publish──▶ cod.collected, cod.collection_failed, cod.remitted
│   (Port 3011)       │◀─consume── shipment.created
└─────────────────────┘

┌─────────────────────┐
│   auth-service       │──publish──▶ auth.session_created/refreshed/revoked
│   (Port 3010)       │
└─────────────────────┘

┌─────────────────────┐
│   masterdata-service │──publish──▶ masterdata.updated, ndr-reason.updated
│   (Port 3001)       │
└─────────────────────┘
```

---

## Frontend Applications

### ops-web (@NEXUS/ops-web)
- **Framework**: React 18 + React Router v6 + Vite
- **Vai trò**: Dashboard vận hành cho Ops (nhân viên kho/bưu cục)
- **Chức năng**: KPI dashboard, quản lý shipment, task assignment, manifest/seal/receive, scan, NDR, return, COD settlement, tracking lookup
- **Test**: 6 smoke tests (vitest) – auth redirect, dashboard KPI, shipment list, task assign, manifest, tracking

### merchant-web (@NEXUS/merchant-web)
- **Framework**: React 18 + React Router v6 + Vite
- **Vai trò**: Self-service cho merchant
- **Chức năng**: Tạo đơn, in vận đơn, tạo pickup request, theo dõi đơn, yêu cầu thay đổi/hủy/hoàn, đổi mật khẩu

### admin-web (@NEXUS/admin-web)
- **Framework**: React 18 + React Router v6 + Vite
- **Vai trò**: Quản trị hệ thống
- **Chức năng**: Quản lý user (tạo/gán role), quản lý hub, zone, merchant profile, cấu hình hệ thống

### public-tracking (@NEXUS/public-tracking)
- **Framework**: React 18 + Vite
- **Vai trò**: Tra cứu vận đơn công khai (không cần đăng nhập)
- **Chức năng**: Nhập mã vận đơn → hiển thị timeline đầy đủ

### courier-mobile
- **Framework**: React Native + Expo
- **Vai trò**: App cho nhân viên giao hàng (courier/shipper)
- **Chức năng**: Xem task list, scan pickup, giao thành công (chụp POD, OTP), giao thất bại (chọn lý do), stats/KPI cá nhân
- **Offline support**: Offline queue với `idempotencyKey` cố định per attempt, retry khi có mạng
- **POD upload**: Chụp ảnh → upload gateway `/media/upload` → nhận URL → gửi cùng delivery success

---

## Luật sinh mã (Code Generation Rules)

### Mã đoạn vùng (Hub Hierarchy)
| Cấp | Quy tắc | Ví dụ |
|---|---|---|
| Miền (Hub tổng) | Mã đoạn 1 | Bắc: `001`, Trung: `002`, Nam: `003` |
| Hub khu vực | `<Mã miền><Mã khu vực[A-Z]><3 số>` | `001A001` |
| Tuyến đường | Mỗi hub có 10 tuyến `[01-10]` | `001A001-01` |

### Mã vận đơn (12 chữ số)
| Loại đơn | Prefix | Ví dụ |
|---|---|---|
| Đơn sàn TMĐT | `111` + 9 số | `111000000001` |
| Đơn từ Shop | `101` + 9 số | `101000000001` |
| Đơn thu hồi/hoàn | `222` + 9 số | `222000000001` |
| Đơn khách lẻ | `333` + 9 số | `333000000001` |

### Mã khác
| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Mã bao | `MB` + 10 số | `MB0000000001` |
| Mã nhân viên Admin | `10000` + 3 số | `10000001` |
| Mã nhân viên Ops | `20000` + 3 số | `20000001` |
| Mã Courier | `3000` + 4 số | `30000001` |
| Mã Merchant | `411` + 5 số | `41100001` |
| Mã tem xe | `XT` + 10 số | `XT0000000001` |

---

## Vòng đời vận đơn (Shipment Lifecycle)

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                                                          │
CREATED ──▶ UPDATED ──▶ TASK_ASSIGNED ──▶ PICKUP_COMPLETED                    │
                                                │                             │
                        ┌───────────────────────┘                             │
                        ▼                                                      │
                  MANIFEST_SEALED ──▶ SEND_GOODS / IN_TRANSIT                 │
                        │                    │                                 │
                        ▼                    ▼                                 │
                MANIFEST_RECEIVED ──▶ SCAN_INBOUND ──▶ INVENTORY_CHECK       │
                        │                    │                                 │
                        ▼                    ▼                                 │
                MANIFEST_UNSEALED    SCAN_OUTBOUND                            │
                        │                    │                                 │
                        └────────────┬───────┘                                 │
                                     ▼                                         │
                              TASK_ASSIGNED (delivery)                        │
                                     │                                         │
                          ┌──────────┴──────────┐                             │
                          ▼                     ▼                              │
                    DELIVERED            DELIVERY_FAILED                       │
                    (terminal)                  │                              │
                                         ┌─────┴─────┐                       │
                                         ▼           ▼                        │
                                   NDR_CREATED   EXCEPTION                    │
                                         │                                     │
                                         ▼                                     │
                                  RETURN_STARTED                              │
                                         │                                     │
                                         ▼                                     │
                                  RETURN_COMPLETED ◀─────────── CANCELLED ────┘
                                    (terminal)                  (terminal)
```

---

## Idempotency Design (3 tầng)

### Tầng 1: Courier Mobile
- Mỗi delivery attempt sinh `idempotencyKey` (UUID v4) 1 lần
- Offline queue giữ nguyên key khi retry
- Gửi `Idempotency-Key` header + `idempotencyKey` trong body

### Tầng 2: delivery-service
- `IdempotencyRecord` model với `idempotencyKey` unique
- Scoped key: `delivery.success:{key}` hoặc `delivery.fail:{key}`
- Flow: check existing → if exists return stored response → if not, execute + store → return
- P2002 (race condition) → fallback findByKey

### Tầng 3: reporting-service
- `AggregationJob` model với `jobKey = event_id` unique
- Mỗi event được project 1 lần duy nhất
- P2002 → skip (đã projected)

---

## API Gateway Routing

```
Client Request ──▶ gateway-bff (port 3000)
                        │
                        ├── /merchant/*  ──▶ shipment-service, pickup-service, tracking-service
                        ├── /ops/*       ──▶ all domain services
                        ├── /courier/*   ──▶ delivery-service, dispatch-service, scan-service
                        ├── /public/*    ──▶ tracking-service
                        ├── /media/*     ──▶ MinIO S3 (upload/download)
                        └── /health      ──▶ self
```

**Auth**: `GatewayAuthGuard` kiểm tra `Authorization` header có tồn tại. Không kiểm tra role (perimeter auth).

---

## Testing

| App/Service | Framework | Tests |
|---|---|---|
| ops-web | Vitest + React Testing Library | 6 smoke tests (auth, dashboard, shipment, task, manifest, tracking) |
| admin-web | Vitest | Smoke tests |
| Tất cả backend services | TypeScript compiler | `tsc --noEmit` typecheck pass |

---

## Dev Environment Setup

```bash
# 1. Start infrastructure
cd infra/dev && docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Prepare databases (each service)
cd services/<service-name> && pnpm run db:prepare

# 4. Seed data (auth + masterdata)
cd services/auth-service && pnpm run db:seed
cd services/masterdata-service && pnpm run db:seed

# 5. Start all services
./run-all.ps1

# 6. Start frontend
cd apps/ops-web && pnpm run dev
cd apps/merchant-web && pnpm run dev
```

---

## Environment Variables

```env
# Gateway
PORT=3000
GATEWAY_AUTH_ENABLED=true
CORS_ORIGINS=<comma-separated origins>
AUTH_SERVICE_URL=http://auth-service:3010
MASTERDATA_SERVICE_URL=http://masterdata-service:3001
SHIPMENT_SERVICE_URL=http://shipment-service:3002
PICKUP_SERVICE_URL=http://pickup-service:3003
DISPATCH_SERVICE_URL=http://dispatch-service:3004
MANIFEST_SERVICE_URL=http://manifest-service:3005
SCAN_SERVICE_URL=http://scan-service:3006
DELIVERY_SERVICE_URL=http://delivery-service:3007
TRACKING_SERVICE_URL=http://tracking-service:3008
REPORTING_SERVICE_URL=http://reporting-service:3009
PAYMENT_SERVICE_URL=http://payment-service:3011

# Backend services
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
RABBITMQ_URL=amqp://<user>:<password>@<host>:5672

# Object storage (MinIO / S3)
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY=<secret>
S3_SECRET_KEY=<secret>
S3_BUCKET_NAME=nexus-pod-images
S3_FORCE_PATH_STYLE=true

# Frontend
VITE_GATEWAY_BFF_URL=https://gateway.example.com
```

---

## Design Patterns sử dụng

| Pattern | Nơi áp dụng | Mô tả |
|---|---|---|
| **Outbox Pattern** | Tất cả domain services | Ghi event vào DB trước, relay poll và publish RabbitMQ sau |
| **CQRS (partial)** | reporting-service | Read model tách biệt, project từ events |
| **Event-Driven Architecture** | Toàn hệ thống | Services giao tiếp qua domain events |
| **Database per Service** | 11 databases | Mỗi service sở hữu database riêng |
| **API Gateway** | gateway-bff | Single entry point, proxy forwarding |
| **Repository Pattern** | Tất cả services | Abstract interface + Prisma implementation |
| **State Machine** | shipment-service | Transition whitelist cho shipment status |
| **Idempotency Key** | delivery, scan, payment, reporting | Prevent duplicate operations |
| **BFF Pattern** | gateway-bff | Backend-for-Frontend, mỗi client group có prefix riêng |

---

## Hạn chế đã biết (Known Limitations)

1. **Gateway auth chỉ perimeter** – không enforce role-based access ở gateway level
2. **Outbox relay dùng HTTP Management API** – chậm hơn AMQP client, đủ cho staging
3. **Database migration dùng `prisma db push`** – không có versioned migration history
4. **Delivery success + outbox enqueue không trong cùng DB transaction** – trade-off có chủ đích cho eventual consistency
5. **Merchant data isolation** – phụ thuộc vào frontend gửi đúng tham số, backend chưa enforce owner check trên mọi endpoint
