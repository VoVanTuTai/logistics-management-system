# Kế Hoạch Đưa Ops Web Gần Production

> **Mục tiêu:** Nâng `apps/ops-web` từ mức đủ demo đồ án lên mức gần production hơn: session ổn định, test được, tách rõ phần thật/prototype, giảm mock, enforce scope/role rõ hơn và có tài liệu báo cáo.

## 1. Đánh Giá Hiện Trạng

`ops-web` hiện đã đủ để báo cáo nếu trình bày là **Ops Web MVP cho các luồng vận hành lõi**.

Các luồng đã có API thật qua gateway:

- Dashboard KPI vận hành.
- Quản lý vận đơn và tạo đơn tại quầy.
- Pickup approval.
- Task assign/reassign.
- Manifest/bag create, seal, receive.
- Hub scan inbound/outbound/pickup.
- NDR handling.
- Tracking lookup.
- Masterdata hub/zone/config/NDR reason.

Các điểm chưa gần production:

- Session refresh còn TODO.
- Chưa có smoke test/E2E riêng cho `ops-web`.
- README còn cũ, chưa phản ánh trạng thái hiện tại.
- Một số function group vẫn là mock/placeholder.
- Một số màn dùng `window.alert`.
- Một số list có nguy cơ load toàn bộ rồi filter client.
- Chưa có audit rõ cho thao tác ops.
- Chưa enforce hub/role scope đầy đủ ở gateway/backend.

## 2. Thứ Tự Ưu Tiên

| Ưu tiên | Hạng mục | Lý do | Kết quả cần có |
|---|---|---|---|
| P0 | Session refresh | Demo dài dễ hết hạn token | Tự refresh, retry 401, logout rõ |
| P0 | Smoke test ops-web | Có bằng chứng kỹ thuật khi báo cáo | `npm run test:smoke` pass |
| P0 | Tách prototype khỏi luồng demo | Tránh bị hỏi vì mock/placeholder | Route/menu ghi rõ prototype hoặc ẩn bằng env |
| P0 | Cập nhật README/report | Báo cáo rõ phần thật/phần demo | Có tài liệu production readiness |
| P1 | Bỏ `alert`, chuẩn hóa toast/error | UX gần sản phẩm thật hơn | Error/loading/empty state thống nhất |
| P1 | Server-side pagination/filter | Tránh lỗi dữ liệu lớn | Shipment/task/manifest/NDR list dùng pagination |
| P1 | Enforce hub/role scope | Không chỉ filter ở frontend | Gateway/backend chặn truy cập ngoài phạm vi |
| P1 | Audit ops actions | Truy vết thao tác vận hành | Ghi actor/action/target/timestamp |
| P2 | Realtime hardening | Task realtime ổn định hơn | reconnect/backoff/fallback polling |
| P2 | Performance/code splitting | Build đang warning chunk lớn | Lazy-load thêm function group lớn |

## 3. Wave 1 - Session Refresh Cho Ops Web

**Mục tiêu:** `ops-web` xử lý token hết hạn giống `admin-web`.

**Phạm vi file:**

- `apps/ops-web/src/features/auth/auth.session.ts`
- `apps/ops-web/src/features/auth/auth.client.ts`
- `apps/ops-web/src/services/api/client.ts`
- `apps/ops-web/src/services/api/types.ts`
- `apps/ops-web/src/store/authStore.ts` nếu cần

**Không sửa:**

- Business pages.
- Backend.
- Courier/admin app.

**Prompt dùng để vibe coding:**

