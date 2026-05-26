# High Priority Business Completion Plan

Tai lieu nay lap ke hoach hoan thien cac phan nghiep vu uu tien cao de Nexus Express System ke duoc tron flow:

```text
Merchant tao don -> pickup -> hub/manifest -> delivery/NDR/return -> COD -> tracking/reporting
```

Pham vi dua tren `docs/Documents/nexus-express-system-overview.md`.

## Nguyen tac chung

- Lam tung wave, khong rewrite toan bo app.
- Khong cho client goi truc tiep domain service; frontend/mobile goi qua `gateway-bff`.
- Khong cho service doc/ghi database cua service khac.
- Neu thao tac thay doi trang thai nghiep vu, xac dinh source of truth truoc khi sua.
- Neu thay doi can hien thi tren tracking/reporting, kiem tra event publish/consume.
- Cac thao tac co retry nhu scan, delivery success/fail, COD collect/remit phai co `idempotencyKey`.
- Giu loading, empty, error, success state tren UI.
- Giu API cu neu co the; neu can them API thi them endpoint moi, khong pha route hien co.
- Build/test tung wave truoc khi sang wave tiep theo.

## Thu tu uu tien

1. Courier delivery success/fail + POD thuc te.
2. COD settlement daily/batch/confirm.
3. Return lifecycle end-to-end.
4. Merchant self-service: change/cancel/return request va profile/password thuc.
5. Reporting/KPI doc du flow tu event/read model.

## Wave 0 - Baseline check

### Muc tieu

Dam bao branch hien tai build/typecheck duoc truoc khi them nghiep vu.

### Lenh kiem tra

```powershell
cd services\gateway-bff
npm run build

cd ..\..\apps\merchant-web
npm run build

cd ..\ops-web
npm run build
npm run test:smoke

cd ..\admin-web
npm run build

cd ..\public-tracking
npm run build

cd ..\courier-mobile
npm run typecheck
```

Backend service typecheck:

```powershell
$services = 'auth-service','shipment-service','pickup-service','dispatch-service','manifest-service','scan-service','delivery-service','tracking-service','masterdata-service','reporting-service','payment-service'
foreach ($s in $services) {
  Push-Location "services\$s"
  npx tsc -p tsconfig.json --noEmit
  if ($LASTEXITCODE -ne 0) { throw "Typecheck failed: $s" }
  Pop-Location
}
```

## Wave 1 - Courier delivery success/fail + POD

### Ly do uu tien

Overview yeu cau courier cap nhat giao thanh cong, giao that bai, POD/OTP, NDR va COD. Neu phan nay con placeholder thi flow van don chua ket thuc thuyet phuc.

### File lien quan

- `apps/courier-mobile/src/screens/delivery/DeliveryProofScreen.tsx`
- `apps/courier-mobile/src/screens/delivery/DeliverySuccessScreen.tsx`
- `apps/courier-mobile/src/screens/delivery/DeliveryFailScreen.tsx`
- `apps/courier-mobile/src/features/delivery/delivery-success.mapper.ts`
- `apps/courier-mobile/src/features/delivery/delivery-success.api.ts`
- `apps/courier-mobile/src/features/delivery/delivery-fail.api.ts`
- `apps/courier-mobile/src/offline/queue.service.ts`
- `services/gateway-bff/src/api/media/media.controller.ts`
- `services/delivery-service/src/api/controllers/delivery.controller.ts`
- `services/delivery-service/src/application/services/delivery.service.ts`
- `services/delivery-service/src/messaging/producers/delivery-events.producer.ts`

### Can dat

- Courier chup/chon anh POD va upload qua gateway media endpoint.
- `delivery success` gui `podImageUrl`, receiver info, OTP neu co, COD collected flag neu co.
- `delivery fail` gui reason, note, next action flag de tao NDR.
- Ca success/fail gui `idempotencyKey` va header `Idempotency-Key`.
- Offline queue resend dung payload cu, khong tao idempotency key moi.
- Delivery service khong tao duplicate attempt khi retry.
- Tracking timeline co moc `delivery.delivered` hoac `delivery.failed`.

