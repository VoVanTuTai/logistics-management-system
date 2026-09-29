# TÀI LIỆU ĐẶC TẢ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN BA / SRS)

> **Tài liệu Phân tích Nghiệp vụ Phần mềm (Business Analysis - BA Specification)**  
> **Dự án:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus (Nexus Enterprise Logistics Platform)  
> **Tiêu chuẩn áp dụng:** IEEE 830 / ISO/IEC 25010 / UML 2.5 Specification  
> **Sơ đồ Vector tham chiếu:** [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg)

---

## 1. MA TRẬN PHÂN TÍCH TÁC NHÂN HỆ THỐNG (ACTOR PROFILES & RESPONSIBILITY MATRIX)

Hệ thống phân định rõ **6 nhóm Tác nhân (Actors)** với vai trò, trách nhiệm và quyền hạn phân lập theo mô hình Phân quyền Dựa trên Vai trò (Role-Based Access Control - RBAC):

| STT | Tác nhân (Actor) | Phân loại | Mô tả vai trò & Phạm vi trách nhiệm | Mục tiêu nghiệp vụ cốt lõi |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Khách vãng lai** *(Guest / Anonymous)* | Tác nhân ngoài *(External)* | Người dùng chưa đăng nhập, truy cập qua Web Tracking Portal hoặc Cổng hỏi đáp công khai. | Tra cứu lộ trình kiện hàng qua mã vận đơn; Hỏi đáp chính sách gửi hàng và bảng giá cước IATA qua Trợ lý AI. |
| **02** | **Người nhận hàng** *(Consignee / Recipient)* | Tác nhân ngoài *(External)* | Khách hàng nhận bưu gửi, xác thực qua số điện thoại hoặc mã OTP/JWT. | Theo dõi hành trình đơn hàng; Hẹn lại giờ giao; Thanh toán tiền COD (tiền mặt/QR); Ký nhận hàng điện tử (e-POD); Lập Biên bản Bất thường (BBBT) trong 24h khi hàng hỏng/vỡ. |
| **03** | **Chủ Shop / Người gửi** *(Merchant / Shipper)* | Tác nhân nghiệp vụ *(Business)* | Đối tác ký hợp đồng vận chuyển với bưu chính, sử dụng Merchant Portal (:5174). | Tạo đơn lẻ/hàng loạt; Đồng bộ đơn từ sàn TMĐT (Shopee, TikTok, Lazada); In tem mã vạch; Theo dõi đối soát COD; Rút tiền về tài khoản ngân hàng; Nhận bồi thường sự cố. |
| **04** | **Bưu tá giao nhận** *(Courier / Driver)* | Tác nhân vận hành *(Operational)* | Nhân viên giao nhận chặng cuối (Last-mile), sử dụng Courier Mobile App. | Nhận tuyến giao/lấy hàng; Cập nhật kết quả giao (Thành công/Thất bại); Thu tiền COD mặt & quét mã VietQR SePay; Đồng kiểm và ký BBBT hiện trường; Nộp tiền quyết toán ca giao. |
| **05** | **Điều phối viên Bưu cục** *(Hub Ops Coordinator)* | Tác nhân vận hành *(Operational)* | Nhân sự quản lý kho trung chuyển và bưu cục giao dịch, sử dụng Ops Web (:5173). | Quét mã phân loại bưu gửi; Đóng/mở bao tải trung chuyển liên tỉnh (Manifest); Phân công tuyến cho bưu tá; Thẩm định hồ sơ sự cố hư hỏng hàng hóa; Phê duyệt đền bù sơ bộ ($\le 500\text{k}$). |
| **06** | **Quản trị & Kế toán trưởng** *(Admin & Chief Accountant)* | Tác nhân quản trị *(Administrative)* | Ban giám đốc, kế toán trưởng và quản trị viên kỹ thuật, sử dụng Admin Web (:5175). | Đối soát cấn trừ công nợ & xuất bảng kê COD; Phê duyệt bồi thường các khoản lớn ($>500\text{k}$); Cấu hình bảng cước IATA, phụ phí; Quản trị tri thức RAG 768-D; Phân quyền người dùng. |

