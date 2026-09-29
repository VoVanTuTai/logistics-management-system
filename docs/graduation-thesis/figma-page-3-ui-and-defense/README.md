# HƯỚNG DẪN THIẾT KẾ FIGMA - PAGE 3: UI/UX & THESIS DEFENSE

> **Tên Trang trên Figma:** `🎨 03_UI_UX_AND_THESIS_DEFENSE`  
> **Gói tài khoản áp dụng:** Figma Starter / Free Tier (Giới hạn tối đa 3 Pages)  
> **Phong cách đồ họa:** Bản vẽ kỹ thuật đơn sắc (Monochrome Technical Blueprint) & Khung Slide 16:9 - Tối ưu cho bảo vệ trước Hội đồng chấm thi và trình diễn trực tiếp qua Figma Presentation Mode.

---

## 1. CẤU TRÚC PHÂN VÙNG BẰNG FIGMA SECTIONS (`Shift + S`)

Trên trang Figma thứ 3, bạn hãy tạo **2 Sections lớn** để biểu diễn các thành phần giao tiếp người - máy và toàn bộ tài liệu trình chiếu bảo vệ khóa luận:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    🎨 FIGMA PAGE 3: UI/UX & THESIS DEFENSE                              │
├───────────────────────────────────────────────────┬─────────────────────────────────────────────────────┤
│             SECTION 3.1 (Shift + S)               │               SECTION 3.2 (Shift + S)               │
│        RICH ACTIONABLE CARDS UI LIBRARY           │          16:9 THESIS DEFENSE SLIDE DECK             │
│                                                   │                                                     │
│        [01-rich-card-component-library.svg]       │          [02-slide-deck-16-9-templates.svg]         │
│                                                   │                                                     │
│        • Single Order Summary Card                │          • Slide 1: Bối cảnh & Đặt vấn đề           │
│        • Stepper Tracking Timeline                │          • Slide 2: Kiến trúc 4 tầng & PII          │
│        • Pricing & Volumetric IATA Card           │          • Slide 3: RAG Chunking & BPM Sự cố        │
│        • Incident Claim Dialog (24h BBBT)         │          • Slide 4: Kết quả thực nghiệm & Kết luận  │
│        • Interactive Carousel Hub                 │                                                     │
└───────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 2. DANH MỤC SƠ ĐỒ VECTOR SVG (IMPORT VÀO FIGMA)

Toàn bộ sơ đồ vector SVG được lưu trữ tại thư mục:  
`docs/graduation-thesis/figma-page-3-ui-and-defense/diagrams/`

| STT | Tên tệp vector SVG | Tên Section tương ứng trên Figma | Kích thước đề xuất | Mô tả kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| **01** | `01-rich-card-component-library.svg` | **Section 3.1: Rich Card UI Library** | $1920 \times 1280\text{ px}$ | Thư viện Design System bao gồm 5 mẫu Thẻ Tương tác trực quan thay thế văn bản thuần túy (Plain text), hỗ trợ trải nghiệm Zero-Typing và che mờ dữ liệu cá nhân PII. |
| **02** | `02-slide-deck-16-9-templates.svg` | **Section 3.2: Defense Slide Deck** | $1920 \times 1280\text{ px}$ | Bộ 4 Slide trình chiếu tỷ lệ chuẩn 16:9 ($880 \times 495\text{ px}$) được bố trí khoa học, giúp sinh viên thuyết trình cô đọng và chuyên nghiệp trong 15 phút trước Hội đồng. |

---

## 3. HƯỚNG DẪN TRÌNH CHIẾU SLIDE TRÊN FIGMA (PRESENTATION MODE)

Để trình chiếu trực tiếp bộ Slide trên Figma cho Hội đồng xem:
1. **Bước 1:** Kéo file `02-slide-deck-16-9-templates.svg` vào `Section 3.2`.
2. **Bước 2 (Tùy chọn):** Nhấn chuột phải vào SVG $\implies$ Chọn `Ungroup` (`Cmd + Shift + G` trên macOS hoặc `Ctrl + Shift + G` trên Windows).
3. **Bước 3:** Nhấn phím `F` và chọn preset **Slide 16:9** (hoặc bao khung từng Slide: `Slide_1_Problem_Statement`, `Slide_2_System_Architecture`, `Slide_3_Algorithms_And_BPM`, `Slide_4_Results_And_Conclusion`).
4. **Bước 4:** Nhấn tổ hợp phím `Cmd + Opt + Enter` (hoặc click icon nút Play ▶️ ở góc trên bên phải Figma) để bắt đầu chế độ **Figma Presentation**.

---

## 4. TÀI LIỆU THUYẾT MINH & KỊCH BẢN BẢO VỆ KÈM THEO
- Thư mục `specs/` chứa toàn bộ cẩm nang bảo vệ đắt giá:
  - [Chương 3: Phân tích Kịch bản Nghiệp vụ & Bảo mật PII](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/01-phan-tich-cac-kich-ban-nghiep-vu-va-an-toan-pii.md)
  - [Chương 5: Đặc tả Thiết kế Thư viện Rich Cards UI/UX](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/02-dac-ta-rich-card-ui-ux.md)
  - [Cẩm nang Kịch bản Thuyết trình 15 phút & Bộ 10 câu hỏi vặn hiểm hóc của Hội đồng](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-3-ui-and-defense/specs/03-kich-ban-thuyet-trinh-bao-ve-hoi-dong.md)
