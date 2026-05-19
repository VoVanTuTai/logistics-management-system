# Kế Hoạch Hoàn Thiện Các Cụm Chức Năng Ops Web

> Mục tiêu: đưa các cụm chức năng đang hiển thị trong Ops Web thành luồng nghiệp vụ production-like nhất có thể, giữ đầy đủ chức năng đang có, không ẩn hoặc hạ nhãn thành prototype, và thay dần các trang landing/placeholder bằng màn thao tác có dữ liệu thật qua gateway/API hiện có.

## 1. Nguyên Tắc Chung

- Không đổi route đã có trong `apps/ops-web/src/navigation/routes.ts`.
- Không đổi auth, permission, role logic, order status logic hoặc validation logic nếu không có yêu cầu riêng.
- Không đổi request payload/response mapping hiện có; nếu thiếu API thì tạo plan/backend contract rõ ràng trước khi sửa service.
- Không bỏ chức năng đã có như chuyển hoàn, tem bao, tem xe, giám sát hàng nhận/hàng đến/hàng gửi/hàng phát.
- Không dùng seed/mock data cho luồng chính nếu có thể suy ra từ shipments, pickups, tasks, manifests, scans, NDR hoặc masterdata.
- Mỗi trang phải có đủ loading, empty, error, success/toast và hub-scope warning khi tài khoản bị giới hạn bưu cục.
- Cụm nào chưa có backend contract thì vẫn giữ trong UI, nhưng trang phải trình bày như chức năng đang hoàn thiện production, có CTA/empty state nghiệp vụ rõ ràng thay vì trang trắng.

## 2. Mức Độ Ưu Tiên

| Ưu tiên | Cụm chức năng | Lý do |
|---|---|---|
| 1 | Kinh doanh bưu cục | Đây là nhóm gần luồng vận hành thật nhất: tạo đơn, hàng gửi, hàng phát, tồn bưu cục, chốt ca, quyết toán thu hộ. |
| 2 | Nền tảng điều hành | Có nhiều chức năng đang dùng hằng ngày: tem bao, chuyển hoàn, giám sát dữ liệu, linehaul. |
| 3 | Nền tảng khách hàng | Cần hoàn thiện tra cứu và giám sát đơn đã tạo để nối từ khách hàng sang điều phối. |
| 4 | Quản lý vận chuyển | Tem xe/chuyến xe đã có API manifest, cần nắn chắc dữ liệu và thao tác production. |
| 5 | Chỉ số vận hành | Cần biến các chỉ số từ placeholder thành dashboard dựa trên dữ liệu thật. |
| 6 | Chất lượng dịch vụ | Cần monitor cảnh báo chủ động từ inbound/delivered/NDR/SLA. |
| 7 | Quyết toán tài chính | Cần tách rõ quyết toán cấp bưu cục và quyết toán tổng/công nợ. |
| 8 | Dịch vụ tích hợp | Cụm này phụ thuộc backend integration log/config, nên làm sau khi core ổn định. |

## 3. Cụm Nền Tảng Điều Hành

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Tem bao nhiệt | Có trang quản lý/in tem | Cần shared confirm modal, lịch sử in, batch action, trạng thái lỗi rõ hơn. |
| Chuyển hoàn | Có đăng ký và quản lý | Quản lý vẫn còn seed data; đăng ký mới dừng ở toast, cần nối NDR/return decision thật. |
| Giám sát hàng đến/hàng gửi/hàng phát | Có trang dùng shipments API | Cần chuẩn hóa filter ngày, bưu cục, trạng thái và pagination. |
| Giám sát hàng nhận | Trang tồn tại nhưng dữ liệu trống | Cần lấy từ pickup/inbound scans hoặc shipments đã nhận. |
| 2in1, theo dõi tạm ứng, giám sát đóng bao | Có route/page nhưng còn landing | Cần biến thành bảng nghiệp vụ có dữ liệu từ scans/manifests/tasks. |

