# CHƯƠNG 3: PHÂN TÍCH CÁC KỊCH BẢN NGHIỆP VỤ & CƠ CHẾ BẢO MẬT DỮ LIỆU CÁ NHÂN (PII)

> **Tài liệu nghiên cứu khoa học & Khóa luận tốt nghiệp kỹ sư ngành Công nghệ Thông tin / Kỹ thuật Phần mềm**  
> **Chủ đề chuyên sâu:** Phân loại 5 ca nghiệp vụ bưu chính thực tế, Thiết kế giao diện thẻ tương tác Rich Card/Carousel và Thuật toán che giấu PII (Personally Identifiable Information)

---

## 3.1. TỔNG QUAN PHÂN LOẠI 5 CA NGHIỆP VỤ CỐT LÕI

Trong các hệ thống thương mại điện tử và logistics hiện đại, trải nghiệm của người dùng với trợ lý ảo thường bị giới hạn ở việc "hỏi gì đáp nấy" dưới dạng văn bản (plain text). Điều này tạo ra rào cản lớn:
- Khách hàng phải gõ đi gõ lại nhiều lần để làm rõ ý định.
- Văn bản dài dòng gây khó khăn khi theo dõi trên màn hình điện thoại di động.
- Không thể kích hoạt trực tiếp các hành động tiếp theo (Actionable Triggers).

Hệ thống Nexus AI Chatbot giải quyết bài toán này bằng cách phân phối thông minh thành **5 Ca nghiệp vụ độc lập (5 Core Business Use Cases)**, kết hợp giữa máy học nhận dạng ý định (Intent Recognition) và các thành phần giao diện tương tác chuyên biệt (Rich Actionable Cards).

Sơ đồ phân luồng quyết định (Decision Tree & State Machine) được biểu diễn chi tiết tại file vector SVG chuẩn Figma:  
`docs/graduation-thesis/diagrams-svg/03-multi-case-business-flow.svg`

---

## 3.2. CHI TIẾT 5 CA NGHIỆP VỤ & QUY TRÌNH XỬ LÝ

### CASE 1: Tra cứu đơn hàng xác định (Single Tracking - Exact Code `NX-...`)
- **Điều kiện kích hoạt:** Bộ tiền xử lý (Query Normalizer) nhận dạng được chuỗi regex `/NX-\d{6,}/i` trong câu hỏi người dùng (ví dụ: *"Đơn NX-884920489 đi tới đâu rồi?"*).
- **Quy trình xử lý:**
  1. Trích xuất chính xác mã vận đơn.
  2. Bỏ qua bước gọi LLM phân tích ý định để tối ưu độ trễ ($< 50\text{ ms}$).
  3. Gửi lệnh nội bộ đến **Tracking Microservice** (`GET :3000/orders/track/:code`).
  4. Trích xuất chuỗi sự kiện thời gian thực (Milestones Timeline): `CREATED` $\to$ `PICKED_UP` $\to$ `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`.
- **Giao diện phản hồi (UI Component):** `ORDER_TRACKING_CARD`
  - Thanh tiến trình trực quan 4 bước có trạng thái phát sáng (Glow).
  - Tên và số điện thoại tài xế giao hàng (nếu đang ở trạng thái phát hàng).
  - Thời gian dự kiến giao hàng (ETA).
  - Hai nút hành động nhanh: **[📍 Theo dõi vị trí tài xế]** và **[📞 Gọi tổng đài hỗ trợ]**.

---

### CASE 2: Tra cứu nhiều đơn hàng / Ý định mập mờ (Multi-Order Ambiguity & Interactive Carousel)
- **Điều kiện kích hoạt:** Khách hàng hỏi câu hỏi chung chung, không kèm mã đơn (ví dụ: *"Đơn hàng gần đây của tôi đã đến đâu rồi?"*, *"Tôi có đơn nào đang giao không?"*).
- **Vấn đề thực tế:** Nếu Chatbot chỉ trả lời *"Bạn vui lòng cung cấp mã đơn hàng"*, trải nghiệm người dùng sẽ bị đứt gãy vì khách hàng không nhớ mã đơn dài 12 ký tự.
- **Quy trình xử lý thông minh:**
  1. Kiểm tra ngữ cảnh người dùng (`customerId` hoặc `merchantId` trong JWT Token).
  2. Truy vấn danh sách $N$ đơn hàng gần nhất đang trong trạng thái hoạt động từ **Order Service** (`GET :3000/orders/my-orders?limit=3`).
  3. Nếu tìm thấy nhiều đơn hàng: Thay vì hỏi lại bằng văn bản, Chatbot tự động tạo một tập thẻ trượt tương tác (**Interactive Carousel**).
