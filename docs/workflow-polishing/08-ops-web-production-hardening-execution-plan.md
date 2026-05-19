# Kế Hoạch Hardening Ops Web Gần Production Nhất Có Thể

> Mục tiêu: tiếp tục nắn chắc `apps/ops-web` để báo cáo ở mức **MVP production-like cho core operations**, đồng thời giữ các module nghiệp vụ mở rộng như phần chính của roadmap production.

## 1. Nguyên Tắc Thực Hiện

- Tập trung core flow: Dashboard, Shipments, Pickups, Tasks, Manifests, Scans, NDR, Tracking, Masterdata.
- Giữ các module mở rộng trong main UI để tiếp tục nâng cấp production; không tách chúng ra khỏi luồng chính.
- Không trình bày toàn bộ Ops Web là production-ready.
- Không mở thêm module lớn nếu chưa có backend contract thật.
- Không phá API boundary qua gateway `/ops/*`.
- Không đổi request payload/response mapping nếu không cần cho hardening đã nêu.
- Giữ full ops modules hiển thị mặc định bằng `VITE_ENABLE_FULL_OPS_MODULES=true`; chỉ đặt `false` cho build core-only.
- Mỗi wave nên làm nhỏ, build/test ngay sau khi xong.

## 2. Thứ Tự Làm Tối Ưu

1. Wave 1: cập nhật README/report.
2. Wave 2: audit DB runbook/migration.
3. Wave 7: shared confirm modal.
4. Wave 3-5: pagination tasks/manifests/NDR.
5. Wave 6: hub scope list/detail/NDR reschedule.
6. Wave 8: dọn TODO/placeholder core.
7. Chạy lại kiểm chứng cuối: `ops-web test:smoke`, `ops-web build`, `gateway build`, 4 service build.

## 3. Wave 1 - Cập Nhật README Và Report

**Mục tiêu**

- Tài liệu phản ánh đúng code hiện tại.
- Không ghi các phần đã làm là backlog.
- Báo cáo rõ `Completed`, `Partial`, `Backlog`.

**Phạm vi file**

- `apps/ops-web/README.md`
- `docs/ops-web-production-readiness-report.md`
- `docs/workflow-polishing/06-ops-web-production-readiness-plan.md` nếu cần cập nhật trạng thái

**Prompt vibe coding**

```text
Bạn đang làm trong repo logistics-management-system. Hãy làm Wave 1: cập nhật README/report production-readiness cho Ops Web theo trạng thái code hiện tại.

Mục tiêu:
- README và report không mâu thuẫn với code.
- Báo cáo Ops Web là MVP production-like cho core operations, không phải production-ready toàn bộ.
- Phân loại rõ Completed, Partial, Backlog.

Phạm vi được sửa:
- apps/ops-web/README.md
- docs/ops-web-production-readiness-report.md
- docs/workflow-polishing/06-ops-web-production-readiness-plan.md nếu cần.

Yêu cầu Completed:
1. Session refresh/access token retry 401/clear session khi refresh fail.
2. Smoke test `npm run test:smoke`.
3. Full ops module flag `VITE_ENABLE_FULL_OPS_MODULES=true`.
4. Đã bỏ `window.alert` khỏi ops-web.
5. Realtime task có reconnect/backoff và fallback polling.
6. Router/page lazy-load, production build không còn warning chunk > 500 KB.

Yêu cầu Partial:
1. Audit log có schema/service code nhưng cần runbook/migration/db push rõ ràng cho DB sạch.
2. Hub/role scope guard đã chặn một số action nhạy cảm nhưng chưa phủ list/detail và NDR reschedule.
3. Server-side pagination đã có shipment, chưa có tasks/manifests/NDR.

Yêu cầu Backlog:
1. Pagination tasks/manifests/NDR.
2. Scope cho list/detail và NDR reschedule.
3. Shared confirm modal thay `window.confirm`.
4. Dọn TODO/placeholder contract trong core.

Không làm:
- Không sửa code app trong wave này.
- Không nói toàn bộ module mở rộng là production-ready nếu chưa có backend contract hoặc test thật.

Chạy kiểm tra:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
docs(ops-web): align production readiness status
```

