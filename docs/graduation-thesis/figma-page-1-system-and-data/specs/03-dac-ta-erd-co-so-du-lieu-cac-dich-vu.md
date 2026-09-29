# ĐẶC TẢ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU MICROSERVICES (DATABASE-PER-SERVICE) & MÔ HÌNH DỮ LIỆU TOÀN HỆ THỐNG

> **Tài liệu nghiên cứu khoa học & Khóa luận tốt nghiệp Kỹ sư ngành Công nghệ Thông tin / Kỹ thuật Phần mềm**  
> **Dự án:** Hệ thống Quản lý Vận tải & Logistics Đa kênh Nexus (Nexus Logistics Management System)  
> **Module:** Mô hình Dữ liệu Thực thể Quan hệ (ERD), Cơ chế Bất biến Dòng sự kiện & Quyết toán Tài chính COD Phân tán  
> **Sơ đồ Vector trực quan (Figma 1:1):** `docs/graduation-thesis/figma-page-1-system-and-data/diagrams/03-erd-data-model-and-money-flow.svg`

---

## 1. NGUYÊN TẮC THIẾT KẾ DỮ LIỆU PHÂN TÁN (DISTRIBUTED DATA PRINCIPLES)

Hệ thống Logistics Nexus áp dụng triệt để kiến trúc **Database-per-Service** (Mỗi dịch vụ sở hữu một cơ sở dữ liệu riêng biệt). Toàn bộ hệ sinh thái gồm **11 Microservices vận hành trên PostgreSQL 16**, kết hợp 1 công cụ tính cước quy chuẩn hàng không (Pricing Engine) và 1 kho tri thức nhúng vector RAG AI (Chatbot Engine).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               HỆ SINH THÁI 11 MICROSERVICES CƠ SỞ DỮ LIỆU ĐỘC LẬP (POSTGRESQL 16)       │
├─────────────────────┬──────────────────────┬────────────────────┬──────────────────────┤
│ 1. auth_db (:3010)  │ 2. masterdata_db(:3001)│ 3. shipment_db(:3002)│ 4. pickup_db (:3003) │
├─────────────────────┼──────────────────────┼────────────────────┼──────────────────────┤
│ 5. dispatch_db(:3004)│ 6. manifest_db(:3005)│ 7. scan_db   (:3006)│ 8. delivery_db(:3007)│
├─────────────────────┼──────────────────────┼────────────────────┼──────────────────────┤
│ 9. payment_db(:3011)│ 10. tracking_db(:3008)│ 11.reporting_db(:3009)│ 12. pricing(:3012)   │
└─────────────────────┴──────────────────────┴────────────────────┴──────────────────────┘
                                  ▲ (RabbitMQ Message Mesh)
                                  │ Transactional Outbox Pattern
