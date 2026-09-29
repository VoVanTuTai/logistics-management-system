# HƯỚNG DẪN THIẾT KẾ FIGMA - PAGE 1: SYSTEM & DATA BLUEPRINT

> **Tên Trang trên Figma:** `🏛️ 01_SYSTEM_AND_DATA_BLUEPRINT`  
> **Gói tài khoản áp dụng:** Figma Starter / Free Tier (Giới hạn tối đa 3 Pages)  
> **Phong cách đồ họa:** Bản vẽ kỹ thuật đơn sắc (Monochrome Technical Blueprint) - Tối ưu cho in ấn tài liệu thuyết minh A4/A3 và bảo vệ trước Hội đồng chấm thi.

---

## 1. CẤU TRÚC PHÂN VÙNG BẰNG FIGMA SECTIONS (`Shift + S`)

Trên trang Figma này, bạn hãy tạo **3 Sections lớn** nằm ngang từ trái qua phải (hoặc từ trên xuống dưới) để phân định rõ ràng các tầng kiến trúc và dữ liệu:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    🏛️ FIGMA PAGE 1: SYSTEM & DATA BLUEPRINT                             │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────┤
│   SECTION 1.1 (Shift + S)     │     SECTION 1.2 (Shift + S)     │        SECTION 1.3 (Shift + S)        │
│   UML USE CASE DIAGRAM        │     4-TIER ARCHITECTURE         │        ERD & SETTLEMENT FLOW          │
│                               │                                 │                                       │
│   [01-use-case-general-       │     [02-architecture-           │        [03-erd-data-model-            │
│    system.svg]                │      deployment-4-tier.svg]     │         and-money-flow.svg]           │
│                               │                                 │                                       │
│   • 5 Tác nhân (Actors)       │     • 4 Tầng độc lập            │        • 6 Bảng cơ sở dữ liệu         │
│   • 4 Phân hệ chức năng       │     • Gateway & PII Masking     │        • Quan hệ Crow's Foot          │
│   • Phân quyền RBAC           │     • Mesh Services & RAG       │        • Luồng quyết toán COD/Claim   │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. DANH MỤC SƠ ĐỒ VECTOR SVG (IMPORT VÀO FIGMA)

Toàn bộ sơ đồ vector SVG được lưu trữ tại thư mục:  
`docs/graduation-thesis/figma-page-1-system-and-data/diagrams/`

| STT | Tên tệp vector SVG | Tên Section tương ứng trên Figma | Kích thước đề xuất | Mô tả kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| **01** | `01-use-case-general-system.svg` | **Section 1.1: Use Case Diagram** | $3600 \times 2520\text{ px}$ | Chuẩn UML 2.5 với Cây kế thừa Tác nhân 3 tầng (6 Tác nhân cụ thể + 4 Tác nhân trừu tượng), 7 phân hệ lớn ánh xạ 1:1 codebase thực tế: Đơn hàng, Kho trung chuyển & Giao hàng, Sự cố & Khiếu nại, Tài chính & COD, Truy vết & Viễn trắc, Trợ lý AI RAG, Quản trị hệ thống (53 Use Cases triển khai thực tế, 2 Generalizations, 11 Include/Extend, 100% không vẽ khống). |
| **02** | `02-architecture-deployment-4-tier.svg` | **Section 1.2: System Architecture** | $1920 \times 1280\text{ px}$ | Kiến trúc triển khai 4 tầng phân lập: Client Apps, API Gateway & PII Sanitizer (:3000), AI Orchestrator (:3013), Mesh Services & RAG Vector Engine. |
| **03** | `03-erd-data-model-and-money-flow.svg` | **Section 1.3: ERD & Money Flow** | $1920 \times 1280\text{ px}$ | Mô hình ERD chuẩn Crow's Foot Notation (6 thực thể dữ liệu quan trọng) tích hợp sơ đồ luồng tiền thanh toán COD và chi trả bồi thường bưu chính. |

---

## 3. QUY TRÌNH IMPORT VÀ SẮP XẾP CHUẨN TRÊN FIGMA

1. **Bước 1: Tạo mới Page trên Figma**
   - Click nút `+` ở thanh danh sách Pages bên trái màn hình Figma.
   - Đổi tên thành: `🏛️ 01_SYSTEM_AND_DATA_BLUEPRINT`.
2. **Bước 2: Tạo các Section (`Shift + S`)**
   - Nhấn phím tắt `Shift + S`, vẽ 3 Section lần lượt đặt tên:
     - `Section 1.1: Enterprise UML Use Case System` (X: `0`, Y: `0`, W: `3680`, H: `2600`).
     - `Section 1.2: 4-Tier Architecture & Security` (X: `3800`, Y: `0`, W: `2000`, H: `2600`).
     - `Section 1.3: ERD Data Model & Settlement Flow` (X: `5900`, Y: `0`, W: `2000`, H: `2600`).
3. **Bước 3: Kéo thả các file SVG vào từng Section**
   - Kéo file `01-use-case-general-system.svg` thả vào `Section 1.1`.
   - Kéo file `02-architecture-deployment-4-tier.svg` thả vào `Section 1.2`.
   - Kéo file `03-erd-data-model-and-money-flow.svg` thả vào `Section 1.3`.
4. **Bước 4: Kiểm tra khả năng hiển thị**
   - Không bị lỗi đè chữ, không bị mất đầu mũi tên (nhờ dùng tọa độ `<polygon>` tuyệt đối thay cho thẻ `<marker>`).

---

## 4. TÀI LIỆU THUYẾT MINH KỸ THUẬT KÈM THEO
- Chi tiết đặc tả thuyết minh phục vụ việc viết sách Khóa luận tốt nghiệp được lưu trữ tại:
  - [Chương 1: Tổng quan Kiến trúc & Cơ sở Dữ liệu](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/01-tong-quan-kien-truc-va-co-so-du-lieu.md)
  - [Tài liệu Đặc tả Use Case Chi tiết Chuẩn BA / SRS](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/specs/02-dac-ta-use-case-he-thong-chuan-ba.md)
