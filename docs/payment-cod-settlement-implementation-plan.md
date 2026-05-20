# Kế Hoạch Triển Khai Quyết Toán Thu Hộ COD

Ngày tạo: 2026-05-20

## 1. Mục Tiêu

Triển khai dòng tiền COD trên ops trước, tập trung vào màn `Quyết toán thu hộ`.

Chức năng cần đạt:

- Tính tiền COD hằng ngày theo ngày, bưu cục và courier.
- Phân biệt tiền COD đã thu, đã nộp công ty và chưa nộp.
- Tạo QR quyết toán cho khoản chưa nộp.
- Chỉ đánh dấu đã nộp khi ops/kế toán xác nhận tiền đã vào công ty.

Nguồn sự thật:

- `shipment-service` và `dispatch-service`: dùng để biết vận đơn đã giao và courier phụ trách.
- `payment-service`: nguồn sự thật cho trạng thái COD, đã thu, đã nộp, batch quyết toán và QR.
- `ops-web`: chỉ là màn vận hành, không tự quyết định trạng thái tiền nếu backend payment chưa xác nhận.

## 2. Ràng Buộc An Toàn

- Không đổi route ops hiện có.
- Không đổi shipment/task/delivery logic.
- Không đổi API cũ nếu không cần.
- Chỉ thêm API mới trong `payment-service`.
- Không tự mark `REMITTED` khi chỉ mới tạo QR.
- QR chỉ là yêu cầu thanh toán, không phải xác nhận thanh toán.
- Giữ loading, empty, error, success state trên ops page.
- Build/test từng wave trước khi chuyển sang wave tiếp theo.

## 3. Hiện Trạng Repo

Đã có sẵn:

- Ops page:
  - `apps/ops-web/src/pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage.tsx`
- Payment service:
  - `services/payment-service`
- Bảng hiện có:
  - `CodRecord`
- API hiện có:
  - `POST /cod/records`
  - `POST /cod/collect`
  - `POST /cod/remit`
  - `GET /cod/shipment/:shipmentCode`
  - `GET /cod/courier/:courierId`
  - `GET /cod/summary/:courierId`
  - `GET /cod/qr?amount=&memo=`

Thiếu:

- Daily COD settlement summary theo ngày/hub/courier.
- Batch quyết toán COD.
- QR gắn với batch settlement.
- Confirm batch đã nộp tiền.
- Ops API client cho payment settlement.
- Ops UI dùng payment-service thay vì chỉ preview từ shipment/task.

## 4. Wave 1 - Backend Read-Only Daily Summary

### Mục tiêu

Ops có thể gọi `payment-service` để lấy tổng COD theo ngày/courier/hub, chưa tạo QR.

### File chính

- `services/payment-service/src/domain/entities/cod-record.entity.ts`
- `services/payment-service/src/domain/repositories/cod-record.repository.ts`
- `services/payment-service/src/infrastructure/prisma/cod-record-prisma.repository.ts`
- `services/payment-service/src/application/services/cod.service.ts`
- `services/payment-service/src/api/controllers/cod.controller.ts`

### API thêm

```text
GET /cod/settlements/daily?date=2026-05-20&hubCode=HCM01&courierId=courier-1
```

### Response đề xuất

```ts
{
  reportDate: string;
  hubCode: string;
  courierId: string;
  codOrders: number;
  codTotal: number;
  collectedTotal: number;
  remittedTotal: number;
  pendingRemitTotal: number;
  records: Array<{
    shipmentCode: string;
    codAmount: number;
    collectedAmount: number | null;
    status: 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
    courierId: string | null;
    collectedAt: string | null;
    remittedAt: string | null;
  }>;
}
```

### Prompt triển khai

```text
Bạn đang làm trong repo logistics-management-system. Hãy triển khai Wave 1 cho quyết toán COD trong services/payment-service.

Mục tiêu:
- Thêm API read-only `GET /cod/settlements/daily`.
- API trả summary COD theo `date`, `hubCode`, `courierId`.
- Chỉ đọc bảng `CodRecord`, không thêm schema mới ở wave này.
- Không đổi API hiện có.

Yêu cầu:
- Query theo `collectedAt` hoặc `updatedAt` phù hợp với CodRecord hiện tại.
- Filter optional: `date`, `hubCode`, `courierId`, `status`.
- Nếu chưa có `hubCode` trong CodRecord thì response vẫn hoạt động, hubCode trả theo query hoặc `UNKNOWN`.
- Trả về:
  - reportDate
  - hubCode
  - courierId
  - codOrders
  - codTotal
  - collectedTotal
  - remittedTotal
  - pendingRemitTotal
  - records[]
- pendingRemitTotal = tổng COD status `COLLECTED` chưa `REMITTED`.
- Không tạo QR, không update record.

Kiểm chứng:
cd services/payment-service
npm run build
```