```

### 1.1. Tại sao không sử dụng Foreign Key cứng giữa các Cơ sở dữ liệu?
1. **Tính tự chủ (Service Autonomy):** Mỗi Microservice có thể được sao lưu (backup), phục hồi (restore), tối ưu chỉ mục (re-index) hoặc nâng cấp lược đồ (schema migration) mà không ảnh hưởng tới bất kỳ service nào khác.
2. **Ngăn chặn nút thắt cổ chai (Decoupled Performance):** Một đợt đối soát tài chính COD nặng nề tại `payment_db` không thể gây nghẽn khóa bảng (table lock) lên tiến trình quét mã bưu kiện tại `scan_db`.
3. **Mở rộng linh hoạt (Polyglot Scalability):** Tách biệt ranh giới cho phép chuyển đổi từng cơ sở dữ liệu sang dạng phân tán (Citus, CockroachDB hoặc TimescaleDB cho chuỗi thời gian GPS) khi lưu lượng đạt hàng triệu đơn/ngày.

### 1.2. Cơ chế liên kết dữ liệu qua Khóa nghiệp vụ phân tán (Distributed Saga Keys)
Thay vì dùng khóa ngoại SQL, các dịch vụ liên kết với nhau thông qua **4 Khóa phân tán bất biến**:
- `shipmentCode`: Mã vận đơn định danh toàn cục (VD: `NX-123456`), xuyên suốt từ lúc tạo đơn, đóng bảng kê trung chuyển, giao hàng đến khi đối soát tiền COD.
- `hubCode`: Mã bưu cục/kho khai thác (VD: `HUB-SGN-01`), phân cấp từ Tổng công ty đến bưu cục phường/xã.
- `courierId`: Mã tài xế giao/nhận hàng, ánh xạ từ tài khoản người dùng sang phân tuyến địa bàn và phiên nộp tiền.
- `merchantId / createdByUserId`: Mã định danh chủ shop/khách hàng gửi bưu phẩm.

### 1.3. Mô hình Transactional Outbox & Tính nhất quán cuối cùng (Eventual Consistency)
Để tránh hiện tượng **Dual-Write Hazard** (Lưu DB thành công nhưng bắn sự kiện sang Message Broker thất bại), mọi thao tác ghi dữ liệu nghiệp vụ quan trọng đều tuân thủ **Transactional Outbox Pattern**:
- Dữ liệu nghiệp vụ và bản ghi `OutboxEvent` được ghi vào cùng một Transaction cục bộ (ACID) của PostgreSQL.
- Một luồng nền (Outbox Publisher Worker) liên tục đọc các sự kiện có `status = PENDING`, đẩy vào RabbitMQ Exchange và chuyển trạng thái sang `PUBLISHED`.
- Các dịch vụ tiêu thụ (Consumers) áp dụng cơ chế **Idempotent Consumer** (Kiểm tra `idempotencyKey`) để đảm bảo không bị xử lý lặp sự kiện (Exactly-once semantic).

---

## 2. TỪ ĐIỂN DỮ LIỆU & ĐẶC TẢ LƯỢC ĐỒ 11 MICROSERVICES

### 2.1. AUTH-SERVICE (Dịch vụ Định danh & Phân quyền Truy cập)
- **Cổng dịch vụ:** `http://localhost:3010`
- **Tên cơ sở dữ liệu:** `auth_db`
- **Vai trò:** Trung tâm quản lý tài khoản, mã hóa mật khẩu Argon2id, xác thực JWT kép (Access/Refresh Token), phân quyền RBAC và phân quyền nâng cao cho ứng dụng di động.

#### Bảng `UserAccount` (`users`)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | **PK** | Khóa chính định danh tài khoản người dùng |
| `username` | `VARCHAR(64)` | **UNIQUE** | Tên đăng nhập duy nhất (SĐT hoặc Email) |
| `passwordHash` | `VARCHAR(255)` | `NOT NULL` | Chuỗi băm mật khẩu chuẩn Argon2id |
| `status` | `ENUM` | `DEFAULT 'ACTIVE'` | Trạng thái tài khoản: `ACTIVE`, `DISABLED` |
| `roles` | `TEXT[]` | `NOT NULL` | Danh sách vai trò Web: `ADMIN`, `COURIER`, `OPS_OPERATOR`, `MERCHANT` |
| `displayName` | `VARCHAR(128)` | `NULLABLE` | Họ và tên hiển thị của người dùng |
| `phone` | `VARCHAR(20)` | `INDEX` | Số điện thoại liên hệ chính thức |
| `hubCodes` | `TEXT[]` | **DIST** | Danh sách mã bưu cục phụ trách (`masterdata.hubs.code`) |
| `createdAt` | `TIMESTAMP` | `DEFAULT NOW()` | Thời điểm tạo tài khoản |
| `updatedAt` | `TIMESTAMP` | `ON UPDATE` | Thời điểm cập nhật hồ sơ gần nhất |

#### Bảng `AuthSession` (`auth_sessions`)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `CUID` | **PK** | Khóa chính phiên đăng nhập |
| `userId` | `VARCHAR(64)` | **FK** | Tham chiếu đến `UserAccount.id` (1 : N) |
| `accessTokenHash` | `VARCHAR(128)` | **UNIQUE** | Mã băm SHA-256 của Access Token đang lưu hành |
| `refreshTokenHash` | `VARCHAR(128)` | **UNIQUE** | Mã băm SHA-256 của Refresh Token |
| `status` | `ENUM` | `DEFAULT 'ACTIVE'` | Trạng thái phiên: `ACTIVE`, `REVOKED` |
| `issuedAt` | `TIMESTAMP` | `NOT NULL` | Thời điểm cấp phát phiên |
| `accessTokenExpiresAt` | `TIMESTAMP` | `NOT NULL` | Thời điểm hết hạn Access Token (15 phút) |
| `refreshTokenExpiresAt`| `TIMESTAMP` | `NOT NULL` | Thời điểm hết hạn Refresh Token (7 ngày) |
| `lastUsedAt` | `TIMESTAMP` | `NULLABLE` | Thời điểm gửi request gần nhất |
| `revokedAt` | `TIMESTAMP` | `NULLABLE` | Thời điểm thu hồi phiên đăng nhập |
| `revokeReason` | `VARCHAR(128)` | `NULLABLE` | Lý do thu hồi: `LOGOUT`, `PASSWORD_CHANGED`, `SECURITY_BREACH` |

