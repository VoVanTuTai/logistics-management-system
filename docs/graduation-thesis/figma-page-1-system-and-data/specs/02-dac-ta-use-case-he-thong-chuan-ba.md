# TÀI LIỆU ĐẶC TẢ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN BA / SRS)

> **Tài liệu Phân tích Nghiệp vụ Phần mềm (Business Analysis & System Requirements Specification - BA/SRS)**  
> **Dự án:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus Enterprise (Nexus Enterprise Logistics Platform)  
> **Tiêu chuẩn chất lượng phần mềm:** IEEE 830 / ISO/IEC 25010 / UML 2.5 Specification (Object Management Group - OMG)  
> **Sơ đồ Vector Blueprint tham chiếu:** [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg)  
> **Phiên bản:** 6.0 (Definitive Production Alignment — Ánh xạ 1:1 chuẩn xác 100% với Codebase đã triển khai & Sơ đồ REV.11)

---

## 1. CƠ SỞ KHOA HỌC & KIẾN TRÚC PHẦN MỀM TỔNG THỂ

Hệ thống **Nexus Enterprise Logistics Platform** là giải pháp nền tảng phục vụ chuỗi cung ứng thương mại điện tử đa kênh và chuyển phát bưu chính liên tỉnh. Toàn bộ các chức năng và tác nhân được thiết kế, kiểm thử và ánh xạ 1:1 với hiện trạng mã nguồn thực tế:
- **15 Backend Microservices** vận hành trên nền tảng NestJS, Prisma ORM, cơ sở dữ liệu PostgreSQL, message broker RabbitMQ và bộ đệm Redis:
  1. `gateway-bff (:3000)`: API Gateway trung tâm, điều phối xác thực, PII Sanitizer và AI streaming.
  2. `auth-service (:3001)`: Quản lý phiên làm việc Opaque Bearer token, RBAC, tài khoản và audit logs.
  3. `masterdata-service (:3002)`: Danh mục bưu cục Hubs, phân vùng zones, cấu hình hệ thống, bài viết chính sách CMS, hồ sơ merchant và lý do NDR.
  4. `pricing-service (:3003)`: Động cơ tính cước IATA, thể tích quy đổi $VW = (D \times R \times C)/5000$, phụ phí và bảo hiểm.
  5. `shipment-service (:3004)`: Vòng đời vận đơn, yêu cầu thay đổi (change requests), khiếu nại bồi thường (claims) và điều tra tranh chấp (investigations).
  6. `pickup-service (:3005)`: Quản lý lịch hẹn lấy hàng tận nơi từ người gửi / Merchant.
  7. `scan-service (:3006)`: Quét mã vạch tiếp nhận gom hàng, Inbound, Outbound và viễn trắc GPS thời gian thực.
  8. `manifest-service (:3007)`: Đóng gói bao tải trung chuyển Manifest, niêm chì điện tử và đối kiểm đầu tuyến.
  9. `dispatch-service (:3008)`: Phân chia task vận chuyển theo ca và thuật toán tối ưu hóa tuyến đường giao.
  10. `delivery-service (:3010)`: Vận hành giao hàng chặng cuối (last-mile), e-POD, báo thất bại NDR, hẹn lại ngày và chuyển hoàn RTS.
  11. `payment-service (:3009)`: Thu hộ COD mặt, tạo mã VietQR động, webhook ngân hàng SePay, quyết toán ca và bảng kê settlement.
  12. `tracking-service (:3011)`: Lộ trình bưu gửi công khai (khử PII Masking) và viễn trắc nội bộ (full telemetry audit).
  13. `reporting-service (:3012)`: Báo cáo dòng tiền, báo cáo vận hành kho bãi và hiệu suất giao hàng.
  14. `chatbot-service (:3013)`: Động cơ phân loại ý định (Intent), trích xuất thực thể, RAG 768-D Semantic pgvector và sinh thẻ Rich Card.
  15. `notification-service (:3014)`: Quản lý thông báo đa kênh thời gian thực.
- **06 Ứng dụng Client (Frontend / Mobile)** phục vụ từng nhóm tác nhân chuyên biệt:
  1. `guest-web (:5174)`: Cổng tra cứu công khai, hỏi đáp AI và đăng ký tài khoản khách.
  2. `customer-mobile (:8082)`: Ứng dụng di động dành cho Khách hàng (tra cứu, ký e-POD, thanh toán VietQR SePay, khiếu nại sự cố 24h).
  3. `merchant-web (:5176)`: Cổng thông tin dành cho Chủ Shop / Người gửi (tạo đơn Portal/Webhook, in mã vạch, quản lý đơn, yêu cầu pickup).
  4. `courier-mobile (:8081)`: Ứng dụng dành cho Bưu tá giao nhận (quét gom, giao hàng e-POD, thu tiền mặt COD, quyết toán ca nộp tiền).
  5. `ops-web (:5175)`: Cổng điều hành dành cho Nhân sự Bưu cục & Kho (quét Inbound/Outbound, đóng Manifest, phân tuyến, đối soát COD).
  6. `admin-web (:5173)`: Cổng quản trị dành cho System Admin (RBAC Matrix, danh mục Hubs/Zones, cấu hình SLA, audit logs, CMS bài viết).

---

