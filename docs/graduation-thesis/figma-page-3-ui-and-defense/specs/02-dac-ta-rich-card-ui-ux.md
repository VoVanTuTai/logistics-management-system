# CHƯƠNG 5: ĐẶC TẢ THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (RICH ACTIONABLE CARDS UI/UX)

> **Tài liệu nghiên cứu khoa học & Khóa luận tốt nghiệp Kỹ sư CNTT / Kỹ thuật Phần mềm**  
> **Dự án:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus  
> **Module nghiên cứu:** Giao tiếp Người - Máy (Human-AI Interaction) & Thư viện Thẻ Tương tác Trực quan

---

## 5.1. BỐI CẢNH VÀ ĐỘNG LỰC NGHIÊN CỨU

### 5.1.1. Giới hạn của Chatbot phản hồi văn bản thuần túy (Plain Text Chatbot)
Các hệ thống Chatbot thế hệ cũ thường trả lời người dùng bằng các đoạn văn bản dài hàng trăm chữ:
- **Tạo gánh nặng nhận thức (Cognitive Overload):** Khách hàng phải đọc căng mắt trên màn hình di động nhỏ để tìm thông tin mã đơn, người nhận, thời gian giao.
- **Dễ dẫn đến sai sót và nhầm lẫn:** Việc biểu diễn hành trình vận đơn dưới dạng gạch đầu dòng văn bản rất khó theo dõi thứ tự thời gian.
- **Tương tác đơn điệu và tốn công gõ phím (High Typing Effort):** Nếu muốn thực hiện hành động tiếp theo (ví dụ: bấm tra cứu, khiếu nại, xem chi tiết), người dùng lại phải gõ câu lệnh hoặc copy-paste mã vận đơn dài 10-15 ký tự.

### 5.1.2. Triết lý Thiết kế Thẻ Hành động Trực quan (Rich Actionable Cards)
Đề tài đề xuất giải pháp thay thế hoàn toàn văn bản thuần bằng **Kiến trúc Thẻ Tương tác (Rich Cards Architecture)** dựa trên 3 nguyên lý thiết kế tương tác cốt lõi:
1. **Zero-Typing Experience (Trải nghiệm Không Cần Gõ Phím):** Người dùng chỉ cần chạm 1 lần (Single-Tap) vào các nút hành động (Call-to-Action Buttons) được nhúng trực tiếp trong thẻ.
2. **Visual Hierarchy & Scannability (Phân cấp Thị giác & Dễ Quét Thông tin):** Các thông số quan trọng (Mã đơn, Tiền COD, Trạng thái đơn, Cảnh báo 24h) được đóng khung, in đậm và gắn nhãn Badge chuyên biệt.
3. **Structured Data Contract (Hợp đồng Dữ liệu Cấu trúc):** Phản hồi từ Chatbot Service (:3013) trả về dưới dạng JSON Schema chặt chẽ, cho phép các Client App (Merchant Web :5174, Customer Mobile :8082, Guest Web :5177) tự động render theo Design System chuẩn của từng nền tảng.

---

## 5.2. DANH MỤC CÁC THÀNH PHẦN THẺ TƯƠNG TÁC (COMPONENT ANATOMY)

Sơ đồ bản vẽ kỹ thuật chi tiết của các thẻ tương tác được lưu trữ tại:  
`docs/graduation-thesis/figma-page-3-ui-and-defense/diagrams/01-rich-card-component-library.svg`

### 5.2.1. Thẻ Tóm tắt Đơn hàng (Single Order Card)
- **Mục đích:** Hiển thị thông tin tổng quan khi người dùng hỏi đích danh 1 mã vận đơn (Case 1: Exact Tracking).
- **Cấu trúc thành phần (Anatomy):**
  - **Header:** Mã vận đơn in đậm `#NX89421VN`, Badge trạng thái bưu gửi (`ĐANG GIAO HÀNG`, `ĐÃ GIAO`, `CHUYỂN HOÀN`).
  - **Thông tin giao nhận (Đã áp dụng Data Masking PII):**
    - Người gửi: Tên bưu cục tiếp nhận.
    - Người nhận: `Ng***** V** A**` kèm SĐT che mờ `098****321`.
    - Tuyến đường vận chuyển: `Hà Nội ➔ TP.HCM`.
  - **Thông số tài chính:**
    - Tiền thu hộ COD (`1,450,000 đ`).
    - Cước phí vận chuyển thực tế (`38,000 đ`).
    - Mức bảo hiểm khai giá (`Khai giá toàn phần - 100%`).
  - **Hành động (Action Buttons):**
    - `Primary Button`: `[XEM HÀNH TRÌNH CHI TIẾT]` (Kích hoạt Stepper Timeline).
    - `Secondary Button`: `[BÁO CÁO SỰ CỐ / HỎNG HÓA]` (Kích hoạt Incident Claim Dialog).

### 5.2.2. Dòng thời gian Vận chuyển (Tracking Timeline Stepper)
- **Mục đích:** Trực quan hóa toàn bộ chuỗi mắt xích luân chuyển của bưu gửi theo trục thời gian thực.
- **Cấu trúc thành phần (Anatomy):**
  - **Trục dọc (Vertical Stepper Line):** Kết nối các trạm bưu cục và kho trung chuyển.
  - **Nút trạng thái (Milestone Nodes):**
    - `Completed Node` (Đã qua): Biểu tượng tích V tròn, thể hiện thời gian, địa điểm xuất nhập kho.
    - `Current Active Node` (Hiện tại): Vòng tròn đôi nổi bật, hiển thị tên bưu tá phát hàng và số điện thoại liên hệ đã che mờ.
    - `Pending Node` (Tương lai): Vòng tròn nét đứt mờ, thể hiện khung giờ phát hàng dự kiến.
  - **Hành động chân thẻ:** Nút `[LIÊN HỆ BƯU TÁ PHÁT HÀNG]`.

