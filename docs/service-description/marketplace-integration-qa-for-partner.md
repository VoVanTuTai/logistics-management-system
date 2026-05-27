# Marketplace Integration Q&A For Partner

Tai lieu nay tra loi cac cau hoi tich hop tu doi tac/san thuong mai dien tu de co the code ket noi tao van don voi Nexus Express.

Trang thai: Draft de gui doi tac. Cac gia tri secret/API key that se duoc cap qua kenh bao mat rieng, khong dua vao tai lieu cong khai.

## 1. Thong Tin Bat Buoc De Goi API

### 1. NEXUS_PARTNER_CODE chinh thuc la gi?

`NEXUS_PARTNER_CODE` se do Nexus cap rieng cho tung doi tac.

Vi du trong tai lieu dang de `SHOPEE` chi la placeholder. Khi go-live, doi tac khong hardcode theo vi du nay ma dung ma Nexus cap, vi du:

```text
NEXUS_PARTNER_CODE=<partner_code_do_nexus_cap>
```

Quy tac de xuat:

- Viet hoa.
- Khong dau, khong khoang trang.
- On dinh theo doi tac, khong thay doi theo shop.

### 2. Sandbox API key va secret la gi?

Nexus se cap rieng qua kenh bao mat, gom:

```text
SANDBOX_NEXUS_PARTNER_CODE
SANDBOX_NEXUS_API_KEY
SANDBOX_NEXUS_API_SECRET
```

Khong gui key/secret qua email/group chat cong khai.

### 3. Production API key va secret la gi?

Production credential se cap sau khi:

- Doi tac test thanh cong sandbox.
- Hoan tat mapping shop/merchant.
- Xac nhan IP goi API neu can whitelist.

Production gom:

```text
PROD_NEXUS_PARTNER_CODE
PROD_NEXUS_API_KEY
PROD_NEXUS_API_SECRET
```

### 4. Co can whitelist IP server ben doi tac khong?

Co, Nexus khuyen nghi whitelist IP production cua doi tac.

Doi tac vui long cung cap:

```text
Sandbox outbound IP:
Production outbound IP:
Backup outbound IP neu co:
```

Trong sandbox co the tam thoi khong bat whitelist de test nhanh. Production nen bat whitelist.

### 5. Timestamp bat buoc timezone +07:00 hay UTC cung duoc?

Chap nhan ca ISO-8601 co timezone `+07:00` va UTC `Z`.

Vi du hop le:

```text
2026-05-26T10:30:00+07:00
2026-05-26T03:30:00Z
```

Khuyen nghi doi tac dung UTC `Z` de tranh sai lech timezone.

Request timestamp chi hop le trong vong 5 phut so voi server Nexus.

### 6. Signature tra ve dang hex lowercase hay base64?

Dung `hex lowercase`.

Vi du:

```text
X-Nexus-Signature: 8f4c1b3a0e6d...
```

Cach ky:

```text
signature = HMAC_SHA256_HEX_LOWERCASE(
  secret,
  METHOD + "\n" +
  PATH + "\n" +
  X-Nexus-Timestamp + "\n" +
  X-Nexus-Nonce + "\n" +
  SHA256_HEX_LOWERCASE(raw_request_body)
)
```

## 2. Mapping Shop/Merchant

### 1. external.shopId gui sellerId UUID hien tai duoc khong?

Duoc, neu `sellerId UUID` la dinh danh on dinh va duy nhat cho shop ben doi tac.

Khuyen nghi:

```json
{
  "external": {
    "platform": "<partner_code>",
    "shopId": "<seller_uuid>",
    "externalOrderId": "<order_id>"
  }
}
```

Khong nen dung ten shop hien thi lam `shopId` vi co the trung hoac thay doi.

### 2. merchant.merchantId lay tu dau?

Voi doi tac theo mo hinh per-seller merchant, `merchant.merchantId` do Nexus cap/mapping cho tung shop da onboard:

```text
external.shopId -> merchant.merchantId
```

Voi DT_COMMERCE, mo hinh production la marketplace merchant co dinh:

```text
merchant.merchantId = 41100000
merchant.shopName = DT Commerce Marketplace
external.shopId = sellerId/shopId cua dt-commerce, chi dung de doi soat/idempotency
```

`sender.*` duoc gui dong theo dia chi lay hang cua seller trong tung don.

### 3. Co API tra cuu/mapping shopId -> merchantId khong?

Phien ban dau: Nexus khuyen nghi mapping offline truoc khi go-live neu doi tac dung mo hinh per-seller merchant.