#### Bảng `MobilePermissionProfile` & `MobilePermissionOverride`
- `MobilePermissionProfile`: Thiết lập quyền mặc định cho từng nhóm tác nhân di động (`COURIER`, `OPS_OPERATOR`).
- `MobilePermissionOverride`: Cho phép gán quyền ngoại lệ riêng biệt cho từng tài xế cá biệt (`userId` duy nhất, liên kết 1 : 1 Cascade).

#### Bảng `AdminAuditLog` (`admin_audit_logs`)
- Lưu vết an ninh: `actorId`, `action`, `targetType`, `targetId`, bản ghi `before` và `after` (định dạng JSONB), địa chỉ IP và User-Agent.

---

### 2.2. MASTERDATA-SERVICE (Dịch vụ Danh mục & Chính sách Cốt lõi)
- **Cổng dịch vụ:** `http://localhost:3001`
- **Tên cơ sở dữ liệu:** `masterdata_db`
- **Vai trò:** Quản lý hạ tầng mạng lưới bưu chính: Bưu cục (Hub), Vùng địa lý tính cước (Zone), Tuyến giao tài xế (Courier Geofence), Hồ sơ chủ shop (MerchantProfile) và Kho tri thức chính sách bưu chính (Policy Repository).

#### Bảng `Hub` (`hubs`)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `CUID` | **PK** | Khóa chính bưu cục |
| `code` | `VARCHAR(32)` | **UNIQUE** | Mã bưu cục chuẩn hóa: `HUB-SGN-01`, `HUB-HAN-02` |
| `name` | `VARCHAR(128)` | `NOT NULL` | Tên bưu cục / trung tâm khai thác |
| `level` | `INT` | `DEFAULT 2` | Phân cấp: `0` (Tổng công ty), `1` (Liên vùng), `2` (Tỉnh), `3` (Xã) |
| `parentCode` | `VARCHAR(32)` | **FK (Self)** | Mã bưu cục cha quản lý trực tiếp (Cấu trúc cây) |
| `zoneCode` | `VARCHAR(32)` | **FK** | Thuộc vùng tính cước nào (`Zone.code`) |
| `district / ward` | `VARCHAR(64)` | `NULLABLE` | Địa chỉ hành chính của bưu cục |
| `coverageRadiusKm`| `FLOAT` | `NULLABLE` | Bán kính phục vụ tối đa (km) |
| `boundaryPolygon` | `JSONB` | `NULLABLE` | Tập tọa độ đa giác GeoJSON ranh giới địa bàn |
| `latitude / longitude`| `FLOAT` | `NULLABLE` | Tọa độ địa lý tâm bưu cục (WGS84) |
| `isActive` | `BOOLEAN` | `DEFAULT TRUE` | Trạng thái hoạt động của bưu cục |

#### Bảng `CourierAreaAssignment` (`courier_area_assignments`)
- Phân công địa bàn giao hàng cho tài xế: Gồm `courierId`, `hubCode`, `province`, `district`, `ward`, mã màu hiển thị trên bản đồ `colorHex` và đa giác tuyến giao `boundaryPolygon`.
- Ràng buộc toàn vẹn: `UNIQUE(courierId, province, district, ward)` ngăn chặn việc phân công chồng chéo địa bàn.

#### Bảng `Policy` (`policies`) & `PolicyVersion` (`policy_versions`)
- Quản lý các văn bản pháp lý bưu chính: Quy định bồi thường, Danh mục hàng cấm gửi, Quy chuẩn đóng gói IATA, Chính sách chuyển hoàn.
- Bảng `PolicyVersion` (Quan hệ 1 : N) lưu giữ nguyên vẹn nội dung Markdown của từng lần sửa đổi, phục vụ trực tiếp cho bộ tạo Embeddings của Chatbot RAG AI.

---