- **Giao diện phản hồi (UI Component):** `ORDER_CAROUSEL_CARD`
  - Danh sách các đơn hàng thu nhỏ hiển thị: Mã vận đơn, Tên hàng tóm tắt, Điểm đến, Badge trạng thái có màu sắc phân biệt (`ĐANG GIAO` màu xanh lá, `ĐANG LẤY` màu vàng, `ĐÃ GIAO` màu xanh dương).
  - Mỗi đơn hàng đính kèm nút bấm **[Chọn tra cứu]** (1 chạm).
  - Khi người dùng chạm vào một đơn, Client tự động gửi payload tra cứu chi tiết đơn đó về Chatbot $\implies$ Chuyển mượt sang Case 1 mà không cần gõ chữ.

---

### CASE 3: Khách vãng lai & Cơ chế bảo mật dữ liệu nhạy cảm (Guest PII Masking)
- **Bối cảnh pháp lý:** Tuân thủ chặt chẽ **Nghị định 13/2023/NĐ-CP** của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân. Khi một người dùng chưa đăng nhập (Guest) nhập mã vận đơn vào cổng tra cứu công khai, hệ thống phải ngăn chặn nguy cơ kẻ xấu dò quét (brute-force) để thu thập thông tin khách hàng.
- **Quy trình khử định danh dữ liệu (PII Sanitization Pipeline):**
  1. Khi Gateway phát hiện Request không có Bearer Token hợp lệ, gắn cờ `scope: GUEST`.
  2. Dữ liệu thô từ Order Service và Tracking Service khi đi qua tầng Security Proxy sẽ áp dụng thuật toán che mờ:
     - **Số điện thoại:** Giữ lại 3 số đầu và 4 số cuối, ẩn 3 số giữa:
       $$\text{PhoneMask}: \text{"0984123456"} \implies \text{"098***3456"}$$
     - **Họ tên khách hàng:** Giữ lại chữ cái đầu các từ:
       $$\text{NameMask}: \text{"Nguyễn Văn An"} \implies \text{"N*** V** A"}$$
     - **Địa chỉ giao nhận:** Cắt bỏ số nhà và tên đường ngõ ngách, chỉ hiển thị đơn vị hành chính cấp Xã/Phường và Quận/Huyện:
       $$\text{AddressMask}: \text{"Số 123 Đường Lê Duẩn, P. Bến Nghé, Q.1"} \implies \text{"P. Bến Nghé, Quận 1, TP.HCM"}$$
     - **Thông tin tài chính:** Ẩn hoàn toàn số tiền thu hộ COD.
- **Giao diện phản hồi (UI Component):** `MASKED_PUBLIC_CARD`
  - Vẫn hiển thị đầy đủ tiến trình di chuyển của kiện hàng để khách an tâm.
  - Các trường nhạy cảm hiển thị dấu sao bảo mật kèm biểu tượng ổ khóa 🔐.
  - Nút kêu gọi hành động: **[🔐 Đăng nhập để xem thông tin chi tiết đầy đủ]**.

---

### CASE 4: Xử lý sự cố hàng hư hỏng, bể vỡ & Quy chuẩn khiếu nại (Damage SOP & Claim Tracking)
- **Điều kiện kích hoạt:** Khách hàng bày tỏ sự bức xúc, thông báo hàng hóa bị thiệt hại (ví dụ: *"Hàng của tôi bị vỡ nát rồi, công ty có đền tiền không?"*, *"Hàng thủy tinh giao đến bị hỏng"*).
- **Quy trình xử lý RAG kết hợp Nghiệp vụ thực tế:**
  1. Bộ chuẩn hóa ngôn ngữ nhận diện từ khóa nhạy cảm qua **Logistics Thesaurus**: `["vỡ", "bể", "nát", "hỏng"]` $\implies$ Ánh xạ tới bộ tài liệu quy trình `02-insurance-and-claim-policy.md` và `04-delivery-exceptions-and-sop.md`.
  2. RAG trích xuất chính xác quy định xử lý sự cố tại chỗ (**SOP Bưu chính**):
     - Thời hạn bắt buộc: Lập **Biên bản bất thường (BBBT)** trong vòng **24 giờ** kể từ khi nhận hàng.
     - Yêu cầu bằng chứng hình ảnh: Tối thiểu 3 ảnh chụp rõ nét (Mặt ngoài thùng có mã vận đơn, Lớp lót chống sốc bên trong, Chi tiết vị trí hàng hóa bị nứt/vỡ).
     - Điều kiện đền bù: 100% giá trị hóa đơn nếu có sử dụng dịch vụ Khai giá bảo hiểm; Tối đa 4 lần cước nếu không khai giá.
  3. Nếu khách hàng cung cấp mã hồ sơ khiếu nại dạng `CLM-\d{4,}` (ví dụ: `CLM-88219`), Chatbot tự động kết nối **Claim Service** (`GET :3000/claims/:claimCode`) để hiển thị tiến độ.
- **Giao diện phản hồi (UI Component):** `CLAIM_PROGRESS_CARD`
  - Thẻ tiến độ bồi thường chuyên nghiệp: Mã hồ sơ, Trạng thái thẩm định (`ĐANG THẨM ĐỊNH`), Tình trạng tiếp nhận BBBT, Số tiền bồi thường dự kiến và Cam kết thời gian xử lý (SLA 48 giờ làm việc).
  - Nút hành động: **[📄 Xem chi tiết Biên bản Bất thường (PDF)]**.