### Tieu chi nghiem thu

- Courier mobile typecheck pass.
- Delivery success tu mobile tao attempt trong delivery-service.
- Anh POD co URL that tu object storage hoac MinIO staging.
- Delivery fail tao NDR case khi can.
- Retry cung `idempotencyKey` khong tao attempt/NDR trung.
- Public/internal tracking thay doi sau event.

### Prompt trien khai

```text
Ban dang lam trong repo logistics-management-system. Hay trien khai Wave 1: Courier delivery success/fail + POD.

Doc truoc:
- docs/Documents/nexus-express-system-overview.md
- apps/courier-mobile/README.md
- services/delivery-service/README.md

Muc tieu:
- Hoan thien courier-mobile delivery success/fail de khong con POD placeholder.
- Upload anh POD qua gateway media endpoint hien co neu app co local image uri.
- Gui `podImageUrl`, receiver info, OTP neu co, note va `idempotencyKey` vao API delivery success.
- Gui reason, note, next action va `idempotencyKey` vao API delivery fail.
- Giu offline queue retry an toan: retry phai dung lai idempotencyKey cu.

Rang buoc:
- Mobile chi goi gateway prefix `/courier`.
- Khong doi route backend hien co neu khong bat buoc.
- Khong doi shipment state machine truc tiep tu mobile.
- Khong doc/ghi DB service khac.
- Giu loading/empty/error/success state.

File chinh can xem:
- apps/courier-mobile/src/screens/delivery/*
- apps/courier-mobile/src/features/delivery/*
- apps/courier-mobile/src/offline/*
- services/gateway-bff/src/api/media/media.controller.ts
- services/delivery-service/src/api/controllers/delivery.controller.ts
- services/delivery-service/src/application/services/delivery.service.ts

Ket qua mong muon:
- Delivery success co POD URL that.
- Delivery fail tao NDR neu backend contract hien co ho tro.
- Typecheck courier-mobile pass.
- Typecheck delivery-service pass.
- Neu them field/type moi, cap nhat type tuong ung va khong pha API cu.
```

## Wave 2 - COD settlement daily/batch/confirm

### Ly do uu tien

COD la nghiep vu quan trong cua chuyen phat nhanh. Overview da co `payment-service` va event `cod.collected`, `cod.collection_failed`, `cod.remitted`. Hien co them tai lieu chi tiet tai `docs/payment-cod-settlement-implementation-plan.md`.

### File lien quan

- `docs/payment-cod-settlement-implementation-plan.md`
- `services/payment-service/src/domain/entities/cod-record.entity.ts`
- `services/payment-service/src/domain/repositories/cod-record.repository.ts`
- `services/payment-service/src/infrastructure/prisma/cod-record-prisma.repository.ts`
- `services/payment-service/src/application/services/cod.service.ts`
- `services/payment-service/src/api/controllers/cod.controller.ts`
- `services/payment-service/prisma/schema.prisma`
- `apps/ops-web/src/features/payments/*`
- `apps/ops-web/src/pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage.tsx`
- `apps/courier-mobile/src/features/cod/*`
- `apps/courier-mobile/src/screens/cod/*`

### Can dat

- Daily summary theo date/hub/courier.
- Settlement batch cho cac COD da collect nhung chua remit.
- QR gan voi batch, khong tu dong mark remitted.
- Confirm remitted chi khi ops/ke toan xac nhan.
- Courier co man hinh xem COD can nop va tao/gui yeu cau nop tien neu phu hop.
- Ops-web khong preview tu shipment/task thay cho payment-service khi payment API da co du lieu.

### Tieu chi nghiem thu

- `GET /cod/settlements/daily` tra summary dung.
- Tao batch khong duplicate record.
- Tao QR theo batch.
- Confirm batch publish `cod.remitted`.
- Ops UI hien thi collected/remitted/pending.
- Typecheck payment-service va ops-web pass.

### Prompt trien khai