### 2.3. SHIPMENT-SERVICE (Dịch vụ Vận đơn, Khiếu nại & Điều tra Sự cố)
- **Cổng dịch vụ:** `http://localhost:3002`
- **Tên cơ sở dữ liệu:** `shipment_db`
- **Vai trò:** **Canonical State Owner** (Nơi duy nhất sở hữu chân lý trạng thái bưu kiện), tiếp nhận yêu cầu sửa đổi vận đơn, quản lý hồ sơ điều tra điểm gãy (Investigation Case) và xử lý bồi thường thiệt hại (Compensation Claim).

#### Bảng `Shipment` (`shipments`)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `CUID` | **PK** | Khóa chính bưu kiện |
| `code` | `VARCHAR(32)` | **UNIQUE** | Mã vận đơn duy nhất: `NX-123456` |
| `currentStatus` | `ENUM` | `NOT NULL` | Trạng thái hiện tại máy trạng thái (19 statuses) |
| `isLocked` | `BOOLEAN` | `DEFAULT FALSE` | Khóa bưu phẩm tránh đua lệnh (Race Condition) |
| `createdByUserId` | `VARCHAR(64)` | **DIST** | Tài khoản chủ đơn (`auth.users.id`) |
| `createdByType` | `VARCHAR(32)` | `NULLABLE` | Loại người tạo: `MERCHANT`, `GUEST`, `OPS` |
| `receiverPhone` | `VARCHAR(20)` | `INDEX [PII]` | Số điện thoại người nhận hàng |
| `pickupLat / pickupLng`| `FLOAT` | `NULLABLE` | Tọa độ GPS điểm gom hàng |
| `deliveryLat / deliveryLng`| `FLOAT`| `NULLABLE` | Tọa độ GPS điểm phát hàng |
| `metadata` | `JSONB` | `NULLABLE` | Chi tiết hàng hóa, cân nặng, kích thước, COD |
| `cancellationReason` | `TEXT` | `NULLABLE` | Lý do hủy đơn nếu trạng thái là `CANCELLED` |

##### 19 Trạng thái cốt lõi của Vận đơn (ShipmentCurrentStatus FSM):
1. `CREATED`: Đơn mới tạo trên hệ thống.
2. `UPDATED`: Đã cập nhật thông tin địa chỉ/COD.
3. `PICKUP_COMPLETED`: Tài xế đã gom hàng thành công tại kho shop.
4. `TASK_ASSIGNED`: Đã gán nhiệm vụ điều phối.
5. `MANIFEST_SEALED`: Đã đóng bảng kê và kẹp chì niêm phong xe trung chuyển.
6. `MANIFEST_RECEIVED`: Bưu cục đích đã nhận bảng kê.
7. `MANIFEST_UNSEALED`: Đã mở niêm phong kiểm tra kiện hàng.
8. `SEND_GOODS`: Bắt đầu xuất phát chuyến vận chuyển đường trục.
9. `IN_TRANSIT`: Hàng đang di chuyển trên đường trục liên tỉnh.
10. `INVENTORY_CHECK`: Bưu cục đích quét kiểm kê tồn kho.
11. `SCAN_INBOUND`: Quét nhận hàng nhập kho bưu cục.
12. `SCAN_OUTBOUND`: Quét xuất kho giao cho tài xế đi phát.
13. `DELIVERED`: Phát hàng thành công tới tay người nhận.
14. `DELIVERY_FAILED`: Phát hàng không thành công (Lần 1, 2, 3).
15. `NDR_CREATED`: Đã lập biên bản sự cố giao hàng.
16. `EXCEPTION`: Bưu phẩm gặp sự cố đặc biệt (mất hàng, rách vỡ).
17. `RETURN_STARTED`: Bắt đầu quy trình chuyển hoàn về cho shop.
18. `RETURN_COMPLETED`: Chuyển hoàn thành công về lại kho shop.
19. `CANCELLED`: Đơn hàng bị hủy hợp lệ.

#### Bảng `InvestigationCase` (`investigation_cases`) & `InvestigationAuditScan`
- Xử lý khiếu nại thất lạc hoặc chênh lệch trọng lượng: Lưu vết điểm gãy `breakPointType` (`WAREHOUSE_STALE_LOSS`, `LINEHAUL_IN_TRANSIT_LOSS`, `MISROUTED_SORTING`, `LAST_MILE_UNACCOUNTED`).
- Bảng `InvestigationAuditScan` ghi vết lịch sử cân đo trọng lượng tại từng trạm quét để phát hiện bưu phẩm bị rút ruột hoặc tráo hàng.
- Bảng `InvestigationDispute` cho phép các bên (kho gửi, lái xe tải, kho nhận) nộp video camera CCTV và biên bản bàn giao để giải trình.