File mapping mau:

```csv
partner_code,shop_id,shop_name,merchant_id,sender_hub_code
SHOPEE,550e8400-e29b-41d4-a716-446655440000,Cua hang A,41100001,HCM-001
```

API tra cuu mapping co the bo sung:

```http
GET /merchant/integrations/shops/{platform}/{shopId}/mapping
```

Response de xuat:

```json
{
  "success": true,
  "data": {
    "platform": "SHOPEE",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "merchantId": "41100001",
    "senderHubCode": "HCM-001",
    "active": true
  }
}
```

### 4. Seller moi chua duoc mapping thi onboard nhu the nao?

Quy trinh de xuat:

1. Doi tac gui danh sach seller/shop can ket noi.
2. Nexus tao/mapping merchant profile.
3. Nexus tra lai `merchantId`, `senderHubCode`, cau hinh dich vu, cau hinh COD.
4. Doi tac bat dau tao don cho shop do.

Voi DT_COMMERCE, seller moi khong can Nexus merchant rieng neu van dung `merchantId=41100000`; dt-commerce chi can gui `external.shopId` dung sellerId va `sender.*` dung ho so pickup seller.

Neu doi tac theo mo hinh per-seller merchant tao don cho shop chua mapping, Nexus tra loi:

```http
404 MERCHANT_NOT_FOUND
```

## 3. Thong Tin Nguoi Gui

### 1. sender.name/phone/address lay tu shop profile ben doi tac duoc khong?

Duoc. Doi tac co the lay tu shop profile/warehouse profile hien tai.

Neu shop co nhieu kho lay hang, moi request nen gui dung dia chi kho lay hang cua don.

### 2. sender.ward/district/province co bat buoc khong hay chi address la du?

Production nen gui day du:

```text
sender.address
sender.ward
sender.district
sender.province
```

Ly do: Nexus can tinh hub, tuyen, phi, SLA va dieu phoi lay hang.

Neu giai doan sandbox chua co day du, Nexus co the tam chap nhan `address` text, nhung production khuyen nghi bat buoc ward/district/province.

### 3. ward/district/province gui text hay ma hanh chinh Nexus?

Phien ban dau chap nhan text tieng Viet khong dau hoac co dau.

Khuyen nghi production:

- Gui `province`, `district`, `ward` dang text.
- Neu doi tac co ma hanh chinh rieng, gui them vao metadata:

```json
{
  "sender": {
    "province": "Ho Chi Minh",
    "district": "Quan 1",
    "ward": "Phuong Ben Nghe",
    "provinceCode": "79",
    "districtCode": "760",
    "wardCode": "26734"
  }
}
```

Nexus se mapping sang zone/hub noi bo.

### 4. hubCode co bat buoc khong?

Khong bat buoc neu Nexus route duoc theo dia chi sender hoac da co mapping shop -> hub.

Thu tu uu tien:

1. `sender.hubCode` trong request.
2. Auto route theo `sender.province` / `sender.ward`.
3. Mapping `external.shopId -> senderHubCode` neu doi tac dung mo hinh mapping shop.

Production DT_COMMERCE: neu Nexus bat buoc `hubCode`, hai ben can chot mapping provinceCode -> hubCode; neu khong, dt-commerce co the bo qua `sender.hubCode`.

## 4. Thong Tin Kien Hang

### 1. weightGram bat buoc > 0. Neu chua co can nang thi duoc default khong?

Duoc dung default trong sandbox va giai doan dau.

Default de xuat:

```text
weightGram = 500
```

Neu nganh hang nang/cong kenh, hai ben can thong nhat default theo category. Production khuyen nghi gui can nang that de tinh phi va SLA dung.

### 2. lengthCm/widthCm/heightCm co bat buoc khong?

Khong bat buoc o phase dau.

Default de xuat neu khong co kich thuoc:

```text
lengthCm = 20
widthCm = 15
heightCm = 10
```

Neu co hang cong kenh, bat buoc gui kich thuoc that.

### 3. declaredValue nen bang subtotal, totalAmount, hay gia tri truoc giam gia?

Khuyen nghi:

```text
declaredValue = tong gia tri hang sau giam gia, khong bao gom shippingFee
```

Tuc la:

```text
declaredValue = merchandiseSubtotalAfterDiscount
```

Khong nen cong phi van chuyen vao `declaredValue`.

### 4. Gioi han so item, khoi luong, kich thuoc, COD?

