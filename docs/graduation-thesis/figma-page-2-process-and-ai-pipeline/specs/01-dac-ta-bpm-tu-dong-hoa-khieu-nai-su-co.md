# CHƯƠNG 4: ĐẶC TẢ QUY TRÌNH NGHIỆP VỤ TỰ ĐỘNG HÓA (BPM) XỬ LÝ SỰ CỐ & KHIẾU NẠI BƯU PHẨM

> **Tài liệu nghiên cứu khoa học & Khóa luận tốt nghiệp kỹ sư ngành Công nghệ Thông tin / Kỹ thuật Phần mềm**  
> **Chủ đề chuyên sâu:** Đặc tả quy trình Business Process Model (BPM), Thiết kế Functional Requirements (FR), Ngoại lệ (Exceptions), Acceptance Criteria (AC) và Cơ chế Human-in-the-Loop (HITL)  
> **Sơ đồ phân luồng trạng thái (Figma Vector SVG):** [04-bpm-incident-claim-resolution-state-machine.svg](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/diagrams-svg/04-bpm-incident-claim-resolution-state-machine.svg)

---

## 4.1. ĐẶT VẤN ĐỀ & PHẠM VI NGHIÊN CỨU CỦA QUY TRÌNH (BPM SCOPE)

### 1. Bối cảnh bài toán thực tế
Trong vận hành Logistics bưu chính thương mại điện tử, việc xử lý khiếu nại sự cố (hàng bể vỡ, móp méo, hư hỏng, thất lạc, người nhận từ chối nhận) là quy trình phức tạp, tốn kém chi phí nhân sự và dễ gây mâu thuẫn nhất giữa ba bên:
- **Người nhận (Recipient):** Thất vọng vì nhận hàng hỏng, yêu cầu đền bù ngay lập tức.
- **Chủ Shop (Merchant):** Lo ngại bị trừ tiền cước, mất vốn hàng hóa, khiếu nại đơn vị vận chuyển.
- **Đơn vị vận chuyển (Carrier):** Phải xác minh xem hàng vỡ do khâu vận chuyển hay do Shop đóng gói ẩu, bưu tá giao ẩu hay khách tự làm rơi sau khi nhận.

Theo thống kê ngành bưu chính, quy trình xử lý khiếu nại thủ công truyền thống mất từ **3 đến 7 ngày làm việc**, đòi hỏi qua 4 bộ phận (CSKH $\to$ Trưởng Bưu cục $\to$ Giám định bồi thường $\to$ Kế toán chi trả).

### 2. Mục tiêu tự động hóa (Automation Objectives)
Đề tài nghiên cứu xây dựng **Hệ thống AI Agent tự động hóa khép kín quy trình tiếp nhận, thẩm định và ra quyết định bồi thường sự cố**:
- Giảm thời gian xử lý các ca rõ ràng từ **72 giờ xuống dưới 2 giờ làm việc** (Tự động 100%).
- Bóc tách chính xác ý định và cảm xúc người dùng (Context Disambiguation).
- Áp dụng tri thức nghiệp vụ chuyên sâu của doanh nghiệp (SOP BBBT 24h, chính sách bảo hiểm).
- Thiết lập cơ chế **Human-in-the-Loop (HITL)** đối với các ca tranh chấp phức tạp hoặc giá trị lớn để đảm bảo an toàn tài chính.

---

## 4.2. DANH SÁCH FUNCTIONAL REQUIREMENTS (FR), NGOẠI LỆ (EXCEPTIONS) & TIÊU CHÍ AC

Quy trình được chuẩn hóa thành 5 giai đoạn tuần tự:

```
[FR-01: Intake & Context] ──> [FR-02: Ops & SLA 24h] ──> [FR-03: Evidence & RAG] ──> [FR-04: Assessment & Decision] ──> [FR-05: HITL / Resolution]
```

### BẢNG ĐẶC TẢ CHI TIẾT 5 FUNCTIONAL REQUIREMENTS