#### Bảng `CompensationClaim` (`compensation_claims`)
- Quản lý hồ sơ đền bù tổn thất: Ghi nhận số tiền đề nghị `claimRequestedAmount`, số tiền duyệt bồi thường `approvedCompensationAmount`, tỷ lệ chịu trách nhiệm `liabilityRatioPercent` (%) và tự động khấu trừ vào tài khoản bưu cục gây lỗi.

---

### 2.4. PICKUP-SERVICE (Dịch vụ Thu gom Hàng đầu vào)
- **Cổng dịch vụ:** `http://localhost:3003`
- **Tên cơ sở dữ liệu:** `pickup_db`
- **Vai trò:** Tiếp nhận yêu cầu gom hàng theo lô từ Merchant, điều phối tài xế đến lấy hàng tận nơi và bắn sự kiện kích hoạt chuỗi xử lý bưu chính.

#### Bảng `PickupRequest` (`pickup_requests`)
- Chứa thông tin: `pickupCode` (Mã gom: `PKP-001`), `status` (`REQUESTED`, `APPROVED`, `CANCELLED`, `COMPLETED`), tên shop, số điện thoại, địa chỉ kho và tọa độ GPS lấy hàng.

#### Bảng `PickupItem` (`pickup_items`)
- Liên kết 1 : N với `PickupRequest`, chứa danh sách `shipmentCode` của các kiện hàng nằm trong lô gom.

---

### 2.5. DISPATCH-SERVICE (Dịch vụ Điều phối Nhiệm vụ)
- **Cổng dịch vụ:** `http://localhost:3004`
- **Tên cơ sở dữ liệu:** `dispatch_db`
- **Vai trò:** Phân công nhiệm vụ tác nghiệp cho đội ngũ Courier di động theo thuật toán tối ưu vị trí địa lý.

#### Bảng `Task` (`tasks`) & `TaskAssignment` (`task_assignments`)
- Quản lý 3 loại nhiệm vụ: `PICKUP` (Gom hàng), `DELIVERY` (Phát hàng), `RETURN` (Chuyển hoàn).
- Bảng `TaskAssignment` lưu trữ lịch sử gán tài xế `courierId`, cho phép điều chuyển nhiệm vụ sang tài xế khác khi xảy ra sự cố hỏng xe mà không làm đứt đoạn chuỗi hành trình.

---

### 2.6. MANIFEST-SERVICE (Dịch vụ Bảng kê & Vận chuyển Đường trục)
- **Cổng dịch vụ:** `http://localhost:3005`
- **Tên cơ sở dữ liệu:** `manifest_db`
- **Vai trò:** Đóng chuyến thư đường trục (Linehaul), kẹp chì niêm phong xe tải (Lead Seal) và bàn giao giữa các bưu cục.

#### Bảng `Manifest` (`manifests`) & `ManifestItem` (`manifest_items`)
- Bảng kê đường trục mang mã `manifestCode` kết nối giữa `originHubCode` và `destinationHubCode`.
- Chứa hàng trăm kiện hàng thông qua bảng liên kết `ManifestItem.shipmentCode`.

#### Bảng `SealRecord` (`seal_records`) & `ReceiveRecord` (`receive_records`)
- Quan hệ 1 : 1 bắt buộc với `Manifest`.
- `SealRecord`: Lưu thông tin nhân viên xuất kho, số seri chì niêm phong và ảnh chụp kẹp chì xe tải lúc xuất phát.
- `ReceiveRecord`: Lưu thông tin nhân viên bưu cục đích xác nhận tình trạng nguyên vẹn của kẹp chì khi mở cửa thùng xe tải.

---

### 2.7. SCAN-SERVICE (Dịch vụ Quét mã & Định vị Realtime)
- **Cổng dịch vụ:** `http://localhost:3006`
- **Tên cơ sở dữ liệu:** `scan_db`
- **Vai trò:** Ghi nhận sự kiện quét mã vạch (Barcode/QR) tốc độ cao, khử trùng lặp và duy trì vị trí trực tiếp của bưu phẩm và tài xế.