Gioi han de xuat cho phase dau:

| Field | Limit de xuat |
| --- | --- |
| So item/order | Toi da 100 items |
| `weightGram` | 1 - 30000 gram |
| Chieu dai/cao/rong | Moi chieu toi da 150 cm |
| Tong kich thuoc | `length + width + height <= 300 cm` |
| `codAmount` | 0 - 50000000 VND |
| `declaredValue` | 0 - 100000000 VND |

Neu doi tac can nguong cao hon, can thong nhat theo hop dong dich vu.

## 5. Dich Vu Va Thanh Toan

### 1. serviceType mac dinh nen dung gi?

Mac dinh dung:

```text
STANDARD
```

Gia tri ho tro de xuat:

```text
STANDARD
EXPRESS
SAME_DAY
```

Neu doi tac chua co mapping service, gui `STANDARD`.

### 2. pickupType co nhung gia tri nao?

Gia tri ho tro:

```text
PICKUP
DROP_OFF
```

Y nghia:

- `PICKUP`: Nexus den lay hang tai dia chi sender.
- `DROP_OFF`: seller tu mang hang ra buu cuc/hub.

### 3. expectedPickupAt co bat buoc khong?

Khong bat buoc.

Neu khong gui, Nexus tu dua vao cut-off time va lich lay hang de tao pickup slot.

Neu doi tac co lich hen lay hang tu seller, nen gui `expectedPickupAt`.

### 4. payment.payer nen la RECEIVER hay SENDER?

Mac dinh:

```text
RECEIVER
```

Dung `RECEIVER` khi nguoi nhan tra phi van chuyen/COD theo thoa thuan.

Dung `SENDER` khi shop/san thanh toan phi van chuyen cho Nexus.

### 5. Don online da thanh toan thi codAmount = 0 dung khong?

Dung.

Neu khach da thanh toan online toan bo gia tri don hang:

```json
{
  "payment": {
    "codAmount": 0
  }
}
```

### 6. Don COD thi codAmount bang totalAmount hay totalAmount - shippingFee?

Quy tac phu thuoc nguoi thu phi shipping:

- Neu nguoi nhan tra ca tien hang va phi ship: `codAmount = totalAmount`.
- Neu shop/san da thanh toan phi ship cho Nexus: `codAmount = totalAmount - shippingFee`.

Khuyen nghi doi tac gui ro:

```json
{
  "payment": {
    "codAmount": 330000,
    "shippingFee": 30000,
    "payer": "RECEIVER",
    "codIncludesShippingFee": true
  }
}
```

## 6. Response Va Status

### 1. shipmentCode nen duoc dung lam AWB hay trackingNumber?

Co. `shipmentCode` cua Nexus la ma van don chinh, co the dung lam:

```text
AWB
trackingNumber
waybillCode
```

Doi tac nen luu `shipmentCode` lam tracking number chinh.

### 2. status CREATED map sang AWB_CREATED dung khong?

Dung.

Mapping de xuat:

```text
Nexus CREATED -> Partner AWB_CREATED
```

### 3. Danh sach status Nexus va mapping sang he thong doi tac

| Nexus status | Y nghia | Partner status de xuat |
| --- | --- | --- |
| `CREATED` | Da tao van don | `AWB_CREATED` |
| `UPDATED` | Van don duoc cap nhat/da co yeu cau pickup | `PENDING` |
| `TASK_ASSIGNED` | Da phan cong lay/giao | `PENDING` |
| `PICKUP_COMPLETED` | Da lay hang thanh cong | `PICKED_UP` |
| `MANIFEST_SEALED` | Da dong bang ke/chuyen tuyen | `IN_TRANSIT` |
| `SEND_GOODS` | Dang gui hang di | `IN_TRANSIT` |
| `IN_TRANSIT` | Dang van chuyen | `IN_TRANSIT` |
| `MANIFEST_RECEIVED` | Da nhan bang ke tai hub dich | `IN_TRANSIT` |
| `MANIFEST_UNSEALED` | Da mo bang ke tai hub dich | `IN_TRANSIT` |
| `SCAN_INBOUND` | Da nhap kho/hub | `IN_TRANSIT` |
| `SCAN_OUTBOUND` | Da xuat kho/hub | `IN_TRANSIT` |
| `INVENTORY_CHECK` | Dang kiem kho/xu ly ton | `IN_TRANSIT` |
| `DELIVERED` | Giao thanh cong | `DELIVERED` |
| `DELIVERY_FAILED` | Giao that bai | `FAILED` |
| `NDR_CREATED` | Da tao xu ly giao that bai | `FAILED` |
| `EXCEPTION` | Su co bat thuong | `FAILED` |
| `RETURN_STARTED` | Bat dau hoan hang | `RETURNED` |
| `RETURN_COMPLETED` | Hoan hang thanh cong | `RETURNED` |
| `CANCELLED` | Da huy | `CANCELLED` |

