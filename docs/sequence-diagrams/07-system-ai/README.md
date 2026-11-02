# SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) - ACTOR: HỆ THỐNG & TRỢ LÝ AI (SYSTEM & AI ENGINE)
## Thành phần phục vụ: `@NEXUS/chatbot-service` (:3013), `pricing-service` (:3012), `payment-service` (:3011), Outbox Relays, RabbitMQ

---

## 0. Tổng Quan Nhóm Chức Năng Hệ Thống & Động Cơ Trí Tuệ Nhân Tạo

Actor Hệ thống & Trợ lý AI (*System & AI Engine*) đóng vai trò hạt nhân tự động hóa vận hành, tính toán định giá, xử lý ngôn ngữ tự nhiên và bảo đảm tính toàn vẹn phân tán:
- **7.1. Động cơ định giá chuẩn hóa IATA $V/6000$ đa dịch vụ**: Công thức tính cước thể tích và kiểm soát 3 tầng trần vật lý.
- **7.2. Quy trình truy xuất tri thức Hybrid RAG & Phản hồi dạng dòng SSE**: Kết hợp tìm kiếm ngữ nghĩa Dense Vector 768-dim và Sparse BM25.
- **7.3. Cơ chế thực thi 5 Dynamic Tools thời gian thực**: Tự động nhận diện ý định và gọi trực tiếp Microservices nội bộ.
- **7.4. Cơ chế chuyển đổi dự phòng mô hình thông minh (Smart LLM Fallback)**: Tự động chuyển đổi giữa Google Gemini và OpenAI GPT-4o-mini khi gặp lỗi quota/mạng.
- **7.5. Chuyển giao sự kiện qua Transactional Outbox Pattern & RabbitMQ**: Đảm bảo phân phối sự kiện bất đồng bộ tin cậy (At-least-once delivery).
- **7.6. Khớp nối thanh toán Webhook SePay & Tự động chốt đối soát COD**: Quét biến động số dư ngân hàng và đối soát tiền thu hộ.

---

## 7.1. Động Cơ Định Giá Chuẩn Hóa IATA $V/6000$ Đa Dịch Vụ

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
    participant Client as Caller (Guest/Merchant/Ops)
    participant Pricing as Pricing Service (:3012)
    participant Masterdata as Masterdata Service (:3001)

    Client->>Pricing: POST /internal/pricing/calculate-rate { origin, destination, actualWeight, length, width, height, declaredValue, category }
    
    Note over Pricing: BƯỚC 1: KIỂM SOÁT 3 TẦNG TRẦN VẬT LÝ<br/>1. max(cạnh) > 150cm HOẶC D+R+C > 300cm HOẶC weight > 70kg -> BLOCK<br/>2. weight > 20kg HOẶC max(cạnh) > 60cm -> TẦNG 2: CỒNG KỀNH (XE TẢI)<br/>3. Còn lại: TẦNG 1: TIÊU CHUẨN (XE MÁY)
    
    alt Vượt trần vật lý mạng lưới bưu cục
        Pricing-->>Client: 422 Unprocessable Entity { error: "OVER_PHYSICAL_CEILING_BLOCK", message: "Kiện hàng vượt trần 70kg hoặc 150cm" }
    else Trong hạn mức vận hành hợp lệ
        Pricing->>Pricing: Tính Chargeable Weight = max(Cân thực tế, (D * R * C) / 6000)
        Pricing->>Masterdata: GET /internal/zones/lookup (Xác định INTRA_PROVINCE, REGIONAL, INTER_PROVINCE)
        Masterdata-->>Pricing: Trả về phân vùng cước
        Pricing->>Pricing: Áp bảng cước bậc thang cơ bản + Phụ phí cồng kềnh (nếu Tầng 2)
        
        alt Hàng điện tử / Giá trị cao (HIGH_VALUE / ELECTRONICS)
            Pricing->>Pricing: Phí bảo hiểm toàn diện = 0.5% * declaredValue (Tối thiểu 10,000 VND)
        end

        Pricing-->>Client: 200 OK { chargeableWeight, baseFee, insuranceFee, surcharge, totalFee, tierLevel }
    end
