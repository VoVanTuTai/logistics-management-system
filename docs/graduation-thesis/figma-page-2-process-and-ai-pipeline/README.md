# HƯỚNG DẪN THIẾT KẾ FIGMA - PAGE 2: PROCESS AUTOMATION & RAG

> **Tên Trang trên Figma:** `⚙️ 02_PROCESS_AUTOMATION_AND_RAG`  
> **Gói tài khoản áp dụng:** Figma Starter / Free Tier (Giới hạn tối đa 3 Pages)  
> **Phong cách đồ họa:** Bản vẽ kỹ thuật đơn sắc (Monochrome Technical Blueprint) - Tối ưu cho in ấn tài liệu thuyết minh A4/A3 và bảo vệ trước Hội đồng chấm thi.

---

## 1. CẤU TRÚC PHÂN VÙNG BẰNG FIGMA SECTIONS (`Shift + S`)

Trên trang Figma thứ 2, bạn hãy tạo **3 Sections lớn** để biểu diễn toàn bộ chiều sâu giải thuật và logic quy trình nghiệp vụ:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ⚙️ FIGMA PAGE 2: PROCESS AUTOMATION & RAG                             │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────┤
│   SECTION 2.1 (Shift + S)     │     SECTION 2.2 (Shift + S)     │        SECTION 2.3 (Shift + S)        │
│   BPMN 2.0 SWIMLANES WORKFLOW │     DECISION & INTENT MATRIX    │        RAG CHUNKING & VECTOR PIPELINE │
│                               │                                 │                                       │
│   [01-bpmn-incident-claim-    │     [02-sequence-and-decision-  │        [03-rag-chunking-and-          │
│    resolution.svg]            │      matrix.svg]                │         vectorization.svg]            │
│                               │                                 │                                       │
│   • 4 Làn bơi (4 Swimlanes)   │     • Ma trận 5 hàng ngang      │        • Giải thuật Semantic Splitting│
│   • Cổng kiểm soát 24h & 500k │     • Tương ứng 1-1 từ Intent   │        • Cửa sổ Overlap 16% (40 từ)   │
│   • 7 Trạng thái FSM & HITL   │       sang Logic & Thẻ Rich Card│        • Hybrid Cosine + BM25 Score   │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. DANH MỤC SƠ ĐỒ VECTOR SVG (IMPORT VÀO FIGMA)

Toàn bộ sơ đồ vector SVG được lưu trữ tại thư mục:  
`docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/`

| STT | Tên tệp vector SVG | Tên Section tương ứng trên Figma | Kích thước đề xuất | Mô tả kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| **01** | `01-bpmn-incident-claim-resolution.svg` | **Section 2.1: BPMN 2.0 Workflow** | $1920 \times 1280\text{ px}$ | Quy trình chuẩn BPMN 2.0 với 4 làn bơi (Customer/Recipient, AI Chatbot Orchestrator, Ops/Carrier Coordinator, Admin Manager). Thể hiện đầy đủ điều kiện lập Biên bản bất thường BBBT trong 24 giờ, máy trạng thái 7 bước và Human-in-the-Loop (HITL). |
| **02** | `02-sequence-and-decision-matrix.svg` | **Section 2.2: Decision Matrix** | $1920 \times 1280\text{ px}$ | Ma trận song song 5 trường hợp nghiệp vụ bưu chính thực tế: Tra cứu đơn xác định, Xử lý câu hỏi mập mờ, Che chắn dữ liệu PII, Khiếu nại bể vỡ bưu gửi và Dự toán cước theo chuẩn IATA Cargo. |
| **03** | `03-rag-chunking-and-vectorization.svg` | **Section 2.3: RAG AI Pipeline** | $1920 \times 1280\text{ px}$ | Đường ống xử lý giải thuật RAG 5 giai đoạn: AST Markdown Parsing, Semantic Chunking (Overlap 16%), Vectorization 768-D, Hybrid Similarity Search và Dynamic Prompt Enrichment. |

---

## 3. QUY TRÌNH IMPORT VÀ SẮP XẾP CHUẨN TRÊN FIGMA

1. **Bước 1: Tạo mới Page trên Figma**
   - Click nút `+` ở thanh danh sách Pages bên trái màn hình.
   - Đổi tên thành: `⚙️ 02_PROCESS_AUTOMATION_AND_RAG`.
2. **Bước 2: Tạo các Section (`Shift + S`)**
   - Nhấn phím tắt `Shift + S`, vẽ 3 Section lần lượt đặt tên:
     - `Section 2.1: BPMN 2.0 Incident & Claim Workflow` (X: `0`, Y: `0`, W: `2000`, H: `1360`).
     - `Section 2.2: Decision Matrix & 5-Case Workflow` (X: `2200`, Y: `0`, W: `2000`, H: `1360`).
     - `Section 2.3: RAG Semantic Chunking & Vector Pipeline` (X: `4400`, Y: `0`, W: `2000`, H: `1360`).
3. **Bước 3: Kéo thả các file SVG vào từng Section**
   - Kéo file `01-bpmn-incident-claim-resolution.svg` thả vào `Section 2.1`.
   - Kéo file `02-sequence-and-decision-matrix.svg` thả vào `Section 2.2`.
   - Kéo file `03-rag-chunking-and-vectorization.svg` thả vào `Section 2.3`.
4. **Bước 4: Kiểm tra khả năng hiển thị**
   - Đảm bảo các mũi tên chỉ hướng 90° không đè lên các khối văn bản điều kiện (Gateways).

---

## 4. TÀI LIỆU THUYẾT MINH KỸ THUẬT KÈM THEO
- Chi tiết đặc tả thuyết minh phục vụ việc viết sách Khóa luận tốt nghiệp được lưu trữ tại:
  - [Chương 4: Đặc tả BPM Tự động hóa Khiếu nại Sự cố](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/specs/01-dac-ta-bpm-tu-dong-hoa-khieu-nai-su-co.md)
  - [Chương 2: Cơ sở Lý thuyết & Giải thuật Phân đoạn RAG](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/specs/02-ly-thuyet-va-giai-thuat-chunking-rag.md)