## 5. Wave 2 - Thêm Batch Settlement Và QR

### Mục tiêu

Tạo batch quyết toán và sinh QR cho khoản chưa nộp.

### File chính

- `services/payment-service/prisma/schema.prisma`
- `services/payment-service/src/domain/entities/cod-record.entity.ts`
- `services/payment-service/src/application/services/cod.service.ts`
- `services/payment-service/src/api/controllers/cod.controller.ts`

### Schema đề xuất

```prisma
enum CodSettlementStatus {
  WAITING_PAYMENT
  PAID
  CANCELLED
}

model CodSettlementBatch {
  id             String              @id @default(cuid())
  settlementCode String              @unique
  reportDate     DateTime
  hubCode        String
  courierId      String
  totalAmount    Float
  status         CodSettlementStatus @default(WAITING_PAYMENT)
  qrUrl          String?
  transferMemo   String
  createdBy      String?
  confirmedBy    String?
  confirmedAt    DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  items          CodSettlementItem[]

  @@index([reportDate, hubCode, courierId])
  @@map("cod_settlement_batches")
}

model CodSettlementItem {
  id           String @id @default(cuid())
  batchId      String
  codRecordId  String
  shipmentCode String
  amount       Float

  batch        CodSettlementBatch @relation(fields: [batchId], references: [id])

  @@unique([codRecordId])
  @@map("cod_settlement_items")
}
```

### API thêm

```text
POST /cod/settlements
```

### Body

```ts
{
  reportDate: string;
  hubCode: string;
  courierId: string;
  shipmentCodes: string[];
  createdBy: string;
}
```

### Prompt triển khai

```text
Triển khai Wave 2 cho payment-service.

Mục tiêu:
- Thêm schema `CodSettlementBatch` và `CodSettlementItem`.
- Thêm API `POST /cod/settlements` để tạo batch quyết toán và QR.
- Không mark `CodRecord` thành REMITTED ở bước tạo QR.

Body:
{
  "reportDate": "2026-05-20",
  "hubCode": "HCM01",
  "courierId": "courier-1",
  "shipmentCodes": ["SHP001", "SHP002"],
  "createdBy": "ops-user"
}

Luồng xử lý:
- Validate shipmentCodes không rỗng.
- Lấy CodRecord theo shipmentCodes.
- Chỉ cho record status `COLLECTED`.
- Báo lỗi rõ với record đã `REMITTED`.
- Tính totalAmount từ `collectedAmount ?? codAmount`.
- Sinh settlementCode dạng dễ đọc, ví dụ `COD-20260520-HCM01-courier-1-xxxx`.
- transferMemo dạng `COD <settlementCode>`.
- Dùng hàm `buildVietQrUrl(totalAmount, transferMemo)` hiện có để sinh qrUrl.
- Tạo batch + items trong transaction nếu repo hiện tại hỗ trợ Prisma trực tiếp; nếu không, thêm repository method nhỏ, không rewrite toàn bộ service.

Kiểm chứng:
cd services/payment-service
npm run db:prepare
npm run build
```

## 6. Wave 3 - Confirm Đã Nộp Tiền

### Mục tiêu

Khi kế toán/ops xác nhận tiền đã vào công ty, batch thành `PAID`, các record trong batch thành `REMITTED`.

### API thêm

```text
POST /cod/settlements/:id/confirm
```

### Body

```ts
{
  confirmedBy: string;
  note?: string;
}
```

### Prompt triển khai

```text
Triển khai Wave 3 cho payment-service.

Mục tiêu:
- Thêm API `POST /cod/settlements/:id/confirm`.
- Khi confirm batch:
  - CodSettlementBatch.status = PAID
  - confirmedBy = body.confirmedBy
  - confirmedAt = now
  - Tất cả CodRecord trong batch chuyển sang REMITTED
  - remittedBy = confirmedBy
  - remittedAt = now

Ràng buộc:
- Nếu batch đã PAID thì trả batch hiện tại, idempotent.
- Nếu batch CANCELLED thì không cho confirm.
- Không confirm batch totalAmount <= 0.
- Không đổi endpoint `/cod/remit` cũ.
- Có error message rõ khi batch không tồn tại.

Body:
{
  "confirmedBy": "finance-user",
  "note": "Đã nhận tiền qua bank"
}

Kiểm chứng:
cd services/payment-service
npm run build
```

