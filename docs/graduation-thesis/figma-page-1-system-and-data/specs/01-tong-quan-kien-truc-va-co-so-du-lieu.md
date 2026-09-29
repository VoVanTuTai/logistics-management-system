# CHƯƠNG 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG AI CHATBOT BƯU CHÍNH NEXUS

> **Tài liệu nghiên cứu khoa học & Khóa luận tốt nghiệp kỹ sư ngành Công nghệ Thông tin / Kỹ thuật Phần mềm**  
> **Dự án:** Hệ thống Quản lý Vận tải & Logistics Đa kênh Nexus (Nexus Logistics Management System)  
> **Module nghiên cứu:** Trợ lý ảo AI thông minh tích hợp Kiến trúc Microservices & RAG Hybrid Retrieval

---

## 1.1. ĐẶT VẤN ĐỀ VÀ MỤC TIÊU NGHIÊN CỨU

Trong kỷ nguyên thương mại điện tử bùng nổ, hệ thống dịch vụ khách hàng (Customer Support) trong ngành Logistics đối mặt với những thách thức chưa từng có:
1. **Khối lượng truy vấn khổng lồ nhưng tính lặp lại cao:** Hơn 75% câu hỏi của người gửi và người nhận tập trung vào: *"Đơn hàng của tôi đang ở đâu?"*, *"Bao giờ giao hàng?"*, *"Hàng bị vỡ thì khiếu nại thế nào?"*, *"Cách tính cước hàng cồng kềnh"*.
2. **Đòi hỏi độ chính xác tuyệt đối và thời gian thực:** Khác với các chatbot giải trí thông thường, trợ lý ảo Logistics không được phép "ảo giác" (hallucination). Thông tin vị trí kiện hàng, số tiền COD, phí bảo hiểm phải truy xuất trực tiếp từ cơ sở dữ liệu phân tán (Live Microservices).
3. **Chính sách nghiệp vụ phức tạp và biến động:** Bưu cục áp dụng quy chuẩn IATA (Hiệp hội Vận tải Hàng không Quốc tế), chính sách lưu kho, thời hạn lập Biên bản bất thường (BBBT 24h), điều kiện miễn trừ trách nhiệm pháp lý.
4. **Yêu cầu bảo mật thông tin cá nhân (PII - Personally Identifiable Information):** Ngăn chặn việc người lạ dò mã vận đơn để đánh cắp số điện thoại, địa chỉ nhà riêng và giá trị đơn hàng của khách hàng.

Nhằm giải quyết triệt để các bài toán trên, đồ án nghiên cứu và phát triển kiến trúc **Trợ lý AI Đa tầng (Multi-tier Enterprise AI Architecture)** kết hợp giữa:
- **LLM Cấp tiến (Gemini 2.5 / 3.x Flash)** làm trung tâm suy luận nhận thức (Cognitive Reasoning Engine).
- **RAG Chuyên sâu (Retrieval-Augmented Generation)** với kho tri thức chính sách bưu chính được băm nhỏ (chunking) theo cấu trúc ngữ nghĩa phân tầng.
- **Hệ sinh thái Microservices hướng sự kiện (Event-Driven Microservices Mesh)** để kết nối dữ liệu vận hành thời gian thực.
- **Giao diện tương tác trực quan (Rich Actionable Cards & Carousel)** thay thế văn bản thuần túy, nâng cao trải nghiệm người dùng cuối.

---

## 1.2. KIẾN TRÚC TỔNG THỂ 6 TẦNG (6-LAYER ARCHITECTURE)

Sơ đồ kiến trúc tổng thể được biểu diễn chi tiết tại file vector SVG chuẩn Figma:  
`docs/graduation-thesis/diagrams-svg/01-ai-chatbot-end-to-end-architecture.svg`

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 1: MULTI-PLATFORM CLIENT APPS                   │
│   [Merchant Web]       [Customer Mobile]      [Guest Web / Tracking]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / RESTful / WebSocket
┌───────────────────────────────────▼────────────────────────────────────┐
│              TẦNG 2: API GATEWAY & PII SECURITY PROXY (:3000)          │
│   • Reverse Proxy & Load Balancer       • JWT Claims Extraction        │
│   • Rate Limiting & DoS Protection      • Data Masking Sanitizer       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Sanitized Internal Call
┌───────────────────────────────────▼────────────────────────────────────┐
│           TẦNG 3: AI AGENT ORCHESTRATOR SERVICE (NestJS :3013)         │
│   • Intent Classifier (Phân loại ý định: EXACT / RECENT / SOP / IATA)  │
│   • Query Normalizer & Logistics Thesaurus (Hán-Việt & Ngữ cảnh vận tải)│
│   • Dialogue Context & Session Memory Buffer (Sliding Window)         │
└─────────────────┬──────────────────────────────────┬───────────────────┘
                  │                                  │
    Live Queries  │                                  │ RAG Embeddings
