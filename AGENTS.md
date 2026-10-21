
## Project context

This is a ReactJS logistics/merchant frontend.

The redesign reference is located at:

/design-reference/stitch_nexus_merchant_dashboard_redesign

Additional instructions are in:

/design-reference/merchant-redesign-brief.md

## Hard constraints

When implementing the merchant redesign:

- Do not change API calls.
- Do not change API service files unless explicitly asked.
- Do not change request payloads.
- Do not change response mapping.
- Do not change routes.
- Do not change auth, permissions, or role logic.
- Do not change order status logic.
- Do not change validation logic.
- Do not remove existing loading, empty, error, and success states.
- Do not rewrite the whole app.
- Do not introduce a new UI library unless explicitly approved.

## Allowed changes

You may change:

- JSX layout
- CSS / SCSS / Tailwind classes
- Presentational components
- Icons
- Typography
- Spacing
- Colors
- Tables
- Cards
- Buttons
- Empty states
- Loading skeletons
- Responsive layout

## Workflow

Before editing:
1. Inspect the current React app structure.
2. Inspect the design-reference folder.
3. Map each Stitch screen to current React page/component files.
4. Propose a small implementation plan.

When editing:
1. Work one screen at a time.
2. Keep diffs small.
3. Preserve existing business behavior.
4. Run lint/build/test commands if available.

## Current redesign handoff

Before continuing the merchant UI redesign, read:

`design-reference/codex-handoff.md`

## Bưu chính & Vận hành: Quy chuẩn Nghiệp vụ Đơn hàng & Kiện hàng (Carrier Domain Knowledge)

### 1. Phân loại 5 nhóm mặt hàng chuẩn Carrier (Carrier Operational Classification):
- **Hàng thông thường (`GENERAL`)**:
  - Quần áo, đồ gia dụng, sách vở, giày dép...
  - Luồng chuẩn baseline, tính cước theo cân nặng thực tế.
- **Hàng dễ vỡ (`FRAGILE`)**:
  - Gốm sứ, thủy tinh, đồ nhựa giòn, chai lọ dung dịch...
  - Tự động gắn tag nhãn cảnh báo **"HÀNG DỄ VỠ - XIN NHẸ TAY"** trên tem in nhiệt.
  - Kích hoạt SOP bọc bubble wrap ≥ 3 lớp, liên kết trực tiếp quy trình kiểm soát bồi thường Claims Liability & Service Quality.
- **Điện tử & Giá trị cao (`HIGH_VALUE` / `ELECTRONICS`)**:
  - Điện thoại, laptop, đồng hồ, máy ảnh, linh kiện...
  - Bắt buộc khai báo giá trị kiện hàng (`declaredValue`).
  - Tự động kích hoạt gói Bảo hiểm toàn diện 100% (`insuranceTier = 'COMPREHENSIVE_100'`, cước phí 0.5% giá trị khai báo).
  - Yêu cầu dán tem niêm phong seal an ninh chống tráo ruột.
- **Hàng cồng kềnh / Nặng (`BULKY` / `HEAVY`)**:
  - Máy móc gia dụng, quạt, thùng carton kích thước lớn...
  - Bắt buộc đo 3 chiều Dài x Rộng x Cao (cm).
  - Tự động tính cước thể tích chuẩn quốc tế IATA/VLA: `Chargeable Weight = max(Cân thực tế, (Dài x Rộng x Cao) / 6000)`.
- **Tài liệu / Thư từ (`DOCUMENT`)**:
  - Bì thư A4, hồ sơ, hợp đồng, chứng từ pháp lý, hóa đơn đỏ...
  - Trọng lượng nhẹ mặc định (< 0.5kg), miễn trừ tính cước thể tích.
  - Khóa chính sách đồng kiểm (chỉ xem ngoại quan phong bì, không mở ruột) theo Luật Bưu chính.

### 2. Quy chuẩn 3 Tầng trần tối đa (Physical Operational Ceilings & Policy Boundaries):
- **Trần vật lý tối đa của mạng lưới bưu cục**:
  - Khối lượng thực tế: $\le 70\text{ kg}$ / kiện.
  - Chiều dài 1 cạnh lớn nhất: $\le 150\text{ cm}$.
  - Tổng kích thước 3 chiều: $D + R + C \le 300\text{ cm}$.
- **Phân 3 tầng kiểm soát vận hành**:
  1. *Tầng 1 - Tiêu chuẩn (Standard Courier)*: Khối lượng $\le 20\text{ kg}$ & mỗi cạnh $\le 60\text{ cm}$ $\rightarrow$ Shipper xe máy giao nhận bình thường.
  2. *Tầng 2 - Cồng kềnh trong hạn mức (Bulky / Truck Dispatch)*: Khối lượng $21\text{ kg} - 70\text{ kg}$ HOẶC cạnh $61\text{ cm} - 150\text{ cm}$ $\rightarrow$ Tự động tính cước thể tích IATA, gắn nhãn **"CẦN XE TẢI / HÀNG CỒNG KỀNH"**.
  3. *Tầng 3 - VƯỢT TRẦN MẠNG LƯỚI (Over-limit Block)*: Khối lượng $> 70\text{ kg}$ HOẶC cạnh lớn nhất $> 150\text{ cm}$ HOẶC tổng 3 chiều $> 300\text{ cm}$ $\rightarrow$ **Chặn tạo đơn (Validation Error)**, hướng dẫn khách tách kiện hoặc chuyển sang dịch vụ Vận tải hàng nguyên chuyến (Truckload/FTL).