---

## 2. DANH MỤC 35 TRƯỜNG HỢP SỬ DỤNG THEO 6 PHÂN HỆ (USE CASE CATALOG)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          HỆ THỐNG QUẢN TRỊ & VẬN HÀNH LOGISTICS ĐA KÊNH NEXUS                          │
├───────────────────────────────────┬───────────────────────────────────┬────────────────────────────────┤
│ 1. TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG   │ 2. KHO TRUNG CHUYỂN & GIAO HÀNG   │ 3. XỬ LÝ SỰ CỐ & BỒI THƯỜNG    │
│  • UC-01: Tạo đơn gửi (Lẻ/Excel)  │  • UC-06: Quét mã phân loại Hub   │  • UC-12: Báo cáo hàng bể vỡ   │
│  • UC-02: Đồng bộ đơn Sàn TMĐT    │  • UC-07: Đóng bao tải Manifest   │  • UC-13: Lập BBBT 24h & Bằng  │
│  • UC-03: In nhãn vận đơn Barcode │  • UC-08: Phân tuyến bưu tá phát  │          chứng hiện trường     │
│  • UC-04: Yêu cầu bưu tá lấy hàng │  • UC-09: Giao hàng & Thu COD     │  • UC-14: Bưu tá xác nhận ký   │
│  • UC-05: Tính cước & Phụ phí     │  • UC-10: Ký nhận điện tử (e-POD) │  • UC-15: Thẩm định điều kiện  │
│                                   │  • UC-11: Hẹn lại ngày nhận hàng  │  • UC-16: Phê duyệt giải ngân  │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ 4. TRỢ LÝ ẢO AI & ĐỘNG CƠ RAG     │ 5. ĐỐI SOÁT TÀI CHÍNH & VÍ COD    │ 6. QUẢN TRỊ HỆ THỐNG & CẤU HÌNH│
│  • UC-17: Tra cứu lộ trình bưu gửi│  • UC-24: Xác nhận thanh toán COD │  • UC-30: Quản lý người dùng   │
│  • UC-18: Khử định danh PII       │  • UC-25: Quyết toán nộp tiền COD │  • UC-31: Cấu hình bảng cước   │
│  • UC-19: Xử lý Carousel mập mờ   │  • UC-26: Đối soát cấn trừ phí    │  • UC-32: Quản lý mạng lưới Hub│
│  • UC-20: Tư vấn cước IATA & SOP  │  • UC-27: Rút tiền Ví COD về NH   │  • UC-33: Thiết lập SLA & BBBT │
│  • UC-21: Khởi tạo khiếu nại AI   │  • UC-28: Truy thu lệch trọng     │  • UC-34: Giám sát Audit Logs  │
│  • UC-22: Vector hóa tri thức     │          lượng cân nặng           │  • UC-35: Kết nối đối tác 3PL  │
│  • UC-23: Sinh thẻ Rich Card      │  • UC-29: Báo cáo doanh thu & nợ  │                                │
└───────────────────────────────────┴───────────────────────────────────┴────────────────────────────────┘
```

---

## 3. ĐẶC TẢ CHI TIẾT CÁC USE CASE TRỌNG TÂM (DETAILED USE CASE SPECS)

### 3.1. UC-13: Lập Biên bản Bất thường (BBBT) trong 24h & Khởi tạo Khiếu nại
- **Mã trường hợp sử dụng:** `UC-13` (Nghiệp vụ cốt lõi theo chỉ dẫn nghiên cứu khoa học).
- **Tác nhân chính:** Người nhận hàng *(Recipient)* / Chủ Shop *(Merchant)*.
- **Tác nhân phụ:** Trợ lý AI *(AI Orchestrator :3013)*, Bưu tá *(Courier)*.
- **Tiền điều kiện (Pre-conditions):**
  1. Kiện hàng đã được phát tới người nhận (Trạng thái `DELIVERED` hoặc `OUT_FOR_DELIVERY`).
  2. Thời gian kể từ mốc giao hàng chưa vượt quá 24 giờ ($\Delta t \le 24\text{h}$).
- **Hậu điều kiện (Post-conditions):**
  1. Bản ghi `claims` được khởi tạo ở trạng thái `SUBMITTED` trong cơ sở dữ liệu.
  2. Các tệp ảnh/video bằng chứng được lưu trữ an toàn và sinh mã băm đối chiếu.
  3. Thông báo tự động gửi tới Bưu tá và Điều phối viên Bưu cục để thẩm tra.
- **Luồng sự kiện chính (Main Success Scenario):**
  1. Khách hàng thông báo sự cố kiện hàng bị móp méo/bể vỡ thông qua Giao diện Chatbot AI hoặc App.
  2. Hệ thống kiểm tra thời gian giao hàng thực tế từ `Tracking Service (:3005)`. Xác nhận hợp lệ $\le 24\text{h}$.
  3. Hệ thống hiển thị Khung tiếp nhận Sự cố (`Incident / Claim Dialog Card`).
  4. Khách hàng lựa chọn phân loại sự cố: `Hư hỏng bể vỡ vật lý (Damaged)`.
  5. Khách hàng tải lên tối thiểu 2 bằng chứng:
     - 01 ảnh chụp cận cảnh nhãn vận đơn gắn trên hộp.
     - 01 ảnh/video quay rõ hiện trường nứt vỡ của sản phẩm bên trong.
  6. Khách hàng xác nhận gửi hồ sơ.
  7. Hệ thống tạo phiếu bồi thường, trả về mã khiếu nại `#CLM-2026-XXXX` và thông báo thời gian thẩm định dự kiến (dưới 48h).
