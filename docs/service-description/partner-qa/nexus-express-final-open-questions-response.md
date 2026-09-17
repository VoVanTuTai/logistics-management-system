# Nexus Express - Phan Hoi Cau Hoi Cuoi Truoc Khi Implement

Tai lieu nay la phan hoi chinh thuc cua Nexus Express cho cac cau hoi cuoi cua doi tac truoc khi bat dau implement tich hop tao van don, tracking, label va webhook.

Luu y bao mat: API key va API secret that se duoc cap qua kenh bao mat rieng. Khong dua secret vao email, ticket public, file markdown public, repository hoac group chat khong ma hoa.

## 1. Credential Sandbox Thuc Te

Sandbox base URL du kien:

```text
SANDBOX_NEXUS_BASE_URL=https://uat-api.nexus-ex.site
SANDBOX_NEXUS_PARTNER_CODE=NEXUS_MARKETPLACE_SANDBOX
SANDBOX_NEXUS_API_KEY=<cap_qua_kenh_bao_mat>
SANDBOX_NEXUS_API_SECRET=<cap_qua_kenh_bao_mat>
```

Neu UAT domain chua san sang tai thoi diem doi tac bat dau test, Nexus se cap endpoint test tam thoi:

```text
TEMP_SANDBOX_NEXUS_BASE_URL=<nexus_cap_rieng_khi_can>
```

Quy uoc:

- `SANDBOX_NEXUS_PARTNER_CODE` co the thay doi sang ma doi tac chinh thuc khi onboard xong.
- Doi tac khong hardcode `NEXUS_MARKETPLACE_SANDBOX` vao production.
- Sandbox credential va production credential tach rieng.

## 2. Mapping Seller Sang Nexus Merchant

Nexus xac nhan doi tac co the dung `sellerId` UUID lam:

```text
external.shopId
```

Mapping sandbox mau:

```csv
partner_code,shop_id,shop_name,merchant_id,sender_hub_code,active
NEXUS_MARKETPLACE_SANDBOX,550e8400-e29b-41d4-a716-446655440000,Cua hang An Phu,41100001,HCM-001,true
NEXUS_MARKETPLACE_SANDBOX,7b9d4f1a-3b62-4d91-ae55-7c5d7a120001,Cua hang Minh Chau,41100002,HN-001,true
NEXUS_MARKETPLACE_SANDBOX,2a251a42-8fd7-4d7a-8fd8-5b0322d30001,Cua hang Da Nang,41100003,DN-001,true
```

Xac nhan:

1. `merchant_id` sandbox co the khac production. Doi tac khong nen suy luan production merchant ID tu sandbox merchant ID.
2. `sender_hub_code` khong bat buoc trong request sandbox neu da co mapping shop -> hub trong Nexus.
3. Neu `sender_hub_code` bo trong mapping/request, Nexus se auto route theo `sender.address`, `sender.ward`, `sender.district`, `sender.province`. Tuy nhien de test on dinh, Nexus khuyen nghi sandbox van gui `sender.hubCode`.

Quy tac production:

- Moi seller/shop duoc mapping truoc khi tao don.
- Neu seller chua mapping, Nexus tra:

```http
404 MERCHANT_NOT_FOUND
```

## 3. Sender/Pickup Profile Test

Nexus cung cap 3 pickup profile sandbox mau:

### Seller 1

```text
sellerId/shopId=550e8400-e29b-41d4-a716-446655440000
shopName=Cua hang An Phu
sender.name=Cua hang An Phu
sender.phone=0904110001
sender.address=86 Nguyen Hue
sender.ward=Phuong Ben Nghe
sender.district=Quan 1
sender.province=Ho Chi Minh
sender.hubCode=HCM-001
```

### Seller 2

```text
sellerId/shopId=7b9d4f1a-3b62-4d91-ae55-7c5d7a120001
shopName=Cua hang Minh Chau
sender.name=Cua hang Minh Chau
sender.phone=0904110002
sender.address=44 Ho Tung Mau
sender.ward=Phuong Dich Vong
sender.district=Cau Giay
sender.province=Ha Noi
sender.hubCode=HN-001
```

### Seller 3

```text
sellerId/shopId=2a251a42-8fd7-4d7a-8fd8-5b0322d30001
shopName=Cua hang Da Nang
sender.name=Cua hang Da Nang
sender.phone=0904110003
sender.address=19 Ong Ich Khiem
sender.ward=Phuong Hai Chau 1
sender.district=Hai Chau
sender.province=Da Nang
sender.hubCode=DN-001
```

Xac nhan:

1. Sandbox chap nhan toi thieu:

```text
sender.name
sender.phone
sender.address
sender.province
```

2. Production co phase chuyen tiep. Trong phase dau go-live, Nexus chap nhan request thieu `ward` hoac `district` neu shop da co mapping hub ro rang. Sau phase chuyen tiep, production nen gui day du:

```text
sender.ward
sender.district
sender.province
```

3. Neu shop co nhieu kho, doi tac gui them:

```text
sender.warehouseId
sender.warehouseName
```

## 4. COD Va Payment Rule

Nexus xac nhan:

```text
Don online da thanh toan: codAmount = 0
```

Voi don COD, quy tac mac dinh Nexus chon:

```text
Option A: codAmount = totalAmount
```

Y nghia: nguoi nhan tra tong so tien can thu khi giao hang. Neu doi tac muon tru phi ship vi shop/san thanh toan shippingFee rieng, doi tac gui theo Option B va can set ro field `codIncludesShippingFee=false`.

Nexus chap nhan field:

```json
{
  "payment": {
    "codIncludesShippingFee": true
  }
}
```

Field nay duoc chap nhan trong sandbox va production.

Quy tac de xuat:

```text
Online paid:
  codAmount = 0
  codIncludesShippingFee = false

COD - receiver pays goods + shipping:
  codAmount = totalAmount
  codIncludesShippingFee = true

COD - shop/platform pays shipping:
  codAmount = totalAmount - shippingFee
  codIncludesShippingFee = false
```

## 5. Webhook URL Va Dang Ky Webhook

Doi tac du kien expose:

```http
POST /api/v1/shipments/webhooks/nexus
```

Nexus xac nhan:

1. Nexus can full public URL truoc khi test webhook sandbox.

Vi du:

```text
SANDBOX_WEBHOOK_URL=https://sandbox-partner.example.com/api/v1/shipments/webhooks/nexus
PROD_WEBHOOK_URL=https://partner.example.com/api/v1/shipments/webhooks/nexus
```

2. Phase dau dang ky webhook URL bang cau hinh thu cong do Nexus setup. Phase sau co the bo sung portal/admin.

3. Webhook sandbox va production co secret tach rieng:

```text
SANDBOX_NEXUS_WEBHOOK_SECRET=<cap_qua_kenh_bao_mat>
PROD_NEXUS_WEBHOOK_SECRET=<cap_qua_kenh_bao_mat>
```

Mac dinh co the dung cung secret voi request API trong sandbox de test nhanh, nhung production khuyen nghi tach `API_SECRET` va `WEBHOOK_SECRET`.

4. Nexus co gui webhook test/ping de verify endpoint.

Webhook ping:

```json
{
  "eventId": "evt_ping_202605260001",
  "eventType": "webhook.ping",
  "occurredAt": "2026-05-26T10:30:00+07:00",
  "partnerCode": "NEXUS_MARKETPLACE_SANDBOX",
  "data": {
    "message": "Nexus webhook verification",
    "environment": "sandbox"
  }
}
```

Doi tac tra HTTP 2xx de xac nhan endpoint hop le.

## 6. Idempotency Va External Order Code

Nexus xac nhan mapping doi tac de xuat la dung:

```text
external.platform = NEXUS_PARTNER_CODE
external.shopId = sellerId UUID
external.externalOrderId = order.id UUID
external.externalOrderCode = order.orderNumber/orderCode
Idempotency-Key = <partner_code>:<sellerId>:<order.id>
```

Quy tac:

- `external.externalOrderId` la khoa ky thuat duy nhat va on dinh.
- `external.externalOrderCode` la ma hien thi cho CSKH/van hanh, co the trung theo shop neu he thong doi tac cho phep, nen khong dung lam idempotency key.
- Khi retry tao don, doi tac phai giu nguyen `Idempotency-Key`.

Neu request dau bi timeout nhung Nexus da tao van don thanh cong, retry cung key se tra lai `shipmentCode` da tao.

## 7. Create Order Sandbox Test Case

Bo test data sandbox hop le:

```text
partner_code=NEXUS_MARKETPLACE_SANDBOX
shop_id=550e8400-e29b-41d4-a716-446655440000
merchant_id=41100001
sender_hub_code=HCM-001
sender.name=Cua hang An Phu
sender.phone=0904110001
sender.address=86 Nguyen Hue
sender.ward=Phuong Ben Nghe
sender.district=Quan 1
sender.province=Ho Chi Minh
receiver.name=Nguyen Van A
receiver.phone=0909000000
receiver.address=44 Ho Tung Mau
receiver.ward=Phuong Dich Vong
receiver.district=Cau Giay
receiver.province=Ha Noi
serviceType=STANDARD
pickupType=PICKUP
payment.payer=RECEIVER
```

Request mau:

```json
{
  "external": {
    "platform": "NEXUS_MARKETPLACE_SANDBOX",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "ord_20260526_000001",
    "externalOrderCode": "NXTEST-000001",
    "orderCreatedAt": "2026-05-26T10:30:00+07:00",
    "orderStatus": "READY_TO_SHIP"
  },
  "merchant": {
    "merchantId": "41100001",
    "shopName": "Cua hang An Phu"
  },
  "sender": {
    "name": "Cua hang An Phu",
    "phone": "0904110001",
    "address": "86 Nguyen Hue",
    "ward": "Phuong Ben Nghe",
    "district": "Quan 1",
    "province": "Ho Chi Minh",
    "hubCode": "HCM-001"
  },
  "receiver": {
    "name": "Nguyen Van A",
    "phone": "0909000000",
    "address": "44 Ho Tung Mau",
    "ward": "Phuong Dich Vong",
    "district": "Cau Giay",
    "province": "Ha Noi",
    "note": "Goi truoc khi giao"
  },
  "parcel": {
    "items": [
      {
        "sku": "SKU-TEST-001",
        "name": "Ao thun test",
        "quantity": 1,
        "unitPrice": 150000
      }
    ],
    "weightGram": 500,
    "lengthCm": 20,
    "widthCm": 15,
    "heightCm": 10,
    "declaredValue": 150000
  },
  "service": {
    "serviceType": "STANDARD",
    "pickupType": "PICKUP"
  },
  "payment": {
    "codAmount": 180000,
    "shippingFee": 30000,
    "payer": "RECEIVER",
    "codIncludesShippingFee": true
  },
  "options": {
    "autoCreatePickup": true,
    "printLabelFormat": "A6"
  }
}
```

Endpoint:

```http
POST /merchant/integrations/orders
```

Headers:

```http
Content-Type: application/json
X-Nexus-Partner-Code: NEXUS_MARKETPLACE_SANDBOX
X-Nexus-Api-Key: <sandbox_api_key>
X-Nexus-Timestamp: 2026-05-26T10:30:00+07:00
X-Nexus-Nonce: <uuid_v4>
X-Nexus-Signature: <hmac_sha256_hex_lowercase>
Idempotency-Key: NEXUS_MARKETPLACE_SANDBOX:550e8400-e29b-41d4-a716-446655440000:ord_20260526_000001
```

## 8. Production Go-Live Sau Sandbox

Production credential se duoc cap qua kenh bao mat sau khi sandbox pass:

```text
PROD_NEXUS_BASE_URL=https://ops.nexus-ex.site
PROD_NEXUS_PARTNER_CODE=<ma_partner_chinh_thuc>
PROD_NEXUS_API_KEY=<cap_qua_kenh_bao_mat>
PROD_NEXUS_API_SECRET=<cap_qua_kenh_bao_mat>
```

Quy trinh whitelist production:

1. Doi tac gui outbound IP production truoc go-live toi thieu:

```text
2 ngay lam viec
```

2. Sau khi whitelist, Nexus cung cap endpoint check credential:

```http
GET /merchant/integrations/health
```

Response:

```json
{
  "success": true,
  "data": {
    "partnerCode": "<ma_partner_chinh_thuc>",
    "environment": "production",
    "authenticated": true,
    "timestamp": "2026-05-26T10:30:00+07:00"
  }
}
```

Endpoint nay van can HMAC signature.

3. Production mapping seller/merchant dung cung format voi sandbox:

```csv
partner_code,shop_id,shop_name,merchant_id,sender_hub_code,active
```

Luu y: `merchant_id` production co the khac sandbox.

## 9. Xac Nhan Viec Doi Tac Se Bat Dau Code

Nexus xac nhan pham vi doi tac implement sau khi nhan du credential sandbox va mapping seller test:

1. Nexus HMAC client trong shipping-service.
2. Create order integration:

```http
POST /merchant/integrations/orders
```

3. Luu:

```text
shipmentCode -> awb/trackingNumber
trackingUrl -> shipment metadata
labelUrl -> shipment metadata
pickupCode -> shipment metadata
```

4. Webhook receiver:

```http
POST /api/v1/shipments/webhooks/nexus
```

5. Status mapping Nexus -> internal shipment status.
6. Cancel/tracking/label API client trong phase tiep theo.

## 10. Cac Gia Tri Chot Cho Phase Dau

```text
Default serviceType=STANDARD
Default pickupType=PICKUP
Default payer=RECEIVER
Default weightGram=500
Default dimensions=20x15x10 cm
Default COD rule=Option A, codAmount = totalAmount, codIncludesShippingFee=true
Signature=HMAC-SHA256 hex lowercase
Timestamp=ISO-8601, chap nhan +07:00 hoac UTC Z
Request timeout=10 seconds
Idempotency retention=30 ngay
Rate limit per shop=100 requests/minute
Rate limit per partner=1000 requests/minute
Webhook timeout=10 seconds
Webhook retry=1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h
```

## 11. Viec Nexus Can Cung Cap Qua Kenh Bao Mat

Danh sach thong tin Nexus se gui rieng:

```text
SANDBOX_NEXUS_API_KEY
SANDBOX_NEXUS_API_SECRET
SANDBOX_NEXUS_WEBHOOK_SECRET
PROD_NEXUS_API_KEY
PROD_NEXUS_API_SECRET
PROD_NEXUS_WEBHOOK_SECRET
```

Danh sach thong tin doi tac can gui lai Nexus:

```text
SANDBOX_WEBHOOK_URL
PROD_WEBHOOK_URL
SANDBOX_OUTBOUND_IP neu can whitelist
PROD_OUTBOUND_IP bat buoc truoc go-live
Danh sach seller production can mapping
```