## 7. Wave 4 - Ops API Client

### Mục tiêu

Ops-web gọi được payment-service nhưng chưa đổi UI lớn.

### File chính

- `apps/ops-web/src/services/api/endpoints.ts`
- `apps/ops-web/src/features/payments/payment.types.ts`
- `apps/ops-web/src/features/payments/payment.client.ts`
- `apps/ops-web/src/features/payments/payment.api.ts`

### Endpoint qua gateway

```text
GET  /ops/payment/cod/settlements/daily
POST /ops/payment/cod/settlements
POST /ops/payment/cod/settlements/:id/confirm
```

### Prompt triển khai

```text
Triển khai Wave 4 trong apps/ops-web.

Mục tiêu:
- Thêm payment endpoints vào `opsEndpoints`.
- Tạo feature client/query cho COD settlement.
- Không đổi route, không đổi UI page lớn ở wave này.

Endpoints:
- GET `/ops/payment/cod/settlements/daily`
- POST `/ops/payment/cod/settlements`
- POST `/ops/payment/cod/settlements/:id/confirm`

Yêu cầu:
- TypeScript types đầy đủ cho daily summary, settlement batch, settlement item.
- React Query hooks:
  - useCodDailySettlementQuery
  - useCreateCodSettlementMutation
  - useConfirmCodSettlementMutation
- Dùng `opsApiClient` hiện có.
- Handle 404/500 bằng error flow hiện có, không nuốt lỗi.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 8. Wave 5 - Tích Hợp UI Quyết Toán Thu Hộ

### Mục tiêu

Màn ops hiển thị đúng dòng tiền và tạo QR.

### File chính

- `apps/ops-web/src/pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage.tsx`
- `apps/ops-web/src/pages/function-groups/branch-business/finance-cod/BranchFinanceCodSettlementPage.css`

### Prompt triển khai

```text
Triển khai Wave 5 trong ops-web cho màn `BranchFinanceCodSettlementPage`.

Mục tiêu:
- Chuyển phần trạng thái nộp tiền từ preview sang dùng payment API.
- Giữ dữ liệu shipment/task hiện tại làm fallback hiển thị khi payment API chưa có dữ liệu.
- Không đổi route.

Yêu cầu UI:
- KPI:
  - Tổng COD
  - Đã thu
  - Đã nộp công ty
  - Chưa nộp
- Bảng courier:
  - Courier
  - Bưu cục
  - Đơn COD
  - Tổng COD
  - Đã nộp
  - Chưa nộp
  - Trạng thái settlement
  - Action `Tạo QR`
- Button `Tạo QR` chỉ enable khi pendingRemitTotal > 0.
- Khi bấm `Tạo QR`, mở modal xác nhận.
- Sau khi tạo thành công, hiển thị:
  - QR image
  - Số tiền
  - Nội dung chuyển khoản
  - Mã settlement
- Không tự mark đã nộp sau khi tạo QR.
- Có loading, error, empty, success/toast.
- Nếu payment API lỗi, page vẫn hiển thị preview từ shipments/tasks và có cảnh báo rõ “Chưa lấy được dữ liệu payment”.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 9. Wave 6 - Xác Nhận Tiền Vào Công Ty

### Mục tiêu

Ops/kế toán xác nhận batch đã thanh toán.

### Prompt triển khai

```text
Triển khai Wave 6 trong ops-web.

Mục tiêu:
- Thêm action `Xác nhận đã nhận tiền` cho settlement batch đang WAITING_PAYMENT.
- Gọi API confirm settlement.
- Sau confirm, refetch daily summary.
- Không đổi auth/role logic; nếu chưa có permission riêng thì dùng role hiện có và chỉ disable/ghi chú trên UI nếu không đủ quyền theo pattern hiện tại.

Yêu cầu:
- Confirm modal có:
  - settlementCode
  - courierId
  - amount
  - transferMemo
  - input note optional
- Sau confirm thành công:
  - status hiển thị `Đã nộp`
  - pendingRemitTotal giảm
  - remittedTotal tăng
- Error hiển thị trên UI.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 10. Wave 7 - Chuẩn Hóa COD Record Theo Shipment

### Mục tiêu

Đảm bảo mọi đơn có COD đều có bản ghi trong `payment-service` trước khi courier ký nhận giao hàng.

Nguyên tắc:

- `codAmount > 0`: phải có `CodRecord`.
- `codAmount <= 0` hoặc `null`: không tạo `CodRecord`, không đi vào màn quyết toán COD.
- `payment-service` là nguồn sự thật của trạng thái COD.
- Không phụ thuộc vào việc courier ký nhận xong rồi mới tạo COD record.

### Prompt triển khai

```text
Triển khai Wave 7.