```

---

## 7.2. Quy Trình Hybrid RAG & Context Sandwich SSE Generation

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
    participant UI as Chat Client UI
    participant Chatbot as Chatbot Service (:3013)
    participant Embedder as Gemini Text-Embedding-004
    participant VectorStore as In-Memory / Faiss Vector Store
    participant BM25 as Sparse BM25 Keyword Search
    participant LLM as Google Gemini 1.5/3 Flash

    UI->>Chatbot: POST /api/v1/chatbot/chat/stream { message: "Quy trình xử lý hàng thất lạc và bồi thường bưu gửi ra sao?" }
    
    par Trích xuất đặc trưng đa phương thức (Hybrid Retrieval)
        Chatbot->>Embedder: Nạp câu hỏi tạo vector embedding 768 chiều
        Embedder-->>Chatbot: Trả về Float32Array[768]
        Chatbot->>VectorStore: Tìm kiếm Top-K Cosine Similarity (Dense)
        VectorStore-->>Chatbot: Trả về Top 5 văn bản SOP ngữ nghĩa
    and Tìm kiếm từ khóa chính xác (Sparse Retrieval)
        Chatbot->>BM25: Đối soát từ khóa ("thất lạc", "bồi thường", "SOP")
        BM25-->>Chatbot: Trả về Top 3 điều khoản Luật Bưu chính
    end

    Chatbot->>Chatbot: Reciprocal Rank Fusion (RRF): Hợp nhất và chấm điểm tái xếp hạng (Re-ranking)
    Chatbot->>Chatbot: Ghép Context Sandwich Prompt (System Instructions + Tri thức bưu chính đã xác thực + Câu hỏi khách)
    
    Chatbot->>LLM: Gọi API Stream Generate Content
    loop Trả lời dạng dòng (Server-Sent Events)
        LLM-->>Chatbot: Token chunk
        Chatbot-->>UI: event: message data: {"delta": "Theo điều 25 Luật bưu chính..."}
    end
    Chatbot-->>UI: event: done
```

---

## 7.3. Cơ Chế Thực Thi 5 Dynamic Tools Thời Gian Thực

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
    participant Chatbot as Chatbot Service (:3013)
    participant ToolRouter as Dynamic Tool Router
    participant Tracking as Tracking Service (:3008)
    participant Pricing as Pricing Service (:3012)
    participant Masterdata as Masterdata Service (:3001)

    Chatbot->>ToolRouter: Phân tích câu hỏi chứa thực thể cần tra cứu trực tiếp

    alt Tool 1: `track_shipment` (Tra cứu tiến độ bưu gửi)
        ToolRouter->>Tracking: GET /internal/tracking/timeline/{code}
        Tracking-->>ToolRouter: Trả về dữ liệu mốc thời gian thực
    else Tool 2: `calculate_shipping_rate` (Tính cước tự động)
        ToolRouter->>Pricing: POST /internal/pricing/calculate-rate
        Pricing-->>ToolRouter: Trả về bảng phí cước chuẩn IATA
    else Tool 3: `get_prohibited_goods_policy` (Tra cứu hàng cấm gửi/cấm bay)
        ToolRouter->>Masterdata: GET /internal/policies/prohibited-goods
        Masterdata-->>ToolRouter: Danh mục pin, chất lỏng, hàng nguy hiểm
    else Tool 4: `get_compensation_claim_policy` (Chính sách bảo hiểm bồi thường)
        ToolRouter->>Masterdata: GET /internal/policies/compensation
        Masterdata-->>ToolRouter: Quy tắc đền bù 100% khai giá & thời hiệu BBBT 24h
    else Tool 5: `find_nearest_post_office` (Tìm bưu cục gần nhất)
        ToolRouter->>Masterdata: GET /internal/hubs/nearest?lat={lat}&lng={lng}
        Masterdata-->>ToolRouter: Địa chỉ, hotline, giờ mở cửa bưu cục
    end

    ToolRouter-->>Chatbot: Trả về kết quả JSON từ service tương ứng để tổng hợp câu trả lời
```

---

## 7.4. Cơ Chế Chuyển Đổi Dự Phòng Mô Hình Thông Minh (Smart LLM Fallback)

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
    participant Chatbot as Chatbot Service (:3013)
    participant Gemini as Primary LLM (Google Gemini Flash)
    participant CircuitBreaker as Circuit Breaker Engine
    participant OpenAI as Fallback LLM (OpenAI GPT-4o-mini)
    participant Client as User Client UI

    Chatbot->>CircuitBreaker: Kiểm tra trạng thái mạch chính (Primary Health)
    
    alt Mạch đóng (CLOSED) - Gemini hoạt động bình thường
        Chatbot->>Gemini: Gửi Prompt Context
        Gemini-->>Chatbot: 200 OK (Trả về Stream phản hồi thành công)
        Chatbot-->>Client: Stream dữ liệu cho người dùng
    else Gemini gặp sự cố (Rate Limit 429, Timeout hoặc 503 Service Unavailable)
        Chatbot->>Gemini: Gửi Prompt
        Gemini-->>Chatbot: 429 Too Many Requests / Network Timeout
        Chatbot->>CircuitBreaker: Ghi nhận 1 lỗi (Failure Count++)
        Note over CircuitBreaker: Ngắt mạch sang trạng thái OPEN<br/>Tự động kích hoạt luồng Fallback ngay tức khắc
        Chatbot->>OpenAI: Chuyển hướng Prompt sang GPT-4o-mini
        OpenAI-->>Chatbot: 200 OK (Stream phản hồi thay thế)
        Chatbot-->>Client: Stream dữ liệu mượt mà, người dùng không hề bị gián đoạn trải nghiệm
    end
```