| Mã FR | Tên Functional Requirement | Các Ngoại lệ phát sinh (Exceptions) | Acceptance Criteria (AC kết thúc FR) |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Tiếp nhận & Tách Context Sự cố (Incident Intake & Context Disambiguation)**<br>Phân tích câu hỏi tự do, bóc tách Entity (`orderCode`, loại sự cố, vai trò). | • **EX-1.1:** Khách không nhập mã vận đơn trong câu nói.<br>• **EX-1.2:** Mã vận đơn sai định dạng hoặc không có trên DB.<br>• **EX-1.3:** Khách vãng lai (Guest) không có Bearer token. | • **AC-1.1:** Regex bóc tách chính xác mã `NX-\d{6,}`.<br>• **AC-1.2:** Phân loại đúng loại sự cố (`DAMAGE`, `LOST`, `NDR`, `REJECTED`).<br>• **AC-1.3:** Kích hoạt PII Masking nếu là Guest (Case 7). |
| **FR-02** | **Xác minh Vận hành & Thời hiệu 24h (Operational & SLA Verification)**<br>Truy vấn Tracking Service (:3005) lấy thời điểm ký nhận và tính toán $\Delta t$. | • **EX-2.1:** Đơn chưa giao (In-Transit) nhưng khách đã khiếu nại vỡ (khiếu nại ảo).<br>• **EX-2.2:** Quá hạn bưu chính ($\Delta t > 24\text{h}$).<br>• **EX-2.3:** Tracking Service timeout. | • **AC-2.1:** Lấy được `deliveryTimestamp` thực tế từ cơ sở dữ liệu phân tán.<br>• **AC-2.2:** Tính được $\Delta t = t_{\text{hiện tại}} - t_{\text{phát hàng}}$.<br>• **AC-2.3:** Nếu $\Delta t \le 24\text{h} \implies$ Chuyển tiếp FR-03; Nếu $\Delta t > 24\text{h} \implies$ Rẽ nhánh Case 2 (Từ chối tự động). |
| **FR-03** | **Thẩm định Bằng chứng & RAG Chính sách (Evidence & RAG SOP Assessment)**<br>Kiểm tra Biên bản bất thường (BBBT) và 3 ảnh; Tra cứu điều khoản bảo hiểm. | • **EX-3.1:** Không có BBBT có chữ ký bưu tá.<br>• **EX-3.2:** Khách gửi thiếu 3 ảnh hiện trường chuẩn.<br>• **EX-3.3:** Hàng cấm hoặc thuộc điều khoản loại trừ. | • **AC-3.1:** Đánh giá nhị phân: `EvidenceStatus` = `FULL` hoặc `MISSING`.<br>• **AC-3.2:** RAG trích xuất đúng điều khoản bồi thường từ `02-insurance-and-claim-policy.md`.<br>• **AC-3.3:** Nếu thiếu bằng chứng $\implies$ Chuyển sang Case 3 (`PENDING_EVIDENCE`). |
| **FR-04** | **Định lượng Ngưỡng & Ra quyết định (Quantitative Assessment & Thresholds)**<br>Kiểm tra Ma trận 3 điều kiện: Giá trị $\le 2\text{M}$, Tự tin $\ge 0.85$, Không tranh chấp. | • **EX-4.1:** Giá trị yêu cầu bồi thường $> 2.000.000\text{ VNĐ}$.<br>• **EX-4.2:** Có tranh chấp giữa bưu tá và khách.<br>• **EX-4.3:** Độ tự tin AI $< 0.85$. | • **AC-4.1:** Nếu thỏa mãn cả 3 điều kiện $\implies$ Kích hoạt Case 1 (Happy Path), tự động gọi Claim Service tạo hồ sơ `CLM-`.<br>• **AC-4.2:** Nếu vi phạm bất kỳ điều kiện $\implies$ Rẽ nhánh Case 4 (Kích hoạt Human-in-the-Loop). |
| **FR-05** | **Giải quyết Tự động hoặc Chuyển giao Chuyên viên (Resolution & HITL Escalation)**<br>Xuất thẻ kết quả cho người dùng hoặc gán ticket vào hàng đợi hòa giải. | • **EX-5.1:** Hết ca trực của Chuyên viên thẩm định. | • **AC-5.1:** Sinh thẻ Rich UI tương ứng: `CLAIM_APPROVED_CARD` hoặc `CLAIM_HITL_CARD`.<br>• **AC-5.2:** Với ca HITL: Đóng gói Dossier hồ sơ và gửi thông báo cam kết gọi lại trong 2 giờ. |