```text
Ban dang lam trong repo logistics-management-system. Hay trien khai Wave 2: COD settlement daily/batch/confirm.

Doc truoc:
- docs/Documents/nexus-express-system-overview.md
- docs/payment-cod-settlement-implementation-plan.md
- services/payment-service/README.md

Muc tieu:
- Hoan thien payment-service lam source of truth cho COD settlement.
- Them daily summary theo date/hub/courier.
- Them batch settlement cho COD da COLLECTED nhung chua REMITTED.
- Tao QR gan voi batch; tao QR khong duoc tu mark REMITTED.
- Them confirm remitted cho batch va publish event phu hop.
- Cap nhat ops-web finance COD page dung payment-service API that.

Rang buoc:
- Khong doi shipment/task/delivery logic neu khong can.
- Khong tu suy luan trang thai tien tren frontend khi payment-service chua xac nhan.
- Khong pha API payment hien co.
- Neu can schema moi, cap nhat Prisma schema va ghi ro cach db:prepare cho staging.
- Giu loading/empty/error/success state tren ops-web.

File chinh can xem:
- services/payment-service/src/application/services/cod.service.ts
- services/payment-service/src/api/controllers/cod.controller.ts
- services/payment-service/src/infrastructure/prisma/cod-record-prisma.repository.ts
- services/payment-service/prisma/schema.prisma
- apps/ops-web/src/features/payments/*
- apps/ops-web/src/pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage.tsx

Ket qua mong muon:
- API daily summary, create batch, get batch QR, confirm batch remitted.
- Ops-web hien thi COD summary tu payment-service.
- Payment-service typecheck pass.
- Ops-web build pass.
```

## Wave 3 - Return lifecycle end-to-end

### Ly do uu tien

Overview co `return.started` va `return.completed`. Return la nua sau cua NDR; neu chi tao NDR ma khong hoan tat return thi flow giao that bai bi cut ngan.

### File lien quan

- `services/delivery-service/src/api/controllers/returns.controller.ts`
- `services/delivery-service/src/application/services/returns.service.ts`
- `services/delivery-service/src/domain/entities/return-case.entity.ts`
- `services/delivery-service/src/infrastructure/prisma/return-case-prisma.repository.ts`
- `services/delivery-service/src/application/services/ndr.service.ts`
- `services/dispatch-service/src/application/services/tasks.service.ts`
- `apps/ops-web/src/pages/ndr/*`
- `apps/ops-web/src/pages/function-groups/operations-platform/return-block/*`
- `apps/courier-mobile/src/features/tasks/*`
- `apps/courier-mobile/src/screens/tasks/*`

### Can dat

- NDR decision "return" tao return case.
- Tao/assign return task cho courier neu flow hien co cho phep.
- Courier/ops scan return pickup/inbound neu can.
- Complete return case khi hang ve hub/merchant.
- Publish `return.started` va `return.completed`.
- Tracking timeline hien return journey.

### Tieu chi nghiem thu

- Tu delivery fail -> NDR -> return decision -> return case -> return completed.
- Return events vao tracking/reporting.
- Khong cho complete return 2 lan.
- Ops UI xem duoc return case va trang thai.

### Prompt trien khai

```text
Ban dang lam trong repo logistics-management-system. Hay trien khai Wave 3: Return lifecycle end-to-end.

Doc truoc:
- docs/Documents/nexus-express-system-overview.md
- services/delivery-service/README.md
- docs/architecture/status-machine.md neu can doi status lien quan.

Muc tieu:
- Hoan thien flow tu NDR return-decision den return.started va return.completed.
- Dam bao delivery-service la source of truth cho ReturnCase.
- Neu can task hoan hang, dung dispatch-service/task contract hien co thay vi tao shortcut DB.
- Tracking/reporting nhan duoc return events.
- Ops UI co the xem va hoan tat return case theo API that.

Rang buoc:
- Khong doi order status logic neu khong can; neu doi phai cap nhat state machine/co event ro rang.
- Khong tao duplicate return case cho cung NDR/shipment.
- Khong doc DB cheo service.
- Giu route hien co; them route moi neu can.

File chinh can xem:
- services/delivery-service/src/application/services/ndr.service.ts
- services/delivery-service/src/application/services/returns.service.ts
- services/delivery-service/src/api/controllers/returns.controller.ts
- services/delivery-service/src/messaging/producers/delivery-events.producer.ts
- apps/ops-web/src/pages/ndr/*
- apps/ops-web/src/pages/function-groups/operations-platform/return-block/*

Ket qua mong muon:
- Return decision tao return case va publish return.started.
- Complete return publish return.completed.
- Tracking timeline co moc return.
- Delivery-service typecheck pass.
- Ops-web build/test:smoke pass neu dung route core.
```