**Tiêu chí hoàn tất**

- Người đọc hiểu phần nào đã xong, phần nào partial, phần nào backlog.
- Câu chốt nên dùng: “MVP production-like cho core operations”.

## 4. Wave 2 - Audit DB Runbook/Migration

**Mục tiêu**

- Audit log không chỉ có Prisma schema/service code mà có cách áp DB sạch rõ ràng.
- Nếu repo dùng `prisma db push` thay vì migration versioned thì runbook phải ghi rõ.

**Phạm vi file**

- `services/dispatch-service/prisma/schema.prisma`
- `services/scan-service/prisma/schema.prisma`
- `services/manifest-service/prisma/schema.prisma`
- `services/delivery-service/prisma/schema.prisma`
- `docs/runbook/migrations.md`
- Thư mục migration Prisma nếu quyết định tạo migration versioned

**Prompt vibe coding**

```text
Hãy làm Wave 2: hoàn thiện audit DB readiness cho Ops Web.

Mục tiêu:
- DB sạch tạo được bảng `ops_audit_logs` cho dispatch, scan, manifest, delivery.
- Repo hiện có script `db:prepare` chạy `prisma generate` và `prisma db push`, nên nếu không dùng Prisma migration versioned thì phải ghi runbook rõ ràng.

Phạm vi được sửa:
- services/dispatch-service/prisma/**
- services/scan-service/prisma/**
- services/manifest-service/prisma/**
- services/delivery-service/prisma/**
- docs/runbook/migrations.md

Yêu cầu:
1. Kiểm tra convention repo: dùng Prisma migration hay `prisma db push`.
2. Nếu dùng migration versioned, tạo migration cho `OpsAuditLog` ở 4 service.
3. Nếu dùng `db push`, cập nhật `docs/runbook/migrations.md` với lệnh chạy rõ ràng cho DB sạch.
4. Bảng audit phải có các field:
   - id
   - actorId
   - actorUsername
   - action
   - targetType
   - targetId
   - before
   - after
   - requestId
   - ipAddress
   - userAgent
   - createdAt
5. Index tối thiểu:
   - createdAt
   - actorId
   - action
   - targetType + targetId
6. Không đổi shape audit service nếu schema hiện đã tương thích.
7. Nếu gặp lỗi `query_engine-windows.dll.node` bị lock, ghi cách xử lý trong runbook: dừng process Node đang dùng service, xóa lock nếu cần, chạy lại `npm run build` hoặc `npm run db:prepare`.

Chạy:
cd services/dispatch-service && npm run build
cd services/scan-service && npm run build
cd services/manifest-service && npm run build
cd services/delivery-service && npm run build

Commit gợi ý:
docs(ops): document audit log database preparation
```

**Tiêu chí hoàn tất**

- `docs/runbook/migrations.md` không còn trống.
- Báo cáo có thể nói audit đã có đường áp DB sạch.
- Build 4 service pass hoặc lỗi môi trường được ghi rõ.

## 5. Wave 7 - Shared Confirm Modal

**Mục tiêu**

- Không dùng popup browser thô trong core flow.
- Confirm UX thống nhất với toast/global UI hiện có.

**Phạm vi file**

- `apps/ops-web/src/store/uiStore.ts`
- `apps/ops-web/src/app/AppShell.tsx`
- `apps/ops-web/src/app/theme.css`
- `apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx`
- `apps/ops-web/src/pages/pickups/PickupApprovalsPage.tsx`
- `apps/ops-web/src/pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage.tsx` nếu muốn dọn cùng module tem bao

**Prompt vibe coding**

