# Báo Cáo Production Readiness - Ops Web

## 1. Mục Tiêu

Ops Web là giao diện vận hành nội bộ cho đồ án NEXUS Logistics. Mục tiêu của đợt hardening là đưa ứng dụng từ mức demo chức năng lên mức **production-like cho các workflow vận hành lõi**, đồng thời tách rõ các màn prototype để không gây hiểu nhầm khi báo cáo.

## 2. Phạm Vi Production-Like

Các module dưới đây đã được nối theo API boundary qua gateway `/ops/*` và có thể dùng làm luồng demo chính:

| Module | Mục đích |
|---|---|
| Dashboard | Hiển thị KPI vận hành, hub scope và trạng thái tổng quan |
| Shipments | Quản lý vận đơn, tạo vận đơn tại quầy, thao tác tiếp nhận |
| Pickups | Duyệt/từ chối yêu cầu lấy hàng |
| Tasks | Phân công và phân công lại tác vụ cho courier |
| Manifests | Tạo bao, đóng bao, seal, receive, quản lý kiện trong bao |
| Scans | Ghi nhận pickup/inbound/outbound scan tại hub |
| NDR | Xử lý giao thất bại, đổi lịch giao hoặc quyết định hoàn |
| Tracking | Tra cứu trạng thái hiện tại và timeline vận đơn |
| Masterdata | Quản lý hub, zone, cấu hình và lý do NDR |

Frontend chỉ gọi `gateway-bff` qua prefix `/ops`. Các service nội bộ được ẩn sau gateway, giúp kiến trúc demo gần với mô hình production hơn.

## 3. Phạm Vi Prototype/Mock

Các phần sau là minh họa định hướng mở rộng, chưa được xem là production-ready:

- Analytics nâng cao dùng mock data.
- Linehaul nâng cao và quản lý chuyến xe chi tiết.
- Return block management/chuyển hoàn nâng cao.
- Finance settlement và planning.
- Các function group placeholder chưa có backend contract hoàn chỉnh.

Ứng dụng có flag `VITE_SHOW_OPS_PROTOTYPE_ROUTES=false` mặc định. Khi flag tắt, menu demo chỉ hiện module core. Khi bật flag ở local/dev, route prototype hiện lại và có nhãn `Prototype` hoặc `Coming Soon`.

## 4. Các Nâng Cấp Đã Hoàn Thành

- Session refresh: tự refresh access token khi gần hết hạn, retry một lần khi API trả 401, clear session rõ ràng khi refresh fail.
- Smoke test: thêm `npm run test:smoke` với các case route guard, dashboard, shipment, task assignment, manifest và tracking.
- Prototype route: tách core route và prototype route, ẩn prototype khỏi menu demo mặc định.
- Tài liệu: README và báo cáo này nêu rõ phần đã nối API thật và phần chỉ minh họa.

## 5. Cách Chạy Và Kiểm Chứng

```bash
cd apps/ops-web
npm install
npm run dev
```

Kiểm chứng build:

```bash
cd apps/ops-web
npm run build
```

Kiểm chứng smoke test:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
```

## 6. Demo Script Đề Xuất

1. Đăng nhập tài khoản Ops.
2. Mở Dashboard để giới thiệu KPI, hub scope và menu core.
3. Vào Shipments tạo vận đơn walk-in.
4. Thực hiện pickup hoặc inbound scan để ghi nhận vận đơn vào luồng vận hành.
5. Vào Tasks, chọn tác vụ và phân công courier.
6. Vào Manifests, tạo bao và thực hiện seal/receive.
7. Dùng Tracking để xem timeline vận đơn.
8. Với đơn giao thất bại, vào NDR để reschedule hoặc quyết định hoàn.

## 7. Đánh Giá

Ops Web đủ điều kiện trình bày như một MVP production-like cho core operations. Điểm mạnh là luồng nghiệp vụ end-to-end rõ, API boundary thống nhất qua gateway, có session refresh, có smoke test và có phân định prototype minh bạch.

Các hạng mục nên tiếp tục trước production thật:

- Server-side pagination/filter cho list lớn.
- Enforce hub/role scope tại gateway/backend, không chỉ filter ở frontend.
- Audit log cho thao tác ops quan trọng.
- Chuẩn hóa toast/error thay cho `window.alert`.
- Realtime hardening cho task updates.
- Code splitting để giảm warning chunk lớn khi build.

## 8. Kết Luận Báo Cáo

Không nên trình bày Ops Web là production-ready toàn bộ. Cách mô tả phù hợp là:

> Ops Web hiện ở mức MVP production-like cho các workflow vận hành lõi gồm dashboard, vận đơn, pickup, task assignment, manifest, scan, NDR, tracking và masterdata. Các module mở rộng như analytics nâng cao, finance, planning, linehaul chi tiết và return block nâng cao được tách nhãn prototype để thể hiện định hướng phát triển, không trình bày như chức năng production đã hoàn tất.