Mục tiêu:
- Chuẩn hóa việc sinh CodRecord cho shipment có codAmount > 0.
- Đơn không COD không được xuất hiện trong luồng quyết toán COD.

Yêu cầu:
- Khi shipment được tạo hoặc được đồng bộ sang payment-service:
  - Nếu codAmount > 0 thì tạo CodRecord với status PENDING.
  - Nếu codAmount <= 0/null thì bỏ qua.
- Create CodRecord phải idempotent theo shipmentCode.
- Không đổi shipment state machine.
- Không đổi request payload cũ nếu không cần.
- Nếu chưa có event consumer ổn định, thêm endpoint/internal handler rõ ràng nhưng vẫn giữ payment-service là nơi lưu COD.

Kiểm chứng:
cd services/payment-service
npx prisma db push --schema prisma/schema.prisma --skip-generate
npx tsc -p tsconfig.json
```

## 11. Wave 8 - COD Khi Courier Ký Nhận Giao Hàng

### Mục tiêu

Khi courier ký nhận giao thành công, hệ thống phân nhánh đúng theo đơn không COD, COD tiền mặt và COD chuyển khoản thẳng công ty.

Luồng chuẩn:

```text
Đơn không COD
→ ký nhận thành công
→ không gọi COD collect
→ không hiện ở quyết toán COD

Đơn COD tiền mặt
→ courier chọn Tiền mặt
→ payment-service mark COLLECTED, paymentMethod=COD
→ tính vào tiền mặt chưa nộp

Đơn COD chuyển khoản công ty
→ courier chọn Chuyển khoản
→ hiển thị QR memo COD <shipmentCode>
→ không mark REMITTED ngay
→ chờ SePay webhook xác nhận tiền vào công ty
```

### Prompt triển khai

```text
Triển khai Wave 8.

Mục tiêu:
- Gắn COD collect vào luồng ký nhận giao hàng theo hướng cận production.
- Không để giao hàng thành công nhưng COD record sai trạng thái mà UI không cảnh báo.

Yêu cầu:
- Courier app chỉ gọi COD collect khi codAmount > 0.
- Với paymentMethod=COD:
  - gọi /payment/cod/collect
  - status thành COLLECTED
- Với paymentMethod=BANK_TRANSFER:
  - tạo/hiển thị QR theo shipmentCode
  - không đưa vào settlement tiền mặt
  - trạng thái chờ webhook ngân hàng xác nhận
- Nếu delivery success thành công nhưng COD update lỗi, phải có cảnh báo rõ và log/queue retry.
- Không tự mark đã nộp công ty nếu chỉ mới hiển thị QR.

Kiểm chứng:
cd apps/courier-mobile
npm run build
cd services/payment-service
npx tsc -p tsconfig.json
```

## 12. Wave 9 - SePay Cho Khách Chuyển Khoản Theo Đơn

### Mục tiêu

Tự động xác nhận COD khi khách nhận hàng chuyển khoản thẳng vào tài khoản công ty.

Webhook SePay cần match:

- `transferType = in`
- `accountNumber` đúng tài khoản công ty
- `transferAmount` đúng số tiền phải thu
- `content/code/description` chứa `COD <shipmentCode>`
- giao dịch chưa xử lý trước đó

### Prompt triển khai

```text
Triển khai Wave 9 trong payment-service.

Mục tiêu:
- Thêm xử lý SePay webhook cho giao dịch khách chuyển khoản COD theo shipmentCode.
- Không trộn luồng này với settlement batch courier nộp tiền mặt.

Yêu cầu:
- Endpoint webhook có thể dùng chung /cod/webhooks/sepay/... nhưng phải phân biệt:
  - COD <shipmentCode>
  - COD <settlementCode>