#### Bảng `ScanEvent` (`scan_events`)
- Lưu vết từng lần bíp máy quét: `shipmentCode`, `scanType` (`PICKUP`, `INBOUND`, `OUTBOUND`), `locationCode` (Mã bưu cục), `actor` (Nhân sự quét), `idempotencyKey` duy nhất (chống quét đúp) và thời điểm phát sinh `occurredAt`.

#### Bảng `CurrentLocation` & `CourierCurrentLocation`
- Bản ghi truy vấn nhanh (Read-model tối ưu hóa) lưu vị trí tức thời: Bưu kiện đang nằm ở bưu cục nào, tài xế nào đang giữ trên xe, tọa độ GPS mới nhất và độ chính xác (m).

---

### 2.8. DELIVERY-SERVICE (Dịch vụ Phát hàng Chặng cuối & POD)
- **Cổng dịch vụ:** `http://localhost:3007`
- **Tên cơ sở dữ liệu:** `delivery_db`
- **Vai trò:** Quản lý quy trình phát hàng tận tay người nhận (Last-mile fulfillment), thu thập bằng chứng giao hàng (Proof of Delivery - POD), xác thực mã OTP và xử lý sự cố phát không thành (NDR).

#### Bảng `DeliveryAttempt` (`delivery_attempts`)
- Lưu thông tin mỗi lần tài xế gõ cửa giao hàng: `status` (`ATTEMPTED`, `DELIVERED`, `FAILED`), lý do thất bại `failReasonCode` và thời điểm giao.

#### Bảng `Pod` (`pods`) & `OtpRecord` (`otp_records`)
- `Pod`: Bằng chứng giao hàng gồm URL ảnh chụp người nhận ký nhận hoặc ảnh kiện hàng tại cửa nhà, thời điểm chụp và tọa độ GPS của máy tài xế.
- `OtpRecord`: Mã bảo mật 6 số gửi đến điện thoại người nhận đối với các bưu kiện giá trị cao, bắt buộc tài xế phải xác thực thành công mới được bàn giao hàng.

#### Bảng `NdrCase` (`ndr_cases`) & `ReturnCase` (`return_cases`)
- Quản lý sự cố giao hàng không thành: Tối đa 3 lần phát theo quy định SLA.
- Khi quá 3 lần phát hoặc người nhận từ chối nhận, hệ thống tự động sinh `ReturnCase` để chuyển bưu kiện sang luồng hoàn hàng về kho shop.

---

### 2.9. PAYMENT-SERVICE (Dịch vụ Thanh toán, Đối soát COD & Quyết toán Tự động)
- **Cổng dịch vụ:** `http://localhost:3011`
- **Tên cơ sở dữ liệu:** `payment_db`
- **Vai trò:** Quản lý dòng tiền thu hộ (Cash on Delivery), tự động tạo mã VietQR động PayOS và đối soát tự động khi tài xế nộp tiền ca cuối ngày.

#### Bảng `CodRecord` (`cod_records`)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `CUID` | **PK** | Khóa chính bản ghi thu tiền |
| `shipmentCode` | `VARCHAR(32)` | **DIST (UNIQUE)** | Mã vận đơn được thu hộ tiền |
| `merchantId` | `VARCHAR(64)` | **DIST** | Mã chủ shop thụ hưởng tiền hàng |
| `codAmount` | `FLOAT` | `NOT NULL` | Số tiền mặt cần thu từ người nhận |
| `paymentMethod` | `ENUM` | `DEFAULT 'COD'` | Hình thức: `COD`, `BANK_TRANSFER`, `PREPAID` |
| `status` | `ENUM` | `NOT NULL` | Trạng thái: `PENDING`, `COLLECTED`, `REMITTED` |
| `hubCode / courierId` | `VARCHAR`| **DIST** | Bưu cục và tài xế trực tiếp thu tiền |
| `collectedAt / collectedAmount` | `TIME / FLOAT`| `NULLABLE` | Số tiền và thời điểm tài xế nhận tiền mặt |
| `remittedAt / remittedBy` | `TIME / VARCHAR`| `NULLABLE` | Thời điểm nộp tiền về két tổng bưu cục |