---

## 7.5. Chuyển Giao Sự Kiện Qua Transactional Outbox Pattern & RabbitMQ

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
    participant Service as Business Microservice (VD: Shipment)
    participant Database as PostgreSQL (ACID Transaction)
    participant OutboxWorker as Outbox Relay Background Worker
    participant RabbitMQ as RabbitMQ Exchange (domain.events)
    participant Consumers as Consumer Services (Tracking / Reporting / Notification)

    Service->>Database: BẮT ĐẦU TRANSACTION (BEGIN)
    Service->>Database: INSERT/UPDATE nghiệp vụ (Bảng shipments)
    Service->>Database: INSERT vào bảng `outbox_events` (status: "PENDING", payload: JSON, eventType: "shipment.created")
    Service->>Database: HOÀN TẤT TRANSACTION (COMMIT)
    Note over Service,Database: Dữ liệu nghiệp vụ và Event cam kết lưu đồng thời 100%, không bị lệch pha

    loop Định kỳ quét định thời đồng bộ
        OutboxWorker->>Database: SELECT * FROM outbox_events WHERE status = 'PENDING' LIMIT 50 FOR UPDATE SKIP LOCKED
        Database-->>OutboxWorker: Trả về danh sách sự kiện chờ gửi
        
        loop Gửi từng sự kiện lên Message Broker
            OutboxWorker->>RabbitMQ: Publish Message tới Exchange `domain.events` với Routing Key tương ứng
            RabbitMQ-->>OutboxWorker: Ack xác nhận đã nhận tin
            OutboxWorker->>Database: UPDATE outbox_events SET status = 'PUBLISHED', published_at = NOW()
        end
    end

    RabbitMQ->>Consumers: Phân phối sự kiện bất đồng bộ tới hàng đợi các dịch vụ tiêu thụ
    Consumers->>Consumers: Xử lý cập nhật Read Model, gửi thông báo và tính toán KPI
```

---

## 7.6. Khớp Nối Thanh Toán Webhook SePay & Đối Soát COD Tự Động

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
    participant Bank as Ngân hàng VietinBank / MB / Vietcombank
    participant SePay as Cổng Cố vấn Thanh toán SePay
    participant Gateway as Gateway BFF (:3000)
    participant Payment as Payment Service (:3011)
    participant EventBus as RabbitMQ (domain.events)

    Bank->>SePay: Phát hiện giao dịch nhận tiền thành công (Tài khoản công ty)
    SePay->>Gateway: POST /api/v1/webhooks/sepay (Kèm chữ ký bảo mật API Secret)
    Gateway->>Payment: POST /internal/webhooks/sepay
    
    Payment->>Payment: Xác thực chữ ký webhook API Key
    Payment->>Payment: Trích xuất nội dung chuyển khoản: Tìm mã đối soát (VD: `COD_COU_9182`)
    
    alt Khớp mã phiên đối soát và đúng số tiền
        Payment->>Payment: Đổi trạng thái phiên đối soát sang PAID_SETTLED
        Payment->>Payment: Khấu trừ tự động tiền cước chuyển hoàn (nếu có đơn hoàn trong kỳ)
        Payment->>EventBus: Publish sự kiện "payment.reconciliation_settled"
        Payment-->>Gateway: 200 OK { success: true }
        Gateway-->>SePay: 200 OK
    else Sai lệch số tiền hoặc không tìm thấy mã đối soát
        Payment->>Payment: Đánh dấu giao dịch vào bảng `unmatched_bank_transactions` (Chờ kế toán tra soát thủ công)
        Payment-->>Gateway: 200 OK (Vẫn nhận webhook để không bị retry)
        Gateway-->>SePay: 200 OK
    end
```

