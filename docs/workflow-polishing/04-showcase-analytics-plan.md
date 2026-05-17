# Kế hoạch Showcase: "Operations Analytics Dashboard" (Điểm nhấn Đồ án)

Tài liệu này hướng dẫn cách xây dựng trang **Dashboard Tổng quan Vận hành** cho ops-web. Đây sẽ là tính năng "Điểm nhấn" (Showcase) để trình diễn năng lực phân tích dữ liệu và thiết kế giao diện của hệ thống trong buổi bảo vệ đồ án.

---

## 1. Mục tiêu
- Tạo ấn tượng thị giác mạnh mẽ ngay khi người dùng đăng nhập vào ops-web.
- Thể hiện tư duy quản lý (Management/Ops level) bằng cách trực quan hóa các chỉ số vận hành quan trọng (Sản lượng, Tỷ lệ giao thành công, Ca bất thường).
- Chứng minh hệ thống có "Tầm nhìn" kiến trúc (Architecture vision) thông qua việc sử dụng trang Placeholder "Coming soon" cho các chức năng mở rộng khác.

---

## 2. Kế hoạch triển khai Dashboard

**Giao diện dự kiến:**
1. **Hàng trên cùng (Key Metrics):** 4 thẻ (Cards) hiển thị số liệu tổng quan.
   - Tổng đơn trong ngày (Ví dụ: 1,245)
   - Đang giao (Ví dụ: 65%)
   - Thành công (Ví dụ: 32%)
   - Bất thường/Cảnh báo (Ví dụ: 3%, màu đỏ nổi bật)
2. **Hàng giữa (Charts):** Sử dụng thư viện **Recharts**.
   - Biểu đồ Bar Chart: Sản lượng luân chuyển theo Hub trong 7 ngày qua.
   - Biểu đồ Donut/Pie Chart: Tỷ lệ các nguyên nhân giao hàng thất bại (NDR/Exception).
3. **Hàng dưới (Data Grid):**
   - Danh sách "Cảnh báo cần xử lý gấp" (5 đơn hàng lỗi/quá hạn) kèm nút "Xử lý ngay".

---

## 3. Kết quả triển khai — ✅ HOÀN THÀNH (17/05/2026)

### Bước 1: Cài đặt Recharts — ✅ Done

Đã thêm `"recharts": "^2.15.0"` vào `apps/ops-web/package.json`.

> **Lưu ý:** Chạy `npm install` trong `apps/ops-web/` trước khi dev.

**File thay đổi:**
- `apps/ops-web/package.json` — thêm dependency `recharts`

---

### Bước 2: Tạo trang AnalyticsDashboardPage — ✅ Done

Trang Analytics Dashboard đã được tạo tại `apps/ops-web/src/pages/dashboard/analytics/` với thiết kế **Dark Glassmorphism** cao cấp.

#### 2.1 Cấu trúc file mới
```
apps/ops-web/src/pages/dashboard/analytics/
├── AnalyticsDashboardPage.tsx    ← Component chính (301 dòng)
├── AnalyticsDashboard.css        ← CSS premium (400+ dòng)
└── analyticsMockData.ts          ← Mock data chuyên nghiệp
```

#### 2.2 Hàng trên — 4 KPI Cards

| Thẻ | Giá trị | Trend | Màu accent |
|-----|---------|-------|-----------|
| Tổng đơn trong ngày | 1,245 | ▲ +12.3% | 🟣 Indigo (Primary) |
| Đang giao | 65% (810 đơn) | — | 🔵 Sky Blue (Info) |
| Giao thành công | 32% (398 đơn) | ▲ +4.1% | 🟢 Emerald (Success) |
| Bất thường / Cảnh báo | 3% (37 đơn) | ▼ +0.8% | 🔴 Red (Danger — nổi bật) |

**Đặc điểm thiết kế:**
- CSS Grid 4 cột, responsive xuống 2 cột (≤1200px) và 1 cột (≤768px)
- Border-left 3px theo accent color
- Hover effect: `translateY(-3px)` + box-shadow tăng cường
- Staggered animation delay (0.08s → 0.32s) tạo hiệu ứng xuất hiện lần lượt

#### 2.3 Hàng giữa — 2 Biểu đồ Recharts