- **Luồng nhánh / Ngoại lệ (Extensions / Exception Flows):**
  - **E1: Vượt quá thời hạn 24 giờ ($\Delta t > 24\text{h}$):** Hệ thống từ chối mở form tự động; hiển thị thông báo quy định Điều 24 Luật Bưu chính và hướng dẫn khách hàng gửi yêu cầu xem xét đặc biệt tới Tổng đài viên giải quyết tranh chấp (Human-in-the-Loop).
  - **E2: Thiếu bằng chứng bắt buộc:** Hệ thống cảnh báo đỏ tại trường upload ảnh, không cho phép nhấn nút xác nhận nộp biên bản.

---

### 3.2. UC-17: Tra cứu Lộ trình Bưu gửi & Khử định danh PII Masking
- **Mã trường hợp sử dụng:** `UC-17`.
- **Tác nhân:** Khách vãng lai *(Guest)*, Người nhận *(Recipient)*, Chủ shop *(Merchant)*.
- **Quan hệ UML:** `<<include>>` UC-18 (Khử định danh PII), `<<include>>` UC-23 (Sinh thẻ Rich Card), `<<extend>>` UC-19 (Carousel).
- **Luồng sự kiện chính:**
  1. Người dùng nhập câu hỏi tự nhiên: *"Kiện hàng NX89421VN đang ở đâu rồi?"*.
  2. `AI Agent Orchestrator (:3013)` bóc tách Intent: `EXACT_ORDER` và trích xuất Entity: `NX89421VN`.
  3. Dịch vụ gọi nội bộ sang `API Gateway (:3000)` để kiểm tra quyền truy cập:
     - Nếu là Guest hoặc chưa đăng nhập: Kích hoạt module `DataMaskingSanitizer` để che mờ SĐT (`098****321`), địa chỉ nhà (`1** Đ** T*** H***`) và họ tên người nhận (`Ng***** V** A**`).
     - Nếu là Merchant sở hữu đơn hàng (đã xác thực JWT): Giữ nguyên thông tin đầy đủ.
  4. Hệ thống tổng hợp dữ liệu mốc thời gian từ `Tracking Service (:3005)`.
  5. Hệ thống đóng gói thành JSON Schema và render `Tracking Stepper Timeline Card` trực quan thay cho câu trả lời văn bản thông thường.

---

