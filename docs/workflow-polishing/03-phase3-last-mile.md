# Giai đoạn 3 (Last Mile) — Báo cáo thay đổi

## Tổng quan
Refactor toàn bộ luồng **Giao hàng → Ký nhận → Thanh toán** trên courier-mobile và **Phân công giao hàng** trên ops-web.

---

## 1. DeliveryProofScreen (Courier Mobile) — Nắn nót nghiệp vụ cốt lõi ⚡

### File thay đổi
- `apps/courier-mobile/src/screens/delivery/DeliveryProofScreen.tsx`

### Thay đổi chính

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Tính tiền** | Chỉ hiện `codAmount` | ✅ Bảng chi tiết: COD + Phí vận chuyển − Đã trả trước = **TỔNG PHẢI THU** |
| **Tên người nhận** | ❌ Không có | ✅ TextInput bắt buộc, ghi vào audit note |
| **Xác nhận tiền mặt** | ❌ Không có | ✅ Box xanh lá "Xác nhận đã thu đủ N đ tiền mặt" |
| **QR chuyển khoản** | Chỉ hiện QR | ✅ QR + thông tin ngân hàng (STK, Chủ TK, Số tiền) |
| **QR amount** | Dùng `codAmount` | ✅ Dùng `totalAmountDue` (bao gồm phí vận chuyển) |
| **Nút submit** | "Xac nhan ky nhan" (ASCII) | `Xác nhận ký nhận — Thu 250,000đ` (hiển thị số tiền) |
| **Validation** | Chỉ check ảnh + shipmentCode | ✅ Check ảnh + tên người nhận + phương thức thanh toán |
| **Text Vietnamese** | ~25 chuỗi ASCII | ✅ Tất cả có dấu đầy đủ |
| **Card tài chính** | Border mặc định | ✅ Viền vàng + nền vàng nhạt nổi bật |

### Công thức tính tiền

```
TỔNG PHẢI THU = Tiền thu hộ (COD)
              + Phí vận chuyển (shippingFee)
              − Đã trả trước (prepaidAmount)
```

> **Lưu ý:** Nếu `shippingFee` và `prepaidAmount` chưa có trong metadata đơn hàng, hệ thống sẽ mặc định = 0. Đảm bảo backend trả metadata đầy đủ các trường này.

### UI bảng tính tiền (mô phỏng)

```
┌─────────────────────────────────┐
│ 💰 Tổng tiền phải thu           │
│                                 │
│ Tiền thu hộ (COD)    250,000đ   │
│ Phí vận chuyển        30,000đ   │
│ Đã trả trước         -50,000đ   │
│─────────────────────────────────│
│ TỔNG PHẢI THU        230,000đ   │ ← nền đỏ nhạt, nổi bật
│                                 │
│ [💵 Tiền mặt]  [🏦 Chuyển khoản] │
│                                 │
│ ✅ Xác nhận đã thu đủ 230,000đ  │ ← nền xanh lá (khi chọn tiền mặt)
│                                 │
│     ┌───────────┐               │
│     │  QR Code  │               │ ← (khi chọn chuyển khoản)
│     └───────────┘               │
│  Ngân hàng: Vietcombank         │
│  STK: 0123456789                │
│  Chủ TK: NEXUS EXPRESS JSC     │
│  Số tiền: 230,000đ             │
└─────────────────────────────────┘
```

---

## 2. TaskDetailScreen (Courier Mobile) — Fix text Vietnamese 🔧

### File thay đổi
- `apps/courier-mobile/src/screens/tasks/TaskDetailScreen.tsx`

### ~30 chuỗi text đã sửa

| Category | Ví dụ trước | Ví dụ sau |
|----------|-------------|-----------|
| Section titles | `Thong tin nhiem vu` | `Thông tin nhiệm vụ` |
| Labels | `So dien thoai nhan` | `Số điện thoại nhận` |
| Button text | `Ky nhan` | `Ký nhận` |
| Error messages | `Khong tim thay nhiem vu` | `Không tìm thấy nhiệm vụ` |
| Modal actions | `gọi nguoi nhan` | `Gọi người nhận` |
| Loading states | `Dang tai chi tiet nhiem vu...` | `Đang tải chi tiết nhiệm vụ...` |
| Alerts | `Khong co so dien thoai` | `Không có số điện thoại` |

---

## 3. TaskAssignmentPage (Ops Web) — Search Courier + Hub Warning 🔍

### File thay đổi
- `apps/ops-web/src/pages/tasks/TaskAssignmentPage.tsx`

### Thay đổi chính

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Tìm Courier** | `<select>` danh sách dài | ✅ `<input>` search + `<select>` lọc theo tên/SĐT |
| **Cảnh báo sai Hub** | ❌ Không có | ✅ Banner vàng "⚠ N đơn giao CHƯA ĐẾN hub của bạn" |

### Logic cảnh báo Hub

Khi operator chọn các DELIVERY task để phân công, hệ thống:

1. Lấy `receiverHubCode` hoặc `destinationHubCode` từ shipment data
2. So sánh với `assignedHubCodes` của operator đang đăng nhập
3. Nếu không khớp → hiện banner vàng cảnh báo, liệt kê tối đa 5 mã đơn

```
┌──────────────────────────────────────────────────┐
│ ⚠ 3 đơn giao CHƯA ĐẾN hub của bạn:             │
│   SHP-001234, SHP-001235, SHP-001236             │
└──────────────────────────────────────────────────┘
```

---

## Tổng kết file đã thay đổi

| File | Hành động |
|------|-----------|
| `DeliveryProofScreen.tsx` | Thêm bảng tính tiền, ô tên người nhận, bank detail QR, fix text |
| `TaskDetailScreen.tsx` | Fix ~30 text Vietnamese |
| `TaskAssignmentPage.tsx` | Thêm search courier + hub warning |