**Biểu đồ 1 — Bar Chart (Sản lượng Hub 7 ngày):**
- 5 Hub: HCM01, HCM02, HCM03, HNI01, DNG01
- Dữ liệu 7 ngày (11/05 → 17/05)
- Mỗi hub có màu riêng (Indigo gradient + Amber + Emerald)
- Legend bar phía dưới biểu đồ
- Tooltip dark theme custom

**Biểu đồ 2 — Donut Chart (NDR Reasons):**
- 5 nguyên nhân: Khách hẹn lại (35%), Không nghe máy (28%), Sai địa chỉ (18%), Khách từ chối nhận (12%), Khác (7%)
- **Interactive Active Shape** — hover hiển thị tên + số đơn + % tại vị trí segment
- Inner radius 68px, outer 100px, padding angle 3°

#### 2.4 Hàng dưới — Bảng Cảnh báo cần xử lý gấp

5 đơn cảnh báo mẫu với đầy đủ thông tin:
| Mã vận đơn | Vấn đề | Hub | Mức độ | Thời gian | Shipper |
|------------|--------|-----|--------|-----------|---------|
| NXS-20260517-00842 | Quá hạn SLA giao 48h | HCM01 | 🔴 Nghiêm trọng | 52h | Nguyễn Văn A |
| NXS-20260517-01103 | Khách khiếu nại 3 lần | HCM02 | 🔴 Nghiêm trọng | 36h | Trần Thị B |
| NXS-20260516-08977 | Sai địa chỉ – chưa liên hệ | HNI01 | 🟡 Cao | 28h | Lê Minh C |
| NXS-20260516-05421 | Hàng hư hỏng – chờ xác nhận | DNG01 | 🟡 Cao | 18h | Phạm Quốc D |
| NXS-20260517-02204 | Shipper báo mất hàng | HCM03 | 🔵 Trung bình | 6h | Hoàng Thị E |

- Severity badge có animation pulse
- Nút "Xử lý ngay" với hover scale + glow effect
- Row hover: translateX(2px) + background highlight

#### 2.5 Thiết kế UI (Design Highlights)
- 🌑 **Dark gradient background:** `linear-gradient(135deg, #0f172a, #1e293b, #0f172a)`
- 💎 **Glassmorphism cards:** `backdrop-filter: blur(14px)` + `rgba(255,255,255,0.08)` background
- ✨ **Staggered entrance animations:** `@keyframes analytics-card-pop` với delay khác nhau
- 🟢 **Live data badge:** Green pulse dot + timestamp thời gian thực
- 📱 **Responsive:** 3 breakpoints (1200px, 768px, 640px)
- 🎨 **Recharts dark theme overrides:** Custom tooltip, grid, text colors

**File thay đổi:**
- `apps/ops-web/src/pages/dashboard/analytics/AnalyticsDashboardPage.tsx` — **NEW**
- `apps/ops-web/src/pages/dashboard/analytics/AnalyticsDashboard.css` — **NEW**
- `apps/ops-web/src/pages/dashboard/analytics/analyticsMockData.ts` — **NEW**

---

### Bước 3: Tích hợp Routing — ✅ Done

#### Routes mới đã thêm:

| Route Path | Leaf Path | Component | Mô tả |
|------------|-----------|-----------|--------|
| `/app/analytics` | `analytics` | `AnalyticsDashboardPage` | Trang Analytics chính |
| `/app/coming-soon/bao-cao-cong-no` | `coming-soon/bao-cao-cong-no` | `ComingSoonPlaceholder` | Báo cáo Công nợ |
| `/app/coming-soon/ai-du-doan-dong-tien` | `coming-soon/ai-du-doan-dong-tien` | `ComingSoonPlaceholder` | AI Dự đoán Dòng tiền |

#### Cách truy cập:
1. **Từ Dashboard chính:** Click nút "📊 Analytics Dashboard" trong Hero badge (góc phải hero section)
2. **URL trực tiếp:** `/app/analytics`
3. Tất cả route analytics / coming-soon đều sử dụng **full-width layout** (không hiển thị sidebar)

#### Logic layout:
`isDashboardRoute` trong `DashboardLayout` đã mở rộng để nhận diện:
- `/app/dashboard` (trang chủ cũ)
- `/app/analytics` (analytics mới)
- `/app/coming-soon/*` (tất cả trang Coming Soon)