#### Bảng `CodSettlementBatch` (`cod_settlement_batches`) & `CodSettlementItem`
- Vào cuối ca giao hàng, toàn bộ tiền mặt thu từ các đơn hàng được gộp thành một phiên nộp tiền duy nhất `settlementCode`.
- Hệ thống tự sinh mã **VietQR PayOS** kèm chuỗi ghi chú chuyển khoản duy nhất `transferMemo` (VD: `SETTLE_2026_09_29_COURIER_01`).
- Khi tài xế quét mã QR nộp tiền từ tài khoản ngân hàng cá nhân, Webhook ngân hàng bắn vào bảng `cod_settlement_payment_events`, hệ thống khớp chuỗi `transferMemo` và tự động gạch nợ cho tài xế trong vòng 2 giây.

---

### 2.10. TRACKING-SERVICE (Dịch vụ Tra cứu Hành trình Bưu phẩm)
- **Cổng dịch vụ:** `http://localhost:3008`
- **Tên cơ sở dữ liệu:** `tracking_db`
- **Vai trò:** Áp dụng mô hình **Event Sourcing Read-Model**, lưu trữ dòng thời gian bất biến (Append-only Timeline) phục vụ tra cứu công khai và bảo vệ dữ liệu cá nhân (PII Masking).

#### Bảng `TimelineEvent` (`timeline_events`)
- Lưu chuỗi sự kiện lịch trình: `eventId`, `eventType`, `shipmentCode`, `actor`, `locationCode`, dữ liệu bưu kiện `payload` và thời điểm xảy ra `occurredAt`.

#### Bảng `TrackingCurrent` (`tracking_current`)
- Bản ghi tra cứu nhanh phục vụ cổng Web khách vãng lai (Guest Tracking): Thông tin số điện thoại được làm mờ tự động (`098***3456`) và địa chỉ chỉ hiển thị đến cấp Phường/Quận nhằm tuân thủ luật bảo vệ dữ liệu cá nhân.

---

### 2.11. REPORTING-SERVICE (Dịch vụ Báo cáo Thống kê & Phân tích BI)
- **Cổng dịch vụ:** `http://localhost:3009`
- **Tên cơ sở dữ liệu:** `reporting_db`
- **Vai trò:** Tách biệt hoàn toàn luồng truy vấn phân tích (CQRS Architecture) khỏi cơ sở dữ liệu vận hành bưu chính.

#### Bảng `KpiDaily` & `KpiMonthly`
- Tổng hợp đa chiều theo 4 chiều kích thước: `[metricDate, courierCode, hubCode, zoneCode]`.
- Lưu trữ các chỉ số: Số đơn tạo, Số đơn gom thành công, Số đơn phát thành công, Số lần phát thất bại, Số sự cố NDR, Tổng tiền COD thu hộ và Tổng tiền COD đã nộp két.

#### Bảng `ShipmentStatusProjection`
- Bản chiếu CQRS cập nhật thời gian thực từ RabbitMQ giúp màn hình quản trị của Giám đốc bưu cục lọc hàng chục nghìn vận đơn với tốc độ dưới 50ms.

---

### 2.12. CÁC MODULE BỔ TRỢ ĐẶC THÙ (ENGINES)

#### PRICING-SERVICE (:3012 - Stateless Calculation Engine)
- Không lưu bảng cơ sở dữ liệu quan hệ, áp dụng thuần túy thực thể nghiệp vụ miền:
$$\text{Khối lượng quy đổi (kg)} = \frac{\text{Dài (cm)} \times \text{Rộng (cm)} \times \text{Cao (cm)}}{5000} \quad \text{(Chuẩn hàng không quốc tế IATA)}$$
$$\text{Khối lượng tính cước} = \max(\text{Cân nặng thực tế}, \text{Khối lượng quy đổi})$$
$$\text{Tổng cước} = \text{Cước cơ bản theo nấc} + \text{Phụ phí xăng dầu} + \text{Phí bảo hiểm (0.5\% nếu khai giá)} + \text{VAT 8\%}$$

#### CHATBOT-SERVICE (:3013 - RAG Semantic Vector Store)
- Lưu trữ các đoạn văn bản (Chunks) từ các văn bản chính sách bưu chính của `masterdata.policies`.
- Mỗi đoạn văn bản được nhúng thành **Vector 768 chiều** thông qua mô hình `Gemini Embedding-001`, cho phép tìm kiếm tương đồng ngữ nghĩa (Cosine Similarity) để trả lời thắc mắc của khách hàng về thời hạn bồi thường, cước hàng cồng kềnh và địa chỉ bưu cục gần nhất.