```text
Bạn đang làm trong repo logistics-management-system. Hãy làm Wave 1: session refresh cho apps/ops-web.

Mục tiêu:
- Ops web tự refresh access token khi gần hết hạn.
- Nếu API trả 401, thử refresh một lần rồi retry request.
- Nếu refresh fail, clear session và đưa user về login.
- Tránh race condition: nhiều request cùng lúc chỉ refresh một lần.

Phạm vi được sửa:
- apps/ops-web/src/features/auth/auth.session.ts
- apps/ops-web/src/features/auth/auth.client.ts
- apps/ops-web/src/services/api/client.ts
- apps/ops-web/src/services/api/types.ts
- apps/ops-web/src/store/authStore.ts nếu thật sự cần.

Yêu cầu:
1. Đọc cách admin-web đã làm session refresh và áp dụng pattern tương tự cho ops-web.
2. Không phá contract login/logout hiện tại.
3. Thêm option skipAuthRefresh để tránh refresh loop cho refresh/logout endpoint.
4. Khi hydrate session, nếu refresh token hết hạn thì clear session.
5. Text lỗi tiếng Việt rõ ràng.
6. Chạy:
   cd apps/ops-web
   npm run build

Commit gợi ý:
feat(ops-web): refresh ops sessions automatically
```

**Tiêu chí xong:**

- Access token hết hạn không làm app trắng màn hình.
- Refresh fail thì logout rõ ràng.
- `npm run build` pass.

## 4. Wave 2 - Smoke Tests Cho Ops Web

**Mục tiêu:** Có test nhanh chứng minh các luồng ops core không bị vỡ.

**Phạm vi file:**

- `apps/ops-web/package.json`
- `apps/ops-web/vitest.config.ts`
- `apps/ops-web/src/test/setup.ts`
- `apps/ops-web/src/__tests__/ops-smoke.test.tsx`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 2: thêm smoke tests cho apps/ops-web.

Phạm vi được sửa:
- apps/ops-web/package.json
- apps/ops-web/vitest.config.ts
- apps/ops-web/src/test/setup.ts
- apps/ops-web/src/__tests__/ops-smoke.test.tsx
- Chỉ sửa feature code nếu test phát hiện bug nhỏ cần fix.

Yêu cầu:
1. Dùng Vitest + Testing Library giống admin-web nếu phù hợp.
2. Thêm script npm run test:smoke.
3. Mock API hook/client gọn, không cần database thật.
4. Test tối thiểu:
   - Chưa login thì bị redirect về login.
   - Dashboard render KPI shell.
   - Shipment list hoặc create shipment form render và validate field bắt buộc.
   - Task assignment render courier/task list mock và gọi assign mutation.
   - Manifest management render danh sách bao và action create/generate bag.
   - Tracking lookup render empty/error/success state.
5. Chạy:
   cd apps/ops-web
   TMPDIR=/tmp npm run test:smoke
   npm run build

Commit gợi ý:
test(ops-web): add smoke coverage for core workflows
```

**Tiêu chí xong:**

- Có test lặp lại được.
- Test fail khi route guard hoặc luồng core bị vỡ.
- `test:smoke` và `build` pass.

## 5. Wave 3 - Tách Rõ Prototype Route Và Demo Route

**Mục tiêu:** Không để người demo hoặc hội đồng hiểu nhầm các màn mock là chức năng production.

**Phạm vi file:**

- `apps/ops-web/src/app/AppRouter.tsx`
- `apps/ops-web/src/navigation/routes.ts`
- `apps/ops-web/src/pages/shared/ComingSoonPlaceholder.tsx`
- `apps/ops-web/src/utils/env.ts`
- Các group page/menu nếu đang expose route prototype

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 3: tách rõ prototype routes khỏi demo production routes trong ops-web.

Mục tiêu:
- Route dùng mock/placeholder phải có nhãn rõ Prototype hoặc Coming Soon.
- Có env flag, ví dụ VITE_SHOW_OPS_PROTOTYPE_ROUTES.
- Mặc định demo/production: false.
- Khi false, menu demo chỉ hiện các module core đã nối API thật.
- Khi true, vẫn xem được prototype route để trình bày định hướng mở rộng.

Phạm vi được sửa:
- apps/ops-web/src/app/AppRouter.tsx
- apps/ops-web/src/navigation/routes.ts
- apps/ops-web/src/pages/shared/ComingSoonPlaceholder.tsx
- apps/ops-web/src/utils/env.ts
- apps/ops-web/.env.example

Yêu cầu:
1. Liệt kê route nào là core/API thật và route nào là prototype/mock.
2. Không xóa prototype page, chỉ ẩn khỏi menu demo hoặc gắn badge rõ.
3. Các page mock như Analytics, ReturnBlockManagement, LinehaulTripManagement phải có label rõ nếu còn hiển thị.
4. Không làm mất route core: dashboard, shipments, pickups, tasks, manifests, scans, NDR, tracking, masterdata.
5. Chạy:
   cd apps/ops-web
   npm run build

Commit gợi ý:
feat(ops-web): mark prototype routes explicitly
```