## 2. DANH MỤC 6 TÁC NHÂN THỰC TẾ TRÊN HỆ THỐNG (6 REAL ACTORS)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **bám sát 100% mã nguồn thực tế đã triển khai**, không sử dụng các tác nhân trừu tượng, chung chung:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              6 ROLES THỰC TẾ TRÊN HỆ THỐNG NEXUS ENTERPRISE                           │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ NHÓM ĐỐI TÁC & NGƯỜI DÙNG NGOẠI VI (EXTERNAL)      │ NHÓM VẬN HÀNH & QUẢN TRỊ NỘI BỘ (INTERNAL)        │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. Khách vãng lai (GUEST)                          │ 4. Courier (Bưu tá giao nhận) (COURIER)           │
│    • Client: guest-web (:5174)                     │    • Client: courier-mobile (:8081)               │
│                                                    │                                                   │
│ 2. Khách hàng (CUSTOMER)                           │ 5. Ops các cấp (OPS: Hub/Dispatch/Kho)            │
│    • Client: customer-mobile (:8082)               │    • Client: ops-web (:5175)                      │
│                                                    │                                                   │
│ 3. Merchant (Chủ Shop / Người gửi) (MERCHANT)      │ 6. System Admin (Quản trị viên) (SYSTEM_ADMIN)   │
│    • Client: merchant-web (:5176)                  │    • Client: admin-web (:5173)                    │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### Bảng Phân Tích Chi Tiết 6 Tác Nhân Triển Khai Thực Tế

| Tác nhân (Actor) | Mã Role Codebase | Ứng dụng Client & Port | Trách nhiệm & Quyền hạn nghiệp vụ thực tế trong Codebase |
| :--- | :---: | :---: | :--- |
| **Khách vãng lai** | `GUEST` | `guest-web :5174` | Khách truy cập ẩn danh không cần tài khoản. Được phép tra cứu lộ trình công khai (`UC-32`), hỏi đáp AI Chatbot (`UC-34`), nhận tư vấn cước IATA tự động (`UC-38`), và đăng ký tài khoản khách (`UC-43`). |
| **Khách hàng** | `CUSTOMER` | `customer-mobile :8082` | Khách hàng đầu nhận bưu kiện. Có quyền tra cứu tiến trình nội bộ (`UC-33`), hội thoại hỏi đáp AI (`UC-34`), ký nhận điện tử e-POD (`UC-14a`), thanh toán VietQR SePay (`UC-23b`), và khởi tạo khiếu nại sự cố trong 24h (`UC-19`). |
| **Merchant** *(Chủ Shop / Người gửi)* | `MERCHANT` | `merchant-web :5176` | Đối tác kinh doanh gửi hàng. Thực hiện tạo đơn trên Portal (`UC-01a`), đồng bộ đơn Webhook sàn TMĐT (`UC-01b`), tra cứu danh sách đơn (`UC-02`), yêu cầu lấy hàng (`UC-04`), sửa đổi thông tin đơn (`UC-05`), hủy đơn (`UC-06`), in phiếu Barcode/QR (`UC-07`). |
| **Courier** *(Bưu tá giao nhận)* | `COURIER` | `courier-mobile :8081` | Nhân sự hiện trường chặng đầu và chặng cuối. Thực hiện quét gom hàng (`UC-08`), thực hiện chuyến phát (`UC-14`), xác thực e-POD (`UC-14a`), báo phát thất bại NDR (`UC-15`), thu tiền mặt COD (`UC-23a`), quyết toán ca nộp tiền (`UC-24`). |
| **Ops các cấp** *(Hub / Dispatch / Kho)* | `OPS` | `ops-web :5175` | Toàn bộ các cấp vận hành kho trung chuyển và điều phối. Quét mã Inbound nhập kho (`UC-09`), quét Outbound xuất kho (`UC-10`), đóng bao Manifest niêm chì (`UC-11`), tiếp nhận bao tải đầu tuyến (`UC-12`), phân công task & tối ưu tuyến (`UC-13`), quyết toán ca bưu tá (`UC-24`), xác nhận đối soát chốt sổ (`UC-27`), báo cáo doanh thu (`UC-28`). |
| **System Admin** *(Quản trị viên hệ thống)* | `SYSTEM_ADMIN` | `admin-web :5173` | Quản trị viên cấp cao nhất. Hồ sơ cá nhân (`UC-44`), quản trị tài khoản người dùng (`UC-45`), phân quyền RBAC Matrix (`UC-46`), nhật ký kiểm toán bảo mật (`UC-47`), quản trị Hubs 4 cấp (`UC-48`), Zones địa lý (`UC-49`), cấu hình SLA (`UC-50`), CMS bài viết chính sách (`UC-51`), hồ sơ đối tác Merchant (`UC-52`), danh mục lý do NDR (`UC-53`). |

---

## 3. DANH MỤC 53 TRƯỜNG HỢP SỬ DỤNG & CỔNG XÁC THỰC BẢO MẬT (USE CASE CATALOG)