```text
Hãy làm Wave 7: thay `window.confirm` bằng shared confirm modal trong Ops Web.

Mục tiêu:
- Core flow không dùng popup browser.
- Confirm modal dùng chung, gọi được kiểu async/await.
- UI đồng bộ với toast/global state hiện có.

Phạm vi được sửa:
- apps/ops-web/src/store/uiStore.ts
- apps/ops-web/src/app/AppShell.tsx
- apps/ops-web/src/app/theme.css
- apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx
- apps/ops-web/src/pages/pickups/PickupApprovalsPage.tsx
- apps/ops-web/src/pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage.tsx nếu không làm tăng scope quá lớn.

Yêu cầu:
1. Thêm confirm state/action vào `uiStore`.
2. API dùng dạng `confirm(options): Promise<boolean>` hoặc tương đương để page có thể `await`.
3. Render confirm dialog một lần trong `AppShell`.
4. Text tiếng Việt rõ ràng, nút `Hủy` và `Xác nhận`.
5. Có trạng thái danger cho thao tác xóa hoặc duyệt hàng loạt.
6. Không đổi business logic của manifest delete và pickup bulk approve.
7. Thay core flow trước:
   - Xóa manifest/bag.
   - Duyệt pickup hàng loạt.
8. Thermal label có thể xử lý sau, nhưng nếu làm thì không refactor lớn.

Chạy:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Kiểm tra:
rg "window.confirm|confirm\\(" apps/ops-web/src

Commit gợi ý:
fix(ops-web): replace browser confirms with shared dialog
```

**Tiêu chí hoàn tất**

- Không còn `window.confirm` trong core flow.
- Smoke test/build pass.

## 6. Wave 3 - Pagination Tasks

**Mục tiêu**

- Task assignment không tải toàn bộ tasks rồi phân trang/filter client-side.
- API dispatch tasks có `limit/offset/pageInfo`.

**Phạm vi file**

- `apps/ops-web/src/features/tasks/tasks.types.ts`
- `apps/ops-web/src/features/tasks/tasks.client.ts`
- `apps/ops-web/src/features/tasks/tasks.hooks.ts`
- `apps/ops-web/src/pages/tasks/TaskAssignmentPage.tsx`
- `services/dispatch-service/src/api/controllers/tasks.controller.ts`
- `services/dispatch-service/src/application/services/tasks.service.ts`
- `services/dispatch-service/src/domain/repositories/task.repository.ts`
- `services/dispatch-service/src/infrastructure/prisma/task-prisma.repository.ts`

**Prompt vibe coding**

```text
Hãy làm Wave 3: server-side pagination/filter cho task list trong Ops Web.

Mục tiêu:
- TaskAssignmentPage dùng API phân trang.
- Backend dispatch tasks trả `{ items, pageInfo: { hasNextPage, total } }` khi có `limit/offset`.
- Frontend vẫn fallback được nếu backend cũ trả array.

Phạm vi được sửa:
- apps/ops-web/src/features/tasks/tasks.types.ts
- apps/ops-web/src/features/tasks/tasks.client.ts
- apps/ops-web/src/features/tasks/tasks.hooks.ts
- apps/ops-web/src/pages/tasks/TaskAssignmentPage.tsx
- services/dispatch-service/src/api/controllers/tasks.controller.ts
- services/dispatch-service/src/application/services/tasks.service.ts
- services/dispatch-service/src/domain/repositories/task.repository.ts
- services/dispatch-service/src/infrastructure/prisma/task-prisma.repository.ts

Yêu cầu:
1. API nhận filters:
   - courierId
   - taskType
   - status
   - shipmentCode
   - pickupRequestId
   - limit
   - offset
2. Repository dùng Prisma `skip`, `take`, `count`.
3. Response chuẩn:
   `{ items, pageInfo: { hasNextPage, total } }`
4. Frontend normalize cả response array cũ và page response mới.
5. UI có page size, previous/next, total, loading/empty/error state.
6. Không phá realtime invalidate/refetch hiện có.
7. Giảm phụ thuộc load toàn bộ shipments nếu chỉ để hiển thị task list.
8. Sau assign/reassign, refetch đúng query/page hiện tại.

Chạy:
cd services/dispatch-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate task assignment list server side
```

**Tiêu chí hoàn tất**

- Task list không còn phải tải toàn bộ dữ liệu để phân trang.
- UI vẫn hoạt động khi API cũ trả array.

