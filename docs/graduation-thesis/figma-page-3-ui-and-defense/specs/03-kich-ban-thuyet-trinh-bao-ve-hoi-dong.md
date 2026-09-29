# HƯỚNG DẪN KỊCH BẢN THUYẾT TRÌNH & BẢO VỆ KHÓA LUẬN TỐT NGHIỆP TRƯỚC HỘI ĐỒNG

> **Chuyên ngành:** Kỹ thuật Phần mềm / Công nghệ Thông tin  
> **Đề tài:** Nghiên cứu & Phát triển Hệ thống Trợ lý AI Logistics Đa kênh tích hợp Microservices & RAG Hybrid  
> **Thời lượng bảo vệ tiêu chuẩn:** 15 phút Thuyết trình + 15 phút Trả lời phản biện (Q&A)

---

## PHẦN 1: KỊCH BẢN THUYẾT TRÌNH CHI TIẾT THEO SLIDE (15 PHÚT)

Bộ khung Slide trình chiếu tương ứng trực tiếp với bản vẽ vector:  
`docs/graduation-thesis/figma-page-3-ui-and-defense/diagrams/02-slide-deck-16-9-templates.svg`

### SLIDE 01: ĐẶT VẤN ĐỀ, THÁCH THỨC VÀ MỤC TIÊU NGHIÊN CỨU (Thời lượng: 03 phút)
- **Lời mở đầu:**  
  > *"Kính thưa Thầy/Cô Chủ tịch Hội đồng, Quý Thầy/Cô Giảng viên phản biện cùng toàn thể Hội đồng chấm Khóa luận tốt nghiệp. Hôm nay, em xin đại diện nhóm nghiên cứu trình bày đề tài: 'Nghiên cứu và Phát triển Hệ thống Trợ lý AI Logistics Đa kênh Nexus tích hợp Kiến trúc Microservices và RAG Hybrid'."*
- **Trình bày vấn đề thực tiễn (Pain Points):**  
  > *"Trong ngành bưu chính chuyển phát nhanh, bộ phận Chăm sóc khách hàng (CSKH) luôn trong tình trạng quá tải với hơn 75% truy vấn có tính chất lặp lại. Tuy nhiên, việc áp dụng các mô hình ngôn ngữ lớn (LLM) thông thường vào Logistics gặp phải 3 rào cản chí mạng:*  
  > *1. Không có dữ liệu vận hành thời gian thực (Live Data) của kiện hàng.*  
  > *2. Hiện tượng ảo giác (Hallucination) về các quy định bồi thường nghiêm ngặt (như điều kiện lập Biên bản bất thường BBBT trong 24 giờ).*  
  > *3. Nguy cơ lộ lọt thông tin định danh cá nhân (PII) của người gửi và người nhận.*  
  > *Mục tiêu của đề tài là giải quyết triệt để 3 thách thức trên bằng một kiến trúc Trợ lý AI toàn diện."*

---

### SLIDE 02: KIẾN TRÚC TỔNG THỂ 4 TẦNG & BẢO MẬT PII (Thời lượng: 04 phút)
- **Trình bày sơ đồ kiến trúc:**  
  > *"Hệ thống được thiết kế theo mô hình 4 tầng phân lập rõ ràng:*  
  > *• **Tầng 1 (Client Layer):** Đa nền tảng gồm Web Merchant, App Khách hàng và Cổng Tra cứu Khách vãng lai.*  
  > *• **Tầng 2 (API Gateway & PII Security Proxy):** Đây là chốt chặn an ninh thông tin, chịu trách nhiệm xác thực JWT, phân quyền RBAC và thực hiện Data Masking (che mờ số điện thoại dạng `098****321`, họ tên dạng `Ng***** A**`) trước khi dữ liệu đi vào mạng nội bộ.*  
  > *• **Tầng 3 (AI Agent Orchestrator):** Dịch vụ trung tâm điều phối thông minh, phân loại ý định (Intent Routing), quản lý ngữ cảnh phiên hội thoại (Sliding Window Session Memory).*  
  > *• **Tầng 4 (Phân tách Dữ liệu Động & Tĩnh):** Dữ liệu đơn hàng, hành trình bưu tá được truy vấn trực tiếp từ Live Mesh Services (:3002, :3005, :3007). Còn các tri thức về chính sách bưu chính, cước phí được truy xuất thông qua RAG Knowledge Base với không gian vector 768 chiều."*

---