**File thay đổi:**
- `apps/ops-web/src/navigation/routes.ts` — thêm 6 route entries mới
- `apps/ops-web/src/app/AppRouter.tsx` — thêm imports + 3 `<Route>` elements + mở rộng `isDashboardRoute`
- `apps/ops-web/src/pages/dashboard/DashboardPage.tsx` — thêm link "📊 Analytics Dashboard" trong hero badge

---

### Bước 4: Coming Soon Placeholder — ✅ Done

Component reusable `ComingSoonPlaceholder` đã tạo tại `apps/ops-web/src/pages/shared/ComingSoonPlaceholder.tsx`.

#### Props Interface:
```typescript
interface ComingSoonPlaceholderProps {
  title: string;          // Tên module (VD: "Báo cáo Công nợ")
  description: string;    // Mô tả ngắn về tính năng
  visionText?: string;    // Tầm nhìn kiến trúc Phase tiếp theo
  phaseLabel?: string;    // VD: "Phase 2 — Q3 2026"
}
```

#### Thiết kế:
- 🎨 Animated floating icon (3s ease-in-out infinite `translateY`)
- 🏷️ Badge "Đang phát triển" với pulse animation màu vàng
- 📋 Title + mô tả tính năng
- 🔮 **Block "Tầm nhìn kiến trúc"** — border indigo, background subtle
- ⏰ Phase label với icon đồng hồ
- 💎 Card glassmorphism + radial gradient overlay
- Dark theme nhất quán với Analytics Dashboard

#### 2 trang Coming Soon đã tạo:

| Tính năng | Phase | Tầm nhìn kiến trúc |
|-----------|-------|---------------------|
| **Báo cáo Công nợ** | Phase 2 — Q3 2026 | Tích hợp AI dự đoán dòng tiền (Cash Flow Forecasting) và phân tích rủi ro nợ xấu dựa trên lịch sử thanh toán |
| **AI Dự đoán Dòng tiền** | Phase 3 — Q4 2026 | Mô hình Time-series Forecasting (Prophet / LSTM) kết hợp dữ liệu vận hành thực tế |

**File thay đổi:**
- `apps/ops-web/src/pages/shared/ComingSoonPlaceholder.tsx` — **NEW**

---

## 4. Ý nghĩa của "Coming Soon Placeholder"
Việc có hàng chục chức năng báo cáo/quản lý là bình thường, nhưng thời gian làm đồ án có hạn. 
Trang Placeholder giải quyết vấn đề này:
- **Tránh màn hình trắng/lỗi:** Không để menu trống.
- **Chứng minh Tầm nhìn:** Hiển thị rằng bạn biết hệ thống cần tính năng đó (Ví dụ: "Module Báo cáo công nợ sẽ tích hợp AI dự đoán dòng tiền, ra mắt Phase 2").
- **Tạo cảm giác "Hệ thống lớn":** Giám khảo sẽ thấy khung sườn của một hệ thống Enterprise thực thụ dù bạn chỉ mới code xong các luồng cốt lõi.

---

## 5. Tổng hợp File Changes

| File | Action | Mô tả |
|------|--------|--------|
| `apps/ops-web/package.json` | Modified | Thêm `recharts ^2.15.0` |
| `apps/ops-web/src/pages/dashboard/analytics/analyticsMockData.ts` | **New** | Mock data (KPI, Hub throughput, NDR reasons, Alerts) |
| `apps/ops-web/src/pages/dashboard/analytics/AnalyticsDashboard.css` | **New** | 400+ dòng CSS dark glassmorphism |
| `apps/ops-web/src/pages/dashboard/analytics/AnalyticsDashboardPage.tsx` | **New** | Component chính 301 dòng |
| `apps/ops-web/src/pages/shared/ComingSoonPlaceholder.tsx` | **New** | Reusable placeholder component |
| `apps/ops-web/src/navigation/routes.ts` | Modified | +6 route entries |
| `apps/ops-web/src/app/AppRouter.tsx` | Modified | +2 imports, +3 Routes, mở rộng layout logic |
| `apps/ops-web/src/pages/dashboard/DashboardPage.tsx` | Modified | Thêm link "Analytics Dashboard" |
