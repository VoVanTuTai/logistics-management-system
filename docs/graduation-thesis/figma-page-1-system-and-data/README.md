# HƯỚNG DẪN THIẾT KẾ FIGMA - PAGE 1: SYSTEM & DATA BLUEPRINT

> **Tên Trang trên Figma:** `🏛️ 01_SYSTEM_AND_DATA_BLUEPRINT`  
> **Gói tài khoản áp dụng:** Figma Starter / Free Tier (Giới hạn tối đa 3 Pages)  
> **Phong cách đồ họa:** Bản vẽ kỹ thuật đơn sắc (Monochrome Technical Blueprint) - Tối ưu cho in ấn tài liệu thuyết minh A4/A3 và bảo vệ trước Hội đồng chấm thi.

---

## 1. CẤU TRÚC PHÂN VÙNG BẰNG FIGMA SECTIONS (`Shift + S`)

Trên trang Figma này, bạn hãy tạo **4 Sections lớn** để phân định rõ ràng các tầng kiến trúc, luồng dữ liệu và mô hình AI:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           🏛️ FIGMA PAGE 1: SYSTEM & DATA BLUEPRINT                                     │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────┬──────────────┤
│   SECTION 1.1 (Shift + S)     │     SECTION 1.2 (Shift + S)     │        SECTION 1.3 (Shift + S)        │  SECTION 1.4 │
│   UML USE CASE DIAGRAM        │     5-TIER ARCHITECTURE         │        MICROSERVICES ERD SUITE        │  AI RAG CHAT │
│                               │                                 │                                       │              │
│   [01-use-case-general-       │     [02-architecture-           │        [01..13 Microservices          │  [04-rag-ai- │
│    system.svg]                │      deployment-4-tier.svg]     │         Database ERDs]                │   pipeline]  │
│                               │                                 │                                       │              │
│   • 9 Tác nhân (Actors)       │     • 5 Tầng độc lập            │        • 13 Schema Prisma chuẩn hóa   │  • AST Chunk │
│   • 6 Phân hệ chức năng       │     • Gateway & PII Masking     │        • Quan hệ Crow's Foot          │  • Cosine    │
│   • 53 Use Cases thực tế      │     • 13 Services & RabbitMQ    │        • Chỉ số hiệu năng chuyên sâu  │  • 4 Cases   │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────┴──────────────┘
```

---

## 2. DANH MỤC SƠ ĐỒ VECTOR SVG (IMPORT VÀO FIGMA)

Toàn bộ sơ đồ vector SVG được lưu trữ tại thư mục:  
`docs/graduation-thesis/figma-page-1-system-and-data/diagrams/`

| STT | Tên tệp vector SVG | Tên Section tương ứng trên Figma | Kích thước đề xuất | Mô tả kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| **01** | `01-use-case-general-system.svg` | **Section 1.1: Use Case Diagram** | $3600 \times 2520\text{ px}$ | Chuẩn UML 2.5 với Cây kế thừa Tác nhân 3 tầng (6 Tác nhân cụ thể + 3 Tác nhân trừu tượng), 6 phân hệ lớn cân đối dạng lưới 2 cột x 3 hàng ánh xạ 1:1 codebase thực tế: Đơn hàng, Kho trung chuyển & Giao hàng, Sự cố & Khiếu nại, Tài chính & COD, Truy vết & AI RAG, Quản trị hệ thống (53 Use Cases triển khai thực tế, 2 Generalizations, 11 Include/Extend, 100% không vẽ khống). |
| **02** | `02-architecture-deployment-4-tier.svg` | **Section 1.2: System Architecture** | $3600 \times 3000\text{ px}$ | Kiến trúc triển khai 5 tầng toàn diện chuẩn Enterprise (bố cục siêu thoáng, dãn cách lớn, không nhồi nhét, 100% mũi tên vector inline tương thích hoàn hảo Figma): 4 Client Apps, API Gateway & PII Sanitizer (:3000), 13 Microservices Business Mesh (4 Domain Clusters), Trục Sự kiện RabbitMQ Outbox Saga & 11 Cơ sở dữ liệu phân tán PostgreSQL 16 / Redis Cache. |
| **03** | `erd/` (Bộ 13 tệp SVG độc lập từ `01` đến `13`) | **Section 1.3: Microservices ERD Suite** | $2000 \times 1300\text{ px}$ / file | Mô hình ERD chuẩn kỹ thuật Đen - Trắng (Monochrome Technical Blueprint) cho từng dịch vụ riêng biệt. Ánh xạ chính xác 100% các Model, Trường dữ liệu, Khóa PK/FK/DIST từ schema.prisma thực tế, kèm Panel thuyết minh quy tắc nghiệp vụ, cơ chế Saga phân tán và chỉ số hiệu năng chuyên sâu. |
| **04** | `04-rag-ai-chatbot-pipeline.svg` | **Section 1.4: RAG AI Chatbot Pipeline** | $3600 \times 2600\text{ px}$ | Kiến trúc phân hệ RAG & Điều hướng AI Chatbot Logistics (Nexus AI Assistant) chuẩn học thuật: Phân đoạn Markdown Heading AST & Cửa sổ trượt 250 từ / 40 từ overlap, Tìm kiếm tri thức lai Dense Cosine (0.7) + Mở rộng từ điển Logistics (0.35), Lọc ngưỡng Top-5 Citations, Định tuyến gọi Live Tools (Tra cứu đơn, Tính cước IATA, Hồ sơ bồi thường, Cảnh báo lưu kho Điều 18 & 28, AI Handover tổng đài), Hàng rào bảo mật dữ liệu PII cho khách vãng lai và Ma trận 4 trường hợp Input/Output thực tế kèm giao diện Thẻ đơn hàng. |

---

## 3. QUY TRÌNH IMPORT VÀ SẮP XẾP CHUẨN TRÊN FIGMA

1. **Bước 1: Tạo mới Page trên Figma**
   - Click nút `+` ở thanh danh sách Pages bên trái màn hình Figma.
   - Đổi tên thành: `🏛️ 01_SYSTEM_AND_DATA_BLUEPRINT`.
2. **Bước 2: Tạo các Section (`Shift + S`)**
   - Nhấn phím tắt `Shift + S`, vẽ 4 Section lần lượt đặt tên:
     - `Section 1.1: Enterprise UML Use Case System` (X: `0`, Y: `0`, W: `3680`, H: `2600`).
     - `Section 1.2: Enterprise 5-Tier Architecture` (X: `3800`, Y: `0`, W: `3680`, H: `3100`).
     - `Section 1.3: Microservices Database-per-Service ERD Suite` (X: `7600`, Y: `0`, W: `6500`, H: `4800`).
     - `Section 1.4: AI Chatbot RAG Pipeline & Multi-Turn Lifecycle Architecture` (X: `3800`, Y: `3200`, W: `3680`, H: `2700` - đặt ngay dưới Section 1.2 hoặc bên cạnh Section 1.3).
3. **Bước 3: Kéo thả các file SVG vào từng Section**
   - Kéo file `01-use-case-general-system.svg` thả vào `Section 1.1`.
   - Kéo file `02-architecture-deployment-4-tier.svg` thả vào `Section 1.2`.
   - Kéo toàn bộ 13 file SVG trong thư mục `diagrams/erd/` thả vào `Section 1.3` (xếp theo lưới grid 3 cột x 5 hàng hoặc theo thứ tự phân hệ).
   - Kéo file `04-rag-ai-chatbot-pipeline.svg` thả vào `Section 1.4`.
4. **Bước 4: Kiểm tra khả năng hiển thị**
   - Phong cách Technical Blueprint sắc nét, định dạng vector phóng to không vỡ nét, 100% mũi tên hình học inline (`<polygon>`), tương thích tuyệt đối Figma không mất nét.

---

## 4. TÀI LIỆU THUYẾT MINH KỸ THUẬT KÈM THEO
- Chi tiết đặc tả thuyết minh phục vụ việc viết sách Khóa luận tốt nghiệp được lưu trữ tại:
  - [Chương 1: Tổng quan Kiến trúc & Cơ sở Dữ liệu](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/01-tong-quan-kien-truc-va-co-so-du-lieu.md)
  - [Tài liệu Đặc tả Use Case Chi tiết Chuẩn BA / SRS](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/02-dac-ta-use-case-he-thong-chuan-ba.md)
