# TỔNG HÀNH DINH HỒ SƠ KHÓA LUẬN TỐT NGHIỆP: HỆ THỐNG TRỢ LÝ AI LOGISTICS ĐA KÊNH

> **Chuyên ngành:** Kỹ thuật Phần mềm / Công nghệ Thông tin  
> **Đề tài:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus (Nexus Logistics Management System)  
> **Module nghiên cứu trọng tâm:** Trợ lý ảo AI thông minh tích hợp Kiến trúc Microservices & RAG Hybrid Retrieval  
> **Quy hoạch thiết kế:** Tối ưu hóa 100% cho **Figma Starter / Free Plan (3 Pages giới hạn)**, phân chia theo **Figma Sections (`Shift + S`)**  
> **Phong cách đồ họa kỹ thuật:** **Monochrome Blueprint (Đen - Trắng đơn sắc)** - Tuyệt đối không màu mè AI hóa, đảm bảo chuẩn mực in ấn A4/A3 sắc nét và bảo vệ tự tin trước Hội đồng chấm thi.

---

## 1. BẢN ĐỒ TỔNG THỂ 3 TRANG FIGMA (FIGMA 3-PAGE ARCHITECTURE MAP)

Hệ thống được quy hoạch tinh gọn thành đúng **3 Trang độc lập** trên Figma, mỗi trang sử dụng các **Sections (`Shift + S`)** để phân định ranh giới nghiệp vụ:

```
                     ┌─────────────────────────────────────────────────────────────────┐
                     │          HỆ THỐNG THIẾT KẾ ĐỒ ÁN NEXUS LOGISTICS (FIGMA)        │
                     └────────────────────────────────┬────────────────────────────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         │                                            │                                            │
         ▼                                            ▼                                            ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│  🏛️ FIGMA PAGE 1: SYSTEM & DATA │      │  ⚙️ FIGMA PAGE 2: AUTOMATION   │      │  🎨 FIGMA PAGE 3: UI & DEFENSE  │
├─────────────────────────────────┤      ├─────────────────────────────────┤      ├─────────────────────────────────┤
│ • Section 1.1: Use Case Diagram │      │ • Section 2.1: BPMN 2.0 Sự cố   │      │ • Section 3.1: Rich Card Library│
│ • Section 1.2: Kiến trúc 4 tầng │      │ • Section 2.2: Ma trận 5 Kịch bản│     │ • Section 3.2: Khung Slide 16:9 │
│ • Section 1.3: ERD & Luồng tiền │      │ • Section 2.3: Pipeline RAG AI  │      │ • Kịch bản 15p & 10 câu hỏi vặn │
└─────────────────────────────────┘      └─────────────────────────────────┘      └─────────────────────────────────┘
```

---

## 2. BẢNG TRA CỨU CHÉO TÀI LIỆU & SƠ ĐỒ VECTOR (CROSS-REFERENCE MATRIX)