┌─────────────────▼──────────────┐   ┌───────────────▼───────────────────┐
│     TẦNG 4: LIVE MESH SERVICES │   │    TẦNG 5: RAG KNOWLEDGE BASE     │
│  • Order Service (:3002)       │   │  • Gemini Embedding-001 (768-D)   │
│  • Tracking Service (:3005)    │   │  • Cosine Similarity + BM25 Score │
│  • Claim Service (:3007)       │   │  • Markdown Section Knowledge     │
│  • Carrier & Pricing (:3008)   │   │    (IATA, SOP, BBBT, COD Policy)  │
└─────────────────┬──────────────┘   └───────────────┬───────────────────┘
                  │                                  │
                  └─────────────────┬────────────────┘
                                    │ Augmented Prompt Context
┌───────────────────────────────────▼────────────────────────────────────┐
│              TẦNG 6: COGNITIVE REASONING & RICH UI CARDS               │
│   • Google Gemini Flash (Temperature = 0.2 - Chống suy diễn ảo giác)   │
│   • Cấu trúc JSON Schema phản hồi Rich Components:                    │
│     - Single Tracking Status Card (Timeline Milestones)                │
│     - Multi-Order Carousel Interactive Selector                        │
│     - Claim Progress Card (Mức duyệt & Thời hạn bồi thường)            │
│     - IATA Volumetric Pricing Breakdown                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1.3. PHÂN TÍCH CHỨC NĂNG TỪNG PHÂN TẦNG HỆ THỐNG

### Tầng 1: Multi-Platform Client Applications
Hệ thống cung cấp trải nghiệm AI thống nhất trên đa nền tảng:
- **Merchant Web (ReactJS + TailwindCSS / Ant Design):** Dành cho chủ cửa hàng/doanh nghiệp quản lý hàng trăm vận đơn mỗi ngày, cần tra cứu danh sách đơn gom, báo cáo tài chính COD và khiếu nại đền bù.
- **Customer Mobile App (React Native / Expo):** Trải nghiệm vuốt chạm linh hoạt, nhận thông báo đẩy thời gian thực và tương tác với chatbot bằng các thẻ hành động nhanh (Quick Reply Chips).
- **Guest Web (Public Tracking Portal):** Giao diện tra cứu công khai không yêu cầu đăng nhập, được kiểm soát quyền xem dữ liệu nghiêm ngặt.

### Tầng 2: API Gateway & PII Security Proxy (Cổng bảo mật trung tâm)
- Đóng vai trò là điểm tiếp nhận duy nhất (Single Point of Entry) tại cổng `:3000`.
- **JWT Context Resolver:** Bóc tách Token từ Header để xác định danh tính: `User ID`, `Role` (GUEST, CUSTOMER, MERCHANT, OPS_ADMIN).
- **PII Privacy Masking Pipeline:** Ngay khi dữ liệu phản hồi đi qua Gateway trả về cho người dùng Guest, thuật toán làm mờ thông tin cá nhân sẽ tự động chuyển đổi SĐT `0984123456` $\to$ `098***3456`, địa chỉ cụ thể `Số 12 Nhà A, Phường B, Quận C` $\to$ `Phường B, Quận C`.

### Tầng 3: AI Agent Orchestrator Service (NestJS - Cổng :3013)
Là "bộ não" điều phối trung tâm của module Chatbot:
- **Ngôn ngữ & Nền tảng:** Xây dựng trên NestJS (TypeScript), tận dụng kiến trúc Module, Dependency Injection và RxJS Observables để xử lý bất đồng bộ tải cao.
- **Query Normalizer:** Tiền xử lý chuỗi truy vấn: Loại bỏ ký tự đặc biệt thừa, chuẩn hóa chữ thường, ánh xạ từ vựng địa phương thông qua **Logistics Thesaurus** (Ví dụ: *"bể"* $\to$ *"hư hỏng, bồi thường"*; *"chuyển về"* $\to$ *"chuyển hoàn"*).
- **Deterministic Intent Extraction:** Sử dụng Regular Expression tốc độ cao kết hợp phân tích từ khóa để nhận diện tức thì các mẫu cố định như mã vận đơn `NX-\d{6,}` hoặc mã khiếu nại `CLM-\d{4,}` mà không cần tốn chi phí gọi LLM phân loại.

