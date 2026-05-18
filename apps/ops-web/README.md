# Ops Web

`apps/ops-web` là giao diện điều hành nội bộ của NEXUS Logistics, phục vụ các luồng vận hành lõi: theo dõi dashboard, xử lý vận đơn, pickup, scan tại hub, phân công tác vụ, quản lý bao tải, NDR, tracking và masterdata.

## Cách Chạy

```bash
cd apps/ops-web
npm install
npm run dev
```

Kiểm tra build production:

```bash
cd apps/ops-web
npm run build
```

Chạy smoke test:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
```

## Cấu Hình

```env
VITE_GATEWAY_BFF_URL=http://localhost:3000
VITE_REQUEST_TIMEOUT_MS=15000
VITE_SHOW_OPS_PROTOTYPE_ROUTES=false
```

- `VITE_GATEWAY_BFF_URL`: địa chỉ gateway BFF.
- `VITE_REQUEST_TIMEOUT_MS`: timeout mặc định cho API request.
- `VITE_SHOW_OPS_PROTOTYPE_ROUTES`: mặc định `false` trong demo/production. Khi bật `true`, các route prototype/mock sẽ hiện lại kèm nhãn `Prototype`.

## API Boundary

Ops Web chỉ gọi API qua `gateway-bff` với prefix `/ops/*`.

Frontend không gọi trực tiếp các service nội bộ như `shipment-service`, `pickup-service`, `dispatch-service`, `manifest-service`, `scan-service`, `delivery-service`, `tracking-service`, `reporting-service` hoặc `masterdata-service`. Các giá trị nghiệp vụ như trạng thái hiện tại, vị trí hiện tại, timeline, KPI và danh sách thao tác được hiển thị từ payload API, không tự suy diễn ở frontend.

## Module Core Đã Nối API

Các module sau được xem là phạm vi production-like cho demo đồ án:

- Dashboard KPI vận hành.
- Shipments: danh sách vận đơn, tạo vận đơn walk-in, thao tác tiếp nhận tại quầy.
- Pickups: duyệt hoặc từ chối yêu cầu lấy hàng.
- Tasks: phân công và phân công lại tác vụ giao/lấy hàng.
- Manifests: tạo bao, đóng bao, seal, receive và quản lý kiện trong bao.
- Scans: pickup/inbound/outbound scan tại hub.
- NDR: xử lý giao thất bại, đổi lịch hoặc quyết định hoàn.
- Tracking: tra cứu trạng thái hiện tại và timeline vận đơn.
- Masterdata: hub, zone, cấu hình và lý do NDR.

## Module Prototype/Mock

Các module sau là phần minh họa định hướng mở rộng, không trình bày như chức năng production đã hoàn tất:

- Analytics nâng cao dùng mock data showcase.
- Linehaul nâng cao và quản lý chuyến xe chi tiết.
- Return block management/chuyển hoàn nâng cao.
- Finance settlement, planning, service quality mở rộng.
- Các function group hoặc placeholder chưa có backend contract hoàn chỉnh.

Trong demo mặc định, các route này được ẩn khỏi menu chính. Nếu truy cập trực tiếp, màn hình sẽ hiển thị nhãn `Prototype` hoặc `Coming Soon` để tránh nhầm lẫn.

## Demo Script Đề Xuất

1. Đăng nhập tài khoản Ops.
2. Mở Dashboard để xem KPI, hub scope và menu core.
3. Vào Shipments, tạo vận đơn walk-in.
4. Thực hiện pickup hoặc inbound scan cho vận đơn.
5. Vào Tasks, chọn tác vụ và phân công courier.
6. Vào Manifests, tạo bao và thực hiện seal/receive theo luồng middle-mile.
7. Dùng Tracking để tra timeline vận đơn.
8. Nếu có case giao thất bại, vào NDR để reschedule hoặc quyết định hoàn.

## Kiểm Chứng Kỹ Thuật

Smoke test hiện kiểm tra các điểm gãy chính:

- Route guard redirect về login khi chưa đăng nhập.
- Dashboard render KPI shell.
- Shipment form render và validate field bắt buộc.
- Task assignment render task/courier mock và gọi assign mutation.
- Manifest management render danh sách bao và generate bag.
- Tracking lookup render empty/error/success state.

## Trạng Thái Báo Cáo

Ops Web hiện ở mức **MVP production-like cho core operations**. Các luồng lõi đã có API boundary rõ qua gateway `/ops`, session refresh, smoke test và tách nhãn prototype. Một số hạng mục vẫn cần hardening tiếp trước production thật: server-side pagination cho list lớn, audit thao tác ops, enforce hub/role scope ở backend/gateway, chuẩn hóa toast/error và tối ưu code splitting.