---

### CASE 5: Dự toán cước phí cồng kềnh chuẩn IATA & Chính sách lưu kho / Chuyển hoàn
- **Điều kiện kích hoạt:** Khách hàng hỏi cách tính tiền gửi, kiện hàng kích thước lớn, hoặc chi phí khi giao không thành công phải trả hàng (ví dụ: *"Gửi thùng loa 50x40x30cm nặng 3.5kg cước bao nhiêu?"*, *"Nếu khách không nhận thì phí chuyển hoàn thế nào?"*).
- **Quy trình tính toán khoa học:**
  1. Trích xuất các tham số đo đạc: Chiều dài ($L$), Chiều rộng ($W$), Chiều cao ($H$) tính bằng xentimét (cm) và Cân nặng thực tế ($W_{\text{actual}}$) tính bằng kilôgam (kg).
  2. Áp dụng công thức quy chuẩn quốc tế của Hiệp hội Vận tải Hàng không Quốc tế (**IATA Standard**):
     - **Vận chuyển đường bộ (Road Freight - Tiêu chuẩn nội địa):**
       $$W_{\text{dim}} = \frac{L \times W \times H}{5000} \quad (\text{kg})$$
     - **Vận chuyển đường hàng không (Air Freight - Hỏa tốc):**
       $$W_{\text{dim}} = \frac{L \times W \times H}{6000} \quad (\text{kg})$$
  3. Xác định trọng lượng tính cước cuối cùng ($W_{\text{chargeable}}$):
     $$W_{\text{chargeable}} = \max(W_{\text{actual}}, W_{\text{dim}})$$
     *Ví dụ thực tế:* Kiện hàng $50 \times 40 \times 30\text{ cm}$, nặng $3.5\text{ kg}$. Trọng lượng thể tích quy đổi đường bộ:
     $$W_{\text{dim}} = \frac{50 \times 40 \times 30}{5000} = \frac{60000}{5000} = 12.0\text{ kg}$$
     Do $12.0\text{ kg} > 3.5\text{ kg}$, cước phí sẽ được tính theo mức $12.0\text{ kg}$ thay vì $3.5\text{ kg}$.
  4. Trích xuất chính sách Chuyển hoàn & Lưu kho từ RAG (`01-pricing-and-iata-weight.md` & `05-cod-policy-and-finance.md`):
     - **Phí chuyển hoàn:** Bằng **50% cước chiều đi**.
     - **Phí lưu kho:** Miễn phí 5 ngày đầu tiên; từ ngày thứ 6 tính phí $5.000\text{ VNĐ/kiện/ngày}$.
- **Giao diện phản hồi (UI Component):** `IATA_PRICING_CARD`
  - Bảng kê bóc tách chi tiết: Cước tiêu chuẩn theo nấc cân, Phụ phí hàng cồng kềnh, Tổng cước tạm tính minh bạch, rõ ràng.

---

## 3.3. MA TRẬN PHÂN PHỐI TRẠNG THÁI VÀ CƠ CHẾ DỰ PHÒNG (GRACEFUL DEGRADATION)

Hệ thống được thiết kế theo nguyên lý **Phòng vệ theo chiều sâu (Defense in Depth)**. Trong trường hợp bất kỳ dịch vụ thành phần nào gặp sự cố (ví dụ: Microservice bị timeout, hoặc mất kết nối API Gemini), hệ thống tự động suy giảm tính năng có kiểm soát thay vì báo lỗi máy chủ:

| Tình huống sự cố | Cơ chế dự phòng (Fallback Mechanism) | Thông điệp phản hồi cho người dùng |
| :--- | :--- | :--- |
| **Tracking Service (:3005) Timeout** | Tự động đọc dữ liệu snapshot gần nhất lưu trong Cache Redis (TTL 15 phút) | *"Hệ thống đang đồng bộ dữ liệu trực tiếp, đây là trạng thái cập nhật lúc [hh:mm]..."* |
| **Không tìm thấy mã đơn hàng NX-** | Kiểm tra cú pháp mã. Nếu đúng định dạng nhưng không có trong DB: Gợi ý kiểm tra lại mã hoặc liên hệ tổng đài | *"Mã vận đơn NX-XXXXXX chưa có trên hệ thống. Bạn vui lòng kiểm tra lại mã hoặc vừa tạo trong 30 phút gần đây."* |
| **Gemini API gián đoạn kết nối** | Kích hoạt bộ điều phối phản hồi dựa trên tập luật (Rule-based Fallback Matrix) | Trả về thông tin trạng thái đơn hàng dạng mẫu có cấu trúc tĩnh được định sẵn trong Service |
| **Khách hàng hỏi ngoài phạm vi nghiệp vụ** | Lọc qua bộ kiểm duyệt nội dung (Out-of-Scope Filter) | *"Tôi là trợ lý ảo bưu chính Nexus. Tôi chỉ hỗ trợ tra cứu đơn hàng, quy chế bồi thường và tính cước phí vận chuyển."* |
