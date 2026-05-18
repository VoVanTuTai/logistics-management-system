# Kế Hoạch Triển Khai Các Phần Ops Web Còn Chưa Ổn

> **Mục tiêu:** Bổ sung các phần còn thiếu sau `06-ops-web-production-readiness-plan.md`: đồng bộ tài liệu, migration audit, pagination cho list lớn, mở rộng hub/role scope, thay `window.confirm`, và dọn TODO/placeholder dễ bị hỏi khi báo cáo.

## 1. Trạng Thái Rà Soát Hiện Tại

Đã ổn:

- `ops-web` có session refresh, retry 401 và clear session khi refresh fail.
- `ops-web` có smoke test và `npm run test:smoke` pass.
- Prototype routes đã có `VITE_SHOW_OPS_PROTOTYPE_ROUTES=false` mặc định và có badge `Prototype`.
- `window.alert` đã được thay bằng toast/inline notice.
- Realtime task đã có reconnect/backoff và fallback polling.
- Router đã lazy-load nhiều page, `npm run build` không còn warning chunk > 500 KB.

Còn chưa ổn:

- Report/README chưa phản ánh đúng code mới nhất.
- Audit có code/schema nhưng chưa có migration DB rõ ràng.
- Pagination mới hoàn chỉnh cho `shipments`; `tasks`, `manifests`, `NDR` vẫn trả array.
- Hub/role scope mới chặn action nhạy cảm, chưa phủ list/detail và NDR reschedule.
- Vẫn còn `window.confirm` ở một số core/prototype flow.
- Còn TODO/placeholder có thể bị hỏi khi review code.

## 2. Wave 1 - Đồng Bộ README Và Report

**Mục tiêu:** Tài liệu không mâu thuẫn với code hiện tại.

**Phạm vi file:**

- `apps/ops-web/README.md`
- `docs/ops-web-production-readiness-report.md`
- `docs/workflow-polishing/06-ops-web-production-readiness-plan.md` nếu cần cập nhật trạng thái

**Prompt dùng để vibe coding:**

```text
Bạn đang làm trong repo logistics-management-system. Hãy làm Wave 1: đồng bộ tài liệu trạng thái production-readiness cho ops-web.

Mục tiêu:
- README/report phải phản ánh đúng code hiện tại.
- Không ghi audit/scope/realtime/code splitting là "chưa làm" nếu code đã có một phần.
- Phân loại rõ: Completed, Partial, Backlog.

Phạm vi được sửa:
- apps/ops-web/README.md
- docs/ops-web-production-readiness-report.md
- docs/workflow-polishing/06-ops-web-production-readiness-plan.md nếu cần.

Yêu cầu:
1. Ghi Completed:
   - session refresh
   - smoke test
   - prototype route flag
   - bỏ window.alert
   - realtime reconnect/backoff/fallback polling
   - code splitting build không còn chunk warning > 500KB
2. Ghi Partial:
   - audit ops actions có code/schema nhưng cần migration/check DB sạch
   - hub/role scope có guard cho action nhạy cảm nhưng chưa phủ list/detail
   - server-side pagination đã có shipment, chưa có tasks/manifests/NDR
3. Ghi Backlog:
   - pagination tasks/manifests/NDR
   - scope cho list/detail và NDR reschedule
   - thay window.confirm bằng confirm modal chung
   - dọn TODO/placeholder contract
4. Không trình bày Ops Web là full production-ready.
5. Văn phong báo cáo đồ án, súc tích.

Chạy kiểm tra:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
docs(ops-web): align readiness report with implementation status
```

**Tiêu chí xong:**

- Report không còn mâu thuẫn với code.
- Người đọc biết phần nào xong, phần nào partial, phần nào backlog.

## 3. Wave 2 - Hoàn Thiện Audit Migration

**Mục tiêu:** Audit chạy được trên DB sạch, không chỉ tồn tại trong Prisma schema.

**Phạm vi file:**

- `services/dispatch-service/prisma/schema.prisma`
- `services/scan-service/prisma/schema.prisma`
- `services/manifest-service/prisma/schema.prisma`
- `services/delivery-service/prisma/schema.prisma`
- Thư mục migration Prisma của các service nếu dự án dùng migration
- `docs/runbook/migrations.md` nếu cần ghi cách chạy

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 2: hoàn thiện migration DB cho ops audit logs.

Mục tiêu:
- Các service dispatch, scan, manifest, delivery có bảng ops_audit_logs trên DB sạch.
- Không chỉ sửa schema.prisma mà phải có migration hoặc hướng dẫn db push rõ ràng theo convention repo.