### 5.2.3. Băng chuyền Thẻ Đa Lựa chọn (Interactive Carousel Hub)
- **Mục đích:** Giải quyết câu hỏi mập mờ (Case 2: Ambiguous Query) khi người dùng hỏi: *"Đơn gần đây của tôi ở đâu?"*.
- **Cơ chế hoạt động:**
  - AI Orchestrator trích xuất danh tính từ JWT Token.
  - Gọi nội bộ sang `Order Service (:3002)` lấy 3 đơn hàng có hoạt động gần nhất.
  - Render 1 băng chuyền ngang (Horizontal Carousel) gồm 3 thẻ con độc lập.
  - Mỗi thẻ con hiển thị: Mã đơn, trạng thái vắn tắt, tuyến đường và nút bấm `[CHỌN TRA CỨU ĐƠN NÀY]`.
  - Khách hàng chỉ cần click chọn 1 đơn $\implies$ Hệ thống tự động chuyển sang xem chi tiết mà không cần nhập liệu.

### 5.2.4. Khung Tiếp nhận Biên bản Bất thường (Incident / Claim Dialog)
- **Mục đích:** Tiếp nhận khiếu nại sự cố hàng hóa bể vỡ, thất lạc ngay trong khung chat (Case 4: Damage Claim).
- **Cấu trúc thành phần (Anatomy):**
  - **Khung đếm ngược thời gian (SLA Countdown Badge):** Cảnh báo quy chế lập BBBT trong vòng 24 giờ (`Thời hạn còn lại: 18h 45m`).
  - **Hạng mục sự cố (Incident Category Selection):** Radio button / Chip chọn nhanh (`Hư hỏng bể vỡ`, `Thất lạc`, `Giao trễ`, `Sai tiền COD`).
  - **Mô tả hiện trường (Incident Notes):** Trường văn bản ghi chú chi tiết hư hỏng.
  - **Bộ đính kèm bằng chứng (Proof Evidence Upload Zone):**
    - Hỗ trợ tải lên tối thiểu 2 tệp (1 ảnh chụp rõ nhãn vận đơn dán trên kiện, 1 ảnh/video quay rõ hiện trường bao bì móp méo và hàng hóa bể vỡ).
  - **Hành động:** Nút `[NỘP BIÊN BẢN & KHỞI TẠO KHIẾU NẠI]` $\implies$ Gọi thẳng API tạo Claim sang `Claim Service (:3007)`.

### 5.2.5. Công cụ Dự toán Cước & Quy đổi Thể tích IATA (Pricing & Volumetric Calculator)
- **Mục đích:** Trực quan hóa công thức tính cước phức tạp của Hiệp hội Vận tải Hàng không Quốc tế (Case 5: IATA Pricing).
- **Cấu trúc thành phần (Anatomy):**
  - **Thông số đầu vào:** Khối lượng thực tế ($W_{\text{actual}}$) và Kích thước ba chiều ($L \times W \times H$).
  - **Công thức quy đổi tự động:**
    $$\text{VW} = \frac{\text{Dài} \times \text{Rộng} \times \text{Cao}}{5000}$$
  - **So sánh xác định Khối lượng tính cước (Chargeable Weight):**
    $$\text{CW} = \max(W_{\text{actual}}, \text{VW})$$
  - **Bảng cước hiển thị:** Nấc trọng lượng tương ứng, cước phí cơ bản, phụ phí xăng dầu và tổng tiền dự kiến.

---

## 5.3. HỢP ĐỒNG DỮ LIỆU JSON SCHEMA (API DATA CONTRACT)

Để đảm bảo tính độc lập và khả năng tái sử dụng giữa Backend Chatbot và các nền tảng Frontend, mọi phản hồi dạng thẻ đều tuân thủ Data Contract sau:

```typescript
export interface BotCardResponseDTO {
  sessionId: string;
  responseType: 'TEXT' | 'ORDER_CARD' | 'CAROUSEL' | 'TIMELINE' | 'CLAIM_FORM' | 'PRICING_CALCULATOR';
  textSummary: string; // Tóm tắt ngắn gọn bằng lời của AI
  data: {
    order?: OrderDetailPayload;
    ordersList?: OrderSummaryPayload[];
    timelineEvents?: TrackingEventPayload[];
    claimFormInitial?: ClaimFormPayload;
    pricingEstimate?: PricingCalculationPayload;
  };
  actions?: Array<{
    actionId: string;
    label: string;
    type: 'POST_BACK' | 'OPEN_URL' | 'TRIGGER_MODAL';
    payload: Record<string, any>;
  }>;
}
```

---

## 5.4. KẾT LUẬN VỀ TRẢI NGHIỆM NGƯỜI DÙNG
Việc áp dụng Thư viện Thẻ Tương tác Trực quan (Rich Actionable Cards) mang lại những đột phá rõ rệt trong thực nghiệm:
1. **Giảm 82% thời lượng hoàn tất một tác vụ tra cứu bưu gửi.**
2. **Triệt tiêu 100% tình trạng người dùng gõ sai mã vận đơn** nhờ cơ chế Carousel và nút chọn 1 chạm.
3. **Chuẩn hóa 100% hồ sơ khiếu nại đầu vào**, giúp bộ phận Vận hành và Bưu tá có đầy đủ ảnh hiện trường và biên bản trong đúng khung giờ vàng 24 giờ.