- Verify webhook bằng SEPAY_WEBHOOK_SECRET hoặc SEPAY_WEBHOOK_API_KEY.
- Idempotency theo provider + providerEventId.
- Match amount, accountNumber, transferType.
- Khi match shipmentCode:
  - Nếu CodRecord chưa COLLECTED thì ghi nhận BANK_TRANSFER.
  - Khi tiền đã vào công ty thì mark trạng thái tương ứng là REMITTED/company received.
  - Không đưa record này vào pendingCashRemitTotal.
- Lưu raw payload và trạng thái xử lý webhook.
- Giao dịch không match phải lưu IGNORED/UNKNOWN_REFERENCE, không làm hỏng webhook retry.

Kiểm chứng:
cd services/payment-service
npx prisma db push --schema prisma/schema.prisma --skip-generate
npx tsc -p tsconfig.json
```

## 13. Wave 10 - SePay Cho Courier Nộp Tiền Mặt Theo Settlement

### Mục tiêu

Tự động xác nhận batch settlement khi courier nộp tiền mặt đã thu vào tài khoản công ty.

Luồng:

```text
COD records paymentMethod=COD, status=COLLECTED
→ ops tạo settlement batch WAITING_PAYMENT
→ QR memo COD <settlementCode>
→ courier chuyển khoản vào công ty
→ SePay webhook match settlementCode + amount
→ batch PAID
→ CodRecord REMITTED
```

### Prompt triển khai

```text
Hoàn thiện Wave 10 trong payment-service và ops-web.

Mục tiêu:
- Settlement QR chỉ bao gồm COD tiền mặt courier đã thu.
- SePay webhook là nguồn xác nhận chính cho tiền vào công ty.
- Manual confirm trong ops chỉ là fallback có audit note.

Yêu cầu:
- create settlement chỉ nhận record:
  - status=COLLECTED
  - paymentMethod=COD
- Không nhận BANK_TRANSFER vào settlement batch.
- SePay webhook match settlementCode:
  - amount đúng totalAmount
  - accountNumber đúng tài khoản công ty
  - transferType=in
  - batch đang WAITING_PAYMENT
- Sau confirm tự động:
  - batch PAID
  - COD records REMITTED
  - emit cod.remitted
- Manual confirm vẫn còn nhưng UI ghi rõ dùng khi webhook chưa về hoặc đối soát thủ công.

Kiểm chứng:
cd services/payment-service
npx tsc -p tsconfig.json
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 14. Wave 11 - Daily Settlement Summary Cận Production

### Mục tiêu

Daily summary phải tách rõ dòng tiền COD tiền mặt, COD chuyển khoản, tiền đã vào công ty và tiền còn chờ nộp.

DTO đề xuất:

```ts
{
  codOrders: number;
  codTotal: number;
  cashCollectedTotal: number;
  bankTransferTotal: number;
  companyReceivedTotal: number;
  remittedTotal: number;
  pendingCashRemitTotal: number;
  waitingBankConfirmTotal: number;
  records: Array<{
    shipmentCode: string;
    codAmount: number;
    collectedAmount: number | null;
    paymentMethod: 'COD' | 'BANK_TRANSFER' | 'PREPAID';
    status: 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
    courierId: string | null;
    collectedAt: string | null;
    remittedAt: string | null;
    companyReceivedAt?: string | null;
    companyReceivedRef?: string | null;
  }>;
}
```

### Prompt triển khai

```text
Triển khai Wave 11.

Mục tiêu:
- Sửa daily COD settlement summary để tách tiền mặt và chuyển khoản.
- Ops-web không tự suy luận dòng tiền nếu payment-service chưa trả rõ.

Yêu cầu:
- records trả paymentMethod.
- Tính:
  - cashCollectedTotal
  - bankTransferTotal
  - companyReceivedTotal/remittedTotal
  - pendingCashRemitTotal
  - waitingBankConfirmTotal
- pendingCashRemitTotal chỉ gồm paymentMethod=COD và status=COLLECTED.
- BANK_TRANSFER đã xác nhận ngân hàng phải tính vào companyReceived/remitted.
- BANK_TRANSFER chưa xác nhận ngân hàng phải tính vào waitingBankConfirmTotal.
- Giữ backward compatibility cho field cũ nếu ops-web còn dùng.

Kiểm chứng:
cd services/payment-service
npx tsc -p tsconfig.json
```

## 15. Wave 12 - Ops UI Dòng Tiền COD Cận Production

### Mục tiêu

Màn `Quyết toán thu hộ` hiển thị đúng các loại dòng tiền và chỉ tạo QR nộp tiền cho phần tiền mặt.

