
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

### 3. Quy chuẩn Thiết kế Bảng Danh sách Vận đơn (Standardized Shipment Table Design):
Tất cả các bảng danh sách vận đơn/đơn hàng trên toàn hệ thống (OPS Web, Merchant Web) bắt buộc tuân theo bảng chuẩn tại `ShipmentsTable.tsx` / `ShipmentListPage.tsx`:
1. **Đúng 1 hàng text duy nhất cho mỗi đơn (Strict Single-Line Text Row)**:
   - `whiteSpace: 'nowrap'`, chiều cao chuẩn `38px`, `verticalAlign: 'middle'`.
   - Tuyệt đối KHÔNG xếp chồng các dòng phụ (subline), KHÔNG nhồi nhét subtitle địa chỉ, cước phí, hay badge sàn/dịch vụ xếp tầng dưới mã đơn làm phình to chiều cao dòng.
   - Dữ liệu dài (địa chỉ, họ tên, ghi chú) dùng `text-overflow: ellipsis`, hiển thị trên 1 hàng, xem chi tiết đầy đủ qua tooltip `title` khi rê chuột.
2. **Cột Mã vận đơn bôi đen mượt mà (Clean Selectable Monospace Tracking Code)**:
   - Mã vận đơn hiển thị dưới dạng text thuần với font Monospace chuyên dụng (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`), màu xanh chuẩn `var(--ops-primary, #0052cc)`.
   - Thuộc tính bắt buộc: `user-select: text !important; -webkit-user-select: text !important; cursor: text; display: inline-block; whiteSpace: 'nowrap'`.
   - Tuyệt đối KHÔNG bọc mã trong `<button>`, KHÔNG đặt các nút/icon copy chiếm sự kiện chuột giữa dòng làm ngắt quãng thao tác quét chọn.
   - Người dùng có thể nhấn giữ chuột ở mã đơn dòng đầu và kéo thẳng đứng xuống dòng cuối để **bôi đen liên tục cả cột mã vận đơn** và nhấn `Ctrl+C` / `Cmd+C` copy danh sách mã đơn.
3. **Nội dung chính yếu, tinh gọn (Lean & Focused Columns)**:
   - Loại bỏ các cột thông tin thừa, không phục vụ thao tác của màn hình đó.
   - Mặc định chỉ hiển thị các cột cốt lõi nghiệp vụ. Bảng vừa vặn màn hình, không bị dàn trải quá mức.
4. **Giao diện bảng chuyên nghiệp (Table Styling)**:
   - Header sticky: nền `#f8faff`, chữ `#1f2b6f`, `fontSize: 12px`, `fontWeight: 800`, `textTransform: 'uppercase'`, viền dưới `#cbd5e1`.
   - Khung bảng: viền `#d9def3`, bo góc `8px`, nền trắng `#ffffff`, đổ bóng nhẹ `0 1px 3px rgba(0,0,0,0.05)`.
   - Hiệu ứng hàng: hover đổi nền `#f8faff` hoặc `#f3f7ff`. Trạng thái hiển thị 1 badge ngang duy nhất.

### 4. Quy chuẩn Giám định Đơn lạc & Phân tích Vết quét Thao tác (Stray & Lost Shipment Investigation SOP):
Màn hình Giám định đơn lạc (`/app/function-groups/service-quality/stray-investigation`) áp dụng quy trình kiểm soát chuỗi vết quét (Chain of Custody) khép kín gồm 4 giai đoạn bắt buộc:
1. **Phát hiện & Bắt điểm đứt gãy (Break Point Detection)**:
   - Hệ thống tự động phân tích log vết quét (Audit Engine) để tìm điểm dừng bất thường theo 4 nhóm đứt gãy:
     - `WAREHOUSE_STALE_LOSS`: Đã Scan Inbound nhập kho nhưng lưu kho $>48\text{h}$ không phát sinh Scan Outbound.
     - `LINEHAUL_IN_TRANSIT_LOSS`: Rơi vỡ / thất lạc trên xe tải đường trục (đứt chì seal, rách bạt, hụt cân bao đối soát).
     - `MISROUTED_SORTING`: Bắn nhầm luồng hoặc sai tuyến đích tại băng chuyền phân loại Hub.
     - `LAST_MILE_UNACCOUNTED`: Xuất kho giao cho Shipper nhưng cuối ca không giao thành công và không hoàn kho.
   - Báo cáo giám định sơ bộ tính toán: Đơn vị tình nghi số 1 (`suspectParty`), Độ tin cậy (`confidenceScorePercent`), Đề xuất bồi thường (`suggestedCompensationAmount`).
2. **Kích hoạt Cửa sổ Giải trình & Phản biện 24h (24-Hour Dispute Hearing Window)**:
   - Tuyệt đối KHÔNG quy chụp trách nhiệm bồi thường ngay lập tức.
   - Chuyển trạng thái sang `IN_HEARING`, cấp thời hạn 24 giờ cho đơn vị tình nghi trích xuất dữ liệu camera CCTV bàn dỡ, kiểm tra cân nặng và biên bản bàn giao xe tuyến.
   - Hỗ trợ gia hạn thêm tối đa $+12\text{h}$ nếu đơn vị có văn bản xin trích xuất dữ liệu camera liên Hub.
   - Bằng chứng video CCTV và biên bản phản biện được nộp trực tiếp và lưu trữ an toàn trên **MinIO Object Storage** (`cskh-evidence/{ticketCode}/...` hoặc `claims-evidence/...`).
3. **Rà soát Hiện trường & Cứu đơn (Warehouse Search & Salvage)**:
   - Mục tiêu cao nhất là **tìm thấy kiện hàng trong kho (Cứu đơn)** để bảo toàn 100% giá trị hàng hóa và triệt tiêu rủi ro bồi thường tài chính.
   - Khi tìm thấy: Thao tác "Đã Tìm Thấy Hàng Trong Kho", ghi nhận vị trí tìm thấy (`foundLocation`), nhân sự xác nhận (`operator`) $\rightarrow$ Tự động chuyển trạng thái `RESOLVED_FOUND`, đưa hàng về luồng luân chuyển bình thường.
4. **Phán quyết Trách nhiệm & Tự động liên kết Bồi thường (Adjudication & Auto-Claim Escalation)**:
   - Khi kết thúc 24h mà đơn vị không chứng minh được tính nguyên vẹn của kiện hàng $\rightarrow$ Cán bộ QA / Trưởng ban Vận hành ký phán quyết (`adjudicator`, `finalNotes`).
   - Tự động chuyển trạng thái `ESCALATED_TO_CLAIM`.
   - Hệ thống tự động sinh 1 **Hồ sơ Bồi thường (Compensation Claim)** mới bên phân hệ Claims Liability (`/claims`), gán chế tài 100% cho đơn vị vi phạm để khấu trừ lương/KPI.
5. **Quy chuẩn Bắt buộc Xem Toàn cảnh trước khi Thao tác (Mandatory Full-Context Review before Action)**:
   - Không đặt cột/nút thao tác phán quyết trực tiếp ngoài bảng danh sách nhằm triệt tiêu rủi ro bấm nhầm hoặc kết luận vội vàng khi chưa đối soát log.
   - Nhân viên vận hành/QA bắt buộc phải nhấp chuột vào dòng đơn để mở Drawer trượt xem toàn cảnh: đối chiếu báo cáo sơ bộ, xem độ tin cậy AI, rà soát chuỗi vết quét Domino, và kiểm tra video camera CCTV bàn dỡ rồi mới được thực hiện các nút thao tác (Cứu đơn, Phán quyết bồi thường, Nộp phản biện, Gia hạn).