## 7. Wave 4 - Pagination Manifests

**Mục tiêu**

- Manifest list không tải toàn bộ bao.
- Filter/pagination chạy server-side.

**Phạm vi file**

- `apps/ops-web/src/features/manifests/manifests.types.ts`
- `apps/ops-web/src/features/manifests/manifests.client.ts`
- `apps/ops-web/src/features/manifests/manifests.hooks.ts`
- `apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx`
- `services/manifest-service/src/api/controllers/manifests.controller.ts`
- `services/manifest-service/src/application/services/manifests.service.ts`
- `services/manifest-service/src/domain/repositories/manifest.repository.ts`
- `services/manifest-service/src/infrastructure/prisma/manifest-prisma.repository.ts`

**Prompt vibe coding**

```text
Hãy làm Wave 4: server-side pagination/filter cho manifest list trong Ops Web.

Mục tiêu:
- ManifestManagementPage dùng API phân trang.
- Backend manifest trả `{ items, pageInfo }` khi nhận `limit/offset`.
- Frontend fallback được nếu backend cũ trả array.

Phạm vi được sửa:
- apps/ops-web/src/features/manifests/manifests.types.ts
- apps/ops-web/src/features/manifests/manifests.client.ts
- apps/ops-web/src/features/manifests/manifests.hooks.ts
- apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx
- services/manifest-service/src/api/controllers/manifests.controller.ts
- services/manifest-service/src/application/services/manifests.service.ts
- services/manifest-service/src/domain/repositories/manifest.repository.ts
- services/manifest-service/src/infrastructure/prisma/manifest-prisma.repository.ts

Yêu cầu:
1. API nhận filters:
   - status
   - manifestCode hoặc q
   - originHubCode
   - destinationHubCode
   - limit
   - offset
2. Repository dùng Prisma `where`, `skip`, `take`, `count`.
3. Response chuẩn:
   `{ items, pageInfo: { hasNextPage, total } }`
4. UI có page size, previous/next, total, loading/empty/error state.
5. Không phá generate bag, delete, create, detail, add/remove shipment, seal, receive.
6. Sau mutation, invalidate/refetch đúng query/page hiện tại.

Chạy:
cd services/manifest-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate manifest list server side
```

**Tiêu chí hoàn tất**

- Manifest list không load toàn bộ.
- Các action manifest vẫn chạy bình thường.

## 8. Wave 5 - Pagination NDR

**Mục tiêu**

- NDR list không tải toàn bộ case.
- Filter/pagination chạy server-side.

**Phạm vi file**

- `apps/ops-web/src/features/ndr/ndr.types.ts`
- `apps/ops-web/src/features/ndr/ndr.client.ts`
- `apps/ops-web/src/features/ndr/ndr.hooks.ts`
- `apps/ops-web/src/pages/ndr/NdrHandlingPage.tsx`
- `services/delivery-service/src/api/controllers/ndr.controller.ts`
- `services/delivery-service/src/application/services/ndr.service.ts`
- `services/delivery-service/src/domain/repositories/ndr-case.repository.ts`
- `services/delivery-service/src/infrastructure/prisma/ndr-case-prisma.repository.ts`

**Prompt vibe coding**

```text
Hãy làm Wave 5: server-side pagination/filter cho NDR list trong Ops Web.

Mục tiêu:
- NdrHandlingPage dùng API phân trang.
- Backend delivery NDR trả `{ items, pageInfo }` khi nhận `limit/offset`.
- Frontend fallback được nếu backend cũ trả array.

Phạm vi được sửa:
- apps/ops-web/src/features/ndr/ndr.types.ts
- apps/ops-web/src/features/ndr/ndr.client.ts
- apps/ops-web/src/features/ndr/ndr.hooks.ts
- apps/ops-web/src/pages/ndr/NdrHandlingPage.tsx
- services/delivery-service/src/api/controllers/ndr.controller.ts
- services/delivery-service/src/application/services/ndr.service.ts
- services/delivery-service/src/domain/repositories/ndr-case.repository.ts
- services/delivery-service/src/infrastructure/prisma/ndr-case-prisma.repository.ts

Yêu cầu:
1. API nhận filters:
   - shipmentCode
   - status
   - reasonCode nếu field hiện có
   - q nếu phù hợp
   - limit
   - offset
2. Repository dùng Prisma `where`, `skip`, `take`, `count`.
3. Response chuẩn:
   `{ items, pageInfo: { hasNextPage, total } }`
4. UI có page size, previous/next, total, loading/empty/error state.
5. Không phá reschedule và return decision.
6. Sau mutation NDR, invalidate/refetch đúng query/page hiện tại.

Chạy:
cd services/delivery-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate ndr case list server side
```

