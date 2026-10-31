# TỔNG QUAN HỆ THỐNG SƠ ĐỒ TUẦN TỰ (UML SEQUENCE DIAGRAMS)
## Hệ Thống Quản Trị & Vận Hành Bưu Chính Logistics Nexus Express

Tài liệu này đóng vai trò mục lục điều hướng, quy chuẩn thiết kế và tài liệu tham chiếu toàn diện cho toàn bộ các **Sơ đồ tuần tự (UML Sequence Diagrams)** của nền tảng bưu chính **Nexus Express System**.

Mọi sơ đồ được chuẩn hóa theo quy chuẩn **UML 2.5**, định dạng bằng mã **Mermaid** hiện đại, nhúng sẵn cấu hình hiển thị bảng màu xanh chuyên nghiệp (*Professional Cyan/Blue Theme*), tương thích hoàn hảo với trình xem trực tiếp trên **VS Code**, **GitHub Markdown Preview**, và dễ dàng kết xuất phục vụ thuyết minh Khóa luận / Đồ án tốt nghiệp.

---

## 1. Cấu Trúc Thư Mục Phân Tầng Theo Actor

Thư mục `docs/sequence-diagrams/` được quy hoạch theo 7 Actor chuẩn hóa đã được đặc tả tại tài liệu chuẩn nghiệp vụ [`docs/CHUC-NANG-THEO-TUNG-ACTOR.md`](../CHUC-NANG-THEO-TUNG-ACTOR.md) và tài liệu kiến trúc [`docs/PROJECT-OVERVIEW.md`](../PROJECT-OVERVIEW.md):

```text
docs/sequence-diagrams/
├── README.md                      # [Bạn đang xem] Mục lục tổng thể & Tiêu chuẩn kỹ thuật
├── 01-guest/                      # Actor 1: Khách Vãng Lai (Guest Web - :5174)
│   └── README.md                  # Sơ đồ tra cứu timeline, ước tính cước IATA, tạo đơn nhanh, chat AI RAG
├── 02-merchant/                   # Actor 2: Người Gửi Hàng (Merchant Web - :5176)
│   └── README.md                  # Sơ đồ tạo đơn, cước IATA, tem FRAGILE, pickup, hủy đơn, in A6/A7, đối soát COD
├── 03-courier/                    # Actor 3: Nhân Viên Giao Hàng (Courier Mobile - :8081)
│   └── README.md                  # Sơ đồ quét camera lấy hàng, phát thành công, xác thực OTP, ảnh POD, offline queue
├── 04-ops-staff/                  # Actor 4: Nhân Viên Vận Hành (Ops Web - :5175)
│   └── README.md                  # Sơ đồ duyệt pickup, đóng bao MB, khóa seal, xe tải XT, inbound/outbound, handoff
├── 05-admin/                      # Actor 5: Quản Trị Viên (Admin Web - :5173)
│   └── README.md                  # Sơ đồ quản trị user, phân công nhân sự, RBAC, Hub 4 cấp, Zone cước, NDR reason, Audit
├── 06-customer/                   # Actor 6: Khách Hàng Cá Nhân (Customer Mobile - :8082)
│   └── README.md                  # Sơ đồ tạo đơn lẻ, so sánh gói cước, sổ địa chỉ, floating chat AI, mã OTP nhận hàng
└── 07-system-ai/                  # Actor 7: Hệ Thống & Trợ Lý AI (Backend Engines & Microservices Mesh)
    └── README.md                  # Sơ đồ động cơ IATA V/6000, Hybrid RAG, 5 dynamic tools, LLM fallback, Outbox MQ, SePay
```

---

## 2. Ma Trận Ánh Xạ Actor - Ứng Dụng - Microservices

| STT | Actor | Ứng Dụng Client | Cổng Port | Danh Sách Microservices Backend Phụ Trách |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **Khách Vãng Lai** (*Guest*) | `apps/guest-web` | `:5174` | `tracking-service` (:3008), `pricing-service` (:3012), `masterdata-service` (:3001), `chatbot-service` (:3013), `shipment-service` (:3002) |
| **02** | **Người Gửi Hàng** (*Merchant / Shop*) | `apps/merchant-web` | `:5176` | `shipment-service` (:3002), `pickup-service` (:3003), `pricing-service` (:3012), `tracking-service` (:3008), `payment-service` (:3011), `auth-service` (:3010) |
| **03** | **Nhân Viên Giao Hàng** (*Courier / Shipper*) | `apps/courier-mobile` | `:8081` | `dispatch-service` (:3004), `scan-service` (:3006), `delivery-service` (:3007), `payment-service` (:3011), `gateway-bff` (:3000), MinIO S3 (:9000) |
| **04** | **Nhân Viên Vận Hành** (*Ops Staff*) | `apps/ops-web` | `:5175` | `shipment-service` (:3002), `pickup-service` (:3003), `dispatch-service` (:3004), `manifest-service` (:3005), `scan-service` (:3006), `delivery-service` (:3007), `linehaul-service` (:3014), `payment-service` (:3011) |
| **05** | **Quản Trị Viên** (*System Admin*) | `apps/admin-web` | `:5173` | `auth-service` (:3010), `masterdata-service` (:3001), `reporting-service` (:3009), `gateway-bff` (:3000) |
| **06** | **Khách Hàng Cá Nhân** (*Customer C-End*) | `apps/customer-mobile` | `:8082` | `shipment-service` (:3002), `pricing-service` (:3012), `tracking-service` (:3008), `chatbot-service` (:3013), `delivery-service` (:3007), `auth-service` (:3010) |
| **07** | **Tác Nhân Hệ Thống & AI** (*System & AI Engine*) | Nền tảng cốt lõi | Các Ports | `chatbot-service` (:3013), `pricing-service` (:3012), `payment-service` (:3011), Outbox Relay, RabbitMQ (`domain.events`), MinIO |

---

## 3. Tiêu Chuẩn Thiết Kế & Cấu Hình Khối Sơ Đồ Mermaid

Nhằm đảm bảo giao diện đồ họa đồng nhất, rõ ràng, dễ đọc khi in ấn tài liệu hoặc đưa vào Slide bảo vệ, toàn bộ sơ đồ sequence trong hệ thống đều tích hợp khối khởi tạo giao diện (*Mermaid Initialization Directives*):

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
    "labelTextColor": "#0D47A1",
    "loopTextColor": "#0D47A1"
  }
}}%%
sequenceDiagram
    autonumber
    ...
```

### Quy tắc bất di bất dịch khi mô hình hóa:
1. **Đánh số tự động (`autonumber`)**: Bắt buộc gắn autonumber cho từng bước tương tác để đối chiếu văn bản thuyết minh.
2. **Khai báo Lifelines rõ ràng**: Phân tách tường minh giữa `actor` (Người dùng cuối), `participant Web/App` (Giao diện Client), `participant Gateway` (API Gateway BFF :3000), `participant Service` (Microservice nghiệp vụ), và `participant EventBus / Storage` (Hạ tầng RabbitMQ, PostgreSQL, MinIO S3).
3. **Phân nhánh kịch bản đầy đủ (`alt / else`)**: Thể hiện đầy đủ luồng thành công (*Happy Path*) và các luồng ngoại lệ/thất bại (*Validation Error, Not Found, Timeout, Network Failure*).
4. **Vòng lặp & Xử lý khối (`loop`, `par`)**: Sử dụng `loop` cho các thao tác lặp (quét barcode nhiều kiện, SSE streaming) và `par` cho các luồng xử lý song song.