### Mục tiêu production

- Tem bao, chuyển hoàn và giám sát dữ liệu phải là luồng chính, không còn cảm giác demo.
- Chuyển hoàn phải nối được từ NDR/failed delivery sang return registration, quản lý theo trạng thái, có thao tác xác nhận/chốt.
- Giám sát dữ liệu phải dùng cùng filter/pagination, có drill-down tới vận đơn/manifest/task khi có dữ liệu.

### Prompt vibe coding

```text
Bạn đang làm trong repo logistics-management-system. Hãy hoàn thiện cụm "Nền tảng điều hành" của Ops Web theo hướng production-like, giữ nguyên routes và không bỏ chức năng hiện có.

Phạm vi chính:
- apps/ops-web/src/pages/function-groups/operations-platform/thermal-label/**
- apps/ops-web/src/pages/function-groups/operations-platform/return-block/**
- apps/ops-web/src/pages/function-groups/operations-platform/data-monitoring/**
- apps/ops-web/src/pages/function-groups/operations-platform/linehaul/**
- apps/ops-web/src/app/AppRouter.tsx nếu cần nối page mới vào route đã có.

Yêu cầu:
1. Không đổi API service file trừ khi thật sự cần type/client nhỏ để dùng endpoint đã tồn tại.
2. Giữ các chức năng: tem bao, chuyển hoàn, hàng nhận, hàng đến, hàng gửi, hàng phát, 2in1, tạm ứng, đóng bao.
3. Thay dữ liệu seed của chuyển hoàn bằng dữ liệu từ NDR/shipments/tasks nếu có thể. Nếu backend chưa có endpoint return-block, tạo adapter frontend đọc từ NDR failed/return decision và ghi chú TODO contract ngắn trong code.
4. Hoàn thiện `MonitorDataHangNhanPage` để có dữ liệu thật từ pickup/inbound scan hoặc shipments đang ở trạng thái nhận.
5. Biến các trang 2in1, tạm ứng, đóng bao từ landing thành bảng nghiệp vụ có filter ngày, hub, trạng thái, empty/error/loading rõ ràng.
6. Tem bao phải có modal xác nhận dùng chung nếu đã có shared confirm; không dùng popup browser.
7. Mọi bảng có pagination client hoặc server-side phù hợp, không render list dài không giới hạn.
8. Giao diện phải rõ ràng, không lộn xộn: header ngắn, KPI 3-4 thẻ, filter một hàng, bảng chính, action phụ gọn.

Không làm:
- Không đổi route.
- Không xóa bất kỳ chức năng nào khỏi sidebar/menu.
- Không gọi trực tiếp service nội bộ nếu chuẩn hiện tại đi qua gateway `/ops/*`.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): harden operations platform function group
```

### Tiêu chí đạt

- Không còn trang trống cho hàng nhận/2in1/tạm ứng/đóng bao.
- Chuyển hoàn có danh sách phát sinh từ dữ liệu nghiệp vụ thật hoặc contract rõ ràng.
- Tem bao, tem xe, đóng bao và giám sát dữ liệu vẫn hiện đầy đủ trong menu.

## 4. Cụm Dịch Vụ Tích Hợp

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Trang cụm dịch vụ tích hợp | Landing page | Chưa có danh sách tích hợp, trạng thái kết nối, log đồng bộ, retry lỗi. |

### Mục tiêu production

- Có dashboard cấu hình/trạng thái tích hợp: đối tác, kênh, trạng thái, lần đồng bộ cuối, số lỗi, thao tác retry.
- Nếu backend chưa có integration log, frontend cần dùng contract giả lập rõ ở tầng plan, không trình bày là dữ liệu thật.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Dịch vụ tích hợp" của Ops Web thành trang production-like có cấu trúc rõ ràng.

Phạm vi:
- apps/ops-web/src/pages/function-groups/integration-services/IntegrationServicesGroupPage.tsx
- CSS cùng thư mục nếu cần.
- Chỉ thêm client/type mới nếu đã có endpoint gateway phù hợp.

Yêu cầu:
1. Không đổi route `routePaths.groupIntegrationServices`.
2. Thiết kế trang gồm:
   - KPI trạng thái tích hợp.
   - Bảng kênh tích hợp: tên, loại, trạng thái, lần đồng bộ cuối, lỗi gần nhất.
   - Bảng log đồng bộ gần đây hoặc empty state nếu chưa có endpoint.
   - CTA retry/reconnect ở trạng thái disabled nếu chưa có backend contract.
3. Nếu chưa có API thật, không dùng dữ liệu seed làm như thật. Hiển thị empty state "Chưa có integration log từ backend" và ghi rõ backend contract cần bổ sung trong file docs hoặc comment ngắn.
4. UI phải đồng bộ Ops Web, không tạo landing marketing.

Kiểm chứng:
cd apps/ops-web
npm run build

Commit gợi ý:
feat(ops-web): structure integration services operations page
```

### Tiêu chí đạt

- Cụm này không còn chỉ là landing chung.
- Người dùng thấy rõ backend còn thiếu gì để lên production.

## 5. Cụm Nền Tảng Khách Hàng

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Điều phối đơn đặt | Có trang thật, dùng pickup/task/shipment/hub | Cần nắn pagination, scope, error và action state. |
| Tra cứu đơn đặt | Route có nhưng còn landing | Cần lookup theo mã đơn/SĐT/khách hàng nếu API hỗ trợ. |
| Giám sát đơn đã tạo | Route có nhưng còn landing | Cần dashboard đơn mới tạo/chờ lấy/chưa điều phối/quá SLA. |

### Mục tiêu production

- Luồng khách hàng tạo đơn -> ops điều phối pickup -> courier lấy hàng -> theo dõi đơn được nối rõ.
- Tra cứu và giám sát dùng dữ liệu thật, không chỉ điều hướng sang màn core.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Nền tảng khách hàng" trong Ops Web.

Phạm vi:
- apps/ops-web/src/pages/function-groups/customer-platform/**
- apps/ops-web/src/features/pickups/**
- apps/ops-web/src/features/shipments/**
- apps/ops-web/src/features/tasks/**
- apps/ops-web/src/app/AppRouter.tsx nếu cần nối page mới vào routes hiện có.

Yêu cầu:
1. Giữ nguyên các route:
   - dieu-phoi
   - tra-cuu-don-dat
   - giam-sat-don-da-tao
2. `CustomerOrderDispatchPage` phải giữ behavior hiện có, chỉ nắn UI, pagination/filter, loading/error/action state.
3. Thêm page tra cứu đơn đặt:
   - Tìm theo mã đơn, mã pickup, SĐT hoặc tên khách nếu dữ liệu có.
   - Kết quả có trạng thái, hub, courier, thời gian tạo, link sang shipment/pickup detail.
4. Thêm page giám sát đơn đã tạo:
   - KPI đơn mới, chờ duyệt, đã điều phối, quá SLA.
   - Bảng đơn theo hub/courier/trạng thái.
   - Empty state khi không có dữ liệu.
5. Không đổi payload gọi API.
6. Không tạo dữ liệu giả; nếu endpoint thiếu field thì degrade gracefully.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): complete customer platform order monitoring
```

### Tiêu chí đạt

- Ba route trong cụm đều có màn nghiệp vụ thật.
- Điều phối, tra cứu và giám sát có cùng ngôn ngữ trạng thái và cùng hub scope.

## 6. Cụm Kinh Doanh Bưu Cục

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Tổng quan đơn tại bưu cục | Có dữ liệu từ shipments/tasks/hubs | Cần drill-down và filter chuẩn hơn. |
| Quản lý đơn tại bưu cục | Có trang thật | Cần pagination/action state. |
| Phát hàng | Có dispatch courier | Cần chốt bàn giao, in danh sách, audit action. |
| Đơn tồn bưu cục | Route còn placeholder | Cần màn inventory theo tuổi tồn và hub. |
| Chốt ca | Route còn placeholder | Cần tổng hợp đơn nhận/gửi/phát/tồn/COD trong ca. |
| Thêm mới vận đơn | Có tạo shipment | Cần harden validation UI, error mapping, success next action. |
| Quản lý vận đơn gửi/phát | Có trang thật | Cần pagination/filter và drill-down. |
| Quyết toán thu hộ | Đã có trang thống kê COD hằng ngày theo courier | Cần đối soát nộp tiền, export/in biên bản nếu backend hỗ trợ. |
| Đối soát công nợ | Route còn placeholder | Cần bảng công nợ theo khách hàng/bưu cục/kỳ đối soát. |

### Mục tiêu production

- Đây là cụm nên hoàn thiện trước vì sát demo vận hành tại bưu cục nhất.
- Màn COD phải thống kê tiền hàng hằng ngày của courier thuộc bưu cục, có filter ngày/hub/courier và detail vận đơn.
- Chốt ca phải gom được doanh thu/COD/tồn/scan trong ca, không chỉ là nút giả.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Kinh doanh bưu cục" của Ops Web theo production-like.

Phạm vi:
- apps/ops-web/src/pages/function-groups/branch-business/**
- apps/ops-web/src/features/shipments/**
- apps/ops-web/src/features/tasks/**
- apps/ops-web/src/features/pickups/**
- apps/ops-web/src/features/scans/**
- apps/ops-web/src/app/AppRouter.tsx nếu cần thay placeholder bằng page mới.

Yêu cầu:
1. Giữ đầy đủ route/chức năng hiện có trong `routePaths`:
   - tong-quan
   - quan-ly-don-tai-buu-cuc
   - phat-hang
   - don-ton-buu-cuc
   - chot-ca
   - them-moi-van-don
   - quan-ly-van-don-gui
   - quan-ly-van-don-phat
   - quyet-toan-thu-ho
   - doi-soat-cong-no
2. Thay placeholder `don-ton-buu-cuc` bằng page inventory:
   - KPI tổng tồn, tồn quá SLA, tồn theo trạng thái, tồn theo courier/hub.
   - Bảng vận đơn tồn có tuổi tồn, trạng thái, hub, courier, link chi tiết.
3. Thay placeholder `chot-ca` bằng page shift closing:
   - Chọn ngày/ca/hub.
   - Tổng hợp đơn nhận, đơn gửi, đơn phát, đơn tồn, COD phải thu, COD đã giao.
   - Danh sách ngoại lệ cần xử lý trước khi chốt.
   - Nếu chưa có endpoint chốt ca, chỉ cho preview và ghi rõ "chưa có API ghi nhận chốt ca".
4. Hoàn thiện `quyet-toan-thu-ho`:
   - Thống kê tiền hàng hằng ngày của courier thuộc bưu cục.
   - Có trạng thái đã nộp/chưa nộp nếu dữ liệu có; nếu chưa có backend thì chỉ hiển thị số phải thu từ đơn delivered.
   - Có bảng chi tiết vận đơn COD.
5. Thay placeholder `doi-soat-cong-no` bằng page đối soát:
   - Theo khách hàng/bưu cục/kỳ.
   - Tổng COD, phí, công nợ, chênh lệch.
   - Empty state nếu chưa có endpoint finance.
6. Không đổi logic trạng thái đơn hàng.
7. Không xóa các màn đã có; chỉ nắn UI và nối dữ liệu thêm.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): complete branch business workflows
```

### Tiêu chí đạt

- Không còn placeholder trong các route quan trọng của bưu cục.
- Cụm này có thể demo một ngày vận hành tại bưu cục từ tạo đơn tới phát hàng và quyết toán COD.

## 7. Cụm Quyết Toán Tài Chính

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Cụm quyết toán tài chính cấp tổng | Landing page | Chưa có dashboard tổng hợp COD, phí, công nợ, đối soát kỳ. |
| Quyết toán thu hộ tại bưu cục | Đã có trong cụm bưu cục | Cần tích hợp vào góc nhìn tổng nếu cần. |

### Mục tiêu production

- Phân biệt rõ:
  - Quyết toán tại bưu cục: courier nộp COD trong ngày.
  - Quyết toán tài chính tổng: đối soát COD/phí/công nợ theo khách hàng, bưu cục, kỳ.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Quyết toán tài chính" cấp tổng của Ops Web.

Phạm vi:
- apps/ops-web/src/pages/function-groups/finance-settlement/FinanceSettlementGroupPage.tsx
- Có thể thêm page/component con trong cùng thư mục.
- Chỉ thêm API client nếu đã có endpoint finance/reporting qua gateway.

Yêu cầu:
1. Không trộn lẫn với route quyết toán thu hộ tại bưu cục; route bưu cục vẫn giữ nguyên.
2. Trang tổng phải có:
   - KPI COD phải thu, COD đã đối soát, phí dịch vụ, công nợ còn lại.
   - Filter kỳ/ngày, bưu cục, khách hàng.
   - Bảng đối soát theo khách hàng hoặc bưu cục.
   - Bảng ngoại lệ/chênh lệch.
3. Nếu chưa có finance API thật, derive số liệu đọc-only từ shipments delivered/COD và hiển thị empty state cho phần đối soát ghi nhận.
4. Không dùng seed data làm báo cáo tài chính thật.
5. UI dùng kiểu dashboard vận hành, không landing giới thiệu.

Kiểm chứng:
cd apps/ops-web
npm run build

Commit gợi ý:
feat(ops-web): add finance settlement operations dashboard
```

### Tiêu chí đạt

- Người dùng phân biệt được quyết toán bưu cục và quyết toán tổng.
- Không có số liệu tài chính giả được trình bày như dữ liệu thật.

## 8. Cụm Quản Lý Vận Chuyển

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Quản lý chuyến xe | Có trang linehaul trip dùng manifest API | Cần filter, pagination, state lỗi và chi tiết chuyến. |
| Tem xe | Có trang vehicle seal | Cần in/preview/batch và lịch sử seal. |

### Mục tiêu production

- Quản lý vận chuyển phải cho thấy chuyến xe, bao/manifest trên xe, seal, tuyến, hub đi/đến, trạng thái giao nhận.
- Nếu chưa có domain linehaul riêng, dùng manifest làm nguồn dữ liệu chính và ghi rõ giới hạn.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Quản lý vận chuyển" của Ops Web.

Phạm vi:
- apps/ops-web/src/pages/function-groups/operations-platform/linehaul/**
- apps/ops-web/src/pages/function-groups/capability-platform/CapabilityPlatformGroupPage.tsx
- apps/ops-web/src/navigation/routes.ts chỉ đọc, không đổi route.

Yêu cầu:
1. Giữ các route:
   - quan-ly-chuyen-xe
   - tem-xe
2. `LinehaulTripManagementPage` phải hiển thị:
   - KPI chuyến/manifest đang mở, đã seal, đã receive, lỗi quá hạn.
   - Filter hub đi/hub đến/ngày/trạng thái.
   - Bảng manifest/chuyến có link chi tiết.
3. `LinehaulVehicleSealPage` phải hỗ trợ:
   - Chọn manifest/chuyến cần in tem xe.
   - Preview tem xe rõ mã seal, hub đi/đến, số bao/kiện.
   - Trạng thái không đủ dữ liệu thì disable action và báo lý do.
4. Không quay lại seed data nếu API manifest trả rỗng; dùng empty state.
5. Nếu thiếu route detail chuyến, link sang manifest detail hiện có.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): harden linehaul transport workflows
```

### Tiêu chí đạt

- Tem xe và chuyến xe vẫn là chức năng chính, không bị ẩn.
- Dữ liệu rỗng được xử lý bằng empty state, không fallback sang seed.

## 9. Cụm Chỉ Số Vận Hành

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Giám sát tồn kho | Có page dùng shipments | Cần nắn drill-down, SLA aging, pagination. |
| Kiện bất thường, thời hiệu, quy hoạch, thao tác | Nhiều route còn placeholder | Cần dashboard con theo từng nhóm chỉ số. |
| Analytics dashboard | Có seed data | Cần thay bằng API/reporting hoặc phân định rõ seed nếu chưa có. |

### Mục tiêu production

- Cụm này nên trở thành dashboard điều hành: KPI, cảnh báo, danh sách ngoại lệ, drill-down.
- Ưu tiên các chỉ số có thể suy ra từ dữ liệu hiện có: tồn kho, quá SLA, leadtime, tỷ lệ pickup đúng giờ, tỷ lệ phát đúng hạn.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Chỉ số vận hành" của Ops Web theo hướng dashboard production-like.

Phạm vi:
- apps/ops-web/src/pages/function-groups/operations-metrics/**
- apps/ops-web/src/pages/dashboard/analytics/**
- apps/ops-web/src/features/shipments/**
- apps/ops-web/src/features/tasks/**
- apps/ops-web/src/features/manifests/**
- apps/ops-web/src/features/ndr/**

Yêu cầu:
1. Giữ toàn bộ routes chỉ số hiện có; không ẩn route nào.
2. Hoàn thiện trước các route có thể derive từ dữ liệu thật:
   - giam-sat-ton-kho
   - giam-sat-thoi-hieu-hang-phat
   - giam-sat-leadtime-phat
   - he-thong-canh-bao-qua-han
3. Mỗi page có:
   - KPI 3-4 chỉ số.
   - Filter ngày/hub/trạng thái.
   - Bảng danh sách vận đơn/task/manifest gây ra chỉ số.
   - Link drill-down sang detail.
4. Analytics seed data phải được thay bằng dữ liệu derive thật nếu có thể. Nếu chưa thể, đổi wording thành "dữ liệu tham chiếu" trong docs, không trình bày là production.
5. Không đổi logic trạng thái đơn hàng.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): expand operations metrics dashboards
```

### Tiêu chí đạt

- Các chỉ số quan trọng không còn là trang placeholder.
- Dashboard có thể giải thích được số liệu đến từ shipments/tasks/manifests/NDR nào.

## 10. Cụm Chất Lượng Dịch Vụ

### Trạng thái hiện tại

| Chức năng | Mức hiện tại | Việc còn thiếu |
|---|---|---|
| Giám sát hàng nhận | Có route/page | Cần nối chỉ số nhận hàng, pickup/inbound SLA, ngoại lệ. |
| Giám sát hàng phát | Có route/page | Cần nối delivered/NDR/failed delivery, SLA phát. |
| Các mảng CSKH/khiếu nại/chênh lệch cân nặng | Chưa có page chính trong scope hiện tại | Cần backend contract nếu muốn production thật. |

### Mục tiêu production

- Biến chất lượng dịch vụ thành nơi phát hiện chủ động vấn đề: hàng nhận trễ, hàng phát trễ, giao thất bại, NDR quá hạn.
- Không chỉ hiển thị trang landing.

### Prompt vibe coding

```text
Hãy hoàn thiện cụm "Chất lượng dịch vụ" của Ops Web.

Phạm vi:
- apps/ops-web/src/pages/function-groups/service-quality/**
- apps/ops-web/src/features/shipments/**
- apps/ops-web/src/features/tasks/**
- apps/ops-web/src/features/ndr/**

Yêu cầu:
1. Giữ routes:
   - serviceQualityProactiveInbound
   - serviceQualityProactiveDelivered
2. Page giám sát hàng nhận phải có:
   - KPI nhận đúng hạn, nhận trễ, chờ pickup, inbound ngoại lệ.
   - Bảng vận đơn/pickup có tuổi xử lý và hub.
3. Page giám sát hàng phát phải có:
   - KPI phát đúng hạn, phát trễ, NDR, giao thất bại.
   - Bảng vận đơn có trạng thái, courier, hub, lần giao gần nhất.
4. Có filter ngày, hub, courier, trạng thái.
5. Có link sang shipment/task/NDR detail khi có id.
6. Không dùng seed data. Nếu thiếu endpoint, derive từ dữ liệu shipment/task/NDR hiện có.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
feat(ops-web): complete proactive service quality monitors
```

### Tiêu chí đạt

- Có thể demo cảnh báo chất lượng dịch vụ từ dữ liệu vận hành thật.
- Hàng nhận và hàng phát có filter, KPI, bảng ngoại lệ và drill-down.

## 11. Checklist Cross-Cutting Cho Mọi Cụm

- `rg "mock|prototype|coming soon|placeholder|seed" apps/ops-web/src/pages/function-groups` sau mỗi wave để biết còn gì cần dọn. Không cần xóa mọi từ nếu nó nằm trong docs/comment đúng nghĩa, nhưng không để UI chính gọi chức năng là prototype.
- Mọi route đã có trong `routePaths` phải render được khi `VITE_ENABLE_FULL_OPS_MODULES=true`.
- Không còn bảng dùng `rows = []` cố định cho chức năng chính.
- Không còn fallback seed data cho màn production nếu API trả rỗng.
- Mọi page có ít nhất: loading, error, empty, content, filter reset.
- Action nguy hiểm dùng shared confirm modal, không dùng popup browser.
- Khi backend thiếu contract ghi nhận/chốt, UI chỉ cho preview/read-only hoặc disabled action có lý do rõ ràng.
- Sau mỗi wave chạy ít nhất:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

- Nếu sửa gateway/service, chạy thêm:

```bash
cd services/gateway-bff && npm run build
cd services/dispatch-service && npm run build
cd services/scan-service && npm run build
cd services/manifest-service && npm run build
cd services/delivery-service && npm run build
```

## 12. Prompt Tổng Để Chạy Theo Từng Wave

```text
Bạn đang trong repo logistics-management-system. Đọc:
- docs/workflow-polishing/09-ops-web-function-groups-completion-plan.md
- docs/workflow-polishing/08-ops-web-production-hardening-execution-plan.md
- apps/ops-web/src/navigation/routes.ts
- apps/ops-web/src/app/AppRouter.tsx

Hãy thực hiện đúng một cụm chức năng theo kế hoạch, không làm lan sang cụm khác.

Nguyên tắc bắt buộc:
- Giữ nguyên route.
- Không bỏ/ẩn chức năng đang có.
- Không đổi API payload/response mapping nếu không cần.
- Không dùng seed/mock data cho màn production.
- Giữ loading/empty/error/success state.
- UI rõ ràng: header, KPI, filter, bảng chính, action có trạng thái.

Cụm cần làm lần này: <điền tên cụm>

Trước khi sửa:
1. Rà page hiện tại của cụm đó.
2. Rà client/hook API hiện có có thể dùng.
3. Nêu kế hoạch nhỏ 3-5 bước.

Sau khi sửa:
1. Chạy `TMPDIR=/tmp npm run test:smoke` trong `apps/ops-web`.
2. Chạy `npm run build` trong `apps/ops-web`.
3. Báo cáo file đã sửa, chức năng đã hoàn thiện, phần còn cần backend contract nếu có.
```