**Tiêu chí hoàn tất**

- NDR list không load toàn bộ.
- Action xử lý NDR vẫn hoạt động.

## 9. Wave 6 - Hub Scope List/Detail/NDR Reschedule

**Mục tiêu**

- OPS user không bypass được bằng cách gọi API trực tiếp.
- SYSTEM_ADMIN xem toàn hệ thống.
- Hub scope áp dụng cho read/list/detail và action NDR reschedule.

**Phạm vi file**

- `services/gateway-bff/src/common/guards/ops-hub-scope.guard.ts`
- `services/gateway-bff/src/api/ops/**`
- `services/gateway-bff/src/infrastructure/clients/auth-service.client.ts` nếu cần
- Service nghiệp vụ nếu cần nhận hub filter từ gateway

**Prompt vibe coding**

```text
Hãy làm Wave 6: mở rộng hub/role scope cho Ops Web read/list/detail và NDR reschedule.

Mục tiêu:
- OPS user chỉ xem/thao tác dữ liệu thuộc hub được gán.
- SYSTEM_ADMIN được xem toàn hệ thống.
- Không phụ thuộc frontend filter.

Phạm vi được sửa:
- services/gateway-bff/src/common/guards/ops-hub-scope.guard.ts
- services/gateway-bff/src/api/ops/**
- services/gateway-bff/src/infrastructure/clients/auth-service.client.ts nếu cần
- Service nghiệp vụ liên quan nếu cần filter hub server-side.

Yêu cầu:
1. Giữ guard hiện có cho action nhạy cảm.
2. Bổ sung rule cho:
   - POST delivery/ndr/:id/reschedule
3. Xem xét scope cho read/detail/list:
   - dispatch/tasks
   - manifest/manifests
   - delivery/ndr
   - shipment/shipments
4. Với list endpoint, ưu tiên truyền hub scope xuống service bằng query/header để filter server-side.
5. Với detail/action, nếu không xác định được hub context thì default deny.
6. Error message tiếng Việt rõ ràng.
7. Không làm hỏng SYSTEM_ADMIN.
8. Không phụ thuộc UI filter để đảm bảo bảo mật.

Chạy:
cd services/gateway-bff && npm run build
Build các service nghiệp vụ nếu có sửa:
cd services/dispatch-service && npm run build
cd services/manifest-service && npm run build
cd services/delivery-service && npm run build
cd services/shipment-service && npm run build

Commit gợi ý:
feat(ops): enforce hub scope across ops reads
```

**Tiêu chí hoàn tất**

- API trực tiếp ngoài hub không bypass được.
- NDR reschedule được guard.
- List/detail không leak dữ liệu hub khác cho OPS thường.

## 10. Wave 8 - Dọn TODO/Placeholder Core

**Mục tiêu**

- Không còn TODO mơ hồ trong core flow dễ bị hỏi khi review.
- Nếu chưa thể hoàn thiện nghiệp vụ thì ghi rõ là backlog có lý do.

**Phạm vi file**

- `apps/ops-web/src/features/tasks/tasks.types.ts`
- `apps/ops-web/src/features/shipments/shipments.types.ts`
- `services/dispatch-service/src/application/services/tasks.service.ts`
- `docs/ops-web-production-readiness-report.md` nếu cần

**Prompt vibe coding**