---

## 3. CHUỖI GIAO DỊCH PHÂN TÁN (SAGA LIFECYCLE) & DÒNG TIỀN QUYẾT TOÁN COD

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHUỖI SỰ KIỆN PHÂN TÁN SAGA & QUYẾT TOÁN TÀI CHÍNH COD                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  [1. KHỞI TẠO ĐƠN] ──► [2. DUYỆT GOM HÀNG] ──► [3. NHẬP KHO XUẤT TRỤC] ──► [4. PHÁT HÀNG TẬN TAY]
   • shipment-service    • pickup-service       • scan-service            • delivery-service
   • Status: CREATED     • dispatch-service     • manifest-service        • Chụp ảnh POD / OTP
   • Outbox: SHIPMENT    • Gán tài xế gom       • Kẹp chì Seal xe tải     • Status: DELIVERED
           │                     │                      │                         │
           ▼                     ▼                      ▼                         ▼
   ┌───────────────┐     ┌───────────────┐      ┌───────────────┐         ┌───────────────┐
   │ RabbitMQ Mesh │     │ RabbitMQ Mesh │      │ RabbitMQ Mesh │         │ RabbitMQ Mesh │
   └───────────────┘     └───────────────┘      └───────────────┘         └───────────────┘
                                                                                  │
                                                                                  ▼
  [6. BÁO CÁO BI & AI] ◄──────────────────────────────────────────────── [5. ĐỐI SOÁT TÀI CHÍNH]
   • tracking-service (Timeline)                                           • payment-service
   • reporting-service (KPI Daily)                                         • Thu tiền COD mặt
   • chatbot-service (Hỏi đáp đơn)                                         • Tạo mã VietQR PayOS
                                                                           • Gạch nợ phiên nộp
```

### Bảng Đối soát Dòng tiền Thu hộ COD (Money Flow Reconciliation Matrix):
| Bước tác nghiệp | Chủ thể nộp tiền | Chủ thể thụ hưởng | Phương thức & Kênh đối soát | Trạng thái ghi nhận |
| :--- | :--- | :--- | :--- | :--- |
| **Bước 1: Giao hàng** | Khách mua hàng | Courier (Tài xế) | Tiền mặt hoặc Chuyển khoản QR cá nhân | `cod_records.status = COLLECTED` |
| **Bước 2: Chốt ca** | Courier | Bưu cục phát | Nộp tiền mặt tại quầy hoặc Chuyển khoản VietQR PayOS | `cod_settlement_batches.status = PAID` |
| **Bước 3: Nộp két** | Bưu cục phát | Tổng công ty Nexus | Lệnh chuyển tiền nội bộ ngân hàng doanh nghiệp | `cod_records.status = REMITTED` |
| **Bước 4: Trả shop** | Tổng công ty Nexus | Merchant (Chủ shop) | Chuyển khoản tự động theo kỳ đối soát (T+1, T+3) | `merchant_profiles.wallet_balance += COD` |

---

## 4. KẾT LUẬN & ĐÁNH GIÁ TÍNH PHÙ HỢP CỦA HỆ THỐNG DỮ LIỆU

1. **Tính độc lập & Cách ly lỗi (Fault Tolerance):** Sự cố tại bất kỳ database nào (VD: `payment_db` bảo trì) không làm gián đoạn tiến trình khai thác bưu chính, quét mã tại kho và di chuyển của đội xe trên đường.
2. **Khả năng mở rộng ngang (Horizontal Scalability):** Từng database có thể đặt trên các cụm máy chủ chuyên biệt, gán tài nguyên CPU/RAM tương thích với tải đọc/ghi thực tế.
3. **Độ tin cậy của giao dịch phân tán (Transaction Resilience):** Nhờ cơ chế Transactional Outbox kết hợp với máy trạng thái 19 bước của `shipment-service`, hệ thống đảm bảo 100% dữ liệu đạt tới tính nhất quán cuối cùng mà không bao giờ thất lạc đơn hàng hay sai lệch dòng tiền COD.

---
*Tài liệu được biên soạn và chuẩn hóa bởi Nhóm Nghiên cứu Kỹ thuật Phần mềm Hệ thống Logistics Nexus.*