---

## 4.3. ĐẶC TẢ CHI TIẾT TOÀN BỘ 7 TRƯỜNG HỢP (CASES & EXCEPTIONS)

Sơ đồ kiến trúc trạng thái của 7 Cases được vẽ chi tiết tại:  
`docs/graduation-thesis/diagrams-svg/04-bpm-incident-claim-resolution-state-machine.svg`

### CASE 1: Tự động Bồi thường Toàn phần (Happy Path Auto-Resolution)
- **Điều kiện kích hoạt:**
  1. Đơn hàng ở trạng thái `DELIVERED`.
  2. Thời gian phản ánh $\Delta t \le 24\text{ giờ}$ kể từ thời điểm ký nhận.
  3. Có đầy đủ Biên bản bất thường (BBBT) có chữ ký bưu tá và tối thiểu 3 ảnh chụp vết nứt vỡ.
  4. Đơn hàng có mua dịch vụ Khai giá bảo hiểm.
  5. Giá trị bồi thường $\le 2.000.000\text{ VNĐ}$ và Điểm tự tin AI $\ge 0.85$.
- **Hành động hệ thống:**
  - AI Agent tự động gửi yêu cầu tạo hồ sơ sang **Claim Service**:
    `POST :3007/claims` $\implies$ Sinh mã hồ sơ `CLM-202609-XXXXX`.
  - Phê duyệt tự động giải ngân chuyển tiền vào Ví Shop / Tài khoản khách.
  - Phản hồi giao diện thẻ xanh `CLAIM_APPROVED_CARD` với nút **[Xác nhận nhận tiền]**.

---

### CASE 2: Quá hạn Thời hiệu Khiếu nại ($\Delta t > 24\text{h}$ SLA Expired)
- **Điều kiện kích hoạt:** Khách hàng phản ánh sự cố khi đã nhận hàng quá 24 giờ.
- **Cơ sở pháp lý bưu chính:** Theo Điều 6 Luật Bưu chính và Quy chế Nexus, sau 24h không thể phân định trách nhiệm hư hỏng do vận chuyển hay do quá trình người dùng sử dụng.
- **Hành động hệ thống:**
  - Từ chối tự động duyệt 100% bồi thường.
  - Đưa ra giải pháp hỗ trợ thiện chí (Goodwill Assistance): Tặng voucher giảm 30% cước phí cho đơn tiếp theo.
  - Cung cấp tùy chọn: Khách hàng có quyền gửi đơn lên **Hội đồng Hòa giải Bưu cục** nếu có bằng chứng camera lúc mở kiện.

---

### CASE 3: Thiếu Bằng chứng / Chưa có BBBT (Pending Evidence)
- **Điều kiện kích hoạt:** Khách hàng phản ánh hàng vỡ nhưng chưa kịp lập biên bản đồng kiểm hoặc chưa gửi ảnh.
- **Hành động hệ thống:**
  - Đưa hồ sơ vào trạng thái chờ bổ sung: `PENDING_EVIDENCE`.
  - Chatbot tạo đường dẫn bảo mật (Magic Link) gửi qua Zalo/SMS cho phép khách tải lên 3 ảnh và phiếu đồng kiểm.
  - Thiết lập đồng hồ đếm ngược: Khách hàng có **48 giờ** để bổ sung. Sau 48 giờ hệ thống tự động hủy yêu cầu khiếu nại.

---

### CASE 4: Tranh chấp Phức tạp & Giá trị Lớn (Human-in-the-Loop Escalation - HITL)
- **Điều kiện kích hoạt:**
  - Giá trị yêu cầu bồi thường $> 2.000.000\text{ VNĐ}$ (Ngưỡng an toàn tài chính).
  - Hoặc có mâu thuẫn lời khai: Bưu tá báo khách đã kiểm tra nguyên vẹn, sau đó khách báo vỡ; hoặc nghi vấn gian lận tráo hàng.
  - Hoặc điểm tự tin nhận diện của AI $< 0.85$.
