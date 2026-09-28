# BỘ TÀI LIỆU KHÓA LUẬN TỐT NGHIỆP: NGHIÊN CỨU & PHÁT TRIỂN HỆ THỐNG AI CHATBOT LOGISTICS ĐA KÊNH

> **Chuyên ngành:** Kỹ thuật Phần mềm / Công nghệ Thông tin  
> **Đề tài:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus (Nexus Logistics Management System)  
> **Module nghiên cứu trọng tâm:** Trợ lý ảo AI thông minh tích hợp Kiến trúc Microservices & RAG Hybrid Retrieval

---

## 1. MỤC LỤC TÀI LIỆU KHÓA LUẬN

Thư mục này được tổ chức thành một báo cáo khoa học hoàn chỉnh, phục vụ cho việc viết thuyết minh đồ án và bảo vệ trước Hội đồng chấm thi:

| STT | Tài liệu thuyết minh | Nội dung chính |
| :---: | :--- | :--- |
| **01** | [Chương 1: Tổng quan Kiến trúc Hệ thống](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/01-tong-quan-kien-truc-ai-chatbot.md) | Phân tích kiến trúc 6 tầng (Clients, API Gateway :3000, AI Orchestrator :3013, Live Microservices Mesh, RAG Knowledge Base, LLM Reasoning & Rich UI Output). |
| **02** | [Chương 2: Cơ sở Lý thuyết & Giải thuật Phân đoạn RAG](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/02-ly-thuyet-va-giai-thuat-chunking-rag.md) | Phân tích nhược điểm của Fixed-size Chunking; Giải thuật **Hybrid Section-Aware Semantic Splitting**; Công thức Overlap 16%, Stride 210 từ; Vector 768-D và Hybrid Cosine + Lexical Score. |
| **03** | [Chương 3: Phân tích 5 Kịch bản Nghiệp vụ & Bảo mật PII](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/03-phan-tich-cac-kich-ban-nghiep-vu-va-an-toan-pii.md) | Xử lý 5 ca thực tế: Tra cứu đơn xác định, Xử lý câu hỏi mập mờ qua Interactive Carousel, Che mờ dữ liệu cá nhân PII, Quy trình xử lý hàng bể vỡ BBBT 24h & Dự toán cước IATA. |

---

## 2. DANH MỤC SƠ ĐỒ VECTOR SVG CHUẨN FIGMA

Tất cả các sơ đồ đều được vẽ dưới dạng mã nguồn vector SVG chuẩn XML, kích thước lớn ($1920 \times 1280\text{ px}$), sử dụng hệ màu tối cao cấp (Dark Mode Indigo/Cyan/Emerald), tương thích 100% khi import vào **Figma**:

```
docs/graduation-thesis/diagrams-svg/
├── 01-ai-chatbot-end-to-end-architecture.svg       # Sơ đồ Kiến trúc Tổng thể 6 Tầng
├── 02-rag-chunking-and-vectorization-pipeline.svg   # Sơ đồ Pipeline Phân đoạn & Vector hóa RAG
└── 03-multi-case-business-flow.svg                  # Sơ đồ Phân luồng Quyết định 5 Ca Nghiệp vụ & Rich Card UI
```

---

## 3. HƯỚNG DẪN IMPORT VÀO FIGMA

Để đưa các sơ đồ này vào file thiết kế Figma của bạn:

1. **Cách 1: Kéo thả trực tiếp (Khuyên dùng - Nhanh nhất)**
   - Mở dự án hoặc file thiết kế trên Figma (Desktop App hoặc Web App).
   - Mở thư mục `docs/graduation-thesis/diagrams-svg/` trong Finder (macOS) hoặc File Explorer.
   - Kéo trực tiếp từng file `.svg` và thả vào khoảng trống trên Canvas của Figma.
2. **Cách 2: Sử dụng menu Place Image của Figma**
   - Trên Figma, nhấn tổ hợp phím `Shift + Cmd + K` (macOS) hoặc `Shift + Ctrl + K` (Windows).
   - Chọn các file `.svg` trong thư mục trên và click chuột lên Canvas để đặt sơ đồ.
3. **Hiệu chỉnh trên Figma:**
   - Mỗi sơ đồ đã được cấu trúc thành các thẻ nhóm `<g id="...">` tương ứng với các Layer và Frame riêng biệt trong Figma (`Header`, `Stage_1_...`, `Case_1_...`, `Stage_3_UI_Mockups`).
   - Bạn có thể nhấn tổ hợp `Cmd + Shift + G` (macOS) hoặc `Ctrl + Shift + G` (Windows) để rã nhóm (Ungroup) và tự do tùy chỉnh lại màu sắc, độ đậm font chữ, kích thước theo tone màu của slide bảo vệ khóa luận.

---

## 4. KỊCH BẢN THUYẾT TRÌNH BẢO VỆ TRƯỚC HỘI ĐỒNG (Q&A DEFENSE GUIDE)

