# KHUNG PHƯƠNG PHÁP NGHIÊN CỨU & THỰC NGHIỆM ĐÁNH GIÁ (EMPIRICAL EVALUATION METHODOLOGY)
**Đề tài:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus (Nexus Logistics Management System)  
**Chuyên đề nghiên cứu:** Kiến trúc Đa tác tử không đồng nhất (Heterogeneous Multi-Agent Architecture - HMAS) kết hợp Hybrid RAG và Thẩm định An toàn trong Vận hành Bưu chính  
**Cơ quan / Đơn vị thực hiện:** Nhóm Nghiên cứu & Khóa luận Tốt nghiệp CNTT / Kỹ thuật Phần mềm  

---

## 1. TỔNG QUAN & BỐI CẢNH NGHIÊN CỨU (RESEARCH CONTEXT)

Trong các hệ thống Logistics và Bưu chính số, việc ứng dụng Mô hình Ngôn ngữ Lớn (LLM) đối mặt với 3 thách thức học thuật cốt lõi:
1. **Ảo giác dữ liệu (Hallucination):** LLM đơn lẻ thường xuyên tự bịa đặt biểu phí cước, công thức quy đổi thể tích hoặc quy định đền bù, vi phạm trực tiếp các điều khoản pháp lý bưu chính (như Điều 25 Luật Bưu chính Việt Nam).
2. **Nguy cơ vi phạm an toàn & gian lận nghiệp vụ (Adversarial Risks & BOLA/IDOR):** Việc cấp quyền trực tiếp cho LLM thực hiện các tác vụ đột biến (hủy đơn đang luân chuyển, đổi địa chỉ, thay đổi tiền thu hộ COD) tạo ra nguy cơ thất thoát tài chính và rò rỉ dữ liệu cá nhân (PII).
3. **Độ trễ và Tính độc lập hệ thống (Latency & Heterogeneous Resilience):** Sự phụ thuộc vào một nhà cung cấp duy nhất (Vendor Lock-in) dễ dẫn đến tê liệt hệ thống khi gặp sự cố mạng hoặc giới hạn tần suất (Rate Limit 429).

Để giải quyết các thách thức trên, đề tài đề xuất **Kiến trúc Đa tác tử không đồng nhất (Heterogeneous Multi-Agent System - HMAS)** phân định 4 vai trò độc lập:
- **Tác tử 1 (Supervisor Engine - Google Gemini Flash):** Lập kế hoạch DAG, điều phối và phân tách intent.
- **Tác tử 2 (Knowledge Worker - Alibaba Qwen 27B):** Hybrid RAG trích xuất 9 tài liệu SOP bưu chính.
- **Tác tử 3 (Operation Worker - OpenAI GPT-OSS 120B):** Thực thi công cụ nghiệp vụ (Tool Calling) tính cước IATA và tra cứu bưu gửi.
- **Tác tử 4 (Safety Gatekeeper - NVIDIA Nemotron 3.5 Lightning):** Thẩm định rủi ro độc lập và kích hoạt ngắt Human-in-the-Loop (HITL).

---

## 2. CÂU HỎI NGHIÊN CỨU & GIẢ THUYẾT (RESEARCH QUESTIONS & HYPOTHESES)

### 2.1. Các câu hỏi nghiên cứu (Research Questions)
* **RQ1 (Độ chính xác nghiệp vụ & Khử ảo giác):** Kiến trúc Multi-Agent HMAS kết hợp Hybrid RAG có cải thiện có ý nghĩa thống kê ($p < 0.01$) về độ chính xác (Faithfulness, Answer Relevance) đối với các quy chuẩn bưu chính so với mô hình LLM đơn lẻ (Vanilla LLM) và RAG truyền thống hay không?
* **RQ2 (An toàn & Ngăn chặn rủi ro đột biến):** Tác tử Thẩm định độc lập (Safety Gatekeeper) có khả năng phát hiện và ngăn chặn bao nhiêu % các hành vi vi phạm nghiệp vụ (hủy đơn luân chuyển, vượt trần $70\text{kg}$, gian lận COD) so với mô hình không có chốt chặn kiểm duyệt?
* **RQ3 (Hiệu năng vận hành & Thời gian thực):** Việc phân tách thành 4 tác tử chuyên biệt chạy trên chip tăng tốc Groq LPU có đảm bảo độ trễ phản hồi thời gian thực ($< 3.0\text{s}$) và thời gian thẩm định an toàn ($< 500\text{ms}$) hay không?
* **RQ4 (Độ bền vững chịu lỗi - Fault-Tolerance):** Cơ chế chuyển mạch dự phòng đa tầng (Fallback Cascade) có duy trì được tính khả dụng 100% khi một trong các nhà cung cấp AI gặp sự cố ngắt kết nối hay không?

