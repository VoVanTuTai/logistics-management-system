# Tổng Quan Thiết Kế Kiến Trúc Hệ Thống Nexus Logistics

Tài liệu này tóm tắt các nguyên tắc thiết kế kiến trúc phân tán, quyền sở hữu dữ liệu (Data Ownership) và luồng xử lý sự kiện trong toàn bộ hệ thống Nexus Logistics.

> 📖 **Nguồn tham chiếu chi tiết và chuẩn mực nhất:**  
> Toàn bộ đặc tả chi tiết về 13 microservices, cổng kết nối, cơ chế outbox và schema đã được trình bày đầy đủ tại [**`docs/PROJECT-OVERVIEW.md`**](../PROJECT-OVERVIEW.md).

---

## 1. Các Nguyên Tắc Kiến Trúc Cốt Lõi (Architectural Principles)

| Nguyên tắc | Hiện thực trong hệ thống |
| :--- | :--- |
| **Cổng giao tiếp đơn nhất (Single Client Entrypoint)** | Toàn bộ ứng dụng Web/Mobile đều gọi qua `gateway-bff` (Port 3000); các microservices nội bộ không được mở trực tiếp ra ngoài internet. |
| **Quyền sở hữu dữ liệu (Database per Service)** | Mỗi microservice sở hữu schema PostgreSQL riêng biệt. Nghiêm cấm service này đọc/ghi trực tiếp vào DB của service khác. |
| **Mô hình Hướng sự kiện (Event-Driven Projections)** | Các dịch vụ write-side (`shipment`, `scan`, `delivery`, `payment`) phát sinh sự kiện qua RabbitMQ (`domain.events`). Các dịch vụ read model (`tracking`, `reporting`) tiêu thụ để cập nhật trạng thái chiếu (projection). |
| **Tách biệt Đọc/Ghi (CQRS-lite)** | `shipment-service` là nguồn chân lý cho trạng thái vận đơn; `tracking-service` và `reporting-service` chỉ là read model phục vụ tra cứu tốc độ cao. |
| **Phân hệ Trợ lý AI Chuyên trách** | Phân hệ `@NEXUS/chatbot-service` (Port 3013) tích hợp Hybrid RAG + Function Calling để tự động hóa hỗ trợ khách hàng và chủ hàng 24/7. |

---

## 2. Bản Đồ Dịch Vụ & Cổng Vận Hành

| Dịch vụ | Cổng | Cơ sở dữ liệu | Vai trò chính |
| :--- | :---: | :--- | :--- |
| `gateway-bff` | 3000 | `chat_db` | Đảo ngược proxy, xác thực token, tải file media, WebSocket real-time |
| `masterdata-service` | 3001 | `masterdata_db` | Danh mục bưu cục (Hub), tuyến vận chuyển, cấu hình hệ thống |
| `shipment-service` | 3002 | `shipment_db` | Vòng đời bưu phẩm và máy trạng thái (State Machine) đơn hàng |
| `pickup-service` | 3003 | `pickup_db` | Yêu cầu lấy hàng của Merchant |
| `dispatch-service` | 3004 | `dispatch_db` | Điều phối nhiệm vụ cho Shipper/Tài xế trung chuyển |
| `manifest-service` | 3005 | `manifest_db` | Tạo bảng kê (Manifest), đóng túi bưu gửi, niêm phong seal |
| `scan-service` | 3006 | `scan_db` | Ghi nhận sự kiện quét mã vạch (quét lấy, quét nhập kho, xuất kho) |
| `delivery-service` | 3007 | `delivery_db` | Quản lý phát hàng, ký nhận POD, mã OTP, xử lý giao thất bại (NDR) |
| `tracking-service` | 3008 | `tracking_db` | Read model tổng hợp lịch sử hành trình theo thời gian thực |
| `reporting-service` | 3009 | `reporting_db` | Báo cáo KPI, sản lượng và tài chính vận hành |
| `auth-service` | 3010 | `auth_db` | Quản lý phiên đăng nhập, tài khoản và phân quyền người dùng |
| `payment-service` | 3011 | `payment_db` | Đối soát tiền thu hộ COD, cổng SePay, QR thanh toán |
| `pricing-service` | 3012 | in-memory rules | Chiết tính cước bưu chính và phụ phí chuẩn IATA |
| `chatbot-service` | 3013 | vector-store | Trợ lý AI hỏi đáp tri thức RAG & gọi Tool tra cứu vận đơn |

---

## 3. Bản Đồ Sơ Đồ Mermaid (Flows & Sequences)

Toàn bộ sơ đồ luồng chi tiết theo từng ứng dụng và đối tượng người dùng được lưu trữ tại thư mục [`docs/architecture/diagrams/`](diagrams/):
- **Admin Portal Flows:** [`admin-mermaid-code.md`](diagrams/admin-mermaid-code.md) & [`admin-mermaid-code-split-sequences.md`](diagrams/admin-mermaid-code-split-sequences.md)
- **Ops Hub & Branch Staff Flows:** [`ops-staff-mermaid-code.md`](diagrams/ops-staff-mermaid-code.md) & [`ops-staff-mermaid-code-blue.md`](diagrams/ops-staff-mermaid-code-blue.md)
- **Merchant Web Flows:** [`merchant-mermaid-code.md`](diagrams/merchant-mermaid-code.md)
- **Courier Mobile Flows:** [`courier-mermaid-code.md`](diagrams/courier-mermaid-code.md) & [`courier-mermaid-code-co-dau.md`](diagrams/courier-mermaid-code-co-dau.md)
- **Guest Tracking Flows:** [`guest-tracking-mermaid.md`](diagrams/guest-tracking-mermaid.md)
- **AI Chatbot RAG Architecture:** [`ai-chatbot-service-architecture.md`](ai-chatbot-service-architecture.md)