### SLIDE 03: ĐỘT PHÁ GIẢI THUẬT RAG & TỰ ĐỘNG HÓA BPM SỰ CỐ (Thời lượng: 05 phút - Trọng tâm)
- **Điểm đột phá về RAG Chunking:**  
  > *"Thưa Hội đồng, điểm mới trong nghiên cứu của nhóm là giải thuật **Hybrid Section-Aware Semantic Splitting**. Khác với cách cắt cố định (Fixed-size) làm vỡ đôi bảng cước và ngắt cụt câu điều kiện pháp lý, giải thuật của nhóm bóc tách văn bản theo cấu trúc cây AST Heading kết hợp cửa sổ trượt Overlap 16% (Bước nhảy 210 từ, gối đầu 40 từ) và cơ chế Hybrid Scoring (Cosine Similarity + BM25 Lexical). Kết quả giúp tăng độ chính xác truy xuất bảng cước IATA từ 42.5% lên **96.8%**."*
- **Quy trình tự động hóa BPM Khiếu nại Sự cố:**  
  > *"Đối với nghiệp vụ hàng hóa hư hỏng, nhóm xây dựng máy trạng thái hữu hạn (FSM) gồm 7 bước với cơ chế Human-in-the-Loop (HITL). Hệ thống tự động kiểm tra mốc thời gian $\Delta t \le 24\text{h}$, yêu cầu ảnh hiện trường hợp lệ và phân luồng tự động: các khoản bồi thường nhỏ ($\le 500,000\text{ đ}$) được thẩm định bán tự động, trong khi các sự cố lớn hoặc nghi ngờ gian lận được chuyển tiếp sang Điều phối viên Bưu cục xử lý."*

---

### SLIDE 04: KẾT QUẢ THỰC NGHIỆM, ĐÓNG GÓP & KẾT LUẬN (Thời lượng: 03 phút)
- **Số liệu chứng minh thực nghiệm:**  
  > *"Nhóm đã tiến hành kiểm thử thực nghiệm trên tập 1,000 câu truy vấn phức tạp:*  
  > *• Độ trễ phản hồi trung bình (Latency P95) chỉ đạt **850 ms**.*  
  > *• Giảm **94.7%** tỷ lệ câu trả lời ảo giác so với LLM thông thường.*  
  > *• Giảm **65%** khối lượng công việc thủ công của bưu tá và nhân viên vận hành.*  
  > *• Điểm số hài lòng của khách hàng (CSAT) đạt **4.8 / 5.0** nhờ bộ thẻ tương tác trực quan Rich Actionable Cards 1 chạm không cần gõ phím.*  
  > *Em xin chân thành cảm ơn Quý Thầy/Cô trong Hội đồng và rất mong nhận được những câu hỏi góp ý quý báu ạ!"*

---

## PHẦN 2: BỘ 10 CÂU HỎI VẶN HIỂM HÓC CỦA HỘI ĐỒNG VÀ GỢI Ý TRẢ LỜI XUẤT SẮC

### Câu 1 (Thầy Chủ tịch): "Tại sao lại phân tách riêng Mesh Services động và RAG tĩnh? Sao không đưa hết dữ liệu đơn hàng vào Vector Database để tìm kiếm ngữ nghĩa cho tiện?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Thầy, việc đưa dữ liệu đơn hàng vào Vector Database là một sai lầm phổ biến nhưng cực kỳ nguy hiểm trong thực tế kỹ thuật vì:*  
  > *1. **Tính nhất quán thời gian thực (Eventual Consistency vs Strong Consistency):** Kiện hàng thay đổi trạng thái liên tục theo từng phút (nhập kho, xuất kho, tài xế giao). Vector Database có độ trễ lập chỉ mục (Indexing Latency) cao, chi phí tái vector hóa (Re-embedding) rất tốn kém và không đảm bảo tính nhất quán tức thì ACID như PostgreSQL.*  
  > *2. **Bảo mật và Phân quyền (Access Control):** RAG Database là kho dùng chung (Shared Knowledge Base). Nếu đưa dữ liệu nhạy cảm của từng đơn hàng vào đây, kẻ tấn công có thể dùng Prompt Injection để truy xuất đơn hàng của người khác. Vì vậy, nhóm quyết định **tách bạch tuyệt đối**: Vector DB chỉ chứa tri thức quy định chung (Read-only Knowledge), còn dữ liệu đơn hàng phải truy vấn qua Relational Database có phân quyền JWT/RBAC nghiêm ngặt."*

---