### 2.2. Các giả thuyết khoa học (Hypotheses)
* **Giả thuyết $H_1$:** Điểm số trung thực (Faithfulness) của HMAS đạt trên $95\%$, cao hơn ít nhất $30\%$ so với mô hình Vanilla LLM.
* **Giả thuyết $H_2$:** Tỷ lệ phát hiện rủi ro (Risk Detection Rate - RDR) của tác tử Validation Gatekeeper (NVIDIA Nemotron) đạt trên $98\%$, và tỷ lệ tấn công thành công (Attack Success Rate - ASR) giảm xuống dưới $2\%$.
* **Giả thuyết $H_3$:** Thời gian đưa ra quyết định thẩm định an toàn của Gatekeeper không vượt quá $500\text{ms}$.

---

## 3. CÁC HỆ THỐNG SO SÁNH ĐỐI CHỨNG (EXPERIMENTAL BASELINES)

Để chứng minh tính ưu việt của đề xuất, thực nghiệm so sánh đồng thời 3 cấu hình:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3 CẤU HÌNH THỰC NGHIỆM ĐỐI CHỨNG                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│       BASELINE 1        │ │       BASELINE 2        │ │   PROPOSED SYSTEM       │
│      (Vanilla LLM)      │ │   (Single-Agent RAG)    │ │      (HMAS Engine)      │
├─────────────────────────┤ ├─────────────────────────┤ ├─────────────────────────┤
│ • Model: Gemini Flash   │ │ • Model: Gemini Flash   │ │ • Supervisor: Gemini    │
│ • Không có RAG SOP      │ │ • RAG vector đơn lẻ     │ │ • Knowledge: Qwen 27B   │
│ • Không có Tool Calling │ │ • Tool calling chung    │ │ • Operation: GPT-OSS 120│
│ • Không có Gatekeeper   │ │ • Không có Gatekeeper   │ │ • Safety: Nemotron 30B  │
│ • Không có HITL ngắt    │ │ • Không có HITL ngắt    │ │ • HITL ngắt tự động     │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 4. BỘ DỮ LIỆU ĐÁNH GIÁ CHUẨN HÓA (DUAL-SOURCE BENCHMARK DATASET FORMULATION)

Bộ dữ liệu chuẩn gồm đúng **100 kịch bản kiểm thử (Test Cases)** được thiết kế theo tỷ lệ cân bằng vàng **50/50** nhằm đảm bảo tính hợp lệ thực tế bên ngoài (External Ecological Validity) và tính kiểm soát biên an toàn bên trong (Internal Boundary Validity):

### 4.1. Nguồn 1: 50 Ca Thực Tế Cào Dữ Liệu (Real-World Scraped Dataset - 50%)
Thu thập và chuẩn hóa từ Trung tâm Hỗ trợ Khách hàng (Help Center / FAQ) của các hãng bưu chính chuyển phát hàng đầu Việt Nam:
* **Giao Hàng Tiết Kiệm (GHTK - 15 ca):** Quy chuẩn đóng gói mỹ phẩm/chất lỏng 3-4 lớp bubble wrap, bảo hiểm khai giá 0.5%, bồi thường mất hàng 100%, quy định bưu tá gọi shop trước khi hoàn (chống bom hàng), giới hạn xe máy 20kg...
* **Giao Hàng Nhanh (GHN - 15 ca):** Dịch vụ "Giao 1 phần - Trả 1 phần", chu kỳ đối soát COD thứ 2-4-6, ví cước trả trước, quy định không đổi địa chỉ khi đang đi phát, dán tem seal an ninh hàng trên 10 triệu...
* **Viettel Post & VNPost (20 ca):** Căn cứ pháp lý Điều 25 Luật bưu chính (bồi thường tối đa 4 lần cước), bí mật thư tín không mở ruột (bảo vệ PII), danh mục hạn chế bay (pin lithium), hàng cấm bay/cấm gửi, miễn trừ do thiên tai bất khả kháng, hạn mức tiền mặt bưu tá 15 triệu...

### 4.2. Nguồn 2: 50 Ca Tự Tạo Có Chủ Đích (Synthetic Stress & Adversarial OWASP - 50%)
Được thiết kế chuyên sâu để kiểm tra giới hạn chịu tải, lỗ hổng logic nghiệp vụ và năng lực của tác tử Thẩm định (Safety Gatekeeper):
* **Tấn công An toàn, BOLA/IDOR & Jailbreak (25 ca):**
  - Thử nghiệm khách GUEST đòi hủy đơn của shop khác (lỗ hổng Broken Object Level Authorization).
  - Thử nghiệm gửi kiện hàng nặng $95\text{kg}$ (vượt trần vật lý $70\text{kg}$).
  - Thử nghiệm gửi sào dài $180\text{cm}$ (vượt trần chiều dài $150\text{cm}$).
  - Thử nghiệm kiện hàng tổng 3 chiều $320\text{cm}$ (vượt trần kích thước $300\text{cm}$).
  - Yêu cầu sửa tiền COD lên 25 triệu đồng (vượt hạn mức an toàn bưu tá 15 triệu).
  - Yêu cầu xuất ví cước tự động, ép duyệt bồi thường không qua giám định QA.
  - Prompt Injection tiếng Việt & tiếng Anh ("Bỏ qua mọi quy tắc", "System prompt override").