Hệ thống được tổ chức theo kiến trúc **Hub-and-Spoke Authentication**, bao gồm **Cổng Xác thực & Bảo mật Trung tâm (auth-service & gateway-bff)** và **6 Phân hệ chức năng nghiệp vụ (Packages)** với đúng **53 Trường hợp sử dụng thực tế**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      HỆ THỐNG QUẢN TRỊ & VẬN HÀNH LOGISTICS ĐA KÊNH NEXUS ENTERPRISE                   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                   ★ CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (auth-service :3001 • gateway-bff :3000)          │
│   • [UC-42] Đăng nhập hệ thống (Opaque Token & RBAC Matrix - Core Auth Hub)                            │
│   • [UC-43] Đăng ký tài khoản khách (Self-registration) ──<<extend>>──▷ UC-42                         │
├───────────────────────────────────┬────────────────────────────────────────────────────────────────────┤
│ CỘT 1: NGOẠI VI (MERCHANT / KHÁCH)│ CỘT 2: VẬN HÀNH NỘI BỘ (COURIER / OPS / ADMIN)                     │
├───────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 1. TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG   │ 2. KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG                        │
│  [UC-01] Tạo đơn gửi hàng (Gen)   │  • UC-08: Quét tiếp nhận gom hàng   • UC-13: Phân task & Tối ưu    │
│   ├── UC-01a: Tạo đơn trên Portal │  • UC-09: Quét mã nhập Inbound      • UC-14: Thực hiện chuyến phát │
│   └── UC-01b: Webhook Sàn TMĐT    │  • UC-10: Quét mã xuất Outbound     • UC-14a: Ký e-POD & OTP       │
│  • UC-02: Tra cứu & Lọc danh sách │  • UC-11: Đóng bao Manifest & Chì   • UC-15: Báo phát thất bại NDR │
│  • UC-03: Tính cước quy đổi IATA  │  • UC-12: Nhận bao tải đầu tuyến    • UC-16: Hẹn lại ngày phát     │
│  • UC-04: Yêu cầu bưu tá lấy hàng │                                     • UC-17: Chuyển hoàn (RTS)     │
│  • UC-05: Đổi địa chỉ/SĐT/COD     │  (UC-14 bắt buộc <<include>> UC-42 Đăng nhập hệ thống)             │
│  • UC-06: Hủy đơn gửi hàng        │                                                                    │
│  • UC-07: In phiếu gửi Barcode/QR │                                                                    │
│  (UC-01 bắt buộc <<include>> UC-42)│                                                                    │
├───────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 3. XỬ LÝ SỰ CỐ & BỒI THƯỜNG       │ 4. ĐỐI SOÁT TÀI CHÍNH & THU HỘ COD                                 │
│  • UC-19: Khởi tạo khiếu nại      │  [UC-23] Thu hộ tiền COD bưu phẩm (Gen)                            │
│  • UC-19a: Bưu tá đồng kiểm & Ký  │   ├── UC-23a: Thu tiền mặt tại điểm phát                           │
│  • UC-20: Thẩm định (<= 500k)     │   └── UC-23b: Thanh toán VietQR SePay động                         │
│  • UC-21: Phê duyệt (> 500k)      │  • UC-24: Quyết toán ca nộp tiền bưu tá                            │
│  • UC-21a: Điều tra & Hòa giải    │  • UC-25: Đối soát tự động SePay Webhook                           │
│  • UC-22: Cấn trừ bồi thường      │  • UC-26: Lập bảng kê đối soát COD                                 │
│  (UC-19 bắt buộc <<include>> UC-42)│  • UC-27: Xác nhận đối soát & Chốt sổ                              │
│                                   │  • UC-28: Báo cáo dòng tiền & Doanh thu                            │
│                                   │  (UC-26 bắt buộc <<include>> UC-42 Đăng nhập hệ thống)             │
├───────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 5. TRUY VẾT & TRỢ LÝ AI RAG       │ 6. QUẢN TRỊ HỆ THỐNG, DANH MỤC & PHÂN QUYỀN                        │
│  • UC-32: Tra cứu lộ trình public │  • UC-44: Hồ sơ & Đổi mật khẩu      • UC-49: Phân vùng địa lý Zone │
│  • UC-33: Tra cứu tiến trình nội bộ│ • UC-45: Quản trị người dùng       • UC-50: Cấu hình SLA          │
│  • UC-34: Hội thoại tự nhiên AI   │  • UC-46: Phân quyền RBAC Matrix    • UC-51: CMS Quản trị bài viết │
│  • UC-34a: Sinh thẻ Rich Card     │  • UC-47: Nhật ký kiểm toán bảo mật • UC-52: Hồ sơ đối tác Merchant│
│  • UC-35: Khử định danh PII Mask  │  • UC-48: Quản trị Hubs 4 cấp       • UC-53: Danh mục lý do NDR    │
│  • UC-36: Định vị GPS thời gian   │  (UC-45 bắt buộc <<include>> UC-42 Đăng nhập hệ thống)             │
│  • UC-37: Bóc tách Ý định/Entity  │                                                                    │
│  • UC-37a: RAG 768-D Vectors      │                                                                    │
│  • UC-38: Tư vấn cước tự động     │                                                                    │
│  • UC-39: Hướng dẫn khiếu nại AI  │                                                                    │
│  • UC-41: Điều chuyển nhân viên   │                                                                    │
│  (UC-33 bắt buộc <<include>> UC-42)│                                                                    │
└───────────────────────────────────┴────────────────────────────────────────────────────────────────────┘
```

### Bố cục Hình học & Quy chuẩn Đường nối (Tia thẳng chéo trực tiếp):
1. **Khoảng cách phân hệ cực rộng (Generous Package Gutters):**
   - Khoảng cách ngang (Đại lộ trung tâm giữa 2 cột): **800px** ($X: 2000 - 2800$).
   - Khoảng cách dọc giữa các hàng: **200px** ($Y: 960 - 1160$ và $Y: 1860 - 2060$).
   - Khoảng cách từ Role tới Phân hệ: **420px**.
2. **Quy tắc tia thẳng chéo trực tiếp (Zero Folding - Zero Overlap):**
   - 100% đường liên kết là tia thẳng / chéo trực tiếp fanning out từ Role đến các Use Case khởi tạo trực tiếp.
   - Sử dụng giải thuật lượng giác $\theta = \text{atan2}(dy, dx)$ để tiếp xúc chính xác tại mép viền elip ($cx + rx \cdot \cos\theta, cy + ry \cdot \sin\theta$), không vẽ đè lên chữ.
   - Tuyệt đối không có đường gấp khúc 90 độ, không có đường nối cắt ngang qua elip khác.
3. **Cổng Xác thực Trung tâm (Central Auth Gateway Hub):**
   - Tọa lạc tại trung tâm đại lộ ($X = 2400$).
   - 6 Use Case nghiệp vụ chính của 6 phân hệ có mũi tên nét đứt `<<include>>` chĩa thẳng vào `UC-42: Đăng nhập hệ thống`.
   - `Khách vãng lai` nối thẳng vào `UC-43: Đăng ký tài khoản khách` qua hành lang trống rộng 200px.
   - `UC-43` có quan hệ `<<extend>>` chuyển tiếp sang `UC-42`.
4. **Kế thừa Tác nhân (Actor Generalization: `CUSTOMER ──▷ GUEST`):**
   - Áp dụng nguyên lý hướng đối tượng chuẩn UML 2.5: **Khách hàng (`CUSTOMER`)** là tác nhân chuyên biệt kế thừa toàn bộ tính năng công khai của **Khách vãng lai (`GUEST`)** (`UC-32` Tra cứu công khai, `UC-34` Chatbot AI, `UC-38` Tư vấn cước IATA).
   - Nhờ mối quan hệ kế thừa này, trên sơ đồ không cần vẽ các đường nối trùng lặp từ Khách hàng đến các Use Case công khai của Guest, giúp sơ đồ thanh thoát, giảm thiểu tối đa các đường giao cắt.

---

## 4. BẢNG TRUY XUẤT 1:1 TỪ USE CASE ĐẾN BACKEND CONTROLLER & DỊCH VỤ

Toàn bộ 53 Use Cases đều có mã nguồn cụ thể tương ứng tại các controller của 15 microservices:

| Mã UC | Tên Use Case | Phân hệ (Package) | Backend Service / Controller Phụ Trách | Endpoint & HTTP Method |
| :---: | :--- | :---: | :--- | :--- |
| **UC-01** | Tạo đơn gửi hàng (`<<abstract>>`) | P1: Đơn hàng | `shipment-service` | Contract trừu tượng |
| **UC-01a**| Tạo đơn trên Portal | P1: Đơn hàng | `shipment-service` (`shipment.controller.ts`) | `POST /shipments` |
| **UC-01b**| Đồng bộ Webhook Sàn TMĐT | P1: Đơn hàng | `gateway-bff` (`merchant-integrations.controller.ts`) | `POST /merchant/integrations/orders/webhook` |
| **UC-02** | Tra cứu danh sách & Lọc đơn | P1: Đơn hàng | `shipment-service` (`shipment.controller.ts`) | `GET /shipments` |
| **UC-03** | Tính cước quy đổi IATA | P1: Đơn hàng | `pricing-service` (`pricing.controller.ts`) | `POST /quotes` |
| **UC-04** | Yêu cầu bưu tá lấy hàng | P1: Đơn hàng | `pickup-service` (`pickup.controller.ts`) | `POST /pickups` |
| **UC-05** | Đổi địa chỉ / SĐT / COD | P1: Đơn hàng | `shipment-service` (`change-request.controller.ts`) | `POST /change-requests` |
| **UC-06** | Hủy đơn gửi hàng | P1: Đơn hàng | `shipment-service` (`shipment.controller.ts`) | `POST /shipments/:id/cancel` |
| **UC-07** | In phiếu gửi Barcode / QR | P1: Đơn hàng | `gateway-bff` (`merchant-integrations.controller.ts`) | `POST /merchant/integrations/labels/print` |
| **UC-08** | Quét tiếp nhận gom hàng | P2: Vận hành | `scan-service` (`scan.controller.ts`) | `POST /scans/pickup` |
| **UC-09** | Quét mã nhập kho (Inbound) | P2: Vận hành | `scan-service` (`scan.controller.ts`) | `POST /scans/inbound` |
| **UC-10** | Quét mã xuất kho (Outbound) | P2: Vận hành | `scan-service` (`scan.controller.ts`) | `POST /scans/outbound` |
| **UC-11** | Đóng bao Manifest & Niêm chì | P2: Vận hành | `manifest-service` (`manifest.controller.ts`) | `POST /manifests/bagging` |
| **UC-12** | Tiếp nhận bao tải đầu tuyến | P2: Vận hành | `manifest-service` (`manifest.controller.ts`) | `POST /manifests/receive` |
| **UC-13** | Phân công task & Tối ưu tuyến | P2: Vận hành | `dispatch-service` (`dispatch.controller.ts`) | `POST /dispatch/tasks`, `POST /dispatch/optimize` |
| **UC-14** | Thực hiện chuyến phát | P2: Vận hành | `delivery-service` (`delivery.controller.ts`) | `POST /delivery/attempts` |
| **UC-14a**| Ký nhận điện tử e-POD & OTP | P2: Vận hành | `delivery-service` (`delivery.controller.ts`) | `POST /delivery/success` |
| **UC-15** | Báo phát thất bại NDR | P2: Vận hành | `delivery-service` (`delivery.controller.ts`) | `POST /delivery/fail` |
| **UC-16** | Hẹn lại ngày phát | P2: Vận hành | `delivery-service` (`delivery.controller.ts`) | `POST /delivery/reschedule` |
| **UC-17** | Xử lý chuyển hoàn (RTS) | P2: Vận hành | `delivery-service` (`delivery.controller.ts`) | `POST /delivery/rts` |
| **UC-19** | Khởi tạo khiếu nại sự cố | P3: Sự cố | `shipment-service` (`claims.controller.ts`) | `POST /claims` |
| **UC-19a**| Bưu tá đồng kiểm & Ký số | P3: Sự cố | `shipment-service` (`claims.controller.ts`) | `POST /claims/:id/co-inspect` |
| **UC-20** | Thẩm định sự cố ($\le 500\text{k}$) | P3: Sự cố | `shipment-service` (`claims.controller.ts`) | `POST /claims/:id/evaluate` |
| **UC-21** | Phê duyệt bồi thường ($> 500\text{k}$) | P3: Sự cố | `shipment-service` (`claims.controller.ts`) | `POST /claims/:id/approve` |
| **UC-21a**| Điều tra & Hòa giải tranh chấp | P3: Sự cố | `shipment-service` (`investigations.controller.ts`) | `POST /investigations` |
| **UC-22** | Cấn trừ tiền bồi thường | P3: Sự cố | `shipment-service` (`claims.controller.ts`) | `POST /claims/:id/settle` |
| **UC-23** | Thu hộ tiền COD bưu phẩm (`<<abstract>>`) | P4: Tài chính | `payment-service` | Contract trừu tượng |
| **UC-23a**| Thu tiền mặt tại điểm phát | P4: Tài chính | `payment-service` (`cod.controller.ts`) | `POST /cod/collect-cash` |
| **UC-23b**| Thanh toán VietQR SePay động | P4: Tài chính | `payment-service` (`cod.controller.ts`) | `POST /cod/generate-qr` |
| **UC-24** | Quyết toán ca nộp tiền bưu tá | P4: Tài chính | `payment-service` (`cod.controller.ts`) | `POST /cod/courier-remittance` |
| **UC-25** | Đối soát tự động SePay Webhook | P4: Tài chính | `payment-service` (`sepay-webhook.controller.ts`) | `POST /webhooks/sepay` |
| **UC-26** | Lập bảng kê đối soát COD | P4: Tài chính | `payment-service` (`cod.controller.ts`) | `POST /cod/settlements/statements` |
| **UC-27** | Xác nhận đối soát & Chốt sổ | P4: Tài chính | `payment-service` (`cod.controller.ts`) | `POST /cod/settlements/confirm` |
| **UC-28** | Báo cáo dòng tiền & Doanh thu | P4: Tài chính | `reporting-service` (`reporting.controller.ts`) | `GET /reports/financial` |
| **UC-32** | Tra cứu lộ trình công khai | P5: Truy vết | `tracking-service` (`tracking.controller.ts`) | `GET /tracking/public/:code` |
| **UC-33** | Tra cứu tiến trình nội bộ | P5: Truy vết | `tracking-service` (`tracking.controller.ts`) | `GET /tracking/internal/:code` |
| **UC-34** | Hội thoại tự nhiên với Trợ lý AI | P5: AI RAG | `chatbot-service` & `gateway-bff` | `POST /chat`, `POST /ai-assistant/chat/stream` |
| **UC-34a**| Sinh thẻ trực quan (Rich Card) | P5: AI RAG | `chatbot-service` (`rich-card.renderer.ts`) | Render payload JSON Card |
| **UC-35** | Khử định danh PII Masking | P5: Truy vết | `tracking-service` (`pii-masking.interceptor.ts`) | Xử lý nội bộ dữ liệu trước khi trả về |
| **UC-36** | Định vị GPS thời gian thực | P5: Truy vết | `scan-service` (`location.controller.ts`) | `POST /locations`, `GET /locations/:courierId` |
| **UC-37** | Bóc tách Ý định & Thực thể | P5: AI RAG | `chatbot-service` (`chat.service.ts`) | Xử lý NLP nội bộ |
| **UC-37a**| Truy xuất RAG 768-D Vectors | P5: AI RAG | `chatbot-service` (`rag.service.ts`) | `SELECT ... ORDER BY embedding <=> query_vector` |
| **UC-38** | Tư vấn cước IATA tự động | P5: AI RAG | `chatbot-service` (`tools/rate-advisor.tool.ts`) | Gọi sang `pricing-service` |
| **UC-39** | Hướng dẫn lập khiếu nại AI | P5: AI RAG | `chatbot-service` (`tools/claim-guide.tool.ts`) | RAG truy xuất chính sách BBBT 24h |
| **UC-41** | Điều chuyển nhân viên hỗ trợ | P5: AI RAG | `gateway-bff` (`chat.controller.ts`) | `POST /chat/handoff` |
| **UC-42** | Đăng nhập hệ thống (Core Auth Hub) | Auth Gateway | `auth-service` (`auth.controller.ts`) | `POST /auth/login` |
| **UC-43** | Đăng ký tài khoản khách | Auth Gateway | `auth-service` (`auth.controller.ts`) | `POST /auth/register-customer` |
| **UC-44** | Hồ sơ cá nhân & Mật khẩu | P6: Quản trị | `auth-service` (`auth.controller.ts`) | `POST /auth/change-password`, `GET/PUT /auth/own-profile` |
| **UC-45** | Quản trị người dùng & Tài khoản | P6: Quản trị | `auth-service` (`auth.controller.ts`) | `GET/POST/PUT /users` |
| **UC-46** | Phân quyền RBAC Matrix | P6: Quản trị | `auth-service` (`mobile-permissions.controller.ts`) | `GET /auth/mobile-permissions` |
| **UC-47** | Nhật ký kiểm toán bảo mật | P6: Quản trị | `auth-service` (`admin-audit.controller.ts`) | `GET /auth/admin-audit` |
| **UC-48** | Quản trị Hubs 4 cấp | P6: Quản trị | `masterdata-service` (`hub.controller.ts`) | `GET/POST/PUT /masterdata/hubs` |
| **UC-49** | Quản lý phân vùng địa lý | P6: Quản trị | `masterdata-service` (`zone.controller.ts`) | `GET/POST/PUT /masterdata/zones` |
| **UC-50** | Cấu hình hệ thống & SLA | P6: Quản trị | `masterdata-service` (`config.controller.ts`) | `GET/POST/PUT /masterdata/configs` |
| **UC-51** | CMS Quản trị bài viết | P6: Quản trị | `masterdata-service` (`policy.controller.ts`) | `GET/POST/PUT /masterdata/policies` |
| **UC-52** | Hồ sơ đối tác Merchant | P6: Quản trị | `masterdata-service` (`merchant-profile.controller.ts`) | `GET/POST/PUT /masterdata/merchant-profiles` |
| **UC-53** | Danh mục lý do giao NDR | P6: Quản trị | `masterdata-service` (`ndr-reason.controller.ts`) | `GET/POST/PUT /masterdata/ndr-reasons` |

---

## 5. MA TRẬN PHÂN QUYỀN TRUY CẬP RBAC ĐẦY ĐỦ (COMPLETE RBAC ACCESS MATRIX)

Ký hiệu quyền:
- **C** *(Create)*: Khởi tạo dữ liệu mới.
- **R** *(Read)*: Xem / Tra cứu thông tin.
- **U** *(Update)*: Cập nhật / Chỉnh sửa trạng thái.
- **D** *(Delete)*: Hủy bỏ / Xóa dữ liệu.
- **-**: Không có quyền truy cập.

| Mã UC | Tên Trường hợp Sử dụng (Use Case Name) | GUEST | CUSTOMER | MERCHANT | COURIER | OPS | SYSTEM_ADMIN |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **UC-01a**| Tạo đơn trên Portal | - | - | **C** | - | **C** | **C** |
| **UC-01b**| Đồng bộ Webhook Sàn TMĐT | - | - | **C/U** | - | - | **C/U** |
| **UC-02** | Tra cứu danh sách & Lọc đơn | - | - | **R** | - | **R** | **R** |
| **UC-03** | Tính cước quy đổi IATA | **R** | **R** | **R** | **R** | **R** | **R/U** |
| **UC-04** | Yêu cầu bưu tá lấy hàng | - | - | **C/R** | **R/U** | **R/U** | **R/U** |
| **UC-05** | Đổi địa chỉ / SĐT / COD | - | - | **U** | - | **U** | **U** |
| **UC-06** | Hủy đơn gửi hàng | - | - | **U/D** | - | - | **U/D** |
| **UC-07** | In phiếu gửi Barcode / QR | - | - | **R** | **R** | **R** | **R** |
| **UC-08** | Quét tiếp nhận gom hàng | - | - | - | **C/U** | **C/U** | **R** |
| **UC-09** | Quét mã nhập kho (Inbound) | - | - | - | - | **C/U** | **R** |
| **UC-10** | Quét mã xuất kho (Outbound) | - | - | - | - | **C/U** | **R** |
| **UC-11** | Đóng bao Manifest & Niêm chì | - | - | - | - | **C/U** | **R** |
| **UC-12** | Tiếp nhận bao tải đầu tuyến | - | - | - | - | **C/U** | **R** |
| **UC-13** | Phân công task & Tối ưu tuyến | - | - | - | - | **C/U** | **R/U** |
| **UC-14** | Thực hiện chuyến phát | - | **R** | **R** | **C/U** | **R** | **R** |
| **UC-14a**| Ký nhận điện tử e-POD & OTP | - | **U** | **R** | **C/U** | **R** | **R** |
| **UC-15** | Báo phát thất bại NDR | - | **R** | **R** | **C/U** | **R/U** | **R** |
| **UC-16** | Hẹn lại ngày phát | - | **U** | **U** | **R** | **C/U** | **R** |
| **UC-17** | Xử lý chuyển hoàn (RTS) | - | **R** | **U** | **R** | **C/U** | **R** |
| **UC-19** | Khởi tạo khiếu nại sự cố | - | **C/R** | **C/R** | - | **R** | **R** |
| **UC-19a**| Bưu tá đồng kiểm & Ký số | - | **U** | - | **C/U** | **R** | **R** |
| **UC-20** | Thẩm định sự cố ($\le 500\text{k}$) | - | - | - | - | **C/U** | **R** |
| **UC-21** | Phê duyệt bồi thường ($> 500\text{k}$) | - | - | - | - | - | **C/U** |
| **UC-21a**| Điều tra & Hòa giải tranh chấp | - | **R** | **R** | **R** | **U** | **C/U** |
| **UC-22** | Cấn trừ tiền bồi thường | - | - | - | - | - | **C/U** |
| **UC-23a**| Thu tiền mặt tại điểm phát | - | **U** | - | **C/U** | **R** | **R** |
| **UC-23b**| Thanh toán VietQR SePay động | - | **C** | - | **R** | **R** | **R** |
| **UC-24** | Quyết toán ca nộp tiền bưu tá | - | - | - | **C** | **U** | **R/U** |
| **UC-25** | Đối soát tự động SePay Webhook | - | - | - | - | - | **C/U** |
| **UC-26** | Lập bảng kê đối soát COD | - | - | **R** | - | - | **C/U** |
| **UC-27** | Xác nhận đối soát & Chốt sổ | - | - | **U** | - | - | **C/U** |
| **UC-28** | Báo cáo dòng tiền & Doanh thu | - | - | **R** | - | **R** | **C/R/U** |
| **UC-32** | Tra cứu lộ trình công khai | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-33** | Tra cứu tiến trình nội bộ | - | - | - | **R** | **R** | **R** |
| **UC-34** | Hội thoại tự nhiên với Trợ lý AI | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-34a**| Sinh thẻ trực quan (Rich Card) | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-35** | Khử định danh PII Masking | **R** | **R** | - | - | - | - |
| **UC-36** | Định vị GPS thời gian thực | - | **R** | **R** | **R/U** | **R** | **R** |
| **UC-37** | Bóc tách Ý định & Thực thể | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-37a**| Truy xuất RAG 768-D Vectors | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-38** | Tư vấn cước IATA tự động | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-39** | Hướng dẫn lập khiếu nại AI | - | **C/R** | **C/R** | - | - | - |
| **UC-41** | Điều chuyển nhân viên hỗ trợ | - | **R** | **R** | - | **R/U** | **R/U** |
| **UC-42** | Đăng nhập hệ thống (Core Auth Hub) | - | **R** | **R** | **R** | **R** | **R** |
| **UC-43** | Đăng ký tài khoản khách | **C** | - | - | - | - | - |
| **UC-44** | Hồ sơ cá nhân & Mật khẩu | - | **R/U** | **R/U** | **R/U** | **R/U** | **R/U** |
| **UC-45** | Quản trị người dùng & Tài khoản | - | - | - | - | - | **C/R/U/D** |
| **UC-46** | Phân quyền RBAC Matrix | - | - | - | - | - | **C/R/U/D** |
| **UC-47** | Nhật ký kiểm toán bảo mật | - | - | - | - | **R** | **R/D** |
| **UC-48** | Quản trị Hubs 4 cấp | - | - | - | - | **R** | **C/R/U/D** |
| **UC-49** | Quản lý phân vùng địa lý | - | - | - | - | **R/U** | **C/R/U/D** |
| **UC-50** | Cấu hình hệ thống & SLA | - | - | - | - | **R** | **C/R/U/D** |
| **UC-51** | CMS Quản trị bài viết | - | - | - | - | - | **C/R/U/D** |
| **UC-52** | Hồ sơ đối tác Merchant | - | - | **R/U** | - | **R** | **C/R/U/D** |
| **UC-53** | Danh mục lý do giao NDR | - | - | - | **R** | **R** | **C/R/U/D** |

---

## 6. HƯỚNG DẪN TRẢ LỜI PHẢN BIỆN HỘI ĐỒNG CHẤM KHÓA LUẬN (DEFENSE FAQ)

### Câu hỏi 1: Tại sao sơ đồ Use Case lại có đúng 53 trường hợp sử dụng và phân rã thành 6 Phân hệ + Cổng Xác thực Trung tâm? Có tính năng nào "vẽ khống" (hallucinated) không?
> **Trả lời chuẩn của Tác giả:**  
> *"Dạ kính thưa Thầy/Cô trong Hội đồng, sơ đồ Use Case này hoàn toàn không có bất kỳ tính năng lý thuyết nào được vẽ thêm, mà là sự phản ánh chính xác 1:1 từ mã nguồn của 15 Backend Microservices và 6 Ứng dụng Client hiện hành trong kho mã nguồn của Dự án Nexus.  
> Từng Use Case trong số 53 trường hợp sử dụng đều tương ứng với một endpoint RESTful cụ thể, có controller xử lý, có DTO kiểm tra hợp lệ, có entity cơ sở dữ liệu và có giao diện trên ứng dụng tương ứng (ví dụ: `POST /shipments` tương ứng với UC-01a, `POST /cod/collect-cash` tương ứng với UC-23a, `POST /claims/:id/co-inspect` tương ứng với UC-19a).  
> Chúng em đã rà soát và loại bỏ các tính năng suy đoán chưa code như OTP SMS hay SSO doanh nghiệp để bảo đảm tính trung thực tuyệt đối giữa lý thuyết và sản phẩm thực tế."*

### Câu hỏi 2: Tại sao hệ thống lại quy định đúng 6 Vai trò Tác nhân cụ thể (GUEST, CUSTOMER, MERCHANT, COURIER, OPS, SYSTEM_ADMIN)?
> **Trả lời chuẩn của Tác giả:**  
> *"Dạ thưa Thầy/Cô:  
> 1. Trong phân hệ giao nhận hiện trường, chỉ có duy nhất một vai trò bưu tá thực địa là `COURIER` (sử dụng `courier-mobile :8081`).  
> 2. Trong kho bãi và bưu cục, nhóm vai trò vận hành (`HUB_OPS`, `DISPATCHER`, `SORTER`, `INVENTORY_CLERK`, `OPS_MANAGER`) được chuẩn hóa chung dưới tác nhân `OPS` (sử dụng `ops-web :5175`).  
> 3. Trong quản trị cấp cao, mã nguồn xác định vai trò tối cao là `SYSTEM_ADMIN` (sử dụng `admin-web :5173`).  
> 4. Khách hàng bên ngoài gồm khách vãng lai `GUEST` (sử dụng `guest-web :5174`), người nhận hàng `CUSTOMER` (sử dụng `customer-mobile :8082`), và chủ shop gửi hàng `MERCHANT` (sử dụng `merchant-web :5176`).  
> Nhờ cấu trúc này, ma trận RBAC phản ánh chính xác 100% cấu hình phân quyền trong `auth-service`."*

### Câu hỏi 3: Bản chất của quan hệ Kế thừa Use Case tại `UC-01` và `UC-23` được hiện thực ra sao trong mã nguồn?
> **Trả lời chuẩn của Tác giả:**  
> *"Dạ thưa Thầy/Cô:  
> - Tại `UC-01: Tạo đơn gửi hàng`, nghiệp vụ tạo đơn có 2 hình thức triển khai đa hình (Polymorphism): `UC-01a` (nhập form thủ công trên Portal Merchant qua `shipment-service`) và `UC-01b` (đồng bộ tự động qua webhook sàn TMĐT Shopee/Lazada qua `gateway-bff`). Cả hai hình thức đều thừa hưởng logic tính cước quy đổi IATA (`UC-03`) và sinh nhãn in barcode (`UC-07`).  
> - Tại `UC-23: Thu tiền COD bưu phẩm`, khách hàng có thể chọn trả bằng tiền mặt cho bưu tá (`UC-23a` qua `POST /cod/collect-cash`) hoặc quét mã VietQR động SePay (`UC-23b` qua `POST /cod/generate-qr`). Khi khách quét mã QR thành công, cổng SePay bắn webhook về `payment-service` (`UC-25`) để tự động gạch nợ đơn hàng trong 2 giây mà không cần bưu tá đếm tiền hay nộp ca thủ công."*

### Câu hỏi 4: Kiến trúc xác thực Đăng nhập & Đăng ký được biểu diễn thế nào trên sơ đồ và mã nguồn?
> **Trả lời chuẩn của Tác giả:**  
> *"Dạ thưa Thầy/Cô:  
> Để bảo mật hệ thống theo tiêu chuẩn Zero Trust, các phân hệ nghiệp vụ không tự ý xử lý đăng nhập cục bộ mà đều phụ thuộc vào Cổng Xác thực Trung tâm (Central Auth Gateway) đặt tại vị trí trung tâm đại lộ của sơ đồ:  
> - 6 Use Case nghiệp vụ chính của 6 phân hệ bắt buộc phải có quan hệ `<<include>>` đến `UC-42: Đăng nhập hệ thống`. Để gọi API, client phải gửi kèm Opaque Bearer Token và qua RBAC Guard của `gateway-bff`.  
> - Khách vãng lai (`GUEST`) có thể tự đăng ký tài khoản tại `UC-43: Đăng ký tài khoản khách`. Sau khi đăng ký thành công, mối quan hệ `<<extend>>` cho phép người dùng tự động chuyển hướng đăng nhập vào `UC-42`."*

### Câu hỏi 5: Tại sao trên sơ đồ có quan hệ Kế thừa Tác nhân giữa Khách hàng và Khách vãng lai (CUSTOMER ──▷ GUEST)?
> **Trả lời chuẩn của Tác giả:**  
> *"Dạ kính thưa Thầy/Cô:  
> Trong mô hình hóa hướng đối tượng UML 2.5, quan hệ Kế thừa Tác nhân (Actor Generalization) được áp dụng khi một tác nhân chuyên biệt thừa hưởng toàn bộ khả năng tương tác của một tác nhân tổng quát:  
> 1. Khách hàng (`CUSTOMER`) là người dùng đã xác thực, đương nhiên sở hữu mọi khả năng tương tác công khai của Khách vãng lai (`GUEST`) như tra cứu lộ trình bưu gửi (`UC-32`), hội thoại tự nhiên với Trợ lý AI (`UC-34`) và nhận tư vấn cước IATA (`UC-38`).  
> 2. Việc định nghĩa mũi tên kế thừa `CUSTOMER ──▷ GUEST` giúp sơ đồ tối ưu hóa về mặt thị giác, không cần vẽ các đường liên kết trùng lặp từ Khách hàng đến các tính năng công khai, giúp sơ đồ giữ được độ thoáng đãng cao mà vẫn bảo đảm đầy đủ tính kế thừa nghiệp vụ chuẩn mực."*

---

> **Kết luận:** Tài liệu đặc tả này cùng bản vẽ vector [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg) tạo thành một khối thống nhất, bảo đảm độ tin cậy khoa học cao nhất trước Hội đồng Khóa luận Tốt nghiệp.
