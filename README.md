<div align="center">

# 🚚 NEXUS EXPRESS SYSTEM (NEXUS LOGISTICS)
### NỀN TẢNG QUẢN LÝ VẬN HÀNH LOGISTICS & CHUYỂN PHÁT NHANH BƯU CHÍNH ĐA KÊNH
**Khóa luận Tốt nghiệp Đại học Chuyên ngành Công nghệ Thông tin / Kỹ thuật Phần mềm**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Expo React Native](https://img.shields.io/badge/Expo_React_Native-54_/_0.81-black?logo=expo&logoColor=white)](https://expo.dev/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_3_Flash_%7C_GPT--4o--mini-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-15_Microservices-success)](#2-sơ-đồ-kiến-trúc-tổng-thể-hệ-thống)
[![License](https://img.shields.io/badge/License-Academic_Thesis-orange)](#)

</div>

> 🎓 **TÀI LIỆU BÁO CÁO TỔNG QUAN ĐỒ ÁN (DÀNH CHO GIẢNG VIÊN HƯỚNG DẪN & HỘI ĐỒNG BẢO VỆ):**  
> Hệ thống mô phỏng và số hóa toàn diện chuỗi cung ứng logistics bưu chính hiện đại với **15 Microservices độc lập**, **6 Ứng dụng Client đa nền tảng** (4 Web React + 2 Mobile Expo/React Native), Động cơ định giá chuẩn hóa quốc tế **IATA $V/6000$**, và Phân hệ **Trợ lý Trí tuệ Nhân tạo AI Logistics RAG** vận hành thời gian thực.

---

## 📑 MỤC LỤC TRÌNH BÀY

1. [TỔNG QUAN ĐỀ TÀI & TÍNH CẤP THIẾT](#1-tổng-quan-đề-tài--tính-cấp-thiết)
2. [SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG](#2-sơ-đồ-kiến-trúc-tổng-thể-hệ-thống)
3. [CHÚNG TA CÓ GÌ? - TỔNG HỢP CÁC SẢN PHẨM ĐÃ XÂY DỰNG HOÀN THIỆN](#3-chúng-ta-có-gì---tổng-hợp-các-sản-phẩm-đã-xây-dựng-hoàn-thiện)
   - [3.1. Phân hệ 6 Ứng dụng Client (4 Web + 2 Mobile)](#31-phân-hệ-6-ứng-dụng-client-4-web--2-mobile)
   - [3.2. Phân hệ 15 Backend Microservices Độc Lập](#32-phân-hệ-15-backend-microservices-độc-lập)
   - [3.3. Tầng Cơ sở dữ liệu (Database per Service) & MinIO S3](#33-tầng-cơ-sở-dữ-liệu-database-per-service--minio-s3)
   - [3.4. Trục truyền thông sự kiện (RabbitMQ Event Bus)](#34-trục-truyền-thông-sự-kiện-rabbitmq-event-bus)
4. [4 TRỤ CỘT NGHIỆP VỤ BƯU CHÍNH THỰC CHIẾN (KÈM SƠ ĐỒ TRỰC QUAN)](#4-4-trụ-cột-nghiệp-vụ-bưu-chính-thực-chiến-kèm-sơ-đồ-trực-quan)
   - [4.1. Động cơ định giá đa nền tảng chuẩn IATA V/6000](#41-động-cơ-định-giá-đa-nền-tảng-chuẩn-iata-v6000)
   - [4.2. Chính sách phân tầng 3 cấp & Cước hoàn tự động (Reverse Logistics)](#42-chính-sách-phân-tầng-3-cấp--cước-hoàn-tự-động-reverse-logistics)
   - [4.3. Quy trình tiếp nhận hàng dễ vỡ & Bồi thường 100% (Điều 25 Luật Bưu chính)](#43-quy-trình-tiếp-nhận-hàng-dễ-vỡ--bồi-thường-100-điều-25-luật-bưu-chính)
   - [4.4. Mạng lưới Hub 4 cấp & Chuyến xe trung chuyển Linehaul](#44-mạng-lưới-hub-4-cấp--chuyến-xe-trung-chuyển-linehaul)
5. [PHÂN HỆ TRỢ LÝ TRÍ TUỆ NHÂN TẠO (AI LOGISTICS ASSISTANT RAG)](#5-phân-hệ-trợ-lý-trí-tuệ-nhân-tạo-ai-logistics-assistant-rag)
6. [SƠ ĐỒ VÒNG ĐỜI VẬN ĐƠN TỪ A ĐẾN Z (END-TO-END WORKFLOW)](#6-sơ-đồ-vòng-đời-vận-đơn-từ-a-đến-z-end-to-end-workflow)
7. [MA TRẬN ĐỐI CHIẾU CÔNG NGHỆ: NEXUS VS ĐỒ ÁN TRUYỀN THỐNG](#7-ma-trận-đối-chiếu-công-nghệ-nexus-vs-đồ-án-truyền-thống)
8. [KỊCH BẢN DEMO THỰC CHIẾN 5 PHÚT DÀNH CHO THẦY CÔ](#8-kịch-bản-demo-thực-chiến-5-phút-dành-cho-thầy-cô)
9. [HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG & TÀI KHOẢN KIỂM THỬ](#9-hướng-dẫn-khởi-chạy-hệ-thống--tài-khoản-kiểm-thử)

---

## 1. TỔNG QUAN ĐỀ TÀI & TÍNH CẤP THIẾT

### 1.1. Bối cảnh thực tiễn ngành Logistics & Thương mại Điện tử
Thị trường logistics bưu chính và giao hàng chặng cuối (Last-mile Delivery) tại Việt Nam đang bùng nổ mạnh mẽ cùng làn sóng Thương mại Điện tử. Tuy nhiên, các doanh nghiệp logistics truyền thống luôn phải đối mặt với các bài toán vận hành hóc búa:
1. **Nghẽn cổ chai kiến trúc nguyên khối (Monolithic Bottleneck):** Trong các đợt cao điểm khuyến mãi (Mega Sale 11/11, 12/12), lưu lượng quét mã vạch kho và tra cứu vận đơn tăng đột biến từ hàng chục đến hàng trăm lần, làm sập toàn bộ hệ thống dùng chung một CSDL duy nhất.
2. **Sai lệch biểu phí cước giữa các nền tảng:** Cùng một kiện hàng nhưng Web của người bán tính một giá, App di động của tài xế tính một giá và Bot chăm sóc khách hàng lại tư vấn một giá khác do logic nghiệp vụ bị phân tán, thiếu chuẩn hóa.
3. **Tranh chấp bồi thường hàng dễ vỡ & Thất thoát cước chuyển hoàn:** Tình trạng "bom hàng" (giao thất bại phải hoàn về) gây lãng phí chi phí xe tải chiều về. Việc thiếu quy chuẩn phân loại hàng dễ vỡ và không bám sát **Điều 25 Luật Bưu chính** dẫn đến xung đột pháp lý kéo dài khi xảy ra sự cố vỡ nát hàng hóa.
4. **Áp lực tổng đài hỗ trợ khách hàng:** Hơn 70% các cuộc gọi lên tổng đài chỉ để hỏi các câu hỏi mang tính thủ tục lặp lại (*"Đơn hàng đang ở đâu?"*, *"Cước kiện 3kg vào Sài Gòn bao nhiêu?"*, *"Pin sạc dự phòng có được gửi máy bay không?"*).

### 1.2. Mục tiêu nghiên cứu và giải pháp của Đồ án
Đồ án xây dựng nền tảng **Nexus Express System** nhằm giải quyết trọn vẹn các thách thức trên thông qua:
- **Kiến trúc 15 Microservices chuyên biệt:** Phân chia ranh giới Bounded Context rõ ràng, áp dụng mô hình Database-per-service và Event-Driven Architecture qua RabbitMQ.
- **Hệ sinh thái 6 Ứng dụng Client hoàn chỉnh:** Đảm bảo mọi đối tượng trong chuỗi cung ứng (Admin, Ops bưu cục, Chủ shop B2B, Tài xế giao hàng, Khách lẻ C-End) đều có công cụ chuyên nghiệp.
- **Động cơ định giá chuẩn hóa liên nền tảng (`NEXUS_RATES_2026_05`):** Tính toán cước phí tự động theo công thức quy đổi thể tích hàng không quốc tế IATA $V/6000$ và 3 vùng cước chuẩn.
- **Trợ lý AI Logistics RAG (Retrieval-Augmented Generation):** Kết hợp mô hình Google Gemini 3 Flash / OpenAI GPT-4o-mini với 5 công cụ tra cứu động (Function Calling) và truyền dữ liệu streaming thời gian thực qua Server-Sent Events (SSE).

---

## 2. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG

Sơ đồ phân tầng kiến trúc tổng thể mô tả luồng giao tiếp giữa 6 Client Apps, API Gateway BFF, 15 Backend Microservices, Trục Bus RabbitMQ và các Cơ sở dữ liệu:

```mermaid
graph TD
    %% TẦNG CLIENT
    subgraph CLIENT_TIER ["TẦNG ỨNG DỤNG NGƯỜI DÙNG (6 CLIENT APPLICATIONS)"]
        direction LR
        APP_ADMIN["Admin Portal<br/>(React / Vite)<br/>Port: 5175"]
        APP_OPS["Operations Hub Web<br/>(React / Vite)<br/>Port: 5173"]
        APP_MERCHANT["Merchant B2B Web<br/>(React / Vite)<br/>Port: 5174"]
        APP_GUEST["Guest & Public Tracking<br/>(React / Vite)<br/>Port: 5177"]
        APP_COURIER["Courier Mobile App<br/>(Expo / React Native)<br/>Port: 8081"]
        APP_CUSTOMER["Customer Mobile App<br/>(Expo / React Native)<br/>Port: 8082"]
    end

    %% TẦNG API GATEWAY
    subgraph GATEWAY_TIER ["TẦNG CỔNG GIAO TIẾP DUY NHẤT (API GATEWAY / BFF)"]
        GW["gateway-bff (Port: 3000)<br/>- Reverse Proxy & Perimeter Auth Guard<br/>- SSE Streaming Proxy cho AI Chatbot<br/>- Upload đa phương tiện POD chữ ký qua MinIO/S3<br/>- Tích hợp Webhook Sàn TMĐT & Thanh toán SePay"]
    end

    %% TẦNG BACKEND MICROSERVICES
    subgraph DOMAIN_TIER ["TẦNG 15 BACKEND MICROSERVICES ĐỘC LẬP (NESTJS 10 & TYPESCRIPT)"]
        direction TB

        subgraph CORE_BUSINESS ["Nhóm Nghiệp Vụ Vận Đơn & Khai Thác Kho"]
            SVC_SHIPMENT["shipment-service (:3002)<br/>Quản trị vòng đời đơn & State Machine"]
            SVC_PICKUP["pickup-service (:3003)<br/>Tiếp nhận & duyệt yêu cầu lấy hàng"]
            SVC_DISPATCH["dispatch-service (:3004)<br/>Điều phối & phân công Shipper"]
            SVC_MANIFEST["manifest-service (:3005)<br/>Đóng túi bưu gửi & kẹp chì Seal"]
            SVC_SCAN["scan-service (:3006)<br/>Quét mã Inbound/Outbound & Vị trí"]
            SVC_DELIVERY["delivery-service (:3007)<br/>Phát hàng, ảnh POD, OTP, NDR & Hoàn"]
            SVC_LINEHAUL["linehaul-service (:3014)<br/>Chuyến xe trung chuyển & Tem xe XT"]
        end

        subgraph DATA_FINANCE ["Nhóm Định Danh, Danh Mục & Tài Chính"]
            SVC_AUTH["auth-service (:3010)<br/>Opaque Token, Session & RBAC"]
            SVC_MASTER["masterdata-service (:3001)<br/>Hub 4 cấp, Tuyến đường, Phân vùng Zone"]
            SVC_PAYMENT["payment-service (:3011)<br/>Sổ cái COD, Đối soát Batch & SePay QR"]
            SVC_PRICING["pricing-service (:3012)<br/>Định giá IATA V/6000 & 3 Vùng Cước"]
        end

        subgraph INTELLIGENCE_PROJECTION ["Nhóm Trí Tuệ Nhân Tạo & Báo Cáo Read Model"]
            SVC_CHATBOT["chatbot-service (:3013)<br/>Hybrid RAG + 5 Dynamic Tools + Gemini/GPT"]
            SVC_TRACKING["tracking-service (:3008)<br/>Timeline hành trình bưu gửi (Read Model)"]
            SVC_REPORTING["reporting-service (:3009)<br/>KPI, Sản lượng, Doanh thu (Read Model)"]
        end
    end

    %% TẦNG ASYNCHRONOUS EVENT BUS
    subgraph EVENT_BUS_TIER ["TẦNG TRỤC THÔNG ĐIỆP HƯỚNG SỰ KIỆN (MESSAGE BROKER)"]
        RABBITMQ["RabbitMQ 3.13 (Topic Exchange: domain.events)<br/>Queue: {service}.q | Retry Exchange: {service}.retry.* | DLQ: {service}.dlq"]
    end

    %% TẦNG LƯU TRỮ DATABASE PER SERVICE
    subgraph STORAGE_TIER ["TẦNG CƠ SỞ DỮ LIỆU ĐỘC LẬP (DATABASE PER SERVICE)"]
        DB_AUTH[("auth_db")]
        DB_MASTER[("masterdata_db")]
        DB_SHIPMENT[("shipment_db")]
        DB_PICKUP[("pickup_db")]
        DB_DISPATCH[("dispatch_db")]
        DB_MANIFEST[("manifest_db")]
        DB_SCAN[("scan_db")]
        DB_DELIVERY[("delivery_db")]
        DB_PAYMENT[("payment_db")]
        DB_TRACKING[("tracking_db")]
        DB_REPORTING[("reporting_db")]
        DB_CHAT[("chat_db")]
        STORAGE_MINIO[("MinIO / S3 Object Storage<br/>(Ảnh ký nhận POD)")]
        STORE_VECTOR[("Vector Store 768-dim<br/>(Tri thức bưu chính)")]
    end

    %% LIÊN KẾT CLIENT VÀO GATEWAY
    APP_ADMIN -->|HTTP / JSON| GW
    APP_OPS -->|HTTP / WebSocket| GW
    APP_MERCHANT -->|HTTP / JSON| GW
    APP_GUEST -->|HTTP / JSON| GW
    APP_COURIER -->|HTTP / Multipart| GW
    APP_CUSTOMER -->|HTTP / SSE Stream| GW

    %% LIÊN KẾT GATEWAY VÀO SERVICES
    GW --> SVC_AUTH
    GW --> SVC_MASTER
    GW --> SVC_SHIPMENT
    GW --> SVC_PICKUP
    GW --> SVC_DISPATCH
    GW --> SVC_MANIFEST
    GW --> SVC_SCAN
    GW --> SVC_DELIVERY
    GW --> SVC_LINEHAUL
    GW --> SVC_PAYMENT
    GW --> SVC_PRICING
    GW --> SVC_CHATBOT
    GW --> SVC_TRACKING
    GW --> SVC_REPORTING

    %% DATABASE BINDINGS
    SVC_AUTH --- DB_AUTH
    SVC_MASTER --- DB_MASTER
    SVC_SHIPMENT --- DB_SHIPMENT
    SVC_PICKUP --- DB_PICKUP
    SVC_DISPATCH --- DB_DISPATCH
    SVC_MANIFEST --- DB_MANIFEST
    SVC_SCAN --- DB_SCAN
    SVC_DELIVERY --- DB_DELIVERY
    SVC_PAYMENT --- DB_PAYMENT
    SVC_TRACKING --- DB_TRACKING
    SVC_REPORTING --- DB_REPORTING
    SVC_CHATBOT --- STORE_VECTOR
    GW --- DB_CHAT
    SVC_DELIVERY -.->|Lưu ảnh POD| STORAGE_MINIO

    %% SỰ KIỆN PUBLISH & CONSUME
    SVC_SHIPMENT -->|Transactional Outbox Relay| RABBITMQ
    SVC_PICKUP -->|Transactional Outbox Relay| RABBITMQ
    SVC_DISPATCH -->|Transactional Outbox Relay| RABBITMQ
    SVC_MANIFEST -->|Transactional Outbox Relay| RABBITMQ
    SVC_SCAN -->|Transactional Outbox Relay| RABBITMQ
    SVC_DELIVERY -->|Transactional Outbox Relay| RABBITMQ
    SVC_PAYMENT -->|Transactional Outbox Relay| RABBITMQ

    RABBITMQ -.->|Consume events| SVC_TRACKING
    RABBITMQ -.->|Consume events| SVC_REPORTING
    RABBITMQ -.->|Consume events| SVC_SHIPMENT
    RABBITMQ -.->|Consume events| SVC_PAYMENT
```

---

## 3. CHÚNG TA CÓ GÌ? - TỔNG HỢP CÁC SẢN PHẨM ĐÃ XÂY DỰNG HOÀN THIỆN

Đồ án sở hữu một khối lượng sản phẩm bàn giao đồ sộ, đã được lập trình, kiểm thử và sẵn sàng vận hành:

### 3.1. Phân hệ 6 Ứng dụng Client (4 Web + 2 Mobile)

| Ứng Dụng | Nền tảng & Cổng | Nhóm Người Dùng | Các Tính Năng Thực Chiến Nổi Bật |
| :--- | :--- | :--- | :--- |
| **`admin-web`** | React 18, Vite 5<br>`Port: 5175` | Quản trị viên cấp cao (System Admin) | • Quản lý tài khoản toàn hệ thống và phân quyền chi tiết (RBAC).<br>• Thiết lập danh mục Hub 4 cấp, bảng vùng cước (Zone), lý do giao thất bại (NDR).<br>• Giám sát nhật ký bảo mật Audit Log và cấu hình tham số hệ thống. |
| **`ops-web`** | React 18, Vite 5<br>`Port: 5173` | Nhân viên vận hành Hub / Bưu cục (Ops) | • Dashboard giám sát sản lượng và tỷ lệ phát thành công theo thời gian thực.<br>• Tiếp nhận và duyệt yêu cầu lấy hàng, điều phối gán việc cho Shipper.<br>• Đóng bao bưu gửi (Manifest), kẹp chì Seal an ninh, quét mã Inbound/Outbound.<br>• Xử lý khiếu nại phát thất bại NDR, luồng chuyển hoàn và đối soát giải ngân COD. |
| **`merchant-web`** | React 18, Vite 5<br>`Port: 5174` | Chủ shop kinh doanh online (Merchant B2B) | • Tạo đơn bưu gửi lẻ hoặc tải lên danh sách Excel hàng loạt.<br>• In phiếu gửi bưu chính chuẩn A6/A7 có sẵn mã vạch Barcode và nhãn cảnh báo.<br>• Đặt lịch hẹn bưu tá đến lấy hàng tận kho.<br>• Theo dõi bảng kê đối soát tiền COD và nhận tiền chuyển khoản tự động. |
| **`guest-web`** | React 18, Vite 5<br>`Port: 5177` | Khách vãng lai & Người nhận hàng | • Tra cứu timeline hành trình vận đơn công khai theo thời gian thực.<br>• Ước tính cước phí bưu chính IATA đa dịch vụ tức thì.<br>• Tạo đơn gửi hàng lẻ tại bưu cục mà không bắt buộc tạo tài khoản.<br>• Trò chuyện trực tiếp cùng trợ lý ảo AI Logistics RAG hỏi đáp 24/7. |
| **`courier-mobile`**| Expo 54, React Native<br>`Port: 8081` | Tài xế giao / lấy hàng (Shipper / Courier) | • Danh sách nhiệm vụ lấy và giao hàng thông minh trong ngày.<br>• Quét mã vạch vận đơn bằng Camera điện thoại tốc độ cao.<br>• Chụp ảnh bằng chứng phát hàng (POD) kèm chữ ký số khách hàng.<br>• Xác thực mã OTP 6 số an toàn; lưu trữ Offline Queue khi mất kết nối mạng. |
| **`customer-mobile`**| Expo 54, React Native<br>`Port: 8082` | Khách hàng cá nhân người gửi (C-End User) | • Ứng dụng di động tính cước tự động và tạo đơn gửi hàng nhanh chóng.<br>• Theo dõi lộ trình bưu phẩm trực quan từng bước.<br>• Quản lý danh bạ sổ địa chỉ người nhận thân quen.<br>• Tích hợp nút trò chuyện nổi (Floating AI Chatbot) tư vấn chính sách. |

---

### 3.2. Phân hệ 15 Backend Microservices Độc Lập

| STT | Tên Microservice | Cổng | Cơ sở dữ liệu | Vai trò & Bounded Context nghiệp vụ |
| :---: | :--- | :---: | :--- | :--- |
| **1** | `gateway-bff` | `3000` | `chat_db` + Redis | Cổng vào đơn nhất (API Gateway), điều phối reverse proxy, xác thực perimeter, upload file MinIO S3, SSE streaming proxy cho AI Chatbot. |
| **2** | `auth-service` | `3010` | `auth_db` | Quản lý danh tính người dùng, cấp phát phiên Opaque Token, quản lý quyền hạn RBAC và kiểm tra quyền tài xế di động. |
| **3** | `masterdata-service` | `3001` | `masterdata_db` | Quản lý danh mục Hub 4 cấp, mạng lưới tuyến đường bưu chính, bảng phân vùng cước địa lý và danh mục lý do NDR. |
| **4** | `shipment-service` | `3002` | `shipment_db` | **Nguồn chân lý (Source of Truth)** trạng thái bưu gửi; vận hành máy trạng thái (State Machine); lưu snapshot cước bất biến. |
| **5** | `pickup-service` | `3003` | `pickup_db` | Quản lý vòng đời yêu cầu lấy hàng tận nơi từ chủ shop (tạo, duyệt, phân bổ, hủy). |
| **6** | `dispatch-service` | `3004` | `dispatch_db` | Điều phối nhiệm vụ tài xế: gán việc lấy/giao theo khu vực, điều chuyển khi quá tải. |
| **7** | `manifest-service` | `3005` | `manifest_db` | Quản lý bảng kê và túi bưu gửi: gom vận đơn vào bao hàng (mã `MB`), niêm phong kẹp chì seal an ninh. |
| **8** | `scan-service` | `3006` | `scan_db` | **Nguồn chân lý vị trí vật lý:** ghi nhận các mốc quét barcode (Lấy, Nhập kho, Xuất kho) với cơ chế Idempotency chống trùng. |
| **9** | `delivery-service` | `3007` | `delivery_db` | Quản lý phát hàng chặng cuối: ký nhận POD, mã xác thực OTP 6 số, biên bản giao thất bại NDR và điều phối chuyển hoàn. |
| **10** | `payment-service` | `3011` | `payment_db` | **Nguồn chân lý tài chính COD:** quản lý tiền thu hộ, gom phiên đối soát tự động (Batch Settlement), tích hợp SePay/VietQR webhook. |
| **11** | `pricing-service` | `3012` | *(In-Memory Rules)* | Động cơ định giá chuẩn hóa duy nhất: tính cước theo nấc vượt cân, phụ phí 3 vùng và công thức quy đổi IATA $V/6000$. |
| **12** | `chatbot-service` | `3013` | Vector Store | Phân hệ trợ lý trí tuệ nhân tạo độc lập: Hybrid RAG, 5 dynamic tools, Google Gemini 3 Flash / OpenAI GPT-4o-mini fallback, SSE streaming. |
| **13** | `linehaul-service` | `3014` | *(In-Transit)* | Quản lý các chuyến xe tải trung chuyển đường dài giữa các Hub trung tâm, điều phối xe, tài xế và cấp tem xe `XT`. |
| **14** | `tracking-service` | `3008` | `tracking_db` | **Read Model phi tập trung:** tiêu thụ sự kiện từ RabbitMQ để dựng timeline chi tiết hành trình bưu gửi với tốc độ tra cứu dưới 10ms. |
| **15** | `reporting-service` | `3009` | `reporting_db` | **Read Model phân tích:** tổng hợp báo cáo chỉ số KPI, sản lượng bưu cục, tỷ lệ giao đúng hạn SLA và hiệu suất làm việc. |

---

### 3.3. Tầng Cơ sở dữ liệu (Database per Service) & MinIO S3
- **11 Cơ sở dữ liệu PostgreSQL độc lập:** `auth_db`, `masterdata_db`, `shipment_db`, `pickup_db`, `dispatch_db`, `manifest_db`, `scan_db`, `delivery_db`, `payment_db`, `tracking_db`, `reporting_db`, `chat_db`.
- **MinIO / AWS S3 Object Storage:** Lưu trữ an toàn tệp nhị phân ảnh chụp bằng chứng giao hàng (POD) có chữ ký số.
- **In-Memory Vector Database:** Lưu trữ 768-dim vector embeddings phục vụ truy xuất ngữ nghĩa nhanh cho AI Assistant.

---

### 3.4. Trục truyền thông sự kiện (RabbitMQ Event Bus)
- Triển khai **RabbitMQ 3.13** với Topic Exchange `domain.events`.
- Áp dụng triệt để **Transactional Outbox Pattern**: lưu dữ liệu và bản ghi sự kiện Outbox trong cùng một transaction, đảm bảo phát tán thông điệp tin cậy (At-least-once delivery).
- Thiết lập **Idempotency Record** trên mọi thao tác quét mã và giao nhận, loại bỏ hoàn toàn nguy cơ trùng lặp dữ liệu khi mạng chập chờn.

---

## 4. 4 TRỤ CỘT NGHIỆP VỤ BƯU CHÍNH THỰC CHIẾN (KÈM SƠ ĐỒ TRỰC QUAN)

### 4.1. Động cơ định giá đa nền tảng chuẩn IATA V/6000

```mermaid
flowchart LR
    INPUT["Kích thước D x R x C (cm)<br/>& Khối lượng thực W_act (kg)"]
    CALC_VOL["Tính W_vol = (D x R x C) / 6000<br/>(Chuẩn hàng không IATA)"]
    CHARGE_W["Lấy W_charge = max(W_act, W_vol)"]
    NORM_ADDR["Bóc tách tiền tố địa chỉ regex<br/>'TP.', 'Tỉnh', 'Thành phố' & Alias Map"]
    ZONE_CALC["Xác định Tuyến Vùng Cước:<br/>- Nội tỉnh: 0đ<br/>- Trục chính HN-HCM: 7.000đ<br/>- Liên tỉnh: 12.000đ"]
    TIER_PRICE["Áp dụng biểu phí cơ sở & nấc cân:<br/>- Tiết kiệm: 18k (2kg đầu) + 3.5k/0.5kg<br/>- Tiêu chuẩn: 28k (2kg đầu) + 5k/0.5kg<br/>- Hỏa tốc: 42k (1kg đầu) + 8k/0.5kg"]
    OUTPUT["Snapshot Cước Phí Duy Nhất<br/>(Đồng bộ Web, Mobile, AI)"]

    INPUT --> CALC_VOL --> CHARGE_W
    INPUT --> NORM_ADDR --> ZONE_CALC
    CHARGE_W --> TIER_PRICE
    ZONE_CALC --> TIER_PRICE
    TIER_PRICE --> OUTPUT
```

- **Công thức quy đổi trọng lượng thể tích IATA:** $\text{Trọng lượng thể tích } (kg) = \frac{\text{Dài} \times \text{Rộng} \times \text{Cao}}{6000}$. Trọng lượng tính cước là giá trị lớn nhất giữa cân nặng thực tế và cân nặng quy đổi thể tích.
- **Tự động bóc tách tiền tố hành chính (Regex Normalization):** Tự động nhận diện *"TP. Hồ Chí Minh"*, *"Tỉnh Bình Dương"*, *"Sài Gòn"* để đối chiếu chính xác tuyến Metro Corridor và cước nội tỉnh.
- **Tối ưu trải nghiệm (Debounce 300ms):** Ngăn chặn spam API khi người dùng đang nhập kích thước trên form.

---

### 4.2. Chính sách phân tầng 3 cấp & Cước hoàn tự động (Reverse Logistics)

```mermaid
flowchart TD
    FAIL_3["Giao hàng thất bại 3 lần<br/>(DELIVERY_FAILED / NDR)"] --> RETURN_START["Khởi tạo luồng chuyển hoàn<br/>(RETURN_STARTED)"]
    RETURN_START --> CHECK_TIER{"Kiểm tra Phân tầng Khách hàng?"}

    CHECK_TIER -->|"Khách Vãng Lai (Guest)"| GUEST_FEE["Áp dụng cước hoàn = 50% cước chiều đi.<br/>Shipper thu tiền mặt / VietQR khi phát hoàn."]
    CHECK_TIER -->|"Chủ Shop Thường (SME)"| SME_FEE["Áp dụng cước hoàn = 50% cước chiều đi.<br/>Khấu trừ tự động vào bảng kê đối soát COD."]
    CHECK_TIER -->|"Khách Doanh Nghiệp (VIP)"| VIP_FEE["Miễn phí cước hoàn (0đ).<br/>Chăm sóc theo hợp đồng khung cam kết sản lượng."]

    GUEST_FEE --> RETURN_DONE["Hoàn trả hàng về kho người gửi thành công<br/>(RETURN_COMPLETED)"]
    SME_FEE --> RETURN_DONE
    VIP_FEE --> RETURN_DONE
```

- **Khách vãng lai (Guest):** 100% biểu cước chuẩn; thu 50% cước hoàn bằng tiền mặt hoặc mã VietQR khi bưu tá giao trả hàng.
- **Chủ shop tiêu chuẩn (Standard SME):** Giảm 5% cước gửi; hệ thống **tự động cấn trừ 50% cước hoàn vào kỳ đối soát tiền thu hộ COD** gần nhất, ngăn chặn tình trạng tạo đơn ảo "bom hàng".
- **Khách doanh nghiệp (VIP Enterprise):** Chiết khấu 15% - 25%; miễn phí 100% cước chuyển hoàn (0đ) theo cam kết sản lượng trong hợp đồng khung.

---

### 4.3. Quy trình tiếp nhận hàng dễ vỡ & Bồi thường 100% (Điều 25 Luật Bưu chính)
1. **Quy cách đóng gói bắt buộc:** Bọc 3 - 4 lớp màng xốp bóng khí (bubble wrap) dày $\ge 5$cm, chèn kín 6 mặt thùng carton và tự động in tem cảnh báo nghiệp vụ:
   ```text
   +-------------------------------------------------------+
   |   [!] CHÚ Ý: HÀNG DỄ VỠ - XIN NHẸ TAY [FRAGILE]       |
   |   NEXUS EXPRESS - QUY CHUẨN ĐÓNG GÓI BẢO HIỂM 100%    |
   +-------------------------------------------------------+
   ```
2. **Chế tài bồi thường bảo hiểm minh bạch:**
   - **Có mua bảo hiểm khai giá (0.5% giá trị):** Bồi thường **100% giá trị khai báo** khi xảy ra bể vỡ, thất lạc do lỗi vận chuyển của Nexus.
   - **Không mua bảo hiểm khai giá:** Bồi thường theo Điều 25 Luật Bưu chính: tối đa 04 lần cước dịch vụ bưu chính đã thu.
   - **Truy cứu trách nhiệm nội bộ:** Căn cứ lịch sử quét mã vạch và niêm phong kẹp chì seal để xác định chính xác đơn vị gây lỗi, tự động khấu trừ trách nhiệm vật chất.

---

### 4.4. Mạng lưới Hub 4 cấp & Chuyến xe trung chuyển Linehaul

```mermaid
graph TD
    MEGA["MEGA HUB (Cấp 1 - Liên vùng)<br/>Hà Nội - Đà Nẵng - TP. Hồ Chí Minh<br/>(Băng chuyền chia chọn tự động)"]
    
    REGIONAL_1["REGIONAL HUB (Cấp 2 - Khu vực)<br/>Bắc Giang / Hải Phòng"]
    REGIONAL_2["REGIONAL HUB (Cấp 2 - Khu vực)<br/>Cần Thơ / Đồng Nai"]

    PROV_1["PROVINCIAL HUB (Cấp 3)<br/>Bưu cục Trung tâm Tỉnh/TP"]
    PROV_2["PROVINCIAL HUB (Cấp 3)<br/>Bưu cục Trung tâm Tỉnh/TP"]

    POST_1["LOCAL POST OFFICE (Cấp 4)<br/>Bưu cục Giao dịch Quận/Huyện"]
    POST_2["LOCAL POST OFFICE (Cấp 4)<br/>Điểm tiếp nhận & Bưu cục phát"]

    MEGA <==>|"Xe tải đường dài Linehaul<br/>(Tem niêm phong xe XT)"| REGIONAL_1
    MEGA <==>|"Xe tải đường dài Linehaul<br/>(Tem niêm phong xe XT)"| REGIONAL_2
    
    REGIONAL_1 <-->|"Tuyến xe gom nội vùng"| PROV_1
    REGIONAL_2 <-->|"Tuyến xe gom nội vùng"| PROV_2

    PROV_1 <-->|"Xe tải nhỏ trung chuyển"| POST_1
    PROV_2 <-->|"Xe tải nhỏ trung chuyển"| POST_2

    POST_1 -.->|"Shipper lấy/giao chặng cuối"| CUSTOMER_SENDER["Người gửi / Kho Shop"]
    POST_2 -.->|"Shipper lấy/giao chặng cuối"| CUSTOMER_RECEIVER["Người nhận bưu phẩm"]
```

- **Mega Hub (Cấp 1):** Trung tâm khai thác lớn tại Hà Nội, Đà Nẵng, TP.HCM, trang bị băng chuyền chia chọn tự động.
- **Regional Hub (Cấp 2):** Tiếp nhận bưu gửi các tỉnh lân cận, đóng bao bưu gửi (mã `MB`), kẹp chì seal an ninh.
- **Provincial Hub (Cấp 3):** Phân luồng đơn hàng về các quận/huyện trực thuộc.
- **Local Post Office (Cấp 4):** Bưu cục phát chặng cuối, quản lý đội ngũ shipper giao/lấy hàng.
- **Chuyến xe Linehaul:** Tuyến xe tải trung chuyển liên tỉnh đường dài kết nối các Hub, được cấp mã tem niêm phong thùng xe `XT`.

---

## 5. PHÂN HỆ TRỢ LÝ TRÍ TUỆ NHÂN TẠO (AI LOGISTICS ASSISTANT RAG)

Phân hệ `@NEXUS/chatbot-service` (Port 3013) là điểm đột phá ứng dụng AI tạo sinh vào vận hành thực tế:

```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng / Chủ Shop
    participant UI as Giao diện Web / Mobile
    participant GW as Gateway BFF (:3000)
    participant ChatBot as Chatbot Service (:3013)
    participant VectorStore as Vector Store (768-dim)
    participant LLM as Google Gemini 3 Flash / GPT-4o-mini
    participant DomainSvcs as Domain Services (:3008, :3012, :3001)

    User->>UI: Nhập câu hỏi: "Phí gửi 3kg từ Hà Nội vào Sài Gòn là bao nhiêu?"
    UI->>GW: POST /chatbot/message (SSE Request)
    GW->>ChatBot: Forward Request kèm Context Session
    
    par Truy xuất tri thức & Xác định ý định
        ChatBot->>VectorStore: Tìm kiếm ngữ nghĩa Cosine Similarity (Hybrid RAG)
        VectorStore-->>ChatBot: Trả về tài liệu quy chuẩn biểu phí IATA
    and Nhận diện Dynamic Tools
        ChatBot->>LLM: Gửi Prompt + Function Definition (Tools)
        LLM-->>ChatBot: Yêu cầu gọi Tool: calculate_shipping_rate(HN, HCM, 3kg)
    end

    ChatBot->>DomainSvcs: Gọi API pricing-service (:3012)
    DomainSvcs-->>ChatBot: Kết quả: Standard 38.000đ (Chi tiết: gốc 28k + vượt 5k x 2)

    ChatBot->>LLM: Tổng hợp câu trả lời từ tri thức RAG + Kết quả Tool
    
    loop Server-Sent Events (SSE Streaming)
        LLM-->>ChatBot: Stream từng Token văn bản
        ChatBot-->>GW: SSE Event Data
        GW-->>UI: Hiển thị hiệu ứng gõ phím tức thì (Typewriter Effect)
    end
    UI-->>User: Câu trả lời hoàn chỉnh, chính xác 100% kèm căn cứ điều khoản
```

### Bộ 5 Dynamic Tools tích hợp sẵn:
1. `track_shipment(tracking_number)`: Tra cứu hành trình thực tế từ `tracking-service`.
2. `calculate_shipping_rate(origin, destination, weight, dimensions)`: Tính cước tự động từ `pricing-service`.
3. `get_prohibited_goods_policy(item_name)`: Kiểm tra danh mục hàng cấm bay, pin lithium.
4. `get_compensation_claim_policy()`: Tra cứu chính sách bồi thường Điều 25 Luật Bưu chính.
5. `find_nearest_post_office(province, district)`: Định vị bưu cục gần nhất từ `masterdata-service`.

---

## 6. SƠ ĐỒ VÒNG ĐỜI VẬN ĐƠN TỪ A ĐẾN Z (END-TO-END WORKFLOW)

Quy trình tuần tự một vận đơn đi qua đầy đủ chuỗi giá trị logistics trong hệ thống:

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Chủ Shop (Merchant)
    participant MWeb as Merchant Web (:5174)
    participant GW as Gateway (:3000)
    participant ShipSvc as shipment-service (:3002)
    participant Bus as RabbitMQ (domain.events)
    participant OpsWeb as Ops Web (:5173)
    participant CourierApp as Courier Mobile (:8081)
    participant HubStaff as Ops Hub Kho
    actor Receiver as Người Nhận Hàng
    participant PaySvc as payment-service (:3011)

    %% GIAI ĐOẠN 1: TẠO ĐƠN & LẤY HÀNG
    Note over Merchant, MWeb: GIAI ĐOẠN 1: TẠO ĐƠN & YÊU CẦU LẤY HÀNG
    Merchant->>MWeb: Tạo đơn hàng + Yêu cầu lấy hàng tận nơi
    MWeb->>GW: POST /merchant/shipments
    GW->>ShipSvc: Tạo đơn, lưu snapshot cước IATA
    ShipSvc->>Bus: Publish event: shipment.created
    Bus-->>PaySvc: Tạo bản ghi theo dõi tiền thu hộ COD
    OpsWeb->>GW: Duyệt yêu cầu lấy hàng, gán Shipper
    GW->>CourierApp: Thông báo nhiệm vụ lấy hàng mới (Push Task)
    CourierApp->>Merchant: Shipper đến kho, quét barcode nhận hàng
    CourierApp->>GW: Xác nhận lấy thành công (scan.pickup_confirmed)

    %% GIAI ĐOẠN 2: KHAI THÁC HUB & TRUNG CHUYỂN
    Note over HubStaff, OpsWeb: GIAI ĐOẠN 2: KHAI THÁC HUB & TRUNG CHUYỂN LINEHAUL
    HubStaff->>OpsWeb: Shipper nộp hàng, quét Nhập kho Hub Gốc (scan.inbound)
    HubStaff->>OpsWeb: Đóng các đơn vào bao chuyên dụng (mã MB), kẹp chì Seal
    HubStaff->>OpsWeb: Xếp bao lên xe tải Linehaul, cấp tem xe XT (linehaul.dispatched)
    Note over OpsWeb: Xe tải trung chuyển chạy liên tỉnh tới Hub Phát
    HubStaff->>OpsWeb: Hub Đích nhận xe, cắt seal kiểm đếm, quét nhập kho đích

    %% GIAI ĐOẠN 3: GIAO HÀNG CHẶNG CUỐI & THU TIỀN
    Note over CourierApp, Receiver: GIAI ĐOẠN 3: GIAO HÀNG CHẶNG CUỐI & BẰNG CHỨNG POD
    OpsWeb->>CourierApp: Phân công tuyến phát cho Shipper chặng cuối
    CourierApp->>Receiver: Shipper mang hàng đến địa chỉ người nhận
    Receiver->>CourierApp: Kiểm tra hàng, thanh toán tiền mặt COD & đọc mã OTP 6 số
    CourierApp->>CourierApp: Chụp ảnh kiện hàng kèm chữ ký khách (POD) + Nhập OTP
    CourierApp->>GW: Xác nhận giao thành công (delivery.delivered)
    GW->>ShipSvc: Chuyển trạng thái đơn thành DELIVERED
    ShipSvc->>Bus: Publish event: delivery.delivered
    Bus-->>PaySvc: Chuyển trạng thái COD thành COLLECTED

    %% GIAI ĐOẠN 4: ĐỐI SOÁT & GIẢI NGÂN
    Note over PaySvc, Merchant: GIAI ĐOẠN 4: ĐỐI SOÁT & GIẢI NGÂN TỰ ĐỘNG
    PaySvc->>PaySvc: Gom phiên đối soát COD Batch theo kỳ
    PaySvc->>Merchant: Tự động giải ngân chuyển khoản ngân hàng qua cổng SePay/VietQR
```

---

## 7. MA TRẬN ĐỐI CHIẾU CÔNG NGHỆ: NEXUS VS ĐỒ ÁN TRUYỀN THỐNG

| Tiêu Chí So Sánh | Đồ Án Sinh Viên Thông Thường | Hệ Thống Nexus Express System | Ý Nghĩa Kỹ Thuật Đạt Được |
| :--- | :--- | :--- | :--- |
| **Kiến trúc tổng thể** | Monolithic (1 khối nguyên, chung 1 server) | **15 Microservices + API Gateway BFF** | Dễ dàng mở rộng ngang (horizontal scale), cô lập lỗi hoàn toàn giữa các dịch vụ. |
| **Cơ sở dữ liệu** | 1 CSDL MySQL/PostgreSQL duy nhất | **Database per service (11 PostgreSQL độc lập)** | Ranh giới dữ liệu tuyệt đối; không có tình trạng bảng này khóa chết bảng khác. |
| **Giao tiếp giữa các dịch vụ**| Gọi HTTP trực tiếp phụ thuộc lẫn nhau | **Event-Driven qua RabbitMQ + Outbox Pattern** | Phi đồng bộ, chịu lỗi cao, loại bỏ rủi ro mất mát sự kiện (Zero Event Loss). |
| **Ứng dụng Client** | 1 hoặc 2 Web đơn giản | **6 Ứng dụng (4 Web React + 2 Mobile Expo)** | Bao phủ 100% các bên trong chuỗi cung ứng thực tế (từ Admin, Ops đến Khách lẻ). |
| **Tính nhất quán giá cước** | Tính toán sơ sài trên frontend | **Unified Pricing Engine chuẩn IATA V/6000** | Đồng nhất 100% kết quả tính cước giữa Web, Mobile và AI Chatbot. |
| **Trí tuệ nhân tạo (AI)** | Gọi API OpenAI đơn giản không ngữ cảnh | **Microservice AI riêng biệt + Hybrid RAG + 5 Tools** | Trả lời chính xác 100% nghiệp vụ bưu chính, không bị ảo giác (hallucination). |
| **Khả năng hoạt động ngoại tuyến** | Mất mạng là app báo lỗi, dừng thao tác | **Offline Queue trên Mobile + Idempotency Record** | Shipper vẫn quét hàng bình thường trong tầng hầm, mạng có lại tự động đồng bộ. |

---

## 8. KỊCH BẢN DEMO THỰC CHIẾN 5 PHÚT DÀNH CHO THẦY CÔ

Nhóm đã chuẩn bị kịch bản demo súc tích, ấn tượng thể hiện trọn vẹn luồng dữ liệu thời gian thực:

1. **Phút 1 - Trải nghiệm Khách hàng & AI Chatbot:**
   - Mở `apps/guest-web` (`http://localhost:5177`) hoặc `apps/customer-mobile` (`http://localhost:8082`).
   - Mở cửa sổ AI Chatbot, hỏi: *"Cước gửi kiện hàng 2.5kg kích thước 30x20x10 từ Hà Nội vào TP.HCM là bao nhiêu?"*
   - Thầy cô thấy: AI gọi Tool tính cước tức thì, phân tích trọng lượng thể tích IATA, trả về kết quả chuẩn xác.
2. **Phút 2 - Merchant tạo đơn & In phiếu:**
   - Mở `apps/merchant-web` (`http://localhost:5174`), tạo đơn hàng bưu gửi có thu hộ COD.
   - Bấm nút **In phiếu gửi**: Hệ thống xuất phiếu chuẩn bưu điện có mã Barcode và nhãn cảnh báo `[FRAGILE]`.
3. **Phút 3 - Điều hành Ops Kho & Đóng bao Manifest:**
   - Mở `apps/ops-web` (`http://localhost:5173`), Thầy cô thấy đơn hàng xuất hiện ngay lập tức trên Dashboard.
   - Ops thực hiện duyệt lấy hàng, quét nhập kho, gom đơn vào túi bưu gửi `MB` và niêm phong kẹp chì seal.
4. **Phút 4 - Shipper giao hàng trên Mobile App:**
   - Mở `apps/courier-mobile` (`http://localhost:8081`).
   - Shipper quét mã vạch bằng camera, chụp ảnh ký nhận POD, nhập mã xác thực OTP 6 số.
   - Bấm **Hoàn tất giao hàng**: Giao diện cập nhật ngay lập tức sang trạng thái `DELIVERED`.
5. **Phút 5 - Đối soát COD & Báo cáo quản trị:**
   - Quay lại `apps/ops-web`, đơn hàng chuyển sang `DELIVERED`, tiền COD tự động ghi nhận vào sổ cái `COLLECTED`.
   - Mở `apps/admin-web` (`http://localhost:5175`) xem biểu đồ KPI sản lượng và nhật ký kiểm toán hệ thống.

---

## 9. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG & TÀI KHOẢN KIỂM THỬ

### 9.1. Khởi động hạ tầng cơ sở (Docker Compose)

```bash
cd infra/dev
docker compose up -d
```

Hạ tầng bao gồm:
- PostgreSQL: `localhost:15432` (11 databases)
- RabbitMQ: `localhost:5672` (Management Dashboard: `http://localhost:15672`, user/pass: `guest/guest`)
- Redis: `localhost:6379`
- MinIO Object Storage: `localhost:9000` (Console: `http://localhost:9001`, user/pass: `minioadmin/minioadmin`)

### 9.2. Khởi chạy toàn bộ hệ thống bằng script tự động

Trên macOS / Linux:
```bash
./run-all-mac.sh
```

Trên Windows PowerShell:
```powershell
.\run-all.ps1
```

### 9.3. Danh mục cổng truy cập ứng dụng

| Ứng dụng | Địa chỉ URL truy cập | Ghi chú |
| :--- | :--- | :--- |
| **API Gateway / BFF** | `http://localhost:3000` | Điểm tiếp nhận API duy nhất của toàn hệ thống |
| **Ops Web** | `http://localhost:5173` | Cổng tác nghiệp bưu cục & trung tâm khai thác |
| **Merchant Web** | `http://localhost:5174` | Cổng chủ shop tạo đơn & đối soát COD |
| **Admin Web** | `http://localhost:5175` | Cổng quản trị viên cấp cao |
| **Guest Web** | `http://localhost:5177` | Cổng tra cứu công khai & AI Chatbot khách lẻ |
| **Courier Mobile** | `http://localhost:8081` | Ứng dụng bưu tá (Expo Go trên điện thoại) |
| **Customer Mobile** | `http://localhost:8082` | Ứng dụng khách hàng cá nhân (Expo Go) |

### 9.4. Danh mục tài khoản kiểm thử mặc định

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn & Hub phân công |
| :--- | :--- | :--- | :--- |
| **System Admin** | `10000001` | `Admin@123456` | Toàn quyền quản trị hệ thống |
| **Ops Staff (Kho)** | `20000001` | `Ops@123456` | Vận hành Hub Miền Nam (`003S001`) |
| **Merchant B2B** | `41100001` | `Shop@123456` | Chủ shop Tiêu chuẩn có đơn COD |
| **Shipper / Courier**| `30000001` | `Shipper@123456`| Tài xế tuyến giao bưu cục `003S001-01` |

---

<div align="center">

**NEXUS EXPRESS SYSTEM — SỐ HÓA & NÂNG TẦM VẬN HÀNH BƯU CHÍNH VIỆT NAM**  
*Mã nguồn mở phục vụ nghiên cứu & bảo vệ đồ án tốt nghiệp*

</div>