**Tiêu chí xong:**

- Demo menu không lẫn prototype nếu flag tắt.
- Prototype route không bị trình bày nhầm là đã production.

## 6. Wave 4 - Cập Nhật README Và Viết Ops Web Report

**Mục tiêu:** Có tài liệu báo cáo rõ: phần nào đã production-like, phần nào prototype.

**Phạm vi file:**

- `apps/ops-web/README.md`
- `docs/ops-web-production-readiness-report.md` hoặc `docs/workflow-polishing/06-ops-web-production-readiness-plan.md`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 4: cập nhật tài liệu báo cáo cho ops-web.

Phạm vi được sửa:
- apps/ops-web/README.md
- docs/ops-web-production-readiness-report.md nếu cần tạo mới.

Yêu cầu:
1. README không được còn nội dung cũ kiểu package.json/vite/tsconfig empty.
2. Ghi rõ cách chạy:
   - npm run dev
   - npm run build
   - npm run test:smoke nếu Wave 2 đã có
3. Ghi rõ API boundary: frontend chỉ gọi gateway /ops.
4. Ghi rõ module core đã nối API thật:
   dashboard, shipments, pickups, tasks, manifests, scans, NDR, tracking, masterdata.
5. Ghi rõ module prototype/mock:
   analytics nâng cao, linehaul nâng cao, return block management, finance/planning nếu chưa có backend.
6. Thêm demo script đề xuất:
   login -> dashboard -> tạo vận đơn -> pickup/inbound scan -> assign task -> manifest seal -> tracking/NDR.
7. Viết văn phong báo cáo đồ án, súc tích.

Commit gợi ý:
docs(ops-web): document production readiness scope
```

**Tiêu chí xong:**

- Người đọc biết phần nào thật, phần nào minh họa.
- README có thể dùng để chuẩn bị demo.

## 7. Wave 5 - Chuẩn Hóa Error/Toast Và Bỏ `window.alert`

**Mục tiêu:** UX gần production, không dùng alert thô cho thao tác nghiệp vụ.

**Phạm vi file:**

- `apps/ops-web/src/store/uiStore.ts`
- `apps/ops-web/src/app/AppShell.tsx`
- Các page đang dùng `window.alert` hoặc `alert`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 5: chuẩn hóa toast/error state cho ops-web và bỏ window.alert trong các luồng demo.

Phạm vi được sửa:
- apps/ops-web/src/store/uiStore.ts
- apps/ops-web/src/app/AppShell.tsx
- Các page có alert:
  - ShipmentListPage.tsx
  - ThermalLabelPrintPage.tsx
  - ReturnBlockRegistrationPage.tsx
  - LinehaulTripManagementPage.tsx
  - AnalyticsDashboardPage.tsx nếu còn click action.

Yêu cầu:
1. Tạo toast/banner dùng chung nếu chưa có.
2. Thay window.alert bằng toast hoặc inline notice.
3. Error/loading/empty state dùng text tiếng Việt có dấu.
4. Không refactor UI lớn ngoài phạm vi thông báo.
5. Chạy:
   cd apps/ops-web
   npm run build

Commit gợi ý:
fix(ops-web): replace alerts with consistent notifications
```

**Tiêu chí xong:**

- Các demo flow chính không còn popup alert thô.
- Thông báo lỗi/thành công thống nhất.

## 8. Wave 6 - Server-Side Pagination Và Filter Cho List Lớn

