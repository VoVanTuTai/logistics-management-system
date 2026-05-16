# Giai đoạn 1 (First Mile) — Báo cáo thay đổi

## Tổng quan
Refactor 2 nghiệp vụ cốt lõi: **Lấy hàng (Pickup)** trên courier-mobile và **Quét nhập kho (Inbound Scan)** trên ops-web.

---

## 1. Ops-Web: HubScanPage — Viết lại hoàn toàn ⚡

### File thay đổi
- `apps/ops-web/src/pages/scans/HubScanPage.tsx`
- `apps/ops-web/src/pages/scans/HubScanPage.css` *(tạo mới)*

### Vấn đề cũ
- UI rất thô sơ: chỉ có 1 form `<input>` + `<select>` + 1 button, không styling
- Kết quả quét hiển thị dạng JSON thô (`<pre>`)
- Không có auto-focus → nhân viên phải click chuột mỗi lần quét
- Không có lịch sử quét → mất dữ liệu nếu reload
- Không có phản hồi âm thanh khi quét đúng/sai

### Thay đổi mới

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Auto-focus** | ❌ Không có | ✅ Tự động focus vào ô mã vận đơn khi mở trang & sau mỗi lần quét |
| **Toast notification** | ❌ Chỉ có text đỏ inline | ✅ Toast bay vào từ phải, tự biến mất sau 4 giây, có nút đóng |
| **Âm thanh phản hồi** | ❌ Không có | ✅ Beep `880Hz` khi quét thành công, beep `300Hz` (thấp, dài) khi lỗi |
| **Lịch sử quét** | ❌ Chỉ hiển thị JSON gần nhất | ✅ Danh sách toàn bộ đơn đã quét, mới nhất trên cùng |
| **Highlight mờ dần** | ❌ Không có | ✅ Item mới quét sáng xanh lá rồi mờ dần trong 2.2s |
| **Chọn loại quét** | `<select>` đơn giản | 3 nút bấm có icon 📦📥📤, trạng thái active nổi bật |
| **Header** | `<h2>` thuần | Header gradient tối kèm số liệu thống kê |
| **Badge loại quét** | Không có | Badge màu riêng: Pickup (vàng), Inbound (xanh dương), Outbound (tím) |

---

## 2. Courier-Mobile: PickupScanScreen — Sửa text + UX 🔧

### File thay đổi
- `apps/courier-mobile/src/screens/scan/PickupScanScreen.tsx`

### Vấn đề cũ
- ~17 chuỗi văn bản hiển thị **không có dấu tiếng Việt** (VD: `"Ma van don khong hop le"`, `"Cap quyen camera"`)
- Nút xác nhận quá dài, không rõ nghĩa

### Danh sách text đã sửa

| Message cũ (ASCII) | Message mới (Vietnamese) |
|---------------------|--------------------------|
| `Ma van don khong hop le.` | `Mã vận đơn không hợp lệ.` |
| `Phien dang nhap da het han...` | `Phiên đăng nhập đã hết hạn...` |
| `Ma van don ... da ton tai trong danh sach.` | `Mã vận đơn ... đã tồn tại trong danh sách.` |
| `Khong tim thay hoac khong xac minh duoc ma...` | `Không tìm thấy hoặc không xác minh được mã...` |
| `Khong doc duoc ma hop le...` | `Không đọc được mã hợp lệ...` |
| `Co loi xay ra.` | `Có lỗi xảy ra.` |
| `Chua co ma van don de tai len.` | `Chưa có mã vận đơn để tải lên.` |
| `...ma duoc queue offline.` | `...mã được lưu offline.` |
| `Co ... ma tai len that bai:` | `Có ... mã tải lên thất bại:` |
| `Dang kiem tra quyen camera...` | `Đang kiểm tra quyền camera...` |
| `Can cap quyen camera de quet ma van don.` | `Cần cấp quyền camera để quét mã vận đơn.` |
| `Cap quyen camera` | `Cấp quyền camera` |
| `Dang tai len... / Dang xac minh ma...` | `Đang tải lên... / Đang xác minh mã...` |
| Nút: `Tải lên và cập nhật trạng thái nhận hàng` | Nút: `Xác nhận nhận hàng (N đơn)` |

---

## Những gì đã hoạt động tốt (giữ nguyên)
- ✅ Logic validate đơn hàng trước khi nhận (check hub, check trạng thái, check task pickup)
- ✅ Camera barcode scanning (hỗ trợ QR, EAN13, Code128, v.v.)
- ✅ Chụp minh chứng (proof photo) cho mode Task nhận hàng
- ✅ Queue offline khi mất mạng
- ✅ Idempotency key chống gửi trùng
- ✅ Zod validation trong HubScanForm (giữ file cũ để không break import nào khác)