```text
Hãy làm Wave 8: dọn TODO/placeholder trong core Ops flow.

Mục tiêu:
- Không còn TODO mơ hồ trong luồng core.
- Nếu chưa thể implement vì thiếu nghiệp vụ/contract, đổi thành backlog rõ điều kiện.

Phạm vi được sửa:
- apps/ops-web/src/features/tasks/tasks.types.ts
- apps/ops-web/src/features/shipments/shipments.types.ts
- services/dispatch-service/src/application/services/tasks.service.ts
- docs/ops-web-production-readiness-report.md nếu cần.

Yêu cầu:
1. Rà TODO(contract) trong tasks/shipments types.
2. Nếu type đã đủ dùng, bỏ TODO.
3. Nếu contract chưa đủ, đổi comment thành mô tả cụ thể: cần field nào, từ endpoint nào, ảnh hưởng gì.
4. Placeholder return-task policy trong dispatch service:
   - hoặc implement rule tối thiểu rõ ràng nếu đủ nghiệp vụ,
   - hoặc ghi backlog cụ thể trong code/report.
5. Không đổi behavior lớn nếu chưa có contract.
6. Cập nhật report phần backlog nếu giữ lại việc chưa làm.

Chạy:
cd services/dispatch-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
chore(ops): clarify remaining core workflow backlog
```

**Tiêu chí hoàn tất**

- TODO còn lại nếu có đều có lý do cụ thể.
- Không còn placeholder mơ hồ trong core demo flow.

## 11. Kiểm Chứng Cuối

Sau khi hoàn tất các wave, chạy theo thứ tự:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

cd ../../services/gateway-bff
npm run build

cd ../dispatch-service
npm run build

cd ../scan-service
npm run build

cd ../manifest-service
npm run build

cd ../delivery-service
npm run build
```

Nếu có sửa shipment scope/pagination thì chạy thêm:

```bash
cd services/shipment-service
npm run build
```

## 12. Checklist Báo Cáo Sau Khi Làm

- Có thể nói:
  - Core Ops Web đạt mức MVP production-like.
  - Module mở rộng hiển thị trong main UI và được ghi rõ là phần cần hardening tiếp.
  - Smoke test và production build pass.
  - Gateway/API boundary qua `/ops/*`.
  - Audit có schema/service và đường áp DB sạch.
  - List lớn đã có server-side pagination cho shipment/tasks/manifests/NDR.
  - Scope hub/role được enforce phía gateway/backend cho read/action chính.
  - UX confirm/toast/loading/error đồng bộ hơn.

- Không nên nói:
  - Toàn bộ Ops Web đã production-ready.
  - Analytics/finance/planning/linehaul/return-block nâng cao đã hoàn thiện production.
  - Scope/audit/pagination đã đầy đủ nếu chưa chạy kiểm chứng cuối.

## 13. Prompt Tổng Để Chạy Theo Batch

```text
Bạn đang làm trong repo logistics-management-system. Hãy triển khai hardening Ops Web theo file docs/workflow-polishing/08-ops-web-production-hardening-execution-plan.md.

Thứ tự bắt buộc:
1. Wave 1 cập nhật README/report.
2. Wave 2 audit DB runbook/migration.
3. Wave 7 shared confirm modal.
4. Wave 3 pagination tasks.
5. Wave 4 pagination manifests.
6. Wave 5 pagination NDR.
7. Wave 6 hub scope list/detail/NDR reschedule.
8. Wave 8 dọn TODO/placeholder core.
9. Chạy kiểm chứng cuối.

Nguyên tắc:
- Làm từng wave, diff nhỏ.
- Không mở thêm module lớn mới ngoài phạm vi hardening.
- Không đổi API payload/response mapping nếu không cần cho wave.
- Không phá auth/session/routes/full module flag.
- Sau mỗi wave chạy build/test tương ứng.
- Nếu một wave quá lớn, dừng sau khi hoàn tất wave hiện tại và báo rõ wave tiếp theo.

Kết quả mong muốn:
- Core Ops Web ở mức MVP production-like mạnh nhất có thể.
- Có báo cáo rõ Completed/Partial/Backlog.
- Có danh sách lệnh đã chạy và kết quả.
```