**Mục tiêu:** Các màn list không load toàn bộ dữ liệu khi dữ liệu lớn.

**Phạm vi ưu tiên:**

- `apps/ops-web/src/features/shipments/*`
- `apps/ops-web/src/features/tasks/*`
- `apps/ops-web/src/features/manifests/*`
- `apps/ops-web/src/features/ndr/*`
- Backend/gateway service tương ứng nếu API chưa hỗ trợ pagination

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 6: server-side pagination/filter cho các list lớn trong ops-web.

Ưu tiên làm từng màn, không làm tất cả một lúc.

Màn đầu tiên đề xuất:
- ShipmentListPage.

Phạm vi được sửa cho shipment:
- apps/ops-web/src/features/shipments/shipments.types.ts
- apps/ops-web/src/features/shipments/shipments.client.ts
- apps/ops-web/src/features/shipments/shipments.hooks.ts
- apps/ops-web/src/pages/shipments/ShipmentListPage.tsx
- services/gateway-bff hoặc shipment-service nếu API chưa hỗ trợ limit/offset.

Yêu cầu:
1. API nhận filter: status, shipmentCode/q, hub scope nếu có, limit, offset.
2. Response chuẩn: { items, pageInfo: { hasNextPage, total } }.
3. UI có page size, next/prev, loading state.
4. Không tự filter toàn bộ client nếu backend đã hỗ trợ.
5. Giữ tương thích nếu backend cũ còn trả array bằng normalize fallback.
6. Chạy build app/service liên quan.