Dưới đây là 4 câu hỏi trọng tâm mà Hội đồng chấm khóa luận tốt nghiệp thường chất vấn, kèm câu trả lời chuẩn mực dựa trên nền tảng kỹ thuật của đề tài:

### Câu hỏi 1: "Tại sao nhóm không dùng trực tiếp Chatbot OpenAI/ChatGPT thông qua Prompt đơn giản mà lại phải xây dựng kiến trúc RAG và Microservices phức tạp?"
- **Trả lời:**
  > *"Thưa Hội đồng, trong lĩnh vực Logistics bưu chính, nếu chỉ dùng một Prompt gọi LLM đơn thuần sẽ gặp phải 2 giới hạn chí mạng:*  
  > *1. **Dữ liệu động thời gian thực (Live Operational Data):** LLM không thể tự biết một kiện hàng thực tế đang nằm ở kho trung chuyển nào hay tài xế nào đang đi giao. Bắt buộc phải có tầng kết nối nội bộ với Microservices (Tracking Service :3005) để lấy trạng thái theo thời gian thực.*  
  > *2. **Hiện tượng ảo giác (Hallucination) về chính sách bồi thường:** LLM công cộng không nắm được chính sách bảo hiểm đặc thù của bưu chính Việt Nam (như điều kiện lập Biên bản bất thường BBBT trong 24 giờ). Việc áp dụng kiến trúc RAG giúp cô lập nguồn tri thức, buộc LLM chỉ trả lời dựa trên tài liệu nghiệp vụ đã được kiểm chứng với tham số nhiệt độ thấp ($T = 0.2$), đảm bảo tính pháp lý cho doanh nghiệp."*

---

### Câu hỏi 2: "Tại sao nhóm không phân đoạn văn bản (chunking) theo kích thước ký tự cố định cho đơn giản mà lại đề xuất thuật toán Semantic Splitting?"
- **Trả lời:**
  > *"Thưa Thầy/Cô, phương pháp cắt cứng theo số ký tự (Naive Fixed-size Chunking) hoạt động rất kém đối với văn bản quy chuẩn kỹ thuật Logistics. Cụ thể:*  
  > *1. Nó làm **gãy đôi bảng biểu giá cước IATA**, khiến dòng số liệu bị tách rời khỏi tiêu đề nấc cân nặng.*  
  > *2. Nó làm **đứt gãy mệnh đề điều kiện pháp lý** (ví dụ câu 'Được đền 100% NẾU lập biên bản trong 24h' bị cắt đôi ngay tại chữ NẾU).*  
  > *Do đó, nhóm đã xây dựng giải thuật **Hybrid Section-Aware Semantic Splitting** dựa trên AST Heading kết hợp bổ sung siêu dữ liệu Breadcrumb và cơ chế cửa sổ trượt Overlap 16% (Bước nhảy 210 từ, Gối đầu 40 từ). Kết quả thực nghiệm cho thấy phương pháp này giúp tăng độ chính xác truy vấn cước từ 42.5% lên **96.8%** và giảm 94.7% hiện tượng trả lời sai của mô hình."*

---

### Câu hỏi 3: "Khi người dùng hỏi câu hỏi mơ hồ như 'Đơn hàng gần đây của tôi ở đâu?', hệ thống xử lý như thế nào để tối ưu trải nghiệm?"
- **Trả lời:**
  > *"Thưa Hội đồng, các chatbot thông thường sẽ bắt bẻ khách hàng bằng câu hỏi lại: 'Bạn vui lòng nhập mã vận đơn'. Điều này gây khó chịu vì khách hàng không nhớ mã đơn dài.*  
  > *Hệ thống của nhóm xử lý thông minh bằng cách: Trích xuất danh tính khách hàng từ JWT Token $\implies$ Truy vấn Order Service lấy 3 đơn gần nhất $\implies$ Sinh ra một **Interactive Carousel UI (Băng chuyền thẻ tương tác)**. Khách hàng chỉ cần nhìn thấy tóm tắt kiện hàng và bấm nút 'Chọn tra cứu' là hệ thống tự động hiển thị chi tiết hành trình mà không cần gõ bất kỳ ký tự nào."*

---

### Câu hỏi 4: "Hệ thống bảo vệ dữ liệu cá nhân của người nhận hàng (PII) như thế nào trước nguy cơ bị dò quét mã đơn?"
- **Trả lời:**
  > *"Thưa Hội đồng, hệ thống tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân:*  
  > *Tại tầng API Gateway, nếu phát hiện truy vấn từ người dùng chưa đăng nhập (Guest), bộ lọc Sanitizer sẽ tự động che giấu thông tin nhạy cảm trước khi trả về: Số điện thoại bị che 3 số giữa (`098***3456`), tên người nhận chỉ giữ lại ký tự đầu (`N*** V** A`), và địa chỉ nhà bị ẩn hoàn toàn số nhà ngõ ngách, chỉ hiển thị cấp Phường/Xã và Quận/Huyện. Đồng thời cung cấp nút 'Đăng nhập' nếu chính chủ muốn xem thông tin đầy đủ."*