## Wave 4 - Merchant self-service thuc te

### Ly do uu tien

Merchant la nhom nguoi dung chinh trong overview. Merchant can tu tao don, xem don, in phieu, theo doi, gui yeu cau doi thong tin/huy/hoan. Neu cac action nay chi la message scaffold thi cong thong tin merchant chua tron nghiep vu.

### File lien quan

- `apps/merchant-web/src/main.tsx`
- `apps/merchant-web/src/api.ts`
- `apps/merchant-web/src/types.ts`
- `apps/merchant-web/src/printing/shippingLabelPrint.ts`
- `services/shipment-service/src/api/controllers/shipment.controller.ts`
- `services/shipment-service/src/application/services/change-requests.service.ts`
- `services/shipment-service/src/application/services/shipments.service.ts`
- `services/pickup-service/src/api/controllers/pickups.controller.ts`
- `services/delivery-service/src/api/controllers/returns.controller.ts`

### Can dat

- Merchant profile update that neu backend co contract hoac them contract ro.
- Doi mat khau that qua auth-service hoac an/tach ro neu chua lam.
- Change request giao hang that: phone/address/note.
- Cancel request khi shipment con cho phep.
- Return request neu shipment da vao trang thai phu hop.
- Merchant list filter theo date/status/search.

### Tieu chi nghiem thu

- Merchant action goi API that, khong chi set message scaffold.
- Loi validation/API hien thi ro.
- Merchant khong thay/khong sua don ngoai pham vi cua minh neu auth scope co du lieu.
- Build merchant-web pass.

### Prompt trien khai

```text
Ban dang lam trong repo logistics-management-system. Hay trien khai Wave 4: Merchant self-service thuc te.

Doc truoc:
- docs/Documents/nexus-express-system-overview.md
- apps/merchant-web/README.md
- services/shipment-service/README.md

Muc tieu:
- Loai bo cac action merchant chi hien scaffold message cho nhung flow quan trong.
- Hoan thien change request giao hang qua shipment-service.
- Hoan thien cancel request neu shipment con duoc huy theo logic hien co.
- Hoan thien return request neu backend delivery/return da co contract.
- Neu doi mat khau chua co API, them API vao auth-service hoac an/chuyen thanh "coming soon" ro rang.

Rang buoc:
- Khong doi route client chinh neu khong can.
- Khong thay doi request payload hien co neu khong bat buoc; them endpoint moi neu can.
- Khong bo loading/empty/error/success state.
- Merchant-web chi goi gateway prefix `/merchant`.
- Khong tu quyet dinh order status tren frontend.

File chinh can xem:
- apps/merchant-web/src/main.tsx
- apps/merchant-web/src/api.ts
- services/shipment-service/src/application/services/change-requests.service.ts
- services/shipment-service/src/application/services/shipments.service.ts
- services/auth-service/src/application/services/auth.service.ts neu lam doi mat khau.

Ket qua mong muon:
- Merchant change/cancel/return action goi API that.
- Doi mat khau that hoac UI khong con tao cam giac da xu ly thanh cong gia.
- Merchant-web build pass.
- Backend service lien quan typecheck pass.
```

## Wave 5 - Reporting/KPI end-to-end

### Ly do uu tien

Bao cao la bang chung he thong event-driven hoat dong. Overview yeu cau KPI theo ngay/thang, courier, hub, zone va shipment status.