Commit gợi ý:
feat(ops-web): paginate shipment list server side
```

**Tiêu chí xong:**

- List lớn không tải toàn bộ.
- Có page info rõ.

## 9. Wave 7 - Enforce Hub/Role Scope Ở Gateway/Backend

**Mục tiêu:** Không chỉ frontend filter theo hub; backend/gateway phải chặn truy cập ngoài phạm vi.

**Phạm vi file:**

- `services/gateway-bff/src/common/guards/*`
- `services/gateway-bff/src/api/ops/**`
- `services/auth-service` nếu cần introspect role/hub
- Các service nghiệp vụ nếu cần check owner/scope

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 7: enforce hub/role scope cho ops actions ở gateway/backend.

Mục tiêu:
- OPS user chỉ thao tác dữ liệu thuộc hub được gán.
- SYSTEM_ADMIN có thể xem toàn hệ thống.
- Không phụ thuộc vào frontend filter.

Phạm vi được sửa:
- services/gateway-bff/src/common/guards/*
- services/gateway-bff/src/api/ops/**
- services/gateway-bff/src/infrastructure/clients/auth-service.client.ts
- Service nghiệp vụ liên quan nếu cần truyền actor/hub context.

Yêu cầu:
1. Đọc auth session/introspect response hiện có để lấy user roles và hubCodes.
2. Áp dụng trước cho các action rủi ro:
   - assign/reassign task
   - shipment scan
   - manifest seal/receive
   - NDR decision
3. Nếu thiếu hub context trong payload, trả lỗi rõ thay vì cho qua.
4. Default deny nếu không xác định được quyền.
5. Chạy:
   cd services/gateway-bff && npm run build
   build service liên quan nếu sửa.

Commit gợi ý:
feat(ops): enforce hub scope for ops actions
```

**Tiêu chí xong:**

- User ngoài hub không bypass được bằng API call.
- Có lỗi rõ khi scope không hợp lệ.

## 10. Wave 8 - Audit Ops Actions

**Mục tiêu:** Truy vết thao tác vận hành như scan, assign, seal, NDR decision.

**Phạm vi file:**

- `dispatch-service`
- `scan-service`
- `manifest-service`
- `delivery-service`
- Có thể thêm audit table theo service hoặc event/audit projection

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 8: audit các thao tác ops quan trọng.

Mục tiêu:
- Ghi lại ai thao tác gì, trên đối tượng nào, trước/sau ra sao và thời điểm nào.

Phạm vi ưu tiên:
- dispatch-service: assign/reassign task.
- scan-service: pickup/inbound/outbound scan.
- manifest-service: add/remove shipment, seal, receive.
- delivery-service: NDR reschedule/return decision.

Yêu cầu:
1. Dùng shape audit thống nhất:
   actorId, actorUsername, action, targetType, targetId, before, after, requestId, ipAddress, userAgent, createdAt.
2. Lấy actor từ gateway headers nếu đã có.
3. Audit failure không làm hỏng action chính.
4. Có read endpoint hoặc ít nhất ghi DB/event rõ để báo cáo.
5. Chạy build/typecheck các service liên quan.

Commit gợi ý:
feat(ops): record audit logs for operations actions
```

**Tiêu chí xong:**

- Có thể trả lời “ai assign task này”, “ai seal bao này”, “ai quét inbound kiện này”.

## 11. Wave 9 - Realtime Hardening

**Mục tiêu:** Task realtime ổn định hơn khi mạng chập chờn.

**Phạm vi file:**

- `apps/ops-web/src/features/tasks/tasks.realtime.ts`
- `apps/ops-web/src/features/tasks/tasks.api.ts`
- `apps/ops-web/src/pages/tasks/TaskAssignmentPage.tsx`
- `services/dispatch-service/src/realtime/*`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 9: harden realtime task updates cho ops-web.

Yêu cầu:
1. Client có trạng thái connected/disconnected/reconnecting.
2. Có reconnect backoff.
3. Khi realtime mất kết nối, fallback polling hoặc nút tải lại rõ ràng.
4. Không spam invalidate query.
5. UI hiển thị trạng thái realtime nhỏ gọn.
6. Chạy build app/service liên quan.

Commit gợi ý:
feat(ops-web): harden task realtime connection
```

**Tiêu chí xong:**

- Mất websocket không làm màn task sai lệch hoặc im lặng.

## 12. Wave 10 - Performance Và Code Splitting

**Mục tiêu:** Giảm warning bundle lớn và tăng tốc tải ban đầu.

**Phạm vi file:**

- `apps/ops-web/src/app/AppRouter.tsx`
- Các function group page lớn
- `apps/ops-web/vite.config.ts` nếu cần manual chunks

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 10: code splitting cho ops-web.

Hiện npm run build báo chunk index lớn hơn 500KB.

Yêu cầu:
1. Lazy-load các nhóm route lớn không thuộc first screen:
   - analytics dashboard
   - function groups operations platform
   - branch business pages
   - linehaul pages
   - masterdata pages nếu phù hợp
2. Giữ dashboard core load nhanh.
3. Không đổi behavior route.
4. Chạy:
   cd apps/ops-web
   npm run build
5. So sánh output chunk trước/sau.

Commit gợi ý:
perf(ops-web): split large route bundles
```

**Tiêu chí xong:**

- Bundle initial giảm.
- Route lazy vẫn render đúng.

## 13. Lộ Trình Nếu Chỉ Còn Ít Thời Gian

Nếu chỉ có 1-2 ngày trước báo cáo:

1. Wave 1 - session refresh.
2. Wave 3 - tách prototype/demo routes.
3. Wave 4 - README/report.
4. Wave 2 - smoke test tối thiểu.

Nếu còn thêm thời gian:

5. Wave 5 - bỏ alert.
6. Wave 6 - pagination cho shipment list.
7. Wave 7 - enforce hub/role scope cho action rủi ro.

## 14. Cách Nói Khi Báo Cáo

Nên trình bày:

> Ops Web đã hoàn thiện các workflow vận hành lõi gồm dashboard, vận đơn, pickup, task assignment, manifest, scan, NDR, tracking và masterdata. Các module mở rộng như analytics nâng cao, finance, planning, linehaul chi tiết đang được tách nhãn prototype để thể hiện định hướng phát triển, không trình bày như chức năng production đã hoàn tất.

Không nên nói:

> Ops Web đã production-ready toàn bộ.

Nên nói:

> Ops Web hiện ở mức MVP production-like cho core operations, có kế hoạch hardening rõ ràng để tiến tới production.