### 3.3. UC-20: Tư vấn Chính sách Cước IATA & Phân đoạn RAG
- **Mã trường hợp sử dụng:** `UC-20`.
- **Tác nhân:** Khách vãng lai, Chủ Shop, Người nhận.
- **Tiền điều kiện:** Kho tri thức bưu chính đã được băm nhỏ theo giải thuật `Hybrid Section-Aware Semantic Splitting` với vector nhúng 768-D.
- **Luồng sự kiện chính:**
  1. Người dùng hỏi: *"Gửi thùng hoa quả 40x30x25cm nặng 1.5kg từ Hà Nội vào Sài Gòn hết bao nhiêu tiền?"*.
  2. AI Orchestrator phân loại Intent: `IATA_PRICING`.
  3. Hệ thống trích xuất thông số: $W_{\text{actual}} = 1.5\text{ kg}$, Kích thước: $40 \times 30 \times 25\text{ cm}$.
  4. Áp dụng công thức chuẩn IATA: $\text{VW} = (40 \times 30 \times 25) / 5000 = 6.0\text{ kg}$.
  5. Xác định Trọng lượng tính cước $\text{CW} = \max(1.5, 6.0) = 6.0\text{ kg}$.
  6. RAG Engine truy xuất bảng cước nấc $6.0\text{ kg}$ tuyến liên tỉnh Bắc - Nam $\implies$ Đơn giá $68,000\text{ đ}$.
  7. AI tự động sinh thẻ `Pricing & Volumetric IATA Card` thể hiện chi tiết từng bước tính toán minh bạch.

---

## 4. MA TRẬN PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL & RBAC MATRIX)

Ký hiệu:
- **C** *(Create)*: Quyền khởi tạo / Thêm mới.
- **R** *(Read)*: Quyền xem / Tra cứu dữ liệu.
- **U** *(Update)*: Quyền chỉnh sửa / Cập nhật trạng thái.
- **D** *(Delete)*: Quyền hủy / Xóa bỏ.
- **-**: Không có quyền truy cập.

| Phân hệ chức năng | Guest | Recipient | Merchant | Courier | Hub Ops | Admin / Kế toán |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Phân hệ 1: Quản lý Đơn hàng** | R (Masked) | R (Masked) | C, R, U, D | R | R, U | C, R, U, D |
| **Phân hệ 2: Kho bãi & Giao hàng** | - | R, U (Hẹn giờ) | R | R, U (Giao) | C, R, U | C, R, U |
| **Phân hệ 3: Sự cố & Bồi thường** | - | C, R (Hồ sơ) | C, R | R, U (Ký) | R, U (Duyệt $\le 500\text{k}$) | C, R, U (Duyệt lớn) |
| **Phân hệ 4: Trợ lý AI & RAG** | R (FAQ) | R, C (Tra cứu) | R, C | R (Tra cứu) | R | C, R, U (Quản trị Vector) |
| **Phân hệ 5: Đối soát & Ví COD** | - | - | R, C (Rút tiền) | R, U (Nộp COD) | R, U (Chốt ca) | C, R, U (Xuất tiền) |
| **Phân hệ 6: Quản trị Hệ thống** | - | - | - | - | - | C, R, U, D (Toàn quyền) |

---

## 5. KẾT LUẬN & ĐÓNG GÓP CHO KHÓA LUẬN
Tài liệu đặc tả Use Case này đảm bảo:
1. **Tính hoàn chỉnh (Completeness):** Bao quát đầy đủ mọi khía cạnh thực tế của một doanh nghiệp chuyển phát nhanh đa kênh, từ tiếp nhận đơn, xử lý kho, giao chặng cuối đến quản lý tài chính và trợ lý AI thông minh.
2. **Chuẩn mực kỹ thuật phần mềm (Engineering Standards):** Phân định rạch ròi các quan hệ phụ thuộc `<<include>>`, `<<extend>>`, tuân thủ chuẩn UML 2.5 và tiêu chuẩn tài liệu đặc tả yêu cầu phần mềm IEEE 830.
3. **Giá trị thuyết phục Hội đồng:** Chứng minh sinh viên có tư duy hệ thống bao quát ở cấp độ kiến trúc sư doanh nghiệp (Enterprise Architect), không chỉ dừng lại ở các bài tập lập trình giao diện hay chatbot đơn giản.