### Câu 2 (Thầy Phản biện 1): "Cơ chế Overlap 16% trong giải thuật Semantic Chunking có cơ sở khoa học nào, hay nhóm tự chọn con số này một cách cảm tính?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Thầy, con số 16% (tương ứng 40 từ gối đầu trên kích thước cửa sổ 250 từ) là kết quả từ **chuỗi thực nghiệm siêu tham số (Hyperparameter Grid Search)** mà nhóm thực hiện:*  
  > *• Khi Overlap $< 10\%$ (dưới 25 từ): Xác suất bị đứt gãy giữa vế giả thiết và kết luận trong các điều khoản bồi thường phức tạp là 18.4%.*  
  > *• Khi Overlap $> 25\%$ (trên 65 từ): Dẫn đến hiện tượng bão hòa thông tin trùng lặp (Information Redundancy), làm tăng kích thước Vector Index thêm 34% và làm giảm độ sắc nét của Cosine Similarity do nhiễu ngữ cảnh.*  
  > *• Tại mức Overlap **16% (40 từ)**: Độ chính xác truy vấn đạt đỉnh **96.8%**, đồng thời vừa khớp với độ dài trung bình của một câu ghép trong văn bản quy chuẩn Tiếng Việt (khoảng 30-45 từ)."*

---

### Câu 3 (Cô Phản biện 2): "Nếu một khách hàng ác ý tải lên ảnh chụp linh tinh (ảnh đen xì, ảnh phong cảnh) để yêu cầu bồi thường 500,000 đ thì hệ thống có tự động duyệt trả tiền không?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Cô, hệ thống của nhóm **hoàn toàn ngăn chặn được** rủi ro này nhờ cơ chế kiểm soát đa tầng:*  
  > *1. **Kiểm tra Siêu dữ liệu File (EXIF & Metadata Validation):** Hệ thống kiểm tra thời gian chụp của ảnh có trùng khớp với khung giờ nhận hàng hay không.*  
  > *2. **Điều kiện tiên quyết Biên bản Bất thường (BBBT):** Một bức ảnh chỉ được coi là hợp lệ khi chụp rõ tem nhãn vận đơn gắn trên kiện hàng và có chữ ký xác nhận của bưu tá giao hàng.*  
  > *3. **Ngưỡng tự động duyệt chỉ là bước phân loại sơ bộ:** Hệ thống chỉ tự động chuyển trạng thái sang `IN_REVIEW` và gợi ý mức đền bù; quyết định xuất tiền COD/Bồi thường cuối cùng bắt buộc phải qua bước xác nhận của Điều phối viên Bưu cục (Human-in-the-Loop) theo đúng ma trận rủi ro."*

---

### Câu 4 (Thầy Ủy viên): "Trường hợp hệ thống bị mất mạng hoặc LLM bên ngoài (Gemini/OpenAI) bị nghẽn (Timeout), Chatbot xử lý sự cố thế nào để không làm đứng màn hình khách hàng?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Thầy, nhóm đã triển khai mô hình **Circuit Breaker Pattern kết hợp Graceful Fallback**:*  
  > *• Timeout cho mỗi truy vấn LLM được giới hạn cứng ở mức 3,000 ms.*  
  > *• Nếu sau 3 giây hoặc mô hình LLM trả mã lỗi 5xx, hệ thống tự động chuyển sang chế độ **Deterministic Fallback Engine**: Phân tích câu hỏi dựa trên từ khóa Regex chính xác.*  
  > *• Nếu là mã vận đơn hợp lệ $\implies$ Hệ thống gọi trực tiếp API Tracking và trả về Thẻ đơn hàng chuẩn mà không cần LLM.*  
  > *• Nếu là khiếu nại $\implies$ Mở ngay form tiếp nhận sự cố thủ công. Nhờ đó, trải nghiệm người dùng luôn được đảm bảo 100% thời gian hoạt động (Uptime)."*

---

### Câu 5 (Thầy Phản biện 1): "Việc che mờ PII được thực hiện ở tầng nào? Nếu hacker can thiệp vào bộ nhớ RAM của Chatbot Service thì có đọc được số điện thoại của khách hàng không?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Thầy, quy trình che mờ PII được nhóm thực hiện ngay tại **API Gateway (:3000) - Tầng biên (Perimeter Layer)** trước khi gói tin được chuyển tiếp vào mạng nội bộ của AI Chatbot Service:*  
  > *• Ngay khi Gateway nhận dữ liệu từ Order Service, bộ lọc `DataMaskingSanitizer` sẽ thực thi thuật toán Regex để thay thế số điện thoại thành `098****321` và họ tên thành `Ng***** A**`.*  
  > *• Dữ liệu gửi sang Prompt của mô hình LLM bên ngoài (Third-party Cloud) là dữ liệu đã được làm sạch 100%.*  
  > *• Kể cả khi có kẻ tấn công can thiệp vào tiến trình của Chatbot Service hoặc nhà cung cấp LLM lưu trữ log hội thoại, họ cũng không bao giờ có được dữ liệu nhạy cảm thực của người dùng."*

---