KPI:

- Tổng COD
- Tiền mặt courier thu
- Khách chuyển khoản công ty
- Đã vào công ty
- Tiền mặt chưa nộp
- Chờ ngân hàng xác nhận

Bảng courier tiền mặt:

- Courier
- Bưu cục
- Đơn COD tiền mặt
- Tổng tiền mặt
- Đã nộp công ty
- Chưa nộp
- Settlement status
- Tạo QR / Xem QR / Xác nhận thủ công

Bảng chuyển khoản theo đơn:

- Shipment
- Courier
- Số tiền
- Memo
- Trạng thái ngân hàng
- Mã giao dịch SePay
- Thời điểm nhận tiền

### Prompt triển khai

```text
Triển khai Wave 12 trong ops-web.

Mục tiêu:
- UI hiển thị đúng split COD tiền mặt và chuyển khoản.
- Tạo QR settlement chỉ áp dụng cho tiền mặt courier đã thu.

Yêu cầu:
- Dùng fields mới từ payment daily summary.
- Nếu payment API lỗi, fallback preview vẫn hiển thị nhưng phải cảnh báo rõ đây không phải dữ liệu quyết toán thật.
- Button Tạo QR chỉ enable khi pendingCashRemitTotal > 0.
- Không tạo QR settlement cho BANK_TRANSFER.
- Hiển thị trạng thái chờ ngân hàng xác nhận cho BANK_TRANSFER chưa có webhook.
- Manual confirm chỉ là fallback, có note.

Kiểm chứng:
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 16. Wave 13 - Hardening Cận Production

### Mục tiêu

Tăng độ an toàn trước khi dùng luồng COD với webhook ngân hàng trong môi trường gần production.

### Checklist

- Verify webhook bằng secret/HMAC hoặc API key.
- Idempotency theo `provider + providerEventId`.
- Không xử lý giao dịch `out`.
- Match đúng tài khoản công ty.
- Match đúng số tiền, có `SEPAY_AMOUNT_TOLERANCE_VND` nếu cần.
- Lưu raw payload webhook.
- Log trạng thái xử lý: `CONFIRMED`, `IGNORED`, `DUPLICATE`, `AMOUNT_MISMATCH`, `UNKNOWN_REFERENCE`.
- Manual confirm lưu `confirmedBy`, `confirmedAt`, `note`.
- Có endpoint/SQL tra cứu webhook event để đối soát.
- Có runbook xử lý giao dịch không match.
- Không để frontend quyết định trạng thái tiền đã vào công ty.

### Prompt triển khai

```text
Triển khai Wave 13.

Mục tiêu:
- Hardening webhook và đối soát COD trước production.

Yêu cầu:
- Hoàn thiện webhook event log.
- Thêm filter/list endpoint nội bộ hoặc ops endpoint cho webhook events nếu cần.
- Thêm cảnh báo amount mismatch/unknown reference.
- Thêm tài liệu runbook vận hành SePay COD.
- Không thay đổi auth/role logic nếu chưa có yêu cầu riêng.

Kiểm chứng:
cd services/payment-service
npx tsc -p tsconfig.json
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

## 17. Thứ Tự Commit Đề Xuất

```bash
git commit -m "feat(payment): add cod daily settlement summary"
git commit -m "feat(payment): create cod settlement batches with qr"
git commit -m "feat(payment): confirm cod settlement remittance"
git commit -m "feat(ops): add payment settlement api client"
git commit -m "feat(ops): integrate cod settlement qr workflow"
git commit -m "feat(ops): confirm cod settlement payments"
git commit -m "feat(payment): reconcile cod payments with sepay webhooks"
git commit -m "feat(payment): split cash and bank transfer cod totals"
git commit -m "feat(ops): show production cod cashflow settlement"
```

## 18. Checklist Kiểm Chứng Cuối

Backend:

```bash
cd services/payment-service
npm run build
```

Ops:

```bash
cd apps/ops-web
TMPDIR=/tmp npm run test:smoke
npm run build
```

Kiểm tra nghiệp vụ thủ công:

- Courier có COD `COLLECTED` thì pending remit > 0.
- Tạo QR không làm `CodRecord` thành `REMITTED`.
- Confirm batch mới làm `CodRecord` thành `REMITTED`.
- Batch đã `PAID` confirm lại không tạo lỗi.
- Ops page vẫn hiển thị fallback nếu payment API lỗi.