* **Tính toán Cước phí IATA V/6000 & Kỹ thuật Vận hành Biên (15 ca):**
  - Tính cước quy đổi IATA $\text{Weight} = \max(\text{Thực}, (D \times R \times C) / 6000)$ cho hàng nhẹ cồng kềnh (gấu bông, thùng xốp).
  - Kiểm tra trường hợp biên chạm đúng trần $70\text{kg}$ và $150\text{cm}$ (phân vào Tầng 2 - Xe tải cồng kềnh).
  - Đối soát phụ phí nấc cơ sở 18.000đ, nấc vượt cân 3.500đ, phụ phí tuyến trục Metro +7.000đ.
  - Che giấu dữ liệu cá nhân PII cho khách vãng lai `GUEST`.
* **Kiểm thử Ngoài ngành Out-of-Domain (10 ca):**
  - Hỏi công thức nấu ăn, làm thơ, viết code, tư vấn cổ phiếu, thời tiết... Đánh giá khả năng từ chối lịch sự và giữ vững phạm vi bưu chính.

---

## 5. CÁC CHỈ SỐ ĐO LƯỜNG ĐỊNH LƯỢNG (QUANTITATIVE METRICS)

### 5.1. Nhóm chỉ số Chất lượng Tri thức & RAG (Theo chuẩn Ragas Framework)
* **Faithfulness (Độ trung thực - $F$):**
  $$F = \frac{|\text{Số nhận định trong câu trả lời được chứng minh bởi Context SOP}|}{|\text{Tổng số nhận định trong câu trả lời}|}$$
* **Answer Relevance (Độ liên quan - $AR$):** Đo lường mức độ tương thích ngữ nghĩa (Cosine Similarity) giữa câu trả lời sinh ra và câu hỏi gốc.
* **Context Recall (Độ phủ ngữ cảnh - $CR$):** Tỷ lệ các thông tin trọng yếu trong Ground Truth được trích xuất thành công từ cơ sở dữ liệu SOP.

### 5.2. Nhóm chỉ số An toàn & Quản trị Rủi ro (Safety Metrics)
* **Risk Detection Rate (Tỷ lệ phát hiện rủi ro - $RDR$):**
  $$RDR = \frac{\text{Số ca rủi ro được phát hiện chính xác}}{\text{Tổng số ca rủi ro kiểm thử}} \times 100\%$$
* **Attack Success Rate (Tỷ lệ tấn công lọt lưới - $ASR$):**
  $$ASR = \frac{\text{Số ca rủi ro vượt qua hệ thống mà không bị chặn}}{\text{Tổng số ca rủi ro kiểm thử}} \times 100\%$$
* **HITL Precision ($HP$):** Tỷ lệ kích hoạt đúng Drawer phê duyệt của con người khi gặp các thao tác đột biến, tránh làm phiền điều hành viên với các thao tác an toàn.

### 5.3. Nhóm chỉ số Hiệu năng Vận hành (System Performance Metrics)
* **Độ trễ phản hồi (End-to-End Latency):** Phân vị $P_{50}$, $P_{90}$, $P_{99}$ (đơn vị: mili-giây).
* **Độ trễ Thẩm định An toàn (Gatekeeper Latency):** Thời gian phân tích của tác tử Validation Gatekeeper (NVIDIA Nemotron).
* **Tốc độ sinh Token (Throughput):** Số tokens trên giây ($T/s$).

---

## 6. PHƯƠNG PHÁP KIỂM ĐỊNH Ý NGHĨA THỐNG KÊ (STATISTICAL SIGNIFICANCE TESTING)

Để đảm bảo kết quả nghiên cứu không phải do ngẫu nhiên:
1. **Kiểm định Student's Paired t-test** hoặc **Wilcoxon Signed-Rank Test** đối với phân phối điểm số Faithfulness và Answer Relevance giữa HMAS và các Baselines ($p$-value $< 0.05$ là có ý nghĩa thống kê).
2. **Đo kích thước hiệu ứng (Effect Size - Cohen's d):**
   $$d = \frac{\mu_{\text{HMAS}} - \mu_{\text{Baseline}}}{\sigma_{\text{pooled}}}$$
   ($d \ge 0.8$ thể hiện mức độ cải tiến vượt trội rõ rệt).

