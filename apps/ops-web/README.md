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
VITE_ENABLE_FULL_OPS_MODULES=true
```

- `VITE_GATEWAY_BFF_URL`: địa chỉ gateway BFF.
- `VITE_REQUEST_TIMEOUT_MS`: timeout mặc định cho API request.
- `VITE_ENABLE_FULL_OPS_MODULES`: mặc định hiện đầy đủ các module nghiệp vụ của Ops Web. Đặt `false` chỉ khi cần build gọn theo nhóm core.

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

## Module Nghiệp Vụ Đang Hardening Production

Các module sau được giữ là chức năng chính trong Ops Web để tiếp tục nâng lên production. Một số màn đã có UI/luồng nghiệp vụ nhưng còn cần backend contract, dữ liệu thật hoặc hardening trước khi xem là production-ready toàn phần:

- Analytics nâng cao đang dùng seed data trong frontend trong lúc chờ reporting API đầy đủ.
- Linehaul nâng cao và quản lý chuyến xe chi tiết.
- Return block management/chuyển hoàn nâng cao.
- Finance settlement, planning, service quality mở rộng.
- Các function group hoặc placeholder chưa có backend contract hoàn chỉnh.

Trong cấu hình mặc định, các route này hiển thị như module nghiệp vụ chính. Khi cần build gọn theo nhóm core, đặt `VITE_ENABLE_FULL_OPS_MODULES=false`.

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
- Task assignment render task/courier bằng test double và gọi assign mutation.
- Manifest management render danh sách bao và generate bag.
- Tracking lookup render empty/error/success state.

## Trạng Thái Báo Cáo

Ops Web hiện ở mức **MVP production-like cho core operations**, đồng thời giữ đầy đủ các module nghiệp vụ mở rộng trong main UI để tiếp tục hardening lên production. Các luồng lõi đã có API boundary rõ qua gateway `/ops`, session refresh và smoke test. Một số hạng mục vẫn cần hardening tiếp trước production thật: server-side pagination cho list lớn, audit thao tác ops, enforce hub/role scope ở backend/gateway, chuẩn hóa toast/error, dữ liệu thật cho module mở rộng và tối ưu code splitting.