| STT | Phân vùng Figma Page | Mã Sơ đồ Vector SVG | File Thuyết minh Khóa luận tương ứng | Vai trò trong Đồ án tốt nghiệp |
| :---: | :--- | :--- | :--- | :--- |
| **P1.1** | **Page 1: System & Data** | [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg) | [Đặc tả Use Case Chuẩn BA](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/02-dac-ta-use-case-he-thong-chuan-ba.md) & [Kiến trúc CSDL](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/01-tong-quan-kien-truc-va-co-so-du-lieu.md) | Phân rã 35 Use Cases, 6 Actors, 6 Packages & Ma trận RBAC |
| **P1.2** | **Page 1: System & Data** | [`02-architecture-deployment-4-tier.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg) | [Chương 1: Kiến trúc & Dữ liệu](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/01-tong-quan-kien-truc-va-co-so-du-lieu.md) | Phân tầng Clients, Gateway, AI Orchestrator, Mesh & RAG |
| **P1.3** | **Page 1: System & Data** | [`03-erd-data-model-and-money-flow.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/03-erd-data-model-and-money-flow.svg) | [Chương 1: Kiến trúc & Dữ liệu](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/01-tong-quan-kien-truc-va-co-so-du-lieu.md) | Mô hình thực thể Crow's Foot & Luồng tiền COD / Bồi thường |
| **P2.1** | **Page 2: Automation & RAG** | [`01-bpmn-incident-claim-resolution.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/01-bpmn-incident-claim-resolution.svg) | [Chương 4: Đặc tả BPM Sự cố](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/specs/01-dac-ta-bpm-tu-dong-hoa-khieu-nai-su-co.md) | **Quy trình trọng tâm NCKH:** 4 Làn bơi, BBBT 24h & HITL |
| **P2.2** | **Page 2: Automation & RAG** | [`02-sequence-and-decision-matrix.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/02-sequence-and-decision-matrix.svg) | [Chương 3: 5 Kịch bản & PII](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/01-phan-tich-cac-kich-ban-nghiep-vu-va-an-toan-pii.md) | Ma trận phân luồng quyết định 5 Ca nghiệp vụ thực tế |
| **P2.3** | **Page 2: Automation & RAG** | [`03-rag-chunking-and-vectorization.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-chunking-and-vectorization.svg) | [Chương 2: Giải thuật RAG](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/specs/02-ly-thuyet-va-giai-thuat-chunking-rag.md) | Thuật toán Semantic Splitting, Overlap 16% & Hybrid Score |
| **P3.1** | **Page 3: UI & Defense** | [`01-rich-card-component-library.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/diagrams/01-rich-card-component-library.svg) | [Chương 5: Đặc tả Rich Cards](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/02-dac-ta-rich-card-ui-ux.md) | Thư viện Design System 5 Thẻ Tương tác trực quan |
| **P3.2** | **Page 3: UI & Defense** | [`02-slide-deck-16-9-templates.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/diagrams/02-slide-deck-16-9-templates.svg) | [Cẩm nang Kịch bản Bảo vệ](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/03-kich-ban-thuyet-trinh-bao-ve-hoi-dong.md) | Bộ 4 Slide 16:9 + Kịch bản 15 phút & 10 câu hỏi vặn |

---

## 3. CẤU TRÚC THƯ MỤC CHUẨN ĐÃ QUY HOẠCH

```
docs/graduation-thesis/
├── README.md                                                  # File này (Master Directory & Index)
│
├── figma-page-1-system-and-data/                             # 🏛️ PAGE 1: SYSTEM & DATA BLUEPRINT
│   ├── README.md                                             # Hướng dẫn setup Sections 1.1, 1.2, 1.3 trên Figma
│   ├── diagrams/
│   │   ├── 01-use-case-general-system.svg                    # Section 1.1: UML Use Case 5 Actors
│   │   ├── 02-architecture-deployment-4-tier.svg             # Section 1.2: Kiến trúc 4 tầng & Security
│   │   └── 03-erd-data-model-and-money-flow.svg              # Section 1.3: ERD & Luồng tiền quyết toán
│   └── specs/
│       └── 01-tong-quan-kien-truc-va-co-so-du-lieu.md        # Thuyết minh Chương 1
│
├── figma-page-2-process-and-ai-pipeline/                     # ⚙️ PAGE 2: PROCESS AUTOMATION & RAG
│   ├── README.md                                             # Hướng dẫn setup Sections 2.1, 2.2, 2.3 trên Figma
│   ├── diagrams/
│   │   ├── 01-bpmn-incident-claim-resolution.svg             # Section 2.1: BPMN 2.0 Sự cố & 7 States FSM
│   │   ├── 02-sequence-and-decision-matrix.svg               # Section 2.2: Ma trận quyết định 5 Ca thực tế
│   │   └── 03-rag-chunking-and-vectorization.svg             # Section 2.3: Pipeline 5 giai đoạn RAG AI
│   └── specs/
│       ├── 01-dac-ta-bpm-tu-dong-hoa-khieu-nai-su-co.md      # Thuyết minh Chương 4 (Trọng tâm NCKH)
│       └── 02-ly-thuyet-va-giai-thuat-chunking-rag.md        # Thuyết minh Chương 2 (Toán & Thuật toán)
│
└── figma-page-3-ui-and-defense/                              # 🎨 PAGE 3: UI/UX & THESIS DEFENSE
    ├── README.md                                             # Hướng dẫn setup Sections 3.1, 3.2 & Presentation Mode
    ├── diagrams/
    │   ├── 01-rich-card-component-library.svg                # Section 3.1: Thư viện Thẻ Tương tác Trực quan
    │   └── 02-slide-deck-16-9-templates.svg                  # Section 3.2: Bộ 4 Slide 16:9 thuyết trình
    └── specs/
        ├── 01-phan-tich-cac-kich-ban-nghiep-vu-va-an-toan-pii.md # Thuyết minh Chương 3
        ├── 02-dac-ta-rich-card-ui-ux.md                      # Thuyết minh Chương 5 (Giao diện & Data Contract)
        └── 03-kich-ban-thuyet-trinh-bao-ve-hoi-dong.md       # Cẩm nang Kịch bản bảo vệ 15 phút & 10 câu hỏi vặn
```

---

## 4. HƯỚNG DẪN IMPORT VÀO FIGMA NHANH NHẤT (QUICK START)

1. Mở file thiết kế của bạn trên Figma.
2. Tạo 3 Pages tương ứng:
   - `🏛️ 01_SYSTEM_AND_DATA_BLUEPRINT`
   - `⚙️ 02_PROCESS_AUTOMATION_AND_RAG`
   - `🎨 03_UI_UX_AND_THESIS_DEFENSE`
3. Mở từng thư mục `figma-page-X-.../README.md` để xem tọa độ và tên các Section (`Shift + S`).
4. Kéo các file SVG trong thư mục `diagrams/` tương ứng thả vào các Section. Toàn bộ sơ đồ đã được tính toán đầu mũi tên tuyệt đối (`<polygon>`), đảm bảo không bị đè chữ, không bị vỡ layout khi phóng to thu nhỏ.
5. In ấn ra tài liệu thuyết minh A4/A3 hoặc mở chế độ Presentation (`Cmd + Opt + Enter`) để bắt đầu buổi bảo vệ khóa luận thành công rực rỡ!