Neu doi tac co status `OUT_FOR_DELIVERY`, Nexus co the map tu event `delivery.attempted` hoac task giao hang dang duoc phan cong. Phase dau co the tam map `TASK_ASSIGNED` thanh `PENDING`; phase sau bo sung status rieng `OUT_FOR_DELIVERY`.

### 4. trackingUrl va label.url co han dung khong?

`trackingUrl` khong co han dung, dung de khach tra cuu hanh trinh.

`label.url` nen duoc xem la URL co the thay doi theo chinh sach bao mat. Khuyen nghi:

- Sandbox: co the dung URL truc tiep khong het han.
- Production: nen dung signed URL hoac endpoint co auth, TTL de xuat 24 gio.

Neu doi tac can in lai label sau TTL, goi API lay label moi.

## 7. Webhook

### 1. Nexus co webhook gui cap nhat trang thai ve san khong?

Co, Nexus de xuat cung cap webhook cap nhat trang thai van don cho doi tac.

Doi tac cung cap endpoint:

```text
POST https://partner.example.com/webhooks/nexus/shipment-status
```

### 2. Webhook payload mau

```json
{
  "eventId": "evt_01HYZP7A4N7YB9S3K5F9ZK8W2Q",
  "eventType": "shipment.status_changed",
  "occurredAt": "2026-05-26T15:10:00+07:00",
  "partnerCode": "SHOPEE",
  "data": {
    "platform": "SHOPEE",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "previousStatus": "TASK_ASSIGNED",
    "currentStatus": "PICKUP_COMPLETED",
    "partnerStatus": "PICKED_UP",
    "statusDescription": "Da lay hang thanh cong",
    "location": {
      "hubCode": "HCM-001",
      "hubName": "Ho Chi Minh Hub"
    },
    "reason": null,
    "trackingUrl": "https://tracking.nexus-ex.site/SHP260526A1B2C3"
  }
}
```

Webhook giao thanh cong:

```json
{
  "eventId": "evt_01HYZP8K2P6F0R9E4S2Q1N7M3A",
  "eventType": "shipment.delivered",
  "occurredAt": "2026-05-27T09:20:00+07:00",
  "partnerCode": "SHOPEE",
  "data": {
    "platform": "SHOPEE",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "currentStatus": "DELIVERED",
    "partnerStatus": "DELIVERED",
    "deliveredAt": "2026-05-27T09:20:00+07:00",
    "receiverName": "Nguyen Van A",
    "podUrl": "https://minio.nexus-ex.site/nexus-pod-images/pod/SHP260526A1B2C3.jpg"
  }
}
```

### 3. Webhook ky signature nhu request tao don hay co che khac?

Dung cung co che HMAC SHA256 hex lowercase.

Headers webhook:

```http
X-Nexus-Partner-Code: SHOPEE
X-Nexus-Timestamp: 2026-05-26T15:10:00+07:00
X-Nexus-Nonce: 551f2a8b-17f2-4eb1-93a1-aea3f37fd8a0
X-Nexus-Event-Id: evt_01HYZP7A4N7YB9S3K5F9ZK8W2Q
X-Nexus-Signature: <hmac_sha256_signature>
Content-Type: application/json
```

String to sign:

```text
METHOD + "\n" +
PATH + "\n" +
X-Nexus-Timestamp + "\n" +
X-Nexus-Nonce + "\n" +
SHA256_HEX_LOWERCASE(raw_request_body)
```

### 4. Retry webhook nhu the nao?

Nexus retry khi doi tac tra:

- HTTP 5xx
- Timeout
- Network error

Nexus khong retry khi doi tac tra HTTP 2xx.

Retry schedule de xuat:

```text
1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h
```

Sau khi qua so lan retry toi da, webhook vao DLQ/dead-letter de van hanh xu ly lai.

### 5. Co providerEventId/idempotency key trong webhook khong?

Co.

Webhook co:

```text
eventId
X-Nexus-Event-Id
```

Doi tac dung `eventId` lam idempotency key de xu ly webhook dung 1 lan.