Phạm vi được sửa:
- services/dispatch-service/prisma/**
- services/scan-service/prisma/**
- services/manifest-service/prisma/**
- services/delivery-service/prisma/**
- docs/runbook/migrations.md nếu cần.

Yêu cầu:
1. Kiểm tra repo đang dùng Prisma migration hay db push.
2. Nếu dùng migration, tạo migration cho model OpsAuditLog ở 4 service.
3. Bảng cần có:
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
4. Index tối thiểu:
   - createdAt
   - actorId
   - action
   - targetType + targetId
5. Không đổi shape audit service hiện có nếu không cần.
6. Nếu gặp lỗi quyền Prisma generate trên query_engine-windows.dll.node, ghi rõ cách xử lý lock file trong runbook hoặc thử generate lại sau khi dừng process dùng node_modules.

Chạy:
cd services/dispatch-service && npm run build
cd services/scan-service && npm run build
cd services/manifest-service && npm run build
cd services/delivery-service && npm run build

Commit gợi ý:
feat(ops): add audit log database migrations
```

**Tiêu chí xong:**

- DB sạch tạo được `ops_audit_logs`.
- Build các service pass hoặc có ghi chú rõ nếu lỗi chỉ do môi trường lock file.

## 4. Wave 3 - Server-Side Pagination Cho Tasks

**Mục tiêu:** Task assignment không load toàn bộ task/shipments rồi filter client.

**Phạm vi file:**

- `apps/ops-web/src/features/tasks/tasks.types.ts`
- `apps/ops-web/src/features/tasks/tasks.client.ts`
- `apps/ops-web/src/features/tasks/tasks.hooks.ts`
- `apps/ops-web/src/pages/tasks/TaskAssignmentPage.tsx`
- `services/dispatch-service/src/api/controllers/tasks.controller.ts`
- `services/dispatch-service/src/application/services/tasks.service.ts`
- `services/dispatch-service/src/domain/repositories/task.repository.ts`
- `services/dispatch-service/src/infrastructure/prisma/task-prisma.repository.ts`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 3: server-side pagination/filter cho task list trong ops-web.

Mục tiêu:
- TaskAssignmentPage không tải toàn bộ task list.
- API dispatch tasks hỗ trợ limit/offset và trả pageInfo.
- Giữ tương thích nếu backend cũ còn trả array.

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
1. API nhận filter:
   - courierId
   - taskType
   - status
   - shipmentCode
   - pickupRequestId
   - limit
   - offset
2. Response chuẩn khi có pagination:
   { items, pageInfo: { hasNextPage, total } }
3. Frontend normalize fallback nếu response là array.
4. UI có page size, next/prev, total, loading state.
5. Giảm phụ thuộc useShipmentsQuery(accessToken, {}) trong TaskAssignmentPage.
6. Nếu cần hub context để hiển thị warning, ưu tiên lấy từ task payload hoặc endpoint lookup có filter, không load toàn bộ shipment.
7. Không phá realtime invalidate/refetch hiện có.

Chạy:
cd services/dispatch-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate task assignment list server side
```

**Tiêu chí xong:**

- Task list có `limit/offset/pageInfo`.
- Màn task assignment không cần load toàn bộ dữ liệu để phân trang.

## 5. Wave 4 - Server-Side Pagination Cho Manifests

**Mục tiêu:** Manifest list không load toàn bộ manifest.

**Phạm vi file:**

- `apps/ops-web/src/features/manifests/manifests.types.ts`
- `apps/ops-web/src/features/manifests/manifests.client.ts`
- `apps/ops-web/src/features/manifests/manifests.hooks.ts`
- `apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx`
- `services/manifest-service/src/api/controllers/manifests.controller.ts`
- `services/manifest-service/src/application/services/manifests.service.ts`
- `services/manifest-service/src/domain/repositories/manifest.repository.ts`
- `services/manifest-service/src/infrastructure/prisma/manifest-prisma.repository.ts`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 4: server-side pagination/filter cho manifest list trong ops-web.

Mục tiêu:
- ManifestManagementPage dùng API phân trang.
- Backend manifest trả { items, pageInfo } khi nhận limit/offset.
- Giữ fallback array cũ ở frontend.

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
1. API nhận filter:
   - status
   - manifestCode hoặc q
   - originHubCode
   - destinationHubCode
   - limit
   - offset
2. Response chuẩn:
   { items, pageInfo: { hasNextPage, total } }
3. UI có page size, next/prev, loading/empty state.
4. Không phá create/generate bag/seal/receive/add/remove shipment.
5. Sau mutation, invalidate/refetch đúng page hiện tại.

Chạy:
cd services/manifest-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate manifest list server side
```

**Tiêu chí xong:**

- Manifest list không tải toàn bộ.
- Action manifest vẫn hoạt động sau khi phân trang.

## 6. Wave 5 - Server-Side Pagination Cho NDR

**Mục tiêu:** NDR list không load toàn bộ case.

**Phạm vi file:**

- `apps/ops-web/src/features/ndr/ndr.types.ts`
- `apps/ops-web/src/features/ndr/ndr.client.ts`
- `apps/ops-web/src/features/ndr/ndr.hooks.ts`
- `apps/ops-web/src/pages/ndr/NdrHandlingPage.tsx`
- `services/delivery-service/src/api/controllers/ndr.controller.ts`
- `services/delivery-service/src/application/services/ndr.service.ts`
- `services/delivery-service/src/domain/repositories/ndr-case.repository.ts`
- `services/delivery-service/src/infrastructure/prisma/ndr-case-prisma.repository.ts`

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 5: server-side pagination/filter cho NDR list trong ops-web.

Mục tiêu:
- NdrHandlingPage dùng API phân trang.
- Backend delivery NDR trả { items, pageInfo } khi nhận limit/offset.
- Giữ fallback array cũ ở frontend.

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
1. API nhận filter:
   - shipmentCode
   - status
   - reasonCode nếu có sẵn field
   - q nếu phù hợp
   - limit
   - offset
2. Response chuẩn:
   { items, pageInfo: { hasNextPage, total } }
3. UI có page size, next/prev, total, loading/empty state.
4. Không phá reschedule/return decision.
5. Sau mutation NDR, invalidate/refetch đúng page hiện tại.

Chạy:
cd services/delivery-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
feat(ops): paginate ndr case list server side
```

**Tiêu chí xong:**

- NDR list không tải toàn bộ.
- Action xử lý NDR vẫn hoạt động.

## 7. Wave 6 - Mở Rộng Hub/Role Scope

**Mục tiêu:** Không chỉ frontend filter; gateway/backend chặn cả read/list/detail và NDR reschedule theo hub scope.

**Phạm vi file:**

- `services/gateway-bff/src/common/guards/ops-hub-scope.guard.ts`
- `services/gateway-bff/src/api/ops/**`
- `services/gateway-bff/src/infrastructure/clients/auth-service.client.ts` nếu cần
- Service nghiệp vụ nếu cần nhận actor/hub context hoặc filter theo hub

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 6: mở rộng hub/role scope cho ops read/list/detail và NDR reschedule.

Mục tiêu:
- OPS user chỉ xem/thao tác dữ liệu thuộc hub được gán.
- SYSTEM_ADMIN xem toàn hệ thống.
- Không phụ thuộc frontend filter.

Phạm vi được sửa:
- services/gateway-bff/src/common/guards/ops-hub-scope.guard.ts
- services/gateway-bff/src/api/ops/**
- service nghiệp vụ liên quan nếu cần filter theo hub.

Yêu cầu:
1. Giữ guard hiện có cho action nhạy cảm.
2. Bổ sung route rule cho NDR reschedule:
   POST delivery/ndr/:id/reschedule
3. Xem xét scope cho read/detail/list:
   - dispatch/tasks
   - manifest/manifests
   - delivery/ndr
   - shipment/shipments nếu chưa đủ
4. Với list endpoint, ưu tiên truyền hub scope xuống service để filter server-side.
5. Với detail/action, nếu không xác định được hub context thì default deny.
6. Error message tiếng Việt rõ ràng.
7. Không làm hỏng SYSTEM_ADMIN.

Chạy:
cd services/gateway-bff && npm run build
Build các service nghiệp vụ nếu có sửa.

Commit gợi ý:
feat(ops): enforce hub scope across ops reads
```

**Tiêu chí xong:**

- Gọi API trực tiếp ngoài hub không bypass được.
- NDR reschedule cũng được guard.

## 8. Wave 7 - Confirm Modal Chung Thay `window.confirm`

**Mục tiêu:** UX thống nhất, không dùng popup browser thô cho core flow.

**Phạm vi file:**

- `apps/ops-web/src/store/uiStore.ts`
- `apps/ops-web/src/app/AppShell.tsx`
- `apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx`
- `apps/ops-web/src/pages/pickups/PickupApprovalsPage.tsx`
- `apps/ops-web/src/pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage.tsx` nếu còn thời gian

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 7: thay window.confirm bằng confirm modal dùng chung trong ops-web.

Mục tiêu:
- Core demo flow không dùng popup browser thô.
- Confirm UI đồng bộ với toast/error state hiện có.

Phạm vi được sửa:
- apps/ops-web/src/store/uiStore.ts
- apps/ops-web/src/app/AppShell.tsx
- apps/ops-web/src/pages/manifests/ManifestManagementPage.tsx
- apps/ops-web/src/pages/pickups/PickupApprovalsPage.tsx
- apps/ops-web/src/pages/function-groups/operations-platform/thermal-label/ThermalLabelPrintPage.tsx nếu phù hợp.

Yêu cầu:
1. Tạo confirm dialog dùng chung qua uiStore hoặc component trong AppShell.
2. API dùng dạng async confirm để page có thể await kết quả.
3. Thay window.confirm ở core trước:
   - xóa manifest/bag
   - duyệt pickup hàng loạt
4. Prototype thermal label làm sau nếu không làm tăng scope quá lớn.
5. Text tiếng Việt có dấu, nút rõ: Hủy / Xác nhận.
6. Modal có disabled/loading state nếu action đang chạy.
7. Không refactor UI lớn ngoài confirm flow.

Chạy:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build

Commit gợi ý:
fix(ops-web): replace browser confirms with shared dialog
```

**Tiêu chí xong:**

- `rg "window.confirm|confirm\\(" apps/ops-web/src` không còn ở core flow.
- Smoke test/build pass.

## 9. Wave 8 - Dọn TODO/Placeholder Core

**Mục tiêu:** Giảm điểm yếu khi review code.

**Phạm vi file:**

- `apps/ops-web/src/features/tasks/tasks.types.ts`
- `apps/ops-web/src/features/shipments/shipments.types.ts`
- `services/dispatch-service/src/application/services/tasks.service.ts`
- Tài liệu report nếu TODO là intentional backlog

**Prompt dùng để vibe coding:**

```text
Hãy làm Wave 8: dọn TODO/placeholder trong core ops flow.

Mục tiêu:
- Không còn TODO mơ hồ trong luồng core dễ bị hỏi khi review.
- Nếu chưa thể hoàn thiện nghiệp vụ, ghi rõ là backlog có lý do trong docs.

Phạm vi được sửa:
- apps/ops-web/src/features/tasks/tasks.types.ts
- apps/ops-web/src/features/shipments/shipments.types.ts
- services/dispatch-service/src/application/services/tasks.service.ts
- docs/ops-web-production-readiness-report.md nếu cần.

Yêu cầu:
1. Rà TODO(contract) trong tasks/shipments types.
2. Nếu type đã đủ dùng, bỏ TODO hoặc đổi thành comment cụ thể hơn.
3. Placeholder return-task policy trong dispatch service:
   - hoặc implement rule tối thiểu rõ ràng,
   - hoặc đổi comment thành backlog có điều kiện nghiệp vụ cụ thể.
4. Không thay đổi behavior lớn nếu chưa có contract.
5. Cập nhật report phần backlog nếu giữ lại việc chưa làm.

Chạy:
cd services/dispatch-service && npm run build
cd apps/ops-web && TMPDIR=/tmp npm run test:smoke
cd apps/ops-web && npm run build

Commit gợi ý:
chore(ops): clarify remaining core workflow backlog
```

**Tiêu chí xong:**

- TODO còn lại nếu có đều có lý do rõ ràng.
- Không còn placeholder mơ hồ trong luồng demo chính.

## 10. Thứ Tự Làm Khuyến Nghị

Nếu cần chốt báo cáo nhanh:

1. Wave 1 - đồng bộ tài liệu.
2. Wave 2 - audit migration hoặc ghi rõ cách áp DB.
3. Wave 7 - thay `window.confirm` ở core flow.

Nếu còn thời gian hardening kỹ thuật:

4. Wave 3 - pagination tasks.
5. Wave 4 - pagination manifests.
6. Wave 5 - pagination NDR.
7. Wave 6 - mở rộng hub/role scope.
8. Wave 8 - dọn TODO/placeholder.

## 11. Checklist Kiểm Chứng Cuối

Chạy tối thiểu:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

Chạy backend liên quan:

```bash
cd services/gateway-bff && npm run build
cd services/dispatch-service && npm run build
cd services/scan-service && npm run build
cd services/manifest-service && npm run build
cd services/delivery-service && npm run build
```

Nếu `scan-service` hoặc `delivery-service` fail tại `prisma generate` với lỗi `query_engine-windows.dll.node`, xử lý lock/quyền file trong `node_modules` rồi chạy lại. Nếu `npx tsc -p tsconfig.json` pass nhưng `prisma generate` fail do quyền file, ghi rõ đây là lỗi môi trường, không phải lỗi TypeScript.