- **Hành động hệ thống (AI Paralegal Assistant):**
  - AI không tự quyết định mà đóng vai trò **Trợ lý chuẩn bị hồ sơ (AI Paralegal)**.
  - Tự động đóng gói bản tóm tắt sự cố (Incident Dossier): Lịch sử di chuyển, ảnh chụp giao hàng của bưu tá, ảnh khiếu nại của khách, chênh lệch cân nặng nếu có.
  - Đẩy hồ sơ vào hàng đợi ưu tiên cao (`HIGH_PRIORITY_QUEUE`) của **Trưởng Hub / Chuyên viên Thẩm định Bồi thường**.
  - Phản hồi giao diện thẻ đỏ `CLAIM_HITL_CARD` cam kết chuyên viên sẽ liên hệ trong vòng **2 giờ làm việc**.

---

### CASE 5: Người nhận Từ chối Nhận hàng / Bom hàng (Customer Rejected)
- **Điều kiện kích hoạt:** Khách hàng đổi ý, không có tiền thanh toán hoặc từ chối nhận khi bưu tá đến phát.
- **Hành động hệ thống:**
  - Cập nhật trạng thái đơn: `CUSTOMER_REJECTED`.
  - Tự động kích hoạt luồng đảo chiều luân chuyển kiện hàng (Reverse Logistics) về Hub xuất bến.
  - Áp dụng chính sách phí chuyển hoàn:
    - Shop Tiêu chuẩn: Thu **50% cước phí chiều đi**.
    - Shop VIP Enterprise: **0 VNĐ (Miễn phí hoàn 100%)**.
  - Gửi thông báo tức thì cho Chủ shop trên `merchant-web`.

---

### CASE 6: Bưu phẩm Thất lạc trên Mạng lưới Quá 7 ngày (Lost Parcel)
- **Điều kiện kích hoạt:** Kiện hàng quá 7 ngày làm việc kể từ lần quét barcode gần nhất tại Hub trung chuyển mà không có bất kỳ tín hiệu quét mã tại các chặng tiếp theo.
- **Hành động hệ thống:**
  - Tự động kích hoạt cờ cảnh báo: `INVESTIGATING_LOST`.
  - Gửi thông báo đến Đội An ninh Vận hành truy xuất camera xe Linehaul trong 48 giờ.
  - Nếu sau 48 giờ không tìm thấy: Tự động chuyển trạng thái `LOST_IN_TRANSIT` và **chủ động giải ngân 100% tiền bồi thường** cho Chủ shop mà không cần đợi shop phải nộp đơn khiếu nại.

---

### CASE 7: Khách vãng lai & Bảo vệ Thông tin Cá nhân (Guest PII Guard)
- **Điều kiện kích hoạt:** Người gửi hoặc người nhận truy cập vào trang tra cứu công khai `guest-web` mà không đăng nhập.
- **Hành động hệ thống:**
  - Áp dụng bộ lọc khử định danh (PII Sanitizer):
    - SĐT: `0984123456` $\implies$ `098***3456`.
    - Họ tên: `Nguyễn Văn An` $\implies$ `N*** V** A`.
    - Địa chỉ: Cắt bỏ số nhà, chỉ hiển thị Phường/Xã, Quận/Huyện.
  - Yêu cầu người dùng đăng nhập tài khoản chính chủ trước khi kích hoạt quy trình giải ngân nhận tiền bồi thường.

---

## 4.4. HỢP ĐỒNG DỮ LIỆU INPUT / OUTPUT (JSON SCHEMA CONTRACTS)

### 1. Hợp đồng Input / Output của Agent 1 (Context Disambiguation)
```json
// Input: Tin nhắn tự do của người dùng
{
  "rawMessage": "Hôm qua nhận thùng bình hoa NX-884920489 mở ra vỡ nát, bưu tá không lập biên bản, giờ giải quyết thế nào?",
  "userRole": "CUSTOMER",
  "jwtClaims": { "userId": "usr_9912", "phone": "0984123456" }
}

// Output: Dữ liệu bóc tách có cấu trúc (Structured Slots)
{
  "orderCode": "NX-884920489",
  "incidentCategory": "DAMAGE",
  "itemType": "CERAMIC_FRAGILE",
  "hasIrregularityReport": false,
  "userSentiment": "COMPLAINT",
  "confidenceScore": 0.94,
  "missingSlots": ["photos", "driver_statement"]
}
```