### File lien quan

- `services/reporting-service/src/messaging/consumers/reporting-events.consumer.ts`
- `services/reporting-service/src/application/projections/reporting-projection.service.ts`
- `services/reporting-service/src/application/projections/reporting-event.types.ts`
- `services/reporting-service/src/infrastructure/prisma/reporting-projection.store.ts`
- `services/reporting-service/src/application/services/reporting-query.service.ts`
- `services/reporting-service/src/api/controllers/reports.controller.ts`
- `services/reporting-service/prisma/schema.prisma`
- `apps/ops-web/src/features/dashboard/*`
- `apps/ops-web/src/pages/dashboard/*`
- `apps/courier-mobile/src/screens/stats/StatsScreen.tsx`

### Can dat

- Reporting consume day du event trong overview: shipment, pickup, task, manifest, scan, delivery, NDR, return, COD neu phu hop.
- Daily/monthly aggregate cap nhat dung.
- Dashboard ops doc API reporting that.
- Courier stats doc data that neu co endpoint phu hop.
- Duplicate event khong lam tang KPI hai lan.

### Tieu chi nghiem thu

- Sau core flow demo, KPI thay doi dung.
- Dashboard co empty/error state khi reporting chua co data.
- Reporting-service typecheck pass.
- Ops-web build va smoke pass.

### Prompt trien khai

```text
Ban dang lam trong repo logistics-management-system. Hay trien khai Wave 5: Reporting/KPI end-to-end.

Doc truoc:
- docs/Documents/nexus-express-system-overview.md
- services/reporting-service/README.md
- contracts/events/event-types.md

Muc tieu:
- Dam bao reporting-service consume va project cac event chinh cua flow:
  shipment.created, pickup.approved/completed, task.assigned/reassigned,
  manifest.sealed/received, scan.pickup_confirmed/inbound/outbound,
  delivery.delivered/failed, ndr.created, return.started/completed,
  cod.collected/cod.remitted neu event da co.
- API reports tra KPI theo ngay/thang, hub, courier, status.
- Ops dashboard dung reporting API that, khong dung mock cho core KPI.

Rang buoc:
- Reporting-service chi la read model, khong chua business logic write-side.
- Khong publish event tu reporting-service.
- Duplicate event phai duoc chan bang projection ledger/co che hien co.
- Khong doc DB service khac.

File chinh can xem:
- services/reporting-service/src/application/projections/*
- services/reporting-service/src/infrastructure/prisma/reporting-projection.store.ts
- services/reporting-service/src/application/services/reporting-query.service.ts
- services/reporting-service/src/api/controllers/reports.controller.ts
- apps/ops-web/src/features/dashboard/*
- apps/ops-web/src/pages/dashboard/*

Ket qua mong muon:
- Core KPI thay doi sau khi chay flow tao don -> pickup -> scan -> manifest -> delivery/NDR/return/COD.
- Reporting-service typecheck pass.
- Ops-web build va test:smoke pass.
```

## Demo script sau khi hoan thanh cac wave

1. Admin tao/gán user merchant, ops, courier va hub.
2. Merchant tao shipment COD va in van don.
3. Merchant tao pickup request.
4. Ops approve pickup va assign pickup task.
5. Courier scan pickup.
6. Ops/courier scan inbound/outbound va tao manifest, seal, receive.
7. Ops assign delivery task.
8. Courier giao thanh cong co POD va thu COD.
9. Payment/COD page hien pending remit, tao batch QR, confirm remitted.
10. Tao mot don fail delivery, sinh NDR, quyet dinh return.
11. Hoan tat return.
12. Public tracking hien du timeline.
13. Ops dashboard/reporting hien KPI thay doi.

## Checklist ket thuc

- Khong con scaffold message o cac flow chinh.
- Courier delivery success/fail co idempotency.
- COD settlement co source of truth trong payment-service.
- Return lifecycle co event start/complete.
- Merchant action quan trong goi API that.
- Reporting KPI doc tu event/read model.
- Build/typecheck/smoke pass theo Wave 0.