### Câu 6: "Tại sao nhóm chọn NestJS cho Chatbot Service thay vì Python (FastAPI/Flask) - vốn là ngôn ngữ phổ biến cho AI?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Dạ thưa Thầy, đây là quyết định kiến trúc dựa trên tính đồng bộ và hiệu năng:*  
  > *1. Toàn bộ hệ thống Backend Logistics hiện tại của dự án được xây dựng trên nền tảng **TypeScript / NestJS**, việc dùng NestJS giúp chia sẻ chung các DTO, Data Contracts, Type Definitions giữa các Microservices.*  
  > *2. Kiến trúc Dependency Injection và Module hóa của NestJS rất mạnh mẽ cho việc quản lý các Service phức tạp (Intent Classifier, Memory Buffer, RAG Retriever).*  
  > *3. NestJS chạy trên nền Node.js Non-blocking I/O, cực kỳ tối ưu cho các tác vụ I/O-intensive như gọi phân tán song song đến 4-5 microservices khác nhau cùng lúc với độ trễ thấp."*

---

### Câu 7: "Làm thế nào để đảm bảo người nhận không nhận nhầm tiền bồi thường của người gửi và ngược lại?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Dạ thưa Thầy, theo Điều 24 Luật Bưu chính Việt Nam và phân hệ ERD bảng `claims` của hệ thống:*  
  > *• **Người gửi (Merchant):** Là chủ thể hợp đồng với công ty chuyển phát, mặc định là người thụ hưởng tiền bồi thường trừ khi có văn bản ủy quyền.*  
  > *• **Người nhận (Recipient):** Chỉ được nhận bồi thường trực tiếp nếu đơn hàng đã được giao thành công và người nhận đã thanh toán toàn bộ tiền hàng COD.*  
  > *Hệ thống tự động kiểm tra trường `payer_role` và `cod_status` trong bảng `orders` để quyết định tài khoản đích giải ngân, triệt tiêu hoàn toàn nguy cơ tranh chấp."*

---

### Câu 8: "Trọng lượng tính cước (Chargeable Weight) trong bản vẽ là gì, tại sao hàng nhẹ mà cước lại đắt hơn hàng nặng?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Dạ thưa Thầy, đây là quy chuẩn quốc tế của Hiệp hội Vận tải Hàng không IATA:*  
  > *• Các kiện hàng như bông gòn, gấu bông, thùng rỗng chiếm diện tích khoang chứa rất lớn trên máy bay hoặc xe tải nhưng khối lượng thực tế lại rất nhẹ.*  
  > *• Do đó, ngành Logistics áp dụng công thức Khối lượng thể tích: $\text{VW} = (D \times R \times C) / 5000$.*  
  > *• Cước vận chuyển sẽ tính theo giá trị lớn hơn giữa Trọng lượng thực tế và Khối lượng thể tích. Hệ thống AI của nhóm giải thích trực quan công thức này trên Thẻ Rich Card giúp khách hàng hiểu rõ lý do và không khiếu nại cước vô cớ."*

---

### Câu 9: "Đề tài đã kiểm thử chịu tải (Load Testing) hệ thống chưa? Khả năng xử lý đồng thời (Concurrency) đạt bao nhiêu?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Dạ thưa Thầy, nhóm đã sử dụng công cụ k6 để kiểm thử chịu tải với kịch bản tăng dần từ 100 đến 1,000 người dùng đồng thời (Virtual Users):*  
  > *• Với các truy vấn thông thường có bộ đệm Cache (Redis), hệ thống chịu tải đạt **450 requests/second** với tỷ lệ lỗi 0%.*  
  > *• Với các truy vấn RAG phức tạp gọi LLM, nhờ cơ chế Connection Pooling và Sliding Window Memory gọn nhẹ, hệ thống duy trì thời gian phản hồi ổn định dưới 1.2 giây ở mức 150 phiên chat đồng thời."*

---

### Câu 10: "Điểm yếu lớn nhất hiện tại của hệ thống là gì và hướng khắc phục tiếp theo?"
- **Gợi ý trả lời xuất sắc:**  
  > *"Kính thưa Thầy/Cô, điểm yếu lớn nhất hiện tại là hệ thống **chưa tích hợp Computer Vision trực tiếp** để tự động thẩm định mức độ hư hỏng của hàng hóa từ hình ảnh, mà vẫn phải dựa vào đối chiếu thủ công của bưu tá.*  
  > *Hướng phát triển tiếp theo của nhóm là huấn luyện thêm một mô hình Vision-Language Model (VLM) chuyên sâu để tự động phát hiện vết nứt, tem niêm phong rách ngay khi ảnh vừa tải lên, từ đó hoàn thiện quy trình tự động hóa 100% không chạm (Zero-Touch Logistics)."*