### Tầng 4: Live Microservices Mesh
Chatbot không lưu trữ dữ liệu nghiệp vụ riêng lẻ mà truy xuất trực tiếp từ các Service lõi:
- **Tracking Service (:3005):** Cung cấp chuỗi dòng thời gian các sự kiện bưu phẩm (Milestone Events: Đã tạo $\to$ Đã gom $\to$ Nhập kho trung chuyển $\to$ Đang giao $\to$ Giao thành công).
- **Order Service (:3002):** Cung cấp thông tin chi tiết đơn hàng, người gửi, người nhận, tiền thu hộ COD.
- **Claim Service (:3007):** Quản lý trạng thái hồ sơ bồi thường, số tiền đề xuất bồi thường, biên bản giám định hiện trường.
- **Carrier & Pricing Service (:3008):** Bảng cước vận chuyển chuẩn IATA theo từng tuyến đường và khối lượng quy đổi.

### Tầng 5: RAG Knowledge Repository (Kho tri thức văn bản chính sách)
- Hệ thống tài liệu nghiệp vụ Logistics được lưu trữ dưới định dạng Markdown có cấu trúc ngữ nghĩa chặt chẽ (`01-pricing-and-iata-weight.md`, `02-insurance-and-claim-policy.md`, v.v.).
- Mỗi đoạn văn bản sau khi băm nhỏ (Semantic Chunking) được chuyển đổi thành vector nhúng 768 chiều bởi mô hình `models/gemini-embedding-001`.
- **Hybrid Retrieval Strategy:** Kết hợp tính toán độ tương đồng không gian vector (Cosine Similarity) với bộ lọc từ khóa chuyên ngành (Lexical Match) nhằm đạt độ chính xác tối ưu trong các câu hỏi nghiệp vụ đặc thù.

### Tầng 6: LLM Reasoning & Rich UI Output
- **Cognitive Model:** Google Gemini Flash với tham số nhiệt độ khống chế chặt chẽ (`Temperature = 0.2`) nhằm triệt tiêu hiện tượng bịa đặt thông tin, buộc LLM chỉ suy luận dựa trên Context thực tế được cấp.
- **Structured Response Generation:** Thay vì chỉ trả về một đoạn text dài gây khó đọc cho khách hàng trên điện thoại di động, Chatbot trả về cấu trúc dữ liệu JSON gồm hai phần:
  1. `text`: Lời giải thích ngắn gọn, thân thiện, đồng cảm bằng tiếng Việt chuẩn.
  2. `card`: Khối giao diện chuyên biệt (Interactive Card) chứa các nút bấm tương tác, lộ trình trực quan, và các lựa chọn tiếp theo.

---

## 1.4. Ý NGHĨA KHOA HỌC VÀ THỰC TIỄN CỦA ĐỀ TÀI

1. **Về mặt Khoa học Kỹ thuật:**
   - Chứng minh tính hiệu quả của phương pháp **Hybrid Section-Aware Chunking** so với phương pháp chia văn bản kích thước cố định truyền thống (Fixed-Size Chunks) trong các hệ thống văn bản quy chuẩn kỹ thuật.
   - Ứng dụng kỹ thuật **Lexical-Semantic Hybrid Search** giải quyết bài toán đa nghĩa và từ lóng bưu chính địa phương tại Việt Nam.

2. **Về mặt Ứng dụng Thực tiễn:**
   - Giảm tải tới **70% chi phí nhân sự tổng đài** trong việc trả lời các trạng thái đơn hàng và tư vấn bảng giá cước.
   - Chuẩn hóa thời gian phản hồi từ 5–15 phút (nhân viên tư vấn) xuống **dưới 1.2 giây** (Chatbot AI).
   - Đảm bảo an toàn thông tin cá nhân khách hàng, tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam.