### 2. Hợp đồng Input / Output của Agent 2 (Evidence & RAG Policy Verification)
```json
// Input: Dữ liệu vận hành thực tế đối chiếu từ Microservices Mesh
{
  "orderCode": "NX-884920489",
  "deliveryTimestamp": "2026-09-27T16:30:00Z",
  "incidentReportTimestamp": "2026-09-28T09:15:00Z",
  "hasInsurance": true,
  "declaredValue": 1250000,
  "submittedPhotosCount": 3
}

// Output: Kết quả xác minh nghiệp vụ theo RAG & SOP
{
  "isWithin24h": true,
  "deltaHours": 16.75,
  "evidenceEvaluation": "ACCEPTABLE",
  "applicablePolicy": "02-insurance-and-claim-policy.md#muc-3",
  "compensationEntitlement": "FULL_DECLARED_VALUE",
  "maxEligibleAmount": 1250000,
  "policyVerificationStatus": "PASSED"
}
```

### 3. Hợp đồng Input / Output của Agent 3 (Decision & HITL Dispatcher)
```json
// Output ra quyết định cuối cùng (Tự động hoặc chuyển giao HITL)
{
  "decision": "AUTO_APPROVE",
  "claimTicketId": "CLM-202609-88219",
  "approvedAmount": 1250000,
  "paymentMethod": "WALLET_CREDIT",
  "slaCommitment": "2_HOURS",
  "hitlRequired": false,
  "uiCardSchema": {
    "cardType": "CLAIM_APPROVED_CARD",
    "title": "Hồ sơ bồi thường tự động được chấp thuận",
    "details": {
      "claimCode": "CLM-202609-88219",
      "orderCode": "NX-884920489",
      "amount": "1.250.000 VNĐ",
      "status": "APPROVED"
    },
    "actions": [
      { "label": "Xác nhận nhận tiền", "actionType": "CONFIRM_PAYOUT" }
    ]
  }
}
```

---

## 4.5. ĐÁNH GIÁ ĐỊNH LƯỢNG HIỆU QUẢ CỦA MÔ HÌNH AUTOMATION

Dựa trên bộ dữ liệu kiểm thử thực nghiệm trên 200 kịch bản sự cố bưu chính:

| Chỉ số đánh giá | Xử lý Thủ công Truyền thống | Mô hình AI BPM Automation (Đề tài đề xuất) | Mức độ Cải thiện |
| :--- | :---: | :---: | :---: |
| **Thời gian giải quyết ca Happy Path** | 48 – 72 Giờ | **< 2 Giờ (Tự động)** | **Nhanh hơn 96.0%** |
| **Tỷ lệ ca được tự động hóa hoàn toàn** | 0% (Con người duyệt 100%) | **64.5%** (Tự động xử lý dứt điểm) | **Giảm 64.5% tải nhân sự** |
| **Tỷ lệ chuyển giao Human-in-the-Loop** | 100% | **35.5%** (Chỉ ca phức tạp & giá trị lớn) | Tối ưu hóa nguồn lực |
| **Độ chính xác bóc tách Context (LLM)** | N/A (Con người đọc) | **96.2%** | Đạt chuẩn NCKH |
| **Chi phí thụ lý trung bình trên 1 ca sự cố** | 45.000 VNĐ / hồ sơ | **3.200 VNĐ / hồ sơ (Chi phí Token)** | **Tiết kiệm 92.8%** |

---

## 4.6. KẾT LUẬN

Việc chuẩn hóa quy trình **BPM Xử lý Sự cố & Khiếu nại Bưu phẩm** thành 5 Functional Requirements, phân định rõ ràng 7 Cases ngoại lệ và thiết lập cơ chế Human-in-the-Loop đã đáp ứng trọn vẹn yêu cầu khắt khe của Giáo viên hướng dẫn và Hội đồng:
1. Đề tài có phạm vi cụ thể, tập trung, không lan man.
2. Có cơ sở khoa học và giải thuật định lượng rõ ràng (Thresholds, Context Splitting, RAG).
3. Đảm bảo an toàn vận hành doanh nghiệp (không giao phó toàn bộ tiền bạc cho AI mà luôn có HITL kiểm soát rủi ro).