## 8. Huy Don, Tracking, In Label

### 1. Khi order bi huy ben doi tac, can goi Cancel Order o trang thai nao?

Doi tac nen goi cancel ngay khi order bi huy ben doi tac.

Nexus cho phep huy khi don chua vao cac trang thai ket thuc:

- Chua giao thanh cong.
- Chua hoan thanh hoan hang.
- Chua bi huy truoc do.

Thuc te production nen gioi han huy truoc khi hang da duoc lay. Neu don da `PICKUP_COMPLETED`, Nexus co the tu choi huy va yeu cau xu ly hoan/return.

Endpoint:

```http
POST /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}/cancel
```

### 2. Neu tao van don timeout nhung Nexus da tao thanh cong thi retry cung Idempotency-Key co tra shipmentCode cu khong?

Co. Doi tac phai retry voi cung:

```text
Idempotency-Key
external.platform
external.shopId
external.externalOrderId
```

Nexus se tra lai `shipmentCode` da tao truoc do neu payload tuong thich.

### 3. Rate limit production co dung nhu tai lieu khong?

Mac dinh de xuat:

```text
100 requests/minute/shop
1000 requests/minute/partner
```

Gia tri production cuoi cung se chot theo hop dong va traffic thuc te.

### 4. Co endpoint lay tracking rieng khong?

Co.

Theo external order:

```http
GET /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}
```

Theo shipment code:

```http
GET /merchant/integrations/shipments/{shipmentCode}/tracking
```

Response mau:

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "externalOrderId": "240526ABC",
    "currentStatus": "PICKUP_COMPLETED",
    "partnerStatus": "PICKED_UP",
    "trackingUrl": "https://tracking.nexus-ex.site/SHP260526A1B2C3",
    "timeline": [
      {
        "status": "CREATED",
        "description": "Da tao van don",
        "occurredAt": "2026-05-26T10:30:05+07:00"
      },
      {
        "status": "PICKUP_COMPLETED",
        "description": "Da lay hang thanh cong",
        "occurredAt": "2026-05-26T15:10:00+07:00"
      }
    ]
  }
}
```

### 5. Co endpoint lay/in label rieng khong?

Co, endpoint de xuat:

```http
GET /merchant/integrations/shipments/{shipmentCode}/label?format=A6
```

Response JSON:

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "format": "A6",
    "labelUrl": "https://ops.nexus-ex.site/merchant/integrations/shipments/SHP260526A1B2C3/label.pdf",
    "expiresAt": "2026-05-27T10:30:00+07:00"
  }
}
```

Neu doi tac muon lay binary truc tiep:

```http
GET /merchant/integrations/shipments/{shipmentCode}/label.pdf?format=A6
Accept: application/pdf
```

## 9. Idempotency, Retry, Rate Limit

### Idempotency

Bat buoc gui:

```http
Idempotency-Key: <platform>:<shopId>:<externalOrderId>
```

Thoi gian luu idempotency key de xuat:

```text
30 ngay
```

Neu cung key nhung payload khac noi dung quan trong, Nexus tra:

```http
409 DUPLICATE_ORDER
```

### Retry request tao don

Doi tac nen retry khi:

- Timeout.
- HTTP 408.
- HTTP 429, theo `Retry-After`.
- HTTP 500/502/503/504.

Khong retry tu dong khi:

- HTTP 400 validation.
- HTTP 401/403 auth/signature.
- HTTP 404 merchant mapping.
- HTTP 409 payload conflict.

Backoff de xuat:

```text
1s, 3s, 10s, 30s, 2m
```

Moi retry phai giu nguyen:

```text
Idempotency-Key
external.platform
external.shopId
external.externalOrderId
```

### Rate limit

Mac dinh:

```text
100 requests/minute/shop
1000 requests/minute/partner
```

Khi bi limit:

```http
429 Too Many Requests
Retry-After: 30
```

## 10. Cac Field Quan Trong Can Chot Ngay

Doi tac can uu tien chot 4 nhom field sau vi anh huong truc tiep den tao don:

| Nhom | Cau tra loi Nexus |
| --- | --- |
| `external.shopId` | Co the dung sellerId UUID neu on dinh va duy nhat. |
| `merchant.merchantId` | Nexus cap/mapping cho tung seller/shop. |
| `sender address` | Lay tu shop/warehouse profile; production nen co ward/district/province. |
| `weightGram/dimensions` | Cho phep default phase dau: 500g, 20x15x10cm; production nen gui gia tri that. |
