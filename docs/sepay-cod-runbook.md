# Runbook SePay COD

Ngay tao: 2026-05-20

## Muc tieu

Runbook nay dung cho doi van hanh/ketoan doi soat COD khi SePay gui webhook giao dich vao tai khoan cong ty.

Nguon su that:

- `payment-service` quyet dinh trang thai COD va settlement.
- Ops-web chi hien thi va tao yeu cau QR, khong tu xac nhan tien da vao cong ty.
- SePay webhook la luong xac nhan chinh; manual confirm chi la fallback khi da doi soat sao ke.

## Memo chuyen khoan

- Khach chuyen khoan COD theo don: `COD <shipmentCode>`.
- Courier nop tien mat theo settlement: `COD <settlementCode>`.
- QR settlement duoc sinh tu SePay QR endpoint `https://qr.sepay.vn/img` voi `acc`, `bank`, `amount`, `des`.

Webhook hop le phai khop:

- `transferType = in`.
- `accountNumber` dung tai khoan cong ty.
- `transferAmount` dung so tien COD/settlement, co the cau hinh dung sai bang `SEPAY_AMOUNT_TOLERANCE_VND`.
- Noi dung giao dich chua `COD <shipmentCode>` hoac `COD <settlementCode>`.
- Chua tung xu ly theo `provider + providerEventId`.

## Bien moi truong can kiem tra

- `COMPANY_BANK_ACCOUNT_NUMBER`
- `COMPANY_BANK_CODE` hoac `SEPAY_QR_BANK_CODE` de sinh QR SePay dung ma ngan hang.
- `COMPANY_BANK_BIN`
- `COMPANY_BANK_ACCOUNT_NAME`
- `SEPAY_BANK_ACCOUNT_NUMBER` neu muon override account matching.
- `SEPAY_WEBHOOK_SECRET` cho HMAC, uu tien dung production.
- `SEPAY_WEBHOOK_API_KEY` neu chua dung HMAC.
- `SEPAY_API_TOKEN` de chay doi soat chu dong qua SePay API.
- `SEPAY_TRANSACTIONS_API_URL`, mac dinh `https://userapi.sepay.vn/v2/transactions`.
- `SEPAY_AMOUNT_TOLERANCE_VND`, mac dinh `0`.

Production phai co `SEPAY_WEBHOOK_SECRET` hoac `SEPAY_WEBHOOK_API_KEY`.

## Endpoint doi soat webhook

Payment-service:

```text
POST /cod/webhooks/sepay
POST /cod/webhooks/sepay/reconcile
GET /cod/webhooks/sepay/events
```

Qua gateway ops:

```text
GET /ops/payment/cod/webhooks/sepay/events
```

Public webhook URL de cau hinh tren SePay khi chi expose gateway:

```text
POST /public/payment/cod/webhooks/sepay
```

Endpoint public nay van phai bat HMAC/API key trong `payment-service`; khong dua webhook qua route `/ops` vi route do can token dang nhap noi bo.

Endpoint doi soat chu dong co the goi qua gateway ops:

```text
POST /ops/payment/cod/webhooks/sepay/reconcile
```

Body mac dinh lay 24h gan nhat neu khong truyen thoi gian:

```json
{
  "transactionDateFrom": "2026-05-27T00:00:00+07:00",
  "transactionDateTo": "2026-05-27T23:59:59+07:00",
  "perPage": 100
}
```

Cron goi endpoint nay moi 15 phut se bo sung giao dich webhook bi miss va dua qua cung logic auto-confirm.

Filter ho tro:

```text
provider=SEPAY
providerEventId=<id>
referenceType=SHIPMENT|SETTLEMENT
processingStatus=CONFIRMED|IGNORED|DUPLICATE|AMOUNT_MISMATCH|UNKNOWN_REFERENCE
settlementCode=<code>
shipmentCode=<code>
codRecordId=<id>
dateFrom=<ISO datetime>
dateTo=<ISO datetime>
limit=1..200
```

Vi du:

```bash
curl "http://localhost:3011/cod/webhooks/sepay/events?processingStatus=AMOUNT_MISMATCH&limit=50"
curl "http://localhost:3011/cod/webhooks/sepay/events?referenceType=SHIPMENT&shipmentCode=SHP001"
curl "http://localhost:3011/cod/webhooks/sepay/events?referenceType=SETTLEMENT&settlementCode=COD-20260520-HCM-001-C001-ABC123"
```

## SQL doi soat nhanh

```sql
select
  "createdAt",
  "providerEventId",
  "referenceType",
  "processingStatus",
  "settlementCode",
  "shipmentCode",
  amount,
  "accountNumber",
  "transferType",
  "ignoredReason"
from cod_settlement_payment_events
where "createdAt" >= now() - interval '1 day'
order by "createdAt" desc
limit 100;
```

Amount mismatch:

```sql
select *
from cod_settlement_payment_events
where "processingStatus" = 'AMOUNT_MISMATCH'
order by "createdAt" desc;
```

Unknown reference:

```sql
select *
from cod_settlement_payment_events
where "processingStatus" = 'UNKNOWN_REFERENCE'
order by "createdAt" desc;
```

## Cach xu ly trang thai

### CONFIRMED

Giao dich da khop va da cap nhat payment-service.

- `referenceType=SHIPMENT`: CodRecord da thanh `BANK_TRANSFER/REMITTED`.
- `referenceType=SETTLEMENT`: batch da `PAID`, CodRecord tien mat da `REMITTED`.

### DUPLICATE

Webhook bi gui lai hoac giao dich da duoc xu ly truoc do.

- Kiem tra `providerEventId`.
- Khong thao tac lai neu ban ghi goc da confirmed.

### AMOUNT_MISMATCH

So tien SePay khong bang COD/settlement expected.

Thao tac:

1. Doi chieu `rawPayload.transferAmount` voi so tien tren shipment/settlement.
2. Kiem tra khach/courier co chuyen thieu/du khong.
3. Neu sai memo nhung dung tien, xu ly theo quy trinh ke toan ngoai he thong truoc.
4. Khong manual confirm neu chua thay tien va chua co bien ban doi soat.

### UNKNOWN_REFERENCE

Khong tim thay `COD <shipmentCode>` hoac `COD <settlementCode>`.

Thao tac:

1. Mo `rawPayload.content`, `rawPayload.code`, `rawPayload.description`.
2. Kiem tra co bi sai/khuyet memo khong.
3. Tim giao dich theo so tien va thoi diem tren sao ke.
4. Neu xac dinh dung settlement va tien da vao cong ty, ops/ketoan co the dung manual confirm, bat buoc ghi note.

### IGNORED

Giao dich khong dap ung dieu kien xu ly, vi du `transferType != in`, account sai, status batch khong hop le.

Thao tac:

1. Doc `ignoredReason`.
2. Neu la giao dich `out`, khong xu ly COD.
3. Neu sai account, kiem tra cau hinh `COMPANY_BANK_ACCOUNT_NUMBER`/`SEPAY_BANK_ACCOUNT_NUMBER`.

## Manual confirm

Manual confirm trong ops-web chi la fallback.

Chi dung khi:

- SePay webhook chua ve sau khi da doi soat sao ke.
- Giao dich co memo sai nhung ke toan da xac dinh tien vao cong ty.
- Co ghi chu doi soat ro rang.

Khong dung manual confirm khi:

- Chua thay tien vao cong ty.
- Chi moi tao QR.
- Giao dich bi amount mismatch nhung chua co ket luan ke toan.

## Checklist truoc production

- Bat `SEPAY_WEBHOOK_SECRET` hoac `SEPAY_WEBHOOK_API_KEY`.
- Test webhook duplicate voi cung `providerEventId`.
- Test giao dich `out` bi ignore.
- Test amount mismatch ra `AMOUNT_MISMATCH`.
- Test memo sai ra `UNKNOWN_REFERENCE`.
- Test settlement cash thanh `PAID` va CodRecord thanh `REMITTED`.
- Test shipment bank transfer thanh `BANK_TRANSFER/REMITTED`.
